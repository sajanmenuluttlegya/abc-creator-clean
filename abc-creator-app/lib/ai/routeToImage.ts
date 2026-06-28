import { IMAGE_CREDITS_PER_IMAGE } from "@/lib/tools/credit-costs";

export type GeneratedImage = {
  dataUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  index: number;
};

export type ImageGenerationRequest = {
  prompt: string;
  aspectRatio: string;
  count: number;
  toolSlug: string;
  sourceText?: string;
  sourceImageDataUrl?: string;
  inputs?: Record<string, string>;
};

type ProviderImage = Omit<GeneratedImage, "index">;

type ImageProviderResult = {
  provider: string;
  model: string;
  images: GeneratedImage[];
};

type ImageProviderCall = (
  prompt: string,
  aspectRatio: string,
  sourceImageDataUrl?: string
) => Promise<ProviderImage | null>;

type CloudflareImageConfig = {
  accountId: string;
  apiToken: string;
  label: string;
};

type AiHordeGeneration = {
  img?: string;
  model?: string;
  censored?: boolean;
};

type AiHordeStatusResponse = {
  done?: boolean;
  faulted?: boolean;
  is_possible?: boolean;
  message?: string;
  queue_position?: number;
  wait_time?: number;
  generations?: AiHordeGeneration[];
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = env(name).trim();
    if (value) return value;
  }
  return "";
}

function numberedEnv(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => env(`${prefix}_${index + 1}`)).filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function csvEnv(name: string) {
  return env(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeGeminiModelName(model: string) {
  return model.trim().replace(/^models\//, "");
}

function getGeminiApiKeys() {
  const proKeys = unique([
    ...numberedEnv("GEMINI_PRO_API_KEY", 2),
    env("GEMINI_PRO_API_KEY"),
  ]);

  if (proKeys.length) return proKeys;

  return unique([
    env("GEMINI_API_KEY"),
    ...numberedEnv("GEMINI_API_KEY", 5),
    env("GOOGLE_API_KEY"),
    env("GOOGLE_GENERATIVE_AI_API_KEY"),
  ]);
}

function getGeminiImageModels() {
  return unique([
    ...csvEnv("GEMINI_IMAGE_MODELS"),
    env("GEMINI_IMAGE_MODEL"),
    "gemini-2.5-flash-image",
  ]).map(normalizeGeminiModelName);
}

function getCloudflareImageConfigs(): CloudflareImageConfig[] {
  const configs: CloudflareImageConfig[] = [];

  const addConfig = (accountIdName: string, apiTokenName: string, label: string) => {
    const accountId = env(accountIdName).trim();
    const apiToken = env(apiTokenName).trim();

    if (accountId && apiToken) {
      configs.push({ accountId, apiToken, label });
    }
  };

  addConfig("CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "cloudflare-default");
  addConfig("CF_ACCOUNT_ID", "CF_API_TOKEN", "cf-default");

  for (let index = 1; index <= 5; index += 1) {
    addConfig(
      `CLOUDFLARE_ACCOUNT_ID_${index}`,
      `CLOUDFLARE_API_TOKEN_${index}`,
      `cloudflare-${index}`
    );
  }

  const seen = new Set<string>();

  return configs.filter((config) => {
    const key = `${config.accountId}:${config.apiToken.slice(0, 12)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCloudflareImageModel() {
  return firstEnv(["CLOUDFLARE_IMAGE_MODEL", "CF_IMAGE_MODEL"]) || "@cf/black-forest-labs/flux-1-schnell";
}

function getCloudflareTimeoutMs() {
  const value = Number(env("CLOUDFLARE_IMAGE_TIMEOUT_MS") || "65000");
  if (!Number.isFinite(value)) return 65000;
  return Math.min(Math.max(Math.floor(value), 10000), 180000);
}

function getAiHordeBaseUrl() {
  return firstEnv(["AI_HORDE_BASE_URL", "AIHORDE_BASE_URL", "STABLE_HORDE_BASE_URL"]) || "https://aihorde.net";
}

function getAiHordeApiKey() {
  return firstEnv(["AI_HORDE_API_KEY", "AIHORDE_API_KEY", "STABLE_HORDE_API_KEY"]) || "0000000000";
}

function getAiHordeClientAgent() {
  return firstEnv(["AI_HORDE_CLIENT_AGENT", "AIHORDE_CLIENT_AGENT", "STABLE_HORDE_CLIENT_AGENT"]) || "ABC-Creator/1.0";
}

function getAiHordeTimeoutMs() {
  const value = Number(env("AI_HORDE_TIMEOUT_MS") || "45000");
  if (!Number.isFinite(value)) return 45000;
  return Math.min(Math.max(Math.floor(value), 15000), 120000);
}

function getAiHordePollIntervalMs() {
  const value = Number(env("AI_HORDE_POLL_INTERVAL_MS") || "3000");
  if (!Number.isFinite(value)) return 3000;
  return Math.min(Math.max(Math.floor(value), 1500), 10000);
}

function isCloudflareRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isAbortOrNetworkError(error: unknown) {
  if (error instanceof Error) {
    return error.name === "AbortError" || /fetch failed|network|timeout|aborted|terminated/i.test(error.message);
  }

  return /fetch failed|network|timeout|aborted|terminated/i.test(String(error));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function safeTruncate(value: string | undefined, maxLength: number) {
  const text = (value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function normalizeAspectRatio(value: string | undefined) {
  const text = (value || "16:9").toLowerCase();

  if (text.includes("9:16")) return "9:16";
  if (text.includes("1:1")) return "1:1";
  if (text.includes("4:3")) return "4:3";
  if (text.includes("3:2")) return "3:2";
  return "16:9";
}

function ratioToSize(aspectRatio: string) {
  switch (normalizeAspectRatio(aspectRatio)) {
    case "9:16":
      return { width: 768, height: 1344 };
    case "1:1":
      return { width: 1024, height: 1024 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "3:2":
      return { width: 1216, height: 832 };
    default:
      return { width: 1344, height: 768 };
  }
}

function clampPollinationsSize(aspectRatio: string) {
  const original = ratioToSize(aspectRatio);
  const maxSide = Math.max(original.width, original.height);
  const scale = maxSide > 1024 ? 1024 / maxSide : 1;
  const makeEven = (value: number) => Math.max(256, Math.round(value / 8) * 8);

  return {
    width: makeEven(original.width * scale),
    height: makeEven(original.height * scale),
  };
}

function aiHordeSize(aspectRatio: string) {
  switch (normalizeAspectRatio(aspectRatio)) {
    case "9:16":
      return { width: 448, height: 768 };
    case "1:1":
      return { width: 512, height: 512 };
    case "4:3":
      return { width: 704, height: 512 };
    case "3:2":
      return { width: 768, height: 512 };
    default:
      return { width: 768, height: 448 };
  }
}

function imageToDataUrl(data: string, mimeType = "image/png") {
  if (data.startsWith("data:")) return data;
  return `data:${mimeType};base64,${data}`;
}

function dataUrlToGeminiImagePart(dataUrl: string | undefined) {
  if (!dataUrl?.startsWith("data:")) return null;

  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;

  return {
    type: "image",
    mime_type: match[1] || "image/png",
    data: match[2],
  };
}

function findBase64Image(value: unknown): { data: string; mimeType: string } | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const mimeType =
    typeof record.mime_type === "string"
      ? record.mime_type
      : typeof record.mimeType === "string"
        ? record.mimeType
        : "image/jpeg";

  if (typeof record.b64_json === "string" && record.b64_json.length > 200) {
    return { data: record.b64_json, mimeType };
  }

  if (typeof record.data === "string" && record.data.length > 200) {
    return { data: record.data, mimeType };
  }

  if (record.output_image) {
    const found = findBase64Image(record.output_image);
    if (found) return found;
  }

  if (record.outputImage) {
    const found = findBase64Image(record.outputImage);
    if (found) return found;
  }

  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findBase64Image(item);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findBase64Image(child);
      if (found) return found;
    }
  }

  return null;
}

async function responseErrorDetails(response: Response) {
  try {
    const text = await response.text();
    if (!text) return "";
    return text.slice(0, 700);
  } catch {
    return "";
  }
}

function buildImagePrompt(request: ImageGenerationRequest, imageIndex: number) {
  const ratio = normalizeAspectRatio(request.aspectRatio);
  const inputs = request.inputs || {};
  const userPrompt = safeTruncate(request.prompt, 1800);
  const sourceText = safeTruncate(request.sourceText, 5000);
  const title = inputs.title || inputs.blog_topic || inputs.blog_title || "blog article";
  const visualStyle = inputs.visual_style || inputs.image_brief_mode || "premium editorial blog visual";
  const brandContext = safeTruncate(inputs.brand_or_context, 1000);

  return `Create one premium blog image.

Tool context: ${request.toolSlug}
Image number: ${imageIndex}
Blog/topic: ${title}
Aspect ratio: ${ratio}
Visual style: ${visualStyle}
Brand/context: ${brandContext || "not supplied"}
User image prompt: ${userPrompt || "Use the source text/image brief below."}

Source article or image brief:
${sourceText}

Production rules:
- Create a polished, professional, publish-ready blog image for this exact placement in the article.
- Prefer clean composition, strong visual hierarchy, and premium editorial quality.
- Match the requested aspect ratio: ${ratio}.
- Do not include watermarks, fake logos, protected brand marks, copyrighted characters, or public-figure likenesses.
- Avoid tiny unreadable text. If text is needed, keep it minimal and highly legible.
- Output the image only.`;
}

async function callOneCloudflareWorkersImageConfig(
  config: CloudflareImageConfig,
  prompt: string
): Promise<ProviderImage> {
  const model = getCloudflareImageModel();
  const timeoutMs = getCloudflareTimeoutMs();
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${model}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        steps: 4,
        seed: Math.floor(Math.random() * 2147483647),
      }),
    },
    timeoutMs
  );

  if (!response.ok) {
    const details = await responseErrorDetails(response);
    const message = `Cloudflare Workers AI ${config.label} ${model} HTTP ${response.status}${details ? `: ${details}` : ""}`;

    if (isCloudflareRetryableStatus(response.status)) {
      throw new Error(`RETRYABLE_CLOUDFLARE_ERROR: ${message}`);
    }

    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      dataUrl: imageToDataUrl(buffer.toString("base64"), contentType),
      mimeType: contentType,
      provider: "cloudflare-workers-ai",
      model,
    };
  }

  const json = await response.json() as {
    success?: boolean;
    result?: {
      image?: string;
    };
    errors?: Array<{ message?: string }>;
  };

  const image = json.result?.image;

  if (!image || image.length < 200) {
    const errorText = json.errors?.map((error) => error.message).filter(Boolean).join(" | ");
    throw new Error(
      `Cloudflare Workers AI ${config.label} ${model} response did not include image data.${errorText ? ` ${errorText}` : ""}`
    );
  }

  return {
    dataUrl: imageToDataUrl(image, "image/jpeg"),
    mimeType: "image/jpeg",
    provider: "cloudflare-workers-ai",
    model,
  };
}

async function callCloudflareWorkersImage(
  prompt: string
): Promise<ProviderImage | null> {
  const configs = getCloudflareImageConfigs();
  if (!configs.length) return null;

  const errors: string[] = [];

  for (const config of configs) {
    try {
      return await callOneCloudflareWorkersImageConfig(config, prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);

      if (message.startsWith("RETRYABLE_CLOUDFLARE_ERROR") || isAbortOrNetworkError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(`All Cloudflare Workers AI configs failed after timeout/network/server retries. ${errors.join(" | ")}`);
}

async function callPollinationsImage(
  prompt: string,
  aspectRatio: string
): Promise<ProviderImage | null> {
  const disabled = env("POLLINATIONS_DISABLED").toLowerCase() === "true";
  if (disabled) return null;

  const { width, height } = clampPollinationsSize(aspectRatio);
  const model = firstEnv(["POLLINATIONS_IMAGE_MODEL", "POLLINATIONS_MODEL"]) || "flux";
  const shortPrompt = safeTruncate(prompt, 1400);

  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}`);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("model", model);
  url.searchParams.set("nologo", "true");
  url.searchParams.set("safe", "true");
  url.searchParams.set("private", "true");
  url.searchParams.set("seed", String(Math.floor(Math.random() * 2147483647)));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "image/png,image/jpeg,image/webp,*/*",
    },
  });

  if (!response.ok) {
    const details = await responseErrorDetails(response);
    throw new Error(`Pollinations ${model} HTTP ${response.status}${details ? `: ${details}` : ""}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    const details = await response.text();
    throw new Error(`Pollinations ${model} did not return an image.${details ? ` ${details.slice(0, 500)}` : ""}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 200) {
    throw new Error(`Pollinations ${model} returned an empty image.`);
  }

  return {
    dataUrl: imageToDataUrl(buffer.toString("base64"), contentType),
    mimeType: contentType,
    provider: "pollinations",
    model,
  };
}

async function imageFromAiHordeGeneration(generation: AiHordeGeneration): Promise<ProviderImage> {
  const model = generation.model || "ai-horde-auto";
  const image = generation.img || "";

  if (image.startsWith("data:")) {
    const mimeMatch = image.match(/^data:([^;,]+)[;,]/);
    return {
      dataUrl: image,
      mimeType: mimeMatch?.[1] || "image/webp",
      provider: "ai-horde",
      model,
    };
  }

  if (/^https?:\/\//i.test(image)) {
    const response = await fetchWithTimeout(
      image,
      {
        method: "GET",
        headers: {
          Accept: "image/png,image/jpeg,image/webp,*/*",
        },
      },
      20000
    );

    if (!response.ok) {
      const details = await responseErrorDetails(response);
      throw new Error(`AI Horde image fetch HTTP ${response.status}${details ? `: ${details}` : ""}`);
    }

    const contentType = response.headers.get("content-type") || "image/webp";
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      dataUrl: imageToDataUrl(buffer.toString("base64"), contentType),
      mimeType: contentType,
      provider: "ai-horde",
      model,
    };
  }

  return {
    dataUrl: imageToDataUrl(image, "image/webp"),
    mimeType: "image/webp",
    provider: "ai-horde",
    model,
  };
}

async function callAiHordeImage(
  prompt: string,
  aspectRatio: string
): Promise<ProviderImage | null> {
  const disabled = env("AI_HORDE_DISABLED").toLowerCase() === "true";
  if (disabled) return null;

  const baseUrl = getAiHordeBaseUrl().replace(/\/$/, "");
  const { width, height } = aiHordeSize(aspectRatio);
  const timeoutMs = getAiHordeTimeoutMs();
  const pollIntervalMs = getAiHordePollIntervalMs();
  const modelList = unique(csvEnv("AI_HORDE_MODELS"));
  const modelLabel = modelList.length ? modelList.join(",") : "auto";
  const shortPrompt = safeTruncate(prompt, 1200);
  const headers = {
    apikey: getAiHordeApiKey(),
    "Client-Agent": getAiHordeClientAgent(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const payload: Record<string, unknown> = {
    prompt: shortPrompt,
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
    params: {
      width,
      height,
      steps: 20,
      n: 1,
      cfg_scale: 7.5,
      sampler_name: "k_euler_a",
    },
  };

  if (modelList.length) payload.models = modelList;

  const submitResponse = await fetchWithTimeout(
    `${baseUrl}/api/v2/generate/async`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
    20000
  );

  if (!submitResponse.ok) {
    const details = await responseErrorDetails(submitResponse);
    throw new Error(`AI Horde submit HTTP ${submitResponse.status}${details ? `: ${details}` : ""}`);
  }

  const submitted = await submitResponse.json() as { id?: string; message?: string; errors?: string[] };
  const id = submitted.id;

  if (!id) {
    const details = submitted.message || submitted.errors?.join(" | ") || JSON.stringify(submitted).slice(0, 400);
    throw new Error(`AI Horde did not return a generation id. ${details}`);
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const statusResponse = await fetchWithTimeout(
      `${baseUrl}/api/v2/generate/status/${id}`,
      {
        method: "GET",
        headers,
      },
      20000
    );

    if (!statusResponse.ok) {
      const details = await responseErrorDetails(statusResponse);
      throw new Error(`AI Horde status HTTP ${statusResponse.status}${details ? `: ${details}` : ""}`);
    }

    const status = await statusResponse.json() as AiHordeStatusResponse;
    const generation = status.generations?.find((item) => item.img && !item.censored) || status.generations?.find((item) => item.img);

    if (generation?.img) {
      return imageFromAiHordeGeneration(generation);
    }

    if (status.faulted) {
      throw new Error(`AI Horde generation faulted.${status.message ? ` ${status.message}` : ""}`);
    }

    if (status.is_possible === false) {
      throw new Error(`AI Horde says this generation is not possible right now.${status.message ? ` ${status.message}` : ""}`);
    }

    if (status.done) {
      throw new Error("AI Horde finished but returned no image.");
    }
  }

  throw new Error(`AI Horde timed out after ${Math.round(timeoutMs / 1000)}s while waiting for ${modelLabel}.`);
}

async function callGeminiNativeImage(
  prompt: string,
  aspectRatio: string,
  sourceImageDataUrl?: string
): Promise<ProviderImage | null> {
  const keys = getGeminiApiKeys();
  if (!keys.length) return null;

  const models = getGeminiImageModels();
  const ratio = normalizeAspectRatio(aspectRatio);
  const sourceImagePart = dataUrlToGeminiImagePart(sourceImageDataUrl);
  const input = sourceImagePart
    ? [{ type: "text", text: prompt }, sourceImagePart]
    : [{ type: "text", text: prompt }];

  const errors: string[] = [];

  for (const apiKey of keys) {
    for (const model of models) {
      try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input,
            response_format: {
              type: "image",
              mime_type: "image/jpeg",
              aspect_ratio: ratio,
              image_size: "1K",
            },
          }),
        });

        if (!response.ok) {
          const details = await responseErrorDetails(response);
          errors.push(`Gemini ${model} HTTP ${response.status}${details ? `: ${details}` : ""}`);
          continue;
        }

        const json = await response.json();
        const found = findBase64Image(json);

        if (!found) {
          errors.push(`Gemini ${model} response did not include image data.`);
          continue;
        }

        return {
          dataUrl: imageToDataUrl(found.data, found.mimeType),
          mimeType: found.mimeType,
          provider: "gemini-native-image",
          model,
        };
      } catch (error) {
        errors.push(`Gemini ${model}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length) throw new Error(errors.join(" | "));
  return null;
}

async function callHuggingFaceOpenSourceImage(
  prompt: string,
  aspectRatio: string
): Promise<ProviderImage | null> {
  const token = firstEnv(["HF_TOKEN", "HF_API_TOKEN", "HUGGINGFACE_API_KEY", "HUGGING_FACE_API_KEY"]);
  if (!token) return null;

  const model = firstEnv(["HF_IMAGE_MODEL", "HUGGINGFACE_IMAGE_MODEL"]) || "black-forest-labs/FLUX.1-schnell";
  const { width, height } = ratioToSize(aspectRatio);

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width,
        height,
        num_inference_steps: 28,
      },
    }),
  });

  if (!response.ok) {
    const details = await responseErrorDetails(response);
    throw new Error(`Hugging Face ${model} HTTP ${response.status}${details ? `: ${details}` : ""}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";

  if (contentType.includes("application/json")) {
    const json = await response.json();
    const base64 = findBase64Image(json);
    if (!base64) throw new Error(`Hugging Face ${model} response did not include image data.`);

    return {
      dataUrl: imageToDataUrl(base64.data, base64.mimeType),
      mimeType: base64.mimeType,
      provider: "huggingface-open-source",
      model,
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    dataUrl: imageToDataUrl(buffer.toString("base64"), contentType),
    mimeType: contentType,
    provider: "huggingface-open-source",
    model,
  };
}

export async function routeToImage(
  request: ImageGenerationRequest
): Promise<ImageProviderResult> {
  const count = Math.min(Math.max(Math.floor(request.count || 1), 1), 7);
  const providerFailures: string[] = [];

  const providers: Array<{ name: string; call: ImageProviderCall }> = [
    { name: "cloudflare-workers-ai", call: callCloudflareWorkersImage },
    { name: "pollinations", call: callPollinationsImage },
    { name: "ai-horde", call: callAiHordeImage },
    { name: "gemini-native-image", call: callGeminiNativeImage },
    { name: "huggingface-open-source", call: callHuggingFaceOpenSourceImage },
  ];

  for (const provider of providers) {
    try {
      const images: ProviderImage[] = [];

      for (let index = 1; index <= count; index += 1) {
        const prompt = buildImagePrompt(request, index);
        const image = await provider.call(prompt, request.aspectRatio, request.sourceImageDataUrl);

        if (!image) {
          throw new Error(`${provider.name} is not configured.`);
        }

        images.push(image);
      }

      return {
        provider: images[0]?.provider || provider.name,
        model: images[0]?.model || "unknown",
        images: images.map((image, index) => ({
          ...image,
          index: index + 1,
        })),
      };
    } catch (error) {
      providerFailures.push(
        `${provider.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  throw new Error(
    `All image generation providers failed. Each generated image costs ${IMAGE_CREDITS_PER_IMAGE} credits. ${providerFailures.join(" | ")}`
  );
}
