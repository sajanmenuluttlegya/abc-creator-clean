const MAX_URLS = 4;
const MAX_FETCH_CHARS_PER_URL = 7000;
const MAX_TOTAL_RESEARCH_CHARS = 18000;
const FETCH_TIMEOUT_MS = 7000;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function extractUrls(value: string) {
  const matches = value.match(/https?:\/\/[^\s)\]}"'<>]+/g) || [];
  return unique(matches.map((url) => url.replace(/[.,;:!?]+$/, ""))).slice(0, MAX_URLS);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUrlText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html,text/plain,application/json;q=0.8,*/*;q=0.5",
        "user-agent": "ABC-Creator-ResearchContext/1.0",
      },
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    const text = contentType.includes("text/html") ? stripHtml(raw) : raw.replace(/\s+/g, " ").trim();

    return text.slice(0, MAX_FETCH_CHARS_PER_URL).trim();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildResearchContext(toolSlug: string, inputs: Record<string, string>) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  const combinedInputs = Object.values(inputs).join("\n");
  const urls = extractUrls(combinedInputs);
  const sourceSections: string[] = [];

  for (const url of urls) {
    const text = await fetchUrlText(url);
    if (!text) continue;
    sourceSections.push(`Source URL: ${url}\nExtracted text:\n${text}`);
  }

  const suppliedResearch = [inputs.research_sources, inputs.brand_or_context]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n\n")
    .slice(0, 9000)
    .trim();

  const result = [
    suppliedResearch ? `User-supplied research notes/data:\n${suppliedResearch}` : "",
    sourceSections.join("\n\n---\n\n"),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, MAX_TOTAL_RESEARCH_CHARS)
    .trim();

  return result;
}
