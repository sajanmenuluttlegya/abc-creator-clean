import { ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE, isCloudflareKeyExhausted, shouldRotateCloudflareCredential } from "./cloudflare-failover";
import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";
import { generateM0Image } from "./m0-image-client";
import {
  getImageDimensions,
  IMAGE_MODEL_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "./image-models";

export type GenerateImageInput = {
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
type ParsedResponse = { ok: true; dataUrl: string } | { ok: false; error: string; providerRefused?: boolean; keyExhausted?: boolean; modelUnavailable?: boolean };
type RequestPayload = { headers: HeadersInit; body: BodyInit };
type ImageCandidate = { base64: string; mimeType: string };

type CloudflareAttemptFailure = {
  ok: false;
  tryNext: boolean;
  providerRefused: boolean;
  keyExhausted: boolean;
  modelUnavailable: boolean;
  status: number;
  error: string;
};

const MODEL_REQUEST_FORMAT: Record<Exclude<ImageModelKey, "M0">, RequestFormat> = {
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
  return /flagged|policy|blocked|choose another prompt|input image combination|output has been|provider rejected|safety/i.test(message);
}

function isModelUnavailable(message: string, status = 0) {
  return status === 404 || /no route for that uri|model not found|model unavailable|not available for this account|unsupported model|unknown model|invalid model/i.test(message);
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
  if (input.model === "M0") throw new Error("M0 must be routed through the dedicated worker client.");
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
      const modelUnavailable = isModelUnavailable(rawError, res.status);
      return { ok: false, error: rawError, keyExhausted, modelUnavailable };
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
    const modelUnavailable = !keyExhausted && isModelUnavailable(rawError, res.status);
    const providerRefused = !keyExhausted && !modelUnavailable && isProviderRefusal(rawError);
    return { ok: false, error: providerRefused ? PROVIDER_REFUSAL_MESSAGE : rawError, providerRefused, keyExhausted, modelUnavailable };
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
      const modelUnavailable = parsed.modelUnavailable || false;
      return {
        ok: false as const,
        tryNext: modelUnavailable || shouldRotateCloudflareCredential(res.status, parsed.error, parsed.providerRefused),
        providerRefused: parsed.providerRefused || false,
        keyExhausted: parsed.keyExhausted || false,
        modelUnavailable,
        status: res.status,
        error: parsed.error,
      } satisfies CloudflareAttemptFailure;
    }

    return {
      ok: true as const,
      dataUrl: parsed.dataUrl,
      modelId: model.modelId,
      modelKey: input.model,
      credentialSlot: credential.key_slot,
      width,
      height,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const message = isTimeout ? `Cloudflare request timed out after ${credential.timeout_ms || 90000}ms.` : error instanceof Error ? error.message : String(error);
    const keyExhausted = isCloudflareKeyExhausted(message, 0);
    const modelUnavailable = isModelUnavailable(message, 0);
    return {
      ok: false as const,
      tryNext: modelUnavailable || shouldRotateCloudflareCredential(0, message),
      providerRefused: false,
      keyExhausted,
      modelUnavailable,
      status: 0,
      error: message,
    } satisfies CloudflareAttemptFailure;
  } finally {
    clearTimeout(timer);
  }
}

function uniqueModels(models: ImageModelKey[]) {
  return Array.from(new Set(models));
}

function modelFallbackOrder(input: GenerateImageInput): ImageModelKey[] {
  const operation = input.operation || "generate";
  if (operation === "edit" || operation === "combine") {
    if (input.model === "M1") return uniqueModels(["M1", "M2", "M5"]);
    return uniqueModels([input.model, "M2", "M5", "M1"]);
  }

  const stableFallbacks: ImageModelKey[] = ["M5", "M2", "M6", "M1", "M3", "M4"];
  return uniqueModels([input.model, ...stableFallbacks]);
}

function rescuePrompt(input: GenerateImageInput) {
  const isEdit = input.operation === "edit" || input.operation === "combine";
  const compact = input.prompt
    .replace(/\b(?:copyrighted|trademarked|celebrity|real person|brand logo|logo|watermark|nsfw|explicit)\b/gi, "original")
    .replace(/\s+/g, " ")
    .trim();
  const base = clampProviderText(compact, 820);
  const instruction = isEdit
    ? "Apply a clean local image edit using the reference image as the source of truth. Preserve identity, composition, lighting, pose, and all unrelated areas. Only change the requested part. Keep the result realistic, polished, and safe for a general audience."
    : "Create a clean original image matching the user request. Use a polished premium composition, natural lighting, coherent details, no readable text, no logos, no watermark, and safe general-audience presentation.";

  return [instruction, base].filter(Boolean).join("\n");
}

function rescueNegativePrompt(input: GenerateImageInput) {
  return [
    input.negativePrompt || "",
    "logos, watermark, unreadable text, extra limbs, distorted hands, duplicate subject, broken anatomy, oversaturated artifacts, messy composition, policy-sensitive wording",
  ].filter(Boolean).join(", ");
}

function attemptInputs(input: GenerateImageInput) {
  const rescued = rescuePrompt(input);
  if (!rescued || rescued === input.prompt) return [input];
  return [input, { ...input, prompt: rescued, negativePrompt: rescueNegativePrompt(input), seed: "" }];
}

export async function generateCloudflareImageWithManualFailover(input: GenerateImageInput) {
  if (input.model === "M0") {
    return generateM0Image(input);
  }

  const credentials = await getActiveCloudflareAICredentials();
  if (!credentials.length) throw new Error("No active Cloudflare AI credentials found. Add active Cloudflare AI credentials in Supabase and set is_active=true.");

  const failures: string[] = [];
  let exhaustedAttempts = 0;
  let totalCredentialAttempts = 0;
  const models = modelFallbackOrder(input);

  for (const modelKey of models) {
    for (const candidateInput of attemptInputs({ ...input, model: modelKey })) {
      for (const credential of credentials) {
        totalCredentialAttempts += 1;
        const result = await callCloudflareOnce(credential, candidateInput);
        if (result.ok) {
          return {
            ...result,
            requestedModelKey: input.model,
            fallbackModelUsed: modelKey !== input.model,
            promptRescueUsed: candidateInput.prompt !== input.prompt,
          };
        }

        if (result.keyExhausted) {
          exhaustedAttempts += 1;
          failures.push(`M${modelKey.slice(1)} key slot ${credential.key_slot}: daily allocation exhausted or busy`);
          continue;
        }

        failures.push(`M${modelKey.slice(1)} key slot ${credential.key_slot}: ${result.error}`);

        if (result.providerRefused || result.modelUnavailable) break;
        if (!result.tryNext) break;
      }
    }
  }

  if (totalCredentialAttempts > 0 && exhaustedAttempts === totalCredentialAttempts) {
    throw new Error(ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE);
  }

  throw new Error(`Image generation failed after trying model fallback and rotating Cloudflare keys. ${failures.slice(-8).join(" | ")}`);
}
