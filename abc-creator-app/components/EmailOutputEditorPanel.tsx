"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadOutput, type OutputDownloadFormat } from "@/lib/download/exportDocuments";
import { downloadHtmlOutput } from "@/lib/download/exportHtml";
import type { RecommendedNextAction } from "@/lib/tools/public-tools";

type DownloadFormat = OutputDownloadFormat | "html";

interface EmailOutputEditorPanelProps {
  isLoading: boolean;
  output: string;
  downloadFileBaseName?: string;
  recommendedNextActions?: RecommendedNextAction[];
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToEditableHtml(value: string) {
  const safe = escapeHtml(value || "");
  return safe
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/^---$/gm, "<hr>")
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<h[1-3]>/.test(trimmed) || trimmed === "<hr>") return trimmed;
      if (/^[-*]\s+/m.test(trimmed)) {
        const items = trimmed.split("\n").filter(Boolean).map((line) => line.replace(/^[-*]\s+/, "").trim()).map((line) => `<li>${line}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function htmlToText(html: string) {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText.trim();
}

export function EmailOutputEditorPanel({ isLoading, output, downloadFileBaseName = "email-output", recommendedNextActions = [] }: EmailOutputEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const hasOutput = Boolean(output.trim());
  const isErrorOutput = /^(error:|not enough credits)/i.test(output.trim());
  const isStreamingVisible = isLoading && hasOutput;
  const showNextActions = hasOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;

  useEffect(() => {
    const html = markdownToEditableHtml(output.trim());
    setEditorHtml(html);
    if (editorRef.current) editorRef.current.innerHTML = html;
  }, [output]);

  const exportText = useMemo(() => htmlToText(editorHtml || output), [editorHtml, output]);

  const syncEditor = () => {
    if (editorRef.current) setEditorHtml(editorRef.current.innerHTML);
  };

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditor();
  };

  const insertTable = () => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, '<table><tbody><tr><th>Column 1</th><th>Column 2</th></tr><tr><td>Edit this</td><td>Edit this</td></tr></tbody></table><p><br></p>');
    syncEditor();
  };

  const copyOutput = async () => {
    const text = exportText || output;
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setDownloadError("");
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setDownloadError("Copy failed. Select the output manually and copy it.");
    }
  };

  const submitPdfFormDownload = () => {
    const iframeName = `abc_email_pdf_export_${Date.now()}`;
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
    outputField.value = exportText || output;
    form.appendChild(outputField);
    const fileNameField = document.createElement("input");
    fileNameField.type = "hidden";
    fileNameField.name = "fileBaseName";
    fileNameField.value = downloadFileBaseName;
    form.appendChild(fileNameField);
    document.body.appendChild(form);
    form.submit();
    form.remove();
    window.setTimeout(() => iframe.remove(), 60000);
  };

  const handleDownload = async (format: DownloadFormat) => {
    const text = exportText || output;
    if (!format || !text.trim() || isDownloading) return;
    setIsDownloading(true);
    setDownloadError("");
    try {
      if (format === "html") downloadHtmlOutput(text, downloadFileBaseName, exportRef.current);
      else if (format === "pdf") submitPdfFormDownload();
      else await downloadOutput(format, text, downloadFileBaseName, exportRef.current);
      window.setTimeout(() => setIsDownloading(false), 1200);
    } catch (error) {
      setDownloadError(error instanceof Error ? `Download failed: ${error.message}` : "Download failed. Please try again.");
      setIsDownloading(false);
    }
  };

  const buttonClass = "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-300/70 bg-white px-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100";

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Output</h2>
          {isStreamingVisible ? <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Streaming live...</span> : isLoading ? <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">Generating...</span> : isDownloading ? <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Preparing download...</span> : null}
        </div>
        {hasOutput ? (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">{copied ? "Copied!" : "Copy"}</button>
            <select aria-label="Download output" defaultValue="" disabled={isDownloading} onChange={(event) => { const format = event.currentTarget.value as DownloadFormat | ""; event.currentTarget.value = ""; if (format) void handleDownload(format); }} className="cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              <option value="" className="bg-black text-white">Download</option>
              <option value="html" className="bg-black text-white">HTML</option>
              <option value="pdf" className="bg-black text-white">PDF</option>
              <option value="docx" className="bg-black text-white">DOCX</option>
              <option value="txt" className="bg-black text-white">Text file</option>
            </select>
          </div>
        ) : null}
      </div>

      {downloadError ? <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{downloadError}</div> : null}

      {hasOutput ? (
        isErrorOutput ? (
          <div className="creator-output-scroll max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-purple-500/15 bg-white text-slate-900 shadow-xl" ref={exportRef}>
            <div data-export-ignore="true" className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <button type="button" className={buttonClass} onClick={() => runCommand("formatBlock", "h2")} title="Heading">H</button>
              <button type="button" className={buttonClass} onClick={() => runCommand("bold")} title="Bold"><strong>B</strong></button>
              <button type="button" className={buttonClass} onClick={() => runCommand("italic")} title="Italic"><em>I</em></button>
              <button type="button" className={buttonClass} onClick={() => runCommand("strikeThrough")} title="Strikethrough"><s>S</s></button>
              <span className="mx-1 h-7 w-px bg-slate-300" />
              <button type="button" className={buttonClass} onClick={() => runCommand("formatBlock", "blockquote")} title="Quote">“</button>
              <button type="button" className={buttonClass} onClick={() => runCommand("insertHorizontalRule")} title="Divider">—</button>
              <button type="button" className={buttonClass} onClick={() => runCommand("insertUnorderedList")} title="Bullet list">• List</button>
              <button type="button" className={buttonClass} onClick={insertTable} title="Table">▦</button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-purple-300 bg-purple-500 text-sm text-white transition hover:bg-purple-600" onClick={() => runCommand("hiliteColor", "#a855f7")} title="Highlight">■</button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncEditor}
              className="email-output-editor min-h-[420px] max-h-[78vh] overflow-y-auto px-6 py-7 text-[15px] leading-7 outline-none"
            />
            <style jsx>{`
              .email-output-editor :global(h1), .email-output-editor :global(h2), .email-output-editor :global(h3){font-weight:700;margin:1rem 0 .65rem;color:#111827;}
              .email-output-editor :global(p){margin:0 0 1rem;}
              .email-output-editor :global(blockquote){border-left:4px solid #a855f7;background:#faf5ff;margin:1rem 0;padding:.75rem 1rem;color:#4c1d95;}
              .email-output-editor :global(ul){list-style:disc;margin:0 0 1rem 1.5rem;}
              .email-output-editor :global(hr){border:0;border-top:1px solid #d1d5db;margin:1rem 0;}
              .email-output-editor :global(table){border-collapse:collapse;width:100%;margin:1rem 0;}
              .email-output-editor :global(th), .email-output-editor :global(td){border:1px solid #d1d5db;padding:.5rem;text-align:left;}
              .email-output-editor :global(th){background:#f3f4f6;font-weight:700;}
            `}</style>
          </div>
        )
      ) : isLoading ? <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" /><p>Generating...</p></div> : <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">Your generated result will appear here. Email outputs can be edited, copied, or downloaded from this panel.</div>}
      {showNextActions ? <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <a key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></a>)}</div></div> : null}
    </div>
  );
}
