import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateCloudflareImageWithManualFailover } from "@/lib/image-tools/cloudflare-image-client";
import {
  getTextToImageCredits,
  IMAGE_ASPECT_RATIOS,
  IMAGE_MODEL_KEYS,
  IMAGE_RESOLUTIONS,
  type ImageAspectRatio,
  type ImageModelKey,
  type ImageResolution,
} from "@/lib/image-tools/image-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type FashionImageBody = {
  toolSlug?: string;
  sourceImageDataUrl?: string;
  projectBrief?: string;
  subjectType?: string;
  garmentDetails?: string;
  fitConstruction?: string;
  visualStyle?: string;
  palette?: string;
  materialBehavior?: string;
  setting?: string;
  poseMovement?: string;
  lighting?: string;
  camera?: string;
  copySafeLayout?: string;
  fidelityMode?: string;
  customInstructions?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
};

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };
type Preset = { name: string; instruction: string; style: "Photorealistic" | "Product photo" | "Digital art"; copySafe?: boolean; noPeople?: boolean; negativeAdditions?: string };

const PRESETS: Record<string, Preset> = {
  "outfit-concept-generator": {
    name: "Outfit Concept Generator", style: "Photorealistic",
    instruction: "Create one complete, wearable fashion look. Resolve garment hierarchy, layering, silhouette, colour balance, proportion, climate, occasion, footwear, accessories, comfort, movement, and styling restraint. Use only the requested garments and additions. The look must feel intentionally styled rather than costume-like, trend-stuffed, or body-shaming.",
    negativeAdditions: "random accessory pile, impossible layering, contradictory seasons, body shaming pose, garment clipping, unnecessary exposed skin, costume parody",
  },
  "fashion-editorial-generator": {
    name: "Fashion Editorial Generator", style: "Photorealistic", copySafe: true,
    instruction: "Create one magazine-grade fashion editorial image with a clear narrative, premium garment hierarchy, intentional model direction, controlled environment, sophisticated lighting, and publication-ready composition. Preserve garment design and body dignity. Make the image art-directed and specific, not a generic stock-fashion photograph.",
    negativeAdditions: "generic stock fashion, distorted anatomy, extreme beauty filter, identity drift, garment replaced by fantasy costume, random logo, magazine text",
  },
  "fashion-lookbook-image-generator": {
    name: "Fashion Lookbook Image Generator", style: "Photorealistic",
    instruction: "Create one consistent lookbook frame designed for product visibility and sequencing. Keep camera height, crop, backdrop, shadows, model direction, garment fit intent, styling, and colour treatment controlled. Show the requested product clearly and avoid editorial effects that hide construction or silhouette.",
    negativeAdditions: "cropped-off product, hidden garment, inconsistent backdrop, dramatic effect obscuring colour, unrelated accessories, extreme pose",
  },
  "fashion-collection-lineup-generator": {
    name: "Fashion Collection Lineup Generator", style: "Photorealistic",
    instruction: "Create one coherent collection lineup with multiple distinct looks shown at equal scale, consistent stance, readable silhouettes, deliberate colour progression, controlled spacing, and clear differences between garments. Preserve the supplied sequence and do not merge or duplicate looks. The lineup is a visual range review, not a crowd scene.",
    negativeAdditions: "duplicated model, duplicated look, merged garments, inconsistent scale, overlapping figures, crowded runway audience, unreadable silhouette, random look count",
  },
  "garment-flat-lay-generator": {
    name: "Garment Flat-Lay Generator", style: "Product photo", noPeople: true,
    instruction: "Create one professional true-overhead garment flat lay. Preserve garment shape, construction, print, colour, trims, and component count. Use believable fabric weight, controlled natural folds, clean spacing, correct orientation, realistic shadows, and product-ready styling. Do not distort the garment merely to make the composition decorative.",
    negativeAdditions: "person, body, mannequin, impossible sleeve position, missing garment part, extra pocket, extra button, warped print, floating accessory, cluttered prop styling",
  },
  "apparel-product-mockup-generator": {
    name: "Apparel Product Mockup Generator", style: "Product photo", copySafe: true, noPeople: true,
    instruction: "Create one premium apparel product mockup with accurate silhouette, panels, seams, collar, cuffs, hems, pockets, closures, trims, artwork placement, colourway, and material behaviour. Use a clean product presentation such as ghost mannequin, hanger, folded, or straight-on view as requested. Keep label and copy areas blank and text-free.",
    negativeAdditions: "person unless requested, fake logo, readable label, wrong artwork placement, asymmetrical construction, extra zipper, missing seam, floating garment, impossible ghost body",
  },
  "textile-pattern-generator": {
    name: "Textile Pattern Generator", style: "Digital art", noPeople: true,
    instruction: "Create one original textile pattern concept using the requested motif, repeat type, scale, density, palette, ground, directionality, and production context. For seamless repeats, make the tile visually continuous at every edge. For placement prints, preserve a clean garment-mapping logic. Avoid copying protected designs or named artists.",
    negativeAdditions: "garment mockup unless requested, person, visible tile seam, broken repeat, cropped motif at wrong edge, random motif, fake brand monogram, copied designer pattern, readable text",
  },
  "fashion-moodboard-generator": {
    name: "Fashion Moodboard Generator", style: "Digital art", noPeople: true,
    instruction: "Create one sophisticated editorial fashion moodboard with clear hierarchy, asymmetry, negative space, restrained image groups, tactile material fragments, silhouette direction, colour story, styling cues, craft details, and atmosphere. The board must communicate one coherent collection language and must not be an equal-box collage or retail catalog screenshot.",
    negativeAdditions: "equal square grid, cluttered collage, readable product labels, price tags, shopping screenshot, unrelated styles, excessive images, fake trend-report text",
  },
  "fashion-on-model-visual-generator": {
    name: "Fashion On-Model Visual Generator", style: "Photorealistic",
    instruction: "Create one professional on-model fashion visual. Preserve the garment's silhouette, material, colour, print, seams, closures, trims, length, layering, and fit intent. If the uploaded reference contains a person, preserve that person's facial geometry, apparent age, skin tone, body proportions, hair, distinctive features, and identity unless the user explicitly requests a permitted presentation change. Keep anatomy natural, body treatment respectful, and garment contact physically plausible.",
    negativeAdditions: "identity drift, changed ethnicity, changed age, changed body shape, changed skin tone, face replacement, extra limbs, missing fingers, fused hands, garment fused to skin, impossible neckline, body distortion, over-retouched skin",
  },
  "garment-detail-material-closeup-generator": {
    name: "Garment Detail & Material Close-Up Generator", style: "Product photo", noPeople: true,
    instruction: "Create one premium macro fashion detail image showing the requested fabric, stitch, seam, closure, embroidery, print, knit, hardware, wash, or finish. Preserve material structure, thread path, edge construction, component count, surface relief, sheen, thickness, and colour. Use realistic macro depth, tactile lighting, and a scale that communicates craftsmanship without fabricating technical proof.",
    negativeAdditions: "person, hand unless requested, fake fibre microscope image, extra stitches, impossible seam, melted hardware, repeated button, fake logo, text label, plastic fabric",
  },
};

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function cleanDataUrl(value: unknown) {
  const text = cleanText(value, 18_000_000);
  return /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(text) ? text : "";
}

function parseResolution(value: unknown): ImageResolution {
  return IMAGE_RESOLUTIONS.includes(value as ImageResolution) ? value as ImageResolution : "720p";
}

function parseAspectRatio(value: unknown): ImageAspectRatio {
  return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio) ? value as ImageAspectRatio : "4:5";
}

function parseModel(value: unknown, hasSource: boolean): ImageModelKey {
  const requested = IMAGE_MODEL_KEYS.includes(value as ImageModelKey) ? value as ImageModelKey : hasSource ? "M2" : "M5";
  return hasSource && requested !== "M1" && requested !== "M2" ? "M2" : requested;
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [value.message, value.details, value.hint, value.code].filter((item) => typeof item === "string" && item.trim()).join(" ");
    if (parts) return parts;
  }
  return String(error);
}

function userSafeProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (lower.includes("flagged") || lower.includes("provider rejected") || lower.includes("choose another prompt") || lower.includes("reference image combination")) {
    return "The image provider rejected this fashion brief or reference combination after automatic retry. Simplify the custom instructions or use a clearer source image.";
  }
  if (lower.includes("failed to fetch") || lower.includes("timeout")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildPrompt(body: FashionImageBody, preset: Preset, model: ImageModelKey, aspectRatio: ImageAspectRatio, hasSource: boolean) {
  const projectBrief = cleanText(body.projectBrief, 3600);
  const subjectType = cleanText(body.subjectType, 180);
  const garmentDetails = cleanText(body.garmentDetails, 2400);
  const fitConstruction = cleanText(body.fitConstruction, 2200);
  const visualStyle = cleanText(body.visualStyle, 180);
  const palette = cleanText(body.palette, 180);
  const materialBehavior = cleanText(body.materialBehavior, 180);
  const setting = cleanText(body.setting, 180);
  const poseMovement = cleanText(body.poseMovement, 180);
  const lighting = cleanText(body.lighting, 180);
  const camera = cleanText(body.camera, 180);
  const copySafeLayout = cleanText(body.copySafeLayout, 240);
  const fidelityMode = cleanText(body.fidelityMode, 260);
  const customInstructions = cleanText(body.customInstructions, 1400);

  const shared = [
    `Create exactly one ${aspectRatio} professional visual for ${preset.name}.`,
    preset.instruction,
    `Creative brief: ${projectBrief}.`,
    `Subject / format: ${subjectType || "Use the brief"}. Visual direction: ${visualStyle || "premium fashion"}. Palette: ${palette || "coordinated from the brief"}.`,
    garmentDetails ? `MANDATORY GARMENT OR PATTERN FIDELITY: ${garmentDetails}. Do not add, remove, duplicate, replace, recolour, or relocate visible garment components, print motifs, trims, closures, seams, or accessories unless explicitly requested.` : "No complete garment specification was supplied. Keep the result coherent but do not imply verified construction accuracy.",
    fitConstruction ? `FIT, CONSTRUCTION, IDENTITY, OR COMPOSITION DIRECTION: ${fitConstruction}.` : "Use respectful natural proportions, believable garment fit, and coherent construction.",
    `Material behaviour: ${materialBehavior || "appropriate to the requested garment"}. Setting: ${setting || "clean coordinated environment"}. Pose or object arrangement: ${poseMovement || (preset.noPeople ? "no person" : "natural fashion stance")}.`,
    `Lighting: ${lighting || "controlled professional fashion light"}. Camera: ${camera || "natural fashion perspective"}.`,
    preset.copySafe ? `COPY-SAFE COMPOSITION: ${copySafeLayout || "preserve deliberate clean space for later typography"}. Keep this area visually calm and empty. Do not render any readable text.` : `Composition note: ${copySafeLayout || "no copy space required"}.`,
    hasSource ? `REFERENCE FIDELITY: ${fidelityMode || "preserve garment and visible-person identity while refining presentation"}. The uploaded image is a mandatory visual reference. Preserve recognisable garment structure, artwork, colour, materials, body, face, age, skin tone, hair, distinctive features, product scale, and camera characteristics unless the brief explicitly authorizes change.` : `Creative fidelity: ${fidelityMode || "follow the brief precisely"}.`,
    customInstructions ? `Additional instructions: ${customInstructions}.` : "",
    "Professional fashion-image quality rules: believable garment construction; correct sleeve, collar, cuff, pocket, seam, hem, closure, panel, trim, print, embroidery, hardware, drape, stretch, fold, gravity, contact, shadow, reflection, and scale; natural anatomy where people appear; respectful body treatment; realistic hands and feet; coherent layering; no clipping through body or garments; no duplicate accessories; no random logos; no plastic fabric; no excessive beauty filtering; no body reshaping unless explicitly and permissibly requested.",
    "No readable text, logos, watermarks, fake labels, size tags, care labels, product codes, prices, certification marks, social UI, magazine copy, or technical dimensions. This is a creative concept requiring final design, pattern, grading, fit, material, rights, claims, and production review before commercial use.",
  ].filter(Boolean);

  if (model !== "M6") return shared.join("\n");
  return [shared[0], preset.instruction, `Brief: ${projectBrief}.`, `Subject: ${subjectType}. Style: ${visualStyle}. Palette: ${palette}. Material: ${materialBehavior}. Setting: ${setting}. Pose: ${poseMovement}. Light: ${lighting}. Camera: ${camera}.`, garmentDetails ? `Preserve exactly: ${garmentDetails}.` : "Keep garment coherent.", fitConstruction ? `Fit/identity/construction: ${fitConstruction}.` : "Natural proportions and believable construction.", preset.copySafe ? `Copy space: ${copySafeLayout}. No text.` : "No text or logos.", hasSource ? `Use uploaded reference with ${fidelityMode}.` : "Follow brief precisely.", "Premium fashion quality, accurate garment details, natural anatomy, coherent drape, no extra limbs, duplicate components, fake labels, or warped construction."].join("\n");
}

function negativePrompt(preset: Preset) {
  return [
    "wrong garment, missing garment component, extra sleeve, extra collar, extra pocket, extra zipper, extra button, missing closure, warped seam, broken hem, distorted print, stretched logo, duplicate accessory, duplicate garment, garment fused to body, garment clipping, floating garment, impossible fold, impossible drape, plastic fabric, melted hardware, wrong scale, asymmetry unless requested, extra limb, missing limb, fused arm, malformed hand, extra fingers, missing fingers, distorted face, identity drift, changed age, changed ethnicity, changed skin tone, changed body proportions, extreme retouching, body shaming, random nudity, fisheye, blur, low detail, oversaturation, text, watermark, logo, price, size label, care label, product code, certification, social UI",
    preset.noPeople ? "person, face, body, model" : "",
    preset.negativeAdditions || "",
  ].filter(Boolean).join(", ");
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;
    try { await supabase.rpc("refund_reserved_credits", { p_transaction_id: reservedTransactionId, p_reason: reason }); } catch {}
  }

  try {
    supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    const body = (await req.json()) as FashionImageBody;
    const toolSlug = cleanText(body.toolSlug, 120);
    const preset = PRESETS[toolSlug];
    if (!preset) return Response.json({ ok: false, error: "Unknown fashion or apparel image tool." }, { status: 400 });

    const projectBrief = cleanText(body.projectBrief, 3600);
    if (projectBrief.length < 12) return Response.json({ ok: false, error: "Creative brief must be at least 12 characters." }, { status: 400 });

    const sourceImageDataUrl = cleanDataUrl(body.sourceImageDataUrl);
    const hasSource = Boolean(sourceImageDataUrl);
    const resolution = parseResolution(body.resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio);
    const model = parseModel(body.model, hasSource);
    const prompt = buildPrompt(body, preset, model, aspectRatio, hasSource);
    const requiredCredits = getTextToImageCredits(model, resolution, 1);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: toolSlug,
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:${toolSlug}:${model}:${resolution}:${aspectRatio}:${randomUUID()}`,
    });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve image credits.", details: rpcErrorMessage(reserveResponse.error) }, { status: 500 });

    const reservation = reserveResponse.data as CreditReservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? requiredCredits, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });
    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await generateCloudflareImageWithManualFailover({
      prompt,
      negativePrompt: negativePrompt(preset),
      model,
      resolution,
      aspectRatio,
      style: preset.style,
      operation: hasSource ? "edit" : "generate",
      sourceImageDataUrl: hasSource ? sourceImageDataUrl : undefined,
      referenceImageDataUrl: hasSource ? sourceImageDataUrl : undefined,
    });

    const modelUsed = result.modelKey || model;
    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: hasSource ? "image:fashion-apparel-reference-edit:cloudflare-workers-ai" : "image:fashion-apparel-generation:cloudflare-workers-ai",
      p_model: `${model}->${modelUsed}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("fashion_apparel_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("fashion_apparel_spend_rejected");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 });
    }

    return Response.json({
      ok: true,
      toolSlug,
      prompt,
      modelRequested: model,
      modelUsed,
      resolution,
      aspectRatio,
      creditsCharged: requiredCredits,
      conceptOnly: true,
      verificationRequired: ["garment construction", "measurements", "fit", "grading", "fabric behaviour", "artwork rights", "claims", "production"],
      image: {
        dataUrl: result.dataUrl,
        filename: `${toolSlug}-${modelUsed}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        modelUsed,
      },
    });
  } catch (error) {
    await refundIfReserved("fashion_apparel_generation_failed");
    return Response.json({ ok: false, error: "Fashion or apparel image generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
