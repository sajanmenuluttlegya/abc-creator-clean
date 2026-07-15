export const CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS: Record<string, number> = {
  "cybersecurity-it-operations-brief-generator": 7, "security-program-roadmap-generator": 9, "nist-csf-profile-gap-planner": 9, "security-control-framework-mapping-planner": 9,
  "technology-asset-inventory-ownership-planner": 9, "data-classification-handling-planner": 9, "identity-access-management-planner": 9, "joiner-mover-leaver-access-workflow-planner": 9,
  "privileged-access-management-planner": 9, "security-architecture-review-planner": 9, "cloud-security-requirements-planner": 9, "saas-vendor-security-review-planner": 9,
  "secure-configuration-hardening-planner": 9, "vulnerability-management-program-planner": 9, "patch-management-remediation-planner": 9, "cybersecurity-risk-assessment-planner": 9,
  "defensive-threat-modeling-planner": 9, "security-testing-assurance-planner": 9, "security-logging-monitoring-requirements-generator": 9, "siem-detection-use-case-governance-planner": 9,
  "security-incident-response-plan-generator": 9, "incident-triage-severity-framework-generator": 9, "ransomware-readiness-recovery-planner": 9, "data-breach-response-planner": 9,
  "business-continuity-disaster-recovery-planner": 9, "backup-restore-assurance-planner": 9, "it-change-release-management-planner": 9, "it-service-catalog-request-workflow-planner": 9,
  "it-problem-management-root-cause-planner": 9, "security-awareness-role-training-planner": 7, "cybersecurity-metrics-board-reporting-planner": 9, "security-soc-operating-model-planner": 9,
  "security-control-evidence-map-generator": 9, "system-data-trust-boundary-map-generator": 9, "cyber-incident-response-escalation-map-generator": 9, "it-service-change-dependency-map-generator": 9,
};
export const CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS = Object.keys(CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed security pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateCybersecurityITOperationsToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) { const base = CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS[toolSlug] ?? 1; if (!CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS.includes(toolSlug)) return 1; let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base; if (["security-control-evidence-map-generator", "system-data-trust-boundary-map-generator", "cyber-incident-response-escalation-map-generator", "it-service-change-dependency-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base)); return credits; }
export function isCybersecurityITOperationsTool(toolSlug: string) { return CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS.includes(toolSlug); }
export function getCybersecurityITOperationsToolBaseCost(toolSlug: string) { return CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
