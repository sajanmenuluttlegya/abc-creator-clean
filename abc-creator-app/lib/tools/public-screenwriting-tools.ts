type ScreenwritingInput = { id: string; label: string; type: "text" | "textarea" | "select"; placeholder?: string; required: boolean; options?: string[] };
type ScreenwritingTool = { id: string; slug: string; name: string; description: string; icon: string; detailEmoji: string; category: string; displayCreditCost: number; outputType: "text"; aliases?: string[]; nextActions?: Array<{ label: string; href: string; description: string }>; inputs: ScreenwritingInput[] };

const category = "Film / Video Creator Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const allNicheGenreOptions = ["All genres / custom", "Fantasy", "Sci-fi", "Romance", "Thriller", "Mystery", "Horror", "Adventure", "Historical fiction", "Contemporary fiction", "Literary fiction", "Young adult", "Middle grade", "Children's book", "Non-fiction", "Self-help", "Business", "Memoir", "Spiritual", "Comedy", "Drama", "Fan-fiction style original", "Other"];
const genreOptions = ["Action", "Adventure", "Comedy", "Drama", "Romance", "Thriller", "Horror", "Mystery", "Sci-fi", "Fantasy", "Crime", "Historical", "Family", "Animation", "Coming-of-age", "Supernatural", "Noir", "Satire", "Documentary-style", "Custom from brief"];
const toneOptions = ["Cinematic", "Commercial", "Prestige drama", "Dark psychological", "Funny and warm", "Gritty realistic", "High-energy", "Emotional", "Suspenseful", "Inspirational", "Family-friendly", "Satirical", "Custom from brief"];
const ratingOptions = ["All ages", "Family / PG", "Teen / PG-13", "Mature / R-style", "Streaming prestige", "Custom from brief"];
const variationOptions = ["1 variation", "3 variations", "5 variations", "10 variations"];
const sceneCountOptions = ["8 scenes", "12 scenes", "16 scenes", "24 scenes", "32 scenes", "Custom (<49)"];
const sceneLengthOptions = ["Short scene (5 credits)", "Standard scene (7 credits)", "Long scene (9 credits)", "Detailed cinematic scene (11 credits)"];
const structureDepthOptions = ["Compact professional", "Standard writer-room", "Detailed production-ready", "Premium executive-level"];
const synopsisLengthOptions = ["Short synopsis (3 credits)", "One-page synopsis (5 credits)", "Detailed synopsis (7 credits)", "Pitch-ready synopsis (7 credits)"];
const summaryDepthOptions = ["Compact cast sheet", "Standard pitch deck", "Detailed character bible", "Premium show bible"];
const storyStructureOptions = ["Save the Cat", "Three-act structure", "Hero’s Journey", "Eight-sequence structure", "Short film structure", "Custom hybrid"];
const endingOptions = ["Happy ending", "Bittersweet ending", "Tragic ending", "Twist ending", "Open ending", "Mystery reveal", "Redemptive ending", "Custom from brief"];
const dialogueStyleOptions = ["Natural and restrained", "Sharp and witty", "Emotional and intimate", "Sparse and tense", "Stylized genre dialogue", "Commercial streaming style", "Custom from brief"];
const themeStyleOptions = ["Commercial", "Prestige drama", "Dark psychological", "Inspirational", "Family-friendly", "Philosophical", "Satirical"];

const sourceInput: ScreenwritingInput = { id: "source_content", label: "Story / Script Material", type: "textarea", placeholder: "Paste the idea, treatment, outline, scene notes, existing script pages, character notes, or source material. For file-based material, paste the relevant extracted text here.", required: true };
const extraNotesInput: ScreenwritingInput = { id: "extra_notes", label: "Extra Notes / Must Preserve", type: "textarea", placeholder: "Optional: names, canon, locations, references, budget limits, must-include moments, avoid list, formatting rules, or producer notes.", required: false };
const commonTailInputs: ScreenwritingInput[] = [
  { id: "genre", label: "Genre", type: "select", required: true, options: genreOptions },
  { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
  { id: "audience_rating", label: "Audience / Rating", type: "select", required: true, options: ratingOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  extraNotesInput,
];

export const screenwritingTools: ScreenwritingTool[] = [
  {
    id: "logline-creator",
    slug: "logline-creator",
    name: "Logline Creator",
    description: "Create tight commercial movie loglines with stakes, irony, conflict, and pitch-ready clarity.",
    icon: "screenwriting",
    detailEmoji: "🎬",
    category,
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["movie-logline-generator", "film-logline-creator", "screenplay-logline-generator"],
    nextActions: [{ label: "Expand into synopsis", href: "/tools/movie-synopsis-generator", description: "Turn the best logline into a professional synopsis." }],
    inputs: [
      sourceInput,
      { id: "protagonist", label: "Protagonist", type: "text", placeholder: "e.g., A burned-out paramedic", required: false },
      { id: "goal", label: "Goal", type: "text", placeholder: "e.g., must save one impossible patient before sunrise", required: false },
      { id: "obstacle", label: "Obstacle / Antagonist", type: "text", placeholder: "e.g., a corrupt hospital system and a secret from his past", required: false },
      { id: "stakes", label: "Stakes", type: "text", placeholder: "e.g., if he fails, the whole city learns the truth", required: false },
      { id: "variation_count", label: "Logline Variations", type: "select", required: true, options: variationOptions },
      ...commonTailInputs,
    ],
  },
  {
    id: "movie-synopsis-generator",
    slug: "movie-synopsis-generator",
    name: "Movie Synopsis Generator",
    description: "Write a professional pitch-ready movie synopsis with clear arc, escalation, and ending logic.",
    icon: "screenwriting",
    detailEmoji: "🎞️",
    category,
    displayCreditCost: 3,
    outputType: "text",
    aliases: ["film-synopsis-generator", "screenplay-synopsis-generator"],
    nextActions: [{ label: "Break into acts", href: "/tools/act-breakdown", description: "Convert the synopsis into a strong act structure." }],
    inputs: [
      sourceInput,
      { id: "main_character", label: "Main Character", type: "text", placeholder: "Name / role / desire", required: false },
      { id: "core_conflict", label: "Core Conflict", type: "textarea", placeholder: "Optional: the central problem, antagonist, pressure, or emotional contradiction.", required: false },
      { id: "ending_reveal", label: "Ending Reveal", type: "textarea", placeholder: "Optional: desired ending, twist, final image, or what must not be spoiled.", required: false },
      { id: "synopsis_length", label: "Synopsis Length", type: "select", required: true, options: synopsisLengthOptions },
      { id: "variation_count", label: "Synopsis Variations", type: "select", required: true, options: variationOptions },
      ...commonTailInputs,
    ],
  },
  {
    id: "act-breakdown",
    slug: "act-breakdown",
    name: "Act Breakdown",
    description: "Break a film idea into Act 1, Act 2A, Act 2B, and Act 3 with strong turning points.",
    icon: "screenwriting",
    detailEmoji: "🧱",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["movie-act-breakdown", "screenplay-act-breakdown"],
    nextActions: [{ label: "Generate beat sheet", href: "/tools/beat-sheet-generator", description: "Turn the act map into a full beat sheet." }],
    inputs: [sourceInput, { id: "runtime", label: "Runtime", type: "select", required: true, options: ["Short film", "30 minutes", "60 minutes", "90 minutes", "120 minutes", "Limited series pilot"] }, { id: "ending_type", label: "Ending Type", type: "select", required: true, options: endingOptions }, { id: "structure_depth", label: "Breakdown Depth", type: "select", required: true, options: structureDepthOptions }, ...commonTailInputs],
  },
  {
    id: "beat-sheet-generator",
    slug: "beat-sheet-generator",
    name: "Beat Sheet Generator",
    description: "Create a professional writer-room beat sheet using industry story structures.",
    icon: "screenwriting",
    detailEmoji: "📌",
    category,
    displayCreditCost: 7,
    outputType: "text",
    aliases: ["movie-beat-sheet", "screenplay-beat-sheet-generator"],
    nextActions: [{ label: "Craft scene list", href: "/tools/scene-list-crafter", description: "Turn the beat sheet into an ordered scene list." }],
    inputs: [sourceInput, { id: "story_structure", label: "Story Structure", type: "select", required: true, options: storyStructureOptions }, { id: "runtime", label: "Runtime", type: "select", required: true, options: ["Short film", "30 minutes", "60 minutes", "90 minutes", "120 minutes", "Limited series pilot"] }, { id: "antagonist_or_obstacle", label: "Antagonist / Obstacle", type: "textarea", placeholder: "Optional: antagonist, force of opposition, inner flaw, system, ticking clock, or pressure.", required: false }, { id: "ending_type", label: "Ending Type", type: "select", required: true, options: endingOptions }, { id: "structure_depth", label: "Beat Detail", type: "select", required: true, options: structureDepthOptions }, ...commonTailInputs],
  },
  {
    id: "scene-list-crafter",
    slug: "scene-list-crafter",
    name: "Scene List Crafter",
    description: "Create an ordered scene list with conflict, purpose, turning points, and hooks.",
    icon: "screenwriting",
    detailEmoji: "🎥",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["movie-scene-list", "scene-outline-generator", "screenplay-scene-list"],
    nextActions: [{ label: "Write a scene", href: "/tools/scene-script-writer", description: "Use one scene from the list and write it in screenplay format." }],
    inputs: [sourceInput, { id: "scene_count", label: "Scene Count", type: "select", required: true, options: sceneCountOptions }, { id: "custom_scene_count", label: "Custom Scene Count (<49)", type: "text", placeholder: "Enter 1–48 only when Custom is selected", required: false }, { id: "variation_count", label: "Scene List Variations", type: "select", required: true, options: variationOptions }, { id: "main_character", label: "Main Character", type: "text", placeholder: "Optional: protagonist name/role", required: false }, { id: "core_conflict", label: "Core Conflict", type: "textarea", placeholder: "Optional: the central conflict and stakes.", required: false }, { id: "ending_type", label: "Ending Type", type: "select", required: true, options: endingOptions }, ...commonTailInputs],
  },
  {
    id: "scene-script-writer",
    slug: "scene-script-writer",
    name: "Scene Script Writer",
    description: "Write a cinematic screenplay scene with scene heading, action, dialogue, subtext, and a strong ending beat.",
    icon: "screenwriting",
    detailEmoji: "✍️",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["screenplay-scene-writer", "movie-scene-script-generator"],
    inputs: [sourceInput, { id: "characters_in_scene", label: "Characters in Scene", type: "textarea", placeholder: "Names, roles, relationships, secrets, and what each character wants.", required: true }, { id: "location", label: "Location", type: "text", placeholder: "e.g., INT. ABANDONED THEATER - NIGHT", required: true }, { id: "scene_purpose", label: "Scene Purpose", type: "textarea", placeholder: "What must change by the end of this scene?", required: true }, { id: "scene_length", label: "Scene Length", type: "select", required: true, options: sceneLengthOptions }, { id: "dialogue_style", label: "Dialogue Style", type: "select", required: true, options: dialogueStyleOptions }, ...commonTailInputs],
  },
  {
    id: "character-development",
    slug: "character-development",
    name: "Character Development",
    description: "Build a deep screenplay character with goal, flaw, wound, voice, visual presence, and arc.",
    icon: "person",
    detailEmoji: "🧍",
    category,
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["movie-character-development", "screenplay-character-builder"],
    inputs: [sourceInput, { id: "character_name", label: "Character Name", type: "text", placeholder: "e.g., Maya Rao", required: true }, { id: "role_in_story", label: "Role in Story", type: "select", required: true, options: ["Protagonist", "Antagonist", "Love interest", "Mentor", "Sidekick", "False ally", "Comic relief", "Family member", "Rival", "Custom from brief"] }, { id: "age_background", label: "Age / Background", type: "text", placeholder: "Optional: age range, job, class, culture, history.", required: false }, { id: "goal", label: "External Goal", type: "text", placeholder: "What they think they want.", required: false }, { id: "fear_flaw_secret", label: "Fear / Flaw / Secret", type: "textarea", placeholder: "What they hide, avoid, deny, or cannot admit.", required: false }, { id: "profile_depth", label: "Profile Depth", type: "select", required: true, options: summaryDepthOptions }, ...commonTailInputs],
  },
  {
    id: "character-summary-builder",
    slug: "character-summary-builder",
    name: "Character Summary Builder",
    description: "Create concise pitch-deck character summaries for multiple characters.",
    icon: "person",
    detailEmoji: "👥",
    category,
    displayCreditCost: 3,
    outputType: "text",
    aliases: ["cast-summary-builder", "movie-character-summary-generator"],
    inputs: [sourceInput, { id: "character_list", label: "Character List", type: "textarea", placeholder: "Paste names and any known details. One character per line is ideal.", required: true }, { id: "summary_depth", label: "Summary Depth", type: "select", required: true, options: summaryDepthOptions }, ...commonTailInputs],
  },
  {
    id: "movie-theme-creator",
    slug: "movie-theme-creator",
    name: "Movie Theme Creator",
    description: "Find the emotional thesis, theme questions, motifs, and non-preachy theme payoffs for a film.",
    icon: "screenwriting",
    detailEmoji: "🧠",
    category,
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["film-theme-generator", "screenplay-theme-creator"],
    inputs: [sourceInput, { id: "desired_emotional_impact", label: "Desired Emotional Impact", type: "text", placeholder: "e.g., heartbreaking but hopeful, thrilling, cathartic, funny and warm", required: false }, { id: "theme_style", label: "Theme Style", type: "select", required: true, options: themeStyleOptions }, { id: "variation_count", label: "Theme Variations", type: "select", required: true, options: variationOptions }, ...commonTailInputs],
  },
];
