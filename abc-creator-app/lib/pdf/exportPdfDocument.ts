import { readdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { createRequire } from "module";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

const requireFromHere = createRequire(import.meta.url);

type PdfBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][]; header: boolean };

type PdfFontSet = {
  regular: PDFFont;
  bold: PDFFont;
  devanagariRegular?: PDFFont;
  devanagariBold?: PDFFont;
  arabicRegular?: PDFFont;
  arabicBold?: PDFFont;
};

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
    .replace(/\s+/g, " ")
    .trim();
}

function hasDevanagari(value: string) {
  return /[\u0900-\u097F]/.test(value);
}

function hasArabic(value: string) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value);
}

function hasUnsupportedStandardText(value: string) {
  return /[^\x09\x0A\x0D\x20-\xFF]/.test(value);
}

function safeStandardText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function filePriority(fileName: string) {
  if (/\.ttf$/i.test(fileName)) return 0;
  if (/\.otf$/i.test(fileName)) return 1;
  if (/\.woff$/i.test(fileName)) return 2;
  if (/\.woff2$/i.test(fileName)) return 3;
  return 4;
}

async function embedPackageFont(pdf: PDFDocument, packageName: string, termSets: string[][]) {
  try {
    const packagePath = requireFromHere.resolve(`${packageName}/package.json`);
    const filesDir = join(dirname(packagePath), "files");
    const files = await readdir(filesDir);

    for (const terms of termSets) {
      const matches = files
        .filter((file) => {
          const lower = file.toLowerCase();
          return /\.(ttf|otf|woff|woff2)$/i.test(lower) && terms.every((term) => lower.includes(term));
        })
        .sort((a, b) => filePriority(a) - filePriority(b));

      for (const file of matches) {
        try {
          return await pdf.embedFont(await readFile(join(filesDir, file)), { subset: true });
        } catch {
          // Try another file.
        }
      }
    }
  } catch {
    // Fall back to standard PDF fonts when package files cannot be read.
  }

  return undefined;
}

async function loadFonts(pdf: PDFDocument): Promise<PdfFontSet> {
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const devanagariRegular = await embedPackageFont(pdf, "@fontsource/noto-sans-devanagari", [
    ["devanagari", "400", "normal"],
    ["devanagari", "normal"],
    ["devanagari"],
  ]);
  const devanagariBold =
    (await embedPackageFont(pdf, "@fontsource/noto-sans-devanagari", [
      ["devanagari", "700", "normal"],
      ["devanagari", "bold"],
    ])) || devanagariRegular;
  const arabicRegular = await embedPackageFont(pdf, "@fontsource/noto-naskh-arabic", [
    ["arabic", "400", "normal"],
    ["arabic", "normal"],
    ["arabic"],
  ]);
  const arabicBold =
    (await embedPackageFont(pdf, "@fontsource/noto-naskh-arabic", [
      ["arabic", "700", "normal"],
      ["arabic", "bold"],
    ])) || arabicRegular;

  return { regular, bold, devanagariRegular, devanagariBold, arabicRegular, arabicBold };
}

function chooseFont(text: string, isBold: boolean, fonts: PdfFontSet) {
  if (hasDevanagari(text)) {
    const font = isBold ? fonts.devanagariBold : fonts.devanagariRegular;
    if (font) return { font, text };
  }

  if (hasArabic(text)) {
    const font = isBold ? fonts.arabicBold : fonts.arabicRegular;
    if (font) return { font, text };
  }

  if (hasUnsupportedStandardText(text)) {
    return { font: isBold ? fonts.bold : fonts.regular, text: safeStandardText(text) };
  }

  return { font: isBold ? fonts.bold : fonts.regular, text };
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
      for (let index = 0; index < next.length; index += maxChars) lines.push(next.slice(index, index + maxChars));
      current = "";
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function makePdfExport(output: string, baseName: string) {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const pageSize: [number, number] = [612, 792];
  const margin = 42;
  const bottom = 50;
  const contentWidth = pageSize[0] - margin * 2;
  const black = rgb(0.05, 0.05, 0.06);
  const gray = rgb(0.82, 0.84, 0.89);
  const headerBg = rgb(0.96, 0.94, 1);
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - 70;

  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = pageSize[1] - 42;
  };
  const ensure = (height: number) => {
    if (y - height < bottom) newPage();
  };
  const addVerticalSpace = (height: number) => {
    ensure(height + 2);
    y -= height;
  };
  const drawText = (text: string, size = 10, isBold = false, after = 4, indent = 0) => {
    const maxChars = Math.max(18, Math.floor((contentWidth - indent) / (size * 0.52)));
    const lines = wrapLine(text, maxChars);
    const lineHeight = Math.max(size + 3, 12);
    ensure(lines.length * lineHeight + after);

    for (const line of lines) {
      const selected = chooseFont(line, isBold, fonts);
      page.drawText(selected.text, { x: margin + indent, y, size, font: selected.font, color: black });
      y -= lineHeight;
    }

    y -= after;
  };
  const drawRule = () => {
    ensure(16);
    page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: gray });
    y -= 18;
  };
  const drawTable = (rows: string[][], hasHeader: boolean) => {
    if (!rows.length) return;
    const columnCount = Math.max(...rows.map((row) => row.length));
    const baseWidths = columnCount === 7 ? [34, 114, 82, 76, 86, 50, 90] : Array.from({ length: columnCount }, () => contentWidth / columnCount);
    const total = baseWidths.reduce((sum, width) => sum + width, 0);
    const widths = baseWidths.map((width) => (width / total) * contentWidth);
    y -= 4;

    rows.forEach((row, rowIndex) => {
      const isHeader = hasHeader && rowIndex === 0;
      const size = isHeader ? 7.2 : 7;
      const lineHeight = 9.2;
      const wrappedCells = widths.map((width, columnIndex) => wrapLine(row[columnIndex] || "", Math.max(6, Math.floor((width - 8) / (size * 0.52)))));
      const rowHeight = Math.max(22, Math.max(...wrappedCells.map((lines) => lines.length)) * lineHeight + 10);
      ensure(rowHeight + 8);
      let x = margin;
      const rowTop = y;
      const rowBottom = rowTop - rowHeight;

      wrappedCells.forEach((lines, columnIndex) => {
        const width = widths[columnIndex];
        page.drawRectangle({ x, y: rowBottom, width, height: rowHeight, borderWidth: 0.55, borderColor: gray, color: isHeader ? headerBg : rgb(1, 1, 1) });
        lines.forEach((line, lineIndex) => {
          const selected = chooseFont(line, isHeader, fonts);
          page.drawText(selected.text, { x: x + 4, y: rowTop - 11 - lineIndex * lineHeight, size, font: selected.font, color: black });
        });
        x += width;
      });

      y -= rowHeight;
    });

    y -= 26;
  };

  drawText("ABC Creator Export", 8, true, 5);
  drawText(titleFromName(baseName), 18, true, 8);
  drawRule();

  parseBlocks(output).forEach((block) => {
    if (block.type === "heading") {
      addVerticalSpace(8);
      drawText(block.text, block.level === 1 ? 15 : block.level === 2 ? 13 : 11, true, 10);
    } else if (block.type === "paragraph") {
      drawText(block.text, 10, false, 7);
    } else if (block.type === "list") {
      block.items.forEach((item) => drawText(`• ${item}`, 10, false, 4, 12));
      y -= 6;
    } else {
      drawTable(block.rows, block.header);
    }
  });

  return pdf.save();
}
