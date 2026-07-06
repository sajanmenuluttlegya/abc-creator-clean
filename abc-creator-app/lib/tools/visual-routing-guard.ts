import { WORKFLOW_REVIEW_WORDING } from "./workflow-ai-review";

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

export function getVisualRoutingGuard(toolSlug: string) {
  if (!BLOG_VISUAL_TOOL_SLUGS.has(toolSlug)) return "";

  return `

Visual routing:
- Blog/article generators must preserve the visual system. Do not remove graphs, flowcharts, diagrams, visual illustrations, image prompts, tables, or abc-diagram blocks when they help the article.
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

Visual selection by content type:
- Process, sequence, implementation steps, pipelines, onboarding, automations, approvals, or workflows -> flowchart, process map, workflow diagram, pipeline diagram, swimlane, roadmap, or timeline.
- Comparison, choices, prioritization, options, pros/cons, tradeoffs, pricing placeholders, selection criteria, or strategy matrix -> table, decision matrix, priority matrix, 2x2 matrix, bar chart, radar/spider chart, or quadrant chart.
- Time, trend, phases, milestones, chronology, publication plan, rollout, or before/after path -> timeline, roadmap, line chart, area chart, milestone chart, calendar view, or waterfall when meaningful.
- Relationships, dependencies, ecosystems, causes, entities, audiences, channels, signals, or connected concepts -> network graph, node-link diagram, knowledge graph, dependency graph, causal graph, or concept map.
- Hierarchy, categories, taxonomy, lineage, ancestry, topic clusters, content clusters, or nested frameworks -> taxonomy tree, tree diagram, hierarchy chart, lineage graph, mind map, or concept map.
- Source-to-destination movement of value, data, traffic, energy, attention, leads, or conversions -> Sankey only when a clear flow exists.
- System, architecture, data stack, software structure, product components, or infrastructure -> architecture diagram, system diagram, component diagram, ERD, database schema, class/object diagram, or block diagram.
- Spatial, geographic, route, journey, site, floor, map, region, or location-based content -> map, route map, site map, journey map, conceptual map, or floor plan.
- Abstract, emotional, brand, storytelling, hero support, or section atmosphere without labels -> image block / visual illustration, not abc-diagram.

Placement rules:
- Decide the visual immediately after understanding the nearby section's reader job, then place it close to the paragraph/section it clarifies.
- Do not dump visuals at the end. Do not force a visual into every section.
- Keep at least one meaningful prose paragraph between any two visuals.
- For very short outputs use 0-1 visuals; for standard/long article generators use useful visuals according to article length and section need.

Data-backed visual rules:
- Do not invent raw internet data, charts, statistics, source-backed insights, competitor facts, market share, rankings, prices, or timelines.
- If the user supplies raw data, source links, notes, citations, or copied research in the inputs, analyze that supplied data and turn the insights into coded diagrams/tables/charts where useful.
- If source data is not supplied, use qualitative diagrams only and avoid numeric data-backed chart claims.
- Any chart that uses numbers must make clear whether the values are user-supplied, placeholders, or qualitative examples.
`;
}
