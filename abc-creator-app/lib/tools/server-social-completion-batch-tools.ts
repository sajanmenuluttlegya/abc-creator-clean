type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium social media rules:
- Use only the user's supplied brief, brand context, audience, platform, goal, tone, must-include, and avoid fields as the source of truth.
- Do not invent brand facts, product claims, statistics, discounts, deadlines, customer quotes, private user details, analytics, trend data, follower data, or platform performance claims.
- Make every output premium, professional, platform-native, specific, human, clear, and ready to copy.
- Build safe shareability through stronger hooks, clarity, contrast, audience pain points, useful value, and clear CTAs without clickbait, fake urgency, or spam.
- For replies, be respectful, useful, concise, and brand-safe.
- For scripts, include hook, scene beats, spoken lines, captions, CTA, and retention notes where useful.
- Use clean Markdown with clear headings and tables where useful.
- For every calendar-style output, include the main calendar as a Markdown pipe table with a separator row so it renders as a real table in the output panel and PDF export.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 3000 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 4000 };

function postFields(label: string): ToolFieldRule[] {
  return [
    { id: "post_brief", label, required: true, minLength: 10, maxLength: 12000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
    mustField,
    avoidField,
    languageField,
  ];
}

function replyFields(platform: string): ToolFieldRule[] {
  return [
    { id: "original_message", label: `${platform} message`, required: true, minLength: 2, maxLength: 10000 },
    { id: "brand_context", label: "Brand context", required: true, minLength: 10, maxLength: 10000 },
    { id: "reply_goal", label: "Reply goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
    mustField,
    avoidField,
    languageField,
  ];
}

function scriptFields(label: string): ToolFieldRule[] {
  return [
    { id: "video_brief", label, required: true, minLength: 10, maxLength: 12000 },
    { id: "script_length", label: "Script length", required: true, minLength: 2, maxLength: 80 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
    mustField,
    avoidField,
    languageField,
  ];
}

export const serverSocialCompletionBatchTools: Record<string, ServerPrompt> = {
  "social-media-calendar": p("Social Media Calendar", 4, [
    { id: "brand_context", label: "Brand context", required: true, minLength: 20, maxLength: 14000 },
    { id: "platforms", label: "Platforms", required: true, minLength: 2, maxLength: 160 },
    { id: "calendar_length", label: "Calendar length", required: true, minLength: 2, maxLength: 80 },
    { id: "posting_frequency", label: "Posting frequency", required: true, minLength: 2, maxLength: 120 },
    { id: "goal", label: "Main goal", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Create a platform-ready social media calendar with content pillars, dates, formats, hooks, captions, CTAs, and production notes.", "Return Markdown with: strategy, a premium Markdown pipe-table calendar using columns such as Date/Week, Platform, Content Format, Hook, Caption/Angle, CTA, Pillar, and Production Notes, then content mix, hook bank, CTA plan, and execution notes."),
  "replies-for-facebook": p("Replies for Facebook", 2, replyFields("Facebook"), "Write polished Facebook replies for supplied context.", "Return recommended reply, alternate replies, tone notes, and verification notes."),
  "replies-for-twitter-x": p("Replies for Twitter/X", 2, replyFields("Twitter/X"), "Write concise Twitter/X replies that are useful, natural, and brand-safe.", "Return reply options, shortest version, warm version, and notes."),
  "replies-for-linkedin": p("Replies for LinkedIn", 2, replyFields("LinkedIn"), "Write professional LinkedIn replies for supplied context.", "Return recommended reply, professional alternatives, follow-up prompt, and notes."),
  "replies-for-instagram": p("Replies for Instagram", 2, replyFields("Instagram"), "Generate friendly Instagram replies for supplied context.", "Return reply options, short option, CTA option, and notes."),
  "instagram-threads-generator": p("Instagram Threads Generator", 5, postFields("Instagram Threads brief"), "Create Threads-style post sequences with hooks, short posts, replies, and engagement prompts.", "Return opening hook, post sequence, reply prompts, CTA, and rewrite notes."),
  "tiktok-caption-generator": p("TikTok Caption Generator", 3, postFields("TikTok caption brief"), "Write TikTok captions with hook, context, CTA, and hashtag ideas.", "Return caption options, hashtag ideas, best pick, and avoid notes."),
  "motivational-posts-generator": p("Motivational Posts Generator", 3, postFields("Motivational post brief"), "Create premium motivational social posts that feel specific, human, and shareable.", "Return post options, short captions, quote-style versions, and engagement prompts."),
  "social-hook-generator": p("Social Hook Generator", 3, [
    { id: "topic", label: "Topic / offer", required: true, minLength: 5, maxLength: 10000 },
    { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 160 },
    { id: "hook_count", label: "Hook count", required: true, minLength: 2, maxLength: 80 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    avoidField,
    languageField,
  ], "Generate platform-native hooks for posts, reels, carousels, short videos, ads, and threads.", "Return a hook table with angle, use case, risk note, and best picks."),
  "twitter-x-post-generator": p("Twitter/X Post Generator", 3, postFields("Twitter/X post brief"), "Write concise Twitter/X posts with hooks, clarity, engagement prompts, and variations.", "Return post options, best pick, alternate angles, and CTA notes."),
  "instagram-reel-script": p("Instagram Reel Script", 3, scriptFields("Instagram Reel brief"), "Create Instagram Reel scripts with hook, scene beats, spoken lines, captions, CTA, and retention flow.", "Return script options, scene table, on-screen text, caption, CTA, and notes."),
  "tiktok-video-script-generator": p("TikTok Video Script Generator", 3, scriptFields("TikTok video brief"), "Write TikTok scripts with hooks, scene beats, spoken lines, captions, CTA, and retention flow.", "Return script options, scene beats, caption, CTA, and notes."),
  "linkedin-post-generator": p("LinkedIn Post Generator", 3, postFields("LinkedIn post brief"), "Write professional LinkedIn posts for authority, storytelling, education, launches, and lead generation.", "Return post options, strongest version, hook alternatives, and CTA notes."),
  "twitter-x-thread-generator": p("Twitter/X Thread Generator", 5, [
    { id: "thread_brief", label: "Thread brief", required: true, minLength: 10, maxLength: 14000 },
    { id: "thread_length", label: "Thread length", required: true, minLength: 2, maxLength: 80 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 },
    { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Build Twitter/X threads with a strong opener, logical flow, value points, CTA, and engagement prompt.", "Return full thread, hook alternatives, CTA options, and editing notes."),
  "facebook-post-generator": p("Facebook Post Generator", 3, postFields("Facebook post brief"), "Write Facebook posts for engagement, community, offers, launches, stories, and updates.", "Return post options, community-first version, CTA version, and engagement question."),
  "content-calendar-generator": p("Content Calendar Generator", 4, [
    { id: "content_context", label: "Content context", required: true, minLength: 20, maxLength: 14000 },
    { id: "channels", label: "Channels", required: true, minLength: 2, maxLength: 160 },
    { id: "calendar_length", label: "Calendar length", required: true, minLength: 2, maxLength: 80 },
    { id: "goal", label: "Main goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Plan a premium cross-channel content calendar with themes, formats, hooks, CTAs, production notes, and repurposing ideas.", "Return Markdown with: strategy, a premium Markdown pipe-table calendar using columns such as Date/Week, Channel, Format, Topic, Hook, CTA, Funnel Stage, Repurpose Path, and Production Notes, then channel mix, repurposing plan, and production notes."),
  "carousel-post-generator": p("Carousel Post Generator", 5, [
    { id: "carousel_brief", label: "Carousel brief", required: true, minLength: 10, maxLength: 12000 },
    { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 160 },
    { id: "slide_count", label: "Slide count", required: true, minLength: 2, maxLength: 80 },
    { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Create carousel posts with slide-by-slide copy, narrative structure, hook, CTA, and design notes.", "Return slide-by-slide table, caption, CTA, design notes, and repurpose ideas."),
};
