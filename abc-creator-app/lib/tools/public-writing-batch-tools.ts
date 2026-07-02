type PublicWritingBatchToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "image";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type PublicWritingBatchTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType?: "text";
  aliases?: string[];
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: PublicWritingBatchToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional", "Friendly", "Premium", "Simple and clear", "Persuasive", "Conversational", "Academic", "Creative"];
const audienceOptions = ["General audience", "Beginners", "Students", "Professionals", "Customers", "Executives", "Young learners", "Technical readers"];
const lengthOptions = ["Short", "Medium", "Long", "Detailed"];
const countOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const scriptLengthOptions = ["30 seconds", "60 seconds", "2 minutes", "5 minutes", "10 minutes"];
const slideCountOptions = ["5 slides", "8 slides", "10 slides", "15 slides"];
const paragraphCountOptions = ["1 paragraph", "3 paragraphs", "5 paragraphs", "10 paragraphs"];

function transformInputs(label = "Source Text"): PublicWritingBatchToolInput[] {
  return [
    { id: "source_text", label, type: "textarea", placeholder: "Paste the text you want transformed.", required: true },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "output_length", label: "Output Length", type: "select", required: true, options: lengthOptions },
    { id: "must_keep", label: "Words / Facts to Keep", type: "textarea", placeholder: "Optional names, terms, facts, numbers, or phrases that must stay unchanged.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional tone, words, claims, or style notes to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function writerInputs(label = "Topic / Brief"): PublicWritingBatchToolInput[] {
  return [
    { id: "topic_or_brief", label, type: "textarea", placeholder: "Describe what you want written. Include facts, context, audience, and required points.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_length", label: "Output Length", type: "select", required: true, options: lengthOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional facts, sections, keywords, examples, or CTA to include.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional claims, words, examples, or style notes to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, detailEmoji: string, displayCreditCost: number, inputs: PublicWritingBatchToolInput[], aliases: string[] = []): PublicWritingBatchTool {
  return { id: slug, slug, name, description, icon: "writing-pad", detailEmoji, category: "Writing Tools", displayCreditCost, outputType: "text", aliases: [`ai-${slug}`, `${slug}-generator`, `${slug}-tool`, ...aliases], inputs };
}

export const writingBatchTools: PublicWritingBatchTool[] = [
  tool("listicle-writer", "Listicle Writer", "Write structured list-style articles with clear points, examples, and summaries.", "🔢", 3, writerInputs()),
  tool("how-to-article-writer", "How-To Article Writer", "Create step-by-step how-to articles with practical instructions and examples.", "🛠️", 3, writerInputs()),
  tool("extreme-rewrite", "Extreme Rewrite", "Rewrite text with a fresh structure while preserving the core meaning.", "🔄", 3, transformInputs()),
  tool("text-improver", "Text Improver", "Improve clarity, flow, grammar, tone, and readability without changing the meaning.", "✨", 2, transformInputs()),
  tool("content-simplifier", "Content Simplifier", "Make complex content easier to understand for the selected audience.", "🧩", 2, transformInputs()),
  tool("tone-changer", "Tone Changer", "Rewrite text into a different tone while preserving facts and intent.", "🎚️", 2, transformInputs()),
  tool("paragraph-rewriter", "Paragraph Rewriter", "Rewrite paragraphs into cleaner, stronger, more natural versions.", "¶", 2, transformInputs()),
  tool("sentence-rewriter", "Sentence Rewriter", "Rewrite sentences for clarity, tone, and readability.", "✏️", 1, transformInputs()),
  tool("expand-text", "Expand Text", "Expand short text with useful detail, examples, and smoother explanation.", "↔️", 2, transformInputs()),
  tool("shorten-text", "Shorten Text", "Condense long text into a shorter version while keeping the main message.", "📉", 1, transformInputs()),
  tool("add-emojis-to-text", "Add Emojis to Text", "Add tasteful emojis to text while keeping it readable and platform-appropriate.", "😊", 1, [
    { id: "source_text", label: "Source Text", type: "textarea", placeholder: "Paste the text you want enhanced with emojis.", required: true },
    { id: "emoji_level", label: "Emoji Level", type: "select", required: true, options: ["Light emojis", "Balanced emojis", "Emoji-rich", "Platform-native"] },
    { id: "platform", label: "Platform", type: "text", placeholder: "Optional: Instagram, LinkedIn, WhatsApp, X, email", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["emoji-text-generator", "add-emoji-to-text"]),
  tool("ai-research-paper-writer", "AI Research Paper Writer", "Draft structured research-style papers from supplied notes, facts, and references.", "🔬", 3, writerInputs("Research Topic / Notes")),
  tool("kids-video-script-generator", "Kids Video Script Generator", "Write age-appropriate educational or entertainment video scripts with scenes and narration.", "🧸", 2, [...writerInputs("Video Topic / Brief"), { id: "script_length", label: "Script Length", type: "select", required: true, options: scriptLengthOptions }]),
  tool("whiteboard-animation-script", "Whiteboard Animation Script", "Create whiteboard animation scripts with narration, scene notes, and drawing cues.", "🧑‍🏫", 2, [...writerInputs("Animation Topic / Brief"), { id: "script_length", label: "Script Length", type: "select", required: true, options: scriptLengthOptions }]),
  tool("live-streaming-script", "Live Streaming Script", "Create live stream run-of-show scripts with intro, talking points, transitions, and CTA.", "📡", 2, writerInputs("Live Stream Topic / Brief")),
  tool("television-broadcast-script", "Television Broadcast Script", "Write formal broadcast scripts with anchor copy, segment cues, and transitions.", "📺", 3, writerInputs("Broadcast Topic / Brief")),
  tool("quotes-generator", "Quotes Generator", "Generate original quotes for posts, speeches, campaigns, and brand messages.", "❝", 1, [
    { id: "theme", label: "Theme", type: "text", placeholder: "e.g., discipline, leadership, healing, productivity", required: true },
    { id: "quote_count", label: "How Many Quotes?", type: "select", required: true, options: countOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ]),
  tool("presentation-slides-text-generator", "Presentation Slides Text Generator", "Generate slide titles, bullets, speaker notes, and flow for a presentation.", "🖥️", 2, [
    { id: "presentation_topic", label: "Presentation Topic", type: "textarea", placeholder: "Describe the topic, audience, purpose, and main points.", required: true },
    { id: "slide_count", label: "Slide Count", type: "select", required: true, options: slideCountOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ]),
  tool("paper-writer", "Paper Writer", "Write structured papers from a topic, notes, and required points.", "📑", 3, writerInputs("Paper Topic / Notes")),
  tool("essay-outline-generator", "Essay Outline Generator", "Create organized essay outlines with thesis, sections, points, and conclusion direction.", "🧭", 2, writerInputs("Essay Topic / Brief")),
  tool("essay-writer", "Essay Writer", "Write structured essays from a topic, thesis, notes, and required points.", "📝", 3, writerInputs("Essay Topic / Notes")),
  tool("story-maker", "Story Maker", "Create original stories with plot, characters, tone, and structure.", "📖", 3, writerInputs("Story Idea / Brief")),
  tool("document-writer", "Document Writer", "Draft structured documents, memos, briefs, and formal written materials.", "📄", 3, writerInputs("Document Brief")),
  tool("report-writer", "Report Writer", "Write structured reports with summaries, analysis, recommendations, and next steps.", "📊", 3, writerInputs("Report Topic / Notes")),
  tool("speech-writer", "Speech Writer", "Create polished speeches with opening, main points, transitions, and closing.", "🎙️", 2, writerInputs("Speech Topic / Brief")),
  tool("personal-message-writer", "Personal Message Writer", "Write personal messages for greetings, apologies, thanks, invitations, and emotional notes.", "💬", 1, writerInputs("Message Context")),
  tool("letter-writer", "Letter Writer", "Write formal, informal, business, complaint, request, or personal letters.", "✉️", 2, writerInputs("Letter Context")),
  tool("paragraph-generator", "Paragraph Generator", "Generate polished paragraphs for articles, reports, essays, pages, and posts.", "¶", 2, [
    { id: "topic", label: "Topic / Brief", type: "textarea", placeholder: "Describe what the paragraph should explain, introduce, sell, or summarize.", required: true },
    { id: "paragraph_count", label: "Paragraph Count", type: "select", required: true, options: paragraphCountOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ]),
  tool("article-to-video-script-converter", "Article to Video Script Converter", "Turn an article or blog post into a structured video script.", "🎞️", 2, writerInputs("Article / Blog Post")),
  tool("video-to-article-converter", "Video to Article Converter", "Turn a pasted video transcript or notes into a structured article.", "📰", 3, writerInputs("Video Transcript / Notes")),
  tool("summarize-pro", "Summarize Pro", "Summarize long text, notes, transcripts, or pasted source material into polished summaries.", "🧠", 2, writerInputs("Text / Notes / Transcript")),
];
