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

const audienceOptions = ["Customers", "Leads", "Founders", "Professionals", "Executives", "Small business owners", "Creators", "Local buyers", "General audience"];
const toneOptions = ["Premium", "Professional", "Friendly", "Bold", "Luxury", "Direct", "Consultative", "Simple and clear"];
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const countOptions = ["3 variations", "5 variations", "10 variations"];

function baseInputs(mainLabel: string): ToolInput[] {
  return [
    { id: "brief", label: mainLabel, type: "textarea", placeholder: "Describe the product, service, audience, offer, problem, benefit, proof, and context. The tool will not invent proof or claims.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Options?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: benefits, CTA, features, objections, proof, differentiators, price, or brand phrases.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, pressure tactics, guarantees, competitors, words, or sensitive topics to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, category: string, emoji: string, credits: number, inputs: ToolInput[], aliases: string[] = []): Tool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: category === "Business Tools" ? "business" : "megaphone",
    detailEmoji: emoji,
    category,
    displayCreditCost: credits,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases],
    inputs,
  };
}

export const salesCopyBatchTools: Tool[] = [
  tool("value-proposition-generator", "Value Proposition Generator", "Create premium value propositions that clearly explain who it helps, what it solves, and why it matters.", "Business Tools", "💎", 2, baseInputs("Product / Service / Brand Brief"), ["value-prop-generator"]),
  tool("pain-point-generator", "Pain Point Generator", "Identify sharp customer pain points, emotional triggers, and messaging angles from your audience context.", "Business Tools", "🎯", 2, baseInputs("Audience / Product Context"), ["customer-pain-point-generator"]),
  tool("feature-to-benefit-converter", "Feature to Benefit Converter", "Turn product features into clear benefits, outcomes, proof points, and customer-facing copy.", "Business Tools", "🔄", 2, baseInputs("Feature List / Product Context"), ["benefit-converter", "features-to-benefits"]),
  tool("offer-generator", "Offer Generator", "Build compelling offers with value stack, CTA, urgency notes, risk reversal, and positioning.", "Business Tools", "🎁", 3, baseInputs("Offer / Product / Service Brief"), ["irresistible-offer-generator"]),
  tool("aida-copy-generator", "AIDA Copy Generator", "Write premium copy using Attention, Interest, Desire, and Action structure.", "Ad Copy", "🧲", 2, baseInputs("Offer / Product / Campaign Brief"), ["aida-generator", "aida-copywriting-tool"]),
  tool("pas-copy-generator", "PAS Copy Generator", "Write persuasive Problem, Agitation, Solution copy without fake pressure or unsupported claims.", "Ad Copy", "⚡", 2, baseInputs("Problem / Product / Offer Brief"), ["pas-generator", "problem-agitate-solution-generator"]),
  tool("objection-handler-generator", "Objection Handler Generator", "Generate professional responses to customer objections with proof placeholders and calm persuasion.", "Ad Copy", "🛡️", 3, baseInputs("Objections / Product Context"), ["sales-objection-handler"]),
  tool("sales-pitch-generator", "Sales Pitch Generator", "Create concise, professional sales pitches for calls, DMs, presentations, and outreach.", "Ad Copy", "📢", 3, baseInputs("Sales Pitch Context"), ["pitch-generator", "sales-script-pitch-generator"]),
  tool("usp-generator", "USP Generator", "Create unique selling propositions that clarify differentiation and customer value.", "Business Tools", "🏆", 2, baseInputs("Brand / Product / Competitor Context"), ["unique-selling-proposition-generator"]),
  tool("product-angle-generator", "Product Angle Generator", "Generate fresh product angles, hooks, benefits, and positioning ideas for marketing campaigns.", "Business Tools", "🧭", 2, baseInputs("Product / Campaign Context"), ["marketing-angle-generator"]),
];
