import {
  getServerPrompt as baseGetServerPrompt,
  validateToolInputs,
} from "./server-prompts";
import { getVisualRoutingGuard } from "./visual-routing-guard";
import { getOutlineScalingGuard } from "./outline-scaling-guard";

export { validateToolInputs };

export function getServerPrompt(toolSlug: string) {
  const prompt = baseGetServerPrompt(toolSlug);

  if (!prompt) return prompt;

  const extra = [
    getVisualRoutingGuard(toolSlug),
    getOutlineScalingGuard(toolSlug),
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!extra) return prompt;

  return {
    ...prompt,
    system: `${prompt.system}\n\n${extra}`,
    outputGuide: `${prompt.outputGuide}\n\n${extra}`,
  };
}
