"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { OutputPanel } from "./OutputPanel";
import { SmoothSelect } from "./SmoothSelect";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";

const SOURCE_MODE_PASTE = "Use form fields / paste source excerpts";
const SOURCE_MODE_UPLOAD = "Upload PDF / DOCX / text source";

const SOURCE_FIELD_BY_SLUG: Record<string, string> = {
  "research-question-refiner": "known_evidence",
  "literature-search-strategy-generator": "concepts_terms",
  "boolean-search-query-builder": "synonyms_vocabulary",
  "source-discovery-triage-planner": "source_universe",
  "source-credibility-relevance-evaluator": "source_details",
  "academic-paper-analyzer": "paper_content",
  "study-design-methods-analyzer": "methods_content",
  "citation-context-analyzer": "citing_contexts",
  "evidence-extraction-matrix-generator": "studies_sources",
  "literature-review-synthesizer": "source_material",
  "screening-eligibility-planner": "draft_criteria",
  "risk-of-bias-quality-appraisal-planner": "available_study_details",
  "evidence-certainty-strength-assessor": "body_of_evidence",
  "contradiction-consensus-mapper": "source_findings",
  "research-gap-finder": "literature_summary",
  "theoretical-framework-builder": "candidate_theories_evidence",
  "claim-evidence-matrix-generator": "sources_evidence",
  "fact-checking-research-plan-generator": "available_sources",
  "research-notes-organizer": "raw_notes",
  "source-annotation-reading-note-generator": "source_content_metadata",
  "citation-reference-audit-generator": "draft_with_citations",
  "argument-map-generator": "claims_evidence_objections",
  "research-brief-generator": "source_material_findings",
  "executive-research-report-generator": "evidence_analysis",
  "research-to-action-decision-memo-generator": "research_evidence",
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
    reader.onerror = () => reject(new Error("Could not read the selected source file."));
    reader.readAsText(file);
  });
}

function OpenField({ input, value, required, onChange }: { input: ToolInput; value: string; required: boolean; onChange: (value: string) => void }) {
  if (input.type === "select") {
    return <SmoothSelect id={input.id} value={value} options={input.options || []} required={required} onChange={(_, selected) => onChange(selected)} />;
  }
  if (input.type === "textarea") {
    return <textarea id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="min-h-28 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-purple-300/70" />;
  }
  return <input id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-300/70" />;
}

export function ResearchKnowledgeTextPanel({ tool }: { tool: Tool }) {
  const [formData, setFormData] = useState<Record<string, string>>(() => defaultSelectValues(tool));
  const [sourceMode, setSourceMode] = useState(SOURCE_MODE_PASTE);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const sourceFieldId = SOURCE_FIELD_BY_SLUG[tool.slug];
  const hasSourceWorkspace = Boolean(sourceFieldId);
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const commonIds = new Set(["discipline", "evidence_mode", "output_depth", "output_tone", "language", "must_preserve"]);
  const primaryInputs = tool.inputs.filter((input) => !commonIds.has(input.id));
  const professionalInputs = tool.inputs.filter((input) => commonIds.has(input.id));
  const setValue = (id: string, value: string) => setFormData((current) => ({ ...current, [id]: value }));
  const isRequired = (input: ToolInput) => input.required && !(sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId);

  const extractSource = async () => {
    if (!sourceFile) throw new Error("Upload a PDF, DOCX, or readable text source.");
    if (!isReadableSource(sourceFile)) throw new Error("Upload PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG.");
    if (sourceFile.size > 8 * 1024 * 1024) throw new Error("The source file must be under 8 MB. Upload a smaller file or paste the most relevant section.");

    let text = "";
    let sourceType = `${extensionOf(sourceFile).toUpperCase() || "Source"} file`;
    if (isDocument(sourceFile)) {
      setOutput(`Reading ${sourceFile.name}…\n\nExtracting real text before research generation.`);
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
    const maxSourceLength = 54000;
    const clipped = text.length > maxSourceLength ? `${text.slice(0, maxSourceLength)}\n\n[The source exceeded ${maxSourceLength} characters; only the first section was used. Upload a focused extract for deeper analysis.]` : text;
    return { text: clipped, sourceType };
  };

  const prepareInputs = async () => {
    if (!hasSourceWorkspace || sourceMode !== SOURCE_MODE_UPLOAD) return formData;
    const extracted = await extractSource();
    const existingNotes = (formData[sourceFieldId] || "").trim();
    const combined = [
      existingNotes ? `Researcher notes / focus:\n${existingNotes}` : "",
      `Uploaded source: ${sourceFile?.name || "source"} (${extracted.sourceType}).`,
      "Use only this extracted source text for source-specific factual claims. Do not claim to have inspected pages, figures, appendices, metadata, links, or references that are absent from the extracted text.",
      "",
      extracted.text,
    ].filter(Boolean).join("\n\n");
    return { ...formData, [sourceFieldId]: combined };
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
            <p className="text-xs font-bold uppercase tracking-[.28em] text-purple-300/80">Source-grounded research workspace</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Build a traceable professional deliverable</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Supply the evidence, scope, decision context, and verification boundaries. Missing facts remain visibly unresolved rather than being fabricated.</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">{creditEstimate.label}</span>
        </div>

        <form onSubmit={submit} className="space-y-0">
          {primaryInputs.map((input) => (
            <div key={input.id} className="border-b border-white/10 py-5">
              <label htmlFor={input.id} className="text-sm font-bold text-white">{input.label}{isRequired(input) ? <span className="ml-1 text-purple-300">*</span> : null}</label>
              {sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId ? <p className="mt-2 text-xs leading-5 text-slate-500">Optional notes or extraction focus. The uploaded source will populate this evidence field during generation.</p> : null}
              <OpenField input={input} value={formData[input.id] || ""} required={isRequired(input)} onChange={(value) => setValue(input.id, value)} />
            </div>
          ))}

          {hasSourceWorkspace ? (
            <div className="border-b border-white/10 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Source document</p>
                  <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">Attach one readable source or evidence pack. Extracted text is inserted into the correct source field and remains bounded by the document.</p>
                </div>
                <div className="min-w-[270px]"><SmoothSelect id={`${tool.slug}-source-mode`} value={sourceMode} options={[SOURCE_MODE_PASTE, SOURCE_MODE_UPLOAD]} required onChange={(_, value) => { setSourceMode(value); if (value !== SOURCE_MODE_UPLOAD) setSourceFile(null); }} /></div>
              </div>
              {sourceMode === SOURCE_MODE_UPLOAD ? (
                <div className="mt-5">
                  <input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event: ChangeEvent<HTMLInputElement>) => { setSourceFile(event.target.files?.[0] || null); setOutput(""); }} className="w-full cursor-pointer border-0 border-b border-dashed border-purple-300/30 bg-transparent py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-purple-400/10 file:px-4 file:py-2 file:font-bold file:text-purple-100" />
                  <p className="mt-2 text-xs text-slate-500">PDF, DOCX, or text-based files under 8 MB. Image-only scans still need readable extracted or pasted text.</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <details className="group border-b border-white/10 py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white"><span>Professional research controls</span><span className="text-purple-300 transition group-open:rotate-45">＋</span></summary>
            <div className="mt-3">
              {professionalInputs.map((input) => (
                <div key={input.id} className="border-t border-white/[.07] py-4">
                  <label htmlFor={input.id} className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{input.label}{input.required ? <span className="ml-1 text-purple-300">*</span> : null}</label>
                  <OpenField input={input} value={formData[input.id] || ""} required={input.required} onChange={(value) => setValue(input.id, value)} />
                </div>
              ))}
            </div>
          </details>

          <button type="submit" disabled={isLoading} className="group relative mt-7 flex w-full overflow-hidden rounded-full p-[1px] disabled:cursor-not-allowed disabled:opacity-65">
            <span className="absolute inset-[-60%] animate-[researchTextFlow_5s_linear_infinite] bg-[conic-gradient(from_0deg,#4f46e5,#8b5cf6,#06b6d4,#ec4899,#4f46e5)]" />
            <span className="relative flex w-full items-center justify-center gap-2 rounded-full bg-[#08060f]/90 px-6 py-3.5 font-bold text-white backdrop-blur-xl transition group-hover:bg-[#0d0918]/80">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Researching…</> : <><ThemeIcon name="spark" size="xs" />Generate — {creditEstimate.credits} credits</>}
            </span>
          </button>
        </form>
        <style jsx>{`@keyframes researchTextFlow{to{transform:rotate(360deg)}}`}</style>
      </section>

      <section className="min-w-0 xl:sticky xl:top-28">
        <OutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={tool.slug} toolSlug={tool.slug} inputs={formData} />
      </section>
    </div>
  );
}
