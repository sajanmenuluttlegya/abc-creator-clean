export const DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS: Record<string, number> = {
  "data-analysis-brief-generator": 7,
  "data-dictionary-metric-definition-generator": 7,
  "data-quality-audit-planner": 9,
  "data-cleaning-transformation-plan-generator": 9,
  "missing-data-outlier-review-generator": 7,
  "exploratory-data-analysis-planner": 9,
  "descriptive-statistics-interpretation-generator": 7,
  "segmentation-cohort-analysis-planner": 9,
  "time-series-trend-seasonality-analyzer": 9,
  "forecasting-experiment-planner": 9,
  "ab-test-analysis-planner": 9,
  "correlation-causation-audit-generator": 7,
  "root-cause-analysis-generator": 7,
  "kpi-framework-metric-tree-generator": 9,
  "executive-dashboard-requirements-generator": 9,
  "dashboard-story-layout-planner": 7,
  "bi-report-requirements-generator": 9,
  "sql-analysis-query-planner": 7,
  "sql-query-review-optimization-generator": 9,
  "data-model-star-schema-planner": 9,
  "semantic-layer-metric-store-planner": 9,
  "etl-elt-pipeline-requirements-generator": 9,
  "dbt-model-test-documentation-planner": 9,
  "data-validation-reconciliation-plan-generator": 9,
  "spreadsheet-analysis-formula-planner": 7,
  "pivot-table-analysis-plan-generator": 5,
  "business-performance-review-generator": 9,
  "sales-revenue-analysis-planner": 9,
  "marketing-analytics-plan-generator": 9,
  "customer-product-analytics-plan-generator": 9,
  "operations-inventory-analytics-planner": 9,
  "executive-insight-decision-memo-generator": 7,
  "kpi-dashboard-blueprint-generator": 9,
  "data-story-chart-pack-generator": 9,
  "metric-tree-driver-diagram-generator": 9,
  "data-lineage-model-map-generator": 9,
};

export const DATA_ANALYSIS_BI_TOOL_SLUGS = Object.keys(DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Comprehensive decision pack", 9],
  ["Detailed analytical", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 9], ["5 versions", 7], ["3 versions", 5], ["1 version", 2]];
const ITEM_CREDITS: Array<[string, number]> = [["40 items", 15], ["30 items", 13], ["20 items", 9], ["15 items", 8], ["10 items", 7], ["5 items", 5]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
const CHART_CREDITS: Array<[string, number]> = [["12 charts", 13], ["8 charts", 11], ["5 charts", 9], ["3 charts", 7]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

export function calculateDataAnalysisBIToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!DATA_ANALYSIS_BI_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? matchCredit(inputs.output_depth, DEPTH_CREDITS, base) : base;
  if (["data-analysis-brief-generator", "dashboard-story-layout-planner"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }
  if (["data-quality-audit-planner", "data-validation-reconciliation-plan-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.item_count, ITEM_CREDITS, base));
  }
  if (["metric-tree-driver-diagram-generator", "data-lineage-model-map-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  }
  if (["kpi-dashboard-blueprint-generator", "data-story-chart-pack-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.chart_count, CHART_CREDITS, base));
  }
  return credits;
}

export function isDataAnalysisBITool(toolSlug: string) {
  return DATA_ANALYSIS_BI_TOOL_SLUGS.includes(toolSlug);
}

export function getDataAnalysisBIToolBaseCost(toolSlug: string) {
  return DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
