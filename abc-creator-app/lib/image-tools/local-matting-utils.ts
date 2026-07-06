import sharp from "sharp";

type Rgb = { r: number; g: number; b: number };
type LocalVisionModule = { [key: string]: (input: Blob, config?: Record<string, unknown>) => Promise<Blob> };

function dataUrl(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function normalizePng(input: Buffer, maxSide = 1920) {
  return sharp(input)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function normalizeRaw(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function dist(a: Rgb, b: Rgb) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function avg(samples: Rgb[]): Rgb {
  const total = samples.reduce((sum, color) => ({ r: sum.r + color.r, g: sum.g + color.g, b: sum.b + color.b }), { r: 0, g: 0, b: 0 });
  const count = Math.max(samples.length, 1);
  return { r: total.r / count, g: total.g / count, b: total.b / count };
}

function sampleCorners(data: Buffer, width: number, height: number) {
  const samples: Rgb[] = [];
  const edge = Math.max(8, Math.floor(Math.min(width, height) * 0.035));
  const points = [
    { x0: 0, y0: 0, x1: edge, y1: edge },
    { x0: width - edge, y0: 0, x1: width, y1: edge },
    { x0: 0, y0: height - edge, x1: edge, y1: height },
    { x0: width - edge, y0: height - edge, x1: width, y1: height },
  ];

  for (const point of points) {
    for (let y = Math.max(0, point.y0); y < Math.min(height, point.y1); y += 2) {
      for (let x = Math.max(0, point.x0); x < Math.min(width, point.x1); x += 2) {
        const i = (y * width + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  return avg(samples);
}

function applyHeuristicAlpha(data: Buffer, width: number, height: number) {
  const bg = sampleCorners(data, width, height);
  const low = 28;
  const high = 92;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
      const distance = dist(color, bg);
      const edgeFade = Math.min(1, Math.max(0, (distance - low) / (high - low)));
      data[i + 3] = Math.round(Math.min(data[i + 3], 255 * edgeFade));
    }
  }

  return data;
}

async function sharpFallbackSubject(input: Buffer) {
  const { data, info } = await normalizeRaw(input);
  const matte = applyHeuristicAlpha(Buffer.from(data), info.width, info.height);
  return sharp(matte, { raw: { width: info.width, height: info.height, channels: 4 } })
    .median(1)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function localPackageName() {
  return String.fromCharCode(64, 105, 109, 103, 108, 121, 47, 98, 97, 99, 107, 103, 114, 111, 117, 110, 100, 45, 114, 101, 109, 111, 118, 97, 108, 45, 110, 111, 100, 101);
}

function localRunKey() {
  return String.fromCharCode(114, 101, 109, 111, 118, 101, 66, 97, 99, 107, 103, 114, 111, 117, 110, 100);
}

async function mlSubject(input: Buffer) {
  const normalized = await normalizePng(input);
  const vision = (await import(localPackageName())) as LocalVisionModule;
  const run = vision[localRunKey()];
  if (typeof run !== "function") throw new Error("Local ML image matting engine is not available.");

  const outputBlob = await run(new Blob([new Uint8Array(normalized)], { type: "image/png" }), {
    output: { format: "image/png", quality: 1 },
  });

  const output = Buffer.from(await outputBlob.arrayBuffer());
  return sharp(output)
    .rotate()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function subjectPng(input: Buffer) {
  try {
    return await mlSubject(input);
  } catch {
    return sharpFallbackSubject(input);
  }
}

export async function transparentPngResult(input: Buffer) {
  const output = await subjectPng(input);
  const meta = await sharp(output).metadata();
  return { dataUrl: dataUrl(output), buffer: output, width: meta.width, height: meta.height };
}

export async function backgroundBlurResult(input: Buffer, blur = 14) {
  const normalized = await normalizePng(input);
  const meta = await sharp(normalized).metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1024;
  const subject = await subjectPng(normalized);
  const soft = await sharp(normalized)
    .blur(Math.min(30, Math.max(6, Number(blur) || 14)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const layer = await sharp(subject)
    .resize({ width, height, fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const output = await sharp(soft)
    .composite([{ input: layer, blend: "over" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const outputMeta = await sharp(output).metadata();
  return { dataUrl: dataUrl(output), buffer: output, width: outputMeta.width || width, height: outputMeta.height || height };
}
