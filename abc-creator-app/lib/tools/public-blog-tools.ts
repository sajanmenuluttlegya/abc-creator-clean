type PublicBlogToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicBlogTool = {
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
  inputs: PublicBlogToolInput[];
};

const audienceOptions = [
  "General audience",
  "Beginners",
  "Intermediate readers",
  "Experts",
  "Small business owners",
  "Marketers",
  "Students",
];

const toneOptions = [
  "Professional",
  "Friendly",
  "Educational",
  "Persuasive",
  "Conversational",
  "Witty",
];

const targetWordCountOptions = [
  "Short article (800-1,200 words)",
  "Standard article (1,200-1,800 words)",
  "Long article (1,800-2,500 words)",
  "Very long article (2,500-3,500 words)",
  "Premium pillar article (3,500-5,000 words)",
];

const expertiseLevelOptions = [
  "Beginner-friendly",
  "Intermediate",
  "Advanced",
  "Expert",
];

const examplesNeededOptions = [
  "Light examples",
  "Several practical examples",
  "Detailed examples and mini-scenarios",
  "Case-style examples with placeholders",
];

const commonBlogNextActions = [
  {
    label: "Create a blog SEO pack",
    href: "/tools/blog-seo-pack",
    description: "Turn the finished article into metadata, schema, slug ideas, and social share copy.",
  },
  {
    label: "Create pro image prompts",
    href: "/tools/pro-image-brief-for-blog",
    description: "Plan hero and section visuals without making fake media claims.",
  },
];

export const blogTools: PublicBlogTool[] = [
  {
    id: "human-style-blog-post",
    slug: "human-style-blog-post",
    name: "Human-Style Blog Post",
    description: "Write a natural, non-generic blog post with examples, SEO suggestions, and review notes.",
    icon: "blog-content",
    detailEmoji: "📝",
    category: "Blog Tools",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["ai-human-style-blog-post", "human-style-blog-post-generator", "human-style-blog-post-tool"],
    nextActions: commonBlogNextActions,
    inputs: [
      { id: "topic", label: "Topic", type: "text", placeholder: "e.g., How solopreneurs can use AI without losing their voice", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "keywords", label: "Keywords", type: "textarea", placeholder: "e.g., AI writing workflow, solopreneur productivity, brand voice", required: true },
      { id: "word_count", label: "Target Word Count", type: "select", required: true, options: targetWordCountOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: brand voice, examples, source notes, claims to verify, must-include points, or things to avoid.", required: false },
    ],
  },
  {
    id: "seo-optimized-blog-post",
    slug: "seo-optimized-blog-post",
    name: "SEO-Optimized Blog Post",
    description: "Write a keyword-focused blog post with reader-friendly structure, FAQs, and SEO metadata suggestions.",
    icon: "seo",
    detailEmoji: "🔎",
    category: "Blog Tools",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["ai-seo-optimized-blog-post", "seo-optimized-blog-post-generator", "seo-optimized-blog-post-tool"],
    nextActions: commonBlogNextActions,
    inputs: [
      { id: "title", label: "Title", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI for small business", required: true },
      { id: "secondary_keywords", label: "Secondary Keywords", type: "textarea", placeholder: "e.g., automation tools, productivity, small business AI", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "word_count", label: "Target Word Count", type: "select", required: true, options: targetWordCountOptions },
      { id: "tone", label: "Tone", type: "select", required: false, options: toneOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: brand voice, source notes, internal pages, claims to verify, must-include points, or things to avoid.", required: false },
    ],
  },
  {
    id: "advanced-blog-post",
    slug: "advanced-blog-post",
    name: "Advanced Blog Post",
    description: "Create a detailed expert-level blog post with frameworks, examples, caveats, and SEO suggestions.",
    icon: "blog-content",
    detailEmoji: "📚",
    category: "Blog Tools",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["advanced-blog-post-generator", "advanced-blog-post-tool", "ai-advanced-blog-post"],
    nextActions: commonBlogNextActions,
    inputs: [
      { id: "title", label: "Title", type: "text", placeholder: "e.g., A Practical Guide to AI Workflow Automation", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "expertise_level", label: "Expertise Level", type: "select", required: true, options: expertiseLevelOptions },
      { id: "keywords", label: "Keywords", type: "textarea", placeholder: "e.g., workflow automation, AI agents, operations, process design", required: true },
      { id: "examples_needed", label: "Examples Needed", type: "select", required: true, options: examplesNeededOptions },
      { id: "word_count", label: "Target Word Count", type: "select", required: false, options: targetWordCountOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: source notes, frameworks, examples, audience context, must-include points, or claims to verify.", required: false },
    ],
  },
];
