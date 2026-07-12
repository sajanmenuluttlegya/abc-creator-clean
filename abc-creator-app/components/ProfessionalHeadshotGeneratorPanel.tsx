"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { ImageComposerDropdown } from "./ImageComposerDropdown";

type ImageModelKey = "M1" | "M2";
type ImageResolution = "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "4:5" | "3:4";
type Option = { label: string; value: string; meta?: string };

type GeneratedHeadshot = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  modelUsed?: string;
};

const MODEL_OPTIONS: Option[] = [
  { label: "M1", value: "M1", meta: "Max identity detail" },
  { label: "M2", value: "M2", meta: "Premium fast" },
];
const RESOLUTION_OPTIONS: Option[] = [
  { label: "480p", value: "480p", meta: "Fast preview" },
  { label: "720p", value: "720p", meta: "Recommended" },
  { label: "1080p", value: "1080p", meta: "Highest quality" },
];
const ASPECT_OPTIONS: Option[] = [
  { label: "1:1", value: "1:1", meta: "LinkedIn / profile" },
  { label: "4:5", value: "4:5", meta: "Professional portrait" },
  { label: "3:4", value: "3:4", meta: "Classic headshot" },
];
const STYLE_OPTIONS: Option[] = [
  { label: "Corporate executive", value: "Corporate executive", meta: "Polished leadership" },
  { label: "Modern startup", value: "Modern startup", meta: "Smart and approachable" },
  { label: "Creative professional", value: "Creative professional", meta: "Refined personality" },
  { label: "Academic / research", value: "Academic / research", meta: "Credible and calm" },
  { label: "Healthcare professional", value: "Healthcare professional", meta: "Clean and trustworthy" },
  { label: "Hospitality leadership", value: "Hospitality leadership", meta: "Warm and premium" },
  { label: "Neutral LinkedIn", value: "Neutral LinkedIn", meta: "Universal profile use" },
];
const WARDROBE_OPTIONS: Option[] = [
  { label: "Preserve current outfit", value: "Preserve current outfit", meta: "No wardrobe change" },
  { label: "Tailored dark suit", value: "Tailored dark suit", meta: "Executive formal" },
  { label: "Blazer and open-collar shirt", value: "Blazer and open-collar shirt", meta: "Modern business" },
  { label: "Smart professional casual", value: "Smart professional casual", meta: "Approachable" },
  { label: "Creative monochrome", value: "Creative monochrome", meta: "Design / media" },
  { label: "Clinical professional", value: "Clinical professional", meta: "Healthcare context" },
  { label: "Hospitality formal", value: "Hospitality formal", meta: "Service leadership" },
];
const BACKGROUND_OPTIONS: Option[] = [
  { label: "Soft neutral gray", value: "Soft neutral gray", meta: "Most versatile" },
  { label: "Clean white studio", value: "Clean white studio", meta: "Bright and simple" },
  { label: "Warm premium studio", value: "Warm premium studio", meta: "Natural warmth" },
  { label: "Cool modern office", value: "Cool modern office", meta: "Corporate context" },
  { label: "Dark executive studio", value: "Dark executive studio", meta: "Leadership portrait" },
  { label: "Subtle brand gradient", value: "Subtle brand gradient", meta: "Modern profile" },
];
const EXPRESSION_OPTIONS: Option[] = [
  { label: "Preserve natural expression", value: "Preserve natural expression", meta: "Closest to source" },
  { label: "Confident and approachable", value: "Confident and approachable", meta: "Recommended" },
  { label: "Calm executive", value: "Calm executive", meta: "Leadership" },
  { label: "Warm and friendly", value: "Warm and friendly", meta: "Client-facing" },
  { label: "Serious professional", value: "Serious professional", meta: "Focused" },
];
const LIGHTING_OPTIONS: Option[] = [
  { label: "Soft studio key light", value: "Soft studio key light", meta: "Natural and flattering" },
  { label: "Executive Rembrandt light", value: "Executive Rembrandt light", meta: "Sculpted depth" },
  { label: "Bright commercial light", value: "Bright commercial light", meta: "Clean profile" },
  { label: "Window-light realism", value: "Window-light realism", meta: "Authentic and soft" },
];
const RETOUCH_OPTIONS: Option[] = [
  { label: "Natural minimal", value: "Natural minimal", meta: "Keep texture" },
  { label: "Polished natural", value: "Polished natural", meta: "Recommended" },
  { label: "Camera-ready professional", value: "Camera-ready professional", meta: "Refined, not artificial" },
];
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "480p": 7, "720p": 8, "1080p": 9 },
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-semibold text-white">{children}{required ? <span className="ml-1 text-pink-400">*</span> : null}</label>;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "professional-headshot.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

export function ProfessionalHeadshotGeneratorPanel() {
  const [sourceImage, setSourceImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [professionContext, setProfessionContext] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);
  const [wardrobe, setWardrobe] = useState(WARDROBE_OPTIONS[0].value);
  const [background, setBackground] = useState(BACKGROUND_OPTIONS[0].value);
  const [expression, setExpression] = useState(EXPRESSION_OPTIONS[1].value);
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0].value);
  const [retouch, setRetouch] = useState(RETOUCH_OPTIONS[1].value);
  const [model, setModel] = useState<ImageModelKey>("M2");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [consent, setConsent] = useState(false);
  const [output, setOutput] = useState<GeneratedHeadshot | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canGenerate = Boolean(sourceImage && consent && !loading);
  const inputClass = "w-full rounded-2xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-purple-500";

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");
    setOutput(null);
    if (!file.type.startsWith("image/")) {
      setError("Choose a PNG, JPG, JPEG, or WEBP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Choose an image under 8 MB.");
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setSourceImage(dataUrl);
      setSourceName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the image.");
    }
  }

  async function generate() {
    if (!sourceImage) { setError("Upload a clear portrait first."); return; }
    if (!consent) { setError("Confirm that you own the photo or have permission to use it."); return; }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/image/professional-headshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceImageDataUrl: sourceImage, professionContext, customInstructions, style, wardrobe, background, expression, lighting, retouch, model, resolution, aspectRatio }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedHeadshot } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Headshot generation failed.");
      setOutput(data.image);
      setPromptUsed(data.prompt || "");
      setNotice(`Generated one professional headshot. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Headshot generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(340px,0.76fr)_minmax(0,1.24fr)] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-[30px] border border-purple-500/20 bg-white/[0.045] p-7 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-purple-200/75">Identity-preserving portrait edit</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Create Professional Headshot</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Upload one clear portrait. The generator is instructed to preserve the same person, age, skin tone, face structure, hairline, and distinctive features.</p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-center text-xs font-semibold leading-4 text-emerald-200">{creditEstimate}<br />credits</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <FieldLabel required>Source Portrait</FieldLabel>
              <label className="block cursor-pointer rounded-[24px] border border-dashed border-purple-300/30 bg-purple-500/5 p-4 transition hover:border-purple-300/60 hover:bg-purple-500/10">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="hidden" />
                {sourceImage ? (
                  <div className="flex items-center gap-4">
                    <img src={sourceImage} alt="Uploaded portrait preview" className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/15" />
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{sourceName || "Portrait ready"}</p><p className="mt-1 text-xs leading-5 text-slate-400">Click to replace. Clear front-facing or three-quarter portraits work best.</p></div>
                  </div>
                ) : (
                  <div className="py-7 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/20 bg-purple-500/10 text-2xl">＋</div><p className="mt-4 text-sm font-bold text-white">Upload a clear portrait</p><p className="mt-1 text-xs text-slate-400">PNG, JPG, or WEBP · maximum 8 MB</p></div>
                )}
              </label>
            </div>

            <div className="space-y-2"><FieldLabel>Role / Professional Context</FieldLabel><input value={professionContext} onChange={(event) => setProfessionContext(event.target.value)} placeholder="e.g., SaaS founder, architect, healthcare consultant" className={inputClass} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Portrait Style</FieldLabel><ImageComposerDropdown label="Style" value={style} options={STYLE_OPTIONS} onChange={setStyle} /></div>
              <div className="space-y-2"><FieldLabel>Wardrobe</FieldLabel><ImageComposerDropdown label="Wardrobe" value={wardrobe} options={WARDROBE_OPTIONS} onChange={setWardrobe} /></div>
              <div className="space-y-2"><FieldLabel>Background</FieldLabel><ImageComposerDropdown label="Background" value={background} options={BACKGROUND_OPTIONS} onChange={setBackground} /></div>
              <div className="space-y-2"><FieldLabel>Expression</FieldLabel><ImageComposerDropdown label="Expression" value={expression} options={EXPRESSION_OPTIONS} onChange={setExpression} /></div>
              <div className="space-y-2"><FieldLabel>Lighting</FieldLabel><ImageComposerDropdown label="Lighting" value={lighting} options={LIGHTING_OPTIONS} onChange={setLighting} /></div>
              <div className="space-y-2"><FieldLabel>Retouching</FieldLabel><ImageComposerDropdown label="Retouch" value={retouch} options={RETOUCH_OPTIONS} onChange={setRetouch} /></div>
            </div>
            <div className="space-y-2"><FieldLabel>Custom Instructions</FieldLabel><textarea value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Optional: preserve glasses, keep hairstyle exactly, preferred crop, subtle brand color, or wardrobe restrictions." className={`${inputClass} h-24 resize-none`} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><FieldLabel>Model</FieldLabel><ImageComposerDropdown label="Model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} /></div>
              <div className="space-y-2"><FieldLabel>Resolution</FieldLabel><ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} /></div>
              <div className="space-y-2"><FieldLabel>Ratio</FieldLabel><ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} /></div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-purple-500" />
              <span>I own this photo or have permission to use it. This output is for professional profile imagery, not an identity or official document.</span>
            </label>
            <button type="button" onClick={generate} disabled={!canGenerate} className="relative flex w-full items-center justify-center overflow-hidden rounded-full border border-indigo-200/20 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-6 py-4 text-sm font-black text-white shadow-2xl shadow-purple-950/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? <><span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />Creating professional headshot...</> : `Generate Headshot — ${creditEstimate} credits`}
            </button>
          </div>
        </div>
        {error ? <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">{error}</div> : null}
        {notice ? <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-100">{notice}</div> : null}
      </div>

      <div className="lg:sticky lg:top-28">
        <div className="relative overflow-hidden rounded-[34px] border border-white/20 bg-white/[0.045] p-3 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative rounded-[27px] border border-white/10 bg-black/45 p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.28em] text-purple-200/75">Premium output</p><h3 className="mt-2 text-xl font-bold text-white">Professional Headshot</h3></div>
              <div className="flex gap-2"><span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${loading ? "border-amber-300/25 bg-amber-400/10 text-amber-100" : output ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}>{loading ? "Rendering" : output ? "Ready" : "Awaiting portrait"}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">{aspectRatio}</span></div>
            </div>

            <div className="relative grid min-h-[520px] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-zinc-950 via-slate-950 to-purple-950/40">
              {loading ? (
                <div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-200" /><p className="mt-5 text-sm font-black text-white">Preserving identity and building studio portrait...</p><p className="mt-2 text-xs text-slate-400">Wardrobe, lighting, expression, and background are being harmonized.</p></div>
              ) : output ? (
                <img src={output.dataUrl} alt="Generated professional headshot" className="max-h-[720px] w-full object-contain" />
              ) : sourceImage ? (
                <div className="w-full p-8 text-center"><img src={sourceImage} alt="Source portrait" className="mx-auto max-h-[430px] rounded-[22px] object-contain opacity-65 ring-1 ring-white/10" /><p className="mt-5 text-sm font-bold text-white">Source portrait ready</p><p className="mt-1 text-xs text-slate-400">Choose the professional direction and generate.</p></div>
              ) : (
                <div className="max-w-sm px-8 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] border border-purple-300/20 bg-purple-500/10 text-4xl">📸</div><p className="mt-5 text-lg font-bold text-white">Your premium headshot will appear here</p><p className="mt-2 text-sm leading-6 text-slate-400">Upload a clear portrait, choose the professional style, and generate an identity-preserving studio result.</p></div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Model</p><p className="mt-1 text-sm font-bold text-white">{output?.modelUsed || model}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Resolution</p><p className="mt-1 text-sm font-bold text-white">{resolution}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity mode</p><p className="mt-1 text-sm font-bold text-white">Strict preserve</p></div>
            </div>

            {output ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-400">Review facial identity, hairstyle, skin tone, wardrobe, and professional appropriateness before using the image.</p><button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename || "professional-headshot.png")} className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">Download PNG</button></div> : null}
            {promptUsed ? <details className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><summary className="cursor-pointer text-xs font-black uppercase tracking-[0.2em] text-purple-200">Generation brief</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-400">{promptUsed}</p></details> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
