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

const languageOptions = [
  "English",
  "Hindi",
  "Hinglish",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Arabic",
];

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

const captionLengthOptions = [
  "Short captions",
  "Medium captions",
  "Long storytelling captions",
  "Mixed lengths",
];

const captionCountOptions = [
  "5 caption variations",
  "8 caption variations",
  "12 caption variations",
];

const hashtagModeOptions = [
  "No hashtags",
  "Light hashtags",
  "Balanced hashtags",
  "Hashtag sets by intent",
];

const emojiModeOptions = [
  "No emojis",
  "Light emojis",
  "Balanced emojis",
  "Match the image mood",
];

export const socialTools: PublicSocialTool[] = [
  {
    id: "image-to-instagram-caption",
    slug: "image-to-instagram-caption",
    name: "Image to Instagram Caption Generator",
    description: "Analyze an uploaded image and generate premium Instagram captions, CTAs, hashtags, alt text, and safety notes.",
    icon: "instagram",
    detailEmoji: "📸",
    category: "Social Media Tools",
    displayCreditCost: 3,
    outputType: "text",
    aliases: [
      "instagram-caption-from-image",
      "ai-instagram-caption-from-image",
      "instagram-caption-generator-image",
      "image-caption-for-instagram",
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
      { id: "image_data", label: "Upload Image", type: "image", placeholder: "Upload the image you want captioned", required: true },
      { id: "brand_name", label: "Brand / Page Name", type: "text", placeholder: "e.g., Luna Skincare, Urban Brew, your creator name", required: false },
      { id: "image_context", label: "Image / Product Context", type: "textarea", placeholder: "Optional: product details, location, campaign idea, what matters in the image, or anything the AI should know but cannot see.", required: false },
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
];
