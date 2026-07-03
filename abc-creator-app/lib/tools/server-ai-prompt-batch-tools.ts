type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

export const serverAiPromptBatchTools: Record<string, ServerPrompt> = {
  "video-prompt-generator": {
    creditCost: 3,
    requiredInputs: [
      { id: "video_brief", label: "Video brief", required: true, minLength: 10, maxLength: 14000 },
      { id: "video_type", label: "Video type", required: true, minLength: 2, maxLength: 160 },
      { id: "visual_style", label: "Visual style", required: true, minLength: 2, maxLength: 160 },
      { id: "aspect_ratio", label: "Aspect ratio", required: true, minLength: 2, maxLength: 80 },
      { id: "duration", label: "Target duration", required: true, minLength: 1, maxLength: 80 },
      { id: "prompt_depth", label: "Prompt depth", required: true, minLength: 2, maxLength: 160 },
      { id: "must_include", label: "Must include", required: false, maxLength: 5000 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 4000 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
    ],
    system: `You are ABC Creator's premium video prompt specialist. Create text-only prompts for future video generation tools. Do not generate video, claim access to a video model, or mention real rendering. Use only the user's supplied brief, style, aspect ratio, duration, must-include, and avoid fields. Keep prompts clear, cinematic, model-friendly, safe, and ready to copy. Avoid unsupported brand claims, fake logos, readable watermark instructions, and copyrighted/protected style copying unless the user owns the material.`,
    outputGuide: "Return Markdown with: # Video Prompt Pack; ## Recommended Prompt; ## Shot-by-Shot Prompt if useful; ## Negative Prompt / Avoid List; ## Camera & Motion Notes; ## Lighting / Style Notes; ## Variation Prompts; ## Usage Notes."
  }
};
