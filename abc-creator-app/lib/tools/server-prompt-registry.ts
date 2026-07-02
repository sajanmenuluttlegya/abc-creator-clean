import { getServerPrompt as getBaseServerPrompt, validateToolInputs as validateBaseToolInputs } from "./server-prompts";
import { serverSocialTools } from "./server-social-tools";
import { serverGeneralTools } from "./server-general-tools";
import { serverPlatformTools } from "./server-platform-tools";
import { serverCampaignTools } from "./server-campaign-tools";

type ValidationResult = { ok: true } | { ok: false; field?: string; error: string };

type ToolFieldRule = {
  id: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

type RegisteredServerTool = {
  requiredInputs: ToolFieldRule[];
};

function getRegisteredTool(toolSlug: string): RegisteredServerTool | undefined {
  return serverSocialTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverCampaignTools[toolSlug];
}

function validateRegisteredTool(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  const tool = getRegisteredTool(toolSlug);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolSlug}` };

  for (const field of tool.requiredInputs) {
    const value = inputs[field.id];
    const cleaned = typeof value === "string" ? value.trim() : "";
    const minLength = field.minLength ?? 1;

    if (field.required && cleaned.length < minLength) {
      return { ok: false, field: field.id, error: `${field.label} is required and must be at least ${minLength} characters.` };
    }
  }

  for (const [field, value] of Object.entries(inputs)) {
    if (typeof value !== "string") return { ok: false, field, error: "Invalid input value. Please submit text fields only." };
    const rule = tool.requiredInputs.find((item) => item.id === field);
    const maxLength = rule?.maxLength ?? 12000;
    if (value.length > maxLength) return { ok: false, field, error: `${rule?.label || field} is too long. Please shorten it and try again.` };
  }

  return { ok: true };
}

export function getServerPrompt(toolSlug: string) {
  return serverSocialTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverCampaignTools[toolSlug] || getBaseServerPrompt(toolSlug);
}

export function validateToolInputs(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  return getRegisteredTool(toolSlug) ? validateRegisteredTool(toolSlug, inputs) : validateBaseToolInputs(toolSlug, inputs);
}
