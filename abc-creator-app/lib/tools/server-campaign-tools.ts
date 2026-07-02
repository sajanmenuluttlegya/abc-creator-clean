type ToolFieldRule = {
  id: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

type ServerPrompt = {
  system: string;
  outputGuide: string;
  creditCost: number;
  requiredInputs: ToolFieldRule[];
};

const campaignRules = `
Campaign copy rules:
- Generate only text output for the requested tool.
- Match the user's selected language, audience, platform, tone, goal, and brief.
- Do not add output image insertion instructions.
- Keep copy specific, useful, and ready to paste.
- Do not claim guaranteed results, live platform performance, ranking, revenue, or analytics.
- Do not invent proof, prices, awards, certifications, metrics, or customer results.
- Avoid competitor attacks, misleading promises, fake urgency, and unsupported claims.
- Use clean Markdown with clear ## sections and ### item headings.`;

const commonFields: ToolFieldRule[] = [
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 140 },
  { id: "goal", label: "Campaign goal", required: true, minLength: 2, maxLength: 120 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 1400 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

export const serverCampaignTools: Record<string, ServerPrompt> = {
  "google-ads-pro": {
    creditCost: 4,
    requiredInputs: [
      { id: "product", label: "Product / service", required: true, minLength: 2, maxLength: 180 },
      { id: "brief", label: "Campaign brief", required: true, minLength: 10, maxLength: 3000 },
      { id: "keywords", label: "Keywords", required: false, maxLength: 1000 },
      { id: "variation_count", label: "Variation count", required: true, minLength: 2, maxLength: 80 },
      ...commonFields,
    ],
    system: `You are ABC Creator's premium Google campaign copywriter.${campaignRules}

Google copy rules:
- Create headline and description variations that fit search intent.
- Include keyword themes only from the user's supplied context.
- Keep copy clear, compliant, and landing-page aligned.`,
    outputGuide: "Return Markdown with: # Google Ads Copy Package; ## Campaign Strategy; ## Responsive Search Ad Variations; ## Headlines; ## Descriptions; ## Extension Ideas; ## Keyword Themes; ## Best Pick; ## Review Notes.",
  },
  "linkedin-ad": {
    creditCost: 4,
    requiredInputs: [
      { id: "offer", label: "Offer", required: true, minLength: 2, maxLength: 180 },
      { id: "brief", label: "Campaign brief", required: true, minLength: 10, maxLength: 3000 },
      { id: "variation_count", label: "Variation count", required: true, minLength: 2, maxLength: 80 },
      { id: "cta", label: "CTA", required: false, maxLength: 180 },
      ...commonFields,
    ],
    system: `You are ABC Creator's premium LinkedIn campaign copywriter.${campaignRules}

LinkedIn copy rules:
- Keep copy credible, professional, and useful for B2B or career-focused audiences.
- Include variations for short post copy, sponsored content, and CTA angles when useful.`,
    outputGuide: "Return Markdown with: # LinkedIn Ad Copy Package; ## Campaign Strategy; ## Ad Variations; ## Hook Options; ## CTA Options; ## Best Pick; ## Review Notes.",
  },
  "tiktok-ads": {
    creditCost: 3,
    requiredInputs: [
      { id: "offer", label: "Product / offer", required: true, minLength: 2, maxLength: 180 },
      { id: "brief", label: "Campaign brief", required: true, minLength: 10, maxLength: 3000 },
      { id: "variation_count", label: "Variation count", required: true, minLength: 2, maxLength: 80 },
      { id: "creator_style", label: "Creator style", required: false, maxLength: 220 },
      ...commonFields,
    ],
    system: `You are ABC Creator's premium short-form campaign copywriter.${campaignRules}

TikTok copy rules:
- Write fast, native-feeling hooks and short scripts.
- Include creator-style concepts, caption ideas, and CTA lines.
- Keep every concept realistic and grounded in the brief.`,
    outputGuide: "Return Markdown with: # TikTok Ads Package; ## Concept Strategy; ## Ad Concepts; ## Hook Lines; ## Short Scripts; ## Caption Options; ## CTA Options; ## Best Pick.",
  },
  "twitter-ads": {
    creditCost: 2,
    requiredInputs: [
      { id: "offer", label: "Product / offer", required: true, minLength: 2, maxLength: 180 },
      { id: "brief", label: "Campaign brief", required: true, minLength: 10, maxLength: 3000 },
      { id: "variation_count", label: "Variation count", required: true, minLength: 2, maxLength: 80 },
      { id: "cta", label: "CTA", required: false, maxLength: 180 },
      ...commonFields,
    ],
    system: `You are ABC Creator's premium X/Twitter campaign copywriter.${campaignRules}

X/Twitter copy rules:
- Keep copy concise, punchy, and easy to test.
- Create multiple angles without overpromising.`,
    outputGuide: "Return Markdown with: # Twitter/X Ads Package; ## Campaign Strategy; ## Promoted Post Variations; ## Hook Options; ## CTA Options; ## Best Pick; ## Review Notes.",
  },
  "commercial-ad-script-generator": {
    creditCost: 5,
    requiredInputs: [
      { id: "brand_or_product", label: "Brand / product", required: true, minLength: 2, maxLength: 180 },
      { id: "brief", label: "Script brief", required: true, minLength: 10, maxLength: 3500 },
      { id: "script_length", label: "Script length", required: true, minLength: 2, maxLength: 80 },
      { id: "format", label: "Format", required: true, minLength: 2, maxLength: 120 },
      { id: "cta", label: "CTA", required: false, maxLength: 180 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 140 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1400 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium commercial script writer.${campaignRules}

Script rules:
- Write scripts with scene direction, voiceover, on-screen action, and CTA where useful.
- Match the selected format and length.
- Keep the script production-friendly and easy to adapt.`,
    outputGuide: "Return Markdown with: # Commercial Ad Script; ## Script Strategy; ## Main Script; ## Alternate Script Angles; ## Shot / Scene Notes; ## CTA Options; ## Review Notes.",
  },
  "ad-hook-creator": {
    creditCost: 2,
    requiredInputs: [
      { id: "offer", label: "Offer / product", required: true, minLength: 10, maxLength: 3000 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 140 },
      { id: "hook_style", label: "Hook style", required: true, minLength: 2, maxLength: 120 },
      { id: "hook_count", label: "Hook count", required: true, minLength: 2, maxLength: 80 },
      { id: "platform", label: "Platform / placement", required: false, maxLength: 160 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1400 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium campaign hook strategist.${campaignRules}

Hook rules:
- Create strong opening lines that are specific to the offer and audience.
- Group hooks by angle and make each one meaningfully different.
- Do not use false claims or exaggerated guarantees.`,
    outputGuide: "Return Markdown with: # Ad Hook Package; ## Hook Strategy; ## Hook Options grouped by angle; ## Best Hooks; ## How to Use Them; ## Review Notes. Return the requested number of hooks from hook_count.",
  },
};
