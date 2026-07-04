"use client";

import { useState } from "react";
import { ImageToolDropdown } from "./ImageToolDropdown";
import { ImageBeforeAfterSlider } from "./ImageBeforeAfterSlider";

type UpscaleTarget = "1080p" | "2k" | "4k";
type UpscaleResponse = { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: { dataUrl: string; filename?: string } };

const TARGET_OPTIONS: Array<{ label: string; value: UpscaleTarget; meta: string }> = [
  { label: "1080p", value: "1080p", meta: "3 credits" },
  { label: "2K", value: "2k", meta: "6 credits" },
  { label: "4K", value: "4k", meta: "10 credits" },
];

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ImageUpscalePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [target, setTarget] = useState<UpscaleTarget>("2k");
  const [output, setOutput] = useState<{ dataUrl: string; filename: string; creditsCharged?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedCredits = TARGET_OPTIONS.find((item) => item.value === target)?.meta || "";

  function handleFile(nextFile: File | null) {
    setFile(nextFile);
    setOutput(null);
    setError("");
    setNotice("");

    if (!nextFile) {
      setPreview("");
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setError("Upload a PNG, JPG, JPEG, or WEBP image.");
      setPreview("");
      setFile(null);
      return;
    }

    if (nextFile.size > 12 * 1024 * 1024) {
      setError("Upload an image under 12 MB.");
      setPreview("");
      setFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.onerror = () => setError("Could not preview this image.");
    reader.readAsDataURL(nextFile);
  }

  async function upscale() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const form = new FormData();
      form.append("image", file, file.name);
      form.append("target", target);

      const response = await fetch("/api/image/upscale", { method: "POST", body: form });
      const data = await response.json().catch(() => null) as UpscaleResponse | null;

      if (!response.ok || !data?.ok || !data.image?.dataUrl) {
        throw new Error(data?.details || data?.error || "Image upscale failed.");
      }

      setOutput({ dataUrl: data.image.dataUrl, filename: data.image.filename || `upscaled-${target}.png`, creditsCharged: data.creditsCharged });
      setNotice(`Upscaled to ${target.toUpperCase()} for ${data.creditsCharged ?? selectedCredits.replace(" credits", "")} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upscale failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="relative mx-auto max-w-5xl overflow-visible rounded-[2.2rem] border border-purple-300/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.25),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))] p-4 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-inner shadow-black/40 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-purple-200/80">Image upscale</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Upload. Upscale. Download.</h2>
            </div>
            <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100">{selectedCredits}</span>
          </div>

          <label className="group block cursor-pointer overflow-hidden rounded-[1.45rem] border border-dashed border-purple-300/25 bg-white/[0.035] p-5 text-center transition hover:border-purple-300/45 hover:bg-white/[0.055]">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
            {preview ? (
              <img src={preview} alt="Selected image preview" className="mx-auto max-h-[420px] rounded-2xl object-contain shadow-2xl shadow-black/30" />
            ) : (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-white/10 bg-black/30 p-8">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-purple-300/20 bg-purple-400/10 text-3xl text-purple-100 transition group-hover:scale-105">↑</div>
                  <p className="mt-5 text-lg font-black text-white">Drop or choose an image</p>
                  <p className="mt-2 text-sm font-semibold text-slate-400">PNG, JPG, JPEG, or WEBP under 12 MB</p>
                </div>
              </div>
            )}
          </label>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-xs"><ImageToolDropdown label="Upscale target" value={target} options={TARGET_OPTIONS} onChange={(value) => setTarget(value as UpscaleTarget)} /></div>
            <button type="button" onClick={upscale} disabled={!file || loading} className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl border border-purple-200/25 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-7 text-lg font-black text-white shadow-2xl shadow-purple-950/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" aria-label="Upscale image"><span>{loading ? "Upscaling" : "Upscale"}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-2xl transition group-hover:translate-x-1">→</span></button>
          </div>
        </div>
      </div>

      {error ? <div className="mx-auto max-w-5xl rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
      {notice ? <div className="mx-auto max-w-5xl rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}

      {output ? (
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-purple-300/20 bg-white/[0.035] p-3 shadow-2xl shadow-purple-950/25 backdrop-blur-2xl">
          {preview ? <ImageBeforeAfterSlider beforeSrc={preview} afterSrc={output.dataUrl} beforeLabel="Original" afterLabel="Upscaled" alt="Upscale comparison" /> : <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/50"><img src={output.dataUrl} alt="Upscaled output" className="w-full object-contain" /></div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div><p className="text-sm font-black text-white">Upscaled output</p><p className="text-xs font-semibold text-slate-400">{output.creditsCharged ?? selectedCredits.replace(" credits", "")} credits charged · Preview slider only, download is final result</p></div>
            <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename)} className="rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-400/20">Download upscale</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
