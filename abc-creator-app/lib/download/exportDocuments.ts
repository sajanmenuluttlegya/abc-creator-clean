export type OutputDownloadFormat = "txt" | "docx" | "pdf";

type Html2PdfWorker = {
  set: (options: Record<string, unknown>) => Html2PdfWorker;
  from: (source: HTMLElement | string) => Html2PdfWorker;
  save: () => Promise<void>;
};

type Html2PdfFactory = () => Html2PdfWorker;

const encoder = new TextEncoder();

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
    .trim();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function getRenderedHtml(output: string, renderedElement?: HTMLElement | null) {
  if (renderedElement?.innerHTML?.trim()) {
    return renderedElement.innerHTML;
  }

  return `<pre>${htmlEscape(output)}</pre>`;
}

function getExportStyles() {
  return `
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ffffff;
      color: #101116;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.62;
    }
    .abc-export-page {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      color: #101116;
      padding: 34px 38px 42px;
    }
    .abc-export-header {
      border-bottom: 1px solid #d8dbe6;
      margin-bottom: 24px;
      padding-bottom: 14px;
    }
    .abc-export-kicker {
      color: #6d28d9;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.16em;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    .abc-export-title {
      color: #101116;
      font-size: 22pt;
      font-weight: 850;
      line-height: 1.15;
      margin: 0;
    }
    .abc-export-content,
    .abc-export-content * {
      color: #101116 !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    .abc-export-content h1,
    .abc-export-content h2,
    .abc-export-content h3,
    .abc-export-content h4 {
      color: #101116 !important;
      page-break-after: avoid;
      break-after: avoid-page;
      line-height: 1.22;
    }
    .abc-export-content h1 { font-size: 24pt; margin: 0 0 16px; }
    .abc-export-content h2 { font-size: 18pt; margin: 28px 0 12px; }
    .abc-export-content h3 { font-size: 14pt; margin: 22px 0 10px; }
    .abc-export-content p { margin: 0 0 12px; }
    .abc-export-content a { color: #5b21b6 !important; text-decoration: underline; }
    .abc-export-content strong { font-weight: 800; }
    .abc-export-content ul,
    .abc-export-content ol { margin: 0 0 14px 22px; padding: 0; }
    .abc-export-content li { margin: 0 0 6px; padding-left: 2px; }
    .abc-export-content blockquote {
      border-left: 4px solid #7c3aed;
      background: #f5f3ff;
      margin: 18px 0;
      padding: 12px 16px;
    }
    .abc-export-content code {
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 5px;
      color: #111827 !important;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 9.5pt;
      padding: 1px 5px;
    }
    .abc-export-content pre {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      overflow-wrap: anywhere;
      padding: 14px;
      white-space: pre-wrap;
    }
    .abc-export-content table {
      border-collapse: collapse;
      border-spacing: 0;
      margin: 18px 0 22px;
      page-break-inside: auto;
      table-layout: fixed;
      width: 100% !important;
    }
    .abc-export-content thead { display: table-header-group; }
    .abc-export-content tr { break-inside: avoid-page; page-break-inside: avoid; }
    .abc-export-content th,
    .abc-export-content td {
      border: 1px solid #d9dce7 !important;
      padding: 8px 9px;
      text-align: left;
      vertical-align: top;
      word-break: normal;
      overflow-wrap: anywhere;
    }
    .abc-export-content th {
      background: #f4f0ff !important;
      color: #221044 !important;
      font-weight: 800;
    }
    .abc-export-content td { background: #ffffff !important; }
    .abc-export-content hr { border: 0; border-top: 1px solid #d8dbe6; margin: 24px 0; }
    .abc-export-footer {
      border-top: 1px solid #d8dbe6;
      color: #667085;
      font-size: 9pt;
      margin-top: 28px;
      padding-top: 12px;
    }
  `;
}

function buildPremiumHtml(renderedHtml: string, title: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(title)}</title>
  <style>${getExportStyles()}</style>
</head>
<body>
  <main class="abc-export-page">
    <header class="abc-export-header">
      <p class="abc-export-kicker">ABC Creator Export</p>
      <h1 class="abc-export-title">${htmlEscape(title)}</h1>
    </header>
    <section class="abc-export-content">${renderedHtml}</section>
    <footer class="abc-export-footer">Generated on demand. No output was stored by ABC Creator.</footer>
  </main>
</body>
</html>`;
}

function makeTemporaryExportNode(renderedHtml: string, title: string) {
  const style = document.createElement("style");
  style.textContent = getExportStyles();

  const page = document.createElement("main");
  page.className = "abc-export-page";
  page.innerHTML = `
    <header class="abc-export-header">
      <p class="abc-export-kicker">ABC Creator Export</p>
      <h1 class="abc-export-title">${htmlEscape(title)}</h1>
    </header>
    <section class="abc-export-content">${renderedHtml}</section>
    <footer class="abc-export-footer">Generated on demand. No output was stored by ABC Creator.</footer>
  `;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "980px";
  host.style.background = "#ffffff";
  host.appendChild(style);
  host.appendChild(page);
  document.body.appendChild(host);

  return {
    node: page,
    cleanup: () => host.remove(),
  };
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

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime() {
  const now = new Date();
  const year = Math.max(now.getFullYear(), 1980);
  const dosTime =
    (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
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
  if (!text.trim()) return "";

  return `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

function wordParagraph(text: string, style: "title" | "heading1" | "heading2" | "normal" | "list" = "normal") {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";

  const styleMap = {
    title: "Title",
    heading1: "Heading1",
    heading2: "Heading2",
    normal: "Normal",
    list: "Normal",
  };
  const indent = style === "list" ? '<w:ind w:left="720"/>' : "";

  return `<w:p><w:pPr><w:pStyle w:val="${styleMap[style]}"/>${indent}</w:pPr>${wordRun(cleanText, style !== "normal" && style !== "list")}</w:p>`;
}

function textFromElement(element: Element) {
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function tableToWordXml(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));

  if (!rows.length) return "";

  const tableRows = rows
    .map((row) => {
      const cells = Array.from(row.children).filter((cell) =>
        ["TD", "TH"].includes(cell.tagName)
      );

      const tableCells = cells
        .map((cell) => {
          const isHeader = cell.tagName === "TH";
          return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="D9DCE7"/><w:left w:val="single" w:sz="4" w:color="D9DCE7"/><w:bottom w:val="single" w:sz="4" w:color="D9DCE7"/><w:right w:val="single" w:sz="4" w:color="D9DCE7"/></w:tcBorders>${isHeader ? '<w:shd w:fill="F4F0FF"/>' : ""}</w:tcPr><w:p>${wordRun(textFromElement(cell), isHeader)}</w:p></w:tc>`;
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
    else if (element.tagName === "H2" || element.tagName === "H3") {
      parts.push(wordParagraph(textFromElement(element), "heading2"));
    } else if (element.tagName === "LI") {
      parts.push(wordParagraph(`• ${textFromElement(element)}`, "list"));
    } else {
      parts.push(wordParagraph(textFromElement(element), "normal"));
    }
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

async function loadHtml2Pdf() {
  const mod = (await import("html2pdf.js")) as unknown as {
    default?: Html2PdfFactory;
  } & Html2PdfFactory;

  return mod.default || mod;
}

async function downloadPdf(renderedHtml: string, title: string, fileName: string) {
  const html2pdf = await loadHtml2Pdf();
  const exportNode = makeTemporaryExportNode(renderedHtml, title);

  try {
    await html2pdf()
      .set({
        filename: fileName,
        margin: [10, 10, 12, 10],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(exportNode.node)
      .save();
  } finally {
    exportNode.cleanup();
  }
}

function downloadDocx(renderedHtml: string, title: string, fileName: string) {
  downloadBlob(buildDocxBlob(renderedHtml, title), fileName);
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

  if (format === "txt") {
    downloadBlob(
      new Blob([markdownToPlainText(output)], { type: "text/plain;charset=utf-8" }),
      `${baseName}.txt`
    );
    return;
  }

  const renderedHtml = getRenderedHtml(output, renderedElement);

  if (format === "docx") {
    downloadDocx(renderedHtml, title, `${baseName}.docx`);
    return;
  }

  await downloadPdf(renderedHtml, title, `${baseName}.pdf`);
}
