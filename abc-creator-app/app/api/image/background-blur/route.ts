import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "@/lib/image-tools/cloudflare-credentials";
import { getTextToImageCredits, IMAGE_MODEL_KEYS, IMAGE_RESOLUTIONS, type ImageModelKey, type ImageResolution } from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RMBG_MODEL = "@cf/briaai/RMBG-1.4";

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };
type CloudflareJsonResponse = { success?: boolean; result?: unknown; image?: unknown; data?: unknown; errors?: Array<{ message?: string; code?: string | number }> };

function parseModel(value: unknown): ImageModelKey {
  return IMAGE_MODEL_KEYS.includes(value as ImageModelKey) ? value as ImageModelKey : "M2";
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

function dataUrlToBuffer(dataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i.exec(dataUrl.trim());
  const base64 = match?.[1];
  if (!base64) throw new Error("Invalid image data.");
  return Buffer.from(base64, "base64");
}

function getNestedValue(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function extractImageBufferFromJson(data: CloudflareJsonResponse | null) {
  const candidates = [data?.image, data?.data, data?.result, getNestedValue(data, ["result", "image"]), getNestedValue(data, ["result", "data"]), getNestedValue(data, ["result", "output"]), getNestedValue(data, ["data", "image"])];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const clean = candidate.trim().replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
      return Buffer.from(clean, "base64");
    }
    if (Array.isArray(candidate) && candidate.every((item) => typeof item === "number")) return Buffer.from(candidate as number[]);
  }
  return null;
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

function shouldTryNext(status: number) {
  return status === 0 || status === 408 || status >= 500;
}

function cloudflareErrorMessage(data: CloudflareJsonResponse | null, status: number) {
  const apiErrors = data?.errors?.map((error) => error.message || error.code).filter(Boolean).join("; ");
  return apiErrors || `Background blur mask failed with HTTP ${status}`;
}

async function normalizeInput(buffer: Buffer) {
  return sharp(buffer).rotate().resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
}

async function removeBackgroundWithCredential(credential: CloudflareAICredential, imageBuffer: Buffer) {
  const { controller, timer } = timeoutSignal(credential.timeout_ms || 90000);
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credential.account_id}/ai/run/${RMBG_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${credential.api_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image: Array.from(imageBuffer) }),
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) {
      const outputBuffer = Buffer.from(await res.arrayBuffer());
      if (!res.ok || !outputBuffer.length) return { ok: false as const, tryNext: shouldTryNext(res.status), error: `Background blur mask failed with HTTP ${res.status}` };
      return { ok: true as const, buffer: outputBuffer, credentialSlot: credential.key_slot };
    }

    const data = (await res.json().catch(() => null)) as CloudflareJsonResponse | null;
    const outputBuffer = extractImageBufferFromJson(data);
    if (!res.ok || data?.success === false || !outputBuffer?.length) return { ok: false as const, tryNext: shouldTryNext(res.status), error: cloudflareErrorMessage(data, res.status) };
    return { ok: true as const, buffer: outputBuffer, credentialSlot: credential.key_slot };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return { ok: false as const, tryNext: true, error: isTimeout ? "Background blur is busy. Try again." : error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function getSubjectCutout(imageBuffer: Buffer) {
  const credentials = await getActiveCloudflareAICredentials();
  if (!credentials.length) throw new Error("No active Cloudflare AI credentials found.");
  const failures: string[] = [];
  for (const credential of credentials) {
    const result = await removeBackgroundWithCredential(credential, imageBuffer);
    if (result.ok) return result;
    failures.push(`Key slot ${credential.key_slot}: ${result.error}`);
    if (!result.tryNext) break;
  }
  throw new Error(`Background blur failed. ${failures.join(" | ")}`);
}

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

    const body = await req.json().catch(() => null) as { imageDataUrl?: string; model?: ImageModelKey; resolution?: ImageResolution; blur?: number } | null;
    if (!body?.imageDataUrl) return Response.json({ ok: false, error: "imageDataUrl is required." }, { status: 400 });
    const model = parseModel(body.model);
    const resolution = parseResolution(body.resolution);
    const requiredCredits = getTextToImageCredits(model, resolution, 1);

    const reserveResponse = await supabase.rpc("reserve_credits", { p_tool_slug: "text-to-image-generator", p_amount: requiredCredits, p_idempotency_key: `${user.id}:background-blur:${model}:${resolution}:${randomUUID()}` });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });
    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });
    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const normalized = await normalizeInput(dataUrlToBuffer(body.imageDataUrl));
    const subject = await getSubjectCutout(normalized);
    const metadata = await sharp(normalized).metadata();
    const outputWidth = metadata.width || 1024;
    const outputHeight = metadata.height || 1024;
    const blurAmount = Math.min(28, Math.max(6, Number(body.blur) || 14));
    const blurred = await sharp(normalized).blur(blurAmount).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    const subjectPng = await sharp(subject.buffer).resize({ width: outputWidth, height: outputHeight, fit: "fill" }).png({ compressionLevel: 9 }).toBuffer();
    const output = await sharp(blurred).composite([{ input: subjectPng, blend: "over" }]).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    const outputMetadata = await sharp(output).metadata();

    const spendResponse = await supabase.rpc("spend_reserved_credits", { p_transaction_id: reservedTransactionId, p_provider: "image:background-blur:rmbg-sharp", p_model: `${RMBG_MODEL}+sharp-blur-${model}-${resolution}` });
    if (spendResponse.error) { await refundIfReserved("background_blur_spend_failed"); return Response.json({ ok: false, error: "Could not finalize credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 }); }
    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) { await refundIfReserved("background_blur_spend_rejected"); return Response.json({ ok: false, error: "Could not finalize credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 }); }

    return Response.json({ ok: true, toolSlug: "background-blur", creditsCharged: requiredCredits, credentialSlot: subject.credentialSlot, image: { dataUrl: `data:image/png;base64,${output.toString("base64")}`, mimeType: "image/png", filename: `background-blur-${outputMetadata.width || outputWidth}x${outputMetadata.height || outputHeight}.png`, width: outputMetadata.width, height: outputMetadata.height } });
  } catch (error) {
    await refundIfReserved("background_blur_failed");
    return Response.json({ ok: false, error: "Failed to edit. There are too many requests at this moment.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
