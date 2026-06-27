import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type PdfBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][]; header: boolean };

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
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanText(cell));
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseBlocks(markdown: string): PdfBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: PdfBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = cleanText(paragraph.join(" "));
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      flushList();
      const rows = [splitTableRow(line)];
      index += 2;

      while (index < lines.length && lines[index].includes("|") && !isTableSeparator(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "table", rows, header: true });
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        text: cleanText(heading[2]),
      });
      continue;
    }

    const bullet = /^([-*•]|\d+\.)\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      listItems.push(cleanText(bullet[2]));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.length ? blocks : [{ type: "paragraph", text: cleanText(markdown) }];
}

function wrapLine(line: string, maxChars: number) {
  const text = cleanText(line);
  if (!text) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else if (next.length > maxChars) {
      for (let index = 0; index < next.length; index += maxChars) {
        lines.push(next.slice(index, index + maxChars));
      }
      current = "";
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

async function readLogoBytes() {
  const publicDir = path.join(process.cwd(), "public");
  const candidates = [
    path.join(publicDir, "abc-export-logo.png"),
    path.join(publicDir, "abc-logo.png"),
  ];

  for (const filePath of candidates) {
    try {
      return await readFile(filePath);
    } catch {
      // Try the next logo source.
    }
  }

  try {
    const base64 = await readFile(path.join(publicDir, "abc-export-logo.base64.txt"), "utf8");
    return Buffer.from(base64.trim(), "base64");
  } catch {
    return null;
  }
}

async function makePdf(output: string, baseName: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 42;
  const bottom = 50;
  const contentWidth = pageSize[0] - margin * 2;
  const black = rgb(0.05, 0.05, 0.06);
  const gray = rgb(0.82, 0.84, 0.89);
  const headerBg = rgb(0.96, 0.94, 1);
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - 42;

  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = pageSize[1] - 42;
  };

  const ensure = (height: number) => {
    if (y - height < bottom) newPage();
  };

  const drawText = (text: string, size = 10, isBold = false, after = 4, indent = 0) => {
    const maxChars = Math.max(18, Math.floor((contentWidth - indent) / (size * 0.52)));
    const lines = wrapLine(text, maxChars);
    const lineHeight = Math.max(size + 3, 12);
    ensure(lines.length * lineHeight + after);

    for (const line of lines) {
      page.drawText(line, {
        x: margin + indent,
        y,
        size,
        font: isBold ? bold : regular,
        color: black,
      });
      y -= lineHeight;
    }

    y -= after;
  };

  const drawRule = () => {
    ensure(16);
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageSize[0] - margin, y },
      thickness: 0.6,
      color: gray,
    });
    y -= 16;
  };

  const drawTable = (rows: string[][], hasHeader: boolean) => {
    if (!rows.length) return;

    const columnCount = Math.max(...rows.map((row) => row.length));
    const baseWidths =
      columnCount === 7
        ? [34, 114, 82, 76, 86, 50, 90]
        : Array.from({ length: columnCount }, () => contentWidth / columnCount);
    const total = baseWidths.reduce((sum, width) => sum + width, 0);
    const widths = baseWidths.map((width) => (width / total) * contentWidth);

    y -= 4;

    rows.forEach((row, rowIndex) => {
      const isHeader = hasHeader && rowIndex === 0;
      const size = isHeader ? 7.2 : 7;
      const lineHeight = 9.2;
      const wrappedCells = widths.map((width, columnIndex) => {
        const maxChars = Math.max(6, Math.floor((width - 8) / (size * 0.52)));
        return wrapLine(row[columnIndex] || "", maxChars);
      });
      const rowHeight = Math.max(
        22,
        Math.max(...wrappedCells.map((lines) => lines.length)) * lineHeight + 10
      );

      ensure(rowHeight + 8);

      let x = margin;
      const rowTop = y;
      const rowBottom = rowTop - rowHeight;

      wrappedCells.forEach((lines, columnIndex) => {
        const width = widths[columnIndex];
        page.drawRectangle({
          x,
          y: rowBottom,
          width,
          height: rowHeight,
          borderWidth: 0.55,
          borderColor: gray,
          color: isHeader ? headerBg : rgb(1, 1, 1),
        });

        lines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: x + 4,
            y: rowTop - 11 - lineIndex * lineHeight,
            size,
            font: isHeader ? bold : regular,
            color: black,
          });
        });

        x += width;
      });

      y -= rowHeight;
    });

    y -= 12;
  };

  try {
    const logoBytes = await readLogoBytes();
    if (logoBytes) {
      const logo = await pdf.embedPng(logoBytes);
      const logoWidth = 76;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const logoY = pageSize[1] - logoHeight - 22;
      page.drawImage(logo, { x: margin, y: logoY, width: logoWidth, height: logoHeight });
      y = logoY - 24;
    }
  } catch {
    y -= 4;
  }

  drawText("ABC Creator Export", 8, true, 5);
  drawText(titleFromName(baseName), 18, true, 8);
  drawRule();

  parseBlocks(output).forEach((block) => {
    if (block.type === "heading") {
      drawText(block.text, block.level === 1 ? 15 : block.level === 2 ? 13 : 11, true, 7);
    } else if (block.type === "paragraph") {
      drawText(block.text, 10, false, 5);
    } else if (block.type === "list") {
      block.items.forEach((item) => drawText(`• ${item}`, 10, false, 3, 12));
      y -= 4;
    } else {
      drawTable(block.rows, block.header);
    }
  });

  return pdf.save();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const output = typeof body.output === "string" ? body.output : "";
    const baseName = safeName(body.fileBaseName);

    if (!output.trim()) return NextResponse.json({ error: "No output provided." }, { status: 400 });

    const pdfBytes = await makePdf(output, baseName);
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
