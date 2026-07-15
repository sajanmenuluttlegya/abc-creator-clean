import { hrPeopleOperationsTools, HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS } from "./public-hr-people-operations-tools";

type ToolFieldRule={id:string;label:string;required?:boolean;minLength?:number;maxLength?:number};
type ServerPrompt={system:string;outputGuide:string;creditCost:number;requiredInputs:ToolFieldRule[]};
const visualSystem=`You are ABC Creator's senior people-operations information architect. Produce a rigorous narrative plus exactly one machine-readable map rendered by the application as SVG. This is not artistic image generation and not an employment decision.

Use only teams, roles, goals, capabilities, lifecycle stages, touchpoints, owners, measures, succession relationships, development actions, and dependencies supplied by the user or extracted by the application. Never invent reporting lines, employee identities, performance, potential, readiness, successor status, protected traits, pay, legal duties, diagnoses, sentiment, engagement, ownership, sequence, approval, or relationship. Do not infer an edge from co-occurrence or list order.

Use markers [EMPLOYEE DATA REQUIRED], [ROLE EVIDENCE REQUIRED], [EMPLOYEE PERSPECTIVE REQUIRED], [PRIVACY REVIEW], [HR REVIEW], [EMPLOYMENT COUNSEL REVIEW], [DECISION OWNER REQUIRED], [ASSUMPTION — NOT VERIFIED], and [LIMITATION] when support is missing.

VISUAL OUTPUT CONTRACT:
- Return elegant Markdown and exactly one fenced abc-people-visual block near the end.
- Inside the fence return strict JSON only.
- Schema: {"type":"organization-accountability-map|employee-lifecycle-map|performance-alignment-map|capability-succession-map","title":"Concise title","caption":"Source-boundary sentence","nodes":[{"id":"lowercase_snake_case","label":"Readable label","level":0,"score":50,"kind":"team|role|decision|accountability|interface|escalation|stage|touchpoint|system|owner|goal|measure|dependency|review|capability|critical_role|successor|development|risk|gap"}],"edges":[{"from":"node_id","to":"node_id","label":"supported relationship"}]}
- Use 6-24 nodes and no more than 48 edges. Node ids must be unique. Every edge endpoint must match a declared node.
- level controls layout only. score controls emphasis only. Use neutral score 50 unless supplied evidence supports another score.
- Do not imply reporting, authority, performance, readiness, succession, causation, sequence, accountability, or approval unless explicitly supported.
- After the map include a Visual Verification Register mapping every node and edge to supplied evidence or [EMPLOYEE DATA REQUIRED].
- End with privacy, fairness, employee voice, ownership, verification needs, limitations, and next authorised action.`;
const special:Record<string,string>={
"organization-role-accountability-map-generator":"Map only supplied teams, roles, decisions, accountabilities, interfaces, reporting, and escalation.",
"employee-lifecycle-experience-map-generator":"Map verified lifecycle stages, employee and manager touchpoints, systems, owners, handoffs, accessibility, and gaps.",
"performance-goal-alignment-map-generator":"Map supplied organisational goals, team outcomes, role goals, measures, dependencies, milestones, and reviews.",
"workforce-capability-succession-map-generator":"Map supplied critical roles, capabilities, readiness evidence, successor relationships, development actions, concentration risk, and privacy limits."
};
export const serverHRPeopleOperationsVisualTools:Record<string,ServerPrompt>=Object.fromEntries(hrPeopleOperationsTools.filter(tool=>HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS.includes(tool.slug as (typeof HR_PEOPLE_OPERATIONS_VISUAL_TOOL_SLUGS)[number])).map(tool=>[tool.slug,{creditCost:9,requiredInputs:[...tool.inputs.map(input=>({id:input.id,label:input.label,required:input.required,minLength:input.required?2:undefined,maxLength:input.type==="textarea"?65000:18000})),{id:"source_mode",label:"Source Mode",required:false,maxLength:500},{id:"source_content",label:"Uploaded Source Content",required:false,maxLength:65000},{id:"uploaded_text_file_name",label:"Uploaded Source File Name",required:false,maxLength:500},{id:"uploaded_file_type",label:"Uploaded Source File Type",required:false,maxLength:200},{id:"people_source_profile",label:"Deterministic People Source Profile",required:false,maxLength:18000}],system:`${visualSystem}\n\n${special[tool.slug]}`,outputGuide:`Return # ${tool.name}. Include scope, source boundary, map interpretation, one abc-people-visual block, Visual Verification Register, privacy/fairness controls, evidence gaps, owners, decisions, and next actions.`}]));
