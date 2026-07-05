export const MAX_CLOUDFLARE_AI_CREDENTIALS = 11000;

export type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
export type ImageResolution = "360p" | "480p" | "720p" | "1080p";
export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
export type UpscaleTarget = "1080p" | "2k" | "4k";

export const IMAGE_STYLE_OPTIONS = [
  "Photorealistic",
  "Cinematic",
  "Anime",
  "Manga",
  "Cartoon",
  "Digital art",
  "Fantasy art",
  "Sci-fi",
  "Cyberpunk",
  "3D render",
  "Pixel art",
  "Vector art",
  "Logo design",
  "Product photo",
  "Portrait",
  "Oil painting",
  "Watercolor",
  "Sketch",
  "Comic book",
  "Children’s book",
  "Minimalist",
  "Poster art",
  "Vintage",
  "Horror",
  "Dark fantasy",
  "Steampunk",
  "Isometric 3D",
  "Claymation",
  "Sticker style",
  "Line art",
  "1980s",
] as const;

export type ImageStyleOption = (typeof IMAGE_STYLE_OPTIONS)[number];

export const IMAGE_MODEL_OPTIONS: Record<ImageModelKey, {
  label: ImageModelKey;
  modelId: string;
  defaultSteps: number;
  creditByResolution: Record<ImageResolution, number>;
}> = {
  M1: {
    label: "M1",
    modelId: "@cf/black-forest-labs/flux-2-dev",
    defaultSteps: 25,
    creditByResolution: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  },
  M2: {
    label: "M2",
    modelId: "@cf/black-forest-labs/flux-2-klein-9b",
    defaultSteps: 25,
    creditByResolution: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  },
  M3: {
    label: "M3",
    modelId: "@cf/leonardo/lucid-origin",
    defaultSteps: 25,
    creditByResolution: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  },
  M4: {
    label: "M4",
    modelId: "@cf/leonardo/phoenix-1.0",
    defaultSteps: 25,
    creditByResolution: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  },
  M5: {
    label: "M5",
    modelId: "@cf/black-forest-labs/flux-2-klein-4b",
    defaultSteps: 25,
    creditByResolution: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  },
  M6: {
    label: "M6",
    modelId: "@cf/black-forest-labs/flux-1-schnell",
    defaultSteps: 4,
    creditByResolution: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
  },
};

export const IMAGE_MODEL_KEYS = Object.keys(IMAGE_MODEL_OPTIONS) as ImageModelKey[];
export const IMAGE_RESOLUTIONS: ImageResolution[] = ["360p", "480p", "720p", "1080p"];
export const IMAGE_ASPECT_RATIOS: ImageAspectRatio[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"];

export const IMAGE_DIMENSIONS: Record<ImageResolution, Record<ImageAspectRatio, { width: number; height: number }>> = {
  "360p": {
    "16:9": { width: 640, height: 360 },
    "9:16": { width: 360, height: 640 },
    "1:1": { width: 640, height: 640 },
    "4:5": { width: 512, height: 640 },
    "3:4": { width: 480, height: 640 },
    "4:3": { width: 640, height: 480 },
    "3:2": { width: 640, height: 424 },
    "2:3": { width: 424, height: 640 },
  },
  "480p": {
    "16:9": { width: 856, height: 480 },
    "9:16": { width: 480, height: 856 },
    "1:1": { width: 856, height: 856 },
    "4:5": { width: 688, height: 856 },
    "3:4": { width: 640, height: 856 },
    "4:3": { width: 856, height: 640 },
    "3:2": { width: 856, height: 568 },
    "2:3": { width: 568, height: 856 },
  },
  "720p": {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "1:1": { width: 1280, height: 1280 },
    "4:5": { width: 1024, height: 1280 },
    "3:4": { width: 960, height: 1280 },
    "4:3": { width: 1280, height: 960 },
    "3:2": { width: 1280, height: 856 },
    "2:3": { width: 856, height: 1280 },
  },
  "1080p": {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 864, height: 1080 },
    "3:4": { width: 808, height: 1080 },
    "4:3": { width: 1440, height: 1080 },
    "3:2": { width: 1624, height: 1080 },
    "2:3": { width: 1080, height: 1624 },
  },
};

export function getImageDimensions(resolution: ImageResolution, aspectRatio: ImageAspectRatio) {
  return IMAGE_DIMENSIONS[resolution][aspectRatio];
}

export function getTextToImageCredits(model: ImageModelKey, resolution: ImageResolution, imageCount: number) {
  const safeCount = Math.min(Math.max(Math.floor(Number(imageCount) || 1), 1), 4);
  return IMAGE_MODEL_OPTIONS[model].creditByResolution[resolution] * safeCount;
}

export const UPSCALE_CREDITS: Record<UpscaleTarget, number> = {
  "1080p": 3,
  "2k": 5,
  "4k": 9,
};

export const UPSCALE_LONG_SIDE: Record<UpscaleTarget, number> = {
  "1080p": 1080,
  "2k": 2048,
  "4k": 4096,
};
