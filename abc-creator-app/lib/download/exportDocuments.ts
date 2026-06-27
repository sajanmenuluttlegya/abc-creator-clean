export type OutputDownloadFormat = "txt" | "docx" | "pdf";

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

async function downloadPdf(renderedHtml: string, title: string, fileName: string) {
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = html2pdfModule.default;
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

async function downloadDocx(renderedHtml: string, title: string, fileName: string) {
  const htmlDocxModule = await import("html-docx-js");
  const htmlDocx = htmlDocxModule.default;
  const html = buildPremiumHtml(renderedHtml, title);
  const blob = htmlDocx.asBlob(html, {
    orientation: "portrait",
    margins: {
      top: 720,
      right: 720,
      bottom: 720,
      left: 720,
      header: 360,
      footer: 360,
      gutter: 0,
    },
  });

  downloadBlob(blob, fileName);
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
    await downloadDocx(renderedHtml, title, `${baseName}.docx`);
    return;
  }

  await downloadPdf(renderedHtml, title, `${baseName}.pdf`);
}
