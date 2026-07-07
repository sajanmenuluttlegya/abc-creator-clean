import { serverBookTools } from "./server-book-tools";

type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const variationRequired: ToolFieldRule = { id: "variation_count", label: "Variations", required: true, minLength: 2, maxLength: 80 };
const promptVariationRequired: ToolFieldRule = { id: "prompt_variations", label: "Prompt variations", required: true, minLength: 2, maxLength: 80 };

export const serverBookVariationOverrides: Record<string, ServerPrompt> = {
  "book-idea-generator": {
    ...serverBookTools["book-idea-generator"],
    requiredInputs: [
      ...serverBookTools["book-idea-generator"].requiredInputs.slice(0, 8),
      variationRequired,
      ...serverBookTools["book-idea-generator"].requiredInputs.slice(8),
    ],
    system: `${serverBookTools["book-idea-generator"].system}

Exact variation rule: Return exactly the number selected in variation_count: 1, 3, 5, or 10. Each variation must be a complete premium book idea package, not a one-line idea.`,
    outputGuide: `${serverBookTools["book-idea-generator"].outputGuide}

Override: Use variation_count as the exact concept count. Return exactly 1, 3, 5, or 10 sections named ## Variation 1, ## Variation 2, etc. For every variation include title seed, premise, genre/niche fit, audience promise, protagonist, conflict, hook, series potential, why it works, and best first-chapter spark.`,
  },
  "book-cover-prompt-generator": {
    ...serverBookTools["book-cover-prompt-generator"],
    requiredInputs: [
      ...serverBookTools["book-cover-prompt-generator"].requiredInputs.slice(0, 8),
      promptVariationRequired,
      ...serverBookTools["book-cover-prompt-generator"].requiredInputs.slice(8),
    ],
    system: `${serverBookTools["book-cover-prompt-generator"].system}

Exact prompt variation rule: Return exactly the number selected in prompt_variations: 1, 3, 5, or 10. Each variation must be a complete premium cover prompt package.`,
    outputGuide: `${serverBookTools["book-cover-prompt-generator"].outputGuide}

Override: Use prompt_variations exactly. Return exactly 1, 3, 5, or 10 sections named ## Variation 1, ## Variation 2, etc. For each include main cover prompt, negative prompt, typography guidance, mood/color direction, composition guidance, and spine/back guidance when relevant.`,
  },
};
