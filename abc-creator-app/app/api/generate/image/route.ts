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
import { generateCloudflareImageWithManualFailover, getEffectiveEditModel } from "@/lib/image-tools/cloudflare-image-client";
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

const BOOK_OUTPUT_IMAGE_TOOLS = new Set([
  "book-idea-generator",
  "book-title-generator",
  "book-bible-generator",
  "character-builder",
  "worldbuilding-builder",
  "book-outline-generator",
  "chapter-outline-generator",
  "scene-generator",
  "chapter-writer",
  "chapter-rewriter-humanizer",
  "continuity-checker",
  "book-blurb-generator",
  "full-book-generator",
  "book-cover-prompt-generator",
  "book-front-matter-generator",
  "book-style-guide-generator",
  "book-export-builder",
]);

const OUTPUT_IMAGE_TOOLS = new Set([
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
  ...BOOK_OUTPUT_IMAGE_TOOLS,
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
  imageModel?: ImageModelKey;
  resolution?: ImageResolution;
  style?: string;
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
  return OUTPUT_IMAGE_TOOLS.has(toolSlug) && supportsImageGeneration(toolSlug);
}

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
  const text = cleanText(value, 40).toLowerCase();
  const compact = text.includes("16:9") ? "16:9" : text.includes("9:16") ? "9:16" : text.includes("4:5") ? "4:5" : text.includes("3:4") ? "3:4" : text.includes("4:3") ? "4:3" : text.includes("3:2") ? "3:2" : text.includes("2:3") ? "2:3" : text.includes("1:1") ? "1:1" : "1:1";
  return IMAGE_ASPECT_RATIOS.includes(compact as ImageAspectRatio) ? compact as ImageAspectRatio : "1:1";
}

function parseStyle(value: unknown) {
  const style = cleanText(value, 80);
  return (IMAGE_STYLE_OPTIONS as readonly string[]).includes(style) ? style : "Cinematic";
}

function buildBookImagePrompt(body: GenerateImageBody, aspectRatio: ImageAspectRatio) {
  const inputs = body.inputs || {};
  const bookTitle = cleanText(inputs.book_title, 180) || "the book";
  const authorVoice = cleanText(inputs.author_voice, 140) || "professional author voice";
  const genre = cleanText(inputs.genre, 140) || "book genre from context";
  const visualStyle = cleanText(inputs.visual_style || body.style, 120) || "cinematic premium book illustration";
  const prompt = cleanText(body.prompt, 2400);
  const source = cleanText(body.sourceText, 1800);

  return [
    "Create one premium book illustration image for a professional manuscript output.",
    "",
    `Book: ${bookTitle}`,
    `Genre/niche: ${genre}`,
    `Author voice: ${authorVoice}`,
    `Aspect ratio: ${aspectRatio}`,
    `Visual style: ${visualStyle}`,
    "",
    "Image brief:",
    prompt || "Choose the most visually powerful scene from the supplied book/chapter context.",
    "",
    "Book/chapter context:",
    source || "not supplied",
    "",
    "Consistency rules:",
    "- Keep character appearance, age, clothing logic, world design, era, symbols, and mood consistent with the book bible or chapter context.",
    "- Select the strongest cinematic scene from the section when the prompt is broad.",
    "- Do not add readable text, typography, captions, watermarks, fake logos, or UI elements inside the image.",
    "- Output image only. Make it premium, publishable, atmospheric, and professional.",
  ].join("\n");
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
    const isBookTool = BOOK_OUTPUT_IMAGE_TOOLS.has(toolSlug);

    if (!supportsOutputImageForTool(toolSlug)) {
      return Response.json({ ok: false, error: "Output image insertion is enabled for supported blog and book tools only.", code: "IMAGE_TOOL_NOT_ALLOWED" }, { status: 400 });
    }

    if (!hasEnoughPromptMaterial(body)) {
      return Response.json({ ok: false, error: "Add an image prompt or generate text output first.", code: "IMAGE_PROMPT_REQUIRED" }, { status: 400 });
    }

    const imageCount = operation === "edit" ? 1 : sanitizeImageCount(body.imageCount);
    const requestedModel = parseModel(body.imageModel || body.inputs?.output_image_model);
    const effectiveModel = operation === "edit" ? getEffectiveEditModel(requestedModel) : requestedModel;
    const resolution = parseResolution(body.resolution || body.inputs?.output_image_resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio || body.inputs?.output_image_ratio);
    const requiredCredits = isBookTool
      ? getTextToImageCredits(effectiveModel, resolution, imageCount)
      : operation === "edit" ? calculateImageEditCredits() : calculateImageGenerationCredits(imageCount);

    if (requiredCredits > 0) {
      const reserveResponse = await supabase.rpc("reserve_credits", {
        p_tool_slug: toolSlug,
        p_amount: requiredCredits,
        p_idempotency_key: `${user.id}:${toolSlug}:image:${operation}:${effectiveModel}:${resolution}:${randomUUID()}`,
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

    const result = isBookTool
      ? await Promise.all(Array.from({ length: imageCount }, async (_, index) => {
          const generated = await generateCloudflareImageWithManualFailover({
            prompt: buildBookImagePrompt({ ...body, sourceText }, aspectRatio),
            negativePrompt: "text, typography, watermark, logo, low quality, inconsistent character design, distorted anatomy, extra fingers, blurry, messy composition",
            model: effectiveModel,
            resolution,
            aspectRatio,
            style: parseStyle(body.style || body.inputs?.visual_style),
            operation,
            sourceImageDataUrl: operation === "edit" ? body.sourceImageDataUrl || "" : undefined,
            referenceImageDataUrl: operation === "edit" ? body.sourceImageDataUrl || "" : undefined,
            seed: `${Date.now()}-${index}`,
          });
          return {
            index: index + 1,
            dataUrl: generated.dataUrl,
            mimeType: "image/png",
            provider: "cloudflare-workers-ai",
            model: generated.modelId,
          };
        })).then((images) => ({ provider: "cloudflare-workers-ai", model: images[0]?.model || effectiveModel, images }))
      : await routeToImage({
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
        p_model: isBookTool ? `${requestedModel}->${effectiveModel}:${resolution}:${aspectRatio}:${result.model}` : result.model,
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
      modelRequested: isBookTool ? requestedModel : undefined,
      modelUsed: isBookTool ? effectiveModel : undefined,
      resolution: isBookTool ? resolution : undefined,
      aspectRatio: isBookTool ? aspectRatio : undefined,
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
