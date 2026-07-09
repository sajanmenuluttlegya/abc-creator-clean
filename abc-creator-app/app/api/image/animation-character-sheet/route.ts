import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateCloudflareImageWithManualFailover } from "@/lib/image-tools/cloudflare-image-client";
import {
  getTextToImageCredits,
  IMAGE_MODEL_KEYS,
  IMAGE_RESOLUTIONS,
  type ImageModelKey,
  type ImageResolution,
} from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type CharacterSheetBody = {
  toolSlug?: string;
  characterName?: string;
  characterType?: string;
  ageGroup?: string;
  genderPresentation?: string;
  role?: string;
  personality?: string;
  visualDescription?: string;
  outfit?: string;
  accessories?: string;
  colorPalette?: string;
  style?: string;
  poseMode?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
};

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function parseModel(value: unknown): ImageModelKey {
  return IMAGE_MODEL_KEYS.includes(value as ImageModelKey) ? value as ImageModelKey : "M5";
}

function parseResolution(value: unknown): ImageResolution {
  return IMAGE_RESOLUTIONS.includes(value as ImageResolution) ? value as ImageResolution : "720p";
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
  if (lower.includes("flag" + "ged") || lower.includes("provider rejected") || lower.includes("choose another prompt")) {
    return "The image provider rejected this character prompt after automatic safe retry. Try simplifying the description or changing the style.";
  }
  if (lower.includes("failed to fetch")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildCharacterSheetPrompt(body: CharacterSheetBody, is3d: boolean) {
  const characterName = cleanText(body.characterName, 120);
  const characterType = cleanText(body.characterType, 300);
  const ageGroup = cleanText(body.ageGroup, 120);
  const genderPresentation = cleanText(body.genderPresentation, 120);
  const role = cleanText(body.role, 300);
  const personality = cleanText(body.personality, 500);
  const visualDescription = cleanText(body.visualDescription, 2000);
  const outfit = cleanText(body.outfit, 1200);
  const accessories = cleanText(body.accessories, 800);
  const colorPalette = cleanText(body.colorPalette, 500);
  const style = cleanText(body.style, 120) || (is3d ? "stylized 3D animation" : "clean 2D animated character design");
  const poseMode = /t\s*-?pose/i.test(cleanText(body.poseMode, 120)) ? "T-pose turnaround" : "neutral standing turnaround";

  const discipline = is3d ? "stylized 3D animated character model sheet" : "clean 2D animated character model sheet";
  return [
    `${discipline}, fixed 3:4 portrait ratio, pure white background, no environment, no shadows beyond subtle contact shadows, no labels, no text, no watermark.`,
    "Create ONE single character turnaround sheet containing EXACTLY FOUR full-body views of the SAME character: front view, back view, left side view, right side view.",
    `Pose mode: ${poseMode}. Keep each view in the same pose style and same proportions.`,
    "Absolute consistency lock: identical face shape, head size, eye style, hairstyle/fur, body proportions, outfit, footwear, accessories, colors, silhouette, and signature details across all four views.",
    "Arrange the four views cleanly with even spacing, centered on the white canvas, full body visible from head to feet, no cropping.",
    `Style: ${style}.`,
    characterName ? `Character name: ${characterName}.` : "",
    characterType ? `Character type/species: ${characterType}.` : "",
    ageGroup ? `Age group: ${ageGroup}.` : "",
    genderPresentation ? `Gender presentation: ${genderPresentation}.` : "",
    role ? `Story role: ${role}.` : "",
    personality ? `Personality expressed subtly through posture and expression: ${personality}.` : "",
    `Visual description: ${visualDescription}.`,
    outfit ? `Outfit/costume: ${outfit}.` : "",
    accessories ? `Accessories: ${accessories}.` : "",
    colorPalette ? `Color palette: ${colorPalette}.` : "",
    is3d ? "High-quality 3D animation character design, appealing sculpted forms, clean materials, production-ready model sheet, same model in four orthographic views." : "Professional 2D animation character design, clean linework, readable shape language, flat/controlled colors, production-ready model sheet, same drawing design in four orthographic views.",
  ].filter(Boolean).join("\n");
}

const NEGATIVE_PROMPT = "different characters, different outfits, changed hairstyle, changed colors, different face, inconsistent proportions, duplicate heads, extra views, fewer than four views, more than four views, text, labels, captions, watermark, logo, background scene, props not attached to character, cropped feet, cropped head, blurry, low quality, messy layout";

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

    const body = (await req.json()) as CharacterSheetBody;
    const toolSlug = cleanText(body.toolSlug, 100);
    const is2d = toolSlug === "2d-animated-character-generator";
    const is3d = toolSlug === "3d-animated-character-generator";
    if (!is2d && !is3d) return Response.json({ ok: false, error: "Unknown animation character tool." }, { status: 400 });

    const visualDescription = cleanText(body.visualDescription, 2000);
    if (visualDescription.length < 10) return Response.json({ ok: false, error: "Visual description is required." }, { status: 400 });

    const requestedModel = parseModel(body.model);
    const resolution = parseResolution(body.resolution);
    const aspectRatio = "3:4" as const;
    const prompt = buildCharacterSheetPrompt(body, is3d);
    const requiredCredits = getTextToImageCredits(requestedModel, resolution, 4);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: toolSlug,
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:${toolSlug}:character-sheet:${requestedModel}:${resolution}:${randomUUID()}`,
    });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });
    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });

    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await generateCloudflareImageWithManualFailover({
      prompt,
      negativePrompt: NEGATIVE_PROMPT,
      model: requestedModel,
      resolution,
      aspectRatio,
      style: is3d ? "3D render" : "Cartoon",
      seed: "",
      operation: "generate",
    });

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:animation-character-sheet:cloudflare-workers-ai",
      p_model: `${requestedModel}->${result.modelKey || requestedModel}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("animation_character_sheet_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }
    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("animation_character_sheet_spend_rejected");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
    }

    return Response.json({
      ok: true,
      toolSlug,
      model: requestedModel,
      modelUsed: result.modelKey || requestedModel,
      resolution,
      aspectRatio,
      creditsCharged: requiredCredits,
      prompt,
      image: {
        dataUrl: result.dataUrl,
        filename: `${toolSlug}-${result.modelKey || requestedModel}-${resolution}-3x4-character-sheet.png`,
        width: result.width,
        height: result.height,
        prompt,
      },
    });
  } catch (error) {
    await refundIfReserved("animation_character_sheet_generation_failed");
    return Response.json({ ok: false, error: "Animation character sheet generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
