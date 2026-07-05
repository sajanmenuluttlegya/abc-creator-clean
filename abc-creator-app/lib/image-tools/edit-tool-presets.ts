export type ImageEditToolPreset = "crop" | "outpaint" | "blur" | "restore" | "sticker" | "transparent-background";

export function parseImageEditToolPreset(value: unknown): ImageEditToolPreset | null {
  return value === "crop" ||
    value === "outpaint" ||
    value === "blur" ||
    value === "restore" ||
    value === "sticker" ||
    value === "transparent-background"
    ? value
    : null;
}

function readOption(options: Record<string, unknown> | undefined, key: string) {
  const value = options?.[key];
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : "";
}

export function buildImageEditToolInstruction(params: {
  preset: ImageEditToolPreset | null;
  options?: Record<string, unknown>;
}) {
  const preset = params.preset;
  const options = params.options;

  if (!preset) return "";

  if (preset === "crop") {
    const ratio = readOption(options, "targetAspectRatio");
    return [
      "Dedicated crop/reframe tool.",
      ratio ? `Target framing ratio: ${ratio}.` : "Keep the current ratio if no target ratio is provided.",
      "Recompose the image so the main subject and key visual information remain clear, balanced, and premium.",
      "Preserve the subject identity, source lighting, colors, and scene continuity.",
    ].join("\n");
  }

  if (preset === "outpaint") {
    const direction = readOption(options, "outpaintDirection");
    const amount = readOption(options, "outpaintAmount");
    return [
      "Dedicated canvas expansion/outpaint tool.",
      direction ? `Expansion direction: ${direction}.` : "Expand only where needed for a better composition.",
      amount ? `Expansion amount: ${amount}.` : "Use a natural expansion amount.",
      "Continue the scene beyond the original edges with matching perspective, lighting, texture, and style.",
      "Keep the original central content unchanged as much as possible.",
    ].join("\n");
  }

  if (preset === "blur") {
    const target = readOption(options, "blurTarget") || "background";
    const strength = readOption(options, "blurStrength") || "medium";
    return [
      "Dedicated focus/blur tool.",
      `Blur target: ${target}.`,
      `Blur strength: ${strength}.`,
      "Create natural depth-of-field and clean subject separation.",
      "Keep the intended focus area crisp, clean, and unchanged.",
    ].join("\n");
  }

  if (preset === "restore") {
    const mode = readOption(options, "restoreMode") || "all-purpose restoration";
    return [
      "Dedicated restoration tool.",
      `Restoration mode: ${mode}.`,
      "Improve clarity, clean visual defects, reduce haze/noise, and repair aged-photo artifacts.",
      "Preserve original identity, pose, clothing, scene layout, readable details, and historical character.",
      "Avoid plastic smoothing, overprocessing, or inventing unrelated content.",
    ].join("\n");
  }

  if (preset === "sticker") {
    const stickerStyle = readOption(options, "stickerStyle") || "premium outlined cutout";
    return [
      "Dedicated sticker/cutout tool.",
      `Sticker style: ${stickerStyle}.`,
      "Create a clean premium sticker result with polished edge treatment and strong subject readability.",
      "Preserve the selected subject identity and avoid changing the subject interior.",
    ].join("\n");
  }

  const edge = readOption(options, "edgeHandling") || "fine-edge preserving";
  return [
    "Dedicated transparent background tool.",
    `Edge handling: ${edge}.`,
    "Isolate the main subject cleanly and preserve hair, fur, fabric, transparent materials, and fine boundaries where possible.",
    "Keep the subject interior unchanged and avoid cutting into important details.",
  ].join("\n");
}
