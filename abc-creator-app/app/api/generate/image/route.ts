import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  calculateImageGenerationCredits,
  IMAGE_CREDITS_PER_IMAGE,
  supportsImageGeneration,
} from "@/lib/tools/credit-costs";
import { routeToImage } from "@/lib/ai/routeToImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateImageBody = {
  toolSlug?: string;
  prompt?: string;
  sourceText?: string;
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
    const value = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

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

function hasEnoughPromptMaterial(body: GenerateImageBody) {
  const prompt = (body.prompt || "").trim();
  const sourceText = (body.sourceText || "").trim();
  return prompt.length >= 6 || sourceText.length >= 30;
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
      return Response.json(
        { ok: false, error: "Login required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as GenerateImageBody;
    const toolSlug = body.toolSlug?.trim() || "";

    if (!supportsImageGeneration(toolSlug)) {
      return Response.json(
        {
          ok: false,
          error: "Image generation is not enabled for this tool.",
          code: "IMAGE_TOOL_NOT_ALLOWED",
        },
        { status: 400 }
      );
    }

    if (!hasEnoughPromptMaterial(body)) {
      return Response.json(
        {
          ok: false,
          error: "Add an image prompt or generate text output first.",
          code: "IMAGE_PROMPT_REQUIRED",
        },
        { status: 400 }
      );
    }

    const imageCount = sanitizeImageCount(body.imageCount);
    const requiredCredits = calculateImageGenerationCredits(imageCount);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: toolSlug,
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:${toolSlug}:image:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        {
          ok: false,
          error: "Could not reserve image credits.",
          details: rpcErrorMessage(reserveResponse.error),
        },
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
          imageCreditsPerImage: IMAGE_CREDITS_PER_IMAGE,
        },
        { status: 402 }
      );
    }

    reservedTransactionId = reservation.transactionId || null;

    if (!reservedTransactionId) {
      return Response.json(
        {
          ok: false,
          error: "Credit reservation failed.",
          code: "CREDIT_RESERVATION_MISSING_ID",
        },
        { status: 500 }
      );
    }

    const result = await routeToImage({
      toolSlug,
      prompt: body.prompt || "",
      sourceText: body.sourceText || "",
      aspectRatio: body.aspectRatio || "16:9 landscape",
      count: imageCount,
      inputs: body.inputs || {},
    });

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: `image:${result.provider}`,
      p_model: result.model,
    });

    if (spendResponse.error) {
      await refundIfReserved("image_spend_mark_failed");

      return Response.json(
        {
          ok: false,
          error: "Could not finalize image credit spend.",
          details: rpcErrorMessage(spendResponse.error),
        },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("image_spend_mark_failed");

      return Response.json(
        {
          ok: false,
          error: "Could not finalize image credit spend.",
          code: spendData.code || "SPEND_FAILED",
          status: spendData.status,
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      imageCount,
      creditsCharged: requiredCredits,
      imageCreditsPerImage: IMAGE_CREDITS_PER_IMAGE,
      images: result.images.map((image) => ({
        index: image.index,
        dataUrl: image.dataUrl,
        mimeType: image.mimeType,
        provider: image.provider,
        model: image.model,
        filename: `${toolSlug}-image-${image.index}.png`,
      })),
    });
  } catch (error) {
    await refundIfReserved("image_generation_failed");

    return Response.json(
      {
        ok: false,
        error: "Image generation failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
