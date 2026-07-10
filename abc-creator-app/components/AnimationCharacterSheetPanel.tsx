"use client";

import { useMemo, useState, type ReactNode } from "react";

type CharacterToolSlug = "2d-animated-character-generator" | "3d-animated-character-generator";
type ImageModelKey = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";

type GeneratedCharacterSheet = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  prompt?: string;
};

type SelectOption = { label: string; value: string; hint?: string };

const MODEL_OPTIONS: SelectOption[] = [
  { label: "M1 — Max detail", value: "M1", hint: "highest consistency" },
  { label: "M2 — Premium fast", value: "M2", hint: "balanced quality" },
  { label: "M3 — Lucid design", value: "M3", hint: "clean details" },
  { label: "M4 — Prompt text", value: "M4", hint: "strong prompt following" },
  { label: "M5 — Best value", value: "M5", hint: "recommended" },
  { label: "M6 — Fast cheap", value: "M6", hint: "extra strict layout prompt" },
];

const RESOLUTION_OPTIONS: SelectOption[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value }));

const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

const POSE_OPTIONS: SelectOption[] = [
  { label: "Neutral turnaround", value: "Neutral turnaround", hint: "relaxed full-body front/back/sides" },
  { label: "T-Pose turnaround", value: "T-Pose turnaround", hint: "orthographic production pose" },
];

const TWO_D_STYLES = ["Classic 2D cartoon", "Anime-inspired", "Children’s book 2D", "Clean TV cartoon", "Kawaii 2D", "Comic-book 2D", "Flat vector character", "Custom from brief"];
const THREE_D_STYLES = ["Stylized 3D animation", "Premium toy-like 3D", "Pixar-like family friendly", "Cute chibi 3D", "Claymation-inspired 3D", "Game cinematic 3D", "Low-poly 3D", "Custom from brief"];
const styleOptions = (items: string[]): SelectOption[] => items.map((value) => ({ label: value, value }));
const VIEW_LABELS = ["Front", "Back", "Left profile", "Right profile"];

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "animation-character-sheet.png";
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
    <div className="relative z-20">
      <button
        type="button"
        onClick={() => setOpenSelect(isOpen ? null : id)}
        className="group flex min-h-[54px] w-full items-center justify-between gap-3 rounded-2xl border border-purple-400/30 bg-zinc-950/80 px-4 py-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-purple-300/60 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <span className="min-w-0 truncate text-base font-semibold">{selected?.label}</span>
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-xl bg-purple-500/10 text-purple-200 transition group-hover:bg-purple-500/20 ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] max-h-80 overflow-y-auto rounded-2xl border border-purple-400/30 bg-zinc-950/95 p-1.5 shadow-2xl shadow-purple-950/40 backdrop-blur-xl">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpenSelect(null); }}
                className={`w-full rounded-xl px-3.5 py-3 text-left transition ${active ? "bg-purple-500/25 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
              >
                <span className="block truncate text-sm font-semibold">{option.label}</span>
                {option.hint ? <span className="mt-0.5 block truncate text-xs text-slate-400">{option.hint}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function EmptyViewCard({ label, index }: { label: string; index: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />
      <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-bold text-purple-200">{index + 1}</div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function AnimationCharacterSheetPanel({ toolSlug }: { toolSlug: CharacterToolSlug }) {
  const is3d = toolSlug === "3d-animated-character-generator";
  const [characterName, setCharacterName] = useState("");
  const [characterType, setCharacterType] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [genderPresentation, setGenderPresentation] = useState("");
  const [role, setRole] = useState("");
  const [personality, setPersonality] = useState("");
  const [visualDescription, setVisualDescription] = useState("");
  const [outfit, setOutfit] = useState("");
  const [accessories, setAccessories] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [style, setStyle] = useState(is3d ? THREE_D_STYLES[0] : TWO_D_STYLES[0]);
  const [poseMode, setPoseMode] = useState(POSE_OPTIONS[0].value);
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [image, setImage] = useState<GeneratedCharacterSheet | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution] * 4, [model, resolution]);
  const canGenerate = visualDescription.trim().length >= 10 && !loading;

  async function generate() {
    if (!canGenerate) {
      setError("Describe the character clearly. Add at least 10 characters in Visual Description.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    setOpenSelect(null);
    try {
      const response = await fetch("/api/image/animation-character-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, characterName, characterType, ageGroup, genderPresentation, role, personality, visualDescription, outfit, accessories, colorPalette, style, poseMode, model, resolution }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: GeneratedCharacterSheet; prompt?: string } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Character sheet generation failed.");
      setImage(data.image);
      setPromptUsed(data.prompt || "");
      setNotice(`Generated 1 premium 16:9 four-view character sheet. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Character sheet generation failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-2xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-3xl border border-purple-500/20 bg-white/5 p-8 shadow-2xl shadow-purple-950/10 backdrop-blur-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Create Premium Character Sheet</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">Fixed 16:9 landscape • white background • four evenly spaced views: front, back, left side, right side</p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-center text-xs font-semibold leading-4 text-emerald-200">{creditEstimate}<br />credits</span>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-slate-300">
            <strong className="text-white">Layout lock:</strong> one single 16:9 sheet, four full-body orthographic views, same identity, same outfit, same colors, clean spacing, no labels or background scene.
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Character Name</FieldLabel><input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="e.g., Milo Moonpaw" className={inputClass} /></div>
              <div className="space-y-2"><FieldLabel>Character Type / Species</FieldLabel><input value={characterType} onChange={(e) => setCharacterType(e.target.value)} placeholder="e.g., brave rabbit inventor" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Age Group</FieldLabel><input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g., child, teen, young adult" className={inputClass} /></div>
              <div className="space-y-2"><FieldLabel>Gender Presentation</FieldLabel><input value={genderPresentation} onChange={(e) => setGenderPresentation(e.target.value)} placeholder="Optional" className={inputClass} /></div>
            </div>
            <div className="space-y-2"><FieldLabel required>Visual Description</FieldLabel><textarea value={visualDescription} onChange={(e) => setVisualDescription(e.target.value)} placeholder="Face shape, body proportions, hairstyle/fur, eyes, signature silhouette, expression, species details, etc." className={`${inputClass} h-28 resize-none`} /></div>
            <div className="space-y-2"><FieldLabel>Outfit / Costume</FieldLabel><textarea value={outfit} onChange={(e) => setOutfit(e.target.value)} placeholder="Clothing, shoes, armor, uniform, fabric, patterns, etc." className={`${inputClass} h-20 resize-none`} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Accessories</FieldLabel><input value={accessories} onChange={(e) => setAccessories(e.target.value)} placeholder="e.g., goggles, backpack, magic key" className={inputClass} /></div>
              <div className="space-y-2"><FieldLabel>Color Palette</FieldLabel><input value={colorPalette} onChange={(e) => setColorPalette(e.target.value)} placeholder="e.g., teal, cream, gold accents" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Role</FieldLabel><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., curious sidekick, hero, mentor" className={inputClass} /></div>
              <div className="space-y-2"><FieldLabel>Personality</FieldLabel><input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="e.g., playful, stubborn, kind" className={inputClass} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Pose Mode</FieldLabel><PremiumSelect id="pose" value={poseMode} options={POSE_OPTIONS} onChange={setPoseMode} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Style</FieldLabel><PremiumSelect id="style" value={style} options={styleOptions(is3d ? THREE_D_STYLES : TWO_D_STYLES)} onChange={setStyle} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Model</FieldLabel><PremiumSelect id="model" value={model} options={MODEL_OPTIONS} onChange={(value) => setModel(value as ImageModelKey)} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
              <div className="space-y-2"><FieldLabel>Resolution</FieldLabel><PremiumSelect id="resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} openSelect={openSelect} setOpenSelect={setOpenSelect} /></div>
            </div>
          </div>

          <button type="button" onClick={generate} disabled={!canGenerate} className="mt-8 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.01] hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
            {loading ? "Generating premium 16:9 sheet..." : `Generate 16:9 Four-View Sheet — ${creditEstimate} credits`}
          </button>
          {error ? <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
          {notice ? <p className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</p> : null}
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-28">
        <div className="relative overflow-hidden rounded-[30px] border border-purple-400/20 bg-[linear-gradient(180deg,rgba(18,14,30,0.96),rgba(5,5,10,0.98))] shadow-[0_30px_100px_rgba(88,28,255,0.22)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[29px] border border-white/[0.05]" />

          <div className="relative z-10 flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${image?.dataUrl ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : loading ? "border-violet-400/25 bg-violet-500/10 text-violet-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
                  {image?.dataUrl ? "Ready" : loading ? "Rendering" : "Output panel"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">16:9</span>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-white">Premium Character Sheet</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">Four consistent orthographic views on one clean white studio sheet.</p>
            </div>

            <button
              type="button"
              onClick={() => image?.dataUrl && downloadDataUrl(image.dataUrl, image.filename || `${toolSlug}.png`)}
              disabled={!image?.dataUrl}
              className="inline-flex min-w-40 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:border-purple-300/50 hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Download PNG
            </button>
          </div>

          <div className="relative z-10 p-5 sm:p-6">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
              {loading ? (
                <div className="aspect-video rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-purple-500/[0.05] p-4">
                  <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-4">
                    {VIEW_LABELS.map((label, index) => (
                      <div key={label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-purple-400/[0.08] via-transparent to-transparent" />
                        <div className="relative flex h-full items-center justify-center rounded-xl border border-dashed border-white/10">
                          <div className="text-center">
                            <div className="mx-auto h-14 w-8 animate-pulse rounded-full bg-white/10" />
                            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{index + 1}. {label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : image?.dataUrl ? (
                <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white p-2 shadow-2xl">
                  <img src={image.dataUrl} alt="Generated 16:9 animation character turnaround sheet with front, back, left profile, and right profile views" className="aspect-video w-full rounded-[16px] object-contain" />
                </div>
              ) : (
                <div className="aspect-video rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[0.025] to-purple-500/[0.035] p-4">
                  <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-4">
                    {VIEW_LABELS.map((label, index) => <EmptyViewCard key={label} label={label} index={index} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {VIEW_LABELS.map((label, index) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300">View {index + 1}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Model {model}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{resolution}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{poseMode}</span>
              {image?.width && image?.height ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{image.width} × {image.height}</span> : null}
            </div>
          </div>
        </div>

        {promptUsed ? (
          <details className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl backdrop-blur-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-white">
              <span>Generation prompt</span>
              <span className="rounded-xl bg-purple-500/10 px-3 py-1 text-xs text-purple-200 transition group-open:rotate-180">⌄</span>
            </summary>
            <div className="border-t border-white/10 p-5">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-300">{promptUsed}</pre>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
