type UtilityInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "media";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type UtilityTool = {
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
  inputs: UtilityInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional", "Friendly", "Simple", "Conversational", "Academic", "Executive", "Premium", "Plain English"];
const audienceOptions = ["General audience", "Beginners", "Students", "Executives", "Customers", "Team members", "Technical readers", "Non-technical readers"];
const summaryDepthOptions = ["Quick", "Standard", "Detailed", "Executive brief"];
const outputFormatOptions = ["Bullet points", "Short paragraphs", "Table", "Action plan", "Executive memo"];
const humanizeLevelOptions = ["Light polish", "Natural rewrite", "Stronger human-style rewrite", "Premium editorial rewrite"];
const sourceModeOptions = ["Paste text / transcript", "Upload text file"];

function tool(slug: string, name: string, description: string, category: string, emoji: string, credits: number, inputs: UtilityInput[], aliases: string[] = []): UtilityTool {
  return { id: slug, slug, name, description, icon: "text-utility", detailEmoji: emoji, category, displayCreditCost: credits, outputType: "text", aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases], inputs };
}

function sourceInputs(primaryLabel: string): UtilityInput[] {
  return [
    { id: "source_content", label: primaryLabel, type: "textarea", placeholder: "Paste the text, notes, transcript, article, document excerpt, or meeting notes here.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "summary_depth", label: "Depth", type: "select", required: true, options: summaryDepthOptions },
    { id: "output_format", label: "Output Format", type: "select", required: true, options: outputFormatOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: points, keywords, decisions, names, deadlines, facts, or sections to preserve.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: things to remove, simplify, avoid, or not mention.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function uploadableSourceInputs(primaryLabel: string, uploadLabel: string): UtilityInput[] {
  return [
    { id: "source_mode", label: "Source Mode", type: "select", required: true, options: sourceModeOptions },
    { id: "media_upload", label: uploadLabel, type: "media", placeholder: "Upload a text-based file such as .txt, .md, .csv, .json, .rtf, .html, or .xml.", required: false },
    { id: "source_content", label: primaryLabel, type: "textarea", placeholder: "Paste text here, or choose Upload text file above.", required: false },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "summary_depth", label: "Depth", type: "select", required: true, options: summaryDepthOptions },
    { id: "output_format", label: "Output Format", type: "select", required: true, options: outputFormatOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: points, keywords, decisions, names, deadlines, facts, or sections to preserve.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: things to remove, simplify, avoid, or not mention.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

export const summarizerUtilityBatchTools: UtilityTool[] = [
  tool("bullet-point-summarizer", "Bullet Point Summarizer", "Turn long text into clean bullet points with key ideas, priorities, and optional action notes.", "Summarizer / File Tools", "•", 2, sourceInputs("Text to Summarize"), ["bullet-summary-generator", "summarize-into-bullets"]),
  tool("meeting-notes-summarizer", "Meeting Notes Summarizer", "Convert pasted or uploaded meeting notes into decisions, action items, owners, risks, and follow-ups.", "Summarizer / File Tools", "📝", 3, [
    ...uploadableSourceInputs("Meeting Notes / Transcript", "Upload Meeting Notes File"),
    { id: "meeting_context", label: "Meeting Context", type: "text", placeholder: "Optional: meeting name, team, project, client, or goal.", required: false },
  ], ["meeting-summary-generator", "meeting-minutes-summarizer", "meeting-notes-generator"]),
  tool("file-text-summarizer", "File/Text Summarizer", "Summarize pasted text or uploaded text-based files, reports, transcripts, notes, or document excerpts into a useful brief.", "Summarizer / File Tools", "📄", 3, uploadableSourceInputs("File Text / Document Content", "Upload Text File"), ["document-summarizer", "text-file-summarizer", "file-summarizer"]),
  tool("explain-like-im-5", "Explain Like I’m 5", "Rewrite complex text into a simple, easy explanation with examples and key takeaways.", "Summarizer / File Tools", "🧒", 2, [
    { id: "source_content", label: "Complex Text / Topic", type: "textarea", placeholder: "Paste the idea, article excerpt, technical topic, policy, lesson, or concept to simplify.", required: true },
    { id: "target_level", label: "Target Simplicity", type: "select", required: true, options: ["ELI5", "Middle school", "High school", "Beginner adult", "Non-technical executive"] },
    { id: "example_style", label: "Example Style", type: "select", required: true, options: ["Everyday analogy", "Story example", "Step-by-step", "Visual metaphor", "No analogy"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: terms, examples, facts, or points that must remain accurate.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["eli5-generator", "simple-explainer", "explain-simply"]),
  tool("grammar-fixer", "Grammar Fixer", "Fix grammar, spelling, clarity, punctuation, flow, and readability while preserving the original meaning.", "Writing Tools", "✅", 2, [
    { id: "source_content", label: "Text to Fix", type: "textarea", placeholder: "Paste the sentence, paragraph, email, article section, or draft to correct.", required: true },
    { id: "edit_level", label: "Edit Level", type: "select", required: true, options: ["Grammar only", "Grammar + clarity", "Professional polish", "Premium editorial polish"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "preserve_style", label: "Preserve Original Style?", type: "select", required: true, options: ["Yes, preserve style", "Mostly preserve style", "Improve style freely"] },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: phrases, tone, words, formatting, or meaning that should not change.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["grammar-corrector", "grammar-checker", "proofreader"]),
  tool("text-humanizer", "Text Humanizer", "Rewrite text to sound more natural, clear, and human-edited while preserving facts and meaning.", "Writing Tools", "🫶", 3, [
    { id: "source_content", label: "Text to Humanize", type: "textarea", placeholder: "Paste the draft you want rewritten in a more natural human style.", required: true },
    { id: "humanize_level", label: "Humanize Level", type: "select", required: true, options: humanizeLevelOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "must_include", label: "Must Keep", type: "textarea", placeholder: "Optional: facts, sentences, keywords, CTA, voice, or technical terms to preserve.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: words, claims, phrases, fluff, or style choices to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["humanize-text", "natural-text-rewriter", "human-style-rewriter"]),
  tool("key-takeaways-generator", "Key Takeaways Generator", "Extract the most important lessons, insights, decisions, and memorable points from any text.", "Summarizer / File Tools", "🔑", 2, sourceInputs("Source Text"), ["takeaways-generator", "key-points-generator", "main-points-extractor"]),
  tool("action-items-extractor", "Action Items Extractor", "Extract tasks, owners, deadlines, priorities, dependencies, and follow-up notes from messy text.", "Summarizer / File Tools", "📌", 2, [
    { id: "source_content", label: "Notes / Transcript / Text", type: "textarea", placeholder: "Paste meeting notes, project notes, email thread, transcript, or rough text.", required: true },
    { id: "context", label: "Context", type: "text", placeholder: "Optional: project, team, client, meeting name, or goal.", required: false },
    { id: "output_format", label: "Output Format", type: "select", required: true, options: ["Action table", "Checklist", "Priority list", "Owner/deadline table", "Follow-up email draft"] },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: names, dates, owners, priorities, or constraints to preserve.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: items to ignore, sensitive notes, or non-actionable chatter.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["extract-action-items", "action-item-generator", "task-extractor"]),
];
