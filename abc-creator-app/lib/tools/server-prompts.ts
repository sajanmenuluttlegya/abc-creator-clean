type ServerPrompt = {
  system: string;
  outputGuide: string;
  creditCost: number;
};

export const serverPrompts: Record<string, ServerPrompt> = {
  "blog-topic-ideas": {
    creditCost: 2,
    system:
      "You are Creator's expert blog strategy assistant. Generate useful, specific, non-generic blog topic ideas from the user's inputs.",
    outputGuide:
      "Return 10 blog topic ideas. For each idea include: title, angle, target reader, search intent, and why it could work.",
  },
  "facebook-ad-copy": {
    creditCost: 4,
    system:
      "You are Creator's expert paid social copywriting assistant. Generate platform-ready Facebook ad copy from the user's inputs.",
    outputGuide:
      "Return 5 ad copy variations. Each variation must include: primary text, headline, description, CTA, angle, and notes.",
  },
  "product-description": {
    creditCost: 3,
    system:
      "You are Creator's expert ecommerce copywriting assistant. Generate clear, persuasive product descriptions from the user's inputs.",
    outputGuide:
      "Return a product description, short description, bullet benefits, feature list, SEO title, meta description, and CTA.",
  },
};

export function getServerPrompt(toolSlug: string) {
  return serverPrompts[toolSlug];
}