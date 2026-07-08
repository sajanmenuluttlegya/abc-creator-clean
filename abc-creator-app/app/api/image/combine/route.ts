import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import {
  getImageDimensions,
  getTextToImageCredits,
  IMAGE_ASPECT_RATIOS,
  IMAGE_RESOLUTIONS,
  IMAGE_STYLE_OPTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMBINE_MODEL: ImageModelKey = "M1";

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

type CompositeLayer = {
  input: Buffer;
  left: number;
  top: number;
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

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function parseModel(value: unknown): ImageModelKey | null {
  const requested = typeof value === "string" && value.trim() ? value.trim() : COMBINE_MODEL;
  return requested === COMBINE_MODEL ? COMBINE_MODEL : null;
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharactersPerLine: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxCharactersPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.*$/, "")}…`;
  }

  return lines;
}

async function uploadToBuffer(upload: File) {
  return Buffer.from(await upload.arrayBuffer());
}

function gridLayout(count: number) {
  if (count <= 2) return { columns: count, rows: 1 };
  if (count <= 4) return { columns: 2, rows: Math.ceil(count / 2) };
  return { columns: 3, rows: 2 };
}

async function createCombinedImage(input: {
  files: File[];
  prompt: string;
  style: string;
  model: ImageModelKey;
  resolution: ImageResolution;
  aspectRatio: ImageAspectRatio;
}) {
  const { width, height } = getImageDimensions(input.resolution, input.aspectRatio);
  const footerHeight = Math.max(72, Math.min(150, Math.round(height * 0.18)));
  const canvasHeight = Math.max(64, height - footerHeight);
  const gap = Math.max(8, Math.round(Math.min(width, height) * 0.018));
  const padding = gap;
  const { columns, rows } = gridLayout(input.files.length);
  const cellWidth = Math.floor((width - padding * 2 - gap * (columns - 1)) / columns);
  const cellHeight = Math.floor((canvasHeight - padding * 2 - gap * (rows - 1)) / rows);

  const composites: CompositeLayer[] = [];

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];
    const sourceBuffer = await uploadToBuffer(file);
    const imageBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize(cellWidth, cellHeight, { fit: "cover", position: "attention" })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    const column = index % columns;
    const row = Math.floor(index / columns);

    composites.push({
      input: imageBuffer,
      left: padding + column * (cellWidth + gap),
      top: padding + row * (cellHeight + gap),
    });
  }

  const promptLines = wrapText(input.prompt, Math.max(30, Math.floor(width / 15)), 2);
  const subtitle = [input.style, input.model, input.resolution, input.aspectRatio].filter(Boolean).join(" · ");
  const lineHeight = Math.max(18, Math.round(footerHeight * 0.22));
  const promptFontSize = Math.max(14, Math.round(footerHeight * 0.2));
  const subtitleFontSize = Math.max(11, Math.round(footerHeight * 0.13));
  const firstPromptY = Math.round(footerHeight * 0.34);
  const subtitleY = Math.round(footerHeight * 0.78);

  const footerSvg = `
    <svg width="${width}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#080714"/>
      <rect x="${padding}" y="1" width="${Math.max(1, width - padding * 2)}" height="1" fill="rgba(34,211,238,0.28)"/>
      ${promptLines.map((line, index) => `<text x="${padding}" y="${firstPromptY + index * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${promptFontSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`).join("")}
      <text x="${padding}" y="${subtitleY}" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleFontSize}" font-weight="700" fill="#a5f3fc">${escapeXml(subtitle)}</text>
    </svg>
  `;

  composites.push({ input: Buffer.from(footerSvg), left: 0, top: height - footerHeight });

  const output = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 8, g: 7, b: 20, alpha: 1 },
    },
  })
    .composite(composites)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  return {
    dataUrl: `data:image/png;base64,${output.toString("base64")}`,
    width,
    height,
  };
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

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return Response.json({ ok: false, error: "Upload 2 to 6 images." }, { status: 400 });
    }

    const formData = await req.formData();
    const files = formData.getAll("images").filter((item): item is File => item instanceof File);
    const prompt = cleanText(formData.get("prompt"), 4000);
    const model = parseModel(formData.get("model"));
    const resolution = parseResolution(formData.get("resolution"));
    const aspectRatio = parseAspectRatio(formData.get("aspectRatio"));
    const style = parseStyle(formData.get("style"));

    if (!model) {
      return Response.json({ ok: false, error: "Image Combine supports M1 only.", code: "COMBINE_MODEL_MUST_BE_M1" }, { status: 400 });
    }

    if (files.length < 2 || files.length > 6) {
      return Response.json({ ok: false, error: "Upload 2 to 6 images." }, { status: 400 });
    }

    if (prompt.length < 6) {
      return Response.json({ ok: false, error: "Prompt must be at least 6 characters.", code: "PROMPT_REQUIRED" }, { status: 400 });
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return Response.json({ ok: false, error: "Only PNG, JPG, JPEG, or WEBP images are allowed." }, { status: 400 });
      }

      if (file.size > 12 * 1024 * 1024) {
        return Response.json({ ok: false, error: "Each image must be under 12 MB." }, { status: 400 });
      }
    }

    const requiredCredits = getTextToImageCredits(model, resolution, 1);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "image-combine",
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:image-combine:${model}:${resolution}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        { ok: false, error: "Could not reserve image combine credits.", details: rpcErrorMessage(reserveResponse.error) },
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

    const image = await createCombinedImage({ files, prompt, style, model, resolution, aspectRatio });

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:combine:m1-sharp-composite",
      p_model: `${model}-${resolution}-${aspectRatio}`,
    });

    if (spendResponse.error) {
      await refundIfReserved("image_combine_spend_failed");
      return Response.json(
        { ok: false, error: "Could not finalize image combine credit spend.", details: rpcErrorMessage(spendResponse.error) },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("image_combine_spend_rejected");
      return Response.json(
        { ok: false, error: "Could not finalize image combine credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      toolSlug: "image-combine",
      model,
      resolution,
      aspectRatio,
      style,
      imageCount: 1,
      sourceImageCount: files.length,
      creditsCharged: requiredCredits,
      image: {
        dataUrl: image.dataUrl,
        filename: `combined-${model}-${resolution}.png`,
        width: image.width,
        height: image.height,
      },
    });
  } catch (error) {
    await refundIfReserved("image_combine_failed");

    return Response.json(
      { ok: false, error: "Image combine failed.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
