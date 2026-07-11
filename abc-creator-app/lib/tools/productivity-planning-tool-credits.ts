export const PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS: Record<string, number> = {
  "goal-planner": 5,
  "action-plan-generator": 5,
  "daily-planner": 3,
  "weekly-planner": 5,
  "monthly-planner": 5,
  "habit-plan-generator": 5,
  "routine-generator": 5,
  "time-blocking-planner": 5,
  "project-planner": 7,
  "milestone-generator": 5,
  "task-breakdown-generator": 3,
  "priority-matrix-generator": 3,
  "decision-making-framework-generator": 5,
  "problem-solving-generator": 5,
  "brainstorming-generator": 3,
  "meeting-agenda-generator": 3,
  "meeting-follow-up-generator": 3,
  "personal-development-plan-generator": 7,
  "reflection-prompt-generator": 2,
  "journal-prompt-generator": 2,
};

export const PRODUCTIVITY_PLANNING_TOOL_SLUGS = Object.keys(PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Comprehensive", 9],
  ["Detailed", 7],
  ["Standard", 5],
  ["Quick", 2],
];
const PROMPT_COUNT_CREDITS: Array<[string, number]> = [["30 prompts", 7], ["20 prompts", 5], ["10 prompts", 3], ["5 prompts", 2]];
const IDEA_COUNT_CREDITS: Array<[string, number]> = [["50 ideas", 9], ["30 ideas", 7], ["20 ideas", 5], ["10 ideas", 3]];
const MILESTONE_COUNT_CREDITS: Array<[string, number]> = [["16 milestones", 9], ["12 milestones", 7], ["8 milestones", 5], ["5 milestones", 3]];
const DURATION_CREDITS: Array<[string, number]> = [["2 hours", 5], ["90 minutes", 5], ["60 minutes", 4], ["45 minutes", 3], ["30 minutes", 3], ["15 minutes", 2]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return Math.max(fallback, matchCredit(value, DEPTH_CREDITS, fallback));
}

export function calculateProductivityPlanningToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  switch (toolSlug) {
    case "goal-planner":
    case "action-plan-generator":
    case "weekly-planner":
    case "monthly-planner":
    case "project-planner":
    case "personal-development-plan-generator":
      return depthCredit(inputs.plan_depth, PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS[toolSlug] ?? 5);
    case "decision-making-framework-generator":
      return depthCredit(inputs.decision_depth, 5);
    case "problem-solving-generator":
      return depthCredit(inputs.analysis_depth, 5);
    case "milestone-generator":
      return matchCredit(inputs.milestone_count, MILESTONE_COUNT_CREDITS, 5);
    case "brainstorming-generator":
      return matchCredit(inputs.idea_count, IDEA_COUNT_CREDITS, 3);
    case "reflection-prompt-generator":
    case "journal-prompt-generator":
      return matchCredit(inputs.prompt_count, PROMPT_COUNT_CREDITS, 2);
    case "meeting-agenda-generator":
      return matchCredit(inputs.duration, DURATION_CREDITS, 3);
    case "time-blocking-planner":
      if (includes(inputs.planning_window, "Seven days") || includes(inputs.planning_window, "workweek")) return 7;
      if (includes(inputs.planning_window, "Three days")) return 5;
      if (includes(inputs.planning_window, "One day")) return 3;
      return 5;
    case "habit-plan-generator":
      if (includes(inputs.horizon, "1 year") || includes(inputs.horizon, "6 months")) return 7;
      return 5;
    case "task-breakdown-generator":
      if (includes(inputs.granularity, "Work breakdown") || includes(inputs.granularity, "Very small")) return 5;
      return 3;
    default:
      return PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  }
}

export function isProductivityPlanningTool(toolSlug: string) {
  return PRODUCTIVITY_PLANNING_TOOL_SLUGS.includes(toolSlug);
}

export function getProductivityPlanningToolBaseCost(toolSlug: string) {
  return PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
