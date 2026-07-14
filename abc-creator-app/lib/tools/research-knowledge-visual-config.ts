export const RESEARCH_KNOWLEDGE_VISUAL_TOOL_SLUGS = [
  "knowledge-map-concept-graph-generator",
  "evidence-landscape-map-generator",
  "conceptual-framework-generator",
] as const;

export type ResearchKnowledgeVisualSlug = (typeof RESEARCH_KNOWLEDGE_VISUAL_TOOL_SLUGS)[number];

export const RESEARCH_KNOWLEDGE_VISUAL_PRESETS: Record<string, { title: string; eyebrow: string; description: string; mode: "network" | "evidence" | "framework" }> = {
  "knowledge-map-concept-graph-generator": {
    title: "Research Knowledge Graph Studio",
    eyebrow: "Source-linked concepts and relationships",
    description: "Build a traceable graph of concepts, entities, definitions, evidence links, uncertainty, clusters, and contested relationships.",
    mode: "network",
  },
  "evidence-landscape-map-generator": {
    title: "Evidence Map & Claim Network Studio",
    eyebrow: "Distribution, concentration, contradiction, and gaps",
    description: "Turn a supplied evidence inventory into a visual landscape while keeping publication volume separate from evidence strength.",
    mode: "evidence",
  },
  "conceptual-framework-generator": {
    title: "Research Framework Diagram Studio",
    eyebrow: "Constructs, mechanisms, context, and measurable implications",
    description: "Create a professional conceptual framework with explicit temporal order, mediators, moderators, confounders, assumptions, and source-backed links.",
    mode: "framework",
  },
};
