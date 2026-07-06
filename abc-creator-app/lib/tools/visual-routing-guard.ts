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
- Select visuals by the exact data/content type. Use chart_preference and visual_mode only as tie-breakers after the section's data type is clear.
- Use abc-diagram blocks for workflows, charts, graphs, dashboards, sankeys, taxonomies, pipelines, axes, legends, callouts, stage names, and visuals requiring readable labels.
- Generated images are for clean, relevant, textless illustrations: hero art, editorial scenes, abstract metaphors, photoreal supporting visuals, or atmospheric section art.
- Never place two image blocks together. Never place an image block directly beside another image block or directly beside an abc-diagram block. Put meaningful prose between visual blocks.
- Image prompts should request clean art without typography, signs, interface text, chart labels, headings, annotations, captions, or readable text.
- Use ${WORKFLOW_REVIEW_WORDING} as the review step before the final action step.
- Do not include a feedback step in workflow diagrams.
- Workflow sequence: Data Ingestion -> Cleaning & Alignment -> Feature Engineering -> Model Inference -> Risk Scoring -> ${WORKFLOW_REVIEW_WORDING} -> Action.

Exact visual selection by data type:
- Categorical comparison, options, alternatives, pros/cons, tradeoffs, pricing placeholders, buying criteria, or strategy choice -> comparison table, decision matrix, priority matrix, 2x2 matrix, quadrant chart, Venn-style relationship, radar/spider chart, bar chart, column chart, treemap, or sunburst-style hierarchy.
- Numeric categories, factor weights, scores, rankings, top-N lists, benchmarks, survey-style responses, feature importance, or priority weights -> bar chart or column chart first; radar/spider chart only when multiple dimensions compare the same options; matrix when the goal is a decision.
- Time-series numbers, growth, decline, forecast, trend, month/quarter/year movement, before-after trend, or performance over time -> line chart or area chart; waterfall for stepwise change; candlestick only for market/price context when data is supplied or clearly contextual.
- Dates, phases, publishing plans, launches, roadmaps, rollouts, milestones, chronology, historical sequence, or implementation schedule -> timeline, roadmap, milestone chart, Gantt-style plan, calendar view, event chain, story arc, or chronology chart.
- Distribution, spread, variance, correlation, clusters, outliers, frequency, segments, or Pareto-style root-cause analysis -> histogram, scatter plot, bubble chart, heatmap, box plot, violin plot, or Pareto chart. Use qualitative placeholder values unless exact data is supplied.
- Process, step-by-step procedure, workflow, funnel, pipeline, user journey, approval path, handoff, if/then decision, troubleshooting path, or how-it-works section -> flowchart, process map, workflow diagram, swimlane, decision tree, pipeline diagram, user journey map, service blueprint, state machine, sequence diagram, activity diagram, or use-case diagram.
- Directional movement from sources to destinations, including money, value, data, attention, users, leads, energy, conversions, or budget allocation -> Sankey diagram only when there is a clear directional source-to-destination flow.
- Hierarchy, taxonomy, categories, pillars, clusters, parent-child structure, lineage, ancestry, version chain, inheritance, topic clusters, or classification -> lineage graph, tree diagram, hierarchy chart, taxonomy, ontology, dendrogram, mind map, or concept map.
- Relationship network, dependencies, connected entities, stakeholders, ecosystem, causal links, influence map, nodes/edges, graph database idea, or signal network -> knowledge graph, node-link diagram, dependency graph, causal graph, directed/undirected/weighted graph, bipartite graph, ERD, graph schema, class diagram, or object diagram.
- System, product structure, software/data/infrastructure architecture, components, deployment, database, API stack, integration map, operating model, or wiring -> architecture diagram, system diagram, block diagram, component diagram, deployment diagram, infrastructure diagram, database schema, ERD, class/object diagram, or circuit/wiring-style diagram.
- Spatial, location, route, geography, territory, city/country/region, floor/site layout, local journey, or coverage area -> geographic map, bubble map, route map, topographic-style map, floor plan, site map, conceptual map, or journey map.
- Abstract idea, emotional hook, brand atmosphere, storytelling scene, hero support, metaphor, or section mood without label-heavy data -> image block / visual illustration, not abc-diagram.

Placement rules:
- Place the visual close to the paragraph or section it clarifies.
- Do not dump visuals at the end. Do not force a visual into every section.
- Keep at least one meaningful prose paragraph between any two visuals.

Data-backed visual rules:
- Do not invent raw internet data, chart numbers, source-backed insights, market share, rankings, prices, or timelines.
- If the user supplies raw data, source links, notes, citations, or copied research in the inputs, analyze that supplied data and turn the insights into coded diagrams/tables/charts where useful.
- If source data is not supplied, use qualitative diagrams only and avoid numeric data-backed chart claims.
- Any chart that uses numbers must make clear whether the values are user-supplied, placeholders, or qualitative examples.
`;
}
