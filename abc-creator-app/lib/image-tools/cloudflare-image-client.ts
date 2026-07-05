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
};

type CloudflareRunResult = {
  success?: boolean;
  result?: {
    image?: string;
  };
  image?: string;
  errors?: Array<{ message?: string; code?: string | number }>;
  messages?: unknown[];
};

type RequestPayload = {
  headers: Record<string, string>;
  body: BodyInit;
};

type ParsedCloudflareResponse =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

type CloudflareImageRequestFormat = "multipart" | "json-flux1" | "json-leonardo-lucid" | "json-leonardo-phoenix";

const MODEL_REQUEST_FORMAT: Record<ImageModelKey, CloudflareImageRequestFormat> = {
  M1: "multipart", // @cf/black-forest-labs/flux-2-dev
  M2: "multipart", // @cf/black-forest-labs/flux-2-klein-9b
  M3: "json-leonardo-lucid", // @cf/leonardo/lucid-origin
  M4: "json-leonardo-phoenix", // @cf/leonardo/phoenix-1.0
  M5: "multipart", // @cf/black-forest-labs/flux-2-klein-4b
  M6: "json-flux1", // @cf/black-forest-labs/flux-1-schnell
};

function shouldTryNextKey(status: number) {
  if (status === 0) return true;    // network / timeout
  if (status === 408) return true;  // timeout
  if (status >= 500) return true;   // temporary server/provider failure
  return false;
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

function cloudflareErrorMessage(data: CloudflareRunResult | null, status: number) {
  const apiErrors = data?.errors
    ?.map((error) => error.message || error.code)
    .filter(Boolean)
    .join("; ");

  return apiErrors || `Cloudflare image generation failed with HTTP ${status}`;
}

function cleanSeed(seed: string | undefined) {
  const value = seed?.trim();
  if (!value) return null;

  const numericSeed = Number(value);
  if (!Number.isFinite(numericSeed)) return null;

  return Math.max(0, Math.floor(numericSeed));
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
    // FLUX.1 schnell does not expose width/height in the Workers AI REST schema.
    fields = { prompt, steps: Math.min(Math.max(steps, 1), 8) };
    if (seed !== null) fields.seed = seed;
  }

  return { fields, width, height, model, format };
}

function buildRequestPayload(format: CloudflareImageRequestFormat, fields: Record<string, string | number>): RequestPayload {
  if (format === "multipart") {
    const form = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      form.append(key, String(value));
    }

    // Do not set Content-Type for FormData. fetch adds the multipart boundary automatically.
    return { headers: {}, body: form };
  }

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  };
}

async function parseCloudflareResponse(res: Response): Promise<ParsedCloudflareResponse> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await res.arrayBuffer());

    if (!res.ok || !buffer.length) {
      return { ok: false, error: `Cloudflare image generation failed with HTTP ${res.status}` };
    }

    return { ok: true, dataUrl: `data:${contentType};base64,${buffer.toString("base64")}` };
  }

  const data = (await res.json().catch(() => null)) as CloudflareRunResult | null;
  const imageBase64 = data?.result?.image || data?.image || "";

  if (!res.ok || !data?.success || !imageBase64) {
    return { ok: false, error: cloudflareErrorMessage(data, res.status) };
  }

  return { ok: true, dataUrl: `data:image/png;base64,${imageBase64}` };
}

async function callCloudflareOnce(credential: CloudflareAICredential, input: GenerateImageInput) {
  const { fields, width, height, model, format } = buildRequestFields(input);
  const requestPayload = buildRequestPayload(format, fields);
  const { controller, timer } = timeoutSignal(credential.timeout_ms || 90000);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${credential.account_id}/ai/run/${model.modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.api_token}`,
          ...requestPayload.headers,
        },
        body: requestPayload.body,
        signal: controller.signal,
      }
    );

    const parsed = await parseCloudflareResponse(res);

    if (!parsed.ok) {
      return {
        ok: false as const,
        tryNext: shouldTryNextKey(res.status),
        status: res.status,
        error: `${input.model} ${format}: ${parsed.error}`,
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

export async function generateCloudflareImageWithManualFailover(input: GenerateImageInput) {
  const credentials = await getActiveCloudflareAICredentials();

  if (!credentials.length) {
    throw new Error("No active Cloudflare AI credentials found. Add up to 10000 rows in Supabase and set is_active=true.");
  }

  const failures: string[] = [];

  for (const credential of credentials) {
    const result = await callCloudflareOnce(credential, input);

    if (result.ok) {
      return result;
    }

    failures.push(`Key slot ${credential.key_slot}: ${result.error}`);

    // No quota/rate-limit bypass and no DB status update.
    if (!result.tryNext) {
      break;
    }
  }

  throw new Error(`Image generation failed. ${failures.join(" | ")}`);
}
