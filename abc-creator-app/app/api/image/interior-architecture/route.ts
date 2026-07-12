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

type InteriorBody = {
  toolSlug?: string;
  sourceImageDataUrl?: string;
  projectBrief?: string;
  spatialFacts?: string;
  mustPreserve?: string;
  spaceType?: string;
  designStyle?: string;
  palette?: string;
  materials?: string;
  lighting?: string;
  budgetTier?: string;
  stylingDensity?: string;
  camera?: string;
  architectureMode?: string;
  customInstructions?: string;
  model?: ImageModelKey;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
};

type CreditReservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };

type Preset = {
  name: string;
  requiresImage: boolean;
  boardMode?: boolean;
  instruction: string;
  negativeAdditions?: string;
};

const PRESETS: Record<string, Preset> = {
  "ai-room-redesign-generator": {
    name: "AI Room Redesign Generator", requiresImage: true,
    instruction: "Redesign the photographed room as a believable, buildable-looking interior concept. Preserve the source perspective and all architecture demanded by the preservation controls. Improve zoning, circulation, furniture scale, storage, material coordination, and lighting without changing the identity of the space.",
  },
  "empty-room-furnisher": {
    name: "Empty Room Furnisher", requiresImage: true,
    instruction: "Furnish the photographed room with a complete but controlled arrangement. Use correctly scaled furniture, functional activity zones, clear door and window paths, believable wall contact, realistic floor contact, and enough negative space for circulation. Do not overfill the room.",
  },
  "kitchen-bathroom-design-generator": {
    name: "Kitchen & Bathroom Design Generator", requiresImage: true,
    instruction: "Create a premium kitchen or bathroom concept. Treat plumbing, drains, windows, doors, ventilation, appliances, and fixed shafts as preserved unless the brief explicitly allows conceptual relocation. Show realistic cabinetry, work zones, storage, wet-area materials, task lighting, and safe-looking circulation. This is a concept visualization, not a technical or code-compliance drawing.",
    negativeAdditions: "impossible plumbing, floating sink, blocked appliance doors, unusable work triangle, shower without drainage logic, unsafe wet electrical fixture",
  },
  "workspace-office-interior-generator": {
    name: "Workspace / Office Interior Generator", requiresImage: true,
    instruction: "Transform the photographed workspace into a professional environment with ergonomic desk placement, controlled glare, practical storage, acoustic awareness, video-call background quality, cable and power plausibility, clear circulation, and an appropriate balance of focus and collaboration zones.",
  },
  "exterior-facade-redesign-generator": {
    name: "Exterior & Facade Redesign Generator", requiresImage: true,
    instruction: "Redesign the photographed exterior as an architectural concept. Preserve massing, roof, floor count, openings, structural rhythm, setbacks, and site character unless broader conceptual change is explicitly selected. Coordinate facade materials, entry emphasis, shading, landscape, lighting, and signage-free identity with realistic weathering and scale.",
    negativeAdditions: "changed building footprint without instruction, impossible cantilever, missing structural support, blocked windows, fake signage, floating facade panels",
  },
  "interior-rendering-generator": {
    name: "Interior Rendering Generator", requiresImage: false,
    instruction: "Generate one polished photorealistic interior visualization from the supplied spatial facts. Create coherent room geometry, correct furniture scale, functional zoning, clear circulation, believable material transitions, realistic natural and artificial light, controlled styling, and professional architectural photography.",
  },
  "commercial-interior-generator": {
    name: "Commercial Interior Generator", requiresImage: false,
    instruction: "Generate one professional non-hospitality commercial interior concept. Express the business identity without readable logos. Resolve customer journey, staff operation, display or service zones, storage, queuing, privacy, accessibility-looking circulation, durable finishes, lighting hierarchy, and realistic commercial scale.",
  },
  "landscape-visualization-generator": {
    name: "Landscape Visualization Generator", requiresImage: false,
    instruction: "Generate one realistic outdoor-space concept with coherent levels, circulation, planting structure, seating, shade, privacy, drainage-aware-looking grading, lighting, boundaries, and climate-responsive character. Use plant forms appropriate to the stated climate only as a concept; exact species and irrigation require local professional verification.",
    negativeAdditions: "plants growing through paving, impossible root placement, blocked drainage, floating steps, unsafe edge, climate-inappropriate snow or tropical planting unless requested",
  },
  "interior-moodboard-generator": {
    name: "Interior Moodboard Generator", requiresImage: false, boardMode: true,
    instruction: "Create one sophisticated editorial interior moodboard on a clean presentation surface. Curate a restrained composition of furniture silhouettes, colour swatches, material fragments, lighting mood, textiles, art direction, and architectural references. The board must communicate one coherent design language with hierarchy and breathing room, not a cluttered grid of unrelated products.",
    negativeAdditions: "retail catalog screenshot, readable product labels, price tags, overcrowded collage, random disconnected styles",
  },
  "material-board-generator": {
    name: "Material Board Generator", requiresImage: false, boardMode: true,
    instruction: "Create one premium material and finish board on a clean presentation surface. Arrange coordinated timber, stone, tile, paint, textile, metal, glass, hardware, grout, and surface samples with realistic texture, thickness, sheen, edge detail, and undertone relationships. Keep the composition elegant, tactile, and professionally art-directed rather than boxed into equal tiles.",
    negativeAdditions: "readable brand labels, product codes, price tags, flat fake textures, identical square grid, excessive samples, disconnected undertones",
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

function parseModel(value: unknown, requiresImage: boolean): ImageModelKey {
  const requested = IMAGE_MODEL_KEYS.includes(value as ImageModelKey) ? value as ImageModelKey : requiresImage ? "M2" : "M5";
  return requiresImage && requested !== "M1" && requested !== "M2" ? "M2" : requested;
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
    return "The image provider rejected this spatial brief or reference combination after automatic retry. Simplify the custom instructions or use a clearer source image.";
  }
  if (lower.includes("failed to fetch") || lower.includes("timeout")) return "The image request timed out or the provider connection dropped. Try again.";
  return raw;
}

function buildPrompt(body: InteriorBody, preset: Preset, model: ImageModelKey, aspectRatio: ImageAspectRatio) {
  const projectBrief = cleanText(body.projectBrief, 3200);
  const spatialFacts = cleanText(body.spatialFacts, 1800);
  const mustPreserve = cleanText(body.mustPreserve, 1800);
  const spaceType = cleanText(body.spaceType, 160);
  const designStyle = cleanText(body.designStyle, 160);
  const palette = cleanText(body.palette, 160);
  const materials = cleanText(body.materials, 200);
  const lighting = cleanText(body.lighting, 160);
  const budgetTier = cleanText(body.budgetTier, 120);
  const stylingDensity = cleanText(body.stylingDensity, 120);
  const camera = cleanText(body.camera, 160);
  const architectureMode = cleanText(body.architectureMode, 240);
  const customInstructions = cleanText(body.customInstructions, 1000);

  const shared = [
    `Create exactly one ${aspectRatio} professional design visualization for ${preset.name}.`,
    preset.instruction,
    `Project / space type: ${spaceType || "Use the brief"}.`,
    `Project brief: ${projectBrief}.`,
    spatialFacts ? `Confirmed spatial facts and measurements: ${spatialFacts}. Do not invent missing dimensions.` : "No verified dimensions were supplied; use visually plausible relative scale only and do not imply measured accuracy.",
    mustPreserve ? `Mandatory preservation and inclusion rules: ${mustPreserve}.` : "Preserve all visible fixed architecture and avoid unnecessary changes.",
    preset.requiresImage ? `Architecture-change control: ${architectureMode || "Preserve geometry and openings; change finishes, furniture, and lighting only"}.` : "Resolve geometry coherently from the brief without creating impossible or overlapping architecture.",
    `Design language: ${designStyle || "coherent contemporary"}. Palette: ${palette || "coordinated from the brief"}. Materials: ${materials || "realistic and coordinated"}.`,
    `Lighting: ${lighting || "balanced realistic light"}. Budget character: ${budgetTier || "mid-range"}. Styling density: ${stylingDensity || "balanced"}.`,
    `Camera and composition: ${camera || "natural architectural perspective"}. Keep verticals believable, lens distortion controlled, horizon stable, and scale readable.`,
    customInstructions ? `Additional instructions: ${customInstructions}.` : "",
    "Professional spatial quality rules: clear doors and windows; unobstructed primary circulation; furniture and fixtures sit on real surfaces; no overlaps; no floating objects; plausible wall thickness, ceiling, floor, corners, reflections, shadows, material joins, and human scale; no duplicate focal objects; no excessive decorative clutter.",
    preset.boardMode ? "Use visual hierarchy, asymmetry, negative space, tactile realism, and a presentation-ready editorial composition. Do not render a room unless the board brief explicitly asks for a small contextual vignette." : "Render as premium architectural/interior photography with believable materials, realistic depth, coherent styling, controlled highlights, and no people unless explicitly required by the brief.",
    "No readable text, logos, watermarks, dimensions, labels, product codes, price tags, UI, floor-plan annotations, or fake professional seals. The result is concept visualization only, not construction documentation or proof of code compliance.",
  ].filter(Boolean);

  if (model !== "M6") return shared.join("\n");
  return [shared[0], preset.instruction, `Brief: ${projectBrief}.`, `Space: ${spaceType}. Style: ${designStyle}. Palette: ${palette}. Materials: ${materials}. Light: ${lighting}.`, mustPreserve ? `Preserve: ${mustPreserve}.` : "Preserve fixed architecture.", "Realistic scale, clear circulation, coherent geometry, premium materials, professional composition, no text or logos."].join("\n");
}

function negativePrompt(preset: Preset) {
  return [
    "impossible room geometry, warped walls, bent verticals, sloping floor, duplicate doors, duplicate windows, blocked door, blocked window, floating furniture, furniture through walls, intersecting objects, incorrect scale, giant furniture, miniature furniture, unusable circulation, clutter overload, random decor, disconnected style, fake material, plastic texture, repeated object, bad reflection, inconsistent shadow, overexposure, fisheye distortion, blurry, low detail, illustration, anime, cartoon, text, watermark, logo, price tag, product label, UI, people unless requested",
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

    const body = (await req.json()) as InteriorBody;
    const toolSlug = cleanText(body.toolSlug, 120);
    const preset = PRESETS[toolSlug];
    if (!preset) return Response.json({ ok: false, error: "Unknown interior or architecture image tool." }, { status: 400 });

    const projectBrief = cleanText(body.projectBrief, 3200);
    if (projectBrief.length < 12) return Response.json({ ok: false, error: "Project brief must be at least 12 characters." }, { status: 400 });

    const sourceImageDataUrl = cleanDataUrl(body.sourceImageDataUrl);
    if (preset.requiresImage && !sourceImageDataUrl) return Response.json({ ok: false, error: "Upload a valid PNG, JPG, JPEG, or WEBP reference image." }, { status: 400 });

    const resolution = parseResolution(body.resolution);
    const aspectRatio = parseAspectRatio(body.aspectRatio);
    const model = parseModel(body.model, preset.requiresImage);
    const prompt = buildPrompt(body, preset, model, aspectRatio);
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
      style: preset.boardMode ? "Product photo" : "Photorealistic",
      operation: preset.requiresImage ? "edit" : "generate",
      sourceImageDataUrl: preset.requiresImage ? sourceImageDataUrl : undefined,
      referenceImageDataUrl: preset.requiresImage ? sourceImageDataUrl : undefined,
    });

    const modelUsed = result.modelKey || model;
    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: preset.requiresImage ? "image:interior-reference-edit:cloudflare-workers-ai" : "image:interior-generation:cloudflare-workers-ai",
      p_model: `${model}->${modelUsed}`,
    });
    if (spendResponse.error) {
      await refundIfReserved("interior_architecture_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize image credit spend.", details: rpcErrorMessage(spendResponse.error) }, { status: 500 });
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("interior_architecture_spend_rejected");
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
      verificationRequired: ["measurements", "site conditions", "structure", "services", "accessibility", "local code"],
      image: {
        dataUrl: result.dataUrl,
        filename: `${toolSlug}-${modelUsed}-${resolution}-${aspectRatio.replace(":", "x")}.png`,
        width: result.width,
        height: result.height,
        modelUsed,
      },
    });
  } catch (error) {
    await refundIfReserved("interior_architecture_generation_failed");
    return Response.json({ ok: false, error: "Interior or architecture image generation failed.", details: userSafeProviderError(error) }, { status: 500 });
  }
}
