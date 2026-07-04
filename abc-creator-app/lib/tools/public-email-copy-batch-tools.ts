type ToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type Tool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType: "text";
  aliases?: string[];
  inputs: ToolInput[];
};

const audienceOptions = ["Customers", "Leads", "Subscribers", "Founders", "Professionals", "Executives", "Students", "Community members"];
const coldAudienceOptions = ["Startup founders", "Agency owners", "E-commerce brands", "SaaS teams", "Local business owners", "HR / recruiters", "Marketing leaders", "Sales leaders", "Operations leaders", "Custom persona in context"];
const toneOptions = ["Warm professional", "Premium", "Friendly", "Concise executive", "Persuasive", "Founder voice", "Educational", "Luxury"];
const coldToneOptions = ["Warm professional", "Concise executive", "Founder-to-founder", "Helpful consultant", "Direct but respectful", "Premium B2B", "Friendly human", "Investor-style concise"];
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const countOptions = ["3 variations", "5 variations", "10 variations"];
const coldEmailLengthOptions = ["Very short", "Short", "Standard", "Detailed but concise"];
const coldEmailFrameworkOptions = ["Auto-pick best framework", "Problem → Value → CTA", "Observation → Insight → Offer", "Trigger event angle", "Pain point angle", "Social proof, supplied proof only", "Case-study style, supplied evidence only", "Soft networking opener", "Breakup email", "Follow-up sequence"];
const complianceOptions = ["Standard respectful outreach", "Include opt-out line", "B2B sales style", "Recruiting/networking style", "Partnership outreach style"];

function baseEmailInputs(contextLabel: string): ToolInput[] {
  return [
    { id: "context", label: contextLabel, type: "textarea", placeholder: "Describe the audience, offer, product, situation, relationship, and exact facts. The tool will not invent proof or claims.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "goal", label: "Email Goal", type: "text", placeholder: "e.g., get a reply, announce launch, welcome user, book a call, educate subscribers", required: true },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "email_count", label: "How Many Options?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: offer, CTA, product facts, deadline, link text, proof, benefits, or brand phrases.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: words, claims, pressure tactics, promises, industries, or sensitive topics to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function coldEmailInputs(): ToolInput[] {
  return [
    { id: "offer", label: "Offer / Service", type: "textarea", placeholder: "Describe what you offer, who it helps, verified proof, pricing only if real, limitations, and what makes it useful.", required: true },
    { id: "target_persona", label: "Target Persona", type: "select", required: true, options: coldAudienceOptions },
    { id: "recipient_context", label: "Recipient / Prospect Context", type: "textarea", placeholder: "Who is receiving this? Add industry, role, company type, trigger event, or personalization notes. Do not invent personal facts.", required: true },
    { id: "pain_point", label: "Pain Point / Desire", type: "textarea", placeholder: "The real problem, desire, objection, or business outcome the email should speak to.", required: true },
    { id: "email_goal", label: "Email Goal", type: "text", placeholder: "e.g., book a call, get a reply, start a partnership conversation, invite to demo", required: true },
    { id: "cta", label: "CTA", type: "text", placeholder: "e.g., Open to a 10-min call next week? Reply yes and I’ll send details.", required: true },
    { id: "framework", label: "Cold Email Framework", type: "select", required: true, options: coldEmailFrameworkOptions },
    { id: "email_length", label: "Email Length", type: "select", required: true, options: coldEmailLengthOptions },
    { id: "email_count", label: "How Many Variations?", type: "select", required: true, options: countOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: coldToneOptions },
    { id: "personalization_notes", label: "Personalization Notes", type: "textarea", placeholder: "Optional: pasted LinkedIn/about page notes, trigger event, mutual context, company facts, or allowed personalization tokens.", required: false },
    { id: "proof_or_assets", label: "Proof / Assets", type: "textarea", placeholder: "Optional: verified case studies, numbers, testimonials, client types, portfolio links, or proof placeholders. If absent, output will use [insert verified proof].", required: false },
    { id: "compliance_mode", label: "Compliance / Opt-Out Style", type: "select", required: true, options: complianceOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: exact CTA, offer detail, product facts, positioning, signature line, link text, or segment notes.", required: false },
    { id: "avoid", label: "Avoid / Spam Risk Notes", type: "textarea", placeholder: "Optional: phrases, claims, fake urgency, overused cold email lines, industries, or promises to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: ToolInput[], aliases: string[] = []): Tool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: "email",
    detailEmoji: emoji,
    category: "Email Tools",
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases],
    inputs,
  };
}

export const emailCopyBatchTools: Tool[] = [
  tool("subject-line-generator", "Subject Line Generator", "Create premium email subject lines and preview text options for higher-quality opens.", "✉️", 2, [
    { id: "email_context", label: "Email Context", type: "textarea", placeholder: "Describe the email, audience, offer, product, or announcement.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "subject_count", label: "How Many Subject Lines?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: product, benefit, event, offer, keyword, or deadline.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: spam words, clickbait, fake urgency, claims, or terms to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["email-subject-line-generator", "subject-line-writer"]),
  tool("cold-email-generator", "Cold Email Generator", "Create premium cold outreach with subject lines, preview text, body variants, CTA, personalization tokens, and spam-risk notes.", "🧊", 5, coldEmailInputs(), ["cold-email-writer", "cold-email-tool", "cold-email-copy-generator", "outreach-email-generator", "cold-outreach-generator"]),
  tool("email-newsletter-generator", "Email Newsletter Generator", "Write a polished newsletter with subject lines, intro, sections, CTA, and closing.", "📰", 3, baseEmailInputs("Newsletter Brief / Source Notes"), ["newsletter-generator", "newsletter-email-generator"]),
  tool("follow-up-email-generator", "Follow-Up Email Generator", "Generate respectful follow-up emails for sales, networking, hiring, client work, and support.", "🔁", 2, baseEmailInputs("Follow-Up Context"), ["email-follow-up-generator"]),
  tool("sales-email-generator", "Sales Email Generator", "Draft premium sales emails with strong relevance, value, CTA, and non-spammy persuasion.", "💼", 3, baseEmailInputs("Sales Email Context"), ["sales-email-writer"]),
  tool("welcome-email-generator", "Welcome Email Generator", "Create onboarding and welcome emails for products, newsletters, communities, and services.", "👋", 2, baseEmailInputs("Welcome Email Context"), ["welcome-email-writer"]),
  tool("product-launch-email-generator", "Product Launch Email Generator", "Write polished launch emails with positioning, benefits, CTA, and launch announcement flow.", "🚀", 3, baseEmailInputs("Product Launch Context"), ["launch-email-generator"]),
];
