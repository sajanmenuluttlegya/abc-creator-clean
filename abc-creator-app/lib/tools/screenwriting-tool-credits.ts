export const SCREENWRITING_TOOL_CREDIT_COSTS: Record<string, number> = {
  "logline-creator": 1,
  "movie-synopsis-generator": 3,
  "act-breakdown": 5,
  "beat-sheet-generator": 7,
  "scene-list-crafter": 5,
  "scene-script-writer": 5,
  "character-development": 5,
  "character-summary-builder": 3,
  "movie-theme-creator": 2,
};

export const SCREENWRITING_TOOL_SLUGS = Object.keys(SCREENWRITING_TOOL_CREDIT_COSTS);

const VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];
const SCENE_COUNT_CREDITS: Array<[string, number]> = [["32 scenes", 11], ["24 scenes", 9], ["16 scenes", 7], ["12 scenes", 6], ["8 scenes", 5]];
const SCENE_LENGTH_CREDITS: Array<[string, number]> = [["Detailed cinematic scene", 11], ["Long scene", 9], ["Standard scene", 7], ["Short scene", 5]];
const SYNOPSIS_LENGTH_CREDITS: Array<[string, number]> = [["Pitch-ready synopsis", 7], ["Detailed synopsis", 7], ["One-page synopsis", 5], ["Short synopsis", 3]];
const DEPTH_CREDITS: Array<[string, number]> = [["Premium", 9], ["Detailed", 7], ["Standard", 5], ["Compact", 3]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function parseCustomUnder49(value: string | undefined) {
  const count = Math.floor(Number(String(value || "").trim()));
  return Number.isFinite(count) && count >= 1 && count < 49 ? count : null;
}

function customSceneCredits(value: string | undefined) {
  const count = parseCustomUnder49(value);
  if (!count) return 5;
  return Math.min(15, Math.max(5, Math.ceil(count / 4) + 3));
}

function variationCredits(value: string | undefined) {
  return matchCredit(value, VARIATION_CREDITS, 1);
}

export function calculateScreenwritingToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  switch (toolSlug) {
    case "logline-creator":
      return variationCredits(inputs.variation_count);
    case "movie-theme-creator":
      return Math.max(2, variationCredits(inputs.variation_count));
    case "movie-synopsis-generator": {
      const lengthCredits = matchCredit(inputs.synopsis_length, SYNOPSIS_LENGTH_CREDITS, 3);
      const variations = variationCredits(inputs.variation_count);
      return lengthCredits + Math.max(0, variations - 1);
    }
    case "scene-list-crafter": {
      const baseSceneCredits = includes(inputs.scene_count, "Custom") ? customSceneCredits(inputs.custom_scene_count) : matchCredit(inputs.scene_count, SCENE_COUNT_CREDITS, 5);
      const variations = variationCredits(inputs.variation_count);
      return baseSceneCredits * variations;
    }
    case "scene-script-writer":
      return matchCredit(inputs.scene_length, SCENE_LENGTH_CREDITS, 5);
    case "act-breakdown":
      return Math.max(5, matchCredit(inputs.structure_depth, DEPTH_CREDITS, 5));
    case "beat-sheet-generator":
      return Math.max(7, matchCredit(inputs.structure_depth, DEPTH_CREDITS, 7));
    case "character-development":
      return Math.max(5, matchCredit(inputs.profile_depth, DEPTH_CREDITS, 5));
    case "character-summary-builder":
      return Math.max(3, matchCredit(inputs.summary_depth, DEPTH_CREDITS, 3));
    default:
      return SCREENWRITING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  }
}

export function isScreenwritingTool(toolSlug: string) {
  return SCREENWRITING_TOOL_SLUGS.includes(toolSlug);
}

export function getScreenwritingToolBaseCost(toolSlug: string) {
  return SCREENWRITING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
