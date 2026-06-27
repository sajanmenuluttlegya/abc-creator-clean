import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

function safeName(value: unknown) {
  return (typeof value === "string" ? value : "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
}

function titleFromName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .trim();
}

function wrapLine(line: string, maxChars: number) {
  const text = cleanText(line).replace(/\s+/g, " ").trim();
  if (!text) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else if (next.length > maxChars) {
      for (let index = 0; index < next.length; index += maxChars) lines.push(next.slice(index, index + maxChars));
      current = "";
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

async function makePdf(output: string, baseName: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 46;
  const bottom = 52;
  const black = rgb(0.05, 0.05, 0.06);
  const gray = rgb(0.82, 0.84, 0.89);
  let page = pdf.addPage(pageSize);
  let y = 730;

  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = 746;
  };

  const draw = (text: string, size = 10, isBold = false, after = 4) => {
    const maxChars = Math.max(32, Math.floor((pageSize[0] - margin * 2) / (size * 0.52)));
    const lines = wrapLine(text, maxChars);
    const lineHeight = Math.max(size + 3, 12);

    for (const line of lines) {
      if (y < bottom) newPage();
      page.drawText(line, { x: margin, y, size, font: isBold ? bold : regular, color: black });
      y -= lineHeight;
    }

    y -= after;
  };

  draw("ABC Creator Export", 8, true, 6);
  draw(titleFromName(baseName), 18, true, 8);
  page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: gray });
  y -= 16;

  for (const rawLine of output.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      y -= 5;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) draw(cleanText(heading[2]), heading[1].length === 1 ? 15 : 12, true, 7);
    else draw(line, 10, false, 5);
  }

  return pdf.save();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const output = typeof body.output === "string" ? body.output : "";
    const baseName = safeName(body.fileBaseName);

    if (!output.trim()) return NextResponse.json({ error: "No output provided." }, { status: 400 });

    const pdfBytes = await makePdf(output, baseName);

    return new NextResponse(pdfBytes, {
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
