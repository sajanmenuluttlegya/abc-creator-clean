type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const sourceField: ToolFieldRule = { id: "source_content", label: "Story / Script Material", required: true, minLength: 10, maxLength: 65000 };
const commonRequired: ToolFieldRule[] = [
  sourceField,
  { id: "genre", label: "Genre", required: true, minLength: 2, maxLength: 160 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
  { id: "audience_rating", label: "Audience / Rating", required: true, minLength: 2, maxLength: 160 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  { id: "extra_notes", label: "Extra Notes / Must Preserve", required: false, maxLength: 12000 },
];

const premiumScreenwritingSystem = `You are ABC Creator's premium professional screenwriter and script development editor. Write like a produced screenwriter, not a generic AI assistant. Use industry-style cinematic thinking: conflict, visual action, subtext, character objective, escalation, reversals, stakes, and emotionally specific choices. Never pad with vague advice. Never say you cannot write unless the user asks for something disallowed. Preserve supplied names, canon, tone, genre, rating, and language. If source material is messy, extract the strongest dramatic spine and organize it cleanly. Show, don't tell. Make every output pitch-ready, specific, and useful for real development.`;

function exactVariationGuide(fieldName = "variation_count") {
  return `Return exactly the number selected in ${fieldName}: 1, 3, 5, or 10. Do not add extra versions. If the selected count is 1, return only one polished version.`;
}

export const serverScreenwritingTools: Record<string, ServerPrompt> = {
  "logline-creator": {
    creditCost: 1,
    requiredInputs: [
      ...commonRequired,
      { id: "variation_count", label: "Logline Variations", required: true, minLength: 2, maxLength: 80 },
      { id: "protagonist", label: "Protagonist", required: false, maxLength: 800 },
      { id: "goal", label: "Goal", required: false, maxLength: 800 },
      { id: "obstacle", label: "Obstacle / Antagonist", required: false, maxLength: 1200 },
      { id: "stakes", label: "Stakes", required: false, maxLength: 1200 },
    ],
    system: `${premiumScreenwritingSystem} Specialize in commercial loglines with irony, urgency, protagonist, goal, obstacle, and stakes.`,
    outputGuide: `Return Markdown with # Logline Creator. ${exactVariationGuide()} For each variation include: the logline, genre positioning, why it works, and a tighter optional polish when useful. End with ## Best Pick and explain the strongest commercial choice in 3-5 bullets. Keep every logline one sentence unless the premise genuinely requires a two-sentence streaming-style pitch.`,
  },
  "movie-synopsis-generator": {
    creditCost: 3,
    requiredInputs: [...commonRequired, { id: "synopsis_length", label: "Synopsis Length", required: true, minLength: 2, maxLength: 120 }, { id: "variation_count", label: "Synopsis Variations", required: true, minLength: 2, maxLength: 80 }, { id: "main_character", label: "Main Character", required: false, maxLength: 1200 }, { id: "core_conflict", label: "Core Conflict", required: false, maxLength: 6000 }, { id: "ending_reveal", label: "Ending Reveal", required: false, maxLength: 6000 }],
    system: `${premiumScreenwritingSystem} Specialize in movie synopses that feel pitch-ready, emotionally clear, and dramatically escalated.`,
    outputGuide: `Return Markdown with # Movie Synopsis Generator. ${exactVariationGuide()} Match the selected synopsis_length. For each variation include: title suggestion, genre positioning, short hook, full synopsis, protagonist arc, antagonist/obstacle pressure, ending summary, and why it works. Do not write a dry Wikipedia plot recap; make it sound like a professional pitch document.`,
  },
  "act-breakdown": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "runtime", label: "Runtime", required: true, minLength: 2, maxLength: 120 }, { id: "ending_type", label: "Ending Type", required: true, minLength: 2, maxLength: 160 }, { id: "structure_depth", label: "Breakdown Depth", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumScreenwritingSystem} Specialize in act structure and turning-point design.`,
    outputGuide: `Return Markdown with # Act Breakdown. Include: premise spine, Act 1 setup, Act 1 turning point, Act 2A promise of premise, midpoint reversal, Act 2B escalation, all-is-lost moment, Act 3 climax, resolution/final image, and writer-room notes. Use the selected runtime and structure_depth to control detail. Every act must include conflict, choice, consequence, and character change.`,
  },
  "beat-sheet-generator": {
    creditCost: 7,
    requiredInputs: [...commonRequired, { id: "story_structure", label: "Story Structure", required: true, minLength: 2, maxLength: 160 }, { id: "runtime", label: "Runtime", required: true, minLength: 2, maxLength: 120 }, { id: "ending_type", label: "Ending Type", required: true, minLength: 2, maxLength: 160 }, { id: "structure_depth", label: "Beat Detail", required: true, minLength: 2, maxLength: 160 }, { id: "antagonist_or_obstacle", label: "Antagonist / Obstacle", required: false, maxLength: 6000 }],
    system: `${premiumScreenwritingSystem} Specialize in writer-room beat sheets.`,
    outputGuide: `Return Markdown with # Beat Sheet Generator. Use the selected story_structure. Include the full beat map with opening image, theme stated, setup, catalyst, debate, break into Act 2, fun and games, midpoint, bad guys close in, all is lost, dark night of the soul, break into Act 3, finale, and final image when compatible. For each beat include purpose, conflict, character movement, and visual/dramatic execution.`,
  },
  "scene-list-crafter": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "scene_count", label: "Scene Count", required: true, minLength: 2, maxLength: 80 }, { id: "custom_scene_count", label: "Custom Scene Count", required: false, maxLength: 20 }, { id: "variation_count", label: "Scene List Variations", required: true, minLength: 2, maxLength: 80 }, { id: "ending_type", label: "Ending Type", required: true, minLength: 2, maxLength: 160 }, { id: "main_character", label: "Main Character", required: false, maxLength: 1200 }, { id: "core_conflict", label: "Core Conflict", required: false, maxLength: 6000 }],
    system: `${premiumScreenwritingSystem} Specialize in ordered scene construction and story escalation.`,
    outputGuide: `Return Markdown with # Scene List Crafter. ${exactVariationGuide()} For each variation, output exactly the selected scene_count. If scene_count is Custom (<49), use custom_scene_count and it must be a whole number from 1 to 48. For every scene include: scene number, location, scene title, what happens, conflict, character change, purpose in story, and hook into next scene. Never output filler scenes; every scene must move plot, character, or stakes.`,
  },
  "scene-script-writer": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "characters_in_scene", label: "Characters in Scene", required: true, minLength: 2, maxLength: 8000 }, { id: "location", label: "Location", required: true, minLength: 2, maxLength: 500 }, { id: "scene_purpose", label: "Scene Purpose", required: true, minLength: 5, maxLength: 6000 }, { id: "scene_length", label: "Scene Length", required: true, minLength: 2, maxLength: 160 }, { id: "dialogue_style", label: "Dialogue Style", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumScreenwritingSystem} Specialize in screenplay scene writing with correct scene headings, action lines, dialogue, subtext, and cinematic pacing.`,
    outputGuide: `Return Markdown with # Scene Script Writer, then the screenplay scene. Use screenplay-style formatting: scene heading, lean action lines, dialogue blocks, parentheticals only when truly needed, and a final emotional or plot hook. Match the selected scene_length. Keep action visual and playable. Every character should want something in the scene. Do not explain the scene before writing it; write the scene directly, then add a short ## Writer Notes section only after the scene.`,
  },
  "character-development": {
    creditCost: 5,
    requiredInputs: [...commonRequired, { id: "character_name", label: "Character Name", required: true, minLength: 1, maxLength: 300 }, { id: "role_in_story", label: "Role in Story", required: true, minLength: 2, maxLength: 160 }, { id: "profile_depth", label: "Profile Depth", required: true, minLength: 2, maxLength: 160 }, { id: "age_background", label: "Age / Background", required: false, maxLength: 1200 }, { id: "goal", label: "External Goal", required: false, maxLength: 1200 }, { id: "fear_flaw_secret", label: "Fear / Flaw / Secret", required: false, maxLength: 6000 }],
    system: `${premiumScreenwritingSystem} Specialize in deep character development for film and streaming.`,
    outputGuide: `Return Markdown with # Character Development. Include: casting-style snapshot, visual presence, external goal, internal need, fatal flaw, backstory wound, secret, contradictions, voice/dialogue style, behavioral tells, key relationships, arc across the story, pressure-test scenes, and how the character changes the theme. Keep it specific and filmable.`,
  },
  "character-summary-builder": {
    creditCost: 3,
    requiredInputs: [...commonRequired, { id: "character_list", label: "Character List", required: true, minLength: 2, maxLength: 16000 }, { id: "summary_depth", label: "Summary Depth", required: true, minLength: 2, maxLength: 160 }],
    system: `${premiumScreenwritingSystem} Specialize in concise cast summaries for pitch decks, bibles, and planning docs.`,
    outputGuide: `Return Markdown with # Character Summary Builder. For each character include: name, role, one-line description, goal, flaw, arc, relationship to protagonist, screen presence, and strongest scene function. Use the selected summary_depth. Keep summaries concise but vivid, not generic.`,
  },
  "movie-theme-creator": {
    creditCost: 2,
    requiredInputs: [...commonRequired, { id: "theme_style", label: "Theme Style", required: true, minLength: 2, maxLength: 160 }, { id: "variation_count", label: "Theme Variations", required: true, minLength: 2, maxLength: 80 }, { id: "desired_emotional_impact", label: "Desired Emotional Impact", required: false, maxLength: 1200 }],
    system: `${premiumScreenwritingSystem} Specialize in theme, motif, moral question, and non-preachy emotional thesis.`,
    outputGuide: `Return Markdown with # Movie Theme Creator. ${exactVariationGuide()} For each variation include: primary theme, secondary themes, theme question, character-based theme, visual motif ideas, dialogue motif ideas, ending theme payoff, and how to show theme without preaching. Make themes dramatic and embodied through choices, not lectures.`,
  },
};
