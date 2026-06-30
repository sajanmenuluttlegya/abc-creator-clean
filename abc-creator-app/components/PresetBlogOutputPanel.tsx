"use client";

import { useMemo, useRef, useState } from "react";
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
  const exportContentRef = useRef<HTMLDivElement | null>(null);
  const displayOutput = useMemo(() => cleanOutput(output), [output]);
  const hasOutput = Boolean(displayOutput.trim());
  const isStreamingVisible = isLoading && hasOutput;
  const isErrorOutput = /^(error:|not enough credits)/i.test(displayOutput.trim());
  const showNextActions = hasOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;

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
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">
              {copied ? "Copied!" : "Copy"}
            </button>
            <select aria-label="Download output" defaultValue="" disabled={isDownloading} onChange={(event) => { const format = event.currentTarget.value as PresetDownloadFormat | ""; event.currentTarget.value = ""; if (format) void handleDownload(format); }} className="cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60">
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
          <div ref={exportContentRef} className="creator-output-scroll max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
            <PresetBlogOutputEditor output={displayOutput} toolSlug={toolSlug} inputs={inputs} />
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
