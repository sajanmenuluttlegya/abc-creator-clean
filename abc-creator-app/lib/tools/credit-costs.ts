import { BLOG_TOOL_CREDIT_COSTS } from "./blog-tool-credits";

export type ToolInputs = Record<string, string>;

export type CreditEstimate = {
  credits: number;
  isDynamic: boolean;
  label: string;
};

export const IMAGE_CREDITS_PER_IMAGE = 1;
export const IMAGE_EDIT_CREDITS = 1;

export const IMAGE_GENERATION_TOOL_SLUGS = [
  "blog-topic-ideas",
  "blog-outline",
  "blog-content",
  "pro-image-brief-for-blog",
  "blog-seo-pack",
  "quick-1-click-blog-post",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "rewrite-article-with-keywords",
  "blog-content-calendar",
  "blog-title-generator",
  "blog-intro-generator",
  "blog-conclusion-generator",
  "faq-generator",
  "facebook-ad-copy",
  "product-description",
  "image-to-instagram-caption",
  "instagram-page-name-bio-generator",
  "social-media-bio-generator",
] as const;

const BASE_TOOL_CREDITS: Record<string, number> = {
  "blog-topic-ideas": 1,
  "blog-outline": 3,
  "blog-content": 7,
  "pro-image-brief-for-blog": 1,
  "blog-seo-pack": 5,
  ...BLOG_TOOL_CREDIT_COSTS,
  "image-to-instagram-caption": 3,
  "instagram-page-name-bio-generator": 1,
  "social-media-bio-generator": 1,
  "facebook-ad-copy": 4,
  "product-description": 3,
};

const BLOG_TOPIC_IDEA_COUNT_CREDITS: Array<[string, number]> = [
  ["50 ideas", 5],
  ["30 ideas", 4],
  ["20 ideas", 3],
  ["10 ideas", 2],
  ["5 ideas", 1],
];

const BLOG_OUTLINE_WORD_COUNT_CREDITS: Array<[string, number]> = [
  ["Authority pillar article", 15],
  ["Premium pillar article", 9],
  ["Very long article", 7],
  ["Long article", 5],
  ["Standard article", 4],
  ["Short article", 3],
];

const BLOG_CONTENT_WORD_COUNT_CREDITS: Array<[string, number]> = [
  ["Authority pillar article", 49],
  ["Premium pillar article", 39],
  ["Very long article", 27],
  ["Long article", 15],
  ["Standard article", 9],
  ["Short article", 7],
];

const BLOG_CONTENT_SECTION_FLOORS: Array<[string, number]> = [
  ["Very long", 0],
  ["Long", 0],
  ["Medium", 0],
  ["Short", 0],
  ["Very short", 0],
  ["2 paragraphs", 0],
];

const PRESET_BLOG_WORD_COUNT_CREDITS: Array<[string, number]> = [
  ["Authority pillar article", 32],
  ["Premium pillar article", 16],
  ["Very long article", 13],
  ["Long article", 10],
  ["Standard article", 8],
  ["Short article", 6],
];

const ARTICLE_REWRITE_LENGTH_CREDITS: Array<[string, number]> = [
  ["Authority rewrite", 20],
  ["Premium rewrite", 16],
  ["Very long rewrite", 12],
  ["Long rewrite", 8],
  ["Standard rewrite", 5],
  ["Short rewrite", 3],
];

const QUICK_BLOG_LENGTH_CREDITS: Array<[string, number]> = [
  ["authority", 20],
  ["very long", 10],
  ["long", 8],
  ["standard", 6],
  ["short", 4],
  ["Very short", 3],
];

const IMAGE_BRIEF_COUNT_CREDITS: Array<[string, number]> = [
  ["7 images", 3],
  ["5 images", 2],
  ["3 images", 2],
  ["1 image", 1],
];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  const matched = table.find(([token]) => includes(value, token));
  return matched?.[1] ?? fallback;
}

function yes(value: string | undefined) {
  return (value || "").trim().toLowerCase() === "yes";
}

function parseCustomImageCount(value: string | undefined) {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 1) return null;
  return Math.min(count, 19);
}

function calculateCustomImageBriefCredits(value: string | undefined) {
  const count = parseCustomImageCount(value);
  if (!count) return 1;
  return Number((count * 0.9).toFixed(1));
}

function calculateFullBlogPresetCredits(toolSlug: string, inputs: ToolInputs) {
  let credits = matchCredit(inputs.word_count, PRESET_BLOG_WORD_COUNT_CREDITS, 8);

  if (toolSlug === "advanced-blog-post") {
    if (includes(inputs.expertise_level, "Expert")) credits += 2;
    if (includes(inputs.expertise_level, "Advanced")) credits += 1;
    if (includes(inputs.examples_needed, "Many") || includes(inputs.examples_needed, "Detailed")) credits += 1;
  }

  return credits;
}

export function supportsImageGeneration(toolSlug: string) {
  return IMAGE_GENERATION_TOOL_SLUGS.includes(toolSlug as (typeof IMAGE_GENERATION_TOOL_SLUGS)[number]);
}

export function calculateImageGenerationCredits(imageCount: number) {
  const safeCount = Number.isFinite(imageCount) ? Math.min(Math.max(Math.floor(imageCount), 1), 7) : 1;
  return safeCount * IMAGE_CREDITS_PER_IMAGE;
}

export function calculateImageEditCredits() {
  return IMAGE_EDIT_CREDITS;
}

export function calculateToolCreditCost(toolSlug: string, inputs: ToolInputs = {}): number {
  switch (toolSlug) {
    case "blog-topic-ideas":
      return matchCredit(inputs.idea_count, BLOG_TOPIC_IDEA_COUNT_CREDITS, 1);
    case "blog-outline":
      return matchCredit(inputs.word_count, BLOG_OUTLINE_WORD_COUNT_CREDITS, 3);
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
    case "seo-optimized-blog-post":
      return calculateFullBlogPresetCredits(toolSlug, inputs);
    case "advanced-blog-post":
      return calculateFullBlogPresetCredits(toolSlug, inputs);
    case "rewrite-article-with-keywords":
      return matchCredit(inputs.rewrite_length, ARTICLE_REWRITE_LENGTH_CREDITS, 3);
    case "quick-1-click-blog-post":
      return matchCredit(inputs.article_length, QUICK_BLOG_LENGTH_CREDITS, 6);
    case "pro-image-brief-for-blog": {
      if (includes(inputs.image_count_guidance, "Custom image count")) {
        return calculateCustomImageBriefCredits(inputs.custom_image_count);
      }

      return matchCredit(inputs.image_count_guidance, IMAGE_BRIEF_COUNT_CREDITS, 1);
    }
    default:
      return BASE_TOOL_CREDITS[toolSlug] ?? 1;
  }
}

const DYNAMIC_TOOLS = [
  "blog-topic-ideas",
  "blog-outline",
  "blog-content",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "rewrite-article-with-keywords",
  "quick-1-click-blog-post",
  "pro-image-brief-for-blog",
];

export function getToolCreditEstimate(toolSlug: string, inputs: ToolInputs = {}): CreditEstimate {
  const credits = calculateToolCreditCost(toolSlug, inputs);
  const isDynamic = DYNAMIC_TOOLS.includes(toolSlug);

  return {
    credits,
    isDynamic,
    label: `${credits} credit${credits === 1 ? "" : "s"}`,
  };
}

export function getToolCreditLabel(toolSlug: string) {
  if (toolSlug === "blog-topic-ideas") return "From 1 credit";
  if (toolSlug === "blog-outline") return "From 3 credits";
  if (toolSlug === "blog-content") return "From 7 credits";
  if (["human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post"].includes(toolSlug)) return "From 6 credits";
  if (toolSlug === "rewrite-article-with-keywords") return "From 3 credits";
  if (toolSlug === "quick-1-click-blog-post") return "From 4 credits";
  if (toolSlug === "pro-image-brief-for-blog") return "From 1 credit";
  return `${BASE_TOOL_CREDITS[toolSlug] ?? 1} credit${(BASE_TOOL_CREDITS[toolSlug] ?? 1) === 1 ? "" : "s"}`;
}
