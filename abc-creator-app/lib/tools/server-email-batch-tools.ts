type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const coldEmailPrompt: ServerPrompt = {
  creditCost: 5,
  requiredInputs: [
    { id: "target_name", label: "Recipient name", required: true, minLength: 2, maxLength: 160 },
    { id: "target_role_company", label: "Recipient role / company", required: true, minLength: 2, maxLength: 250 },
    { id: "linkedin_profile_url", label: "LinkedIn profile URL", required: false, maxLength: 500 },
    { id: "recent_linkedin_posts", label: "LinkedIn profile / post notes", required: false, maxLength: 12000 },
    { id: "gmail_context", label: "Gmail / relationship notes", required: false, maxLength: 12000 },
    { id: "offer_context", label: "Context", required: true, minLength: 10, maxLength: 10000 },
    { id: "goal", label: "Goal", required: true, minLength: 2, maxLength: 160 },
    { id: "email_count", label: "Count", required: true, minLength: 2, maxLength: 80 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 4000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 }
  ],
  system: `You are ABC Creator's premium cold email specialist. Use only the user's supplied target details, pasted LinkedIn notes, pasted Gmail/relationship notes, offer context, goal, tone, and avoid fields. Do not claim you connected to LinkedIn or Gmail. Do not invent private details, job changes, relationships, email history, interests, metrics, testimonials, or proof. If personalization evidence is thin, write a clean relevant email and mark missing personalization as a note. Keep the email truthful, respectful, concise, professional, and ready to send.`,
  outputGuide: "Return Markdown with: final recommended email, subject line options, 2-3 alternate email versions if requested, personalization notes, missing-context notes, and follow-up suggestion."
};

export const serverEmailBatchTools: Record<string, ServerPrompt> = {
  "cold-email-personalizer": coldEmailPrompt,
  "professional-email-personalizer": coldEmailPrompt,
};
