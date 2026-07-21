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
import { serverScreenwritingTools } from "./server-screenwriting-tools";
import { serverFilmVideoTools } from "./server-film-video-tools";
import { serverAnimationTools } from "./server-animation-tools";
import { serverStoryboardComicTools } from "./server-storyboard-comic-tools";
import { serverProductivityPlanningTools } from "./server-productivity-planning-tools";
import { serverCareerProfessionalTools } from "./server-career-professional-tools";
import { serverInteriorArchitectureTools } from "./server-interior-architecture-tools";
import { serverFoodHospitalityTools } from "./server-food-hospitality-tools";
import { serverFashionApparelTools } from "./server-fashion-apparel-tools";
import { serverMarketingCampaignTools } from "./server-marketing-campaign-tools";
import { serverResearchKnowledgeTools } from "./server-research-knowledge-tools";
import { serverResearchKnowledgeVisualTools } from "./server-research-knowledge-visual-tools";
import { serverEducationLearningTools } from "./server-education-learning-tools";
import { serverEducationLearningVisualTools } from "./server-education-learning-visual-tools";
import { serverDataAnalysisBITools } from "./server-data-analysis-bi-tools";
import { serverDataAnalysisBIVisualTools } from "./server-data-analysis-bi-visual-tools";
import { serverFinanceAccountingTools } from "./server-finance-accounting-tools";
import { serverFinanceAccountingVisualTools } from "./server-finance-accounting-visual-tools";
import { serverLegalComplianceTools } from "./server-legal-compliance-tools";
import { serverLegalComplianceVisualTools } from "./server-legal-compliance-visual-tools";
import { serverCustomerSupportServiceTools } from "./server-customer-support-service-tools";
import { serverCustomerSupportServiceVisualTools } from "./server-customer-support-service-visual-tools";
import { serverSalesCRMRevOpsTools } from "./server-sales-crm-revops-tools";
import { serverSalesCRMRevOpsVisualTools } from "./server-sales-crm-revops-visual-tools";
import { serverHRPeopleOperationsTools } from "./server-hr-people-operations-tools";
import { serverHRPeopleOperationsVisualTools } from "./server-hr-people-operations-visual-tools";
import { serverCybersecurityITOperationsTools } from "./server-cybersecurity-it-operations-tools";
import { serverCybersecurityITOperationsVisualTools } from "./server-cybersecurity-it-operations-visual-tools";
import { serverPresentationPitchTools } from "./server-presentation-pitch-tools";
import { serverPresentationPitchVisualTools } from "./server-presentation-pitch-visual-tools";
import { serverPosterPromotionalTools } from "./server-poster-promotional-tools";

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
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug] || serverScreenwritingTools[toolSlug] || serverFilmVideoTools[toolSlug] || serverAnimationTools[toolSlug] || serverStoryboardComicTools[toolSlug] || serverProductivityPlanningTools[toolSlug] || serverCareerProfessionalTools[toolSlug] || serverInteriorArchitectureTools[toolSlug] || serverFoodHospitalityTools[toolSlug] || serverFashionApparelTools[toolSlug] || serverMarketingCampaignTools[toolSlug] || serverResearchKnowledgeVisualTools[toolSlug] || serverResearchKnowledgeTools[toolSlug] || serverEducationLearningVisualTools[toolSlug] || serverEducationLearningTools[toolSlug] || serverDataAnalysisBIVisualTools[toolSlug] || serverDataAnalysisBITools[toolSlug] || serverFinanceAccountingVisualTools[toolSlug] || serverFinanceAccountingTools[toolSlug] || serverLegalComplianceVisualTools[toolSlug] || serverLegalComplianceTools[toolSlug] || serverCustomerSupportServiceVisualTools[toolSlug] || serverCustomerSupportServiceTools[toolSlug] || serverSalesCRMRevOpsVisualTools[toolSlug] || serverSalesCRMRevOpsTools[toolSlug] || serverHRPeopleOperationsVisualTools[toolSlug] || serverHRPeopleOperationsTools[toolSlug] || serverCybersecurityITOperationsVisualTools[toolSlug] || serverCybersecurityITOperationsTools[toolSlug] || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug] || serverPosterPromotionalTools[toolSlug];
}

function validateCustomUnder49(inputs: Record<string, string>, selectorField: string, customField: string, label: string): ValidationResult | null {
  if (!/custom/i.test(inputs[selectorField] || "")) return null;
  const rawCount = (inputs[customField] || "").trim();
  const customCount = Number(rawCount);
  if (!rawCount || !Number.isInteger(customCount) || customCount < 1 || customCount >= 49) {
    return { ok: false, field: customField, error: `${label} must be a whole number from 1 to 48.` };
  }
  return null;
}

function validateScreenwritingCustomSceneCount(toolSlug: string, inputs: Record<string, string>): ValidationResult | null {
  if (toolSlug !== "scene-list-crafter") return null;
  return validateCustomUnder49(inputs, "scene_count", "custom_scene_count", "Custom scene count");
}

function validateFilmVideoCustomCounts(toolSlug: string, inputs: Record<string, string>): ValidationResult | null {
  if (toolSlug === "shot-list-generator") return validateCustomUnder49(inputs, "shot_count", "custom_shot_count", "Custom shot count");
  if (toolSlug === "episode-concept-generator") return validateCustomUnder49(inputs, "episode_count", "custom_episode_count", "Custom episode count");
  return null;
}

function validateAnimationCustomCounts(toolSlug: string, inputs: Record<string, string>): ValidationResult | null {
  if (toolSlug === "2d-animation-scene-list-generator") return validateCustomUnder49(inputs, "scene_count", "custom_scene_count", "Custom scene count");
  if (toolSlug === "2d-animation-episode-idea-generator") return validateCustomUnder49(inputs, "episode_count", "custom_episode_count", "Custom episode count");
  return null;
}

function validateStoryboardComicCustomCounts(toolSlug: string, inputs: Record<string, string>): ValidationResult | null {
  if (["storyboard-panel-generator", "comic-strip-script-generator", "webtoon-episode-generator"].includes(toolSlug)) return validateCustomUnder49(inputs, "panel_count", "custom_panel_count", "Custom panel count");
  if (toolSlug === "scene-blocking-generator") return validateCustomUnder49(inputs, "beat_count", "custom_beat_count", "Custom beat count");
  if (toolSlug === "frame-by-frame-animation-plan-generator") return validateCustomUnder49(inputs, "frame_count", "custom_frame_count", "Custom frame count");
  if (toolSlug === "animatic-script-generator") return validateCustomUnder49(inputs, "shot_count", "custom_shot_count", "Custom shot count");
  return null;
}

function validatePresentationCustomCount(toolSlug: string, inputs: Record<string, string>): ValidationResult | null {
  if (!serverPresentationPitchTools[toolSlug] && !serverPresentationPitchVisualTools[toolSlug]) return null;
  return validateCustomUnder49(inputs, "slide_count", "custom_slide_count", "Custom slide count");
}

function validateRegisteredTool(toolSlug: string, inputs: Record<string, string>): ValidationResult {
  const tool = getRegisteredTool(toolSlug);
  if (!tool) return { ok: false, error: `Unknown tool: ${toolSlug}` };
  for (const field of tool.requiredInputs) {
    const cleaned = typeof inputs[field.id] === "string" ? inputs[field.id].trim() : "";
    const minLength = field.minLength ?? 1;
    if (field.required && cleaned.length < minLength) return { ok: false, field: field.id, error: `${field.label} is required and must be at least ${minLength} characters.` };
  }
  const screenwritingCustomCountError = validateScreenwritingCustomSceneCount(toolSlug, inputs);
  if (screenwritingCustomCountError) return screenwritingCustomCountError;
  const filmVideoCustomCountError = validateFilmVideoCustomCounts(toolSlug, inputs);
  if (filmVideoCustomCountError) return filmVideoCustomCountError;
  const animationCustomCountError = validateAnimationCustomCounts(toolSlug, inputs);
  if (animationCustomCountError) return animationCustomCountError;
  const storyboardComicCustomCountError = validateStoryboardComicCustomCounts(toolSlug, inputs);
  if (storyboardComicCustomCountError) return storyboardComicCustomCountError;
  const presentationCustomCountError = validatePresentationCustomCount(toolSlug, inputs);
  if (presentationCustomCountError) return presentationCustomCountError;
  for (const [field, value] of Object.entries(inputs)) {
    if (typeof value !== "string") return { ok: false, field, error: "Invalid input value." };
    const rule = tool.requiredInputs.find((item) => item.id === field);
    const maxLength = rule?.maxLength ?? 12000;
    if (value.length > maxLength) return { ok: false, field, error: `${rule?.label || field} is too long.` };
  }
  return { ok: true };
}

function getRawServerPrompt(toolSlug: string) {
  return serverSocialTools[toolSlug] || serverSocialCompletionBatchTools[toolSlug] || serverGeneralTools[toolSlug] || serverPlatformTools[toolSlug] || serverYouTubeCompletionBatchTools[toolSlug] || serverAdCopyBatchTools[toolSlug] || serverAiPromptBatchTools[toolSlug] || serverSummarizerUtilityBatchTools[toolSlug] || serverCampaignTools[toolSlug] || serverBlogBatchTools[toolSlug] || serverSeoBatchTools[toolSlug] || serverSeoUtilityBatchTools[toolSlug] || serverSeoCompletionBatchTools[toolSlug] || serverCreativeCopyBatchTools[toolSlug] || serverShortStoryBatchTools[toolSlug] || getEmailTool(toolSlug) || serverEmailEcommerceBatchTools[toolSlug] || serverSalesCopyBatchTools[toolSlug] || serverWritingBatchTools[toolSlug] || serverScreenwritingTools[toolSlug] || serverFilmVideoTools[toolSlug] || serverAnimationTools[toolSlug] || serverStoryboardComicTools[toolSlug] || serverProductivityPlanningTools[toolSlug] || serverCareerProfessionalTools[toolSlug] || serverInteriorArchitectureTools[toolSlug] || serverFoodHospitalityTools[toolSlug] || serverFashionApparelTools[toolSlug] || serverMarketingCampaignTools[toolSlug] || serverResearchKnowledgeVisualTools[toolSlug] || serverResearchKnowledgeTools[toolSlug] || serverEducationLearningVisualTools[toolSlug] || serverEducationLearningTools[toolSlug] || serverDataAnalysisBIVisualTools[toolSlug] || serverDataAnalysisBITools[toolSlug] || serverFinanceAccountingVisualTools[toolSlug] || serverFinanceAccountingTools[toolSlug] || serverLegalComplianceVisualTools[toolSlug] || serverLegalComplianceTools[toolSlug] || serverCustomerSupportServiceVisualTools[toolSlug] || serverCustomerSupportServiceTools[toolSlug] || serverSalesCRMRevOpsVisualTools[toolSlug] || serverSalesCRMRevOpsTools[toolSlug] || serverHRPeopleOperationsVisualTools[toolSlug] || serverHRPeopleOperationsTools[toolSlug] || serverCybersecurityITOperationsVisualTools[toolSlug] || serverCybersecurityITOperationsTools[toolSlug] || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug] || serverPosterPromotionalTools[toolSlug] || getBaseServerPrompt(toolSlug);
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
