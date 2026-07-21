export const ANIMATION_TOOL_CREDIT_COSTS: Record<string, number> = {
  "2d-animation-story-generator": 3,
  "2d-animated-character-generator": 8,
  "2d-animation-image-prompt-generator": 1,
  "2d-animation-scene-list-generator": 5,
  "2d-animation-episode-idea-generator": 3,
  "3d-animated-story-generator": 3,
  "3d-animated-character-generator": 8,
  "3d-animation-image-prompt-generator": 1,
  "3d-animation-scene-prompt-generator": 1,
  "3d-kids-story-ideas-generator": 2,
  "animated-short-script-generator": 5,
  "animation-style-bible-generator": 7,
};

export const ANIMATION_TOOL_SLUGS = Object.keys(ANIMATION_TOOL_CREDIT_COSTS);

const VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];
const DEPTH_CREDITS: Array<[string, number]> = [["Premium", 9], ["Detailed", 7], ["Standard", 5], ["Compact", 2]];
const COUNT_CREDITS: Array<[string, number]> = [["32", 11], ["24", 9], ["16", 7], ["12", 6], ["8", 5]];
const DURATION_CREDITS: Array<[string, number]> = [["Episode", 7], ["pilot", 7], ["Short film", 7], ["10 minutes", 7], ["5 minutes", 5], ["2 minutes", 4], ["60 seconds", 3], ["30 seconds", 2], ["15 seconds", 2]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function variationCredits(value: string | undefined) {
  return matchCredit(value, VARIATION_CREDITS, 1);
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

function countSelectionCredits(selection: string | undefined, customValue: string | undefined, fallback = 5) {
  return includes(selection, "Custom") ? customCountCredits(customValue, fallback) : matchCredit(selection, COUNT_CREDITS, fallback);
}

function depthCredits(value: string | undefined, fallback: number) {
  return value ? matchCredit(value, DEPTH_CREDITS, fallback) : fallback;
}

export function calculateAnimationToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  switch (toolSlug) {
    case "2d-animation-story-generator":
    case "3d-animated-story-generator":
      return Math.max(depthCredits(inputs.story_depth, 3), variationCredits(inputs.variation_count));
    case "2d-animation-image-prompt-generator":
    case "3d-animation-image-prompt-generator":
    case "3d-animation-scene-prompt-generator":
      return variationCredits(inputs.prompt_variations);
    case "2d-animation-scene-list-generator":
      return countSelectionCredits(inputs.scene_count, inputs.custom_scene_count, 5);
    case "2d-animation-episode-idea-generator": {
      const episodeCredits = countSelectionCredits(inputs.episode_count, inputs.custom_episode_count, 5);
      return episodeCredits * variationCredits(inputs.variation_count);
    }
    case "3d-kids-story-ideas-generator":
      return Math.max(2, variationCredits(inputs.variation_count));
    case "animated-short-script-generator":
      return Math.max(depthCredits(inputs.script_depth, 5), matchCredit(inputs.duration, DURATION_CREDITS, 5));
    case "animation-style-bible-generator":
      return depthCredits(inputs.bible_depth, 7);
    default:
      return ANIMATION_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  }
}

export function isAnimationTool(toolSlug: string) {
  return ANIMATION_TOOL_SLUGS.includes(toolSlug);
}

export function getAnimationToolBaseCost(toolSlug: string) {
  return ANIMATION_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
