type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium email rules:
- Use only the user's supplied context, audience, goal, tone, language, must-include, and avoid notes.
- Make the output professional, polished, concise, useful, and ready to copy.
- Do not invent proof, claims, prices, testimonials, prior relationship, private data, statistics, guarantees, or urgency.
- Avoid spammy pressure, deceptive personalization, fake scarcity, clickbait subject lines, and unsupported promises.
- For cold outreach, never pretend there is a prior relationship, never invent a referral or trigger event, and never fabricate personal/company details.
- Use placeholders such as [insert verified proof] when a detail needs confirmation.
- Add opt-out/compliance reminders where marketing or cold outreach context applies.`;

const common: ToolFieldRule[] = [
  { id: "context", label: "Context", required: true, minLength: 10, maxLength: 10000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "goal", label: "Email goal", required: true, minLength: 2, maxLength: 180 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
  { id: "email_count", label: "Email count", required: true, minLength: 2, maxLength: 80 },
  { id: "must_include", label: "Must include", required: false, maxLength: 3000 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 3000 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

const coldEmailFields: ToolFieldRule[] = [
  { id: "offer", label: "Offer / service", required: true, minLength: 20, maxLength: 12000 },
  { id: "target_persona", label: "Target persona", required: true, minLength: 2, maxLength: 180 },
  { id: "recipient_context", label: "Recipient / prospect context", required: true, minLength: 15, maxLength: 12000 },
  { id: "pain_point", label: "Pain point / desire", required: true, minLength: 8, maxLength: 6000 },
  { id: "email_goal", label: "Email goal", required: true, minLength: 2, maxLength: 180 },
  { id: "cta", label: "CTA", required: true, minLength: 5, maxLength: 1000 },
  { id: "framework", label: "Cold email framework", required: true, minLength: 2, maxLength: 180 },
  { id: "email_length", label: "Email length", required: true, minLength: 2, maxLength: 120 },
  { id: "email_count", label: "Email count", required: true, minLength: 2, maxLength: 80 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
  { id: "personalization_notes", label: "Personalization notes", required: false, maxLength: 10000 },
  { id: "proof_or_assets", label: "Proof / assets", required: false, maxLength: 10000 },
  { id: "compliance_mode", label: "Compliance / opt-out style", required: true, minLength: 2, maxLength: 180 },
  { id: "must_include", label: "Must include", required: false, maxLength: 4000 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 4000 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

export const serverEmailCopyBatchTools: Record<string, ServerPrompt> = {
  "subject-line-generator": p("Subject Line Generator", 2, [
    { id: "email_context", label: "Email context", required: true, minLength: 10, maxLength: 8000 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "subject_count", label: "Subject count", required: true, minLength: 2, maxLength: 80 },
    { id: "must_include", label: "Must include", required: false, maxLength: 2000 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2000 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Write premium email subject lines and preview text options based on the supplied email context.", "Return Markdown with: # Subject Line Options; a table with Subject Line, Preview Text, Angle, Best Use; ## Top 3 Picks; ## Spam/Compliance Notes."),
  "cold-email-generator": p("Cold Email Generator", 5, coldEmailFields, "Generate premium cold outreach from the user's offer, target persona, recipient context, pain point, CTA, proof notes, selected framework, compliance mode, and constraints. The output must be personalized only from supplied notes and must not invent prior relationship, proof, or recipient facts.", "Return Markdown with: # Cold Email Generator; ## Strategy Snapshot; ## Personalization Inputs Used; ## Subject Line + Preview Text Options; ## Cold Email Variations with Subject, Preview Line, Body, CTA, Why It Works, Spam-Risk Note; ## Best Pick; ## Optional Follow-Up Sequence; ## Personalization Tokens; ## Deliverability / Compliance Notes; ## Missing Proof To Verify."),
  "email-newsletter-generator": p("Email Newsletter Generator", 3, common, "Write a polished email newsletter with useful structure, subject lines, intro, sections, CTA, and closing.", "Return Markdown with: # Email Newsletter; ## Subject Options; ## Preview Line; ## Email Body; ## CTA; ## Notes."),
  "follow-up-email-generator": p("Follow-Up Email Generator", 2, common, "Write respectful follow-up email options that fit the relationship and goal without pressure or fake urgency.", "Return Markdown with: # Follow-Up Email Options; for each option include Subject, Preview Line, Body, CTA, and When to Use."),
  "sales-email-generator": p("Sales Email Generator", 3, common, "Write premium sales email drafts with clear relevance, value, credibility placeholders, and a natural CTA.", "Return Markdown with: # Sales Email Drafts; for each option include Subject, Preview Line, Body, CTA, and Personalization/Proof Notes."),
  "welcome-email-generator": p("Welcome Email Generator", 2, common, "Write warm onboarding or welcome emails that set expectations, guide next steps, and feel premium.", "Return Markdown with: # Welcome Email; ## Subject Options; ## Email Body; ## Next Steps; ## Optional Variations."),
  "product-launch-email-generator": p("Product Launch Email Generator", 3, common, "Write polished product launch email drafts with positioning, benefits, CTA, and launch announcement flow.", "Return Markdown with: # Product Launch Email Drafts; ## Subject Options; ## Main Email; ## Short Version; ## CTA; ## Launch Notes."),
};
