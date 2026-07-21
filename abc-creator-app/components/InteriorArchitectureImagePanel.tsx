"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { ImageComposerDropdown } from "./ImageComposerDropdown";

type ImageModelKey = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
type ImageResolution = "360p" | "480p" | "720p" | "1080p";
type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:5" | "3:4" | "4:3" | "3:2" | "2:3";
type Option = { label: string; value: string; meta?: string };
type Preset = {
  title: string;
  eyebrow: string;
  requiresImage: boolean;
  briefPlaceholder: string;
  factsLabel: string;
  factsPlaceholder: string;
  preserveLabel: string;
  preservePlaceholder: string;
  spaceLabel: string;
  spaceOptions: Option[];
  defaultAspect: ImageAspectRatio;
};

type GeneratedInteriorImage = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  modelUsed?: string;
};

const PRESETS: Record<string, Preset> = {
  "ai-room-redesign-generator": {
    title: "Room Redesign Studio", eyebrow: "Reference-led redesign", requiresImage: true,
    briefPlaceholder: "Describe how the room should function, feel, and change. Include users, activities, style, priorities, and what is currently wrong.",
    factsLabel: "Spatial facts", factsPlaceholder: "Known dimensions, ceiling height, doors, windows, fixed services, daylight, camera position, and items shown in the photo.",
    preserveLabel: "Must preserve", preservePlaceholder: "Architecture, openings, flooring, built-ins, furniture, artwork, view, camera angle, or any exact feature that must not change.",
    spaceLabel: "Room type", spaceOptions: ["Living room", "Bedroom", "Dining room", "Family room", "Entry / foyer", "Children's room", "Multi-use room", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "4:3",
  },
  "empty-room-furnisher": {
    title: "Empty Room Furnisher", eyebrow: "Scale-aware virtual furnishing", requiresImage: true,
    briefPlaceholder: "Describe the users, activities, seating or storage needs, preferred atmosphere, and the level of furnishing required.",
    factsLabel: "Room geometry", factsPlaceholder: "Known dimensions, openings, ceiling height, fixed services, circulation entries, view, and any furniture already present.",
    preserveLabel: "Keep clear / preserve", preservePlaceholder: "Doors, windows, radiators, access routes, floor finish, built-ins, outlets, camera perspective, or no-block zones.",
    spaceLabel: "Room type", spaceOptions: ["Living room", "Bedroom", "Dining room", "Home office", "Studio apartment", "Guest room", "Children's room", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "4:3",
  },
  "kitchen-bathroom-design-generator": {
    title: "Kitchen & Bathroom Design", eyebrow: "Service-aware concept visualization", requiresImage: true,
    briefPlaceholder: "Describe the function, household, storage, cooking or bathing routines, style, material quality, accessibility, and desired changes.",
    factsLabel: "Verified site facts", factsPlaceholder: "Dimensions, windows, doors, ventilation, plumbing points, drains, appliances, ceiling, fixed shafts, and anything still unknown.",
    preserveLabel: "Services / architecture to preserve", preservePlaceholder: "Plumbing, drainage, windows, doors, shafts, floor level, cabinetry, appliances, tiles, or structural features. State clearly if conceptual relocation is allowed.",
    spaceLabel: "Space type", spaceOptions: ["Kitchen", "Kitchen + dining", "Primary bathroom", "Guest bathroom", "Powder room", "Utility / laundry", "Accessible bathroom concept", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "4:3",
  },
  "workspace-office-interior-generator": {
    title: "Workspace / Office Interior", eyebrow: "Ergonomic professional environment", requiresImage: true,
    briefPlaceholder: "Describe the work, team or household, focus and collaboration needs, storage, acoustics, technology, visitors, and desired brand character.",
    factsLabel: "Workplace facts", factsPlaceholder: "Dimensions, windows, doors, columns, existing desks, power/data, glare, acoustics, circulation, occupancy, and camera angle.",
    preserveLabel: "Must preserve", preservePlaceholder: "Architecture, existing furniture, equipment, data points, windows, partitions, flooring, branding, or access routes.",
    spaceLabel: "Workspace type", spaceOptions: ["Home office", "Executive office", "Creative studio", "Small team office", "Open-plan office", "Meeting / collaboration room", "Reception + work area", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "exterior-facade-redesign-generator": {
    title: "Exterior & Facade Redesign", eyebrow: "Massing-aware architectural concept", requiresImage: true,
    briefPlaceholder: "Describe the building use, desired identity, style, materials, climate response, entry emphasis, signage needs, and permitted level of conceptual change.",
    factsLabel: "Building / site facts", factsPlaceholder: "Orientation, floors, roof, openings, materials, setbacks, landscape, neighbouring context, access, and verified constraints.",
    preserveLabel: "Massing / openings to preserve", preservePlaceholder: "Roof, height, window and door positions, structural rhythm, balconies, setbacks, heritage elements, camera angle, or landscape.",
    spaceLabel: "Building type", spaceOptions: ["House", "Apartment building", "Office", "Retail storefront", "Clinic / studio", "Mixed-use building", "Community building", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "interior-rendering-generator": {
    title: "Interior Rendering Studio", eyebrow: "Photoreal concept generation", requiresImage: false,
    briefPlaceholder: "Describe the exact room, users, activities, layout, atmosphere, design concept, focal point, and level of realism required.",
    factsLabel: "Spatial facts", factsPlaceholder: "Dimensions, ceiling height, openings, orientation, fixed services, furniture sizes, circulation, and camera position. Mark unknowns instead of guessing.",
    preserveLabel: "Required elements", preservePlaceholder: "Exact furniture, architectural features, material families, palette, view, lighting condition, styling restraint, and must-avoid items.",
    spaceLabel: "Interior type", spaceOptions: ["Living room", "Bedroom", "Dining room", "Kitchen", "Bathroom", "Home office", "Whole-home open plan", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "commercial-interior-generator": {
    title: "Commercial Interior Studio", eyebrow: "Brand-led functional visualization", requiresImage: false,
    briefPlaceholder: "Describe the business, customer journey, staff work, capacity, brand personality, operational needs, accessibility, and desired commercial atmosphere.",
    factsLabel: "Operational / spatial facts", factsPlaceholder: "Area, frontage, ceiling, entrances, service points, back-of-house, product display, queueing, privacy, storage, and circulation.",
    preserveLabel: "Requirements to preserve", preservePlaceholder: "Brand colours, logo-free visual identity, display systems, treatment rooms, counters, equipment, fixed services, or customer flow.",
    spaceLabel: "Commercial type", spaceOptions: ["Retail store", "Showroom", "Salon", "Clinic", "Coworking space", "Creative studio", "Service reception", "Custom non-hospitality space"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "landscape-visualization-generator": {
    title: "Landscape Visualization Studio", eyebrow: "Climate-aware outdoor concept", requiresImage: false,
    briefPlaceholder: "Describe the outdoor space, users, activities, climate, privacy, planting character, maintenance level, lighting, and desired seasonal experience.",
    factsLabel: "Site facts", factsPlaceholder: "Dimensions, orientation, level changes, access, existing trees, structures, drainage observations, views, wind, shade, and boundaries.",
    preserveLabel: "Site elements to preserve", preservePlaceholder: "Trees, walls, paving, pool, utilities, views, access, neighbours, heritage elements, or existing furniture.",
    spaceLabel: "Outdoor type", spaceOptions: ["Garden", "Courtyard", "Terrace", "Balcony", "Rooftop", "Poolside", "Front landscape", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "interior-moodboard-generator": {
    title: "Interior Moodboard Studio", eyebrow: "Curated visual direction", requiresImage: false,
    briefPlaceholder: "Describe the project, users, desired feeling, style references, material quality, colour direction, furniture language, and what must make the concept distinctive.",
    factsLabel: "Context / constraints", factsPlaceholder: "Architecture, climate, budget tier, maintenance, existing finishes, cultural context, brand identity, and any fixed colours.",
    preserveLabel: "Required inclusions / avoid", preservePlaceholder: "Specific material families, colour families, shapes, furniture types, lighting mood, references, and clichés or trends to avoid.",
    spaceLabel: "Moodboard focus", spaceOptions: ["Whole interior concept", "Living / social spaces", "Bedroom / retreat", "Kitchen / dining", "Workspace", "Retail / commercial", "Material-led concept", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
  "material-board-generator": {
    title: "Material Board Studio", eyebrow: "Professional finish coordination", requiresImage: false,
    briefPlaceholder: "Describe the project, design intent, performance needs, desired material character, budget tier, and where the board will be presented.",
    factsLabel: "Performance / context", factsPlaceholder: "Wet or dry area, traffic, climate, maintenance, daylight, existing fixed finishes, accessibility, durability, and sustainability goals.",
    preserveLabel: "Required material families", preservePlaceholder: "Timber, stone, tile, paint, textile, metal, glass, hardware, grout, sheen, undertone, and any materials to exclude.",
    spaceLabel: "Board type", spaceOptions: ["Whole-project palette", "Kitchen finishes", "Bathroom finishes", "Living-space finishes", "Workplace finishes", "Retail / commercial finishes", "Exterior material palette", "Custom from brief"].map((value) => ({ label: value, value })), defaultAspect: "16:9",
  },
};

const ALL_MODEL_OPTIONS: Option[] = [
  { label: "M0", value: "M0", meta: "Private fast worker" },
  { label: "M1", value: "M1", meta: "Maximum detail" }, { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid design" }, { label: "M4", value: "M4", meta: "Prompt precision" },
  { label: "M5", value: "M5", meta: "Best value" }, { label: "M6", value: "M6", meta: "Fast concept" },
];
const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");
const RESOLUTION_OPTIONS: Option[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value, meta: value === "1080p" ? "Highest" : value === "720p" ? "Recommended" : value === "480p" ? "Balanced" : "Preview" }));
const ASPECT_OPTIONS: Option[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"].map((value) => ({ label: value, value, meta: value === "16:9" ? "Presentation" : value === "4:3" ? "Room view" : value === "1:1" ? "Square" : "Format" }));
const STYLE_OPTIONS: Option[] = ["Contemporary refined", "Warm minimal", "Japandi", "Modern luxury", "Scandinavian", "Mid-century modern", "Industrial refined", "Mediterranean contemporary", "Biophilic modern", "Classic contemporary", "Art Deco", "Custom from brief"].map((value) => ({ label: value, value, meta: "Design language" }));
const PALETTE_OPTIONS: Option[] = ["Auto from brief", "Warm neutral", "Cool neutral", "Earth and mineral", "Soft tonal", "High-contrast monochrome", "Muted colour", "Rich jewel accents", "Natural timber-led", "Custom from brief"].map((value) => ({ label: value, value, meta: "Palette" }));
const MATERIAL_OPTIONS: Option[] = ["Auto coordinated", "Natural timber + stone", "Plaster + timber", "Glass + metal", "Textile-rich soft", "Polished luxury", "Durable low-maintenance", "Reclaimed / low-waste", "Custom from brief"].map((value) => ({ label: value, value, meta: "Materials" }));
const LIGHTING_OPTIONS: Option[] = ["Balanced daylight", "Soft warm evening", "Bright commercial", "Layered architectural", "Dramatic editorial", "Overcast realism", "Golden-hour natural", "Custom from brief"].map((value) => ({ label: value, value, meta: "Light" }));
const BUDGET_OPTIONS: Option[] = ["Budget-conscious", "Mid-range", "Premium", "Luxury", "Mixed priority", "Use exact brief"].map((value) => ({ label: value, value, meta: "Budget" }));
const DENSITY_OPTIONS: Option[] = ["Minimal styling", "Balanced lived-in", "Layered premium", "Display-rich", "Operational / uncluttered"].map((value) => ({ label: value, value, meta: "Density" }));
const CAMERA_OPTIONS: Option[] = ["Preserve source camera", "Eye-level wide", "Eye-level natural lens", "Corner perspective", "Centered architectural", "Editorial close-wide", "Elevated overview"].map((value) => ({ label: value, value, meta: "Camera" }));
const ARCHITECTURE_OPTIONS: Option[] = [
  { label: "Strict lock", value: "Strictly preserve all architecture and camera geometry", meta: "Safest" },
  { label: "Finishes only", value: "Preserve geometry and openings; change finishes, furniture, and lighting only", meta: "Recommended" },
  { label: "Light conceptual change", value: "Allow minor non-structural conceptual changes clearly requested in the brief", meta: "Concept" },
  { label: "Broad concept", value: "Allow broader conceptual redesign while retaining recognizable site character", meta: "Exploratory" },
];
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M0: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 }, M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 }, M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 }, M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <label className="block text-xs font-black uppercase tracking-[0.18em] text-slate-300">{children}{required ? <span className="ml-1 text-fuchsia-300">*</span> : null}</label>;
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "interior-concept.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function InteriorArchitectureImagePanel({ toolSlug }: { toolSlug: string }) {
  const config = PRESETS[toolSlug] || PRESETS["interior-rendering-generator"];
  const [sourceImage, setSourceImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [projectBrief, setProjectBrief] = useState("");
  const [spatialFacts, setSpatialFacts] = useState("");
  const [mustPreserve, setMustPreserve] = useState("");
  const [spaceType, setSpaceType] = useState(config.spaceOptions[0]?.value || "Custom from brief");
  const [designStyle, setDesignStyle] = useState("Contemporary refined");
  const [palette, setPalette] = useState("Auto from brief");
  const [materials, setMaterials] = useState("Auto coordinated");
  const [lighting, setLighting] = useState("Balanced daylight");
  const [budgetTier, setBudgetTier] = useState("Mid-range");
  const [stylingDensity, setStylingDensity] = useState("Balanced lived-in");
  const [camera, setCamera] = useState(config.requiresImage ? "Preserve source camera" : "Eye-level natural lens");
  const [architectureMode, setArchitectureMode] = useState(ARCHITECTURE_OPTIONS[1].value);
  const [customInstructions, setCustomInstructions] = useState("");
  const [model, setModel] = useState<ImageModelKey>(config.requiresImage ? "M2" : "M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(config.defaultAspect);
  const [permission, setPermission] = useState(false);
  const [output, setOutput] = useState<GeneratedInteriorImage | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSourceImage(""); setSourceName(""); setOutput(null); setPromptUsed(""); setError(""); setNotice(""); setPermission(false);
    setSpaceType(config.spaceOptions[0]?.value || "Custom from brief"); setAspectRatio(config.defaultAspect);
    setCamera(config.requiresImage ? "Preserve source camera" : "Eye-level natural lens"); setModel(config.requiresImage ? "M2" : "M5");
  }, [config, toolSlug]);

  const modelOptions = config.requiresImage ? EDIT_MODEL_OPTIONS : ALL_MODEL_OPTIONS;
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canGenerate = projectBrief.trim().length >= 12 && (!config.requiresImage || (sourceImage && permission)) && !loading;
  const lineInput = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-fuchsia-300/70";

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setOutput(null);
    if (!file.type.startsWith("image/")) { setError("Choose a PNG, JPG, JPEG, or WEBP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Choose an image under 10 MB."); return; }
    try { setSourceImage(await readImageFile(file)); setSourceName(file.name); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not read the image."); }
  }

  async function generate() {
    if (!canGenerate) { setError(config.requiresImage ? "Upload a room image, confirm permission, and write a detailed brief." : "Write a project brief with at least 12 characters."); return; }
    setLoading(true); setError(""); setNotice(""); setOutput(null);
    try {
      const response = await fetch("/api/image/interior-architecture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, sourceImageDataUrl: sourceImage, projectBrief, spatialFacts, mustPreserve, spaceType, designStyle, palette, materials, lighting, budgetTier, stylingDensity, camera, architectureMode, customInstructions, model, resolution, aspectRatio }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedInteriorImage } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Image generation failed.");
      setOutput(data.image); setPromptUsed(data.prompt || ""); setNotice(`Generated a professional concept. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Image generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="border-y border-white/15 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,.13),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(34,211,238,.08),transparent_28%)]">
        <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)]">
          <section className="border-b border-white/15 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-200/80">{config.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{config.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Concept visualization only. Verify measurements, site conditions, structure, services, accessibility, permits, and local codes with qualified professionals.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-black text-white">{creditEstimate} credits</span>
            </div>

            {config.requiresImage ? (
              <div className="mt-10 border-b border-white/15 pb-8">
                <FieldLabel required>Reference image</FieldLabel>
                <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <label className="group relative grid min-h-32 flex-1 cursor-pointer place-items-center overflow-hidden border border-dashed border-white/25 bg-white/[0.025] transition hover:border-fuchsia-300/60 hover:bg-white/[0.045]">
                    {sourceImage ? <img src={sourceImage} alt="Uploaded design reference" className="h-44 w-full object-cover opacity-90" /> : <div className="px-6 text-center"><p className="text-sm font-black text-white">Upload the real space</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG, or WEBP · max 10 MB</p></div>}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                  <div className="sm:w-52"><p className="text-sm font-bold text-white">{sourceName || "No image selected"}</p><p className="mt-2 text-xs leading-5 text-slate-500">Use a clear, well-lit view with visible floor, walls, openings, and room edges.</p></div>
                </div>
                <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1 h-4 w-4 accent-fuchsia-500" /><span>I have permission to use this image and understand the result is a concept visualization, not a construction document.</span></label>
              </div>
            ) : null}

            <div className="mt-9">
              <FieldLabel required>Project brief</FieldLabel>
              <textarea value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder={config.briefPlaceholder} className="mt-3 min-h-36 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 pb-5 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-300/70" />
            </div>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div><FieldLabel>{config.factsLabel}</FieldLabel><textarea value={spatialFacts} onChange={(event) => setSpatialFacts(event.target.value)} placeholder={config.factsPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
              <div><FieldLabel>{config.preserveLabel}</FieldLabel><textarea value={mustPreserve} onChange={(event) => setMustPreserve(event.target.value)} placeholder={config.preservePlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
            </div>

            <div className="mt-9 border-t border-white/15 pt-7">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-slate-400">Design direction</p>
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label={config.spaceLabel} value={spaceType} options={config.spaceOptions} onChange={setSpaceType} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Style" value={designStyle} options={STYLE_OPTIONS} onChange={setDesignStyle} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Palette" value={palette} options={PALETTE_OPTIONS} onChange={setPalette} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Materials" value={materials} options={MATERIAL_OPTIONS} onChange={setMaterials} />
              </div>
            </div>

            <details className="mt-7 border-t border-white/15 pt-5 text-sm">
              <summary className="cursor-pointer list-none font-black text-white"><span className="mr-2 text-fuchsia-300">＋</span>Professional controls</summary>
              <div className="mt-6 flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Lighting" value={lighting} options={LIGHTING_OPTIONS} onChange={setLighting} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Budget" value={budgetTier} options={BUDGET_OPTIONS} onChange={setBudgetTier} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Density" value={stylingDensity} options={DENSITY_OPTIONS} onChange={setStylingDensity} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Camera" value={camera} options={CAMERA_OPTIONS} onChange={setCamera} />
                {config.requiresImage ? <><span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" /><ImageComposerDropdown label="Architecture" value={architectureMode} options={ARCHITECTURE_OPTIONS} onChange={setArchitectureMode} /></> : null}
              </div>
              <div className="mt-6"><FieldLabel>Additional instructions</FieldLabel><textarea value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Optional: exact camera, materials, furniture, mood, accessibility, styling, weather, season, or preservation rules." className={`${lineInput} min-h-24 resize-y`} /></div>
            </details>

            <div className="mt-9 border-t border-white/15 pt-6">
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Model" value={model} options={modelOptions} onChange={(value) => setModel(value as ImageModelKey)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} />
              </div>
              <button type="button" onClick={generate} disabled={!canGenerate} className="mt-7 w-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "Building the concept…" : "Generate professional concept"}</button>
              {error ? <p className="mt-4 text-sm font-semibold text-red-200">{error}</p> : null}
              {notice ? <p className="mt-4 text-sm font-semibold text-emerald-200">{notice}</p> : null}
            </div>
          </section>

          <section className="relative min-h-[620px] overflow-hidden bg-black/25 p-5 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.025),transparent_38%,rgba(124,58,237,.04))]" />
            <div className="relative flex h-full min-h-[560px] flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">Design output</p><p className="mt-1 text-sm text-slate-500">Geometry-aware concept · professional verification required</p></div>{output ? <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename || `${toolSlug}.png`)} className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.12]">Download PNG</button> : null}</div>

              <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(148,163,184,.12),rgba(0,0,0,.35)_62%)]">
                {loading ? <div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-fuchsia-300/15 border-t-fuchsia-200" /><p className="mt-5 text-sm font-black text-white">Resolving space, scale, materials, and light…</p><p className="mt-2 text-xs text-slate-500">The system is preserving constraints before styling.</p></div> : output ? <img src={output.dataUrl} alt={`${config.title} output`} className="max-h-[760px] w-full object-contain" /> : <div className="max-w-md px-8 text-center"><p className="text-2xl font-black text-white">Professional concept canvas</p><p className="mt-4 text-sm leading-7 text-slate-400">The output will prioritize function, believable scale, clear circulation, coherent materials, realistic lighting, and the preservation rules in your brief.</p><div className="mx-auto mt-8 h-px w-28 bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent" /><p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-600">No fake construction certainty</p></div>}
              </div>

              {output ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4"><p className="text-xs font-bold text-slate-400">{output.modelUsed || model} · {resolution} · {aspectRatio} · {spaceType}</p><details className="text-xs text-slate-500"><summary className="cursor-pointer font-bold text-slate-300">View generation brief</summary><pre className="mt-3 max-h-48 max-w-3xl overflow-auto whitespace-pre-wrap font-sans leading-5">{promptUsed}</pre></details></div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
