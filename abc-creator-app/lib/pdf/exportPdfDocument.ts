import { readdir, readFile } from "fs/promises";
import { join } from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

type NodeSpec = { id?: string; label?: string; level?: number };
type EdgeSpec = { from?: string; to?: string; source?: string; target?: string; label?: string };
type FlowSpec = { from?: string; to?: string; value?: number; label?: string };
type EntitySpec = { id?: string; name?: string; label?: string; fields?: string[] };

type DiagramSpec = {
  type?: string;
  title?: string;
  caption?: string;
  nodes?: Array<string | NodeSpec>;
  edges?: Array<[string, string, string?] | EdgeSpec>;
  flows?: Array<[string, string, number?] | FlowSpec>;
  entities?: EntitySpec[];
  data?: {
    nodes?: Array<string | NodeSpec>;
    edges?: Array<[string, string, string?] | EdgeSpec>;
    flows?: Array<[string, string, number?] | FlowSpec>;
    entities?: EntitySpec[];
  };
};

type Node = { id: string; label: string; level?: number };
type Edge = { from: string; to: string; label?: string };

type PdfExportImage = {
  dataUrl: string;
  alt?: string;
  frame?: string;
};

type PdfBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][]; header: boolean }
  | { type: "diagram"; spec: DiagramSpec }
  | { type: "image"; alt?: string };

type PdfFontSet = {
  regular: PDFFont;
  bold: PDFFont;
  devanagariRegular?: PDFFont;
  devanagariBold?: PDFFont;
  arabicRegular?: PDFFont;
  arabicBold?: PDFFont;
};

const FONT_PACKAGE_DIRS = {
  "@fontsource/noto-sans-devanagari": join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans-devanagari",
    "files"
  ),
  "@fontsource/noto-naskh-arabic": join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-naskh-arabic",
    "files"
  ),
} as const;

const chartColors = [
  rgb(0.055, 0.647, 0.914),
  rgb(0.545, 0.361, 0.965),
  rgb(0.063, 0.725, 0.506),
  rgb(0.925, 0.282, 0.6),
  rgb(0.957, 0.62, 0.043),
  rgb(0.231, 0.51, 0.965),
  rgb(0.937, 0.267, 0.267),
  rgb(0.078, 0.722, 0.651),
];

function titleFromName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanText(value: string) {
  return value
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
    const filesDir = FONT_PACKAGE_DIRS[packageName as keyof typeof FONT_PACKAGE_DIRS];
    if (!filesDir) return undefined;

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

function text(value: unknown, fallback: string) {
  const result = String(value || "").trim();
  return result || fallback;
}

function safeLabel(value: string, max: number) {
  const cleaned = cleanText(value);
  return cleaned.length > max ? `${cleaned.slice(0, Math.max(1, max - 1))}…` : cleaned;
}

function getNodes(spec: DiagramSpec): Node[] {
  const raw = spec.nodes || spec.data?.nodes || [];
  const nodes = raw.map((node, index) => {
    if (typeof node === "string") return { id: text(node, `n${index}`), label: node };
    const id = text(node.id || node.label, `n${index}`);
    return { id, label: text(node.label || node.id, id), level: node.level };
  });

  getEdges(spec).forEach((edge) => {
    if (!nodes.some((node) => node.id === edge.from)) nodes.push({ id: edge.from, label: edge.from });
    if (!nodes.some((node) => node.id === edge.to)) nodes.push({ id: edge.to, label: edge.to });
  });

  return nodes.length ? nodes : [{ id: "core", label: spec.title || "Diagram" }];
}

function getEdges(spec: DiagramSpec): Edge[] {
  const raw = spec.edges || spec.data?.edges || [];
  return raw
    .map((edge) => {
      if (Array.isArray(edge)) {
        return { from: text(edge[0], ""), to: text(edge[1], ""), label: edge[2] ? String(edge[2]) : undefined };
      }

      return { from: text(edge.from || edge.source, ""), to: text(edge.to || edge.target, ""), label: edge.label };
    })
    .filter((edge) => edge.from && edge.to);
}

function parseDiagramSpec(raw: string): DiagramSpec | null {
  try {
    const parsed = JSON.parse(raw.trim()) as DiagramSpec;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isImageBlockHeading(line: string) {
  const normalized = line.replace(/^#{1,6}\s*/, "").trim();
  return /^image\s+\d+\s*:/i.test(normalized);
}

function parseInlineDiagram(line: string) {
  const match = /^abc-diagram\s*(\{[\s\S]*\})\s*$/i.exec(line.trim());
  if (!match) return null;
  return parseDiagramSpec(match[1]);
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^```abc-diagram\s*$/i.test(line)) {
      flushParagraph();
      flushList();
      const diagramLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) {
        diagramLines.push(lines[index]);
        index += 1;
      }

      const spec = parseDiagramSpec(diagramLines.join("\n"));
      if (spec) blocks.push({ type: "diagram", spec });
      continue;
    }

    const inlineDiagram = parseInlineDiagram(line);
    if (inlineDiagram) {
      flushParagraph();
      flushList();
      blocks.push({ type: "diagram", spec: inlineDiagram });
      continue;
    }

    if (isImageBlockHeading(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "image", alt: cleanText(line) });

      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim();
        if (!next) {
          index += 1;
          continue;
        }
        if (/^```abc-diagram\s*$/i.test(next) || (/^#{1,6}\s+/.test(next) && !isImageBlockHeading(next))) break;
        index += 1;
      }

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

function dataUrlToBuffer(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2], "base64") };
}

export async function makePdfExport(output: string, baseName: string, images: PdfExportImage[] = []) {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const pageSize: [number, number] = [612, 792];
  const margin = 42;
  const bottom = 50;
  const contentWidth = pageSize[0] - margin * 2;
  const black = rgb(0.05, 0.05, 0.06);
  const gray = rgb(0.82, 0.84, 0.89);
  const lightGray = rgb(0.965, 0.97, 0.985);
  const headerBg = rgb(0.96, 0.94, 1);
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - 70;
  let imageIndex = 0;

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
  const drawSmallText = (value: string, x: number, yPos: number, size = 7.5, width = 90, isBold = true) => {
    const lines = wrapLine(value, Math.max(8, Math.floor(width / (size * 0.52)))).slice(0, 2);
    lines.forEach((line, lineIndex) => {
      const selected = chooseFont(line, isBold, fonts);
      page.drawText(selected.text, { x, y: yPos - lineIndex * (size + 2), size, font: selected.font, color: black });
    });
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
  const drawImage = async (alt?: string) => {
    const image = images[imageIndex];
    imageIndex += 1;
    if (!image?.dataUrl) return;

    const decoded = dataUrlToBuffer(image.dataUrl);
    if (!decoded) return;

    try {
      const embedded = decoded.mimeType.includes("png")
        ? await pdf.embedPng(decoded.buffer)
        : await pdf.embedJpg(decoded.buffer);
      const fit = embedded.scaleToFit(contentWidth, 285);
      const framed = !String(image.frame || "boxed").toLowerCase().includes("borderless");
      const height = fit.height + (framed ? 22 : 10);
      ensure(height + 18);

      if (framed) {
        page.drawRectangle({ x: margin, y: y - fit.height - 18, width: contentWidth, height: fit.height + 18, color: rgb(1, 1, 1), borderColor: gray, borderWidth: 0.8 });
        page.drawImage(embedded, { x: margin + 9, y: y - fit.height - 9, width: fit.width - 18, height: fit.height });
      } else {
        page.drawImage(embedded, { x: margin, y: y - fit.height, width: fit.width, height: fit.height });
      }

      y -= height;
      const caption = cleanText(image.alt || alt || "");
      if (caption) drawText(caption, 7.5, false, 10);
      else y -= 10;
    } catch {
      // Skip unsupported or invalid image data rather than breaking the whole PDF export.
    }
  };
  const drawDiagram = (spec: DiagramSpec) => {
    const type = String(spec.type || "graph").toLowerCase();
    const nodes = getNodes(spec).slice(0, 10);
    const edges = getEdges(spec);
    const height = 220;
    const topPadding = 26;
    const cardX = margin;
    const cardY = y - height;
    const cardW = contentWidth;
    const cardH = height;
    ensure(cardH + 24);

    page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: rgb(1, 1, 1), borderColor: rgb(0.84, 0.82, 0.96), borderWidth: 0.9 });

    const title = safeLabel(spec.title || "Structured visual", 70);
    const selected = chooseFont(title, true, fonts);
    page.drawText(selected.text, { x: cardX + 16, y: y - 18, size: 10.5, font: selected.font, color: black });

    if (type.includes("sankey")) {
      const rawFlows = spec.flows || spec.data?.flows || [];
      const flows = rawFlows.length ? rawFlows : edges.map((edge) => ({ from: edge.from, to: edge.to, value: 1 }));
      const left = Array.from(new Set(flows.map((flow) => Array.isArray(flow) ? text(flow[0], "") : text(flow.from, "")))).slice(0, 5);
      const right = Array.from(new Set(flows.map((flow) => Array.isArray(flow) ? text(flow[1], "") : text(flow.to, "")))).slice(0, 5);
      const leftY = (index: number) => y - topPadding - 40 - index * 28;
      const rightY = (index: number) => y - topPadding - 40 - index * 28;

      flows.slice(0, 8).forEach((flow, index) => {
        const from = Array.isArray(flow) ? text(flow[0], "") : text(flow.from, "");
        const to = Array.isArray(flow) ? text(flow[1], "") : text(flow.to, "");
        const y1 = leftY(Math.max(0, left.indexOf(from)));
        const y2 = rightY(Math.max(0, right.indexOf(to)));
        const color = chartColors[index % chartColors.length];
        page.drawLine({ start: { x: cardX + 130, y: y1 }, end: { x: cardX + cardW - 130, y: y2 }, thickness: 4, color, opacity: 0.42 });
      });

      left.forEach((label, index) => {
        page.drawRectangle({ x: cardX + 16, y: leftY(index) - 10, width: 100, height: 20, color: lightGray, borderColor: chartColors[index % chartColors.length], borderWidth: 0.6 });
        drawSmallText(label, cardX + 22, leftY(index) - 2, 6.8, 88);
      });
      right.forEach((label, index) => {
        page.drawRectangle({ x: cardX + cardW - 116, y: rightY(index) - 10, width: 100, height: 20, color: lightGray, borderColor: chartColors[(index + 3) % chartColors.length], borderWidth: 0.6 });
        drawSmallText(label, cardX + cardW - 110, rightY(index) - 2, 6.8, 88);
      });
    } else if (type.includes("taxonomy") || type.includes("hierarchy") || type.includes("lineage") || type.includes("tree") || type.includes("dependency")) {
      const cx = cardX + cardW / 2;
      const cy = y - 118;
      const radius = 64;
      nodes.slice(0, 8).forEach((node, index) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(nodes.length, 1);
        const x = cx + Math.cos(angle) * radius;
        const yy = cy + Math.sin(angle) * radius;
        const lx = cx + Math.cos(angle) * (radius + 32);
        const ly = cy + Math.sin(angle) * (radius + 32);
        page.drawLine({ start: { x: cx, y: cy }, end: { x, y: yy }, thickness: 0.7, color: gray });
        page.drawCircle({ x, y: yy, size: 6, color: chartColors[index % chartColors.length] });
        drawSmallText(node.label, lx - 36, ly + 4, 6.7, 72);
      });
      page.drawCircle({ x: cx, y: cy, size: 8, color: rgb(0.545, 0.361, 0.965) });
    } else {
      const baseY = cardY + 46;
      const chartTop = y - 58;
      const points = nodes.map((node, index) => {
        const x = cardX + 34 + (index * (cardW - 68)) / Math.max(nodes.length - 1, 1);
        const value = 36 + ((index * 29 + node.label.length * 7) % 76);
        const yy = baseY + value;
        return { node, x, y: yy };
      });

      for (let index = 0; index < 5; index += 1) {
        const gy = baseY + index * 28;
        page.drawLine({ start: { x: cardX + 24, y: gy }, end: { x: cardX + cardW - 24, y: gy }, thickness: 0.35, color: gray, opacity: 0.5 });
      }

      points.forEach((point, index) => {
        if (index > 0) page.drawLine({ start: { x: points[index - 1].x, y: points[index - 1].y }, end: { x: point.x, y: point.y }, thickness: 2, color: rgb(0.545, 0.361, 0.965) });
        page.drawLine({ start: { x: point.x, y: baseY }, end: { x: point.x, y: point.y }, thickness: 3, color: chartColors[index % chartColors.length], opacity: 0.35 });
        page.drawCircle({ x: point.x, y: point.y, size: 5, color: chartColors[index % chartColors.length] });
        drawSmallText(point.node.label, point.x - 34, chartTop + (index % 2 ? 0 : 18), 6.6, 68);
      });
    }

    y -= cardH + 22;
  };

  drawText("ABC Creator Export", 8, true, 5);
  drawText(titleFromName(baseName), 18, true, 8);
  drawRule();

  for (const block of parseBlocks(output)) {
    if (block.type === "heading") {
      addVerticalSpace(8);
      drawText(block.text, block.level === 1 ? 15 : block.level === 2 ? 13 : 11, true, 10);
    } else if (block.type === "paragraph") {
      drawText(block.text, 10, false, 7);
    } else if (block.type === "list") {
      block.items.forEach((item) => drawText(`• ${item}`, 10, false, 4, 12));
      y -= 6;
    } else if (block.type === "table") {
      drawTable(block.rows, block.header);
    } else if (block.type === "diagram") {
      drawDiagram(block.spec);
    } else {
      await drawImage(block.alt);
    }
  }

  return pdf.save();
}
