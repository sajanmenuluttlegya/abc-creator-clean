type PublicSeoToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicSeoTool = {
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
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: PublicSeoToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional", "Premium", "Clear and practical", "Technical", "Friendly", "Executive", "Educational"];
const audienceOptions = ["General readers", "Beginners", "Buyers", "Business owners", "Marketers", "Technical readers", "Local customers", "Executives"];
const seoGoalOptions = ["Rank for informational keywords", "Rank for commercial keywords", "Improve AI search visibility", "Refresh old content", "Plan new content", "Local SEO", "Build topical authority"];
const depthOptions = ["Quick", "Standard", "Detailed", "Premium"];
const intentOptions = ["Informational", "Commercial", "Transactional", "Navigational", "Local", "Mixed / analyze automatically"];
const schemaOptions = ["Article", "FAQ", "HowTo", "Product", "LocalBusiness", "Service", "Course", "Organization", "Mixed recommendation"];

function commonSeoInputs(topicLabel = "Topic / Keyword") {
  return [
    { id: "topic", label: topicLabel, type: "text" as const, placeholder: "e.g., AI tools for teachers, handmade candles, gym meal plans", required: true },
    { id: "audience", label: "Audience", type: "select" as const, required: true, options: audienceOptions },
    { id: "goal", label: "SEO Goal", type: "select" as const, required: true, options: seoGoalOptions },
    { id: "language", label: "Language", type: "select" as const, required: true, options: languageOptions },
  ];
}

export const seoBatchTools: PublicSeoTool[] = [
  {
    id: "seo-content-brief-generator",
    slug: "seo-content-brief-generator",
    name: "SEO Content Brief Generator",
    description: "Create a premium SEO content brief with search intent, outline, entities, FAQs, and writer instructions.",
    icon: "seo",
    detailEmoji: "🧾",
    category: "SEO Tools",
    displayCreditCost: 6,
    outputType: "text",
    aliases: ["seo-brief-generator", "content-brief-generator", "ai-seo-content-brief"],
    nextActions: [
      { label: "Create a blog outline", href: "/tools/blog-outline", description: "Turn the brief into an article structure." },
      { label: "Write the blog post", href: "/tools/blog-content", description: "Use the brief to generate full content." },
    ],
    inputs: [
      ...commonSeoInputs("Primary Keyword / Topic"),
      { id: "secondary_keywords", label: "Secondary Keywords", type: "textarea", placeholder: "Optional: related keywords, People Also Ask questions, entities, terms to include", required: false },
      { id: "competitor_notes", label: "Competitor / SERP Notes", type: "textarea", placeholder: "Optional: paste competitor headings, SERP notes, or content gaps. The tool will not invent live search data.", required: false },
      { id: "depth", label: "Brief Depth", type: "select", required: true, options: depthOptions },
      { id: "tone", label: "Writer Tone", type: "select", required: true, options: toneOptions },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: product points, facts, examples, brand rules, internal links, CTAs", required: false },
      { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: unsupported claims, topics, competitor names, promises, banned terms", required: false },
    ],
  },
  {
    id: "keyword-cluster-generator",
    slug: "keyword-cluster-generator",
    name: "Keyword Cluster Generator",
    description: "Group keywords into topical clusters with intent, page type, priority, and content angles.",
    icon: "seo",
    detailEmoji: "🧩",
    category: "SEO Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["seo-keyword-cluster-generator", "keyword-clustering-tool", "topic-cluster-generator"],
    inputs: [
      { id: "keyword_list", label: "Keyword List", type: "textarea", placeholder: "Paste keywords, one per line or comma-separated.", required: true },
      { id: "business_context", label: "Business / Niche Context", type: "textarea", placeholder: "What does the brand sell, teach, or help people do?", required: true },
      { id: "intent_focus", label: "Intent Focus", type: "select", required: true, options: intentOptions },
      { id: "cluster_depth", label: "Cluster Depth", type: "select", required: true, options: depthOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: terms, products, locations, or angles to exclude", required: false },
    ],
  },
  {
    id: "search-intent-analyzer",
    slug: "search-intent-analyzer",
    name: "Search Intent Analyzer",
    description: "Analyze a keyword or page idea and explain the likely search intent, reader needs, and best content format.",
    icon: "seo",
    detailEmoji: "🎯",
    category: "SEO Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["keyword-intent-analyzer", "seo-intent-analyzer", "search-intent-tool"],
    inputs: [
      ...commonSeoInputs("Keyword / Page Idea"),
      { id: "current_page_notes", label: "Current Page / SERP Notes", type: "textarea", placeholder: "Optional: paste current page text, headings, competitor notes, or observed SERP features.", required: false },
      { id: "depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: angles to avoid, compliance limits, brand rules", required: false },
    ],
  },
  {
    id: "meta-title-description-generator",
    slug: "meta-title-description-generator",
    name: "Meta Title & Description Generator",
    description: "Generate polished SEO titles, meta descriptions, slugs, and SERP click angle options.",
    icon: "seo",
    detailEmoji: "🏷️",
    category: "SEO Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["meta-title-generator", "meta-description-generator", "seo-meta-generator"],
    inputs: [
      { id: "page_topic", label: "Page Topic / Title", type: "text", placeholder: "e.g., Best AI Tools for Teachers", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI tools for teachers", required: true },
      { id: "page_context", label: "Page Context", type: "textarea", placeholder: "Paste page summary, offer, product details, or article angle.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: words, claims, clickbait, brand restrictions", required: false },
    ],
  },
  {
    id: "ai-visibility-optimizer",
    slug: "ai-visibility-optimizer",
    name: "AI Visibility Optimizer",
    description: "Optimize content for AI answers, featured snippets, entity clarity, citations, and answer-engine visibility.",
    icon: "seo",
    detailEmoji: "🤖",
    category: "SEO Tools",
    displayCreditCost: 6,
    outputType: "text",
    aliases: ["answer-engine-optimizer", "aio-optimizer", "ai-search-visibility-tool", "llm-visibility-optimizer"],
    inputs: [
      { id: "content", label: "Content / Page Draft", type: "textarea", placeholder: "Paste the page, article, landing page, or section you want optimized.", required: true },
      { id: "target_queries", label: "Target Questions / Queries", type: "textarea", placeholder: "Questions or searches you want this content to answer.", required: true },
      { id: "brand_context", label: "Brand / Entity Context", type: "textarea", placeholder: "Facts about the brand, author, product, credentials, geography, or entities. The tool will not invent facts.", required: false },
      { id: "goal", label: "Visibility Goal", type: "select", required: true, options: seoGoalOptions },
      { id: "depth", label: "Optimization Depth", type: "select", required: true, options: depthOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, unsupported stats, legal/medical/financial limits", required: false },
    ],
  },
  {
    id: "topical-authority-map",
    slug: "topical-authority-map",
    name: "Topical Authority Map",
    description: "Plan a topical authority map with pillar pages, cluster articles, internal links, and publishing priority.",
    icon: "seo",
    detailEmoji: "🗺️",
    category: "SEO Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["topic-authority-map", "topical-map-generator", "seo-topic-map"],
    inputs: [
      ...commonSeoInputs("Core Topic / Niche"),
      { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "What the site offers, current content, audience, products, or location.", required: true },
      { id: "existing_content", label: "Existing Content / Pages", type: "textarea", placeholder: "Optional: paste existing page titles or URLs as text so the map can avoid duplicates.", required: false },
      { id: "map_depth", label: "Map Depth", type: "select", required: true, options: depthOptions },
      { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: topics, products, locations, or claims to avoid", required: false },
    ],
  },
  {
    id: "content-gap-analyzer",
    slug: "content-gap-analyzer",
    name: "Content Gap Analyzer",
    description: "Compare your content against pasted competitor/SERP notes and find missing sections, keywords, and angles.",
    icon: "seo",
    detailEmoji: "🔍",
    category: "SEO Tools",
    displayCreditCost: 6,
    outputType: "text",
    aliases: ["seo-content-gap-analyzer", "content-gap-analysis", "competitor-content-gap-tool"],
    inputs: [
      { id: "your_content", label: "Your Content / Outline", type: "textarea", placeholder: "Paste your draft, outline, or page sections.", required: true },
      { id: "competitor_notes", label: "Competitor / SERP Notes", type: "textarea", placeholder: "Paste competitor headings, summaries, keyword lists, FAQs, or SERP observations. No live crawling is performed.", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., best CRM for startups", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: unsupported claims, competitor mentions, brand rules", required: false },
    ],
  },
  {
    id: "schema-markup-generator",
    slug: "schema-markup-generator",
    name: "Schema Markup Generator",
    description: "Generate JSON-LD schema drafts from supplied page facts, without inventing hidden business details.",
    icon: "seo",
    detailEmoji: "{}",
    category: "SEO Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["json-ld-generator", "structured-data-generator", "schema-generator"],
    inputs: [
      { id: "schema_type", label: "Schema Type", type: "select", required: true, options: schemaOptions },
      { id: "page_url", label: "Page URL", type: "text", placeholder: "Optional: paste the page URL if available", required: false },
      { id: "page_facts", label: "Page / Business Facts", type: "textarea", placeholder: "Paste exact facts: title, author, organization, price, address, FAQs, steps, dates, ratings, etc. Unknown fields will be omitted.", required: true },
      { id: "page_purpose", label: "Page Purpose", type: "textarea", placeholder: "What does this page explain, sell, teach, or help users do?", required: true },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: fields to omit, unsupported claims, ratings, prices, legal limits", required: false },
    ],
  },
];
