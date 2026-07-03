"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IMAGE_CREDITS_PER_IMAGE, IMAGE_EDIT_CREDITS } from "@/lib/tools/credit-costs";

type GeneratedImageResult = {
  index: number;
  dataUrl: string;
  mimeType: string;
  provider: string;
  model: string;
  filename: string;
};

type ImageResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  code?: string;
  requiredCredits?: number;
  currentCredits?: number;
  images?: GeneratedImageResult[];
};

type ImagePlacement = "left" | "right" | "center" | "top" | "bottom";

export type OutputSegment =
  | { type: "markdown"; content: string; id: string }
  | { type: "image"; content: string; id: string; prompt: string };

const AUTO_IMAGE_TOOLS = new Set([
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
]);

function creditLabel(credits: number) {
  return `${credits} credit${credits === 1 ? "" : "s"}`;
}

function isAutoImageTool(toolSlug: string) {
  return AUTO_IMAGE_TOOLS.has(toolSlug);
}

function normalizeLine(value: string) {
  return value.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function isImageBlockStart(line: string) {
  const normalized = normalizeLine(line);
  if (!normalized) return false;
  if (["optional image briefs", "image briefs", "optional images", "images"].includes(normalized)) return false;

  const hasImage = /\bimage\b/.test(normalized);
  const hasBriefOrPrompt = /\b(brief|prompt|hero|section|visual|placement)\b/.test(normalized);
  const hasNumberedImage = /^image\s*\d+\b/.test(normalized);
  const isHeading = /^#{1,4}\s+/.test(line.trim());
  return hasImage && (hasBriefOrPrompt || hasNumberedImage || isHeading);
}

function isMarkdownHeading(line: string) {
  return /^#{1,4}\s+/.test(line.trim());
}

function extractPrompt(block: string) {
  const promptLine = block
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[-*]?\s*(image\s*)?prompt\s*[:\-–]/i.test(line));

  if (promptLine) return promptLine.replace(/^[-*]?\s*(image\s*)?prompt\s*[:\-–]\s*/i, "").trim();
  return block.replace(/^#{1,4}\s+/gm, "").trim();
}

function imagePlacementOf(block: string): ImagePlacement {
  const lower = block.toLowerCase();
  const placementLine = block
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[-*]?\s*placement\s*[:\-–]/i.test(line));
  const placementText = (placementLine || lower).toLowerCase();

  if (/\b(top|above|before|image top|image above)\b/.test(placementText)) return "top";
  if (/\b(bottom|below|after|image bottom|image below)\b/.test(placementText)) return "bottom";
  if (/\b(left|left beside|beside left|image left)\b/.test(placementText)) return "left";
  if (/\b(right|right beside|beside right|image right)\b/.test(placementText)) return "right";
  return "center";
}

function imageBlockLayoutStyle(placement: ImagePlacement): CSSProperties {
  if (placement === "left") return { display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 20, width: "100%" };
  if (placement === "right") return { display: "flex", flexDirection: "row-reverse", alignItems: "flex-start", gap: 20, width: "100%" };
  return { display: "block", width: "100%" };
}

function imageFrameStyle(placement: ImagePlacement, widthPercent: number): CSSProperties {
  if (placement === "left" || placement === "right") {
    return { width: `${Math.min(widthPercent, 44)}%`, minWidth: 220, maxWidth: 420, flexShrink: 0 };
  }
  if (placement === "top") return { width: `${widthPercent}%`, margin: "0 auto 18px" };
  if (placement === "bottom") return { width: `${widthPercent}%`, margin: "18px auto 0" };
  return { width: `${widthPercent}%`, margin: "0 auto" };
}

export function splitOutputIntoImageSegments(output: string): OutputSegment[] {
  const lines = output.replace(/\r\n/g, "\n").split("\n");
  const segments: OutputSegment[] = [];
  let markdownLines: string[] = [];
  let imageLines: string[] | null = null;
  let segmentIndex = 0;

  const flushMarkdown = () => {
    const content = markdownLines.join("\n").trim();
    if (content) {
      segmentIndex += 1;
      segments.push({ type: "markdown", content, id: `markdown-${segmentIndex}` });
    }
    markdownLines = [];
  };

  const flushImage = () => {
    if (!imageLines) return;
    const content = imageLines.join("\n").trim();
    if (content) {
      segmentIndex += 1;
      if (segments[segments.length - 1]?.type === "image") {
        segments.push({ type: "markdown", content, id: `markdown-${segmentIndex}` });
      } else {
        segments.push({ type: "image", content, prompt: extractPrompt(content), id: `image-${segmentIndex}` });
      }
    }
    imageLines = null;
  };

  for (const line of lines) {
    if (isImageBlockStart(line)) {
      flushImage();
      flushMarkdown();
      imageLines = [line];
      continue;
    }

    if (imageLines) {
      if (isMarkdownHeading(line) && !isImageBlockStart(line)) {
        flushImage();
        markdownLines.push(line);
      } else {
        imageLines.push(line);
      }
      continue;
    }

    markdownLines.push(line);
  }

  flushImage();
  flushMarkdown();
  return segments.length ? segments : [{ type: "markdown", content: output, id: "markdown-1" }];
}

function cleanOption(value: string | undefined, fallback: string) {
  const text = (value || "").trim();
  return text || fallback;
}

function buildControlledImagePrompt(basePrompt: string, inputs: Record<string, string>) {
  const imageStyle = cleanOption(inputs.visual_style, "Auto (recommended)");
  const visualMode = cleanOption(inputs.visual_mode, "Auto-smart");
  const chartPreference = cleanOption(inputs.chart_preference, "Auto");
  const imageRatio = cleanOption(inputs.image_ratio, "16:9 landscape");
  const exportFrame = cleanOption(inputs.export_image_frame, "Boxed");
  const brandContext = cleanOption(inputs.brand_or_context, "not supplied");

  return `Image generation controls from the user's form:
- Image style: ${imageStyle}
- Visual mode: ${visualMode}
- Graphs / flowcharts preference: ${chartPreference}
- Image ratio: ${imageRatio}
- Export image frame preference: ${exportFrame}
- Brand / context: ${brandContext}

Smart visual-selection rules:
- Generate a relevant textless illustration for this exact article section.
- Do not create charts, dashboards, diagrams, flowcharts, UI labels, text, fake typography, or readable words inside the image.
- Never include watermarks, fake logos, protected brand marks, copyrighted characters, or public-figure likenesses.

Image brief to generate:
${basePrompt}`;
}

function uploadedFilename(file: File) {
  const fallbackExtension = file.type.split("/")[1] || "png";
  const rawName = file.name || `uploaded-blog-image.${fallbackExtension}`;
  return rawName.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || `uploaded-blog-image.${fallbackExtension}`;
}

interface InlineImageBlockProps {
  blockId: string;
  markdown: string;
  prompt: string;
  toolSlug?: string;
  inputs?: Record<string, string>;
  autoGenerate?: boolean;
}

export function InlineImageBlock({ blockId, markdown, prompt, toolSlug = "", inputs = {}, autoGenerate = false }: InlineImageBlockProps) {
  const [image, setImage] = useState<GeneratedImageResult | null>(null);
  const [previousImage, setPreviousImage] = useState<GeneratedImageResult | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [widthPercent, setWidthPercent] = useState(100);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasAutoGeneratedRef = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const aspectRatio = inputs.image_ratio || "16:9 landscape";
  const placement = useMemo(() => imagePlacementOf(markdown), [markdown]);
  const imagePrompt = useMemo(() => prompt.trim() || markdown.trim(), [prompt, markdown]);
  const controlledImagePrompt = useMemo(() => buildControlledImagePrompt(imagePrompt, inputs), [imagePrompt, inputs]);
  const exportFrame = (inputs.export_image_frame || "boxed").toLowerCase();
  const isBorderlessExport = exportFrame.includes("borderless");
  const shouldKeepPromptVisible = toolSlug === "pro-image-brief-for-blog";
  const shouldAutoGenerate = (autoGenerate || isAutoImageTool(toolSlug)) && isAutoImageTool(toolSlug);

  const callImageRoute = async (operation: "generate" | "edit") => {
    const editing = operation === "edit";
    if (!toolSlug) {
      setError("Image generation is not available for this output.");
      return;
    }
    if (editing && !editPrompt.trim()) {
      setError("Add an edit instruction before editing this image.");
      return;
    }

    if (editing) setIsEditing(true);
    else setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          toolSlug,
          inputs,
          sourceText: markdown,
          prompt: editing ? `${controlledImagePrompt}\n\nEdit instruction: ${editPrompt.trim()}` : controlledImagePrompt,
          aspectRatio,
          imageCount: 1,
          sourceImageDataUrl: image?.dataUrl || "",
          imageBlockId: blockId,
        }),
      });
      const data = (await response.json()) as ImageResponse;

      if (!response.ok || !data.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
          const requiredCredits = data.requiredCredits ?? (editing ? IMAGE_EDIT_CREDITS : IMAGE_CREDITS_PER_IMAGE);
          setError(`Not enough credits. This request needs ${requiredCredits} credits. You currently have ${data.currentCredits ?? 0} credits.`);
        } else {
          setError(`${data.error || "Image generation failed."}${data.details ? `\n${data.details}` : ""}`);
        }
        return;
      }

      const nextImage = data.images?.[0] || null;
      if (!nextImage) {
        setError("Image generation finished but no image was returned.");
        return;
      }
      if (editing && image) setPreviousImage(image);
      setImage(nextImage);
      setIsDeleted(false);
      if (editing) {
        setEditPrompt("");
        setIsEditModalOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (!shouldAutoGenerate || hasAutoGeneratedRef.current || image || isGenerating || isEditing || error || isDeleted) return;
    hasAutoGeneratedRef.current = true;
    const timeoutId = window.setTimeout(() => void callImageRoute("generate"), 0);
    return () => window.clearTimeout(timeoutId);
  }, [shouldAutoGenerate, image, isGenerating, isEditing, error, isDeleted]);

  const handleUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Please upload an image smaller than 20 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl.startsWith("data:image/")) {
        setError("Could not read the uploaded image file.");
        return;
      }
      if (image) setPreviousImage(image);
      setImage({
        index: Date.now(),
        dataUrl,
        mimeType: file.type || "image/png",
        provider: "user-upload",
        model: "manual-upload",
        filename: uploadedFilename(file),
      });
      setIsDeleted(false);
      setError("");
      setIsEditModalOpen(false);
    };
    reader.onerror = () => setError("Could not read the uploaded image file.");
    reader.readAsDataURL(file);
  };

  const undoEdit = () => {
    if (!previousImage) return;
    setImage(previousImage);
    setPreviousImage(null);
    setError("");
    setIsEditModalOpen(false);
  };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widthPercent;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) / 7;
      setWidthPercent(Math.min(100, Math.max(38, Math.round(startWidth + delta))));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (isDeleted) return null;

  if (image) {
    const hoverUndoLabel = image.provider === "user-upload" ? "Undo Upload" : "Undo";
    const showHorizontalResize = ["left", "right", "center", "top", "bottom"].includes(placement);

    return (
      <section className="my-6" data-abc-image-block={blockId} data-abc-image-placement={placement} style={imageBlockLayoutStyle(placement)}>
        {shouldKeepPromptVisible ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-black/35 p-5">
            <div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-strong:text-white prose-headings:text-white prose-code:text-emerald-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </div>
        ) : null}

        <div className="group relative" style={imageFrameStyle(placement, widthPercent)}>
          <figure className={isBorderlessExport ? "overflow-hidden rounded-2xl border border-transparent transition group-hover:border-emerald-400/20" : "overflow-hidden rounded-2xl border border-transparent bg-black/40 p-3 shadow-lg shadow-emerald-950/20 transition group-hover:border-emerald-400/20"}>
            <img src={image.dataUrl} alt={extractPrompt(markdown) || "Generated blog image"} className={isBorderlessExport ? "w-full rounded-2xl object-cover" : "w-full rounded-xl object-cover"} data-generated-blog-image="true" />
          </figure>

          <button type="button" title="Delete image" aria-label="Delete image" onClick={() => setIsDeleted(true)} data-export-ignore="true" className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full border border-red-300/30 bg-black/75 text-sm text-red-100 opacity-0 shadow-lg shadow-black/30 backdrop-blur-md transition hover:bg-red-500/25 group-hover:opacity-100">🗑</button>
          {showHorizontalResize ? <button type="button" title="Drag to resize image" aria-label="Drag to resize image" onPointerDown={startResize} data-export-ignore="true" className="absolute right-0 top-0 z-10 h-full w-4 cursor-ew-resize bg-emerald-300/5 opacity-0 transition hover:bg-emerald-300/20 group-hover:opacity-100" /> : null}

          <div data-export-ignore="true" className="pointer-events-none absolute inset-0 flex items-start justify-end p-4 opacity-0 transition duration-200 group-hover:opacity-100">
            <div className="pointer-events-auto mr-10 flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-black/75 p-2 backdrop-blur-md">
              <button type="button" onClick={() => { setError(""); setIsEditModalOpen(true); }} className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20">Edit Image</button>
              <button type="button" onClick={() => uploadInputRef.current?.click()} className="rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20">Upload Image</button>
              {previousImage ? <button type="button" onClick={undoEdit} className="rounded-full border border-purple-300/30 bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-400/20">{hoverUndoLabel}</button> : null}
              <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" aria-label="Upload replacement image" />
            </div>
          </div>
        </div>

        {error ? <div data-export-ignore="true" className="mt-3 whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

        {isEditModalOpen ? (
          <div data-export-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-emerald-400/20 bg-[#04110e] p-6 shadow-2xl shadow-black/40">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Edit generated image</h3>
                <p className="mt-1 text-sm text-gray-400">Describe what to change. Editing uses {creditLabel(IMAGE_EDIT_CREDITS)}.</p>
              </div>
              {error ? <div className="mb-4 whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
              <textarea value={editPrompt} onChange={(event) => setEditPrompt(event.currentTarget.value)} placeholder="Example: make it more cinematic, reduce text, make it darker, improve composition." className="h-32 w-full resize-none rounded-2xl border border-emerald-400/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => void callImageRoute("edit")} disabled={isEditing || !editPrompt.trim()} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60">{isEditing ? "Editing..." : `Apply Edit — ${creditLabel(IMAGE_EDIT_CREDITS)}`}</button>
                <button type="button" onClick={undoEdit} disabled={!previousImage || isEditing} className="rounded-full border border-purple-300/30 bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-50">Undo</button>
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditPrompt(""); setError(""); }} disabled={isEditing} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">Close</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="my-6 rounded-2xl border border-transparent bg-emerald-500/10 p-5 transition hover:border-emerald-400/20" data-abc-image-block={blockId} data-abc-image-placement={placement}>
      {shouldKeepPromptVisible ? (
        <div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-strong:text-white prose-headings:text-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      ) : null}
      <div data-export-ignore="true" className={shouldKeepPromptVisible ? "mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-black/35 p-4" : "flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-black/35 p-4"}>
        {error ? <div className="whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
        <button type="button" onClick={() => void callImageRoute("generate")} disabled={isGenerating || isEditing} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60">
          {isGenerating ? (shouldAutoGenerate ? "Auto-generating image..." : "Generating image...") : `Generate Image — ${creditLabel(IMAGE_CREDITS_PER_IMAGE)}`}
        </button>
      </div>
    </section>
  );
}
