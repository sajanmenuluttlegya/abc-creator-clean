type YouTubeInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type YouTubeTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType: "text";
  aliases?: string[];
  inputs: YouTubeInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["General viewers", "Beginners", "Advanced viewers", "Busy professionals", "Students", "Creators", "B2B buyers", "Fans/community", "Premium buyers"];
const toneOptions = ["Professional", "Premium", "Energetic", "Educational", "Conversational", "Cinematic", "Funny", "Direct and punchy", "Documentary-style"];
const goalOptions = ["Views", "Retention", "Subscribers", "Leads / sales", "Education", "Authority", "Community", "Watch time", "Product interest"];
const videoTypeOptions = ["Tutorial", "Explainer", "Review", "Comparison", "Listicle", "Storytelling", "Commentary", "Podcast", "Documentary", "Shorts/Reels"];
const lengthOptions = ["30 seconds", "60 seconds", "2 minutes", "5 minutes", "8 minutes", "10 minutes", "15 minutes", "20 minutes"];
const countOptions = ["3 variations", "5 variations", "10 variations"];

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: YouTubeInput[], aliases: string[] = []): YouTubeTool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: "youtube",
    detailEmoji: emoji,
    category: "YouTube Tools",
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, ...aliases],
    inputs,
  };
}

function coreVideoInputs(mainLabel: string): YouTubeInput[] {
  return [
    { id: "video_brief", label: mainLabel, type: "textarea", placeholder: "Describe the video topic, audience, promise, product/context, key points, proof, CTA, and any source notes. No live YouTube data is fetched.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "video_type", label: "Video Type", type: "select", required: true, options: videoTypeOptions },
    { id: "goal", label: "Video Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: keywords, CTA, products, sections, examples, proof, sponsor notes, or exact lines.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait, fake claims, competitor names, unsafe topics, words, overpromising, or style limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function scriptInputs(mainLabel: string): YouTubeInput[] {
  return [
    { id: "script_brief", label: mainLabel, type: "textarea", placeholder: "Describe the video, key points, source facts, structure, examples, CTA, and viewer promise. Paste transcript/source notes if rewriting.", required: true },
    { id: "script_length", label: "Script Length", type: "select", required: true, options: lengthOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "video_type", label: "Video Type", type: "select", required: true, options: videoTypeOptions },
    { id: "goal", label: "Video Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: intro line, CTA, examples, proof, sponsor line, chapter points, or exact wording.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: fake stats, misleading claims, copied competitor phrasing, filler, topics, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

export const youtubeCompletionBatchTools: YouTubeTool[] = [
  tool("youtube-hook-generator", "YouTube Hook Generator", "Generate strong YouTube hooks with 3, 5, or 10 variations for intros, Shorts, Reels, and long-form videos.", "🪝", 2, [
    ...coreVideoInputs("Video Topic / Hook Brief"),
    { id: "hook_count", label: "Hook Variations", type: "select", required: true, options: countOptions },
    { id: "hook_style", label: "Hook Style", type: "select", required: true, options: ["Curiosity", "Problem-first", "Contrarian", "Result-focused", "Story-first", "Beginner-friendly", "Fast and punchy", "Mixed"] },
  ], ["youtube-hooks", "yt-hook-generator", "video-hook-generator", "viral-hook-generator"]),
  tool("youtube-tags-generator", "YouTube Tags Generator", "Create relevant YouTube tags and keyword clusters from supplied topic, audience, and video context without fake search volume.", "🏷️", 2, coreVideoInputs("Video Topic / Tag Context"), ["youtube-tag-generator", "yt-tags-generator", "video-tags-generator"]),
  tool("youtube-description-generator", "YouTube Description Generator", "Write premium YouTube descriptions with first-line hook, summary, chapters placeholder, links/CTA placeholders, and SEO keywords.", "📝", 2, coreVideoInputs("Video Topic / Description Brief"), ["yt-description-generator", "video-description-generator"]),
  tool("youtube-chapters-generator", "YouTube Chapters Generator", "Create chapter/timestamp drafts from pasted transcript, outline, or segment notes with clean labels and viewer-friendly flow.", "⏱️", 3, [
    { id: "transcript_or_outline", label: "Transcript / Outline / Segment Notes", type: "textarea", placeholder: "Paste transcript, outline, rough timestamps, or section notes. If exact timestamps are missing, the tool will use sequence-based placeholder timestamps.", required: true },
    { id: "video_title", label: "Video Title / Topic", type: "text", placeholder: "e.g., How to Build a SaaS Landing Page", required: true },
    { id: "chapter_style", label: "Chapter Style", type: "select", required: true, options: ["Clean and searchable", "Educational", "Retention-focused", "Short labels", "Detailed labels"] },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: exact timestamps, section names, product names, CTA chapter, or sponsor note.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: phrases, sections, claims, or timestamp assumptions to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["chapter-timestamp-generator", "youtube-timestamp-generator", "yt-chapters-generator"]),
  tool("thumbnail-text-generator", "Thumbnail Text Generator", "Generate short, high-contrast YouTube thumbnail text options with title pairing and non-misleading click logic.", "🔤", 2, [
    { id: "video_topic", label: "Video Topic / Title", type: "textarea", placeholder: "Describe the video or paste title ideas.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "thumbnail_goal", label: "Thumbnail Goal", type: "select", required: true, options: ["Curiosity", "Clarity", "Before/after", "Comparison", "Tutorial", "Urgency but safe", "Premium clean"] },
    { id: "text_count", label: "How Many Text Options?", type: "select", required: true, options: countOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait, false claims, all caps, overused words, competitor names, or text length limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["youtube-thumbnail-text", "thumbnail-overlay-text-generator", "yt-thumbnail-text"]),
  tool("thumbnail-prompt-generator", "Thumbnail Prompt Generator", "Create professional thumbnail design prompts with composition, visual hierarchy, background, subject, and text placement notes.", "🖼️", 3, coreVideoInputs("Video Topic / Thumbnail Prompt Brief"), ["youtube-thumbnail-prompt-generator", "thumbnail-image-prompt-generator", "yt-thumbnail-prompt"]),
  tool("youtube-script-writer", "YouTube Script Writer", "Write full YouTube scripts with hook, intro, body, retention beats, transitions, CTA, and production notes.", "🎬", 4, scriptInputs("YouTube Script Brief"), ["script-for-youtube-video", "youtube-script-generator", "youtube-script-creator"]),
  tool("youtube-shorts-script", "YouTube Shorts Script", "Create Shorts/Reels scripts with a fast hook, tight beats, captions, shot notes, and retention-focused CTA.", "⚡", 3, scriptInputs("Shorts / Reels Script Brief"), ["shorts-script-generator", "youtube-shorts-script-generator", "shorts-and-reels-script-creator"]),
  tool("documentary-script-writer", "Documentary Script Writer", "Write documentary-style scripts with narrative arc, scenes, voiceover, research placeholders, and ethical verification notes.", "🎞️", 5, scriptInputs("Documentary Script Brief"), ["documentary-script-creator", "documentary-youtube-script"]),
  tool("retention-planner", "Retention Planner", "Plan YouTube retention structure with pattern interrupts, payoff timing, open loops, segments, and drop-off prevention.", "📈", 4, scriptInputs("Video / Retention Brief"), ["youtube-retention-planner", "video-retention-planner", "retention-plan-generator"]),
  tool("thumbnail-ab-ideas", "Thumbnail A/B Ideas", "Generate A/B thumbnail concepts with angle differences, overlay text, title pairings, and test rationale.", "🧪", 3, [
    { id: "video_topic", label: "Video Topic / Title", type: "textarea", placeholder: "Describe the video, audience, promise, current title/thumbnail idea, and channel style.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "test_goal", label: "Test Goal", type: "select", required: true, options: ["Higher CTR", "Clearer promise", "More curiosity", "Better authority", "Better emotional pull", "Premium cleaner design"] },
    { id: "concept_count", label: "A/B Concept Count", type: "select", required: true, options: ["2 pairs", "3 pairs", "5 pairs"] },
    { id: "brand_style", label: "Brand / Visual Style", type: "text", placeholder: "Optional: colors, face/no-face, minimal, bold, educational, creator style.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: misleading visuals, fake results, competitor names, clutter, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["youtube-thumbnail-ab-ideas", "thumbnail-a-b-ideas", "thumbnail-test-ideas"]),
  tool("competitor-video-analyzer", "Competitor Video Analyzer", "Analyze pasted competitor video notes, titles, descriptions, transcripts, or comments to find angles, gaps, hooks, and differentiation.", "🔍", 4, [
    { id: "competitor_notes", label: "Competitor Video Notes", type: "textarea", placeholder: "Paste competitor video titles, descriptions, transcripts, hooks, comments, thumbnails described in text, or manual observations. No live YouTube scraping is performed.", required: true },
    { id: "your_channel_context", label: "Your Channel / Brand Context", type: "textarea", placeholder: "Describe your channel, audience, positioning, offer, strengths, and content goals.", required: true },
    { id: "analysis_goal", label: "Analysis Goal", type: "select", required: true, options: ["Find content gaps", "Improve hooks", "Differentiate from competitors", "Plan better videos", "Improve packaging", "Find audience questions"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: target keywords, competitors, formats, product angles, or questions to answer.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: copying, risky claims, competitor attacks, topics, or style limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["youtube-competitor-analyzer", "competitor-youtube-video-analyzer", "video-competitor-analyzer"]),
  tool("voiceover-script-optimizer", "Voiceover Script Optimizer", "Improve pasted voiceover scripts for pacing, clarity, rhythm, retention, natural delivery, and CTA flow.", "🎙️", 3, [
    { id: "voiceover_script", label: "Voiceover Script", type: "textarea", placeholder: "Paste the script you want optimized.", required: true },
    { id: "video_context", label: "Video Context", type: "textarea", placeholder: "Describe the video goal, audience, visuals, product, scene timing, CTA, and delivery style.", required: true },
    { id: "optimization_goal", label: "Optimization Goal", type: "select", required: true, options: ["Clarity", "Retention", "More natural", "Shorter and punchier", "More premium", "Better CTA", "Better pacing"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: claims, phrases, filler, robotic style, overhype, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["voiceover-optimizer", "youtube-voiceover-script-optimizer", "script-voiceover-optimizer"]),
  tool("youtube-audience-analysis", "YouTube Audience Analysis", "Analyze pasted channel, viewer, comment, analytics, transcript, or competitor notes to define audience segments and content strategy.", "👥", 4, [
    { id: "channel_context", label: "Channel / Niche Context", type: "textarea", placeholder: "Describe the channel, niche, current videos, positioning, products, and audience assumptions.", required: true },
    { id: "viewer_evidence", label: "Viewer Evidence / Notes", type: "textarea", placeholder: "Paste comments, analytics notes, audience surveys, video titles, retention notes, competitor observations, or transcript insights. No live YouTube data is fetched.", required: true },
    { id: "analysis_goal", label: "Analysis Goal", type: "select", required: true, options: ["Audience personas", "Content strategy", "Retention improvement", "Subscriber growth", "Product/channel fit", "Comment insight mining"] },
    { id: "content_type", label: "Content Type", type: "select", required: true, options: videoTypeOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: target persona, products, offers, geography, competitor channels, or assumptions to test.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: unsupported demographic claims, stereotypes, privacy-sensitive inferences, or topics to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["youtube-audience-analyzer", "yt-audience-analysis", "channel-audience-analysis"]),
];
