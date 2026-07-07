import { serverBookTools } from "./server-book-tools";

type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

export const serverAiPromptBatchTools: Record<string, ServerPrompt> = {
  ...serverBookTools,
  "video-prompt-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "video_brief", label: "Video brief", required: true, minLength: 10, maxLength: 14000 },
      { id: "video_type", label: "Video type", required: true, minLength: 2, maxLength: 160 },
      { id: "visual_style", label: "Visual style", required: true, minLength: 2, maxLength: 160 },
      { id: "aspect_ratio", label: "Aspect ratio", required: true, minLength: 2, maxLength: 80 },
      { id: "duration", label: "Target duration", required: true, minLength: 1, maxLength: 80 },
      { id: "prompt_depth", label: "Prompt depth", required: true, minLength: 2, maxLength: 160 },
      { id: "prompt_variations", label: "Prompt variations", required: true, minLength: 2, maxLength: 80 },
      { id: "must_include", label: "Must include", required: false, maxLength: 5000 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 4000 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
    ],
    system: `You are ABC Creator's premium video prompt specialist. Create text-only prompts for future video generation tools. Use the user's supplied brief, style, aspect ratio, duration, must_include, avoid, language, and prompt_variations selection. Keep prompts clear, cinematic, model-friendly, safe, and ready to copy. Return exactly the selected number of prompt variations: 1, 3, 5, or 10. Do not add extra variations.`,
    outputGuide: "Return Markdown with # Video Prompt Pack. Return exactly the number selected in prompt_variations. For 1 variation, include ## Variation 1 only. For 3, 5, or 10 variations, include ## Variation 1 through the exact final selected number. Each variation must be a complete copy-ready video prompt and may include camera, motion, lighting, style, aspect ratio, duration, must-include, and negative prompt details inside that variation. Do not add extra variations, filler notes, or generic usage notes."
  }
};
