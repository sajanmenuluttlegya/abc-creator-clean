export const MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS: Record<string, number> = {
  "integrated-marketing-campaign-planner": 9,
  "professional-campaign-brief-generator": 7,
  "campaign-objective-kpi-framework-generator": 7,
  "campaign-audience-segmentation-planner": 7,
  "customer-journey-campaign-funnel-mapper": 7,
  "campaign-positioning-big-idea-generator": 7,
  "campaign-messaging-architecture-generator": 7,
  "campaign-offer-incentive-strategy-planner": 7,
  "channel-mix-media-strategy-generator": 9,
  "campaign-budget-allocation-planner": 9,
  "campaign-calendar-rollout-planner": 7,
  "campaign-content-matrix-generator": 7,
  "campaign-asset-requirements-generator": 7,
  "campaign-production-workflow-generator": 7,
  "campaign-team-responsibility-planner": 5,
  "product-launch-campaign-planner": 9,
  "lead-generation-campaign-planner": 9,
  "customer-nurture-product-adoption-planner": 7,
  "re-engagement-win-back-campaign-planner": 7,
  "event-webinar-campaign-planner": 7,
  "influencer-creator-campaign-planner": 9,
  "partnership-co-marketing-campaign-planner": 7,
  "campaign-experiment-ab-test-planner": 7,
  "campaign-performance-review-optimization-generator": 9,
  "campaign-key-visual-generator": 2,
  "multi-channel-campaign-creative-generator": 2,
  "campaign-social-creative-generator": 2,
  "campaign-email-landing-hero-generator": 2,
  "campaign-creative-variation-generator": 2,
  "campaign-moodboard-art-direction-generator": 2,
};

export const MARKETING_CAMPAIGN_TOOL_SLUGS = Object.keys(MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Executive comprehensive", 9],
  ["Detailed strategic", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 9], ["5 versions", 7], ["3 versions", 5], ["1 version", 2]];
const ASSET_COUNT_CREDITS: Array<[string, number]> = [["48 assets", 15], ["36 assets", 13], ["24 assets", 11], ["18 assets", 9], ["12 assets", 7], ["8 assets", 5]];
const SEGMENT_COUNT_CREDITS: Array<[string, number]> = [["6 segments", 11], ["5 segments", 9], ["4 segments", 7], ["3 segments", 5], ["2 segments", 3]];
const SCENARIO_CREDITS: Array<[string, number]> = [["5 scenarios", 9], ["3 scenarios", 7], ["1 scenario", 3]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return value ? matchCredit(value, DEPTH_CREDITS, fallback) : fallback;
}

export function calculateMarketingCampaignToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!MARKETING_CAMPAIGN_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? depthCredit(inputs.output_depth, base) : base;
  if (toolSlug === "campaign-positioning-big-idea-generator") {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }
  if (["campaign-content-matrix-generator", "campaign-asset-requirements-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.asset_count, ASSET_COUNT_CREDITS, base));
  }
  if (toolSlug === "campaign-audience-segmentation-planner") {
    credits = Math.max(credits, matchCredit(inputs.segment_count, SEGMENT_COUNT_CREDITS, base));
  }
  if (["campaign-offer-incentive-strategy-planner", "campaign-budget-allocation-planner"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.offer_scenarios || inputs.budget_scenarios, SCENARIO_CREDITS, base));
  }
  return credits;
}

export function isMarketingCampaignTool(toolSlug: string) {
  return MARKETING_CAMPAIGN_TOOL_SLUGS.includes(toolSlug);
}

export function getMarketingCampaignToolBaseCost(toolSlug: string) {
  return MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
