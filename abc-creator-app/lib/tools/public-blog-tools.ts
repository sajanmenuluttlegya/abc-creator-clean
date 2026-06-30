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

const targetWordCountOptions = [
  "Short article (800-1,200 words)",
  "Standard article (1,200-1,800 words)",
  "Long article (1,800-2,500 words)",
  "Very long article (2,500-3,500 words)",
  "Premium pillar article (3,500-5,000 words)",
  "Authority pillar article (5,000-10,000 words)",
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

const rewriteGoalOptions = [
  "SEO refresh",
  "Clarity and readability improvement",
  "Premium rewrite with stronger structure",
  "Keyword-focused rewrite",
  "Condense and sharpen",
  "Expand with practical detail",
];

const quickLengthOptions = [
  "Quick short post (700-1,000 words)",
  "Quick standard post (1,000-1,500 words)",
  "Quick long post (1,500-2,000 words)",
  "Quick very long post (2,000-3,000 words)",
  "One-click authority article (5,000-10,000 words)",
];

const calendarDurationOptions = [
  "30 days",
  "60 days",
  "90 days",
  "6 months",
];

const postingFrequencyOptions = [
  "1 post per week",
  "2 posts per week",
  "3 posts per week",
  "5 posts per week",
  "Custom frequency in context",
];

const calendarGoalOptions = [
  "Build topical authority",
  "Generate leads",
  "Support product launches",
  "Increase organic traffic",
  "Educate existing customers",
  "Plan transactional blog content",
];

const titleCountOptions = [
  "10 titles",
  "15 titles",
  "25 titles",
  "40 titles",
];

const titleAngleOptions = [
  "SEO-friendly",
  "Click-worthy but professional",
  "How-to / educational",
  "Listicle ideas",
  "Thought-leadership",
  "Comparison / alternative angles",
  "Mixed premium angles",
];

const introStyleOptions = [
  "Problem-first hook",
  "Story-style hook",
  "Stat-style placeholder hook",
  "Direct expert explanation",
  "Contrarian angle",
  "Beginner-friendly setup",
];

const conclusionStyleOptions = [
  "Actionable summary",
  "Persuasive CTA",
  "Executive wrap-up",
  "Checklist-style ending",
  "Thoughtful editorial ending",
];

const faqCountOptions = [
  "5 FAQs",
  "8 FAQs",
  "10 FAQs",
  "15 FAQs",
];

const faqPurposeOptions = [
  "Answer beginner questions",
  "Support SEO long-tail queries",
  "Handle objections before conversion",
  "Clarify technical concepts",
  "Create FAQ schema draft",
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

const quickBlogNextActions = [
  {
    label: "Use full Blog Post Generator",
    href: "/tools/blog-content",
    description: "Move from quick mode to the full outline-driven premium article workflow.",
  },
  ...commonBlogNextActions,
];

const calendarNextActions = [
  {
    label: "Generate blog topic ideas",
    href: "/tools/blog-topic-ideas",
    description: "Turn one calendar theme into more topic angles before drafting.",
  },
  {
    label: "Write a quick blog post",
    href: "/tools/quick-1-click-blog-post",
    description: "Turn a calendar topic into a fast complete article draft.",
  },
];

const titleNextActions = [
  {
    label: "Create a blog outline",
    href: "/tools/blog-outline",
    description: "Turn the strongest title into a full article outline.",
  },
  {
    label: "Write a quick blog post",
    href: "/tools/quick-1-click-blog-post",
    description: "Use a winning title to generate a fast complete article draft.",
  },
];

const sectionNextActions = [
  {
    label: "Use Blog Post Generator",
    href: "/tools/blog-content",
    description: "Use this section inside a full premium article workflow.",
  },
  ...commonBlogNextActions,
];

export const blogTools: PublicBlogTool[] = [
  {
    id: "human-style-blog-post",
    slug: "human-style-blog-post",
    name: "Human-Style Blog Post",
    description: "Write a natural, non-generic blog post with examples, SEO suggestions, and review notes.",
    icon: "blog-content",
    detailEmoji: "📝",
    category: "Blog Workflow",
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
    category: "Blog Workflow",
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
    category: "Blog Workflow",
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
  {
    id: "rewrite-article-with-keywords",
    slug: "rewrite-article-with-keywords",
    name: "Article Rewriter",
    description: "Rewrite an existing article into a clearer, more premium, keyword-aligned draft without fake SEO claims.",
    icon: "writing-pad",
    detailEmoji: "♻️",
    category: "Writing Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["article-rewriter", "ai-article-rewriter", "ai-rewrite-article-with-keywords", "rewrite-article-with-keywords-generator", "rewrite-article-with-keywords-tool", "article-rewriter-with-keywords"],
    nextActions: commonBlogNextActions,
    inputs: [
      { id: "article", label: "Existing Article", type: "textarea", placeholder: "Paste the article, draft, or section you want rewritten.", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI content workflow", required: true },
      { id: "secondary_keywords", label: "Secondary Keywords", type: "textarea", placeholder: "e.g., blog optimization, SEO writing, content refresh", required: false },
      { id: "rewrite_goal", label: "Rewrite Goal", type: "select", required: true, options: rewriteGoalOptions },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: brand voice, internal links, claims to preserve, facts to verify, forbidden phrases, or source notes.", required: false },
    ],
  },
  {
    id: "quick-1-click-blog-post",
    slug: "quick-1-click-blog-post",
    name: "Quick 1-Click Blog Post",
    description: "Quick Mode for Blog Post Generator: create a complete article from a topic or title with fewer inputs.",
    icon: "blog-content",
    detailEmoji: "⚡",
    category: "Blog Workflow",
    displayCreditCost: 8,
    outputType: "text",
    aliases: ["ai-quick-1-click-blog-post", "quick-1-click-blog-post-generator", "quick-blog-post", "one-click-blog-post", "quick-blog-post-generator"],
    nextActions: quickBlogNextActions,
    inputs: [
      { id: "blog_title", label: "Blog Title / Topic", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI for small business", required: false },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "article_length", label: "Quick Article Length", type: "select", required: true, options: quickLengthOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: must-include points, source notes, product context, audience pain points, CTAs, or claims to verify.", required: false },
    ],
  },
  {
    id: "blog-content-calendar",
    slug: "blog-content-calendar",
    name: "Blog Content Calendar",
    description: "Plan a premium blog publishing calendar with topics, intents, CTAs, clusters, and verification notes.",
    icon: "calendar",
    detailEmoji: "🗓️",
    category: "Blog Workflow",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["ai-blog-content-calendar", "blog-content-calendar-generator", "blog-content-calendar-tool", "blog-editorial-calendar", "content-calendar-for-blog"],
    nextActions: calendarNextActions,
    inputs: [
      { id: "niche_or_keyword", label: "Niche / Main Keyword", type: "text", placeholder: "e.g., AI tools for online teachers", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "goal", label: "Calendar Goal", type: "select", required: true, options: calendarGoalOptions },
      { id: "duration", label: "Calendar Duration", type: "select", required: true, options: calendarDurationOptions },
      { id: "posting_frequency", label: "Posting Frequency", type: "select", required: true, options: postingFrequencyOptions },
      { id: "start_date", label: "Start Date / Month", type: "text", placeholder: "Optional: e.g., July 2026, next Monday, or leave blank for Week 1 labels", required: false },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: products, services, offers, content pillars, must-cover themes, internal pages, excluded topics, or source notes.", required: false },
    ],
  },
  {
    id: "blog-title-generator",
    slug: "blog-title-generator",
    name: "Blog Title Generator",
    description: "Generate premium SEO-aware blog title options with angles, intent notes, and safe click-worthiness.",
    icon: "blog-outline",
    detailEmoji: "🏷️",
    category: "Blog Workflow",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["ai-blog-title-generator", "blog-title-generator-tool", "blog-title-tool", "blog-headline-generator", "title-generator-for-blog"],
    nextActions: titleNextActions,
    inputs: [
      { id: "topic", label: "Topic / Seed Idea", type: "text", placeholder: "e.g., AI tools for online teachers", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI tools for teachers", required: false },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "angle", label: "Title Angle", type: "select", required: true, options: titleAngleOptions },
      { id: "title_count", label: "How Many Titles?", type: "select", required: true, options: titleCountOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: brand voice, forbidden words, must-include benefit, competitor titles, or source notes.", required: false },
    ],
  },
  {
    id: "blog-intro-generator",
    slug: "blog-intro-generator",
    name: "Blog Intro Generator",
    description: "Write premium article introductions with strong hooks, reader promise, and smooth transition into the post.",
    icon: "blog-content",
    detailEmoji: "🚪",
    category: "Blog Workflow",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["ai-blog-intro-generator", "blog-intro-generator-tool", "blog-introduction-generator", "intro-generator", "introduction-generator-for-blog"],
    nextActions: sectionNextActions,
    inputs: [
      { id: "blog_title", label: "Blog Title / Topic", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI for small business", required: false },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "intro_style", label: "Intro Style", type: "select", required: true, options: introStyleOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: article outline, opening fact/source notes, reader pain points, CTA, or claims to verify.", required: false },
    ],
  },
  {
    id: "blog-conclusion-generator",
    slug: "blog-conclusion-generator",
    name: "Blog Conclusion Generator",
    description: "Create polished article endings with summaries, next steps, and CTA options without generic filler.",
    icon: "blog-content",
    detailEmoji: "🏁",
    category: "Blog Workflow",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["ai-blog-conclusion-generator", "blog-conclusion-generator-tool", "conclusion-generator", "conclusion-generator-for-blog"],
    nextActions: sectionNextActions,
    inputs: [
      { id: "blog_title", label: "Blog Title / Topic", type: "text", placeholder: "e.g., How AI Helps Small Businesses Save Time", required: true },
      { id: "article_summary", label: "Article Summary / Main Points", type: "textarea", placeholder: "Paste the key points, outline, or draft sections to conclude.", required: true },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "conclusion_style", label: "Conclusion Style", type: "select", required: true, options: conclusionStyleOptions },
      { id: "cta_or_next_step", label: "CTA / Next Step", type: "text", placeholder: "Optional: book a demo, download checklist, read another guide, subscribe", required: false },
    ],
  },
  {
    id: "faq-generator",
    slug: "faq-generator",
    name: "FAQ Generator",
    description: "Generate useful blog FAQs with concise answers, search-intent coverage, and optional schema-ready draft.",
    icon: "seo",
    detailEmoji: "❓",
    category: "Blog Workflow",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["ai-faq-generator", "faq-generator-tool", "blog-faq-generator", "frequently-asked-questions-generator"],
    nextActions: sectionNextActions,
    inputs: [
      { id: "topic_or_article", label: "Topic / Article Draft", type: "textarea", placeholder: "Paste a topic, outline, article draft, or product/service notes.", required: true },
      { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "e.g., AI tools for teachers", required: false },
      { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
      { id: "faq_count", label: "FAQ Count", type: "select", required: true, options: faqCountOptions },
      { id: "faq_purpose", label: "FAQ Purpose", type: "select", required: true, options: faqPurposeOptions },
      { id: "brand_or_context", label: "Brand / Extra Context", type: "textarea", placeholder: "Optional: facts to preserve, questions users ask, source notes, product limitations, or claims to verify.", required: false },
    ],
  },
];