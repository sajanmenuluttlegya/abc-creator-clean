import { NextResponse } from "next/server";
import { makePdfExport } from "@/lib/pdf/exportPdfDocument";

export const runtime = "nodejs";

function safeName(value: unknown) {
  return (typeof value === "string" ? value : "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
}

async function readRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      output: typeof body.output === "string" ? body.output : "",
      fileBaseName: typeof body.fileBaseName === "string" ? body.fileBaseName : "abc-creator-output",
    };
  }

  const formData = await request.formData();
  const output = formData.get("output");
  const fileBaseName = formData.get("fileBaseName");

  return {
    output: typeof output === "string" ? output : "",
    fileBaseName: typeof fileBaseName === "string" ? fileBaseName : "abc-creator-output",
  };
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const output = body.output;
    const baseName = safeName(body.fileBaseName);

    if (!output.trim()) return NextResponse.json({ error: "No output provided." }, { status: 400 });

    const pdfBytes = await makePdfExport(output, baseName);
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
