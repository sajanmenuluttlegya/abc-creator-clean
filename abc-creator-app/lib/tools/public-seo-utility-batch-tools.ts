type SeoUtilityInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type SeoUtilityTool = {
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
  inputs: SeoUtilityInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["General readers", "Beginners", "Buyers", "Business owners", "Marketers", "Technical readers", "Local customers", "Executives"];
const toneOptions = ["Professional", "Premium", "Clear and practical", "Technical", "Friendly", "Executive", "Educational"];
const depthOptions = ["Quick", "Standard", "Detailed", "Premium"];
const intentOptions = ["Informational", "Commercial", "Transactional", "Navigational", "Local", "Mixed / analyze automatically"];

function pageInputs(mainLabel: string): SeoUtilityInput[] {
  return [
    { id: "page_content", label: mainLabel, type: "textarea", placeholder: "Paste the page, article, outline, headings, or draft. No live crawling is performed.", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., best AI tools for teachers", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Search Intent", type: "select", required: true, options: intentOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: secondary keywords, entities, FAQs, internal links, product facts, brand rules.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, topics, competitor mentions, unsupported stats, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function topicInputs(mainLabel: string): SeoUtilityInput[] {
  return [
    { id: "topic", label: mainLabel, type: "text", placeholder: "e.g., AI tools for teachers, handmade candles, gym meal plans", required: true },
    { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "What the site offers, audience, products, locations, existing content, or brand facts.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Intent Focus", type: "select", required: true, options: intentOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: keywords, products, services, locations, questions, entities, or internal pages.", required: false },
    { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: terms, locations, services, claims, or angles to exclude.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: SeoUtilityInput[], aliases: string[] = []): SeoUtilityTool {
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

export const seoUtilityBatchTools: SeoUtilityTool[] = [
  tool("seo-content-optimizer", "SEO Content Optimizer", "Optimize pasted content for keywords, intent, entities, structure, snippets, and readability without inventing data.", "🛠️", 6, pageInputs("Content / Page Draft"), ["content-optimizer", "on-page-content-optimizer"]),
  tool("on-page-seo-checklist", "On-Page SEO Checklist", "Create a practical on-page SEO checklist for a page, article, product, or service topic.", "✅", 5, topicInputs("Page Topic / Keyword"), ["seo-checklist-generator", "on-page-checklist"]),
  tool("seo-audit-analyzer", "SEO Audit Analyzer", "Audit pasted page text or notes and return issues, fixes, priorities, and verification notes.", "🔎", 6, pageInputs("Page Content / SEO Notes"), ["seo-audit-tool", "page-seo-audit"]),
  tool("internal-link-suggestion-generator", "Internal Link Suggestion Generator", "Generate internal link opportunities, anchor text, and placement ideas from pasted page lists and content.", "🔗", 5, [
    { id: "source_page", label: "Source Page / Draft", type: "textarea", placeholder: "Paste the page or article where links should be added.", required: true },
    { id: "available_pages", label: "Available Internal Pages", type: "textarea", placeholder: "Paste page titles, URLs, categories, or site map notes. The tool will not crawl your website.", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Optional main topic or keyword", required: false },
    { id: "linking_goal", label: "Linking Goal", type: "select", required: true, options: ["Improve topical authority", "Support money pages", "Improve navigation", "Distribute authority", "Refresh old content"] },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: pages, anchors, claims, or topics to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["internal-link-generator", "anchor-text-generator"]),
  tool("seo-faq-generator", "SEO FAQ Generator", "Generate SEO-friendly FAQs, answer blocks, and schema-ready question ideas from a topic or page draft.", "❓", 5, topicInputs("Topic / Page Keyword"), ["faq-seo-generator", "seo-question-generator"]),
  tool("seo-slug-generator", "SEO Slug Generator", "Create clean SEO URL slugs with keyword fit, readability, and duplicate-safe alternatives.", "🔖", 2, [
    { id: "page_title", label: "Page Title / Topic", type: "text", placeholder: "e.g., Best AI Tools for Teachers in 2026", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Optional main keyword", required: false },
    { id: "slug_style", label: "Slug Style", type: "select", required: true, options: ["Short", "Keyword-focused", "Readable", "Category-friendly", "Multiple variations"] },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words, dates, numbers, or terms to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["url-slug-generator", "slug-generator"]),
  tool("image-alt-text-generator", "Image Alt Text Generator", "Write accessible, SEO-friendly image alt text from a pasted image description or context.", "🖼️", 2, [
    { id: "image_context", label: "Image Description / Context", type: "textarea", placeholder: "Describe what is visible in the image, where it appears, and the surrounding page topic.", required: true },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Optional keyword only if naturally relevant", required: false },
    { id: "page_context", label: "Page Context", type: "textarea", placeholder: "Optional: surrounding article, product, or section context.", required: false },
    { id: "alt_count", label: "How Many Options?", type: "select", required: true, options: ["3 variations", "5 variations", "10 variations"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: keyword stuffing, claims, names, or details not visible in image.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["alt-text-generator", "seo-alt-text-generator"]),
  tool("content-refresh-optimizer", "Content Refresh Optimizer", "Turn old content into a refresh plan with outdated sections, new angles, and update priorities.", "♻️", 6, pageInputs("Old Content / Page Draft"), ["content-refresh-tool", "refresh-old-content"]),
  tool("serp-feature-opportunity-finder", "SERP Feature Opportunity Finder", "Find featured snippet, FAQ, comparison, local, and answer-box opportunities from pasted SERP notes or page context.", "🏁", 5, [
    { id: "keyword_or_topic", label: "Keyword / Topic", type: "text", placeholder: "Target keyword or topic", required: true },
    { id: "serp_notes", label: "SERP Notes / Competitor Notes", type: "textarea", placeholder: "Paste observed SERP features, competitor headings, People Also Ask, snippets, or manual research notes. No live search is performed.", required: false },
    { id: "page_content", label: "Your Page / Draft", type: "textarea", placeholder: "Optional: paste your page content or outline.", required: false },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional constraints, claims, competitors, or SERP features to ignore.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["featured-snippet-opportunity-finder", "serp-opportunity-tool"]),
  tool("keyword-cannibalization-checker", "Keyword Cannibalization Checker", "Review pasted page lists and keyword targets to find likely overlap, conflicts, and consolidation opportunities.", "⚠️", 5, [
    { id: "page_keyword_map", label: "Pages + Target Keywords", type: "textarea", placeholder: "Paste page titles/URLs with their target keywords or topic notes. No crawling is performed.", required: true },
    { id: "business_context", label: "Business / Website Context", type: "textarea", placeholder: "What the site covers and which pages matter most.", required: true },
    { id: "priority_goal", label: "Priority Goal", type: "select", required: true, options: ["Reduce overlap", "Consolidate pages", "Improve rankings", "Plan redirects", "Refresh content", "Build topical authority"] },
    { id: "depth", label: "Depth", type: "select", required: true, options: depthOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional pages, topics, or actions to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["keyword-overlap-checker", "cannibalization-analyzer"]),
  tool("local-seo-keyword-generator", "Local SEO Keyword Generator", "Generate local SEO keyword ideas, service modifiers, neighborhood terms, and intent buckets.", "📍", 5, [
    { id: "business_type", label: "Business Type / Service", type: "text", placeholder: "e.g., dental clinic, wedding photographer, plumber, bakery", required: true },
    { id: "location", label: "Location", type: "text", placeholder: "City, area, state, or service region", required: true },
    { id: "services", label: "Services / Products", type: "textarea", placeholder: "List services, products, specialties, or customer needs.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "intent", label: "Intent Focus", type: "select", required: true, options: ["Local service", "Near me", "Commercial", "Informational", "Emergency", "Comparison", "Mixed"] },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional areas, services, or claims to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["local-keyword-generator", "near-me-keyword-generator"]),
  tool("google-business-profile-description-generator", "Google Business Profile Description Generator", "Write polished Google Business Profile descriptions, service blurbs, and local positioning copy from supplied business facts.", "🏪", 3, [
    { id: "business_name", label: "Business Name", type: "text", placeholder: "Business name", required: true },
    { id: "business_facts", label: "Business Facts", type: "textarea", placeholder: "Services, location, audience, years in business, specialties, hours, proof, and exact facts. The tool will not invent details.", required: true },
    { id: "location", label: "Location / Service Area", type: "text", placeholder: "City, area, or service region", required: true },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Options?", type: "select", required: true, options: ["3 variations", "5 variations", "10 variations"] },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, guarantees, regulated terms, competitor mentions, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["gbp-description-generator", "google-business-description-generator"]),
];
