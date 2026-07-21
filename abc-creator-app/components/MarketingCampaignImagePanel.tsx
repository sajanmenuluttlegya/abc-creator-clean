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
  identityLabel: string;
  identityPlaceholder: string;
  audienceLabel: string;
  audiencePlaceholder: string;
  sourceHint: string;
  defaultAspect: ImageAspectRatio;
  defaultCopySpace: string;
  defaultCamera: string;
  requiresSource?: boolean;
};

type GeneratedCampaignImage = {
  dataUrl: string;
  filename?: string;
  width?: number;
  height?: number;
  modelUsed?: string;
};

const optionList = (values: string[], meta: string): Option[] => values.map((value) => ({ label: value, value, meta }));

const PRESETS: Record<string, Preset> = {
  "campaign-key-visual-generator": {
    title: "Campaign Key Visual Studio", eyebrow: "Master campaign visual system",
    briefPlaceholder: "Describe the campaign objective, audience tension, big idea, offer, emotional outcome, product or service, brand character, channels, and the visual impression the campaign must own.",
    subjectLabel: "Key-visual structure", subjectOptions: optionList(["Hero product / service", "Human outcome", "Conceptual metaphor", "Product + lifestyle", "Before / after tension without claims", "Experience or environment", "Abstract brand world", "Custom from brief"], "Structure"),
    identityLabel: "Campaign / brand identity", identityPlaceholder: "List approved product appearance, brand colours, distinctive assets, materials, visual codes, required subject, offer cues, and anything that must not be changed or invented.",
    audienceLabel: "Audience / message hierarchy", audiencePlaceholder: "Audience, campaign promise, emotional tension, proof cue, focal hierarchy, desired response, and the exact area that should remain calm for later headline and CTA.",
    sourceHint: "Optional: upload an approved product, location, brand, campaign, or owned visual reference to preserve real identity while developing the master visual.", defaultAspect: "16:9", defaultCopySpace: "Clear headline and CTA space on the left", defaultCamera: "Premium campaign hero"
  },
  "multi-channel-campaign-creative-generator": {
    title: "Multi-Channel Campaign Creative Studio", eyebrow: "Placement-aware campaign adaptation",
    briefPlaceholder: "Describe the approved campaign idea, selected channel and placement, audience stage, message, CTA, subject, crop requirements, brand rules, and what must remain consistent across the wider campaign.",
    subjectLabel: "Channel / placement", subjectOptions: optionList(["Paid social feed", "Paid social story / reel cover", "Display / programmatic", "Website banner", "Digital out-of-home", "Retail / point of sale", "Event screen", "Custom from brief"], "Placement"),
    identityLabel: "Master campaign identity", identityPlaceholder: "Approved key visual, product, campaign colours, subject, lighting, visual motif, brand assets, and consistency rules that every channel adaptation must preserve.",
    audienceLabel: "Placement / audience requirement", audiencePlaceholder: "Audience, journey stage, attention window, focal order, CTA location, device context, crop-safe area, accessibility, and clutter limits.",
    sourceHint: "Recommended: upload the approved key visual or master creative to preserve campaign identity during channel adaptation.", defaultAspect: "4:5", defaultCopySpace: "Small clean copy-safe zone in the upper third", defaultCamera: "Preserve source composition"
  },
  "campaign-social-creative-generator": {
    title: "Campaign Social Creative Studio", eyebrow: "Platform-ready campaign image",
    briefPlaceholder: "Describe the campaign, platform, objective, audience, post or ad context, featured product or outcome, message angle, emotional tone, and what should stop the scroll without becoming clickbait.",
    subjectLabel: "Social format", subjectOptions: optionList(["Feed portrait", "Square feed", "Story / reel cover", "Carousel cover", "Announcement creative", "Offer creative", "Testimonial-support visual", "Custom from brief"], "Format"),
    identityLabel: "Product / campaign fidelity", identityPlaceholder: "Exact product, service cues, packaging, people, environment, brand colours, campaign motif, approved assets, and anything that must not be altered or fabricated.",
    audienceLabel: "Audience / social hierarchy", audiencePlaceholder: "Target audience, awareness level, visual hook, proof cue, crop behaviour, mobile readability, comment context, and safe space for later platform copy.",
    sourceHint: "Optional: upload an approved product, campaign, customer-approved, venue, or brand reference to keep the social visual grounded in reality.", defaultAspect: "4:5", defaultCopySpace: "Small copy-safe zone in the upper third", defaultCamera: "Immediate social focal point"
  },
  "campaign-email-landing-hero-generator": {
    title: "Campaign Email & Landing Hero Studio", eyebrow: "Responsive conversion-page hero visual",
    briefPlaceholder: "Describe the campaign, landing page or email purpose, audience, message, offer, product or service, conversion action, responsive behaviour, and the first impression the hero must create.",
    subjectLabel: "Hero destination", subjectOptions: optionList(["Landing-page desktop hero", "Landing-page mobile hero", "Email header hero", "Product-launch hero", "Lead-magnet hero", "Event-registration hero", "Lifecycle campaign hero", "Custom from brief"], "Destination"),
    identityLabel: "Hero subject / brand fidelity", identityPlaceholder: "Product, service, people, environment, brand palette, campaign identity, proof elements, mandatory objects, and elements that must remain exact.",
    audienceLabel: "Headline / CTA-safe composition", audiencePlaceholder: "Audience, headline location, CTA location, visual reading order, contrast needs, responsive crop, accessibility, and areas that must remain uncluttered.",
    sourceHint: "Optional: upload an approved product, campaign key visual, person, or environment reference to anchor the hero in real brand assets.", defaultAspect: "16:9", defaultCopySpace: "Large clean headline and CTA zone on the left", defaultCamera: "Wide responsive hero"
  },
  "campaign-creative-variation-generator": {
    title: "Campaign Creative Variation Studio", eyebrow: "Controlled reference-led test variation",
    briefPlaceholder: "Describe the approved base creative, the campaign and audience, the single dimension to vary, why it is being tested, what must remain identical, and the placement where the result will run.",
    subjectLabel: "Variation dimension", subjectOptions: optionList(["Composition", "Background / environment", "Subject emphasis", "Product scale", "Audience context", "Lighting / mood", "Copy-space location", "Custom single variable"], "Variable"),
    identityLabel: "Elements to hold constant", identityPlaceholder: "List the exact product, people, campaign motif, palette, visual style, offer cue, camera, crop, brand assets, and every element that must remain unchanged across the test.",
    audienceLabel: "Test intent / controlled change", audiencePlaceholder: "Hypothesis, audience, placement, one allowed visual change, guardrails, success metric context, and changes that would invalidate the comparison.",
    sourceHint: "Required: upload the approved campaign creative. This tool creates a controlled reference-led variation and is not a general rebrand generator.", defaultAspect: "4:5", defaultCopySpace: "Preserve source copy-safe area", defaultCamera: "Preserve source camera", requiresSource: true
  },
  "campaign-moodboard-art-direction-generator": {
    title: "Campaign Moodboard & Art-Direction Studio", eyebrow: "Curated visual direction board",
    briefPlaceholder: "Describe the campaign strategy, audience, big idea, emotional territory, product or service, brand character, subject matter, cultural context, channels, and what should make the art direction distinctive.",
    subjectLabel: "Board focus", subjectOptions: optionList(["Full campaign world", "Photography direction", "Product and material world", "People and casting direction", "Colour and lighting", "Environment and set design", "Graphic / composition language", "Custom from brief"], "Focus"),
    identityLabel: "Required visual ingredients", identityPlaceholder: "Brand colours, subjects, objects, product, materials, textures, environments, styling, references, distinctive assets, and explicit clichés or competitor codes to avoid.",
    audienceLabel: "Board hierarchy / application", audiencePlaceholder: "Audience emotion, narrative order, number of visual clusters, breathing room, channel uses, copy-safe thinking, production practicality, and approval questions.",
    sourceHint: "Optional: upload owned campaign references, product images, brand assets, research, materials, or approved photography to anchor the board.", defaultAspect: "16:9", defaultCopySpace: "No copy space needed", defaultCamera: "Editorial board overview"
  },
};

const ALL_MODEL_OPTIONS: Option[] = [
  { label: "M0", value: "M0", meta: "Private fast worker" },
  { label: "M1", value: "M1", meta: "Maximum detail" }, { label: "M2", value: "M2", meta: "Premium fast" },
  { label: "M3", value: "M3", meta: "Lucid campaigns" }, { label: "M4", value: "M4", meta: "Prompt precision" },
  { label: "M5", value: "M5", meta: "Best value" }, { label: "M6", value: "M6", meta: "Fast concept" },
];
const EDIT_MODEL_OPTIONS = ALL_MODEL_OPTIONS.filter((option) => option.value === "M1" || option.value === "M2");
const RESOLUTION_OPTIONS: Option[] = ["360p", "480p", "720p", "1080p"].map((value) => ({ label: value, value, meta: value === "1080p" ? "Highest" : value === "720p" ? "Recommended" : value === "480p" ? "Balanced" : "Preview" }));
const ASPECT_OPTIONS: Option[] = ["1:1", "16:9", "9:16", "4:5", "3:4", "4:3", "3:2", "2:3"].map((value) => ({ label: value, value, meta: value === "16:9" ? "Hero / board" : value === "4:5" ? "Social portrait" : value === "9:16" ? "Story" : value === "1:1" ? "Square" : "Format" }));
const STYLE_OPTIONS = optionList(["Premium campaign photography", "Editorial brand world", "Clean commercial", "Human documentary", "Cinematic", "Minimal luxury", "Bold contemporary", "Playful graphic", "Illustrated campaign", "Custom from brief"], "Style");
const PALETTE_OPTIONS = optionList(["Auto from brand", "Neutral premium", "Warm human", "Cool modern", "High contrast", "Muted editorial", "Rich saturated", "Monochrome", "Brand colours from brief", "Custom from brief"], "Palette");
const SETTING_OPTIONS = optionList(["Clean studio", "Real lifestyle environment", "Architectural interior", "Urban exterior", "Natural landscape", "Retail / service context", "Event / experience", "Abstract campaign world", "Preserve source setting", "Custom from brief"], "Setting");
const PEOPLE_OPTIONS = optionList(["No people", "Single person", "Two-person interaction", "Small authentic group", "Customer / user context", "Professional / team context", "Hands / partial human presence", "Preserve source people", "Custom from brief"], "People");
const LIGHTING_OPTIONS = optionList(["Soft natural daylight", "Controlled commercial daylight", "Warm human atmosphere", "High-key clean", "Cinematic directional", "Dramatic contrast", "Graphic colour light", "Preserve source lighting", "Custom from brief"], "Light");
const CAMERA_OPTIONS = optionList(["Premium campaign hero", "Immediate social focal point", "Wide responsive hero", "Environmental wide", "Natural eye level", "Close product detail", "Overhead graphic", "Preserve source camera", "Editorial board overview", "Custom from brief"], "Camera");
const COPY_SPACE_OPTIONS = optionList(["No copy space needed", "Clear headline and CTA space on the left", "Clear headline and CTA space on the right", "Large clean headline and CTA zone on the left", "Large clean headline and CTA zone on the right", "Large clean headline zone at the top", "Large clean footer zone", "Small copy-safe zone in the upper third", "Preserve source copy-safe area"], "Layout");
const FIDELITY_OPTIONS = optionList(["Strictly preserve the uploaded creative", "Preserve campaign and product identity; refine execution", "Preserve core subject and brand codes", "Creative concept from the brief", "Use reference only for mood and palette"], "Fidelity");
const CREDIT_MAP: Record<ImageModelKey, Record<ImageResolution, number>> = {
  M0: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 },
  M1: { "360p": 9, "480p": 11, "720p": 13, "1080p": 15 }, M2: { "360p": 5, "480p": 7, "720p": 8, "1080p": 9 },
  M3: { "360p": 8, "480p": 10, "720p": 12, "1080p": 13 }, M4: { "360p": 7, "480p": 9, "720p": 11, "1080p": 12 },
  M5: { "360p": 2, "480p": 3, "720p": 4, "1080p": 5 }, M6: { "360p": 2, "480p": 3, "720p": 3, "1080p": 4 },
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-semibold text-white">{children}{required ? <span className="ml-1 text-cyan-300">*</span> : null}</label>;
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
  link.download = filename.replace(/[^a-z0-9_.-]+/gi, "-") || "marketing-campaign-visual.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function MarketingCampaignImagePanel({ toolSlug }: { toolSlug: string }) {
  const config = PRESETS[toolSlug] || PRESETS["campaign-key-visual-generator"];
  const [sourceImage, setSourceImage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [permission, setPermission] = useState(false);
  const [projectBrief, setProjectBrief] = useState("");
  const [subjectType, setSubjectType] = useState(config.subjectOptions[0]?.value || "Custom from brief");
  const [campaignIdentity, setCampaignIdentity] = useState("");
  const [audienceMessage, setAudienceMessage] = useState("");
  const [visualStyle, setVisualStyle] = useState(STYLE_OPTIONS[0].value);
  const [palette, setPalette] = useState(PALETTE_OPTIONS[0].value);
  const [setting, setSetting] = useState(SETTING_OPTIONS[0].value);
  const [peoplePresence, setPeoplePresence] = useState(PEOPLE_OPTIONS[0].value);
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0].value);
  const [camera, setCamera] = useState(config.defaultCamera);
  const [copySafeLayout, setCopySafeLayout] = useState(config.defaultCopySpace);
  const [fidelityMode, setFidelityMode] = useState(FIDELITY_OPTIONS[1].value);
  const [customInstructions, setCustomInstructions] = useState("");
  const [model, setModel] = useState<ImageModelKey>("M5");
  const [resolution, setResolution] = useState<ImageResolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(config.defaultAspect);
  const [output, setOutput] = useState<GeneratedCampaignImage | null>(null);
  const [promptUsed, setPromptUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSourceImage(""); setSourceName(""); setPermission(false); setProjectBrief(""); setCampaignIdentity(""); setAudienceMessage(""); setCustomInstructions("");
    setSubjectType(config.subjectOptions[0]?.value || "Custom from brief"); setAspectRatio(config.defaultAspect); setCopySafeLayout(config.defaultCopySpace); setCamera(config.defaultCamera);
    setModel("M5"); setOutput(null); setPromptUsed(""); setError(""); setNotice("");
  }, [config, toolSlug]);

  const modelOptions = sourceImage ? EDIT_MODEL_OPTIONS : ALL_MODEL_OPTIONS;
  const creditEstimate = useMemo(() => CREDIT_MAP[model][resolution], [model, resolution]);
  const hasRequiredSource = !config.requiresSource || Boolean(sourceImage);
  const canGenerate = projectBrief.trim().length >= 12 && hasRequiredSource && (!sourceImage || permission) && !loading;
  const lineInput = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70";

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setOutput(null);
    if (!file.type.startsWith("image/")) { setError("Choose a PNG, JPG, JPEG, or WEBP image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Choose an image under 10 MB."); return; }
    try {
      setSourceImage(await readImageFile(file)); setSourceName(file.name); setPermission(false); setModel("M2");
      setCamera("Preserve source camera"); setFidelityMode("Preserve campaign and product identity; refine execution");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the image."); }
  }

  function clearImage() {
    setSourceImage(""); setSourceName(""); setPermission(false); setModel("M5");
    if (camera === "Preserve source camera") setCamera(config.defaultCamera);
  }

  async function generate() {
    if (!canGenerate) {
      if (config.requiresSource && !sourceImage) setError("Upload the approved base creative for this controlled variation tool.");
      else setError(sourceImage ? "Confirm permission and write a detailed creative brief." : "Write a creative brief with at least 12 characters.");
      return;
    }
    setLoading(true); setError(""); setNotice(""); setOutput(null);
    try {
      const response = await fetch("/api/image/marketing-campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, sourceImageDataUrl: sourceImage, projectBrief, subjectType, campaignIdentity, audienceMessage, visualStyle, palette, setting, peoplePresence, lighting, camera, copySafeLayout, fidelityMode, customInstructions, model, resolution, aspectRatio }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; details?: string; creditsCharged?: number; prompt?: string; image?: GeneratedCampaignImage } | null;
      if (!response.ok || !data?.ok || !data.image?.dataUrl) throw new Error(data?.details || data?.error || "Image generation failed.");
      setOutput(data.image); setPromptUsed(data.prompt || ""); setNotice(`Generated a professional campaign visual. Charged ${data.creditsCharged ?? creditEstimate} credits.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Image generation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="border-y border-white/15 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.13),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(59,130,246,.10),transparent_30%)]">
        <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,0.94fr)_minmax(480px,1.06fr)]">
          <section className="border-b border-white/15 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/80">{config.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{config.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Creative concept only. Verify product truth, claims, prices, offers, people permissions, brand rights, accessibility, platform rules, legal review, tracking, and final production before use.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-black text-white">{creditEstimate} credits</span>
            </div>

            <div className="mt-10 border-b border-white/15 pb-8">
              <div className="flex items-center justify-between gap-4"><FieldLabel required={config.requiresSource}>Reference image</FieldLabel>{sourceImage ? <button type="button" onClick={clearImage} className="text-xs font-bold text-slate-400 transition hover:text-white">Remove reference</button> : null}</div>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
                <label className="group relative grid min-h-32 flex-1 cursor-pointer place-items-center overflow-hidden border border-dashed border-white/25 bg-white/[0.025] transition hover:border-cyan-300/60 hover:bg-white/[0.045]">
                  {sourceImage ? <img src={sourceImage} alt="Uploaded campaign reference" className="h-44 w-full object-cover opacity-90" /> : <div className="px-6 text-center"><p className="text-sm font-black text-white">{config.requiresSource ? "Upload the approved base creative" : "Add an optional approved reference"}</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG, or WEBP · max 10 MB</p></div>}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <div className="sm:w-56"><p className="text-sm font-bold text-white">{sourceName || "No image selected"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{config.sourceHint}</p></div>
              </div>
              {sourceImage ? <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} className="mt-1 h-4 w-4 accent-cyan-500" /><span>I have permission to use this image and understand that products, people, locations, artwork, testimonials, and brand assets require appropriate rights and final approval.</span></label> : null}
            </div>

            <div className="mt-9">
              <FieldLabel required>Creative brief</FieldLabel>
              <textarea value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder={config.briefPlaceholder} className="mt-3 min-h-36 w-full resize-y border-0 border-b border-white/15 bg-transparent px-0 pb-5 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/70" />
            </div>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div><FieldLabel>{config.identityLabel}</FieldLabel><textarea value={campaignIdentity} onChange={(event) => setCampaignIdentity(event.target.value)} placeholder={config.identityPlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
              <div><FieldLabel>{config.audienceLabel}</FieldLabel><textarea value={audienceMessage} onChange={(event) => setAudienceMessage(event.target.value)} placeholder={config.audiencePlaceholder} className={`${lineInput} min-h-28 resize-y`} /></div>
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
                <ImageComposerDropdown label="Setting" value={setting} options={SETTING_OPTIONS} onChange={setSetting} />
              </div>
            </div>

            <details className="mt-7 border-t border-white/15 pt-5 text-sm">
              <summary className="cursor-pointer list-none font-black text-white"><span className="mr-2 text-cyan-300">＋</span>Professional controls</summary>
              <div className="mt-6 flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="People" value={peoplePresence} options={PEOPLE_OPTIONS} onChange={setPeoplePresence} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Lighting" value={lighting} options={LIGHTING_OPTIONS} onChange={setLighting} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Camera" value={camera} options={CAMERA_OPTIONS} onChange={setCamera} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Copy-safe layout" value={copySafeLayout} options={COPY_SPACE_OPTIONS} onChange={setCopySafeLayout} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Fidelity" value={fidelityMode} options={FIDELITY_OPTIONS} onChange={setFidelityMode} />
              </div>
              <div className="mt-6"><FieldLabel>Additional instructions</FieldLabel><textarea value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Optional: exact product appearance, people identity, visual motif, environment, product scale, platform crop, campaign continuity, variation guardrail, accessibility contrast, rights, or must-avoid elements." className={`${lineInput} min-h-24 resize-y`} /></div>
            </details>

            <div className="mt-9 border-t border-white/15 pt-6">
              <div className="flex flex-wrap items-center gap-y-3">
                <ImageComposerDropdown label="Model" value={model} options={modelOptions} onChange={(value) => setModel(value as ImageModelKey)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={(value) => setResolution(value as ImageResolution)} />
                <span className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
                <ImageComposerDropdown label="Ratio" value={aspectRatio} options={ASPECT_OPTIONS} onChange={(value) => setAspectRatio(value as ImageAspectRatio)} />
              </div>
              <button type="button" onClick={generate} disabled={!canGenerate} className="mt-7 w-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-cyan-950/40 transition hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "Art-directing the campaign visual…" : "Generate professional campaign visual"}</button>
              {error ? <p className="mt-4 text-sm font-semibold text-red-200">{error}</p> : null}
              {notice ? <p className="mt-4 text-sm font-semibold text-emerald-200">{notice}</p> : null}
            </div>
          </section>

          <section className="relative min-h-[620px] overflow-hidden bg-black/25 p-5 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.025),transparent_38%,rgba(34,211,238,.04))]" />
            <div className="relative flex h-full min-h-[560px] flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">Campaign output</p><p className="mt-1 text-sm text-slate-500">Brand-aware concept · professional verification required</p></div>{output ? <button type="button" onClick={() => downloadDataUrl(output.dataUrl, output.filename || `${toolSlug}.png`)} className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-black text-white transition hover:bg-white/[0.12]">Download PNG</button> : null}</div>
              <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.10),rgba(0,0,0,.38)_62%)]">
                {loading ? <div className="text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-cyan-300/15 border-t-cyan-200" /><p className="mt-5 text-sm font-black text-white">Resolving brand, subject, hierarchy, and light…</p><p className="mt-2 text-xs text-slate-500">The system is preserving campaign and reference constraints before styling.</p></div> : output ? <img src={output.dataUrl} alt="Generated marketing campaign visual" className="max-h-[720px] w-full object-contain" /> : <div className="max-w-sm px-8 text-center"><p className="text-lg font-black text-white">Your campaign visual will appear here</p><p className="mt-3 text-sm leading-6 text-slate-500">Use a precise brief, approved facts, controlled copy space, and reference assets when campaign identity must remain exact.</p></div>}
              </div>
              {output ? <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-slate-500"><span>{output.modelUsed || model}</span><span>{resolution}</span><span>{aspectRatio}</span><span>Concept only</span></div> : null}
              {promptUsed ? <details className="mt-4 border-t border-white/15 pt-4"><summary className="cursor-pointer text-xs font-black text-slate-400">Generation brief</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-500">{promptUsed}</p></details> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
