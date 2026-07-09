type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const sourceField: ToolFieldRule = { id: "source_content", label: "Animation Brief", required: true, minLength: 10, maxLength: 65000 };
const commonRequired: ToolFieldRule[] = [
  sourceField,
  { id: "animation_format", label: "Animation Format", required: true, minLength: 2, maxLength: 160 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
  { id: "target_audience", label: "Target Audience", required: true, minLength: 2, maxLength: 160 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  { id: "extra_notes", label: "Extra Notes / Must Preserve", required: false, maxLength: 12000 },
];

const premiumAnimationSystem = `You are ABC Creator's premium animation development lead, story artist, visual development artist, and show bible writer. Create animation-ready outputs that feel professional, studio-quality, visually specific, character-driven, and production-aware. Use strong silhouettes, readable staging, clear emotional beats, visual gags, continuity rules, and kid/family-safe choices when applicable. Avoid generic AI filler. Preserve user names, canon, target audience, tone, style, and avoid notes. Use clean Markdown. For prompt tools, write copy-ready prompts with character consistency, camera/staging, lighting, style, materials, and negative prompts. Do not include fake tool claims.`;

function exactVariationGuide(fieldName = "variation_count") {
  return `Return exactly the number selected in ${fieldName}: 1, 3, 5, or 10. Do not add extra versions. If the selected count is 1, return only one polished version.`;
}

export const serverAnimationTools: Record<string, ServerPrompt> = {
  "2d-animation-story-generator": {
    creditCost: 3,
    requiredInputs: [...commonRequired, { id: "visual_style", label: "2D Visual Style", required: true, minLength: 2, maxLength: 160 }, { id: "story_depth", label: "Story Depth", required: true, minLength: 2, maxLength: 160 }, { id: "variation_count", label: "Story Variations", required: true, minLength: 2, maxLength: 80 }],
    system: `${premiumAnimationSystem} Specialize in 2D animation stories with strong visual gags, clear staging, and animator-friendly set pieces.`,
    outputGuide: `Return Markdown with # 2D Animation Story Generator. ${exactVariationGuide()} For each variation include: title, logline, story premise, main character, visual world, conflict, sequence flow, animation set pieces, emotional payoff, ending image, and why it works as 2D animation.`,
  },
  "2d-animation-image-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "prompt_type", label: "Prompt Type", required: true, minLength: 2, maxLength: 160 }, { id: "visual_style", label: "2D Visual Style", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Aspect Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in premium 2D animation image prompts.`,
    outputGuide: `Return Markdown with # 2D Animation Image Prompt Generator. ${exactVariationGuide("prompt_variations")} For each variation include: Prompt, Character/Asset Consistency, Layout & Staging, Color/Lighting, Style Notes, Negative Prompt, and Best Use. Keep prompts textless unless user explicitly asks for lettering.`,
  },
  "2d-animation-scene-list-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "scene_count", label: "Scene Count", required: true, minLength: 2, maxLength: 80 }, { id: "custom_scene_count", label: "Custom Scene Count", required: false, maxLength: 20 }, { id: "visual_style", label: "2D Visual Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in animation-ready 2D scene lists.`,
    outputGuide: `Return Markdown with # 2D Animation Scene List Generator. Output exactly the selected scene_count. If Custom (<49), use custom_scene_count and it must be 1-48. For each scene include: scene number, location/background, action, character emotion, visual gag or staging note, animation challenge, continuity note, and hook into next scene.`,
  },
  "2d-animation-episode-idea-generator": {
    creditCost: 3,
    requiredInputs: [...commonRequired, { id: "episode_count", label: "Episode Count", required: true, minLength: 2, maxLength: 80 }, { id: "custom_episode_count", label: "Custom Episode Count", required: false, maxLength: 20 }, { id: "variation_count", label: "Concept Variations", required: true, minLength: 2, maxLength: 80 }, { id: "visual_style", label: "2D Visual Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in repeatable 2D animation episode engines and kids/family-friendly concepts.`,
    outputGuide: `Return Markdown with # 2D Animation Episode Idea Generator. ${exactVariationGuide()} For each variation create exactly the selected episode_count. If Custom (<49), use custom_episode_count and it must be 1-48. Include: series engine, episode title, hook, problem/conflict, visual set piece, comedic/emotional beat, lesson/theme, and continuity thread.`,
  },
  "3d-animated-story-generator": {
    creditCost: 3,
    requiredInputs: [...commonRequired, { id: "visual_style", label: "3D Visual Style", required: true, minLength: 2, maxLength: 160 }, { id: "story_depth", label: "Story Depth", required: true, minLength: 2, maxLength: 160 }, { id: "variation_count", label: "Story Variations", required: true, minLength: 2, maxLength: 80 }],
    system: `${premiumAnimationSystem} Specialize in 3D animated stories with cinematic set pieces and strong visual toyetic appeal.`,
    outputGuide: `Return Markdown with # 3D Animated Story Generator. ${exactVariationGuide()} For each variation include: title, logline, premise, character appeal, 3D world design, conflict, set pieces, visual texture/material notes, emotional payoff, ending image, and why it works in 3D animation.`,
  },
  "3d-animation-image-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "prompt_type", label: "Prompt Type", required: true, minLength: 2, maxLength: 160 }, { id: "visual_style", label: "3D Visual Style", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Aspect Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in premium 3D animation image prompts.`,
    outputGuide: `Return Markdown with # 3D Animation Image Prompt Generator. ${exactVariationGuide("prompt_variations")} For each variation include: Prompt, Character/Asset Consistency, Materials & Surface Detail, Camera & Staging, Lighting, Style Notes, Negative Prompt, and Best Use. Keep prompts clean, textless, and production-friendly.`,
  },
  "3d-animation-scene-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "visual_style", label: "3D Visual Style", required: true, minLength: 2, maxLength: 160 }, { id: "camera_language", label: "Camera Language", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Aspect Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in 3D scene prompts with camera, staging, lighting, material design, and continuity.`,
    outputGuide: `Return Markdown with # 3D Animation Scene Prompt Generator. ${exactVariationGuide("prompt_variations")} For each variation include: Prompt, Camera & Motion, Character Continuity, Environment/Materials, Lighting, Composition, Negative Prompt, and Best Use.`,
  },
  "3d-kids-story-ideas-generator": {
    creditCost: 2,
    requiredInputs: [...commonRequired, { id: "variation_count", label: "Story Idea Variations", required: true, minLength: 2, maxLength: 80 }, { id: "age_group", label: "Kids Age Group", required: true, minLength: 2, maxLength: 160 }, { id: "visual_style", label: "3D Visual Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumAnimationSystem} Specialize in charming, safe, visually playful 3D kids animation concepts.`,
    outputGuide: `Return Markdown with # 3D Kids Story Ideas Generator. ${exactVariationGuide()} For each idea include: title, logline, age fit, lovable characters, gentle conflict, visual set pieces, humor, emotional lesson, franchise potential, and toyetic visual notes.`,
  },
  "animated-short-script-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "duration", label: "Target Duration", required: true, minLength: 2, maxLength: 160 }, { id: "script_depth", label: "Script Depth", required: true, minLength: 2, maxLength: 160 }, { id: "animation_style", label: "Animation Style", required: true, minLength: 2, maxLength: 220 }],
    system: `${premiumAnimationSystem} Specialize in animation scriptwriting with visual action, readable staging, and animator-friendly timing.`,
    outputGuide: `Return Markdown with # Animated Short Script Generator. Write a polished animated short script with scene headings, visual action, dialogue, timing/gag notes, staging, and final payoff. Match duration and script_depth. Keep the script playable, visual, and production-aware.`,
  },
  "animation-style-bible-generator": {
    creditCost: 7,
    requiredInputs: [...commonRequired, { id: "bible_depth", label: "Bible Depth", required: true, minLength: 2, maxLength: 160 }, { id: "animation_style", label: "Animation Style", required: true, minLength: 2, maxLength: 220 }],
    system: `${premiumAnimationSystem} Specialize in premium animation style bibles and visual development rules.`,
    outputGuide: `Return Markdown with # Animation Style Bible Generator. Include: visual thesis, character design rules, silhouette language, color palette, line/shape language, environment rules, prop design, camera/staging, lighting, animation timing, continuity standards, prompt/style keywords, do/don't list, and production checklist. Match bible_depth.`,
  },
};
