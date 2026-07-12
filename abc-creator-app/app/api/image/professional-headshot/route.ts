import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateCloudflareImageWithManualFailover } from "@/lib/image-tools/cloudflare-image-client";
import { getTextToImageCredits, type ImageAspectRatio, type ImageModelKey, type ImageResolution } from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type HeadshotBody = {
  sourceImageDataUrl?: string;
  professionContext?: string;
  customInstructions?: string;
  style?: string;
  wardrobe?: string;
  background?: string;
  expression?: string;
  lighting?: string;
  retouch?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
};

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function cleanDataUrl(value: unknown) {
  const text = cleanText(value, 18_000_000);
  return /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(text) ? text : "";
}

function parseModel(value: unknown): ImageModelKey {
  return value === "M1" ? "M1" : "M2";
}

function parseResolution(value: unknown): ImageResolution {
  return value === "480p" || value === "1080p" ? value : "720p";
}

function parseAspectRatio(value: unknown): ImageAspectRatio {
  return value === "4:5" || value === "3:4" ? value : "1:1";
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [value.message, value.details, value.hint, value.code].filter((item) => typeof item === "string" && item.trim()).join(" ");
    if (parts) return parts;
  }
  return String(error);
}

function userSafeProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (lower.includes("flagged") || lower.includes("provider rejected") || lower.includes("choose another prompt") || lower.includes("reference image combination")) {
    return "The image provider rejected this portrait or edit combination after automatic safe retry. Try a clearer source portrait or simplify the custom instructions.";
  }
  if (lower.includes("failed to fetch") || lower.includes("timeout")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildHeadshotPrompt(body: HeadshotBody, aspectRatio: ImageAspectRatio) {
  const professionContext = cleanText(body.professionContext, 500);
  const customInstructions = cleanText(body.customInstructions, 1000);
  const style = cleanText(body.style, 120) || "Corporate executive";
  const wardrobe = cleanText(body.wardrobe, 160) || "Preserve current outfit";
  const background = cleanText(body.background, 160) || "Soft neutral gray";
  const expression = cleanText(body.expression, 160) || "Confident and approachable";
  const lighting = cleanText(body.lighting, 160) || "Soft studio key light";
  const retouch = cleanText(body.retouch, 160) || "Polished natural";

  return [
    `Create one premium photorealistic professional headshot in ${aspectRatio} aspect ratio using the uploaded portrait as the primary and mandatory identity reference.`,
    "STRICT IDENTITY LOCK: depict the exact same person. Preserve facial geometry, apparent age, ethnicity, skin tone, eye shape and color, nose, lips, jawline, ears, hairline, hairstyle, facial hair, glasses, distinctive marks, and natural asymmetry unless the user explicitly requests a permitted change. Do not beautify into a different person.",
    "Frame the subject as a polished head-and-shoulders or chest-up professional portrait with natural posture, accurate anatomy, realistic hair detail, believable fabric, and clean lens perspective.",
    `Professional direction: ${style}.`,
    professionContext ? `Role and professional context: ${professionContext}.` : "",
    `Wardrobe direction: ${wardrobe}. Preserve the subject's body proportions and keep clothing realistic and professionally appropriate.`,
    `Background: ${background}. Keep it uncluttered, premium, and visually subordinate to the subject.`,
    `Expression: ${expression}. Keep the expression believable and consistent with the source person's identity.`,
    `Lighting: ${lighting}. Use balanced skin tones, natural catchlights, controlled highlights, and realistic shadow falloff.`,
    `Retouching: ${retouch}. Preserve pores and natural skin texture; remove only temporary distractions and camera artifacts.`,
    customInstructions ? `Additional user instructions: ${customInstructions}.` : "",
    "Output must look like a real professional studio photograph suitable for LinkedIn, a company profile, portfolio, speaking page, or résumé profile where culturally appropriate. No text, logos, watermarks, frames, badges, nameplates, or fake company branding.",
    "This is professional profile imagery, not a passport, visa, license, or other identity document.",
  ].filter(Boolean).join("\n");
}

const NEGATIVE_PROMPT = "different person, identity drift, face swap, changed ethnicity, changed skin tone, skin lightening, skin darkening, changed eye color, changed age, younger face, older face, changed hairline, changed hairstyle unless requested, removed glasses unless requested, altered facial hair unless requested, plastic skin, excessive beauty filter, uncanny face, asymmetrical eyes, warped ears, duplicate features, malformed anatomy, extra limbs, distorted shoulders, unrealistic clothing, low resolution, blur, painterly, illustration, anime, 3D render, over-sharpening, heavy makeup unless requested, glamour retouch, text, watermark, logo, badge, nameplate, official ID card";

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;
    try { await supabase.rpc("refund_reserved_credits", { p_transaction_id: reservedTransactionId, p_reason: reason }); } catch {}
  }

  try {
    supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    const body = (await req.json()) as HeadshotBody;
    const sourceImageDataUrl = cleanDataUrl(body.sourceImageDataUrl);
    if (!sourceImageDataUrl) return Response.json({ ok: false, error: "Upload a valid PNG, JPG, JPEG, or WEBP portrait." }, { status: 400 });

    const model = parseModel(body.model);
    const resolution = parseResolution(body.resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio);
    const prompt = buildHeadshotPrompt(body, aspectRatio);
    const requiredCredits = getTextToImageCredits(model, resolution, 1);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "professional-headshot-generator",
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:professional-headshot-generator:${model}:${resolution}:${aspectRatio}:${randomUUID()}`,
    });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve headshot credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });

    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });

    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await generateCloudflareImageWithManualFailover({
      prompt,
      negativePrompt: NEGATIVE_PROMPT,
      model,
      resolution,
      aspectRatio,
      style: "Portrait",
      operation: "edit",
      sourceImageDataUrl,
      referenceImageDataUrl: sourceImageDataUrl,
    });

    const modelUsed = result.modelKey || model;
    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:professional-headshot:cloudflare-workers-ai",
      p_model: `${model}->${modelUsed}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("professional_headshot_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize headshot credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("professional_headshot_spend_rejected");
      return Response.json({ ok: false, error: "Could not finalize headshot credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
    }

    return Response.json({
      ok: true,
      toolSlug: "professional-headshot-generator",
      modelRequested: model,
      modelUsed,
      resolution,
      aspectRatio,
      creditsCharged: requiredCredits,
      prompt,
      identityMode: "strict-preserve",
      image: {
        dataUrl: result.dataUrl,
        filename: `professional-headshot-${modelUsed}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        modelUsed,
      },
    });
  } catch (error) {
    await refundIfReserved("professional_headshot_generation_failed");
    return Response.json({ ok: false, error: "Professional headshot generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
