type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

export const serverEmailBatchTools: Record<string, ServerPrompt> = {
  "professional-email-personalizer": {
    creditCost: 4,
    requiredInputs: [
      { id: "source_mode", label: "Source mode", required: true, minLength: 2, maxLength: 180 },
      { id: "target_name", label: "Recipient name", required: true, minLength: 2, maxLength: 160 },
      { id: "target_role_company", label: "Recipient role / company", required: true, minLength: 2, maxLength: 250 },
      { id: "offer_context", label: "Context", required: true, minLength: 10, maxLength: 10000 },
      { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
      { id: "email_count", label: "Count", required: true, minLength: 2, maxLength: 80 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
    ],
    system: `You are ABC Creator's premium business writing specialist. Use only the user's supplied context. Keep the output truthful, respectful, concise, useful, and professional. Do not invent facts or private details.`,
    outputGuide: "Return Markdown with a polished final version, useful alternatives, and concise notes."
  }
};
