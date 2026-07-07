"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IMAGE_CREDITS_PER_IMAGE, IMAGE_EDIT_CREDITS } from "@/lib/tools/credit-costs";

type GeneratedImageResult = { index: number; dataUrl: string; mimeType: string; provider: string; model: string; filename: string };
type ImageResponse = { ok?: boolean; error?: string; details?: string; code?: string; requiredCredits?: number; currentCredits?: number; images?: GeneratedImageResult[] };
type ImagePlacement = "left" | "right" | "center" | "top" | "bottom";
type OverlayBg = "none" | "soft" | "dark" | "light";
type OverlayFont = "rounded" | "storybook" | "clean" | "handwritten" | "bold";
type OverlayAlign = "left" | "center" | "right";

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
  "kids-book-generator",
]);

const translucentActionClass = "rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-xs font-semibold text-white/90 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-50";
const translucentIconClass = "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.055] text-sm text-white/90 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.11]";
const darkInputClass = "rounded-2xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-2 focus:ring-purple-500/30";

function creditLabel(credits: number) { return `${credits} credit${credits === 1 ? "" : "s"}`; }
function isAutoImageTool(toolSlug: string) { return AUTO_IMAGE_TOOLS.has(toolSlug); }
function normalizeLine(value: string) { return value.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase(); }

function isImageBlockStart(line: string) {
  const normalized = normalizeLine(line);
  if (!normalized) return false;
  if (["optional image briefs", "image briefs", "optional images", "images"].includes(normalized)) return false;
  const hasImage = /\bimage\b/.test(normalized);
  const hasBriefOrPrompt = /\b(brief|prompt|hero|section|visual|placement|page)\b/.test(normalized);
  const hasNumberedImage = /^image\s*\d+\b/.test(normalized);
  const isHeading = /^#{1,4}\s+/.test(line.trim());
  return hasImage && (hasBriefOrPrompt || hasNumberedImage || isHeading);
}

function isMarkdownHeading(line: string) { return /^#{1,4}\s+/.test(line.trim()); }

function extractPrompt(block: string) {
  const promptLine = block.split("\n").map((line) => line.trim()).find((line) => /^[-*]?\s*(image\s*)?prompt\s*[:\-–]/i.test(line));
  if (promptLine) return promptLine.replace(/^[-*]?\s*(image\s*)?prompt\s*[:\-–]\s*/i, "").trim();
  return block.replace(/^#{1,4}\s+/gm, "").trim();
}

function extractOverlayText(block: string) {
  const line = block.split("\n").map((item) => item.trim()).find((item) => /^[-*]?\s*overlay\s*text\s*[:\-–]/i.test(item));
  return line ? line.replace(/^[-*]?\s*overlay\s*text\s*[:\-–]\s*/i, "").replace(/\\n/g, "\n").trim() : "";
}

function imagePlacementOf(block: string): ImagePlacement {
  const lower = block.toLowerCase();
  const placementLine = block.split("\n").map((line) => line.trim()).find((line) => /^[-*]?\s*placement\s*[:\-–]/i.test(line));
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
  if (placement === "left" || placement === "right") return { width: `${Math.min(widthPercent, 44)}%`, minWidth: 220, maxWidth: 420, flexShrink: 0 };
  if (placement === "top") return { width: `${widthPercent}%`, margin: "0 auto 18px" };
  if (placement === "bottom") return { width: `${widthPercent}%`, margin: "18px auto 0" };
  return { width: `${widthPercent}%`, margin: "0 auto" };
}

function aspectRatioStyle(label: string): CSSProperties {
  const lower = label.toLowerCase();
  if (lower.includes("9:16")) return { aspectRatio: "9 / 16" };
  if (lower.includes("16:9")) return { aspectRatio: "16 / 9" };
  if (lower.includes("4:5")) return { aspectRatio: "4 / 5" };
  if (lower.includes("3:4")) return { aspectRatio: "3 / 4" };
  if (lower.includes("4:3")) return { aspectRatio: "4 / 3" };
  if (lower.includes("3:2")) return { aspectRatio: "3 / 2" };
  if (lower.includes("2:3")) return { aspectRatio: "2 / 3" };
  if (lower.includes("1:1")) return { aspectRatio: "1 / 1" };
  return { aspectRatio: "16 / 9" };
}

export function splitOutputIntoImageSegments(output: string): OutputSegment[] {
  const lines = output.replace(/\r\n/g, "\n").split("\n");
  const segments: OutputSegment[] = [];
  let markdownLines: string[] = [];
  let imageLines: string[] | null = null;
  let segmentIndex = 0;
  const flushMarkdown = () => { const content = markdownLines.join("\n").trim(); if (content) { segmentIndex += 1; segments.push({ type: "markdown", content, id: `markdown-${segmentIndex}` }); } markdownLines = []; };
  const flushImage = () => { if (!imageLines) return; const content = imageLines.join("\n").trim(); if (content) { segmentIndex += 1; if (segments[segments.length - 1]?.type === "image") segments.push({ type: "markdown", content, id: `markdown-${segmentIndex}` }); else segments.push({ type: "image", content, prompt: extractPrompt(content), id: `image-${segmentIndex}` }); } imageLines = null; };
  for (const line of lines) {
    if (isImageBlockStart(line)) { flushImage(); flushMarkdown(); imageLines = [line]; continue; }
    if (imageLines) { if (isMarkdownHeading(line) && !isImageBlockStart(line)) { flushImage(); markdownLines.push(line); } else imageLines.push(line); continue; }
    markdownLines.push(line);
  }
  flushImage();
  flushMarkdown();
  return segments.length ? segments : [{ type: "markdown", content: output, id: "markdown-1" }];
}

function cleanOption(value: string | undefined, fallback: string) { const text = (value || "").trim(); return text || fallback; }

function buildControlledImagePrompt(basePrompt: string, inputs: Record<string, string>) {
  const isKidsBook = Boolean(inputs.age_range || inputs.text_density || inputs.page_count);
  const imageStyle = cleanOption(inputs.visual_style, isKidsBook ? "Children’s book" : "Auto (recommended)");
  const imageRatio = cleanOption(inputs.image_ratio, "16:9 landscape");
  const brandContext = cleanOption(inputs.brand_or_context || inputs.book_title, "not supplied");
  if (isKidsBook) {
    return `Kids picture book image controls:\n- Art style: ${imageStyle}\n- KDP page trim / ratio: ${imageRatio}\n- Book/context: ${brandContext}\n- Keep the image textless; overlay text remains editable outside the image.\n- Preserve character consistency across all pages.\n- Leave safe negative space for the selected text placement.\n\nImage brief to generate:\n${basePrompt}`;
  }
  const visualMode = cleanOption(inputs.visual_mode, "Auto-smart");
  const chartPreference = cleanOption(inputs.chart_preference, "Auto");
  const exportFrame = cleanOption(inputs.export_image_frame, "Boxed");
  return `Image generation controls from the user's form:\n- Image style: ${imageStyle}\n- Visual mode: ${visualMode}\n- Graphs / flowcharts preference: ${chartPreference}\n- Image ratio: ${imageRatio}\n- Export image frame preference: ${exportFrame}\n- Brand / context: ${brandContext}\n\nSmart visual-selection rules:\n- Generate a relevant textless illustration for this exact article section.\n- Do not create charts, dashboards, diagrams, flowcharts, UI labels, text, fake typography, or readable words inside the image.\n- Graphs, flowcharts, diagrams, trees, lineage, maps, data visuals, and process visuals must be handled by coded abc-diagram blocks in the article, not by image generation.\n- Never include watermarks, fake logos, protected brand marks, copyrighted characters, or public-figure likenesses.\n\nImage brief to generate:\n${basePrompt}`;
}

function uploadedFilename(file: File) { const fallbackExtension = file.type.split("/")[1] || "png"; const rawName = file.name || `uploaded-blog-image.${fallbackExtension}`; return rawName.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || `uploaded-blog-image.${fallbackExtension}`; }

function fontFamily(font: OverlayFont) {
  if (font === "storybook") return "Georgia, 'Times New Roman', serif";
  if (font === "handwritten") return "'Comic Sans MS', 'Comic Neue', cursive";
  if (font === "bold") return "Arial Black, Arial, sans-serif";
  if (font === "clean") return "Inter, Arial, sans-serif";
  return "Nunito, Inter, Arial, sans-serif";
}

function overlayBackground(bg: OverlayBg) {
  if (bg === "dark") return "rgba(0,0,0,.52)";
  if (bg === "light") return "rgba(255,255,255,.72)";
  if (bg === "soft") return "rgba(0,0,0,.28)";
  return "transparent";
}

interface InlineImageBlockProps { blockId: string; markdown: string; prompt: string; toolSlug?: string; inputs?: Record<string, string>; autoGenerate?: boolean }

export function InlineImageBlock({ blockId, markdown, prompt, toolSlug = "", inputs = {}, autoGenerate = false }: InlineImageBlockProps) {
  const [image, setImage] = useState<GeneratedImageResult | null>(null);
  const [previousImage, setPreviousImage] = useState<GeneratedImageResult | null>(null);
  const [canUndoImageChange, setCanUndoImageChange] = useState(false);
  const [undoLabel, setUndoLabel] = useState("Undo");
  const [editPrompt, setEditPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [pageDeleted, setPageDeleted] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [widthPercent, setWidthPercent] = useState(100);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTextToolsOpen, setIsTextToolsOpen] = useState(false);
  const [overlayText, setOverlayText] = useState(() => extractOverlayText(markdown));
  const [overlayX, setOverlayX] = useState(50);
  const [overlayY, setOverlayY] = useState(() => (inputs.text_placement || "").toLowerCase().includes("top") ? 18 : (inputs.text_placement || "").toLowerCase().includes("center") ? 50 : 84);
  const [overlaySize, setOverlaySize] = useState(24);
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayBg, setOverlayBg] = useState<OverlayBg>("soft");
  const [overlayFont, setOverlayFont] = useState<OverlayFont>("rounded");
  const [overlayAlign, setOverlayAlign] = useState<OverlayAlign>("center");
  const [overlayShadow, setOverlayShadow] = useState(true);
  const hasAutoGeneratedRef = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const imageAreaRef = useRef<HTMLDivElement | null>(null);

  const aspectRatio = inputs.image_ratio || "16:9 landscape";
  const placement = useMemo(() => imagePlacementOf(markdown), [markdown]);
  const imagePrompt = useMemo(() => prompt.trim() || markdown.trim(), [prompt, markdown]);
  const controlledImagePrompt = useMemo(() => buildControlledImagePrompt(imagePrompt, inputs), [imagePrompt, inputs]);
  const exportFrame = (inputs.export_image_frame || "boxed").toLowerCase();
  const isBorderlessExport = exportFrame.includes("borderless");
  const shouldKeepPromptVisible = toolSlug === "pro-image-brief-for-blog";
  const shouldAutoGenerate = (autoGenerate || isAutoImageTool(toolSlug)) && isAutoImageTool(toolSlug);
  const isKidsBook = toolSlug === "kids-book-generator";

  useEffect(() => { setOverlayText(extractOverlayText(markdown)); }, [markdown]);

  const rememberUndo = (label: string) => { setPreviousImage(image); setCanUndoImageChange(true); setUndoLabel(label); };

  const callImageRoute = async (operation: "generate" | "edit") => {
    const editing = operation === "edit";
    if (!toolSlug) { setError("Image generation is not available for this output."); return; }
    if (editing && !editPrompt.trim()) { setError("Add an edit instruction before editing this image."); return; }
    if (editing) setIsEditing(true); else setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, toolSlug, inputs, sourceText: markdown, prompt: editing ? `${controlledImagePrompt}\n\nEdit instruction: ${editPrompt.trim()}` : controlledImagePrompt, aspectRatio, imageCount: 1, imageModel: inputs.output_image_model, resolution: inputs.output_image_resolution, style: inputs.visual_style, sourceImageDataUrl: image?.dataUrl || "", imageBlockId: blockId }) });
      const data = (await response.json()) as ImageResponse;
      if (!response.ok || !data.ok) { if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") { const requiredCredits = data.requiredCredits ?? (editing ? IMAGE_EDIT_CREDITS : IMAGE_CREDITS_PER_IMAGE); setError(`Not enough credits. This request needs ${requiredCredits} credits. You currently have ${data.currentCredits ?? 0} credits.`); } else setError(`${data.error || "Image generation failed."}${data.details ? `\n${data.details}` : ""}`); return; }
      const nextImage = data.images?.[0] || null;
      if (!nextImage) { setError("Image generation finished but no image was returned."); return; }
      rememberUndo(editing ? "Undo Edit" : image ? "Undo Image Change" : "Undo Image");
      setImage(nextImage); setIsDeleted(false); setPageDeleted(false);
      if (editing) { setEditPrompt(""); setIsEditModalOpen(false); }
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); } finally { setIsGenerating(false); setIsEditing(false); }
  };

  useEffect(() => { if (!shouldAutoGenerate || hasAutoGeneratedRef.current || image || isGenerating || isEditing || error || isDeleted || pageDeleted) return; hasAutoGeneratedRef.current = true; const timeoutId = window.setTimeout(() => void callImageRoute("generate"), 0); return () => window.clearTimeout(timeoutId); }, [shouldAutoGenerate, image, isGenerating, isEditing, error, isDeleted, pageDeleted]);

  const handleUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload a valid image file."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Please upload an image smaller than 20 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { const dataUrl = typeof reader.result === "string" ? reader.result : ""; if (!dataUrl.startsWith("data:image/")) { setError("Could not read the uploaded image file."); return; } rememberUndo("Undo Upload"); setImage({ index: Date.now(), dataUrl, mimeType: file.type || "image/png", provider: "user-upload", model: "manual-upload", filename: uploadedFilename(file) }); setIsDeleted(false); setPageDeleted(false); setError(""); setIsEditModalOpen(false); };
    reader.onerror = () => setError("Could not read the uploaded image file."); reader.readAsDataURL(file);
  };

  const undoImageChange = () => { if (!canUndoImageChange) return; setImage(previousImage); setPreviousImage(null); setCanUndoImageChange(false); setUndoLabel("Undo"); setError(""); setIsDeleted(false); setIsEditModalOpen(false); };
  const deleteImage = () => { if (!image) return; rememberUndo("Undo Delete"); setImage(null); setIsDeleted(true); setError(""); setIsEditModalOpen(false); };
  const downloadCurrentImage = () => { if (!image?.dataUrl) return; const link = document.createElement("a"); link.href = image.dataUrl; link.download = image.filename || `abc-book-page-${blockId}.png`; document.body.appendChild(link); link.click(); link.remove(); };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => { event.preventDefault(); const startX = event.clientX; const startWidth = widthPercent; const onMove = (moveEvent: PointerEvent) => { const delta = (moveEvent.clientX - startX) / 7; setWidthPercent(Math.min(100, Math.max(38, Math.round(startWidth + delta)))); }; const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); }; window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); };

  const startOverlayDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isKidsBook || !imageAreaRef.current) return;
    event.preventDefault();
    const rect = imageAreaRef.current.getBoundingClientRect();
    const update = (clientX: number, clientY: number) => {
      setOverlayX(Math.min(94, Math.max(6, Math.round(((clientX - rect.left) / rect.width) * 100))));
      setOverlayY(Math.min(94, Math.max(6, Math.round(((clientY - rect.top) / rect.height) * 100))));
    };
    update(event.clientX, event.clientY);
    const onMove = (moveEvent: PointerEvent) => update(moveEvent.clientX, moveEvent.clientY);
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const overlayStyle: CSSProperties = {
    left: `${overlayX}%`,
    top: `${overlayY}%`,
    transform: "translate(-50%, -50%)",
    color: overlayColor,
    background: overlayBackground(overlayBg),
    fontFamily: fontFamily(overlayFont),
    fontSize: `${overlaySize}px`,
    textAlign: overlayAlign,
    textShadow: overlayShadow ? "0 2px 10px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.95)" : "none",
  };

  const renderKidsOverlay = () => isKidsBook && overlayText.trim() ? <div onPointerDown={startOverlayDrag} className="absolute z-10 max-w-[82%] cursor-move whitespace-pre-line rounded-2xl px-5 py-3 font-bold leading-snug shadow-2xl shadow-black/40 ring-1 ring-white/10" style={overlayStyle}>{overlayText}</div> : null;

  const renderKidsTextTools = () => isKidsBook ? <div data-export-ignore="true" className="mt-4 rounded-3xl border border-purple-300/20 bg-[#080611]/95 p-4 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><div className="text-sm font-bold text-white">Kids page text editor</div><div className="text-xs text-purple-100/70">Dark Canva-like controls. Drag the text directly on the image.</div></div><button type="button" onClick={() => setIsTextToolsOpen((value) => !value)} className={translucentActionClass}>{isTextToolsOpen ? "Hide tools" : "Show tools"}</button></div>
    {isTextToolsOpen ? <div className="grid gap-3 md:grid-cols-2">
      <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-purple-200">Editable overlay text</span><textarea value={overlayText} onChange={(event) => setOverlayText(event.currentTarget.value)} className={`${darkInputClass} h-24 w-full resize-none`} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Font</span><select value={overlayFont} onChange={(event) => setOverlayFont(event.currentTarget.value as OverlayFont)} className={`${darkInputClass} w-full`}><option value="rounded">Rounded kids</option><option value="storybook">Storybook serif</option><option value="clean">Clean sans</option><option value="handwritten">Handwritten playful</option><option value="bold">Bold classroom</option></select></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Alignment</span><select value={overlayAlign} onChange={(event) => setOverlayAlign(event.currentTarget.value as OverlayAlign)} className={`${darkInputClass} w-full`}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Text size: {overlaySize}px</span><input type="range" min="16" max="54" value={overlaySize} onChange={(event) => setOverlaySize(Number(event.currentTarget.value))} className="w-full accent-purple-400" /></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Text color</span><input type="color" value={overlayColor} onChange={(event) => setOverlayColor(event.currentTarget.value)} className="h-10 w-full rounded-2xl border border-white/15 bg-black/45 p-1" /></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Overlay background</span><select value={overlayBg} onChange={(event) => setOverlayBg(event.currentTarget.value as OverlayBg)} className={`${darkInputClass} w-full`}><option value="soft">Soft dark glass</option><option value="dark">Dark box</option><option value="light">Light box</option><option value="none">No box</option></select></label>
      <label><span className="mb-1 block text-xs font-semibold text-gray-300">Text shadow</span><select value={overlayShadow ? "yes" : "no"} onChange={(event) => setOverlayShadow(event.currentTarget.value === "yes")} className={`${darkInputClass} w-full`}><option value="yes">On</option><option value="no">Off</option></select></label>
      <div className="md:col-span-2 flex flex-wrap gap-2"><button type="button" onClick={() => { setOverlayX(50); setOverlayY(16); }} className={translucentActionClass}>Top</button><button type="button" onClick={() => { setOverlayX(50); setOverlayY(50); }} className={translucentActionClass}>Center</button><button type="button" onClick={() => { setOverlayX(50); setOverlayY(84); }} className={translucentActionClass}>Bottom</button><button type="button" onClick={() => setDuplicateCount((count) => Math.min(3, count + 1))} className={translucentActionClass}>Duplicate page</button><button type="button" onClick={() => setPageDeleted(true)} className={translucentActionClass}>Delete page</button></div>
    </div> : null}
  </div> : null;

  if (pageDeleted) return <section className="my-6 rounded-3xl border border-red-300/20 bg-[#09050a] p-5 text-red-100 shadow-2xl shadow-black/30"><div className="font-semibold">Kids book page hidden.</div><button type="button" onClick={() => setPageDeleted(false)} className={`${translucentActionClass} mt-3`}>Undo page delete</button></section>;

  const renderImageCard = (duplicateIndex = 0) => image ? <div className="group relative" style={imageFrameStyle(placement, widthPercent)}>
    <figure className={isBorderlessExport ? "overflow-hidden rounded-2xl border border-transparent transition group-hover:border-white/15" : "overflow-hidden rounded-2xl border border-transparent bg-white/[0.035] p-3 shadow-lg shadow-black/20 backdrop-blur-xl transition group-hover:border-white/15"}>
      <div ref={duplicateIndex === 0 ? imageAreaRef : undefined} className="relative overflow-hidden rounded-xl bg-black/40">
        <img src={image.dataUrl} alt={extractPrompt(markdown) || (isKidsBook ? "Generated kids book page" : "Generated image")} className={isBorderlessExport ? "w-full rounded-2xl object-cover" : "w-full rounded-xl object-cover"} style={aspectRatioStyle(aspectRatio)} data-generated-blog-image="true" />
        {duplicateIndex === 0 ? renderKidsOverlay() : isKidsBook && overlayText.trim() ? <div className="absolute z-10 max-w-[82%] whitespace-pre-line rounded-2xl px-5 py-3 font-bold leading-snug shadow-2xl shadow-black/40 ring-1 ring-white/10" style={overlayStyle}>{overlayText}</div> : null}
      </div>
    </figure>
    <button type="button" title="Drag to resize image" aria-label="Drag to resize image" onPointerDown={startResize} data-export-ignore="true" className="absolute right-0 top-0 z-10 h-full w-4 cursor-ew-resize bg-white/[0.035] opacity-0 transition hover:bg-white/[0.09] group-hover:opacity-100" />
    <div data-export-ignore="true" className="pointer-events-none absolute inset-0 flex items-start justify-end p-4 opacity-0 transition duration-200 group-hover:opacity-100"><div className="pointer-events-auto flex max-w-full flex-wrap gap-2 rounded-2xl border border-white/15 bg-black/55 p-2 shadow-xl shadow-black/25 backdrop-blur-2xl"><button type="button" onClick={() => { setError(""); setIsEditModalOpen(true); }} className={translucentActionClass}>Edit image</button><button type="button" onClick={() => setIsTextToolsOpen(true)} className={translucentActionClass}>Text tools</button><button type="button" onClick={() => uploadInputRef.current?.click()} className={translucentActionClass}>Upload</button>{canUndoImageChange ? <button type="button" onClick={undoImageChange} className={translucentActionClass}>{undoLabel}</button> : null}<button type="button" onClick={downloadCurrentImage} className={translucentActionClass}>Download</button><button type="button" title="Delete image" aria-label="Delete image" onClick={deleteImage} className={translucentIconClass}>🗑</button><input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" aria-label="Upload replacement image" /></div></div>
  </div> : null;

  if (image) {
    return <section className="my-6" data-abc-image-block={blockId} data-abc-image-placement={placement} style={imageBlockLayoutStyle(placement)}>
      {shouldKeepPromptVisible ? <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"><div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-strong:text-white prose-headings:text-white prose-code:text-emerald-100"><ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown></div></div> : null}
      {renderImageCard(0)}
      {Array.from({ length: duplicateCount }, (_, index) => <div key={`duplicate-${index}`} className="mt-5 opacity-95">{renderImageCard(index + 1)}</div>)}
      {renderKidsTextTools()}
      {error ? <div data-export-ignore="true" className="mt-3 whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
      {isEditModalOpen ? <div data-export-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#07050d] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"><div className="mb-4"><h3 className="text-lg font-semibold text-white">Edit image</h3><p className="mt-1 text-sm text-gray-400">Describe what to change. Editing uses {creditLabel(IMAGE_EDIT_CREDITS)}.</p></div>{error ? <div className="mb-4 whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}<textarea value={editPrompt} onChange={(event) => setEditPrompt(event.currentTarget.value)} placeholder="Example: make it more storybook, keep same character, add more sky space for text." className="h-32 w-full resize-none rounded-2xl border border-white/15 bg-white/[0.055] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white/25" /><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => void callImageRoute("edit")} disabled={isEditing || !editPrompt.trim()} className={translucentActionClass}>{isEditing ? "Editing..." : `Apply Edit — ${creditLabel(IMAGE_EDIT_CREDITS)}`}</button><button type="button" onClick={undoImageChange} disabled={!canUndoImageChange || isEditing} className={translucentActionClass}>Undo</button><button type="button" onClick={() => { setIsEditModalOpen(false); setEditPrompt(""); setError(""); }} disabled={isEditing} className={translucentActionClass}>Close</button></div></div></div> : null}
    </section>;
  }

  return <section className="group relative my-6 rounded-2xl border border-transparent bg-white/[0.03] p-5 transition hover:border-white/15" data-abc-image-block={blockId} data-abc-image-placement={placement}>
    {shouldKeepPromptVisible ? <div className="prose prose-invert max-w-none prose-p:text-gray-200 prose-strong:text-white prose-headings:text-white"><ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown></div> : null}
    <div data-export-ignore="true" className={shouldKeepPromptVisible ? "mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300" : "rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300"}>{error ? <div className="mb-3 whitespace-pre-wrap rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}<span>{isDeleted ? "Image deleted. Hover for undo, upload, or regenerate." : isGenerating ? "Generating image..." : isKidsBook ? "Kids book page image will appear here. Hover to generate, upload, or edit." : "Hover to add or upload an image for this section."}</span></div>
    <div data-export-ignore="true" className="pointer-events-none absolute inset-0 flex items-start justify-end p-4 opacity-0 transition duration-200 group-hover:opacity-100"><div className="pointer-events-auto flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-black/45 p-2 shadow-xl shadow-black/25 backdrop-blur-2xl"><button type="button" onClick={() => void callImageRoute("generate")} disabled={isGenerating || isEditing} className={translucentActionClass}>{isGenerating ? (shouldAutoGenerate ? "Auto-generating..." : "Generating...") : `Generate — ${creditLabel(IMAGE_CREDITS_PER_IMAGE)}`}</button><button type="button" onClick={() => uploadInputRef.current?.click()} className={translucentActionClass}>Upload</button>{canUndoImageChange ? <button type="button" onClick={undoImageChange} className={translucentActionClass}>{undoLabel}</button> : null}<input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" aria-label="Upload image" /></div></div>
  </section>;
}
