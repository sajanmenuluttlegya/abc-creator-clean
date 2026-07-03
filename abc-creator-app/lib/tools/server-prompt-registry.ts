import { getServerPrompt as getBaseServerPrompt, validateToolInputs as validateBaseToolInputs } from "./server-prompts";
import { serverSocialTools } from "./server-social-tools";
import { serverSocialCompletionBatchTools } from "./server-social-completion-batch-tools";
import { serverGeneralTools } from "./server-general-tools";
import { serverPlatformTools } from "./server-platform-tools";
import { serverYouTubeCompletionBatchTools } from "./server-youtube-completion-batch-tools";
import { serverAdCopyBatchTools } from "./server-ad-copy-batch-tools";
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

function getEmailTool(toolSlug: string) {
  return serverEmailBatchTools[toolSlug] || serverEmailCopyBatchTools[toolSlug] || serverEmailEcommerceBatchTools[toolSlug] || (toolSlug.includes("email") ? serverEmailBatchTools["professional-email-personalizer"] : undefined);
}

function getRegisteredTool(toolSlug: string): RegisteredServerTool | undefined {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug];
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

export function getServerPrompt(toolSlug: string) {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug] || getBaseServerPrompt(toolSlug);
}

export function validateToolInputs(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  return getRegisteredTool(toolSlug) ? validateRegisteredTool(toolSlug, inputs) : validateBaseToolInputs(toolSlug, inputs);
}
