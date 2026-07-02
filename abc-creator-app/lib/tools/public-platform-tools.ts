type PublicPlatformToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicPlatformTool = {
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
  inputs: PublicPlatformToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["General audience", "Potential customers", "Existing followers", "Creators / influencers", "Small business owners", "Students", "Professionals", "Local community"];
const socialPlatformOptions = ["Instagram", "TikTok", "X / Twitter", "LinkedIn", "Facebook", "Pinterest", "YouTube Community", "Multi-platform"];
const toneOptions = ["Premium and polished", "Friendly and conversational", "Bold and punchy", "Educational", "Luxury", "Playful", "Professional", "Minimal"];
const hashtagCountOptions = ["15 hashtags", "30 hashtags", "50 hashtags"];
const hashtagIntentOptions = ["Balanced reach", "Niche-focused", "Community-focused", "Local discovery", "Product/service discovery", "Creator growth"];
const postCountOptions = ["3 posts", "5 posts", "10 posts"];
const postGoalOptions = ["Engagement", "Sales / leads", "Brand awareness", "Education", "Storytelling", "Product launch", "Community building"];
const videoIdeaCountOptions = ["10 ideas", "20 ideas", "30 ideas"];
const youtubeContentTypeOptions = ["Educational", "Entertainment", "Review", "Tutorial", "Listicle", "Storytelling", "Shorts", "Podcast / commentary"];
const titleCountOptions = ["10 titles", "20 titles", "30 titles"];
const thumbnailCountOptions = ["5 thumbnail ideas", "10 thumbnail ideas", "20 thumbnail ideas"];

export const platformTools: PublicPlatformTool[] = [
  {
    id: "instagram-hashtag-generator",
    slug: "instagram-hashtag-generator",
    name: "Instagram Hashtag Generator",
    description: "Create relevant Instagram hashtag sets by niche, audience, intent, and post topic.",
    icon: "instagram",
    detailEmoji: "#️⃣",
    category: "Social Media Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["hashtag-generator", "instagram-hashtags", "ai-hashtag-generator", "hashtag-ideas"],
    nextActions: [
      { label: "Generate Instagram captions", href: "/tools/image-to-instagram-caption", description: "Use the hashtags with polished caption options." },
      { label: "Write social posts", href: "/tools/social-media-post-generator", description: "Create full post copy for the same campaign." },
    ],
    inputs: [
      { id: "post_topic", label: "Post Topic / Content", type: "textarea", placeholder: "Describe the post, product, reel, carousel, or campaign.", required: true },
      { id: "niche", label: "Niche", type: "text", placeholder: "e.g., fitness coaching, skincare, cafe, travel creator", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "hashtag_goal", label: "Hashtag Goal", type: "select", required: true, options: hashtagIntentOptions },
      { id: "hashtag_count", label: "How Many Hashtags?", type: "select", required: true, options: hashtagCountOptions },
      { id: "location", label: "Location", type: "text", placeholder: "Optional: city, country, or local area", required: false },
      { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional: banned hashtags, competitors, unrelated topics, or sensitive claims", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "social-media-post-generator",
    slug: "social-media-post-generator",
    name: "Social Media Post Generator",
    description: "Generate ready-to-post social media copy for Instagram, TikTok, X, LinkedIn, Facebook, Pinterest, and more.",
    icon: "writing-pad",
    detailEmoji: "📣",
    category: "Social Media Tools",
    displayCreditCost: 3,
    outputType: "text",
    aliases: ["social-post-generator", "social-media-copy-generator", "ai-social-post-generator", "post-generator"],
    nextActions: [
      { label: "Generate hashtags", href: "/tools/instagram-hashtag-generator", description: "Add targeted hashtags for the same post topic." },
      { label: "Create social bios", href: "/tools/social-media-bio-generator", description: "Match post direction to your profile positioning." },
    ],
    inputs: [
      { id: "platform", label: "Platform", type: "select", required: true, options: socialPlatformOptions },
      { id: "post_topic", label: "Post Topic / Offer", type: "textarea", placeholder: "What should the post be about? Include product, campaign, message, or idea.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Post Goal", type: "select", required: true, options: postGoalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "post_count", label: "How Many Posts?", type: "select", required: true, options: postCountOptions },
      { id: "cta", label: "CTA", type: "text", placeholder: "Optional: comment, DM, buy, save, share, book, subscribe", required: false },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: offer details, keywords, benefits, product facts, dates, or hooks", required: false },
      { id: "avoid", label: "Avoid / Claims to Avoid", type: "textarea", placeholder: "Optional: banned words, unsupported claims, competitors, tone limits", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "youtube-video-idea-generator",
    slug: "youtube-video-idea-generator",
    name: "YouTube Video Idea Generator",
    description: "Generate YouTube video ideas with angles, hooks, audience fit, and content formats.",
    icon: "youtube",
    detailEmoji: "▶️",
    category: "YouTube Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["youtube-ideas", "youtube-video-ideas", "video-idea-generator", "youtube-content-ideas"],
    nextActions: [
      { label: "Generate YouTube titles", href: "/tools/youtube-title-generator", description: "Turn the strongest video ideas into clickable titles." },
      { label: "Generate thumbnail ideas", href: "/tools/youtube-thumbnail-idea-generator", description: "Plan visual concepts for the best ideas." },
    ],
    inputs: [
      { id: "channel_topic", label: "Channel / Niche Topic", type: "text", placeholder: "e.g., AI tools, fitness for beginners, finance, gaming", required: true },
      { id: "audience", label: "Audience", type: "text", placeholder: "Who watches this channel?", required: true },
      { id: "content_type", label: "Content Type", type: "select", required: true, options: youtubeContentTypeOptions },
      { id: "idea_count", label: "How Many Ideas?", type: "select", required: true, options: videoIdeaCountOptions },
      { id: "goal", label: "Video Goal", type: "select", required: true, options: ["Views", "Subscribers", "Leads / sales", "Education", "Authority building", "Community engagement"] },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: topics, products, keywords, formats, examples, or series ideas", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: topics, claims, formats, or competitors to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "youtube-title-generator",
    slug: "youtube-title-generator",
    name: "YouTube Title Generator",
    description: "Create clickable YouTube titles with clear angles, curiosity, and audience intent.",
    icon: "youtube",
    detailEmoji: "🎬",
    category: "YouTube Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["youtube-titles", "youtube-video-title-generator", "video-title-generator", "youtube-headline-generator"],
    nextActions: [
      { label: "Generate video ideas", href: "/tools/youtube-video-idea-generator", description: "Create more video concepts around the strongest title angle." },
      { label: "Generate thumbnail ideas", href: "/tools/youtube-thumbnail-idea-generator", description: "Pair titles with thumbnail concepts." },
    ],
    inputs: [
      { id: "video_topic", label: "Video Topic", type: "textarea", placeholder: "Describe the video, keyword, idea, or promise.", required: true },
      { id: "audience", label: "Audience", type: "text", placeholder: "Who is the video for?", required: true },
      { id: "title_style", label: "Title Style", type: "select", required: true, options: ["Clear and searchable", "Curiosity-driven", "Beginner-friendly", "Bold and punchy", "How-to", "Listicle", "Comparison", "Mixed styles"] },
      { id: "title_count", label: "How Many Titles?", type: "select", required: true, options: titleCountOptions },
      { id: "keywords", label: "Keywords to Include", type: "text", placeholder: "Optional: target keyword, product, phrase, or niche term", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait style, claims, words, competitors, or sensitive angles", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "youtube-thumbnail-idea-generator",
    slug: "youtube-thumbnail-idea-generator",
    name: "YouTube Thumbnail Idea Generator",
    description: "Generate text-only thumbnail concepts with layout notes, visual hierarchy, and optional short overlay text.",
    icon: "youtube",
    detailEmoji: "🖼️",
    category: "YouTube Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["youtube-thumbnail-ideas", "thumbnail-idea-generator", "youtube-thumbnail-generator", "video-thumbnail-ideas"],
    nextActions: [
      { label: "Generate YouTube titles", href: "/tools/youtube-title-generator", description: "Create title options that match the best thumbnail concept." },
    ],
    inputs: [
      { id: "video_topic", label: "Video Topic / Title", type: "textarea", placeholder: "Describe the video or paste a title you want thumbnail ideas for.", required: true },
      { id: "audience", label: "Audience", type: "text", placeholder: "Who should click this video?", required: true },
      { id: "thumbnail_style", label: "Thumbnail Style", type: "select", required: true, options: ["Clean professional", "Bold creator style", "Educational", "Dramatic contrast", "Minimal", "Comparison layout", "Tutorial style", "Mixed styles"] },
      { id: "idea_count", label: "How Many Thumbnail Ideas?", type: "select", required: true, options: thumbnailCountOptions },
      { id: "brand_style", label: "Brand / Visual Style", type: "text", placeholder: "Optional: colors, mood, channel style, face/no-face preference", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: text overload, misleading visuals, faces, colors, or claims to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
];
