function sanitizeFileName(value: string) {
  return (value || "abc-creator-output")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abc-creator-output";
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanRenderedHtml(renderedElement?: HTMLElement | null, fallbackOutput = "") {
  if (!renderedElement?.innerHTML?.trim()) {
    return `<pre>${htmlEscape(fallbackOutput)}</pre>`;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderedElement.innerHTML;

  wrapper
    .querySelectorAll("[data-export-ignore], button, select, textarea, input")
    .forEach((element) => element.remove());

  wrapper.querySelectorAll("img").forEach((image) => {
    image.removeAttribute("class");
    image.setAttribute("style", "max-width:100%;height:auto;border-radius:12px;margin:18px 0;display:block;");
    if (!image.getAttribute("alt")) image.setAttribute("alt", "Generated blog image");
  });

  wrapper.querySelectorAll("[data-abc-diagram]").forEach((diagram) => {
  diagram.removeAttribute("class");
  diagram.setAttribute(
    "style",
    "margin:28px 0;overflow-x:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:16px;"
  );
});

wrapper.querySelectorAll("svg").forEach((svg) => {
  svg.removeAttribute("class");
  svg.setAttribute(
    "style",
    "max-width:100%;height:auto;display:block;background:#ffffff;"
  );
});

  wrapper.querySelectorAll("a").forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  return wrapper.innerHTML;
}

export function downloadHtmlOutput(
  output: string,
  fileBaseName = "abc-creator-output",
  renderedElement?: HTMLElement | null
) {
  const baseName = sanitizeFileName(fileBaseName);
  const title = baseName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "ABC Creator Output";
  const bodyHtml = cleanRenderedHtml(renderedElement, output);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #111827; background: #ffffff; max-width: 980px; margin: 0 auto; padding: 40px 24px; }
    h1, h2, h3 { line-height: 1.25; color: #050505; }
    h1 { font-size: 2.2rem; margin: 0 0 1rem; }
    h2 { font-size: 1.55rem; margin-top: 2rem; }
    h3 { font-size: 1.25rem; margin-top: 1.5rem; }
    p { margin: 0 0 1rem; }
    table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f3f0ff; }
    blockquote { border-left: 4px solid #7c3aed; margin: 1.25rem 0; padding: 0.75rem 1rem; background: #f5f3ff; }
    img { max-width: 100%; height: auto; border-radius: 12px; margin: 18px 0; display: block; }
    svg { max-width: 100%; height: auto; display: block; background: #ffffff; }
[data-abc-diagram] { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 16px; margin: 28px 0; overflow-x: auto; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName}.html`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}
