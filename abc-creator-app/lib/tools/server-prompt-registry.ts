import { getServerPrompt as getBaseServerPrompt, validateToolInputs as validateBaseToolInputs } from "./server-prompts";
import { serverSocialTools } from "./server-social-tools";

type ValidationResult = { ok: true } | { ok: false; field?: string; error: string };

function validateSocialTool(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  const tool = serverSocialTools[toolSlug];
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
  return serverSocialTools[toolSlug] || getBaseServerPrompt(toolSlug);
}

export function validateToolInputs(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  return serverSocialTools[toolSlug] ? validateSocialTool(toolSlug, inputs) : validateBaseToolInputs(toolSlug, inputs);
}
