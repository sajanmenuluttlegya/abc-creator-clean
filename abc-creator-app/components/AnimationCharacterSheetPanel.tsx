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

const MODEL_OPTIONS: Array<{ label: ImageModelKey; value: ImageModelKey; hint: string }> = [
  { label: "M1", value: "M1", hint: "Max detail" },
  { label: "M2", value: "M2", hint: "Premium fast" },
  { label: "M3", value: "M3", hint: "Lucid design" },
  { label: "M4", value: "M4", hint: "Prompt text" },
  { label: "M5", value: "M5", hint: "Best value" },
  { label: "M6", value: "M6", hint: "Fast cheap" },
];
const RESOLUTION_OPTIONS: ImageResolution[] = ["360p", "480p", "720p", "1080p"];
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 },
  M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

const POSE_OPTIONS = ["Neutral turnaround", "T-Pose turnaround"];
const TWO_D_STYLES = ["Classic 2D cartoon", "Anime-inspired", "Children’s book 2D", "Clean TV cartoon", "Kawaii 2D", "Comic-book 2D", "Flat vector character", "Custom from brief"];
const THREE_D_STYLES = ["Stylized 3D animation", "Premium toy-like 3D", "Pixar-like family friendly", "Cute chibi 3D", "Claymation-inspired 3D", "Game cinematic 3D", "Low-poly 3D", "Custom from brief"];

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
  const [poseMode, setPoseMode] = useState(POSE_OPTIONS[0]);
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [image, setImage] = useState<GeneratedCharacterSheet | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution] * 4, [model, resolution]);
  const canGenerate = visualDescription.trim().length >= 10 && !loading;

  async function generate() {
    if (!canGenerate) { setError("Describe the character clearly. Add at least 10 characters in Visual Description."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/image/animation-character-sheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolSlug, characterName, characterType, ageGroup, genderPresentation, role, personality, visualDescription, outfit, accessories, colorPalette, style, poseMode, model, resolution }) });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; image?: GeneratedCharacterSheet; prompt?: string } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Character sheet generation failed.");
      setImage(data.image);
      setPromptUsed(data.prompt || "");
      setNotice(`Generated 1 fixed 3:4 character turnaround sheet with 4 views. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Character sheet generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)] lg:items-start">
      <div className="space-y-6">
        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-semibold text-white">Create Character Sheet</h2><p className="mt-1 text-sm text-slate-400">Fixed 3:4 ratio • white background • front/back/left/right views</p></div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">{creditEstimate} credits</span>
          </div>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Character Name</FieldLabel><input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="e.g., Milo Moonpaw" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <div className="space-y-2"><FieldLabel>Character Type / Species</FieldLabel><input value={characterType} onChange={(e) => setCharacterType(e.target.value)} placeholder="e.g., brave rabbit inventor" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Age Group</FieldLabel><input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g., child, teen, young adult" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <div className="space-y-2"><FieldLabel>Gender Presentation</FieldLabel><input value={genderPresentation} onChange={(e) => setGenderPresentation(e.target.value)} placeholder="Optional" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            </div>
            <div className="space-y-2"><FieldLabel required>Visual Description</FieldLabel><textarea value={visualDescription} onChange={(e) => setVisualDescription(e.target.value)} placeholder="Face shape, body proportions, hairstyle/fur, eyes, signature silhouette, expression, species details, etc." className="h-28 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div className="space-y-2"><FieldLabel>Outfit / Costume</FieldLabel><textarea value={outfit} onChange={(e) => setOutfit(e.target.value)} placeholder="Clothing, shoes, armor, uniform, fabric, patterns, etc." className="h-20 w-full resize-none rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Accessories</FieldLabel><input value={accessories} onChange={(e) => setAccessories(e.target.value)} placeholder="e.g., goggles, backpack, magic key" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <div className="space-y-2"><FieldLabel>Color Palette</FieldLabel><input value={colorPalette} onChange={(e) => setColorPalette(e.target.value)} placeholder="e.g., teal, cream, gold accents" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Role</FieldLabel><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., curious sidekick, hero, mentor" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <div className="space-y-2"><FieldLabel>Personality</FieldLabel><input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="e.g., playful, stubborn, kind" className="w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Pose Mode</FieldLabel><select value={poseMode} onChange={(e) => setPoseMode(e.target.value)} className="w-full rounded-xl border border-purple-500/20 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">{POSE_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="space-y-2"><FieldLabel>Style</FieldLabel><select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded-xl border border-purple-500/20 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">{(is3d ? THREE_D_STYLES : TWO_D_STYLES).map((item) => <option key={item}>{item}</option>)}</select></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><FieldLabel>Model</FieldLabel><select value={model} onChange={(e) => setModel(e.target.value as ImageModelKey)} className="w-full rounded-xl border border-purple-500/20 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">{MODEL_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.hint}</option>)}</select></div>
              <div className="space-y-2"><FieldLabel>Resolution</FieldLabel><select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="w-full rounded-xl border border-purple-500/20 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">{RESOLUTION_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></div>
            </div>
          </div>
          <button type="button" onClick={generate} disabled={!canGenerate} className="mt-8 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Generating character sheet..." : `Generate 4-View Sheet — ${creditEstimate} credits`}</button>
          {error ? <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          {notice ? <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p> : null}
        </div>
      </div>
      <div className="space-y-6 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-purple-500/20 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold text-white">Character Sheet Output</h3><p className="text-sm text-slate-400">One 3:4 image containing four consistent views.</p></div>
            {image?.dataUrl ? <button type="button" onClick={() => downloadDataUrl(image.dataUrl, image.filename || `${toolSlug}.png`)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Download</button> : null}
          </div>
          <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-4">{image?.dataUrl ? <img src={image.dataUrl} alt="Generated animation character turnaround sheet" className="max-h-[760px] max-w-full rounded-xl object-contain shadow-2xl" /> : <div className="text-center text-slate-400"><div className="mb-3 text-5xl">🧍</div><p>Your fixed 3:4 white-background turnaround sheet will appear here.</p><p className="mt-2 text-xs">Front • Back • Left side • Right side</p></div>}</div>
        </div>
        {promptUsed ? <details className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300"><summary className="cursor-pointer font-semibold text-white">Prompt used</summary><pre className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{promptUsed}</pre></details> : null}
      </div>
    </div>
  );
}
