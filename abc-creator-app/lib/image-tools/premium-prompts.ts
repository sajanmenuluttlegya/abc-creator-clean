import type { ImageAspectRatio, ImageResolution } from "./image-models";

export type GenerationIntent = "photo" | "portrait" | "product" | "brand" | "poster" | "character" | "scene" | "art" | "general";

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function classifyGenerationIntent(userPrompt: string): GenerationIntent {
  const text = userPrompt.toLowerCase();
  if (/(logo|brand|icon|wordmark)/i.test(text)) return "brand";
  if (/(poster|banner|thumbnail|cover|flyer|ad creative)/i.test(text)) return "poster";
  if (/(product|packshot|bottle|shoe|watch|phone|laptop|perfume|furniture)/i.test(text)) return "product";
  if (/(portrait|headshot|person|face|selfie|model)/i.test(text)) return "portrait";
  if (/(character|creature|hero|avatar|mascot|warrior|robot)/i.test(text)) return "character";
  if (/(landscape|city|room|interior|exterior|forest|mountain|street|building)/i.test(text)) return "scene";
  if (/(anime|manga|cartoon|illustration|watercolor|oil painting|sketch|vector|pixel art|comic)/i.test(text)) return "art";
  if (/(realistic|photorealistic|cinematic|dslr|photo|camera)/i.test(text)) return "photo";
  return "general";
}

function directionsFor(intent: GenerationIntent) {
  switch (intent) {
    case "portrait":
      return ["natural subject detail", "premium portrait lighting", "clean professional composition"];
    case "product":
      return ["commercial product quality", "precise edges and materials", "clean studio lighting"];
    case "brand":
      return ["clean brand-ready layout", "balanced spacing", "simple memorable shape"];
    case "poster":
      return ["strong visual hierarchy", "cinematic contrast", "professional marketing finish"];
    case "character":
      return ["consistent character design", "clear silhouette", "premium concept art finish"];
    case "scene":
      return ["immersive scene design", "coherent lighting", "clear depth and scale"];
    case "art":
      return ["polished artwork", "coherent style", "refined details and color harmony"];
    case "photo":
      return ["realistic camera quality", "natural materials", "professional color grade"];
    default:
      return ["clear focal point", "professional lighting", "polished high-end finish"];
  }
}

export function buildPremiumGenerationPrompt(params: {
  userPrompt: string;
  baseNegative?: string;
  style?: string;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
}) {
  const originalPrompt = compact(params.userPrompt);
  const intent = classifyGenerationIntent(originalPrompt);
  const prompt = [
    "Premium image generation mode.",
    "Follow the user's request exactly and keep the requested subject as the source of truth.",
    `User request: ${originalPrompt}`,
    params.style ? `Style direction: ${params.style}.` : "",
    params.aspectRatio ? `Composition ratio: ${params.aspectRatio}.` : "",
    params.resolution ? `Output detail target: ${params.resolution}.` : "",
    "Quality direction:",
    ...directionsFor(intent).map((item) => `- ${item}`),
    "Make the final image clean, coherent, premium, and production-ready.",
    "Avoid adding unreadable text, watermarks, UI, or random logos unless the user explicitly requested them.",
  ].filter(Boolean).join("\n");

  const negative = unique([
    params.baseNegative || "",
    "low quality",
    "blurry",
    "messy composition",
    "unreadable text",
    "random watermark",
    "unwanted logo",
    "visible artifacts",
  ]).join(", ");

  return { intent, originalPrompt, prompt, negativePrompt: negative };
}
