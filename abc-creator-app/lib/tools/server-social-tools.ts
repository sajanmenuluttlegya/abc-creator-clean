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

const socialCommonRules = `
Social media rules:
- Generate only ready-to-use text output for the selected platform.
- Match the user's selected language, audience, tone, goal, and context.
- Be specific to the visible image and user-provided context.
- Do not invent objects, people, locations, prices, results, certifications, offers, or claims that are not visible or supplied by the user.
- When a visual detail is uncertain, mark it as an assumption or avoid mentioning it.
- Do not claim platform analytics, trending data, reach predictions, ranking, or guaranteed engagement.
- Keep hashtags relevant and non-spammy.
- Write clean Markdown that can be edited, copied, or reordered in the output panel.`;

export const serverSocialTools: Record<string, ServerPrompt> = {
  "image-to-instagram-caption": {
    creditCost: 3,
    requiredInputs: [
      { id: "image_data", label: "Uploaded image", required: true, minLength: 50, maxLength: 6500000 },
      { id: "brand_name", label: "Brand / page name", required: false, maxLength: 160 },
      { id: "image_context", label: "Image / product context", required: false, maxLength: 2500 },
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
    system: `You are ABC Creator's premium Instagram caption strategist. You analyze an uploaded image and produce polished, platform-ready Instagram caption options.

${socialCommonRules}

Image-to-caption rules:
- First infer only visible image elements: subject, setting, mood, colors, product cues, action, composition, and likely content category.
- Use the user's brand, context, CTA, avoidance notes, tone, language, caption count, caption length, emoji setting, hashtag setting, audience, and goal.
- Make every caption feel native to Instagram, not like a generic ad template.
- Include multiple angles: engagement, story, benefit, community, soft-sell, direct CTA, and minimal/aesthetic when useful.
- Hashtags must be grouped by intent when requested: niche, audience, product/category, mood/style, local/community only if supplied.
- Alt text must describe visible content plainly for accessibility.
- Avoid saying the image shows something unless it is clearly visible or supplied in context.
- Output must be easy for the editor to split into movable blocks: use clear ## sections and ### item headings.`,
    outputGuide:
      "Return a premium Instagram caption package in Markdown. Use this exact structure: # Image to Instagram Caption Package; ## Image Read; ## Caption Strategy; ## Caption Variations with each option as ### Caption 1, ### Caption 2, etc.; ## Best Pick; ## CTA Variations; ## Hashtag Sets only if hashtags are requested; ## Alt Text; ## Avoid / Verify Notes. For each caption include the caption text, angle, best use case, and a short reason it works. Do not invent visible details, pricing, claims, location, or results.",
  },
};
