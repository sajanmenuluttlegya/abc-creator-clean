export type PremiumEditCategory =
  | "face-hair"
  | "face-feature"
  | "hairstyle"
  | "expression"
  | "clothing"
  | "background"
  | "object-add-remove"
  | "object-replace"
  | "color-change"
  | "lighting"
  | "pose-composition"
  | "style-change"
  | "text-edit"
  | "product-material"
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

  if (/(remove|delete|erase|get rid of|clean[- ]?shave|shave).*(beard|moustache|mustache|facial hair)|\b(no beard|no moustache|no mustache|beardless|clean shaven)\b/i.test(text)) {
    return "face-hair";
  }

  if (/(eyes|eye color|nose|lips|mouth|teeth|jaw|chin|cheeks|skin|wrinkle|scar|freckle|makeup|glasses)/i.test(text)) {
    return "face-feature";
  }

  if (/(hair|hairstyle|haircut|long hair|short hair|curly hair|straight hair|bald|bangs|fringe)/i.test(text)) {
    return "hairstyle";
  }

  if (/(smile|angry|sad|expression|happy|serious|laugh|frown|eyes open|eyes closed)/i.test(text)) {
    return "expression";
  }

  if (/(shirt|dress|jacket|hoodie|clothes|clothing|outfit|suit|tie|uniform|pants|shoes|hat|cap|armor)/i.test(text)) {
    return "clothing";
  }

  if (/(background|remove background|transparent background|room|sky|wall|scene|environment|replace background)/i.test(text)) {
    return "background";
  }

  if (/(replace|swap|change).*(with|into|to)/i.test(text)) {
    return "object-replace";
  }

  if (/(add|remove|delete|erase|put|insert|take out|hide|show)/i.test(text)) {
    return "object-add-remove";
  }

  if (/(text|word|letter|caption|sign|logo|label|typography|written)/i.test(text)) {
    return "text-edit";
  }

  if (/(brighter|darker|lighting|shadow|sunlight|neon|glow|contrast|exposure|mood)/i.test(text)) {
    return "lighting";
  }

  if (/(pose|standing|sitting|turn|angle|camera|zoom|crop|composition|framing|move|position)/i.test(text)) {
    return "pose-composition";
  }

  if (/(metal|wood|glass|leather|fabric|plastic|matte|glossy|texture|material|product)/i.test(text)) {
    return "product-material";
  }

  if (/(color|colour|red|blue|green|black|white|gold|pink|purple|yellow|orange|silver|brown|grey|gray)/i.test(text)) {
    return "color-change";
  }

  if (/(style|anime|photorealistic|realistic|cartoon|manga|cinematic|watercolor|oil painting|3d|pixel|sketch|vector)/i.test(text)) {
    return "style-change";
  }

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

  switch (category) {
    case "face-hair":
      return planBase({
        category,
        targetSubject: "main person or animal if the selected image contains one",
        localChangeZone: "only the hair or facial-hair region mentioned by the request",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "new subject", "different hairstyle unless requested", "changed clothing", "changed background objects"],
      });

    case "face-feature":
      return planBase({
        category,
        targetSubject: "main face or visible character face",
        localChangeZone: "only the named facial feature or skin region",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "different face identity", "changed hair", "changed clothing", "changed background"],
      });

    case "hairstyle":
      return planBase({
        category,
        targetSubject: "main person or character",
        localChangeZone: "hair and head region only",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed face identity", "changed clothing", "changed background", "changed pose"],
      });

    case "expression":
      return planBase({
        category,
        targetSubject: "main face or character expression",
        localChangeZone: "expression region only: eyes, eyebrows, cheeks, mouth, and surrounding face",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed hairstyle", "changed clothing", "changed background", "changed pose"],
      });

    case "clothing":
      return planBase({
        category,
        targetSubject: "requested clothing or outfit area",
        localChangeZone: "clothing, accessory, outfit, or wearable region only",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed face", "changed hair", "changed background", "changed body pose"],
      });

    case "background":
      return planBase({
        category,
        targetSubject: "background or environment while preserving the foreground subject",
        localChangeZone: "background, wall, sky, room, or environment only",
        requestedChange: cleaned,
        preserve: [
          "same foreground subject identity",
          "same subject pose",
          "same subject placement",
          "same clothing and materials unless explicitly changed",
          "same foreground edges and silhouette",
        ],
        avoid: [...avoid, "changed foreground subject identity", "changed foreground subject clothing"],
        strength: "moderate-change",
      });

    case "object-replace":
      return planBase({
        category,
        targetSubject: "the object or region named by the request",
        localChangeZone: "only the object or region being replaced",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "unrelated replacements", "changed layout outside the target area"],
      });

    case "object-add-remove":
      return planBase({
        category,
        targetSubject: "the object, subject, or region named by the request",
        localChangeZone: "only the area where the requested object appears or should appear",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "global scene rewrite", "unrelated object changes"],
      });

    case "color-change":
      return planBase({
        category,
        targetSubject: "the requested object, clothing, background, or subject region",
        localChangeZone: "only the explicitly requested color/material region",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed unrelated colors", "changed image layout"],
      });

    case "lighting":
      return planBase({
        category,
        targetSubject: "lighting, shadows, mood, exposure, or glow requested by the user",
        localChangeZone: "lighting and tonal layer only while preserving subject geometry",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed subject identity", "changed object layout", "overexposed result"],
        strength: "moderate-change",
      });

    case "pose-composition":
      return planBase({
        category,
        targetSubject: "pose, camera, framing, crop, or spatial placement requested by the user",
        localChangeZone: "composition or pose region requested by the edit",
        requestedChange: cleaned,
        preserve: [
          "same main subject identity",
          "same main object identity",
          "same style and lighting continuity",
          "same scene meaning",
        ],
        avoid: [...avoid, "unrelated redesign"],
        strength: "moderate-change",
      });

    case "product-material":
      return planBase({
        category,
        targetSubject: "requested product, object, surface, or material",
        localChangeZone: "only the named product, surface, material, reflection, or texture region",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "changed product shape unless requested", "changed branding unless requested"],
      });

    case "text-edit":
      return planBase({
        category,
        targetSubject: "text, sign, label, logo, or typography area requested by the user",
        localChangeZone: "only the text, sign, label, logo, or typography area",
        requestedChange: cleaned,
        preserve,
        avoid: [...avoid, "wrong spelling", "unreadable text", "changed unrelated image areas"],
      });

    case "style-change":
      return planBase({
        category,
        targetSubject: "whole image style layer",
        localChangeZone: "entire visual style while preserving identity, layout, and subject arrangement as much as possible",
        requestedChange: cleaned,
        preserve: [
          "same composition",
          "same subject placement",
          "same main subject or object identity where possible",
          "same object arrangement",
          "same scene meaning",
        ],
        avoid,
        strength: "broad-change",
      });

    default:
      return planBase({
        category,
        targetSubject: "the exact subject, object, area, or concept named by the user's edit request",
        localChangeZone: "infer the smallest necessary edit area from the reference image and the user's wording",
        requestedChange: cleaned,
        preserve,
        avoid,
      });
  }
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
    "First infer the exact subject, object, area, material, or background element that the user wants changed from the selected image and the edit request.",
    params.hasReferenceImage ? "Use the selected source image as the identity, layout, scene, and lighting anchor." : "",
    "Do not generate a new unrelated subject or a new unrelated scene.",
    "Do not perform a full scene rewrite unless the user explicitly requested a style, pose, background, or composition overhaul.",
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
