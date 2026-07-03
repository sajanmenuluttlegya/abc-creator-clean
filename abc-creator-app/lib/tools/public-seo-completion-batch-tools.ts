type SeoCompletionInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type SeoCompletionTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType: "text";
  aliases?: string[];
  inputs: SeoCompletionInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["General readers", "Beginners", "Buyers", "Business owners", "Marketers", "Technical readers", "Local customers", "Executives"];
const toneOptions = ["Professional", "Premium", "Clear and practical", "Technical", "Friendly", "Executive", "Educational", "Click-worthy but safe"];
const intentOptions = ["Informational", "Commercial", "Transactional", "Navigational", "Local", "AI answer / AEO", "Mixed / analyze automatically"];
const depthOptions = ["Quick", "Standard", "Detailed", "Premium"];
const countOptions = ["5 options", "10 options", "20 options", "30 options"];

function topicInputs(mainLabel: string): SeoCompletionInput[] {
  return [
    { id: "topic", label: mainLabel, type: "text", placeholder: "e.g., AI tools for teachers, local bakery SEO, CRM for startups", required: true },
    { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "Describe the site, product, audience, location, existing content, brand facts, and goals. No live crawling is performed.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: keywords, entities, products, FAQs, locations, internal pages, proof, or CTA.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, competitors, words, topics, fake urgency, unsupported data, or sensitive limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function pageInputs(mainLabel: string): SeoCompletionInput[] {
  return [
    { id: "page_content", label: mainLabel, type: "textarea", placeholder: "Paste the page, article, outline, headings, metadata, or draft. No crawling or live Google data is performed.", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., best AI tools for teachers", required: true },
    { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "Optional: brand facts, product details, internal pages, competitors, location, audience, or proof.", required: false },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: secondary keywords, entities, FAQs, internal links, claims with proof, or CTA.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: unsupported claims, keyword stuffing, competitor mentions, fake stats, or banned words.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: SeoCompletionInput[], aliases: string[] = []): SeoCompletionTool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: "seo",
    detailEmoji: emoji,
    category: "SEO Tools",
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases],
    inputs,
  };
}

export const seoCompletionBatchTools: SeoCompletionTool[] = [
  tool("keyword-generator", "Keyword Generator", "Generate keyword ideas with intent buckets, content angles, viral/CTR opportunities, and no fake volume claims.", "🔑", 5, [
    { id: "seed_topic", label: "Seed Topic / Niche", type: "text", placeholder: "e.g., AI tools for teachers, handmade candles, gym meal plans", required: true },
    { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "What the site offers, target audience, location, services, products, competitors, or existing content.", required: true },
    { id: "intent", label: "Intent Focus", type: "select", required: true, options: intentOptions },
    { id: "keyword_count", label: "Keyword Count", type: "select", required: true, options: countOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: services, products, locations, modifiers, questions, or entities.", required: false },
    { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: irrelevant terms, locations, competitors, or sensitive claims.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["keyword-ideas-generator", "seo-keyword-generator", "ai-keyword-generator"]),
  tool("seo-title-generator", "SEO Title Generator", "Create SEO titles that balance keyword relevance, CTR, safe curiosity, and shareability without clickbait.", "🏷️", 2, [
    { id: "page_topic", label: "Page Topic / Article Idea", type: "text", placeholder: "e.g., Best AI Tools for Teachers", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI tools for teachers", required: true },
    { id: "page_context", label: "Page Context", type: "textarea", placeholder: "Paste the page summary, offer, audience, product facts, or article angle.", required: true },
    { id: "title_count", label: "How Many Titles?", type: "select", required: true, options: countOptions },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait, fake urgency, claims, banned words, or competitor names.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["title-tag-generator", "seo-title-tag-generator", "serp-title-generator"]),
  tool("seo-description-generator", "SEO Description Generator", "Write meta descriptions with strong SERP click angles, benefit clarity, and safe persuasion.", "📝", 2, [
    { id: "page_topic", label: "Page Topic / Title", type: "text", placeholder: "e.g., Best AI Tools for Teachers", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI tools for teachers", required: true },
    { id: "page_context", label: "Page Context", type: "textarea", placeholder: "Paste the page summary, offer, product details, article angle, or key benefits.", required: true },
    { id: "description_count", label: "How Many Descriptions?", type: "select", required: true, options: countOptions },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: fake promises, spam, unsupported claims, words, or competitor mentions.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["meta-description-generator", "seo-meta-description-generator", "serp-description-generator"]),
  tool("faq-schema-generator", "FAQ Schema Generator", "Generate FAQ questions, concise answers, and JSON-LD FAQPage schema from supplied page facts only.", "{}", 5, [
    { id: "page_topic", label: "Page Topic / Keyword", type: "text", placeholder: "e.g., CRM software pricing, local dentist services", required: true },
    { id: "page_facts", label: "Page Facts / Source Notes", type: "textarea", placeholder: "Paste exact page facts, FAQs, product/service details, policies, pricing, steps, or answers. Unknown fields will be omitted.", required: true },
    { id: "faq_count", label: "FAQ Count", type: "select", required: true, options: ["5 FAQs", "8 FAQs", "10 FAQs", "15 FAQs"] },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "schema_style", label: "Schema Output", type: "select", required: true, options: ["FAQ answers only", "JSON-LD only", "FAQ answers + JSON-LD", "Premium with validation notes"] },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, legal/medical/financial wording, prices, ratings, or unsupported promises to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["faq-json-ld-generator", "faqpage-schema-generator", "schema-faq-generator", "json-ld-faq-generator"]),
  tool("content-gap-ideas", "Content Gap Ideas", "Suggest missing topics, article angles, keyword gaps, FAQ gaps, and AI visibility opportunities from supplied context.", "🧠", 5, [
    { id: "website_niche", label: "Website Niche", type: "text", placeholder: "e.g., productivity SaaS for agencies, local dental clinic, fitness coaching", required: true },
    { id: "existing_topics", label: "Existing Topics / Pages", type: "textarea", placeholder: "Paste existing page titles, blog topics, sitemap notes, or current content list.", required: true },
    { id: "competitor_or_serp_notes", label: "Competitor / SERP Notes", type: "textarea", placeholder: "Optional: paste competitor topics, SERP observations, People Also Ask, or market notes. No live search is performed.", required: false },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Intent Focus", type: "select", required: true, options: intentOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: services, products, locations, keywords, content pillars, offers, or questions.", required: false },
    { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: topics already covered, irrelevant products, competitor names, or claims to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["seo-content-gap-ideas", "content-opportunity-generator", "keyword-gap-content-ideas", "topic-gap-generator"]),
  tool("content-audit", "Content Audit", "Audit pasted content for SEO, freshness, AI visibility, reader value, conversion gaps, and safe improvement priorities.", "📋", 6, pageInputs("Content / Page to Audit"), ["seo-content-audit", "content-audit-tool", "page-content-audit"]),
  tool("seo-score", "SEO Score", "Score pasted content with a practical heuristic SEO score, issue breakdown, quick wins, and premium optimization plan.", "💯", 5, pageInputs("Content / Page to Score"), ["seo-score-checker", "seo-content-score", "on-page-seo-score"]),
  tool("seo-meta-citation-gap-finder", "SEO Meta Citation Gap Finder", "Find missing trust cues, citation gaps, source needs, and AI-answer citation opportunities from pasted page/competitor notes.", "🧭", 6, [
    { id: "page_content", label: "Your Page / Draft", type: "textarea", placeholder: "Paste the page, article, metadata, or draft to inspect for citation and trust gaps.", required: true },
    { id: "target_queries", label: "Target Queries / Buyer Questions", type: "textarea", placeholder: "Questions or searches where you want the brand/page to be cited or trusted.", required: true },
    { id: "competitor_or_source_notes", label: "Competitor / Source Notes", type: "textarea", placeholder: "Optional: paste competitor snippets, cited sources, references, Reddit/forum notes, or SERP observations. No live crawling is performed.", required: false },
    { id: "business_context", label: "Brand / Entity Context", type: "textarea", placeholder: "Optional: verified brand facts, credentials, products, location, authors, awards, studies, or proof.", required: false },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims to avoid, sources not to use, regulated topics, or competitor restrictions.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["citation-gap-finder", "ai-citation-gap-finder", "geo-citation-gap-finder"]),
  tool("ai-search-visibility-score", "AI Search Visibility Score", "Estimate AI search visibility from supplied content, queries, brand facts, and evidence with GEO/AEO improvement actions.", "🤖", 6, [
    { id: "brand_or_page", label: "Brand / Page / Product", type: "text", placeholder: "e.g., ABC Creator, local bakery service page, CRM comparison article", required: true },
    { id: "content_or_profile", label: "Content / Brand Profile", type: "textarea", placeholder: "Paste the page, brand profile, article, product facts, bios, citations, or source notes to analyze.", required: true },
    { id: "target_queries", label: "Target AI Search Questions", type: "textarea", placeholder: "Paste questions/prompts users may ask ChatGPT, Gemini, Perplexity, or Google AI Overviews.", required: true },
    { id: "competitor_notes", label: "Competitor / Mention Notes", type: "textarea", placeholder: "Optional: paste competitor mentions, AI answer observations, SERP notes, Reddit/forum notes, or citations. No live AI checking is performed.", required: false },
    { id: "visibility_goal", label: "Visibility Goal", type: "select", required: true, options: ["More AI citations", "Better answer inclusion", "Brand positioning clarity", "Comparison visibility", "Local AI search", "Product recommendation visibility"] },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, industries, competitors, unsafe advice, or unsupported proof to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["ai-visibility-score", "geo-score", "answer-engine-visibility-score"]),
];
