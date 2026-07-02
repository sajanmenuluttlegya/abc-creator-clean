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
const paraphraseModeOptions = ["Standard paraphrase", "Simpler rewrite", "More polished", "More concise", "More detailed", "Different tone", "Multiple variations"];
const paragraphTypeOptions = ["Introduction paragraph", "Body paragraph", "Conclusion paragraph", "Sales paragraph", "SEO paragraph", "Academic paragraph", "Social caption paragraph", "Custom paragraph"];
const paragraphCountOptions = ["1 paragraph", "3 paragraphs", "5 paragraphs", "10 paragraphs"];
const reportTypeOptions = ["Business report", "Project report", "Research report", "Marketing report", "Performance report", "Case study report", "Student report", "Custom report"];
const reportLengthOptions = ["Short report", "Standard report", "Detailed report", "Premium report"];
const reportStructureOptions = ["Executive summary style", "Formal report", "Simple business format", "Research-style format", "Bullet-heavy format", "Mixed professional format"];

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
  {
    id: "ai-paraphrasing-tool",
    slug: "ai-paraphrasing-tool",
    name: "AI Paraphrasing Tool",
    description: "Rephrase content clearly while preserving the original meaning, structure, and intent.",
    icon: "rewrite",
    detailEmoji: "🔁",
    category: "Writing Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["ai-paraphraser", "paraphrasing-tool", "paraphrase-tool", "text-paraphraser", "content-paraphraser"],
    nextActions: [
      { label: "Generate paragraphs", href: "/tools/ai-paragraph-generator", description: "Turn the rewritten idea into fresh paragraphs." },
    ],
    inputs: [
      { id: "source_text", label: "Text to Paraphrase", type: "textarea", placeholder: "Paste the sentence, paragraph, or content you want rephrased.", required: true },
      { id: "paraphrase_mode", label: "Paraphrase Mode", type: "select", required: true, options: paraphraseModeOptions },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "audience", label: "Audience", type: "text", placeholder: "Optional: who will read it?", required: false },
      { id: "keywords", label: "Words to Keep", type: "text", placeholder: "Optional words, names, terms, or keywords that must stay unchanged", required: false },
      { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: phrases, tone, claims, or words to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "ai-paragraph-generator",
    slug: "ai-paragraph-generator",
    name: "AI Paragraph Generator",
    description: "Generate polished paragraphs for blogs, sales copy, essays, reports, and social content.",
    icon: "paragraph",
    detailEmoji: "¶",
    category: "Writing Tools",
    displayCreditCost: 2,
    outputType: "text",
    aliases: ["paragraph-generator", "paragraph-writer", "ai-paragraph-writer", "generate-paragraphs"],
    nextActions: [
      { label: "Write a report", href: "/tools/ai-report-writing", description: "Expand strong paragraphs into a structured report." },
    ],
    inputs: [
      { id: "topic", label: "Topic / Paragraph Brief", type: "textarea", placeholder: "Describe what the paragraph should explain, sell, introduce, or conclude.", required: true },
      { id: "paragraph_type", label: "Paragraph Type", type: "select", required: true, options: paragraphTypeOptions },
      { id: "paragraph_count", label: "How Many Paragraphs?", type: "select", required: true, options: paragraphCountOptions },
      { id: "audience", label: "Audience", type: "text", placeholder: "e.g., beginners, customers, executives, students", required: true },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "keywords", label: "Keywords / Points to Include", type: "textarea", placeholder: "Optional: facts, keywords, product points, examples, or must-include ideas", required: false },
      { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: banned words, claims, examples, or style notes", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
  {
    id: "ai-report-writing",
    slug: "ai-report-writing",
    name: "AI Report Writing",
    description: "Create structured professional reports with summaries, findings, analysis, and recommendations.",
    icon: "report",
    detailEmoji: "📄",
    category: "Writing Tools",
    displayCreditCost: 5,
    outputType: "text",
    aliases: ["report-writer", "ai-report-writer", "report-generator", "professional-report-writer"],
    nextActions: [
      { label: "Create a blog outline", href: "/tools/blog-outline", description: "Turn the report topic into a public article outline." },
      { label: "Generate image briefs", href: "/tools/pro-image-brief-for-blog", description: "Plan supporting visuals for the report." },
    ],
    inputs: [
      { id: "report_topic", label: "Report Topic", type: "text", placeholder: "e.g., Q2 marketing performance, AI in education, project completion report", required: true },
      { id: "report_context", label: "Report Details / Data / Notes", type: "textarea", placeholder: "Paste all facts, notes, data, goals, findings, or instructions. The report will not invent unsupported data.", required: true },
      { id: "report_type", label: "Report Type", type: "select", required: true, options: reportTypeOptions },
      { id: "report_length", label: "Report Length", type: "select", required: true, options: reportLengthOptions },
      { id: "report_structure", label: "Report Structure", type: "select", required: true, options: reportStructureOptions },
      { id: "audience", label: "Audience", type: "text", placeholder: "e.g., manager, client, teacher, investors, internal team", required: true },
      { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
      { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: sections, metrics, dates, recommendations, names, or decisions to include", required: false },
      { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, topics, data, tone, or sections to avoid", required: false },
      { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
    ],
  },
];
