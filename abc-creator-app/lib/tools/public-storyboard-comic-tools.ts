type StoryboardComicInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type StoryboardComicTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType?: "text";
  aliases?: string[];
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: StoryboardComicInput[];
};

const category = "Storyboarding / Comic Creator Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["Kids", "Teens", "Young adults", "Adults", "Family audience", "General audience", "Custom from brief"];
const toneOptions = ["Cinematic", "Dramatic", "Comedic", "Emotional", "Suspenseful", "Action-heavy", "Whimsical", "Dark", "Romantic", "Educational", "Premium studio-style", "Custom from brief"];
const formatOptions = ["Feature film", "Short film", "Series episode", "Commercial", "Music video", "YouTube video", "Comic strip", "Comic page", "Manga page", "Webtoon episode", "Animated sequence", "Custom from brief"];
const artStyleOptions = ["Cinematic storyboard", "Clean storyboard sketch", "Graphic novel", "American comic", "European comic", "Shonen manga", "Shojo manga", "Seinen manga", "Josei manga", "Webtoon", "Anime storyboard", "Children’s comic", "Noir ink", "Custom from brief"];
const variationOptions = ["1 variation", "3 variations", "5 variations", "10 variations"];
const countOptions = ["8", "12", "16", "24", "32", "Custom (<49)"];
const depthOptions = ["Compact professional (2 credits)", "Standard production-ready (5 credits)", "Detailed studio-ready (7 credits)", "Premium continuity bible (9 credits)"];
const durationOptions = ["15 seconds", "30 seconds", "60 seconds", "2 minutes", "5 minutes", "10 minutes", "Custom from brief"];
const aspectRatioOptions = ["16:9 landscape", "9:16 vertical", "1:1 square", "4:5 portrait", "3:4 portrait", "4:3 landscape", "3:2 landscape", "2:3 portrait", "Custom from brief"];
const cameraOptions = ["Auto cinematic", "Wide establishing", "Medium two-shot", "Close-up emotional", "Over-the-shoulder", "Low-angle heroic", "High-angle vulnerable", "Tracking shot", "Dutch angle", "POV", "Custom from brief"];

const sourceInput: StoryboardComicInput = {
  id: "source_content",
  label: "Story / Scene Brief",
  type: "textarea",
  placeholder: "Paste the script, scene, story beat, comic idea, dialogue, character notes, or visual brief.",
  required: true,
};

const continuityInput: StoryboardComicInput = {
  id: "continuity_notes",
  label: "Continuity / Must Preserve",
  type: "textarea",
  placeholder: "Optional: character appearance, costume, props, environment, visual rules, canon, panel restrictions, or details that must stay consistent.",
  required: false,
};

const commonInputs: StoryboardComicInput[] = [
  { id: "format", label: "Format", type: "select", required: true, options: formatOptions },
  { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
  { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  continuityInput,
];

export const storyboardComicTools: StoryboardComicTool[] = [
  {
    id: "storyboard-panel-generator",
    slug: "storyboard-panel-generator",
    name: "Storyboard Panel Generator",
    description: "Create production-ready storyboard panels with framing, action, composition, continuity, dialogue, and transitions.",
    icon: "storyboard",
    detailEmoji: "🎞️",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["storyboard-generator", "panel-by-panel-storyboard-generator"],
    nextActions: [{ label: "Create shot prompts", href: "/tools/storyboard-shot-prompt-generator", description: "Turn the storyboard into premium image prompts." }],
    inputs: [
      sourceInput,
      { id: "panel_count", label: "Panel Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} panels`) },
      { id: "custom_panel_count", label: "Custom Panel Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "art_style", label: "Storyboard Style", type: "select", required: true, options: artStyleOptions },
      { id: "aspect_ratio", label: "Frame Ratio", type: "select", required: true, options: aspectRatioOptions },
      ...commonInputs,
    ],
  },
  {
    id: "storyboard-shot-prompt-generator",
    slug: "storyboard-shot-prompt-generator",
    name: "Storyboard Shot Prompt Generator",
    description: "Generate premium storyboard shot prompts with camera, staging, lighting, blocking, and continuity locks.",
    icon: "prompt",
    detailEmoji: "📷",
    category,
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["storyboard-image-prompt-generator", "shot-prompt-generator"],
    inputs: [
      sourceInput,
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: variationOptions },
      { id: "camera_language", label: "Camera Language", type: "select", required: true, options: cameraOptions },
      { id: "art_style", label: "Storyboard Style", type: "select", required: true, options: artStyleOptions },
      { id: "aspect_ratio", label: "Aspect Ratio", type: "select", required: true, options: aspectRatioOptions },
      ...commonInputs,
    ],
  },
  {
    id: "comic-strip-script-generator",
    slug: "comic-strip-script-generator",
    name: "Comic Strip Script Generator",
    description: "Write polished panel-by-panel comic strip scripts with dialogue, captions, visual beats, pacing, and punchlines.",
    icon: "comic",
    detailEmoji: "💬",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["comic-script-generator", "comic-strip-writer"],
    nextActions: [{ label: "Create panel prompts", href: "/tools/comic-panel-prompt-generator", description: "Turn the script into detailed panel prompts." }],
    inputs: [
      sourceInput,
      { id: "panel_count", label: "Panel Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} panels`) },
      { id: "custom_panel_count", label: "Custom Panel Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "art_style", label: "Comic Style", type: "select", required: true, options: artStyleOptions },
      { id: "dialogue_density", label: "Dialogue Density", type: "select", required: true, options: ["Minimal visual storytelling", "Balanced", "Dialogue-forward", "Caption-led", "Custom from brief"] },
      ...commonInputs,
    ],
  },
  {
    id: "comic-panel-prompt-generator",
    slug: "comic-panel-prompt-generator",
    name: "Comic Panel Prompt Generator",
    description: "Create detailed comic-panel prompts with composition, expressions, character placement, speech-space planning, and negative prompts.",
    icon: "prompt",
    detailEmoji: "🖼️",
    category,
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["comic-image-prompt-generator", "comic-panel-image-prompt"],
    inputs: [
      sourceInput,
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: variationOptions },
      { id: "art_style", label: "Comic Style", type: "select", required: true, options: artStyleOptions },
      { id: "camera_language", label: "Composition / Camera", type: "select", required: true, options: cameraOptions },
      { id: "speech_space", label: "Speech-Bubble Space", type: "select", required: true, options: ["No speech bubbles", "Reserve blank speech space", "Include empty speech bubbles only", "Custom from brief"] },
      { id: "aspect_ratio", label: "Panel Ratio", type: "select", required: true, options: aspectRatioOptions },
      ...commonInputs,
    ],
  },
  {
    id: "manga-scene-generator",
    slug: "manga-scene-generator",
    name: "Manga Scene Generator",
    description: "Generate a finished premium manga scene image with precise composition, character continuity, ink, screentone, and panel-safe layout controls.",
    icon: "image",
    detailEmoji: "🖋️",
    category,
    displayCreditCost: 2,
    aliases: ["manga-image-generator", "manga-panel-generator", "anime-manga-scene-generator"],
    inputs: [],
  },
  {
    id: "webtoon-episode-generator",
    slug: "webtoon-episode-generator",
    name: "Webtoon Episode Generator",
    description: "Create mobile-first vertical webtoon episodes with scroll pacing, dialogue rhythm, reveals, transitions, and cliffhangers.",
    icon: "comic",
    detailEmoji: "📱",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["webtoon-script-generator", "vertical-comic-episode-generator"],
    inputs: [
      sourceInput,
      { id: "panel_count", label: "Panel Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} panels`) },
      { id: "custom_panel_count", label: "Custom Panel Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "episode_depth", label: "Episode Depth", type: "select", required: true, options: depthOptions },
      { id: "art_style", label: "Webtoon Style", type: "select", required: true, options: artStyleOptions },
      ...commonInputs,
    ],
  },
  {
    id: "character-expression-sheet-prompt-generator",
    slug: "character-expression-sheet-prompt-generator",
    name: "Character Expression Sheet Prompt Generator",
    description: "Generate consistency-locked prompts for professional character expression sheets across multiple emotions.",
    icon: "prompt",
    detailEmoji: "😲",
    category,
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["expression-sheet-prompt-generator", "character-emotion-sheet-prompt"],
    inputs: [
      sourceInput,
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: variationOptions },
      { id: "expression_set", label: "Expression Set", type: "select", required: true, options: ["Core 8 emotions", "Comedy reactions", "Action reactions", "Romantic emotions", "Villain expressions", "Kids character emotions", "Custom from brief"] },
      { id: "art_style", label: "Art Style", type: "select", required: true, options: artStyleOptions },
      ...commonInputs,
    ],
  },
  {
    id: "character-pose-sheet-prompt-generator",
    slug: "character-pose-sheet-prompt-generator",
    name: "Character Pose Sheet Prompt Generator",
    description: "Generate consistency-locked prompts for pose sheets with anatomy, balance, silhouette, motion, and action clarity.",
    icon: "prompt",
    detailEmoji: "🏃",
    category,
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["pose-sheet-prompt-generator", "character-action-pose-prompt"],
    inputs: [
      sourceInput,
      { id: "prompt_variations", label: "Prompt Variations", type: "select", required: true, options: variationOptions },
      { id: "pose_set", label: "Pose Set", type: "select", required: true, options: ["Neutral production poses", "Action poses", "Combat poses", "Comedy poses", "Romantic poses", "Sports poses", "Magic / power poses", "Custom from brief"] },
      { id: "art_style", label: "Art Style", type: "select", required: true, options: artStyleOptions },
      ...commonInputs,
    ],
  },
  {
    id: "visual-continuity-guide-generator",
    slug: "visual-continuity-guide-generator",
    name: "Visual Continuity Guide Generator",
    description: "Build a professional visual continuity bible for characters, costumes, props, locations, colors, lighting, and recurring rules.",
    icon: "storyboard",
    detailEmoji: "📚",
    category,
    displayCreditCost: 7,
    outputType: "text",
    aliases: ["visual-continuity-bible", "comic-continuity-guide-generator"],
    inputs: [
      sourceInput,
      { id: "guide_depth", label: "Guide Depth", type: "select", required: true, options: depthOptions },
      { id: "art_style", label: "Visual Style", type: "select", required: true, options: artStyleOptions },
      ...commonInputs,
    ],
  },
  {
    id: "scene-blocking-generator",
    slug: "scene-blocking-generator",
    name: "Scene Blocking Generator",
    description: "Plan professional character placement, movement, eyelines, object interaction, camera geography, and spatial continuity.",
    icon: "storyboard",
    detailEmoji: "🧭",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["scene-staging-generator", "character-blocking-planner"],
    inputs: [
      sourceInput,
      { id: "beat_count", label: "Blocking Beat Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} beats`) },
      { id: "custom_beat_count", label: "Custom Beat Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "camera_language", label: "Camera Language", type: "select", required: true, options: cameraOptions },
      ...commonInputs,
    ],
  },
  {
    id: "frame-by-frame-animation-plan-generator",
    slug: "frame-by-frame-animation-plan-generator",
    name: "Frame-by-Frame Animation Plan Generator",
    description: "Break a sequence into key poses, in-betweens, timing, motion arcs, camera changes, and transition frames.",
    icon: "animation",
    detailEmoji: "🎬",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["frame-plan-generator", "animation-frame-breakdown-generator"],
    inputs: [
      sourceInput,
      { id: "frame_count", label: "Planned Frame / Beat Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} frames`) },
      { id: "custom_frame_count", label: "Custom Frame Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "animation_style", label: "Animation / Drawing Style", type: "select", required: true, options: artStyleOptions },
      { id: "timing_style", label: "Timing Style", type: "select", required: true, options: ["Natural cinematic", "Snappy comedy", "Anime limited animation", "Fluid full animation", "Slow dramatic", "Fast action", "Custom from brief"] },
      ...commonInputs,
    ],
  },
  {
    id: "animatic-script-generator",
    slug: "animatic-script-generator",
    name: "Animatic Script Generator",
    description: "Create animatic-ready scripts with shot duration, camera movement, action, dialogue, sound, transitions, and timing.",
    icon: "storyboard",
    detailEmoji: "⏱️",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["animatic-planner", "animatic-shot-script-generator"],
    inputs: [
      sourceInput,
      { id: "shot_count", label: "Shot Count", type: "select", required: true, options: countOptions.map((value) => value === "Custom (<49)" ? value : `${value} shots`) },
      { id: "custom_shot_count", label: "Custom Shot Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false },
      { id: "duration", label: "Target Duration", type: "select", required: true, options: durationOptions },
      { id: "camera_language", label: "Camera Language", type: "select", required: true, options: cameraOptions },
      ...commonInputs,
    ],
  },
];
