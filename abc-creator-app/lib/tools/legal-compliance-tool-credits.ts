export const LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS: Record<string, number> = {
  "legal-compliance-brief-generator": 7, "regulatory-applicability-assessment-planner": 9, "policy-governance-framework-generator": 7, "legal-obligation-register-generator": 9,
  "compliance-risk-assessment-planner": 9, "controls-evidence-mapping-generator": 9, "compliance-monitoring-testing-plan-generator": 9, "compliance-training-awareness-planner": 7,
  "issue-remediation-cap-plan-generator": 7, "audit-examination-readiness-planner": 9, "contract-intake-requirements-generator": 7, "contract-clause-review-planner": 9,
  "contract-negotiation-playbook-generator": 9, "contract-obligation-renewal-tracker-planner": 9, "nda-confidentiality-review-planner": 7, "vendor-third-party-risk-planner": 9,
  "data-processing-vendor-contract-review-planner": 9, "privacy-program-roadmap-generator": 9, "data-inventory-ropa-planner": 9, "privacy-notice-transparency-planner": 7,
  "consent-cookie-preference-workflow-planner": 9, "dsar-rights-request-workflow-planner": 9, "dpia-privacy-risk-assessment-planner": 9, "data-retention-deletion-schedule-planner": 9,
  "incident-breach-response-planner": 9, "ai-governance-risk-assessment-planner": 9, "employment-policy-hr-compliance-planner": 9, "workplace-investigation-process-planner": 9,
  "intellectual-property-asset-register-planner": 9, "marketing-ad-claims-compliance-review-planner": 9, "product-regulatory-compliance-planner": 9, "board-compliance-reporting-pack-generator": 9,
  "compliance-obligation-control-map-generator": 9, "privacy-data-flow-map-generator": 9, "contract-lifecycle-obligation-map-generator": 9, "incident-response-escalation-map-generator": 9,
};
export const LEGAL_COMPLIANCE_TOOL_SLUGS = Object.keys(LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed compliance pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateLegalComplianceToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!LEGAL_COMPLIANCE_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base;
  if (["compliance-obligation-control-map-generator", "privacy-data-flow-map-generator", "contract-lifecycle-obligation-map-generator", "incident-response-escalation-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  return credits;
}
export function isLegalComplianceTool(toolSlug: string) { return LEGAL_COMPLIANCE_TOOL_SLUGS.includes(toolSlug); }
export function getLegalComplianceToolBaseCost(toolSlug: string) { return LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
