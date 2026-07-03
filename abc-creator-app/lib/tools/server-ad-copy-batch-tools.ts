type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium advertising rules:
- Use only the user's supplied product/service, audience, objective, selected ad pattern, pain point, benefit, offer, funnel stage, platform, tone, reference notes, must-include, and avoid fields as the source of truth.
- If the user selects Auto-pick strongest pattern, choose the most suitable pattern and explain why.
- If the user pastes reference ad or swipe notes, use them for structure inspiration only. Do not copy the wording, claims, names, or exact creative.
- Do not invent product facts, prices, discounts, deadlines, guarantees, testimonials, reviews, customer results, certifications, platform approvals, CTR, ROAS, conversions, revenue, targeting performance, or compliance guarantees.
- Do not claim live ad-platform access, live search/auction data, competitor crawling, policy review, targeting validation, or analytics unless the user pasted that evidence.
- Build premium direct-response copy using the selected pattern, but keep it truthful, specific, non-spammy, and non-manipulative.
- Add A/B labels, angle rationale, landing-page match notes, creative direction, proof/claim validation, and platform risk notes where useful.
- If evidence is missing, use placeholders such as [verify proof], [insert real proof], [confirm discount], [add landing page URL], or [manual policy check needed].
- Use clean Markdown with useful tables and copy-ready sections.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 4000 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 5000 };
const patternField: ToolFieldRule = { id: "ad_pattern", label: "Ad style / winning pattern", required: true, minLength: 2, maxLength: 200 };
const referenceField: ToolFieldRule = { id: "reference_ad_notes", label: "Reference ad / swipe notes", required: false, maxLength: 10000 };

function adFields(): ToolFieldRule[] {
  return [
    { id: "product_or_service", label: "Product / service", required: true, minLength: 20, maxLength: 14000 },
    { id: "target_audience", label: "Target audience", required: true, minLength: 2, maxLength: 160 },
    { id: "campaign_objective", label: "Campaign objective", required: true, minLength: 2, maxLength: 160 },
    patternField,
    { id: "pain_point", label: "Pain point / desire", required: true, minLength: 5, maxLength: 5000 },
    { id: "key_benefit", label: "Key benefit", required: true, minLength: 5, maxLength: 5000 },
    { id: "offer", label: "Offer / CTA", required: false, maxLength: 1000 },
    { id: "funnel_stage", label: "Funnel stage", required: true, minLength: 2, maxLength: 160 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    { id: "variation_count", label: "Variation count", required: true, minLength: 2, maxLength: 80 },
    referenceField,
    mustField,
    avoidField,
    languageField,
  ];
}

function scriptFields(): ToolFieldRule[] {
  return [
    { id: "product_or_service", label: "Product / service", required: true, minLength: 20, maxLength: 14000 },
    { id: "target_audience", label: "Target audience", required: true, minLength: 2, maxLength: 160 },
    { id: "campaign_objective", label: "Campaign objective", required: true, minLength: 2, maxLength: 160 },
    { id: "video_length", label: "Ad length", required: true, minLength: 2, maxLength: 80 },
    { id: "script_style", label: "Script style", required: true, minLength: 2, maxLength: 160 },
    patternField,
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    referenceField,
    mustField,
    avoidField,
    languageField,
  ];
}

const adGuide = "Return Markdown with: # Ad Copy Pack; ## Selected Pattern and Why; ## Campaign Strategy; ## Audience Pain Point; ## Angle Table; ## Ad Variations with Primary Text, Headline, Description/Caption, CTA, Creative Direction, A/B Label; ## Best Pick; ## Landing Page Match Notes; ## Proof/Claim Validation; ## Platform Risk Notes.";

export const serverAdCopyBatchTools: Record<string, ServerPrompt> = {
  "facebook-ad-copy": p("Facebook Ad Copy", 4, adFields(), "Create Meta/Facebook ad copy with primary text, headlines, descriptions, CTA options, A/B angles, creative direction, and platform notes.", adGuide),
  "google-ad-copy": p("Google Ad Copy", 4, adFields(), "Generate Google Search ad copy with responsive-search-ad style headlines, descriptions, keyword intent alignment, and landing-page match notes.", "Return Markdown with: # Google Ad Copy Pack; ## Selected Pattern and Why; ## Campaign Strategy; ## Search Intent Map; ## RSA Headlines; ## Descriptions; ## Keyword/Query Alignment; ## Extensions/Assets Ideas; ## Negative Keyword Ideas; ## Best Combinations; ## Landing Page Match Notes; ## Verification Notes."),
  "google-ads-pro": p("Google Ads Pro", 5, [...adFields(), { id: "keywords_or_queries", label: "Keywords / search queries", required: false, maxLength: 8000 }, { id: "competitor_or_serp_notes", label: "Competitor / SERP notes", required: false, maxLength: 10000 }], "Build a premium Google Ads campaign copy pack with RSA assets, keyword groups, negatives, extensions, landing page alignment, and test plan from supplied data only.", "Return Markdown with: # Google Ads Pro Pack; ## Selected Pattern and Why; ## Campaign Architecture; ## Ad Groups; ## RSA Headlines; ## Descriptions; ## Asset Ideas; ## Keyword Groups; ## Negative Keywords; ## A/B Test Plan; ## Landing Page Match Checklist; ## Verification Notes."),
  "instagram-ad-copy": p("Instagram Ad Copy", 4, adFields(), "Write Instagram ad copy with strong opening hooks, captions, headlines, creative direction, CTAs, and A/B variants.", adGuide),
  "tiktok-ads": p("TikTok Ads", 4, adFields(), "Create TikTok ad copy and UGC-style ad concepts with hooks, captions, script ideas, CTA, and risk notes.", "Return Markdown with: # TikTok Ads Pack; ## Selected Pattern and Why; ## Strategy; ## Hook Bank; ## UGC/Caption Variations; ## Short Script Concepts; ## CTA Options; ## Creative Direction; ## Best Pick; ## Platform Risk Notes."),
  "linkedin-ad": p("LinkedIn Ad", 4, adFields(), "Create professional LinkedIn ad copy for B2B audiences with pain-point clarity, authority positioning, proof placeholders, CTA, and risk notes.", adGuide),
  "twitter-x-ads": p("Twitter/X Ads", 4, adFields(), "Generate concise Twitter/X ad copy with strong hooks, punchy variants, CTA options, and A/B test labels.", adGuide),
  "commercial-ad-script": p("Commercial Ad Script Generator", 5, scriptFields(), "Write premium commercial ad scripts with hook, scenes, voiceover, on-screen text, B-roll, CTA, and production notes.", "Return Markdown with: # Commercial Ad Script; ## Selected Pattern and Why; ## Strategy; ## Script Table with Time, Scene, Voiceover, On-Screen Text, Visual Direction, CTA; ## Short Alternate Hooks; ## Production Notes; ## Caption/Overlay Ideas; ## Platform Risk Notes."),
  "ad-hook-creator": p("Ad Hook Creator", 3, [
    { id: "product_or_service", label: "Product / service", required: true, minLength: 20, maxLength: 12000 },
    { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 160 },
    { id: "target_audience", label: "Target audience", required: true, minLength: 2, maxLength: 160 },
    { id: "funnel_stage", label: "Funnel stage", required: true, minLength: 2, maxLength: 160 },
    { id: "hook_count", label: "Hook count", required: true, minLength: 2, maxLength: 80 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 },
    avoidField,
    languageField,
  ], "Generate ad hooks by platform, funnel stage, pain point, desire, objection, and safe high-attention angle.", "Return Markdown with: # Ad Hook Bank; hook table with Hook, Angle, Funnel Stage, Platform Fit, Why It Works, Risk Note; ## Best Hooks; ## Hooks to Avoid."),
  "ad-copy-generator": p("Ad Copy Generator", 4, adFields(), "Create premium ad copy for any platform with angles, variants, headlines, CTAs, creative notes, and checks.", adGuide),
  "ad-targeting-helper": p("Ad Targeting Helper", 3, [
    { id: "product_or_service", label: "Product / service", required: true, minLength: 20, maxLength: 14000 },
    { id: "ideal_customer", label: "Ideal customer", required: true, minLength: 20, maxLength: 10000 },
    { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 160 },
    { id: "campaign_objective", label: "Campaign objective", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Create audience targeting ideas, persona segments, messaging angles, exclusions, and research notes without platform data claims.", "Return Markdown with: # Ad Targeting Helper; ## Audience Segments; ## Messaging Map; ## Interest/Keyword Ideas; ## Exclusions; ## Creative Angles; ## Testing Plan; ## Platform Notes."),
  "find-user-pain-point": p("Find User Pain Point", 3, [
    { id: "product_or_service", label: "Product / service", required: true, minLength: 20, maxLength: 14000 },
    { id: "target_audience", label: "Target audience", required: true, minLength: 2, maxLength: 160 },
    { id: "customer_evidence", label: "Customer evidence / notes", required: false, maxLength: 14000 },
    { id: "analysis_depth", label: "Depth", required: true, minLength: 2, maxLength: 160 },
    mustField,
    avoidField,
    languageField,
  ], "Identify customer pain points, desires, objections, trigger moments, and ad angles from supplied audience/product evidence only.", "Return Markdown with: # User Pain Point Analysis; ## Pain Point Table; ## Desire Map; ## Objection Map; ## Trigger Moments; ## Ad Angles; ## Hook Ideas; ## Claims/Proof Needed."),
};
