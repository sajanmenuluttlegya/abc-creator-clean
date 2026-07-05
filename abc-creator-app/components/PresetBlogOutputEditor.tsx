"use client";

import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DiagramRenderer, parseDiagramSpec, type DiagramSpec } from "./diagrams/DiagramRendererClean";
import { InlineImageBlock, splitOutputIntoImageSegments } from "./InlineImageBlocks";
import { inferBlogVisualSpec, plainVisualText } from "@/lib/tools/blog-visual-selection";

type InsertedBlock = { id: string; type: "image" | "table" | "visual"; markdown: string; prompt?: string; spec?: DiagramSpec };
type Props = { output: string; toolSlug: string; inputs: Record<string, string> };
type ManualImagePlacement = "top" | "bottom" | "left" | "right";

const actionClass = "rounded-full border border-white/15 bg-white/[0.055] px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.11]";
const iconActionClass = "pointer-events-auto rounded-full border border-white/15 bg-white/[0.055] px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.11]";

function splitDiagramBlocks(markdown: string) {
  const segments: Array<{ type: "markdown"; content: string; id: string } | { type: "diagram"; content: string; id: string }> = [];
  const pattern = /```abc-diagram\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index).trim();
    if (before) segments.push({ type: "markdown", content: before, id: `md-${index}` });
    index += 1;
    segments.push({ type: "diagram", content: match[1], id: `diagram-${index}` });
    lastIndex = match.index + match[0].length;
  }
  const after = markdown.slice(lastIndex).trim();
  if (after) segments.push({ type: "markdown", content: after, id: `md-${index + 1}` });
  return segments.length ? segments : [{ type: "markdown", content: markdown, id: "md-1" }];
}

function looksLikeLooseHeading(line: string) {
  const text = line.trim();
  if (!text || text.length > 120) return false;
  if (/^(#{1,6}|[-*+]|\d+\.|>|```|\||<)/.test(text)) return false;
  if (/[.!?]$/.test(text)) return false;
  if (/^\*\*.+\*\*:?$/.test(text)) return true;
  return /^[A-Z][\w\s/&+–—,:()'-]{2,}$/.test(text);
}

function normalizeLooseHeadings(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s+/.test(trimmed)) return line;
    const prevBlank = index === 0 || !lines[index - 1]?.trim();
    const nextBlank = index === lines.length - 1 || !lines[index + 1]?.trim();
    const unwrapped = trimmed.replace(/^\*\*(.+?)\*\*:?$/, "$1").trim();
    if (index === firstContentIndex && looksLikeLooseHeading(trimmed)) return `# ${unwrapped}`;
    if (prevBlank && nextBlank && looksLikeLooseHeading(trimmed)) {
      const lower = unwrapped.toLowerCase();
      if (lower === "introduction" || lower === "conclusion" || lower.includes("overview") || lower.includes("framework") || lower.includes("strategy") || lower.includes("risk") || lower.includes("faq")) return `## ${unwrapped}`;
      return `### ${unwrapped}`;
    }
    return line;
  }).join("\n");
}

function splitBlocks(markdown: string) { return normalizeLooseHeadings(markdown).split(/\n{2,}/).map((block) => block.trim()).filter(Boolean); }
function headingLevel(block: string) { const match = block.match(/^(#{1,6})\s+/); return match ? match[1].length : 0; }
function sectionEndIndex(blocks: string[], startIndex: number) { const level = headingLevel(blocks[startIndex]); if (!level) return startIndex + 1; for (let index = startIndex + 1; index < blocks.length; index += 1) { const nextLevel = headingLevel(blocks[index]); if (nextLevel && nextLevel <= level) return index; } return blocks.length; }
function isInsideDeletedHeadingSection(blocks: string[], index: number, deletedHeadingStarts: Record<number, boolean>) { return Object.entries(deletedHeadingStarts).some(([rawStart, deleted]) => { if (!deleted) return false; const start = Number(rawStart); if (!Number.isInteger(start)) return false; const end = sectionEndIndex(blocks, start); return index >= start && index < end; }); }
function isTable(block: string) { const lines = block.split("\n").map((line) => line.trim()); return lines.length >= 2 && lines.every((line) => line.startsWith("|") && line.endsWith("|")) && lines.some((line) => /\|\s*-{3,}\s*\|/.test(line)); }
function plain(value: string, max = 360) { return plainVisualText(value, max); }
function placementText(placement: ManualImagePlacement) { if (placement === "top") return "Image above selected text."; if (placement === "left") return "Image left beside selected text."; if (placement === "right") return "Image right beside selected text."; return "Image below selected text."; }

function imagePrompt(block: string, toolSlug: string, inputs: Record<string, string>, placement: ManualImagePlacement) {
  const topic = inputs.title || inputs.blog_title || inputs.topic || inputs.primary_keyword || "this article section";
  const context = plain(block, 460);
  const mode = toolSlug === "quick-1-click-blog-post" ? "simple premium blog illustration" : toolSlug === "human-style-blog-post" ? "warm editorial story-style blog illustration" : toolSlug === "seo-optimized-blog-post" ? "professional SEO article illustration" : "premium expert-level conceptual article illustration";
  const prompt = `${mode}, textless, no logos, no readable words, directly supporting topic: ${topic}. Place near section idea: ${context}`;
  return { prompt, markdown: `### Image: Added Section Image\n\nPlacement: ${placementText(placement)}\n\nPrompt: ${prompt}\n\nAlt Text: Editorial image supporting ${topic}.\n\nCaption: Optional visual support for this section.` };
}

function tableMarkdown(block: string, toolSlug: string) {
  const context = plain(block, 160) || "Selected section";
  if (toolSlug === "seo-optimized-blog-post") return `### Added SEO Table\n\n| Reader intent | What to answer | Content note |\n|---|---|---|\n| Informational | Explain clearly | Based on: ${context} |\n| Commercial | Compare useful options | Use only if relevant |\n| Action-oriented | Give next step | Keep claims verified |`;
  if (toolSlug === "advanced-blog-post") return `### Added Framework Table\n\n| Framework area | Key decision | Practical guidance |\n|---|---|---|\n| Context | What matters here? | ${context} |\n| Tradeoff | What should be compared? | Add nuanced pros and cons |\n| Action | What happens next? | Turn insight into steps |`;
  if (toolSlug === "human-style-blog-post") return `### Added Editorial Table\n\n| Story point | Reader meaning | Use in article |\n|---|---|---|\n| Context | ${context} | Make the idea concrete |\n| Example | Add a relatable scenario | Keep it natural |\n| Takeaway | Summarize the lesson | Avoid filler |`;
  return `### Added Quick Table\n\n| Key point | Simple explanation | Action step |\n|---|---|---|\n| Context | ${context} | Apply this idea |\n| Takeaway | Keep it concise | Turn it into a practical step |`;
}

function visualSpec(block: string, inputs: Record<string, string>): DiagramSpec {
  const topic = inputs.title || inputs.blog_title || inputs.topic || inputs.primary_keyword || "Article concept";
  return inferBlogVisualSpec(block, topic) as DiagramSpec;
}
function visualMarkdown(spec: DiagramSpec) { return `\`\`\`abc-diagram\n${JSON.stringify(spec)}\n\`\`\``; }

function TrashIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 15h10l1-15" /><path d="M10 10v7" /><path d="M14 10v7" /></svg>; }
function Removable({ children, label }: { children: ReactNode; label: string }) { const [deleted, setDeleted] = useState(false); if (deleted) return null; return <div className="group/removable relative">{children}<div data-export-ignore="true" className="pointer-events-none absolute right-3 top-3 opacity-0 transition group-hover/removable:opacity-100"><button type="button" onClick={() => setDeleted(true)} className={iconActionClass}>{label}</button></div></div>; }

function EditableMarkdown({ markdown, toolSlug, inputs, idPrefix }: Props & { markdown: string; idPrefix: string }) {
  const blocks = useMemo(() => splitBlocks(markdown), [markdown]);
  const [insertions, setInsertions] = useState<Record<string, InsertedBlock[]>>({});
  const [deletedTables, setDeletedTables] = useState<Record<string, boolean>>({});
  const [deletedHeadingStarts, setDeletedHeadingStarts] = useState<Record<number, boolean>>({});
  const add = (key: string, item: InsertedBlock) => setInsertions((current) => ({ ...current, [key]: [...(current[key] || []), item] }));
  const remove = (key: string, id: string) => setInsertions((current) => ({ ...current, [key]: (current[key] || []).filter((item) => item.id !== id) }));
  const addImage = (key: string, block: string, placement: ManualImagePlacement) => { const img = imagePrompt(block, toolSlug, inputs, placement); add(key, { id: `${key}-image-${placement}-${Date.now()}`, type: "image", markdown: img.markdown, prompt: img.prompt }); };

  return <>{blocks.map((block, index) => {
    const key = `${idPrefix}-${index}`;
    if (isInsideDeletedHeadingSection(blocks, index, deletedHeadingStarts)) return null;
    const table = isTable(block);
    const level = headingLevel(block);
    const spec = visualSpec(block, inputs);
    return <div key={key} className="group/line relative rounded-xl transition hover:bg-white/[0.025]">
      {!(table && deletedTables[key]) ? <div className="relative pr-10"><ReactMarkdown remarkPlugins={[remarkGfm]}>{block}</ReactMarkdown>{level ? <button type="button" title="Delete this heading and its content" aria-label="Delete this heading and its content" onClick={() => setDeletedHeadingStarts((current) => ({ ...current, [index]: true }))} data-export-ignore="true" className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.055] text-white/90 opacity-0 backdrop-blur-xl transition hover:bg-white/[0.11] group-hover/line:opacity-100"><TrashIcon /></button> : null}{table ? <div data-export-ignore="true" className="pointer-events-none absolute right-2 top-2 opacity-0 transition group-hover/line:opacity-100"><button type="button" onClick={() => setDeletedTables((current) => ({ ...current, [key]: true }))} className={iconActionClass}>Delete Table</button></div> : null}</div> : null}
      <div data-export-ignore="true" className="pointer-events-none -mt-1 mb-3 flex justify-end opacity-0 transition group-hover/line:opacity-100"><div className="pointer-events-auto flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-black/45 p-2 backdrop-blur-2xl"><button type="button" onClick={() => addImage(key, block, "top")} className={actionClass}>Image Above</button><button type="button" onClick={() => addImage(key, block, "bottom")} className={actionClass}>Image Below</button><button type="button" onClick={() => addImage(key, block, "left")} className={actionClass}>Image Left</button><button type="button" onClick={() => addImage(key, block, "right")} className={actionClass}>Image Right</button><button type="button" onClick={() => add(key, { id: `${key}-table-${Date.now()}`, type: "table", markdown: tableMarkdown(block, toolSlug) })} className={actionClass}>Table</button><button type="button" onClick={() => add(key, { id: `${key}-visual-${Date.now()}`, type: "visual", markdown: visualMarkdown(spec), spec })} className={actionClass}>Visual</button></div></div>
      {(insertions[key] || []).map((item) => <div key={item.id} className="group/inserted relative rounded-2xl border border-white/10 bg-white/[0.025] p-3">{item.type === "image" ? <InlineImageBlock blockId={item.id} markdown={item.markdown} prompt={item.prompt || item.markdown} toolSlug={toolSlug} inputs={inputs} autoGenerate={false} /> : item.type === "visual" && item.spec ? <DiagramRenderer spec={item.spec} /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.markdown}</ReactMarkdown>}<div data-export-ignore="true" className="pointer-events-none absolute right-3 top-3 opacity-0 transition group-hover/inserted:opacity-100"><button type="button" onClick={() => remove(key, item.id)} className={iconActionClass}>{item.type === "image" ? "Remove Image Block" : item.type === "visual" ? "Delete Visual" : "Delete Table"}</button></div></div>)}
    </div>;
  })}</>;
}

export function PresetBlogOutputEditor({ output, toolSlug, inputs }: Props) {
  const segments = useMemo(() => splitOutputIntoImageSegments(output), [output]);
  return <>{segments.map((segment) => {
    if (segment.type === "image") return <Removable key={segment.id} label="Remove Image Block"><InlineImageBlock blockId={segment.id} markdown={segment.content} prompt={segment.prompt} toolSlug={toolSlug} inputs={inputs} autoGenerate={false} /></Removable>;
    return splitDiagramBlocks(segment.content).map((part) => {
      if (part.type === "diagram") { const spec = parseDiagramSpec(part.content); if (!spec) return <div key={`${segment.id}-${part.id}`} className="my-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">Diagram could not be rendered because the structured diagram block was invalid.</div>; return <Removable key={`${segment.id}-${part.id}`} label="Delete Visual"><DiagramRenderer spec={spec} /></Removable>; }
      return <EditableMarkdown key={`${segment.id}-${part.id}`} output={output} markdown={part.content} idPrefix={`${segment.id}-${part.id}`} toolSlug={toolSlug} inputs={inputs} />;
    });
  })}</>;
}
