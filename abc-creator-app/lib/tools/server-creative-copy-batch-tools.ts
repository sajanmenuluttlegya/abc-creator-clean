type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium quality rules:
- Use the user's brief, audience, tone, language, count, must-include, and avoid fields as the source of truth.
- Make the output premium, professional, polished, specific, useful, and ready to copy.
- Do not invent facts, proof, statistics, awards, testimonials, prices, or claims.
- Use placeholders when verification is needed.
- Avoid generic filler, clichés, spammy wording, and off-topic ideas.`;

const creativeFields: ToolFieldRule[] = [
  { id: "brief", label: "Brief", required: true, minLength: 5, maxLength: 8000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "output_count", label: "Output count", required: true, minLength: 2, maxLength: 80 },
  { id: "must_include", label: "Must include", required: false, maxLength: 2500 },
  { id: "avoid", label: "Avoid", required: false, maxLength: 2500 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

export const serverCreativeCopyBatchTools: Record<string, ServerPrompt> = {
  "poem-generator": p("Poem Generator", 2, [
    { id: "theme", label: "Poem theme / occasion", required: true, minLength: 5, maxLength: 8000 },
    { id: "poem_style", label: "Poem style", required: true, minLength: 2, maxLength: 120 },
    { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
    { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
    { id: "length", label: "Length", required: true, minLength: 2, maxLength: 120 },
    { id: "must_include", label: "Must include", required: false, maxLength: 2500 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2500 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Write an original poem matching the selected style, occasion, audience, tone, length, and language.", "Return Markdown with: # Poem; ## Final Poem; ## Alternate Title Options; ## Notes."),
  "slogan-generator": p("Slogan Generator", 2, creativeFields, "Generate premium slogans aligned with the supplied brand, product, campaign, and audience.", "Return Markdown with: # Slogan Options; a table with Slogan, Angle, Best Use, Why It Works; ## Top 3 Recommendations."),
  "tagline-generator": p("Tagline Generator", 2, creativeFields, "Generate polished taglines that express positioning, value, and memorability.", "Return Markdown with: # Tagline Options; a table with Tagline, Positioning Angle, Brand Feel, Best Use; ## Strongest Choice."),
  "headline-generator": p("Headline Generator", 2, creativeFields, "Write premium headlines for the supplied page, ad, post, email, video, or offer.", "Return Markdown with: # Headline Options; group by Direct Benefit, Curiosity, Authority, Problem/Solution, and Conversion."),
  "cta-generator": p("CTA Generator", 1, creativeFields, "Create clear calls-to-action that fit the supplied offer, audience, tone, and funnel stage.", "Return Markdown with: # CTA Options; ## Primary CTAs; ## Soft CTAs; ## Button Copy; ## Microcopy; ## Best Match."),
  "name-generator": p("Name Generator", 2, [
    { id: "naming_context", label: "Naming context", required: true, minLength: 5, maxLength: 8000 },
    { id: "name_type", label: "Name type", required: true, minLength: 2, maxLength: 120 },
    { id: "name_style", label: "Name style", required: true, minLength: 2, maxLength: 120 },
    { id: "name_count", label: "Name count", required: true, minLength: 2, maxLength: 80 },
    { id: "must_include", label: "Must include", required: false, maxLength: 2500 },
    { id: "avoid", label: "Avoid", required: false, maxLength: 2500 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Generate premium name ideas for the selected name type. Do not claim trademark or domain availability.", "Return Markdown with: # Name Ideas; a table with Name, Style, Meaning/Angle, Best Fit; ## Top 5 Picks; ## Verification Notes."),
  "universal-prompt-enhancer": p("Universal Prompt Enhancer", 2, [
    { id: "raw_prompt", label: "Raw prompt", required: true, minLength: 5, maxLength: 12000 },
    { id: "target_model", label: "Target AI / model", required: false, maxLength: 160 },
    { id: "task_type", label: "Task type", required: true, minLength: 2, maxLength: 120 },
    { id: "prompt_depth", label: "Prompt depth", required: true, minLength: 2, maxLength: 120 },
    { id: "output_format", label: "Desired output format", required: false, maxLength: 500 },
    { id: "avoid", label: "Avoid / constraints", required: false, maxLength: 2500 },
    { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
  ], "Rewrite the user's rough prompt into a premium, reliable prompt with role, context, constraints, success criteria, and output format.", "Return Markdown with: # Enhanced Prompt; ## Copy-Ready Prompt; ## Why This Works; ## Optional Variations."),
};
