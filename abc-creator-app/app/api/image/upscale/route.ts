import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { UPSCALE_CREDITS, UPSCALE_LONG_SIDE, type UpscaleTarget } from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpscaleBody = {
  imageDataUrl?: string;
  target?: UpscaleTarget;
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

function parseTarget(value: unknown): UpscaleTarget {
  return value === "1080p" || value === "2k" || value === "4k" ? value : "2k";
}

function dataUrlToBuffer(dataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i.exec(dataUrl.trim());

  if (!match) {
    throw new Error("Invalid image data. Upload or provide PNG, JPG, JPEG, or WEBP image data.");
  }

  return Buffer.from(match[1], "base64");
}

function resizeForLongSide(width: number | undefined, height: number | undefined, longSide: number) {
  const safeWidth = width || longSide;
  const safeHeight = height || longSide;

  if (safeWidth >= safeHeight) {
    return { width: longSide };
  }

  return { height: longSide };
}

function normalizeFileStem(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "image";
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
    let imageBuffer: Buffer;
    let target: UpscaleTarget;
    let sourceName = "image";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const upload = formData.get("image");
      target = parseTarget(formData.get("target"));

      if (!(upload instanceof File)) {
        return Response.json({ ok: false, error: "Upload an image file." }, { status: 400 });
      }

      if (upload.size > 12 * 1024 * 1024) {
        return Response.json({ ok: false, error: "Image is too large. Upload an image under 12 MB." }, { status: 400 });
      }

      sourceName = normalizeFileStem(upload.name || "image");
      imageBuffer = Buffer.from(await upload.arrayBuffer());
    } else {
      const body = (await req.json()) as UpscaleBody;
      target = parseTarget(body.target);

      if (!body.imageDataUrl) {
        return Response.json({ ok: false, error: "imageDataUrl is required." }, { status: 400 });
      }

      imageBuffer = dataUrlToBuffer(body.imageDataUrl);
    }

    const requiredCredits = UPSCALE_CREDITS[target];

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "image-upscale",
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:image-upscale:${target}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        { ok: false, error: "Could not reserve upscale credits.", details: rpcErrorMessage(reserveResponse.error) },
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

    const metadata = await sharp(imageBuffer, { failOnError: false }).rotate().metadata();
    const longSide = UPSCALE_LONG_SIDE[target];
    const resize = resizeForLongSide(metadata.width, metadata.height, longSide);

    const outputBuffer = await sharp(imageBuffer, { failOnError: false })
      .rotate()
      .resize({
        ...resize,
        fit: "inside",
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 1, m1: 0.4, m2: 0.8 })
      .webp({ quality: 96, smartSubsample: true })
      .toBuffer();

    const outputMetadata = await sharp(outputBuffer).metadata();

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:upscale:sharp-lanczos3-webp",
      p_model: `sharp-lanczos3-${target}-${outputMetadata.width || longSide}x${outputMetadata.height || longSide}`,
    });

    if (spendResponse.error) {
      await refundIfReserved("image_upscale_spend_failed");
      return Response.json(
        { ok: false, error: "Could not finalize upscale credit spend.", details: rpcErrorMessage(spendResponse.error) },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("image_upscale_spend_rejected");
      return Response.json(
        { ok: false, error: "Could not finalize upscale credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      toolSlug: "image-upscale",
      target,
      creditsCharged: requiredCredits,
      image: {
        dataUrl: `data:image/webp;base64,${outputBuffer.toString("base64")}`,
        mimeType: "image/webp",
        filename: `${sourceName}-upscaled-${target}-${outputMetadata.width || longSide}x${outputMetadata.height || longSide}.webp`,
        width: outputMetadata.width,
        height: outputMetadata.height,
      },
    });
  } catch (error) {
    await refundIfReserved("image_upscale_failed");

    return Response.json(
      { ok: false, error: "Image upscale failed.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
