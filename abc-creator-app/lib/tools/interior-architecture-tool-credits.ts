export const INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS: Record<string, number> = {
  "interior-design-brief-generator": 7,
  "interior-client-questionnaire-generator": 5,
  "space-program-generator": 7,
  "room-by-room-design-plan-generator": 7,
  "design-revision-brief-generator": 5,
  "furniture-layout-planner": 7,
  "space-planning-circulation-analyzer": 7,
  "floor-plan-requirements-review-generator": 7,
  "storage-organization-plan-generator": 5,
  "small-space-optimization-generator": 7,
  "interior-style-direction-generator": 5,
  "color-palette-coordination-generator": 5,
  "material-finish-schedule-generator": 7,
  "lighting-plan-generator": 7,
  "furniture-decor-specification-generator": 7,
  "interior-budget-procurement-planner": 7,
  "renovation-scope-of-work-generator": 9,
  "interior-project-timeline-generator": 7,
  "interior-concept-presentation-generator": 7,
  "accessible-sustainable-design-planner": 7,
  "ai-room-redesign-generator": 5,
  "empty-room-furnisher": 5,
  "kitchen-bathroom-design-generator": 5,
  "workspace-office-interior-generator": 5,
  "exterior-facade-redesign-generator": 5,
  "interior-rendering-generator": 2,
  "commercial-interior-generator": 2,
  "landscape-visualization-generator": 2,
  "interior-moodboard-generator": 2,
  "material-board-generator": 2,
};

export const INTERIOR_ARCHITECTURE_TOOL_SLUGS = Object.keys(INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Executive comprehensive", 9],
  ["Detailed strategic", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const QUESTION_COUNT_CREDITS: Array<[string, number]> = [["40 questions", 9], ["30 questions", 7], ["20 questions", 5], ["12 questions", 3]];
const OPTION_COUNT_CREDITS: Array<[string, number]> = [["4 layout options", 9], ["3 layout options", 7], ["2 layout options", 5]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return value ? matchCredit(value, DEPTH_CREDITS, fallback) : fallback;
}

export function calculateInteriorArchitectureToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  if (toolSlug === "interior-client-questionnaire-generator") {
    return Math.max(depthCredit(inputs.output_depth, 5), matchCredit(inputs.question_count, QUESTION_COUNT_CREDITS, 5));
  }
  if (toolSlug === "furniture-layout-planner") {
    return Math.max(depthCredit(inputs.output_depth, 7), matchCredit(inputs.option_count, OPTION_COUNT_CREDITS, 7));
  }
  if (INTERIOR_ARCHITECTURE_TOOL_SLUGS.includes(toolSlug)) {
    const base = INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
    return inputs.output_depth ? depthCredit(inputs.output_depth, base) : base;
  }
  return 1;
}

export function isInteriorArchitectureTool(toolSlug: string) {
  return INTERIOR_ARCHITECTURE_TOOL_SLUGS.includes(toolSlug);
}

export function getInteriorArchitectureToolBaseCost(toolSlug: string) {
  return INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
