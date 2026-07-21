"use client";

import { useMemo, useState, type ReactNode } from "react";

type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type SelectOption = { label: string; value: string; hint?: string };

type GeneratedMangaImage = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  prompt?: string;
};

const MODEL_OPTIONS: SelectOption[] = [
  { label: "M0", value: "M0", hint: "Private fast worker" },
  { label: "M1 — Max detail", value: "M1", hint: "highest detail and composition" },
  { label: "M2 — Premium fast", value: "M2", hint: "balanced premium output" },
  { label: "M3 — Lucid design", value: "M3", hint: "clean illustration quality" },
  { label: "M4 — Prompt precision", value: "M4", hint: "strong scene adherence" },
  { label: "M5 — Best value", value: "M5", hint: "recommended default" },
  { label: "M6 — Fast cheap", value: "M6", hint: "strict simplified layout prompt" },
];
const RESOLUTION_OPTIONS: SelectOption[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value, hint: value === "1080p" ? "highest output" : value === "720p" ? "recommended" : "faster generation" }));
const ASPECT_OPTIONS: SelectOption[] = [
  { label: "16:9 Landscape", value: "16:9", hint: "cinematic manga scene" },
  { label: "9:16 Vertical", value: "9:16", hint: "webtoon / mobile" },
  { label: "1:1 Square", value: "1:1", hint: "balanced social panel" },
  { label: "4:5 Portrait", value: "4:5", hint: "portrait composition" },
  { label: "3:4 Portrait", value: "3:4", hint: "classic illustration" },
  { label: "4:3 Landscape", value: "4:3", hint: "traditional panel" },
  { label: "3:2 Landscape", value: "3:2", hint: "wide editorial panel" },
  { label: "2:3 Portrait", value: "2:3", hint: "full-page manga art" },
];
const MANGA_STYLE_OPTIONS: SelectOption[] = [
  { label: "Shonen action manga", value: "Shonen action manga", hint: "dynamic speed and impact" },
  { label: "Shojo romance manga", value: "Shojo romance manga", hint: "elegant emotional framing" },
  { label: "Seinen cinematic manga", value: "Seinen cinematic manga", hint: "mature detailed composition" },
  { label: "Josei drama manga", value: "Josei drama manga", hint: "grounded emotional realism" },
  { label: "Horror manga", value: "Horror manga", hint: "high-contrast unsettling ink" },
  { label: "Comedy manga", value: "Comedy manga", hint: "expressive reaction staging" },
  { label: "Fantasy manga", value: "Fantasy manga", hint: "ornate world and effects" },
  { label: "Sci-fi manga", value: "Sci-fi manga", hint: "technical environments" },
  { label: "Noir manga", value: "Noir manga", hint: "deep blacks and shadows" },
  { label: "Custom manga style", value: "Custom manga style", hint: "follow the written brief" },
];
const RENDER_OPTIONS: SelectOption[] = [
  { label: "Black ink + screentone", value: "Black ink + screentone", hint: "classic print manga" },
  { label: "High-contrast black and white", value: "High-contrast black and white", hint: "bold cinematic ink" },
  { label: "Soft grayscale manga", value: "Soft grayscale manga", hint: "subtle tonal rendering" },
  { label: "Limited accent color", value: "Limited accent color", hint: "mostly monochrome with one accent" },
  { label: "Full-color manga illustration", value: "Full-color manga illustration", hint: "premium colored page art" },
];
const LAYOUT_OPTIONS: SelectOption[] = [
  { label: "Single cinematic panel", value: "Single cinematic panel", hint: "one finished scene image" },
  { label: "Two-panel split scene", value: "Two-panel split scene", hint: "setup and reaction" },
  { label: "Three-panel dramatic sequence", value: "Three-panel dramatic sequence", hint: "progressive visual beat" },
  { label: "Four-panel manga page", value: "Four-panel manga page", hint: "structured mini-sequence" },
  { label: "Full-page splash", value: "Full-page splash", hint: "hero image composition" },
];
const SPEECH_OPTIONS: SelectOption[] = [
  { label: "No speech bubbles", value: "No speech bubbles", hint: "clean finished art" },
  { label: "Reserve blank speech space", value: "Reserve blank speech space", hint: "safe empty areas for later lettering" },
  { label: "Empty speech bubbles only", value: "Empty speech bubbles only", hint: "blank bubbles, no readable text" },
];
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M0: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
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
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "manga-scene.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-semibold text-white">{children}{required ? <span className="ml-1 text-pink-400">*</span> : null}</label>;
}

function PremiumSelect({ id, value, options, onChange, openSelect, setOpenSelect }: { id: string; value: string; options: SelectOption[]; onChange: (value: string) => void; openSelect: string | null; setOpenSelect: (value: string | null) => void }) {
  const isOpen = openSelect === id;
  const selected = options.find((option) => option.value === value) || options[0];
  return (
    <div className="relative z-30">
      <button type="button" onClick={() => setOpenSelect(isOpen ? null : id)} className="group flex min-h-[54px] w-full items-center justify-between gap-3 rounded-2xl border border-purple-400/30 bg-zinc-950/85 px-4 py-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-purple-300/60 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{selected?.label}</span>{selected?.hint ? <span className="mt-0.5 block truncate text-xs text-slate-400">{selected.hint}</span> : null}</span>
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-xl bg-purple-500/10 text-purple-200 transition ${isOpen ? "rotate-180 bg-purple-500/20" : "group-hover:bg-purple-500/20"}`}>⌄</span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] max-h-80 overflow-auto rounded-2xl border border-purple-400/30 bg-zinc-950/95 p-1.5 shadow-2xl shadow-purple-950/50 backdrop-blur-xl">
          {options.map((option) => {
            const active = option.value === value;
            return <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpenSelect(null); }} className={`w-full rounded-xl px-3.5 py-3 text-left transition ${active ? "bg-purple-500/25 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}><span className="block text-sm font-semibold">{option.label}</span>{option.hint ? <span className="mt-0.5 block text-xs text-slate-400">{option.hint}</span> : null}</button>;
          })}
        </div>
      ) : null}
    </div>
  );
}

export function MangaSceneGeneratorPanel() {
  const [sceneBrief, setSceneBrief] = useState("");
  const [characters, setCharacters] = useState("");
  const [actionBeat, setActionBeat] = useState("");
  const [setting, setSetting] = useState("");
  const [mood, setMood] = useState("");
  const [continuity, setContinuity] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [mangaStyle, setMangaStyle] = useState(MANGA_STYLE_OPTIONS[0].value);
  const [renderMode, setRenderMode] = useState(RENDER_OPTIONS[0].value);
  const [layout, setLayout] = useState(LAYOUT_OPTIONS[0].value);
  const [speechSpace, setSpeechSpace] = useState(SPEECH_OPTIONS[0].value);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("16:9");
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [image, setImage] = useState<GeneratedMangaImage | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canGenerate = sceneBrief.trim().length >= 12 && !loading;
  const inputClass = "w-full rounded-2xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-purple-500";

  async function generate() {
    if (!canGenerate) { setError("Describe the manga scene with at least 12 characters."); return; }
    setLoading(true); setError(""); setNotice(""); setOpenSelect(null);
    try {
      const response = await fetch("/api/image/manga-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneBrief, characters, actionBeat, setting, mood, continuity, negativePrompt, mangaStyle, renderMode, layout, speechSpace, aspectRatio, model, resolution }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedMangaImage } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Manga scene generation failed.");
      setImage(data.image);
      setPromptUsed(data.prompt || "");
      setNotice(`Generated 1 premium manga scene. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Manga scene generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-[30px] border border-purple-500/20 bg-white/[0.045] p-7 shadow-2xl shadow-purple-950/15 backdrop-blur-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><h2 className="text-2xl font-semibold tracking-tight text-white">Create Manga Scene</h2><p className="mt-1 text-sm leading-6 text-slate-400">Finished manga artwork with professional composition, ink, screentone, and character continuity.</p></div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-center text-xs font-semibold leading-4 text-emerald-200">{creditEstimate}<br />credits</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2"><FieldLabel required>Scene Brief</FieldLabel><textarea value={sceneBrief} onChange={(e) => setSceneBrief(e.target.value)} placeholder="Describe exactly what the finished manga scene should show, including the story beat and visual focus." className={`${inputClass} h-32 resize-none`} /></div>
            <div className="space-y-2"><FieldLabel>Characters</FieldLabel><textarea value={characters} onChange={(e) => setCharacters(e.target.value)} placeholder="Character identity, appearance, clothing, age, expression, pose, and relationship to each other." className={`${inputClass} h-24 resize-none`} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Main Action / Emotion</FieldLabel><textarea value={actionBeat} onChange={(e) => setActionBeat(e.target.value)} placeholder="Exact action, gesture, reaction, conflict, or emotional beat." className={`${inputClass} h-24 resize-none`} /></div>
              <div className="space-y-2"><FieldLabel>Setting / Environment</FieldLabel><textarea value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="Location, time, weather, props, architecture, foreground and background." className={`${inputClass} h-24 resize-none`} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Manga Style</FieldLabel><PremiumSelect id="style" value={mangaStyle} options={MANGA_STYLE_OPTIONS} onChange={setMangaStyle} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Rendering</FieldLabel><PremiumSelect id="render" value={renderMode} options={RENDER_OPTIONS} onChange={setRenderMode} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Panel Layout</FieldLabel><PremiumSelect id="layout" value={layout} options={LAYOUT_OPTIONS} onChange={setLayout} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Speech-Bubble Handling</FieldLabel><PremiumSelect id="speech" value={speechSpace} options={SPEECH_OPTIONS} onChange={setSpeechSpace} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Aspect Ratio</FieldLabel><PremiumSelect id="ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Mood / Lighting</FieldLabel><input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g., tense moonlit confrontation" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Model</FieldLabel><PremiumSelect id="model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Resolution</FieldLabel><PremiumSelect id="resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
            </div>
            <div className="space-y-2"><FieldLabel>Continuity / Must Preserve</FieldLabel><textarea value={continuity} onChange={(e) => setContinuity(e.target.value)} placeholder="Details that must remain exact: face, hairstyle, outfit, props, scars, symbols, location geography, or panel continuity." className={`${inputClass} h-24 resize-none`} /></div>
            <div className="space-y-2"><FieldLabel>Additional Negative Prompt</FieldLabel><textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Optional details to avoid." className={`${inputClass} h-20 resize-none`} /></div>
          </div>

          <button type="button" onClick={generate} disabled={!canGenerate} className="mt-8 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.01] hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">{loading ? "Rendering premium manga scene..." : `Generate Manga Scene — ${creditEstimate} credits`}</button>
          {error ? <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
          {notice ? <p className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</p> : null}
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-28">
        <div className="relative overflow-hidden rounded-[30px] border border-purple-400/20 bg-[linear-gradient(180deg,rgba(18,14,30,0.96),rgba(5,5,10,0.98))] shadow-[0_30px_100px_rgba(88,28,255,0.22)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%)]" />
          <div className="relative z-10 flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="mb-2 flex items-center gap-2"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${image?.dataUrl ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : loading ? "border-violet-400/25 bg-violet-500/10 text-violet-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>{image?.dataUrl ? "Ready" : loading ? "Rendering" : "Output panel"}</span><span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{aspectRatio}</span></div><h3 className="text-2xl font-semibold tracking-tight text-white">Premium Manga Output</h3><p className="mt-1 text-sm leading-6 text-slate-400">Finished manga artwork, ready to download as PNG.</p></div>
            <button type="button" onClick={() => image?.dataUrl && downloadDataUrl(image.dataUrl, image.filename || "manga-scene.png")} disabled={!image?.dataUrl} className="inline-flex min-w-40 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:border-purple-300/50 hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-35">Download PNG</button>
          </div>
          <div className="relative z-10 p-5 sm:p-6">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
              {loading ? <div className="flex min-h-[520px] items-center justify-center rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-purple-500/[0.05]"><div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-white/10 border-t-purple-300" /><p className="mt-5 font-semibold text-white">Inking and composing your manga scene</p><p className="mt-2 text-sm text-slate-400">Building the selected layout, lighting, and continuity.</p></div></div> : image?.dataUrl ? <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white p-2 shadow-2xl"><img src={image.dataUrl} alt="Generated premium manga scene" className="max-h-[820px] w-full rounded-[16px] object-contain" /></div> : <div className="flex min-h-[520px] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-gradient-to-br from-white/[0.025] to-purple-500/[0.035] p-8 text-center"><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-4xl">🖋️</div><p className="mt-5 text-lg font-semibold text-white">Your finished manga scene will appear here</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">The output will follow your selected style, panel layout, aspect ratio, character continuity, and speech-space rules.</p></div></div>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Model {model}</span><span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{resolution}</span><span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{layout}</span><span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{renderMode}</span>{image?.width && image?.height ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{image.width} × {image.height}</span> : null}</div>
          </div>
        </div>
        {promptUsed ? <details className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl backdrop-blur-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-white"><span>Generation prompt</span><span className="rounded-xl bg-purple-500/10 px-3 py-1 text-xs text-purple-200 transition group-open:rotate-180">⌄</span></summary><div className="border-t border-white/10 p-5"><pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-300">{promptUsed}</pre></div></details> : null}
      </div>
    </div>
  );
}
