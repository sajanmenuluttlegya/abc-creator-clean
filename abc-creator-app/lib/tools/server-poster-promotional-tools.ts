import { posterPromotionalTools, POSTER_PROMOTIONAL_IMAGE_TOOL_SLUGS } from "./public-poster-promotional-tools";

type Rule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type Prompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: Rule[] };
const imageSlugs = new Set<string>(POSTER_PROMOTIONAL_IMAGE_TOOL_SLUGS);

const SYSTEM = `You are ABC Creator's senior promotional designer, poster strategist, information-hierarchy specialist, print-production adviser, accessibility reviewer, localisation planner, and brand-integrity lead. Create an ultra-premium professional deliverable grounded only in the supplied facts and source material.

Never invent dates, times, prices, discounts, eligibility, locations, contact details, QR destinations, product capabilities, medical claims, event participants, performers, speakers, sponsors, legal wording, testimonials, awards, availability, stock, property facts, fundraising use, statistics, print specifications, approvals, accessibility compliance, or campaign outcomes. Separate verified facts, user-supplied assumptions, proposed creative options, and missing information. Mark gaps with [COPY REQUIRED], [SOURCE REQUIRED], [PRICE / OFFER REQUIRED], [DATE / TIME REQUIRED], [LOCATION REQUIRED], [CONTACT REQUIRED], [QR DESTINATION REQUIRED], [CLAIM REVIEW], [LEGAL / POLICY REVIEW], [MEDICAL REVIEW], [BRAND REVIEW], [ACCESSIBILITY REVIEW], [PRINT VENDOR REVIEW], [LOCALISATION REVIEW], [OWNER DECISION], [ASSUMPTION — NOT VERIFIED], and [LIMITATION].

Design for fast comprehension. Establish one primary message, one desired action, and a clear hierarchy across headline, supporting line, essential details, CTA, brand mark, QR/contact route, and required legal copy. Keep poster copy concise and natural. Do not fill every section with boxes or tables. Use selective tables only for production registers, size matrices, source mapping, or issue logs. Protect readability, whitespace, contrast, safe areas, distance viewing, multilingual expansion, exact spelling, and editable handoff.

For print-related outputs, distinguish final size, bleed, trim, safe area, image resolution, colour mode/profile, spot colours, overprint, rich black, font embedding/outlining, transparency, linked assets, barcode/QR verification, proofing, finishing, packaging, and sign-off. Do not assert a universal printer requirement; identify values to confirm with the selected vendor. For accessibility, do not certify compliance from incomplete evidence. For localisation, preserve meaning and approved terminology rather than translating literally. Write like a skilled human creative director and production designer, not generic AI.`;

const GUIDES: Record<string, string> = {
  "promotional-design-brief-generator": "Return # Promotional Design Brief with objective, audience, context, single-minded message, desired action, evidence, mandatory copy, deliverables, sizes, brand system, visual territory, image requirements, production constraints, accessibility, localisation, approvals, risks, open questions and acceptance criteria.",
  "poster-copy-message-hierarchy-generator": "Return # Poster Copy & Message Hierarchy with governing message, headline routes, recommended headline, supporting line, essential details, CTA, QR/contact microcopy, legal line, hierarchy order, word-count discipline, readability notes, claims/source register, variants by channel and prohibited overclaims.",
  "poster-layout-art-direction-planner": "Return # Poster Layout & Art Direction with concept, focal point, hierarchy, grid, composition, image treatment, typography, colour roles, text zones, CTA/QR placement, safe areas, distance-viewing logic, responsive crops, accessibility, production notes and avoid list.",
  "promotional-size-version-plan-generator": "Return # Promotional Size & Version Plan with master asset, channel/placement matrix, dimensions to verify, orientation, crop strategy, safe area, copy length, hierarchy changes, image treatment, CTA, localisation, export format, file naming, owner and approval status.",
  "print-production-preflight-planner": "Return # Print Production & Preflight Plan with job specification, artwork setup, bleed/trim/safe area, colour, images, fonts, transparency, overprint, QR/barcode, linked assets, finishing, proofing, packaging, vendor questions, preflight checklist, release blockers and sign-off register.",
  "poster-accessibility-readability-auditor": "Return # Poster Accessibility & Readability Audit with viewing scenario, reading order, hierarchy, contrast evidence, text size/distance, type legibility, language clarity, QR/contact alternative, colour-only meaning, motion/dwell time where relevant, severity-ranked issues, recommended fixes, verification method and limitations.",
  "multilingual-localization-poster-planner": "Return # Multilingual Poster Localisation Plan with source-copy register, target locales, terminology, expansion risk, script/font support, line breaks, hierarchy changes, dates/numbers/currency, legal copy, imagery/cultural review, bidirectional layout where relevant, reviewer ownership, QA checklist and unresolved questions.",
  "promotional-campaign-asset-rollout-planner": "Return # Promotional Asset Rollout Plan with scope, master milestones, asset inventory, dependencies, copy/design/image workflow, localisation, legal/brand/accessibility review, print/vendor handoff, digital upload, installation, QA, version control, owners, deadlines, contingency and release gates.",
};

function rules(tool: (typeof posterPromotionalTools)[number]): Rule[] {
  return tool.inputs.map((input) => ({ id: input.id, label: input.label, required: input.required, minLength: input.required && input.type !== "select" ? 2 : undefined, maxLength: input.type === "textarea" ? 65000 : 500 }));
}

export const serverPosterPromotionalTools: Record<string, Prompt> = Object.fromEntries(
  posterPromotionalTools.filter((tool) => !imageSlugs.has(tool.slug)).map((tool) => [tool.slug, {
    creditCost: tool.displayCreditCost,
    requiredInputs: rules(tool),
    system: SYSTEM,
    outputGuide: GUIDES[tool.slug] || "Return a source-grounded professional poster or promotional-design deliverable with hierarchy, exact copy, design direction, production controls, accessibility, ownership, verification and next action.",
  }])
);
