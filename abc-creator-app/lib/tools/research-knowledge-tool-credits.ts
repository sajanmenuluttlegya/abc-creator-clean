export const RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS: Record<string, number> = {
  "research-question-refiner": 5,
  "research-scope-protocol-planner": 9,
  "literature-search-strategy-generator": 9,
  "boolean-search-query-builder": 7,
  "source-discovery-triage-planner": 7,
  "source-credibility-relevance-evaluator": 7,
  "academic-paper-analyzer": 7,
  "study-design-methods-analyzer": 9,
  "citation-context-analyzer": 7,
  "evidence-extraction-matrix-generator": 9,
  "literature-review-synthesizer": 9,
  "systematic-review-protocol-generator": 9,
  "screening-eligibility-planner": 7,
  "risk-of-bias-quality-appraisal-planner": 9,
  "evidence-certainty-strength-assessor": 9,
  "contradiction-consensus-mapper": 7,
  "research-gap-finder": 7,
  "theoretical-framework-builder": 7,
  "conceptual-framework-generator": 7,
  "claim-evidence-matrix-generator": 7,
  "fact-checking-research-plan-generator": 7,
  "research-notes-organizer": 5,
  "source-annotation-reading-note-generator": 5,
  "citation-reference-audit-generator": 7,
  "knowledge-base-architecture-planner": 7,
  "knowledge-map-concept-graph-generator": 7,
  "evidence-landscape-map-generator": 9,
  "argument-map-generator": 7,
  "research-brief-generator": 7,
  "executive-research-report-generator": 9,
  "research-to-action-decision-memo-generator": 7,
  "qualitative-interview-guide-generator": 7,
  "survey-research-plan-generator": 9,
  "data-collection-coding-plan-generator": 9,
  "research-ethics-consent-checklist-generator": 7,
};

export const RESEARCH_KNOWLEDGE_TOOL_SLUGS = Object.keys(RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Comprehensive research pack", 9],
  ["Detailed analytical", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 5], ["5 versions", 3], ["3 versions", 2], ["1 version", 1]];
const SOURCE_COUNT_CREDITS: Array<[string, number]> = [["50 sources", 15], ["30 sources", 11], ["20 sources", 9], ["10 sources", 7], ["5 sources", 5]];
const STUDY_COUNT_CREDITS: Array<[string, number]> = [["50 studies", 15], ["30 studies", 11], ["20 studies", 9], ["10 studies", 7], ["Custom from supplied material", 9]];
const NODE_COUNT_CREDITS: Array<[string, number]> = [["50 nodes", 13], ["30 nodes", 9], ["20 nodes", 7], ["10 nodes", 5]];
const QUESTION_COUNT_CREDITS: Array<[string, number]> = [["40 questions", 13], ["30 questions", 11], ["20 questions", 9], ["10 questions", 7]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(value: string | undefined, fallback: number) {
  return value ? matchCredit(value, DEPTH_CREDITS, fallback) : fallback;
}

export function calculateResearchKnowledgeToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!RESEARCH_KNOWLEDGE_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? depthCredit(inputs.output_depth, base) : base;
  if (["research-question-refiner", "boolean-search-query-builder", "theoretical-framework-builder"].includes(toolSlug)) {
    return matchCredit(inputs.version_count || inputs.query_versions, VERSION_CREDITS, 1);
  }
  if (toolSlug === "source-discovery-triage-planner") {
    credits = Math.max(credits, matchCredit(inputs.source_count, SOURCE_COUNT_CREDITS, base));
  }
  if (toolSlug === "evidence-extraction-matrix-generator") {
    credits = Math.max(credits, matchCredit(inputs.study_count, STUDY_COUNT_CREDITS, base));
  }
  if (["knowledge-map-concept-graph-generator", "argument-map-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.node_count, NODE_COUNT_CREDITS, base));
  }
  if (["qualitative-interview-guide-generator", "survey-research-plan-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.question_count, QUESTION_COUNT_CREDITS, base));
  }
  return credits;
}

export function isResearchKnowledgeTool(toolSlug: string) {
  return RESEARCH_KNOWLEDGE_TOOL_SLUGS.includes(toolSlug);
}

export function getResearchKnowledgeToolBaseCost(toolSlug: string) {
  return RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
