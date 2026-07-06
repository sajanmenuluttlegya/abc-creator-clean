const BLOG_VISUAL_TOOL_SLUGS = new Set([
  "blog-content",
  "pro-image-brief-for-blog",
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
  "comparison-blog-writer",
  "youtube-video-to-blog-post",
  "video-to-article-converter",
  "rewrite-article-with-keywords",
]);

export function getBlogVisualPlanningGuard(toolSlug: string) {
  if (!BLOG_VISUAL_TOOL_SLUGS.has(toolSlug)) return "";

  return `

Blog visual planning:
- Keep the blog visual system active for article generators. Do not remove useful graphs, flowcharts, visual illustrations, tables, image blocks, or abc-diagram blocks from blog content.
- Select visuals by article length, article depth, available input data, visual_mode, chart_preference, and section relevance.
- Keep workflow, network, radial, concentric, lineage, sankey, chart, graph, matrix, timeline, roadmap, map, architecture, taxonomy, and bar visual options available.
- Use workflow visuals for processes, systems, pipelines, and step sequences.
- Use radial, concentric, web, network, or lineage visuals for relationships, layers, ecosystems, dependencies, clusters, and signal networks.
- Use charts, graphs, bars, matrices, or tables for comparisons, rankings, factor weighting, options, and decision criteria.
- Use timelines or roadmaps for phases, chronology, implementation paths, publishing calendars, rollouts, and milestones.
- Use architecture, ERD, system, component, or block diagrams for product, data, infrastructure, software, and operating-model structure.
- Use image blocks as relevant textless illustrations only; never use images for label-heavy graphs, charts, dashboards, flowcharts, or maps.
- Keep meaningful prose between visual blocks.
- Avoid title-style explainer lines above abc-diagram blocks, including phrases like "A simplified workflow showing" or "This chart illustrates".
- 2 paragraphs or very short: 0-1 total visuals.
- Short: 1-2 total visuals.
- Medium: 2-3 total visuals.
- Long: 3-4 total visuals.
- Very long: 4-5 total visuals.
- Premium pillar: 5-7 total visuals.
- Authority pillar: 5-10 total visuals maximum when the section need supports it.
- Basic depth uses the lower end of the visual range.
- Standard depth uses the normal range.
- Deep or expert depth may add one useful coded visual when relevant.
- Prefer fewer high-quality visuals over many weak visuals.
`;
}
