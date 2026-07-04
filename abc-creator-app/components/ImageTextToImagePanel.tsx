"use client";

import { useMemo, useState } from "react";
import { ImageToolDropdown } from "./ImageToolDropdown";

type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type UpscaleTarget = "2k" | "4k";

type GeneratedImage = { index: number; dataUrl: string; filename?: string; model?: string; modelLabel?: string; width?: number; height?: number };
type UpscaledImage = { target: UpscaleTarget; dataUrl: string; filename: string; creditsCharged?: number };

const MODEL_OPTIONS = [
  { label: "M1", value: "M1", meta: "Max detail" },
  { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid design" },
  { label: "M4", value: "M4", meta: "Prompt text" },
  { label: "M5", value: "M5", meta: "Best value" },
  { label: "M6", value: "M6", meta: "Fast cheap" },
];
const RESOLUTION_OPTIONS = [
  { label: "360p", value: "360p", meta: "Low" },
  { label: "480p", value: "480p", meta: "Balanced" },
  { label: "720p", value: "720p", meta: "Sharp" },
  { label: "1080p", value: "1080p", meta: "Highest" },
];
const ASPECT_OPTIONS = [
  { label: "1:1", value: "1:1", meta: "Square" },
  { label: "16:9", value: "16:9", meta: "Wide" },
  { label: "9:16", value: "9:16", meta: "Story" },
  { label: "4:5", value: "4:5", meta: "Post" },
  { label: "3:4", value: "3:4", meta: "Portrait" },
  { label: "4:3", value: "4:3", meta: "Classic" },
  { label: "3:2", value: "3:2", meta: "Photo" },
  { label: "2:3", value: "2:3", meta: "Vertical" },
];
const IMAGE_COUNT_OPTIONS = ["1", "2", "3", "4"].map((count) => ({ label: count, value: count, meta: count === "4" ? "Max" : "Images" }));
const STYLE_OPTIONS = ["Photorealistic", "Cinematic", "Anime", "Manga", "Cartoon", "Digital art", "Fantasy art", "Sci-fi", "Cyberpunk", "3D render", "Pixel art", "Vector art", "Logo design", "Product photo", "Portrait", "Oil painting", "Watercolor", "Sketch", "Comic book", "Children’s book", "Minimalist", "Poster art", "Vintage", "Horror", "Dark fantasy", "Steampunk", "Isometric 3D", "Claymation", "Sticker style", "Line art", "1980s"].map((style) => ({ label: style, value: style, meta: "Style" }));

const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 6, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 2, "720p": 3, "1080p": 4 },
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
  const [upscaled, setUpscaled] = useState<Record<string, UpscaledImage[]>>({});
  const [loading, setLoading] = useState(false);
  const [upscalingKey, setUpscalingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution] * Math.min(Math.max(Number(imageCount) || 1, 1), 4), [imageCount, model, resolution]);
  const canGenerate = prompt.trim().length >= 6 && !loading;

  async function generate() {
    if (!canGenerate) {
      setError("Write a prompt with at least 6 characters.");
      return;
    }
    setLoading(true);
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
      setImages(data.images);
      setUpscaled({});
      setNotice(`Generated ${data.images.length} image${data.images.length === 1 ? "" : "s"}. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function upscaleImage(image: GeneratedImage, target: UpscaleTarget) {
    const key = `${image.index}-${target}`;
    setUpscalingKey(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/image/upscale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl: image.dataUrl, target }) });
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

  return (
    <div className="space-y-10">
      <div className="relative mx-auto max-w-6xl overflow-visible rounded-[2.2rem] border border-purple-300/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.25),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))] p-4 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative min-h-[420px] rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-inner shadow-black/40 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.28em] text-purple-200/80">Text to image</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Describe it. Generate it.</h2></div>
            <div className="hidden rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 sm:block">{creditEstimate} credits</div>
          </div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the exact image you want..." className="min-h-[180px] w-full resize-none rounded-[1.45rem] border border-white/10 bg-white/[0.035] px-5 py-5 text-lg font-semibold leading-8 text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-purple-300/40 focus:bg-white/[0.055] sm:min-h-[220px]" />
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="Negative prompt optional" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-purple-300/35" /><input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Seed optional" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-purple-300/35" /></div>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><ImageToolDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} compact /><ImageToolDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} compact /><ImageToolDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} compact /><ImageToolDropdown label="Count" value={imageCount} options={IMAGE_COUNT_OPTIONS} onChange={setImageCount} compact /><ImageToolDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} compact /></div>
            <button type="button" onClick={generate} disabled={!canGenerate} className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-purple-200/25 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-7 text-lg font-black text-white shadow-2xl shadow-purple-950/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto" aria-label="Generate image"><span>{loading ? "Generating" : "Generate"}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-2xl transition group-hover:translate-x-1">→</span></button>
          </div>
        </div>
      </div>
      {error ? <div className="mx-auto max-w-6xl rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-6xl rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}
      {loading ? <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">{Array.from({ length: Number(imageCount) || 1 }).map((_, index) => <div key={index} className="aspect-square animate-pulse rounded-[2rem] border border-purple-300/15 bg-white/[0.045] shadow-2xl shadow-purple-950/20" />)}</div> : null}
      {images.length ? <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">{images.map((image) => <div key={image.index} className="overflow-hidden rounded-[2rem] border border-purple-300/20 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl"><div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/50"><img src={image.dataUrl} alt={`Generated image ${image.index}`} className="w-full object-contain" /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"><div><p className="text-sm font-black text-white">Image {image.index}</p><p className="text-xs font-semibold text-slate-400">{image.width && image.height ? `${image.width}×${image.height}` : `${model} · ${resolution}`}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadDataUrl(image.dataUrl, image.filename || `text-to-image-${image.index}.png`)} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.11]">Download</button><button type="button" onClick={() => upscaleImage(image, "2k")} disabled={Boolean(upscalingKey)} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50">{upscalingKey === `${image.index}-2k` ? "Upscaling..." : `2K · ${UPSCALE_CREDITS["2k"]} cr`}</button><button type="button" onClick={() => upscaleImage(image, "4k")} disabled={Boolean(upscalingKey)} className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:opacity-50">{upscalingKey === `${image.index}-4k` ? "Upscaling..." : `4K · ${UPSCALE_CREDITS["4k"]} cr`}</button></div></div>{(upscaled[String(image.index)] || []).length ? <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-3">{(upscaled[String(image.index)] || []).map((item) => <div key={item.target} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"><div><p className="text-sm font-black text-white">Upscaled {item.target.toUpperCase()}</p><p className="text-xs font-semibold text-slate-400">{item.creditsCharged ?? UPSCALE_CREDITS[item.target]} credits charged</p></div><button type="button" onClick={() => downloadDataUrl(item.dataUrl, item.filename)} className="rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-400/20">Download upscale</button></div>)}</div> : null}</div>)}</div> : !loading ? <div className="mx-auto max-w-6xl rounded-[2rem] border border-purple-300/15 bg-white/[0.025] p-10 text-center text-slate-400 backdrop-blur-xl">Generated images will appear below the prompt box with download and upscale actions.</div> : null}
    </div>
  );
}
