import { BLOG_TOOL_CREDIT_COSTS } from "./blog-tool-credits";
import { PLATFORM_TOOL_CREDIT_COSTS } from "./platform-tool-credits";
import { CAMPAIGN_TOOL_CREDIT_COSTS } from "./campaign-tool-credits";
import { BLOG_BATCH_TOOL_CREDIT_COSTS } from "./blog-batch-tool-credits";
import { SEO_BATCH_TOOL_CREDIT_COSTS } from "./seo-batch-tool-credits";
import { WRITING_BATCH_TOOL_CREDIT_COSTS } from "./writing-batch-tool-credits";

export type ToolInputs = Record<string, string>;
export type CreditEstimate = { credits: number; isDynamic: boolean; label: string };

export function scaleCreditAmount(credits: number) {
  const safeCredits = Math.ceil(Number.isFinite(credits) ? Math.max(0, credits) : 0);
  if (safeCredits <= 0) return 0;
  const exactScale: Record<number, number> = { 1: 2, 2: 5, 3: 5, 4: 6, 5: 9, 6: 11, 7: 13, 8: 15, 9: 17 };
  return exactScale[safeCredits] ?? safeCredits + 20;
}

function creditText(credits: number) {
  return `${credits} credit${credits === 1 ? "" : "s"}`;
}

export const IMAGE_CREDITS_PER_IMAGE = scaleCreditAmount(1);
export const IMAGE_EDIT_CREDITS = 4;

export const IMAGE_GENERATION_TOOL_SLUGS = ["blog-content", "pro-image-brief-for-blog", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "quick-1-click-blog-post", "comparison-blog-writer", "youtube-video-to-blog-post"] as const;

const WRITING_BATCH_TOOL_SLUGS = Object.keys(WRITING_BATCH_TOOL_CREDIT_COSTS);

const EXACT_TOOL_CREDIT_OVERRIDES: Record<string, number> = {
  "poem-generator": 2,
  "slogan-generator": 2,
  "tagline-generator": 2,
  "name-generator": 2,
  "headline-generator": 2,
  "universal-prompt-enhancer": 2,
  "subject-line-generator": 2,
  "email-newsletter-generator": 3,
  "follow-up-email-generator": 2,
  "sales-email-generator": 3,
  "welcome-email-generator": 2,
  "product-launch-email-generator": 3,
  "value-proposition-generator": 2,
  "pain-point-generator": 2,
  "feature-to-benefit-converter": 2,
  "offer-generator": 3,
  "aida-copy-generator": 2,
  "pas-copy-generator": 2,
  "objection-handler-generator": 3,
  "sales-pitch-generator": 3,
  "usp-generator": 2,
  "product-angle-generator": 2,
  "keyword-generator": 2,
  "seo-title-generator": 2,
  "seo-description-generator": 2,
  "faq-schema-generator": 4,
  "content-gap-ideas": 4,
  "content-audit": 5,
  "seo-score": 3,
  "seo-meta-citation-gap-finder": 5,
  "ai-search-visibility-score": 5,
  "ai-email-generator": 2,
  "email-campaign-writer": 3,
  "product-description-generator": 3,
  "amazon-product-listing-generator": 4,
  "shopify-product-description-generator": 3,
  "product-benefit-generator": 2,
  "product-review-writer": 3,
  "product-comparison-writer": 3,
  "social-media-calendar": 4,
  "replies-for-facebook": 2,
  "replies-for-twitter-x": 2,
  "replies-for-linkedin": 2,
  "replies-for-instagram": 2,
  "instagram-threads-generator": 3,
  "tiktok-caption-generator": 2,
  "motivational-posts-generator": 2,
  "social-hook-generator": 2,
  "twitter-x-post-generator": 2,
  "instagram-reel-script": 3,
  "tiktok-video-script-generator": 3,
  "linkedin-post-generator": 2,
  "twitter-x-thread-generator": 3,
  "facebook-post-generator": 2,
  "content-calendar-generator": 4,
  "carousel-post-generator": 3,
  ["fan-fiction-short-" + "drama-builder"]: 3,
  ["short-" + "drama-creator-studio"]: 4,
  ["cold-" + "email-personalizer"]: 5,
};

const BASE_TOOL_CREDITS: Record<string, number> = {
  "blog-topic-ideas": 1,
  "blog-outline": 3,
  "blog-content": 7,
  "pro-image-brief-for-blog": 1,
  "blog-seo-pack": 5,
  ...BLOG_TOOL_CREDIT_COSTS,
  ...BLOG_BATCH_TOOL_CREDIT_COSTS,
  ...SEO_BATCH_TOOL_CREDIT_COSTS,
  ...PLATFORM_TOOL_CREDIT_COSTS,
  ...CAMPAIGN_TOOL_CREDIT_COSTS,
  ...WRITING_BATCH_TOOL_CREDIT_COSTS,
  "image-to-instagram-caption": 3,
  "instagram-page-name-bio-generator": 1,
  "social-media-bio-generator": 1,
  "business-name-generator": 1,
  "long-tail-keyword-generator": 2,
  "ai-prompt-generator": 1,
  "ai-paraphrasing-tool": 2,
  "ai-paragraph-generator": 2,
  "ai-report-writing": 3,
  "facebook-ad-copy": 4,
  "product-description": 3,
  "ai-email-generator": 2,
  "email-campaign-writer": 3,
  "product-description-generator": 3,
  "amazon-product-listing-generator": 4,
  "shopify-product-description-generator": 3,
  "product-benefit-generator": 2,
  "product-review-writer": 3,
  "product-comparison-writer": 3,
  "social-media-calendar": 4,
  "replies-for-facebook": 2,
  "replies-for-twitter-x": 2,
  "replies-for-linkedin": 2,
  "replies-for-instagram": 2,
  "instagram-threads-generator": 3,
  "tiktok-caption-generator": 2,
  "motivational-posts-generator": 2,
  "social-hook-generator": 2,
  "twitter-x-post-generator": 2,
  "instagram-reel-script": 3,
  "tiktok-video-script-generator": 3,
  "linkedin-post-generator": 2,
  "twitter-x-thread-generator": 3,
  "facebook-post-generator": 2,
  "content-calendar-generator": 4,
  "carousel-post-generator": 3,
};

const BLOG_TOPIC_IDEA_COUNT_CREDITS: Array<[string, number]> = [["50 ideas", 5], ["30 ideas", 4], ["20 ideas", 3], ["10 ideas", 2], ["5 ideas", 1]];
const BLOG_OUTLINE_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 15], ["Premium pillar article", 9], ["Very long article", 7], ["Long article", 5], ["Standard article", 4], ["Short article", 3]];
const BLOG_CONTENT_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 49], ["Premium pillar article", 39], ["Very long article", 27], ["Long article", 15], ["Standard article", 9], ["Short article", 7]];
const BLOG_CONTENT_SECTION_FLOORS: Array<[string, number]> = [["Very long", 0], ["Long", 0], ["Medium", 0], ["Short", 0], ["Very short", 0], ["2 paragraphs", 0]];
const PRESET_BLOG_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 32], ["Premium pillar article", 16], ["Very long article", 13], ["Long article", 10], ["Standard article", 8], ["Short article", 6]];
const ARTICLE_REWRITE_LENGTH_CREDITS: Array<[string, number]> = [["Authority rewrite", 5], ["Premium rewrite", 5], ["Very long rewrite", 5], ["Long rewrite", 5], ["Standard rewrite", 2], ["Short rewrite", 1]];
const QUICK_BLOG_LENGTH_CREDITS: Array<[string, number]> = [["authority", 20], ["very long", 10], ["long", 8], ["standard", 6], ["short", 4], ["Very short", 3]];
const REPORT_LENGTH_CREDITS: Array<[string, number]> = [["Premium report", 5], ["Detailed report", 5], ["Standard report", 2], ["Short report", 1]];
const IMAGE_BRIEF_COUNT_CREDITS: Array<[string, number]> = [["7 images", 3], ["5 images", 2], ["3 images", 2], ["1 image", 1]];
const VARIATION_COUNT_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 2], ["3 variations", 1]];
const WRITING_OUTPUT_LENGTH_CREDITS: Array<[string, number]> = [["Detailed", 5], ["Long", 5], ["Medium", 2], ["Short", 1]];
const SCRIPT_LENGTH_CREDITS: Array<[string, number]> = [["10 minutes", 5], ["5 minutes", 5], ["2 minutes", 2], ["60 seconds", 1], ["30 seconds", 1]];
const SLIDE_COUNT_CREDITS: Array<[string, number]> = [["15 slides", 5], ["10 slides", 2], ["8 slides", 2], ["5 slides", 1]];
const PARAGRAPH_COUNT_CREDITS: Array<[string, number]> = [["10 paragraphs", 5], ["5 paragraphs", 2], ["3 paragraphs", 2], ["1 paragraph", 1]];
const QUOTE_COUNT_CREDITS: Array<[string, number]> = [["10 versions", 5], ["5 versions", 2], ["3 versions", 1], ["1 version", 1]];

function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
function yes(value: string | undefined) { return (value || "").trim().toLowerCase() === "yes"; }
function parseCustomImageCount(value: string | undefined) { const count = Math.floor(Number(value)); return Number.isFinite(count) && count >= 1 ? Math.min(count, 19) : null; }
function calculateCustomImageBriefCredits(value: string | undefined) { const count = parseCustomImageCount(value); return count ? Number((count * 0.9).toFixed(1)) : 1; }
function calculateVariationToolCredits(value: string | undefined) { return matchCredit(value, VARIATION_COUNT_CREDITS, 1); }
function calculateWritingLengthCredits(inputs: ToolInputs, fallback = 1) { return matchCredit(inputs.output_length, WRITING_OUTPUT_LENGTH_CREDITS, fallback); }

function calculateFullBlogPresetCredits(toolSlug: string, inputs: ToolInputs) {
  let credits = matchCredit(inputs.word_count, PRESET_BLOG_WORD_COUNT_CREDITS, 8);
  if (toolSlug === "advanced-blog-post") {
    if (includes(inputs.expertise_level, "Expert")) credits += 2;
    if (includes(inputs.expertise_level, "Advanced")) credits += 1;
    if (includes(inputs.examples_needed, "Many") || includes(inputs.examples_needed, "Detailed")) credits += 1;
  }
  return credits;
}

function calculateWritingToolCredits(toolSlug: string, inputs: ToolInputs) {
  if (toolSlug === "quotes-generator") return matchCredit(inputs.quote_count, QUOTE_COUNT_CREDITS, 1);
  if (toolSlug === "presentation-slides-text-generator") return matchCredit(inputs.slide_count, SLIDE_COUNT_CREDITS, 1);
  if (toolSlug === "paragraph-generator" || toolSlug === "ai-paragraph-generator") return matchCredit(inputs.paragraph_count, PARAGRAPH_COUNT_CREDITS, 1);
  if (toolSlug === "kids-video-script-generator" || toolSlug === "whiteboard-animation-script") return Math.max(calculateWritingLengthCredits(inputs, 1), matchCredit(inputs.script_length, SCRIPT_LENGTH_CREDITS, 1));
  return calculateWritingLengthCredits(inputs, BASE_TOOL_CREDITS[toolSlug] ?? 1);
}

export function supportsImageGeneration(toolSlug: string) { return IMAGE_GENERATION_TOOL_SLUGS.includes(toolSlug as (typeof IMAGE_GENERATION_TOOL_SLUGS)[number]); }
export function calculateImageGenerationCredits(imageCount: number) { const safeCount = Number.isFinite(imageCount) ? Math.min(Math.max(Math.floor(imageCount), 1), 7) : 1; return safeCount * IMAGE_CREDITS_PER_IMAGE; }
export function calculateImageEditCredits() { return IMAGE_EDIT_CREDITS; }

function calculateRawToolCreditCost(toolSlug: string, inputs: ToolInputs = {}) {
  switch (toolSlug) {
    case "blog-topic-ideas": return matchCredit(inputs.idea_count, BLOG_TOPIC_IDEA_COUNT_CREDITS, 1);
    case "blog-outline": return matchCredit(inputs.word_count, BLOG_OUTLINE_WORD_COUNT_CREDITS, 3);
    case "blog-content": {
      let credits = matchCredit(inputs.word_count, BLOG_CONTENT_WORD_COUNT_CREDITS, 7);
      credits = Math.max(credits, matchCredit(inputs.words_per_section, BLOG_CONTENT_SECTION_FLOORS, 0));
      if (includes(inputs.article_depth, "Detailed")) credits += 4;
      if (includes(inputs.article_depth, "Expert")) credits += 10;
      if (yes(inputs.include_table)) credits += 4;
      if (yes(inputs.include_list)) credits += 3;
      if (yes(inputs.include_key_takeaways)) credits += 2;
      if (yes(inputs.include_faq)) credits += 3;
      if (includes(inputs.image_brief_mode, "Hero image brief only") || includes(inputs.image_brief_mode, "Hero image only")) credits += 3;
      if (includes(inputs.image_brief_mode, "Hero + section image briefs") || includes(inputs.image_brief_mode, "Hero + section images")) credits += 8;
      return credits;
    }
    case "human-style-blog-post":
    case "seo-optimized-blog-post": return calculateFullBlogPresetCredits(toolSlug, inputs);
    case "advanced-blog-post": return calculateFullBlogPresetCredits(toolSlug, inputs);
    case "rewrite-article-with-keywords": return matchCredit(inputs.rewrite_length, ARTICLE_REWRITE_LENGTH_CREDITS, 1);
    case "quick-1-click-blog-post": return matchCredit(inputs.article_length, QUICK_BLOG_LENGTH_CREDITS, 6);
    case "ai-report-writing": return matchCredit(inputs.report_length, REPORT_LENGTH_CREDITS, 1);
    case "ai-paragraph-generator": return calculateWritingToolCredits(toolSlug, inputs);
    case "blog-to-social-posts": return calculateVariationToolCredits(inputs.post_count);
    case "blog-to-email": return calculateVariationToolCredits(inputs.email_count);
    case "blog-to-reels-script": return calculateVariationToolCredits(inputs.script_count);
    case "pro-image-brief-for-blog": return includes(inputs.image_count_guidance, "Custom image count") ? calculateCustomImageBriefCredits(inputs.custom_image_count) : matchCredit(inputs.image_count_guidance, IMAGE_BRIEF_COUNT_CREDITS, 1);
    default: return WRITING_BATCH_TOOL_SLUGS.includes(toolSlug) ? calculateWritingToolCredits(toolSlug, inputs) : BASE_TOOL_CREDITS[toolSlug] ?? 1;
  }
}

export function calculateToolCreditCost(toolSlug: string, inputs: ToolInputs = {}) {
  const exactCredits = EXACT_TOOL_CREDIT_OVERRIDES[toolSlug];
  if (typeof exactCredits === "number") return exactCredits;
  return scaleCreditAmount(calculateRawToolCreditCost(toolSlug, inputs));
}

const DYNAMIC_TOOLS = ["blog-topic-ideas", "blog-outline", "blog-content", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "rewrite-article-with-keywords", "quick-1-click-blog-post", "pro-image-brief-for-blog", "ai-report-writing", "ai-paragraph-generator", "blog-to-social-posts", "blog-to-email", "blog-to-reels-script", ...WRITING_BATCH_TOOL_SLUGS];

export function getToolCreditEstimate(toolSlug: string, inputs: ToolInputs = {}): CreditEstimate {
  const credits = calculateToolCreditCost(toolSlug, inputs);
  return { credits, isDynamic: DYNAMIC_TOOLS.includes(toolSlug), label: creditText(credits) };
}

export function getToolCreditLabel(toolSlug: string) {
  const exactCredits = EXACT_TOOL_CREDIT_OVERRIDES[toolSlug];
  if (typeof exactCredits === "number") return creditText(exactCredits);
  if (toolSlug === "blog-topic-ideas") return `From ${creditText(scaleCreditAmount(1))}`;
  if (toolSlug === "blog-outline") return `From ${creditText(scaleCreditAmount(3))}`;
  if (toolSlug === "blog-content") return `From ${creditText(scaleCreditAmount(7))}`;
  if (["human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post"].includes(toolSlug)) return `From ${creditText(scaleCreditAmount(6))}`;
  if (toolSlug === "quick-1-click-blog-post") return `From ${creditText(scaleCreditAmount(4))}`;
  if (["rewrite-article-with-keywords", "pro-image-brief-for-blog", "ai-report-writing", "ai-paragraph-generator", "blog-to-social-posts", "blog-to-email", "blog-to-reels-script"].includes(toolSlug)) return `From ${creditText(scaleCreditAmount(1))}`;
  if (WRITING_BATCH_TOOL_SLUGS.includes(toolSlug)) return `From ${creditText(scaleCreditAmount(1))}`;
  return creditText(scaleCreditAmount(BASE_TOOL_CREDITS[toolSlug] ?? 1));
}
