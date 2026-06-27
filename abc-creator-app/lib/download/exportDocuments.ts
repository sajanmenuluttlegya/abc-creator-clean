export type OutputDownloadFormat = "txt" | "docx" | "pdf";

const encoder = new TextEncoder();

type WordStyle = "title" | "heading1" | "heading2" | "normal" | "list";

function sanitizeFileName(value: string) {
  return (value || "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
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

function getReadableLines(output: string, title: string) {
  const plain = markdownToPlainText(output);
  const lines = plain
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, all) => line.trim() || all[index - 1]?.trim());

  return [title, "", ...lines, "", "Generated on demand. No output was stored by ABC Creator."];
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

function textFromElement(element: Element) {
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function tableToWordXml(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows.length) return "";

  const tableRows = rows
    .map((row) => {
      const cells = Array.from(row.children).filter((cell) => ["TD", "TH"].includes(cell.tagName));
      const tableCells = cells
        .map((cell) => {
          const isHeader = cell.tagName === "TH";
          const shade = isHeader ? '<w:shd w:fill="F4F0FF"/>' : "";
          return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="D9DCE7"/><w:left w:val="single" w:sz="4" w:color="D9DCE7"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE7"/><w:right w:val="single" w:sz="4" w:color="D9DCE7"/></w:tcBorders>${shade}</w:tcPr><w:p>${wordRun(textFromElement(cell), isHeader)}</w:p></w:tc>`;
        })
        .join("");
      return `<w:tr>${tableCells}</w:tr>`;
    })
    .join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9DCE7"/><w:left w:val="single" w:sz="4" w:color="D9DCE7"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE7"/><w:right w:val="single" w:sz="4" w:color="D9DCE7"/><w:insideH w:val="single" w:sz="4" w:color="D9DCE7"/><w:insideV w:val="single" w:sz="4" w:color="D9DCE7"/></w:tblBorders></w:tblPr>${tableRows}</w:tbl>`;
}

function renderedHtmlToWordBody(renderedHtml: string, title: string) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderedHtml;
  const parts = [wordParagraph(title, "title")];

  wrapper.querySelectorAll("h1,h2,h3,p,li,blockquote,pre,table").forEach((element) => {
    if (element.closest("table") && element.tagName !== "TABLE") return;

    if (element.tagName === "TABLE") {
      parts.push(tableToWordXml(element as HTMLTableElement));
      return;
    }

    if (element.tagName === "H1") parts.push(wordParagraph(textFromElement(element), "heading1"));
    else if (element.tagName === "H2" || element.tagName === "H3") parts.push(wordParagraph(textFromElement(element), "heading2"));
    else if (element.tagName === "LI") parts.push(wordParagraph(`• ${textFromElement(element)}`, "list"));
    else parts.push(wordParagraph(textFromElement(element), "normal"));
  });

  parts.push(wordParagraph("Generated on demand. No output was stored by ABC Creator.", "normal"));
  return parts.join("");
}

function buildDocxBlob(renderedHtml: string, title: string) {
  const body = renderedHtmlToWordBody(renderedHtml, title);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:styles><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="101116"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="101116"/></w:rPr></w:style></w:styles><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  return new Blob(
    [createZip([{ name: "[Content_Types].xml", content: contentTypes }, { name: "_rels/.rels", content: rels }, { name: "word/document.xml", content: documentXml }])],
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
  const clean = normalizePdfText(line).trimEnd();
  if (!clean) return [""];

  const wrapped: string[] = [];
  let current = "";

  for (const word of clean.split(/\s+/)) {
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
  }

  if (current) wrapped.push(current);
  return wrapped;
}

function buildPdfBlob(output: string, title: string) {
  const rawLines = getReadableLines(output, title);
  const lines = rawLines.flatMap((line) => wrapText(line, 92));
  const pages: string[][] = [];

  for (let index = 0; index < Math.max(lines.length, 1); index += 48) {
    pages.push(lines.slice(index, index + 48));
  }

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";

  const kids: string[] = [];
  let nextObject = 4;

  pages.forEach((pageLines, pageIndex) => {
    const pageObject = nextObject++;
    const contentObject = nextObject++;
    kids.push(`${pageObject} 0 R`);

    const contentLines = [
      "BT",
      "/F1 10 Tf",
      "50 775 Td",
      "14 TL",
      ...pageLines.map((line, lineIndex) => {
        const text = lineIndex === 0 && pageIndex === 0 ? escapePdfString(line) : escapePdfString(line);
        return `(${text}) Tj T*`;
      }),
      "ET",
    ];
    const stream = contentLines.join("\n");

    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;

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

export async function downloadOutput(
  format: OutputDownloadFormat,
  output: string,
  fileBaseName = "abc-creator-output",
  renderedElement?: HTMLElement | null
) {
  const baseName = sanitizeFileName(fileBaseName);
  const title = baseName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  await new Promise((resolve) => window.setTimeout(resolve, 0));

  if (format === "txt") {
    downloadBlob(new Blob([markdownToPlainText(output)], { type: "text/plain;charset=utf-8" }), `${baseName}.txt`);
    return;
  }

  if (format === "docx") {
    downloadBlob(buildDocxBlob(getRenderedHtml(output, renderedElement), title), `${baseName}.docx`);
    return;
  }

  downloadBlob(buildPdfBlob(output, title), `${baseName}.pdf`);
}
