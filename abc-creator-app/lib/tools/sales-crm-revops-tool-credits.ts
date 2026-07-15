import { HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS, HR_PEOPLE_OPERATIONS_TOOL_SLUGS, calculateHRPeopleOperationsToolCreditCost, getHRPeopleOperationsToolBaseCost, isHRPeopleOperationsTool } from "./hr-people-operations-tool-credits";
import { PRESENTATION_PITCH_TOOL_CREDIT_COSTS, PRESENTATION_PITCH_TOOL_SLUGS, calculatePresentationPitchToolCreditCost, getPresentationPitchToolBaseCost, isPresentationPitchTool } from "./presentation-pitch-tool-credits";

export const SALES_CRM_REVOPS_TOOL_CREDIT_COSTS: Record<string, number> = {
  "sales-revenue-operations-brief-generator": 7, "ideal-customer-profile-segmentation-planner": 9, "lead-capture-source-governance-planner": 9, "lead-qualification-framework-planner": 9,
  "lead-scoring-prioritization-planner": 9, "lead-routing-ownership-planner": 9, "inbound-lead-response-workflow-planner": 7, "outbound-prospecting-sequence-planner": 9,
  "sales-discovery-question-planner": 7, "meeting-call-preparation-planner": 7, "opportunity-stage-exit-criteria-planner": 9, "deal-qualification-review-planner": 9,
  "deal-strategy-action-plan-generator": 9, "mutual-action-plan-generator": 9, "stakeholder-buying-committee-mapper": 9, "account-plan-generator": 9,
  "territory-account-coverage-planner": 9, "pipeline-inspection-hygiene-planner": 9, "pipeline-generation-plan-generator": 9, "sales-forecast-methodology-planner": 9,
  "forecast-call-review-generator": 7, "deal-risk-slippage-review-planner": 9, "sales-proposal-requirements-generator": 9, "quote-pricing-approval-workflow-planner": 9,
  "negotiation-concession-planner": 9, "sales-to-onboarding-handoff-planner": 9, "renewal-expansion-opportunity-planner": 9, "churn-save-commercial-risk-planner": 9,
  "sales-activity-cadence-planner": 7, "sales-manager-coaching-review-planner": 9, "crm-data-governance-cleanup-planner": 9, "revops-reporting-dashboard-requirements-generator": 9,
  "lead-to-revenue-funnel-map-generator": 9, "opportunity-stage-decision-map-generator": 9, "account-stakeholder-influence-map-generator": 9, "forecast-pipeline-waterfall-map-generator": 9,
  ...HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS,
  ...PRESENTATION_PITCH_TOOL_CREDIT_COSTS,
};
export const SALES_CRM_REVOPS_TOOL_SLUGS = [...Object.keys(SALES_CRM_REVOPS_TOOL_CREDIT_COSTS), ...HR_PEOPLE_OPERATIONS_TOOL_SLUGS.filter((slug) => !Object.prototype.hasOwnProperty.call(SALES_CRM_REVOPS_TOOL_CREDIT_COSTS, slug)), ...PRESENTATION_PITCH_TOOL_SLUGS.filter((slug) => !Object.prototype.hasOwnProperty.call(SALES_CRM_REVOPS_TOOL_CREDIT_COSTS, slug))];
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed revenue pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateSalesCRMRevOpsToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  if (isHRPeopleOperationsTool(toolSlug)) return calculateHRPeopleOperationsToolCreditCost(toolSlug, inputs);
  if (isPresentationPitchTool(toolSlug)) return calculatePresentationPitchToolCreditCost(toolSlug, inputs);
  const base = SALES_CRM_REVOPS_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!SALES_CRM_REVOPS_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base;
  if (["lead-to-revenue-funnel-map-generator", "opportunity-stage-decision-map-generator", "account-stakeholder-influence-map-generator", "forecast-pipeline-waterfall-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  return credits;
}
export function isSalesCRMRevOpsTool(toolSlug: string) { return SALES_CRM_REVOPS_TOOL_SLUGS.includes(toolSlug); }
export function getSalesCRMRevOpsToolBaseCost(toolSlug: string) { if (isHRPeopleOperationsTool(toolSlug)) return getHRPeopleOperationsToolBaseCost(toolSlug); if (isPresentationPitchTool(toolSlug)) return getPresentationPitchToolBaseCost(toolSlug); return SALES_CRM_REVOPS_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
