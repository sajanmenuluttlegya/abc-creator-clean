type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

export const serverSocialVariationOverrides: Record<string, ServerPrompt> = {
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
    system: `You are ABC Creator's premium Instagram profile strategist. Create exact Instagram page name and bio variations.

Rules:
- Use variation_count as the exact output count: 1, 3, 5, or 10.
- Each variation must be a complete profile package: page name, handle ideas, bio, CTA, vibe, positioning note, best use case, and why it works.
- Do not claim username or handle availability.
- Do not promise followers, verification, reach, ranking, revenue, or conversion results.
- Keep every bio platform-native, concise, memorable, and easy to paste.
- Make every variation meaningfully different, not repeated wording.`,
    outputGuide: "Return Markdown. Use this structure: # Instagram Page Name & Bio Package; ## Profile Strategy; then exactly the selected number of sections named ### Variation 1, ### Variation 2, etc. For each variation include Page Name, Handle Ideas, Bio, CTA, Vibe / Positioning Note, Best Use Case, and Why It Works. End with ## Best Pick and ## Verify Before Using."
  }
};
