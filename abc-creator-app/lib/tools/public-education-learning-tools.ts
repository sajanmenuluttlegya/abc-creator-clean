import type { Tool, ToolInput } from "./public-tools";

const category = "Education / Learning Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const gradeOptions = ["Early childhood", "Grades 1-2", "Grades 3-5", "Grades 6-8", "Grades 9-10", "Grades 11-12", "Undergraduate", "Postgraduate / adult", "Professional training", "Custom from brief"];
const contextOptions = ["School classroom", "Higher education", "Tutoring", "Homeschool", "Self-study", "Professional / workplace learning", "Community / informal learning", "Custom from brief"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed instructional (7 credits)", "Comprehensive learning pack (9 credits)"];
const toneOptions = ["Teacher-ready and practical", "Academic and rigorous", "Learner-friendly", "Warm and encouraging", "Executive training style", "Plain-language expert", "Custom from brief"];
const frameworkOptions = ["Use supplied standards only", "Local / institutional standards from brief", "Competency-based framework", "Bloom-style cognitive demand", "UDL-informed design", "No formal framework", "Custom from brief"];
const durationOptions = ["15 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes", "Multi-session", "Custom from brief"];
const questionCountOptions = ["5 questions", "10 questions", "15 questions", "20 questions", "30 questions", "40 questions"];
const itemCountOptions = ["8 items", "12 items", "16 items", "20 items", "30 items", "40 items"];
const versionOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const nodeCountOptions = ["10 nodes", "20 nodes", "30 nodes", "40 nodes"];
const lessonCountOptions = ["4 lessons", "6 lessons", "8 lessons", "10 lessons", "12 lessons", "16 lessons"];

const commonTail: ToolInput[] = [
  { id: "grade_level", label: "Grade / Learner Level", type: "select", required: true, options: gradeOptions },
  { id: "learning_context", label: "Learning Context", type: "select", required: true, options: contextOptions },
  { id: "framework", label: "Standards / Learning Framework", type: "select", required: true, options: frameworkOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Standards / Learner Constraints to Preserve", type: "textarea", placeholder: "Exact standards, curriculum wording, approved content, learner needs, accommodations, terminology, assessment rules, safety constraints, or details that must remain unchanged.", required: false },
];

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

export const EDUCATION_LEARNING_VISUAL_TOOL_SLUGS = [
  "curriculum-alignment-map-generator",
  "concept-prerequisite-map-generator",
  "learning-journey-mastery-progression-generator",
] as const;

export const educationLearningTools: Tool[] = [
  textTool({
    slug: "curriculum-unit-backward-design-planner", name: "Curriculum Unit & Backward Design Planner", description: "Build a coherent unit from desired transfer, evidence, learning sequence, misconceptions, assessment, differentiation, and implementation constraints.", icon: "calendar", detailEmoji: "🧭", displayCreditCost: 9, aliases: ["unit-plan-generator", "backward-design-planner"],
    nextActions: [{ label: "Create the lesson sequence", href: "/tools/scope-sequence-builder", description: "Translate the unit into a paced sequence of lessons and checks." }],
    inputs: [
      { id: "unit_topic_purpose", label: "Unit Topic / Purpose", type: "textarea", placeholder: "Subject, topic, why it matters, authentic context, learner group, prior learning, and intended transfer.", required: true },
      { id: "standards_outcomes", label: "Standards / Intended Outcomes", type: "textarea", placeholder: "Paste exact standards, competencies, enduring understandings, essential questions, knowledge, skills, and success expectations.", required: true },
      { id: "evidence_constraints", label: "Evidence / Constraints", type: "textarea", placeholder: "Assessment requirements, available time, resources, class profile, accommodations, technology, safety, and non-negotiables.", required: true },
      { id: "lesson_count", label: "Unit Length", type: "select", required: true, options: lessonCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "standards-alignment-unpacking-generator", name: "Standards Alignment & Unpacking Generator", description: "Unpack supplied standards into concepts, skills, cognitive demand, evidence, prerequisites, misconceptions, and teachable success criteria without inventing standards codes.", icon: "check", detailEmoji: "📐", displayCreditCost: 7, aliases: ["standards-unpacker", "curriculum-alignment-analyzer"],
    inputs: [
      { id: "standards_text", label: "Exact Standards / Competencies", type: "textarea", placeholder: "Paste the complete official or institutional wording, codes, performance indicators, and related guidance.", required: true },
      { id: "subject_context", label: "Subject / Curriculum Context", type: "textarea", placeholder: "Course, unit, jurisdiction, institution, learner level, prior standards, and intended instructional use.", required: true },
      { id: "alignment_need", label: "Alignment Need", type: "textarea", placeholder: "Lesson, unit, assessment, curriculum audit, crosswalk, remediation, enrichment, or another purpose.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "lesson-plan-architect", name: "Lesson Plan Architect", description: "Create a complete lesson with objectives, prior-knowledge activation, modelling, guided practice, checks, differentiation, closure, and teacher decision points.", icon: "writing-pad", detailEmoji: "📝", displayCreditCost: 7, aliases: ["lesson-plan-generator", "teaching-plan-builder"],
    nextActions: [{ label: "Create formative checks", href: "/tools/formative-assessment-exit-ticket-generator", description: "Add aligned checks for understanding and an exit ticket." }],
    inputs: [
      { id: "lesson_topic_objective", label: "Lesson Topic / Objective", type: "textarea", placeholder: "What learners should understand or do, why it matters, and the exact lesson focus.", required: true },
      { id: "learner_prior_context", label: "Learners / Prior Knowledge", type: "textarea", placeholder: "Class profile, prior learning, interests, misconceptions, language needs, accommodations, and readiness variation.", required: true },
      { id: "resources_constraints", label: "Resources / Constraints", type: "textarea", placeholder: "Materials, technology, room, group size, safety, homework policy, required pedagogy, and unavailable resources.", required: false },
      { id: "lesson_duration", label: "Lesson Duration", type: "select", required: true, options: durationOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "learning-objectives-success-criteria-generator", name: "Learning Objectives & Success Criteria Generator", description: "Turn a topic or standard into observable, appropriately demanding objectives, success criteria, evidence, and learner-facing language.", icon: "check", detailEmoji: "🎯", displayCreditCost: 5, aliases: ["learning-objective-generator", "success-criteria-builder"],
    inputs: [
      { id: "topic_standard", label: "Topic / Standard / Competency", type: "textarea", placeholder: "Exact learning focus, standard wording, skill, concept, performance, or transfer goal.", required: true },
      { id: "learner_evidence_context", label: "Learner / Evidence Context", type: "textarea", placeholder: "Learner level, prior knowledge, assessment type, available time, accessibility needs, and what evidence is realistic.", required: true },
      { id: "version_count", label: "Objective Sets", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "scope-sequence-builder", name: "Scope & Sequence Builder", description: "Sequence knowledge and skills across lessons with prerequisites, pacing, checks, retrieval, differentiation, and contingency points.", icon: "calendar", detailEmoji: "🗓️", displayCreditCost: 9, aliases: ["course-sequence-generator", "curriculum-pacing-guide"],
    inputs: [
      { id: "course_unit_scope", label: "Course / Unit Scope", type: "textarea", placeholder: "Subject, topic boundaries, standards, total time, calendar constraints, and intended outcomes.", required: true },
      { id: "content_skills_prerequisites", label: "Content / Skills / Prerequisites", type: "textarea", placeholder: "Concepts, procedures, vocabulary, prior knowledge, dependencies, misconceptions, and required resources.", required: true },
      { id: "assessment_pacing", label: "Assessment / Pacing Requirements", type: "textarea", placeholder: "Required assessments, checkpoints, holidays, timetable, intervention windows, project dates, and flexibility.", required: false },
      { id: "lesson_count", label: "Sequence Length", type: "select", required: true, options: lessonCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "project-based-learning-unit-planner", name: "Project-Based Learning Unit Planner", description: "Design an authentic project with a driving question, milestones, inquiry, critique, collaboration, assessment, public product, and manageable classroom logistics.", icon: "folder", detailEmoji: "🛠️", displayCreditCost: 9, aliases: ["pbl-unit-generator", "project-learning-planner"],
    inputs: [
      { id: "project_context_question", label: "Project Context / Driving Question", type: "textarea", placeholder: "Authentic problem, audience, product, community or workplace context, and why learners should care.", required: true },
      { id: "standards_learning_goals", label: "Standards / Learning Goals", type: "textarea", placeholder: "Exact standards, subject knowledge, disciplinary practices, collaboration, communication, and transfer goals.", required: true },
      { id: "resources_timeline_risks", label: "Resources / Timeline / Risks", type: "textarea", placeholder: "Time, materials, technology, external experts, safety, equity, group size, access, and constraints.", required: true },
      { id: "lesson_count", label: "Project Length", type: "select", required: true, options: lessonCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interdisciplinary-learning-experience-planner", name: "Interdisciplinary Learning Experience Planner", description: "Connect multiple disciplines around a coherent problem while preserving each subject's concepts, practices, assessment evidence, and instructional integrity.", icon: "network", detailEmoji: "🔗", displayCreditCost: 9, aliases: ["cross-curricular-unit-planner", "interdisciplinary-lesson-generator"],
    inputs: [
      { id: "shared_theme_problem", label: "Shared Theme / Problem", type: "textarea", placeholder: "Central issue, phenomenon, text, place, event, design challenge, or authentic question.", required: true },
      { id: "disciplines_standards", label: "Disciplines / Standards", type: "textarea", placeholder: "For each discipline, paste exact standards, concepts, practices, vocabulary, and evidence requirements.", required: true },
      { id: "integration_constraints", label: "Integration / Logistics", type: "textarea", placeholder: "Teachers, timetable, shared products, assessment ownership, resources, coordination limits, and risks of superficial integration.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "classroom-activity-engagement-designer", name: "Classroom Activity & Engagement Designer", description: "Create purposeful learning activities with clear cognitive work, participation structures, timing, materials, checks, and inclusive alternatives.", icon: "idea", detailEmoji: "⚡", displayCreditCost: 5, aliases: ["classroom-activity-generator", "engagement-strategy-builder"],
    inputs: [
      { id: "learning_goal_content", label: "Learning Goal / Content", type: "textarea", placeholder: "Objective, content, skill, misconception, prior learning, and evidence learners should produce.", required: true },
      { id: "class_profile", label: "Class Profile", type: "textarea", placeholder: "Group size, age, readiness, interests, language, accessibility, participation patterns, and classroom culture.", required: true },
      { id: "activity_constraints", label: "Activity Constraints", type: "textarea", placeholder: "Time, room, materials, noise, movement, technology, safeguarding, individual/group expectations, and exclusions.", required: false },
      { id: "version_count", label: "Activity Options", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "worksheet-independent-practice-generator", name: "Worksheet & Independent Practice Generator", description: "Generate an instructionally aligned practice pack with examples, graduated difficulty, response space, answer key, feedback notes, and accessibility checks.", icon: "file", detailEmoji: "📄", displayCreditCost: 7, aliases: ["worksheet-generator", "practice-pack-generator"],
    inputs: [
      { id: "content_objectives", label: "Content / Objectives", type: "textarea", placeholder: "Concepts, procedures, vocabulary, exact objectives, standards, and what learners have already been taught.", required: true },
      { id: "source_material", label: "Source Material / Approved Examples", type: "textarea", placeholder: "Paste notes, text, questions, examples, formulas, data, passages, or facts the practice must use.", required: false },
      { id: "practice_requirements", label: "Practice Requirements", type: "textarea", placeholder: "Question types, difficulty progression, writing space, calculator/tools, answer format, homework/classwork use, and exclusions.", required: true },
      { id: "item_count", label: "Practice Length", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "discussion-seminar-debate-planner", name: "Discussion, Seminar & Debate Planner", description: "Plan a rigorous discussion with preparation, text-dependent questions, equitable participation, evidence use, protocols, misconceptions, and reflection.", icon: "chat", detailEmoji: "💬", displayCreditCost: 7, aliases: ["socratic-seminar-planner", "class-debate-generator"],
    inputs: [
      { id: "topic_text_question", label: "Topic / Text / Central Question", type: "textarea", placeholder: "Issue, reading, evidence set, central question, and intended intellectual tension.", required: true },
      { id: "learning_participation_goals", label: "Learning / Participation Goals", type: "textarea", placeholder: "Content goals, reasoning, evidence, listening, speaking, collaboration, language, and inclusion goals.", required: true },
      { id: "protocol_constraints", label: "Protocol / Constraints", type: "textarea", placeholder: "Duration, group size, preparation, sensitive issues, roles, assessment, accessibility, and classroom norms.", required: false },
      { id: "question_count", label: "Discussion Question Count", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "inquiry-lab-investigation-planner", name: "Inquiry, Lab & Investigation Planner", description: "Design an inquiry or practical investigation with question, variables, evidence, controls, safety, measurement, analysis, and reflection.", icon: "settings", detailEmoji: "🔬", displayCreditCost: 9, aliases: ["lab-activity-generator", "inquiry-learning-planner"],
    inputs: [
      { id: "phenomenon_question", label: "Phenomenon / Inquiry Question", type: "textarea", placeholder: "What learners will investigate, observe, model, test, explain, design, or evaluate.", required: true },
      { id: "concepts_methods", label: "Concepts / Methods / Evidence", type: "textarea", placeholder: "Scientific, mathematical, technical, social-science, design, or disciplinary concepts; available methods; evidence expectations.", required: true },
      { id: "materials_safety_constraints", label: "Materials / Safety / Constraints", type: "textarea", placeholder: "Available equipment, hazards, supervision, age restrictions, ethics, time, environment, disposal, and accessibility.", required: true },
      { id: "lesson_duration", label: "Investigation Duration", type: "select", required: true, options: durationOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "differentiated-instruction-planner", name: "Differentiated Instruction Planner", description: "Adapt content, process, product, pace, grouping, scaffolds, and challenge using supplied learner evidence rather than stereotypes.", icon: "settings", detailEmoji: "🧩", displayCreditCost: 7, aliases: ["lesson-differentiation-generator", "differentiation-planner"],
    inputs: [
      { id: "lesson_content_goal", label: "Lesson / Content / Goal", type: "textarea", placeholder: "Current lesson or resource, learning goal, essential content, assessment evidence, and non-negotiable standards.", required: true },
      { id: "learner_evidence", label: "Learner Evidence", type: "textarea", placeholder: "Readiness, prior work, misconceptions, language proficiency, interests, accessibility, strengths, barriers, and verified support needs.", required: true },
      { id: "available_supports", label: "Available Supports / Constraints", type: "textarea", placeholder: "Staff, time, materials, technology, grouping rules, accommodations, extension opportunities, and classroom realities.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "udl-lesson-adapter", name: "UDL Lesson Adapter", description: "Review and adapt a lesson for multiple means of engagement, representation, and action/expression while keeping the learning goal stable.", icon: "check", detailEmoji: "♿", displayCreditCost: 7, aliases: ["universal-design-learning-adapter", "accessible-lesson-planner"],
    inputs: [
      { id: "lesson_resource", label: "Lesson / Resource", type: "textarea", placeholder: "Paste the lesson, activity, text, assignment, or assessment to review and adapt.", required: true },
      { id: "learning_goal_barriers", label: "Learning Goal / Barriers", type: "textarea", placeholder: "Non-negotiable goal plus observed barriers in access, language, motivation, perception, executive function, response, or expression.", required: true },
      { id: "supports_context", label: "Supports / Context", type: "textarea", placeholder: "Available tools, assistive technology, language resources, time, learner choices, classroom constraints, and required accommodations.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "reading-level-text-adaptation-generator", name: "Reading-Level & Text Adaptation Generator", description: "Adapt supplied text for accessibility and comprehension while preserving facts, disciplinary meaning, essential vocabulary, and source boundaries.", icon: "writing-pad", detailEmoji: "📖", displayCreditCost: 7, aliases: ["reading-level-changer", "text-differentiation-generator"],
    inputs: [
      { id: "source_text", label: "Source Text", type: "textarea", placeholder: "Paste the exact text to adapt. Include title, headings, captions, definitions, and source notes where relevant.", required: true },
      { id: "target_reader", label: "Target Reader / Access Need", type: "textarea", placeholder: "Reading level, age, language proficiency, background knowledge, decoding needs, vocabulary support, and intended use.", required: true },
      { id: "preservation_rules", label: "Preservation / Adaptation Rules", type: "textarea", placeholder: "Facts, quotations, technical terms, tone, length, headings, examples, cultural context, and elements that must not change.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "multilingual-learner-support-planner", name: "Multilingual Learner Support Planner", description: "Add language objectives, comprehensible input, vocabulary, interaction, translanguaging, sentence support, and fair assessment without lowering the content goal.", icon: "chat", detailEmoji: "🌍", displayCreditCost: 7, aliases: ["ell-support-planner", "language-learner-lesson-adapter"],
    inputs: [
      { id: "content_lesson_goal", label: "Content Lesson / Goal", type: "textarea", placeholder: "Subject content, task, standard, assessment, concepts, disciplinary language, and intended evidence.", required: true },
      { id: "language_profile", label: "Learner Language Profile", type: "textarea", placeholder: "Home languages, verified proficiency information, literacy background, prior schooling, strengths, participation needs, and available bilingual resources.", required: true },
      { id: "support_constraints", label: "Support / Constraints", type: "textarea", placeholder: "Co-teaching, interpreter, dictionaries, translated materials, technology, time, family communication, and assessment rules.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "accommodation-accessibility-support-planner", name: "Accommodation & Accessibility Support Planner", description: "Plan classroom access supports from supplied needs and official plans without diagnosing learners, replacing specialists, or drafting legal eligibility decisions.", icon: "check", detailEmoji: "🫶", displayCreditCost: 7, aliases: ["student-accommodation-planner", "accessibility-support-generator"],
    inputs: [
      { id: "task_environment", label: "Task / Learning Environment", type: "textarea", placeholder: "Lesson, assessment, materials, physical or digital environment, timing, response mode, and learning goal.", required: true },
      { id: "documented_needs", label: "Documented Needs / Approved Supports", type: "textarea", placeholder: "Paste only authorized accommodations, support-plan language, observed access barriers, assistive tools, and specialist recommendations.", required: true },
      { id: "implementation_context", label: "Implementation Context", type: "textarea", placeholder: "Staff, equipment, schedule, privacy, assessment rules, emergency/safety considerations, and who must approve changes.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "learner-grouping-station-rotation-planner", name: "Learner Grouping & Station Rotation Planner", description: "Create flexible groups and station rotations from supplied learning evidence, task needs, time, resources, and participation safeguards.", icon: "folder", detailEmoji: "🔄", displayCreditCost: 7, aliases: ["student-grouping-generator", "station-rotation-planner"],
    inputs: [
      { id: "learning_goal_tasks", label: "Learning Goal / Tasks", type: "textarea", placeholder: "Objectives, station tasks, evidence, prerequisite skills, teacher-led needs, and independent-work expectations.", required: true },
      { id: "learner_data", label: "Learner Evidence / Constraints", type: "textarea", placeholder: "Use anonymized readiness, misconceptions, strengths, language, access, collaboration, behaviour, and scheduling information.", required: true },
      { id: "rotation_resources", label: "Rotation / Resources", type: "textarea", placeholder: "Number of learners, adults, stations, devices, room limits, duration, transitions, noise, safety, and grouping restrictions.", required: true },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "scaffold-worked-example-generator", name: "Scaffold & Worked Example Generator", description: "Create explicit modelling, worked examples, fading supports, prompts, checks, and independent transfer while avoiding answer-giving that removes productive thinking.", icon: "writing-pad", detailEmoji: "🪜", displayCreditCost: 7, aliases: ["worked-example-builder", "instructional-scaffold-generator"],
    inputs: [
      { id: "skill_problem", label: "Skill / Problem / Task", type: "textarea", placeholder: "What learners must solve, explain, perform, write, analyse, or create; include exact conventions and expected method.", required: true },
      { id: "learner_difficulties", label: "Learner Difficulties / Prior Knowledge", type: "textarea", placeholder: "Known misconceptions, missing prerequisites, cognitive load, vocabulary, procedural errors, and successful strategies already taught.", required: true },
      { id: "example_requirements", label: "Example / Scaffold Requirements", type: "textarea", placeholder: "Number of examples, modality, annotation, self-explanation, fading, independent item, answer format, and prohibited shortcuts.", required: false },
      { id: "version_count", label: "Worked Example Sets", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "diagnostic-assessment-generator", name: "Diagnostic Assessment Generator", description: "Create a low-stakes diagnostic that reveals prerequisite knowledge, misconceptions, strategies, confidence, and support needs without turning it into a graded final judgment.", icon: "form", detailEmoji: "🩺", displayCreditCost: 7, aliases: ["pre-assessment-generator", "baseline-assessment-builder"],
    inputs: [
      { id: "upcoming_learning", label: "Upcoming Learning / Prerequisites", type: "textarea", placeholder: "What will be taught, required prior knowledge, likely misconceptions, key vocabulary, and decisions the diagnostic should inform.", required: true },
      { id: "learner_context", label: "Learner / Administration Context", type: "textarea", placeholder: "Level, group size, time, mode, accessibility, language, calculator/tools, anonymity, and how results will be used.", required: true },
      { id: "item_count", label: "Diagnostic Length", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "formative-assessment-exit-ticket-generator", name: "Formative Assessment & Exit Ticket Generator", description: "Generate aligned checks that expose thinking during and after learning, with interpretation guidance and immediate instructional responses.", icon: "check", detailEmoji: "🎟️", displayCreditCost: 5, aliases: ["exit-ticket-generator", "checks-for-understanding-generator"],
    inputs: [
      { id: "lesson_objectives", label: "Lesson Objectives / Success Criteria", type: "textarea", placeholder: "Exact learning goals, success criteria, content, method, and misconceptions to check.", required: true },
      { id: "lesson_evidence_context", label: "Lesson / Evidence Context", type: "textarea", placeholder: "What was taught, examples used, expected response types, class profile, time remaining, and next instructional decision.", required: true },
      { id: "question_count", label: "Check Count", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "quiz-test-generator", name: "Quiz & Test Generator", description: "Create a balanced assessment with blueprint, varied item types, answer key, rationales, scoring, accessibility, and quality-control review.", icon: "form", detailEmoji: "🧪", displayCreditCost: 9, aliases: ["multiple-choice-quiz-generator", "test-maker"],
    inputs: [
      { id: "content_standards", label: "Content / Standards / Source", type: "textarea", placeholder: "Paste the taught content, notes, standards, approved facts, examples, vocabulary, formulas, and boundaries.", required: true },
      { id: "assessment_purpose", label: "Assessment Purpose / Blueprint", type: "textarea", placeholder: "Diagnostic, formative, summative, practice, selection, mastery, weighting, cognitive demand, time, and permitted tools.", required: true },
      { id: "item_requirements", label: "Item / Scoring Requirements", type: "textarea", placeholder: "Question types, marks, difficulty mix, answer-key depth, distractor rules, accessibility, randomization, and prohibited content.", required: false },
      { id: "item_count", label: "Assessment Length", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "question-bank-assessment-blueprint-generator", name: "Question Bank & Assessment Blueprint Generator", description: "Build an auditable item bank mapped to content, cognitive demand, difficulty, evidence, misconceptions, marks, and reuse rules.", icon: "table", detailEmoji: "🗂️", displayCreditCost: 9, aliases: ["assessment-blueprint-generator", "question-bank-builder"],
    inputs: [
      { id: "curriculum_content", label: "Curriculum / Content Domain", type: "textarea", placeholder: "Standards, topics, subskills, weighting, taught examples, exclusions, and required coverage.", required: true },
      { id: "assessment_design", label: "Assessment Design Requirements", type: "textarea", placeholder: "Purpose, format, duration, marks, cognitive demand, difficulty distribution, security, accessibility, and administration.", required: true },
      { id: "item_count", label: "Question Bank Size", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "rubric-success-criteria-generator", name: "Rubric & Success Criteria Generator", description: "Create transparent, observable criteria and performance descriptors aligned to the task and evidence, with bias and usability checks.", icon: "table", detailEmoji: "📏", displayCreditCost: 7, aliases: ["rubric-generator", "grading-criteria-builder"],
    inputs: [
      { id: "assignment_task", label: "Assignment / Performance Task", type: "textarea", placeholder: "Exact task, prompt, product, process, audience, constraints, and learner-facing instructions.", required: true },
      { id: "learning_outcomes_evidence", label: "Learning Outcomes / Evidence", type: "textarea", placeholder: "Standards, objectives, disciplinary quality, required evidence, non-negotiable criteria, and what should not be graded.", required: true },
      { id: "rubric_requirements", label: "Rubric Requirements", type: "textarea", placeholder: "Analytic/holistic, levels, weighting, language, moderation, accessibility, feedback use, and institutional rules.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "performance-task-authentic-assessment-generator", name: "Performance Task & Authentic Assessment Generator", description: "Design a meaningful task requiring application, reasoning, creation, or performance with audience, constraints, checkpoints, rubric alignment, and authenticity safeguards.", icon: "folder", detailEmoji: "🏗️", displayCreditCost: 9, aliases: ["authentic-assessment-generator", "performance-task-builder"],
    inputs: [
      { id: "learning_goals_context", label: "Learning Goals / Authentic Context", type: "textarea", placeholder: "Standards, transfer goal, real or simulated context, audience, role, problem, product, and why the task matters.", required: true },
      { id: "evidence_quality", label: "Evidence / Quality Expectations", type: "textarea", placeholder: "Required knowledge, reasoning, process, product, communication, criteria, source use, collaboration, and individual accountability.", required: true },
      { id: "constraints_access", label: "Constraints / Access / Integrity", type: "textarea", placeholder: "Time, materials, technology, AI policy, accessibility, group work, safety, ethics, cultural context, and scoring rules.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "student-work-feedback-generator", name: "Student Work Feedback Generator", description: "Provide evidence-based, actionable feedback against supplied criteria while preserving student voice and avoiding unsupported grades or personal judgments.", icon: "chat", detailEmoji: "✍️", displayCreditCost: 7, aliases: ["assignment-feedback-generator", "student-writing-feedback"],
    inputs: [
      { id: "student_work", label: "Student Work", type: "textarea", placeholder: "Paste the learner's exact work. Remove unnecessary personal information before use.", required: true },
      { id: "task_criteria", label: "Task / Criteria / Model", type: "textarea", placeholder: "Prompt, instructions, rubric, success criteria, standards, exemplars, allowed support, and teacher priorities.", required: true },
      { id: "feedback_context", label: "Feedback Context", type: "textarea", placeholder: "Draft/final stage, learner goals, prior feedback, tone, amount, teacher concerns, and whether a grade is already decided.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "misconception-error-analysis-generator", name: "Misconception & Error Analysis Generator", description: "Analyse anonymized responses for patterns, plausible misconceptions, missing prerequisites, strategy errors, and targeted reteaching—without diagnosing learners.", icon: "search", detailEmoji: "🔍", displayCreditCost: 7, aliases: ["student-error-analyzer", "misconception-analyzer"],
    inputs: [
      { id: "responses_work", label: "Learner Responses / Work Samples", type: "textarea", placeholder: "Paste anonymized responses, calculations, explanations, selected answers, or error patterns.", required: true },
      { id: "correct_method_criteria", label: "Correct Method / Criteria / Content", type: "textarea", placeholder: "Approved answer, reasoning, method, rubric, standards, examples taught, and acceptable alternatives.", required: true },
      { id: "instructional_context", label: "Instructional Context", type: "textarea", placeholder: "What was taught, prior knowledge, language, tools, assessment conditions, common errors, and next lesson constraints.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "progress-monitoring-intervention-planner", name: "Progress Monitoring & Intervention Planner", description: "Create a bounded monitoring cycle with measurable goals, evidence sources, frequency, instructional response rules, review points, and escalation questions.", icon: "chart", detailEmoji: "📈", displayCreditCost: 9, aliases: ["learning-progress-monitor", "academic-intervention-planner"],
    inputs: [
      { id: "learning_need_goal", label: "Learning Need / Goal", type: "textarea", placeholder: "Specific skill or knowledge target, baseline evidence, desired performance, timeframe, and why support is needed.", required: true },
      { id: "evidence_support_history", label: "Evidence / Support History", type: "textarea", placeholder: "Anonymized assessments, work samples, observations, attendance/context, strategies tried, response, strengths, and barriers.", required: true },
      { id: "monitoring_constraints", label: "Monitoring / Team Constraints", type: "textarea", placeholder: "Available measures, schedule, staff, family involvement, specialist review, privacy, thresholds, and institutional procedures.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "study-guide-learning-pack-generator", name: "Study Guide & Learning Pack Generator", description: "Turn supplied course material into a structured study guide with concepts, examples, retrieval questions, misconceptions, practice, and source-bound explanations.", icon: "writing-pad", detailEmoji: "📚", displayCreditCost: 7, aliases: ["study-guide-generator", "notes-to-study-pack"],
    inputs: [
      { id: "source_material", label: "Course Material / Notes", type: "textarea", placeholder: "Paste notes, textbook extracts, slides, transcript, syllabus, examples, formulas, vocabulary, and approved facts.", required: true },
      { id: "learning_goals_exam", label: "Learning Goals / Assessment Context", type: "textarea", placeholder: "Objectives, exam format, weighting, deadlines, strengths, weak areas, allowed resources, and instructor guidance.", required: true },
      { id: "pack_requirements", label: "Learning Pack Requirements", type: "textarea", placeholder: "Summary depth, worked examples, practice, self-check, mnemonics, glossary, citations, and topics to emphasize or exclude.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "flashcard-deck-generator", name: "Flashcard Deck Generator", description: "Create precise, source-grounded flashcards using retrieval-friendly prompts, one idea per card, plausible distractors where needed, and ambiguity checks.", icon: "writing-pad", detailEmoji: "🃏", displayCreditCost: 7, aliases: ["ai-flashcard-generator", "study-card-builder"],
    inputs: [
      { id: "source_material", label: "Source Material", type: "textarea", placeholder: "Paste notes, definitions, formulas, concepts, dates, examples, diagrams described in text, or other approved content.", required: true },
      { id: "learning_focus", label: "Learning Focus / Card Types", type: "textarea", placeholder: "Recall, concept distinction, application, formula, vocabulary, chronology, image-occlusion plan, misconceptions, or mixed deck.", required: true },
      { id: "item_count", label: "Deck Size", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "practice-test-answer-explanation-generator", name: "Practice Test & Answer Explanation Generator", description: "Create a source-bounded practice test with balanced coverage, answer explanations, distractor analysis, confidence reflection, and next-study guidance.", icon: "form", detailEmoji: "✅", displayCreditCost: 9, aliases: ["mock-test-generator", "practice-exam-builder"],
    inputs: [
      { id: "source_material", label: "Course / Exam Source Material", type: "textarea", placeholder: "Paste syllabus, notes, objectives, examples, question style, formulas, readings, and approved content.", required: true },
      { id: "exam_blueprint", label: "Exam Blueprint / Conditions", type: "textarea", placeholder: "Topics, weighting, question types, duration, difficulty, marks, calculator/tools, negative marking, and answer expectations.", required: true },
      { id: "item_count", label: "Practice Test Length", type: "select", required: true, options: itemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "retrieval-practice-spaced-review-planner", name: "Retrieval Practice & Spaced Review Planner", description: "Create a realistic retrieval schedule that interleaves old and new learning, varies retrieval formats, tracks confidence, and adapts from actual performance.", icon: "calendar", detailEmoji: "🧠", displayCreditCost: 7, aliases: ["spaced-repetition-planner", "retrieval-practice-generator"],
    inputs: [
      { id: "content_inventory", label: "Content Inventory", type: "textarea", placeholder: "Topics, concepts, skills, formulas, vocabulary, examples, dependencies, and current confidence or performance.", required: true },
      { id: "timeline_schedule", label: "Timeline / Available Schedule", type: "textarea", placeholder: "Assessment date, days available, session length, school/work commitments, rest days, and unavailable dates.", required: true },
      { id: "practice_constraints", label: "Practice / Accessibility Constraints", type: "textarea", placeholder: "Materials, preferred formats, accommodations, fatigue, technology, group/solo study, and subjects to prioritize.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "socratic-tutor-guided-hint-generator", name: "Socratic Tutor & Guided Hint Generator", description: "Create a scaffolded tutoring dialogue that diagnoses understanding, asks productive questions, gives graduated hints, and protects learner agency instead of immediately revealing answers.", icon: "chat", detailEmoji: "🧑‍🏫", displayCreditCost: 7, aliases: ["ai-tutor-prompt-generator", "guided-hint-builder"],
    inputs: [
      { id: "problem_learning_goal", label: "Problem / Learning Goal", type: "textarea", placeholder: "Exact question, task, concept, skill, expected method, and what the learner should ultimately understand.", required: true },
      { id: "learner_attempt", label: "Learner Attempt / Current Thinking", type: "textarea", placeholder: "What the learner tried, said, selected, or misunderstood; include confidence and prior knowledge when known.", required: true },
      { id: "tutoring_rules", label: "Tutoring Rules / Constraints", type: "textarea", placeholder: "Hint limit, answer-release rule, language, accessibility, allowed methods, misconceptions to check, and teacher boundaries.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "exam-revision-planner", name: "Exam Revision Planner", description: "Build a prioritized revision plan from topics, performance evidence, exam weighting, available time, retrieval practice, mock testing, and wellbeing constraints.", icon: "calendar", detailEmoji: "📅", displayCreditCost: 7, aliases: ["study-plan-generator", "revision-timetable-builder"],
    inputs: [
      { id: "subjects_topics", label: "Subjects / Topics / Exam Weighting", type: "textarea", placeholder: "Exams, syllabi, topics, marks, formats, dates, importance, and prerequisite relationships.", required: true },
      { id: "performance_evidence", label: "Current Performance / Confidence", type: "textarea", placeholder: "Practice scores, errors, confidence, teacher feedback, unfinished content, strengths, weak areas, and evidence quality.", required: true },
      { id: "available_time_constraints", label: "Available Time / Constraints", type: "textarea", placeholder: "Daily windows, school/work, sleep, exercise, other exams, accessibility, resources, rest, and fixed commitments.", required: true },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "curriculum-alignment-map-generator", name: "Curriculum Alignment Map Generator", description: "Create a deterministic map linking standards, outcomes, lessons, assessments, evidence, gaps, and redundancies from supplied curriculum data.", icon: "network", detailEmoji: "🗺️", displayCreditCost: 9, aliases: ["curriculum-map-generator", "standards-assessment-map"],
    inputs: [
      { id: "curriculum_scope", label: "Curriculum Scope / Purpose", type: "textarea", placeholder: "Course, grade, subject, period, users, decisions, and mapping boundary.", required: true },
      { id: "standards_lessons_assessments", label: "Standards / Lessons / Assessments", type: "textarea", placeholder: "Supply exact identifiers and relationships for standards, outcomes, units, lessons, tasks, assessments, and evidence.", required: true },
      { id: "mapping_priorities", label: "Mapping Priorities", type: "textarea", placeholder: "Coverage, sequence, prerequisites, cognitive demand, assessment balance, gaps, redundancies, accessibility, and reporting needs.", required: false },
      { id: "node_count", label: "Target Map Size", type: "select", required: true, options: nodeCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "concept-prerequisite-map-generator", name: "Concept & Prerequisite Map Generator", description: "Create a deterministic concept map showing prerequisite, part-whole, example, contrast, application, and misconception relationships from supplied learning content.", icon: "network", detailEmoji: "🕸️", displayCreditCost: 7, aliases: ["learning-concept-map", "prerequisite-knowledge-graph"],
    inputs: [
      { id: "topic_learning_goal", label: "Topic / Learning Goal", type: "textarea", placeholder: "Central concept, intended understanding, learner level, scope, and instructional purpose.", required: true },
      { id: "concepts_relationships", label: "Concepts / Relationships / Sources", type: "textarea", placeholder: "Supply exact concepts, definitions, examples, prerequisite links, misconceptions, applications, and source identifiers.", required: true },
      { id: "map_use", label: "Map Use / Emphasis", type: "textarea", placeholder: "Teacher planning, learner study, remediation, vocabulary, sequencing, transfer, assessment, or another use.", required: false },
      { id: "node_count", label: "Target Map Size", type: "select", required: true, options: nodeCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "learning-journey-mastery-progression-generator", name: "Learning Journey & Mastery Progression Generator", description: "Create a deterministic progression from entry knowledge through milestones, evidence, common barriers, interventions, extension, and transfer.", icon: "chart", detailEmoji: "🛤️", displayCreditCost: 9, aliases: ["mastery-progression-map", "learning-pathway-generator"],
    inputs: [
      { id: "competency_goal", label: "Competency / End Goal", type: "textarea", placeholder: "What mastery or transfer looks like, learner group, subject, context, and performance expectations.", required: true },
      { id: "levels_evidence", label: "Levels / Evidence / Prerequisites", type: "textarea", placeholder: "Supply stages, knowledge, skills, evidence, thresholds, prerequisite links, misconceptions, supports, and extension.", required: true },
      { id: "progression_constraints", label: "Progression / Implementation Constraints", type: "textarea", placeholder: "Time, assessment policy, pacing, flexible pathways, accessibility, intervention, reporting, and stakeholder needs.", required: false },
      { id: "node_count", label: "Target Progression Size", type: "select", required: true, options: nodeCountOptions },
      ...commonTail,
    ],
  }),
];
