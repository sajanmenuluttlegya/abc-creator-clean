"use client";

import { useEffect, useMemo, useState } from "react";

type EditableBlock = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  body: string;
  enabled: boolean;
};

type Props = {
  isLoading: boolean;
  output: string;
  title: string;
  subtitle: string;
  emptyState: string;
  downloadFileBaseName: string;
};

type SectionRegenerateResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  text?: string;
};

function makeId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanTitle(value: string) {
  return value.replace(/^#+\s*/, "").replace(/[*_`]/g, "").trim() || "Untitled block";
}

function finishBlock(block: EditableBlock | null): EditableBlock | null {
  if (!block) return null;
  return { id: block.id, level: block.level, title: block.title, body: block.body.trim(), enabled: block.enabled };
}

function parseBlocks(markdown: string): EditableBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: EditableBlock[] = [];
  let current: EditableBlock | null = null;

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());

    if (heading) {
      const finished = finishBlock(current);
      if (finished) blocks.push(finished);
      current = {
        id: makeId(),
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        title: cleanTitle(heading[2]),
        body: "",
        enabled: true,
      };
      continue;
    }

    if (!current) {
      current = { id: makeId(), level: 2, title: "Generated Output", body: "", enabled: true };
    }

    current.body += `${line}\n`;
  }

  const finished = finishBlock(current);
  if (finished) blocks.push(finished);
  return blocks.length ? blocks : [{ id: makeId(), level: 2, title: "Generated Output", body: markdown.trim(), enabled: true }];
}

function blockToMarkdown(block: EditableBlock) {
  return `${"#".repeat(block.level)} ${block.title.trim()}\n\n${block.body.trim()}`.trim();
}

function blocksToMarkdown(blocks: EditableBlock[]) {
  return blocks
    .filter((block) => block.enabled && (block.title.trim() || block.body.trim()))
    .map(blockToMarkdown)
    .join("\n\n");
}

function defaultRegenerateInstruction(block: EditableBlock) {
  return `Rewrite this section to be more premium and professional while preserving the same meaning and Markdown heading.\n\n${blockToMarkdown(block)}`;
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed.");
}

export function PremiumEditableTextOutputPanel({ isLoading, output, title, subtitle, emptyState, downloadFileBaseName }: Props) {
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [activeRegenerateId, setActiveRegenerateId] = useState<string | null>(null);
  const [regenerateInstruction, setRegenerateInstruction] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const selectedOutput = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const hasOutput = Boolean(output.trim());

  useEffect(() => {
    if (!output.trim()) {
      setBlocks([]);
      setMessage("");
      setActiveRegenerateId(null);
      setRegenerateInstruction("");
      setRegeneratingId(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setBlocks(parseBlocks(output));
      setMessage("");
      setActiveRegenerateId(null);
      setRegenerateInstruction("");
      setRegeneratingId(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [output]);

  const updateBlock = (id: string, patch: Partial<EditableBlock>) => {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
  };

  const addBlock = () => {
    setBlocks((current) => [...current, { id: makeId(), level: 3, title: "New idea", body: "Write or paste a new option here.", enabled: true }]);
  };

  const moveBlock = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setBlocks((current) => {
      const fromIndex = current.findIndex((block) => block.id === fromId);
      const toIndex = current.findIndex((block) => block.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const item = current[fromIndex];
      if (!item) return current;
      const next = [...current];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const openRegeneratePanel = (block: EditableBlock) => {
    setActiveRegenerateId((current) => (current === block.id ? null : block.id));
    setRegenerateInstruction(defaultRegenerateInstruction(block));
    setMessage("");
  };

  const regenerateBlock = async (block: EditableBlock) => {
    const instruction = regenerateInstruction.trim();

    if (!instruction) {
      setMessage("Add a regenerate instruction first.");
      return;
    }

    setRegeneratingId(block.id);
    setMessage("");

    try {
      const response = await fetch("/api/generate/section-regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: downloadFileBaseName.replace(/-output$/, ""), sectionText: blockToMarkdown(block), instruction }),
      });
      const data = (await response.json()) as SectionRegenerateResponse;

      if (!response.ok || !data.ok || !data.text?.trim()) {
        setMessage(`${data.error || "Section regeneration failed."}${data.details ? ` ${data.details}` : ""}`);
        return;
      }

      const parsed = parseBlocks(data.text.trim())[0];
      if (parsed) {
        updateBlock(block.id, { level: parsed.level, title: parsed.title, body: parsed.body });
      } else {
        updateBlock(block.id, { body: data.text.trim() });
      }

      setActiveRegenerateId(null);
      setRegenerateInstruction("");
      setMessage("Section regenerated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyOutput = async () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one block before copying.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(selectedOutput);
      else fallbackCopy(selectedOutput);
      setMessage("Selected output copied.");
    } catch {
      try {
        fallbackCopy(selectedOutput);
        setMessage("Selected output copied.");
      } catch {
        setMessage("Copy failed. Please select the text manually and copy it.");
      }
    }
  };

  const downloadTxt = () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one block before downloading.");
      return;
    }

    const blob = new Blob([selectedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadFileBaseName}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Text download started.");
  };

  const downloadPdf = () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one block before downloading.");
      return;
    }

    const iframeName = `abc_pdf_export_${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/export/pdf";
    form.target = iframeName;
    form.style.display = "none";

    const outputField = document.createElement("textarea");
    outputField.name = "output";
    outputField.value = selectedOutput;
    form.appendChild(outputField);

    const fileNameField = document.createElement("input");
    fileNameField.type = "hidden";
    fileNameField.name = "fileBaseName";
    fileNameField.value = downloadFileBaseName;
    form.appendChild(fileNameField);

    const imagesField = document.createElement("textarea");
    imagesField.name = "images";
    imagesField.value = "[]";
    form.appendChild(imagesField);

    document.body.appendChild(form);
    form.submit();
    form.remove();
    window.setTimeout(() => iframe.remove(), 60000);
    setMessage("PDF download started.");
  };

  return (
    <div className="rounded-3xl border border-cyan-400/25 bg-black/50 p-7 shadow-2xl shadow-cyan-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Premium editable output</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{subtitle}</p>
        </div>

        {hasOutput ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBlock} className="rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/20">+ Add Block</button>
            <button type="button" onClick={copyOutput} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20">Copy Selected</button>
            <button type="button" onClick={downloadPdf} className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20">Download PDF</button>
            <button type="button" onClick={downloadTxt} className="rounded-full border border-purple-300/25 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20">Download TXT</button>
          </div>
        ) : null}
      </div>

      {message ? <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{message}</div> : null}

      {hasOutput ? (
        <div className="max-h-[78vh] space-y-3 overflow-y-auto pr-1">
          {blocks.map((block) => (
            <div
              key={block.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId) moveBlock(draggedId, block.id);
                setDraggedId(null);
              }}
              className="grid grid-cols-[38px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-cyan-400/15 bg-black/60 transition hover:border-cyan-300/35"
            >
              <button type="button" draggable onDragStart={() => setDraggedId(block.id)} onDragEnd={() => setDraggedId(null)} title="Drag to reorder" className="flex cursor-grab items-center justify-center border-r border-white/10 bg-white/[0.035] text-lg text-cyan-200 active:cursor-grabbing">⋮⋮</button>

              <div className="space-y-3 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                    <input type="checkbox" checked={block.enabled} onChange={() => updateBlock(block.id, { enabled: !block.enabled })} className="h-4 w-4 accent-cyan-500" />
                    Use
                  </label>
                  <select value={block.level} onChange={(event) => updateBlock(block.id, { level: Number(event.currentTarget.value) as 1 | 2 | 3 })} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value={1} className="bg-black text-white">H1</option>
                    <option value={2} className="bg-black text-white">H2</option>
                    <option value={3} className="bg-black text-white">H3</option>
                  </select>
                  <input value={block.title} onChange={(event) => updateBlock(block.id, { title: event.currentTarget.value })} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  <button type="button" onClick={() => openRegeneratePanel(block)} className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20">Regenerate</button>
                  <button type="button" onClick={() => deleteBlock(block.id)} className="rounded-full border border-red-300/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-400/20">Delete</button>
                </div>

                {activeRegenerateId === block.id ? (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Regenerate this block</label>
                    <textarea value={regenerateInstruction} onChange={(event) => setRegenerateInstruction(event.currentTarget.value)} className="mt-3 h-24 w-full resize-none rounded-2xl border border-cyan-300/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setRegenerateInstruction("Make this section shorter, sharper, and more premium while preserving the meaning and Markdown heading.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Shorter</button>
                      <button type="button" onClick={() => setRegenerateInstruction("Make this section longer, more detailed, and more premium while preserving the meaning and Markdown heading.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Longer</button>
                      <button type="button" onClick={() => void regenerateBlock(block)} disabled={regeneratingId === block.id} className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{regeneratingId === block.id ? "Regenerating..." : "Apply regenerate"}</button>
                      <button type="button" onClick={() => setActiveRegenerateId(null)} disabled={regeneratingId === block.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200">Cancel</button>
                    </div>
                  </div>
                ) : null}

                <textarea value={block.body} onChange={(event) => updateBlock(block.id, { body: event.currentTarget.value })} className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-100" />
          Generating premium options...
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 text-sm leading-7 text-slate-300">{emptyState}</div>
      )}
    </div>
  );
}
