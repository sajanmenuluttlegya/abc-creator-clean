export const EDUCATION_LEARNING_VISUAL_PRESETS: Record<string, { title: string; eyebrow: string; description: string; mode: "curriculum" | "concept" | "mastery" }> = {
  "curriculum-alignment-map-generator": {
    title: "Curriculum Alignment Map Studio",
    eyebrow: "Standards • instruction • assessment",
    description: "Map only supplied standards, outcomes, lessons, assessments, evidence, gaps, and redundancies in a deterministic curriculum visual.",
    mode: "curriculum",
  },
  "concept-prerequisite-map-generator": {
    title: "Concept & Prerequisite Map Studio",
    eyebrow: "Knowledge structure and dependencies",
    description: "Visualize supplied concepts, definitions, examples, misconceptions, and verified prerequisite relationships without inventing dependencies.",
    mode: "concept",
  },
  "learning-journey-mastery-progression-generator": {
    title: "Learning Journey & Mastery Progression Studio",
    eyebrow: "Milestones • evidence • support",
    description: "Create a source-grounded progression from entry knowledge through mastery evidence, intervention, extension, and transfer.",
    mode: "mastery",
  },
};
