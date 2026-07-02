type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

function p(creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return {
    creditCost,
    requiredInputs,
    system: `You are ABC Creator's premium short-form story specialist. Use the user's inputs as the source of truth. Create polished, professional, original, production-ready writing. Keep it safe, relevant, and copy-ready. Do not invent facts outside the supplied story brief. Task: ${task}`,
    outputGuide,
  };
}

export const serverShortStoryBatchTools: Record<string, ServerPrompt> = {
  "fan-fiction-short-drama-builder": p(3, [
    { id: "universe", label: "Universe / genre", required: true, minLength: 2, maxLength: 300 },
    { id: "core_idea", label: "Core story idea", required: true, minLength: 10, maxLength: 12000 },
    { id: "episode_length", label: "Episode length", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "community_notes", label: "Community writer notes", required: false, maxLength: 6000 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
  ], "Create a short episodic story plan and script beats from the selected universe or genre and supplied writer notes.", "Return Markdown with: # Short Drama Builder; ## Setup; ## Characters; ## Episode Premise; ## Beat Sheet; ## Short Script Draft; ## Cliffhanger; ## Writer Handoff Notes."),
  "short-drama-creator-studio": p(4, [
    { id: "drama_concept", label: "Drama concept", required: true, minLength: 10, maxLength: 12000 },
    { id: "format", label: "Short drama format", required: true, minLength: 2, maxLength: 160 },
    { id: "episode_length", label: "Episode length", required: true, minLength: 2, maxLength: 120 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "must_include", label: "Must include", required: false, maxLength: 4000 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
  ], "Write a premium short vertical episode with strong pacing, emotional hooks, clear scenes, and a cliffhanger.", "Return Markdown with: # Short Drama Script; ## Logline; ## Characters; ## Hook; ## Scene-by-Scene Script; ## Visual Notes; ## Cliffhanger; ## Production Notes.")
};
