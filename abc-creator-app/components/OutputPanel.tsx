"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { RecommendedNextAction } from "@/lib/tools/public-tools";
import { getBookTitleSelection, isBookTitleOptionBlock } from "@/lib/tools/book-title-selection";
import { downloadOutput, type OutputDownloadFormat } from "@/lib/download/exportDocuments";
import { downloadHtmlOutput } from "@/lib/download/exportHtml";
import { DiagramRenderer, parseDiagramSpec, type DiagramSpec } from "./diagrams/DiagramRendererClean";
import { InlineImageBlock, splitOutputIntoImageSegments } from "./InlineImageBlocks";

const BLOG_IMAGE_OUTPUT_TOOLS = [
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
] as const;

const BOOK_IMAGE_OUTPUT_TOOLS = [
  "book-idea-generator",
  "book-title-generator",
  "book-bible-generator",
  "character-builder",
  "worldbuilding-builder",
  "book-outline-generator",
  "chapter-outline-generator",
  "scene-generator",
  "chapter-writer",
  "chapter-rewriter-humanizer",
  "continuity-checker",
  "book-blurb-generator",
  "full-book-generator",
  "book-cover-prompt-generator",
  "book-front-matter-generator",
  "book-style-guide-generator",
  "book-export-builder",
] as const;

const IMAGE_OUTPUT_TOOLS = new Set<string>([...BLOG_IMAGE_OUTPUT_TOOLS, ...BOOK_IMAGE_OUTPUT_TOOLS]);
const BOOK_IMAGE_OUTPUT_TOOL_SET = new Set<string>(BOOK_IMAGE_OUTPUT_TOOLS);
const BLOG_IMAGE_OUTPUT_TOOL_SET = new Set<string>(BLOG_IMAGE_OUTPUT_TOOLS);

type OutputPanelDownloadFormat = OutputDownloadFormat | "html";
type SideImageRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type SideImagePlacement = "left" | "right" | "top" | "bottom";
type SideImageModel = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type SideImageResolution = "360p" | "480p" | "720p" | "1080p";
type MenuOption<T extends string> = { label: string; value: T };

type MarkdownDiagramSegment =
  | { type: "markdown"; content: string; id: string }
  | { type: "diagram"; id: string; spec: DiagramSpec | null };

type DeletableOutputBlock = { id: string; content: string };
type SectionRegenerateResponse = { ok?: boolean; error?: string; details?: string; text?: string };
type BookTitleRegenerateResponse = SectionRegenerateResponse & { code?: string; requiredCredits?: number; creditsSpent?: number; titleCount?: number };
type OutputImageResponse = { ok?: boolean; error?: string; details?: string; code?: string; requiredCredits?: number; currentCredits?: number; images?: Array<{ dataUrl: string; filename?: string }> };

type SideImageState = {
  dataUrl: string;
  prompt: string;
  ratio: SideImageRatio;
  placement: SideImagePlacement;
  widthPercent: number;
  model: SideImageModel;
  resolution: SideImageResolution;
  filename?: string;
};

interface OutputPanelProps {
  isLoading: boolean;
  output: string;
  recommendedNextActions?: RecommendedNextAction[];
  downloadFileBaseName?: string;
  toolSlug?: string;
  inputs?: Record<string, string>;
}

const actionButtonClass = "rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-xs font-bold text-white/90 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300/30 bg-red-500/15 text-sm text-red-100 shadow-lg shadow-red-950/20 transition hover:bg-red-500/25";

const ratioOptions: MenuOption<SideImageRatio>[] = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:5", value: "4:5" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
];

const modelOptions: MenuOption<SideImageModel>[] = ["M1", "M2", "M3", "M4", "M5", "M6"].map((value) => ({ label: value, value: value as SideImageModel }));
const resolutionOptions: MenuOption<SideImageResolution>[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value: value as SideImageResolution }));

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-5 mt-2 text-3xl font-bold text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-4 mt-8 text-2xl font-bold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-7 text-xl font-bold text-purple-100">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-sm leading-7 text-gray-200">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-purple-100">{children}</em>,
  ul: ({ children }) => <ul className="mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-gray-200">{children}</ul>,
  ol: ({ children }) => <ol className="mb-6 ml-5 list-decimal space-y-3 text-sm leading-7 text-gray-200">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-purple-300">{children}</li>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-purple-300 underline decoration-purple-400/40 underline-offset-4 hover:text-purple-200">{children}</a>,
  blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-purple-400/50 bg-purple-500/10 px-5 py-3 text-purple-100">{children}</blockquote>,
  hr: () => <hr className="mb-8 mt-8 border-0 border-t border-white/20" />,
  code: ({ children }) => <code className="rounded-md border border-purple-500/20 bg-purple-950/40 px-1.5 py-0.5 text-purple-100">{children}</code>,
  pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/80 p-4 text-sm text-purple-100">{children}</pre>,
  table: ({ children }) => <div className="my-5 overflow-x-auto rounded-2xl border border-purple-500/20"><table className="w-full min-w-[720px] border-collapse text-sm">{children}</table></div>,
  th: ({ children }) => <th className="border-b border-purple-500/20 bg-purple-500/10 px-4 py-3 text-left font-bold text-white">{children}</th>,
  td: ({ children }) => <td className="border-b border-purple-500/10 px-4 py-3 text-gray-200">{children}</td>,
};

function PremiumMenu<T extends string>({ label, valueLabel, options, disabled, onSelect, align = "right" }: { label: string; valueLabel?: string; options: MenuOption<T>[]; disabled?: boolean; onSelect: (value: T) => void; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const button = buttonRef.current;
      if (!button) return;
      const bounds = button.getBoundingClientRect();
      const width = Math.max(bounds.width, 180);
      const left = align === "right" ? Math.max(12, bounds.right - width) : bounds.left;
      setRect({ left, top: bounds.bottom + 10, width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [align, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const menu = document.getElementById(`${label.replace(/\s+/g, "-").toLowerCase()}-premium-menu`);
      if (target && (rootRef.current?.contains(target) || menu?.contains(target))) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [label, open]);

  const menu = open && mounted && rect ? createPortal(
    <div id={`${label.replace(/\s+/g, "-").toLowerCase()}-premium-menu`} className="fixed z-[2147483647] rounded-[1.35rem] border border-purple-300/25 bg-[#07050d]/98 p-2 shadow-[0_28px_90px_rgba(88,28,135,0.55)] backdrop-blur-2xl" style={{ left: rect.left, top: rect.top, width: rect.width }}>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => { onSelect(option.value); setOpen(false); }} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:bg-purple-500/25 hover:text-white">
          {option.label}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button ref={buttonRef} type="button" data-abc-download-control={label === "Download" ? "true" : undefined} disabled={disabled} onClick={() => setOpen((current) => !current)} className="inline-flex min-h-10 items-center gap-3 rounded-full border border-purple-300/30 bg-white/[0.055] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-950/20 backdrop-blur-xl transition hover:border-purple-200/50 hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-60">
        <span>{valueLabel || label}</span>
        <span className={`h-2.5 w-2.5 border-b-2 border-r-2 border-purple-100/85 transition-transform ${open ? "-rotate-135" : "rotate-45"}`} />
      </button>
      {menu}
    </div>
  );
}

function normalizeHeadingLabel(line: string) {
  return line.replace(/^#{1,6}\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/[*_`]/g, "").replace(/:$/, "").trim().toLowerCase();
}

function isRemovedBlogSectionHeading(line: string) {
  const normalized = normalizeHeadingLabel(line);
  return ["verify before publishing notes", "verify before publishing", "final on-page seo checklist", "on-page seo checklist", "final seo checklist", "publisher notes", "meta data suggestions", "metadata suggestions", "meta title", "meta description", "slug", "internal link placeholder ideas", "internal-link placeholder ideas", "change log", "verification checklist", "verification checklist for factual claims"].includes(normalized);
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
  return kept.join("\n").replace(/^(#{1,6}\s+)ultra[-\s]*premium\s+/gim, "$1").replace(/^(#{1,6}\s+)premium\s+(output|result|deliverable|canvas|studio)\b/gim, "$1$2").replace(/\n{4,}/g, "\n\n\n").trim();
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
      if (!segment.spec) return <div key={segment.id} className="my-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">Diagram could not be rendered because the structured diagram block was invalid.</div>;
      return <DiagramRenderer key={segment.id} spec={segment.spec} />;
    }
    return <ReactMarkdown key={segment.id} remarkPlugins={[remarkGfm]} components={markdownComponents}>{segment.content}</ReactMarkdown>;
  });
}

function shouldAutoGenerateBlogImages(toolSlug: string, inputs: Record<string, string>, isLoading: boolean) {
  if (isLoading || !BLOG_IMAGE_OUTPUT_TOOL_SET.has(toolSlug)) return false;
  if (toolSlug === "blog-content") {
    const imageMode = (inputs.image_brief_mode || "").toLowerCase();
    return Boolean(imageMode) && !imageMode.includes("no images");
  }
  return true;
}

function collectGeneratedPdfImages(root: HTMLElement | null, frame: string) {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLImageElement>("img[data-generated-blog-image]"))
    .map((image) => ({ dataUrl: image.src || "", alt: image.alt || "Generated image", frame }))
    .filter((image) => image.dataUrl.startsWith("data:image/"));
}

function compactText(value: string, maxLength: number) {
  const cleaned = value.replace(/[#*_`>\-]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, Math.max(0, maxLength - 3))}...` : cleaned;
}

function defaultRegenerateInstruction(sectionText: string) {
  return `Rewrite this section to be clearer, more precise, and professional while preserving the same meaning and Markdown heading. If this is book prose, write like a professional author, preserve canon, keep natural paragraphing, and never sound AI-generated.\n\n${sectionText}`;
}

function defaultSideImagePrompt(sectionText: string, inputs: Record<string, string>, toolSlug: string) {
  const heading = sectionText.split("\n").find((line) => /^#{1,4}\s+/.test(line.trim())) || "this section";
  const context = compactText(sectionText, 620);
  const brand = compactText(inputs.brand_or_context || inputs.brand_name || inputs.name_or_brand || inputs.productName || inputs.book_title || "", 140);
  const bookVisual = BOOK_IMAGE_OUTPUT_TOOL_SET.has(toolSlug);
  return [
    bookVisual ? `Create a premium textless book illustration for the strongest visual scene in: ${compactText(heading, 90)}.` : `Create a premium textless image for the section: ${compactText(heading, 90)}.`,
    brand ? `Book/brand/context: ${brand}.` : "",
    `Section context: ${context}`,
    bookVisual
      ? "Preserve character/world consistency from the book bible. Make it cinematic, professional, and publishable. Avoid readable text, typography, watermarks, fake logos, and inconsistent character design."
      : "Use a clean professional composition. Avoid readable text, watermarks, fake logos, and UI screenshots unless the section explicitly requires them.",
  ].filter(Boolean).join("\n");
}

function sideImageContainerStyle(placement: SideImagePlacement): CSSProperties {
  if (placement === "left") return { display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 20, width: "100%" };
  if (placement === "right") return { display: "flex", flexDirection: "row-reverse", alignItems: "flex-start", gap: 20, width: "100%" };
  return { display: "block", width: "100%" };
}

function sideImageFrameStyle(image: SideImageState): CSSProperties {
  if (image.placement === "left" || image.placement === "right") return { width: `${Math.min(image.widthPercent, 44)}%`, minWidth: 220, maxWidth: 420, flexShrink: 0 };
  if (image.placement === "top") return { width: `${image.widthPercent}%`, margin: "0 auto 20px" };
  return { width: `${image.widthPercent}%`, margin: "20px auto 0" };
}

function uploadedFilename(file: File) {
  const extension = file.type.split("/")[1] || "png";
  return (file.name || `section-image.${extension}`).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || `section-image.${extension}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function OutputPanel({ isLoading, output, recommendedNextActions = [], downloadFileBaseName = "abc-creator-output", toolSlug = "", inputs = {} }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [deletedBlockIds, setDeletedBlockIds] = useState<Set<string>>(() => new Set());
  const [blockOverrides, setBlockOverrides] = useState<Record<string, string>>({});
  const [previousBlockOverrides, setPreviousBlockOverrides] = useState<Record<string, string | null>>({});
  const [activeEditBlockId, setActiveEditBlockId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [activeRegenerateBlockId, setActiveRegenerateBlockId] = useState<string | null>(null);
  const [regenerateInstruction, setRegenerateInstruction] = useState("");
  const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);
  const [sectionActionMessage, setSectionActionMessage] = useState("");
  const [bookTitleOutputOverride, setBookTitleOutputOverride] = useState<string | null>(null);
  const [regeneratingAllBookTitles, setRegeneratingAllBookTitles] = useState(false);
  const [sideImages, setSideImages] = useState<Record<string, SideImageState>>({});
  const [previousSideImages, setPreviousSideImages] = useState<Record<string, SideImageState | null>>({});
  const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageRatio, setImageRatio] = useState<SideImageRatio>("1:1");
  const [imagePlacement, setImagePlacement] = useState<SideImagePlacement>("bottom");
  const [imageModel, setImageModel] = useState<SideImageModel>("M5");
  const [imageResolution, setImageResolution] = useState<SideImageResolution>("720p");
  const [generatingImageBlockId, setGeneratingImageBlockId] = useState<string | null>(null);
  const [uploadingImageBlockId, setUploadingImageBlockId] = useState<string | null>(null);
  const exportContentRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const displayOutput = useMemo(() => cleanOutputForDisplay(output), [output]);
  const effectiveDisplayOutput = bookTitleOutputOverride ?? displayOutput;
  const outputBlocks = useMemo(() => splitOutputIntoDeletableBlocks(effectiveDisplayOutput), [effectiveDisplayOutput]);
  const visibleOutputBlocks = useMemo(() => outputBlocks.filter((block) => !deletedBlockIds.has(block.id)).map((block) => ({ ...block, content: blockOverrides[block.id] ?? block.content })), [outputBlocks, deletedBlockIds, blockOverrides]);
  const exportOutput = useMemo(() => visibleOutputBlocks.map((block) => block.content).join("\n\n").trim(), [visibleOutputBlocks]);
  const hasOutput = Boolean(displayOutput.trim());
  const hasVisibleOutput = Boolean(exportOutput.trim());
  const isStreamingVisible = isLoading && hasOutput;
  const isErrorOutput = /^(error:|not enough credits)/i.test(displayOutput.trim());
  const showNextActions = hasVisibleOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;
  const autoGenerateBlogImages = shouldAutoGenerateBlogImages(toolSlug, inputs, isLoading);
  const canGenerateSectionImage = IMAGE_OUTPUT_TOOLS.has(toolSlug);
  const isBookImageTool = BOOK_IMAGE_OUTPUT_TOOL_SET.has(toolSlug);
  const isBookTitleGenerator = toolSlug === "book-title-generator";
  const bookTitleSelection = getBookTitleSelection(inputs.title_count);

  useEffect(() => {
    setDeletedBlockIds(new Set());
    setBlockOverrides({});
    setPreviousBlockOverrides({});
    setActiveEditBlockId(null);
    setEditDraft("");
    setActiveRegenerateBlockId(null);
    setRegenerateInstruction("");
    setRegeneratingBlockId(null);
    setSectionActionMessage("");
    setBookTitleOutputOverride(null);
    setRegeneratingAllBookTitles(false);
    setSideImages({});
    setPreviousSideImages({});
    setActiveImageBlockId(null);
    setImagePrompt("");
    setImageRatio("1:1");
    setImagePlacement("bottom");
    setImageModel("M5");
    setImageResolution("720p");
    setGeneratingImageBlockId(null);
    setUploadingImageBlockId(null);
  }, [displayOutput]);

  const rememberSideImageUndo = (blockId: string) => setPreviousSideImages((current) => ({ ...current, [blockId]: sideImages[blockId] || null }));

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
    imagesField.value = JSON.stringify(collectGeneratedPdfImages(exportContentRef.current, inputs.export_image_frame || "boxed"));
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
      await downloadOutput(format, exportOutput, downloadFileBaseName, exportContentRef.current);
      setIsDownloading(false);
    } catch (error) {
      setDownloadError(error instanceof Error ? `Download failed: ${error.message}` : "Download failed. Please try again.");
      setIsDownloading(false);
    }
  };

  const openManualEdit = (block: DeletableOutputBlock) => {
    setActiveRegenerateBlockId(null); setActiveImageBlockId(null); setActiveEditBlockId(block.id);
    setEditDraft(blockOverrides[block.id] ?? block.content); setSectionActionMessage("");
  };
  const saveManualEdit = (block: DeletableOutputBlock) => {
    const next = editDraft.trim(); if (!next) { setSectionActionMessage("Edited text cannot be empty."); return; }
    const current = blockOverrides[block.id] ?? block.content;
    setPreviousBlockOverrides((items) => ({ ...items, [block.id]: current }));
    setBlockOverrides((items) => ({ ...items, [block.id]: next }));
    setActiveEditBlockId(null); setEditDraft(""); setSectionActionMessage("Manual edit saved. No credits were used.");
  };
  const undoManualEdit = (blockId: string) => {
    const previous = previousBlockOverrides[blockId]; if (previous === undefined) return;
    setBlockOverrides((items) => ({ ...items, [blockId]: previous || "" }));
    setPreviousBlockOverrides((items) => { const next = { ...items }; delete next[blockId]; return next; });
    setSectionActionMessage("Manual edit undone.");
  };

  const deleteOutputBlock = (blockId: string) => setDeletedBlockIds((current) => new Set([...current, blockId]));

  const regenerateBookTitle = async (scope: "single" | "all", block?: DeletableOutputBlock) => {
    if (scope === "single" && !block) return;
    if (scope === "all") setRegeneratingAllBookTitles(true);
    else setRegeneratingBlockId(block!.id);
    setSectionActionMessage("");
    try {
      const response = await fetch("/api/generate/book-title-regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, sectionText: block?.content || "", fullOutput: exportOutput, inputs }),
      });
      const data = (await response.json()) as BookTitleRegenerateResponse;
      if (!response.ok || !data.ok || !data.text?.trim()) {
        const required = data.requiredCredits ? ` This action needs ${data.requiredCredits} credit${data.requiredCredits === 1 ? "" : "s"}.` : "";
        setSectionActionMessage(`${data.error || "Book-title regeneration failed."}${required}${data.details ? ` ${data.details}` : ""}`);
        return;
      }
      if (scope === "all") {
        setBookTitleOutputOverride(cleanOutputForDisplay(data.text));
        setDeletedBlockIds(new Set());
        setBlockOverrides({});
        setPreviousBlockOverrides({});
        setSectionActionMessage(`All ${data.titleCount || bookTitleSelection.count} titles regenerated for ${data.creditsSpent || bookTitleSelection.credits} credit${(data.creditsSpent || bookTitleSelection.credits) === 1 ? "" : "s"}.`);
      } else if (block) {
        setPreviousBlockOverrides((current) => ({ ...current, [block.id]: blockOverrides[block.id] ?? block.content }));
        setBlockOverrides((current) => ({ ...current, [block.id]: data.text!.trim() }));
        setSectionActionMessage("Title regenerated for 1 credit.");
      }
    } catch (error) {
      setSectionActionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (scope === "all") setRegeneratingAllBookTitles(false);
      else setRegeneratingBlockId(null);
    }
  };

  const openRegeneratePanel = (block: DeletableOutputBlock) => {
    setActiveImageBlockId(null);
    setActiveRegenerateBlockId((current) => (current === block.id ? null : block.id));
    setRegenerateInstruction(defaultRegenerateInstruction(block.content));
    setSectionActionMessage("");
  };

  const regenerateOutputBlock = async (block: DeletableOutputBlock) => {
    const instruction = regenerateInstruction.trim();
    if (!instruction) {
      setSectionActionMessage("Add a regenerate instruction first.");
      return;
    }
    setRegeneratingBlockId(block.id);
    setSectionActionMessage("");
    try {
      const response = await fetch("/api/generate/section-regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolSlug, sectionText: block.content, instruction }) });
      const data = (await response.json()) as SectionRegenerateResponse;
      if (!response.ok || !data.ok || !data.text?.trim()) {
        setSectionActionMessage(`${data.error || "Section regeneration failed."}${data.details ? ` ${data.details}` : ""}`);
        return;
      }
      setBlockOverrides((current) => ({ ...current, [block.id]: data.text!.trim() }));
      setActiveRegenerateBlockId(null);
      setRegenerateInstruction("");
      setSectionActionMessage("Section regenerated.");
    } catch (error) {
      setSectionActionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRegeneratingBlockId(null);
    }
  };

  const openImagePanel = (block: DeletableOutputBlock, mode: "generate" | "edit" = "generate") => {
    const existing = sideImages[block.id];
    setActiveRegenerateBlockId(null);
    setActiveImageBlockId((current) => (current === block.id ? null : block.id));
    setImagePrompt(mode === "edit" && existing ? `Improve this image while keeping it consistent with the section.\n\n${existing.prompt}` : defaultSideImagePrompt(block.content, inputs, toolSlug));
    setImageRatio(existing?.ratio || "1:1");
    setImagePlacement(existing?.placement || "bottom");
    setImageModel(existing?.model || "M5");
    setImageResolution(existing?.resolution || "720p");
    setSectionActionMessage("");
  };

  const generateSideImage = async (block: DeletableOutputBlock) => {
    const prompt = imagePrompt.trim();
    if (!prompt) {
      setSectionActionMessage("Add an image prompt first.");
      return;
    }
    const existing = sideImages[block.id];
    const operation = existing ? "edit" : "generate";
    setGeneratingImageBlockId(block.id);
    setSectionActionMessage("");
    try {
      const response = await fetch("/api/generate/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, toolSlug, prompt, sourceText: block.content, aspectRatio: imageRatio, imageModel, resolution: imageResolution, imageCount: 1, inputs: { ...inputs, output_image_placement: imagePlacement, output_image_model: imageModel, output_image_resolution: imageResolution, output_image_ratio: imageRatio }, sourceImageDataUrl: existing?.dataUrl || "" }) });
      const data = (await response.json()) as OutputImageResponse;
      if (!response.ok || !data.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") setSectionActionMessage(`Not enough credits. This image needs ${data.requiredCredits ?? 1} credit. You currently have ${data.currentCredits ?? 0}.`);
        else setSectionActionMessage(`${data.error || "Image generation failed."}${data.details ? ` ${data.details}` : ""}`);
        return;
      }
      const image = data.images?.[0];
      if (!image?.dataUrl) {
        setSectionActionMessage("Image generation finished but no image was returned.");
        return;
      }
      rememberSideImageUndo(block.id);
      setSideImages((current) => ({ ...current, [block.id]: { dataUrl: image.dataUrl, prompt, ratio: imageRatio, placement: imagePlacement, widthPercent: imagePlacement === "left" || imagePlacement === "right" ? 42 : 100, model: imageModel, resolution: imageResolution, filename: image.filename } }));
      setActiveImageBlockId(null);
      setImagePrompt("");
      setSectionActionMessage(operation === "edit" ? "Image edited." : "Image added to this section.");
    } catch (error) {
      setSectionActionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setGeneratingImageBlockId(null);
    }
  };

  const startSideImageResize = (event: ReactPointerEvent<HTMLButtonElement>, blockId: string) => {
    const image = sideImages[blockId];
    if (!image) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = image.widthPercent;
    const onMove = (moveEvent: PointerEvent) => {
      const direction = image.placement === "right" ? -1 : 1;
      const maxWidth = image.placement === "left" || image.placement === "right" ? 44 : 100;
      const minWidth = image.placement === "left" || image.placement === "right" ? 24 : 38;
      const delta = ((moveEvent.clientX - startX) * direction) / 8;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(startWidth + delta)));
      setSideImages((current) => ({ ...current, [blockId]: current[blockId] ? { ...current[blockId], widthPercent: nextWidth } : image }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const beginUploadSideImage = (blockId: string) => {
    setUploadingImageBlockId(blockId);
    uploadInputRef.current?.click();
  };

  const handleUploadSideImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    const blockId = uploadingImageBlockId;
    setUploadingImageBlockId(null);
    if (!file || !blockId) return;
    if (!file.type.startsWith("image/")) {
      setSectionActionMessage("Please upload a valid image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setSectionActionMessage("Please upload an image smaller than 20 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl.startsWith("data:image/")) {
        setSectionActionMessage("Could not read the uploaded image file.");
        return;
      }
      rememberSideImageUndo(blockId);
      const current = sideImages[blockId];
      setSideImages((items) => ({ ...items, [blockId]: { dataUrl, prompt: current?.prompt || "Uploaded image", ratio: current?.ratio || "1:1", placement: current?.placement || "bottom", widthPercent: current?.widthPercent || 100, model: current?.model || imageModel, resolution: current?.resolution || imageResolution, filename: uploadedFilename(file) } }));
      setSectionActionMessage("Image uploaded.");
    };
    reader.onerror = () => setSectionActionMessage("Could not read the uploaded image file.");
    reader.readAsDataURL(file);
  };

  const undoSideImage = (blockId: string) => {
    const previous = previousSideImages[blockId];
    if (previous === undefined) return;
    if (previous) setSideImages((current) => ({ ...current, [blockId]: previous }));
    else setSideImages((current) => { const next = { ...current }; delete next[blockId]; return next; });
    setPreviousSideImages((current) => { const next = { ...current }; delete next[blockId]; return next; });
    setSectionActionMessage("Image change undone.");
  };

  const deleteSideImage = (blockId: string) => {
    rememberSideImageUndo(blockId);
    setSideImages((current) => { const next = { ...current }; delete next[blockId]; return next; });
    setSectionActionMessage("Image removed.");
  };

  const renderSideImage = (block: DeletableOutputBlock, image: SideImageState) => (
    <figure className="group/side-image relative overflow-hidden rounded-2xl border border-transparent bg-black/45 p-2 shadow-lg shadow-emerald-950/20 transition hover:border-emerald-300/20" style={sideImageFrameStyle(image)} data-abc-side-image-placement={image.placement}>
      <img src={image.dataUrl} alt={image.prompt || "Generated section image"} className="w-full rounded-xl object-cover" data-generated-blog-image="true" />
      <div data-export-ignore="true" className="pointer-events-none absolute inset-0 flex items-start justify-end p-3 opacity-0 transition duration-200 group-hover/side-image:opacity-100">
        <div className="pointer-events-auto flex max-w-full flex-wrap gap-2 rounded-2xl border border-white/15 bg-black/50 p-2 shadow-xl shadow-black/25 backdrop-blur-2xl">
          <button type="button" onClick={() => openImagePanel(block, "edit")} className={actionButtonClass}>Edit</button>
          <button type="button" onClick={() => beginUploadSideImage(block.id)} className={actionButtonClass}>Upload</button>
          {previousSideImages[block.id] !== undefined ? <button type="button" onClick={() => undoSideImage(block.id)} className={actionButtonClass}>Undo</button> : null}
          <button type="button" onClick={() => downloadDataUrl(image.dataUrl, image.filename || `section-image-${block.id}.png`)} className={actionButtonClass}>Download</button>
          <button type="button" title="Delete image" aria-label="Delete image" onClick={() => deleteSideImage(block.id)} className={dangerButtonClass}>🗑</button>
        </div>
      </div>
      <button type="button" title="Drag to resize image" aria-label="Drag to resize image" onPointerDown={(event) => startSideImageResize(event, block.id)} data-export-ignore="true" className={`absolute ${image.placement === "right" ? "left-0" : "right-0"} top-0 h-full w-3 cursor-ew-resize bg-emerald-300/5 opacity-0 transition hover:bg-emerald-300/20 group-hover/side-image:opacity-100`} />
    </figure>
  );

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-black/45 p-8 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
      <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUploadSideImage} className="hidden" aria-label="Upload section image" />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Output</h2>
          {isStreamingVisible ? <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Streaming live...</span> : isLoading ? <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">Generating...</span> : isDownloading ? <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Preparing download...</span> : autoGenerateBlogImages ? <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Auto-generating blog images</span> : null}
        </div>
        {hasVisibleOutput ? (
          <div className="flex flex-wrap items-center gap-3">
            {isBookTitleGenerator ? <button type="button" onClick={() => void regenerateBookTitle("all")} disabled={regeneratingAllBookTitles || Boolean(regeneratingBlockId)} className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/12 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-55">{regeneratingAllBookTitles ? "Regenerating all..." : `Regenerate all — ${bookTitleSelection.credits} credit${bookTitleSelection.credits === 1 ? "" : "s"}`}</button> : null}
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">{copied ? "Copied!" : "Copy"}</button>
            <PremiumMenu<OutputPanelDownloadFormat>
              label="Download"
              disabled={isDownloading}
              options={[{ label: "HTML", value: "html" }, { label: "PDF", value: "pdf" }, { label: "DOCX", value: "docx" }, { label: "Text file", value: "txt" }]}
              onSelect={(format) => void handleDownload(format)}
            />
          </div>
        ) : null}
      </div>

      {downloadError ? <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{downloadError}</div> : null}
      {sectionActionMessage ? <div className="mb-5 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{sectionActionMessage}</div> : null}

      {hasOutput ? (
        <>
          <div ref={exportContentRef} className="creator-output-scroll max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-200">
            {visibleOutputBlocks.length ? visibleOutputBlocks.map((block) => {
              const sideImage = sideImages[block.id];
              const contentNode = <div className="min-w-0 flex-1 pr-8">{splitOutputIntoImageSegments(block.content).map((segment) => segment.type === "image" ? <InlineImageBlock key={segment.id} blockId={segment.id} markdown={segment.content} prompt={segment.prompt} toolSlug={toolSlug} inputs={inputs} autoGenerate={autoGenerateBlogImages} /> : <div key={segment.id}>{renderMarkdownWithDiagrams(segment.content, segment.id)}</div>)}</div>;
              const imageAndContent = sideImage ? (
                <div style={sideImageContainerStyle(sideImage.placement)} data-abc-image-placement={sideImage.placement}>
                  {sideImage.placement === "top" ? renderSideImage(block, sideImage) : null}
                  {sideImage.placement === "left" || sideImage.placement === "right" ? renderSideImage(block, sideImage) : null}
                  {contentNode}
                  {sideImage.placement === "bottom" ? renderSideImage(block, sideImage) : null}
                </div>
              ) : contentNode;
              return (
                <div key={block.id} className="group relative rounded-2xl border border-transparent p-1 transition hover:border-cyan-300/20 hover:bg-white/[0.015]">
                  <div data-export-ignore="true" className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                    <button type="button" aria-label="Edit this output section manually" title="Edit this output section manually — no credits" onClick={() => openManualEdit(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.07] px-3 text-xs font-semibold text-white">Edit</button>
                    {previousBlockOverrides[block.id] !== undefined ? <button type="button" onClick={() => undoManualEdit(block.id)} className="inline-flex h-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-3 text-xs font-semibold text-slate-200">Undo edit</button> : null}
                    {isBookTitleGenerator && isBookTitleOptionBlock(block.content)
                      ? <button type="button" aria-label="Regenerate this title for 1 credit" title="Regenerate this title — 1 credit" onClick={() => void regenerateBookTitle("single", block)} disabled={regeneratingBlockId === block.id || regeneratingAllBookTitles} className="inline-flex h-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-500/25 disabled:opacity-55">{regeneratingBlockId === block.id ? "Regenerating..." : "Regenerate title — 1 credit"}</button>
                      : <button type="button" aria-label="Regenerate this output section" title="Regenerate this output section" onClick={() => openRegeneratePanel(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-500/25">Regenerate</button>}
                    {canGenerateSectionImage ? <button type="button" aria-label="Add image beside this output section" title="Add image to this output section" onClick={() => openImagePanel(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-100 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500/25">Add image</button> : null}
                    <button type="button" aria-label="Delete this output section" title="Delete this output section" onClick={() => deleteOutputBlock(block.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-300/30 bg-red-500/15 text-sm text-red-100 shadow-lg shadow-red-950/20 transition hover:bg-red-500/25">🗑</button>
                  </div>
                  {activeEditBlockId === block.id ? (
                    <div data-export-ignore="true" className="mb-4 border-y border-white/10 bg-white/[0.025] px-1 py-5 pr-4 pt-12">
                      <div className="flex items-center justify-between gap-3"><label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Edit text manually</label><span className="text-xs text-slate-500">Free — no credits</span></div>
                      <textarea value={editDraft} onChange={(event) => setEditDraft(event.currentTarget.value)} className="mt-3 min-h-44 w-full resize-y rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-7 text-white" />
                      <div className="mt-3 flex gap-2"><button type="button" onClick={() => saveManualEdit(block)} className="rounded-full border border-purple-300/35 bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-100">Save edit</button><button type="button" onClick={() => { setActiveEditBlockId(null); setEditDraft(""); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">Cancel</button></div>
                    </div>
                  ) : null}
                  {activeRegenerateBlockId === block.id ? (
                    <div data-export-ignore="true" className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 pr-4 pt-12">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Regenerate this section</label>
                      <textarea value={regenerateInstruction} onChange={(event) => setRegenerateInstruction(event.currentTarget.value)} className="mt-3 h-28 w-full resize-none rounded-2xl border border-cyan-300/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setRegenerateInstruction("Make this section shorter and sharper while preserving the meaning and Markdown heading. For book prose, preserve canon and natural author voice.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Shorter</button>
                        <button type="button" onClick={() => setRegenerateInstruction("Make this section richer and more complete while preserving the meaning, canon, and Markdown heading.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Longer</button>
                        <button type="button" onClick={() => void regenerateOutputBlock(block)} disabled={regeneratingBlockId === block.id} className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{regeneratingBlockId === block.id ? "Regenerating..." : "Apply regenerate"}</button>
                        <button type="button" onClick={() => setActiveRegenerateBlockId(null)} disabled={regeneratingBlockId === block.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200">Cancel</button>
                      </div>
                    </div>
                  ) : null}
                  {activeImageBlockId === block.id ? (
                    <div data-export-ignore="true" className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 pr-4 pt-12">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Image for this section</label>
                      <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.currentTarget.value)} className="mt-3 h-28 w-full resize-none rounded-2xl border border-emerald-300/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <PremiumMenu<SideImageRatio> label="Ratio" valueLabel={imageRatio} options={ratioOptions} onSelect={setImageRatio} align="left" />
                        {isBookImageTool ? <PremiumMenu<SideImageModel> label="Model" valueLabel={imageModel} options={modelOptions} onSelect={setImageModel} align="left" /> : null}
                        {isBookImageTool ? <PremiumMenu<SideImageResolution> label="Resolution" valueLabel={imageResolution} options={resolutionOptions} onSelect={setImageResolution} align="left" /> : null}
                        <PremiumMenu<SideImagePlacement> label="Placement" valueLabel={imagePlacement === "top" ? "Image above text" : imagePlacement === "bottom" ? "Image below text" : imagePlacement === "left" ? "Image left" : "Image right"} options={[{ label: "Image above text", value: "top" }, { label: "Image below text", value: "bottom" }, { label: "Image left", value: "left" }, { label: "Image right", value: "right" }]} onSelect={setImagePlacement} align="left" />
                        <button type="button" onClick={() => void generateSideImage(block)} disabled={generatingImageBlockId === block.id} className="abc-premium-generate-button rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{generatingImageBlockId === block.id ? "Generating..." : sideImages[block.id] ? "Apply edit" : "Generate image"}</button>
                        <button type="button" onClick={() => setActiveImageBlockId(null)} disabled={generatingImageBlockId === block.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">Cancel</button>
                      </div>
                    </div>
                  ) : null}
                  {imageAndContent}
                </div>
              );
            }) : <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm text-red-100">All output sections were deleted. Run the tool again to regenerate the output.</div>}
            {isStreamingVisible ? <span className="mt-2 inline-block h-5 w-2 animate-pulse rounded-sm bg-purple-300 align-middle" /> : null}
          </div>
          {showNextActions ? <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div> : null}
        </>
      ) : isLoading ? <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" /><p>Generating...</p></div> : <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">Your generated result will appear here. Text tools can be copied or downloaded from this panel.</div>}
    </div>
  );
}
