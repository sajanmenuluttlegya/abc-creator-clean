import { WORKFLOW_REVIEW_WORDING } from "./workflow-ai-review";

export function getVisualRoutingGuard(toolSlug: string) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  return `

Visual routing:
- Use abc-diagram blocks for workflows, charts, graphs, dashboards, sankeys, taxonomies, pipelines, arrows, axes, legends, callouts, stage names, and visuals requiring readable labels.
- Keep image blocks enabled when the user selected images. Do not remove images just because coded diagrams are present.
- Generated images are for clean, relevant, textless illustrations: hero art, editorial scenes, abstract metaphors, photoreal supporting visuals, or atmospheric section art.
- If Images is Hero image only, include one relevant hero image when it supports the article.
- If Images is Hero + section images, include a rational number of relevant images: usually one hero plus one or two section images, max four total for long pillar articles.
- Every image must match the nearest section topic. Do not use generic robot/adventure/skyscraper/fantasy visuals unless the section actually calls for that scene.
- Never place two image blocks together. Never place an image block directly beside another image block or directly beside an abc-diagram block. Put meaningful prose between visual blocks.
- Image prompts should request clean art without typography, signs, interface text, chart labels, headings, annotations, captions, or readable text.
- Put exact wording in normal prose or abc-diagram blocks.
- Do not render long title or caption sentences inside diagram cards. Diagrams should show the visual structure itself.
- In concentric or radial diagrams, node labels should sit directly near their point. Use arrows only for ring-level callouts.
- Use ${WORKFLOW_REVIEW_WORDING} as the review step before the final action step.
- Do not include a feedback step in workflow diagrams.
- Workflow sequence: Data Ingestion -> Cleaning & Alignment -> Feature Engineering -> Model Inference -> Risk Scoring -> ${WORKFLOW_REVIEW_WORDING} -> Action.

Data-backed visual rules:
- Do not invent raw internet data, charts, statistics, source-backed insights, competitor facts, market share, rankings, prices, or timelines.
- If the user supplies raw data, source links, notes, citations, or copied research in the inputs, analyze that supplied data and turn the insights into coded diagrams/tables/charts where useful.
- If source data is not supplied, use qualitative diagrams only and avoid numeric data-backed chart claims.
- Any chart that uses numbers must make clear whether the values are user-supplied, placeholders, or qualitative examples.
`;
}
