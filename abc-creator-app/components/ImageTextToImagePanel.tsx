"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ImageComposerDropdown } from "./ImageComposerDropdown";

type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type UpscaleTarget = "2k" | "4k";
type QuickTool = "crop" | "outpaint" | "blur" | "restore" | "sticker" | "transparent";
type Option = { label: string; value: string; meta?: string };

type GeneratedImage = {
  index: number;
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  prompt?: string;
  parentIndex?: number;
  kind?: "generated" | "edited" | "upscaled";
};

type PendingEdit = { index: number; sourceIndex: number };

const MODEL_OPTIONS: Option[] = [
  { label: "M0", value: "M0", meta: "Private fast worker" },
  { label: "M1", value: "M1", meta: "Max detail" },
  { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid design" },
  { label: "M4", value: "M4", meta: "Prompt text" },
  { label: "M5", value: "M5", meta: "Best value" },
  { label: "M6", value: "M6", meta: "Fast cheap" },
];
const EDIT_MODEL_OPTIONS = MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");
const RESOLUTION_OPTIONS: Option[] = ["360p", "480p", "720p", "1080p"].map((item) => ({ label: item, value: item, meta: item === "1080p" ? "Highest" : item === "720p" ? "Sharp" : item === "480p" ? "Balanced" : "Low" }));
const ASPECT_OPTIONS: Option[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"].map((item) => ({ label: item, value: item, meta: item === "1:1" ? "Square" : item === "16:9" ? "Wide" : item === "9:16" ? "Story" : "Ratio" }));
const IMAGE_COUNT_OPTIONS: Option[] = ["1", "2", "3", "4"].map((count) => ({ label: count, value: count, meta: count === "4" ? "Max" : "Images" }));
const STYLE_OPTIONS: Option[] = ["Photorealistic", "Cinematic", "Anime", "Manga", "Cartoon", "Digital art", "Fantasy art", "Sci-fi", "Cyberpunk", "3D render", "Pixel art", "Vector art", "Logo design", "Product photo", "Portrait", "Oil painting", "Watercolor", "Sketch", "Comic book", "Children’s book", "Minimalist", "Poster art", "Vintage", "Horror", "Dark fantasy", "Steampunk", "Isometric 3D", "Claymation", "Sticker style", "Line art", "1980s"].map((style) => ({ label: style, value: style, meta: "Style" }));

const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M0: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};
const UPSCALE_CREDITS: Record<UpscaleTarget, number> = { "2k": 5, "4k": 9 };
const QUICK_TOOLS: Array<{ tool: QuickTool; label: string; hint: string }> = [
  { tool: "crop", label: "Crop", hint: "Reframe" },
  { tool: "outpaint", label: "Expand", hint: "Outpaint" },
  { tool: "blur", label: "Blur", hint: "Focus" },
  { tool: "restore", label: "Restore", hint: "Clean" },
  { tool: "sticker", label: "Sticker", hint: "Cutout" },
  { tool: "transparent", label: "Transparent", hint: "BG" },
];

function pngName(filename: string | undefined, fallback: string) {
  const base = (filename || fallback).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || fallback;
  return `${base}.png`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = pngName(filename, "abc-image");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dataUrlToBlob(dataUrl: string) {
  const parts = dataUrl.split(",");
  const meta = parts[0] || "data:image/png;base64";
  const base64 = parts[1] || "";
  const mime = /data:([^;]+)/.exec(meta)?.[1] || "image/png";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function friendlyImageUtilityError(value: string) {
  if (/no route for that uri/i.test(value)) return "This image utility has moved to the local pipeline. Redeploy latest main and try again.";
  return value;
}

function VerticalDivider() {
  return <span className="mx-1 hidden h-10 w-px shrink-0 bg-white/15 sm:block" />;
}

function PrimaryButton({ children, disabled, onClick, ariaLabel }: { children: ReactNode; disabled?: boolean; onClick: () => void; ariaLabel?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className="relative flex h-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-200/25 px-8 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundImage: "linear-gradient(120deg,#4f46e5,#7c3aed,#c026d3,#4f46e5)", backgroundSize: "240% 240%", animation: "abcImageGradientMove 5.5s ease infinite" }}>
      <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition hover:opacity-100" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function toolPrompt(tool: QuickTool, ratio: ImageAspectRatio) {
  if (tool === "crop") return `Crop and reframe this image to ${ratio}. Preserve the main subject and important objects. Make the composition balanced.`;
  if (tool === "outpaint") return "Expand this image naturally beyond the current edges while preserving the original subject, lighting, style, and perspective.";
  if (tool === "blur") return "Apply natural background blur while keeping the main subject sharp and unchanged.";
  if (tool === "restore") return "Restore this image. Clean noise, dust, blur, compression artifacts, scratches, and damage while preserving original identity and details.";
  if (tool === "sticker") return "Turn the selected subject into a premium sticker-style cutout with clean edges and a balanced outline.";
  return "Remove the background and isolate the subject with a real transparent PNG background.";
}

export function ImageTextToImagePanel() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [imageCount, setImageCount] = useState("1");
  const [style, setStyle] = useState("Photorealistic");
  const [seed, setSeed] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [quickTool, setQuickTool] = useState<QuickTool | null>(null);
  const [isEditorHovered, setIsEditorHovered] = useState(false);
  const [isComposerPinned, setIsComposerPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [revealReady, setRevealReady] = useState(true);
  const [upscalingKey, setUpscalingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedImage = images.find((image) => image.index === selectedIndex) || null;
  const selectedPendingEdit = pendingEdit && selectedIndex === pendingEdit.index ? pendingEdit : null;
  const selectedImageMeta = selectedImage?.kind === "edited" ? `Edited from image ${selectedImage.parentIndex}` : selectedImage?.kind === "upscaled" ? `Upscaled from image ${selectedImage.parentIndex}` : "";
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution] * Math.min(Math.max(Number(imageCount) || 1, 1), 4), [imageCount, model, resolution]);
  const canGenerate = prompt.trim().length >= 6 && !loading;
  const canEdit = Boolean(selectedImage) && editPrompt.trim().length >= 3 && !editing;
  const showComposer = Boolean(selectedImage && (isEditorHovered || isComposerPinned || editing || editPrompt.trim().length > 0));

  useEffect(() => {
    setIsEditorHovered(false);
    setIsComposerPinned(false);
    setQuickTool(null);
    if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
  }, [selectedIndex]);

  useEffect(() => () => { if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current); }, []);

  function revealFinalImage() { window.setTimeout(() => setRevealReady(true), 80); }
  function nextIndex() { return Math.max(0, ...images.map((image) => image.index), pendingEdit?.index || 0) + 1; }
  function closeComposer() { setIsComposerPinned(false); setIsEditorHovered(false); setQuickTool(null); if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current); }
  function openHoverEditor() { if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current); setIsEditorHovered(true); }
  function closeHoverEditor() {
    if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    hoverLeaveTimer.current = setTimeout(() => {
      if (!isComposerPinned && !editing && !editPrompt.trim()) setIsEditorHovered(false);
    }, 160);
  }

  function openQuickTool(tool: QuickTool) {
    setQuickTool(tool);
    setEditPrompt(toolPrompt(tool, aspectRatio));
    setIsEditorHovered(true);
    setIsComposerPinned(true);
  }

  async function generate() {
    if (!canGenerate) { setError("Write a prompt with at least 6 characters."); return; }
    setLoading(true); setRevealReady(false); setError(""); setNotice("");
    try {
      const response = await fetch("/api/image/text-to-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, negativePrompt, model, resolution, aspectRatio, imageCount: Number(imageCount), style, seed }) });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; images?: GeneratedImage[] } | null;
      if (!response.ok || !data?.ok || !data.images?.length) throw new Error(data?.details || data?.error || "Image generation failed.");
      const startIndex = nextIndex();
      const enriched = data.images.map((image, offset) => ({ ...image, index: startIndex + offset, filename: pngName(image.filename, `text-to-image-${startIndex + offset}`), prompt, kind: "generated" as const }));
      setImages((current) => [...current, ...enriched]);
      setSelectedIndex(enriched[0]?.index || null);
      setEditPrompt(""); closeComposer(); revealFinalImage();
      setNotice(`Generated ${enriched.length} image${enriched.length === 1 ? "" : "s"}. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setRevealReady(true); setError(err instanceof Error ? err.message : "Image generation failed."); }
    finally { setLoading(false); }
  }

  async function callTransparentBackground(image: GeneratedImage) {
    const form = new FormData();
    form.append("image", dataUrlToBlob(image.dataUrl), "source.png");
    const response = await fetch("/api/image/background-remover", { method: "POST", body: form });
    const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: { dataUrl: string; filename?: string; width?: number; height?: number } } | null;
    if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(friendlyImageUtilityError(data?.details || data?.error || "Background removal failed."));
    return { image: data.image, credits: data.creditsCharged };
  }

  async function callBackgroundBlur(image: GeneratedImage) {
    const response = await fetch("/api/image/background-blur", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl: image.dataUrl }) });
    const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: { dataUrl: string; filename?: string; width?: number; height?: number } } | null;
    if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(friendlyImageUtilityError(data?.details || data?.error || "Background blur failed."));
    return { image: data.image, credits: data.creditsCharged };
  }

  async function makeConsistentEdit() {
    if (!selectedImage || !canEdit) { setError("Select an image and describe what to change."); return; }
    const sourceIndex = selectedImage.index;
    const pendingIndex = nextIndex();
    const consistencyPrompt = [selectedImage.prompt ? `Original generation prompt: ${selectedImage.prompt}` : "", `Requested change: ${editPrompt.trim()}`].filter(Boolean).join("\n");
    setEditing(true); setRevealReady(false); setError(""); setNotice(""); setPendingEdit({ index: pendingIndex, sourceIndex }); setSelectedIndex(pendingIndex);
    try {
      let returned: { image: { dataUrl: string; filename?: string; width?: number; height?: number }; credits?: number | undefined };
      if (quickTool === "transparent") returned = await callTransparentBackground(selectedImage);
      else if (quickTool === "blur") returned = await callBackgroundBlur(selectedImage);
      else {
        const response = await fetch("/api/image/text-to-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: consistencyPrompt, editPrompt: editPrompt.trim(), negativePrompt, model: model === "M0" ? "M2" : model, resolution, aspectRatio, imageCount: 1, style, seed, operation: "edit", maintainConsistency: true, sourceImageDataUrl: selectedImage.dataUrl, referenceImageDataUrl: selectedImage.dataUrl, parentImageIndex: selectedImage.index, toolPreset: quickTool }) });
        const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; images?: GeneratedImage[] } | null;
        if (!response.ok || !data?.ok || !data.images?.length) throw new Error(data?.details || data?.error || "Image edit failed.");
        returned = { image: data.images[0], credits: data.creditsCharged };
      }
      const edited = { ...returned.image, index: pendingIndex, filename: pngName(returned.image.filename, `image-edit-${pendingIndex}`), prompt: consistencyPrompt, parentIndex: sourceIndex, kind: "edited" as const };
      setImages((current) => [...current, edited]);
      setPendingEdit(null); setSelectedIndex(edited.index); setEditPrompt(""); closeComposer(); revealFinalImage();
      setNotice(`Edited image ${sourceIndex}. Charged ${returned.credits ?? "the required"} credits.`);
    } catch (err) { setRevealReady(true); setPendingEdit(null); setSelectedIndex(sourceIndex); setError(err instanceof Error ? err.message : "Image edit failed. Try again in a few minutes."); }
    finally { setEditing(false); }
  }

  async function upscaleImage(image: GeneratedImage, target: UpscaleTarget) {
    const key = `${image.index}-${target}`; setUpscalingKey(key); setError(""); setNotice("");
    try {
      const response = await fetch("/api/image/upscale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl: image.dataUrl, target }) });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: { dataUrl: string; filename?: string; width?: number; height?: number } } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Upscale failed.");
      const upscaledImage: GeneratedImage = { index: nextIndex(), dataUrl: data.image.dataUrl, filename: pngName(data.image.filename, `upscaled-${target}-${image.index}`), width: data.image.width, height: data.image.height, prompt: image.prompt, parentIndex: image.index, kind: "upscaled" };
      setImages((current) => [...current, upscaledImage]); setSelectedIndex(upscaledImage.index); setRevealReady(false); revealFinalImage();
      setNotice(`Upscaled image ${image.index} to ${target.toUpperCase()} for ${data.creditsCharged ?? UPSCALE_CREDITS[target]} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Upscale failed."); }
    finally { setUpscalingKey(""); }
  }

  function upscaleButton(image: GeneratedImage, target: UpscaleTarget) {
    const active = upscalingKey === `${image.index}-${target}`;
    return <button type="button" onClick={() => upscaleImage(image, target)} disabled={Boolean(upscalingKey)} className="rounded-full px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.12] disabled:opacity-50">{active ? "..." : target.toUpperCase()}</button>;
  }

  function imageActions(image: GeneratedImage) {
    return <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => downloadDataUrl(image.dataUrl, image.filename || `image-${image.index}.png`)} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.11]">Download</button><div className="flex items-center rounded-full border border-white/15 bg-white/[0.035] p-1 backdrop-blur-xl">{upscaleButton(image, "2k")}<span className="h-6 w-px bg-white/10" />{upscaleButton(image, "4k")}</div></div>;
  }

  return (
    <div className="space-y-8">
      <style>{`@keyframes abcImageGradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
      <div className="mx-auto max-w-6xl overflow-visible rounded-[2rem] border border-white/55 bg-white/[0.035] shadow-2xl shadow-purple-950/20 backdrop-blur-2xl"><div className="px-6 pt-6 sm:px-8 sm:pt-8"><div className="mb-4 flex items-center justify-between gap-4"><p className="text-xs font-black uppercase tracking-[0.32em] text-purple-100/80">Text to image</p><span className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-black text-white backdrop-blur-xl">{creditEstimate} credits</span></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the exact image you want..." className="min-h-[210px] w-full resize-none bg-transparent text-lg font-semibold leading-8 text-white outline-none placeholder:text-slate-500 sm:min-h-[250px]" /></div><div className="mx-6 h-px bg-white/15 sm:mx-8" /><div className="grid gap-0 px-6 py-3 sm:px-8 md:grid-cols-[minmax(0,1fr)_220px]"><input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="Negative prompt optional" className="min-h-11 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" /><input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Seed optional" className="min-h-11 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500 md:border-l md:border-white/15 md:pl-5" /></div><div className="mx-6 h-px bg-white/15 sm:mx-8" /><div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-y-3"><ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} /><VerticalDivider /><ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} /><VerticalDivider /><ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} /><VerticalDivider /><ImageComposerDropdown label="Count" value={imageCount} options={IMAGE_COUNT_OPTIONS} onChange={setImageCount} /><VerticalDivider /><ImageComposerDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} /></div><PrimaryButton onClick={generate} disabled={!canGenerate} ariaLabel="Generate image">{loading ? "Generating" : "Generate"}</PrimaryButton></div></div>
      {error ? <div className="mx-auto max-w-6xl rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-6xl rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}
      {loading ? <div className="mx-auto grid max-w-6xl gap-5 pt-2 md:grid-cols-2">{Array.from({ length: Number(imageCount) || 1 }).map((_, index) => <div key={index} className="grid aspect-square place-items-center overflow-hidden rounded-[2rem] border border-white/25 bg-white/[0.035] shadow-2xl shadow-purple-950/20 backdrop-blur-xl"><div className="text-center"><div className="mx-auto h-14 w-14 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" /><p className="mt-4 text-sm font-black text-white">Generating image...</p></div></div>)}</div> : null}
      {selectedImage || selectedPendingEdit ? <div className="mx-auto grid max-w-6xl items-start gap-6 pt-2 lg:grid-cols-[minmax(0,1fr)_260px]"><div onMouseEnter={openHoverEditor} onMouseLeave={closeHoverEditor} className="group rounded-[2rem] border border-white/25 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl"><div className="relative overflow-hidden rounded-[1.45rem] bg-black/45">{selectedPendingEdit ? <div className="grid aspect-square place-items-center"><div className="text-center"><div className="mx-auto h-14 w-14 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" /><p className="mt-4 text-sm font-black text-white">Editing</p></div></div> : selectedImage ? <img src={selectedImage.dataUrl} alt={`Selected image ${selectedImage.index}`} className={`max-h-[720px] w-full object-contain transition-all duration-700 ease-out ${revealReady ? "scale-100 blur-0 opacity-100" : "scale-[1.02] blur-xl opacity-60"}`} /> : null}{selectedImage ? <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex translate-y-2 flex-wrap justify-center gap-2 rounded-2xl border border-white/15 bg-black/25 p-2 opacity-0 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">{QUICK_TOOLS.map((item) => <button key={item.tool} type="button" onClick={() => openQuickTool(item.tool)} className="pointer-events-auto rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-white transition hover:-translate-y-0.5 hover:bg-white/20"><span className="block text-xs font-black">{item.label}</span><span className="block text-[10px] font-semibold text-white/60">{item.hint}</span></button>)}</div> : null}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"><div><p className="text-sm font-black text-white">{selectedPendingEdit ? `Editing image ${selectedPendingEdit.sourceIndex}` : selectedImage ? `Selected image ${selectedImage.index}` : "Selected image"}</p>{selectedImageMeta ? <p className="text-xs font-semibold text-slate-400">{selectedImageMeta}</p> : null}</div>{selectedImage ? imageActions(selectedImage) : null}</div>{selectedImage ? <div onMouseEnter={openHoverEditor} onMouseLeave={closeHoverEditor} className={`overflow-hidden rounded-[1.6rem] border border-white/30 bg-white/[0.035] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showComposer ? "mt-4 max-h-[520px] translate-y-0 scale-100 opacity-100 blur-0 pointer-events-auto" : "mt-0 max-h-0 translate-y-4 scale-[0.985] opacity-0 blur-sm pointer-events-none"}`}><textarea value={editPrompt} onFocus={() => setIsComposerPinned(true)} onChange={(event) => { setEditPrompt(event.target.value); setIsComposerPinned(true); }} placeholder="What do you want to change?" className="min-h-[110px] w-full resize-none bg-transparent px-5 py-4 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-500" /><div className="mx-5 h-px bg-white/15" /><div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-y-3"><ImageComposerDropdown label="Model" value={model === "M0" ? "M2" : model} options={EDIT_MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} /><VerticalDivider /><ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} /><VerticalDivider /><ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} /><VerticalDivider /><ImageComposerDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} /></div><div className="flex gap-2"><button type="button" onClick={() => { setEditPrompt(""); closeComposer(); }} disabled={editing} className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/[0.1] disabled:opacity-50">Close</button><PrimaryButton onClick={makeConsistentEdit} disabled={!canEdit}>{editing ? "Editing" : "Edit"}</PrimaryButton></div></div></div> : null}</div><div className="space-y-3"><p className="px-1 text-xs font-black uppercase tracking-[0.24em] text-purple-200/80">Session images</p>{images.map((image) => <button key={image.index} type="button" onClick={() => setSelectedIndex(image.index)} className={`block w-full overflow-hidden rounded-2xl border p-1 text-left transition ${selectedIndex === image.index ? "border-white/70 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-purple-300/35 hover:bg-white/[0.06]"}`}><img src={image.dataUrl} alt={`Thumbnail ${image.index}`} className="aspect-square w-full rounded-xl object-cover" /><span className="mt-2 block px-1 pb-1 text-xs font-black text-white">{image.kind === "edited" ? `Edit ${image.index}` : image.kind === "upscaled" ? `${image.width && image.height ? `${image.width}×${image.height}` : "Upscaled"}` : `Image ${image.index}`}</span></button>)}{pendingEdit ? <button type="button" onClick={() => setSelectedIndex(pendingEdit.index)} className={`block w-full overflow-hidden rounded-2xl border p-1 text-left transition ${selectedIndex === pendingEdit.index ? "border-white/70 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"}`}><div className="grid aspect-square place-items-center rounded-xl border border-white/10 bg-white/[0.035]"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" /><p className="mt-3 text-xs font-black text-white">Editing</p></div></div><span className="mt-2 block px-1 pb-1 text-xs font-black text-white">Edit loading</span></button> : null}</div></div> : null}
    </div>
  );
}
