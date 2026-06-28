import { NextResponse } from "next/server";
import { makePdfExport } from "@/lib/pdf/exportPdfDocument";

export const runtime = "nodejs";

type PdfExportImage = {
  dataUrl: string;
  alt?: string;
  frame?: string;
};

function safeName(value: unknown) {
  return (typeof value === "string" ? value : "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
}

function parseImages(value: unknown): PdfExportImage[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    const images: PdfExportImage[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;

      const image = item as Record<string, unknown>;
      const dataUrl = typeof image.dataUrl === "string" ? image.dataUrl : "";
      if (!dataUrl.startsWith("data:image/")) continue;

      const nextImage: PdfExportImage = { dataUrl };
      if (typeof image.alt === "string") nextImage.alt = image.alt;
      if (typeof image.frame === "string") nextImage.frame = image.frame;
      images.push(nextImage);
    }

    return images;
  } catch {
    return [];
  }
}

async function readRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      output: typeof body.output === "string" ? body.output : "",
      fileBaseName: typeof body.fileBaseName === "string" ? body.fileBaseName : "abc-creator-output",
      images: parseImages(body.images),
    };
  }

  const formData = await request.formData();
  const output = formData.get("output");
  const fileBaseName = formData.get("fileBaseName");
  const images = formData.get("images");

  return {
    output: typeof output === "string" ? output : "",
    fileBaseName: typeof fileBaseName === "string" ? fileBaseName : "abc-creator-output",
    images: parseImages(images),
  };
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const output = body.output;
    const baseName = safeName(body.fileBaseName);

    if (!output.trim()) return NextResponse.json({ error: "No output provided." }, { status: 400 });

    const pdfBytes = await makePdfExport(output, baseName, body.images);
    const pdfBody = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer;

    return new NextResponse(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "PDF export failed.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
