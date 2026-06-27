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
  inputs?: Record<string, string>;
};

type ProviderImage = Omit<GeneratedImage, "index">;

type ImageProviderResult = {
  provider: string;
  model: string;
  images: GeneratedImage[];
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function getKeys(prefix: string, count: number) {
  const numbered = Array.from({ length: count }, (_, index) =>
    env(`${prefix}_${index + 1}`)
  ).filter(Boolean);

  const unnumbered = env(prefix);
  return unnumbered ? [unnumbered, ...numbered] : numbered;
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
      return { width: 768, height: 1344, falSize: "portrait_16_9" };
    case "1:1":
      return { width: 1024, height: 1024, falSize: "square_hd" };
    case "4:3":
      return { width: 1024, height: 768, falSize: "landscape_4_3" };
    case "3:2":
      return { width: 1216, height: 832, falSize: "landscape_4_3" };
    default:
      return { width: 1344, height: 768, falSize: "landscape_16_9" };
  }
}

function imageToDataUrl(data: string, mimeType = "image/png") {
  if (data.startsWith("data:")) return data;
  return `data:${mimeType};base64,${data}`;
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

function findImageUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  if (typeof record.url === "string" && /^https?:\/\//.test(record.url)) {
    return record.url;
  }

  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findImageUrl(item);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findImageUrl(child);
      if (found) return found;
    }
  }

  return null;
}

async function urlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch generated image URL: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return imageToDataUrl(buffer.toString("base64"), contentType);
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
- Create a polished, professional, publish-ready blog image.
- Prefer clean composition, strong visual hierarchy, and premium editorial quality.
- Do not include watermarks, fake logos, protected brand marks, copyrighted characters, or public-figure likenesses.
- Avoid tiny unreadable text. If text is needed, keep it minimal and highly legible.
- Output the image only.`;
}

async function callGeminiImage(prompt: string, aspectRatio: string): Promise<ProviderImage | null> {
  const keys = getKeys("GEMINI_API_KEY", 5);
  if (!keys.length) return null;

  const model = env("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image");
  const ratio = normalizeAspectRatio(aspectRatio);
  const errors: string[] = [];

  for (const apiKey of keys) {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [{ type: "text", text: prompt }],
          response_format: {
            type: "image",
            mime_type: "image/png",
            aspect_ratio: ratio,
          },
        }),
      });

      if (!response.ok) {
        errors.push(`Gemini HTTP ${response.status}`);
        continue;
      }

      const json = await response.json();
      const found = findBase64Image(json);

      if (!found) {
        errors.push("Gemini response did not include image data.");
        continue;
      }

      return {
        dataUrl: imageToDataUrl(found.data, found.mimeType),
        mimeType: found.mimeType,
        provider: "gemini",
        model,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length) throw new Error(errors.join(" | "));
  return null;
}

async function callFalImage(prompt: string, aspectRatio: string): Promise<ProviderImage | null> {
  const apiKey = env("FAL_KEY");
  if (!apiKey) return null;

  const model = env("FAL_IMAGE_MODEL", "fal-ai/flux/dev");
  const { falSize } = ratioToSize(aspectRatio);

  const response = await fetch(`https://fal.run/${model.replace(/^\/+/, "")}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: falSize,
      num_images: 1,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    throw new Error(`fal HTTP ${response.status}`);
  }

  const json = await response.json();
  const base64 = findBase64Image(json);

  if (base64) {
    return {
      dataUrl: imageToDataUrl(base64.data, base64.mimeType),
      mimeType: base64.mimeType,
      provider: "fal",
      model,
    };
  }

  const imageUrl = findImageUrl(json);
  if (!imageUrl) {
    throw new Error("fal response did not include image data or URL.");
  }

  return {
    dataUrl: await urlToDataUrl(imageUrl),
    mimeType: "image/png",
    provider: "fal",
    model,
  };
}

async function callHuggingFaceImage(
  prompt: string,
  aspectRatio: string
): Promise<ProviderImage | null> {
  const token = env("HF_TOKEN");
  if (!token) return null;

  const model = env("HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell");
  const { width, height } = ratioToSize(aspectRatio);

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
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
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";

  if (contentType.includes("application/json")) {
    const json = await response.json();
    const base64 = findBase64Image(json);
    if (!base64) throw new Error("Hugging Face response did not include image data.");

    return {
      dataUrl: imageToDataUrl(base64.data, base64.mimeType),
      mimeType: base64.mimeType,
      provider: "huggingface",
      model,
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    dataUrl: imageToDataUrl(buffer.toString("base64"), contentType),
    mimeType: contentType,
    provider: "huggingface",
    model,
  };
}

export async function routeToImage(
  request: ImageGenerationRequest
): Promise<ImageProviderResult> {
  const count = Math.min(Math.max(Math.floor(request.count || 1), 1), 7);
  const providerFailures: string[] = [];

  const providers = [
    { name: "gemini", call: callGeminiImage },
    { name: "fal", call: callFalImage },
    { name: "huggingface", call: callHuggingFaceImage },
  ];

  for (const provider of providers) {
    try {
      const images: ProviderImage[] = [];

      for (let index = 1; index <= count; index++) {
        const prompt = buildImagePrompt(request, index);
        const image = await provider.call(prompt, request.aspectRatio);

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
