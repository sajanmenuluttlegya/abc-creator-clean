import sharp from "sharp";
import { getActiveM0Worker } from "./m0-worker-registry";
import {
  getImageDimensions,
  type ImageAspectRatio,
  type ImageResolution,
} from "./image-models";

export type M0GenerateImageInput = {
  prompt: string;
  negativePrompt?: string;
  resolution: ImageResolution;
  aspectRatio: ImageAspectRatio;
  style?: string;
  seed?: string;
  operation?: "generate" | "edit" | "combine";
};

const M0_MODEL_ID = "Tongyi-MAI/Z-Image-Turbo";
const DEFAULT_TIMEOUT_MS = 285_000;
const MAX_PROMPT_CHARS = 1_900;

const M0_16_9_DIMENSIONS: Record<ImageResolution, { width: number; height: number }> = {
  "360p": { width: 640, height: 360 },
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
};

function m0TargetDimensions(resolution: ImageResolution, aspectRatio: ImageAspectRatio) {
  return aspectRatio === "16:9"
    ? M0_16_9_DIMENSIONS[resolution]
    : getImageDimensions(resolution, aspectRatio);
}

function requestTimeoutMs() {
  const configured = Number(process.env.M0_WORKER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 30_000), 295_000);
}

function stableSeed(value: string | undefined) {
  const text = (value || "").trim();
  if (!text) return Math.floor(Math.random() * 2_147_483_646) + 1;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return Math.min(Math.max(Math.floor(Math.abs(numeric)), 1), 2_147_483_647);
  }

  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2_147_483_647 || 1;
}


function workerPrompt(input: M0GenerateImageInput) {
  const combined = [
    input.prompt.trim(),
    input.style?.trim() ? `Style: ${input.style.trim()}` : "",
    input.negativePrompt?.trim() ? `Avoid: ${input.negativePrompt.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return combined.length <= MAX_PROMPT_CHARS
    ? combined
    : `${combined.slice(0, MAX_PROMPT_CHARS - 1).trim()}…`;
}

async function workerError(response: Response) {
  const raw = (await response.text().catch(() => "")).trim();
  let detail = raw;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        detail?: unknown;
        error?: unknown;
        message?: unknown;
      };
      detail = String(parsed.detail || parsed.error || parsed.message || raw);
    } catch {
      detail = raw;
    }
  }

  if (response.status === 401) {
    return "M0 worker authentication failed. Check M0_WORKER_API_KEY in Vercel.";
  }
  if (response.status === 429) {
    return "M0 is currently generating another image. Try again shortly.";
  }
  if (response.status === 503) {
    return "M0 is temporarily outside its active worker window.";
  }
  return detail || `M0 worker returned HTTP ${response.status}.`;
}

export async function generateM0Image(input: M0GenerateImageInput) {
  if ((input.operation || "generate") !== "generate") {
    throw new Error(
      "M0 supports text-to-image generation only. Use M1 or M2 for reference-image editing."
    );
  }

  const workerKey = process.env.M0_WORKER_API_KEY?.trim();
  if (!workerKey) {
    throw new Error(
      "M0 is not configured on the server. Add M0_WORKER_API_KEY to Vercel."
    );
  }

  const worker = await getActiveM0Worker();
  if (!worker) {
    throw new Error(
      "M0 is temporarily offline. No healthy registered worker is available."
    );
  }

  const target = m0TargetDimensions(input.resolution, input.aspectRatio);
  const seed = stableSeed(input.seed);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs());

  try {
    const response = await fetch(`${worker.publicUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-key": workerKey,
      },
      body: JSON.stringify({
        prompt: workerPrompt(input),
        width: target.width,
        height: target.height,
        steps: 8,
        seed,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await workerError(response));
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.startsWith("image/") &&
      !contentType.startsWith("application/octet-stream")
    ) {
      throw new Error("M0 worker returned an invalid non-image response.");
    }

    const source = Buffer.from(await response.arrayBuffer());
    if (source.length < 100) {
      throw new Error("M0 worker returned an empty image.");
    }

    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("M0 worker returned an unreadable image.");
    }
    if (metadata.width !== target.width || metadata.height !== target.height) {
      throw new Error(
        `M0 worker returned ${metadata.width}x${metadata.height}; expected exact ${target.width}x${target.height}.`
      );
    }

    const output = source;

    return {
      ok: true as const,
      dataUrl: `data:image/png;base64,${output.toString("base64")}`,
      modelId: M0_MODEL_ID,
      modelKey: "M0" as const,
      requestedModelKey: "M0" as const,
      credentialSlot: worker.workerName,
      workerName: worker.workerName,
      width: target.width,
      height: target.height,
      seed,
      fallbackModelUsed: false,
      promptRescueUsed: false,
      provider: "kaggle-m0-worker" as const,
      postProcess: "native-aligned-crop" as const,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "M0 generation timed out before the worker returned an image."
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
