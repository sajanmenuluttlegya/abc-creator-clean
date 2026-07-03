import { creativeBatchTools } from "./public-creative-batch-tools";
import { emailBatchTools } from "./public-email-batch-tools";
import { emailCopyBatchTools } from "./public-email-copy-batch-tools";
import { salesCopyBatchTools } from "./public-sales-copy-batch-tools";
import { seoUtilityBatchTools } from "./public-seo-utility-batch-tools";
import { seoCompletionBatchTools } from "./public-seo-completion-batch-tools";
import { emailEcommerceBatchTools } from "./public-email-ecommerce-batch-tools";
import { socialCompletionBatchTools } from "./public-social-completion-batch-tools";
import { youtubeCompletionBatchTools } from "./public-youtube-completion-batch-tools";
import { adCopyBatchTools } from "./public-ad-copy-batch-tools";

type PublicBlogBatchToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image" | "media";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicBlogBatchTool = {
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
  inputs: PublicBlogBatchToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional", "Friendly", "Educational", "Persuasive", "Conversational", "Witty", "Premium", "Simple and clear"];
const audienceOptions = ["General audience", "Beginners", "Intermediate readers", "Experts", "Small business owners", "Marketers", "Students", "Customers"];
const sectionLengthOptions = ["Short section", "Medium section", "Long section", "Detailed section"];
const outputCountOptions = ["3 variations", "5 variations", "10 variations"];
const emailTypeOptions = ["Newsletter", "Promotional email", "Educational email", "Product update", "Nurture email", "Plain-text email"];
const socialPlatformOptions = ["Instagram", "LinkedIn", "X / Twitter", "Facebook", "TikTok", "Pinterest", "Multi-platform"];
const scriptLengthOptions = ["30 seconds", "60 seconds", "2 minutes", "5 minutes", "10 minutes"];
const articleLengthOptions = ["Short article", "Standard article", "Long article", "Detailed article"];
const transcriptSourceModeOptions = ["Paste text / transcript", "YouTube URL", "Upload audio/video"];

function commonInputs(primaryLabel: string): PublicBlogBatchToolInput[] {
  return [
    { id: "source_content", label: primaryLabel, type: "textarea", placeholder: "Paste the source blog, section, outline, article notes, or brief.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Optional main keyword or topic", required: false },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional facts, CTA, offer, product details, examples, or points to include.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional words, claims, topics, or style notes to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function transcriptBlogInputs(primaryLabel: string): PublicBlogBatchToolInput[] {
  return [
    { id: "source_mode", label: "Source Mode", type: "select", required: true, options: transcriptSourceModeOptions },
    { id: "source_url", label: "YouTube URL", type: "text", placeholder: "Paste a YouTube video URL only when using YouTube URL mode.", required: false },
    { id: "media_upload", label: "Upload Audio/Video", type: "media", placeholder: "Upload an audio/video file only when using Upload audio/video mode.", required: false },
    { id: "source_content", label: primaryLabel, type: "textarea", placeholder: "Paste a transcript/source notes here, or leave blank when using YouTube URL or uploaded audio/video.", required: true },
    { id: "article_length", label: "Article Length", type: "select", required: true, options: articleLengthOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Optional main keyword or topic", required: false },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional facts, CTA, offer, product details, examples, or points to include.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional words, claims, topics, or style notes to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, detailEmoji: string, displayCreditCost: number, inputs: PublicBlogBatchToolInput[], aliases: string[] = []): PublicBlogBatchTool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: "blog-content",
    detailEmoji,
    category: "Blog Workflow",
    displayCreditCost,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-generator`, `${slug}-tool`, ...aliases],
    nextActions: [
      { label: "Create a blog SEO pack", href: "/tools/blog-seo-pack", description: "Turn the result into SEO metadata, schema, and share copy." },
      { label: "Create pro image prompts", href: "/tools/pro-image-brief-for-blog", description: "Plan supporting blog visuals for the content." },
    ],
    inputs,
  };
}

export const blogBatchTools: PublicBlogBatchTool[] = [
  ...(creativeBatchTools as PublicBlogBatchTool[]),
  ...(emailBatchTools as PublicBlogBatchTool[]),
  ...(emailCopyBatchTools as PublicBlogBatchTool[]),
  ...(salesCopyBatchTools as PublicBlogBatchTool[]),
  ...(seoUtilityBatchTools as PublicBlogBatchTool[]),
  ...(seoCompletionBatchTools as PublicBlogBatchTool[]),
  ...(emailEcommerceBatchTools as PublicBlogBatchTool[]),
  ...(socialCompletionBatchTools as PublicBlogBatchTool[]),
  ...(youtubeCompletionBatchTools as PublicBlogBatchTool[]),
  ...(adCopyBatchTools as PublicBlogBatchTool[]),
  tool("blog-section-writer", "Blog Section Writer", "Write a polished blog section from a heading, outline, or short brief.", "🧱", 3, [
    { id: "section_heading", label: "Section Heading", type: "text", placeholder: "e.g., How AI saves time for small teams", required: true },
    { id: "section_brief", label: "Section Brief / Notes", type: "textarea", placeholder: "Describe what this section should cover.", required: true },
    { id: "section_length", label: "Section Length", type: "select", required: true, options: sectionLengthOptions },
    ...commonInputs("Optional Full Article Context").slice(1),
  ]),
  tool("comparison-blog-writer", "Comparison Blog Writer", "Create comparison-style blog articles with pros, cons, tables, and recommendations.", "⚖️", 5, [
    { id: "comparison_topic", label: "Comparison Topic", type: "text", placeholder: "e.g., Notion vs ClickUp for small teams", required: true },
    { id: "items_to_compare", label: "Items to Compare", type: "textarea", placeholder: "List the products, options, tools, ideas, or approaches being compared.", required: true },
    { id: "comparison_criteria", label: "Comparison Criteria", type: "textarea", placeholder: "Optional: pricing, features, ease of use, audience fit, performance, pros/cons.", required: false },
    ...commonInputs("Optional Context / Source Notes").slice(1),
  ]),
  tool("blog-to-social-posts", "Blog to Social Posts", "Turn a blog post into platform-ready social posts, hooks, and captions.", "📣", 3, [
    ...commonInputs("Blog Post / Article"),
    { id: "platform", label: "Platform", type: "select", required: true, options: socialPlatformOptions },
    { id: "post_count", label: "How Many Posts?", type: "select", required: true, options: outputCountOptions },
  ]),
  tool("blog-to-email", "Blog to Email", "Convert a blog post into newsletter, promotional, or nurture email copy.", "✉️", 3, [
    ...commonInputs("Blog Post / Article"),
    { id: "email_type", label: "Email Type", type: "select", required: true, options: emailTypeOptions },
    { id: "email_count", label: "How Many Emails?", type: "select", required: true, options: outputCountOptions },
  ]),
  tool("blog-to-reels-script", "Blog to Reels Script", "Turn a blog post into short-form Reels or Shorts scripts with hooks and scene notes.", "🎬", 3, [
    ...commonInputs("Blog Post / Article"),
    { id: "script_length", label: "Script Length", type: "select", required: true, options: scriptLengthOptions },
    { id: "script_count", label: "How Many Scripts?", type: "select", required: true, options: outputCountOptions },
  ]),
  tool("blog-to-youtube-script", "Blog to YouTube Script", "Convert a blog post into a YouTube script with intro, sections, transitions, and CTA.", "▶️", 4, [
    ...commonInputs("Blog Post / Article"),
    { id: "script_length", label: "Script Length", type: "select", required: true, options: scriptLengthOptions },
    { id: "video_style", label: "Video Style", type: "select", required: true, options: ["Educational", "Explainer", "Tutorial", "Commentary", "Storytelling", "Listicle"] },
  ]),
  tool("youtube-video-to-blog-post", "YouTube Video to Blog Post", "Turn a pasted transcript, YouTube captions, or uploaded audio/video into a polished blog post.", "🎥", 4, transcriptBlogInputs("Video Transcript / Source Notes"), ["youtube-to-blog-post", "video-to-blog-post", "youtube-video-to-article"]),
];
