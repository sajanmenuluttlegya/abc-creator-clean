type SocialInput = { id: string; label: string; type: "text" | "textarea" | "select" | "image"; placeholder?: string; required: boolean; options?: string[] };
type SocialTool = { id: string; slug: string; name: string; description: string; icon: string; detailEmoji: string; category: string; displayCreditCost: number; outputType: "text"; aliases?: string[]; nextActions?: Array<{ label: string; href: string; description: string }>; inputs: SocialInput[] };

const audienceOptions = ["General audience", "Beginners", "Intermediate readers", "Experts", "Small business owners", "Marketers", "Students", "Niche audience from brief"];
const instagramToneOptions = ["Professional", "Friendly", "Luxury", "Minimal", "Funny", "Bold", "Aesthetic", "Creator-style", "Sales-focused"];
const profileGoalOptions = ["Grow a creator page", "Sell products", "Book services", "Build personal brand", "Promote local business", "Launch new page", "Refresh old profile"];
const bioStyleOptions = ["Short and clean", "SEO keyword-rich", "Luxury premium", "Friendly creator", "Sales-focused", "Minimal aesthetic", "Authority/expert", "Emoji-light", "Emoji-rich"];
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const variationOptions = ["1 variation", "3 variations", "5 variations", "10 variations"];

export const socialVariationOverrideTools: SocialTool[] = [
  {
    id: "instagram-page-name-bio-generator",
    slug: "instagram-page-name-bio-generator",
    name: "Instagram Page Name & Bio Generator",
    description: "Create exact premium Instagram page name, handle, bio, CTA, and positioning variations.",
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
      { id: "variation_count", label: "Variations", type: "select", required: true, options: variationOptions },
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
];
