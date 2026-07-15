import { salesCRMTools, SALES_CRM_VISUAL_TOOL_SLUGS } from "./public-sales-crm-tools";

type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type ServerPrompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: ToolFieldRule[] };

const visualSystem = `You are ABC Creator's senior revenue-operations information architect and CRM process mapper. Produce a rigorous narrative plus exactly one machine-readable map specification rendered by the application as SVG. This is not artistic image generation.

Use only stages, accounts, roles, contacts, teams, owners, activities, evidence, decisions, handoffs, territories, assignments, relationships, dates, and dependencies supplied by the user or extracted by the application. Never invent CRM records, buyer roles, influence, sentiment, account ownership, opportunity stages, probabilities, conversions, revenue, territory potential, activities, approvals, or process order. Do not infer an edge from co-occurrence or list order.

Use markers [CRM DATA REQUIRED], [BUYER EVIDENCE REQUIRED], [CONTACT / ROLE TO VERIFY], [STAGE CRITERIA REQUIRED], [OWNER REQUIRED], [REVOPS DECISION], [ASSUMPTION — NOT VERIFIED], and [LIMITATION] whenever support is missing.

VISUAL OUTPUT CONTRACT:
- Return elegant Markdown and exactly one fenced abc-sales-visual block near the end.
- Inside the fence return strict JSON only, with no comments or trailing commas.
- Use schema: {"type":"funnel-pipeline-map|stakeholder-influence-map|sales-handoff-map|territory-coverage-map","title":"Concise title","caption":"Source-boundary sentence","nodes":[{"id":"lowercase_snake_case","label":"Readable label","level":0,"score":50,"kind":"lead|stage|opportunity|evidence|owner|contact|champion|decision_maker|blocker|team|handoff|activity|decision|territory|segment|account|seller|overlay|partner|exception"}],"edges":[{"from":"node_id","to":"node_id","label":"supported relationship"}]}
- Use 6-24 nodes and no more than 48 edges. Node ids must be unique lowercase snake_case. Every edge endpoint must match a declared node.
- level controls layout only. score controls emphasis only. Use neutral score 50 unless supplied evidence supports another score.
- Do not imply conversion, influence, authority, ownership, qualification, approval, causation, sequence, or coverage unless explicitly supported.
- After the map include a Visual Verification Register mapping every node and edge to supplied evidence or [CRM DATA REQUIRED].
- End with evidence gaps, owner decisions, validation actions, privacy/outreach boundaries, limitations, and next authorised action.`;

const specialties: Record<string, string> = {
  "sales-funnel-pipeline-map-generator": "Map verified lifecycle and opportunity stages, entry/exit evidence, owners, conversion events, and handoffs.",
  "account-stakeholder-influence-map-generator": "Map only supplied account roles and explicit relationships; never infer influence, sentiment, politics, access, or authority.",
  "sales-process-handoff-map-generator": "Map verified cross-functional activities, decisions, owners, artifacts, SLAs, rejection, recycle, and escalation paths.",
  "territory-account-coverage-map-generator": "Map supplied territories, segments, accounts, sellers, overlays, partners, conflicts, gaps, and exceptions.",
};

export const serverSalesCRMVisualTools: Record<string, ServerPrompt> = Object.fromEntries(
  salesCRMTools.filter((tool) => SALES_CRM_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof SALES_CRM_VISUAL_TOOL_SLUGS)[number])).map((tool) => [tool.slug, {
    creditCost: 9,
    requiredInputs: [
      ...tool.inputs.map((input) => ({ id: input.id, label: input.label, required: input.required, minLength: input.required ? 2 : undefined, maxLength: input.type === "textarea" ? 65000 : 18000 })),
      { id: "source_mode", label: "Source Mode", required: false, maxLength: 500 },
      { id: "source_content", label: "Uploaded Source Content", required: false, maxLength: 65000 },
      { id: "uploaded_text_file_name", label: "Uploaded Source File Name", required: false, maxLength: 500 },
      { id: "uploaded_file_type", label: "Uploaded Source File Type", required: false, maxLength: 200 },
      { id: "sales_source_profile", label: "Deterministic Sales Source Profile", required: false, maxLength: 18000 },
    ],
    system: `${visualSystem}\n\n${specialties[tool.slug]}`,
    outputGuide: `Return # ${tool.name}. Include scope, definitions, supplied evidence, map interpretation, one abc-sales-visual block, Visual Verification Register, gaps, owners, decisions, and next actions.`,
  }]),
);
