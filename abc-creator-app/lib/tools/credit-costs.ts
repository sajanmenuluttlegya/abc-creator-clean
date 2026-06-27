export type ToolInputs = Record<string, string>;

export type CreditEstimate = {
  credits: number;
  isDynamic: boolean;
  label: string;
};

export const IMAGE_CREDITS_PER_IMAGE = 23;

export const IMAGE_GENERATION_TOOL_SLUGS = [
  "blog-content",
  "pro-image-brief-for-blog",
] as const;

const BASE_TOOL_CREDITS: Record<string, number> = {
  "blog-topic-ideas": 3,
  "blog-outline": 5,
  "blog-content": 8,
  "pro-image-brief-for-blog": 5,
  "blog-seo-pack": 5,
  "facebook-ad-copy": 4,
  "product-description": 3,
};

const BLOG_TOPIC_IDEA_COUNT_CREDITS: Array<[string, number]> = [
  ["50 ideas", 28],
  ["30 ideas", 14],
  ["20 ideas", 8],
  ["10 ideas", 3],
];

const BLOG_OUTLINE_WORD_COUNT_CREDITS: Array<[string, number]> = [
  ["Premium pillar article", 22],
  ["Very long article", 16],
  ["Long article", 11],
  ["Standard article", 7],
  ["Short article", 5],
];

const BLOG_CONTENT_WORD_COUNT_CREDITS: Array<[string, number]> = [
  ["Premium pillar article", 80],
  ["Very long article", 48],
  ["Long article", 28],
  ["Standard article", 16],
  ["Short article", 8],
];

const BLOG_CONTENT_SECTION_FLOORS: Array<[string, number]> = [
  ["Very long", 68],
  ["Long", 44],
  ["Medium", 22],
  ["Short", 12],
  ["Very short", 8],
  ["2 paragraphs", 8],
];

const IMAGE_BRIEF_COUNT_CREDITS: Array<[string, number]> = [
  ["7 images", 20],
  ["5 images", 15],
  ["3 images", 10],
  ["1 image", 5],
  ["Suggest the ideal count", 16],
];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(
  value: string | undefined,
  table: Array<[string, number]>,
  fallback: number
) {
  const matched = table.find(([token]) => includes(value, token));
  return matched?.[1] ?? fallback;
}

function yes(value: string | undefined) {
  return (value || "").trim().toLowerCase() === "yes";
}

export function supportsImageGeneration(toolSlug: string) {
  return IMAGE_GENERATION_TOOL_SLUGS.includes(
    toolSlug as (typeof IMAGE_GENERATION_TOOL_SLUGS)[number]
  );
}

export function calculateImageGenerationCredits(imageCount: number) {
  const safeCount = Number.isFinite(imageCount)
    ? Math.min(Math.max(Math.floor(imageCount), 1), 7)
    : 1;

  return safeCount * IMAGE_CREDITS_PER_IMAGE;
}

export function calculateToolCreditCost(
  toolSlug: string,
  inputs: ToolInputs = {}
): number {
  switch (toolSlug) {
    case "blog-topic-ideas":
      return matchCredit(inputs.idea_count, BLOG_TOPIC_IDEA_COUNT_CREDITS, 3);

    case "blog-outline":
      return matchCredit(inputs.word_count, BLOG_OUTLINE_WORD_COUNT_CREDITS, 5);

    case "blog-content": {
      let credits = matchCredit(inputs.word_count, BLOG_CONTENT_WORD_COUNT_CREDITS, 8);
      credits = Math.max(
        credits,
        matchCredit(inputs.words_per_section, BLOG_CONTENT_SECTION_FLOORS, 8)
      );

      if (includes(inputs.article_depth, "Detailed")) credits += 4;
      if (includes(inputs.article_depth, "Expert")) credits += 10;
      if (yes(inputs.include_table)) credits += 4;
      if (yes(inputs.include_list)) credits += 3;
      if (yes(inputs.include_key_takeaways)) credits += 2;
      if (yes(inputs.include_faq)) credits += 3;
      if (includes(inputs.image_brief_mode, "Hero image brief only")) credits += 3;
      if (includes(inputs.image_brief_mode, "Hero + section image briefs")) credits += 8;

      return credits;
    }

    case "pro-image-brief-for-blog": {
      let credits = matchCredit(inputs.image_count_guidance, IMAGE_BRIEF_COUNT_CREDITS, 5);

      if (includes(inputs.image_plan, "every major section")) credits += 6;
      if (includes(inputs.image_plan, "Custom editorial")) credits += 5;
      if (yes(inputs.include_avoidance_prompts)) credits += 2;
      if (yes(inputs.include_alt_text)) credits += 2;
      if (yes(inputs.include_captions)) credits += 2;
      if (yes(inputs.include_placement_notes)) credits += 2;

      return Math.max(credits, 5);
    }

    default:
      return BASE_TOOL_CREDITS[toolSlug] ?? 1;
  }
}

export function getToolCreditEstimate(
  toolSlug: string,
  inputs: ToolInputs = {}
): CreditEstimate {
  const credits = calculateToolCreditCost(toolSlug, inputs);
  const isDynamic = [
    "blog-topic-ideas",
    "blog-outline",
    "blog-content",
    "pro-image-brief-for-blog",
  ].includes(toolSlug);

  return {
    credits,
    isDynamic,
    label: isDynamic ? `Estimated ${credits} credits` : `${credits} credits`,
  };
}

export function getToolCreditLabel(toolSlug: string) {
  if (toolSlug === "blog-topic-ideas") return "From 3 credits";
  if (toolSlug === "blog-outline") return "From 5 credits";
  if (toolSlug === "blog-content") return "From 8 credits";
  if (toolSlug === "pro-image-brief-for-blog") return "From 5 credits";

  return `${BASE_TOOL_CREDITS[toolSlug] ?? 1} credits`;
}
