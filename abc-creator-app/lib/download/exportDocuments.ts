export type OutputDownloadFormat = "txt" | "docx" | "pdf";

type ExportBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][]; header: boolean };

const encoder = new TextEncoder();

function sanitizeFileName(value: string) {
  return (value || "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
}

function titleFromBaseName(baseName: string) {
  return baseName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^>\s?/gm, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlEscape(value: string) {
  return htmlEscape(value).replace(/'/g, "&apos;");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function getRenderedHtml(output: string, renderedElement?: HTMLElement | null) {
  if (renderedElement?.innerHTML?.trim()) return renderedElement.innerHTML;
  return `<pre>${htmlEscape(output)}</pre>`;
}

function textFromElement(element: Element) {
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function tableRowsFromElement(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));
  const header = rows[0]
    ? Array.from(rows[0].children).some((cell) => cell.tagName === "TH")
    : false;

  return {
    header,
    rows: rows
      .map((row) =>
        Array.from(row.children)
          .filter((cell) => ["TD", "TH"].includes(cell.tagName))
          .map((cell) => textFromElement(cell))
      )
      .filter((row) => row.length),
  };
}

function collectBlocks(parent: Element, blocks: ExportBlock[] = []) {
  Array.from(parent.children).forEach((element) => {
    const tag = element.tagName;

    if (tag === "TABLE") {
      const table = tableRowsFromElement(element as HTMLTableElement);
      if (table.rows.length) blocks.push({ type: "table", ...table });
      return;
    }

    const nestedTable = element.querySelector("table");
    if (nestedTable && !element.closest("table")) {
      const table = tableRowsFromElement(nestedTable as HTMLTableElement);
      if (table.rows.length) blocks.push({ type: "table", ...table });
      return;
    }

    if (tag === "H1" || tag === "H2" || tag === "H3") {
      const text = textFromElement(element);
      if (text) blocks.push({ type: "heading", level: tag === "H1" ? 1 : tag === "H2" ? 2 : 3, text });
      return;
    }

    if (tag === "P" || tag === "BLOCKQUOTE" || tag === "PRE") {
      const text = textFromElement(element);
      if (text) blocks.push({ type: "paragraph", text });
      return;
    }

    if (tag === "UL" || tag === "OL") {
      const items = Array.from(element.querySelectorAll("li")).map(textFromElement).filter(Boolean);
      if (items.length) blocks.push({ type: "list", items });
      return;
    }

    if (!element.closest("table")) collectBlocks(element, blocks);
  });

  return blocks;
}

function parseRenderedBlocks(renderedHtml: string, fallbackOutput: string) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderedHtml;
  const blocks = collectBlocks(wrapper);

  if (blocks.length) return blocks;

  return markdownToPlainText(fallbackOutput)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text): ExportBlock => ({ type: "paragraph", text }));
}

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let current = index;
    for (let bit = 0; bit < 8; bit++) current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    table[index] = current >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime() {
  const now = new Date();
  const year = Math.max(now.getFullYear(), 1980);
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  return { dosTime, dosDate };
}

function concatArrays(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function createZip(files: Array<{ name: string; content: string }>) {
  const { dosTime, dosDate } = getDosDateTime();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatArrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);
  return concatArrays([...localParts, centralDirectory, endRecord]);
}

function wordRun(text: string, bold = false) {
  const clean = text.trim();
  if (!clean) return "";
  return `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEscape(clean)}</w:t></w:r>`;
}

function wordParagraph(text: string, kind: "title" | "heading" | "normal" | "list" = "normal") {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";
  const size = kind === "title" ? 44 : kind === "heading" ? 30 : 22;
  const bold = kind === "title" || kind === "heading";
  const indent = kind === "list" ? '<w:ind w:left="720"/>' : "";
  return `<w:p><w:pPr>${indent}</w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:color w:val="101116"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cleanText)}</w:t></w:r></w:p>`;
}

function tableToWordXml(rows: string[][], header: boolean) {
  if (!rows.length) return "";
  const tableRows = rows
    .map((row, rowIndex) => {
      const tableCells = row
        .map((cell) => {
          const isHeader = header && rowIndex === 0;
          const shade = isHeader ? '<w:shd w:fill="F4F0FF"/>' : "";
          return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="D9DCE7"/><w:left w:val="single" w:sz="4" w:color="D9DCE7"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE7"/><w:right w:val="single" w:sz="4" w:color="D9DCE7"/></w:tcBorders>${shade}</w:tcPr><w:p>${wordRun(cell, isHeader)}</w:p></w:tc>`;
        })
        .join("");
      return `<w:tr>${tableCells}</w:tr>`;
    })
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9DCE7"/><w:left w:val="single" w:sz="4" w:color="D9DCE7"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE7"/><w:right w:val="single" w:sz="4" w:color="D9DCE7"/><w:insideH w:val="single" w:sz="4" w:color="D9DCE7"/><w:insideV w:val="single" w:sz="4" w:color="D9DCE7"/></w:tblBorders></w:tblPr>${tableRows}</w:tbl>`;
}

function blocksToWordBody(blocks: ExportBlock[], title: string) {
  const parts = [wordParagraph(title, "title")];
  blocks.forEach((block) => {
    if (block.type === "heading") parts.push(wordParagraph(block.text, "heading"));
    else if (block.type === "paragraph") parts.push(wordParagraph(block.text));
    else if (block.type === "list") block.items.forEach((item) => parts.push(wordParagraph(`• ${item}`, "list")));
    else parts.push(tableToWordXml(block.rows, block.header));
  });
  return parts.join("");
}

function buildDocxBlob(blocks: ExportBlock[], title: string) {
  const body = blocksToWordBody(blocks, title);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  return new Blob([createZip([{ name: "[Content_Types].xml", content: contentTypes }, { name: "_rels/.rels", content: rels }, { name: "word/document.xml", content: documentXml }])], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function normalizePdfText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function wrapPdfText(text: string, maxChars: number) {
  const clean = normalizePdfText(text).replace(/\s+/g, " ").trim();
  if (!clean) return [""];
  const lines: string[] = [];
  let current = "";
  clean.split(/\s+/).forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else if (candidate.length > maxChars) {
      for (let index = 0; index < candidate.length; index += maxChars) lines.push(candidate.slice(index, index + maxChars));
      current = "";
    } else current = candidate;
  });
  if (current) lines.push(current);
  return lines;
}

async function buildPdfBlob(blocks: ExportBlock[], title: string) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 46;
  const bottomLimit = 52;
  const contentWidth = pageSize[0] - margin * 2;
  let page = pdfDoc.addPage(pageSize);
  let y = pageSize[1] - 46;
  const black = rgb(0.05, 0.05, 0.06);
  const border = rgb(0.82, 0.84, 0.89);

  const addPage = () => {
    page = pdfDoc.addPage(pageSize);
    y = pageSize[1] - 46;
  };
  const ensureSpace = (height: number) => {
    if (y - height < bottomLimit) addPage();
  };
  const drawText = (text: string, options: { size?: number; bold?: boolean; indent?: number; before?: number; after?: number } = {}) => {
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const lineHeight = Math.max(size + 3, 12);
    const maxChars = Math.max(22, Math.floor((contentWidth - indent) / (size * 0.52)));
    const lines = wrapPdfText(text, maxChars);
    ensureSpace((options.before ?? 0) + lines.length * lineHeight + (options.after ?? 0));
    y -= options.before ?? 0;
    lines.forEach((line) => {
      page.drawText(line, { x: margin + indent, y, size, font: options.bold ? boldFont : regularFont, color: black });
      y -= lineHeight;
    });
    y -= options.after ?? 0;
  };
  const drawRule = () => {
    ensureSpace(16);
    page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: border });
    y -= 16;
  };
  const drawTable = (rows: string[][], header: boolean) => {
    if (!rows.length) return;
    const columnCount = Math.max(...rows.map((row) => row.length));
    const baseWidths = columnCount === 7 ? [34, 112, 86, 76, 86, 58, 96] : Array.from({ length: columnCount }, () => contentWidth / columnCount);
    const widthTotal = baseWidths.reduce((sum, width) => sum + width, 0);
    const widths = baseWidths.map((width) => (width / widthTotal) * contentWidth);
    y -= 4;
    rows.forEach((row, rowIndex) => {
      const isHeader = header && rowIndex === 0;
      const size = isHeader ? 7.4 : 7.2;
      const lineHeight = 9.5;
      const wrappedCells = widths.map((width, columnIndex) => wrapPdfText(row[columnIndex] ?? "", Math.max(7, Math.floor((width - 8) / (size * 0.52)))));
      const rowHeight = Math.max(22, Math.max(...wrappedCells.map((lines) => lines.length)) * lineHeight + 10);
      ensureSpace(rowHeight + 8);
      let x = margin;
      const top = y;
      const bottomY = top - rowHeight;
      wrappedCells.forEach((lines, columnIndex) => {
        const width = widths[columnIndex];
        page.drawRectangle({ x, y: bottomY, width, height: rowHeight, borderWidth: 0.6, borderColor: border, color: isHeader ? rgb(0.96, 0.94, 1) : rgb(1, 1, 1) });
        lines.forEach((line, lineIndex) => {
          page.drawText(line, { x: x + 4, y: top - 12 - lineIndex * lineHeight, size, font: isHeader ? boldFont : regularFont, color: black });
        });
        x += width;
      });
      y -= rowHeight;
    });
    y -= 12;
  };

  try {
    const response = await fetch("/abc-logo.png");
    if (response.ok) {
      const logo = await pdfDoc.embedPng(await response.arrayBuffer());
      const logoWidth = 86;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      page.drawImage(logo, { x: margin, y: pageSize[1] - logoHeight - 18, width: logoWidth, height: logoHeight });
      y -= logoHeight + 20;
    }
  } catch {
    y -= 8;
  }

  drawText("ABC Creator Export", { size: 8, bold: true, after: 6 });
  drawText(title, { size: 18, bold: true, after: 8 });
  drawRule();
  blocks.forEach((block) => {
    if (block.type === "heading") drawText(block.text, { size: block.level === 1 ? 16 : block.level === 2 ? 13 : 11, bold: true, before: 6, after: 6 });
    else if (block.type === "paragraph") drawText(block.text, { size: 10, after: 5 });
    else if (block.type === "list") block.items.forEach((item) => drawText(`• ${item}`, { size: 10, indent: 12, after: 3 }));
    else drawTable(block.rows, block.header);
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  return new Blob([pdfBuffer], { type: "application/pdf" });
}

export async function downloadOutput(
  format: OutputDownloadFormat,
  output: string,
  fileBaseName = "abc-creator-output",
  renderedElement?: HTMLElement | null
) {
  const baseName = sanitizeFileName(fileBaseName);
  const title = titleFromBaseName(baseName);
  await new Promise((resolve) => window.setTimeout(resolve, 0));

  if (format === "txt") {
    downloadBlob(new Blob([markdownToPlainText(output)], { type: "text/plain;charset=utf-8" }), `${baseName}.txt`);
    return;
  }

  const blocks = parseRenderedBlocks(getRenderedHtml(output, renderedElement), output);
  if (format === "docx") {
    downloadBlob(buildDocxBlob(blocks, title), `${baseName}.docx`);
    return;
  }

  downloadBlob(await buildPdfBlob(blocks, title), `${baseName}.pdf`);
}
