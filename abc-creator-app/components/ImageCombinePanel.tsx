"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageToolDropdown } from "./ImageToolDropdown";

type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";

type CombineResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  creditsCharged?: number;
  image?: {
    dataUrl: string;
    filename?: string;
    width?: number;
    height?: number;
  };
};

type SelectedFile = {
  file: File;
  preview: string;
  id: string;
};

const MAX_IMAGES = 6;

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
const STYLE_OPTIONS = ["Photorealistic", "Cinematic", "Anime", "Manga", "Cartoon", "Digital art", "Fantasy art", "Sci-fi", "Cyberpunk", "3D render", "Pixel art", "Vector art", "Logo design", "Product photo", "Portrait", "Oil painting", "Watercolor", "Sketch", "Comic book", "Children’s book", "Minimalist", "Poster art", "Vintage", "Horror", "Dark fantasy", "Steampunk", "Isometric 3D", "Claymation", "Sticker style", "Line art", "1980s"].map((style) => ({ label: style, value: style, meta: "Style" }));

const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ImageCombinePanel() {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [style, setStyle] = useState("Photorealistic");
  const [output, setOutput] = useState<{ dataUrl: string; filename: string; width?: number; height?: number; creditsCharged?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canCombine = files.length >= 2 && files.length <= MAX_IMAGES && prompt.trim().length >= 6 && !loading;

  useEffect(() => {
    if (!loading) return;
    setProgress(1);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.max(1, Math.round((92 - current) / 12)), 92));
    }, 450);
    return () => window.clearInterval(timer);
  }, [loading]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError("");
    setNotice("");
    setOutput(null);

    const incoming = Array.from(fileList).slice(0, MAX_IMAGES - files.length);
    const valid: SelectedFile[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        setError("Only PNG, JPG, JPEG, or WEBP images are allowed.");
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        setError("Each image must be under 12 MB.");
        continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.size}-${crypto.randomUUID()}` });
    }

    setFiles((current) => [...current, ...valid].slice(0, MAX_IMAGES));
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setOutput(null);
  }

  async function combine() {
    if (!canCombine) {
      setError("Upload 2 to 6 images and write a prompt with at least 6 characters.");
      return;
    }

    setLoading(true);
    setProgress(1);
    setError("");
    setNotice("");

    try {
      const form = new FormData();
      files.forEach((item) => form.append("images", item.file, item.file.name));
      form.append("prompt", prompt.trim());
      form.append("model", model);
      form.append("resolution", resolution);
      form.append("aspectRatio", aspectRatio);
      form.append("style", style);
      form.append("imageCount", "1");

      const response = await fetch("/api/image/combine", { method: "POST", body: form });
      const data = await response.json().catch(() => null) as CombineResponse | null;

      if (!response.ok || !data?.ok || !data.image?.dataUrl) {
        throw new Error(data?.details || data?.error || "Image combine failed.");
      }

      setProgress(100);
      setOutput({ dataUrl: data.image.dataUrl, filename: data.image.filename || `combined-${model}-${resolution}.png`, width: data.image.width, height: data.image.height, creditsCharged: data.creditsCharged });
      setNotice(`Combined ${files.length} images into one image. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image combine failed.");
    } finally {
      setLoading(false);
      window.setTimeout(() => setProgress(0), 450);
    }
  }

  return (
    <div className="space-y-10">
      <div className="relative mx-auto max-w-6xl overflow-visible rounded-[2.2rem] border border-purple-300/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.25),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))] p-4 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-inner shadow-black/40 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-purple-200/80">Image combine</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Blend multiple images into one.</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400">Upload 2 to 6 images and describe how they should become one final image.</p>
            </div>
            <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100">{creditEstimate} credits</span>
          </div>

          <label className="group block cursor-pointer overflow-hidden rounded-[1.45rem] border border-dashed border-purple-300/25 bg-white/[0.035] p-5 text-center transition hover:border-purple-300/45 hover:bg-white/[0.055]">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
            <div className="grid min-h-[180px] place-items-center rounded-2xl border border-white/10 bg-black/30 p-8">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-purple-300/20 bg-purple-400/10 text-3xl text-purple-100 transition group-hover:scale-105">＋</div>
                <p className="mt-5 text-lg font-black text-white">Choose images to combine</p>
                <p className="mt-2 text-sm font-semibold text-slate-400">{files.length}/{MAX_IMAGES} selected · PNG, JPG, JPEG, or WEBP</p>
              </div>
            </div>
          </label>

          {files.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((item, index) => (
                <div key={item.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-2">
                  <img src={item.preview} alt={`Source image ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => removeFile(item.id)} className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-black text-white backdrop-blur-xl">Remove</button>
                  <p className="mt-2 truncate px-1 pb-1 text-xs font-black text-white">Source {index + 1}</p>
                </div>
              ))}
            </div>
          ) : null}

          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Prompt: combine these images into one coherent scene, keep the main subjects, match lighting, make it premium and realistic..." className="mt-5 min-h-[130px] w-full resize-none rounded-[1.45rem] border border-white/10 bg-white/[0.035] px-5 py-5 text-base font-semibold leading-7 text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-purple-300/40 focus:bg-white/[0.055]" />

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ImageToolDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} compact />
              <ImageToolDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} compact />
              <ImageToolDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} compact />
              <ImageToolDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} compact />
            </div>
            <button type="button" onClick={combine} disabled={!canCombine} className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-purple-200/25 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-7 text-lg font-black text-white shadow-2xl shadow-purple-950/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto" aria-label="Combine images"><span>{loading ? "Generating" : "Combine"}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-2xl transition group-hover:translate-x-1">→</span></button>
          </div>
        </div>
      </div>

      {error ? <div className="mx-auto max-w-6xl rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-6xl rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}

      {loading ? (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-purple-300/20 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
          <div className="relative grid min-h-[440px] place-items-center rounded-[1.45rem] border border-white/10 bg-black/50">
            <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-xl">{progress}%</span>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" />
              <p className="mt-5 text-lg font-black text-white">Generating combined image...</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">Streaming progress while the final image is being created.</p>
            </div>
          </div>
        </div>
      ) : null}

      {output ? (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-purple-300/20 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
          <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/50"><img src={output.dataUrl} alt="Combined image output" className="w-full object-contain" /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div><p className="text-sm font-black text-white">Combined output</p><p className="text-xs font-semibold text-slate-400">{output.width && output.height ? `${output.width}×${output.height} · ` : ""}{output.creditsCharged ?? creditEstimate} credits charged</p></div>
            <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename)} className="rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-400/20">Download image</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
