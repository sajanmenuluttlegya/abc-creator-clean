import { generalTools } from "./public-general-tools";
import { platformTools } from "./public-platform-tools";
import { campaignTools } from "./public-campaign-tools";

type PublicSocialToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicSocialTool = {
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
  nextActions?: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  inputs: PublicSocialToolInput[];
};

const sourceModeOptions = ["Analyze uploaded image", "Write from text/context only"];

const audienceOptions = [
  "General audience",
  "Potential customers",
  "Existing customers",
  "Creators / influencers",
  "Small business owners",
  "Local community",
  "Students",
  "Professionals",
];

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];

const instagramToneOptions = [
  "Premium and polished",
  "Friendly and conversational",
  "Luxury brand voice",
  "Playful and witty",
  "Educational and helpful",
  "Founder / personal brand voice",
  "Bold sales-focused",
  "Minimal and aesthetic",
];

const instagramGoalOptions = [
  "Engagement / comments",
  "Sales / conversions",
  "Brand awareness",
  "Product launch",
  "Storytelling",
  "Community building",
  "Profile growth",
  "Event or announcement",
];

const captionLengthOptions = ["Short captions", "Medium captions", "Long storytelling captions", "Mixed lengths"];
const captionCountOptions = ["5 caption variations", "8 caption variations", "12 caption variations"];
const hashtagModeOptions = ["No hashtags", "Light hashtags", "Balanced hashtags", "Hashtag sets by intent"];
const emojiModeOptions = ["No emojis", "Light emojis", "Balanced emojis", "Match the image mood"];

const profileGoalOptions = [
  "Grow followers",
  "Get profile visits",
  "Sell a product or service",
  "Book calls / leads",
  "Build personal brand",
  "Promote local business",
  "Creator portfolio",
  "Community building",
];

const bioStyleOptions = [
  "Clean professional",
  "Premium brand",
  "Creator / personal brand",
  "Sales-focused",
  "Minimal aesthetic",
  "Friendly and approachable",
  "Bold and memorable",
];

const socialPlatformOptions = [
  "Instagram",
  "TikTok",
  "X / Twitter",
  "LinkedIn",
  "Facebook",
  "Pinterest",
  "YouTube",
  "General social bio",
];

const bioLengthOptions = ["Very short", "Short", "Medium", "Platform-max optimized"];

export const socialTools: PublicSocialTool[] = [
  {
    id: "image-to-instagram-caption",
    slug: "image-to-instagram-caption",
    name: "Instagram Caption Generator",
    description: "Generate premium Instagram captions from either an uploaded image or a written text brief.",
    icon: "instagram",
    detailEmoji: "📸",
    category: "Social Media Tools",
    displayCreditCost: 3,
    outputType: "text",
    aliases: [
      "image-to-instagram-caption",
      "instagram-caption-from-image",
      "ai-instagram-caption-from-image",
      "instagram-caption-generator-image",
      "image-caption-for-instagram",
      "instagram-caption-generator",
      "instagram-caption-pro",
    ],
    nextActions: [
      {
        label: "Create an Instagram bio",
        href: "/tools/instagram-page-name-bio-generator",
        description: "Turn the visual style and audience into profile name and bio ideas.",
      },
      {
        label: "Plan a social media calendar",
        href: "/tools/social-media-calendar",
        description: "Use the caption direction to plan upcoming social posts.",
      },
    ],
    inputs: [
      { id: "source_mode", label: "Caption Source", type: "select", required: true, options: sourceModeOptions },
      { id: "image_data", label: "Upload Image", type: "image", placeholder: "Upload an image only when using image-analysis mode", required: false },
      { id: "brand_name", label: "Brand / Page Name", type: "text", placeholder: "e.g., Luna Skincare, Urban Brew, your creator name", required: false },
      { id: "image_context", label: "Image / Text Brief / Product Context", type: "textarea", placeholder: "For image mode: add product, offer, campaign, or what matters in the image. For text mode: describe the post, product, scene, or idea you want captions for.", required: false },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Post Goal", type: "select", required: true, options: instagramGoalOptions },
      { id: "tone", label: "Caption Tone", type: "select", required: true, options: instagramToneOptions },
      { id: "caption_length", label: "Caption Length", type: "select", required: true, options: captionLengthOptions },
      { id: "caption_count", label: "How Many Captions?", type: "select", required: true, options: captionCountOptions },
      { id: "hashtags", label: "Hashtags", type: "select", required: true, options: hashtagModeOptions },
      { id: "emojis", label: "Emojis", type: "select", required: true, options: emojiModeOptions },
      { id: "cta", label: "CTA / Next Step", type: "text", placeholder: "Optional: Shop now, comment YES, DM us, book a call, save this post", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Words / Claims to Avoid", type: "textarea", placeholder: "Optional: banned words, claims you cannot make, competitor names, pricing, guarantees, or compliance notes.", required: false },
    ],
  },
  {
    id: "instagram-page-name-bio-generator",
    slug: "instagram-page-name-bio-generator",
    name: "Instagram Page Name & Bio Generator",
    description: "Create premium Instagram page names, handle ideas, bio options, CTAs, and positioning notes.",
    icon: "instagram",
    detailEmoji: "✨",
    category: "Social Media Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["instagram-bio-generator", "instagram-page-name-generator", "instagram-name-bio", "instagram-profile-bio"],
    nextActions: [
      { label: "Generate Instagram captions", href: "/tools/image-to-instagram-caption", description: "Turn the profile direction into post captions." },
      { label: "Plan a social calendar", href: "/tools/social-media-calendar", description: "Map the profile positioning into weekly content ideas." },
    ],
    inputs: [
      { id: "brand_or_creator_name", label: "Brand / Creator Name", type: "text", placeholder: "e.g., Luna Skincare, Arjun Fitness, Urban Brew", required: true },
      { id: "niche", label: "Niche / Industry", type: "text", placeholder: "e.g., skincare for college students, fitness for busy founders", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "profile_goal", label: "Profile Goal", type: "select", required: true, options: profileGoalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: instagramToneOptions },
      { id: "bio_style", label: "Bio Style", type: "select", required: true, options: bioStyleOptions },
      { id: "keywords", label: "Keywords to Include", type: "text", placeholder: "Optional: clean beauty, meal prep, AI automation, wedding photography", required: false },
      { id: "cta", label: "CTA / Link Direction", type: "text", placeholder: "Optional: DM START, shop below, book a call, join newsletter", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Words / Claims to Avoid", type: "textarea", placeholder: "Optional: words, claims, emojis, or positioning you do not want.", required: false },
    ],
  },
  {
    id: "social-media-bio-generator",
    slug: "social-media-bio-generator",
    name: "Social Media Bio Generator",
    description: "Generate polished platform-ready bios for Instagram, TikTok, X, LinkedIn, Facebook, Pinterest, YouTube, and more.",
    icon: "writing-pad",
    detailEmoji: "👤",
    category: "Social Media Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["social-media-bio", "profile-bio-generator", "bio-generator", "creator-bio-generator"],
    nextActions: [
      { label: "Generate Instagram captions", href: "/tools/image-to-instagram-caption", description: "Create post captions after the profile bio is ready." },
    ],
    inputs: [
      { id: "name_or_brand", label: "Name / Brand", type: "text", placeholder: "e.g., Priya Sharma, NorthStar Coaching, Cafe Bloom", required: true },
      { id: "platform", label: "Platform", type: "select", required: true, options: socialPlatformOptions },
      { id: "niche", label: "Niche / Industry", type: "text", placeholder: "e.g., personal finance, SaaS design, handmade jewelry", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "main_offer", label: "Main Offer / Identity", type: "textarea", placeholder: "What do you help people do? What do you sell, teach, create, or represent?", required: true },
      { id: "tone", label: "Tone", type: "select", required: true, options: instagramToneOptions },
      { id: "bio_length", label: "Bio Length", type: "select", required: true, options: bioLengthOptions },
      { id: "cta", label: "CTA", type: "text", placeholder: "Optional: DM me, subscribe, shop, book, download, join", required: false },
      { id: "keywords", label: "Keywords", type: "text", placeholder: "Optional: founder, luxury travel, keto recipes, B2B sales", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "avoid", label: "Words / Claims to Avoid", type: "textarea", placeholder: "Optional: banned words, claims, tone notes, emojis to avoid.", required: false },
    ],
  },
  ...campaignTools,
  ...platformTools,
  ...generalTools,
];
