export const DATA_ANALYSIS_BI_VISUAL_PRESETS: Record<string, { mode: "dashboard" | "charts" | "tree" | "lineage"; eyebrow: string; title: string; description: string }> = {
  "kpi-dashboard-blueprint-generator": {
    mode: "dashboard",
    eyebrow: "Decision-first dashboard architecture",
    title: "Design a governed KPI dashboard blueprint",
    description: "Translate supplied decisions, metric definitions, targets, trends, and drill paths into a deterministic dashboard wireframe—not a decorative mockup.",
  },
  "data-story-chart-pack-generator": {
    mode: "charts",
    eyebrow: "Source-bounded data storytelling",
    title: "Build a truthful chart pack from supplied values",
    description: "Generate chart specifications and deterministic SVG charts using only supplied numeric values, labels, definitions, and source identifiers.",
  },
  "metric-tree-driver-diagram-generator": {
    mode: "tree",
    eyebrow: "Governed metric decomposition",
    title: "Map outcomes, drivers, diagnostics, and guardrails",
    description: "Keep arithmetic relationships, operational drivers, and causal hypotheses visibly separate while preserving metric ownership and evidence boundaries.",
  },
  "data-lineage-model-map-generator": {
    mode: "lineage",
    eyebrow: "Source-to-consumption lineage",
    title: "Map systems, transformations, models, metrics, and reports",
    description: "Create a deterministic lineage map with explicit identifiers, owners, controls, and unverified links instead of invented dependencies.",
  },
};
