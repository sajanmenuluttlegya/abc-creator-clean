import { WORKFLOW_REVIEW_WORDING } from "./workflow-ai-review";

export function getVisualRoutingGuard(toolSlug: string) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  return `

Visual routing:
- Use abc-diagram blocks for workflows, charts, graphs, dashboards, sankeys, taxonomies, pipelines, arrows, axes, legends, callouts, stage names, and visuals requiring readable labels.
- Use generated images only for clean illustration scenes, editorial art, abstract metaphors, or photoreal supporting visuals.
- Image prompts should request clean art without typography, signs, interface text, chart labels, headings, annotations, or readable text.
- Put exact wording in normal prose or abc-diagram blocks.
- Use ${WORKFLOW_REVIEW_WORDING} as the review step before the final action step.
- Do not include a feedback step in workflow diagrams.
- Workflow sequence: Data Ingestion -> Cleaning & Alignment -> Feature Engineering -> Model Inference -> Risk Scoring -> ${WORKFLOW_REVIEW_WORDING} -> Action.
`;
}
