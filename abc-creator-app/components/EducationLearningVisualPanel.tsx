"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { OutputPanel } from "./OutputPanel";
import { SmoothSelect } from "./SmoothSelect";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";
import { EDUCATION_LEARNING_VISUAL_PRESETS } from "@/lib/tools/education-learning-visual-config";

type NodeKind = "standard" | "outcome" | "lesson" | "assessment" | "concept" | "prerequisite" | "milestone" | "evidence" | "support" | "extension";
type NodeSpec = { id?: string; label?: string; level?: number; score?: number; weight?: number; kind?: string };
type EdgeSpec = { from?: string; to?: string; source?: string; target?: string; label?: string };
type DiagramSpec = { type?: string; title?: string; caption?: string; nodes?: Array<string | NodeSpec>; edges?: Array<[string, string, string?] | EdgeSpec>; data?: { nodes?: Array<string | NodeSpec>; edges?: Array<[string, string, string?] | EdgeSpec> } };
type ParsedNode = { id: string; label: string; level: number; score: number; kind: NodeKind };
type ParsedEdge = { from: string; to: string; label: string };
type PlacedNode = ParsedNode & { x: number; y: number };

const SOURCE_MODE_FORM = "Use form fields / paste learning data";
const SOURCE_MODE_UPLOAD = "Upload PDF / DOCX / text source";
const SOURCE_FIELD_BY_SLUG: Record<string, string> = {
  "curriculum-alignment-map-generator": "standards_lessons_assessments",
  "concept-prerequisite-map-generator": "concepts_relationships",
  "learning-journey-mastery-progression-generator": "levels_evidence",
};
const XML_ENTITIES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const ALLOWED_KINDS = new Set<NodeKind>(["standard", "outcome", "lesson", "assessment", "concept", "prerequisite", "milestone", "evidence", "support", "extension"]);
const KIND_COLORS: Record<NodeKind, { fill: string; stroke: string; dot: string }> = {
  standard: { fill: "rgba(59,130,246,.18)", stroke: "#60a5fa", dot: "#3b82f6" },
  outcome: { fill: "rgba(139,92,246,.18)", stroke: "#a78bfa", dot: "#8b5cf6" },
  lesson: { fill: "rgba(6,182,212,.17)", stroke: "#67e8f9", dot: "#06b6d4" },
  assessment: { fill: "rgba(245,158,11,.17)", stroke: "#fcd34d", dot: "#f59e0b" },
  concept: { fill: "rgba(168,85,247,.18)", stroke: "#c084fc", dot: "#a855f7" },
  prerequisite: { fill: "rgba(14,165,233,.17)", stroke: "#7dd3fc", dot: "#0ea5e9" },
  milestone: { fill: "rgba(34,197,94,.17)", stroke: "#86efac", dot: "#22c55e" },
  evidence: { fill: "rgba(236,72,153,.16)", stroke: "#f9a8d4", dot: "#ec4899" },
  support: { fill: "rgba(20,184,166,.16)", stroke: "#5eead4", dot: "#14b8a6" },
  extension: { fill: "rgba(249,115,22,.16)", stroke: "#fdba74", dot: "#f97316" },
};

function firstSelectValues(tool: Tool) {
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
  return isDocument(file) || file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || ["txt", "md", "markdown", "csv", "json", "rtf", "html", "htm", "xml", "log"].includes(extension);
}

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected curriculum source."));
    reader.readAsText(file);
  });
}

function diagramFromOutput(output: string): DiagramSpec | null {
  const match = /```abc-diagram\s*([\s\S]*?)```/i.exec(output);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as DiagramSpec;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function narrativeWithoutDiagram(output: string) {
  return output.replace(/```abc-diagram\s*[\s\S]*?```/gi, "").replace(/\n{4,}/g, "\n\n").trim();
}

function normalizeKind(value: string | undefined, mode: "curriculum" | "concept" | "mastery", index: number): NodeKind {
  const candidate = String(value || "").toLowerCase() as NodeKind;
  if (ALLOWED_KINDS.has(candidate)) return candidate;
  if (mode === "curriculum") return index === 0 ? "standard" : index % 3 === 0 ? "assessment" : index % 2 === 0 ? "lesson" : "outcome";
  if (mode === "mastery") return index === 0 ? "milestone" : index % 4 === 0 ? "evidence" : index % 5 === 0 ? "support" : "milestone";
  return index === 0 ? "concept" : "prerequisite";
}

function normalizeDiagram(spec: DiagramSpec | null, mode: "curriculum" | "concept" | "mastery") {
  const rawNodes = spec?.nodes || spec?.data?.nodes || [];
  const seen = new Set<string>();
  const nodes: ParsedNode[] = rawNodes.slice(0, 24).map((node, index) => {
    const raw = typeof node === "string" ? { id: node, label: node } : node;
    let id = String(raw.id || raw.label || `n${index}`).trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || `n${index}`;
    while (seen.has(id)) id = `${id}_${index + 1}`;
    seen.add(id);
    return {
      id,
      label: String(raw.label || raw.id || `Node ${index + 1}`).trim().slice(0, 90),
      level: Number.isFinite(Number(raw.level)) ? Math.max(0, Math.min(6, Number(raw.level))) : index === 0 ? 0 : 1,
      score: Number.isFinite(Number(raw.score ?? raw.weight)) ? Math.max(0, Math.min(100, Number(raw.score ?? raw.weight))) : 50,
      kind: normalizeKind(raw.kind, mode, index),
    };
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const rawEdges = spec?.edges || spec?.data?.edges || [];
  const edges: ParsedEdge[] = rawEdges.slice(0, 48).map((edge) => Array.isArray(edge)
    ? { from: String(edge[0] || ""), to: String(edge[1] || ""), label: String(edge[2] || "") }
    : { from: String(edge.from || edge.source || ""), to: String(edge.to || edge.target || ""), label: String(edge.label || "") }
  ).map((edge) => ({
    from: edge.from.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""),
    to: edge.to.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""),
    label: edge.label.trim().slice(0, 60),
  })).filter((edge) => edge.from && edge.to && nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to);
  return { nodes, edges };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => XML_ENTITIES[character] || character);
}

function wrapLabel(value: string, max = 23) {
  const lines: string[] = [];
  let current = "";
  value.split(/\s+/).forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) { lines.push(current); current = word; } else current = next;
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function distribute(group: ParsedNode[], x: number, top = 135, bottom = 585): PlacedNode[] {
  return group.map((node, index) => ({ ...node, x, y: top + ((index + 1) * (bottom - top)) / (group.length + 1) }));
}

function layoutNodes(nodes: ParsedNode[], mode: "curriculum" | "concept" | "mastery") {
  const width = 1240;
  const height = 720;
  if (!nodes.length) return { width, height, placed: [] as PlacedNode[] };

  if (mode === "curriculum") {
    const lanes: Array<{ kinds: NodeKind[]; x: number }> = [
      { kinds: ["standard"], x: 120 },
      { kinds: ["outcome", "concept", "prerequisite"], x: 355 },
      { kinds: ["lesson", "milestone", "support", "extension"], x: 625 },
      { kinds: ["assessment"], x: 895 },
      { kinds: ["evidence"], x: 1120 },
    ];
    const assigned = new Set<string>();
    const placed = lanes.flatMap((lane) => {
      const group = nodes.filter((node) => lane.kinds.includes(node.kind));
      group.forEach((node) => assigned.add(node.id));
      return distribute(group, lane.x);
    });
    const leftovers = nodes.filter((node) => !assigned.has(node.id));
    return { width, height, placed: [...placed, ...distribute(leftovers, 625)] };
  }

  const levels = new Map<number, ParsedNode[]>();
  nodes.forEach((node) => levels.set(node.level, [...(levels.get(node.level) || []), node]));
  const levelKeys = Array.from(levels.keys()).sort((a, b) => a - b);
  if (mode === "mastery") {
    const placed = levelKeys.flatMap((level, levelIndex) => distribute(levels.get(level) || [], 120 + (levelIndex * 1000) / Math.max(levelKeys.length - 1, 1), 150, 570));
    return { width, height, placed };
  }
  const placed = levelKeys.flatMap((level, levelIndex) => {
    const group = levels.get(level) || [];
    if (levelIndex === 0 && group.length === 1) return [{ ...group[0], x: 170, y: 360 }];
    return distribute(group, 250 + (levelIndex * 890) / Math.max(levelKeys.length - 1, 1), 125, 600);
  });
  return { width, height, placed };
}

function diagramSvg(spec: DiagramSpec, mode: "curriculum" | "concept" | "mastery") {
  const { nodes, edges } = normalizeDiagram(spec, mode);
  const { width, height, placed } = layoutNodes(nodes, mode);
  const positions = new Map(placed.map((node) => [node.id, node]));
  const title = escapeXml(spec.title || (mode === "curriculum" ? "Curriculum Alignment Map" : mode === "mastery" ? "Learning Journey & Mastery Progression" : "Concept & Prerequisite Map"));
  const caption = escapeXml(spec.caption || "Built only from supplied curriculum and learning evidence; verify every relationship before use.");
  const edgeSvg = edges.map((edge, index) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return "";
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const bend = index % 2 === 0 ? -18 : 18;
    return `<g><path d="M ${from.x} ${from.y} C ${midX} ${from.y + bend}, ${midX} ${to.y - bend}, ${to.x} ${to.y}" fill="none" stroke="rgba(148,163,184,.48)" stroke-width="2" marker-end="url(#arrow)"/>${edge.label ? `<text x="${midX}" y="${midY - 8}" text-anchor="middle" fill="#cbd5e1" font-size="10.5" font-family="Inter,Arial">${escapeXml(edge.label).slice(0, 46)}</text>` : ""}</g>`;
  }).join("");
  const nodeSvg = placed.map((node) => {
    const palette = KIND_COLORS[node.kind];
    const lines = wrapLabel(escapeXml(node.label).slice(0, 82));
    const widthBoost = Math.min(32, Math.max(0, node.score - 50) * 0.4);
    const boxWidth = 188 + widthBoost;
    return `<g><rect x="${node.x - boxWidth / 2}" y="${node.y - 38}" width="${boxWidth}" height="76" rx="21" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="1.5"/><circle cx="${node.x - boxWidth / 2 + 22}" cy="${node.y - 17}" r="6" fill="${palette.dot}"/><text x="${node.x}" y="${node.y - (lines.length - 1) * 7}" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="750" font-family="Inter,Arial">${lines.map((line, lineIndex) => `<tspan x="${node.x}" dy="${lineIndex ? 15 : 0}">${line}</tspan>`).join("")}</text><text x="${node.x + boxWidth / 2 - 12}" y="${node.y + 29}" text-anchor="end" fill="#94a3b8" font-size="8.5" font-family="Inter,Arial">${escapeXml(node.kind)}</text></g>`;
  }).join("");
  const laneLabels = mode === "curriculum" ? `<g fill="#64748b" font-size="10" font-family="Inter,Arial" text-anchor="middle"><text x="120" y="120">STANDARDS</text><text x="355" y="120">OUTCOMES</text><text x="625" y="120">INSTRUCTION</text><text x="895" y="120">ASSESSMENT</text><text x="1120" y="120">EVIDENCE</text></g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#05040b"/><stop offset="0.5" stop-color="#0b0716"/><stop offset="1" stop-color="#071319"/></linearGradient><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" opacity=".68"/></marker><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,.07)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" rx="30" fill="url(#bg)"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="30" fill="url(#grid)" stroke="rgba(245,158,11,.32)"/><text x="64" y="62" fill="#ffffff" font-size="28" font-weight="800" font-family="Inter,Arial">${title}</text><text x="64" y="91" fill="#94a3b8" font-size="13" font-family="Inter,Arial">${caption.slice(0, 150)}</text>${laneLabels}${edgeSvg}${nodeSvg}<text x="64" y="680" fill="#64748b" font-size="11" font-family="Inter,Arial">Deterministic learning visual • Verify standards, prerequisites, assessment links, and mastery claims</text></svg>`;
}

function downloadSvg(svg: string, filename: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadPng(svg: string, filename: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not render the learning map.")); image.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = 2480;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  anchor.click();
}

function OpenField({ input, value, required, onChange }: { input: ToolInput; value: string; required: boolean; onChange: (value: string) => void }) {
  if (input.type === "select") return <SmoothSelect id={input.id} value={value} options={input.options || []} required={required} onChange={(_, selected) => onChange(selected)} />;
  if (input.type === "textarea") return <textarea id={input.id} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={input.placeholder} className="min-h-28 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-amber-300/65" />;
  return <input id={input.id} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={input.placeholder} className="w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/65" />;
}

export function EducationLearningVisualPanel({ tool }: { tool: Tool }) {
  const preset = EDUCATION_LEARNING_VISUAL_PRESETS[tool.slug] || EDUCATION_LEARNING_VISUAL_PRESETS["curriculum-alignment-map-generator"];
  const [formData, setFormData] = useState<Record<string, string>>(() => firstSelectValues(tool));
  const [sourceMode, setSourceMode] = useState(SOURCE_MODE_FORM);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const sourceFieldId = SOURCE_FIELD_BY_SLUG[tool.slug];
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const diagram = useMemo(() => diagramFromOutput(output), [output]);
  const narrative = useMemo(() => narrativeWithoutDiagram(output), [output]);
  const svg = useMemo(() => diagram ? diagramSvg(diagram, preset.mode) : "", [diagram, preset.mode]);
  const commonIds = new Set(["grade_level", "learning_context", "framework", "output_depth", "output_tone", "language", "must_preserve"]);
  const primaryInputs = tool.inputs.filter((input) => !commonIds.has(input.id));
  const professionalInputs = tool.inputs.filter((input) => commonIds.has(input.id));
  const setValue = (id: string, value: string) => setFormData((current) => ({ ...current, [id]: value }));
  const isRequired = (input: ToolInput) => input.required && !(sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId);

  const extractSource = async () => {
    if (!sourceFile) throw new Error("Upload a PDF, DOCX, or readable text source.");
    if (!isReadableSource(sourceFile)) throw new Error("Upload PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG.");
    if (sourceFile.size > 8 * 1024 * 1024) throw new Error("The curriculum source must be under 8 MB.");
    let text = "";
    let sourceType = `${extensionOf(sourceFile).toUpperCase() || "Source"} file`;
    if (isDocument(sourceFile)) {
      setOutput(`Reading ${sourceFile.name}…\n\nExtracting source text before building the learning map.`);
      const payload = new FormData();
      payload.append("file", sourceFile, sourceFile.name);
      const response = await fetch("/api/file/extract", { method: "POST", body: payload });
      const data = await response.json().catch(() => null) as { text?: string; sourceType?: string; error?: string } | null;
      if (!response.ok || !data?.text) throw new Error(data?.error || "Could not read the source file.");
      text = data.text;
      sourceType = data.sourceType || sourceType;
    } else {
      text = (await readText(sourceFile)).replace(/\u0000/g, "").trim();
    }
    if (text.length < 20) throw new Error("The uploaded source does not contain enough readable text.");
    return { text, sourceType };
  };

  const prepareInputs = async () => {
    if (sourceMode !== SOURCE_MODE_UPLOAD) return formData;
    const extracted = await extractSource();
    const notes = (formData[sourceFieldId] || "").trim();
    const available = Math.max(5000, 62000 - notes.length);
    const sourceText = extracted.text.length > available ? `${extracted.text.slice(0, available)}\n\n[The source was clipped to fit the learning input limit. Upload a focused extract for deeper mapping.]` : extracted.text;
    const combined = [
      notes ? `Educator notes / map focus:\n${notes}` : "",
      `Uploaded learning source: ${sourceFile?.name || "source"} (${extracted.sourceType}).`,
      "Use only this extracted source for standards, outcomes, concepts, prerequisites, milestones, assessment links, evidence, scores, and official wording. Do not claim access to absent pages, images, figures, appendices, metadata, links, or references.",
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
      const response = await fetch("/api/generate/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolSlug: tool.slug, inputs }) });
      if (!response.ok) {
        const text = await response.text();
        const data = (() => { try { return JSON.parse(text) as { error?: string; details?: string; requiredCredits?: number; currentCredits?: number }; } catch { return null; } })();
        if (response.status === 402) throw new Error(`Not enough credits. This request needs ${data?.requiredCredits ?? creditEstimate.credits}; current balance: ${data?.currentCredits ?? 0}.`);
        throw new Error([data?.error || text || "Visual generation failed.", data?.details].filter(Boolean).join("\n\n"));
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
          <div><p className="text-xs font-bold uppercase tracking-[.28em] text-amber-300/80">{preset.eyebrow}</p><h2 className="mt-3 text-2xl font-bold text-white">{preset.title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{preset.description}</p></div>
          <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">{creditEstimate.label}</span>
        </div>
        <form onSubmit={submit} className="space-y-0">
          {primaryInputs.map((input) => <div key={input.id} className="border-b border-white/10 py-5"><label htmlFor={input.id} className="text-sm font-bold text-white">{input.label}{isRequired(input) ? <span className="ml-1 text-amber-300">*</span> : null}</label>{sourceMode === SOURCE_MODE_UPLOAD && input.id === sourceFieldId ? <p className="mt-2 text-xs leading-5 text-slate-500">Optional educator notes or map focus. The uploaded source will populate this field during generation.</p> : null}<OpenField input={input} value={formData[input.id] || ""} required={isRequired(input)} onChange={(value) => setValue(input.id, value)} /></div>)}
          <div className="border-b border-white/10 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">Curriculum source workspace</p><p className="mt-1 text-xs leading-5 text-slate-500">Paste the learning data above or attach one readable source document. The renderer never invents missing standards, prerequisites, assessment links, or mastery stages.</p></div><div className="min-w-[270px]"><SmoothSelect id="education-visual-source-mode" value={sourceMode} options={[SOURCE_MODE_FORM, SOURCE_MODE_UPLOAD]} required onChange={(_, value) => { setSourceMode(value); if (value !== SOURCE_MODE_UPLOAD) setSourceFile(null); }} /></div></div>
            {sourceMode === SOURCE_MODE_UPLOAD ? <div className="mt-5"><input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event: ChangeEvent<HTMLInputElement>) => { setSourceFile(event.target.files?.[0] || null); setOutput(""); }} className="w-full cursor-pointer border-0 border-b border-dashed border-amber-300/30 bg-transparent py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-amber-400/10 file:px-4 file:py-2 file:font-bold file:text-amber-100" /><p className="mt-2 text-xs text-slate-500">PDF, DOCX, or text-based files under 8 MB. Image-only scans require readable extracted or pasted text.</p></div> : null}
          </div>
          <details className="group border-b border-white/10 py-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white"><span>Professional education controls</span><span className="text-amber-300 transition group-open:rotate-45">＋</span></summary><div className="mt-3">{professionalInputs.map((input) => <div key={input.id} className="border-t border-white/[.07] py-4"><label htmlFor={input.id} className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{input.label}</label><OpenField input={input} value={formData[input.id] || ""} required={input.required} onChange={(value) => setValue(input.id, value)} /></div>)}</div></details>
          <button type="submit" disabled={isLoading} className="group relative mt-7 flex w-full overflow-hidden rounded-full p-[1px] disabled:cursor-not-allowed disabled:opacity-65"><span className="absolute inset-[-60%] animate-[educationMapFlow_5s_linear_infinite] bg-[conic-gradient(from_0deg,#f59e0b,#8b5cf6,#06b6d4,#22c55e,#f59e0b)]"/><span className="relative flex w-full items-center justify-center gap-2 rounded-full bg-[#08060f]/90 px-6 py-3.5 font-bold text-white backdrop-blur-xl transition group-hover:bg-[#0d0918]/80">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Building map…</> : <><ThemeIcon name="spark" size="xs"/>Generate map — {creditEstimate.credits} credits</>}</span></button>
        </form>
        <style jsx>{`@keyframes educationMapFlow{to{transform:rotate(360deg)}}`}</style>
      </section>
      <section className="min-w-0 xl:sticky xl:top-28">
        {svg ? <div className="mb-7 border-b border-white/10 pb-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-amber-300/80">Deterministic SVG learning map</p><p className="mt-1 text-sm text-slate-400">The renderer draws only the validated node and relationship JSON.</p></div><div className="flex gap-2"><button type="button" onClick={() => downloadSvg(svg, `${tool.slug}.svg`)} className="rounded-full border border-white/15 bg-white/[.055] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.11]">SVG</button><button type="button" onClick={() => void downloadPng(svg, `${tool.slug}.png`)} className="rounded-full border border-white/15 bg-white/[.055] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.11]">PNG</button></div></div><div className="overflow-hidden rounded-[1.75rem] border border-amber-300/20 bg-black/40 shadow-[0_30px_100px_rgba(120,53,15,.22)]" dangerouslySetInnerHTML={{ __html: svg }} /></div> : null}
        <OutputPanel isLoading={isLoading} output={narrative || output} recommendedNextActions={tool.nextActions} downloadFileBaseName={tool.slug} toolSlug={tool.slug} inputs={formData} />
      </section>
    </div>
  );
}
