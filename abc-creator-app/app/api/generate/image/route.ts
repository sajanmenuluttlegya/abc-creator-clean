import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  calculateImageEditCredits,
  calculateImageGenerationCredits,
  IMAGE_CREDITS_PER_IMAGE,
  IMAGE_EDIT_CREDITS,
  supportsImageGeneration,
} from "@/lib/tools/credit-costs";
import { routeToImage } from "@/lib/ai/routeToImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOG_OUTPUT_IMAGE_TOOLS = new Set([
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
]);

type GenerateImageBody = {
  operation?: "generate" | "edit";
  toolSlug?: string;
  prompt?: string;
  sourceText?: string;
  sourceImageDataUrl?: string;
  imageBlockId?: string;
  aspectRatio?: string;
  imageCount?: number;
  inputs?: Record<string, string>;
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

function sanitizeImageCount(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 1;
  return Math.min(Math.max(Math.floor(numberValue), 1), 7);
}

function getOperation(body: GenerateImageBody) {
  return body.operation === "edit" ? "edit" : "generate";
}

function hasEnoughPromptMaterial(body: GenerateImageBody) {
  const prompt = (body.prompt || "").trim();
  const sourceText = (body.sourceText || "").trim();
  return prompt.length >= 6 || sourceText.length >= 30;
}

function supportsOutputImageForTool(toolSlug: string) {
  return BLOG_OUTPUT_IMAGE_TOOLS.has(toolSlug) && supportsImageGeneration(toolSlug);
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;
    try {
      await supabase.rpc("refund_reserved_credits", { p_transaction_id: reservedTransactionId, p_reason: reason });
    } catch {
      // Do not expose refund internals.
    }
  }

  try {
    supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    const body = (await req.json()) as GenerateImageBody;
    const toolSlug = body.toolSlug?.trim() || "";
    const operation = getOperation(body);

    if (!supportsOutputImageForTool(toolSlug)) {
      return Response.json({ ok: false, error: "Output image insertion is enabled for selected blog image tools only.", code: "IMAGE_TOOL_NOT_ALLOWED" }, { status: 400 });
    }

    if (!hasEnoughPromptMaterial(body)) {
      return Response.json({ ok: false, error: "Add an image prompt or generate text output first.", code: "IMAGE_PROMPT_REQUIRED" }, { status: 400 });
    }

    const imageCount = operation === "edit" ? 1 : sanitizeImageCount(body.imageCount);
    const requiredCredits = operation === "edit" ? calculateImageEditCredits() : calculateImageGenerationCredits(imageCount);

    if (requiredCredits > 0) {
      const reserveResponse = await supabase.rpc("reserve_credits", {
        p_tool_slug: toolSlug,
        p_amount: requiredCredits,
        p_idempotency_key: `${user.id}:${toolSlug}:image:${operation}:${randomUUID()}`,
      });

      if (reserveResponse.error) {
        return Response.json({ ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });
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
            imageCreditsPerImage: IMAGE_CREDITS_PER_IMAGE,
            imageEditCredits: IMAGE_EDIT_CREDITS,
          },
          { status: 402 }
        );
      }

      reservedTransactionId = reservation.transactionId || null;
      if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });
    }

    const sourceText = operation === "edit"
      ? `Image edit request. Use the provided previous image as visual reference when the provider supports image input.\n\nOriginal image brief/source:\n${body.sourceText || ""}\n\nEdit instruction:\n${body.prompt || ""}`
      : body.sourceText || "";

    const result = await routeToImage({
      toolSlug,
      prompt: body.prompt || "",
      sourceText,
      sourceImageDataUrl: operation === "edit" ? body.sourceImageDataUrl || "" : "",
      aspectRatio: body.aspectRatio || "16:9 landscape",
      count: imageCount,
      inputs: body.inputs || {},
    });

    if (requiredCredits > 0 && reservedTransactionId) {
      const spendResponse = await supabase.rpc("spend_reserved_credits", {
        p_transaction_id: reservedTransactionId,
        p_provider: `image:${operation}:${result.provider}`,
        p_model: result.model,
      });

      if (spendResponse.error) {
        await refundIfReserved("image_spend_mark_failed");
        return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
      }

      const spendData = spendResponse.data as CreditSpendResult | null;
      if (spendData?.ok === false) {
        await refundIfReserved("image_spend_mark_failed");
        return Response.json({ ok: false, error: "Could not finalize image credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
      }
    }

    return Response.json({
      ok: true,
      operation,
      provider: result.provider,
      model: result.model,
      imageCount,
      creditsCharged: requiredCredits,
      imageCreditsPerImage: IMAGE_CREDITS_PER_IMAGE,
      imageEditCredits: IMAGE_EDIT_CREDITS,
      images: result.images.map((image) => ({
        index: image.index,
        dataUrl: image.dataUrl,
        mimeType: image.mimeType,
        provider: image.provider,
        model: image.model,
        filename: `${toolSlug}-${operation}-image-${image.index}.png`,
      })),
    });
  } catch (error) {
    await refundIfReserved("image_generation_failed");
    return Response.json({ ok: false, error: "Image generation failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
