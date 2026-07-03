type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium YouTube rules:
- Use only the user's supplied video brief, script, transcript, outline, channel context, viewer notes, competitor notes, audience, goal, tone, must-include, and avoid fields as the source of truth.
- Do not claim live YouTube access, scraping, trend access, competitor crawling, analytics, search volume, CTR, retention data, tags performance, audience demographics, comments, or platform measurements unless the user pasted that evidence.
- Do not invent statistics, rankings, income claims, subscriber/view counts, dates, research citations, customer results, testimonials, sponsorship terms, product facts, or quotes.
- For competitor and audience analysis, analyze only the pasted notes and label all strategic conclusions as inferred from supplied material.
- Build safe virality through stronger hooks, clearer packaging, curiosity gaps, payoff timing, retention beats, audience pain points, pattern interrupts, and useful CTAs without clickbait, fake urgency, copied competitor phrasing, harassment, or misleading claims.
- For scripts, include hook, intro, sections, spoken lines, retention notes, B-roll/scene ideas, on-screen text/captions when useful, and CTA.
- For thumbnails, keep overlay text short, readable, non-misleading, and paired with title/angle logic.
- Use clean Markdown, tables where useful, and concise verification notes.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 3000 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 4000 };

function coreVideoFields(label: string): ToolFieldRule[] {
  return [
    { id: "video_brief", label, required: true, minLength: 10, maxLength: 14000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "video_type", label: "Video type", required: true, minLength: 2, maxLength: 160 },
    { id: "goal", label: "Video goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ];
}

function scriptFields(label: string): ToolFieldRule[] {
  return [
    { id: "script_brief", label, required: true, minLength: 20, maxLength: 18000 },
    { id: "script_length", label: "Script length", required: true, minLength: 2, maxLength: 80 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "video_type", label: "Video type", required: true, minLength: 2, maxLength: 160 },
    { id: "goal", label: "Video goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ];
}

export const serverYouTubeCompletionBatchTools: Record<string, ServerPrompt> = {
  "youtube-hook-generator": p("YouTube Hook Generator", 2, [
    ...coreVideoFields("Video topic / hook brief"),
    { id: "hook_count", label: "Hook variations", required: true, minLength: 2, maxLength: 80 },
    { id: "hook_style", label: "Hook style", required: true, minLength: 2, maxLength: 160 },
  ], "Generate strong YouTube hooks with the requested number of variations and clear reasoning for which hook fits the audience and video goal.", "Return Markdown with: # YouTube Hooks; hook table with Hook, Style, Best For, Retention Logic, Risk Note; top 3 picks; opening intro option; avoid notes."),
  "youtube-tags-generator": p("YouTube Tags Generator", 2, coreVideoFields("Video topic / tag context"), "Create relevant YouTube tags and keyword clusters from supplied context only, without fake volume or rank claims.", "Return Markdown with: tag clusters, broad tags, long-tail tags, misspelling/variant ideas if useful, tags to avoid, and verification notes."),
  "youtube-description-generator": p("YouTube Description Generator", 2, coreVideoFields("Video topic / description brief"), "Write premium YouTube descriptions with a strong first line, useful summary, CTA, chapter placeholder, and SEO-safe keywords.", "Return Markdown with: recommended description, short version, long version, links/CTA placeholders, chapter placeholder, hashtags, and risk notes."),
  "youtube-chapters-generator": p("YouTube Chapters Generator", 3, [
    { id: "transcript_or_outline", label: "Transcript / outline / segment notes", required: true, minLength: 20, maxLength: 22000 },
    { id: "video_title", label: "Video title / topic", required: true, minLength: 2, maxLength: 240 },
    { id: "chapter_style", label: "Chapter style", required: true, minLength: 2, maxLength: 120 },
    mustField,
    avoidField,
    languageField,
  ], "Create chapter/timestamp drafts from pasted transcript, outline, or segment notes. Use exact timestamps only if supplied; otherwise use clear placeholder timestamps.", "Return Markdown with: # YouTube Chapters; timestamp table; copy-ready chapter list; sequence notes; missing timestamp verification note."),
  "thumbnail-text-generator": p("Thumbnail Text Generator", 2, [
    { id: "video_topic", label: "Video topic / title", required: true, minLength: 5, maxLength: 8000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "thumbnail_goal", label: "Thumbnail goal", required: true, minLength: 2, maxLength: 160 },
    { id: "text_count", label: "Text count", required: true, minLength: 2, maxLength: 80 },
    avoidField,
    languageField,
  ], "Generate short, readable thumbnail overlay text options that pair with YouTube title logic and do not mislead.", "Return Markdown with: overlay text table, matching title angle, why it works, readability/risk notes, and best picks."),
  "thumbnail-prompt-generator": p("Thumbnail Prompt Generator", 3, coreVideoFields("Video topic / thumbnail prompt brief"), "Create professional thumbnail design prompts with composition, visual hierarchy, subject, background, text placement, and A/B-ready variations.", "Return Markdown with: thumbnail prompt options, layout notes, overlay text options, visual hierarchy, title pairing, and avoid notes."),
  "youtube-script-writer": p("YouTube Script Writer", 4, scriptFields("YouTube script brief"), "Write a full YouTube script with hook, intro, body structure, retention beats, transitions, CTA, and production notes.", "Return Markdown with: full script, timing/section table, spoken lines, B-roll/scene ideas, on-screen text, retention notes, CTA, and verification notes."),
  "youtube-shorts-script": p("YouTube Shorts Script", 3, scriptFields("Shorts / Reels script brief"), "Write short-form YouTube Shorts/Reels scripts with tight hook, scene beats, captions, on-screen text, and fast CTA.", "Return Markdown with: 3 script options unless user asks otherwise, scene-by-scene table, spoken lines, caption text, retention notes, and CTA."),
  "documentary-script-writer": p("Documentary Script Writer", 5, scriptFields("Documentary script brief"), "Write documentary-style scripts with narrative arc, scene logic, voiceover, research placeholders, evidence boundaries, and ethical verification notes.", "Return Markdown with: documentary outline, full opening, act structure, voiceover script, scene/B-roll notes, interview/source placeholders, verification checklist, and CTA/end card."),
  "retention-planner": p("Retention Planner", 4, scriptFields("Video / retention brief"), "Plan retention structure for a YouTube video with payoff timing, open loops, pattern interrupts, segment hooks, and drop-off prevention.", "Return Markdown with: retention strategy, timeline table, hook/payoff map, pattern interrupts, section risks, rewrite notes, and CTA timing."),
  "thumbnail-ab-ideas": p("Thumbnail A/B Ideas", 3, [
    { id: "video_topic", label: "Video topic / title", required: true, minLength: 10, maxLength: 10000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "test_goal", label: "Test goal", required: true, minLength: 2, maxLength: 160 },
    { id: "concept_count", label: "A/B concept count", required: true, minLength: 2, maxLength: 80 },
    { id: "brand_style", label: "Brand / visual style", required: false, maxLength: 1000 },
    avoidField,
    languageField,
  ], "Generate A/B thumbnail concepts with clear angle differences, overlay text, title pairings, and test rationale.", "Return Markdown with: A/B pairs table, concept rationale, overlay text, title pairing, what each version tests, and risk notes."),
  "competitor-video-analyzer": p("Competitor Video Analyzer", 4, [
    { id: "competitor_notes", label: "Competitor video notes", required: true, minLength: 20, maxLength: 22000 },
    { id: "your_channel_context", label: "Your channel / brand context", required: true, minLength: 20, maxLength: 12000 },
    { id: "analysis_goal", label: "Analysis goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Analyze pasted competitor notes to find hooks, patterns, gaps, differentiation angles, packaging ideas, and video opportunities. Do not copy competitor phrasing.", "Return Markdown with: competitor pattern summary, gap table, angle opportunities, better hook/title/thumbnail ideas, differentiation plan, and verification caveat."),
  "voiceover-script-optimizer": p("Voiceover Script Optimizer", 3, [
    { id: "voiceover_script", label: "Voiceover script", required: true, minLength: 20, maxLength: 18000 },
    { id: "video_context", label: "Video context", required: true, minLength: 10, maxLength: 10000 },
    { id: "optimization_goal", label: "Optimization goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    avoidField,
    languageField,
  ], "Optimize a pasted voiceover script for pacing, clarity, rhythm, retention, natural delivery, and CTA flow while preserving factual boundaries.", "Return Markdown with: optimized script, before/after improvement notes, pacing notes, delivery cues, cuts to consider, and verification notes."),
  "youtube-audience-analysis": p("YouTube Audience Analysis", 4, [
    { id: "channel_context", label: "Channel / niche context", required: true, minLength: 20, maxLength: 12000 },
    { id: "viewer_evidence", label: "Viewer evidence / notes", required: true, minLength: 20, maxLength: 22000 },
    { id: "analysis_goal", label: "Analysis goal", required: true, minLength: 2, maxLength: 160 },
    { id: "content_type", label: "Content type", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Analyze supplied channel context and viewer evidence to define audience segments, viewer pains, content preferences, retention needs, and video strategy.", "Return Markdown with: audience segment table, viewer pain/desire map, content strategy, packaging angles, retention implications, next 10 video ideas, and measurement caveat."),
};
