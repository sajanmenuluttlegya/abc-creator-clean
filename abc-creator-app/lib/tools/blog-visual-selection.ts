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
ABC visual mapping:
1. Comparison / strategy choice / pros-cons / alternatives / tradeoffs: comparison table, decision matrix, priority matrix, 2x2 matrix, SWOT-style matrix, quadrant chart, Venn-style relationship, radar/spider chart, bar/column chart, treemap, or sunburst-style hierarchy.
2. Trend / time / sequence / roadmap / milestones / growth or decline: line chart, area chart, timeline, roadmap, milestone chart, event chain, story arc, chronology chart, waterfall chart, histogram, scatter plot, bubble chart, heatmap, distribution chart, or Pareto chart.
3. Process / workflow / steps / journey / pipeline / decision path: flowchart, process map, workflow diagram, swimlane-style flow, decision tree, pipeline diagram, user journey map, service blueprint, sequence diagram, activity diagram, or use-case diagram.
4. Source-to-destination movement of money, value, traffic, attention, users, leads, energy, or data: Sankey diagram only when directional flow exists.
5. Hierarchy / lineage / ancestry / category / classification / pillars / clusters: tree diagram, lineage chart, org chart, taxonomy tree, dendrogram, mind map, concept map, or hierarchy chart.
6. Network / relationships / dependencies / entities / stakeholders / ecosystem / causal links: network graph, node-link diagram, knowledge graph, dependency graph, causal graph, directed/undirected/weighted graph, ERD, graph schema, class diagram, or object diagram.
7. System / product / infrastructure / data/software structure / components / deployment / database / wiring: architecture diagram, system diagram, block diagram, component diagram, deployment diagram, infrastructure diagram, database schema, ERD, class/object diagram, circuit/wiring-style diagram.
8. Spatial / route / geographic distribution / site or floor layout: map, choropleth-style map, bubble map, route map, topographic-style map, floor plan, site map, conceptual map, or journey map.
9. Normal editorial mood or concept illustration: use a textless image block, not an abc-diagram.`;

export function plainVisualText(value: string, max = 520) {
  const text = value.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|\[\]()]|:{1,}/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function inferBlogVisualType(textValue: string) {
  const text = plainVisualText(textValue, 900).toLowerCase();
  if (/money|revenue|budget|spend|traffic|leads|users|energy|attention|data flow|source|destination|allocation|moves from|flows from|funnel leakage|conversion path/.test(text)) return "sankey";
  if (/flow|process|workflow|step|pipeline|journey|sequence|decision path|how it works|service blueprint|user journey|handoff|approval/.test(text)) return "flowchart";
  if (/trend|timeline|over time|history|roadmap|phase|milestone|forecast|growth|decline|before and after|chronology|monthly|yearly|quarterly/.test(text)) return "line-chart";
  if (/compare|comparison|versus|vs\.?|alternative|option|pros|cons|matrix|priority|choice|tradeoff|swot|rank|score|benchmark/.test(text)) return "bar-chart";
  if (/category|classification|taxonomy|type of|types of|segment|pillar|cluster|hierarchy|level|family|lineage|ancestry|parent|child/.test(text)) return "taxonomy-tree";
  if (/relationship|network|dependency|entity|stakeholder|ecosystem|connected|causal|influence|link between|graph|node|edge/.test(text)) return "knowledge-graph";
  if (/system|architecture|infrastructure|component|database|deployment|stack|integration|api|schema|server|client|wiring|circuit/.test(text)) return "architecture-diagram";
  if (/location|geo|geographic|map|route|city|country|region|floor plan|site map|territory|area/.test(text)) return "concept-map";
  return "concept-map";
}

export function inferBlogVisualSpec(textValue: string, topic = "Article concept"): BlogVisualSpec {
  const context = plainVisualText(textValue, 220) || topic;
  const type = inferBlogVisualType(textValue);
  if (type === "sankey") return { type: "sankey", title: `Directional flow for ${topic}`, caption: `Source-to-destination flow implied by: ${context}`, flows: [["Source", "Primary channel", 2], ["Primary channel", "Main outcome", 2], ["Primary channel", "Secondary outcome", 1]] };
  if (type === "line-chart" || type === "bar-chart") return { type, title: `Data visual for ${topic}`, caption: `Use verified numbers if available. Current visual is qualitative and based on: ${context}`, metric: "Relative weight", xAxisLabel: "Factors", yAxisLabel: "Relative weight", nodes: [{ id: "context", label: "Context", value: 44 }, { id: "risk", label: "Risk", value: 62 }, { id: "opportunity", label: "Opportunity", value: 72 }, { id: "action", label: "Action", value: 56 }] };
  if (type === "taxonomy-tree") return { type, title: `Hierarchy map for ${topic}`, caption: `Organizes the section idea: ${context}`, nodes: ["Core idea", "Category A", "Category B", "Category C", "Decision point"], edges: [["Core idea", "Category A"], ["Core idea", "Category B"], ["Core idea", "Category C"], ["Category B", "Decision point"]] };
  if (type === "knowledge-graph") return { type, title: `Relationship map for ${topic}`, caption: `Maps the key relationships around: ${context}`, nodes: ["Core idea", "Driver", "Constraint", "Stakeholder", "Outcome"], edges: [["Driver", "Core idea"], ["Constraint", "Core idea"], ["Core idea", "Stakeholder"], ["Stakeholder", "Outcome"]] };
  if (type === "architecture-diagram") return { type, title: `System view for ${topic}`, caption: `Shows the main components implied by: ${context}`, nodes: ["Input", "Core system", "Decision layer", "Output", "Feedback"], edges: [["Input", "Core system"], ["Core system", "Decision layer"], ["Decision layer", "Output"], ["Output", "Feedback"]] };
  return { type: "flowchart", title: `Process visual for ${topic}`, caption: `Turns the nearby section into a practical flow: ${context}`, nodes: ["Start", "Assess context", "Choose path", "Apply action", "Review outcome"], edges: [["Start", "Assess context"], ["Assess context", "Choose path"], ["Choose path", "Apply action"], ["Apply action", "Review outcome"]] };
}
