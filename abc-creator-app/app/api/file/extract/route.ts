import { inflateRawSync } from "node:zlib";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 58000;
const MAX_ZIP_ENTRIES = 5000;
const MAX_ZIP_ENTRY_BYTES = 16 * 1024 * 1024;
const MAX_ZIP_TOTAL_BYTES = 32 * 1024 * 1024;

const ZIP_LOCAL_FILE = 0x04034b50;
const ZIP_CENTRAL_FILE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;

type PdfParseResult = { text?: string };
type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;
type PdfParseImport = PdfParseFn | { default?: PdfParseFn };
type MammothResult = { value?: string };
type ZipEntry = { method: number; flags: number; compressedSize: number; uncompressedSize: number; localHeaderOffset: number };

function extensionOf(fileName: string) {
  const cleanName = fileName.toLowerCase().split("?")[0] || "";
  const index = cleanName.lastIndexOf(".");
  return index >= 0 ? cleanName.slice(index + 1) : "";
}

function cleanExtractedText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function trimForGeneration(value: string) {
  const cleaned = cleanExtractedText(value);
  if (cleaned.length <= MAX_TEXT_CHARS) return { text: cleaned, truncated: false };
  return { text: `${cleaned.slice(0, MAX_TEXT_CHARS).trim()}\n\n[File was longer than ${MAX_TEXT_CHARS} characters, so only the first part was used. Paste a smaller section for deeper analysis.]`, truncated: true };
}

function isPlainTextLike(extension: string, mimeType: string) {
  return mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/xml" || ["txt", "md", "markdown", "csv", "json", "rtf", "html", "htm", "xml", "log"].includes(extension);
}

async function extractDocx(buffer: Buffer) {
  const mammoth = (await import("mammoth")) as { extractRawText(input: { buffer: Buffer }): Promise<MammothResult> };
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractPdf(buffer: Buffer) {
  const pdfParseModule = (await import("pdf-parse")) as unknown as PdfParseImport;
  const pdfParse = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default;
  if (!pdfParse) throw new Error("PDF extraction library did not load.");
  const result = await pdfParse(buffer);
  return result.text || "";
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function xmlText(xml: string) {
  return Array.from(xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)).map((match) => decodeXml(match[1] || "").trim()).filter(Boolean).join("\n");
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const minimumOffset = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error("The PPTX ZIP directory could not be found.");
}

function readZipDirectory(buffer: Buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount > MAX_ZIP_ENTRIES) throw new Error("The PPTX contains too many ZIP entries.");
  if (centralOffset + centralSize > buffer.length) throw new Error("The PPTX ZIP directory is invalid.");

  const entries = new Map<string, ZipEntry>();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== ZIP_CENTRAL_FILE) throw new Error("The PPTX ZIP directory is malformed.");
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length) throw new Error("The PPTX ZIP entry is truncated.");
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    entries.set(name, { method, flags, compressedSize, uncompressedSize, localHeaderOffset });
    cursor = end;
  }
  return entries;
}

function extractZipEntry(buffer: Buffer, entry: ZipEntry) {
  if (entry.flags & 0x1) throw new Error("Encrypted PPTX entries are not supported.");
  if (entry.uncompressedSize > MAX_ZIP_ENTRY_BYTES) throw new Error("A PPTX entry exceeds the safe extraction limit.");
  const offset = entry.localHeaderOffset;
  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== ZIP_LOCAL_FILE) throw new Error("A PPTX ZIP entry has an invalid local header.");
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataStart < 0 || dataEnd > buffer.length) throw new Error("A PPTX ZIP entry is truncated.");
  const compressed = buffer.subarray(dataStart, dataEnd);
  const output = entry.method === 0 ? Buffer.from(compressed) : entry.method === 8 ? inflateRawSync(compressed, { maxOutputLength: MAX_ZIP_ENTRY_BYTES }) : null;
  if (!output) throw new Error(`Unsupported PPTX ZIP compression method: ${entry.method}.`);
  if (output.length > MAX_ZIP_ENTRY_BYTES || (entry.uncompressedSize && output.length !== entry.uncompressedSize)) throw new Error("A PPTX ZIP entry failed size validation.");
  return output;
}

async function extractPptx(buffer: Buffer) {
  const entries = readZipDirectory(buffer);
  const slidePaths = Array.from(entries.keys()).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).sort((a, b) => Number(/slide(\d+)/i.exec(a)?.[1] || 0) - Number(/slide(\d+)/i.exec(b)?.[1] || 0));
  const sections: string[] = [];
  let extractedBytes = 0;
  for (const path of slidePaths) {
    const number = Number(/slide(\d+)/i.exec(path)?.[1] || sections.length + 1);
    const slideEntry = entries.get(path);
    if (!slideEntry) continue;
    const slideBuffer = extractZipEntry(buffer, slideEntry);
    extractedBytes += slideBuffer.length;
    if (extractedBytes > MAX_ZIP_TOTAL_BYTES) throw new Error("The PPTX exceeds the safe extraction limit.");
    const slideText = xmlText(slideBuffer.toString("utf8"));
    const notesPath = `ppt/notesSlides/notesSlide${number}.xml`;
    const notesEntry = entries.get(notesPath);
    let notesText = "";
    if (notesEntry) {
      const notesBuffer = extractZipEntry(buffer, notesEntry);
      extractedBytes += notesBuffer.length;
      if (extractedBytes > MAX_ZIP_TOTAL_BYTES) throw new Error("The PPTX exceeds the safe extraction limit.");
      notesText = xmlText(notesBuffer.toString("utf8"));
    }
    sections.push([`[Slide ${number}]`, slideText || "[No extractable slide text]", notesText ? `[Speaker notes]\n${notesText}` : ""].filter(Boolean).join("\n"));
  }
  if (!sections.length) throw new Error("The PPTX contained no readable slide XML.");
  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const upload = formData.get("file");
    if (!(upload instanceof File)) return Response.json({ ok: false, error: "Upload a PDF, DOCX, PPTX, or text-based file." }, { status: 400 });
    if (upload.size > MAX_FILE_BYTES) return Response.json({ ok: false, error: "File is too large. Upload a file under 8 MB, or paste the most relevant text manually." }, { status: 400 });

    const extension = extensionOf(upload.name);
    const mimeType = upload.type || "";
    const buffer = Buffer.from(await upload.arrayBuffer());
    let extracted = "";
    let sourceType = "text file";
    if (extension === "pdf" || mimeType === "application/pdf") { sourceType = "PDF file"; extracted = await extractPdf(buffer); }
    else if (extension === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { sourceType = "DOCX file"; extracted = await extractDocx(buffer); }
    else if (extension === "pptx" || mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") { sourceType = "PPTX presentation"; extracted = await extractPptx(buffer); }
    else if (isPlainTextLike(extension, mimeType)) extracted = await upload.text();
    else return Response.json({ ok: false, error: "This file type cannot be read yet. Upload PDF, DOCX, PPTX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG, or paste the text manually." }, { status: 415 });

    const { text, truncated } = trimForGeneration(extracted);
    if (text.length < 20) return Response.json({ ok: false, error: "Could not extract enough readable text from this file. If it is scanned or image-only, paste OCR text manually." }, { status: 422 });
    return Response.json({ ok: true, text, fileName: upload.name, sourceType, truncated });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not read this file." }, { status: 500 });
  }
}
