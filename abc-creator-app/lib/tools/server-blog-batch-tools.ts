type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };

type ServerPrompt = {
  system: string;
  outputGuide: string;
  creditCost: number;
  requiredInputs: ToolFieldRule[];
};

const blogRules = `
Blog workflow rules:
- Generate only text output for the selected blog workflow tool.
- Match the user's selected language, audience, tone, source content, keyword, and constraints.
- Keep output grounded in the supplied blog/source content. Do not invent facts, statistics, sources, claims, or guarantees.
- Do not claim live SEO data, rankings, traffic, conversion results, or platform performance.
- When the source is a transcript, write based on the transcript/source provided and do not claim to have watched the video.
- Use clean Markdown with clear ## sections and ### item headings.
- Image insertion/output behavior is handled by the output renderer, not by the prompt.`;

const commonFields: ToolFieldRule[] = [
  { id: "source_content", label: "Source content", required: true, minLength: 10, maxLength: 18000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "primary_keyword", label: "Primary keyword", required: false, maxLength: 180 },
  { id: "must_include", label: "Must include", required: false, maxLength: 2500 },
  { id: "avoid", label: "Avoid / constraints", required: false, maxLength: 1500 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

function blogPrompt(name: string, creditCost: number, instruction: string, extraFields: ToolFieldRule[] = []): ServerPrompt {
  return {
    creditCost,
    requiredInputs: [...commonFields, ...extraFields],
    system: `You are ABC Creator's premium ${name}.${blogRules}\n\nSpecific task: ${instruction}`,
    outputGuide: `Return a polished Markdown output for ${name}. Use a clear title, structured sections, copy-ready blocks, and concise review notes.`,
  };
}

export const serverBlogBatchTools: Record<string, ServerPrompt> = {
  "blog-section-writer": {
    creditCost: 3,
    requiredInputs: [
      { id: "section_heading", label: "Section heading", required: true, minLength: 2, maxLength: 220 },
      { id: "section_brief", label: "Section brief", required: true, minLength: 10, maxLength: 6000 },
      { id: "section_length", label: "Section length", required: true, minLength: 2, maxLength: 120 },
      ...commonFields.slice(1),
    ],
    system: `You are ABC Creator's premium Blog Section Writer.${blogRules}\n\nWrite one polished blog section under the supplied heading.`,
    outputGuide: "Return Markdown with: # Blog Section; ## Final Section; ## Optional Variations; ## Notes. Keep it focused on the heading.",
  },
  "comparison-blog-writer": {
    creditCost: 5,
    requiredInputs: [
      { id: "comparison_topic", label: "Comparison topic", required: true, minLength: 2, maxLength: 240 },
      { id: "items_to_compare", label: "Items to compare", required: true, minLength: 4, maxLength: 4000 },
      { id: "comparison_criteria", label: "Comparison criteria", required: false, maxLength: 2500 },
      ...commonFields.slice(1),
    ],
    system: `You are ABC Creator's premium Comparison Blog Writer.${blogRules}\n\nWrite a comparison article with balanced criteria, pros/cons, recommendation logic, and caveats.`,
    outputGuide: "Return Markdown with: # Comparison Blog Article; ## Quick Verdict; ## Comparison Table; ## Detailed Comparison; ## Pros and Cons; ## Recommendation; ## FAQs; ## Notes.",
  },
  "blog-to-social-posts": blogPrompt("Blog to Social Posts", 3, "Turn the blog into platform-ready social posts with hooks, captions, CTAs, and repurposing notes.", [{ id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 120 }, { id: "post_count", label: "Post count", required: true, minLength: 2, maxLength: 80 }]),
  "blog-to-email": blogPrompt("Blog to Email", 3, "Convert the blog into email copy with subject lines, preview text, body copy, and CTA.", [{ id: "email_type", label: "Email type", required: true, minLength: 2, maxLength: 120 }, { id: "email_count", label: "Email count", required: true, minLength: 2, maxLength: 80 }]),
  "blog-to-reels-script": blogPrompt("Blog to Reels Script", 3, "Turn the blog into short-form Reels/Shorts scripts with hook, narration, scene notes, and CTA.", [{ id: "script_length", label: "Script length", required: true, minLength: 2, maxLength: 80 }, { id: "script_count", label: "Script count", required: true, minLength: 2, maxLength: 80 }]),
  "blog-to-youtube-script": blogPrompt("Blog to YouTube Script", 4, "Turn the blog into a YouTube script with hook, sections, transitions, examples, and CTA.", [{ id: "script_length", label: "Script length", required: true, minLength: 2, maxLength: 80 }, { id: "video_style", label: "Video style", required: true, minLength: 2, maxLength: 120 }]),
  "youtube-video-to-blog-post": blogPrompt(
    "YouTube Video to Blog Post",
    4,
    "Turn a pasted transcript, extracted YouTube captions, or uploaded audio/video transcript into a polished blog post. Write based on the transcript/source only and never claim to have watched the video.",
    [{ id: "article_length", label: "Article length", required: true, minLength: 2, maxLength: 120 }]
  ),
};
