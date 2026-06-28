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
  return unique([
    ...numberedEnv("GEMINI_PRO_API_KEY", 2),
    env("GEMINI_PRO_API_KEY"),
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
        : "image/png";

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
              mime_type: "image/png",
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
    { name: "gemini-native-image", call: callGeminiNativeImage },
    { name: "huggingface-open-source", call: callHuggingFaceOpenSourceImage },
  ];

  for (const provider of providers) {
    try {
      const images: ProviderImage[] = [];

      for (let index = 1; index <= count; index++) {
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
