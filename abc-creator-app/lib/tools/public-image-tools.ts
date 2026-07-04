import type { Tool } from "./public-tools";

export const imageTools: Tool[] = [
  {
    id: "text-to-image-generator",
    slug: "text-to-image-generator",
    name: "Text to Image Generator",
    description: "Generate premium AI images from a prompt with model, resolution, ratio, style, count, and seed controls.",
    icon: "image",
    detailEmoji: "🖼️",
    category: "Image Tools",
    displayCreditCost: 2,
    aliases: ["text-to-image", "ai-image-generator", "image-generator", "text-to-img-gen"],
    nextActions: [{ label: "Upscale an image", href: "/tools/image-upscale", description: "Increase a generated or uploaded image to 1080p, 2K, or 4K." }],
    inputs: [],
  },
  {
    id: "image-upscale",
    slug: "image-upscale",
    name: "Image Upscale",
    description: "Upload an image and upscale it to 1080p, 2K, or 4K with a premium download output.",
    icon: "image-upscale",
    detailEmoji: "🔍",
    category: "Image Tools",
    displayCreditCost: 3,
    aliases: ["image-upscaler", "ai-image-upscale", "upscale-image"],
    inputs: [],
  },
];
