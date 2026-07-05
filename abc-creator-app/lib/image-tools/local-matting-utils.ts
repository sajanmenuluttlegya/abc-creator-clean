import sharp from "sharp";

function dataUrl(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export async function transparentPngResult(input: Buffer) {
  const output = await sharp(input).rotate().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  const meta = await sharp(output).metadata();
  return { dataUrl: dataUrl(output), buffer: output, width: meta.width, height: meta.height };
}

export async function backgroundBlurResult(input: Buffer, blur = 14) {
  const meta = await sharp(input).metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1024;
  const output = await sharp(input).rotate().blur(Math.min(30, Math.max(6, Number(blur) || 14))).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  const outputMeta = await sharp(output).metadata();
  return { dataUrl: dataUrl(output), buffer: output, width: outputMeta.width || width, height: outputMeta.height || height };
}
