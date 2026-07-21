export const EDUCATION_LEARNING_TOOL_CREDIT_COSTS: Record<string, number> = {
  "curriculum-unit-backward-design-planner": 9,
  "standards-alignment-unpacking-generator": 7,
  "lesson-plan-architect": 7,
  "learning-objectives-success-criteria-generator": 5,
  "scope-sequence-builder": 9,
  "project-based-learning-unit-planner": 9,
  "interdisciplinary-learning-experience-planner": 9,
  "classroom-activity-engagement-designer": 5,
  "worksheet-independent-practice-generator": 7,
  "discussion-seminar-debate-planner": 7,
  "inquiry-lab-investigation-planner": 9,
  "differentiated-instruction-planner": 7,
  "udl-lesson-adapter": 7,
  "reading-level-text-adaptation-generator": 7,
  "multilingual-learner-support-planner": 7,
  "accommodation-accessibility-support-planner": 7,
  "learner-grouping-station-rotation-planner": 7,
  "scaffold-worked-example-generator": 7,
  "diagnostic-assessment-generator": 7,
  "formative-assessment-exit-ticket-generator": 5,
  "quiz-test-generator": 9,
  "question-bank-assessment-blueprint-generator": 9,
  "rubric-success-criteria-generator": 7,
  "performance-task-authentic-assessment-generator": 9,
  "student-work-feedback-generator": 7,
  "misconception-error-analysis-generator": 7,
  "progress-monitoring-intervention-planner": 9,
  "study-guide-learning-pack-generator": 7,
  "flashcard-deck-generator": 7,
  "practice-test-answer-explanation-generator": 9,
  "retrieval-practice-spaced-review-planner": 7,
  "socratic-tutor-guided-hint-generator": 7,
  "exam-revision-planner": 7,
  "curriculum-alignment-map-generator": 9,
  "concept-prerequisite-map-generator": 7,
  "learning-journey-mastery-progression-generator": 9,
};

export const EDUCATION_LEARNING_TOOL_SLUGS = Object.keys(EDUCATION_LEARNING_TOOL_CREDIT_COSTS);

const DEPTH_CREDITS: Array<[string, number]> = [
  ["Comprehensive learning pack", 9],
  ["Detailed instructional", 7],
  ["Standard premium", 5],
  ["Quick professional", 2],
];
const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 5], ["5 versions", 3], ["3 versions", 2], ["1 version", 1]];
const ITEM_CREDITS: Array<[string, number]> = [["40 items", 15], ["30 items", 13], ["20 items", 9], ["16 items", 8], ["12 items", 7], ["8 items", 5]];
const QUESTION_CREDITS: Array<[string, number]> = [["40 questions", 15], ["30 questions", 13], ["20 questions", 9], ["15 questions", 8], ["10 questions", 7], ["5 questions", 5]];
const NODE_CREDITS: Array<[string, number]> = [["40 nodes", 13], ["30 nodes", 11], ["20 nodes", 9], ["10 nodes", 7]];
const LESSON_CREDITS: Array<[string, number]> = [["16 lessons", 15], ["12 lessons", 13], ["10 lessons", 11], ["8 lessons", 9], ["6 lessons", 7], ["4 lessons", 5]];

function includes(value: string | undefined, token: string) {
  return (value || "").toLowerCase().includes(token.toLowerCase());
}

function matchCredit(value: string | undefined, table: Array<[string, number]>, fallback: number) {
  return table.find(([token]) => includes(value, token))?.[1] ?? fallback;
}

export function calculateEducationLearningToolCreditCost(toolSlug: string, inputs: Record<string, string> = {}) {
  const base = EDUCATION_LEARNING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
  if (!EDUCATION_LEARNING_TOOL_SLUGS.includes(toolSlug)) return 1;

  let credits = inputs.output_depth ? matchCredit(inputs.output_depth, DEPTH_CREDITS, base) : base;
  if (["learning-objectives-success-criteria-generator", "classroom-activity-engagement-designer", "scaffold-worked-example-generator"].includes(toolSlug)) {
    return matchCredit(inputs.version_count, VERSION_CREDITS, 1);
  }
  if (["worksheet-independent-practice-generator", "diagnostic-assessment-generator", "quiz-test-generator", "question-bank-assessment-blueprint-generator", "flashcard-deck-generator", "practice-test-answer-explanation-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.item_count, ITEM_CREDITS, base));
  }
  if (["discussion-seminar-debate-planner", "formative-assessment-exit-ticket-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.question_count, QUESTION_CREDITS, base));
  }
  if (["curriculum-alignment-map-generator", "concept-prerequisite-map-generator", "learning-journey-mastery-progression-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.node_count, NODE_CREDITS, base));
  }
  if (["curriculum-unit-backward-design-planner", "scope-sequence-builder", "project-based-learning-unit-planner"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.lesson_count, LESSON_CREDITS, base));
  }
  return credits;
}

export function isEducationLearningTool(toolSlug: string) {
  return EDUCATION_LEARNING_TOOL_SLUGS.includes(toolSlug);
}

export function getEducationLearningToolBaseCost(toolSlug: string) {
  return EDUCATION_LEARNING_TOOL_CREDIT_COSTS[toolSlug] ?? 1;
}
