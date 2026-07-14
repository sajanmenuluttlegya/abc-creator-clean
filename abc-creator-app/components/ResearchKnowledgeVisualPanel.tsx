"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { OutputPanel } from "./OutputPanel";
import { SmoothSelect } from "./SmoothSelect";
import { ThemeIcon } from "./ThemeIcon";
import type { Tool, ToolInput } from "@/lib/tools/public-tools";
import { getToolCreditEstimate } from "@/lib/tools/credit-costs";
import { RESEARCH_KNOWLEDGE_VISUAL_PRESETS } from "@/lib/tools/research-knowledge-visual-config";

type NodeSpec = { id?: string; label?: string; level?: number; score?: number; weight?: number };
type EdgeSpec = { from?: string; to?: string; source?: string; target?: string; label?: string };
type DiagramSpec = { type?: string; title?: string; caption?: string; nodes?: Array<string | NodeSpec>; edges?: Array<[string, string, string?] | EdgeSpec>; data?: { nodes?: Array<string | NodeSpec>; edges?: Array<[string, string, string?] | EdgeSpec> } };
type ParsedNode = { id: string; label: string; level: number; score: number };
type ParsedEdge = { from: string; to: string; label: string };

const SOURCE_MODE_FORM = "Use form fields / paste source excerpts";
const SOURCE_MODE_UPLOAD = "Upload PDF / DOCX / text source";

function firstSelectValues(tool: Tool) {
  return Object.fromEntries(tool.inputs.filter((input) => input.type === "select" && input.options?.length).map((input) => [input.id, input.options?.[0] || ""]));
}

function fileExtension(file: File) {
  const index = file.name.lastIndexOf(".");
  return index >= 0 ? file.name.slice(index + 1).toLowerCase() : "";
}

function isDocument(file: File) {
  const ext = fileExtension(file);
  return ext === "pdf" || ext === "docx" || file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected source file."));
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

function normalizeDiagram(spec: DiagramSpec | null) {
  const rawNodes = spec?.nodes || spec?.data?.nodes || [];
  const nodes: ParsedNode[] = rawNodes.slice(0, 24).map((node, index) => {
    if (typeof node === "string") return { id: node || `n${index}`, label: node || `Node ${index + 1}`, level: index === 0 ? 0 : 1, score: 55 };
    const id = String(node.id || node.label || `n${index}`).trim();
    return { id, label: String(node.label || node.id || `Node ${index + 1}`).trim(), level: Number.isFinite(Number(node.level)) ? Math.max(0, Math.min(5, Number(node.level))) : index === 0 ? 0 : 1, score: Number.isFinite(Number(node.score ?? node.weight)) ? Math.max(0, Math.min(100, Number(node.score ?? node.weight))) : 55 };
  });
  const rawEdges = spec?.edges || spec?.data?.edges || [];
  const edges: ParsedEdge[] = rawEdges.slice(0, 48).map((edge) => Array.isArray(edge)
    ? { from: String(edge[0] || ""), to: String(edge[1] || ""), label: String(edge[2] || "") }
    : { from: String(edge.from || edge.source || ""), to: String(edge.to || edge.target || ""), label: String(edge.label || "") }
  ).filter((edge) => edge.from && edge.to);
  return { nodes, edges };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" }[character] || character));
}

function layoutNodes(nodes: ParsedNode[], mode: string) {
  const width = 1180;
  const height = 680;
  if (!nodes.length) return { width, height, placed: [] as Array<ParsedNode & { x: number; y: number }> };
  if (mode === "evidence") {
    const columns = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
    const rows = Math.ceil(nodes.length / columns);
    const cellW = 980 / columns;
    const cellH = 480 / Math.max(rows, 1);
    return { width, height, placed: nodes.map((node, index) => ({ ...node, x: 100 + (index % columns) * cellW + cellW / 2, y: 125 + Math.floor(index / columns) * cellH + cellH / 2 })) };
  }
  const levels = new Map<number, ParsedNode[]>();
  nodes.forEach((node) => levels.set(node.level, [...(levels.get(node.level) || []), node]));
  const levelKeys = Array.from(levels.keys()).sort((a, b) => a - b);
  const placed = levelKeys.flatMap((level, levelIndex) => {
    const group = levels.get(level) || [];
    const x = 110 + (levelIndex * 960) / Math.max(levelKeys.length - 1, 1);
    return group.map((node, index) => ({ ...node, x, y: 115 + ((index + 1) * 470) / (group.length + 1) }));
  });
  return { width, height, placed };
}

function diagramSvg(spec: DiagramSpec, mode: string) {
  const { nodes, edges } = normalizeDiagram(spec);
  const { width, height, placed } = layoutNodes(nodes, mode);
  const position = new Map(placed.map((node) => [node.id, node]));
  const title = escapeXml(spec.title || (mode === "evidence" ? "Evidence Landscape" : mode === "framework" ? "Research Framework" : "Knowledge Graph"));
  const caption = escapeXml(spec.caption || "Source-grounded visual. Verify every relationship against the supplied evidence.");
  const edgeSvg = edges.map((edge) => {
    const from = position.get(edge.from);
    const to = position.get(edge.to);
    if (!from || !to) return "";
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    return `<g><path d="M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}" fill="none" stroke="rgba(148,163,184,.46)" stroke-width="2" marker-end="url(#arrow)"/>${edge.label ? `<text x="${midX}" y="${midY - 7}" text-anchor="middle" fill="#cbd5e1" font-size="11" font-family="Inter,Arial">${escapeXml(edge.label).slice(0, 34)}</text>` : ""}</g>`;
  }).join("");
  const nodeSvg = placed.map((node, index) => {
    const intensity = Math.round(34 + node.score * 1.5);
    const hue = mode === "evidence" ? 195 - Math.round(node.score * 0.55) : 250 + (index % 5) * 12;
    const fill = `hsla(${hue},82%,58%,${Math.min(0.34, 0.12 + node.score / 500)})`;
    const stroke = `hsla(${hue},90%,72%,.78)`;
    const label = escapeXml(node.label).slice(0, 64);
    const words = label.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    words.forEach((word) => { const next = current ? `${current} ${word}` : word; if (next.length > 22 && current) { lines.push(current); current = word; } else current = next; });
    if (current) lines.push(current);
    return `<g><rect x="${node.x - 92}" y="${node.y - 34}" width="184" height="68" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><circle cx="${node.x - 68}" cy="${node.y - 14}" r="6" fill="hsl(${hue},90%,68%)"/><text x="${node.x}" y="${node.y - (lines.length - 1) * 7}" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="700" font-family="Inter,Arial">${lines.slice(0, 3).map((line, lineIndex) => `<tspan x="${node.x}" dy="${lineIndex ? 15 : 0}">${line}</tspan>`).join("")}</text>${mode === "evidence" ? `<text x="${node.x + 70}" y="${node.y + 25}" text-anchor="end" fill="#cbd5e1" font-size="9" font-family="Inter,Arial">${intensity}</text>` : ""}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#04040b"/><stop offset="0.52" stop-color="#0a0715"/><stop offset="1" stop-color="#07111a"/></linearGradient><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" opacity=".65"/></marker><pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M 38 0 L 0 0 0 38" fill="none" stroke="rgba(148,163,184,.08)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" rx="30" fill="url(#bg)"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="30" fill="url(#grid)" stroke="rgba(168,85,247,.35)"/><text x="64" y="66" fill="#ffffff" font-size="28" font-weight="800" font-family="Inter,Arial">${title}</text><text x="64" y="94" fill="#94a3b8" font-size="13" font-family="Inter,Arial">${caption.slice(0, 142)}</text>${edgeSvg}${nodeSvg}<text x="64" y="642" fill="#64748b" font-size="11" font-family="Inter,Arial">Generated from supplied inputs • Relationships require source verification</text></svg>`;
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
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not render the diagram.")); image.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = 2360;
  canvas.height = 1360;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  anchor.click();
}

function LineField({ input, value, onChange }: { input: ToolInput; value: string; onChange: (value: string) => void }) {
  if (input.type === "select") return <SmoothSelect id={input.id} value={value} options={input.options || []} required={input.required} onChange={(_, selected) => onChange(selected)} />;
  if (input.type === "textarea") return <textarea id={input.id} value={value} onChange={(event) => onChange(event.target.value)} required={input.required} placeholder={input.placeholder} className="min-h-28 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/65" />;
  return <input id={input.id} value={value} onChange={(event) => onChange(event.target.value)} required={input.required} placeholder={input.placeholder} className="w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/65" />;
}

export function ResearchKnowledgeVisualPanel({ tool }: { tool: Tool }) {
  const preset = RESEARCH_KNOWLEDGE_VISUAL_PRESETS[tool.slug] || RESEARCH_KNOWLEDGE_VISUAL_PRESETS["knowledge-map-concept-graph-generator"];
  const [formData, setFormData] = useState<Record<string, string>>(() => firstSelectValues(tool));
  const [sourceMode, setSourceMode] = useState(SOURCE_MODE_FORM);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const creditEstimate = getToolCreditEstimate(tool.slug, formData);
  const diagram = useMemo(() => diagramFromOutput(output), [output]);
  const narrative = useMemo(() => narrativeWithoutDiagram(output), [output]);
  const svg = useMemo(() => diagram ? diagramSvg(diagram, preset.mode) : "", [diagram, preset.mode]);
  const commonIds = new Set(["discipline", "evidence_mode", "output_depth", "output_tone", "language", "must_preserve"]);
  const primaryInputs = tool.inputs.filter((input) => !commonIds.has(input.id));
  const professionalInputs = tool.inputs.filter((input) => commonIds.has(input.id));
  const setValue = (id: string, value: string) => setFormData((current) => ({ ...current, [id]: value }));

  const prepareInputs = async () => {
    if (sourceMode !== SOURCE_MODE_UPLOAD) return formData;
    if (!sourceFile) throw new Error("Upload a PDF, DOCX, or text source file.");
    let text = "";
    let sourceType = `${fileExtension(sourceFile).toUpperCase() || "Source"} file`;
    if (isDocument(sourceFile)) {
      setOutput(`Reading ${sourceFile.name}…\n\nExtracting source text before building the visual.`);
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
    const sourceContent = text.length > 58000 ? `${text.slice(0, 58000)}\n\n[The source exceeded 58000 characters; only the first section was used.]` : text;
    return { ...formData, source_mode: sourceMode, source_content: `Uploaded ${sourceType}: ${sourceFile.name}\nUse only this source text for factual nodes, edges, scores, and claims.\n\n${sourceContent}`, uploaded_text_file_name: sourceFile.name, uploaded_file_type: sourceType };
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
        const data = (() => { try { return JSON.parse(text) as { error?: string; requiredCredits?: number; currentCredits?: number }; } catch { return null; } })();
        if (response.status === 402) throw new Error(`Not enough credits. This request needs ${data?.requiredCredits ?? creditEstimate.credits}; current balance: ${data?.currentCredits ?? 0}.`);
        throw new Error(data?.error || text || "Visual generation failed.");
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

  return <div className="grid gap-10 xl:grid-cols-[minmax(340px,.72fr)_minmax(0,1.28fr)] xl:items-start">
    <section className="min-w-0">
      <div className="mb-7 flex items-start justify-between gap-5 border-b border-white/10 pb-6">
        <div><p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300/80">{preset.eyebrow}</p><h2 className="mt-3 text-2xl font-bold text-white">{preset.title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{preset.description}</p></div>
        <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">{creditEstimate.label}</span>
      </div>
      <form onSubmit={submit} className="space-y-0">
        {primaryInputs.map((input) => <div key={input.id} className="border-b border-white/10 py-5"><label htmlFor={input.id} className="text-sm font-bold text-white">{input.label}{input.required ? <span className="ml-1 text-cyan-300">*</span> : null}</label><LineField input={input} value={formData[input.id] || ""} onChange={(value) => setValue(input.id, value)} /></div>)}
        <div className="border-b border-white/10 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">Source workspace</p><p className="mt-1 text-xs leading-5 text-slate-500">Paste evidence into the fields above or attach one readable source document.</p></div><div className="min-w-[250px]"><SmoothSelect id="research_visual_source_mode" value={sourceMode} options={[SOURCE_MODE_FORM, SOURCE_MODE_UPLOAD]} required onChange={(_, value) => { setSourceMode(value); if (value !== SOURCE_MODE_UPLOAD) setSourceFile(null); }} /></div></div>
          {sourceMode === SOURCE_MODE_UPLOAD ? <div className="mt-5"><input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.rtf,.html,.htm,.xml,.log,text/*,application/json,application/xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event: ChangeEvent<HTMLInputElement>) => setSourceFile(event.target.files?.[0] || null)} className="w-full cursor-pointer border-0 border-b border-dashed border-cyan-300/30 bg-transparent py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400/10 file:px-4 file:py-2 file:font-bold file:text-cyan-100" /><p className="mt-2 text-xs text-slate-500">PDF, DOCX, TXT, MD, CSV, JSON, RTF, HTML, XML, or LOG.</p></div> : null}
        </div>
        <details className="group border-b border-white/10 py-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-white"><span>Professional research controls</span><span className="text-cyan-300 transition group-open:rotate-45">＋</span></summary><div className="mt-3">{professionalInputs.map((input) => <div key={input.id} className="border-t border-white/[.07] py-4"><label htmlFor={input.id} className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">{input.label}</label><LineField input={input} value={formData[input.id] || ""} onChange={(value) => setValue(input.id, value)} /></div>)}</div></details>
        <button type="submit" disabled={isLoading} className="group relative mt-7 flex w-full overflow-hidden rounded-full p-[1px] disabled:cursor-not-allowed disabled:opacity-65"><span className="absolute inset-[-60%] animate-[researchFlow_5s_linear_infinite] bg-[conic-gradient(from_0deg,#4f46e5,#8b5cf6,#06b6d4,#ec4899,#4f46e5)]"/><span className="relative flex w-full items-center justify-center gap-2 rounded-full bg-[#08060f]/90 px-6 py-3.5 font-bold text-white backdrop-blur-xl transition group-hover:bg-[#0d0918]/80">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Building visual…</> : <><ThemeIcon name="spark" size="xs"/>Generate visual — {creditEstimate.credits} credits</>}</span></button>
      </form>
      <style jsx>{`@keyframes researchFlow{to{transform:rotate(360deg)}}`}</style>
    </section>
    <section className="min-w-0 xl:sticky xl:top-28">
      {svg ? <div className="mb-7 border-b border-white/10 pb-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-purple-300/80">Deterministic SVG output</p><p className="mt-1 text-sm text-slate-400">The renderer draws only the generated node and relationship JSON.</p></div><div className="flex gap-2"><button type="button" onClick={() => downloadSvg(svg, `${tool.slug}.svg`)} className="rounded-full border border-white/15 bg-white/[.055] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.11]">SVG</button><button type="button" onClick={() => void downloadPng(svg, `${tool.slug}.png`)} className="rounded-full border border-white/15 bg-white/[.055] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.11]">PNG</button></div></div><div className="overflow-hidden rounded-[1.75rem] border border-purple-300/20 bg-black/40 shadow-[0_30px_100px_rgba(76,29,149,.24)]" dangerouslySetInnerHTML={{ __html: svg }} /></div> : null}
      <OutputPanel isLoading={isLoading} output={narrative || output} recommendedNextActions={tool.nextActions} downloadFileBaseName={tool.slug} toolSlug={tool.slug} inputs={formData} />
    </section>
  </div>;
}
