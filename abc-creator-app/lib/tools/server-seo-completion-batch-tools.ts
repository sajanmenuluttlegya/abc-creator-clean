type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const sharedRules = `
ABC Creator premium SEO rules:
- Use only the user's supplied inputs as the source of truth.
- Do not claim live search access, crawling, ranking data, search volume, keyword difficulty, or platform measurement unless the user pasted that evidence.
- Do not invent citations, sources, statistics, reviews, ratings, prices, addresses, rankings, or business facts.
- For score tools, clearly say the score is a heuristic estimate from supplied inputs.
- Make the result professional, premium, specific, practical, copy-ready, and implementation-focused.
- Include safe CTR, shareability, and answer-engine improvement ideas where useful, without hype, clickbait, or unsupported promises.
- Use clean Markdown, useful tables, prioritized actions, and short verification notes.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${sharedRules}\n\nTask: ${task}`, outputGuide };
}

const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 3000 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 4000 };
const pageFields: ToolFieldRule[] = [
  { id: "page_content", label: "Page content", required: true, minLength: 20, maxLength: 18000 },
  { id: "primary_keyword", label: "Primary keyword", required: true, minLength: 2, maxLength: 250 },
  { id: "business_context", label: "Business context", required: false, maxLength: 8000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "intent", label: "Search intent", required: true, minLength: 2, maxLength: 120 },
  { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
  mustField,
  avoidField,
  languageField,
];

export const serverSeoCompletionBatchTools: Record<string, ServerPrompt> = {
  "keyword-generator": p("Keyword Generator", 3, [
    { id: "seed_topic", label: "Seed topic", required: true, minLength: 2, maxLength: 300 },
    { id: "business_context", label: "Business context", required: true, minLength: 10, maxLength: 8000 },
    { id: "intent", label: "Intent focus", required: true, minLength: 2, maxLength: 120 },
    { id: "keyword_count", label: "Keyword count", required: true, minLength: 2, maxLength: 80 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    mustField,
    avoidField,
    languageField,
  ], "Generate keyword ideas with intent, page type, priority, CTR/shareability angle, and answer-engine opportunity. Do not invent volume or difficulty.", "Return: strategy summary, keyword table, question keywords, content ideas, verification notes."),

  "seo-title-generator": p("SEO Title Generator", 1, [
    { id: "page_topic", label: "Page topic", required: true, minLength: 2, maxLength: 300 },
    { id: "primary_keyword", label: "Primary keyword", required: true, minLength: 2, maxLength: 250 },
    { id: "page_context", label: "Page context", required: true, minLength: 10, maxLength: 8000 },
    { id: "title_count", label: "Title count", required: true, minLength: 2, maxLength: 80 },
    { id: "intent", label: "Search intent", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    avoidField,
    languageField,
  ], "Write SEO title options that balance keyword clarity, search intent, safe curiosity, CTR, and shareability.", "Return: title table, top picks, risk notes, avoid notes."),

  "seo-description-generator": p("SEO Description Generator", 1, [
    { id: "page_topic", label: "Page topic", required: true, minLength: 2, maxLength: 300 },
    { id: "primary_keyword", label: "Primary keyword", required: true, minLength: 2, maxLength: 250 },
    { id: "page_context", label: "Page context", required: true, minLength: 10, maxLength: 8000 },
    { id: "description_count", label: "Description count", required: true, minLength: 2, maxLength: 80 },
    { id: "intent", label: "Search intent", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    avoidField,
    languageField,
  ], "Write concise meta description options with benefit clarity, SERP click angle, safe persuasion, and strong relevance.", "Return: description table, best pick, CTR reason, notes."),

  "faq-schema-generator": p("FAQ Schema Generator", 3, [
    { id: "page_topic", label: "Page topic", required: true, minLength: 2, maxLength: 300 },
    { id: "page_facts", label: "Page facts", required: true, minLength: 20, maxLength: 14000 },
    { id: "faq_count", label: "FAQ count", required: true, minLength: 2, maxLength: 80 },
    { id: "intent", label: "Search intent", required: true, minLength: 2, maxLength: 120 },
    { id: "schema_style", label: "Schema style", required: true, minLength: 2, maxLength: 160 },
    avoidField,
    languageField,
  ], "Generate FAQ questions, concise answers, and FAQPage JSON-LD using only supplied facts. Omit unknown fields.", "Return: FAQ answers, JSON-LD draft, fields used, verification notes."),

  "content-gap-ideas": p("Content Gap Ideas", 3, [
    { id: "website_niche", label: "Website niche", required: true, minLength: 2, maxLength: 300 },
    { id: "existing_topics", label: "Existing topics", required: true, minLength: 10, maxLength: 14000 },
    { id: "competitor_or_serp_notes", label: "Market notes", required: false, maxLength: 14000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "intent", label: "Intent focus", required: true, minLength: 2, maxLength: 120 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    mustField,
    avoidField,
    languageField,
  ], "Suggest missing content opportunities, keyword gaps, FAQ gaps, topical gaps, conversion gaps, and answer-engine opportunities from supplied context.", "Return: gap summary, opportunity table, quick wins, content calendar seeds, verification notes."),

  "content-audit": p("Content Audit", 4, pageFields, "Audit supplied content for SEO basics, intent match, freshness, topical depth, trust gaps, internal links, conversion clarity, and answer-engine readiness.", "Return: executive summary, scorecard, issues, quick wins, content fixes, answer-engine fixes, verification notes."),
  "seo-score": p("SEO Score", 3, pageFields, "Create a heuristic SEO score from pasted content and context, then explain issues and fixes. Do not present it as a crawler score.", "Return: heuristic score, score breakdown, strengths, problems, quick wins, optimization plan, caveat."),

  "seo-meta-citation-gap-finder": p("SEO Meta Citation Gap Finder", 4, [
    { id: "page_content", label: "Page content", required: true, minLength: 20, maxLength: 18000 },
    { id: "target_queries", label: "Target queries", required: true, minLength: 5, maxLength: 8000 },
    { id: "competitor_or_source_notes", label: "Reference notes", required: false, maxLength: 14000 },
    { id: "business_context", label: "Brand context", required: false, maxLength: 8000 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    avoidField,
    languageField,
  ], "Find missing trust cues, source needs, reference gaps, entity clarity gaps, and answer-engine citation opportunities from supplied notes only.", "Return: gap summary, missing proof table, trust/entity gaps, page edits, verification checklist."),

  "ai-search-visibility-score": p("AI Search Visibility Score", 4, [
    { id: "brand_or_page", label: "Brand / page", required: true, minLength: 2, maxLength: 300 },
    { id: "content_or_profile", label: "Content / profile", required: true, minLength: 20, maxLength: 18000 },
    { id: "target_queries", label: "Target questions", required: true, minLength: 5, maxLength: 10000 },
    { id: "competitor_notes", label: "Market notes", required: false, maxLength: 14000 },
    { id: "visibility_goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    avoidField,
    languageField,
  ], "Estimate answer-engine visibility from supplied content, target questions, entity clarity, answer completeness, trust signals, citation readiness, and topical coverage.", "Return: heuristic visibility score, query coverage, citation readiness, entity clarity, gaps, action plan, measurement caveat."),
};
