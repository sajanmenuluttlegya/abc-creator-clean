export const FILM_VIDEO_TOOL_CREDIT_COSTS: Record<string, number> = {
  "short-film-idea-generator": 2,
  "video-story-generator": 3,
  "film-treatment-generator": 5,
  "shot-list-generator": 5,
  "visual-direction-generator": 4,
  "cinematic-scene-prompt-generator": 1,
  "directors-vision-builder": 4,
  "trailer-script-generator": 5,
  "film-pitch-deck-text-generator": 7,
  "scene-moodboard-prompt-generator": 1,
  "video-production-plan-generator": 5,
  "episode-concept-generator": 3,
};

export const FILM_VIDEO_TOOL_SLUGS = Object.keys(FILM_VIDEO_TOOL_CREDIT_COSTS);

const VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];
const DEPTH_CREDITS: Array<[string, number]> = [["Premium", 9], ["Detailed", 7], ["Standard", 5], ["Compact", 2]];
const COUNT_CREDITS: Array<[string, number]> = [["32", 11], ["24", 9], ["16", 7], ["12", 6], ["8", 5]];
const DECK_CREDITS: Array<[string, number]> = [["15 slides", 11], ["12 slides", 9], ["10 slides", 7], ["8 slides", 6], ["6 slides", 5]];
const TRAILER_CREDITS: Array<[string, number]> = [["2 minutes", 9], ["90 seconds", 7], ["60 seconds", 5], ["30 seconds", 4], ["15 seconds", 3]];
const DURATION_CREDITS: Array<[string, number]> = [["Feature film", 9], ["Episode", 7], ["pilot", 7], ["10 minutes", 7], ["5 minutes", 5], ["2 minutes", 4], ["60 seconds", 3], ["30 seconds", 2], ["15 seconds", 2]];

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

export function calculateFilmVideoToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  switch (toolSlug) {
    case "short-film-idea-generator":
      return Math.max(2, variationCredits(inputs.variation_count)) + Math.max(0, matchCredit(inputs.duration, DURATION_CREDITS, 2) - 2);
    case "video-story-generator":
      return Math.max(depthCredits(inputs.story_depth, 3), matchCredit(inputs.duration, DURATION_CREDITS, 3));
    case "film-treatment-generator":
      return Math.max(depthCredits(inputs.treatment_depth, 5), matchCredit(inputs.duration, DURATION_CREDITS, 5));
    case "shot-list-generator":
      return countSelectionCredits(inputs.shot_count, inputs.custom_shot_count, 5);
    case "visual-direction-generator":
      return depthCredits(inputs.direction_depth, 4);
    case "cinematic-scene-prompt-generator":
      return variationCredits(inputs.prompt_variations);
    case "directors-vision-builder":
      return depthCredits(inputs.vision_depth, 4);
    case "trailer-script-generator":
      return Math.max(5, matchCredit(inputs.trailer_length, TRAILER_CREDITS, 5));
    case "film-pitch-deck-text-generator":
      return Math.max(depthCredits(inputs.deck_depth, 7), matchCredit(inputs.deck_length, DECK_CREDITS, 7));
    case "scene-moodboard-prompt-generator":
      return variationCredits(inputs.prompt_variations);
    case "video-production-plan-generator":
      return depthCredits(inputs.plan_depth, 5);
    case "episode-concept-generator": {
      const episodeCredits = countSelectionCredits(inputs.episode_count, inputs.custom_episode_count, 5);
      return episodeCredits * variationCredits(inputs.variation_count);
    }
    default:
      return FILM_VIDEO_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  }
}

export function isFilmVideoTool(toolSlug: string) {
  return FILM_VIDEO_TOOL_SLUGS.includes(toolSlug);
}

export function getFilmVideoToolBaseCost(toolSlug: string) {
  return FILM_VIDEO_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
