export function getBlogVisualPlanningGuard(toolSlug: string) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  return `

Blog visual planning:
- Select visuals by article length, depth, and section relevance.
- Keep workflow, network, radial, sankey, chart, and bar visual options available.
- Keep images as relevant textless illustrations.
- Use fewer visuals for short outputs and more visuals for long outputs.
- Keep prose between visual blocks.
`;
}
