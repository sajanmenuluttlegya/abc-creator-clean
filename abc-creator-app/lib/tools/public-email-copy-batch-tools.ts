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
const toneOptions = ["Warm professional", "Premium", "Friendly", "Concise executive", "Persuasive", "Founder voice", "Educational", "Luxury"];
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const countOptions = ["3 variations", "5 variations", "10 variations"];

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
  tool("email-newsletter-generator", "Email Newsletter Generator", "Write a polished newsletter with subject lines, intro, sections, CTA, and closing.", "📰", 3, baseEmailInputs("Newsletter Brief / Source Notes"), ["newsletter-generator", "newsletter-email-generator"]),
  tool("follow-up-email-generator", "Follow-Up Email Generator", "Generate respectful follow-up emails for sales, networking, hiring, client work, and support.", "🔁", 2, baseEmailInputs("Follow-Up Context"), ["email-follow-up-generator"]),
  tool("sales-email-generator", "Sales Email Generator", "Draft premium sales emails with strong relevance, value, CTA, and non-spammy persuasion.", "💼", 3, baseEmailInputs("Sales Email Context"), ["sales-email-writer"]),
  tool("welcome-email-generator", "Welcome Email Generator", "Create onboarding and welcome emails for products, newsletters, communities, and services.", "👋", 2, baseEmailInputs("Welcome Email Context"), ["welcome-email-writer"]),
  tool("product-launch-email-generator", "Product Launch Email Generator", "Write polished launch emails with positioning, benefits, CTA, and launch announcement flow.", "🚀", 3, baseEmailInputs("Product Launch Context"), ["launch-email-generator"]),
];
