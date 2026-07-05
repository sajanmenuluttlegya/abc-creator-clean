import { getServerPrompt as getBaseServerPrompt, validateToolInputs as validateBaseToolInputs } from "./server-prompts";
import { serverSocialTools } from "./server-social-tools";
import { serverSocialCompletionBatchTools } from "./server-social-completion-batch-tools";
import { serverGeneralTools } from "./server-general-tools";
import { serverPlatformTools } from "./server-platform-tools";
import { serverYouTubeCompletionBatchTools } from "./server-youtube-completion-batch-tools";
import { serverAdCopyBatchTools } from "./server-ad-copy-batch-tools";
import { serverAiPromptBatchTools } from "./server-ai-prompt-batch-tools";
import { serverSummarizerUtilityBatchTools } from "./server-summarizer-utility-batch-tools";
import { serverCampaignTools } from "./server-campaign-tools";
import { serverBlogBatchTools } from "./server-blog-batch-tools";
import { serverSeoBatchTools } from "./server-seo-batch-tools";
import { serverSeoUtilityBatchTools } from "./server-seo-utility-batch-tools";
import { serverSeoCompletionBatchTools } from "./server-seo-completion-batch-tools";
import { serverCreativeCopyBatchTools } from "./server-creative-copy-batch-tools";
import { serverShortStoryBatchTools } from "./server-short-story-batch-tools";
import { serverEmailBatchTools } from "./server-email-batch-tools";
import { serverEmailCopyBatchTools } from "./server-email-copy-batch-tools";
import { serverEmailEcommerceBatchTools } from "./server-email-ecommerce-batch-tools";
import { serverSalesCopyBatchTools } from "./server-sales-copy-batch-tools";
import { serverWritingBatchTools } from "./server-writing-batch-tools";

type ValidationResult = { ok: true } | { ok: false; field?: string; error: string };
type ToolFieldRule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };
type RegisteredServerTool = { requiredInputs: ToolFieldRule[] };
type ServerPrompt = RegisteredServerTool & { system: string; outputGuide: string; creditCost: number };

const blogImageTools = new Set(["blog-content", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "quick-1-click-blog-post", "comparison-blog-writer", "youtube-video-to-blog-post"]);

const strictBlogVisualRules = `

Strict ABC blog visual rules:
- For blog post generators with images enabled, include 2-5 inline image blocks according to article length and usefulness: Short/standard = 2, Long = 3, Very long = 4, Premium/Authority = 5 maximum. If the user selected No images, output zero image blocks. If the user selected Hero image only, output only one hero image.
- Never place two images or visual blocks together. Always put a meaningful normal paragraph between any image, table, chart, graph, flowchart, diagram, or other visual block.
- Attach every image to the exact relevant section. Do not group images at the top or bottom, and do not repeat generic stock-style subjects.
- Use image blocks only for textless editorial illustrations and concept mood visuals. Do not use image blocks for charts, dashboards, maps, node maps, flowcharts, Sankeys, data visuals, or text-heavy visuals.
- Use abc-diagram JSON blocks for non-image visuals, and choose the visual type by meaning:
  1) Comparison, strategy choice, pros/cons, alternatives, prioritization, tradeoffs: use comparison table, decision matrix, priority matrix, 2x2 matrix, SWOT-style matrix, quadrant chart, Venn-style relationship, radar/spider chart, bar chart, column chart, treemap, or sunburst-style hierarchy.
  2) Trend, time, sequence, movement over time, history, roadmap, phases, milestones, forecast, growth/decline: use line chart, area chart, timeline, roadmap, milestone chart, event chain, story arc, chronology chart, waterfall chart, histogram, scatter plot, bubble chart, heatmap, box/violin-style distribution, or Pareto chart.
  3) Flow, process, workflow, steps, journey, pipeline, sequence, decision path, service experience: use flowchart, process map, workflow diagram, swimlane-style flow, decision tree, pipeline diagram, user journey map, service blueprint, state machine-style flow, sequence diagram, activity diagram, or use-case diagram.
  4) Source-to-destination flow of money, value, energy, traffic, attention, leads, users, or data: use Sankey diagram only when real directional flow exists.
  5) Hierarchy, lineage, ancestry, categories, classification, pillars, clusters, org structure: use tree diagram, lineage chart, family/pedigree-style tree, org chart, taxonomy tree, dendrogram, mind map, concept map, or hierarchy chart.
  6) Network, relationships, dependencies, entities, stakeholders, ecosystem, causal/influence links: use network graph, node-link diagram, knowledge graph, dependency graph, causal graph, directed/undirected/weighted graph, bipartite-style graph, ERD, graph schema, class diagram, or object diagram.
  7) System, product, infrastructure, data/software structure, components, deployment, database, wiring: use architecture diagram, system diagram, block diagram, component diagram, deployment/infrastructure diagram, database schema, ERD, class/object diagram, circuit/wiring-style diagram.
  8) Spatial or location-based meaning, route, geographic distribution, site/floor layout: use map, choropleth-style map, bubble map, route map, topographic-style map, floor plan, site map, conceptual map, or journey map.
- For each image block, use the exact structure: ### Image N: Section Image for <section title>, then Placement, Prompt, Alt Text, and Caption.`;

function getEmailTool(toolSlug: string) {
  return serverEmailBatchTools[toolSlug] || serverEmailCopyBatchTools[toolSlug] || serverEmailEcommerceBatchTools[toolSlug] || (toolSlug.includes("email") ? serverEmailBatchTools["professional-email-personalizer"] : undefined);
}

function getRegisteredTool(toolSlug: string): RegisteredServerTool | undefined {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug];
}

function validateRegisteredTool(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  const tool = getRegisteredTool(toolSlug);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolSlug}` };
  for (const field of tool.requiredInputs) {
    const cleaned = typeof inputs[field.id] === "string" ? inputs[field.id].trim() : "";
    const minLength = field.minLength ?? 1;
    if (field.required && cleaned.length < minLength) return { ok: false, field: field.id, error: `${field.label} is required and must be at least ${minLength} characters.` };
  }
  for (const [field, value] of Object.entries(inputs)) {
    if (typeof value !== "string") return { ok: false, field, error: "Invalid input value." };
    const rule = tool.requiredInputs.find((item) => item.id === field);
    const maxLength = rule?.maxLength ?? 12000;
    if (value.length > maxLength) return { ok: false, field, error: `${rule?.label || field} is too long.` };
  }
  return { ok: true };
}

function getRawServerPrompt(toolSlug: string) {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug] || getBaseServerPrompt(toolSlug);
}

export function getServerPrompt(toolSlug: string) {
  const prompt = getRawServerPrompt(toolSlug) as ServerPrompt | undefined;
  if (!prompt || !blogImageTools.has(toolSlug)) return prompt;
  return {
    ...prompt,
    system: `${prompt.system}${strictBlogVisualRules}`,
    outputGuide: `${prompt.outputGuide} Enforce ABC visual mapping: pick graph/flowchart/data visual type from the meaning of the section, keep 2-5 images only when enabled, no two visuals together, and attach every image or diagram to the section it supports.`,
  };
}

export function validateToolInputs(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  return getRegisteredTool(toolSlug) ? validateRegisteredTool(toolSlug, inputs) : validateBaseToolInputs(toolSlug, inputs);
}
