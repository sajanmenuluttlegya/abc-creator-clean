type PublicGeneralToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicGeneralTool = {
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
  inputs: PublicGeneralToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional", "Friendly", "Premium", "Bold", "Simple and clear", "Witty", "Technical", "Luxury"];
const industryOptions = ["Technology / SaaS", "E-commerce", "Agency / Services", "Local business", "Fashion / Beauty", "Food / Cafe", "Education / Coaching", "Health / Fitness", "Finance", "Other / Custom"];
const nameStyleOptions = ["Modern and premium", "Short and brandable", "Descriptive and clear", "Luxury / elegant", "Fun and memorable", "Tech startup style", "Mixed styles"];
const nameCountOptions = ["10 names", "20 names", "30 names", "50 names"];
const keywordCountOptions = ["25 keywords", "50 keywords", "100 keywords"];
const intentOptions = ["Mixed intent", "Informational", "Commercial investigation", "Transactional", "Local SEO", "Question keywords", "Comparison keywords"];
const promptTypeOptions = ["Marketing prompt", "Blog/content prompt", "Image generation prompt", "Business strategy prompt", "SEO prompt", "Social media prompt", "Custom task prompt"];
const promptDepthOptions = ["Short usable prompt", "Detailed professional prompt", "Advanced prompt with constraints", "Prompt pack with variations"];

export const generalTools: PublicGeneralTool[] = [
  {
    id: "business-name-generator",
    slug: "business-name-generator",
    name: "Business Name Generator",
    description: "Find premium business name ideas with positioning notes and tagline options.",
    icon: "business",
    detailEmoji: "🏷️",
    category: "Business Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["ai-business-name-generator", "business-name-ideas", "brand-name-generator", "company-name-generator"],
    nextActions: [
      { label: "Create a social bio", href: "/tools/social-media-bio-generator", description: "Turn the chosen name into a profile bio." },
      { label: "Generate product descriptions", href: "/tools/product-description", description: "Write product copy after the positioning is clear." },
    ],
    inputs: [
      { id: "business_idea", label: "Business Idea", type: "textarea", placeholder: "Describe what the business sells, does, or helps people achieve.", required: true },
      { id: "industry", label: "Industry", type: "select", required: true, options: industryOptions },
      { id: "audience", label: "Target Audience", type: "text", placeholder: "e.g., busy founders, students, local families", required: true },
      { id: "name_style", label: "Name Style", type: "select", required: true, options: nameStyleOptions },
      { id: "name_count", label: "How Many Names?", type: "select", required: true, options: nameCountOptions },
      { id: "keywords", label: "Keywords to Include", type: "text", placeholder: "Optional words or themes", required: false },
      { id: "avoid", label: "Words / Styles to Avoid", type: "textarea", placeholder: "Optional notes to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "long-tail-keyword-generator",
    slug: "long-tail-keyword-generator",
    name: "Long Tail Keyword Generator",
    description: "Generate long-tail keywords with categories, titles, and search intent.",
    icon: "seo",
    detailEmoji: "🔎",
    category: "SEO Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["long-tail-keywords", "long-tail-keyword-tool", "ai-long-tail-keyword-generator", "keyword-ideas-generator"],
    nextActions: [
      { label: "Generate blog titles", href: "/tools/blog-title-generator", description: "Turn keyword ideas into SEO-friendly titles." },
      { label: "Create a blog outline", href: "/tools/blog-outline", description: "Build a full outline from the best keyword angle." },
    ],
    inputs: [
      { id: "seed_keyword", label: "Seed Keyword / Topic", type: "text", placeholder: "e.g., AI trading, handmade candles", required: true },
      { id: "niche", label: "Niche / Market", type: "text", placeholder: "e.g., beginner traders, local cafes", required: true },
      { id: "audience", label: "Audience", type: "text", placeholder: "Who are these keywords for?", required: true },
      { id: "intent_focus", label: "Intent Focus", type: "select", required: true, options: intentOptions },
      { id: "keyword_count", label: "Keyword Count", type: "select", required: true, options: keywordCountOptions },
      { id: "location", label: "Location", type: "text", placeholder: "Optional city, country, or region", required: false },
      { id: "avoid", label: "Avoid / Exclude", type: "textarea", placeholder: "Optional exclusions", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "ai-prompt-generator",
    slug: "ai-prompt-generator",
    name: "AI Prompt Generator",
    description: "Create polished prompts with role, context, constraints, and output format.",
    icon: "writing-pad",
    detailEmoji: "⚙️",
    category: "AI Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["prompt-generator", "ai-prompt-maker", "chatgpt-prompt-generator", "prompt-builder"],
    nextActions: [
      { label: "Generate paragraphs", href: "/tools/ai-paragraph-generator", description: "Use the prompt direction to create polished paragraphs." },
    ],
    inputs: [
      { id: "task", label: "Task / Goal", type: "textarea", placeholder: "What do you want the prompt to help create?", required: true },
      { id: "prompt_type", label: "Prompt Type", type: "select", required: true, options: promptTypeOptions },
      { id: "target_ai", label: "Target AI / Platform", type: "text", placeholder: "Optional: ChatGPT, Claude, Gemini, image model", required: false },
      { id: "audience_or_user", label: "Audience / End User", type: "text", placeholder: "Optional audience context", required: false },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "prompt_depth", label: "Prompt Depth", type: "select", required: true, options: promptDepthOptions },
      { id: "output_format", label: "Desired Output Format", type: "text", placeholder: "Optional: table, bullet list, article, code, image prompt", required: false },
      { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional constraints", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
];
