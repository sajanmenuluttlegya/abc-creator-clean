import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  generateCloudflareImageWithManualFailover,
  getEffectiveEditModel,
} from "@/lib/image-tools/cloudflare-image-client";
import { buildPremiumEditPrompt } from "@/lib/image-tools/edit-planner";
import {
  getTextToImageCredits,
  IMAGE_ASPECT_RATIOS,
  IMAGE_MODEL_KEYS,
  IMAGE_RESOLUTIONS,
  IMAGE_STYLE_OPTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type TextToImageBody = {
  prompt?: string;
  editPrompt?: string;
  negativePrompt?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
  imageCount?: number;
  style?: string;
  seed?: string;
  operation?: "generate" | "edit";
  maintainConsistency?: boolean;
  sourceImageDataUrl?: string;
  referenceImageDataUrl?: string;
  parentImageIndex?: number;
};

type CreditReservation = {
  ok?: boolean;
  code?: string;
  requiredCredits?: number;
  currentCredits?: number;
  transactionId?: string;
};

type CreditSpendResult = {
  ok?: boolean;
  code?: string;
  status?: string;
};

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [value.message, value.details, value.hint, value.code]
      .filter((item) => typeof item === "string" && item.trim())
      .join(" ");

    if (parts) return parts;
  }

  return String(error);
}

function userSafeProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("flag" + "ged") || lower.includes("choose another prompt") || lower.includes("output has been") || lower.includes("provider rejected")) {
    return "The image provider rejected this prompt or reference image combination. Try a different prompt, a different reference image, or remove sensitive wording.";
  }

  if (lower.includes("failed to fetch")) {
    return "The image request timed out or the provider connection dropped. Try again with M2 or a lower resolution, then retry M1 after deployment finishes.";
  }

  return raw;
}

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function cleanDataUrl(value: unknown) {
  const text = cleanText(value, 18_000_000);
  return /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(text) ? text : "";
}

function safeImageCount(value: unknown) {
  const count = Math.floor(Number(value) || 1);
  return Math.min(Math.max(count, 1), 4);
}

function parseModel(value: unknown): ImageModelKey {
  return IMAGE_MODEL_KEYS.includes(value as ImageModelKey) ? value as ImageModelKey : "M5";
}

function parseResolution(value: unknown): ImageResolution {
  return IMAGE_RESOLUTIONS.includes(value as ImageResolution) ? value as ImageResolution : "720p";
}

function parseAspectRatio(value: unknown): ImageAspectRatio {
  return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio) ? value as ImageAspectRatio : "1:1";
}

function parseStyle(value: unknown) {
  const style = cleanText(value, 80);
  return (IMAGE_STYLE_OPTIONS as readonly string[]).includes(style) ? style : "";
}

function mergeNegativePrompts(...values: string[]) {
  return Array.from(
    new Set(
      values
        .join(", ")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).join(", ");
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;

    try {
      await supabase.rpc("refund_reserved_credits", {
        p_transaction_id: reservedTransactionId,
        p_reason: reason,
      });
    } catch {
      // Do not expose refund internals.
    }
  }

  try {
    supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = (await req.json()) as TextToImageBody;

    const rawPrompt = cleanText(body.prompt, 4000);
    const rawEditPrompt = cleanText(body.editPrompt, 1200);
    const negativePromptBase = cleanText(body.negativePrompt, 1200);
    const style = parseStyle(body.style);
    const seed = cleanText(body.seed, 80);
    const requestedModel = parseModel(body.model);
    const resolution = parseResolution(body.resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio);
    const operation = body.operation === "edit" ? "edit" : "generate";
    const sourceImageDataUrl = cleanDataUrl(body.sourceImageDataUrl || body.referenceImageDataUrl);
    const hasReference = operation === "edit" && Boolean(sourceImageDataUrl);
    const imageCount = operation === "edit" ? 1 : safeImageCount(body.imageCount);
    const effectiveModel = operation === "edit" ? getEffectiveEditModel(requestedModel) : requestedModel;

    let prompt = rawPrompt;
    let negativePrompt = negativePromptBase;
    let editPlan = null as ReturnType<typeof buildPremiumEditPrompt>["plan"] | null;

    if (operation === "edit") {
      const premiumEdit = buildPremiumEditPrompt({
        originalPrompt: rawPrompt,
        userEditPrompt: rawEditPrompt || rawPrompt,
        hasReferenceImage: hasReference,
      });

      prompt = premiumEdit.prompt;
      negativePrompt = mergeNegativePrompts(negativePromptBase, premiumEdit.negativePrompt);
      editPlan = premiumEdit.plan;
    }

    if (prompt.length < 6) {
      return Response.json({ ok: false, error: "Prompt must be at least 6 characters.", code: "PROMPT_REQUIRED" }, { status: 400 });
    }

    if (operation === "edit" && !hasReference) {
      return Response.json({ ok: false, error: "Select a source image before editing.", code: "REFERENCE_IMAGE_REQUIRED" }, { status: 400 });
    }

    const requiredCredits = getTextToImageCredits(effectiveModel, resolution, imageCount);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "text-to-image-generator",
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:text-to-image-generator:${operation}:${requestedModel}->${effectiveModel}:${resolution}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        { ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) },
        { status: 500 }
      );
    }

    const reservation = reserveResponse.data as CreditReservation;

    if (!reservation?.ok) {
      return Response.json(
        {
          ok: false,
          error: "Not enough credits.",
          code: reservation?.code || "INSUFFICIENT_CREDITS",
          requiredCredits: reservation?.requiredCredits ?? requiredCredits,
          currentCredits: reservation?.currentCredits ?? 0,
        },
        { status: 402 }
      );
    }

    reservedTransactionId = reservation.transactionId || null;

    if (!reservedTransactionId) {
      return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });
    }

    const images = [];

    for (let index = 0; index < imageCount; index += 1) {
      const result = await generateCloudflareImageWithManualFailover({
        prompt,
        negativePrompt,
        model: effectiveModel,
        resolution,
        aspectRatio,
        style,
        seed: seed ? `${seed}-${index}` : "",
        operation,
        sourceImageDataUrl: hasReference ? sourceImageDataUrl : undefined,
        referenceImageDataUrl: hasReference ? sourceImageDataUrl : undefined,
      });

      images.push({
        index: index + 1,
        dataUrl: result.dataUrl,
        filename: operation === "edit" ? `image-edit-${effectiveModel}-${resolution}-${index + 1}.png` : `text-to-image-${effectiveModel}-${resolution}-${index + 1}.png`,
        provider: "cloudflare-workers-ai",
        model: result.modelId,
        modelLabel: effectiveModel,
        requestedModel,
        modelUsed: effectiveModel,
        credentialSlot: result.credentialSlot,
        width: result.width,
        height: result.height,
      });
    }

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: operation === "edit" ? "image:premium-edit:cloudflare-workers-ai" : "image:text-to-image:cloudflare-workers-ai",
      p_model: operation === "edit" ? `${requestedModel}->${effectiveModel}` : effectiveModel,
    });

    if (spendResponse.error) {
      await refundIfReserved("text_to_image_spend_failed");
      return Response.json(
        { ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("text_to_image_spend_rejected");
      return Response.json(
        { ok: false, error: "Could not finalize image credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      toolSlug: "text-to-image-generator",
      model: requestedModel,
      modelRequested: requestedModel,
      modelUsed: effectiveModel,
      effectiveModel,
      editMode: operation === "edit" ? "premium-consistency-lock" : undefined,
      editPlan,
      resolution,
      aspectRatio,
      style,
      imageCount,
      creditsCharged: requiredCredits,
      images,
    });
  } catch (error) {
    await refundIfReserved("text_to_image_generation_failed");

    return Response.json(
      { ok: false, error: "Text-to-image generation failed.", details: userSafeProviderError(error) },
      { status: 500 }
    );
  }
}
