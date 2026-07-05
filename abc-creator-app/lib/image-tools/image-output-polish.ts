import sharp from "sharp";
import { getImageDimensions, type ImageAspectRatio, type ImageResolution } from "./image-models";

export type OutputPolishMode = "generate" | "edit";

export type PolishedImageDataUrl = {
  dataUrl: string;
  width?: number;
  height?: number;
  mimeType?: string;
  polished: boolean;
};

function parseImageDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;

  const mimeType = match[1] || "image/png";
  const base64 = match[2] || "";
  if (!base64) return null;

  return {
    mimeType: mimeType.toLowerCase(),
    buffer: Buffer.from(base64, "base64"),
  };
}

export async function polishImageDataUrl(
  dataUrl: string,
  mode: OutputPolishMode,
  target?: { resolution: ImageResolution; aspectRatio: ImageAspectRatio }
): Promise<PolishedImageDataUrl> {
  const parsed = parseImageDataUrl(dataUrl);

  if (!parsed || !parsed.buffer.length) {
    return { dataUrl, polished: false };
  }

  try {
    const sharpen = mode === "edit"
      ? { sigma: 0.35, m1: 0.35, m2: 1.1 }
      : { sigma: 0.45, m1: 0.45, m2: 1.35 };

    let pipeline = sharp(parsed.buffer).rotate();

    if (target) {
      const { width, height } = getImageDimensions(target.resolution, target.aspectRatio);
      pipeline = pipeline.resize({
        width,
        height,
        fit: "cover",
        position: sharp.strategy.attention,
        withoutEnlargement: false,
      });
    }

    const { data, info } = await pipeline
      .sharpen(sharpen)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer({ resolveWithObject: true });

    return {
      dataUrl: `data:image/png;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
      mimeType: "image/png",
      polished: true,
    };
  } catch {
    return { dataUrl, polished: false };
  }
}
