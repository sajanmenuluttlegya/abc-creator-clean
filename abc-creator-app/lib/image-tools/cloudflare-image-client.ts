import { ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE, isCloudflareKeyExhausted, shouldRotateCloudflareCredential } from "./cloudflare-failover";
import { getActiveCloudflareAICredentials, type CloudflareAICredential } from "./cloudflare-credentials";
import { polishImageDataUrl } from "./image-output-polish";
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
  result?: { image?: string };
  image?: string;
  errors?: Array<{ message?: string; code?: string | number }>;
};

type RequestFormat = "multipart" | "json-flux1" | "json-leonardo-lucid" | "json-leonardo-phoenix";
type ParsedResponse = { ok: true; dataUrl: string } | { ok: false; error: string; providerRefused?: boolean; keyExhausted?: boolean };
type RequestPayload = { headers: HeadersInit; body: BodyInit };

const MODEL_REQUEST_FORMAT: Record<ImageModelKey, RequestFormat> = {
  M1: "multipart",
  M2: "multipart",
  M3: "json-leonardo-lucid",
  M4: "json-leonardo-phoenix",
  M5: "multipart",
  M6: "json-flux1",
};

const PROVIDER_REFUSAL_MESSAGE = "The image provider rejected this prompt or reference image combination. Try a different prompt, a different reference image, or a simpler wording.";

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

function buildPrompt(input: GenerateImageInput) {
  const style = safeStyle(input.style);
  return [
    input.prompt.trim(),
    style ? `Style: ${style}` : "",
    input.negativePrompt?.trim() ? `Avoid: ${input.negativePrompt.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function cleanSeed(seed: string | undefined) {
  const value = seed?.trim();
  if (!value) return null;
  const numericSeed = Number(value);
  if (!Number.isFinite(numericSeed)) return null;
  return Math.max(0, Math.floor(numericSeed));
}

function cloudflareErrorMessage(data: CloudflareRunResult | null, status: number) {
  const apiErrors = data?.errors?.map((error) => error.message || error.code).filter(Boolean).join("; ");
  return apiErrors || `Cloudflare image generation failed with HTTP ${status}`;
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

function buildRequestFields(input: GenerateImageInput) {
  const model = IMAGE_MODEL_OPTIONS[input.model];
  const format = MODEL_REQUEST_FORMAT[input.model];
  const { width, height } = getImageDimensions(input.resolution, input.aspectRatio);
  const prompt = buildPrompt(input);
  const seed = cleanSeed(input.seed);
  const steps = model.defaultSteps;
  const negativePrompt = input.negativePrompt?.trim();
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

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!res.ok || !buffer.length) {
      const rawError = `Cloudflare image generation failed with HTTP ${res.status}`;
      const keyExhausted = isCloudflareKeyExhausted(rawError, res.status);
      return { ok: false, error: rawError, keyExhausted };
    }
    return { ok: true, dataUrl: `data:${contentType};base64,${buffer.toString("base64")}` };
  }

  const data = (await res.json().catch(() => null)) as CloudflareRunResult | null;
  const imageBase64 = data?.result?.image || data?.image || "";
  if (!res.ok || !data?.success || !imageBase64) {
    const rawError = cloudflareErrorMessage(data, res.status);
    const keyExhausted = isCloudflareKeyExhausted(rawError, res.status);
    const providerRefused = !keyExhausted && isProviderRefusal(rawError);
    return { ok: false, error: providerRefused ? PROVIDER_REFUSAL_MESSAGE : rawError, providerRefused, keyExhausted };
  }

  return { ok: true, dataUrl: `data:image/png;base64,${imageBase64}` };
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

    const polished = await polishImageDataUrl(parsed.dataUrl, input.operation === "edit" ? "edit" : "generate", {
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
    });

    return {
      ok: true as const,
      dataUrl: polished.dataUrl,
      modelId: model.modelId,
      credentialSlot: credential.key_slot,
      width: polished.width ?? width,
      height: polished.height ?? height,
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
