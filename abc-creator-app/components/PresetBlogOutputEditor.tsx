"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DiagramRenderer, parseDiagramSpec } from "./diagrams/DiagramRendererClean";
import { InlineImageBlock, splitOutputIntoImageSegments } from "./InlineImageBlocks";

type InsertedBlock = {
  id: string;
  type: "image" | "table";
  markdown: string;
  prompt?: string;
};

type Props = {
  output: string;
  toolSlug: string;
  inputs: Record<string, string>;
};

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

function splitBlocks(markdown: string) {
  return markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
}

function isTable(block: string) {
  const lines = block.split("\n").map((line) => line.trim());
  return lines.length >= 2 && lines.every((line) => line.startsWith("|") && line.endsWith("|")) && lines.some((line) => /\|\s*-{3,}\s*\|/.test(line));
}

function plain(value: string, max = 360) {
  const text = value.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|\[\]()]|:{1,}/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function imagePrompt(block: string, toolSlug: string, inputs: Record<string, string>) {
  const topic = inputs.title || inputs.blog_title || inputs.topic || inputs.primary_keyword || "this article section";
  const context = plain(block, 460);
  const mode =
    toolSlug === "quick-1-click-blog-post"
      ? "simple premium blog illustration"
      : toolSlug === "human-style-blog-post"
        ? "warm editorial story-style blog illustration"
        : toolSlug === "seo-optimized-blog-post"
          ? "professional SEO article illustration"
          : "premium expert-level conceptual article illustration";
  const prompt = `${mode}, textless, no logos, no readable words, directly supporting topic: ${topic}. Place after section idea: ${context}`;

  return {
    prompt,
    markdown: `### Image: Added Section Image\n\nPlacement: After selected output block.\n\nPrompt: ${prompt}\n\nAlt Text: Editorial image supporting ${topic}.\n\nCaption: Optional visual support for this section.`,
  };
}

function tableMarkdown(block: string, toolSlug: string) {
  const context = plain(block, 160) || "Selected section";
  if (toolSlug === "seo-optimized-blog-post") {
    return `### Added SEO Table\n\n| Reader intent | What to answer | Content note |\n|---|---|---|\n| Informational | Explain clearly | Based on: ${context} |\n| Commercial | Compare useful options | Use only if relevant |\n| Action-oriented | Give next step | Keep claims verified |`;
  }
  if (toolSlug === "advanced-blog-post") {
    return `### Added Framework Table\n\n| Framework area | Key decision | Practical guidance |\n|---|---|---|\n| Context | What matters here? | ${context} |\n| Tradeoff | What should be compared? | Add nuanced pros and cons |\n| Action | What happens next? | Turn insight into steps |`;
  }
  if (toolSlug === "human-style-blog-post") {
    return `### Added Editorial Table\n\n| Story point | Reader meaning | Use in article |\n|---|---|---|\n| Context | ${context} | Make the idea concrete |\n| Example | Add a relatable scenario | Keep it natural |\n| Takeaway | Summarize the lesson | Avoid filler |`;
  }
  return `### Added Quick Table\n\n| Key point | Simple explanation | Action step |\n|---|---|---|\n| Context | ${context} | Apply this idea |\n| Takeaway | Keep it concise | Turn it into a practical step |`;
}

function Removable({ children, label }: { children: React.ReactNode; label: string }) {
  const [deleted, setDeleted] = useState(false);
  if (deleted) return null;
  return (
    <div className="group/removable relative">
      {children}
      <div data-export-ignore="true" className="pointer-events-none absolute right-3 top-3 opacity-0 transition group-hover/removable:opacity-100">
        <button type="button" onClick={() => setDeleted(true)} className="pointer-events-auto rounded-full border border-red-300/30 bg-black/75 px-3 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-md transition hover:bg-red-500/20">
          {label}
        </button>
      </div>
    </div>
  );
}

function EditableMarkdown({ markdown, toolSlug, inputs, idPrefix }: Props & { markdown: string; idPrefix: string }) {
  const blocks = useMemo(() => splitBlocks(markdown), [markdown]);
  const [insertions, setInsertions] = useState<Record<string, InsertedBlock[]>>({});
  const [deletedTables, setDeletedTables] = useState<Record<string, boolean>>({});

  const add = (key: string, item: InsertedBlock) => {
    setInsertions((current) => ({ ...current, [key]: [...(current[key] || []), item] }));
  };

  const remove = (key: string, id: string) => {
    setInsertions((current) => ({ ...current, [key]: (current[key] || []).filter((item) => item.id !== id) }));
  };

  return (
    <>
      {blocks.map((block, index) => {
        const key = `${idPrefix}-${index}`;
        const table = isTable(block);
        const img = imagePrompt(block, toolSlug, inputs);
        return (
          <div key={key} className="group/line relative rounded-xl transition hover:bg-white/[0.025]">
            {!(table && deletedTables[key]) ? (
              <div className="relative">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block}</ReactMarkdown>
                {table ? (
                  <div data-export-ignore="true" className="pointer-events-none absolute right-2 top-2 opacity-0 transition group-hover/line:opacity-100">
                    <button type="button" onClick={() => setDeletedTables((current) => ({ ...current, [key]: true }))} className="pointer-events-auto rounded-full border border-red-300/30 bg-black/75 px-3 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-md transition hover:bg-red-500/20">
                      Delete Table
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div data-export-ignore="true" className="pointer-events-none -mt-1 mb-3 flex justify-end opacity-0 transition group-hover/line:opacity-100">
              <div className="pointer-events-auto flex flex-wrap gap-2 rounded-full border border-white/10 bg-black/75 p-1.5 backdrop-blur-md">
                <button type="button" onClick={() => add(key, { id: `${key}-image-${Date.now()}`, type: "image", markdown: img.markdown, prompt: img.prompt })} className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
                  Add Image After
                </button>
                <button type="button" onClick={() => add(key, { id: `${key}-table-${Date.now()}`, type: "table", markdown: tableMarkdown(block, toolSlug) })} className="rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-400/20">
                  Add Table After
                </button>
              </div>
            </div>

            {(insertions[key] || []).map((item) => (
              <div key={item.id} className="group/inserted relative rounded-2xl border border-white/10 bg-black/30 p-3">
                {item.type === "image" ? (
                  <InlineImageBlock blockId={item.id} markdown={item.markdown} prompt={item.prompt || item.markdown} toolSlug={toolSlug} inputs={inputs} autoGenerate={false} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.markdown}</ReactMarkdown>
                )}
                <div data-export-ignore="true" className="pointer-events-none absolute right-3 top-3 opacity-0 transition group-hover/inserted:opacity-100">
                  <button type="button" onClick={() => remove(key, item.id)} className="pointer-events-auto rounded-full border border-red-300/30 bg-black/75 px-3 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-md transition hover:bg-red-500/20">
                    {item.type === "image" ? "Delete Image" : "Delete Table"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

export function PresetBlogOutputEditor({ output, toolSlug, inputs }: Props) {
  const segments = useMemo(() => splitOutputIntoImageSegments(output), [output]);

  return (
    <>
      {segments.map((segment) => {
        if (segment.type === "image") {
          return (
            <Removable key={segment.id} label="Delete Image">
              <InlineImageBlock blockId={segment.id} markdown={segment.content} prompt={segment.prompt} toolSlug={toolSlug} inputs={inputs} autoGenerate={false} />
            </Removable>
          );
        }

        return splitDiagramBlocks(segment.content).map((part) => {
          if (part.type === "diagram") {
            const spec = parseDiagramSpec(part.content);
            if (!spec) {
              return <div key={`${segment.id}-${part.id}`} className="my-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">Diagram could not be rendered because the structured diagram block was invalid.</div>;
            }
            return <Removable key={`${segment.id}-${part.id}`} label="Delete Visual"><DiagramRenderer spec={spec} /></Removable>;
          }

          return <EditableMarkdown key={`${segment.id}-${part.id}`} output={output} markdown={part.content} idPrefix={`${segment.id}-${part.id}`} toolSlug={toolSlug} inputs={inputs} />;
        });
      })}
    </>
  );
}
