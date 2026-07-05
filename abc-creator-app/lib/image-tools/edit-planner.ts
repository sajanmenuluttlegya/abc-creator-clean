export type PremiumEditCategory =
  | "face-hair"
  | "face-feature"
  | "hairstyle"
  | "expression"
  | "body-retouch"
  | "clothing"
  | "accessory-jewelry"
  | "background"
  | "sky-weather-season"
  | "object-add-remove"
  | "object-replace"
  | "color-change"
  | "lighting"
  | "shadow-reflection"
  | "depth-blur-focus"
  | "pose-composition"
  | "crop-resize-reframe"
  | "canvas-expand-outpaint"
  | "perspective-lens"
  | "style-change"
  | "filter-effects"
  | "text-edit"
  | "layout-graphic-design"
  | "product-material"
  | "cleanup-restoration"
  | "quality-upscale-sharpen"
  | "cutout-mask-transparency"
  | "collage-overlay-sticker"
  | "general";

export type PremiumEditPlan = {
  category: PremiumEditCategory;
  targetSubject: string;
  localChangeZone: string;
  requestedChange: string;
  preserve: string[];
  avoid: string[];
  strength: "minimal-change" | "moderate-change" | "broad-change";
};

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function classifyEditRequest(input: string): PremiumEditCategory {
  const text = input.toLowerCase();

  if (/(crop|resize|reframe|aspect ratio|square|portrait ratio|landscape ratio|make it wider|make it taller)/i.test(text)) return "crop-resize-reframe";
  if (/(extend|expand|outpaint|fill outside|make canvas bigger|uncrop|zoom out)/i.test(text)) return "canvas-expand-outpaint";
  if (/(upscale|sharpen|enhance quality|increase resolution|deblur|clearer|high resolution|restore detail)/i.test(text)) return "quality-upscale-sharpen";
  if (/(restore|scratch|dust|stain|old photo|repair|crease|tear|damage|remove noise|denoise)/i.test(text)) return "cleanup-restoration";
  if (/(transparent|cut out|cutout|mask|alpha|remove background|isolate subject)/i.test(text)) return "cutout-mask-transparency";
  if (/(blur|bokeh|depth of field|focus|background blur|tilt shift|shallow depth)/i.test(text)) return "depth-blur-focus";
  if (/(perspective|straighten|horizon|lens|fisheye|wide angle|distortion|vanishing point)/i.test(text)) return "perspective-lens";
  if (/(shadow|reflection|contact shadow|mirror|gloss reflection|cast shadow)/i.test(text)) return "shadow-reflection";
  if (/(sky|weather|rain|snow|fog|cloud|season|summer|winter|autumn|spring|day to night|night to day)/i.test(text)) return "sky-weather-season";
  if (/(sticker|overlay|frame|border|collage|layer|badge|emoji|graphic element)/i.test(text)) return "collage-overlay-sticker";
  if (/(layout|template|grid|spacing|align|margin|flyer layout|poster layout|social post layout)/i.test(text)) return "layout-graphic-design";
  if (/(filter|effect|vintage|retro|vhs|grain|cinematic grade|duotone|glitch|film look)/i.test(text)) return "filter-effects";

  if (/(remove|delete|erase|get rid of|clean[- ]?shave|shave).*(beard|moustache|mustache|facial hair)|\b(no beard|no moustache|no mustache|beardless|clean shaven)\b/i.test(text)) return "face-hair";
  if (/(eyes|eye color|nose|lips|mouth|teeth|jaw|chin|cheeks|skin|wrinkle|scar|freckle|makeup|glasses)/i.test(text)) return "face-feature";
  if (/(hair|hairstyle|haircut|long hair|short hair|curly hair|straight hair|bald|bangs|fringe)/i.test(text)) return "hairstyle";
  if (/(smile|angry|sad|expression|happy|serious|laugh|frown|eyes open|eyes closed)/i.test(text)) return "expression";
  if (/(body|waist|muscle|slim|taller|shorter|posture|shoulder|arm|leg|fitness|shape)/i.test(text)) return "body-retouch";
  if (/(shirt|dress|jacket|hoodie|clothes|clothing|outfit|suit|tie|uniform|pants|shoes|hat|cap|armor)/i.test(text)) return "clothing";
  if (/(jewelry|jewellery|necklace|ring|earring|watch|bracelet|tattoo|piercing|bag|purse|sunglasses|accessory)/i.test(text)) return "accessory-jewelry";
  if (/(background|room|wall|scene|environment|replace background)/i.test(text)) return "background";
  if (/(replace|swap|change).*(with|into|to)/i.test(text)) return "object-replace";
  if (/(add|remove|delete|erase|put|insert|take out|hide|show)/i.test(text)) return "object-add-remove";
  if (/(text|word|letter|caption|sign|logo|label|typography|written)/i.test(text)) return "text-edit";
  if (/(brighter|darker|lighting|sunlight|neon|glow|contrast|exposure|mood)/i.test(text)) return "lighting";
  if (/(pose|standing|sitting|turn|angle|camera|zoom|composition|framing|move|position)/i.test(text)) return "pose-composition";
  if (/(metal|wood|glass|leather|fabric|plastic|matte|glossy|texture|material|product|packaging|label)/i.test(text)) return "product-material";
  if (/(color|colour|red|blue|green|black|white|gold|pink|purple|yellow|orange|silver|brown|grey|gray)/i.test(text)) return "color-change";
  if (/(style|anime|photorealistic|realistic|cartoon|manga|cinematic|watercolor|oil painting|3d|pixel|sketch|vector)/i.test(text)) return "style-change";

  return "general";
}

function commonPreserve() {
  return [
    "same main subject or main object identity",
    "same visible identity cues and recognizable appearance",
    "same pose and spatial placement unless explicitly changed",
    "same camera angle and perspective unless explicitly changed",
    "same framing and crop unless explicitly changed",
    "same lighting direction unless explicitly changed",
    "same clothing, materials, and colors unless explicitly changed",
    "same background and environment unless explicitly changed",
    "same object arrangement unless explicitly changed",
    "same overall composition unless explicitly changed",
  ];
}

function commonAvoid() {
  return [
    "different main subject",
    "different main object",
    "different scene",
    "unrequested background change",
    "unrequested clothing change",
    "unrequested color change",
    "extra people or duplicate subjects",
    "distorted details",
    "warped structure",
    "unwanted props",
    "full scene rewrite",
    "identity drift",
  ];
}

function planBase(params: {
  category: PremiumEditCategory;
  targetSubject: string;
  localChangeZone: string;
  requestedChange: string;
  preserve?: string[];
  avoid?: string[];
  strength?: PremiumEditPlan["strength"];
}): PremiumEditPlan {
  return {
    category: params.category,
    targetSubject: params.targetSubject,
    localChangeZone: params.localChangeZone,
    requestedChange: params.requestedChange,
    preserve: unique(params.preserve || commonPreserve()),
    avoid: unique([...(params.avoid || commonAvoid())]),
    strength: params.strength || "minimal-change",
  };
}

export function buildPremiumEditPlan(userEditPrompt: string): PremiumEditPlan {
  const cleaned = normalizeText(userEditPrompt);
  const category = classifyEditRequest(cleaned);
  const preserve = commonPreserve();
  const avoid = commonAvoid();

  const simple: Record<string, { targetSubject: string; localChangeZone: string; strength?: PremiumEditPlan["strength"]; avoid?: string[]; preserve?: string[] }> = {
    "face-hair": { targetSubject: "main person or animal if the selected image contains one", localChangeZone: "only the hair or facial-hair region mentioned by the request", avoid: [...avoid, "new subject", "different hairstyle unless requested", "changed clothing", "changed background objects"] },
    "face-feature": { targetSubject: "main face or visible character face", localChangeZone: "only the named facial feature or skin region", avoid: [...avoid, "different face identity", "changed hair", "changed clothing", "changed background"] },
    "hairstyle": { targetSubject: "main person or character", localChangeZone: "hair and head region only", avoid: [...avoid, "changed face identity", "changed clothing", "changed background", "changed pose"] },
    "expression": { targetSubject: "main face or character expression", localChangeZone: "expression region only: eyes, eyebrows, cheeks, mouth, and surrounding face", avoid: [...avoid, "changed hairstyle", "changed clothing", "changed background", "changed pose"] },
    "body-retouch": { targetSubject: "body, posture, limb, or silhouette region requested by the user", localChangeZone: "only the named body or posture region", avoid: [...avoid, "different identity", "changed clothing unless requested", "unrealistic anatomy"] },
    "clothing": { targetSubject: "requested clothing or outfit area", localChangeZone: "clothing, accessory, outfit, or wearable region only", avoid: [...avoid, "changed face", "changed hair", "changed background", "changed body pose"] },
    "accessory-jewelry": { targetSubject: "requested accessory, jewelry, tattoo, bag, glasses, or wearable detail", localChangeZone: "only the accessory or wearable-detail area", avoid: [...avoid, "changed face", "changed clothing beyond the accessory", "changed background"] },
    "background": { targetSubject: "background or environment while preserving the foreground subject", localChangeZone: "background, wall, sky, room, or environment only", strength: "moderate-change", preserve: ["same foreground subject identity", "same subject pose", "same subject placement", "same clothing and materials unless explicitly changed", "same foreground edges and silhouette"], avoid: [...avoid, "changed foreground subject identity", "changed foreground subject clothing"] },
    "sky-weather-season": { targetSubject: "sky, weather, season, atmosphere, or time-of-day layer", localChangeZone: "sky, weather, outdoor atmosphere, reflections, and lighting affected by the requested weather or season", strength: "moderate-change", avoid: [...avoid, "changed subject identity", "changed foreground layout"] },
    "object-replace": { targetSubject: "the object or region named by the request", localChangeZone: "only the object or region being replaced", avoid: [...avoid, "unrelated replacements", "changed layout outside the target area"] },
    "object-add-remove": { targetSubject: "the object, subject, or region named by the request", localChangeZone: "only the area where the requested object appears or should appear", avoid: [...avoid, "global scene rewrite", "unrelated object changes"] },
    "color-change": { targetSubject: "the requested object, clothing, background, or subject region", localChangeZone: "only the explicitly requested color/material region", avoid: [...avoid, "changed unrelated colors", "changed image layout"] },
    "lighting": { targetSubject: "lighting, shadows, mood, exposure, or glow requested by the user", localChangeZone: "lighting and tonal layer only while preserving subject geometry", strength: "moderate-change", avoid: [...avoid, "changed subject identity", "changed object layout", "overexposed result"] },
    "shadow-reflection": { targetSubject: "shadow, reflection, mirror, water, glass, or contact-shadow area", localChangeZone: "only shadow/reflection interaction and physically related surface area", strength: "moderate-change", avoid: [...avoid, "floating object", "wrong light direction", "fake reflection"] },
    "depth-blur-focus": { targetSubject: "focus, blur, depth-of-field, bokeh, or sharpness plane", localChangeZone: "focus layer, background blur layer, or subject edge transition", strength: "moderate-change", avoid: [...avoid, "blurred main subject unless requested", "halo edges"] },
    "pose-composition": { targetSubject: "pose, camera, framing, crop, or spatial placement requested by the user", localChangeZone: "composition or pose region requested by the edit", strength: "moderate-change", preserve: ["same main subject identity", "same main object identity", "same style and lighting continuity", "same scene meaning"], avoid: [...avoid, "unrelated redesign"] },
    "crop-resize-reframe": { targetSubject: "canvas framing, crop, subject placement, or output ratio", localChangeZone: "framing/crop boundary and composition only", strength: "moderate-change", avoid: [...avoid, "distorted subject", "cut off important subject parts"] },
    "canvas-expand-outpaint": { targetSubject: "new canvas area outside the original image", localChangeZone: "newly expanded canvas/outpaint regions only", strength: "moderate-change", preserve: ["same original pixels where possible", "same perspective", "same lighting", "same scene continuity", "same style"], avoid: [...avoid, "seams at image boundary", "unrelated new scene"] },
    "perspective-lens": { targetSubject: "perspective, lens distortion, horizon, straightening, or viewpoint correction", localChangeZone: "geometry and lens correction layer", strength: "moderate-change", avoid: [...avoid, "warped subject", "bent straight lines unless requested"] },
    "product-material": { targetSubject: "requested product, object, surface, package, label, or material", localChangeZone: "only the named product, surface, material, reflection, or texture region", avoid: [...avoid, "changed product shape unless requested", "changed branding unless requested"] },
    "text-edit": { targetSubject: "text, sign, label, logo, or typography area requested by the user", localChangeZone: "only the text, sign, label, logo, or typography area", avoid: [...avoid, "wrong spelling", "unreadable text", "changed unrelated image areas"] },
    "layout-graphic-design": { targetSubject: "graphic layout, spacing, alignment, grid, or template structure", localChangeZone: "layout and design arrangement only", strength: "moderate-change", avoid: [...avoid, "unreadable text", "misaligned design", "changed main image subject unless requested"] },
    "style-change": { targetSubject: "whole image style layer", localChangeZone: "entire visual style while preserving identity, layout, and subject arrangement as much as possible", strength: "broad-change", preserve: ["same composition", "same subject placement", "same main subject or object identity where possible", "same object arrangement", "same scene meaning"], avoid },
    "filter-effects": { targetSubject: "filter, grade, grain, film look, glitch, vintage, or visual effect layer", localChangeZone: "global visual effect layer unless the request names a smaller region", strength: "moderate-change", avoid: [...avoid, "unreadable result", "overprocessed image"] },
    "cleanup-restoration": { targetSubject: "damage, noise, scratch, dust, stain, crease, blur, or restoration area", localChangeZone: "only damaged/noisy/unclean image regions", avoid: [...avoid, "loss of original identity", "plastic smoothing", "over-restoration"] },
    "quality-upscale-sharpen": { targetSubject: "image quality, sharpness, clarity, resolution, and fine detail", localChangeZone: "global quality layer while preserving image content", strength: "moderate-change", avoid: [...avoid, "invented new content", "oversharpening", "artifact amplification"] },
    "cutout-mask-transparency": { targetSubject: "foreground subject, background, mask, alpha, or transparent cutout", localChangeZone: "subject edges, background removal area, and mask boundary", strength: "moderate-change", avoid: [...avoid, "jagged edges", "missing hair/fur/detail", "changed subject interior"] },
    "collage-overlay-sticker": { targetSubject: "overlay, frame, border, sticker, badge, collage, layer, or graphic element", localChangeZone: "only the added/removed overlay or layer area", strength: "moderate-change", avoid: [...avoid, "covering important subject details", "messy layering"] },
  };

  const selected = simple[category] || {
    targetSubject: "the exact subject, object, area, or concept named by the user's edit request",
    localChangeZone: "infer the smallest necessary edit area from the reference image and the user's wording",
    preserve,
    avoid,
  };

  return planBase({
    category,
    targetSubject: selected.targetSubject,
    localChangeZone: selected.localChangeZone,
    requestedChange: cleaned,
    preserve: selected.preserve || preserve,
    avoid: selected.avoid || avoid,
    strength: selected.strength,
  });
}

export function buildPremiumEditPrompt(params: {
  originalPrompt?: string;
  userEditPrompt: string;
  hasReferenceImage: boolean;
}) {
  const plan = buildPremiumEditPlan(params.userEditPrompt || params.originalPrompt || "edit the selected image");

  const prompt = [
    "Premium local image edit mode.",
    "Treat the reference image as the visual source of truth.",
    "First infer the exact subject, object, area, material, layout, or background element that the user wants changed from the selected image and the edit request.",
    params.hasReferenceImage ? "Use the selected source image as the identity, layout, scene, and lighting anchor." : "",
    "Do not generate a new unrelated subject or a new unrelated scene.",
    "Do not perform a full scene rewrite unless the user explicitly requested style, pose, background, crop, expansion, or composition overhaul.",
    `Primary edit request: ${plan.requestedChange}.`,
    `Target subject or region: ${plan.targetSubject}.`,
    `Affected region: ${plan.localChangeZone}.`,
    `Edit strength: ${plan.strength}.`,
    "Modify only the necessary pixels and visual region related to the request.",
    "Preserve every unrelated part of the source image as much as the model allows.",
    "Strict preservation rules:",
    ...plan.preserve.map((item) => `- ${item}`),
    "Things to avoid:",
    ...plan.avoid.map((item) => `- ${item}`),
    params.originalPrompt ? `Original generation context: ${params.originalPrompt}` : "",
    "Final output must be clean, realistic, premium, consistent, and production-ready.",
  ]
    .filter(Boolean)
    .join("\n");

  const negativePrompt = unique([
    ...plan.avoid,
    "different main subject",
    "different background unless requested",
    "full scene rewrite",
    "identity drift",
    "distorted details",
    "unwanted extra objects",
    "blurry details",
    "low quality edit",
    "unrequested changes",
  ]).join(", ");

  return {
    plan,
    prompt,
    negativePrompt,
  };
}
