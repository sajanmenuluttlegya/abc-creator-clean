"use client";

import { useEffect, useMemo, useState } from "react";

type CaptionBlock = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  body: string;
  enabled: boolean;
};

type Props = {
  isLoading: boolean;
  output: string;
  inputs: Record<string, string>;
};

function makeId() {
  return `caption-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanTitle(value: string) {
  return value.replace(/^#+\s*/, "").replace(/[*_`]/g, "").trim() || "Untitled block";
}

function finishBlock(block: CaptionBlock | null): CaptionBlock | null {
  if (!block) return null;
  return { id: block.id, level: block.level, title: block.title, body: block.body.trim(), enabled: block.enabled };
}

function parseCaptionBlocks(markdown: string): CaptionBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: CaptionBlock[] = [];
  let current: CaptionBlock | null = null;

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
      current = {
        id: makeId(),
        level: 2,
        title: "Generated Instagram Captions",
        body: "",
        enabled: true,
      };
    }

    current.body += `${line}\n`;
  }

  const finished = finishBlock(current);
  if (finished) blocks.push(finished);

  return blocks.length ? blocks : [{ id: makeId(), level: 2, title: "Generated Instagram Captions", body: markdown.trim(), enabled: true }];
}

function blocksToMarkdown(blocks: CaptionBlock[]) {
  return blocks
    .filter((block) => block.enabled && (block.title.trim() || block.body.trim()))
    .map((block) => `${"#".repeat(block.level)} ${block.title.trim()}\n\n${block.body.trim()}`.trim())
    .join("\n\n");
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

export function ImageToInstagramCaptionPanel({ isLoading, output, inputs }: Props) {
  const [blocks, setBlocks] = useState<CaptionBlock[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const selectedOutput = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const hasOutput = Boolean(output.trim());
  const imageSrc = inputs.image_data || "";

  useEffect(() => {
    if (!output.trim()) {
      setBlocks([]);
      setMessage("");
      return;
    }

    const timer = window.setTimeout(() => {
      setBlocks(parseCaptionBlocks(output));
      setMessage("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [output]);

  const updateBlock = (id: string, patch: Partial<CaptionBlock>) => {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
  };

  const addBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: makeId(),
        level: 3,
        title: "New caption idea",
        body: "Write or paste a new caption option here.",
        enabled: true,
      },
    ]);
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

  const copyOutput = async () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one caption block before copying.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(selectedOutput);
      else fallbackCopy(selectedOutput);
      setMessage("Selected caption package copied.");
    } catch {
      try {
        fallbackCopy(selectedOutput);
        setMessage("Selected caption package copied.");
      } catch {
        setMessage("Copy failed. Please select the text manually and copy it.");
      }
    }
  };

  const downloadTxt = () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one caption block before downloading.");
      return;
    }

    const blob = new Blob([selectedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "image-to-instagram-caption-output.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Text download started.");
  };

  const downloadPdf = () => {
    if (!selectedOutput.trim()) {
      setMessage("Select at least one caption block before downloading.");
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
    fileNameField.value = "image-to-instagram-caption-output";
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
    <div className="rounded-3xl border border-pink-400/25 bg-black/50 p-7 shadow-2xl shadow-pink-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-200">Premium Instagram caption studio</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Image-based captions you can edit and reorder</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Drag from the left handle, edit any block, delete weak options, or add a new caption idea before copying.
          </p>
        </div>

        {hasOutput ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBlock} className="rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/20">
              + Add Block
            </button>
            <button type="button" onClick={copyOutput} className="rounded-full border border-pink-300/25 bg-pink-400/10 px-4 py-2 text-sm font-semibold text-pink-100 transition hover:bg-pink-400/20">
              Copy Selected
            </button>
            <button type="button" onClick={downloadPdf} className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
              Download PDF
            </button>
            <button type="button" onClick={downloadTxt} className="rounded-full border border-purple-300/25 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20">
              Download TXT
            </button>
          </div>
        ) : null}
      </div>

      {message ? <div className="mb-5 rounded-2xl border border-pink-300/20 bg-pink-400/10 px-4 py-3 text-sm text-pink-100">{message}</div> : null}

      {imageSrc ? (
        <div className="mb-5 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
            <img src={imageSrc} alt="Uploaded Instagram source" className="h-44 w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-200">Source image attached</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              The generation should stay grounded in visible image details plus your optional brand and campaign context.
            </p>
          </div>
        </div>
      ) : null}

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
              className="grid grid-cols-[38px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-pink-400/15 bg-black/60 transition hover:border-pink-300/35"
            >
              <button
                type="button"
                draggable
                onDragStart={() => setDraggedId(block.id)}
                onDragEnd={() => setDraggedId(null)}
                title="Drag to reorder"
                className="flex cursor-grab items-center justify-center border-r border-white/10 bg-white/[0.035] text-lg text-pink-200 active:cursor-grabbing"
              >
                ⋮⋮
              </button>

              <div className="space-y-3 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                    <input type="checkbox" checked={block.enabled} onChange={() => updateBlock(block.id, { enabled: !block.enabled })} className="h-4 w-4 accent-pink-500" />
                    Use
                  </label>
                  <select value={block.level} onChange={(event) => updateBlock(block.id, { level: Number(event.currentTarget.value) as 1 | 2 | 3 })} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option value={1} className="bg-black text-white">H1</option>
                    <option value={2} className="bg-black text-white">H2</option>
                    <option value={3} className="bg-black text-white">H3</option>
                  </select>
                  <input value={block.title} onChange={(event) => updateBlock(block.id, { title: event.currentTarget.value })} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                  <button type="button" onClick={() => deleteBlock(block.id)} className="rounded-full border border-red-300/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-400/20">
                    Delete
                  </button>
                </div>

                <textarea value={block.body} onChange={(event) => updateBlock(block.id, { body: event.currentTarget.value })} className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-pink-400/20 bg-pink-400/10 p-5 text-pink-100">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-300/40 border-t-pink-100" />
          Reading the image and writing premium captions...
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 text-sm leading-7 text-slate-300">
          Upload an image and generate. The editable caption studio will appear here with drag handles, editable blocks, copy, and download.
        </div>
      )}
    </div>
  );
}
