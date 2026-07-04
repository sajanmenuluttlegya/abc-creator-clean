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

async function callCloudflareOnce(credential: CloudflareAICredential, input: GenerateImageInput) {
  const model = IMAGE_MODEL_OPTIONS[input.model];
  const { width, height } = getImageDimensions(input.resolution, input.aspectRatio);

  const form = new FormData();
  form.append("prompt", buildPrompt(input));
  form.append("width", String(width));
  form.append("height", String(height));
  form.append("steps", String(model.defaultSteps));

  if (input.seed?.trim()) {
    form.append("seed", input.seed.trim());
  }

  const { controller, timer } = timeoutSignal(credential.timeout_ms || 90000);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${credential.account_id}/ai/run/${model.modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.api_token}`,
        },
        body: form,
        signal: controller.signal,
      }
    );

    const data = (await res.json().catch(() => null)) as CloudflareRunResult | null;
    const imageBase64 = data?.result?.image || data?.image || "";

    if (!res.ok || !data?.success || !imageBase64) {
      return {
        ok: false as const,
        tryNext: shouldTryNextKey(res.status),
        status: res.status,
        error: cloudflareErrorMessage(data, res.status),
      };
    }

    return {
      ok: true as const,
      dataUrl: `data:image/png;base64,${imageBase64}`,
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