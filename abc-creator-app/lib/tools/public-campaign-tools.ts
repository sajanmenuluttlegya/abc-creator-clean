type PublicCampaignToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicCampaignTool = {
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
  inputs: PublicCampaignToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["Cold audience", "Warm audience", "Existing customers", "B2B buyers", "Small business owners", "Local customers", "Creators", "Students"];
const toneOptions = ["Professional", "Premium", "Friendly", "Bold", "Conversational", "Simple and clear", "Luxury", "Playful"];
const goalOptions = ["Leads", "Sales", "Website traffic", "Awareness", "Bookings", "Signups", "Product launch"];
const countOptions = ["3 variations", "5 variations", "10 variations"];
const hookCountOptions = ["10 hooks", "20 hooks", "30 hooks", "50 hooks"];

export const campaignTools: PublicCampaignTool[] = [
  {
    id: "google-ads-pro",
    slug: "google-ads-pro",
    name: "Google Ads Pro",
    description: "Generate Google ad copy with headlines, descriptions, keywords, and extension ideas.",
    icon: "ads",
    detailEmoji: "🔍",
    category: "Ad Copy",
    displayCreditCost: 4,
    outputType: "text",
    aliases: ["google-ads", "google-ad-copy", "google-ad-copy-generator", "google-search-ads"],
    nextActions: [{ label: "Create ad hooks", href: "/tools/ad-hook-creator", description: "Generate more hook angles for the same offer." }],
    inputs: [
      { id: "product", label: "Product / Service", type: "text", placeholder: "What are you promoting?", required: true },
      { id: "brief", label: "Campaign Brief", type: "textarea", placeholder: "Describe the offer, audience, benefits, differentiators, and CTA.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Campaign Goal", type: "select", required: true, options: goalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "keywords", label: "Keywords", type: "textarea", placeholder: "Optional target keywords", required: false },
      { id: "variation_count", label: "How Many Variations?", type: "select", required: true, options: countOptions },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words, claims, or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "linkedin-ad",
    slug: "linkedin-ad",
    name: "LinkedIn Ad",
    description: "Generate professional LinkedIn campaign copy for B2B offers and lead generation.",
    icon: "linkedin",
    detailEmoji: "💼",
    category: "Ad Copy",
    displayCreditCost: 4,
    outputType: "text",
    aliases: ["linkedin-ad-copy", "linkedin-ads", "linkedin-ad-generator", "b2b-ad-copy"],
    inputs: [
      { id: "offer", label: "Offer", type: "text", placeholder: "What are you promoting?", required: true },
      { id: "brief", label: "Campaign Brief", type: "textarea", placeholder: "Describe audience, outcome, proof, differentiator, and CTA.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Campaign Goal", type: "select", required: true, options: goalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "variation_count", label: "How Many Variations?", type: "select", required: true, options: countOptions },
      { id: "cta", label: "CTA", type: "text", placeholder: "Optional CTA", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "tiktok-ads",
    slug: "tiktok-ads",
    name: "TikTok Ads",
    description: "Generate TikTok campaign concepts, hooks, scripts, captions, and CTA variations.",
    icon: "tiktok",
    detailEmoji: "🎵",
    category: "Ad Copy",
    displayCreditCost: 3,
    outputType: "text",
    aliases: ["tiktok-ad-copy", "tiktok-ad-generator", "tiktok-script-generator"],
    inputs: [
      { id: "offer", label: "Product / Offer", type: "text", placeholder: "What are you promoting?", required: true },
      { id: "brief", label: "Campaign Brief", type: "textarea", placeholder: "Describe the offer, audience, problem, benefit, and CTA.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Campaign Goal", type: "select", required: true, options: goalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "variation_count", label: "How Many Concepts?", type: "select", required: true, options: countOptions },
      { id: "creator_style", label: "Creator Style", type: "text", placeholder: "Optional: UGC, founder, demo, testimonial", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "twitter-ads",
    slug: "twitter-ads",
    name: "Twitter/X Ads",
    description: "Create concise X/Twitter promoted-post copy, hooks, and CTA variations.",
    icon: "x-twitter",
    detailEmoji: "𝕏",
    category: "Ad Copy",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["x-ads", "twitter-ad-copy", "x-ad-copy", "promoted-tweet-generator"],
    inputs: [
      { id: "offer", label: "Product / Offer", type: "text", placeholder: "What are you promoting?", required: true },
      { id: "brief", label: "Campaign Brief", type: "textarea", placeholder: "Describe the message, audience, benefit, differentiator, and CTA.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Campaign Goal", type: "select", required: true, options: goalOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "variation_count", label: "How Many Variations?", type: "select", required: true, options: countOptions },
      { id: "cta", label: "CTA", type: "text", placeholder: "Optional CTA", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "commercial-ad-script-generator",
    slug: "commercial-ad-script-generator",
    name: "Commercial Ad Script Generator",
    description: "Write commercial scripts for video, radio, reels, shorts, and brand campaigns.",
    icon: "video-script",
    detailEmoji: "🎥",
    category: "Ad Copy",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["commercial-script", "ad-script-generator", "video-ad-script", "commercial-ad-script"],
    inputs: [
      { id: "brand_or_product", label: "Brand / Product", type: "text", placeholder: "What is the ad for?", required: true },
      { id: "brief", label: "Script Brief", type: "textarea", placeholder: "Describe the offer, message, audience, proof, tone, and CTA.", required: true },
      { id: "script_length", label: "Script Length", type: "select", required: true, options: ["15 seconds", "30 seconds", "45 seconds", "60 seconds"] },
      { id: "format", label: "Format", type: "select", required: true, options: ["Video ad", "Radio ad", "UGC-style script", "Reels/Shorts ad", "Brand commercial", "Explainer ad"] },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "cta", label: "CTA", type: "text", placeholder: "Optional CTA", required: false },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "ad-hook-creator",
    slug: "ad-hook-creator",
    name: "Ad Hook Creator",
    description: "Generate strong opening hooks for social campaigns, landing pages, and scripts.",
    icon: "hook",
    detailEmoji: "🪝",
    category: "Ad Copy",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["ad-hooks", "hook-generator", "ad-hook-generator", "marketing-hook-generator"],
    inputs: [
      { id: "offer", label: "Offer / Product", type: "textarea", placeholder: "Describe what you sell, who it helps, the pain point, benefit, and CTA.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "hook_style", label: "Hook Style", type: "select", required: true, options: ["Problem-aware", "Benefit-led", "Curiosity", "Contrarian", "Story-driven", "Premium", "Mixed styles"] },
      { id: "hook_count", label: "How Many Hooks?", type: "select", required: true, options: hookCountOptions },
      { id: "platform", label: "Platform / Placement", type: "text", placeholder: "Optional: TikTok, Instagram, Google, LinkedIn, landing page, YouTube", required: false },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words or angles to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
];
