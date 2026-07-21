export const HUMAN_RESOURCES_PEOPLE_TOOL_CREDIT_COSTS: Record<string, number> = {
  "hr-people-operations-brief-generator": 7, "strategic-workforce-planning-generator": 9, "organization-design-accountability-planner": 9, "job-architecture-leveling-framework-generator": 9,
  "role-profile-job-description-generator": 7, "competency-framework-generator": 9, "recruitment-process-design-planner": 9, "structured-interview-scorecard-generator": 9,
  "candidate-evaluation-selection-review-planner": 9, "hiring-approval-offer-handoff-planner": 7, "employee-onboarding-journey-planner": 9, "new-hire-probation-checkin-planner": 7,
  "employee-handbook-policy-implementation-planner": 9, "performance-management-framework-generator": 9, "goals-okr-alignment-planner": 7, "manager-one-on-one-coaching-planner": 7,
  "performance-review-calibration-planner": 9, "learning-development-needs-planner": 9, "career-path-internal-mobility-planner": 9, "succession-talent-review-planner": 9,
  "compensation-philosophy-pay-structure-planner": 9, "pay-equity-review-planner": 9, "benefits-total-rewards-planner": 9, "employee-engagement-survey-planner": 9,
  "employee-listening-experience-planner": 9, "recognition-rewards-program-planner": 7, "employee-relations-case-management-planner": 9, "leave-absence-accommodation-workflow-planner": 9,
  "remote-hybrid-work-operating-model-planner": 9, "people-analytics-hr-metrics-framework-generator": 9, "hris-requirements-implementation-planner": 9, "offboarding-exit-knowledge-transfer-planner": 9,
  "organization-structure-accountability-map-generator": 9, "employee-lifecycle-people-process-map-generator": 9, "career-path-competency-progression-map-generator": 9, "talent-succession-pipeline-map-generator": 9,
};
export const HUMAN_RESOURCES_PEOPLE_TOOL_SLUGS = Object.keys(HUMAN_RESOURCES_PEOPLE_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed people pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateHumanResourcesPeopleToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = HUMAN_RESOURCES_PEOPLE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!HUMAN_RESOURCES_PEOPLE_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? matchCredit(inputs.output_depth, DEPTH_CREDITS, base) : base;
  if (["organization-structure-accountability-map-generator", "employee-lifecycle-people-process-map-generator", "career-path-competency-progression-map-generator", "talent-succession-pipeline-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  return credits;
}
export function isHumanResourcesPeopleTool(toolSlug: string) { return HUMAN_RESOURCES_PEOPLE_TOOL_SLUGS.includes(toolSlug); }
export function getHumanResourcesPeopleToolBaseCost(toolSlug: string) { return HUMAN_RESOURCES_PEOPLE_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
