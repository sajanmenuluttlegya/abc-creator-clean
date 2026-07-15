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
  briefPlaceholder: string;
  subjectLabel: string;
  subjectOptions: Option[];
  ingredientLabel: string;
  ingredientPlaceholder: string;
  presentationLabel: string;
  presentationPlaceholder: string;
  sourceHint: string;
  defaultAspect: ImageAspectRatio;
  defaultTextSafe: string;
};

type GeneratedFoodImage = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  modelUsed?: string;
};

const optionList = (values: string[], meta: string): Option[] => values.map((value) => ({ label: value, value, meta }));

const PRESETS: Record<string, Preset> = {
  "food-photography-generator": {
    title: "Food Photography Studio", eyebrow: "Editorial and commercial food image",
    briefPlaceholder: "Describe the finished dish or product, cuisine, occasion, serving temperature, desired appetite appeal, audience, channel, and visual story.",
    subjectLabel: "Photography subject", subjectOptions: optionList(["Single plated dish", "Shared table spread", "Ingredient-led still life", "Bakery / pastry", "Beverage", "Packaged food product", "Chef process moment", "Custom from brief"], "Subject"),
    ingredientLabel: "Hero ingredients / fidelity", ingredientPlaceholder: "List the visible ingredients, exact colours, cuts, doneness, sauces, crumbs, steam, melt, bubbles, garnish, portion, and anything that must not be invented.",
    presentationLabel: "Plating / vessel / styling", presentationPlaceholder: "Plate, bowl, glass, board, packaging, tableware, portion geometry, sauce placement, garnish restraint, props, and serving context.",
    sourceHint: "Optional: upload the real dish or product when exact appearance, packaging, garnish, or plating identity must be preserved.", defaultAspect: "4:5", defaultTextSafe: "No copy space needed",
  },
  "dish-presentation-generator": {
    title: "Dish Presentation Studio", eyebrow: "Chef-led plating concept",
    briefPlaceholder: "Describe the dish, components, service temperature, portion, plate size, dining context, service speed, and the plating problem to solve.",
    subjectLabel: "Dish format", subjectOptions: optionList(["Fine-dining plate", "Premium casual plate", "Bowl composition", "Shared platter", "Dessert plate", "Tasting-menu course", "Takeaway presentation", "Custom from brief"], "Format"),
    ingredientLabel: "Components / non-negotiables", ingredientPlaceholder: "Every visible component, exact quantity relationship, texture, colour, sauce, garnish, edible-only rule, and ingredients that must stay recognizable.",
    presentationLabel: "Presentation direction", presentationPlaceholder: "Plate or vessel, focal point, height, negative space, sauce geometry, garnish logic, service practicality, and details to avoid.",
    sourceHint: "Optional: upload an existing dish photo to refine plating while preserving the food, portion, vessel, and recognisable components.", defaultAspect: "4:5", defaultTextSafe: "No copy space needed",
  },
  "menu-hero-image-generator": {
    title: "Menu Hero Image Studio", eyebrow: "Premium campaign hero visual",
    briefPlaceholder: "Describe the restaurant, menu, signature dish or spread, campaign purpose, audience, atmosphere, season, and where the hero image will appear.",
    subjectLabel: "Hero composition", subjectOptions: optionList(["Signature dish close-up", "Curated table spread", "Ingredient and dish story", "Dish + beverage pairing", "Chef-finished moment", "Delivery / takeaway hero", "Seasonal menu hero", "Custom from brief"], "Composition"),
    ingredientLabel: "Menu / food fidelity", ingredientPlaceholder: "Hero dishes, visible ingredients, portions, drinks, tableware, colours, exclusions, and any exact menu facts the image must respect.",
    presentationLabel: "Campaign styling", presentationPlaceholder: "Surface, props, service context, background atmosphere, premium level, negative space, and how much of the scene should be visible.",
    sourceHint: "Optional: upload a real dish, product, or venue reference to preserve its identity in the hero visual.", defaultAspect: "16:9", defaultTextSafe: "Clear copy-safe space on the left",
  },
  "restaurant-poster-generator": {
    title: "Restaurant Poster Visual Studio", eyebrow: "Text-safe promotional key art",
    briefPlaceholder: "Describe the launch, event, seasonal menu, dining experience, chef collaboration, offer, target guest, emotional hook, and intended poster placement.",
    subjectLabel: "Poster focus", subjectOptions: optionList(["Signature dish", "Dining experience", "Seasonal menu", "Chef collaboration", "Restaurant opening", "Event / tasting", "Beverage experience", "Custom from brief"], "Focus"),
    ingredientLabel: "Visible food / experience elements", ingredientPlaceholder: "Exact dishes, drinks, ingredients, table setting, people or no people, venue cues, and anything that must not be fabricated.",
    presentationLabel: "Art direction", presentationPlaceholder: "Key visual hierarchy, background, props, atmosphere, premium level, campaign mood, and visual simplicity.",
    sourceHint: "Optional: upload a real dish, chef-approved plate, product, or venue image as the reference-led centre of the poster.", defaultAspect: "4:5", defaultTextSafe: "Large clean headline zone at the top",
  },
  "restaurant-social-creative-generator": {
    title: "Restaurant Social Creative Studio", eyebrow: "Platform-ready food visual",
    briefPlaceholder: "Describe the post objective, audience, platform, restaurant, featured item or experience, season, message, and action the visual should support.",
    subjectLabel: "Creative type", subjectOptions: optionList(["Dish spotlight", "New menu reveal", "Behind-the-scenes food", "Dining atmosphere", "Event / collaboration", "Delivery / takeaway", "Beverage spotlight", "Custom from brief"], "Creative"),
    ingredientLabel: "Food / brand fidelity", ingredientPlaceholder: "Exact dishes, visible ingredients, portions, packaging, brand colours, tableware, exclusions, and what must remain authentic.",
    presentationLabel: "Social composition", presentationPlaceholder: "Crop behaviour, focal point, feed or story context, background, prop restraint, human presence, and safe space for later copy.",
    sourceHint: "Optional: upload an approved dish, packaging, venue, or campaign reference to keep the visual grounded in the real brand.", defaultAspect: "4:5", defaultTextSafe: "Small copy-safe zone in the upper third",
  },
  "restaurant-interior-mood-image-generator": {
    title: "Restaurant Interior Mood Studio", eyebrow: "Hospitality atmosphere image",
    briefPlaceholder: "Describe the cuisine, guest occasion, price tier, service style, desired emotion, seating character, table setting, lighting, materials, and time of day.",
    subjectLabel: "Hospitality scene", subjectOptions: optionList(["Dining room", "Chef's counter", "Private dining", "Café atmosphere", "Bar / lounge", "Terrace dining", "Open kitchen view", "Custom from brief"], "Scene"),
    ingredientLabel: "Food / service cues", ingredientPlaceholder: "Dishes, drinks, tableware, menus, linen, flowers, service details, occupancy level, and cues that connect the interior to the food concept.",
    presentationLabel: "Interior atmosphere", presentationPlaceholder: "Materials, colours, seating, table spacing, light layers, acoustics cues, sightlines, service movement, and design details to avoid.",
    sourceHint: "Optional: upload the real venue to preserve its architecture, layout, identity, and camera perspective while changing atmosphere and styling.", defaultAspect: "16:9", defaultTextSafe: "No copy space needed",
  },
  "recipe-illustration-generator": {
    title: "Recipe Illustration Studio", eyebrow: "Accurate editorial food illustration",
    briefPlaceholder: "Describe the recipe, finished result, key stages or components, intended publication, audience, illustration style, and what the visual must teach or communicate.",
    subjectLabel: "Illustration format", subjectOptions: optionList(["Finished dish illustration", "Ingredient composition", "Step-support scene", "Cookbook hero", "Editorial recipe art", "Children's recipe art", "Technical cutaway-style food", "Custom from brief"], "Format"),
    ingredientLabel: "Recipe accuracy", ingredientPlaceholder: "Exact ingredients, colours, shapes, cuts, layers, doneness, garnish, portion, and anything that must not be added or omitted.",
    presentationLabel: "Illustration direction", presentationPlaceholder: "Medium, line quality, realism, background, composition, plate or vessel, viewpoint, and publication style.",
    sourceHint: "Optional: upload the real dish or recipe reference to preserve ingredient and presentation accuracy.", defaultAspect: "4:3", defaultTextSafe: "Balanced margin for recipe-page copy",
  },
  "food-packaging-concept-generator": {
    title: "Food Packaging Concept Studio", eyebrow: "Structure-led packaging visualization",
    briefPlaceholder: "Describe the food or beverage, category, channel, portion, shelf or service context, target customer, price tier, brand personality, and packaging problem.",
    subjectLabel: "Package format", subjectOptions: optionList(["Pouch", "Carton", "Bottle", "Can", "Jar", "Cup / tub", "Takeaway box", "Custom from brief"], "Format"),
    ingredientLabel: "Product / pack fidelity", ingredientPlaceholder: "Product appearance, pack size, serving cues, material requirements, windows, closures, structural details, sustainability goals, and claims that must not be invented.",
    presentationLabel: "Packaging art direction", presentationPlaceholder: "Shape, material, finish, colour, label-safe area, premium level, product visibility, shelf angle, and secondary packaging.",
    sourceHint: "Optional: upload an existing package, product, vessel, or structural reference to preserve its proportions and recognisable identity.", defaultAspect: "4:5", defaultTextSafe: "Clean front label panel with no generated text",
  },
  "menu-cover-generator": {
    title: "Menu Cover Studio", eyebrow: "Refined textless cover art",
    briefPlaceholder: "Describe the restaurant, cuisine, price tier, menu type, season, guest, desired first impression, printing or digital context, and brand identity.",
    subjectLabel: "Cover direction", subjectOptions: optionList(["Ingredient-led abstract", "Signature dish detail", "Table-setting mood", "Architectural / material detail", "Illustrated cuisine motif", "Seasonal visual", "Minimal luxury texture", "Custom from brief"], "Direction"),
    ingredientLabel: "Identity cues", ingredientPlaceholder: "Signature ingredients, colours, materials, patterns, tableware, cultural references, exclusions, and real brand elements to respect.",
    presentationLabel: "Cover composition", presentationPlaceholder: "Visual hierarchy, texture, focal point, border or borderless, print finish feel, negative space, and how restrained the cover should be.",
    sourceHint: "Optional: upload a real ingredient, dish, pattern, material, artwork, or venue reference to anchor the cover in the brand.", defaultAspect: "3:4", defaultTextSafe: "Large clean title area in the centre",
  },
};

const ALL_MODEL_OPTIONS: Option[] = [
  { label: "M0 — Z-Image Turbo", value: "M0", meta: "Private fast worker" },
  { label: "M1", value: "M1", meta: "Maximum detail" }, { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid food styling" }, { label: "M4", value: "M4", meta: "Prompt precision" },
  { label: "M5", value: "M5", meta: "Best value" }, { label: "M6", value: "M6", meta: "Fast concept" },
];
const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");
const RESOLUTION_OPTIONS: Option[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value, meta: value === "1080p" ? "Highest" : value === "720p" ? "Recommended" : value === "480p" ? "Balanced" : "Preview" }));
const ASPECT_OPTIONS: Option[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"].map((value) => ({ label: value, value, meta: value === "16:9" ? "Hero" : value === "4:5" ? "Social / poster" : value === "3:4" ? "Cover" : value === "1:1" ? "Square" : "Format" }));
const CUISINE_OPTIONS = optionList(["Auto from brief", "Indian", "East / Southeast Asian", "Mediterranean", "Middle Eastern", "European", "Latin American", "African", "Modern global", "Bakery / pastry", "Beverage-led", "Custom from brief"], "Cuisine");
const STYLE_OPTIONS = optionList(["Photoreal editorial", "Premium commercial", "Fine-dining refined", "Rustic natural", "Bright modern", "Dark moody", "Minimal luxury", "Playful contemporary", "Illustrated editorial", "Custom from brief"], "Style");
const BACKGROUND_OPTIONS = optionList(["Auto coordinated", "Clean studio", "Natural stone", "Warm timber", "Linen table", "Dark editorial", "Restaurant table", "Kitchen pass", "Colour-block campaign", "Custom from brief"], "Surface");
const LIGHTING_OPTIONS = optionList(["Soft window light", "Controlled studio daylight", "Warm restaurant evening", "High-key commercial", "Dramatic side light", "Backlit freshness", "Overhead editorial", "Custom from brief"], "Light");
const CAMERA_OPTIONS = optionList(["45-degree hero", "Overhead flat lay", "Eye-level table", "Tight macro detail", "Natural three-quarter", "Wide environmental", "Preserve source camera", "Custom from brief"], "Camera");
const TEXT_SAFE_OPTIONS = optionList(["No copy space needed", "Clear copy-safe space on the left", "Clear copy-safe space on the right", "Large clean headline zone at the top", "Large clean footer zone", "Small copy-safe zone in the upper third", "Balanced margin for recipe-page copy", "Clean front label panel with no generated text", "Large clean title area in the centre"], "Layout");
const FIDELITY_OPTIONS = optionList(["Strictly preserve the uploaded subject", "Preserve food / product identity; refine styling", "Preserve core ingredients and portion", "Creative concept based on the brief", "Use reference only for mood and palette"], "Fidelity");
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M0: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 },
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 }, M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 }, M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 }, M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-semibold text-white">{children}{required ? <span className="ml-1 text-pink-400">*</span> : null}</label>;
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
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "food-hospitality-visual.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function FoodHospitalityImagePanel({ toolSlug }: { toolSlug: string }) {
  const config = PRESETS[toolSlug] || PRESETS["food-photography-generator"];
  const [sourceImage, setSourceImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [permission, setPermission] = useState(false);
  const [projectBrief, setProjectBrief] = useState("");
  const [subjectType, setSubjectType] = useState(config.subjectOptions[0]?.value || "Custom from brief");
  const [cuisineStyle, setCuisineStyle] = useState(CUISINE_OPTIONS[0].value);
  const [visualStyle, setVisualStyle] = useState(STYLE_OPTIONS[0].value);
  const [heroIngredients, setHeroIngredients] = useState("");
  const [platingPackaging, setPlatingPackaging] = useState("");
  const [backgroundSurface, setBackgroundSurface] = useState(BACKGROUND_OPTIONS[0].value);
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0].value);
  const [camera, setCamera] = useState(CAMERA_OPTIONS[0].value);
  const [textSafeLayout, setTextSafeLayout] = useState(config.defaultTextSafe);
  const [fidelityMode, setFidelityMode] = useState(FIDELITY_OPTIONS[1].value);
  const [customInstructions, setCustomInstructions] = useState("");
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(config.defaultAspect);
  const [output, setOutput] = useState<GeneratedFoodImage | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSourceImage(""); setSourceName(""); setPermission(false); setProjectBrief(""); setHeroIngredients(""); setPlatingPackaging(""); setCustomInstructions("");
    setSubjectType(config.subjectOptions[0]?.value || "Custom from brief"); setAspectRatio(config.defaultAspect); setTextSafeLayout(config.defaultTextSafe);
    setModel("M5"); setOutput(null); setPromptUsed(""); setError(""); setNotice("");
  }, [config, toolSlug]);

  const modelOptions = sourceImage ? EDIT_MODEL_OPTIONS : ALL_MODEL_OPTIONS;
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canGenerate = projectBrief.trim().length >= 12 && (!sourceImage || permission) && !loading;
  const lineInput = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/70";

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setOutput(null);
    if (!file.type.startsWith("image/")) { setError("Choose a PNG, JPG, JPEG, or WEBP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Choose an image under 10 MB."); return; }
    try {
      setSourceImage(await readImageFile(file)); setSourceName(file.name); setPermission(false); setModel("M2");
      setCamera("Preserve source camera"); setFidelityMode("Preserve food / product identity; refine styling");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the image."); }
  }

  function clearImage() {
    setSourceImage(""); setSourceName(""); setPermission(false); setModel("M5");
    if (camera === "Preserve source camera") setCamera("45-degree hero");
  }

  async function generate() {
    if (!canGenerate) { setError(sourceImage ? "Confirm permission and write a detailed creative brief." : "Write a creative brief with at least 12 characters."); return; }
    setLoading(true); setError(""); setNotice(""); setOutput(null);
    try {
      const response = await fetch("/api/image/food-hospitality", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, sourceImageDataUrl: sourceImage, projectBrief, subjectType, cuisineStyle, visualStyle, heroIngredients, platingPackaging, backgroundSurface, lighting, camera, textSafeLayout, fidelityMode, customInstructions, model, resolution, aspectRatio }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedFoodImage } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Image generation failed.");
      setOutput(data.image); setPromptUsed(data.prompt || ""); setNotice(`Generated a professional visual. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Image generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="border-y border-white/15 bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,.12),transparent_34%),radial-gradient(circle_at_100%_22%,rgba(244,63,94,.08),transparent_30%)]">
        <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,0.94fr)_minmax(480px,1.06fr)]">
          <section className="border-b border-white/15 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-200/80">{config.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{config.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Visual concept only. Verify ingredients, portions, allergens, packaging claims, food safety, legal copy, print specifications, and brand approvals before commercial use.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-black text-white">{creditEstimate} credits</span>
            </div>

            <div className="mt-10 border-b border-white/15 pb-8">
              <div className="flex items-center justify-between gap-4"><FieldLabel>Reference image</FieldLabel>{sourceImage ? <button type="button" onClick={clearImage} className="text-xs font-bold text-slate-400 transition hover:text-white">Remove reference</button> : null}</div>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
                <label className="group relative grid min-h-32 flex-1 cursor-pointer place-items-center overflow-hidden border border-dashed border-white/25 bg-white/[0.025] transition hover:border-amber-300/60 hover:bg-white/[0.045]">
                  {sourceImage ? <img src={sourceImage} alt="Uploaded food or hospitality reference" className="h-44 w-full object-cover opacity-90" /> : <div className="px-6 text-center"><p className="text-sm font-black text-white">Add an optional real reference</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG, or WEBP · max 10 MB</p></div>}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <div className="sm:w-56"><p className="text-sm font-bold text-white">{sourceName || "No image selected"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{config.sourceHint}</p></div>
              </div>
              {sourceImage ? <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-500" /><span>I have permission to use this image and understand that generated visuals require final culinary, brand, allergen, legal, and production review.</span></label> : null}
            </div>

            <div className="mt-9">
              <FieldLabel required>Creative brief</FieldLabel>
              <textarea value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder={config.briefPlaceholder} className="mt-3 min-h-36 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 pb-5 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 focus:border-amber-300/70" />
            </div>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div><FieldLabel>{config.ingredientLabel}</FieldLabel><textarea value={heroIngredients} onChange={(event) => setHeroIngredients(event.target.value)} placeholder={config.ingredientPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
              <div><FieldLabel>{config.presentationLabel}</FieldLabel><textarea value={platingPackaging} onChange={(event) => setPlatingPackaging(event.target.value)} placeholder={config.presentationPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
            </div>

            <div className="mt-9 border-t border-white/15 pt-7">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-slate-400">Creative direction</p>
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label={config.subjectLabel} value={subjectType} options={config.subjectOptions} onChange={setSubjectType} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Cuisine" value={cuisineStyle} options={CUISINE_OPTIONS} onChange={setCuisineStyle} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Visual style" value={visualStyle} options={STYLE_OPTIONS} onChange={setVisualStyle} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Surface" value={backgroundSurface} options={BACKGROUND_OPTIONS} onChange={setBackgroundSurface} />
              </div>
            </div>

            <details className="mt-7 border-t border-white/15 pt-5 text-sm">
              <summary className="cursor-pointer list-none font-black text-white"><span className="mr-2 text-amber-300">＋</span>Professional controls</summary>
              <div className="mt-6 flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Lighting" value={lighting} options={LIGHTING_OPTIONS} onChange={setLighting} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Camera" value={camera} options={CAMERA_OPTIONS} onChange={setCamera} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Copy-safe layout" value={textSafeLayout} options={TEXT_SAFE_OPTIONS} onChange={setTextSafeLayout} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Fidelity" value={fidelityMode} options={FIDELITY_OPTIONS} onChange={setFidelityMode} />
              </div>
              <div className="mt-6"><FieldLabel>Additional instructions</FieldLabel><textarea value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Optional: exact ingredient appearance, doneness, steam, condensation, garnish, crop, props, print finish, cultural details, packaging structure, or must-avoid elements." className={`${lineInput} min-h-24 resize-y`} /></div>
            </details>

            <div className="mt-9 border-t border-white/15 pt-6">
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Model" value={model} options={modelOptions} onChange={(value) => setModel(value as ImageModelKey)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} />
              </div>
              <button type="button" onClick={generate} disabled={!canGenerate} className="mt-7 w-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 px-7 py-4 text-base font-black text-white shadow-2xl shadow-orange-950/40 transition hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "Art-directing the visual…" : "Generate professional visual"}</button>
              {error ? <p className="mt-4 text-sm font-semibold text-red-200">{error}</p> : null}
              {notice ? <p className="mt-4 text-sm font-semibold text-emerald-200">{notice}</p> : null}
            </div>
          </section>

          <section className="relative min-h-[620px] overflow-hidden bg-black/25 p-5 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.025),transparent_38%,rgba(245,158,11,.035))]" />
            <div className="relative flex h-full min-h-[560px] flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-200/70">Visual output</p><p className="mt-1 text-sm text-slate-500">Ingredient-aware concept · professional review required</p></div>{output ? <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename || `${toolSlug}.png`)} className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.12]">Download PNG</button> : null}</div>
              <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,.10),rgba(0,0,0,.38)_62%)]">
                {loading ? <div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-amber-300/15 border-t-amber-200" /><p className="mt-5 text-sm font-black text-white">Resolving ingredients, texture, styling, and light…</p><p className="mt-2 text-xs text-slate-500">The system is protecting food identity before polishing the composition.</p></div> : output ? <img src={output.dataUrl} alt={`${config.title} output`} className="max-h-[760px] w-full object-contain" /> : <div className="max-w-md px-8 text-center"><p className="text-2xl font-black text-white">Premium food visual canvas</p><p className="mt-4 text-sm leading-7 text-slate-400">The output will prioritize recognizable ingredients, believable portions, real texture, restrained styling, coherent light, and the fidelity rules in your brief.</p><div className="mx-auto mt-8 h-px w-28 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" /><p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-600">No fake labels or plastic food</p></div>}
              </div>
              {output ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4"><p className="text-xs font-bold text-slate-400">{output.modelUsed || model} · {resolution} · {aspectRatio} · {subjectType}</p><details className="text-xs text-slate-500"><summary className="cursor-pointer font-bold text-slate-300">View generation brief</summary><pre className="mt-3 max-h-48 max-w-3xl overflow-auto whitespace-pre-wrap font-sans leading-5">{promptUsed}</pre></details></div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
