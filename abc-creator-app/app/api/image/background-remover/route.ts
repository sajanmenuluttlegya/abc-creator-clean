import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "@/lib/image-tools/cloudflare-credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKGROUND_REMOVER_CREDITS = 3;
const CLOUDFLARE_BACKGROUND_REMOVER_MODEL = "@cf/briaai/RMBG-1.4";

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

type CloudflareJsonResponse = {
  success?: boolean;
  result?: unknown;
  image?: unknown;
  data?: unknown;
  errors?: Array<{ message?: string; code?: string | number }>;
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

function shouldTryNextCredential(status: number) {
  if (status === 0) return true;
  if (status === 408) return true;
  if (status >= 500) return true;
  return false;
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

function cloudflareErrorMessage(data: CloudflareJsonResponse | null, status: number) {
  const apiErrors = data?.errors
    ?.map((error) => error.message || error.code)
    .filter(Boolean)
    .join("; ");

  return apiErrors || `Cloudflare background removal failed with HTTP ${status}`;
}

function getNestedValue(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function extractImageBufferFromJson(data: CloudflareJsonResponse | null) {
  const candidates = [
    data?.image,
    data?.data,
    data?.result,
    getNestedValue(data, ["result", "image"]),
    getNestedValue(data, ["result", "data"]),
    getNestedValue(data, ["result", "output"]),
    getNestedValue(data, ["data", "image"]),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const clean = candidate.trim().replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
      return Buffer.from(clean, "base64");
    }

    if (Array.isArray(candidate) && candidate.every((item) => typeof item === "number")) {
      return Buffer.from(candidate as number[]);
    }
  }

  return null;
}

async function normalizeUploadForCloudflare(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 1536,
      height: 1536,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
}

async function transparentPngDataUrl(buffer: Buffer) {
  const png = await sharp(buffer)
    .rotate()
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  return `data:image/png;base64,${png.toString("base64")}`;
}

async function removeBackgroundWithCredential(credential: CloudflareAICredential, imageBuffer: Buffer) {
  const { controller, timer } = timeoutSignal(credential.timeout_ms || 90000);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${credential.account_id}/ai/run/${CLOUDFLARE_BACKGROUND_REMOVER_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.api_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: Array.from(imageBuffer) }),
        signal: controller.signal,
      }
    );

    const contentType = res.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
      const outputBuffer = Buffer.from(await res.arrayBuffer());

      if (!res.ok || !outputBuffer.length) {
        return {
          ok: false as const,
          tryNext: shouldTryNextCredential(res.status),
          status: res.status,
          error: `Cloudflare background removal failed with HTTP ${res.status}`,
        };
      }

      return { ok: true as const, dataUrl: await transparentPngDataUrl(outputBuffer), credentialSlot: credential.key_slot };
    }

    const data = (await res.json().catch(() => null)) as CloudflareJsonResponse | null;
    const outputBuffer = extractImageBufferFromJson(data);

    if (!res.ok || data?.success === false || !outputBuffer?.length) {
      return {
        ok: false as const,
        tryNext: shouldTryNextCredential(res.status),
        status: res.status,
        error: cloudflareErrorMessage(data, res.status),
      };
    }

    return { ok: true as const, dataUrl: await transparentPngDataUrl(outputBuffer), credentialSlot: credential.key_slot };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      ok: false as const,
      tryNext: true,
      status: 0,
      error: isTimeout
        ? `Cloudflare request timed out after ${credential.timeout_ms || 90000}ms.`
        : error instanceof Error
          ? error.message
          : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function removeBackgroundWithFailover(imageBuffer: Buffer) {
  const credentials = await getActiveCloudflareAICredentials();

  if (!credentials.length) {
    throw new Error("No active Cloudflare AI credentials found.");
  }

  const normalizedImage = await normalizeUploadForCloudflare(imageBuffer);
  const failures: string[] = [];

  for (const credential of credentials) {
    const result = await removeBackgroundWithCredential(credential, normalizedImage);

    if (result.ok) {
      return result;
    }

    failures.push(`Key slot ${credential.key_slot}: ${result.error}`);

    if (!result.tryNext) {
      break;
    }
  }

  throw new Error(`Background removal failed. ${failures.join(" | ")}`);
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
      return Response.json({ ok: false, error: "Upload an image file." }, { status: 400 });
    }

    const formData = await req.formData();
    const upload = formData.get("image");

    if (!(upload instanceof File)) {
      return Response.json({ ok: false, error: "Upload an image file." }, { status: 400 });
    }

    if (!upload.type.startsWith("image/")) {
      return Response.json({ ok: false, error: "Upload a PNG, JPG, JPEG, or WEBP image." }, { status: 400 });
    }

    if (upload.size > 12 * 1024 * 1024) {
      return Response.json({ ok: false, error: "Image is too large. Upload an image under 12 MB." }, { status: 400 });
    }

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: "background-remover",
      p_amount: BACKGROUND_REMOVER_CREDITS,
      p_idempotency_key: `${user.id}:background-remover:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        { ok: false, error: "Could not reserve background remover credits.", details: rpcErrorMessage(reserveResponse.error) },
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
          requiredCredits: reservation?.requiredCredits ?? BACKGROUND_REMOVER_CREDITS,
          currentCredits: reservation?.currentCredits ?? 0,
        },
        { status: 402 }
      );
    }

    reservedTransactionId = reservation.transactionId || null;

    if (!reservedTransactionId) {
      return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });
    }

    const inputBuffer = Buffer.from(await upload.arrayBuffer());
    const result = await removeBackgroundWithFailover(inputBuffer);

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: "image:background-remover:cloudflare-workers-ai",
      p_model: CLOUDFLARE_BACKGROUND_REMOVER_MODEL,
    });

    if (spendResponse.error) {
      await refundIfReserved("background_remover_spend_failed");
      return Response.json(
        { ok: false, error: "Could not finalize background remover credit spend.", details: rpcErrorMessage(spendResponse.error) },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("background_remover_spend_rejected");
      return Response.json(
        { ok: false, error: "Could not finalize background remover credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      toolSlug: "background-remover",
      creditsCharged: BACKGROUND_REMOVER_CREDITS,
      credentialSlot: result.credentialSlot,
      image: {
        dataUrl: result.dataUrl,
        mimeType: "image/png",
        filename: `${upload.name.replace(/\.[^.]+$/, "") || "image"}-transparent.png`,
      },
    });
  } catch (error) {
    await refundIfReserved("background_remover_failed");

    return Response.json(
      { ok: false, error: "Background removal failed.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
