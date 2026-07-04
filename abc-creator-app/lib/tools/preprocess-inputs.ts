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
    normalized.includes("duration")
  );
}

function buildLengthControlNote(inputs: Record<string, string>) {
  const selections = Object.entries(inputs)
    .filter(([field, value]) => field !== LENGTH_CONTROL_FIELD && isLengthControlField(field) && typeof value === "string" && value.trim())
    .map(([field, value]) => `${field} = ${value.trim()}`);

  if (!selections.length) return "";

  return [
    `Length controls selected: ${selections.join("; ")}.`,
    "Treat the selected length, word-count, duration, or depth field as mandatory.",
    "Short/very short/small/brief/concise/light means compact but complete.",
    "Medium/standard/balanced/mixed means moderate length and useful detail.",
    "Long/large/extended/expanded means visibly longer with more developed sections, examples, stanzas, or steps.",
    "Detailed/very long/premium/advanced/expert/authority/deep dive/pack means substantially deeper and more complete, with richer substance rather than filler.",
    "Poem length guide: Short 4-8 lines; Medium 10-18 lines; Long/Large 20-36 lines; Detailed/Very long/Premium 36-60+ lines or multiple developed stanzas.",
    "General text guide when no exact word count is selected: Short 150-300 words; Medium 350-700 words; Long/Large 800-1,500 words; Detailed/Premium/Advanced 1,500-2,500 words when the tool type supports it.",
    "For exact word-count or time-duration choices, follow the selected range or duration.",
  ].join("\n");
}

export function preprocessToolInputs(toolSlug: string, inputs: Record<string, string>) {
  const next = { ...inputs };
  delete next[LENGTH_CONTROL_FIELD];

  if (toolSlug === "blog-seo-pack" && typeof next.article_content === "string") {
    next.article_content = compactByHeading(next.article_content, SEO_PACK_ARTICLE_MAX_CHARS);
  }

  const lengthControlNote = buildLengthControlNote(next);
  if (lengthControlNote) {
    next[LENGTH_CONTROL_FIELD] = lengthControlNote;
  }

  return next;
}
