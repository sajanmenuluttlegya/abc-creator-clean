"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageToolDropdown } from "./ImageToolDropdown";

type ImageModelKey = "M1";
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
const MODEL: ImageModelKey = "M1";

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
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [style, setStyle] = useState("Photorealistic");
  const [output, setOutput] = useState<{ dataUrl: string; filename: string; width?: number; height?: number; creditsCharged?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP.M1[resolution], [resolution]);
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
      form.append("model", MODEL);
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
      setOutput({ dataUrl: data.image.dataUrl, filename: data.image.filename || `combined-M1-${resolution}.png`, width: data.image.width, height: data.image.height, creditsCharged: data.creditsCharged });
      setNotice(`Combined ${files.length} images into one M1 output. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image combine failed.");
    } finally {
      setLoading(false);
      window.setTimeout(() => setProgress(0), 450);
    }
  }

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2.4rem] p-[1.5px] shadow-2xl shadow-violet-950/35" style={{ backgroundImage: "linear-gradient(120deg,rgba(99,102,241,.7),rgba(168,85,247,.9),rgba(236,72,153,.75),rgba(34,211,238,.6),rgba(99,102,241,.7))", backgroundSize: "260% 260%", animation: "abcImageGradientMove 6s ease infinite" }}>
          <div className="absolute inset-[1px] rounded-[2.3rem] bg-black/70" />
          <div className="relative overflow-hidden rounded-[2.3rem] bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,.22),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(34,211,238,.13),transparent_30%),linear-gradient(135deg,rgba(12,10,24,.96),rgba(5,4,11,.98)_62%,rgba(18,10,30,.95))] p-5 backdrop-blur-2xl sm:p-7">
            <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
              <div>
                <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/80">Image combine · M1 only</p>
                    <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">Merge multiple references into one premium composition.</h2>
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-400">Upload 2 to 6 images, describe the final scene, and keep the combine tool locked to M1 for the highest-quality combine path.</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 rounded-3xl bg-violet-500/10 px-4 py-3 shadow-lg shadow-black/20 ring-1 ring-violet-300/20">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-100/70">Locked model</span>
                    <span className="text-lg font-black text-white">M1 · Flux 2 Dev</span>
                    <span className="text-xs font-bold text-cyan-100/80">{creditEstimate} credits</span>
                  </div>
                </div>

                <label className="group block cursor-pointer overflow-hidden rounded-[2rem] bg-black/35 p-[1px] shadow-xl shadow-black/25 ring-1 ring-violet-300/20 transition hover:ring-cyan-300/30">
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
                  <div className="grid min-h-[230px] place-items-center rounded-[1.95rem] bg-[radial-gradient(circle_at_center,rgba(124,58,237,.16),transparent_48%),linear-gradient(135deg,rgba(16,12,30,.78),rgba(3,3,8,.82))] p-8 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.25rem] bg-cyan-400/10 text-3xl text-cyan-100 shadow-lg shadow-cyan-950/25 ring-1 ring-cyan-300/25 transition group-hover:scale-105 group-hover:bg-cyan-400/15">＋</div>
                    <p className="mt-5 text-lg font-black text-white">Drop or choose source images</p>
                    <p className="mt-2 text-sm font-semibold text-slate-400">{files.length}/{MAX_IMAGES} selected · PNG, JPG, JPEG, WEBP · 12 MB each</p>
                  </div>
                </label>

                {files.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {files.map((item, index) => (
                      <div key={item.id} className="group relative overflow-hidden rounded-[1.35rem] bg-black/45 p-[1px] shadow-lg shadow-black/20 ring-1 ring-violet-300/16 transition hover:ring-cyan-300/28">
                        <div className="overflow-hidden rounded-[1.3rem] bg-black/60">
                          <img src={item.preview} alt={`Source image ${index + 1}`} className="aspect-square w-full object-cover opacity-95 transition group-hover:scale-[1.02] group-hover:opacity-100" />
                        </div>
                        <button type="button" onClick={() => removeFile(item.id)} className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-black text-cyan-50 shadow-lg shadow-black/30 ring-1 ring-cyan-300/20 backdrop-blur-xl transition hover:bg-violet-950/80">Remove</button>
                        <p className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white ring-1 ring-violet-300/18 backdrop-blur-xl">Source {index + 1}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative rounded-[2rem] bg-black/34 p-[1px] ring-1 ring-fuchsia-300/16">
                <div className="rounded-[1.95rem] bg-[linear-gradient(145deg,rgba(14,10,28,.82),rgba(6,5,12,.92))] p-5 shadow-inner shadow-black/40">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-fuchsia-200/75">Composition prompt</p>
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: combine these references into one coherent cinematic scene, preserve the main subjects, unify lighting, match perspective, and make it premium realistic..." className="mt-4 min-h-[190px] w-full resize-none rounded-[1.45rem] bg-black/42 px-5 py-5 text-base font-semibold leading-7 text-white outline-none ring-1 ring-violet-300/16 transition placeholder:text-slate-500 focus:bg-black/55 focus:ring-cyan-300/35" />

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <ImageToolDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} compact />
                    <ImageToolDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} compact />
                    <div className="sm:col-span-2"><ImageToolDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} compact /></div>
                  </div>

                  <button type="button" onClick={combine} disabled={!canCombine} className="group relative mt-6 flex h-16 w-full items-center justify-center overflow-hidden rounded-[1.45rem] px-7 text-lg font-black text-white shadow-2xl shadow-violet-950/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundImage: "linear-gradient(120deg,#4f46e5,#7c3aed,#c026d3,#0891b2,#4f46e5)", backgroundSize: "240% 240%", animation: "abcImageGradientMove 5.5s ease infinite" }} aria-label="Combine images with M1">
                    <span className="absolute inset-0 bg-cyan-200/0 transition group-hover:bg-cyan-200/10" />
                    <span className="relative z-10">{loading ? "Generating" : `Combine with M1 — ${creditEstimate} credits`}</span>
                    <span className="relative z-10 ml-3 grid h-9 w-9 place-items-center rounded-full bg-black/22 text-2xl ring-1 ring-cyan-100/18 transition group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mx-auto max-w-6xl rounded-2xl bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100 ring-1 ring-red-400/25">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-6xl rounded-2xl bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/25">{notice}</div> : null}

      {loading ? (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-black/45 p-[1px] shadow-2xl shadow-violet-950/25 ring-1 ring-violet-300/18 backdrop-blur-2xl">
          <div className="relative grid min-h-[440px] place-items-center rounded-[1.95rem] bg-[radial-gradient(circle_at_center,rgba(124,58,237,.16),transparent_42%),linear-gradient(135deg,rgba(10,8,24,.92),rgba(2,2,7,.96))]">
            <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-black text-cyan-100 ring-1 ring-cyan-300/20 backdrop-blur-xl">{progress}%</span>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-violet-400/18 border-t-cyan-200" />
              <p className="mt-5 text-lg font-black text-white">Combining with M1...</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">Preparing one final premium output from your selected references.</p>
            </div>
          </div>
        </div>
      ) : null}

      {output ? (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-black/45 p-[1px] shadow-2xl shadow-violet-950/25 ring-1 ring-fuchsia-300/18 backdrop-blur-2xl">
          <div className="overflow-hidden rounded-[1.95rem] bg-black/70"><img src={output.dataUrl} alt="Combined image output" className="w-full object-contain" /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 pb-1">
            <div><p className="text-sm font-black text-white">Combined M1 output</p><p className="text-xs font-semibold text-slate-400">{output.width && output.height ? `${output.width}×${output.height} · ` : ""}{output.creditsCharged ?? creditEstimate} credits charged</p></div>
            <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename)} className="rounded-full bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 ring-1 ring-violet-300/25 transition hover:bg-violet-400/20">Download image</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
