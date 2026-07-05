import { getServerPrompt as getBaseServerPrompt, validateToolInputs as validateBaseToolInputs } from "./server-prompts";
import { serverSocialTools } from "./server-social-tools";
import { serverSocialCompletionBatchTools } from "./server-social-completion-batch-tools";
import { serverGeneralTools } from "./server-general-tools";
import { serverPlatformTools } from "./server-platform-tools";
import { serverYouTubeCompletionBatchTools } from "./server-youtube-completion-batch-tools";
import { serverAdCopyBatchTools } from "./server-ad-copy-batch-tools";
import { serverAiPromptBatchTools } from "./server-ai-prompt-batch-tools";
import { serverSummarizerUtilityBatchTools } from "./server-summarizer-utility-batch-tools";
import { serverCampaignTools } from "./server-campaign-tools";
import { serverBlogBatchTools } from "./server-blog-batch-tools";
import { serverSeoBatchTools } from "./server-seo-batch-tools";
import { serverSeoUtilityBatchTools } from "./server-seo-utility-batch-tools";
import { serverSeoCompletionBatchTools } from "./server-seo-completion-batch-tools";
import { serverCreativeCopyBatchTools } from "./server-creative-copy-batch-tools";
import { serverShortStoryBatchTools } from "./server-short-story-batch-tools";
import { serverEmailBatchTools } from "./server-email-batch-tools";
import { serverEmailCopyBatchTools } from "./server-email-copy-batch-tools";
import { serverEmailEcommerceBatchTools } from "./server-email-ecommerce-batch-tools";
import { serverSalesCopyBatchTools } from "./server-sales-copy-batch-tools";
import { serverWritingBatchTools } from "./server-writing-batch-tools";

type ValidationResult = { ok: true } | { ok: false; field?: string; error: string };
type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type RegisteredServerTool = { requiredInputs: ToolFieldRule[] };
type ServerPrompt = RegisteredServerTool & { system: string; outputGuide: string; creditCost: number };

const blogImageTools = new Set(["blog-content", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "quick-1-click-blog-post", "comparison-blog-writer", "youtube-video-to-blog-post"]);

const strictBlogVisualRules = `

Strict ABC blog visual rules:
- For blog post generators with images enabled, include 2-5 inline image blocks according to article length and usefulness: Short/standard = 2, Long = 3, Very long = 4, Premium/Authority = 5 maximum. If the user explicitly selected No images, output zero image blocks. If the user explicitly selected Hero image only, output only one hero image.
- Never place two images or visual blocks together. Always put a meaningful normal paragraph between any image, table, chart, graph, flowchart, diagram, or other visual block.
- Attach every image to the exact relevant section. Do not group images at the top or bottom, and do not repeat generic stock-style subjects.
- Graphs, flowcharts, data visuals, lineage, maps, processes, comparisons, and relationships must use the already-supported abc-diagram JSON blocks when the section needs a visual representation. Use image blocks only for textless editorial illustrations.
- For each image block, use the exact structure: ### Image N: Section Image for <section title>, then Placement, Prompt, Alt Text, and Caption.`;

function getEmailTool(toolSlug: string) {
  return serverEmailBatchTools[toolSlug] || serverEmailCopyBatchTools[toolSlug] || serverEmailEcommerceBatchTools[toolSlug] || (toolSlug.includes("email") ? serverEmailBatchTools["professional-email-personalizer"] : undefined);
}

function getRegisteredTool(toolSlug: string): RegisteredServerTool | undefined {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug];
}

function validateRegisteredTool(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  const tool = getRegisteredTool(toolSlug);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolSlug}` };

  for (const field of tool.requiredInputs) {
    const cleaned = typeof inputs[field.id] === "string" ? inputs[field.id].trim() : "";
    const minLength = field.minLength ?? 1;
    if (field.required && cleaned.length < minLength) return { ok: false, field: field.id, error: `${field.label} is required and must be at least ${minLength} characters.` };
  }

  for (const [field, value] of Object.entries(inputs)) {
    if (typeof value !== "string") return { ok: false, field, error: "Invalid input value." };
    const rule = tool.requiredInputs.find((item) => item.id === field);
    const maxLength = rule?.maxLength ?? 12000;
    if (value.length > maxLength) return { ok: false, field, error: `${rule?.label || field} is too long.` };
  }

  return { ok: true };
}

function getRawServerPrompt(toolSlug: string) {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug] || getBaseServerPrompt(toolSlug);
}

export function getServerPrompt(toolSlug: string) {
  const prompt = getRawServerPrompt(toolSlug) as ServerPrompt | undefined;
  if (!prompt || !blogImageTools.has(toolSlug)) return prompt;
  return {
    ...prompt,
    system: `${prompt.system}${strictBlogVisualRules}`,
    outputGuide: `${prompt.outputGuide} Enforce blog visual spacing: 2-5 inline image blocks when images are enabled, no two visuals together, and every image or diagram must sit beside the section it supports.`,
  };
}

export function validateToolInputs(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  return getRegisteredTool(toolSlug) ? validateRegisteredTool(toolSlug, inputs) : validateBaseToolInputs(toolSlug, inputs);
}
