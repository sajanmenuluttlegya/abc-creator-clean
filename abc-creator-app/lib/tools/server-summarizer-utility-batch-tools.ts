type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const rules = `
ABC Creator premium summarizer and text utility rules:
- Use only the user's supplied source content, context, audience, tone, depth, output format, must-include, avoid, and language fields as the source of truth.
- Preserve factual meaning. Do not invent facts, quotes, statistics, citations, decisions, owners, deadlines, product claims, legal/medical/financial advice, or meeting outcomes.
- If the source is unclear, conflicting, or missing key details, label uncertainty clearly and add a Missing / Needs Verification section.
- For summaries, distinguish between stated facts, inferred takeaways, open questions, and suggested next steps.
- For grammar and rewrite tools, preserve the original intent and do not add unsupported claims.
- Do not claim hidden analysis, live file access, transcript access, search access, or external research unless the user pasted the material.
- Use polished Markdown, useful tables when appropriate, and copy-ready formatting.`;

function p(name: string, creditCost: number, requiredInputs: ToolFieldRule[], task: string, outputGuide: string): ServerPrompt {
  return { creditCost, requiredInputs, system: `You are ABC Creator's elite ${name} specialist.${rules}\n\nTask: ${task}`, outputGuide };
}

const sourceField: ToolFieldRule = { id: "source_content", label: "Source content", required: true, minLength: 20, maxLength: 60000 };
const audienceField: ToolFieldRule = { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 160 };
const toneField: ToolFieldRule = { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 160 };
const depthField: ToolFieldRule = { id: "summary_depth", label: "Depth", required: true, minLength: 2, maxLength: 160 };
const formatField: ToolFieldRule = { id: "output_format", label: "Output format", required: true, minLength: 2, maxLength: 160 };
const mustField: ToolFieldRule = { id: "must_include", label: "Must include", required: false, maxLength: 6000 };
const avoidField: ToolFieldRule = { id: "avoid", label: "Avoid", required: false, maxLength: 6000 };
const languageField: ToolFieldRule = { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 };

function summaryFields(): ToolFieldRule[] {
  return [sourceField, audienceField, toneField, depthField, formatField, mustField, avoidField, languageField];
}

const summaryGuide = "Return Markdown with: # Summary; ## One-Line Summary; ## Key Points; ## Important Details; ## Action Notes or Next Steps; ## Missing / Needs Verification. Follow the selected output format when possible.";

export const serverSummarizerUtilityBatchTools: Record<string, ServerPrompt> = {
  "bullet-point-summarizer": p("Bullet Point Summarizer", 2, summaryFields(), "Turn long text into clean bullet points with key ideas, priorities, and optional action notes.", "Return Markdown with: # Bullet Point Summary; ## Main Bullets; ## Priority Points; ## Details Worth Keeping; ## Action Notes; ## Missing / Needs Verification."),
  "meeting-notes-summarizer": p("Meeting Notes Summarizer", 3, [
    sourceField,
    { id: "meeting_context", label: "Meeting context", required: false, maxLength: 1000 },
    depthField,
    formatField,
    mustField,
    avoidField,
    languageField,
  ], "Convert meeting notes or transcripts into decisions, action items, owners, risks, follow-ups, and clean minutes from supplied text only.", "Return Markdown with: # Meeting Summary; ## Executive Summary; ## Decisions; ## Action Items Table with Task, Owner, Deadline, Priority, Evidence; ## Risks / Blockers; ## Open Questions; ## Follow-Up Message Draft; ## Missing / Needs Verification."),
  "file-text-summarizer": p("File/Text Summarizer", 3, summaryFields(), "Summarize pasted file text, document excerpts, reports, transcripts, or long notes into a useful brief.", summaryGuide),
  "explain-like-im-5": p("Explain Like I’m 5", 2, [
    sourceField,
    { id: "target_level", label: "Target simplicity", required: true, minLength: 2, maxLength: 160 },
    { id: "example_style", label: "Example style", required: true, minLength: 2, maxLength: 160 },
    toneField,
    mustField,
    languageField,
  ], "Rewrite complex text into a simple, accurate explanation with examples, analogies, and key takeaways while preserving factual meaning.", "Return Markdown with: # Simple Explanation; ## In One Sentence; ## Simple Explanation; ## Example / Analogy; ## Key Takeaways; ## Words to Know; ## What to Verify."),
  "grammar-fixer": p("Grammar Fixer", 2, [
    sourceField,
    { id: "edit_level", label: "Edit level", required: true, minLength: 2, maxLength: 160 },
    toneField,
    { id: "preserve_style", label: "Preserve original style", required: true, minLength: 2, maxLength: 160 },
    avoidField,
    languageField,
  ], "Fix grammar, spelling, punctuation, clarity, flow, and readability while preserving the original meaning.", "Return Markdown with: # Corrected Text; the polished corrected version first; then ## What Changed with concise bullets; ## Meaning Preservation Notes if relevant."),
  "text-humanizer": p("Text Humanizer", 3, [
    sourceField,
    { id: "humanize_level", label: "Humanize level", required: true, minLength: 2, maxLength: 160 },
    audienceField,
    toneField,
    mustField,
    avoidField,
    languageField,
  ], "Rewrite text so it sounds more natural, clear, warm, and human-edited while preserving facts and user intent.", "Return Markdown with: # Human-Style Rewrite; provide the rewritten text first; then ## Editorial Notes; ## Preserved Facts; ## Optional Alternate Lines if useful."),
  "key-takeaways-generator": p("Key Takeaways Generator", 2, summaryFields(), "Extract the most important lessons, insights, decisions, and memorable points from any supplied text.", "Return Markdown with: # Key Takeaways; ## Top Takeaways Table; ## Why They Matter; ## Useful Quotes / Source Phrases only if present; ## Actionable Next Steps; ## Missing / Needs Verification."),
  "action-items-extractor": p("Action Items Extractor", 2, [
    sourceField,
    { id: "context", label: "Context", required: false, maxLength: 1000 },
    formatField,
    mustField,
    avoidField,
    languageField,
  ], "Extract tasks, owners, deadlines, priorities, dependencies, and follow-up notes from supplied notes or transcripts only.", "Return Markdown with: # Action Items; ## Action Items Table with Task, Owner, Deadline, Priority, Evidence, Status; ## Dependencies; ## Open Questions; ## Follow-Up Checklist; ## Missing / Needs Verification."),
};
