import { ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE, isCloudflareKeyExhausted, shouldRotateCloudflareCredential } from "./cloudflare-failover";
import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";
import {
  getImageDimensions,
  IMAGE_MODEL_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "./image-models";

type GenerateImageInput = {
  prompt: string;
  negativePrompt?: string;
  model: ImageModelKey;
  resolution: ImageResolution;
  aspectRatio: ImageAspectRatio;
  style?: string;
  seed?: string;
  operation?: "generate" | "edit" | "combine";
  sourceImageDataUrl?: string;
  referenceImageDataUrl?: string;
  referenceImageDataUrls?: string[];
};

type CloudflareRunResult = {
  success?: boolean;
  result?: unknown;
  image?: unknown;
  data?: unknown;
  output?: unknown;
  images?: unknown;
  errors?: Array<{ message?: string; code?: string | number }>;
  messages?: Array<{ message?: string; code?: string | number }>;
};

type RequestFormat = "multipart" | "json-flux1" | "json-leonardo-lucid" | "json-leonardo-phoenix";
type ParsedResponse = { ok: true; dataUrl: string } | { ok: false; error: string; providerRefused?: boolean; keyExhausted?: boolean };
type RequestPayload = { headers: HeadersInit; body: BodyInit };
type ImageCandidate = { base64: string; mimeType: string };

const MODEL_REQUEST_FORMAT: Record<ImageModelKey, RequestFormat> = {
  M1: "multipart",
  M2: "multipart",
  M3: "json-leonardo-lucid",
  M4: "json-leonardo-phoenix",
  M5: "multipart",
  M6: "json-flux1",
};

const PROVIDER_REFUSAL_MESSAGE = "The image provider rejected this prompt or reference image combination. Try a different prompt, a different reference image, or a simpler wording.";
const MAX_PROVIDER_PROMPT_CHARS = 1900;
const MAX_PROVIDER_NEGATIVE_PROMPT_CHARS = 900;

export function getEffectiveEditModel(requestedModel: ImageModelKey): ImageModelKey {
  return requestedModel === "M1" || requestedModel === "M2" ? requestedModel : "M2";
}

function isProviderRefusal(message: string) {
  return /flagged|policy|blocked|choose another prompt|input image combination|output has been/i.test(message);
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

function safeStyle(style: string | undefined) {
  const value = (style || "").trim();
  return (IMAGE_STYLE_OPTIONS as readonly string[]).includes(value) ? value : "";
}

function clampProviderText(value: string, limit: number) {
  const text = value.trim().replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ");
  if (text.length <= limit) return text;

  const clipped = text.slice(0, limit);
  const lastBreak = Math.max(clipped.lastIndexOf("\n"), clipped.lastIndexOf(". "), clipped.lastIndexOf(", "), clipped.lastIndexOf(" "));
  return `${clipped.slice(0, lastBreak > Math.floor(limit * 0.72) ? lastBreak : limit).trim()}…`;
}

function buildPrompt(input: GenerateImageInput) {
  const style = safeStyle(input.style);
  return clampProviderText([
    input.prompt.trim(),
    style ? `Style: ${style}` : "",
    input.negativePrompt?.trim() ? `Avoid: ${input.negativePrompt.trim()}` : "",
  ].filter(Boolean).join("\n"), MAX_PROVIDER_PROMPT_CHARS);
}

function cleanSeed(seed: string | undefined) {
  const value = seed?.trim();
  if (!value) return null;
  const numericSeed = Number(value);
  if (!Number.isFinite(numericSeed)) return null;
  return Math.max(0, Math.floor(numericSeed));
}

function cloudflareErrorMessage(data: CloudflareRunResult | null, status: number, fallbackText = "") {
  const apiErrors = data?.errors?.map((error) => error.message || error.code).filter(Boolean).join("; ");
  const apiMessages = data?.messages?.map((message) => message.message || message.code).filter(Boolean).join("; ");
  const fallback = fallbackText.trim().slice(0, 500);
  return apiErrors || apiMessages || fallback || `Cloudflare image generation failed with HTTP ${status}`;
}

function dataUrlToBlob(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid reference image data URL.");
  return new Blob([new Uint8Array(Buffer.from(match[2], "base64"))], { type: match[1] || "image/png" });
}

function referenceImages(input: GenerateImageInput): string[] {
  if (input.operation !== "edit" && input.operation !== "combine") return [];
  const values = [input.sourceImageDataUrl, input.referenceImageDataUrl, ...(input.referenceImageDataUrls || [])];
  return values
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(item));
}

function imageMimeFromBase64(base64: string) {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  return "image/png";
}

function normalizeImageCandidate(value: string): ImageCandidate | null {
  const text = value.trim();
  const dataUrl = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(text);
  if (dataUrl?.[2]) return { base64: dataUrl[2].replace(/\s+/g, ""), mimeType: dataUrl[1].toLowerCase().replace("image/jpg", "image/jpeg") };

  const base64 = text.replace(/\s+/g, "");
  if (base64.length < 80 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;
  if (!/^(?:\/9j\/|iVBORw0KGgo|UklGR|R0lGOD)/.test(base64)) return null;
  return { base64, mimeType: imageMimeFromBase64(base64) };
}

function extractImageCandidate(value: unknown): ImageCandidate | null {
  if (!value) return null;
  if (typeof value === "string") return normalizeImageCandidate(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractImageCandidate(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return extractImageCandidate(record.image) ||
      extractImageCandidate(record.data) ||
      extractImageCandidate(record.b64_json) ||
      extractImageCandidate(record.images) ||
      extractImageCandidate(record.output) ||
      extractImageCandidate(record.result);
  }
  return null;
}

function buildRequestFields(input: GenerateImageInput) {
  const model = IMAGE_MODEL_OPTIONS[input.model];
  const format = MODEL_REQUEST_FORMAT[input.model];
  const { width, height } = getImageDimensions(input.resolution, input.aspectRatio);
  const prompt = buildPrompt(input);
  const seed = cleanSeed(input.seed);
  const steps = model.defaultSteps;
  const negativePrompt = clampProviderText(input.negativePrompt?.trim() || "", MAX_PROVIDER_NEGATIVE_PROMPT_CHARS);
  let fields: Record<string, string | number>;

  if (format === "multipart") {
    fields = { prompt, width, height, steps };
    if (seed !== null) fields.seed = seed;
  } else if (format === "json-leonardo-lucid") {
    fields = { prompt, width, height, num_steps: Math.min(Math.max(steps, 1), 40), guidance: 4.5 };
    if (seed !== null) fields.seed = seed;
  } else if (format === "json-leonardo-phoenix") {
    fields = { prompt, width, height, num_steps: Math.min(Math.max(steps, 1), 50), guidance: 2 };
    if (negativePrompt) fields.negative_prompt = negativePrompt;
    if (seed !== null) fields.seed = seed;
  } else {
    fields = { prompt, width, height, steps: Math.min(Math.max(steps, 1), 8) };
    if (seed !== null) fields.seed = seed;
  }

  return { fields, width, height, model, format };
}

function buildRequestPayload(format: RequestFormat, fields: Record<string, string | number>, input: GenerateImageInput): RequestPayload {
  if (format !== "multipart") {
    return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) };
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));

  referenceImages(input).slice(0, 4).forEach((dataUrl, index) => {
    const blob = dataUrlToBlob(dataUrl);
    form.append("image", blob, `reference-${index + 1}.png`);
    form.append(`reference_image_${index + 1}`, blob, `reference-image-${index + 1}.png`);
    if (index === 0) {
      form.append("reference_image", blob, "reference-image.png");
      form.append("source_image", blob, "source-image.png");
    }
  });

  return { headers: {}, body: form };
}

async function parseCloudflareResponse(res: Response): Promise<ParsedResponse> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.startsWith("image/") || (res.ok && contentType.startsWith("application/octet-stream"))) {
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!res.ok || !buffer.length) {
      const rawError = `Cloudflare image generation failed with HTTP ${res.status}`;
      const keyExhausted = isCloudflareKeyExhausted(rawError, res.status);
      return { ok: false, error: rawError, keyExhausted };
    }
    return { ok: true, dataUrl: `data:${contentType.startsWith("image/") ? contentType : "image/jpeg"};base64,${buffer.toString("base64")}` };
  }

  const rawText = await res.text().catch(() => "");
  let data: CloudflareRunResult | null = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText) as CloudflareRunResult;
    } catch {
      data = null;
    }
  }

  const image = extractImageCandidate(data) || extractImageCandidate(rawText);
  const successFlag = typeof data?.success === "boolean" ? data.success : undefined;

  if (!res.ok || successFlag === false || !image) {
    const rawError = cloudflareErrorMessage(data, res.status, rawText);
    const keyExhausted = isCloudflareKeyExhausted(rawError, res.status);
    const providerRefused = !keyExhausted && isProviderRefusal(rawError);
    return { ok: false, error: providerRefused ? PROVIDER_REFUSAL_MESSAGE : rawError, providerRefused, keyExhausted };
  }

  return { ok: true, dataUrl: `data:${image.mimeType};base64,${image.base64}` };
}

async function callCloudflareOnce(credential: CloudflareAICredential, input: GenerateImageInput) {
  const { fields, width, height, model, format } = buildRequestFields(input);
  const requestPayload = buildRequestPayload(format, fields, input);
  const { controller, timer } = timeoutSignal(credential.timeout_ms || 90000);
  const headers = new Headers(requestPayload.headers);
  headers.set("Authorization", `Bearer ${credential.api_token}`);

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credential.account_id}/ai/run/${model.modelId}`, {
      method: "POST",
      headers,
      body: requestPayload.body,
      signal: controller.signal,
    });

    const parsed = await parseCloudflareResponse(res);
    if (!parsed.ok) {
      return {
        ok: false as const,
        tryNext: shouldRotateCloudflareCredential(res.status, parsed.error, parsed.providerRefused),
        providerRefused: parsed.providerRefused || false,
        keyExhausted: parsed.keyExhausted || false,
        status: res.status,
        error: parsed.error,
      };
    }

    return {
      ok: true as const,
      dataUrl: parsed.dataUrl,
      modelId: model.modelId,
      credentialSlot: credential.key_slot,
      width,
      height,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const message = isTimeout ? `Cloudflare request timed out after ${credential.timeout_ms || 90000}ms.` : error instanceof Error ? error.message : String(error);
    const keyExhausted = isCloudflareKeyExhausted(message, 0);
    return {
      ok: false as const,
      tryNext: shouldRotateCloudflareCredential(0, message),
      providerRefused: false,
      keyExhausted,
      status: 0,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateCloudflareImageWithManualFailover(input: GenerateImageInput) {
  const credentials = await getActiveCloudflareAICredentials();
  if (!credentials.length) throw new Error("No active Cloudflare AI credentials found. Add up to 10000 rows in Supabase and set is_active=true.");

  const failures: string[] = [];
  let exhaustedKeys = 0;

  for (const credential of credentials) {
    const result = await callCloudflareOnce(credential, input);
    if (result.ok) return result;

    if (result.keyExhausted) {
      exhaustedKeys += 1;
      failures.push(`Key slot ${credential.key_slot}: daily allocation exhausted or busy`);
      continue;
    }

    if (result.providerRefused) throw new Error(result.error);

    failures.push(`Key slot ${credential.key_slot}: ${result.error}`);
    if (!result.tryNext) break;
  }

  if (exhaustedKeys > 0 && exhaustedKeys === credentials.length) {
    throw new Error(ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE);
  }

  throw new Error(`Image generation failed after rotating Cloudflare keys. ${failures.join(" | ")}`);
}
