"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { OutputPanel } from "./OutputPanel";
import { SmoothSelect } from "./SmoothSelect";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";

const SOURCE_MODE_PASTE = "Use form fields / paste source material";
const SOURCE_MODE_UPLOAD = "Upload PDF / DOCX / text source";

const SOURCE_FIELD_BY_SLUG: Record<string, string> = {
  "curriculum-unit-backward-design-planner": "standards_outcomes",
  "standards-alignment-unpacking-generator": "standards_text",
  "lesson-plan-architect": "lesson_topic_objective",
  "scope-sequence-builder": "content_skills_prerequisites",
  "project-based-learning-unit-planner": "standards_learning_goals",
  "interdisciplinary-learning-experience-planner": "disciplines_standards",
  "worksheet-independent-practice-generator": "source_material",
  "discussion-seminar-debate-planner": "topic_text_question",
  "differentiated-instruction-planner": "lesson_content_goal",
  "udl-lesson-adapter": "lesson_resource",
  "reading-level-text-adaptation-generator": "source_text",
  "multilingual-learner-support-planner": "content_lesson_goal",
  "accommodation-accessibility-support-planner": "documented_needs",
  "scaffold-worked-example-generator": "skill_problem",
  "quiz-test-generator": "content_standards",
  "question-bank-assessment-blueprint-generator": "curriculum_content",
  "rubric-success-criteria-generator": "assignment_task",
  "performance-task-authentic-assessment-generator": "learning_goals_context",
  "student-work-feedback-generator": "student_work",
  "misconception-error-analysis-generator": "responses_work",
  "progress-monitoring-intervention-planner": "evidence_support_history",
  "study-guide-learning-pack-generator": "source_material",
  "flashcard-deck-generator": "source_material",
  "practice-test-answer-explanation-generator": "source_material",
};

function defaultSelectValues(tool: Tool) {
  return Object.fromEntries(
    tool.inputs
      .filter((input) => input.type === "select" && input.options?.length)
      .map((input) => [input.id, input.options?.[0] || ""]),
  );
}

function extensionOf(file: File) {
  const index = file.name.lastIndexOf(".");
  return index >= 0 ? file.name.slice(index + 1).toLowerCase() : "";
}

function isDocument(file: File) {
  const extension = extensionOf(file);
  return extension === "pdf" || extension === "docx" || file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isReadableSource(file: File) {
  const extension = extensionOf(file);
  return isDocument(file) || file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || ["txt", "md", "markdown", "csv", "json", "rtf", "html", "htm", "xml", "log"].includes(extension);
}

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected learning source."));
    reader.readAsText(file);
  });
}

function OpenField({ input, value, required, onChange }: { input: ToolInput; value: string; required: boolean; onChange: (value: string) => void }) {
  if (input.type === "select") {
    return <SmoothSelect id={input.id} value={value} options={input.options || []} required={required} onChange={(_, selected) => onChange(selected)} />;
  }
  if (input.type === "textarea") {
    return <textarea id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="min-h-28 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-amber-300/70" />;
  }
  return <input id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/70" />;
}

export function EducationLearningTextPanel({ tool }: { tool: Tool }) {
  const [formData, setFormData] = useState<Record<string, string>>(() => defaultSelectValues(tool));
  const [sourceMode, setSourceMode] = useState(SOURCE_MODE_PASTE);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const sourceFieldId = SOURCE_FIELD_BY_SLUG[tool.slug];
  const hasSourceWorkspace = Boolean(sourceFieldId);
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const commonIds = new Set(["grade_level", "learning_context", "framework", "output_depth", "output_tone", "language", "must_preserve"]);
  const primaryInputs = tool.inputs.filter((input) => !commonIds.has(input.id));
  const professionalInputs = tool.inputs.filter((input) => commonIds.has(input.id));
  const setValue = (id: string, value: string) => setFormData((current) => ({ ...current, [id]: value }));
  const isRequired = (input: ToolInput) => input.required && !(sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId);

  const extractSource = async () => {
    if (!sourceFile) throw new Error("Upload a PDF, DOCX, or readable text source.");
    if (!isReadableSource(sourceFile)) throw new Error("Upload PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG.");
    if (sourceFile.size > 8 * 1024 * 1024) throw new Error("The learning source must be under 8 MB. Upload a focused extract or paste the relevant section.");

    let text = "";
    let sourceType = `${extensionOf(sourceFile).toUpperCase() || "Source"} file`;
    if (isDocument(sourceFile)) {
      setOutput(`Reading ${sourceFile.name}…\n\nExtracting real text before creating the learning resource.`);
      const payload = new FormData();
      payload.append("file", sourceFile, sourceFile.name);
      const response = await fetch("/api/file/extract", { method: "POST", body: payload });
      const data = await response.json().catch(() => null) as { text?: string; sourceType?: string; error?: string } | null;
      if (!response.ok || !data?.text) throw new Error(data?.error || "Could not read this source file.");
      text = data.text;
      sourceType = data.sourceType || sourceType;
    } else {
      text = (await readText(sourceFile)).replace(/\u0000/g, "").trim();
    }
    if (text.length < 20) throw new Error("The source file does not contain enough readable text.");
    return { text, sourceType };
  };

  const prepareInputs = async () => {
    if (!hasSourceWorkspace || sourceMode !== SOURCE_MODE_UPLOAD) return formData;
    const extracted = await extractSource();
    const educatorNotes = (formData[sourceFieldId] || "").trim();
    const available = Math.max(5000, 62000 - educatorNotes.length);
    const sourceText = extracted.text.length > available ? `${extracted.text.slice(0, available)}\n\n[The source exceeded the input limit; only the first section was used. Upload a focused extract for deeper work.]` : extracted.text;
    const combined = [
      educatorNotes ? `Educator / learner notes and focus:\n${educatorNotes}` : "",
      `Uploaded learning source: ${sourceFile?.name || "source"} (${extracted.sourceType}).`,
      "Use only this extracted source for source-specific facts, standards, answers, quotations, criteria, learner evidence, and official wording. Do not claim access to absent pages, images, figures, appendices, metadata, links, answer keys, or references.",
      "",
      sourceText,
    ].filter(Boolean).join("\n\n");
    return { ...formData, [sourceFieldId]: combined, source_mode: sourceMode, uploaded_text_file_name: sourceFile?.name || "", uploaded_file_type: extracted.sourceType };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setOutput("");
    try {
      const inputs = await prepareInputs();
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: tool.slug, inputs }),
      });
      if (!response.ok) {
        const text = await response.text();
        const data = (() => { try { return JSON.parse(text) as { error?: string; details?: string; requiredCredits?: number; currentCredits?: number }; } catch { return null; } })();
        if (response.status === 402) throw new Error(`Not enough credits. This request needs ${data?.requiredCredits ?? creditEstimate.credits}; current balance: ${data?.currentCredits ?? 0}.`);
        throw new Error([data?.error || text || "Generation failed.", data?.details].filter(Boolean).join("\n\n"));
      }
      if (!response.body) throw new Error("The generation response was empty.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let next = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        next += decoder.decode(value, { stream: true });
        setOutput(next);
      }
    } catch (error) {
      setOutput(`Error:\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(340px,.72fr)_minmax(0,1.28fr)] xl:items-start">
      <section className="min-w-0">
        <div className="mb-7 flex items-start justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-amber-300/80">Professional learning-design workspace</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Create a source-grounded teaching or study resource</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Supply the exact standards, learner evidence, source content, assessment purpose, and classroom constraints. Missing information remains visible for educator review.</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">{creditEstimate.label}</span>
        </div>

        <form onSubmit={submit} className="space-y-0">
          {primaryInputs.map((input) => (
            <div key={input.id} className="border-b border-white/10 py-5">
              <label htmlFor={input.id} className="text-sm font-bold text-white">{input.label}{isRequired(input) ? <span className="ml-1 text-amber-300">*</span> : null}</label>
              {sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId ? <p className="mt-2 text-xs leading-5 text-slate-500">Optional educator notes or extraction focus. The uploaded source will populate this field during generation.</p> : null}
              <OpenField input={input} value={formData[input.id] || ""} required={isRequired(input)} onChange={(value) => setValue(input.id, value)} />
            </div>
          ))}

          {hasSourceWorkspace ? (
            <div className="border-b border-white/10 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Source document</p>
                  <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">Attach one readable curriculum, lesson, assessment, learner-work, textbook, notes, or evidence document. Its extracted text is inserted into the correct field.</p>
                </div>
                <div className="min-w-[270px]"><SmoothSelect id={`${tool.slug}-source-mode`} value={sourceMode} options={[SOURCE_MODE_PASTE, SOURCE_MODE_UPLOAD]} required onChange={(_, value) => { setSourceMode(value); if (value !== SOURCE_MODE_UPLOAD) setSourceFile(null); }} /></div>
              </div>
              {sourceMode === SOURCE_MODE_UPLOAD ? (
                <div className="mt-5">
                  <input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event: ChangeEvent<HTMLInputElement>) => { setSourceFile(event.target.files?.[0] || null); setOutput(""); }} className="w-full cursor-pointer border-0 border-b border-dashed border-amber-300/30 bg-transparent py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-amber-400/10 file:px-4 file:py-2 file:font-bold file:text-amber-100" />
                  <p className="mt-2 text-xs text-slate-500">PDF, DOCX, or text-based files under 8 MB. Image-only scans require readable extracted or pasted text.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <details className="group border-b border-white/10 py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white"><span>Professional education controls</span><span className="text-amber-300 transition group-open:rotate-45">＋</span></summary>
            <div className="mt-3">
              {professionalInputs.map((input) => (
                <div key={input.id} className="border-t border-white/[.07] py-4">
                  <label htmlFor={input.id} className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{input.label}{input.required ? <span className="ml-1 text-amber-300">*</span> : null}</label>
                  <OpenField input={input} value={formData[input.id] || ""} required={input.required} onChange={(value) => setValue(input.id, value)} />
                </div>
              ))}
            </div>
          </details>

          <button type="submit" disabled={isLoading} className="group relative mt-7 flex w-full overflow-hidden rounded-full p-[1px] disabled:cursor-not-allowed disabled:opacity-65">
            <span className="absolute inset-[-60%] animate-[educationFlow_5s_linear_infinite] bg-[conic-gradient(from_0deg,#f59e0b,#8b5cf6,#06b6d4,#22c55e,#f59e0b)]" />
            <span className="relative flex w-full items-center justify-center gap-2 rounded-full bg-[#08060f]/90 px-6 py-3.5 font-bold text-white backdrop-blur-xl transition group-hover:bg-[#0d0918]/80">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Designing…</> : <><ThemeIcon name="spark" size="xs" />Generate — {creditEstimate.credits} credits</>}
            </span>
          </button>
        </form>
        <style jsx>{`@keyframes educationFlow{to{transform:rotate(360deg)}}`}</style>
      </section>

      <section className="min-w-0 xl:sticky xl:top-28">
        <OutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={tool.slug} toolSlug={tool.slug} inputs={formData} />
      </section>
    </div>
  );
}
