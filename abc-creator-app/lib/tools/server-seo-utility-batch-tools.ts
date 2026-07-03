type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium SEO utility rules:
- Use only the user's supplied content, keyword, page notes, business facts, audience, language, must-include, and avoid fields as the source of truth.
- Do not claim live Google access, crawling, ranking data, search volume, keyword difficulty, schema validation, or competitor analysis unless the user pasted that evidence.
- Do not invent statistics, citations, reviews, ratings, prices, addresses, author credentials, business details, rankings, SERP features, or competitor facts.
- When evidence is missing, use placeholders such as [verify search volume], [add source], [confirm page URL], or [insert verified proof].
- Make the output premium, strategic, practical, specific, copy-ready, and useful for implementation.
- Avoid keyword stuffing, generic SEO filler, fake urgency, irrelevant recommendations, and off-topic marketing copy.`;

const pageFields: ToolFieldRule[] = [
  { id: "page_content", label: "Page content", required: true, minLength: 20, maxLength: 18000 },
  { id: "primary_keyword", label: "Primary keyword", required: true, minLength: 2, maxLength: 250 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "intent", label: "Search intent", required: true, minLength: 2, maxLength: 120 },
  { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
  { id: "must_include", label: "Must include", required: false, maxLength: 4000 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

const topicFields: ToolFieldRule[] = [
  { id: "topic", label: "Topic", required: true, minLength: 2, maxLength: 500 },
  { id: "business_context", label: "Business / website context", required: true, minLength: 10, maxLength: 8000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "intent", label: "Intent focus", required: true, minLength: 2, maxLength: 120 },
  { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
  { id: "must_include", label: "Must include", required: false, maxLength: 4000 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, guide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide: guide };
}

export const serverSeoUtilityBatchTools: Record<string, ServerPrompt> = {
  "seo-content-optimizer": p("SEO Content Optimizer", 4, pageFields, "Optimize the supplied content for intent, structure, entities, snippets, clarity, and keyword relevance without fabricating data.", "Return Markdown with: # SEO Content Optimization; ## Quick Diagnosis; ## Optimized Version / Rewrite Plan; ## Entity & Keyword Improvements; ## Heading Fixes; ## Snippet Opportunities; ## Implementation Checklist; ## Verification Notes."),
  "on-page-seo-checklist": p("On-Page SEO Checklist", 3, topicFields, "Create a practical on-page SEO checklist tailored to the supplied topic, site context, audience, and intent.", "Return Markdown with: # On-Page SEO Checklist; ## Priority Checklist; ## Content Requirements; ## Metadata; ## Internal Links; ## Schema/FAQ Ideas; ## Technical Checks to Verify; ## Notes."),
  "seo-audit-analyzer": p("SEO Audit Analyzer", 4, pageFields, "Audit the supplied page text or SEO notes and return issues, fixes, priorities, and verification notes. Do not claim crawling.", "Return Markdown with: # SEO Audit; ## Executive Summary; ## Issues Table; ## Quick Wins; ## Content Fixes; ## Metadata Fixes; ## Internal Link Fixes; ## Verification Needed."),
  "internal-link-suggestion-generator": p("Internal Link Suggestion Generator", 3, [
    { id: "source_page", label: "Source page", required: true, minLength: 20, maxLength: 16000 },
    { id: "available_pages", label: "Available internal pages", required: true, minLength: 10, maxLength: 16000 },
    { id: "primary_keyword", label: "Primary keyword", required: false, maxLength: 250 },
    { id: "linking_goal", label: "Linking goal", required: true, minLength: 2, maxLength: 160 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Generate internal link opportunities, anchor text, and placement ideas from the pasted source page and available page list only.", "Return Markdown with: # Internal Link Suggestions; a table with Source Section, Target Page, Anchor Text, Placement Reason, Priority; ## Pages Missing From Map; ## Notes."),
  "seo-faq-generator": p("SEO FAQ Generator", 3, topicFields, "Generate SEO-friendly FAQs and concise answer blocks from the supplied topic and business context.", "Return Markdown with: # SEO FAQ Set; ## Best FAQs; ## Short Answer Blocks; ## Long Answer Notes; ## Schema-Ready Q&A Draft; ## Verification Notes."),
  "seo-slug-generator": p("SEO Slug Generator", 1, [
    { id: "page_title", label: "Page title", required: true, minLength: 2, maxLength: 300 },
    { id: "primary_keyword", label: "Primary keyword", required: false, maxLength: 250 },
    { id: "slug_style", label: "Slug style", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 1000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Generate clean SEO URL slug options from the supplied title/topic.", "Return Markdown with: # SEO Slug Options; a table with Slug, Style, Use Case, Notes; ## Best Pick."),
  "image-alt-text-generator": p("Image Alt Text Generator", 1, [
    { id: "image_context", label: "Image description / context", required: true, minLength: 10, maxLength: 8000 },
    { id: "primary_keyword", label: "Primary keyword", required: false, maxLength: 250 },
    { id: "page_context", label: "Page context", required: false, maxLength: 6000 },
    { id: "alt_count", label: "Alt count", required: true, minLength: 2, maxLength: 80 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Write accessible, SEO-friendly alt text based only on the supplied image description and page context.", "Return Markdown with: # Image Alt Text Options; a table with Alt Text, Best Use, Accessibility Note; ## Best Pick; ## Avoid Notes."),
  "content-refresh-optimizer": p("Content Refresh Optimizer", 4, pageFields, "Create a refresh plan for old content, identifying outdated sections, missing angles, rewrite opportunities, and update priorities.", "Return Markdown with: # Content Refresh Plan; ## What to Keep; ## What to Update; ## Missing Sections; ## New Angles; ## Rewrite Plan; ## Priority Checklist; ## Verification Notes."),
  "serp-feature-opportunity-finder": p("SERP Feature Opportunity Finder", 3, [
    { id: "keyword_or_topic", label: "Keyword / topic", required: true, minLength: 2, maxLength: 300 },
    { id: "serp_notes", label: "SERP notes", required: false, maxLength: 12000 },
    { id: "page_content", label: "Page content", required: false, maxLength: 16000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Find featured snippet, FAQ, answer-box, local, and comparison opportunities using supplied SERP notes or page context. Do not imply live search.", "Return Markdown with: # SERP Feature Opportunities; ## Opportunity Table; ## Snippet Targets; ## FAQ/PAA Ideas; ## Content Blocks to Add; ## Verification Notes."),
  "keyword-cannibalization-checker": p("Keyword Cannibalization Checker", 3, [
    { id: "page_keyword_map", label: "Pages + target keywords", required: true, minLength: 20, maxLength: 18000 },
    { id: "business_context", label: "Business / website context", required: true, minLength: 10, maxLength: 8000 },
    { id: "priority_goal", label: "Priority goal", required: true, minLength: 2, maxLength: 160 },
    { id: "depth", label: "Depth", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Review the pasted page-keyword map for likely overlap, conflicts, consolidation opportunities, and page targeting fixes.", "Return Markdown with: # Keyword Cannibalization Review; ## Potential Conflicts; ## Consolidation Opportunities; ## Keep/Update/Merge Table; ## Internal Link Fixes; ## Verification Needed."),
  "local-seo-keyword-generator": p("Local SEO Keyword Generator", 3, [
    { id: "business_type", label: "Business type / service", required: true, minLength: 2, maxLength: 250 },
    { id: "location", label: "Location", required: true, minLength: 2, maxLength: 250 },
    { id: "services", label: "Services / products", required: true, minLength: 5, maxLength: 8000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "intent", label: "Intent focus", required: true, minLength: 2, maxLength: 120 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2500 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Generate local SEO keyword ideas, service modifiers, neighborhood terms, and intent buckets from supplied business/location facts.", "Return Markdown with: # Local SEO Keywords; ## Core Keywords; ## Service Keywords; ## Near Me Variations; ## Location Modifiers; ## Question Keywords; ## Content Ideas."),
  "google-business-profile-description-generator": p("Google Business Profile Description Generator", 2, [
    { id: "business_name", label: "Business name", required: true, minLength: 2, maxLength: 250 },
    { id: "business_facts", label: "Business facts", required: true, minLength: 20, maxLength: 10000 },
    { id: "location", label: "Location / service area", required: true, minLength: 2, maxLength: 250 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2500 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Write polished Google Business Profile descriptions and service blurbs from supplied business facts only.", "Return Markdown with: # Google Business Profile Descriptions; ## Best Description; ## Alternative Descriptions; ## Service Blurbs; ## Verification Notes.")
};
