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
  garmentLabel: string;
  garmentPlaceholder: string;
  fitLabel: string;
  fitPlaceholder: string;
  sourceHint: string;
  defaultAspect: ImageAspectRatio;
  defaultCopySpace: string;
  defaultCamera: string;
};

type GeneratedFashionImage = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  modelUsed?: string;
};

const optionList = (values: string[], meta: string): Option[] => values.map((value) => ({ label: value, value, meta }));

const PRESETS: Record<string, Preset> = {
  "outfit-concept-generator": {
    title: "Outfit Concept Studio", eyebrow: "Wearable full-look direction",
    briefPlaceholder: "Describe the wearer, occasion, climate, dress code, personal style, comfort needs, garments, accessories, and the result the outfit should achieve.",
    subjectLabel: "Look type", subjectOptions: optionList(["Everyday elevated", "Work / professional", "Evening / occasion", "Travel", "Street style", "Resort / holiday", "Modest fashion", "Adaptive / comfort-led", "Custom from brief"], "Look"),
    garmentLabel: "Garments / accessories", garmentPlaceholder: "List exact garments, colours, materials, footwear, bags, jewellery, outerwear, and items that must not be added, removed, or altered.",
    fitLabel: "Fit / proportion / wearer needs", fitPlaceholder: "Silhouette, layering, ease, mobility, sensory comfort, modesty, body autonomy, weather adaptation, and styling proportions.",
    sourceHint: "Optional: upload real garments, a wardrobe reference, or a permitted wearer image when exact clothing or identity must be preserved.", defaultAspect: "4:5", defaultCopySpace: "No copy space needed", defaultCamera: "Full-length natural"
  },
  "fashion-editorial-generator": {
    title: "Fashion Editorial Studio", eyebrow: "Magazine-grade visual narrative",
    briefPlaceholder: "Describe the editorial story, collection, audience, publication mood, casting, garment hierarchy, movement, environment, lighting, and emotional tension.",
    subjectLabel: "Editorial format", subjectOptions: optionList(["Single-look cover story", "High-fashion portrait", "Environmental editorial", "Movement editorial", "Beauty + garment story", "Avant-garde concept", "Luxury campaign", "Custom from brief"], "Editorial"),
    garmentLabel: "Garment fidelity", garmentPlaceholder: "List every visible garment, material, colour, print, construction detail, accessories, styling order, and details that must remain recognisable.",
    fitLabel: "Model / pose / styling", fitPlaceholder: "Model direction, body and identity preservation, pose, movement, expression, hair, makeup, garment fit intent, and what must not be distorted.",
    sourceHint: "Optional: upload an approved garment, styling, model, location, or campaign reference. Uploaded people require permission and identity preservation by default.", defaultAspect: "4:5", defaultCopySpace: "Small clean masthead zone at the top", defaultCamera: "Editorial three-quarter"
  },
  "fashion-lookbook-image-generator": {
    title: "Fashion Lookbook Image Studio", eyebrow: "Consistent collection presentation",
    briefPlaceholder: "Describe the collection, look number, product priority, model or mannequin, backdrop, styling, channel, crop requirements, and consistency rules across the lookbook.",
    subjectLabel: "Lookbook format", subjectOptions: optionList(["Clean studio full look", "Editorial lookbook", "Location lookbook", "Wholesale line sheet image", "E-commerce elevated", "Model-free garment styling", "Custom from brief"], "Format"),
    garmentLabel: "Look / product details", garmentPlaceholder: "Exact garments, colourways, layers, closures, accessories, footwear, product details, and required front/back/side visibility.",
    fitLabel: "Consistency / model direction", fitPlaceholder: "Pose family, expression, camera height, model identity, body proportions, styling continuity, garment fit, crop, and shadow rules.",
    sourceHint: "Optional: upload an approved look, model, garment, or prior lookbook frame to maintain collection and identity consistency.", defaultAspect: "4:5", defaultCopySpace: "No copy space needed", defaultCamera: "Full-length straight-on"
  },
  "fashion-collection-lineup-generator": {
    title: "Fashion Collection Lineup Studio", eyebrow: "Range-level silhouette and colour rhythm",
    briefPlaceholder: "Describe the collection concept, number of looks, silhouette progression, colour sequence, product categories, styling rules, and how the lineup will be reviewed.",
    subjectLabel: "Lineup style", subjectOptions: optionList(["Runway lineup", "Design review lineup", "Buyer range overview", "Illustrated fashion lineup", "Minimal model lineup", "Mannequin lineup", "Custom from brief"], "Lineup"),
    garmentLabel: "Looks / range fidelity", garmentPlaceholder: "List each look or required category, colour, material, length, layer, signature detail, accessory, and sequence that must be preserved.",
    fitLabel: "Silhouette / spacing / comparison", fitPlaceholder: "Model consistency, body stance, equal scale, spacing, front view, silhouette readability, garment distinction, and backdrop requirements.",
    sourceHint: "Optional: upload collection sketches, garment references, or approved looks to preserve design identity across the lineup.", defaultAspect: "16:9", defaultCopySpace: "No copy space needed", defaultCamera: "Straight-on lineup"
  },
  "garment-flat-lay-generator": {
    title: "Garment Flat-Lay Studio", eyebrow: "Product-accurate overhead styling",
    briefPlaceholder: "Describe the garment or complete look, commercial purpose, arrangement, styling restraint, surface, visible components, and required product accuracy.",
    subjectLabel: "Flat-lay format", subjectOptions: optionList(["Single garment", "Complete outfit", "Garment + accessories", "Folded product", "Ghost-flat hybrid", "Editorial flat lay", "Technical component layout", "Custom from brief"], "Format"),
    garmentLabel: "Exact product components", garmentPlaceholder: "Garment shape, sleeves, collar, closures, pockets, seams, print, labels, trims, accessories, colour, and anything that cannot be altered.",
    fitLabel: "Arrangement / fabric behaviour", fitPlaceholder: "Fold, drape, sleeve placement, symmetry, spacing, creases, natural fabric weight, orientation, crop, and product-ready cleanliness.",
    sourceHint: "Optional: upload the real garment or product photograph to preserve construction, print, colour, and recognisable details.", defaultAspect: "4:5", defaultCopySpace: "No copy space needed", defaultCamera: "True overhead"
  },
  "apparel-product-mockup-generator": {
    title: "Apparel Product Mockup Studio", eyebrow: "Garment-fidelity presentation mockup",
    briefPlaceholder: "Describe the product, view, channel, garment structure, print or embroidery, colourway, presentation style, and what decisions the mockup must support.",
    subjectLabel: "Mockup view", subjectOptions: optionList(["Front product view", "Back product view", "Front + back concept", "Ghost mannequin", "Hanger presentation", "Folded presentation", "Packaging + garment", "Custom from brief"], "View"),
    garmentLabel: "Construction / artwork fidelity", garmentPlaceholder: "Exact silhouette, panel lines, seams, collar, cuffs, pockets, closures, rib, print, embroidery, artwork placement, labels, and trims.",
    fitLabel: "Shape / material / presentation", fitPlaceholder: "Garment volume, fabric weight, drape, stretch, symmetry, mannequin or hanger behaviour, background, shadow, and scale.",
    sourceHint: "Optional: upload the actual garment, flat sketch, approved sample, print artwork, or previous product image to preserve design identity.", defaultAspect: "4:5", defaultCopySpace: "Clean copy-safe space on the right", defaultCamera: "Straight-on product"
  },
  "textile-pattern-generator": {
    title: "Textile Pattern Studio", eyebrow: "Repeat and placement-print concept",
    briefPlaceholder: "Describe the collection, motif language, cultural context, print method, repeat or placement type, scale, density, colour count, fabric, and production constraints.",
    subjectLabel: "Pattern type", subjectOptions: optionList(["Seamless repeat", "Half-drop repeat", "Brick repeat", "Directional repeat", "Border print", "Placement print", "Engineered garment print", "Embroidery motif", "Custom from brief"], "Pattern"),
    garmentLabel: "Motifs / colour fidelity", garmentPlaceholder: "Motif subjects, shapes, line quality, texture, palette, number of colours, ground colour, spacing, and elements that must not be copied or invented.",
    fitLabel: "Repeat / production context", fitPlaceholder: "Approximate scale, repeat rhythm, directionality, fabric width, garment category, print method, registration, placement, and negative space.",
    sourceHint: "Optional: upload original artwork, an owned motif, fabric, or colour reference. Do not upload protected designs you are not permitted to adapt.", defaultAspect: "1:1", defaultCopySpace: "No copy space needed", defaultCamera: "Orthographic pattern tile"
  },
  "fashion-moodboard-generator": {
    title: "Fashion Moodboard Studio", eyebrow: "Curated collection direction",
    briefPlaceholder: "Describe the collection, customer, season, emotional idea, silhouette, materials, colour, craft, styling, cultural references, and what must make the direction distinctive.",
    subjectLabel: "Moodboard focus", subjectOptions: optionList(["Full collection direction", "Silhouette study", "Material and texture", "Colour story", "Styling and casting", "Craft / detail language", "Campaign atmosphere", "Custom from brief"], "Focus"),
    garmentLabel: "Required visual ingredients", garmentPlaceholder: "Silhouettes, garment categories, fabrics, trims, colour families, textures, craft, objects, environments, and references that must or must not appear.",
    fitLabel: "Board hierarchy / restraint", fitPlaceholder: "Editorial hierarchy, asymmetry, breathing room, number of visual clusters, tactile samples, image scale, narrative order, and clichés to avoid.",
    sourceHint: "Optional: upload owned sketches, materials, colour references, campaign images, or other permitted source material to anchor the board.", defaultAspect: "16:9", defaultCopySpace: "No copy space needed", defaultCamera: "Editorial board overview"
  },
  "fashion-on-model-visual-generator": {
    title: "Fashion On-Model Visual Studio", eyebrow: "Identity- and garment-aware presentation",
    briefPlaceholder: "Describe the garment, model or casting direction, e-commerce or editorial purpose, fit intent, pose, background, lighting, crop, and exact garment details to preserve.",
    subjectLabel: "Presentation type", subjectOptions: optionList(["E-commerce front", "E-commerce back", "E-commerce three-quarter", "Editorial full look", "Campaign portrait", "Movement view", "Fit-reference concept", "Custom from brief"], "Presentation"),
    garmentLabel: "Garment identity", garmentPlaceholder: "Exact silhouette, material, colour, print, seams, closures, trims, length, styling, accessories, and garment details that cannot change.",
    fitLabel: "Model / identity / fit controls", fitPlaceholder: "Preserve face, age, skin tone, body proportions, hair, distinctive features, and garment fit when a person reference is supplied; otherwise specify casting, pose, expression, and movement.",
    sourceHint: "Upload an approved garment or permitted person image for reference-led results. The system preserves a visible person's identity and body characteristics by default.", defaultAspect: "4:5", defaultCopySpace: "No copy space needed", defaultCamera: "Full-length natural"
  },
  "garment-detail-material-closeup-generator": {
    title: "Garment Detail & Material Close-Up Studio", eyebrow: "Construction and tactile detail image",
    briefPlaceholder: "Describe the material or construction detail, commercial or technical purpose, garment context, exact workmanship, surface character, scale, and lighting needed.",
    subjectLabel: "Detail focus", subjectOptions: optionList(["Fabric texture", "Seam / topstitch", "Closure / hardware", "Embroidery", "Print / surface", "Knit structure", "Wash / distressing", "Pocket / collar / cuff", "Custom from brief"], "Detail"),
    garmentLabel: "Material / component fidelity", garmentPlaceholder: "Fibre or material if verified, weave or knit appearance, stitch type, thread, hardware, print, embroidery, colour, finish, edge, and must-preserve details.",
    fitLabel: "Macro composition / realism", fitPlaceholder: "Magnification, depth of field, tactile relief, sheen, shadow, material thickness, wear state, scale cue, crop, and background restraint.",
    sourceHint: "Optional: upload the real fabric, trim, seam, sample, or garment detail when accurate texture and construction identity are required.", defaultAspect: "1:1", defaultCopySpace: "No copy space needed", defaultCamera: "Macro detail"
  },
};

const ALL_MODEL_OPTIONS: Option[] = [
  { label: "M0 — Z-Image Turbo", value: "M0", meta: "Private fast worker" },
  { label: "M1", value: "M1", meta: "Maximum detail" }, { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid fashion" }, { label: "M4", value: "M4", meta: "Prompt precision" },
  { label: "M5", value: "M5", meta: "Best value" }, { label: "M6", value: "M6", meta: "Fast concept" },
];
const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");
const RESOLUTION_OPTIONS: Option[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value, meta: value === "1080p" ? "Highest" : value === "720p" ? "Recommended" : value === "480p" ? "Balanced" : "Preview" }));
const ASPECT_OPTIONS: Option[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"].map((value) => ({ label: value, value, meta: value === "4:5" ? "Fashion portrait" : value === "16:9" ? "Lineup / board" : value === "1:1" ? "Pattern / detail" : "Format" }));
const STYLE_OPTIONS = optionList(["Clean premium", "Luxury editorial", "Contemporary campaign", "Minimal e-commerce", "Avant-garde", "Street editorial", "Soft natural", "Technical performance", "Illustrated fashion", "Custom from brief"], "Style");
const PALETTE_OPTIONS = optionList(["Auto from brief", "Neutral tonal", "Warm earth", "Cool mineral", "Monochrome", "High-contrast", "Muted colour", "Rich saturated", "Natural undyed", "Custom from brief"], "Palette");
const MATERIAL_OPTIONS = optionList(["Auto from brief", "Crisp woven", "Soft draped woven", "Jersey / stretch", "Structured tailoring", "Knitwear", "Denim / workwear", "Leather / coated", "Sheer / lightweight", "Technical performance", "Custom from brief"], "Material");
const SETTING_OPTIONS = optionList(["Clean studio", "Warm neutral studio", "Architectural interior", "Urban exterior", "Natural landscape", "Runway / backstage", "Luxury set", "Colour-block set", "Textured editorial", "Custom from brief"], "Setting");
const POSE_OPTIONS = optionList(["Natural standing", "Confident editorial", "Walking movement", "Relaxed seated", "Dynamic fabric motion", "Straight product stance", "Mannequin / no person", "Flat lay / object only", "Custom from brief"], "Pose");
const LIGHTING_OPTIONS = optionList(["Soft studio daylight", "High-key e-commerce", "Directional editorial", "Dramatic runway", "Warm golden light", "Overcast natural", "Hard flash fashion", "Macro texture light", "Custom from brief"], "Light");
const CAMERA_OPTIONS = optionList(["Full-length natural", "Full-length straight-on", "Editorial three-quarter", "Waist-up portrait", "Tight fashion crop", "True overhead", "Straight-on product", "Macro detail", "Straight-on lineup", "Orthographic pattern tile", "Preserve source camera", "Custom from brief"], "Camera");
const COPY_SPACE_OPTIONS = optionList(["No copy space needed", "Small clean masthead zone at the top", "Clean copy-safe space on the left", "Clean copy-safe space on the right", "Large clean headline area", "Clean footer area", "Balanced editorial margins", "Blank product-label area with no generated text"], "Layout");
const FIDELITY_OPTIONS = optionList(["Strictly preserve uploaded garment and person", "Preserve garment identity; refine presentation", "Preserve silhouette, print, colour, and key construction", "Creative concept based on the brief", "Use reference only for mood and palette"], "Fidelity");
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
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "fashion-apparel-visual.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function FashionApparelImagePanel({ toolSlug }: { toolSlug: string }) {
  const config = PRESETS[toolSlug] || PRESETS["outfit-concept-generator"];
  const [sourceImage, setSourceImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [permission, setPermission] = useState(false);
  const [projectBrief, setProjectBrief] = useState("");
  const [subjectType, setSubjectType] = useState(config.subjectOptions[0]?.value || "Custom from brief");
  const [garmentDetails, setGarmentDetails] = useState("");
  const [fitConstruction, setFitConstruction] = useState("");
  const [visualStyle, setVisualStyle] = useState(STYLE_OPTIONS[0].value);
  const [palette, setPalette] = useState(PALETTE_OPTIONS[0].value);
  const [materialBehavior, setMaterialBehavior] = useState(MATERIAL_OPTIONS[0].value);
  const [setting, setSetting] = useState(SETTING_OPTIONS[0].value);
  const [poseMovement, setPoseMovement] = useState(POSE_OPTIONS[0].value);
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0].value);
  const [camera, setCamera] = useState(config.defaultCamera);
  const [copySafeLayout, setCopySafeLayout] = useState(config.defaultCopySpace);
  const [fidelityMode, setFidelityMode] = useState(FIDELITY_OPTIONS[1].value);
  const [customInstructions, setCustomInstructions] = useState("");
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(config.defaultAspect);
  const [output, setOutput] = useState<GeneratedFashionImage | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSourceImage(""); setSourceName(""); setPermission(false); setProjectBrief(""); setGarmentDetails(""); setFitConstruction(""); setCustomInstructions("");
    setSubjectType(config.subjectOptions[0]?.value || "Custom from brief"); setAspectRatio(config.defaultAspect); setCopySafeLayout(config.defaultCopySpace); setCamera(config.defaultCamera);
    setModel("M5"); setOutput(null); setPromptUsed(""); setError(""); setNotice("");
  }, [config, toolSlug]);

  const modelOptions = sourceImage ? EDIT_MODEL_OPTIONS : ALL_MODEL_OPTIONS;
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const canGenerate = projectBrief.trim().length >= 12 && (!sourceImage || permission) && !loading;
  const lineInput = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-pink-300/70";

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setOutput(null);
    if (!file.type.startsWith("image/")) { setError("Choose a PNG, JPG, JPEG, or WEBP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Choose an image under 10 MB."); return; }
    try {
      setSourceImage(await readImageFile(file)); setSourceName(file.name); setPermission(false); setModel("M2");
      setCamera("Preserve source camera"); setFidelityMode("Preserve garment identity; refine presentation");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the image."); }
  }

  function clearImage() {
    setSourceImage(""); setSourceName(""); setPermission(false); setModel("M5");
    if (camera === "Preserve source camera") setCamera(config.defaultCamera);
  }

  async function generate() {
    if (!canGenerate) { setError(sourceImage ? "Confirm permission and write a detailed creative brief." : "Write a creative brief with at least 12 characters."); return; }
    setLoading(true); setError(""); setNotice(""); setOutput(null);
    try {
      const response = await fetch("/api/image/fashion-apparel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, sourceImageDataUrl: sourceImage, projectBrief, subjectType, garmentDetails, fitConstruction, visualStyle, palette, materialBehavior, setting, poseMovement, lighting, camera, copySafeLayout, fidelityMode, customInstructions, model, resolution, aspectRatio }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedFashionImage } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Image generation failed.");
      setOutput(data.image); setPromptUsed(data.prompt || ""); setNotice(`Generated a professional fashion visual. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Image generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="border-y border-white/15 bg-[radial-gradient(circle_at_10%_0%,rgba(236,72,153,.13),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(99,102,241,.09),transparent_30%)]">
        <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,0.94fr)_minmax(480px,1.06fr)]">
          <section className="border-b border-white/15 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-200/80">{config.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{config.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Concept visual only. Verify patterns, measurements, fit, fabric behaviour, colours, construction, artwork, labels, rights, claims, and production details with qualified professionals.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-black text-white">{creditEstimate} credits</span>
            </div>

            <div className="mt-10 border-b border-white/15 pb-8">
              <div className="flex items-center justify-between gap-4"><FieldLabel>Reference image</FieldLabel>{sourceImage ? <button type="button" onClick={clearImage} className="text-xs font-bold text-slate-400 transition hover:text-white">Remove reference</button> : null}</div>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
                <label className="group relative grid min-h-32 flex-1 cursor-pointer place-items-center overflow-hidden border border-dashed border-white/25 bg-white/[0.025] transition hover:border-pink-300/60 hover:bg-white/[0.045]">
                  {sourceImage ? <img src={sourceImage} alt="Uploaded fashion or apparel reference" className="h-44 w-full object-cover opacity-90" /> : <div className="px-6 text-center"><p className="text-sm font-black text-white">Add an optional real reference</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG, or WEBP · max 10 MB</p></div>}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <div className="sm:w-56"><p className="text-sm font-bold text-white">{sourceName || "No image selected"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{config.sourceHint}</p></div>
              </div>
              {sourceImage ? <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1 h-4 w-4 accent-pink-500" /><span>I have permission to use this image and understand that visible people, garments, artwork, and brand assets require appropriate rights and final professional approval.</span></label> : null}
            </div>

            <div className="mt-9">
              <FieldLabel required>Creative brief</FieldLabel>
              <textarea value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder={config.briefPlaceholder} className="mt-3 min-h-36 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 pb-5 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 focus:border-pink-300/70" />
            </div>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div><FieldLabel>{config.garmentLabel}</FieldLabel><textarea value={garmentDetails} onChange={(event) => setGarmentDetails(event.target.value)} placeholder={config.garmentPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
              <div><FieldLabel>{config.fitLabel}</FieldLabel><textarea value={fitConstruction} onChange={(event) => setFitConstruction(event.target.value)} placeholder={config.fitPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
            </div>

            <div className="mt-9 border-t border-white/15 pt-7">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.25em] text-slate-400">Creative direction</p>
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label={config.subjectLabel} value={subjectType} options={config.subjectOptions} onChange={setSubjectType} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Visual style" value={visualStyle} options={STYLE_OPTIONS} onChange={setVisualStyle} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Palette" value={palette} options={PALETTE_OPTIONS} onChange={setPalette} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Material" value={materialBehavior} options={MATERIAL_OPTIONS} onChange={setMaterialBehavior} />
              </div>
            </div>

            <details className="mt-7 border-t border-white/15 pt-5 text-sm">
              <summary className="cursor-pointer list-none font-black text-white"><span className="mr-2 text-pink-300">＋</span>Professional controls</summary>
              <div className="mt-6 flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Setting" value={setting} options={SETTING_OPTIONS} onChange={setSetting} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Pose" value={poseMovement} options={POSE_OPTIONS} onChange={setPoseMovement} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Lighting" value={lighting} options={LIGHTING_OPTIONS} onChange={setLighting} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Camera" value={camera} options={CAMERA_OPTIONS} onChange={setCamera} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Copy-safe layout" value={copySafeLayout} options={COPY_SPACE_OPTIONS} onChange={setCopySafeLayout} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Fidelity" value={fidelityMode} options={FIDELITY_OPTIONS} onChange={setFidelityMode} />
              </div>
              <div className="mt-6"><FieldLabel>Additional instructions</FieldLabel><textarea value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Optional: exact seams, closures, artwork placement, garment view, fit intent, identity preservation, casting, movement, fabric surface, print repeat, crop, continuity, or must-avoid elements." className={`${lineInput} min-h-24 resize-y`} /></div>
            </details>

            <div className="mt-9 border-t border-white/15 pt-6">
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Model" value={model} options={modelOptions} onChange={(value) => setModel(value as ImageModelKey)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} />
              </div>
              <button type="button" onClick={generate} disabled={!canGenerate} className="mt-7 w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-7 py-4 text-base font-black text-white shadow-2xl shadow-fuchsia-950/40 transition hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "Art-directing the fashion visual…" : "Generate professional fashion visual"}</button>
              {error ? <p className="mt-4 text-sm font-semibold text-red-200">{error}</p> : null}
              {notice ? <p className="mt-4 text-sm font-semibold text-emerald-200">{notice}</p> : null}
            </div>
          </section>

          <section className="relative min-h-[620px] overflow-hidden bg-black/25 p-5 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.025),transparent_38%,rgba(236,72,153,.04))]" />
            <div className="relative flex h-full min-h-[560px] flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-pink-200/70">Fashion output</p><p className="mt-1 text-sm text-slate-500">Garment-aware concept · professional verification required</p></div>{output ? <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename || `${toolSlug}.png`)} className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.12]">Download PNG</button> : null}</div>
              <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(244,114,182,.10),rgba(0,0,0,.38)_62%)]">
                {loading ? <div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-pink-300/15 border-t-pink-200" /><p className="mt-5 text-sm font-black text-white">Resolving garment, material, silhouette, and light…</p><p className="mt-2 text-xs text-slate-500">The system is preserving product and identity constraints before styling.</p></div> : output ? <img src={output.dataUrl} alt={`${config.title} output`} className="max-h-[760px] w-full object-contain" /> : <div className="max-w-md px-8 text-center"><p className="text-2xl font-black text-white">Professional fashion canvas</p><p className="mt-4 text-sm leading-7 text-slate-400">The output will prioritize garment identity, believable construction, material behaviour, body dignity, coherent styling, controlled light, and the preservation rules in your brief.</p><div className="mx-auto mt-8 h-px w-28 bg-gradient-to-r from-transparent via-pink-300/70 to-transparent" /><p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-600">No fake production certainty</p></div>}
              </div>
              {output ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4"><p className="text-xs font-bold text-slate-400">{output.modelUsed || model} · {resolution} · {aspectRatio} · {subjectType}</p><details className="text-xs text-slate-500"><summary className="cursor-pointer font-bold text-slate-300">View generation brief</summary><pre className="mt-3 max-h-48 max-w-3xl overflow-auto whitespace-pre-wrap font-sans leading-5">{promptUsed}</pre></details></div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
