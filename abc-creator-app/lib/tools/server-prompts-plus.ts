import {
  getServerPrompt as baseGetServerPrompt,
  validateToolInputs,
} from "./server-prompts";
import { getVisualRoutingGuard } from "./visual-routing-guard";

export { validateToolInputs };

export function getServerPrompt(toolSlug: string) {
  const prompt = baseGetServerPrompt(toolSlug);
  const extra = getVisualRoutingGuard(toolSlug);

  if (!prompt || !extra) return prompt;

  return {
    ...prompt,
    system: `${prompt.system}\n\n${extra}`,
    outputGuide: `${prompt.outputGuide}\n\n${extra}`,
  };
}
