import { BLOG_TOOL_CREDIT_COSTS } from "./blog-tool-credits";
import { PLATFORM_TOOL_CREDIT_COSTS } from "./platform-tool-credits";
import { CAMPAIGN_TOOL_CREDIT_COSTS } from "./campaign-tool-credits";
import { BLOG_BATCH_TOOL_CREDIT_COSTS } from "./blog-batch-tool-credits";
import { SEO_BATCH_TOOL_CREDIT_COSTS } from "./seo-batch-tool-credits";
import { WRITING_BATCH_TOOL_CREDIT_COSTS } from "./writing-batch-tool-credits";
import { BOOK_TOOL_CREDIT_COSTS, BOOK_OUTPUT_LENGTH_CREDITS, SCENE_LENGTH_CREDITS, CHAPTER_LENGTH_CREDITS, REWRITE_INTENSITY_ADDS } from "./book-tool-credits";
import { SCREENWRITING_TOOL_CREDIT_COSTS, SCREENWRITING_TOOL_SLUGS, calculateScreenwritingToolCreditCost, getScreenwritingToolBaseCost, isScreenwritingTool } from "./screenwriting-tool-credits";
import { FILM_VIDEO_TOOL_CREDIT_COSTS, FILM_VIDEO_TOOL_SLUGS, calculateFilmVideoToolCreditCost, getFilmVideoToolBaseCost, isFilmVideoTool } from "./film-video-tool-credits";
import { ANIMATION_TOOL_CREDIT_COSTS, ANIMATION_TOOL_SLUGS, calculateAnimationToolCreditCost, getAnimationToolBaseCost, isAnimationTool } from "./animation-tool-credits";
import { STORYBOARD_COMIC_TOOL_CREDIT_COSTS, STORYBOARD_COMIC_TOOL_SLUGS, calculateStoryboardComicToolCreditCost, getStoryboardComicToolBaseCost, isStoryboardComicTool } from "./storyboard-comic-tool-credits";
import { PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS, PRODUCTIVITY_PLANNING_TOOL_SLUGS, calculateProductivityPlanningToolCreditCost, getProductivityPlanningToolBaseCost, isProductivityPlanningTool } from "./productivity-planning-tool-credits";
import { CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS, CAREER_PROFESSIONAL_TOOL_SLUGS, calculateCareerProfessionalToolCreditCost, getCareerProfessionalToolBaseCost, isCareerProfessionalTool } from "./career-professional-tool-credits";
import { INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS, INTERIOR_ARCHITECTURE_TOOL_SLUGS, calculateInteriorArchitectureToolCreditCost, getInteriorArchitectureToolBaseCost, isInteriorArchitectureTool } from "./interior-architecture-tool-credits";
import { FOOD_HOSPITALITY_TOOL_CREDIT_COSTS, FOOD_HOSPITALITY_TOOL_SLUGS, calculateFoodHospitalityToolCreditCost, getFoodHospitalityToolBaseCost, isFoodHospitalityTool } from "./food-hospitality-tool-credits";
import { FASHION_APPAREL_TOOL_CREDIT_COSTS, FASHION_APPAREL_TOOL_SLUGS, calculateFashionApparelToolCreditCost, getFashionApparelToolBaseCost, isFashionApparelTool } from "./fashion-apparel-tool-credits";
import { MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS, MARKETING_CAMPAIGN_TOOL_SLUGS, calculateMarketingCampaignToolCreditCost, getMarketingCampaignToolBaseCost, isMarketingCampaignTool } from "./marketing-campaign-tool-credits";
import { RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS, RESEARCH_KNOWLEDGE_TOOL_SLUGS, calculateResearchKnowledgeToolCreditCost, getResearchKnowledgeToolBaseCost, isResearchKnowledgeTool } from "./research-knowledge-tool-credits";
import { EDUCATION_LEARNING_TOOL_CREDIT_COSTS, EDUCATION_LEARNING_TOOL_SLUGS, calculateEducationLearningToolCreditCost, getEducationLearningToolBaseCost, isEducationLearningTool } from "./education-learning-tool-credits";
import { DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS, DATA_ANALYSIS_BI_TOOL_SLUGS, calculateDataAnalysisBIToolCreditCost, getDataAnalysisBIToolBaseCost, isDataAnalysisBITool } from "./data-analysis-bi-tool-credits";
import { FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS, FINANCE_ACCOUNTING_TOOL_SLUGS, calculateFinanceAccountingToolCreditCost, getFinanceAccountingToolBaseCost, isFinanceAccountingTool } from "./finance-accounting-tool-credits";
import { LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS, LEGAL_COMPLIANCE_TOOL_SLUGS, calculateLegalComplianceToolCreditCost, getLegalComplianceToolBaseCost, isLegalComplianceTool } from "./legal-compliance-tool-credits";
import { CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS, CUSTOMER_SUPPORT_SERVICE_TOOL_SLUGS, calculateCustomerSupportServiceToolCreditCost, getCustomerSupportServiceToolBaseCost, isCustomerSupportServiceTool } from "./customer-support-service-tool-credits";
import { SALES_CRM_REVOPS_TOOL_CREDIT_COSTS, SALES_CRM_REVOPS_TOOL_SLUGS, calculateSalesCRMRevOpsToolCreditCost, getSalesCRMRevOpsToolBaseCost, isSalesCRMRevOpsTool } from "./sales-crm-revops-tool-credits";
import { HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS, HR_PEOPLE_OPERATIONS_TOOL_SLUGS, calculateHRPeopleOperationsToolCreditCost, getHRPeopleOperationsToolBaseCost, isHRPeopleOperationsTool } from "./hr-people-operations-tool-credits";
import { CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS, CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS, calculateCybersecurityITOperationsToolCreditCost, getCybersecurityITOperationsToolBaseCost, isCybersecurityITOperationsTool } from "./cybersecurity-it-operations-tool-credits";
import { PRESENTATION_PITCH_TOOL_CREDIT_COSTS, PRESENTATION_PITCH_TOOL_SLUGS, calculatePresentationPitchToolCreditCost, getPresentationPitchToolBaseCost, isPresentationPitchTool } from "./presentation-pitch-tool-credits";
import { POSTER_PROMOTIONAL_TOOL_CREDIT_COSTS, POSTER_PROMOTIONAL_TOOL_SLUGS, calculatePosterPromotionalToolCreditCost, getPosterPromotionalToolBaseCost, isPosterPromotionalTool } from "./poster-promotional-tool-credits";

export type ToolInputs = Record<string, string>;
export type CreditEstimate = { credits: number; isDynamic: boolean; label: string };

export function scaleCreditAmount(credits: number) {
  const safeCredits = Math.ceil(Number.isFinite(credits) ? Math.max(0, credits) : 0);
  if (safeCredits <= 0) return 0;
  const exactScale: Record<number, number> = { 1: 2, 2: 5, 3: 5, 4: 6, 5: 9, 6: 11, 7: 13, 8: 15, 9: 17 };
  return exactScale[safeCredits] ?? safeCredits + 20;
}

function creditText(credits: number) { return `${credits} credit${credits === 1 ? "" : "s"}`; }

export const IMAGE_CREDITS_PER_IMAGE: number = scaleCreditAmount(1);
export const IMAGE_EDIT_CREDITS: number = 4;
export const IMAGE_GENERATION_TOOL_SLUGS = ["blog-content", "pro-image-brief-for-blog", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "quick-1-click-blog-post", "comparison-blog-writer", "youtube-video-to-blog-post", "kids-book-generator", ...Object.keys(BOOK_TOOL_CREDIT_COSTS)] as const;

const EXACT_TOOL_CREDIT_OVERRIDES: Record<string, number> = {
  "poem-generator": 2, "slogan-generator": 2, "tagline-generator": 2, "name-generator": 2, "headline-generator": 2, "universal-prompt-enhancer": 2, "video-prompt-generator": 3,
  "subject-line-generator": 2, "cold-email-generator": 5, "email-newsletter-generator": 3, "follow-up-email-generator": 2, "sales-email-generator": 3, "welcome-email-generator": 2, "product-launch-email-generator": 3,
  "value-proposition-generator": 2, "pain-point-generator": 2, "feature-to-benefit-converter": 2, "offer-generator": 3, "aida-copy-generator": 2, "pas-copy-generator": 2, "objection-handler-generator": 3, "sales-pitch-generator": 3, "usp-generator": 2, "product-angle-generator": 2,
  "keyword-generator": 2, "seo-title-generator": 2, "seo-description-generator": 2, "faq-schema-generator": 4, "content-gap-ideas": 4, "content-audit": 5, "seo-score": 3, "seo-meta-citation-gap-finder": 5, "ai-search-visibility-score": 5,
  "ai-email-generator": 2, "email-campaign-writer": 3, "product-description-generator": 3, "amazon-product-listing-generator": 4, "shopify-product-description-generator": 3, "product-benefit-generator": 2, "product-review-writer": 3, "product-comparison-writer": 3,
  "social-media-post-generator": 5, "social-media-calendar": 4, "replies-for-facebook": 2, "replies-for-twitter-x": 2, "replies-for-linkedin": 2, "replies-for-instagram": 2, "instagram-threads-generator": 5, "tiktok-caption-generator": 3, "motivational-posts-generator": 3, "social-hook-generator": 3, "twitter-x-post-generator": 3, "instagram-reel-script": 3, "tiktok-video-script-generator": 3, "linkedin-post-generator": 3, "twitter-x-thread-generator": 5, "facebook-post-generator": 3, "content-calendar-generator": 4, "carousel-post-generator": 5,
  "youtube-hook-generator": 2, "youtube-tags-generator": 2, "youtube-description-generator": 2, "youtube-chapters-generator": 3, "thumbnail-text-generator": 2, "thumbnail-prompt-generator": 3, "youtube-script-writer": 4, "youtube-shorts-script": 3, "documentary-script-writer": 5, "retention-planner": 4, "thumbnail-ab-ideas": 3, "competitor-video-analyzer": 4, "voiceover-script-optimizer": 3, "youtube-audience-analysis": 4,
  "facebook-ad-copy": 4, "google-ad-copy": 4, "google-ads-pro": 5, "instagram-ad-copy": 4, "tiktok-ads": 4, "linkedin-ad": 4, "twitter-x-ads": 4, "commercial-ad-script": 5, "ad-hook-creator": 3, "ad-copy-generator": 4, "ad-targeting-helper": 3, "find-user-pain-point": 3,
  "bullet-point-summarizer": 2, "meeting-notes-summarizer": 3, "file-text-summarizer": 3, "explain-like-im-5": 2, "grammar-fixer": 2, "text-humanizer": 3, "key-takeaways-generator": 2, "action-items-extractor": 2,
  ["fan-fiction-short-" + "drama-builder"]: 3, ["short-" + "drama-creator-studio"]: 4, ["cold-" + "email-personalizer"]: 5,
};

const EXACT_VARIATION_TOOLS = new Set(["book-idea-generator", "instagram-page-name-bio-generator"]);
const WRITING_BATCH_TOOL_SLUGS = Object.keys(WRITING_BATCH_TOOL_CREDIT_COSTS);
const BOOK_TOOL_SLUGS = Object.keys(BOOK_TOOL_CREDIT_COSTS);
const BASE_TOOL_CREDITS: Record<string, number> = {
  "blog-topic-ideas": 1, "blog-outline": 3, "blog-content": 7, "pro-image-brief-for-blog": 1, "blog-seo-pack": 5,
  ...BLOG_TOOL_CREDIT_COSTS, ...BLOG_BATCH_TOOL_CREDIT_COSTS, ...SEO_BATCH_TOOL_CREDIT_COSTS, ...PLATFORM_TOOL_CREDIT_COSTS, ...CAMPAIGN_TOOL_CREDIT_COSTS, ...WRITING_BATCH_TOOL_CREDIT_COSTS, ...BOOK_TOOL_CREDIT_COSTS, ...SCREENWRITING_TOOL_CREDIT_COSTS, ...FILM_VIDEO_TOOL_CREDIT_COSTS, ...ANIMATION_TOOL_CREDIT_COSTS, ...STORYBOARD_COMIC_TOOL_CREDIT_COSTS, ...PRODUCTIVITY_PLANNING_TOOL_CREDIT_COSTS, ...CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS, ...INTERIOR_ARCHITECTURE_TOOL_CREDIT_COSTS, ...FOOD_HOSPITALITY_TOOL_CREDIT_COSTS, ...FASHION_APPAREL_TOOL_CREDIT_COSTS, ...MARKETING_CAMPAIGN_TOOL_CREDIT_COSTS, ...RESEARCH_KNOWLEDGE_TOOL_CREDIT_COSTS, ...EDUCATION_LEARNING_TOOL_CREDIT_COSTS, ...DATA_ANALYSIS_BI_TOOL_CREDIT_COSTS, ...FINANCE_ACCOUNTING_TOOL_CREDIT_COSTS, ...LEGAL_COMPLIANCE_TOOL_CREDIT_COSTS, ...CUSTOMER_SUPPORT_SERVICE_TOOL_CREDIT_COSTS, ...SALES_CRM_REVOPS_TOOL_CREDIT_COSTS, ...HR_PEOPLE_OPERATIONS_TOOL_CREDIT_COSTS, ...CYBERSECURITY_IT_OPERATIONS_TOOL_CREDIT_COSTS, ...PRESENTATION_PITCH_TOOL_CREDIT_COSTS, ...EXACT_TOOL_CREDIT_OVERRIDES,
  "kids-book-generator": 1, "image-to-instagram-caption": 3, "instagram-page-name-bio-generator": 1, "social-media-bio-generator": 1, "business-name-generator": 1, "long-tail-keyword-generator": 2, "ai-prompt-generator": 1, "ai-paraphrasing-tool": 2, "ai-paragraph-generator": 2, "ai-report-writing": 3, "product-description": 3,
};

const BLOG_TOPIC_IDEA_COUNT_CREDITS: Array<[string, number]> = [["50 ideas", 5], ["30 ideas", 4], ["20 ideas", 3], ["10 ideas", 2], ["5 ideas", 1]];
const BLOG_OUTLINE_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 15], ["Premium pillar article", 9], ["Very long article", 7], ["Long article", 5], ["Standard article", 4], ["Short article", 3]];
const BLOG_CONTENT_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 49], ["Premium pillar article", 39], ["Very long article", 27], ["Long article", 15], ["Standard article", 9], ["Short article", 7]];
const PRESET_BLOG_WORD_COUNT_CREDITS: Array<[string, number]> = [["Authority pillar article", 32], ["Premium pillar article", 16], ["Very long article", 13], ["Long article", 10], ["Standard article", 8], ["Short article", 6]];
const ARTICLE_REWRITE_LENGTH_CREDITS: Array<[string, number]> = [["Authority rewrite", 5], ["Premium rewrite", 5], ["Very long rewrite", 5], ["Long rewrite", 5], ["Standard rewrite", 2], ["Short rewrite", 1]];
const QUICK_BLOG_LENGTH_CREDITS: Array<[string, number]> = [["authority", 20], ["very long", 10], ["long", 8], ["standard", 6], ["short", 4], ["Very short", 3]];
const REPORT_LENGTH_CREDITS: Array<[string, number]> = [["Premium report", 5], ["Detailed report", 5], ["Standard report", 2], ["Short report", 1]];
const IMAGE_BRIEF_COUNT_CREDITS: Array<[string, number]> = [["7 images", 3], ["5 images", 2], ["3 images", 2], ["1 image", 1]];
const VARIATION_COUNT_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 2], ["3 variations", 1]];
const PROMPT_VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];
const BOOK_TITLE_COUNT_CREDITS: Array<[string, number]> = [["10 titles", 5], ["5 titles", 3], ["3 titles", 2], ["1 title", 1]];
const WRITING_OUTPUT_LENGTH_CREDITS: Array<[string, number]> = [["Detailed", 5], ["Long", 5], ["Medium", 2], ["Short", 1]];
const SCRIPT_LENGTH_CREDITS: Array<[string, number]> = [["10 minutes", 5], ["5 minutes", 5], ["2 minutes", 2], ["60 seconds", 1], ["30 seconds", 1]];
const SLIDE_COUNT_CREDITS: Array<[string, number]> = [["15 slides", 5], ["10 slides", 2], ["8 slides", 2], ["5 slides", 1]];
const PARAGRAPH_COUNT_CREDITS: Array<[string, number]> = [["10 paragraphs", 5], ["5 paragraphs", 2], ["3 paragraphs", 2], ["1 paragraph", 1]];
const QUOTE_COUNT_CREDITS: Array<[string, number]> = [["10 versions", 5], ["5 versions", 2], ["3 versions", 1], ["1 version", 1]];

function includes(value: string | undefined, token: string) { return (value || "").toLowerCase().includes(token.toLowerCase()); }
function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) { return table.find(([token]) => includes(value, token))?.[1] ?? fallback; }
function yes(value: string | undefined) { return (value || "").trim().toLowerCase() === "yes"; }
function parseCustomImageCount(value: string | undefined) { const count = Math.floor(Number(value)); return Number.isFinite(count) && count >= 1 ? Math.min(count, 19) : null; }
function calculateCustomImageBriefCredits(value: string | undefined) { const count = parseCustomImageCount(value); return count ? Number((count * 0.9).toFixed(1)) : 1; }
function calculateVariationToolCredits(value: string | undefined) { return matchCredit(value, VARIATION_COUNT_CREDITS, 1); }
function calculatePromptVariationCredits(value: string | undefined) { return matchCredit(value, PROMPT_VARIATION_CREDITS, 1); }
function calculateExactVariationCredits(value: string | undefined) { return matchCredit(value, PROMPT_VARIATION_CREDITS, 1); }
function isPromptVariationTool(toolSlug: string) { const words = toolSlug.replace(/-/g, " "); return /\bprompt\b/.test(words) || toolSlug === "universal-prompt-enhancer"; }
function calculateWritingLengthCredits(inputs: ToolInputs, fallback = 1) { return matchCredit(inputs.output_length, WRITING_OUTPUT_LENGTH_CREDITS, fallback); }
function calculateBookOutputCredits(inputs: ToolInputs, fallback: number) { return matchCredit(inputs.output_length, BOOK_OUTPUT_LENGTH_CREDITS, fallback); }
function calculateBookRewriteCredits(inputs: ToolInputs) { return matchCredit(inputs.original_chapter_length, CHAPTER_LENGTH_CREDITS, 9) + matchCredit(inputs.rewrite_mode, REWRITE_INTENSITY_ADDS, 5); }
function calculateFullBlogPresetCredits(toolSlug: string, inputs: ToolInputs) { let credits = matchCredit(inputs.word_count, PRESET_BLOG_WORD_COUNT_CREDITS, 8); if (toolSlug === "advanced-blog-post") { if (includes(inputs.expertise_level, "Expert")) credits += 2; if (includes(inputs.expertise_level, "Advanced")) credits += 1; if (includes(inputs.examples_needed, "Many") || includes(inputs.examples_needed, "Detailed")) credits += 1; } return credits; }
function calculateWritingToolCredits(toolSlug: string, inputs: ToolInputs) { if (toolSlug === "quotes-generator") return matchCredit(inputs.quote_count, QUOTE_COUNT_CREDITS, 1); if (toolSlug === "presentation-slides-text-generator") return matchCredit(inputs.slide_count, SLIDE_COUNT_CREDITS, 1); if (toolSlug === "paragraph-generator" || toolSlug === "ai-paragraph-generator") return matchCredit(inputs.paragraph_count, PARAGRAPH_COUNT_CREDITS, 1); if (toolSlug === "kids-video-script-generator" || toolSlug === "whiteboard-animation-script") return Math.max(calculateWritingLengthCredits(inputs, 1), matchCredit(inputs.script_length, SCRIPT_LENGTH_CREDITS, 1)); return calculateWritingLengthCredits(inputs, BASE_TOOL_CREDITS[toolSlug] ?? 1); }
function isLengthCreditField(field: string) { const normalized = field.toLowerCase(); return normalized === "length" || normalized.endsWith("_length") || normalized.includes("word_count") || normalized === "words_per_section" || normalized.endsWith("_depth") || normalized.includes("duration") || normalized === "edit_level" || normalized === "humanize_level" || normalized === "chapter_length" || normalized === "original_chapter_length" || normalized === "rewrite_mode" || normalized === "scene_length"; }
function calculateLengthSelectionCredits(inputs: ToolInputs = {}) { let credits = 0; for (const [field, value] of Object.entries(inputs)) { if (!isLengthCreditField(field) || typeof value !== "string") continue; const normalized = value.toLowerCase(); if (/\d+\s*minutes?/.test(normalized)) credits = Math.max(credits, 9); else if (/\d+\s*seconds?/.test(normalized) && !/(15|30)\s*seconds?/.test(normalized)) credits = Math.max(credits, 5); else if (/epic\s+chapter/.test(normalized)) credits = Math.max(credits, 37); else if (/premium\s+chapter/.test(normalized)) credits = Math.max(credits, 28); else if (/long\s+chapter/.test(normalized)) credits = Math.max(credits, 19); else if (/standard\s+chapter/.test(normalized)) credits = Math.max(credits, 11); else if (/short\s+chapter/.test(normalized)) credits = Math.max(credits, 9); else if (/premium|executive|editorial|very\s+long|detailed|detail|large|long|extended|expanded|expand/.test(normalized)) credits = Math.max(credits, 9); else if (/professional|stronger|natural|medium|standard|balanced|mixed|moderate/.test(normalized)) credits = Math.max(credits, 5); else if (/quick|simple|short|small|brief|concise|light|compact/.test(normalized)) credits = Math.max(credits, 2); } return credits; }

export function supportsImageGeneration(toolSlug: string) { return IMAGE_GENERATION_TOOL_SLUGS.includes(toolSlug as (typeof IMAGE_GENERATION_TOOL_SLUGS)[number]); }
export function calculateImageGenerationCredits(imageCount: number) { const safeCount = Number.isFinite(imageCount) ? Math.min(Math.max(Math.floor(imageCount), 1), 7) : 1; return safeCount * IMAGE_CREDITS_PER_IMAGE; }
export function calculateImageEditCredits() { return IMAGE_EDIT_CREDITS; }

function calculateRawToolCreditCost(toolSlug: string, inputs: ToolInputs = {}) {
  switch (toolSlug) {
    case "blog-topic-ideas": return matchCredit(inputs.idea_count, BLOG_TOPIC_IDEA_COUNT_CREDITS, 1);
    case "blog-outline": return matchCredit(inputs.word_count, BLOG_OUTLINE_WORD_COUNT_CREDITS, 3);
    case "blog-content": { let credits = matchCredit(inputs.word_count, BLOG_CONTENT_WORD_COUNT_CREDITS, 7); if (includes(inputs.article_depth, "Detailed")) credits += 4; if (includes(inputs.article_depth, "Expert")) credits += 10; if (yes(inputs.include_table)) credits += 4; if (yes(inputs.include_list)) credits += 3; if (yes(inputs.include_key_takeaways)) credits += 2; if (yes(inputs.include_faq)) credits += 3; if (includes(inputs.image_brief_mode, "Hero image brief only") || includes(inputs.image_brief_mode, "Hero image only")) credits += 3; if (includes(inputs.image_brief_mode, "Hero + section image briefs") || includes(inputs.image_brief_mode, "Hero + section images")) credits += 8; return credits; }
    case "human-style-blog-post":
    case "seo-optimized-blog-post":
    case "advanced-blog-post": return calculateFullBlogPresetCredits(toolSlug, inputs);
    case "rewrite-article-with-keywords": return matchCredit(inputs.rewrite_length, ARTICLE_REWRITE_LENGTH_CREDITS, 1);
    case "quick-1-click-blog-post": return matchCredit(inputs.article_length, QUICK_BLOG_LENGTH_CREDITS, 6);
    case "ai-report-writing": return matchCredit(inputs.report_length, REPORT_LENGTH_CREDITS, 1);
    case "ai-paragraph-generator": return calculateWritingToolCredits(toolSlug, inputs);
    case "chapter-writer": return matchCredit(inputs.chapter_length, CHAPTER_LENGTH_CREDITS, 9);
    case "chapter-rewriter-humanizer": return calculateBookRewriteCredits(inputs);
    case "scene-generator": return matchCredit(inputs.scene_length, SCENE_LENGTH_CREDITS, 5);
    case "kids-book-generator": return calculateBookOutputCredits(inputs, 1);
    case "blog-to-social-posts": return calculateVariationToolCredits(inputs.post_count);
    case "blog-to-email": return calculateVariationToolCredits(inputs.email_count);
    case "blog-to-reels-script": return calculateVariationToolCredits(inputs.script_count);
    case "pro-image-brief-for-blog": return includes(inputs.image_count_guidance, "Custom image count") ? calculateCustomImageBriefCredits(inputs.custom_image_count) : matchCredit(inputs.image_count_guidance, IMAGE_BRIEF_COUNT_CREDITS, 1);
    default: return WRITING_BATCH_TOOL_SLUGS.includes(toolSlug) ? calculateWritingToolCredits(toolSlug, inputs) : BASE_TOOL_CREDITS[toolSlug] ?? 1;
  }
}

export function calculateToolCreditCost(toolSlug: string, inputs: ToolInputs = {}) {
  if (isPosterPromotionalTool(toolSlug)) return calculatePosterPromotionalToolCreditCost(toolSlug, inputs);
  if (isPresentationPitchTool(toolSlug)) return calculatePresentationPitchToolCreditCost(toolSlug, inputs);
  if (isCybersecurityITOperationsTool(toolSlug)) return calculateCybersecurityITOperationsToolCreditCost(toolSlug, inputs);
  if (isHRPeopleOperationsTool(toolSlug)) return calculateHRPeopleOperationsToolCreditCost(toolSlug, inputs);
  if (isSalesCRMRevOpsTool(toolSlug)) return calculateSalesCRMRevOpsToolCreditCost(toolSlug, inputs);
  if (isCustomerSupportServiceTool(toolSlug)) return calculateCustomerSupportServiceToolCreditCost(toolSlug, inputs);
  if (isLegalComplianceTool(toolSlug)) return calculateLegalComplianceToolCreditCost(toolSlug, inputs);
  if (isFinanceAccountingTool(toolSlug)) return calculateFinanceAccountingToolCreditCost(toolSlug, inputs);
  if (isDataAnalysisBITool(toolSlug)) return calculateDataAnalysisBIToolCreditCost(toolSlug, inputs);
  if (isEducationLearningTool(toolSlug)) return calculateEducationLearningToolCreditCost(toolSlug, inputs);
  if (isResearchKnowledgeTool(toolSlug)) return calculateResearchKnowledgeToolCreditCost(toolSlug, inputs);
  if (isMarketingCampaignTool(toolSlug)) return calculateMarketingCampaignToolCreditCost(toolSlug, inputs);
  if (isFashionApparelTool(toolSlug)) return calculateFashionApparelToolCreditCost(toolSlug, inputs);
  if (isFoodHospitalityTool(toolSlug)) return calculateFoodHospitalityToolCreditCost(toolSlug, inputs);
  if (isInteriorArchitectureTool(toolSlug)) return calculateInteriorArchitectureToolCreditCost(toolSlug, inputs);
  if (isCareerProfessionalTool(toolSlug)) return calculateCareerProfessionalToolCreditCost(toolSlug, inputs);
  if (isProductivityPlanningTool(toolSlug)) return calculateProductivityPlanningToolCreditCost(toolSlug, inputs);
  if (isStoryboardComicTool(toolSlug)) return calculateStoryboardComicToolCreditCost(toolSlug, inputs);
  if (isAnimationTool(toolSlug)) return calculateAnimationToolCreditCost(toolSlug, inputs);
  if (isFilmVideoTool(toolSlug)) return calculateFilmVideoToolCreditCost(toolSlug, inputs);
  if (isScreenwritingTool(toolSlug)) return calculateScreenwritingToolCreditCost(toolSlug, inputs);
  if (toolSlug === "book-title-generator") return matchCredit(inputs.title_count, BOOK_TITLE_COUNT_CREDITS, 1);
  if (EXACT_VARIATION_TOOLS.has(toolSlug)) return calculateExactVariationCredits(inputs.variation_count);
  if (isPromptVariationTool(toolSlug)) return calculatePromptVariationCredits(inputs.prompt_variations);
  if (toolSlug === "chapter-writer") return matchCredit(inputs.chapter_length, CHAPTER_LENGTH_CREDITS, 9);
  if (toolSlug === "chapter-rewriter-humanizer") return calculateBookRewriteCredits(inputs);
  if (toolSlug === "scene-generator") return matchCredit(inputs.scene_length, SCENE_LENGTH_CREDITS, 5);
  if (toolSlug === "kids-book-generator") return calculateBookOutputCredits(inputs, 1);
  if (BOOK_TOOL_SLUGS.includes(toolSlug)) return calculateBookOutputCredits(inputs, BOOK_TOOL_CREDIT_COSTS[toolSlug] ?? 1);
  const lengthCredits = calculateLengthSelectionCredits(inputs);
  const exactCredits = EXACT_TOOL_CREDIT_OVERRIDES[toolSlug];
  if (typeof exactCredits === "number") return Math.max(exactCredits, lengthCredits);
  return Math.max(scaleCreditAmount(calculateRawToolCreditCost(toolSlug, inputs)), lengthCredits);
}

const DYNAMIC_TOOLS = ["blog-topic-ideas", "blog-outline", "blog-content", "human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post", "rewrite-article-with-keywords", "quick-1-click-blog-post", "pro-image-brief-for-blog", "ai-report-writing", "ai-paragraph-generator", "blog-to-social-posts", "blog-to-email", "blog-to-reels-script", "ai-prompt-generator", "video-prompt-generator", "thumbnail-prompt-generator", "universal-prompt-enhancer", "book-idea-generator", "instagram-page-name-bio-generator", "kids-book-generator", "chapter-writer", "chapter-rewriter-humanizer", "scene-generator", ...BOOK_TOOL_SLUGS, ...WRITING_BATCH_TOOL_SLUGS, ...SCREENWRITING_TOOL_SLUGS, ...FILM_VIDEO_TOOL_SLUGS, ...ANIMATION_TOOL_SLUGS, ...STORYBOARD_COMIC_TOOL_SLUGS, ...PRODUCTIVITY_PLANNING_TOOL_SLUGS, ...CAREER_PROFESSIONAL_TOOL_SLUGS, ...INTERIOR_ARCHITECTURE_TOOL_SLUGS, ...FOOD_HOSPITALITY_TOOL_SLUGS, ...FASHION_APPAREL_TOOL_SLUGS, ...MARKETING_CAMPAIGN_TOOL_SLUGS, ...RESEARCH_KNOWLEDGE_TOOL_SLUGS, ...EDUCATION_LEARNING_TOOL_SLUGS, ...DATA_ANALYSIS_BI_TOOL_SLUGS, ...FINANCE_ACCOUNTING_TOOL_SLUGS, ...LEGAL_COMPLIANCE_TOOL_SLUGS, ...CUSTOMER_SUPPORT_SERVICE_TOOL_SLUGS, ...SALES_CRM_REVOPS_TOOL_SLUGS, ...HR_PEOPLE_OPERATIONS_TOOL_SLUGS, ...CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS, ...PRESENTATION_PITCH_TOOL_SLUGS, ...POSTER_PROMOTIONAL_TOOL_SLUGS];
export function getToolCreditEstimate(toolSlug: string, inputs: ToolInputs = {}): CreditEstimate { const credits = calculateToolCreditCost(toolSlug, inputs); return { credits, isDynamic: DYNAMIC_TOOLS.includes(toolSlug) || EXACT_VARIATION_TOOLS.has(toolSlug) || isPromptVariationTool(toolSlug) || calculateLengthSelectionCredits(inputs) > 0, label: creditText(credits) }; }
export function getToolCreditLabel(toolSlug: string) { if (isPosterPromotionalTool(toolSlug)) return `From ${creditText(getPosterPromotionalToolBaseCost(toolSlug))}`; if (isPresentationPitchTool(toolSlug)) return `From ${creditText(getPresentationPitchToolBaseCost(toolSlug))}`; if (isCybersecurityITOperationsTool(toolSlug)) return `From ${creditText(getCybersecurityITOperationsToolBaseCost(toolSlug))}`; if (isHRPeopleOperationsTool(toolSlug)) return `From ${creditText(getHRPeopleOperationsToolBaseCost(toolSlug))}`; if (isSalesCRMRevOpsTool(toolSlug)) return `From ${creditText(getSalesCRMRevOpsToolBaseCost(toolSlug))}`; if (isCustomerSupportServiceTool(toolSlug)) return `From ${creditText(getCustomerSupportServiceToolBaseCost(toolSlug))}`; if (isLegalComplianceTool(toolSlug)) return `From ${creditText(getLegalComplianceToolBaseCost(toolSlug))}`; if (isFinanceAccountingTool(toolSlug)) return `From ${creditText(getFinanceAccountingToolBaseCost(toolSlug))}`; if (isDataAnalysisBITool(toolSlug)) return `From ${creditText(getDataAnalysisBIToolBaseCost(toolSlug))}`; if (isEducationLearningTool(toolSlug)) return `From ${creditText(getEducationLearningToolBaseCost(toolSlug))}`; if (isResearchKnowledgeTool(toolSlug)) return `From ${creditText(getResearchKnowledgeToolBaseCost(toolSlug))}`; if (isMarketingCampaignTool(toolSlug)) return `From ${creditText(getMarketingCampaignToolBaseCost(toolSlug))}`; if (isFashionApparelTool(toolSlug)) return `From ${creditText(getFashionApparelToolBaseCost(toolSlug))}`; if (isFoodHospitalityTool(toolSlug)) return `From ${creditText(getFoodHospitalityToolBaseCost(toolSlug))}`; if (isInteriorArchitectureTool(toolSlug)) return `From ${creditText(getInteriorArchitectureToolBaseCost(toolSlug))}`; if (isCareerProfessionalTool(toolSlug)) return `From ${creditText(getCareerProfessionalToolBaseCost(toolSlug))}`; if (isProductivityPlanningTool(toolSlug)) return `From ${creditText(getProductivityPlanningToolBaseCost(toolSlug))}`; if (isStoryboardComicTool(toolSlug)) return `From ${creditText(getStoryboardComicToolBaseCost(toolSlug))}`; if (isAnimationTool(toolSlug)) return `From ${creditText(getAnimationToolBaseCost(toolSlug))}`; if (isFilmVideoTool(toolSlug)) return `From ${creditText(getFilmVideoToolBaseCost(toolSlug))}`; if (isScreenwritingTool(toolSlug)) return `From ${creditText(getScreenwritingToolBaseCost(toolSlug))}`; if (EXACT_VARIATION_TOOLS.has(toolSlug) || isPromptVariationTool(toolSlug)) return `From ${creditText(1)}`; if (toolSlug === "kids-book-generator") return `From ${creditText(1)}`; if (toolSlug === "chapter-writer") return `From ${creditText(9)}`; if (toolSlug === "chapter-rewriter-humanizer") return `From ${creditText(14)}`; if (toolSlug === "scene-generator") return `From ${creditText(5)}`; if (BOOK_TOOL_SLUGS.includes(toolSlug)) return `From ${creditText(BOOK_TOOL_CREDIT_COSTS[toolSlug] ?? 1)}`; const exactCredits = EXACT_TOOL_CREDIT_OVERRIDES[toolSlug]; if (typeof exactCredits === "number") return creditText(exactCredits); if (toolSlug === "blog-topic-ideas") return `From ${creditText(scaleCreditAmount(1))}`; if (toolSlug === "blog-outline") return `From ${creditText(scaleCreditAmount(3))}`; if (toolSlug === "blog-content") return `From ${creditText(scaleCreditAmount(7))}`; if (["human-style-blog-post", "seo-optimized-blog-post", "advanced-blog-post"].includes(toolSlug)) return `From ${creditText(scaleCreditAmount(6))}`; if (toolSlug === "quick-1-click-blog-post") return `From ${creditText(scaleCreditAmount(4))}`; if (["rewrite-article-with-keywords", "pro-image-brief-for-blog", "ai-report-writing", "ai-paragraph-generator", "blog-to-social-posts", "blog-to-email", "blog-to-reels-script"].includes(toolSlug)) return `From ${creditText(scaleCreditAmount(1))}`; if (WRITING_BATCH_TOOL_SLUGS.includes(toolSlug)) return `From ${creditText(scaleCreditAmount(1))}`; return creditText(scaleCreditAmount(BASE_TOOL_CREDITS[toolSlug] ?? 1)); }
