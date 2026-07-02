type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };

type ServerPrompt = {
  system: string;
  outputGuide: string;
  creditCost: number;
  requiredInputs: ToolFieldRule[];
};

const writingRules = `
Writing tool rules:
- Generate only text output for the selected tool.
- Match the user's selected language, audience, tone, length, and brief.
- Do not invent facts, citations, statistics, sources, legal claims, medical claims, financial results, or credentials.
- Preserve names, numbers, and facts when rewriting source text unless the user asks to change them.
- Keep output polished, useful, and ready to copy.
- Use clean Markdown with clear ## sections and ### item headings where useful.`;

const transformFields: ToolFieldRule[] = [
  { id: "source_text", label: "Source text", required: true, minLength: 10, maxLength: 12000 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "output_length", label: "Output length", required: true, minLength: 2, maxLength: 120 },
  { id: "must_keep", label: "Words / facts to keep", required: false, maxLength: 1500 },
  { id: "avoid", label: "Avoid / constraints", required: false, maxLength: 1500 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

const writerFields: ToolFieldRule[] = [
  { id: "topic_or_brief", label: "Topic / brief", required: true, minLength: 10, maxLength: 12000 },
  { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
  { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
  { id: "output_length", label: "Output length", required: true, minLength: 2, maxLength: 120 },
  { id: "must_include", label: "Must include", required: false, maxLength: 2500 },
  { id: "avoid", label: "Avoid / constraints", required: false, maxLength: 1500 },
  { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
];

function transformPrompt(name: string, creditCost: number, instruction: string): ServerPrompt {
  return {
    creditCost,
    requiredInputs: transformFields,
    system: `You are ABC Creator's premium ${name}.${writingRules}\n\nSpecific task: ${instruction}`,
    outputGuide: `Return Markdown with: # ${name}; ## Best Version; ## Alternate Version if useful; ## Notes. Keep it concise and do not add unrelated sections.`,
  };
}

function writerPrompt(name: string, creditCost: number, instruction: string): ServerPrompt {
  return {
    creditCost,
    requiredInputs: writerFields,
    system: `You are ABC Creator's premium ${name}.${writingRules}\n\nSpecific task: ${instruction}`,
    outputGuide: `Return a polished Markdown output for ${name}. Use a clear title, structured sections, and practical notes. Do not invent unsupported facts or citations.`,
  };
}

export const serverWritingBatchTools: Record<string, ServerPrompt> = {
  "listicle-writer": writerPrompt("Listicle Writer", 3, "Write a list-style article with strong introduction, numbered points, examples, and a useful conclusion."),
  "how-to-article-writer": writerPrompt("How-To Article Writer", 3, "Write a step-by-step how-to article with prerequisites, steps, tips, mistakes to avoid, and conclusion."),
  "extreme-rewrite": transformPrompt("Extreme Rewrite", 3, "Rewrite the source into a fresh structure and style while preserving meaning and important facts."),
  "text-improver": transformPrompt("Text Improver", 2, "Improve clarity, grammar, flow, structure, and readability without changing the core meaning."),
  "content-simplifier": transformPrompt("Content Simplifier", 2, "Make the source easier to understand for the selected audience."),
  "tone-changer": transformPrompt("Tone Changer", 2, "Rewrite the source in the selected tone while preserving facts and intent."),
  "paragraph-rewriter": transformPrompt("Paragraph Rewriter", 2, "Rewrite each paragraph into a cleaner and stronger version."),
  "sentence-rewriter": transformPrompt("Sentence Rewriter", 1, "Rewrite sentences for clarity, readability, and tone."),
  "expand-text": transformPrompt("Expand Text", 2, "Expand the source with useful detail, examples, and smoother explanation without adding unsupported facts."),
  "shorten-text": transformPrompt("Shorten Text", 1, "Condense the source while keeping the main message and important details."),
  "add-emojis-to-text": {
    creditCost: 1,
    requiredInputs: [
      { id: "source_text", label: "Source text", required: true, minLength: 2, maxLength: 5000 },
      { id: "emoji_level", label: "Emoji level", required: true, minLength: 2, maxLength: 120 },
      { id: "platform", label: "Platform", required: false, maxLength: 120 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's tasteful emoji copy editor.${writingRules}\n\nAdd emojis naturally without making the text childish, spammy, or hard to read.`,
    outputGuide: "Return Markdown with: # Emoji-Enhanced Text; ## Final Version; ## Lighter Option if useful.",
  },
  "ai-research-paper-writer": writerPrompt("AI Research Paper Writer", 3, "Draft a structured research-style paper only from supplied notes and references; use placeholders where evidence is missing."),
  "kids-video-script-generator": writerPrompt("Kids Video Script Generator", 2, "Write age-appropriate scripts for young audiences with safe, friendly language and clear scene/narration cues."),
  "whiteboard-animation-script": writerPrompt("Whiteboard Animation Script", 2, "Write narration plus visual drawing cues for a whiteboard-style explainer."),
  "live-streaming-script": writerPrompt("Live Streaming Script", 2, "Create a live stream run-of-show with intro, segments, transitions, engagement prompts, and closing CTA."),
  "television-broadcast-script": writerPrompt("Television Broadcast Script", 3, "Write a polished broadcast script with anchor copy, segment cues, transitions, and closing."),
  "quotes-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "theme", label: "Theme", required: true, minLength: 2, maxLength: 180 },
      { id: "quote_count", label: "Quote count", required: true, minLength: 2, maxLength: 80 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's original quote writer.${writingRules}\n\nWrite original, non-attributed quotes. Do not imitate or attribute quotes to real people.`,
    outputGuide: "Return Markdown with: # Original Quotes; ## Quote Options; ## Best Picks. Return the requested count.",
  },
  "presentation-slides-text-generator": {
    creditCost: 2,
    requiredInputs: [
      { id: "presentation_topic", label: "Presentation topic", required: true, minLength: 10, maxLength: 8000 },
      { id: "slide_count", label: "Slide count", required: true, minLength: 2, maxLength: 80 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's presentation copywriter.${writingRules}\n\nGenerate slide text only, not a slide deck file.`,
    outputGuide: "Return Markdown with: # Presentation Slide Text; ## Slide-by-Slide Outline; include slide title, bullet points, and speaker notes for each slide.",
  },
  "paper-writer": writerPrompt("Paper Writer", 3, "Write a structured paper from the supplied brief and notes."),
  "essay-outline-generator": writerPrompt("Essay Outline Generator", 2, "Create a clear essay outline with thesis, sections, supporting points, and conclusion direction."),
  "essay-writer": writerPrompt("Essay Writer", 3, "Write a structured essay from the supplied brief, thesis, and notes."),
  "story-maker": writerPrompt("Story Maker", 3, "Create an original story using the user's brief, genre, tone, and constraints."),
  "document-writer": writerPrompt("Document Writer", 3, "Draft a structured document, memo, brief, or formal written material."),
  "report-writer": writerPrompt("Report Writer", 3, "Write a structured report with summary, context, findings, recommendations, and next steps."),
  "speech-writer": writerPrompt("Speech Writer", 2, "Write a polished speech with opening, main points, transitions, and closing."),
  "personal-message-writer": writerPrompt("Personal Message Writer", 1, "Write a personal message that matches the user's relationship, purpose, and tone."),
  "letter-writer": writerPrompt("Letter Writer", 2, "Write a formal, informal, business, complaint, request, or personal letter."),
  "paragraph-generator": {
    creditCost: 2,
    requiredInputs: [
      { id: "topic", label: "Topic", required: true, minLength: 10, maxLength: 3000 },
      { id: "paragraph_count", label: "Paragraph count", required: true, minLength: 2, maxLength: 80 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium paragraph writer.${writingRules}`,
    outputGuide: "Return Markdown with: # Generated Paragraphs; ## Paragraph Options; ## Best Pick. Return the requested count.",
  },
  "article-to-video-script-converter": writerPrompt("Article to Video Script Converter", 2, "Convert the source article into a structured video script with hook, sections, narration, and CTA."),
  "video-to-article-converter": writerPrompt("Video to Article Converter", 3, "Convert the pasted video transcript or notes into a structured article. Do not claim to watch a video."),
  "summarize-pro": writerPrompt("Summarize Pro", 2, "Summarize pasted text, notes, transcripts, or source material into a clear, polished summary."),
};
