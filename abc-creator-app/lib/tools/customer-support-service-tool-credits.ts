export const CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS: Record<string, number> = {
  "customer-support-service-brief-generator": 7, "support-channel-service-model-planner": 9, "ticket-taxonomy-field-architecture-planner": 9, "support-intake-routing-requirements-generator": 9,
  "queue-assignment-workload-planner": 9, "sla-ola-priority-framework-planner": 9, "support-escalation-handoff-matrix-generator": 9, "support-coverage-operating-hours-planner": 7,
  "support-sop-playbook-generator": 9, "agent-response-tone-guide-generator": 7, "support-macro-library-generator": 9, "difficult-conversation-deescalation-planner": 7,
  "complaint-service-recovery-planner": 9, "refund-return-exception-workflow-planner": 9, "accessible-inclusive-support-planner": 9, "multilingual-support-operations-planner": 9,
  "knowledge-base-architecture-planner": 9, "help-center-article-brief-generator": 7, "knowledge-article-quality-gap-review-planner": 9, "self-service-deflection-strategy-planner": 9,
  "support-ai-agent-governance-planner": 9, "ai-support-answer-review-planner": 9, "support-quality-assurance-scorecard-generator": 9, "conversation-review-coaching-planner": 7,
  "customer-satisfaction-feedback-program-planner": 9, "voice-of-customer-insight-planner": 9, "support-metrics-reporting-framework-generator": 9, "support-workforce-capacity-staffing-planner": 9,
  "incident-customer-communication-planner": 9, "problem-management-root-cause-review-planner": 9, "customer-success-handoff-retention-risk-planner": 7, "support-platform-migration-implementation-planner": 9,
  "service-request-escalation-map-generator": 9, "customer-support-journey-service-blueprint-generator": 9, "ticket-taxonomy-routing-map-generator": 9, "incident-communication-resolution-map-generator": 9,
};
export const CUSTOMER_SUPPORT_SERVICE_TOOL_SLUGS = Object.keys(CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed service pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateCustomerSupportServiceToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!CUSTOMER_SUPPORT_SERVICE_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base;
  if (["service-request-escalation-map-generator", "customer-support-journey-service-blueprint-generator", "ticket-taxonomy-routing-map-generator", "incident-communication-resolution-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  return credits;
}
export function isCustomerSupportServiceTool(toolSlug: string) { return CUSTOMER_SUPPORT_SERVICE_TOOL_SLUGS.includes(toolSlug); }
export function getCustomerSupportServiceToolBaseCost(toolSlug: string) { return CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
