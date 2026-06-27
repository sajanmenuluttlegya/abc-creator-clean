export interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  displayCreditCost: number;
  outputType?: "text";
  aliases?: string[];
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

export const publicTools: Tool[] = [
  {
    id: "blog-topic-ideas",
    slug: "blog-topic-ideas",
    name: "Blog Topic Ideas",
    description: "Generate SEO-aware blog topic ideas from a niche and keyword.",
    icon: "📝",
    category: "Blog Workflow",
    displayCreditCost: 2,
    outputType: "text",
    aliases: [
      "ai-blog-topic-ideas",
      "blog-topic-ideas-generator",
      "blog-topic-ideas-tool",
    ],
    inputs: [
      {
        id: "niche",
        label: "Niche",
        type: "text",
        placeholder: "e.g., fitness for busy founders",
        required: true,
      },
      {
        id: "keyword",
        label: "Keyword",
        type: "text",
        placeholder: "e.g., 20-minute workouts",
        required: true,
      },
      {
        id: "audience",
        label: "Audience",
        type: "select",
        required: true,
        options: audienceOptions,
      },
      {
        id: "language",
        label: "Language",
        type: "select",
        required: true,
        options: languageOptions,
      },
      {
        id: "tone",
        label: "Tone",
        type: "select",
        required: true,
        options: toneOptions,
      },
    ],
  },
  {
    id: "blog-outline",
    slug: "blog-outline",
    name: "Blog Outline",
    description: "Create a structured long-form blog outline with H2/H3 sections and FAQs.",
    icon: "🧭",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-blog-outline", "blog-outline-generator", "blog-outline-tool"],
    inputs: [
      {
        id: "blog_title",
        label: "Blog Title",
        type: "text",
        placeholder: "e.g., How AI Helps Small Businesses Save Time",
        required: true,
      },
      {
        id: "target_keyword",
        label: "Target Keyword",
        type: "text",
        placeholder: "e.g., AI for small business",
        required: true,
      },
      {
        id: "audience",
        label: "Audience",
        type: "select",
        required: true,
        options: audienceOptions,
      },
      {
        id: "tone",
        label: "Tone",
        type: "select",
        required: true,
        options: toneOptions,
      },
      {
        id: "word_count",
        label: "Target Word Count",
        type: "text",
        placeholder: "e.g., 1500 words",
        required: true,
      },
    ],
  },
  {
    id: "blog-content",
    slug: "blog-content",
    name: "Blog Content",
    description: "Turn an approved outline into a complete blog article.",
    icon: "✍️",
    category: "Blog Workflow",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["ai-blog-content", "blog-content-generator", "blog-content-tool"],
    inputs: [
      {
        id: "outline",
        label: "Approved Outline",
        type: "textarea",
        placeholder: "Paste the H2/H3 outline you want expanded into a blog post.",
        required: true,
      },
      {
        id: "title",
        label: "Title",
        type: "text",
        placeholder: "e.g., How AI Helps Small Businesses Save Time",
        required: true,
      },
      {
        id: "keywords",
        label: "Keywords",
        type: "textarea",
        placeholder: "e.g., AI for small business, automation, productivity",
        required: true,
      },
      {
        id: "tone",
        label: "Tone",
        type: "select",
        required: true,
        options: toneOptions,
      },
      {
        id: "audience",
        label: "Audience",
        type: "select",
        required: true,
        options: audienceOptions,
      },
      {
        id: "word_count",
        label: "Target Word Count",
        type: "text",
        placeholder: "e.g., 1800 words",
        required: true,
      },
      {
        id: "language",
        label: "Language",
        type: "select",
        required: true,
        options: languageOptions,
      },
    ],
  },
  {
    id: "pro-image-brief-for-blog",
    slug: "pro-image-brief-for-blog",
    name: "Pro Image Brief for Blog",
    description: "Generate text-only image prompts, alt text, and placement briefs for blog sections.",
    icon: "🖼️",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: [
      "ai-pro-image-brief-for-blog",
      "pro-image-brief-for-blog-generator",
      "pro-image-brief-for-blog-tool",
    ],
    inputs: [
      {
        id: "blog_outline",
        label: "Blog Outline",
        type: "textarea",
        placeholder: "Paste the blog outline or section list.",
        required: true,
      },
      {
        id: "blog_topic",
        label: "Blog Topic",
        type: "text",
        placeholder: "e.g., AI tools for online teachers",
        required: true,
      },
      {
        id: "visual_style",
        label: "Visual Style",
        type: "text",
        placeholder: "e.g., clean SaaS illustration, warm editorial photography",
        required: true,
      },
      {
        id: "image_ratio",
        label: "Image Ratio",
        type: "text",
        placeholder: "e.g., 16:9, 4:3, 1:1, vertical 9:16",
        required: true,
      },
    ],
  },
  {
    id: "blog-seo-pack",
    slug: "blog-seo-pack",
    name: "Blog SEO Pack",
    description: "Generate SEO metadata, slug ideas, tags, excerpts, and FAQ schema drafts.",
    icon: "🔎",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-blog-seo-pack", "blog-seo-pack-generator", "blog-seo-pack-tool"],
    inputs: [
      {
        id: "blog_title",
        label: "Blog Title",
        type: "text",
        placeholder: "e.g., How AI Helps Small Businesses Save Time",
        required: true,
      },
      {
        id: "article_content",
        label: "Article Content",
        type: "textarea",
        placeholder: "Paste the article or draft you want optimized.",
        required: true,
      },
      {
        id: "keyword",
        label: "Primary Keyword",
        type: "text",
        placeholder: "e.g., AI for small business",
        required: true,
      },
    ],
  },
  {
    id: "facebook-ad-copy",
    slug: "facebook-ad-copy",
    name: "Facebook Ad Copy",
    description: "Create compelling Facebook ad copy that drives clicks and conversions.",
    icon: "📢",
    category: "Advertising Tools",
    displayCreditCost: 4,
    outputType: "text",
    inputs: [
      {
        id: "product",
        label: "Product / Service",
        type: "text",
        placeholder: "What are you promoting?",
        required: true,
      },
      {
        id: "audience",
        label: "Target Audience",
        type: "text",
        placeholder: "e.g., Small business owners, fitness enthusiasts",
        required: true,
      },
      {
        id: "cta",
        label: "Call-to-Action",
        type: "select",
        required: false,
        options: ["Learn More", "Shop Now", "Sign Up", "Get Started", "Download"],
      },
    ],
  },
  {
    id: "product-description",
    slug: "product-description",
    name: "Product Description",
    description: "Write SEO-optimized product descriptions that sell.",
    icon: "🛍️",
    category: "E-Commerce Tools",
    displayCreditCost: 3,
    outputType: "text",
    inputs: [
      {
        id: "productName",
        label: "Product Name",
        type: "text",
        placeholder: "e.g., Premium Wireless Headphones",
        required: true,
      },
      {
        id: "features",
        label: "Key Features",
        type: "textarea",
        placeholder: "Noise cancellation, 30hr battery, bluetooth 5.0",
        required: true,
      },
      {
        id: "targetKeywords",
        label: "Target Keywords",
        type: "textarea",
        placeholder: "e.g., wireless headphones, noise cancelling",
        required: false,
      },
    ],
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return publicTools.find(
    (tool) => tool.slug === slug || tool.aliases?.includes(slug)
  );
}
