import type { ImageAspectRatio, ImageResolution } from "./image-models";

export type GenerationIntent = "photo" | "portrait" | "product" | "brand" | "poster" | "character" | "scene" | "art" | "general";

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function providerFriendlyPrompt(value: string) {
  return value
    .replace(/\bdeadpool\b/gi, "an original red-and-black masked comic antihero, no official logos or copyrighted character marks")
    .replace(/\bspider[- ]?man\b/gi, "an original agile red-and-blue masked web-themed hero, no official logos or copyrighted character marks")
    .replace(/\bbatman\b/gi, "an original dark masked vigilante hero, no official logos or copyrighted character marks")
    .replace(/\bsuperman\b/gi, "an original caped heroic figure, no official logos or copyrighted character marks")
    .replace(/\bmarvel\b|\bdc comics?\b|\bdisney\b/gi, "original cinematic comic-book style");
}

export function classifyGenerationIntent(userPrompt: string): GenerationIntent {
  const text = userPrompt.toLowerCase();
  if (/(logo|brand|icon|wordmark)/i.test(text)) return "brand";
  if (/(poster|banner|thumbnail|cover|flyer|ad creative)/i.test(text)) return "poster";
  if (/(product|packshot|bottle|shoe|watch|phone|laptop|perfume|furniture)/i.test(text)) return "product";
  if (/(portrait|headshot|person|face|selfie|model|man|woman|crowd)/i.test(text)) return "portrait";
  if (/(character|creature|hero|avatar|mascot|warrior|robot|antihero|masked)/i.test(text)) return "character";
  if (/(landscape|city|room|interior|exterior|forest|mountain|street|building)/i.test(text)) return "scene";
  if (/(anime|manga|cartoon|illustration|watercolor|oil painting|sketch|vector|pixel art|comic)/i.test(text)) return "art";
  if (/(realistic|photorealistic|cinematic|dslr|photo|camera)/i.test(text)) return "photo";
  return "general";
}

function directionsFor(intent: GenerationIntent) {
  switch (intent) {
    case "portrait": return ["clear subject identity", "natural face and hands", "clean professional composition", "coherent background depth"];
    case "product": return ["commercial product quality", "precise edges and materials", "clean studio lighting", "accurate surface texture"];
    case "brand": return ["clean brand-ready layout", "balanced spacing", "simple memorable shape", "no random text"];
    case "poster": return ["strong visual hierarchy", "cinematic contrast", "professional marketing finish", "clear focal point"];
    case "character": return ["original character design", "clear silhouette", "premium concept art finish", "consistent costume details"];
    case "scene": return ["immersive scene design", "coherent lighting", "clear depth and scale", "natural environmental details"];
    case "art": return ["polished artwork", "coherent style", "refined details and color harmony", "clean composition"];
    case "photo": return ["realistic camera quality", "natural materials", "professional color grade", "believable lighting"];
    default: return ["clear focal point", "professional lighting", "polished high-end finish", "coherent details"];
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
  const safePrompt = providerFriendlyPrompt(originalPrompt);
  const intent = classifyGenerationIntent(safePrompt);
  const prompt = [
    "Create one premium finished image.",
    `User request: ${safePrompt}`,
    params.style ? `Style direction: ${params.style}.` : "",
    params.aspectRatio ? `Composition ratio: ${params.aspectRatio}.` : "",
    params.resolution ? `Detail target: ${params.resolution}.` : "",
    "Execution rules:",
    "- Follow the requested subject, setting, action, and composition closely.",
    "- Keep the scene safe, original, brand-neutral, and production-ready.",
    "- If a protected brand, logo, celebrity, or copyrighted character is implied, use an original lookalike-free interpretation instead of exact marks or names.",
    "- Avoid gore, explicit content, weapons-focused violence, real-person impersonation, and trademarked logos.",
    "Quality direction:",
    ...directionsFor(intent).map((item) => `- ${item}`),
    "Final result should be clean, coherent, premium, and visually satisfying.",
  ].filter(Boolean).join("\n");

  const negative = unique([
    params.baseNegative || "",
    "low quality",
    "messy composition",
    "unreadable text",
    "watermark",
    "random logo",
    "visual artifacts",
  ]).join(", ");

  return { intent, originalPrompt, prompt, negativePrompt: negative };
}
