import sharp from "sharp";

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

  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function polishImageDataUrl(dataUrl: string, mode: OutputPolishMode): Promise<PolishedImageDataUrl> {
  const parsed = parseImageDataUrl(dataUrl);

  if (!parsed || !parsed.buffer.length) {
    return { dataUrl, polished: false };
  }

  try {
    const sharpen = mode === "edit"
      ? { sigma: 0.35, m1: 0.35, m2: 1.1 }
      : { sigma: 0.45, m1: 0.45, m2: 1.35 };

    const { data, info } = await sharp(parsed.buffer)
      .rotate()
      .sharpen(sharpen)
      .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 7 })
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
