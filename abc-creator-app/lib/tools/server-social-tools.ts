type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const socialCommonRules = `
Social media rules:
- Generate ready-to-use text for the selected platform.
- Match the selected language, audience, tone, goal, source mode, and context.
- Use uploaded-image details only when an image is supplied.
- Do not invent visible details, pricing, results, credentials, offers, or claims.
- Keep hashtags relevant and non-spammy.
- Use clean Markdown with editable sections.`;

const bioCommonRules = `
Profile and bio rules:
- Do not claim a username, handle, domain, or page name is available unless an availability checker was used.
- Keep bios platform-native, concise, memorable, and easy to paste.
- Include CTA options only when useful or supplied by the user.
- Avoid unsupported awards, credentials, locations, guarantees, and metrics.
- Use clean Markdown with ## sections and ### item headings.`;

export const serverSocialTools: Record<string, ServerPrompt> = {
  "image-to-instagram-caption": {
    creditCost: 3,
    requiredInputs: [
      { id: "source_mode", label: "Caption source", required: true, minLength: 2, maxLength: 80 },
      { id: "image_data", label: "Uploaded image", required: false, maxLength: 6500000 },
      { id: "brand_name", label: "Brand / page name", required: false, maxLength: 160 },
      { id: "image_context", label: "Image / product context", required: false, maxLength: 3000 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "goal", label: "Post goal", required: true, minLength: 2, maxLength: 120 },
      { id: "tone", label: "Caption tone", required: true, minLength: 2, maxLength: 120 },
      { id: "caption_length", label: "Caption length", required: true, minLength: 2, maxLength: 120 },
      { id: "caption_count", label: "Caption count", required: true, minLength: 2, maxLength: 80 },
      { id: "hashtags", label: "Hashtags", required: true, minLength: 2, maxLength: 120 },
      { id: "emojis", label: "Emojis", required: true, minLength: 2, maxLength: 120 },
      { id: "cta", label: "CTA / next step", required: false, maxLength: 180 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
      { id: "avoid", label: "Words / claims to avoid", required: false, maxLength: 2000 },
    ],
    system: `You are ABC Creator's premium Instagram caption strategist.
${socialCommonRules}
Instagram caption rules:
- Ground image-mode captions in visible image details plus supplied context.
- For text-only mode, use the written context as the brief.
- Make captions native to Instagram and distinct from each other.
- Include useful angles such as story, benefit, community, soft CTA, direct CTA, and aesthetic/minimal when appropriate.
- Output clear sections for editing.`,
    outputGuide: "Return a premium Instagram caption package in Markdown: # Instagram Caption Package; ## Source Read; ## Caption Strategy; ## Caption Variations; ## Best Pick; ## CTA Variations; ## Hashtag Sets if requested; ## Alt Text or Suggested Visual Direction; ## Avoid / Verify Notes.",
  },
  "instagram-page-name-bio-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "brand_or_creator_name", label: "Brand / creator name", required: true, minLength: 2, maxLength: 140 },
      { id: "niche", label: "Niche / industry", required: true, minLength: 2, maxLength: 200 },
      { id: "variation_count", label: "Variations", required: true, minLength: 2, maxLength: 80 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "profile_goal", label: "Profile goal", required: true, minLength: 2, maxLength: 120 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "bio_style", label: "Bio style", required: true, minLength: 2, maxLength: 120 },
      { id: "keywords", label: "Keywords", required: false, maxLength: 300 },
      { id: "cta", label: "CTA / link direction", required: false, maxLength: 180 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
      { id: "avoid", label: "Words / claims to avoid", required: false, maxLength: 1200 },
    ],
    system: `You are ABC Creator's premium Instagram profile strategist.
${bioCommonRules}
Variation rules:
- Return exactly the selected number from variation_count: 1, 3, 5, or 10.
- Each variation must be a full profile package: page name, handle ideas, bio, CTA, vibe, positioning note, best use case, and why it works.
- Keep every variation distinct and platform-native.
- Clearly state that username availability was not checked.`,
    outputGuide: "Return Markdown: # Instagram Page Name & Bio Package; ## Profile Strategy; then exactly the selected number of sections named ### Variation 1, ### Variation 2, etc. Each variation must include Page Name, Handle Ideas, Bio, CTA, Vibe / Positioning Note, Best Use Case, and Why It Works. End with ## Best Pick and ## Verify Before Using.",
  },
  "social-media-bio-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "name_or_brand", label: "Name / brand", required: true, minLength: 2, maxLength: 140 },
      { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 80 },
      { id: "niche", label: "Niche / industry", required: true, minLength: 2, maxLength: 200 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "main_offer", label: "Main offer / identity", required: true, minLength: 10, maxLength: 1200 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "bio_length", label: "Bio length", required: true, minLength: 2, maxLength: 80 },
      { id: "cta", label: "CTA", required: false, maxLength: 180 },
      { id: "keywords", label: "Keywords", required: false, maxLength: 300 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
      { id: "avoid", label: "Words / claims to avoid", required: false, maxLength: 1200 },
    ],
    system: `You are ABC Creator's premium social profile copywriter.
${bioCommonRules}
Adapt the structure to the selected platform, audience, identity, CTA, and tone. Keep each option distinct and practical.`,
    outputGuide: "Return a premium social media bio package in Markdown: # Social Media Bio Package; ## Platform Strategy; ## Bio Variations; ## CTA Variations; ## Keyword / Positioning Notes; ## Best Pick; ## Avoid / Verify Notes.",
  },
};
