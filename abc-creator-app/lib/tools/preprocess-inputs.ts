const SEO_PACK_ARTICLE_MAX_CHARS = 40000;

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function compactByHeading(value: string, maxChars: number) {
  const cleaned = normalizeText(value);
  if (cleaned.length <= maxChars) return cleaned;

  const chunks = cleaned.split(/\n(?=#{1,3}\s+)/g);
  const kept: string[] = [];
  let total = 0;

  for (const chunk of chunks) {
    const nextLength = total + chunk.length + 2;
    if (nextLength > maxChars) break;
    kept.push(chunk);
    total = nextLength;
  }

  if (kept.length >= 2) {
    return `${kept.join("\n\n")}\n\n[Content shortened automatically for reliable SEO generation.]`;
  }

  return `${cleaned.slice(0, maxChars).trim()}\n\n[Content shortened automatically for reliable SEO generation.]`;
}

export function preprocessToolInputs(toolSlug: string, inputs: Record<string, string>) {
  const next = { ...inputs };

  if (toolSlug === "blog-seo-pack" && typeof next.article_content === "string") {
    next.article_content = compactByHeading(next.article_content, SEO_PACK_ARTICLE_MAX_CHARS);
  }

  return next;
}
