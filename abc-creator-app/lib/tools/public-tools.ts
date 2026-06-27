export interface RecommendedNextAction {
  label: string;
  href: string;
  description: string;
}

export interface Tool {
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
  nextActions?: RecommendedNextAction[];
  inputs: ToolInput[];
}

export interface ToolInput {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const audienceOptions = [
  "General audience",
  "Beginners",
  "Intermediate readers",
  "Experts",
  "Small business owners",
  "Marketers",
  "Students",
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

const toneOptions = [
  "Professional",
  "Friendly",
  "Educational",
  "Persuasive",
  "Conversational",
  "Witty",
];

const blogTopicIdeaCountOptions = [
  "5 ideas",
  "10 ideas",
  "20 ideas",
  "30 ideas",
  "50 ideas",
];

const voiceOptions = [
  "Second person helpful guide",
  "First person expert",
  "Third person editorial",
  "Brand voice",
  "Neutral magazine style",
  "Founder/operator voice",
];

const targetWordCountOptions = [
  "Short article (800-1,200 words)",
  "Standard article (1,200-1,800 words)",
  "Long article (1,800-2,500 words)",
  "Very long article (2,500-3,500 words)",
  "Premium pillar article (3,500-5,000 words)",
];

const wordsPerSectionOptions = [
  "Very short (up to 300 words)",
  "Short (up to 500 words)",
  "Medium (up to 1000 words)",
  "Long (up to 2000 words)",
  "Very long (up to 3000 words)",
  "2 paragraphs (up to 100 words)",
];

const articleDepthOptions = [
  "Basic overview",
  "Detailed practical guide",
  "Expert-level deep dive",
];

const yesNoOptions = ["Yes", "No"];

const imageBriefModeOptions = [
  "No image briefs",
  "Hero image brief only",
  "Hero + section image briefs",
];

const imagePlanOptions = [
  "Hero image only",
  "Hero + key section images",
  "Image for every major section",
  "Custom editorial image plan",
];

const imageRatioOptions = [
  "16:9 landscape",
  "4:3 landscape",
  "3:2 editorial",
  "1:1 square",
  "9:16 vertical",
];

const imageCountGuidanceOptions = [
  "1 image",
  "3 images",
  "5 images",
  "7 images",
  "Suggest the ideal count",
];

export const publicTools: Tool[] = [
  {
    id: "blog-topic-ideas",
    slug: "blog-topic-ideas",
    name: "Blog Topic Ideas",
    description: "Generate SEO-aware blog topic ideas from a niche and keyword.",
    icon: "blog-topic",
    detailEmoji: "💡",
    category: "Blog Workflow",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["ai-blog-topic-ideas", "blog-topic-ideas-generator", "blog-topic-ideas-tool"],
    nextActions: [
      {
        label: "Create a blog outline",
        href: "/tools/blog-outline",
        description: "Turn your best topic idea into a structured article outline.",
      },
    ],
    inputs: [
      { id: "niche", label: "Niche", type: "text", placeholder: "e.g., fitness for busy founders", required: true },
      { id: "keyword", label: "Keyword", type: "text", placeholder: "e.g., 20-minute workouts", required: true },
      { id: "idea_count", label: "How Many Ideas?", type: "select", required: true, options: blogTopicIdeaCountOptions },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    ],
  },
  {
    id: "blog-outline",
    slug: "blog-outline",
    name: "Blog Outline",
    description: "Create a structured long-form blog outline with H2/H3 sections and FAQs.",
    icon: "blog-outline",
    detailEmoji: "🧭",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-blog-outline", "blog-outline-generator", "blog-outline-tool"],
    nextActions: [
      {
        label: "Write the full blog content",
        href: "/tools/blog-content",
        description: "Use this outline to generate a premium long-form blog article.",
      },
    ],
    inputs: [
      { id: "blog_title", label: "Blog Title", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "target_keyword", label: "Target Keyword", type: "text", placeholder: "e.g., AI for small business", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "word_count", label: "Target Word Count", type: "select", required: true, options: targetWordCountOptions },
    ],
  },
  {
    id: "blog-content",
    slug: "blog-content",
    name: "Blog Content",
    description: "Turn an approved outline into a premium long-form blog article.",
    icon: "blog-content",
    detailEmoji: "✍️",
    category: "Blog Workflow",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["ai-blog-content", "blog-content-generator", "blog-content-tool"],
    nextActions: [
      {
        label: "Create a blog SEO pack",
        href: "/tools/blog-seo-pack",
        description: "Generate metadata, slug ideas, FAQ schema, and social copy for this article.",
      },
      {
        label: "Create pro image briefs",
        href: "/tools/pro-image-brief-for-blog",
        description: "Plan hero and section images with prompts, alt text, and captions.",
      },
    ],
    inputs: [
      { id: "outline", label: "Approved Outline", type: "textarea", placeholder: "Paste the H2/H3 outline you want expanded into a blog post.", required: true },
      { id: "title", label: "Title", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "keywords", label: "SEO Keywords", type: "textarea", placeholder: "e.g., AI for small business, automation, productivity", required: true },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "voice", label: "Voice", type: "select", required: true, options: voiceOptions },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "word_count", label: "Target Word Count", type: "select", required: true, options: targetWordCountOptions },
      { id: "words_per_section", label: "Words per Section", type: "select", required: true, options: wordsPerSectionOptions },
      { id: "article_depth", label: "Article Depth", type: "select", required: true, options: articleDepthOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "include_key_takeaways", label: "Include Key Takeaways", type: "select", required: true, options: yesNoOptions },
      { id: "include_list", label: "Include List Section", type: "select", required: true, options: yesNoOptions },
      { id: "include_table", label: "Include Table Section", type: "select", required: true, options: yesNoOptions },
      { id: "include_faq", label: "Include FAQ Section", type: "select", required: true, options: yesNoOptions },
      { id: "image_brief_mode", label: "Image Briefs", type: "select", required: true, options: imageBriefModeOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: brand name, product, offer, examples, sources, facts, or notes to include.", required: false },
    ],
  },
  {
    id: "pro-image-brief-for-blog",
    slug: "pro-image-brief-for-blog",
    name: "Pro Image Brief for Blog",
    description: "Plan premium blog visuals with prompts, alt text, captions, and placement notes.",
    icon: "image-brief",
    detailEmoji: "🖼️",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-pro-image-brief-for-blog", "pro-image-brief-for-blog-generator", "pro-image-brief-for-blog-tool"],
    nextActions: [
      {
        label: "Write the full blog content",
        href: "/tools/blog-content",
        description: "Use the visual plan alongside a full article draft.",
      },
    ],
    inputs: [
      { id: "blog_topic", label: "Blog Topic", type: "text", placeholder: "e.g., AI tools for online teachers", required: true },
      { id: "blog_outline", label: "Blog Outline / Article", type: "textarea", placeholder: "Paste the blog outline, article draft, or section list.", required: true },
      { id: "visual_style", label: "Visual Style", type: "text", placeholder: "e.g., clean SaaS illustration, warm editorial photography", required: true },
      { id: "brand_or_context", label: "Brand / Product Context", type: "textarea", placeholder: "Optional: brand colors, product details, audience, offer, or visual rules.", required: false },
      { id: "image_plan", label: "Image Plan", type: "select", required: true, options: imagePlanOptions },
      { id: "image_ratio", label: "Image Ratio", type: "select", required: true, options: imageRatioOptions },
      { id: "image_count_guidance", label: "Image Count Guidance", type: "select", required: true, options: imageCountGuidanceOptions },
      { id: "include_avoidance_prompts", label: "Include Avoidance Prompts", type: "select", required: true, options: yesNoOptions },
      { id: "include_alt_text", label: "Include Alt Text", type: "select", required: true, options: yesNoOptions },
      { id: "include_captions", label: "Include Captions", type: "select", required: true, options: yesNoOptions },
      { id: "include_placement_notes", label: "Include Placement Notes", type: "select", required: true, options: yesNoOptions },
    ],
  },
  {
    id: "blog-seo-pack",
    slug: "blog-seo-pack",
    name: "Blog SEO Pack",
    description: "Generate SEO metadata, slug ideas, tags, excerpts, and FAQ schema drafts.",
    icon: "seo",
    detailEmoji: "🔎",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-blog-seo-pack", "blog-seo-pack-generator", "blog-seo-pack-tool"],
    nextActions: [
      {
        label: "Create pro image briefs",
        href: "/tools/pro-image-brief-for-blog",
        description: "Plan article visuals after the SEO pack is ready.",
      },
    ],
    inputs: [
      { id: "blog_title", label: "Blog Title", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "article_content", label: "Article Content", type: "textarea", placeholder: "Paste the article or draft you want optimized.", required: true },
      { id: "keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI for small business", required: true },
    ],
  },
  {
    id: "facebook-ad-copy",
    slug: "facebook-ad-copy",
    name: "Facebook Ad Copy",
    description: "Create compelling Facebook ad copy that drives clicks and conversions.",
    icon: "ad-copy",
    detailEmoji: "📢",
    category: "Advertising Tools",
    displayCreditCost: 4,
    outputType: "text",
    inputs: [
      { id: "product", label: "Product / Service", type: "text", placeholder: "What are you promoting?", required: true },
      { id: "audience", label: "Target Audience", type: "text", placeholder: "e.g., Small business owners, fitness enthusiasts", required: true },
      { id: "cta", label: "Call-to-Action", type: "select", required: false, options: ["Learn More", "Shop Now", "Sign Up", "Get Started", "Download"] },
    ],
  },
  {
    id: "product-description",
    slug: "product-description",
    name: "Product Description",
    description: "Write SEO-optimized product descriptions that sell.",
    icon: "product",
    detailEmoji: "🛍️",
    category: "E-Commerce Tools",
    displayCreditCost: 3,
    outputType: "text",
    inputs: [
      { id: "productName", label: "Product Name", type: "text", placeholder: "e.g., Premium Wireless Headphones", required: true },
      { id: "features", label: "Key Features", type: "textarea", placeholder: "Noise cancellation, 30hr battery, bluetooth 5.0", required: true },
      { id: "targetKeywords", label: "Target Keywords", type: "textarea", placeholder: "e.g., wireless headphones, noise cancelling", required: false },
    ],
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return publicTools.find(
    (tool) => tool.slug === slug || tool.aliases?.includes(slug)
  );
}
