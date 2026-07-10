import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateCloudflareImageWithManualFailover } from "@/lib/image-tools/cloudflare-image-client";
import {
  getTextToImageCredits,
  IMAGE_ASPECT_RATIOS,
  IMAGE_MODEL_KEYS,
  IMAGE_RESOLUTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type MangaSceneBody = {
  sceneBrief?: string;
  characters?: string;
  actionBeat?: string;
  setting?: string;
  mood?: string;
  continuity?: string;
  negativePrompt?: string;
  mangaStyle?: string;
  renderMode?: string;
  layout?: string;
  speechSpace?: string;
  aspectRatio?: ImageAspectRatio;
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

function parseAspectRatio(value: unknown): ImageAspectRatio {
  return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio) ? value as ImageAspectRatio : "16:9";
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
    return "The image provider rejected this manga scene after automatic safe retry. Simplify the scene or remove conflicting visual details.";
  }
  if (lower.includes("failed to fetch")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function mergeNegativePrompts(...values: string[]) {
  return Array.from(new Set(values.join(", ").split(",").map((item) => item.trim()).filter(Boolean))).join(", ");
}

function buildMangaPrompt(body: MangaSceneBody, model: ImageModelKey, aspectRatio: ImageAspectRatio) {
  const sceneBrief = cleanText(body.sceneBrief, 3000);
  const characters = cleanText(body.characters, 2200);
  const actionBeat = cleanText(body.actionBeat, 1600);
  const setting = cleanText(body.setting, 1800);
  const mood = cleanText(body.mood, 800);
  const continuity = cleanText(body.continuity, 1800);
  const mangaStyle = cleanText(body.mangaStyle, 160) || "Shonen action manga";
  const renderMode = cleanText(body.renderMode, 160) || "Black ink + screentone";
  const layout = cleanText(body.layout, 160) || "Single cinematic panel";
  const speechSpace = cleanText(body.speechSpace, 160) || "No speech bubbles";
  const isM6 = model === "M6";

  const layoutInstruction = layout === "Two-panel split scene"
    ? "Create exactly two clearly separated manga panels with a clean gutter: first panel establishes the action, second panel delivers the reaction or payoff."
    : layout === "Three-panel dramatic sequence"
      ? "Create exactly three readable manga panels with clean gutters and a logical left-to-right visual sequence: setup, escalation, payoff."
      : layout === "Four-panel manga page"
        ? "Create exactly four balanced manga panels with clean gutters and a coherent page-reading sequence. No extra panels."
        : layout === "Full-page splash"
          ? "Create one full-page splash composition with a single dominant focal point and no panel borders."
          : "Create one single finished cinematic manga panel with no internal panel borders.";

  const speechInstruction = speechSpace === "Reserve blank speech space"
    ? "Reserve clean negative-space areas for later lettering, but do not draw speech bubbles and do not render readable text."
    : speechSpace === "Empty speech bubbles only"
      ? "Include only clean empty speech bubbles with no readable text, no symbols, and no gibberish lettering."
      : "Do not include speech bubbles, captions, lettering, or readable text.";

  return [
    `Premium finished manga artwork in ${aspectRatio} aspect ratio.`,
    `Manga style: ${mangaStyle}. Rendering treatment: ${renderMode}.`,
    layoutInstruction,
    speechInstruction,
    "Create a polished publication-ready scene with deliberate manga composition, clear focal hierarchy, readable silhouettes, controlled black shapes, professional line weight, intentional screentone or grayscale placement, and cinematic depth.",
    "Character continuity must be exact: preserve face structure, hairstyle, body proportions, age, clothing, accessories, injuries, props, and identity across every visible panel or repeated appearance.",
    "Use professional manga visual grammar: foreground framing, midground action, background context, purposeful speed lines or impact effects only when relevant, natural anatomy, believable hands, controlled perspective, and clean panel gutters.",
    `Scene brief: ${sceneBrief}.`,
    characters ? `Characters and identity details: ${characters}.` : "",
    actionBeat ? `Main action or emotional beat: ${actionBeat}.` : "",
    setting ? `Setting and environment: ${setting}.` : "",
    mood ? `Mood, atmosphere, and lighting: ${mood}.` : "",
    continuity ? `Strict continuity and must-preserve rules: ${continuity}.` : "",
    isM6 ? "M6-safe instruction: keep the composition simple, readable, and strongly separated; use one clear focal action, limited character overlap, clean silhouettes, no tiny faces, no complex lettering, no decorative clutter, and exact panel count." : "",
    "Final output must look like intentional manga artwork, not a storyboard, not a rough sketch, not a 3D render, and not western superhero comic art unless explicitly requested.",
  ].filter(Boolean).join("\n");
}

const BASE_NEGATIVE_PROMPT = "photorealistic, 3D render, western superhero comic unless requested, rough storyboard, unfinished sketch, low detail, blurry lines, muddy screentone, malformed hands, extra fingers, duplicate limbs, broken anatomy, inconsistent character face, changed outfit, changed hairstyle, unreadable text, gibberish text, watermark, logo, random captions, extra panels, missing panels, crooked gutters, cluttered composition, cropped focal subject";

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

    const body = (await req.json()) as MangaSceneBody;
    const sceneBrief = cleanText(body.sceneBrief, 3000);
    if (sceneBrief.length < 12) return Response.json({ ok: false, error: "Scene brief must be at least 12 characters." }, { status: 400 });

    const model = parseModel(body.model);
    const resolution = parseResolution(body.resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio);
    const prompt = buildMangaPrompt(body, model, aspectRatio);
    const negativePrompt = mergeNegativePrompts(BASE_NEGATIVE_PROMPT, cleanText(body.negativePrompt, 1200));
    const requiredCredits = getTextToImageCredits(model, resolution, 1);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "manga-scene-generator",
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:manga-scene-generator:${model}:${resolution}:${aspectRatio}:${randomUUID()}`,
    });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });

    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });

    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await generateCloudflareImageWithManualFailover({
      prompt,
      negativePrompt,
      model,
      resolution,
      aspectRatio,
      style: "Manga",
      seed: "",
      operation: "generate",
    });

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:manga-scene:cloudflare-workers-ai",
      p_model: `${model}->${result.modelKey || model}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("manga_scene_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("manga_scene_spend_rejected");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
    }

    return Response.json({
      ok: true,
      toolSlug: "manga-scene-generator",
      model,
      modelUsed: result.modelKey || model,
      resolution,
      aspectRatio,
      creditsCharged: requiredCredits,
      prompt,
      image: {
        dataUrl: result.dataUrl,
        filename: `manga-scene-${result.modelKey || model}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        prompt,
      },
    });
  } catch (error) {
    await refundIfReserved("manga_scene_generation_failed");
    return Response.json({ ok: false, error: "Manga scene generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
