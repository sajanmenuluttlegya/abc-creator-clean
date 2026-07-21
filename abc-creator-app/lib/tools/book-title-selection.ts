export type BookTitleSelection = { count: 1 | 3 | 5 | 10; credits: 1 | 2 | 3 | 5 };

const BOOK_TITLE_SELECTIONS: BookTitleSelection[] = [
  { count: 10, credits: 5 },
  { count: 5, credits: 3 },
  { count: 3, credits: 2 },
  { count: 1, credits: 1 },
];

export function getBookTitleSelection(value: string | undefined): BookTitleSelection {
  const normalized = (value || "").toLowerCase();
  return BOOK_TITLE_SELECTIONS.find((selection) => normalized.includes(`${selection.count} title`)) || BOOK_TITLE_SELECTIONS[3];
}

export function isBookTitleOptionBlock(value: string) {
  return /^##\s+Title\s+\d+\s*[—–:-]/im.test(value.trim());
}
