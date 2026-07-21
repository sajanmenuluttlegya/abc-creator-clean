"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RecommendedNextAction } from "@/lib/tools/public-tools";
import { downloadOutput, type OutputDownloadFormat } from "@/lib/download/exportDocuments";
import { downloadHtmlOutput } from "@/lib/download/exportHtml";
import { PresetBlogOutputEditor } from "./PresetBlogOutputEditor";

type PresetDownloadFormat = OutputDownloadFormat | "html";

type Props = {
  isLoading: boolean;
  output: string;
  recommendedNextActions?: RecommendedNextAction[];
  downloadFileBaseName?: string;
  toolSlug: string;
  inputs?: Record<string, string>;
};

function cleanOutput(value: string) {
  return value.replace(/\n{4,}/g, "\n\n\n").trim();
}

export function PresetBlogOutputPanel({
  isLoading,
  output,
  recommendedNextActions = [],
  downloadFileBaseName = "abc-creator-output",
  toolSlug,
  inputs = {},
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [manualOutput, setManualOutput] = useState("");
  const [previousManualOutput, setPreviousManualOutput] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const exportContentRef = useRef<HTMLDivElement | null>(null);
  const displayOutput = useMemo(() => cleanOutput(manualOutput || output), [manualOutput, output]);
  const hasOutput = Boolean(displayOutput.trim());
  const isStreamingVisible = isLoading && hasOutput;
  const isErrorOutput = /^(error:|not enough credits)/i.test(displayOutput.trim());
  const showNextActions = hasOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;

  useEffect(() => { setManualOutput(""); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); }, [output]);
  const openManualEdit = () => { setEditDraft(displayOutput); setIsEditingText(true); };
  const saveManualEdit = () => { const next = editDraft.trim(); if (!next) { setDownloadError("Edited text cannot be empty."); return; } setPreviousManualOutput(displayOutput); setManualOutput(next); setIsEditingText(false); setEditDraft(""); setDownloadError(""); };
  const undoManualEdit = () => { if (!previousManualOutput) return; setManualOutput(previousManualOutput); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); };

  const copyOutput = async () => {
    if (!displayOutput) return;
    try {
      await navigator.clipboard.writeText(displayOutput);
      setCopied(true);
      setDownloadError("");
      window.setTimeout(() => setCopied(false), 5000);
    } catch {
      setDownloadError("Copy failed. Please select the output text manually and copy it.");
    }
  };

  const handleDownload = async (format: PresetDownloadFormat) => {
    if (!format || !displayOutput || isDownloading) return;
    setIsDownloading(true);
    setDownloadError("");

    try {
      if (format === "html") {
        downloadHtmlOutput(displayOutput, downloadFileBaseName, exportContentRef.current);
      } else {
        await downloadOutput(format, displayOutput, downloadFileBaseName, exportContentRef.current);
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? `Download failed: ${error.message}` : "Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Output</h2>
          {isStreamingVisible ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Streaming live...</span>
          ) : isLoading ? (
            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">Generating...</span>
          ) : isDownloading ? (
            <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Preparing download...</span>
          ) : hasOutput && !isErrorOutput ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Hover output blocks to add images or tables</span>
          ) : null}
        </div>

        {hasOutput ? (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={openManualEdit} className="rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white">Edit</button>
            {previousManualOutput ? <button type="button" onClick={undoManualEdit} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-300">Undo edit</button> : null}
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">
              {copied ? "Copied!" : "Copy"}
            </button>
            <select aria-label="Download output" defaultValue="" disabled={isDownloading} onChange={(event) => { const format = event.currentTarget.value as PresetDownloadFormat | ""; event.currentTarget.value = ""; if (format) void handleDownload(format); }} className="abc-download-control cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60">
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
        <>
          <div ref={exportContentRef} className="creator-output-scroll preset-blog-output max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
            {isEditingText ? <div data-export-ignore="true"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">Edit generated text</p><p className="mt-1 text-xs text-slate-500">Manual editing is free. Regeneration continues to use credits.</p></div><div className="flex gap-2"><button type="button" onClick={saveManualEdit} className="rounded-full border border-purple-300/35 bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-100">Save edit</button><button type="button" onClick={() => { setIsEditingText(false); setEditDraft(""); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">Cancel</button></div></div><textarea value={editDraft} onChange={(event) => setEditDraft(event.currentTarget.value)} className="min-h-[55vh] w-full resize-y rounded-2xl border border-white/15 bg-black/35 px-5 py-4 font-mono text-sm leading-7 text-white" /></div> : <PresetBlogOutputEditor output={displayOutput} toolSlug={toolSlug} inputs={inputs} />}
            {isStreamingVisible ? <span className="mt-2 inline-block h-5 w-2 animate-pulse rounded-sm bg-purple-300 align-middle" /> : null}
          </div>

          {showNextActions ? (
            <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">Recommended next actions</h3>
              <div className="space-y-3">
                {recommendedNextActions.map((action) => (
                  <a key={`${action.href}-${action.label}`} href={action.href} className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10">
                    <div className="text-sm font-semibold text-white">{action.label}</div>
                    <p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" /><p>Generating...</p></div>
      ) : (
        <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">Your generated result will appear here. Text tools can be copied or downloaded from this panel.</div>
      )}
    </div>
  );
}
