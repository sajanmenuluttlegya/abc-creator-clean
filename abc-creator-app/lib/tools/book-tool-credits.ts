export const BOOK_TOOL_CREDIT_COSTS: Record<string, number> = {
  "book-idea-generator": 2,
  "book-title-generator": 1,
  "book-bible-generator": 5,
  "character-builder": 5,
  "worldbuilding-builder": 5,
  "book-outline-generator": 5,
  "chapter-outline-generator": 5,
  "scene-generator": 5,
  "chapter-writer": 9,
  "chapter-rewriter-humanizer": 14,
  "continuity-checker": 5,
  "book-blurb-generator": 3,
  "full-book-generator": 9,
  "book-cover-prompt-generator": 2,
  "book-front-matter-generator": 2,
  "book-style-guide-generator": 3,
  "book-export-builder": 3,
};

export const BOOK_OUTPUT_LENGTH_CREDITS: Array<[string, number]> = [
  ["Premium deep output", 9],
  ["Long output", 5],
  ["Standard output", 2],
  ["Compact output", 1],
];

export const SCENE_LENGTH_CREDITS: Array<[string, number]> = [
  ["Very detailed scene", 9],
  ["Long scene", 7],
  ["Standard scene", 5],
  ["Short scene", 5],
];

export const CHAPTER_LENGTH_CREDITS: Array<[string, number]> = [
  ["Epic chapter", 37],
  ["Premium chapter", 28],
  ["Long chapter", 19],
  ["Standard chapter", 11],
  ["Short chapter", 9],
];

export const REWRITE_INTENSITY_ADDS: Array<[string, number]> = [
  ["Canon-safe polish", 22],
  ["Deep humanization", 11],
  ["Standard rewrite", 9],
  ["Light polish", 5],
];
