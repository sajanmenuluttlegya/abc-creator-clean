export const FOOD_HOSPITALITY_TOOL_CREDIT_COSTS: Record<string, number> = {
  "restaurant-concept-generator": 7,
  "cafe-concept-generator": 7,
  "food-brand-concept-generator": 7,
  "restaurant-positioning-guest-persona-generator": 7,
  "restaurant-brand-story-generator": 5,
  "dining-experience-designer": 7,
  "restaurant-launch-plan-generator": 9,
  "restaurant-menu-generator": 7,
  "menu-engineering-profitability-planner": 9,
  "menu-description-dish-naming-generator": 5,
  "prix-fixe-tasting-menu-generator": 7,
  "seasonal-menu-planner": 7,
  "beverage-menu-generator": 7,
  "dietary-allergen-communication-generator": 7,
  "professional-recipe-generator": 7,
  "recipe-standardization-scaling-yield-planner": 9,
  "recipe-card-kitchen-training-generator": 7,
  "food-preparation-workflow-prep-list-generator": 7,
  "food-costing-cross-utilization-planner": 9,
  "hospitality-sop-service-recovery-generator": 7,
  "restaurant-marketing-photoshoot-planner": 7,
  "food-photography-generator": 2,
  "dish-presentation-generator": 2,
  "menu-hero-image-generator": 2,
  "restaurant-poster-generator": 2,
  "restaurant-social-creative-generator": 2,
  "restaurant-interior-mood-image-generator": 2,
  "recipe-illustration-generator": 2,
  "food-packaging-concept-generator": 2,
  "menu-cover-generator": 2,
};

export const FOOD_HOSPITALITY_TOOL_SLUGS = Object.keys(FOOD_HOSPITALITY_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Executive comprehensive", 9],
  ["Detailed strategic", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 9], ["5 versions", 7], ["3 versions", 5], ["1 version", 2]];
const ITEM_COUNT_CREDITS: Array<[string, number]> = [["48 items", 13], ["36 items", 11], ["24 items", 9], ["18 items", 7], ["12 items", 5], ["8 items", 3]];
const YIELD_CREDITS: Array<[string, number]> = [["100 portions", 11], ["50 portions", 9], ["20 portions", 7], ["10 portions", 5], ["6 portions", 4], ["4 portions", 3], ["2 portions", 2]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return Math.max(fallback, matchCredit(value, DEPTH_CREDITS, fallback));
}

export function calculateFoodHospitalityToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = FOOD_HOSPITALITY_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!FOOD_HOSPITALITY_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? depthCredit(inputs.output_depth, base) : base;
  if (["restaurant-brand-story-generator", "menu-description-dish-naming-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }
  if (["restaurant-menu-generator", "beverage-menu-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.menu_item_count, ITEM_COUNT_CREDITS, base));
  }
  if (toolSlug === "professional-recipe-generator") {
    credits = Math.max(credits, matchCredit(inputs.target_yield, YIELD_CREDITS, base));
  }
  return credits;
}

export function isFoodHospitalityTool(toolSlug: string) {
  return FOOD_HOSPITALITY_TOOL_SLUGS.includes(toolSlug);
}

export function getFoodHospitalityToolBaseCost(toolSlug: string) {
  return FOOD_HOSPITALITY_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
