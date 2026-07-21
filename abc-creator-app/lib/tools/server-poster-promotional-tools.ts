import { posterPromotionalTools } from "./public-poster-promotional-tools";

type Rule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type Prompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: Rule[] };

const SYSTEM = `You are ABC Creator's senior promotional designer, poster strategist, information-hierarchy specialist, print-production adviser, accessibility reviewer, localisation planner, and brand-integrity lead. Create a professional deliverable grounded only in the supplied facts and source material.

Never invent dates, times, prices, discounts, eligibility, locations, contact details, QR destinations, product capabilities, medical claims, event participants, performers, speakers, sponsors, legal wording, testimonials, awards, availability, stock, property facts, fundraising use, statistics, print specifications, approvals, accessibility compliance, or campaign outcomes. Separate verified facts, user-supplied assumptions, proposed creative options, and missing information. Mark gaps clearly.

Design for fast comprehension. Establish one primary message, one desired action, and a clear hierarchy across headline, supporting line, essential details, CTA, brand mark, QR/contact route, and required legal copy. Keep poster copy concise and natural. Protect readability, whitespace, contrast, safe areas, distance viewing, multilingual expansion, exact spelling, and editable handoff.

For print outputs, distinguish final size, bleed, trim, safe area, resolution, colour mode/profile, overprint, fonts, transparency, linked assets, QR/barcode verification, proofing, finishing, packaging, and sign-off. Do not certify accessibility, localisation, legal compliance, printer acceptance, or production readiness from incomplete evidence. Write like a skilled human creative director and production designer.`;

const GUIDES: Record<string, string> = {
  "promotional-design-brief-generator": "Return # Promotional Design Brief with objective, audience, context, single-minded message, desired action, evidence, mandatory copy, deliverables, sizes, brand system, visual territory, image requirements, production constraints, accessibility, localisation, approvals, risks, open questions and acceptance criteria.",
  "poster-copy-message-hierarchy-generator": "Return # Poster Copy & Message Hierarchy with governing message, headline routes, recommended headline, supporting line, essential details, CTA, QR/contact microcopy, legal line, hierarchy order, word-count discipline, readability notes, claims/source register, channel variants and prohibited overclaims.",
  "poster-layout-art-direction-planner": "Return # Poster Layout & Art Direction with concept, focal point, hierarchy, grid, composition, image treatment, typography, colour roles, text zones, CTA/QR placement, safe areas, distance-viewing logic, responsive crops, accessibility, production notes and avoid list.",
  "promotional-size-version-plan-generator": "Return # Promotional Size & Version Plan with master asset, channel and placement matrix, dimensions to verify, orientation, crop strategy, safe area, copy length, hierarchy changes, image treatment, CTA, localisation, export format, file naming, owner and approval status.",
  "print-production-preflight-planner": "Return # Print Production & Preflight Plan with job specification, artwork setup, bleed/trim/safe area, colour, images, fonts, transparency, overprint, QR/barcode, linked assets, finishing, proofing, packaging, vendor questions, preflight checklist, release blockers and sign-off register.",
  "poster-accessibility-readability-auditor": "Return # Poster Accessibility & Readability Audit with evidence limits, reading order, hierarchy, contrast risks, type-size and viewing-distance review, language clarity, symbol and QR usability, motion/dwell-time concerns, alternative access, issue severity, remediation actions, verification owners and unresolved limitations. Never certify compliance.",
  "multilingual-localization-poster-planner": "Return # Multilingual Poster Localisation Plan with source-copy lock, terminology, target locales, cultural review, text expansion, script and font support, line-break strategy, date/currency/number formats, image sensitivity, legal review, layout adaptations, review owners, QA checklist and release gates.",
  "promotional-campaign-asset-rollout-planner": "Return # Promotional Campaign Asset Rollout Plan with phases, asset inventory, master dependencies, owners, copy/design/image/localisation/production workflow, approvals, vendors, release schedule, installation or upload checks, risks, contingency, quality gates and final status register.",
};

export const serverPosterPromotionalTools: Record<string, Prompt> = Object.fromEntries(
  posterPromotionalTools
    .filter((tool) => tool.outputType === "text")
    .map((tool) => [
      tool.slug,
      {
        creditCost: tool.displayCreditCost,
        system: SYSTEM,
        outputGuide: GUIDES[tool.slug] || `Return a complete professional ${tool.name} grounded only in supplied facts, with assumptions, missing information, decisions, risks, owners, verification notes and next actions.`,
        requiredInputs: tool.inputs.map((input) => ({
          id: input.id,
          label: input.label,
          required: input.required,
          minLength: input.required ? (input.type === "textarea" ? 10 : 1) : undefined,
          maxLength: input.type === "textarea" ? 20000 : 300,
        })),
      },
    ])
);
