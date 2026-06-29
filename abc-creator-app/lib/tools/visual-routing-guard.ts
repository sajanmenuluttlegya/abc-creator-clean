export function getVisualRoutingGuard(toolSlug: string) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  return `

Visual routing:
- Use abc-diagram blocks for workflows, charts, graphs, dashboards, sankeys, taxonomies, pipelines, arrows, axes, legends, callouts, stage names, and visuals requiring readable labels.
- Use generated images only for clean illustration scenes, editorial art, abstract metaphors, or photoreal supporting visuals.
- Image prompts should request clean art without typography, signs, interface text, chart labels, headings, annotations, or readable text.
- Put exact wording in normal prose or abc-diagram blocks.
- Market-risk workflows must include Human Review / Decision before mitigation, hedging, execution, or exposure reduction.
- Raw-data-to-risk workflow sequence: Data Ingestion -> Cleaning & Alignment -> Feature Engineering -> Model Inference -> Risk Scoring -> Human Review / Decision -> Action / Mitigation -> Monitoring / Feedback.
`;
}
