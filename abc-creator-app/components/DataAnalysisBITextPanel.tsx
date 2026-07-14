"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { OutputPanel } from "./OutputPanel";
import { SmoothSelect } from "./SmoothSelect";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";

const SOURCE_MODE_PASTE = "Use form fields / paste data or requirements";
const SOURCE_MODE_UPLOAD = "Upload CSV / TSV / JSON / document";

const SOURCE_FIELD_BY_SLUG: Record<string, string> = {
  "data-analysis-brief-generator": "available_data_context",
  "data-dictionary-metric-definition-generator": "fields_metrics_inventory",
  "data-quality-audit-planner": "known_rules_issues",
  "data-cleaning-transformation-plan-generator": "raw_data_structure",
  "missing-data-outlier-review-generator": "dataset_profile_sample",
  "exploratory-data-analysis-planner": "analysis_question_dataset",
  "descriptive-statistics-interpretation-generator": "statistics_tables",
  "segmentation-cohort-analysis-planner": "variables_events_windows",
  "time-series-trend-seasonality-analyzer": "time_series_data_summary",
  "forecasting-experiment-planner": "history_drivers_constraints",
  "ab-test-analysis-planner": "metrics_data_windows",
  "correlation-causation-audit-generator": "claim_analysis_result",
  "root-cause-analysis-generator": "available_evidence_timeline",
  "kpi-framework-metric-tree-generator": "existing_metrics_definitions",
  "executive-dashboard-requirements-generator": "metrics_data_availability",
  "dashboard-story-layout-planner": "metrics_dimensions_questions",
  "bi-report-requirements-generator": "data_metrics_logic",
  "sql-analysis-query-planner": "schema_tables_relationships",
  "sql-query-review-optimization-generator": "sql_query",
  "data-model-star-schema-planner": "source_entities_grain",
  "semantic-layer-metric-store-planner": "metrics_dimensions_models",
  "etl-elt-pipeline-requirements-generator": "sources_targets_sla",
  "dbt-model-test-documentation-planner": "sources_business_models",
  "data-validation-reconciliation-plan-generator": "systems_datasets_flow",
  "spreadsheet-analysis-formula-planner": "fields_rules_examples",
  "pivot-table-analysis-plan-generator": "dataset_columns_grain",
  "business-performance-review-generator": "performance_results_targets",
  "sales-revenue-analysis-planner": "data_metrics_definitions",
  "marketing-analytics-plan-generator": "tracking_cost_outcome_data",
  "customer-product-analytics-plan-generator": "events_entities_metrics",
  "operations-inventory-analytics-planner": "events_stock_cost_data",
  "executive-insight-decision-memo-generator": "analysis_findings_evidence",
};

function defaultSelectValues(tool: Tool) {
  return Object.fromEntries(tool.inputs.filter((input) => input.type === "select" && input.options?.length).map((input) => [input.id, input.options?.[0] || ""]));
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
  return isDocument(file) || file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || ["csv", "tsv", "txt", "md", "markdown", "json", "jsonl", "ndjson", "rtf", "html", "htm", "xml", "log", "sql"].includes(extension);
}

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected data source."));
    reader.readAsText(file);
  });
}

function parseDelimited(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(field); field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function inferType(values: string[]) {
  const present = values.map((value) => value.trim()).filter(Boolean);
  if (!present.length) return "empty / unknown";
  const numeric = present.filter((value) => Number.isFinite(Number(value.replace(/,/g, "")))).length;
  const dates = present.filter((value) => !Number.isNaN(Date.parse(value)) && /[-/:]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(value)).length;
  const booleans = present.filter((value) => /^(true|false|yes|no|0|1)$/i.test(value)).length;
  if (numeric / present.length >= 0.9) return "numeric";
  if (dates / present.length >= 0.9) return "date/time";
  if (booleans / present.length >= 0.9) return "boolean-like";
  return "text / mixed";
}

function profileRows(rows: string[][], fileName: string) {
  if (!rows.length) return "No structured rows could be parsed.";
  const width = Math.max(...rows.map((row) => row.length));
  const rawHeaders = rows[0].map((value, index) => value.trim() || `column_${index + 1}`);
  const headers = Array.from({ length: width }, (_, index) => rawHeaders[index] || `column_${index + 1}`);
  const dataRows = rows.slice(1);
  const columnLines = headers.map((header, index) => {
    const values = dataRows.slice(0, 2000).map((row) => String(row[index] ?? ""));
    const missing = values.filter((value) => value.trim() === "").length;
    const unique = new Set(values.filter((value) => value.trim() !== "").slice(0, 2000)).size;
    return `- ${header}: inferred ${inferType(values)}; missing ${missing}/${values.length}; observed unique values in profile sample ${unique}`;
  });
  const sample = [headers, ...dataRows.slice(0, 20)].map((row) => row.map((value) => String(value ?? "").replace(/\s+/g, " ").slice(0, 160)).join(" | ")).join("\n");
  return [`Dataset profile for ${fileName}`, `Parsed rows: ${dataRows.length}`, `Columns: ${headers.length}`, "Column profile (first 2,000 rows maximum):", ...columnLines, "", "First rows (pipe-delimited preview, not recalculated):", sample].join("\n");
}

function profileJson(text: string, fileName: string) {
  try {
    const parsed = JSON.parse(text) as unknown;
    const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
    if (!records.length || records.some((record) => !record || typeof record !== "object" || Array.isArray(record))) return `JSON source ${fileName}: valid JSON, but not a flat object or array of objects.`;
    const keys = Array.from(new Set(records.slice(0, 2000).flatMap((record) => Object.keys(record as Record<string, unknown>))));
    const rows = [keys, ...records.slice(0, 2000).map((record) => keys.map((key) => {
      const value = (record as Record<string, unknown>)[key];
      return value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
    }))];
    return profileRows(rows, fileName);
  } catch {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const records = lines.slice(0, 2000).map((line) => { try { return JSON.parse(line) as Record<string, unknown>; } catch { return null; } }).filter((record): record is Record<string, unknown> => Boolean(record && typeof record === "object" && !Array.isArray(record)));
    if (!records.length) return `JSON/NDJSON source ${fileName}: parsing failed. Inspect delimiters or encoding.`;
    const keys = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
    return profileRows([keys, ...records.map((record) => keys.map((key) => record[key] == null ? "" : typeof record[key] === "string" ? String(record[key]) : JSON.stringify(record[key])))], fileName);
  }
}

function OpenField({ input, value, required, onChange }: { input: ToolInput; value: string; required: boolean; onChange: (value: string) => void }) {
  if (input.type === "select") return <SmoothSelect id={input.id} value={value} options={input.options || []} required={required} onChange={(_, selected) => onChange(selected)} />;
  if (input.type === "textarea") return <textarea id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="min-h-28 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-sky-300/70" />;
  return <input id={input.id} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={input.placeholder} className="w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300/70" />;
}

export function DataAnalysisBITextPanel({ tool }: { tool: Tool }) {
  const [formData, setFormData] = useState<Record<string, string>>(() => defaultSelectValues(tool));
  const [sourceMode, setSourceMode] = useState(SOURCE_MODE_PASTE);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const sourceFieldId = SOURCE_FIELD_BY_SLUG[tool.slug];
  const hasSourceWorkspace = Boolean(sourceFieldId);
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const commonIds = new Set(["stakeholder_audience", "evidence_mode", "dataset_scale", "output_depth", "output_tone", "language", "must_preserve"]);
  const primaryInputs = tool.inputs.filter((input) => !commonIds.has(input.id));
  const professionalInputs = tool.inputs.filter((input) => commonIds.has(input.id));
  const setValue = (id: string, value: string) => setFormData((current) => ({ ...current, [id]: value }));
  const isRequired = (input: ToolInput) => input.required && !(sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId);

  const extractSource = async () => {
    if (!sourceFile) throw new Error("Upload a CSV, TSV, JSON, PDF, DOCX, or readable text source.");
    if (!isReadableSource(sourceFile)) throw new Error("Upload CSV, TSV, JSON, NDJSON, TXT, MD, SQL, PDF, DOCX, RTF, HTML, XML, or LOG. Export XLSX sheets to CSV before upload.");
    if (sourceFile.size > 8 * 1024 * 1024) throw new Error("The source must be under 8 MB. Upload a focused extract or representative sample.");
    let text = "";
    let sourceType = `${extensionOf(sourceFile).toUpperCase() || "Source"} file`;
    if (isDocument(sourceFile)) {
      setOutput(`Reading ${sourceFile.name}…\n\nExtracting real text before analysis planning.`);
      const payload = new FormData(); payload.append("file", sourceFile, sourceFile.name);
      const response = await fetch("/api/file/extract", { method: "POST", body: payload });
      const data = await response.json().catch(() => null) as { text?: string; sourceType?: string; error?: string } | null;
      if (!response.ok || !data?.text) throw new Error(data?.error || "Could not read this document.");
      text = data.text; sourceType = data.sourceType || sourceType;
    } else text = (await readText(sourceFile)).replace(/\u0000/g, "").trim();
    if (text.length < 20) throw new Error("The source does not contain enough readable content.");
    const extension = extensionOf(sourceFile);
    let profile = "Text or requirements document; no structured row profile generated.";
    if (extension === "csv" || extension === "tsv") profile = profileRows(parseDelimited(text, extension === "tsv" ? "\t" : ","), sourceFile.name);
    else if (["json", "jsonl", "ndjson"].includes(extension) || sourceFile.type === "application/json") profile = profileJson(text, sourceFile.name);
    return { text, sourceType, profile };
  };

  const prepareInputs = async () => {
    if (!hasSourceWorkspace || sourceMode !== SOURCE_MODE_UPLOAD) return formData;
    const extracted = await extractSource();
    const notes = (formData[sourceFieldId] || "").trim();
    const available = Math.max(5000, 58000 - notes.length - extracted.profile.length);
    const sourceText = extracted.text.length > available ? `${extracted.text.slice(0, available)}\n\n[Source clipped to the input limit. Use a focused extract for deeper work.]` : extracted.text;
    const combined = [notes ? `Analyst notes / focus:\n${notes}` : "", `Uploaded source: ${sourceFile?.name || "source"} (${extracted.sourceType}).`, "Use only this source and deterministic profile for source-specific facts, values, schema, metrics, SQL, and relationships. Do not claim execution, database access, workbook access, or validation beyond the supplied content.", "", sourceText].filter(Boolean).join("\n\n");
    return { ...formData, [sourceFieldId]: combined, source_mode: sourceMode, source_content: sourceText, uploaded_text_file_name: sourceFile?.name || "", uploaded_file_type: extracted.sourceType, dataset_profile: extracted.profile };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setIsLoading(true); setOutput("");
    try {
      const inputs = await prepareInputs();
      const response = await fetch("/api/generate/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolSlug: tool.slug, inputs }) });
      if (!response.ok) {
        const text = await response.text();
        const data = (() => { try { return JSON.parse(text) as { error?: string; details?: string; requiredCredits?: number; currentCredits?: number }; } catch { return null; } })();
        if (response.status === 402) throw new Error(`Not enough credits. This request needs ${data?.requiredCredits ?? creditEstimate.credits}; current balance: ${data?.currentCredits ?? 0}.`);
        throw new Error([data?.error || text || "Generation failed.", data?.details].filter(Boolean).join("\n\n"));
      }
      if (!response.body) throw new Error("The generation response was empty.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let next = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; next += decoder.decode(value, { stream: true }); setOutput(next); }
    } catch (error) { setOutput(`Error:\n${error instanceof Error ? error.message : String(error)}`); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(340px,.72fr)_minmax(0,1.28fr)] xl:items-start">
      <section className="min-w-0">
        <div className="mb-7 flex items-start justify-between gap-5 border-b border-white/10 pb-6">
          <div><p className="text-xs font-bold uppercase tracking-[.28em] text-sky-300/80">Source-grounded analytics workspace</p><h2 className="mt-3 text-2xl font-bold text-white">Build a governed analysis or BI deliverable</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Supply the decision, grain, definitions, dataset, schema, and operating constraints. Uploaded structured data is profiled deterministically before generation.</p></div>
          <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">{creditEstimate.label}</span>
        </div>
        <form onSubmit={submit} className="space-y-0">
          {primaryInputs.map((input) => <div key={input.id} className="border-b border-white/10 py-5"><label htmlFor={input.id} className="text-sm font-bold text-white">{input.label}{isRequired(input) ? <span className="ml-1 text-sky-300">*</span> : null}</label>{sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId ? <p className="mt-2 text-xs leading-5 text-slate-500">Optional analyst notes or extraction focus. The uploaded source will populate this field.</p> : null}<OpenField input={input} value={formData[input.id] || ""} required={isRequired(input)} onChange={(value) => setValue(input.id, value)} /></div>)}
          {hasSourceWorkspace ? <div className="border-b border-white/10 py-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-white">Data or requirements source</p><p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">Attach CSV, TSV, JSON/NDJSON, text, SQL, PDF, or DOCX. Structured files receive a deterministic schema, missingness, type, uniqueness, and row preview profile.</p></div><div className="min-w-[290px]"><SmoothSelect id={`${tool.slug}-source-mode`} value={sourceMode} options={[SOURCE_MODE_PASTE, SOURCE_MODE_UPLOAD]} required onChange={(_, value) => { setSourceMode(value); if (value !== SOURCE_MODE_UPLOAD) setSourceFile(null); }} /></div></div>{sourceMode === SOURCE_MODE_UPLOAD ? <div className="mt-5"><input type="file" accept=".csv,.tsv,.json,.jsonl,.ndjson,.txt,.md,.markdown,.sql,.pdf,.docx,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event: ChangeEvent<HTMLInputElement>) => { setSourceFile(event.target.files?.[0] || null); setOutput(""); }} className="w-full cursor-pointer border-0 border-b border-dashed border-sky-300/30 bg-transparent py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-sky-400/10 file:px-4 file:py-2 file:font-bold file:text-sky-100" /><p className="mt-2 text-xs text-slate-500">Files must be under 8 MB. Export XLSX worksheets to CSV. Image-only scans need readable extracted or pasted text.</p></div> : null}</div> : null}
          <details className="group border-b border-white/10 py-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white"><span>Professional analytics controls</span><span className="text-sky-300 transition group-open:rotate-45">＋</span></summary><div className="mt-3">{professionalInputs.map((input) => <div key={input.id} className="border-t border-white/[.07] py-4"><label htmlFor={input.id} className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{input.label}{input.required ? <span className="ml-1 text-sky-300">*</span> : null}</label><OpenField input={input} value={formData[input.id] || ""} required={input.required} onChange={(value) => setValue(input.id, value)} /></div>)}</div></details>
          <button type="submit" disabled={isLoading} className="group relative mt-7 flex w-full overflow-hidden rounded-full p-[1px] disabled:cursor-not-allowed disabled:opacity-65"><span className="absolute inset-[-60%] animate-[dataFlow_5s_linear_infinite] bg-[conic-gradient(from_0deg,#2563eb,#06b6d4,#8b5cf6,#10b981,#2563eb)]"/><span className="relative flex w-full items-center justify-center gap-2 rounded-full bg-[#060914]/90 px-6 py-3.5 font-bold text-white backdrop-blur-xl transition group-hover:bg-[#09101d]/80">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Analyzing…</> : <><ThemeIcon name="spark" size="xs"/>Generate — {creditEstimate.credits} credits</>}</span></button>
        </form><style jsx>{`@keyframes dataFlow{to{transform:rotate(360deg)}}`}</style>
      </section>
      <section className="min-w-0 xl:sticky xl:top-28"><OutputPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={tool.slug} toolSlug={tool.slug} inputs={formData} /></section>
    </div>
  );
}
