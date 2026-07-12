export const CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS: Record<string, number> = {
  "career-path-generator": 5,
  "career-transition-planner": 7,
  "target-role-fit-analyzer": 5,
  "skills-gap-analyzer": 5,
  "job-search-strategy-generator": 7,
  "ats-resume-generator": 7,
  "resume-rewriter-humanizer": 7,
  "job-tailored-resume-optimizer": 9,
  "ats-readiness-analyzer": 7,
  "achievement-bullet-generator": 3,
  "job-description-decoder": 5,
  "cover-letter-generator": 5,
  "application-question-answer-generator": 5,
  "job-application-tracker-template-generator": 3,
  "linkedin-profile-optimizer": 7,
  "professional-bio-elevator-pitch-generator": 5,
  "portfolio-copy-generator": 7,
  "networking-recruiter-message-generator": 3,
  "interview-question-generator": 3,
  "interview-answer-coach": 5,
  "star-story-builder": 5,
  "mock-interview-preparation-pack-generator": 7,
  "interview-follow-up-generator": 3,
  "salary-negotiation-script-generator": 7,
  "job-offer-comparison-generator": 7,
  "performance-review-self-assessment-generator": 7,
  "promotion-case-generator": 7,
  "manager-one-on-one-prep-generator": 3,
  "workplace-conversation-planner": 5,
  "resignation-letter-generator": 3,
  "freelance-proposal-generator": 7,
  "scope-of-work-generator": 7,
  "client-discovery-questionnaire-generator": 5,
  "client-onboarding-kickoff-pack-generator": 9,
  "professional-headshot-generator": 7,
};

export const CAREER_PROFESSIONAL_TOOL_SLUGS = Object.keys(CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Executive", 9],
  ["Detailed", 7],
  ["Standard", 5],
  ["Quick", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 7], ["5 versions", 5], ["3 versions", 3], ["1 version", 2]];
const QUESTION_CREDITS: Array<[string, number]> = [["20 questions", 7], ["15 questions", 5], ["10 questions", 3], ["5 questions", 2]];
const BULLET_CREDITS: Array<[string, number]> = [["12 bullets", 7], ["8 bullets", 5], ["5 bullets", 3], ["3 bullets", 2]];
const INTERVIEW_DURATION_CREDITS: Array<[string, number]> = [["60-minute", 9], ["45-minute", 7], ["30-minute", 5], ["15-minute", 3]];
const MEETING_DURATION_CREDITS: Array<[string, number]> = [["60 minutes", 5], ["45 minutes", 4], ["30 minutes", 3], ["15 minutes", 2]];
const RESUME_LENGTH_CREDITS: Array<[string, number]> = [["Detailed CV", 11], ["Two-page", 9], ["Auto", 8], ["One-page", 7]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

function depthCredit(inputs: Record<string, string>, fallback: number) {
  const selected = inputs.output_depth || inputs.analysis_depth || inputs.plan_depth || inputs.audit_depth || inputs.coaching_depth || inputs.proposal_depth || inputs.scope_depth || inputs.pack_depth || inputs.case_depth || inputs.comparison_depth || inputs.preparation_depth || inputs.rewrite_depth || inputs.optimization_depth;
  return Math.max(fallback, matchCredit(selected, DEPTH_CREDITS, fallback));
}

export function calculateCareerProfessionalToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS[toolSlug] ?? 1;

  switch (toolSlug) {
    case "networking-recruiter-message-generator":
    case "star-story-builder":
    case "interview-follow-up-generator":
    case "resignation-letter-generator":
      return Math.max(base, matchCredit(inputs.variation_count, VERSION_CREDITS, base));
    case "interview-question-generator":
    case "client-discovery-questionnaire-generator":
      return Math.max(base, matchCredit(inputs.question_count, QUESTION_CREDITS, base));
    case "achievement-bullet-generator":
      return Math.max(base, matchCredit(inputs.bullet_count, BULLET_CREDITS, base));
    case "mock-interview-preparation-pack-generator":
      return Math.max(depthCredit(inputs, base), matchCredit(inputs.interview_duration, INTERVIEW_DURATION_CREDITS, base));
    case "manager-one-on-one-prep-generator":
      return Math.max(base, matchCredit(inputs.meeting_duration, MEETING_DURATION_CREDITS, base));
    case "ats-resume-generator":
    case "resume-rewriter-humanizer":
    case "job-tailored-resume-optimizer":
      return Math.max(depthCredit(inputs, base), matchCredit(inputs.resume_length, RESUME_LENGTH_CREDITS, base));
    case "application-question-answer-generator": {
      const questionCount = (inputs.questions || "").split(/\n+/).map((item) => item.trim()).filter(Boolean).length;
      return Math.max(base, questionCount >= 10 ? 9 : questionCount >= 6 ? 7 : questionCount >= 3 ? 5 : base);
    }
    default:
      return depthCredit(inputs, base);
  }
}

export function isCareerProfessionalTool(toolSlug: string) {
  return CAREER_PROFESSIONAL_TOOL_SLUGS.includes(toolSlug);
}

export function getCareerProfessionalToolBaseCost(toolSlug: string) {
  return CAREER_PROFESSIONAL_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
