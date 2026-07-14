export const FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS: Record<string, number> = {
  "finance-accounting-brief-generator": 7, "chart-of-accounts-design-mapping-planner": 9, "bookkeeping-month-end-close-planner": 9, "journal-entry-support-review-planner": 7,
  "bank-payment-reconciliation-planner": 9, "accounts-receivable-collections-planner": 9, "accounts-payable-vendor-payment-planner": 9, "invoice-billing-requirements-generator": 7,
  "expense-policy-reimbursement-planner": 7, "cash-flow-forecast-planner": 9, "working-capital-analysis-planner": 9, "budget-operating-plan-generator": 9,
  "budget-actual-variance-review-generator": 9, "rolling-forecast-reforecast-planner": 9, "scenario-sensitivity-analysis-planner": 9, "break-even-contribution-margin-planner": 7,
  "pricing-margin-analysis-planner": 9, "unit-economics-saas-metrics-planner": 9, "revenue-recognition-requirements-planner": 9, "subscription-billing-deferred-revenue-planner": 9,
  "inventory-costing-cogs-planner": 9, "fixed-asset-depreciation-register-planner": 7, "payroll-accounting-reconciliation-planner": 9, "tax-readiness-compliance-checklist-generator": 9,
  "gst-vat-sales-tax-workflow-planner": 9, "financial-statement-preparation-planner": 9, "financial-statement-analysis-generator": 9, "management-accounts-board-pack-planner": 9,
  "audit-readiness-evidence-planner": 9, "internal-controls-segregation-duties-planner": 9, "fraud-risk-financial-anomaly-review-planner": 9, "funding-runway-capital-planner": 9,
  "cash-flow-runway-dashboard-generator": 9, "budget-actual-variance-chart-pack-generator": 9, "profitability-unit-economics-driver-tree-generator": 9, "financial-close-reporting-process-map-generator": 9,
};
export const FINANCE_ACCOUNTING_TOOL_SLUGS = Object.keys(FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed finance pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
const CHART_CREDITS: Array<[string, number]> = [["12 charts", 13], ["8 charts", 11], ["5 charts", 9], ["3 charts", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateFinanceAccountingToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!FINANCE_ACCOUNTING_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base;
  if (["profitability-unit-economics-driver-tree-generator", "financial-close-reporting-process-map-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  if (["cash-flow-runway-dashboard-generator", "budget-actual-variance-chart-pack-generator"].includes(toolSlug)) credits = Math.max(credits, matchCredit(inputs.chart_count, CHART_CREDITS, base));
  return credits;
}
export function isFinanceAccountingTool(toolSlug: string) { return FINANCE_ACCOUNTING_TOOL_SLUGS.includes(toolSlug); }
export function getFinanceAccountingToolBaseCost(toolSlug: string) { return FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
