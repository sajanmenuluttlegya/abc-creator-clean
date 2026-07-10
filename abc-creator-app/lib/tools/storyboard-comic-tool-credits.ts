export const STORYBOARD_COMIC_TOOL_CREDIT_COSTS: Record<string, number> = {
  "storyboard-panel-generator": 5,
  "storyboard-shot-prompt-generator": 1,
  "comic-strip-script-generator": 5,
  "comic-panel-prompt-generator": 1,
  "manga-scene-generator": 2,
  "webtoon-episode-generator": 5,
  "character-expression-sheet-prompt-generator": 1,
  "character-pose-sheet-prompt-generator": 1,
  "visual-continuity-guide-generator": 7,
  "scene-blocking-generator": 5,
  "frame-by-frame-animation-plan-generator": 5,
  "animatic-script-generator": 5,
};

export const STORYBOARD_COMIC_TOOL_SLUGS = Object.keys(STORYBOARD_COMIC_TOOL_CREDIT_COSTS);

const VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];
const DEPTH_CREDITS: Array<[string, number]> = [["Premium", 9], ["Detailed", 7], ["Standard", 5], ["Compact", 2]];
const COUNT_CREDITS: Array<[string, number]> = [["32", 11], ["24", 9], ["16", 7], ["12", 6], ["8", 5]];
const DURATION_CREDITS: Array<[string, number]> = [["10 minutes", 9], ["5 minutes", 7], ["2 minutes", 5], ["60 seconds", 4], ["30 seconds", 3], ["15 seconds", 2]];

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

function customCountCredits(value: string | undefined, fallback = 5) {
  const count = parseCustomUnder49(value);
  if (!count) return fallback;
  return Math.min(15, Math.max(fallback, Math.ceil(count / 4) + 3));
}

function countCredits(selection: string | undefined, customValue: string | undefined, fallback = 5) {
  return includes(selection, "Custom") ? customCountCredits(customValue, fallback) : matchCredit(selection, COUNT_CREDITS, fallback);
}

function variationCredits(value: string | undefined) {
  return matchCredit(value, VARIATION_CREDITS, 1);
}

function depthCredits(value: string | undefined, fallback: number) {
  return Math.max(fallback, matchCredit(value, DEPTH_CREDITS, fallback));
}

export function calculateStoryboardComicToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  switch (toolSlug) {
    case "storyboard-shot-prompt-generator":
    case "comic-panel-prompt-generator":
    case "character-expression-sheet-prompt-generator":
    case "character-pose-sheet-prompt-generator":
      return variationCredits(inputs.prompt_variations);
    case "storyboard-panel-generator":
    case "comic-strip-script-generator":
    case "webtoon-episode-generator":
      return Math.max(countCredits(inputs.panel_count, inputs.custom_panel_count, 5), depthCredits(inputs.episode_depth, 5));
    case "scene-blocking-generator":
      return countCredits(inputs.beat_count, inputs.custom_beat_count, 5);
    case "frame-by-frame-animation-plan-generator":
      return countCredits(inputs.frame_count, inputs.custom_frame_count, 5);
    case "animatic-script-generator":
      return Math.max(countCredits(inputs.shot_count, inputs.custom_shot_count, 5), matchCredit(inputs.duration, DURATION_CREDITS, 5));
    case "visual-continuity-guide-generator":
      return depthCredits(inputs.guide_depth, 7);
    default:
      return STORYBOARD_COMIC_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  }
}

export function isStoryboardComicTool(toolSlug: string) {
  return STORYBOARD_COMIC_TOOL_SLUGS.includes(toolSlug);
}

export function getStoryboardComicToolBaseCost(toolSlug: string) {
  return STORYBOARD_COMIC_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
