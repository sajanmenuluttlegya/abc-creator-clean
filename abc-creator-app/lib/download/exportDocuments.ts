export type OutputDownloadFormat = "txt" | "docx" | "pdf";

type WordStyle = "title" | "heading1" | "heading2" | "normal" | "list";
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
    for (let bit = 0; bit < 8; bit++) {
      current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }
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
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatArrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return concatArrays([...localParts, centralDirectory, endRecord]);
}

function wordRun(text: string, bold = false) {
  const clean = text.trim();
  if (!clean) return "";
  return `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEscape(clean)}</w:t></w:r>`;
}

function wordParagraph(text: string, style: WordStyle = "normal") {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";

  const styleMap: Record<WordStyle, string> = {
    title: "Title",
    heading1: "Heading1",
    heading2: "Heading2",
    normal: "Normal",
    list: "Normal",
  };
  const indent = style === "list" ? '<w:ind w:left="720"/>' : "";
  const isBold = style !== "normal" && style !== "list";

  return `<w:p><w:pPr><w:pStyle w:val="${styleMap[style]}"/>${indent}</w:pPr>${wordRun(cleanText, isBold)}</w:p>`;
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

function renderedBlocksToWordBody(blocks: ExportBlock[], title: string) {
  const parts = [wordParagraph(title, "title")];

  blocks.forEach((block) => {
    if (block.type === "heading") {
      parts.push(wordParagraph(block.text, block.level === 1 ? "heading1" : "heading2"));
    } else if (block.type === "paragraph") {
      parts.push(wordParagraph(block.text, "normal"));
    } else if (block.type === "list") {
      block.items.forEach((item) => parts.push(wordParagraph(`• ${item}`, "list")));
    } else {
      parts.push(tableToWordXml(block.rows, block.header));
    }
  });

  parts.push(wordParagraph("Generated on demand. No output was stored by ABC Creator.", "normal"));
  return parts.join("");
}

function buildDocxBlob(blocks: ExportBlock[], title: string) {
  const body = renderedBlocksToWordBody(blocks, title);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:styles><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="101116"/></w:rPr></w:style></w:styles><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  return new Blob(
    [
      createZip([
        { name: "[Content_Types].xml", content: contentTypes },
        { name: "_rels/.rels", content: rels },
        { name: "word/document.xml", content: documentXml },
      ]),
    ],
    { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  );
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

function escapePdfString(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(line: string, maxChars: number) {
  const clean = normalizePdfText(line).replace(/\s+/g, " ").trim();
  if (!clean) return [""];

  const wrapped: string[] = [];
  let current = "";

  clean.split(/\s+/).forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > maxChars && current) {
      wrapped.push(current);
      current = word;
    } else if (candidate.length > maxChars) {
      for (let index = 0; index < candidate.length; index += maxChars) wrapped.push(candidate.slice(index, index + maxChars));
      current = "";
    } else {
      current = candidate;
    }
  });

  if (current) wrapped.push(current);
  return wrapped;
}

class PdfDocument {
  private readonly pageWidth = 612;
  private readonly pageHeight = 792;
  private readonly margin = 46;
  private readonly bottom = 52;
  private readonly contentWidth = this.pageWidth - this.margin * 2;
  private y = this.pageHeight - 52;
  private pages: string[][] = [];
  private current: string[] = [];

  constructor() {
    this.newPage();
  }

  private n(value: number) {
    return Number(value.toFixed(2));
  }

  private newPage() {
    this.current = [];
    this.pages.push(this.current);
    this.y = this.pageHeight - 52;
  }

  private ensureSpace(height: number) {
    if (this.y - height < this.bottom) this.newPage();
  }

  private fontName(bold = false) {
    return bold ? "F2" : "F1";
  }

  private textCommand(lines: string[], x: number, y: number, size: number, leading: number, bold = false) {
    const safeLines = lines.length ? lines : [""];
    this.current.push("BT");
    this.current.push(`/${this.fontName(bold)} ${size} Tf`);
    this.current.push(`${this.n(x)} ${this.n(y)} Td`);
    this.current.push(`${leading} TL`);
    safeLines.forEach((line, index) => {
      if (index === 0) this.current.push(`(${escapePdfString(line)}) Tj`);
      else this.current.push(`T* (${escapePdfString(line)}) Tj`);
    });
    this.current.push("ET");
  }

  addText(text: string, options: { size?: number; bold?: boolean; indent?: number; before?: number; after?: number } = {}) {
    const size = options.size ?? 10;
    const leading = Math.max(size + 3, 12);
    const x = this.margin + (options.indent ?? 0);
    const maxChars = Math.max(22, Math.floor((this.contentWidth - (options.indent ?? 0)) / (size * 0.52)));
    const lines = wrapText(text, maxChars);
    const height = (options.before ?? 0) + lines.length * leading + (options.after ?? 0);

    this.ensureSpace(height);
    this.y -= options.before ?? 0;
    this.textCommand(lines, x, this.y, size, leading, options.bold);
    this.y -= lines.length * leading + (options.after ?? 0);
  }

  addRule() {
    this.ensureSpace(18);
    this.current.push("0.82 0.84 0.89 RG");
    this.current.push(`0.6 w ${this.margin} ${this.n(this.y)} m ${this.pageWidth - this.margin} ${this.n(this.y)} l S`);
    this.y -= 18;
  }

  private drawRect(x: number, y: number, width: number, height: number, fill: boolean) {
    if (fill) this.current.push("0.96 0.94 1 rg");
    this.current.push("0.82 0.84 0.89 RG");
    this.current.push(`0.6 w ${this.n(x)} ${this.n(y)} ${this.n(width)} ${this.n(height)} re ${fill ? "B" : "S"}`);
    this.current.push("0 0 0 rg");
  }

  addTable(rows: string[][], header: boolean) {
    if (!rows.length) return;

    const columnCount = Math.max(...rows.map((row) => row.length));
    const baseWidths = columnCount === 7
      ? [34, 112, 86, 76, 86, 58, 96]
      : Array.from({ length: columnCount }, () => this.contentWidth / columnCount);
    const widthTotal = baseWidths.reduce((sum, width) => sum + width, 0);
    const widths = baseWidths.map((width) => (width / widthTotal) * this.contentWidth);

    this.y -= 4;

    rows.forEach((row, rowIndex) => {
      const isHeader = header && rowIndex === 0;
      const size = isHeader ? 7.4 : 7.2;
      const leading = 9.5;
      const wrappedCells = widths.map((width, columnIndex) => {
        const text = row[columnIndex] ?? "";
        const maxChars = Math.max(7, Math.floor((width - 8) / (size * 0.52)));
        return wrapText(text, maxChars);
      });
      const rowHeight = Math.max(22, Math.max(...wrappedCells.map((lines) => lines.length)) * leading + 10);

      this.ensureSpace(rowHeight + 6);

      let x = this.margin;
      const yTop = this.y;
      const yBottom = yTop - rowHeight;

      wrappedCells.forEach((lines, columnIndex) => {
        const width = widths[columnIndex];
        this.drawRect(x, yBottom, width, rowHeight, isHeader);
        this.textCommand(lines, x + 4, yTop - 12, size, leading, isHeader);
        x += width;
      });

      this.y -= rowHeight;
    });

    this.y -= 12;
  }

  build() {
    const objects: string[] = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    const kids: string[] = [];
    let nextObject = 5;

    this.pages.forEach((commands) => {
      const pageObject = nextObject++;
      const contentObject = nextObject++;
      kids.push(`${pageObject} 0 R`);
      const stream = commands.join("\n");

      objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`;
      objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    objects[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${this.pages.length} >>`;

    let pdf = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n";
    const offsets: number[] = [0];

    for (let objectId = 1; objectId < objects.length; objectId++) {
      offsets[objectId] = pdf.length;
      pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

    for (let objectId = 1; objectId < objects.length; objectId++) {
      pdf += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let index = 0; index < pdf.length; index++) bytes[index] = pdf.charCodeAt(index) & 0xff;
    return new Blob([bytes], { type: "application/pdf" });
  }
}

function buildPdfBlob(blocks: ExportBlock[], title: string) {
  const pdf = new PdfDocument();

  pdf.addText("ABC Creator Export", { size: 8, bold: true, after: 6 });
  pdf.addText(title, { size: 18, bold: true, after: 8 });
  pdf.addRule();

  blocks.forEach((block) => {
    if (block.type === "heading") {
      pdf.addText(block.text, {
        size: block.level === 1 ? 16 : block.level === 2 ? 13 : 11,
        bold: true,
        before: 6,
        after: 6,
      });
    } else if (block.type === "paragraph") {
      pdf.addText(block.text, { size: 10, after: 5 });
    } else if (block.type === "list") {
      block.items.forEach((item) => pdf.addText(`• ${item}`, { size: 10, indent: 12, after: 3 }));
      pdf.addText("", { size: 4, after: 2 });
    } else {
      pdf.addTable(block.rows, block.header);
    }
  });

  pdf.addRule();
  pdf.addText("Generated on demand. No output was stored by ABC Creator.", { size: 8, after: 0 });

  return pdf.build();
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

  downloadBlob(buildPdfBlob(blocks, title), `${baseName}.pdf`);
}
