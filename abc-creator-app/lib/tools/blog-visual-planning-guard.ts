export function getBlogVisualPlanningGuard(toolSlug: string) {
  if (toolSlug !== "blog-content" && toolSlug !== "pro-image-brief-for-blog") return "";

  return `

Blog visual planning:
- Select visuals by article length, article depth, and section relevance.
- Keep workflow, network, radial, concentric, lineage, sankey, chart, graph, and bar visual options available.
- Use workflow visuals for processes, systems, pipelines, and step sequences.
- Use radial, concentric, web, network, or lineage visuals for relationships, layers, ecosystems, dependencies, and signal networks.
- Use charts, graphs, or bars for comparisons, rankings, and factor weighting.
- Use images as relevant textless illustrations only.
- Keep meaningful prose between visual blocks.
- Avoid title-style explainer lines above abc-diagram blocks, including phrases like "A simplified workflow showing" or "This chart illustrates".
- 2 paragraphs or very short: 0-1 total visuals.
- Short: 1-2 total visuals.
- Medium: 2-3 total visuals.
- Long: 3-4 total visuals.
- Very long: 4-5 total visuals.
- Premium pillar: 5-7 total visuals.
- Basic depth uses the lower end of the visual range.
- Standard depth uses the normal range.
- Deep or expert depth may add one useful coded visual when relevant.
- Prefer fewer high-quality visuals over many weak visuals.
`;
}
