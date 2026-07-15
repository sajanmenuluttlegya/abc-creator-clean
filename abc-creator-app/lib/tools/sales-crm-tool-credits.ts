import { salesCRMTools, SALES_CRM_VISUAL_TOOL_SLUGS } from "./public-sales-crm-tools";

export const SALES_CRM_TOOL_CREDIT_COSTS: Record<string, number> = Object.fromEntries(salesCRMTools.map((tool) => [tool.slug, tool.displayCreditCost]));
export const SALES_CRM_TOOL_SLUGS = Object.keys(SALES_CRM_TOOL_CREDIT_COSTS);
const DEPTH_CREDITS: Array<[string, number]> = [["Comprehensive controlled pack", 9], ["Detailed revenue pack", 7], ["Standard premium", 5], ["Quick professional", 2]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
export function calculateSalesCRMToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = SALES_CRM_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!SALES_CRM_TOOL_SLUGS.includes(toolSlug)) return 1;
  let credits = inputs.output_depth ? Math.max(base, matchCredit(inputs.output_depth, DEPTH_CREDITS, base)) : base;
  if (SALES_CRM_VISUAL_TOOL_SLUGS.includes(toolSlug as (typeof SALES_CRM_VISUAL_TOOL_SLUGS)[number])) credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  return credits;
}
export function isSalesCRMTool(toolSlug: string) { return SALES_CRM_TOOL_SLUGS.includes(toolSlug); }
export function getSalesCRMToolBaseCost(toolSlug: string) { return SALES_CRM_TOOL_CREDIT_COSTS[toolSlug] ?? 1; }
