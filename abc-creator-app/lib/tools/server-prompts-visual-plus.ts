import {
  getServerPrompt as baseGetServerPrompt,
  validateToolInputs,
} from "./server-prompts-plus";
import { getBlogVisualPlanningGuard } from "./blog-visual-planning-guard";

export { validateToolInputs };

export function getServerPrompt(toolSlug: string) {
  const prompt = baseGetServerPrompt(toolSlug);
  const extra = getBlogVisualPlanningGuard(toolSlug);

  if (!prompt || !extra) return prompt;

  return {
    ...prompt,
    system: `${prompt.system}\n\n${extra}`,
    outputGuide: `${prompt.outputGuide}\n\n${extra}`,
  };
}
