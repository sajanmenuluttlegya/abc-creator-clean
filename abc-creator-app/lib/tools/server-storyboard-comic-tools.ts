type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const sourceField: ToolFieldRule = { id: "source_content", label: "Story / Scene Brief", required: true, minLength: 10, maxLength: 65000 };
const commonRequired: ToolFieldRule[] = [
  sourceField,
  { id: "format", label: "Format", required: true, minLength: 2, maxLength: 160 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
  { id: "target_audience", label: "Target Audience", required: true, minLength: 2, maxLength: 160 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  { id: "continuity_notes", label: "Continuity / Must Preserve", required: false, maxLength: 16000 },
];

const premiumSystem = `You are ABC Creator's premium storyboard director, comic editor, visual continuity supervisor, and animatic planner. Create professional, production-ready outputs with precise visual storytelling, readable staging, strong silhouettes, controlled pacing, clear eyelines, camera logic, panel rhythm, spatial continuity, and emotionally purposeful framing. Preserve all user canon, character identity, costumes, props, locations, tone, audience, and restrictions. Avoid generic AI filler, repetition, vague camera notes, impossible blocking, or contradictory continuity. Use clean Markdown. For prompt tools, provide copy-ready prompts with composition, character consistency, lighting, camera, negative prompts, and speech-space guidance where relevant. Do not include fake tool claims.`;

function exactVariationGuide(field = "prompt_variations") {
  return `Return exactly the number selected in ${field}: 1, 3, 5, or 10. Do not add extra versions.`;
}

function countGuide(selector: string, custom: string, noun: string) {
  return `Return exactly the selected ${noun} count from ${selector}. If Custom (<49) is selected, use ${custom}; it must be a whole number from 1 to 48.`;
}

export const serverStoryboardComicTools: Record<string, ServerPrompt> = {
  "storyboard-panel-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "panel_count", label: "Panel Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_panel_count", label: "Custom Panel Count", required: false, maxLength: 20 }, { id: "art_style", label: "Storyboard Style", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Frame Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in panel-by-panel cinematic storyboarding.`,
    outputGuide: `Return Markdown with # Storyboard Panel Generator. ${countGuide("panel_count", "custom_panel_count", "panel")} Start with sequence intent and continuity locks. For every panel include: Panel Number, Story Purpose, Shot Size, Camera Angle, Composition, Character Placement, Action, Expression, Environment/Props, Dialogue/Caption, Lighting, Continuity Check, Transition to Next Panel, and Production Note.`,
  },
  "storyboard-shot-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "camera_language", label: "Camera Language", required: true, minLength: 2, maxLength: 160 }, { id: "art_style", label: "Storyboard Style", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Aspect Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in premium storyboard image prompts.`,
    outputGuide: `Return Markdown with # Storyboard Shot Prompt Generator. ${exactVariationGuide()} For each variation include: Final Prompt, Shot Purpose, Camera & Lens Feel, Blocking, Foreground/Midground/Background, Character Continuity, Lighting, Composition, Motion Direction, Negative Prompt, and Best Use.`,
  },
  "comic-strip-script-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "panel_count", label: "Panel Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_panel_count", label: "Custom Panel Count", required: false, maxLength: 20 }, { id: "art_style", label: "Comic Style", required: true, minLength: 2, maxLength: 160 }, { id: "dialogue_density", label: "Dialogue Density", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in polished comic-strip scripting and panel rhythm.`,
    outputGuide: `Return Markdown with # Comic Strip Script Generator. ${countGuide("panel_count", "custom_panel_count", "panel")} Include: premise, cast lock, visual motif, then each panel with setting, composition, action, facial expression, dialogue, caption/SFX, bubble order, pacing purpose, and transition. End with punchline/payoff and continuity notes.`,
  },
  "comic-panel-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "art_style", label: "Comic Style", required: true, minLength: 2, maxLength: 160 }, { id: "camera_language", label: "Composition / Camera", required: true, minLength: 2, maxLength: 160 }, { id: "speech_space", label: "Speech-Bubble Space", required: true, minLength: 2, maxLength: 160 }, { id: "aspect_ratio", label: "Panel Ratio", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in finished comic-panel image prompts.`,
    outputGuide: `Return Markdown with # Comic Panel Prompt Generator. ${exactVariationGuide()} For each variation include: Final Prompt, Panel Intent, Composition, Character Placement, Expressions, Environment, Ink/Color Treatment, Lighting, Speech-Space Plan, Continuity Locks, Negative Prompt, and Best Use. Do not request readable text unless the user explicitly supplies exact lettering.`,
  },
  "webtoon-episode-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "panel_count", label: "Panel Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_panel_count", label: "Custom Panel Count", required: false, maxLength: 20 }, { id: "episode_depth", label: "Episode Depth", required: true, minLength: 2, maxLength: 160 }, { id: "art_style", label: "Webtoon Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in mobile-first vertical-scroll webtoon episodes.`,
    outputGuide: `Return Markdown with # Webtoon Episode Generator. ${countGuide("panel_count", "custom_panel_count", "panel")} Include episode hook, scroll-rhythm plan, whitespace beats, reveal timing, then every panel with visual, dialogue/SFX, vertical spacing, emotional beat, continuity, and scroll transition. End with a strong cliffhanger and next-episode hook. Match episode_depth.`,
  },
  "character-expression-sheet-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "expression_set", label: "Expression Set", required: true, minLength: 2, maxLength: 160 }, { id: "art_style", label: "Art Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in character expression-sheet prompt design.`,
    outputGuide: `Return Markdown with # Character Expression Sheet Prompt Generator. ${exactVariationGuide()} For each variation include: Final Prompt, Sheet Layout, Exact Expression List, Identity Locks, Face/Head Consistency, Art Style, Lighting/Background, Negative Prompt, and Best Use. Keep the same exact character across all expressions.`,
  },
  "character-pose-sheet-prompt-generator": {
    creditCost: 1,
    requiredInputs: [...commonRequired, { id: "prompt_variations", label: "Prompt Variations", required: true, minLength: 2, maxLength: 80 }, { id: "pose_set", label: "Pose Set", required: true, minLength: 2, maxLength: 160 }, { id: "art_style", label: "Art Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in professional character pose-sheet prompt design.`,
    outputGuide: `Return Markdown with # Character Pose Sheet Prompt Generator. ${exactVariationGuide()} For each variation include: Final Prompt, Sheet Layout, Exact Pose List, Identity Locks, Anatomy & Balance, Silhouette Readability, Motion Arcs, Art Style, Lighting/Background, Negative Prompt, and Best Use.`,
  },
  "visual-continuity-guide-generator": {
    creditCost: 7,
    requiredInputs: [...commonRequired, { id: "guide_depth", label: "Guide Depth", required: true, minLength: 2, maxLength: 160 }, { id: "art_style", label: "Visual Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in visual continuity bibles for storyboard, comic, manga, webtoon, and animation production.`,
    outputGuide: `Return Markdown with # Visual Continuity Guide Generator. Include: visual thesis, character identity locks, costume rules, prop continuity, location geography, color system, lighting logic, camera rules, panel language, scale/proportion rules, timeline changes, recurring motifs, speech/SFX conventions, do/don't list, continuity checklist, and revision protocol. Match guide_depth.`,
  },
  "scene-blocking-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "beat_count", label: "Blocking Beat Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_beat_count", label: "Custom Beat Count", required: false, maxLength: 20 }, { id: "camera_language", label: "Camera Language", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in scene blocking, screen direction, eyelines, and spatial geography.`,
    outputGuide: `Return Markdown with # Scene Blocking Generator. ${countGuide("beat_count", "custom_beat_count", "blocking beat")} Start with a top-down geography summary. For every beat include: starting positions, movement path, facing direction, eyelines, prop interaction, camera placement, screen direction, emotional purpose, continuity risk, and transition into the next beat.`,
  },
  "frame-by-frame-animation-plan-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "frame_count", label: "Planned Frame / Beat Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_frame_count", label: "Custom Frame Count", required: false, maxLength: 20 }, { id: "animation_style", label: "Animation / Drawing Style", required: true, minLength: 2, maxLength: 160 }, { id: "timing_style", label: "Timing Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in practical frame-by-frame animation planning.`,
    outputGuide: `Return Markdown with # Frame-by-Frame Animation Plan Generator. ${countGuide("frame_count", "custom_frame_count", "frame/beat")} Include timing assumptions, then every frame/beat with key pose or in-between status, body mechanics, facial change, motion arc, spacing/easing, camera, smear/impact notes, continuity, and next-frame transition.`,
  },
  "animatic-script-generator": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "shot_count", label: "Shot Count", required: true, minLength: 1, maxLength: 80 }, { id: "custom_shot_count", label: "Custom Shot Count", required: false, maxLength: 20 }, { id: "duration", label: "Target Duration", required: true, minLength: 2, maxLength: 160 }, { id: "camera_language", label: "Camera Language", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumSystem} Specialize in timed animatic scripts and editorial planning.`,
    outputGuide: `Return Markdown with # Animatic Script Generator. ${countGuide("shot_count", "custom_shot_count", "shot")} Match the selected duration. Include total timing, then every shot with timecode, duration, frame description, camera, character action, dialogue/VO, sound/SFX/music, transition, continuity, and editorial purpose. End with pacing review and production checklist.`,
  },
};
