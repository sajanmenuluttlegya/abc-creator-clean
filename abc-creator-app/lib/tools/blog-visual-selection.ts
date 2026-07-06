export type BlogVisualSpec = {
  type?: string;
  title?: string;
  caption?: string;
  metric?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  nodes?: Array<string | { id?: string; label?: string; value?: number }>;
  edges?: Array<[string, string, string?]>;
  flows?: Array<[string, string, number?]>;
  entities?: Array<{ id?: string; name?: string; label?: string; fields?: string[] }>;
};

export const BLOG_VISUAL_SELECTION_RULES = `
ABC visual mapping by data/content type:
1. Categorical comparison / options / pros-cons / alternatives / tradeoffs / rankings: comparison table, matrix, decision matrix, priority matrix, 2x2 matrix, quadrant chart, Venn-style relationship, radar/spider chart, bar chart, column chart, treemap, or sunburst-style hierarchy.
2. Numeric categories / scores / weights / factor importance / benchmarks: bar chart or column chart first; radar/spider chart when several dimensions are compared across one or more choices; matrix when the output is a decision support view.
3. Continuous time / trend / growth / decline / forecast / monthly, yearly, quarterly, before-after: line chart or area chart; waterfall when explaining stepwise change; candlestick only for market/price movement when supplied or clearly contextual.
4. Sequence / chronology / phases / rollout / milestones / roadmap / publishing plan: timeline, roadmap, milestone chart, Gantt-style plan, calendar view, event chain, story arc, or chronology chart.
5. Distribution / spread / variance / segments / clusters / outliers / correlation: histogram, scatter plot, bubble chart, heatmap, box plot, violin plot, or Pareto chart. Use qualitative placeholder values if no real data is supplied.
6. Process / workflow / steps / journey / pipeline / decision path / approval / handoff: flowchart, process map, workflow diagram, swimlane-style flow, decision tree, pipeline diagram, user journey map, service blueprint, sequence diagram, activity diagram, or use-case diagram.
7. Directional source-to-destination movement of money, value, traffic, attention, users, leads, energy, or data: Sankey diagram only when there is a real directional flow.
8. Hierarchy / lineage / ancestry / category / classification / pillars / topic clusters / parent-child: lineage graph, tree diagram, hierarchy chart, taxonomy, ontology, dendrogram, mind map, or concept map.
9. Network / relationships / dependencies / entities / stakeholders / ecosystem / causal links / nodes and edges: knowledge graph, node-link diagram, dependency graph, causal graph, directed/undirected/weighted graph, ERD, graph schema, class diagram, or object diagram.
10. System / product / infrastructure / data/software structure / components / deployment / database / wiring: architecture diagram, system diagram, block diagram, component diagram, deployment diagram, infrastructure diagram, database schema, ERD, class/object diagram, circuit/wiring-style diagram.
11. Spatial / route / geographic distribution / site or floor layout: map, choropleth-style map, bubble map, route map, topographic-style map, floor plan, site map, conceptual map, or journey map.
12. Normal editorial mood, metaphor, brand story, hero support, or concept illustration: use a textless image block, not an abc-diagram.`;

export function plainVisualText(value: string, max = 520) {
  const text = value.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|\[\]()]|:{1,}/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function inferBlogVisualType(textValue: string) {
  const text = plainVisualText(textValue, 1100).toLowerCase();

  if (/\b(sankey|flows? from|moves? from|source(?:s)? to destination|traffic flow|data flow|money flow|revenue flow|budget allocation|lead flow|attention flow|energy flow|conversion path|funnel leakage|allocation across)\b/.test(text)) return "sankey";
  if (/\b(architecture|infrastructure|component|deployment|stack|integration|api|schema|server|client|database|data model|data warehouse|system design|wiring|circuit|platform layer|service layer)\b/.test(text)) return "architecture-diagram";
  if (/\b(entity|entities|relationship model|erd|database table|foreign key|schema relationship|object model|class model)\b/.test(text)) return "erd";
  if (/\b(lineage|ancestry|ancestor|descendant|parent child|parent-child|family tree|genealogy|pedigree|data lineage|origin path|inheritance path)\b/.test(text)) return "lineage-graph";
  if (/\b(category|classification|taxonomy|types of|type of|segment|pillar|cluster|hierarchy|levels?|nested|framework layers?|content cluster|topic cluster|ontology)\b/.test(text)) return "taxonomy";
  if (/\b(relationship|network|dependency|stakeholder|ecosystem|connected|causal|influence|link between|graph|node|edge|interdependency|map of players|signal network)\b/.test(text)) return "knowledge-graph";
  if (/\b(location|geo|geographic|map|route|city|country|region|floor plan|site map|territory|area|local|nearby|journey map|spatial)\b/.test(text)) return "map";
  if (/\b(flow|process|workflow|step|pipeline|journey|decision path|how it works|service blueprint|user journey|handoff|approval|sequence diagram|activity|use case|decision tree|swimlane)\b/.test(text)) return "flowchart";
  if (/\b(roadmap|rollout|implementation plan|phase|milestone|gantt|calendar|publishing plan|content calendar|launch plan|release plan)\b/.test(text)) return "roadmap";
  if (/\b(timeline|over time|history|chronology|before and after|event chain|story arc|monthly|yearly|quarterly|week by week|trend over)\b/.test(text)) return "timeline";
  if (/\b(trend|growth|decline|forecast|performance over|change over|line chart|area chart)\b/.test(text)) return "line-chart";
  if (/\b(distribution|spread|variance|outlier|correlation|scatter|bubble|heatmap|histogram|pareto|box plot|violin|frequency)\b/.test(text)) return "bar-chart";
  if (/\b(matrix|priority|prioritize|decision|scorecard|criteria|quadrant|swot|risk vs reward|effort vs impact|impact vs effort|compare|comparison|versus|vs\.?|alternative|option|pros|cons|tradeoff)\b/.test(text)) return "matrix";
  if (/\b(rank|ranking|score|benchmark|weight|factor|importance|bar chart|column chart|top \d+|best|worst)\b/.test(text)) return "bar-chart";

  return "concept-map";
}

function chartNodes(context: string) {
  return [
    { id: "context", label: "Context", value: 44 },
    { id: "constraint", label: "Constraint", value: 58 },
    { id: "opportunity", label: "Opportunity", value: 72 },
    { id: "action", label: "Action", value: 56 },
  ];
}

export function inferBlogVisualSpec(textValue: string, topic = "Article concept"): BlogVisualSpec {
  const context = plainVisualText(textValue, 240) || topic;
  const type = inferBlogVisualType(textValue);

  if (type === "sankey") return { type: "sankey", title: `Directional flow for ${topic}`, caption: `Qualitative source-to-destination flow implied by: ${context}`, flows: [["Source", "Primary path", 2], ["Primary path", "Main outcome", 2], ["Primary path", "Secondary outcome", 1]] };
  if (type === "matrix") return { type: "matrix", title: `Decision matrix for ${topic}`, caption: `Qualitative decision support based on: ${context}`, metric: "Relative priority", xAxisLabel: "Options", yAxisLabel: "Priority", nodes: [{ id: "fit", label: "Fit", value: 72 }, { id: "effort", label: "Effort", value: 48 }, { id: "risk", label: "Risk", value: 54 }, { id: "reward", label: "Reward", value: 76 }] };
  if (type === "line-chart" || type === "timeline" || type === "roadmap") return { type, title: `${type === "roadmap" ? "Roadmap" : type === "timeline" ? "Timeline" : "Trend"} for ${topic}`, caption: `Use verified values/dates if supplied. Current visual is qualitative and based on: ${context}`, metric: "Relative progress", xAxisLabel: "Phase", yAxisLabel: "Relative movement", nodes: chartNodes(context) };
  if (type === "bar-chart") return { type: "bar-chart", title: `Factor comparison for ${topic}`, caption: `Use verified numbers if supplied. Current visual is qualitative and based on: ${context}`, metric: "Relative weight", xAxisLabel: "Factors", yAxisLabel: "Relative weight", nodes: chartNodes(context) };
  if (type === "taxonomy" || type === "lineage-graph") return { type, title: `${type === "lineage-graph" ? "Lineage" : "Taxonomy"} map for ${topic}`, caption: `Organizes the section idea: ${context}`, nodes: ["Core idea", "Parent category", "Branch A", "Branch B", "Decision point"], edges: [["Core idea", "Parent category"], ["Parent category", "Branch A"], ["Parent category", "Branch B"], ["Branch B", "Decision point"]] };
  if (type === "knowledge-graph" || type === "concept-map") return { type, title: `Relationship map for ${topic}`, caption: `Maps the key relationships around: ${context}`, nodes: ["Core idea", "Driver", "Constraint", "Stakeholder", "Outcome"], edges: [["Driver", "Core idea"], ["Constraint", "Core idea"], ["Core idea", "Stakeholder"], ["Stakeholder", "Outcome"]] };
  if (type === "architecture-diagram" || type === "flowchart" || type === "map") return { type, title: `${type === "map" ? "Map" : type === "flowchart" ? "Process" : "System"} view for ${topic}`, caption: `Shows the structure implied by: ${context}`, nodes: ["Input", "Core layer", "Decision point", "Output", "Review"], edges: [["Input", "Core layer"], ["Core layer", "Decision point"], ["Decision point", "Output"], ["Output", "Review"]] };
  if (type === "erd") return { type: "erd", title: `Entity view for ${topic}`, caption: `Shows entities implied by: ${context}`, entities: [{ name: "Entity A", fields: ["id", "name", "status"] }, { name: "Entity B", fields: ["id", "entity_a_id", "value"] }, { name: "Outcome", fields: ["id", "result", "updated_at"] }], edges: [["Entity A", "Entity B"], ["Entity B", "Outcome"]] };

  return { type: "flowchart", title: `Process visual for ${topic}`, caption: `Turns the nearby section into a practical flow: ${context}`, nodes: ["Start", "Assess context", "Choose path", "Apply action", "Review outcome"], edges: [["Start", "Assess context"], ["Assess context", "Choose path"], ["Choose path", "Apply action"], ["Apply action", "Review outcome"]] };
}
