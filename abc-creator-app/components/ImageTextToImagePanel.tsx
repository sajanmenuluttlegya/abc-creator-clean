"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageComposerDropdown } from "./ImageComposerDropdown";

type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type UpscaleTarget = "2k" | "4k";
type Option = { label: string; value: string; meta?: string };

type GeneratedImage = {
  index: number;
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  prompt?: string;
  parentIndex?: number;
  kind?: "generated" | "edited";
};

type UpscaledImage = { target: UpscaleTarget; dataUrl: string; filename: string; creditsCharged?: number };

const MODEL_OPTIONS: Option[] = [
  { label: "M1", value: "M1", meta: "Max detail" },
  { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid design" },
  { label: "M4", value: "M4", meta: "Prompt text" },
  { label: "M5", value: "M5", meta: "Best value" },
  { label: "M6", value: "M6", meta: "Fast cheap" },
];
const RESOLUTION_OPTIONS: Option[] = [
  { label: "360p", value: "360p", meta: "Low" },
  { label: "480p", value: "480p", meta: "Balanced" },
  { label: "720p", value: "720p", meta: "Sharp" },
  { label: "1080p", value: "1080p", meta: "Highest" },
];
const ASPECT_OPTIONS: Option[] = [
  { label: "1:1", value: "1:1", meta: "Square" },
  { label: "16:9", value: "16:9", meta: "Wide" },
  { label: "9:16", value: "9:16", meta: "Story" },
  { label: "4:5", value: "4:5", meta: "Post" },
  { label: "3:4", value: "3:4", meta: "Portrait" },
  { label: "4:3", value: "4:3", meta: "Classic" },
  { label: "3:2", value: "3:2", meta: "Photo" },
  { label: "2:3", value: "2:3", meta: "Vertical" },
];
const IMAGE_COUNT_OPTIONS: Option[] = ["1", "2", "3", "4"].map((count) => ({ label: count, value: count, meta: count === "4" ? "Max" : "Images" }));
const STYLE_OPTIONS: Option[] = ["Photorealistic", "Cinematic", "Anime", "Manga", "Cartoon", "Digital art", "Fantasy art", "Sci-fi", "Cyberpunk", "3D render", "Pixel art", "Vector art", "Logo design", "Product photo", "Portrait", "Oil painting", "Watercolor", "Sketch", "Comic book", "Children’s book", "Minimalist", "Poster art", "Vintage", "Horror", "Dark fantasy", "Steampunk", "Isometric 3D", "Claymation", "Sticker style", "Line art", "1980s"].map((style) => ({ label: style, value: style, meta: "Style" }));

const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};
const UPSCALE_CREDITS: Record<UpscaleTarget, number> = { "2k": 6, "4k": 10 };

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function VerticalDivider() {
  return <span className="mx-1 hidden h-10 w-px shrink-0 bg-white/15 sm:block" />;
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [upscaled, setUpscaled] = useState<Record<string, UpscaledImage[]>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [upscalingKey, setUpscalingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedImage = images.find((image) => image.index === selectedIndex) || null;
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution] * Math.min(Math.max(Number(imageCount) || 1, 1), 4), [imageCount, model, resolution]);
  const editCreditEstimate = CREDIT_MAP[model][resolution];
  const canGenerate = prompt.trim().length >= 6 && !loading;
  const canEdit = Boolean(selectedImage) && editPrompt.trim().length >= 3 && !editing;

  useEffect(() => {
    if (!loading && !editing) return;
    setGenerationProgress(1);
    const timer = window.setInterval(() => {
      setGenerationProgress((current) => Math.min(current + Math.max(1, Math.round((93 - current) / 12)), 93));
    }, 450);
    return () => window.clearInterval(timer);
  }, [loading, editing]);

  async function generate() {
    if (!canGenerate) {
      setError("Write a prompt with at least 6 characters.");
      return;
    }
    setLoading(true);
    setGenerationProgress(1);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/image/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, negativePrompt, model, resolution, aspectRatio, imageCount: Number(imageCount), style, seed }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; images?: GeneratedImage[] } | null;
      if (!response.ok || !data?.ok || !data.images?.length) throw new Error(data?.details || data?.error || "Image generation failed.");
      setGenerationProgress(100);
      const enriched = data.images.map((image) => ({ ...image, prompt, kind: "generated" as const }));
      setImages(enriched);
      setSelectedIndex(enriched[0]?.index || null);
      setEditPrompt("");
      setUpscaled({});
      setNotice(`Generated ${enriched.length} image${enriched.length === 1 ? "" : "s"}. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed.");
    } finally {
      setLoading(false);
      window.setTimeout(() => setGenerationProgress(0), 450);
    }
  }

  async function makeConsistentEdit() {
    if (!selectedImage || !canEdit) {
      setError("Select an image and describe what to change.");
      return;
    }
    setEditing(true);
    setGenerationProgress(1);
    setError("");
    setNotice("");
    const consistencyPrompt = [
      "Use the attached/selected reference image as the identity source.",
      "Maintain character consistency: same main subject, body structure, face/helmet/design, color palette, clothing/armor, materials, proportions, and recognizable visual identity.",
      selectedImage.prompt ? `Original generation prompt: ${selectedImage.prompt}` : "",
      `Requested change: ${editPrompt.trim()}`,
    ].filter(Boolean).join("\n");
    try {
      const response = await fetch("/api/image/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: consistencyPrompt,
          editPrompt: editPrompt.trim(),
          negativePrompt,
          model,
          resolution,
          aspectRatio,
          imageCount: 1,
          style,
          seed,
          operation: "edit",
          maintainConsistency: true,
          sourceImageDataUrl: selectedImage.dataUrl,
          referenceImageDataUrl: selectedImage.dataUrl,
          parentImageIndex: selectedImage.index,
        }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; images?: GeneratedImage[] } | null;
      if (!response.ok || !data?.ok || !data.images?.length) throw new Error(data?.details || data?.error || "Image edit failed.");
      setGenerationProgress(100);
      const nextIndex = Math.max(0, ...images.map((image) => image.index)) + 1;
      const edited = { ...data.images[0], index: nextIndex, prompt: consistencyPrompt, parentIndex: selectedImage.index, kind: "edited" as const };
      setImages((current) => [...current, edited]);
      setSelectedIndex(edited.index);
      setEditPrompt("");
      setNotice(`Created a consistent edit from image ${selectedImage.index}. Charged ${data.creditsCharged ?? editCreditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image edit failed.");
    } finally {
      setEditing(false);
      window.setTimeout(() => setGenerationProgress(0), 450);
    }
  }

  async function upscaleImage(image: GeneratedImage, target: UpscaleTarget) {
    const key = `${image.index}-${target}`;
    setUpscalingKey(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/image/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: image.dataUrl, target }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: { dataUrl: string; filename?: string } } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Upscale failed.");
      const next = { target, dataUrl: data.image.dataUrl, filename: data.image.filename || `upscaled-${target}-${image.index}.png`, creditsCharged: data.creditsCharged };
      setUpscaled((current) => ({ ...current, [String(image.index)]: [...(current[String(image.index)] || []).filter((item) => item.target !== target), next] }));
      setNotice(`Upscaled image ${image.index} to ${target.toUpperCase()} for ${data.creditsCharged ?? UPSCALE_CREDITS[target]} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upscale failed.");
    } finally {
      setUpscalingKey("");
    }
  }

  function imageActions(image: GeneratedImage) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadDataUrl(image.dataUrl, image.filename || `text-to-image-${image.index}.png`)} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.11]">Download</button>
        <button type="button" onClick={() => upscaleImage(image, "2k")} disabled={Boolean(upscalingKey)} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50">{upscalingKey === `${image.index}-2k` ? "Upscaling..." : `2K · ${UPSCALE_CREDITS["2k"]} cr`}</button>
        <button type="button" onClick={() => upscaleImage(image, "4k")} disabled={Boolean(upscalingKey)} className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:opacity-50">{upscalingKey === `${image.index}-4k` ? "Upscaling..." : `4K · ${UPSCALE_CREDITS["4k"]} cr`}</button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-6xl overflow-visible rounded-[2rem] border border-white/55 bg-white/[0.035] shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-purple-100/80">Text to image</p>
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-black text-white backdrop-blur-xl">{creditEstimate} credits</span>
          </div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the exact image you want..." className="min-h-[210px] w-full resize-none bg-transparent text-lg font-semibold leading-8 text-white outline-none placeholder:text-slate-500 sm:min-h-[250px]" />
        </div>

        <div className="mx-6 h-px bg-white/15 sm:mx-8" />

        <div className="grid gap-0 px-6 py-3 sm:px-8 md:grid-cols-[minmax(0,1fr)_220px]">
          <input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="Negative prompt optional" className="min-h-11 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" />
          <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Seed optional" className="min-h-11 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500 md:border-l md:border-white/15 md:pl-5" />
        </div>

        <div className="mx-6 h-px bg-white/15 sm:mx-8" />

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-y-3">
            <ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} />
            <VerticalDivider />
            <ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} />
            <VerticalDivider />
            <ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} />
            <VerticalDivider />
            <ImageComposerDropdown label="Count" value={imageCount} options={IMAGE_COUNT_OPTIONS} onChange={setImageCount} />
            <VerticalDivider />
            <ImageComposerDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} />
          </div>
          <button type="button" onClick={generate} disabled={!canGenerate} className="group flex h-14 shrink-0 items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.09] px-6 text-base font-black text-white backdrop-blur-xl transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50" aria-label="Generate image"><span>{loading ? "Generating" : "Generate"}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl transition group-hover:translate-x-1">→</span></button>
        </div>
      </div>

      {error ? <div className="mx-auto max-w-6xl rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-6xl rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}

      {loading ? (
        <div className="mx-auto grid max-w-6xl gap-5 pt-6 md:grid-cols-2">
          {Array.from({ length: Number(imageCount) || 1 }).map((_, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/25 bg-white/[0.035] shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
              <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-xl">{generationProgress}%</span>
              <div className="grid h-full place-items-center text-center"><div><div className="mx-auto h-14 w-14 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" /><p className="mt-4 text-sm font-black text-white">Generating image...</p><p className="mt-1 text-xs font-semibold text-slate-400">Streaming progress</p></div></div>
            </div>
          ))}
        </div>
      ) : null}

      {selectedImage ? (
        <div className="mx-auto grid max-w-6xl gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[2rem] border border-white/25 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
            <div className="relative overflow-hidden rounded-[1.45rem] bg-black/45"><img src={selectedImage.dataUrl} alt={`Selected image ${selectedImage.index}`} className="max-h-[620px] w-full object-contain" />{editing ? <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-xl">{generationProgress}%</span> : null}</div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"><div><p className="text-sm font-black text-white">Selected image {selectedImage.index}</p><p className="text-xs font-semibold text-slate-400">{selectedImage.kind === "edited" ? `Consistent edit from image ${selectedImage.parentIndex}` : "Click any thumbnail to switch reference"}</p></div>{imageActions(selectedImage)}</div>
            <div className="mt-4 overflow-visible rounded-[1.6rem] border border-white/30 bg-white/[0.035] backdrop-blur-2xl">
              <textarea value={editPrompt} onChange={(event) => setEditPrompt(event.target.value)} placeholder="What do you want to change? Character consistency stays locked to the selected image." className="min-h-[110px] w-full resize-none bg-transparent px-5 py-4 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-500" />
              <div className="mx-5 h-px bg-white/15" />
              <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-y-3"><ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} /><VerticalDivider /><ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} /><VerticalDivider /><ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} /><VerticalDivider /><ImageComposerDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} /></div><button type="button" onClick={makeConsistentEdit} disabled={!canEdit} className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.09] px-5 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"><span>{editing ? "Editing" : `${editCreditEstimate} cr`}</span><span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-lg transition group-hover:translate-x-1">→</span></button></div>
            </div>
            {(upscaled[String(selectedImage.index)] || []).length ? <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-3">{(upscaled[String(selectedImage.index)] || []).map((item) => <div key={item.target} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"><div><p className="text-sm font-black text-white">Upscaled {item.target.toUpperCase()}</p><p className="text-xs font-semibold text-slate-400">{item.creditsCharged ?? UPSCALE_CREDITS[item.target]} credits charged</p></div><button type="button" onClick={() => downloadDataUrl(item.dataUrl, item.filename)} className="rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-400/20">Download upscale</button></div>)}</div> : null}
          </div>
          <div className="space-y-3"><p className="px-1 text-xs font-black uppercase tracking-[0.24em] text-purple-200/80">Session images</p>{images.map((image) => <button key={image.index} type="button" onClick={() => setSelectedIndex(image.index)} className={`block w-full overflow-hidden rounded-2xl border p-1 text-left transition ${selectedIndex === image.index ? "border-white/70 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-purple-300/35 hover:bg-white/[0.06]"}`}><img src={image.dataUrl} alt={`Thumbnail ${image.index}`} className="aspect-square w-full rounded-xl object-cover" /><span className="mt-2 block px-1 pb-1 text-xs font-black text-white">{image.kind === "edited" ? `Edit ${image.index}` : `Image ${image.index}`}</span></button>)}</div>
        </div>
      ) : null}
    </div>
  );
}
