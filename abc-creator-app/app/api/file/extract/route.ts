import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 58000;

type PdfParseResult = { text?: string };
type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;
type PdfParseImport = PdfParseFn | { default?: PdfParseFn };
type MammothResult = { value?: string };

function extensionOf(fileName: string) {
  const cleanName = fileName.toLowerCase().split("?")[0] || "";
  const index = cleanName.lastIndexOf(".");
  return index >= 0 ? cleanName.slice(index + 1) : "";
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function trimForGeneration(value: string) {
  const cleaned = cleanExtractedText(value);
  if (cleaned.length <= MAX_TEXT_CHARS) {
    return { text: cleaned, truncated: false };
  }

  return {
    text: `${cleaned.slice(0, MAX_TEXT_CHARS).trim()}\n\n[File was longer than ${MAX_TEXT_CHARS} characters, so only the first part was used. Paste a smaller section for deeper analysis.]`,
    truncated: true,
  };
}

function isPlainTextLike(extension: string, mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    ["txt", "md", "markdown", "csv", "json", "rtf", "html", "htm", "xml", "log"].includes(extension)
  );
}

async function extractPlainText(file: File) {
  return file.text();
}

async function extractDocx(buffer: Buffer) {
  const mammoth = (await import("mammoth")) as { extractRawText(input: { buffer: Buffer }): Promise<MammothResult> };
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractPdf(buffer: Buffer) {
  const pdfParseModule = (await import("pdf-parse")) as unknown as PdfParseImport;
  const pdfParse = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default;

  if (!pdfParse) {
    throw new Error("PDF extraction library did not load.");
  }

  const result = await pdfParse(buffer);
  return result.text || "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return Response.json({ ok: false, error: "Upload a PDF, DOCX, or text-based file." }, { status: 400 });
    }

    if (upload.size > MAX_FILE_BYTES) {
      return Response.json(
        { ok: false, error: "File is too large. Upload a file under 8 MB, or paste the most relevant text manually." },
        { status: 400 }
      );
    }

    const extension = extensionOf(upload.name);
    const mimeType = upload.type || "";
    let extracted = "";
    let sourceType = "text file";

    if (extension === "pdf" || mimeType === "application/pdf") {
      sourceType = "PDF file";
      extracted = await extractPdf(Buffer.from(await upload.arrayBuffer()));
    } else if (extension === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      sourceType = "DOCX file";
      extracted = await extractDocx(Buffer.from(await upload.arrayBuffer()));
    } else if (isPlainTextLike(extension, mimeType)) {
      extracted = await extractPlainText(upload);
    } else {
      return Response.json(
        { ok: false, error: "This file type cannot be read yet. Please upload PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG, or paste the text manually." },
        { status: 415 }
      );
    }

    const { text, truncated } = trimForGeneration(extracted);

    if (text.length < 20) {
      return Response.json(
        { ok: false, error: "Could not extract enough readable text from this file. If it is scanned or image-only, paste OCR text manually." },
        { status: 422 }
      );
    }

    return Response.json({ ok: true, text, fileName: upload.name, sourceType, truncated });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not read this file." },
      { status: 500 }
    );
  }
}
