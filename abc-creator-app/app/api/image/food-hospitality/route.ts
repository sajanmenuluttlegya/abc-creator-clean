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

type FoodImageBody = {
  toolSlug?: string;
  sourceImageDataUrl?: string;
  projectBrief?: string;
  subjectType?: string;
  cuisineStyle?: string;
  visualStyle?: string;
  heroIngredients?: string;
  platingPackaging?: string;
  backgroundSurface?: string;
  lighting?: string;
  camera?: string;
  textSafeLayout?: string;
  fidelityMode?: string;
  customInstructions?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
};

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };
type Preset = { name: string; instruction: string; style: "Photorealistic" | "Product photo" | "Digital art"; textSafe?: boolean; negativeAdditions?: string };

const PRESETS: Record<string, Preset> = {
  "food-photography-generator": {
    name: "Food Photography Generator", style: "Product photo",
    instruction: "Create one premium editorial or commercial food photograph. Make the food physically believable, appetizing, fresh-looking, and faithful to the listed ingredients, portion, doneness, sauce, garnish, vessel, and serving context. Use realistic moisture, crumb, char, steam, gloss, bubbles, melt, condensation, and texture only where the brief supports them. The result must look photographed, not synthetic or over-retouched.",
    negativeAdditions: "plastic food, waxy food, raw-looking cooked meat, impossible steam, excessive oil shine, fake condensation, duplicate garnish, inedible decoration",
  },
  "dish-presentation-generator": {
    name: "Dish Presentation Generator", style: "Product photo",
    instruction: "Create one chef-led plating concept with clear component hierarchy, believable portion size, edible garnish, controlled sauce placement, practical serviceware, realistic food contact, intentional negative space, and a plating sequence that could plausibly be executed during service. Preserve every required component and do not replace ingredients merely for visual effect.",
    negativeAdditions: "inedible garnish, tiny unrealistic portion, excessive microgreens, random flowers, floating sauce, food balanced impossibly, components touching without logic, identical repeated dots",
  },
  "menu-hero-image-generator": {
    name: "Menu Hero Image Generator", style: "Product photo", textSafe: true,
    instruction: "Create one premium menu or campaign hero image with a strong food focal point, clear appetite appeal, refined environmental context, and intentional uncluttered negative space for later typography. Do not render any words. Keep the visual broad enough for website, printed menu, delivery, or launch use while remaining faithful to the named food and brand cues.",
  },
  "restaurant-poster-generator": {
    name: "Restaurant Poster Generator", style: "Product photo", textSafe: true,
    instruction: "Create one sophisticated restaurant promotional key visual for a poster. Build a bold but restrained hierarchy around the featured food, drink, chef moment, or dining experience. Reserve clean copy-safe space exactly as requested. The visual must work without generated typography and must not look like a generic stock photograph or overcrowded collage.",
    negativeAdditions: "poster text, fake headline, fake date, fake price, fake event logo, collage grid, stock-photo cliché",
  },
  "restaurant-social-creative-generator": {
    name: "Restaurant Social Creative Generator", style: "Product photo", textSafe: true,
    instruction: "Create one platform-ready restaurant social visual with an immediate focal point, recognisable food identity, premium colour and texture, crop resilience, and a deliberate area for later copy when requested. Keep the composition authentic to the venue and avoid generic influencer-style excess.",
    negativeAdditions: "fake social UI, username, hashtag text, engagement icons, phone mockup, overlaid caption, generic stock influencer pose",
  },
  "restaurant-interior-mood-image-generator": {
    name: "Restaurant Interior Mood Image Generator", style: "Photorealistic",
    instruction: "Create one premium hospitality atmosphere image connecting cuisine, guest occasion, service style, table setting, materials, lighting, spacing, and brand character. Show plausible restaurant circulation, believable furniture scale, coherent place settings, restrained occupancy, and food or beverage cues that support rather than overwhelm the interior. If a venue reference is supplied, preserve its architecture and perspective according to the fidelity instruction.",
    negativeAdditions: "warped room, blocked circulation, duplicate chairs, floating tableware, overcrowded tables, impossible table spacing, fake signage, restaurant text",
  },
  "recipe-illustration-generator": {
    name: "Recipe Illustration Generator", style: "Digital art",
    instruction: "Create one accurate editorial recipe illustration or step-support visual. Preserve the listed ingredients, layers, cuts, colours, vessels, and finished result. Use a coherent illustration language with clean hierarchy and publication-ready composition. Do not include labels, arrows, numbered steps, or readable text; those will be added separately in layout.",
    negativeAdditions: "wrong ingredients, invented garnish, labelled diagram, arrows, numbers, recipe text, childish clipart unless requested",
  },
  "food-packaging-concept-generator": {
    name: "Food Packaging Concept Generator", style: "Product photo", textSafe: true,
    instruction: "Create one premium food or beverage packaging concept visualization with believable structure, material thickness, seams, closures, windows, proportions, product fit, shelf presence, and front-panel hierarchy. Keep all label areas blank or abstract with no readable words, logos, nutrition facts, barcodes, claims, certifications, or legal marks. Treat the result as a structural and visual concept, not print-ready packaging.",
    negativeAdditions: "readable packaging text, fake logo, nutrition panel, barcode, certification mark, legal claim, impossible fold, leaking package, floating cap, distorted container",
  },
  "menu-cover-generator": {
    name: "Menu Cover Generator", style: "Digital art", textSafe: true,
    instruction: "Create one refined textless menu-cover visual expressing the restaurant's cuisine, atmosphere, price tier, material character, and first impression. Use elegant hierarchy, tactile detail, restrained symbolism, and the requested title-safe space. The cover should feel intentionally art-directed rather than like a generic food photograph pasted into a template.",
    negativeAdditions: "menu text, fake restaurant name, price, QR code, border template, generic clipart, overcrowded motif",
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
    return "The image provider rejected this food, packaging, or reference combination after automatic retry. Simplify the custom instructions or use a clearer source image.";
  }
  if (lower.includes("failed to fetch") || lower.includes("timeout")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildPrompt(body: FoodImageBody, preset: Preset, model: ImageModelKey, aspectRatio: ImageAspectRatio, hasSource: boolean) {
  const projectBrief = cleanText(body.projectBrief, 3600);
  const subjectType = cleanText(body.subjectType, 180);
  const cuisineStyle = cleanText(body.cuisineStyle, 180);
  const visualStyle = cleanText(body.visualStyle, 180);
  const heroIngredients = cleanText(body.heroIngredients, 2200);
  const platingPackaging = cleanText(body.platingPackaging, 2200);
  const backgroundSurface = cleanText(body.backgroundSurface, 180);
  const lighting = cleanText(body.lighting, 180);
  const camera = cleanText(body.camera, 180);
  const textSafeLayout = cleanText(body.textSafeLayout, 240);
  const fidelityMode = cleanText(body.fidelityMode, 240);
  const customInstructions = cleanText(body.customInstructions, 1200);

  const shared = [
    `Create exactly one ${aspectRatio} professional visual for ${preset.name}.`,
    preset.instruction,
    `Creative brief: ${projectBrief}.`,
    `Subject / format: ${subjectType || "Use the brief"}. Cuisine or culinary context: ${cuisineStyle || "Use the brief"}. Visual direction: ${visualStyle || "premium editorial"}.`,
    heroIngredients ? `MANDATORY FOOD OR PRODUCT FIDELITY: ${heroIngredients}. Do not add, remove, duplicate, or replace visible hero ingredients, components, packaging features, or portions unless explicitly requested.` : "No complete ingredient or component list was supplied. Keep the result visually plausible but do not imply verified recipe accuracy.",
    platingPackaging ? `Presentation, vessel, packaging, and styling direction: ${platingPackaging}.` : "Use restrained professional styling with believable portion, vessel, and product contact.",
    `Surface or environment: ${backgroundSurface || "coordinated from the brief"}. Lighting: ${lighting || "soft controlled editorial light"}. Camera: ${camera || "natural three-quarter view"}.`,
    preset.textSafe ? `TEXT-SAFE COMPOSITION: ${textSafeLayout || "preserve deliberate clean space for later typography"}. Keep this area visually calm and empty. Do not render any readable text.` : `Composition note: ${textSafeLayout || "no copy space required"}.`,
    hasSource ? `REFERENCE FIDELITY: ${fidelityMode || "preserve food, product, packaging, or venue identity while refining styling"}. The uploaded image is a mandatory visual reference. Preserve recognisable ingredient identity, product structure, vessel, portion, architecture, and camera characteristics unless the brief clearly authorizes change.` : `Creative fidelity: ${fidelityMode || "follow the brief precisely"}.`,
    customInstructions ? `Additional instructions: ${customInstructions}.` : "",
    "Professional food-image quality rules: physically believable food; recognisable ingredients; accurate cut, doneness, crumb, sauce, garnish, melt, char, moisture, steam, bubbles, condensation, and portion only where appropriate; real contact with plates, glassware, packaging, tables, and surfaces; coherent shadows and reflections; correct utensil and vessel scale; no duplicated hero item; no random garnish; no inedible decoration unless explicitly requested; no plastic texture; no oversaturation; no excessive sharpening; no impossible floating components.",
    "No readable text, logos, watermarks, fake restaurant names, prices, menu copy, nutrition facts, allergens, certifications, legal claims, UI, social interface, or QR codes. This is a creative concept requiring final chef, allergen, food-safety, brand, legal, packaging, and production review before commercial use.",
  ].filter(Boolean);

  if (model !== "M6") return shared.join("\n");
  return [shared[0], preset.instruction, `Brief: ${projectBrief}.`, `Subject: ${subjectType}. Cuisine: ${cuisineStyle}. Style: ${visualStyle}. Surface: ${backgroundSurface}. Light: ${lighting}. Camera: ${camera}.`, heroIngredients ? `Preserve exactly: ${heroIngredients}.` : "Keep ingredients plausible.", platingPackaging ? `Presentation: ${platingPackaging}.` : "Restrained professional styling.", preset.textSafe ? `Copy space: ${textSafeLayout}. No generated text.` : "No text or logos.", hasSource ? `Use uploaded reference with ${fidelityMode}.` : "Follow brief precisely.", "Real food texture, believable portion, coherent light, premium composition, no plastic food, duplicate garnish, fake labels, or floating objects."].join("\n");
}

function negativePrompt(preset: Preset) {
  return [
    "plastic food, waxy texture, fake food, incorrect ingredients, missing hero ingredient, invented garnish, duplicate dish, duplicate ingredient, duplicate utensil, floating food, food intersecting plate, impossible sauce, inedible decoration, malformed cutlery, warped plate, distorted glass, wrong scale, giant garnish, miniature portion, excessive microgreens, random flowers, burnt-looking food unless requested, raw-looking cooked food, unnatural steam, fake condensation, inconsistent shadow, bad reflection, oversaturated colour, neon food, over-sharpened, blur, low detail, fisheye, text, watermark, logo, menu words, price, QR code, nutrition label, allergen claim, certification, social UI",
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

    const body = (await req.json()) as FoodImageBody;
    const toolSlug = cleanText(body.toolSlug, 120);
    const preset = PRESETS[toolSlug];
    if (!preset) return Response.json({ ok: false, error: "Unknown food or hospitality image tool." }, { status: 400 });

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
      p_provider: hasSource ? "image:food-hospitality-reference-edit:cloudflare-workers-ai" : "image:food-hospitality-generation:cloudflare-workers-ai",
      p_model: `${model}->${modelUsed}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("food_hospitality_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("food_hospitality_spend_rejected");
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
      verificationRequired: ["ingredients", "portion", "allergens", "food safety", "brand approval", "legal copy", "packaging production"],
      image: {
        dataUrl: result.dataUrl,
        filename: `${toolSlug}-${modelUsed}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        modelUsed,
      },
    });
  } catch (error) {
    await refundIfReserved("food_hospitality_generation_failed");
    return Response.json({ ok: false, error: "Food or hospitality image generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
