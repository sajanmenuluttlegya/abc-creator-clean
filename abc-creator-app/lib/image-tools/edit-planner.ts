export type PremiumEditCategory =
  | "face-hair"
  | "hairstyle"
  | "expression"
  | "clothing"
  | "background"
  | "object-add-remove"
  | "color-change"
  | "style-change"
  | "text-edit"
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

  if (/(hair|hairstyle|haircut|long hair|short hair|curly hair|straight hair|bald|bangs|fringe)/i.test(text)) {
    return "hairstyle";
  }

  if (/(smile|angry|sad|expression|happy|serious|laugh|frown|eyes open|eyes closed)/i.test(text)) {
    return "expression";
  }

  if (/(shirt|dress|jacket|hoodie|clothes|clothing|outfit|suit|tie|uniform|pants|shoes)/i.test(text)) {
    return "clothing";
  }

  if (/(background|remove background|transparent background|room|sky|wall|scene|environment)/i.test(text)) {
    return "background";
  }

  if (/(text|word|letter|caption|sign|logo|label|typography|written)/i.test(text)) {
    return "text-edit";
  }

  if (/(color|colour|red|blue|green|black|white|gold|pink|purple|yellow|orange|silver|brown|grey|gray)/i.test(text)) {
    return "color-change";
  }

  if (/(style|anime|photorealistic|realistic|cartoon|manga|cinematic|watercolor|oil painting|3d|pixel|sketch)/i.test(text)) {
    return "style-change";
  }

  if (/(add|remove|delete|erase|replace|put|insert|take out|hide|show)/i.test(text)) {
    return "object-add-remove";
  }

  return "general";
}

function commonPreserve() {
  return [
    "same subject identity",
    "same face structure and recognizable appearance",
    "same pose and body position unless explicitly changed",
    "same camera angle and perspective",
    "same framing and crop",
    "same lighting direction and mood",
    "same clothing unless explicitly changed",
    "same background unless explicitly changed",
    "same object arrangement unless explicitly changed",
    "same overall composition",
  ];
}

function commonAvoid() {
  return [
    "different person",
    "different age",
    "different ethnicity",
    "different body shape",
    "different scene",
    "unrequested background change",
    "unrequested clothing change",
    "extra people",
    "duplicate subject",
    "distorted face",
    "warped hands",
    "unwanted props",
    "full scene rewrite",
    "identity drift",
  ];
}

export function buildPremiumEditPlan(userEditPrompt: string): PremiumEditPlan {
  const cleaned = normalizeText(userEditPrompt);
  const category = classifyEditRequest(cleaned);
  const preserve = commonPreserve();
  const avoid = commonAvoid();

  switch (category) {
    case "face-hair":
      return {
        category,
        targetSubject: "main person",
        localChangeZone: "lower face, chin, jawline, cheeks, moustache and beard region only",
        requestedChange: cleaned,
        preserve,
        avoid: unique([
          ...avoid,
          "new person",
          "different hairstyle",
          "changed shirt",
          "changed desk or monitor",
          "changed background objects",
          "helmet",
          "remaining beard stubble unless requested",
        ]),
        strength: "minimal-change",
      };

    case "hairstyle":
      return {
        category,
        targetSubject: "main person",
        localChangeZone: "hair and head region only",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "changed face identity", "changed clothing", "changed background", "changed pose"]),
        strength: "minimal-change",
      };

    case "expression":
      return {
        category,
        targetSubject: "main person",
        localChangeZone: "eyes, eyebrows, mouth, cheeks and facial expression region only",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "changed hairstyle", "changed clothing", "changed background", "changed pose"]),
        strength: "minimal-change",
      };

    case "clothing":
      return {
        category,
        targetSubject: "main person",
        localChangeZone: "clothing and outfit area only",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "changed face", "changed hair", "changed background", "changed body pose"]),
        strength: "minimal-change",
      };

    case "background":
      return {
        category,
        targetSubject: "main subject",
        localChangeZone: "background and environment only",
        requestedChange: cleaned,
        preserve: [
          "same main subject identity",
          "same subject pose",
          "same subject framing",
          "same subject placement",
          "same clothing unless explicitly changed",
          "same foreground subject edges",
        ],
        avoid: unique([...avoid, "changed main subject identity", "changed subject clothing"]),
        strength: "moderate-change",
      };

    case "object-add-remove":
      return {
        category,
        targetSubject: "requested object or nearby subject",
        localChangeZone: "only the object region relevant to the request",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "global scene rewrite", "unrelated object changes"]),
        strength: "minimal-change",
      };

    case "color-change":
      return {
        category,
        targetSubject: "requested object or subject region",
        localChangeZone: "only the explicitly requested color region",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "changed unrelated colors", "changed image layout"]),
        strength: "minimal-change",
      };

    case "text-edit":
      return {
        category,
        targetSubject: "text/sign/logo region requested by the user",
        localChangeZone: "only the text, sign, label, logo, or typography area",
        requestedChange: cleaned,
        preserve,
        avoid: unique([...avoid, "wrong spelling", "garbled text", "changed unrelated image areas"]),
        strength: "minimal-change",
      };

    case "style-change":
      return {
        category,
        targetSubject: "whole image style layer",
        localChangeZone: "entire image style while preserving layout and identity",
        requestedChange: cleaned,
        preserve: [
          "same composition",
          "same subject placement",
          "same main subject identity where possible",
          "same object arrangement",
          "same scene meaning",
        ],
        avoid,
        strength: "broad-change",
      };

    default:
      return {
        category,
        targetSubject: "main subject",
        localChangeZone: "only the necessary region related to the request",
        requestedChange: cleaned,
        preserve,
        avoid,
        strength: "minimal-change",
      };
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
    "Edit the provided reference image with strict consistency lock.",
    params.hasReferenceImage ? "Use the selected source image as the identity, layout, and scene anchor." : "",
    "Do not generate a new unrelated person or a new unrelated scene.",
    "Do not perform a full scene rewrite unless the user explicitly requested a style or background overhaul.",
    `Primary edit request: ${plan.requestedChange}.`,
    `Target subject: ${plan.targetSubject}.`,
    `Affected region: ${plan.localChangeZone}.`,
    `Edit strength: ${plan.strength}.`,
    "Modify only the necessary region related to the request.",
    "Preserve all unrelated parts of the image.",
    "Strict preservation rules:",
    ...plan.preserve.map((item) => `- ${item}`),
    "Things to avoid:",
    ...plan.avoid.map((item) => `- ${item}`),
    params.originalPrompt ? `Original generation context: ${params.originalPrompt}` : "",
    "Final output must be clean, realistic, high-end, and professional.",
  ]
    .filter(Boolean)
    .join("\n");

  const negativePrompt = unique([
    ...plan.avoid,
    "different person",
    "different background",
    "full scene rewrite",
    "identity drift",
    "deformed face",
    "extra limbs",
    "blurry details",
    "low quality edit",
    "unrequested object changes",
  ]).join(", ");

  return {
    plan,
    prompt,
    negativePrompt,
  };
}
