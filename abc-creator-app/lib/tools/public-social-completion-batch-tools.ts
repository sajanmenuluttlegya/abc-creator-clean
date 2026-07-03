type SocialInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type SocialTool = {
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
  inputs: SocialInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["General audience", "New followers", "Existing followers", "Customers", "B2B audience", "Creators", "Local audience", "Premium buyers", "Community members"];
const toneOptions = ["Professional", "Premium", "Friendly", "Conversational", "Witty", "Bold", "Inspirational", "Educational", "Short and punchy", "Warm and respectful"];
const goalOptions = ["Engagement", "Awareness", "Lead generation", "Sales", "Community building", "Education", "Brand authority", "Launch", "Traffic", "Retention"];
const platformOptions = ["Instagram", "Facebook", "LinkedIn", "Twitter/X", "TikTok", "Threads", "Multi-platform"];
const countOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const calendarLengthOptions = ["7 days", "14 days", "30 days", "60 days"];
const scriptLengthOptions = ["15 seconds", "30 seconds", "60 seconds", "90 seconds", "2 minutes"];

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: SocialInput[], aliases: string[] = []): SocialTool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: "social-media",
    detailEmoji: emoji,
    category: "Social Media Tools",
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, ...aliases],
    inputs,
  };
}

function postInputs(platform: string): SocialInput[] {
  return [
    { id: "post_brief", label: `${platform} Post Brief`, type: "textarea", placeholder: "Describe the topic, offer, brand, audience, key message, product facts, CTA, and exact details to include.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "goal", label: "Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Versions?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: hashtags, CTA, product facts, hook angle, keywords, link note, or brand line.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: claims, words, hype, emojis, platform limits, competitor mentions, or sensitive topics to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function replyInputs(platform: string): SocialInput[] {
  return [
    { id: "original_message", label: `Original ${platform} Comment / Message`, type: "textarea", placeholder: "Paste the comment, DM, mention, review, or reply context.", required: true },
    { id: "brand_context", label: "Brand / Account Context", type: "textarea", placeholder: "Describe your brand voice, offer, account type, audience, boundaries, and exact facts. No platform data is fetched.", required: true },
    { id: "reply_goal", label: "Reply Goal", type: "select", required: true, options: ["Answer helpfully", "De-escalate politely", "Drive to DM", "Drive to link/CTA", "Thank the user", "Handle objection", "Community engagement"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Replies?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: answer, policy, CTA, link note, apology, next step, or exact wording.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: admitting fault, legal advice, private data, arguments, sarcasm, unsupported promises, or banned words.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function scriptInputs(platform: string): SocialInput[] {
  return [
    { id: "video_brief", label: `${platform} Video Brief`, type: "textarea", placeholder: "Describe the video idea, audience, offer, product facts, desired scenes, CTA, and exact details to include.", required: true },
    { id: "script_length", label: "Script Length", type: "select", required: true, options: scriptLengthOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "goal", label: "Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Scripts?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: hook, CTA, scene, product facts, words, transitions, captions, or brand line.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: fake claims, risky trends, competitor mentions, words, or platform limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

export const socialCompletionBatchTools: SocialTool[] = [
  tool("social-media-calendar", "Social Media Calendar", "Create a platform-ready social posting calendar with themes, hooks, captions, CTAs, and content mix.", "📅", 4, [
    { id: "brand_context", label: "Brand / Account Context", type: "textarea", placeholder: "Describe the brand, niche, audience, products, offers, platforms, content pillars, and goals.", required: true },
    { id: "platforms", label: "Platforms", type: "select", required: true, options: platformOptions },
    { id: "calendar_length", label: "Calendar Length", type: "select", required: true, options: calendarLengthOptions },
    { id: "posting_frequency", label: "Posting Frequency", type: "select", required: true, options: ["Daily", "5 posts/week", "3 posts/week", "2 posts/week", "Custom in brief"] },
    { id: "goal", label: "Main Goal", type: "select", required: true, options: goalOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: events, launches, dates, offers, hashtags, product themes, or content pillars.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: topics, claims, tones, platforms, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["social-calendar-generator", "social-content-calendar"]),
  tool("replies-for-facebook", "Replies for Facebook", "Write polished Facebook replies for comments, DMs, objections, praise, complaints, and community engagement.", "💬", 2, replyInputs("Facebook"), ["facebook-reply-generator", "facebook-comment-replies"]),
  tool("replies-for-twitter-x", "Replies for Twitter/X", "Create concise, brand-safe Twitter/X replies that are useful, natural, and engagement-ready.", "𝕏", 2, replyInputs("Twitter/X"), ["twitter-reply-generator", "x-reply-generator", "replies-for-twitter"]),
  tool("replies-for-linkedin", "Replies for LinkedIn", "Write professional LinkedIn replies for comments, prospects, thought leadership, and B2B conversations.", "💼", 2, replyInputs("LinkedIn"), ["linkedin-reply-generator", "linkedin-comment-replies"]),
  tool("replies-for-instagram", "Replies for Instagram", "Generate friendly Instagram replies for comments, DMs, story replies, objections, and community engagement.", "📸", 2, replyInputs("Instagram"), ["instagram-reply-generator", "instagram-comment-replies"]),
  tool("instagram-threads-generator", "Instagram Threads Generator", "Create Threads-style post sequences with hooks, short posts, replies, and engagement prompts.", "🧵", 5, postInputs("Instagram Threads"), ["threads-generator", "threads-post-generator"]),
  tool("tiktok-caption-generator", "TikTok Caption Generator", "Write scroll-stopping TikTok captions with hooks, context, CTA, and hashtag ideas.", "🎵", 3, postInputs("TikTok Caption"), ["tiktok-caption", "tiktok-captions-generator"]),
  tool("motivational-posts-generator", "Motivational Posts Generator", "Create premium motivational social posts that feel human, specific, and shareable without generic filler.", "🔥", 3, postInputs("Motivational Social"), ["motivational-post-generator", "inspirational-post-generator"]),
  tool("social-hook-generator", "Social Hook Generator", "Generate short-form hooks for posts, reels, carousels, videos, ads, and threads with safe virality angles.", "🪝", 3, [
    { id: "topic", label: "Topic / Offer", type: "textarea", placeholder: "Describe the topic, product, angle, audience, pain point, transformation, or content idea.", required: true },
    { id: "platform", label: "Platform", type: "select", required: true, options: platformOptions },
    { id: "hook_count", label: "How Many Hooks?", type: "select", required: true, options: ["10 hooks", "20 hooks", "30 hooks", "50 hooks"] },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait, fake urgency, claims, cringe, banned words, or competitor mentions.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["hook-generator", "social-media-hook-generator", "viral-hook-generator"]),
  tool("twitter-x-post-generator", "Twitter/X Post Generator", "Write concise Twitter/X posts with strong hooks, clarity, engagement prompts, and thread-ready variants.", "𝕏", 3, postInputs("Twitter/X"), ["twitter-post-generator", "x-post-generator", "twitter-x-post"]),
  tool("instagram-reel-script", "Instagram Reel Script", "Create Instagram Reel scripts with hook, scenes, captions, on-screen text, CTA, and retention beats.", "🎬", 3, scriptInputs("Instagram Reel"), ["instagram-reels-script", "reel-script-generator"]),
  tool("tiktok-video-script-generator", "TikTok Video Script Generator", "Write TikTok video scripts with thumb-stopping hooks, scene beats, captions, CTA, and retention flow.", "🎥", 3, scriptInputs("TikTok"), ["tiktok-script-generator", "tiktok-video-script", "tiktok-script"]),
  tool("linkedin-post-generator", "LinkedIn Post Generator", "Write professional LinkedIn posts for authority, storytelling, education, launches, and lead generation.", "💼", 3, postInputs("LinkedIn"), ["linkedin-post", "linkedin-content-generator"]),
  tool("twitter-x-thread-generator", "Twitter/X Thread Generator", "Build Twitter/X threads with a strong opener, logical flow, value points, CTA, and engagement prompt.", "🧵", 5, [
    { id: "thread_brief", label: "Thread Brief", type: "textarea", placeholder: "Describe the topic, audience, main argument, proof, examples, CTA, and key points.", required: true },
    { id: "thread_length", label: "Thread Length", type: "select", required: true, options: ["5 posts", "7 posts", "10 posts", "15 posts"] },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "goal", label: "Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: examples, data supplied by user, CTA, product facts, or brand line.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: claims, hype, sarcasm, banned words, or competitor mentions.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["twitter-thread-generator", "x-thread-generator"]),
  tool("facebook-post-generator", "Facebook Post Generator", "Write Facebook posts for engagement, community, offers, launches, stories, and local/business updates.", "📘", 3, postInputs("Facebook"), ["facebook-post", "facebook-content-generator"]),
  tool("content-calendar-generator", "Content Calendar Generator", "Plan a premium content calendar across channels with themes, formats, hooks, and production notes.", "🗓️", 4, [
    { id: "content_context", label: "Content Context", type: "textarea", placeholder: "Describe the brand, audience, goals, channels, content pillars, campaigns, products, and available resources.", required: true },
    { id: "channels", label: "Channels", type: "select", required: true, options: ["Social only", "Blog + social", "Email + social", "YouTube + social", "Full content system"] },
    { id: "calendar_length", label: "Calendar Length", type: "select", required: true, options: calendarLengthOptions },
    { id: "goal", label: "Main Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: dates, offers, launches, events, content pillars, platforms, or campaign themes.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: topics, formats, claims, platforms, or words to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["content-calendar", "marketing-content-calendar"]),
  tool("carousel-post-generator", "Carousel Post Generator", "Create carousel posts with slide-by-slide copy, hook, structure, CTA, and design notes.", "🎠", 5, [
    { id: "carousel_brief", label: "Carousel Brief", type: "textarea", placeholder: "Describe the topic, audience, platform, product, key points, CTA, and exact facts.", required: true },
    { id: "platform", label: "Platform", type: "select", required: true, options: ["Instagram", "LinkedIn", "Facebook", "Multi-platform"] },
    { id: "slide_count", label: "Slide Count", type: "select", required: true, options: ["5 slides", "7 slides", "10 slides", "12 slides"] },
    { id: "goal", label: "Goal", type: "select", required: true, options: goalOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: slide points, CTA, examples, brand lines, keywords, or design notes.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: claims, topics, words, visual directions, or competitor mentions to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["carousel-generator", "instagram-carousel-generator", "linkedin-carousel-generator"]),
];
