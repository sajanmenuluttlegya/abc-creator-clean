export const FASHION_APPAREL_TOOL_CREDIT_COSTS: Record<string, number> = {
  "fashion-collection-concept-generator": 7,
  "collection-range-assortment-planner": 9,
  "apparel-design-brief-generator": 7,
  "target-customer-wearing-occasion-mapper": 7,
  "fashion-trend-research-brief-generator": 7,
  "collection-story-naming-generator": 5,
  "garment-specification-tech-pack-content-generator": 9,
  "bill-of-materials-garment-costing-planner": 9,
  "fabric-trim-specification-planner": 7,
  "colorway-palette-planner": 5,
  "print-pattern-direction-generator": 7,
  "size-range-grading-requirements-planner": 9,
  "sampling-fit-review-planner": 7,
  "production-handoff-apparel-qa-generator": 9,
  "sustainable-circular-collection-planner": 7,
  "fashion-merchandising-drop-planner": 9,
  "outfit-styling-generator": 5,
  "capsule-wardrobe-generator": 7,
  "fashion-lookbook-planner": 7,
  "fashion-photoshoot-planner": 7,
  "runway-collection-presentation-planner": 7,
  "apparel-product-description-generator": 5,
  "outfit-concept-generator": 2,
  "fashion-editorial-generator": 2,
  "fashion-lookbook-image-generator": 2,
  "fashion-collection-lineup-generator": 2,
  "garment-flat-lay-generator": 2,
  "apparel-product-mockup-generator": 2,
  "textile-pattern-generator": 2,
  "fashion-moodboard-generator": 2,
  "fashion-on-model-visual-generator": 2,
  "garment-detail-material-closeup-generator": 2,
};

export const FASHION_APPAREL_TOOL_SLUGS = Object.keys(FASHION_APPAREL_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Executive comprehensive", 9],
  ["Detailed strategic", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 9], ["5 versions", 7], ["3 versions", 5], ["1 version", 2]];
const RANGE_SIZE_CREDITS: Array<[string, number]> = [["48 styles", 15], ["36 styles", 13], ["24 styles", 11], ["18 styles", 9], ["12 styles", 7], ["8 styles", 5]];
const LOOK_COUNT_CREDITS: Array<[string, number]> = [["48 looks", 15], ["36 looks", 13], ["24 looks", 11], ["18 looks", 9], ["12 looks", 7], ["6 looks", 5]];
const OUTFIT_COUNT_CREDITS: Array<[string, number]> = [["40 outfits", 13], ["30 outfits", 11], ["20 outfits", 9], ["10 outfits", 7], ["5 outfits", 5]];
const CAPSULE_CREDITS: Array<[string, number]> = [["30-piece", 11], ["20-piece", 9], ["10-piece", 7], ["Complete", 11]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return Math.max(fallback, matchCredit(value, DEPTH_CREDITS, fallback));
}

export function calculateFashionApparelToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = FASHION_APPAREL_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!FASHION_APPAREL_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? depthCredit(inputs.output_depth, base) : base;
  if (["collection-story-naming-generator", "apparel-product-description-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }
  if (toolSlug === "collection-range-assortment-planner") {
    credits = Math.max(credits, matchCredit(inputs.range_size, RANGE_SIZE_CREDITS, base));
  }
  if (toolSlug === "fashion-lookbook-planner") {
    credits = Math.max(credits, matchCredit(inputs.look_count, LOOK_COUNT_CREDITS, base));
  }
  if (toolSlug === "outfit-styling-generator") {
    credits = Math.max(credits, matchCredit(inputs.outfit_count, OUTFIT_COUNT_CREDITS, base));
  }
  if (toolSlug === "capsule-wardrobe-generator") {
    credits = Math.max(credits, matchCredit(inputs.capsule_scope, CAPSULE_CREDITS, base));
  }
  return credits;
}

export function isFashionApparelTool(toolSlug: string) {
  return FASHION_APPAREL_TOOL_SLUGS.includes(toolSlug);
}

export function getFashionApparelToolBaseCost(toolSlug: string) {
  return FASHION_APPAREL_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
