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

type CampaignImageBody = {
  toolSlug?: string;
  sourceImageDataUrl?: string;
  projectBrief?: string;
  subjectType?: string;
  campaignIdentity?: string;
  audienceMessage?: string;
  visualStyle?: string;
  palette?: string;
  setting?: string;
  peoplePresence?: string;
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
type Preset = { name: string; instruction: string; style: "Photorealistic" | "Product photo" | "Digital art"; copySafe?: boolean; requiresSource?: boolean; negativeAdditions?: string };

const PRESETS: Record<string, Preset> = {
  "campaign-key-visual-generator": {
    name: "Campaign Key Visual Generator", style: "Photorealistic", copySafe: true,
    instruction: "Create one distinctive master campaign key visual with a clear focal subject, ownable brand world, coherent emotional idea, strong visual hierarchy, controlled product or service cues, refined composition, and deliberate space for later campaign typography. The image must be extensible across channels, not a generic stock advertisement or a finished text-heavy poster.",
    negativeAdditions: "generic stock advertisement, crowded collage, fake headline, campaign slogan text, random brand colour, unrelated prop, duplicated product, visual cliché",
  },
  "multi-channel-campaign-creative-generator": {
    name: "Multi-Channel Campaign Creative Generator", style: "Photorealistic", copySafe: true,
    instruction: "Create one placement-aware campaign visual that preserves the approved master campaign identity while adapting composition, crop resilience, focal hierarchy, subject scale, and copy-safe area to the selected channel. Keep the campaign recognisable across formats and do not redesign the brand or introduce unrelated creative ideas.",
    negativeAdditions: "campaign identity drift, wrong product, unrelated concept, fake platform UI, text overlay, arbitrary redesign, important subject outside crop-safe zone",
  },
  "campaign-social-creative-generator": {
    name: "Campaign Social Creative Generator", style: "Photorealistic", copySafe: true,
    instruction: "Create one premium mobile-first campaign social visual with an immediate but credible focal point, recognisable product or brand identity, authentic audience context, controlled visual tension, crop resilience, and a deliberate calm area for later copy. Avoid clickbait, fake engagement devices, generic influencer styling, and platform-interface imitation.",
    negativeAdditions: "fake social UI, username, engagement icons, hashtag text, notification badge, clickbait arrow, shocked influencer face, generic stock social ad",
  },
  "campaign-email-landing-hero-generator": {
    name: "Campaign Email & Landing Hero Generator", style: "Photorealistic", copySafe: true,
    instruction: "Create one premium responsive hero visual for an email or landing page. Build a clear product, service, human-outcome, or campaign focal point with strong directional flow toward the requested headline and CTA area. Preserve large uncluttered copy space, responsive crop safety, believable scale, accessible visual contrast, and coherent campaign identity. Do not render interface elements or text.",
    negativeAdditions: "website mockup, browser chrome, email UI, fake CTA button, fake headline, tiny focal subject, cluttered copy zone, important content at crop edge",
  },
  "campaign-creative-variation-generator": {
    name: "Campaign Creative Variation Generator", style: "Photorealistic", copySafe: true, requiresSource: true,
    instruction: "Create one controlled variation of the uploaded approved campaign creative. Change only the single requested visual dimension and preserve every stated constant, including campaign concept, product, people, brand codes, palette, composition logic, offer cues, copy-safe zone, camera characteristics, and production quality. The result must be suitable for a disciplined creative test, not a loose reinterpretation.",
    negativeAdditions: "multiple simultaneous changes, campaign redesign, changed product, changed person identity, changed palette unless tested, changed copy-space location unless tested, altered offer cue, unrelated background",
  },
  "campaign-moodboard-art-direction-generator": {
    name: "Campaign Moodboard & Art-Direction Generator", style: "Digital art",
    instruction: "Create one sophisticated editorial campaign art-direction board with a clear visual thesis, asymmetrical hierarchy, breathing room, restrained clusters, campaign subject direction, colour and lighting language, texture, environment, photography or illustration cues, casting direction where relevant, composition principles, and production practicality. It must feel curated and decision-ready, not like an equal-box collage or retail inspiration grid.",
    negativeAdditions: "equal square grid, cluttered collage, shopping screenshot, readable labels, price tags, unrelated styles, excessive image count, fake trend-report text",
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
  return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio) ? value as ImageAspectRatio : "16:9";
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
    return "The image provider rejected this campaign brief or reference combination after automatic retry. Simplify the custom instructions or use a clearer approved source image.";
  }
  if (lower.includes("failed to fetch") || lower.includes("timeout")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildPrompt(body: CampaignImageBody, preset: Preset, model: ImageModelKey, aspectRatio: ImageAspectRatio, hasSource: boolean) {
  const projectBrief = cleanText(body.projectBrief, 3600);
  const subjectType = cleanText(body.subjectType, 180);
  const campaignIdentity = cleanText(body.campaignIdentity, 2400);
  const audienceMessage = cleanText(body.audienceMessage, 2200);
  const visualStyle = cleanText(body.visualStyle, 180);
  const palette = cleanText(body.palette, 180);
  const setting = cleanText(body.setting, 180);
  const peoplePresence = cleanText(body.peoplePresence, 180);
  const lighting = cleanText(body.lighting, 180);
  const camera = cleanText(body.camera, 180);
  const copySafeLayout = cleanText(body.copySafeLayout, 260);
  const fidelityMode = cleanText(body.fidelityMode, 260);
  const customInstructions = cleanText(body.customInstructions, 1400);

  const shared = [
    `Create exactly one ${aspectRatio} professional visual for ${preset.name}.`,
    preset.instruction,
    `Creative brief: ${projectBrief}.`,
    `Subject / placement / test dimension: ${subjectType || "Use the brief"}. Visual direction: ${visualStyle || "premium campaign"}. Palette: ${palette || "coordinated from the brief"}.`,
    campaignIdentity ? `MANDATORY CAMPAIGN, PRODUCT, SERVICE, OR BRAND FIDELITY: ${campaignIdentity}. Do not add, remove, duplicate, replace, recolour, rebrand, resize misleadingly, or relocate mandatory products, people, distinctive assets, visual motifs, or approved campaign elements unless explicitly requested.` : "No complete campaign-identity specification was supplied. Keep the result coherent but do not imply exact product, offer, or brand accuracy.",
    audienceMessage ? `AUDIENCE, MESSAGE, HIERARCHY, AND COPY-SPACE DIRECTION: ${audienceMessage}.` : "Use one clear focal hierarchy and reserve appropriate calm space for later professionally typeset copy.",
    `Setting: ${setting || "coordinated campaign environment"}. People: ${peoplePresence || "as required by the brief"}. Lighting: ${lighting || "controlled professional campaign light"}. Camera: ${camera || "premium campaign perspective"}.`,
    preset.copySafe ? `COPY-SAFE COMPOSITION: ${copySafeLayout || "preserve deliberate clean space for later typography"}. Keep this area visually calm, high-contrast where appropriate, and free of important subject detail. Do not render any readable text.` : `Composition note: ${copySafeLayout || "no copy space required"}.`,
    hasSource ? `REFERENCE FIDELITY: ${fidelityMode || "preserve campaign, product, brand, and visible-person identity while refining execution"}. The uploaded image is a mandatory approved visual reference. Preserve recognisable product structure, packaging, service cues, campaign identity, palette, people, face, apparent age, skin tone, body proportions, hair, distinctive features, environment, scale, and camera characteristics unless the brief explicitly authorizes a specific change.` : `Creative fidelity: ${fidelityMode || "follow the brief precisely"}.`,
    customInstructions ? `Additional instructions: ${customInstructions}.` : "",
    "Professional campaign-image quality rules: one clear idea; believable product, service, people, environment, materials, gravity, contact, anatomy, shadows, reflections, perspective, and scale; authentic audience context; coherent brand world; crop resilience; accessible visual hierarchy; no duplicate product; no misleading product size; no fabricated result demonstration; no fake testimonial; no unsupported before-and-after claim; no random logo; no excessive beauty filtering; no identity drift; no body reshaping; no visual clutter in copy-safe zones.",
    "No readable text, slogans, headlines, prices, discount percentages, dates, claims, testimonials, logos, watermarks, certification marks, QR codes, fake platform UI, social metrics, browser interface, email interface, CTA buttons, or legal copy. This is a creative concept requiring final product, claim, rights, privacy, accessibility, brand, platform, legal, tracking, and production review before commercial use.",
  ].filter(Boolean);

  if (model !== "M6") return shared.join("\n");
  return [shared[0], preset.instruction, `Brief: ${projectBrief}.`, `Subject: ${subjectType}. Style: ${visualStyle}. Palette: ${palette}. Setting: ${setting}. People: ${peoplePresence}. Light: ${lighting}. Camera: ${camera}.`, campaignIdentity ? `Preserve exactly: ${campaignIdentity}.` : "Keep campaign identity coherent.", audienceMessage ? `Hierarchy and copy space: ${audienceMessage}.` : "Clear focal hierarchy.", preset.copySafe ? `Copy space: ${copySafeLayout}. No text.` : "No text or logos.", hasSource ? `Use uploaded approved reference with ${fidelityMode}.` : "Follow brief precisely.", "Premium campaign quality, truthful product appearance, natural people, coherent brand world, no fake claims, duplicate products, text, UI, or identity drift."].join("\n");
}

function negativePrompt(preset: Preset) {
  return [
    "generic stock advertisement, wrong product, distorted product, misleading scale, missing product component, duplicate product, duplicate person, duplicate object, random logo, fake brand, fake testimonial, fake result, unsupported before after, false scarcity, price, discount, date, headline, slogan, body copy, CTA button, QR code, certification mark, legal claim, watermark, social UI, email UI, browser UI, engagement icons, username, notification badge, cluttered copy area, visual noise, floating object, impossible contact, warped packaging, bad reflection, inconsistent shadow, fisheye, blur, low detail, oversaturation, extra limb, missing limb, malformed hand, extra fingers, distorted face, identity drift, changed age, changed ethnicity, changed skin tone, changed body proportions, extreme retouching, body shaming",
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

    const body = (await req.json()) as CampaignImageBody;
    const toolSlug = cleanText(body.toolSlug, 120);
    const preset = PRESETS[toolSlug];
    if (!preset) return Response.json({ ok: false, error: "Unknown marketing campaign image tool." }, { status: 400 });

    const projectBrief = cleanText(body.projectBrief, 3600);
    if (projectBrief.length < 12) return Response.json({ ok: false, error: "Creative brief must be at least 12 characters." }, { status: 400 });

    const sourceImageDataUrl = cleanDataUrl(body.sourceImageDataUrl);
    const hasSource = Boolean(sourceImageDataUrl);
    if (preset.requiresSource && !hasSource) return Response.json({ ok: false, error: "This controlled campaign variation tool requires an approved source creative." }, { status: 400 });

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
      p_provider: hasSource ? "image:marketing-campaign-reference-edit:cloudflare-workers-ai" : "image:marketing-campaign-generation:cloudflare-workers-ai",
      p_model: `${model}->${modelUsed}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("marketing_campaign_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("marketing_campaign_spend_rejected");
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
      verificationRequired: ["product truth", "claims", "offer terms", "people permissions", "brand rights", "accessibility", "platform rules", "legal review", "tracking", "production"],
      image: {
        dataUrl: result.dataUrl,
        filename: `${toolSlug}-${modelUsed}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        modelUsed,
      },
    });
  } catch (error) {
    await refundIfReserved("marketing_campaign_generation_failed");
    return Response.json({ ok: false, error: "Marketing campaign image generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
