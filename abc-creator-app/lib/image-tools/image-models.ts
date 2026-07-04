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

const RESOLUTION_LONG_SIDE: Record<ImageResolution, number> = {
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1024,
};

const ASPECT_RATIO_NUMBERS: Record<ImageAspectRatio, [number, number]> = {
  "1:1": [1, 1],
  "16:9": [16, 9],
  "9:16": [9, 16],
  "4:5": [4, 5],
  "3:4": [3, 4],
  "4:3": [4, 3],
  "3:2": [3, 2],
  "2:3": [2, 3],
};

export const IMAGE_MODEL_KEYS = Object.keys(IMAGE_MODEL_OPTIONS) as ImageModelKey[];
export const IMAGE_RESOLUTIONS: ImageResolution[] = ["360p", "480p", "720p", "1080p"];
export const IMAGE_ASPECT_RATIOS: ImageAspectRatio[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"];

function roundToMultipleOf8(value: number) {
  return Math.max(64, Math.round(value / 8) * 8);
}

export function getImageDimensions(resolution: ImageResolution, aspectRatio: ImageAspectRatio) {
  const longSide = RESOLUTION_LONG_SIDE[resolution];
  const [w, h] = ASPECT_RATIO_NUMBERS[aspectRatio];

  if (w >= h) {
    return {
      width: roundToMultipleOf8(longSide),
      height: roundToMultipleOf8((longSide * h) / w),
    };
  }

  return {
    width: roundToMultipleOf8((longSide * w) / h),
    height: roundToMultipleOf8(longSide),
  };
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