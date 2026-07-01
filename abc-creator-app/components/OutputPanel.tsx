"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { RecommendedNextAction } from "@/lib/tools/public-tools";
import {
  downloadOutput,
  type OutputDownloadFormat,
} from "@/lib/download/exportDocuments";
import { downloadHtmlOutput } from "@/lib/download/exportHtml";
import { DiagramRenderer, parseDiagramSpec, type DiagramSpec } from "./diagrams/DiagramRendererClean";
import {
  InlineImageBlock,
  splitOutputIntoImageSegments,
} from "./InlineImageBlocks";

type OutputPanelDownloadFormat = OutputDownloadFormat | "html";

type MarkdownDiagramSegment =
  | { type: "markdown"; content: string; id: string }
  | { type: "diagram"; id: string; spec: DiagramSpec | null };

type DeletableOutputBlock = {
  id: string;
  content: string;
};

interface OutputPanelProps {
  isLoading: boolean;
  output: string;
  recommendedNextActions?: RecommendedNextAction[];
  downloadFileBaseName?: string;
  toolSlug?: string;
  inputs?: Record<string, string>;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-2 text-3xl font-bold text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-8 text-2xl font-bold text-white">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-7 text-xl font-bold text-purple-100">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm leading-7 text-gray-200">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="text-purple-100">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-gray-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 ml-5 list-decimal space-y-3 text-sm leading-7 text-gray-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 marker:text-purple-300">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-purple-300 underline decoration-purple-400/40 underline-offset-4 hover:text-purple-200"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-4 border-purple-400/50 bg-purple-500/10 px-5 py-3 text-purple-100">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="mb-8 mt-8 border-0 border-t border-white/20" />,
  code: ({ children }) => (
    <code className="rounded-md border border-purple-500/20 bg-purple-950/40 px-1.5 py-0.5 text-purple-100">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/80 p-4 text-sm text-purple-100">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-purple-500/20 bg-purple-500/10 px-4 py-3 text-left font-bold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-purple-500/10 px-4 py-3 text-gray-200">
      {children}
    </td>
  ),
};

function normalizeHeadingLabel(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[*_`]/g, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}

function isRemovedBlogSectionHeading(line: string) {
  const normalized = normalizeHeadingLabel(line);

  return (
    normalized === "verify before publishing notes" ||
    normalized === "verify before publishing" ||
    normalized === "final on-page seo checklist" ||
    normalized === "on-page seo checklist" ||
    normalized === "final seo checklist" ||
    normalized === "publisher notes" ||
    normalized === "meta data suggestions" ||
    normalized === "metadata suggestions" ||
    normalized === "meta title" ||
    normalized === "meta description" ||
    normalized === "slug" ||
    normalized === "internal link placeholder ideas" ||
    normalized === "internal-link placeholder ideas" ||
    normalized === "change log" ||
    normalized === "verification checklist" ||
    normalized === "verification checklist for factual claims"
  );
}

function cleanOutputForDisplay(value: string) {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line.trim()) && isRemovedBlogSectionHeading(line)) {
      skipping = true;
      continue;
    }

    if (skipping && /^#{1,3}\s+/.test(line.trim())) {
      if (isRemovedBlogSectionHeading(line)) continue;
      skipping = false;
    }

    if (!skipping) kept.push(line);
  }

  return kept.join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
}

function splitOutputIntoDeletableBlocks(markdown: string): DeletableOutputBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: DeletableOutputBlock[] = [];
  let current: string[] = [];
  let blockIndex = 0;
  let inFence = false;

  const pushCurrent = () => {
    const content = current.join("\n").trim();
    if (!content) return;
    blockIndex += 1;
    blocks.push({ id: `output-block-${blockIndex}`, content });
    current = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) inFence = !inFence;
    const isSectionHeading = !inFence && /^#{1,3}\s+/.test(line.trim());

    if (isSectionHeading && current.length > 0) pushCurrent();
    current.push(line);
  }

  pushCurrent();
  return blocks.length ? blocks : [{ id: "output-block-1", content: markdown.trim() }];
}

function splitMarkdownIntoDiagramSegments(markdown: string, prefix: string): MarkdownDiagramSegment[] {
  const segments: MarkdownDiagramSegment[] = [];
  const pattern = /```abc-diagram\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index).trim();
    if (before) segments.push({ type: "markdown", content: before, id: `${prefix}-markdown-${index}` });

    index += 1;
    segments.push({ type: "diagram", id: `${prefix}-diagram-${index}`, spec: parseDiagramSpec(match[1]) });
    lastIndex = match.index + match[0].length;
  }

  const after = markdown.slice(lastIndex).trim();
  if (after) segments.push({ type: "markdown", content: after, id: `${prefix}-markdown-${index + 1}` });

  return segments.length ? segments : [{ type: "markdown", content: markdown, id: `${prefix}-markdown-1` }];
}

function renderMarkdownWithDiagrams(markdown: string, prefix: string) {
  return splitMarkdownIntoDiagramSegments(markdown, prefix).map((segment) => {
    if (segment.type === "diagram") {
      if (!segment.spec) {
        return (
          <div key={segment.id} className="my-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
            Diagram could not be rendered because the structured diagram block was invalid.
          </div>
        );
      }

      return <DiagramRenderer key={segment.id} spec={segment.spec} />;
    }

    return (
      <ReactMarkdown
        key={segment.id}
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {segment.content}
      </ReactMarkdown>
    );
  });
}

function shouldAutoGenerateBlogImages(toolSlug: string, inputs: Record<string, string>, isLoading: boolean) {
  if (isLoading || toolSlug !== "blog-content") return false;

  const imageMode = (inputs.image_brief_mode || "").toLowerCase();
  if (!imageMode || imageMode.includes("no images")) return false;

  return true;
}

function collectGeneratedPdfImages(root: HTMLElement | null, frame: string) {
  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLImageElement>("img[data-generated-blog-image]"))
    .map((image) => ({
      dataUrl: image.src || "",
      alt: image.alt || "Generated blog image",
      frame,
    }))
    .filter((image) => image.dataUrl.startsWith("data:image/"));
}

export function OutputPanel({
  isLoading,
  output,
  recommendedNextActions = [],
  downloadFileBaseName = "abc-creator-output",
  toolSlug = "",
  inputs = {},
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [deletedBlockIds, setDeletedBlockIds] = useState<Set<string>>(() => new Set());
  const exportContentRef = useRef<HTMLDivElement | null>(null);
  const displayOutput = useMemo(() => cleanOutputForDisplay(output), [output]);
  const outputBlocks = useMemo(() => splitOutputIntoDeletableBlocks(displayOutput), [displayOutput]);
  const visibleOutputBlocks = useMemo(
    () => outputBlocks.filter((block) => !deletedBlockIds.has(block.id)),
    [outputBlocks, deletedBlockIds]
  );
  const exportOutput = useMemo(
    () => visibleOutputBlocks.map((block) => block.content).join("\n\n").trim(),
    [visibleOutputBlocks]
  );
  const hasOutput = Boolean(displayOutput.trim());
  const hasVisibleOutput = Boolean(exportOutput.trim());
  const isStreamingVisible = isLoading && hasOutput;
  const isErrorOutput = /^(error:|not enough credits)/i.test(displayOutput.trim());
  const showNextActions =
    hasVisibleOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;
  const autoGenerateBlogImages = shouldAutoGenerateBlogImages(toolSlug, inputs, isLoading);

  useEffect(() => {
    setDeletedBlockIds(new Set());
  }, [displayOutput]);

  const fallbackCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = exportOutput;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copiedFallback = document.execCommand("copy");
    textarea.remove();

    if (!copiedFallback) throw new Error("Clipboard copy failed.");
  };

  const copyOutput = async () => {
    if (!exportOutput) return;

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(exportOutput);
      else fallbackCopy();

      setCopied(true);
      setDownloadError("");
      window.setTimeout(() => setCopied(false), 5000);
    } catch {
      try {
        fallbackCopy();
        setCopied(true);
        setDownloadError("");
        window.setTimeout(() => setCopied(false), 5000);
      } catch {
        setDownloadError("Copy failed. Please select the output text manually and copy it.");
      }
    }
  };

  const submitPdfFormDownload = () => {
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
    outputField.value = exportOutput;
    form.appendChild(outputField);

    const fileNameField = document.createElement("input");
    fileNameField.type = "hidden";
    fileNameField.name = "fileBaseName";
    fileNameField.value = downloadFileBaseName;
    form.appendChild(fileNameField);

    const imagesField = document.createElement("textarea");
    imagesField.name = "images";
    imagesField.value = JSON.stringify(
      collectGeneratedPdfImages(exportContentRef.current, inputs.export_image_frame || "boxed")
    );
    form.appendChild(imagesField);

    document.body.appendChild(form);
    form.submit();
    form.remove();

    window.setTimeout(() => iframe.remove(), 60000);
  };

  const handleDownload = async (format: OutputPanelDownloadFormat) => {
    if (!format || !exportOutput || isDownloading) return;

    setIsDownloading(true);
    setDownloadError("");

    try {
      if (format === "html") {
        downloadHtmlOutput(exportOutput, downloadFileBaseName, exportContentRef.current);
        setIsDownloading(false);
        return;
      }

      if (format === "pdf") {
        submitPdfFormDownload();
        window.setTimeout(() => setIsDownloading(false), 1500);
        return;
      }

      await downloadOutput(
        format,
        exportOutput,
        downloadFileBaseName,
        exportContentRef.current
      );
      setIsDownloading(false);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? `Download failed: ${error.message}`
          : "Download failed. Please try again."
      );
      setIsDownloading(false);
    }
  };

  const deleteOutputBlock = (blockId: string) => {
    setDeletedBlockIds((current) => {
      const next = new Set(current);
      next.add(blockId);
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Output</h2>

          {isStreamingVisible ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Streaming live...
            </span>
          ) : isLoading ? (
            <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
              Generating...
            </span>
          ) : isDownloading ? (
            <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
              Preparing download...
            </span>
          ) : autoGenerateBlogImages ? (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Auto-generating blog images — free
            </span>
          ) : null}
        </div>

        {hasVisibleOutput ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyOutput}
              className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20"
            >
              {copied ? "Copied!" : "Copy"}
            </button>

            <select
              aria-label="Download output"
              defaultValue=""
              disabled={isDownloading}
              onChange={(event) => {
                const format = event.currentTarget.value as OutputPanelDownloadFormat | "";
                event.currentTarget.value = "";
                if (format) void handleDownload(format);
              }}
              className="cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="bg-black text-white">
                Download
              </option>
              <option value="html" className="bg-black text-white">
                HTML
              </option>
              <option value="pdf" className="bg-black text-white">
                PDF
              </option>
              <option value="docx" className="bg-black text-white">
                DOCX
              </option>
              <option value="txt" className="bg-black text-white">
                Text file
              </option>
            </select>
          </div>
        ) : null}
      </div>

      {downloadError ? (
        <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {downloadError}
        </div>
      ) : null}

      {hasOutput ? (
        <>
          <div ref={exportContentRef} className="creator-output-scroll max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
            {visibleOutputBlocks.length ? (
              visibleOutputBlocks.map((block) => (
                <div key={block.id} className="group relative rounded-2xl border border-transparent p-1 transition hover:border-red-300/20 hover:bg-white/[0.015]">
                  <button
                    type="button"
                    aria-label="Delete this output section"
                    title="Delete this output section"
                    onClick={() => deleteOutputBlock(block.id)}
                    className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-300/30 bg-red-500/15 text-sm text-red-100 opacity-0 shadow-lg shadow-red-950/20 transition hover:bg-red-500/25 group-hover:opacity-100"
                  >
                    🗑
                  </button>
                  <div className="pr-8">
                    {splitOutputIntoImageSegments(block.content).map((segment) =>
                      segment.type === "image" ? (
                        <InlineImageBlock
                          key={segment.id}
                          blockId={segment.id}
                          markdown={segment.content}
                          prompt={segment.prompt}
                          toolSlug={toolSlug}
                          inputs={inputs}
                          autoGenerate={autoGenerateBlogImages}
                        />
                      ) : (
                        <div key={segment.id}>{renderMarkdownWithDiagrams(segment.content, segment.id)}</div>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm text-red-100">
                All output sections were deleted. Run the tool again to regenerate the output.
              </div>
            )}

            {isStreamingVisible ? (
              <span className="mt-2 inline-block h-5 w-2 animate-pulse rounded-sm bg-purple-300 align-middle" />
            ) : null}
          </div>

          {showNextActions ? (
            <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
                Recommended next actions
              </h3>
              <div className="space-y-3">
                {recommendedNextActions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10"
                  >
                    <div className="text-sm font-semibold text-white">
                      {action.label}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          <p>Generating...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">
          Your generated result will appear here. Text tools can be copied or downloaded from this panel.
        </div>
      )}
    </div>
  );
}
