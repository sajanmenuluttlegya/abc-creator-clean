const SEO_PACK_ARTICLE_MAX_CHARS = 40000;
const LENGTH_CONTROL_FIELD = "length_control_note";

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

function isLengthControlField(field: string) {
  const normalized = field.toLowerCase();
  return (
    normalized === "length" ||
    normalized.endsWith("_length") ||
    normalized.includes("word_count") ||
    normalized === "words_per_section" ||
    normalized.endsWith("_depth") ||
    normalized === "article_depth" ||
    normalized === "analysis_depth" ||
    normalized === "prompt_depth" ||
    normalized === "edit_level" ||
    normalized === "humanize_level" ||
    normalized.includes("duration")
  );
}

function selectedLengthValues(inputs: Record<string, string>) {
  return Object.entries(inputs)
    .filter(([field, value]) => field !== LENGTH_CONTROL_FIELD && isLengthControlField(field) && typeof value === "string" && value.trim())
    .map(([, value]) => value.trim());
}

function mapOutputLength(value: string) {
  const cleaned = value.toLowerCase();
  const match = cleaned.match(/(\d+)/);
  const amount = match ? Number(match[1]) : 0;

  if (/premium|executive|very\s+long|detailed|deep|shot-by-shot|pack|editorial/.test(cleaned)) return "Detailed";
  if (/long|large|extended|expanded/.test(cleaned)) return "Long";
  if (/professional|stronger|medium|standard|balanced|mixed|natural/.test(cleaned)) return "Medium";
  if (/quick|simple|light|short|small|brief|concise|compact/.test(cleaned)) return "Short";
  if (cleaned.includes("days")) return amount >= 30 ? "Detailed" : amount >= 14 ? "Medium" : "Short";
  if (cleaned.includes("posts")) return amount >= 10 ? "Detailed" : amount >= 7 ? "Medium" : "Short";
  if (cleaned.includes("minutes")) return "Detailed";
  if (cleaned.includes("seconds")) return amount >= 45 ? "Medium" : "Short";
  return "";
}

function buildLengthControlNote(inputs: Record<string, string>) {
  const selections = Object.entries(inputs)
    .filter(([field, value]) => field !== LENGTH_CONTROL_FIELD && isLengthControlField(field) && typeof value === "string" && value.trim())
    .map(([field, value]) => `${field} = ${value.trim()}`);

  if (!selections.length) return "";

  return [
    `Length controls selected: ${selections.join("; ")}.`,
    "Use the selected length, word-count, duration, depth, polish, or level field to control the final output size and detail.",
    "Short/quick/light/brief = compact. Medium/standard/professional/natural = moderate. Long/large/extended = longer. Detailed/premium/executive/deep/editorial/pack = deeper and more complete.",
    "For exact word-count, count, or time-duration choices, follow the selected range, count, or duration.",
  ].join("\n");
}

function addNormalizedOutputLength(next: Record<string, string>) {
  if (typeof next.output_length === "string" && next.output_length.trim()) return;

  for (const value of selectedLengthValues(next)) {
    const mapped = mapOutputLength(value);
    if (mapped) {
      next.output_length = mapped;
      return;
    }
  }
}

export function preprocessToolInputs(toolSlug: string, inputs: Record<string, string>) {
  const next = { ...inputs };
  delete next[LENGTH_CONTROL_FIELD];

  if (toolSlug === "blog-seo-pack" && typeof next.article_content === "string") {
    next.article_content = compactByHeading(next.article_content, SEO_PACK_ARTICLE_MAX_CHARS);
  }

  addNormalizedOutputLength(next);

  const lengthControlNote = buildLengthControlNote(next);
  if (lengthControlNote) {
    next[LENGTH_CONTROL_FIELD] = lengthControlNote;
  }

  return next;
}
