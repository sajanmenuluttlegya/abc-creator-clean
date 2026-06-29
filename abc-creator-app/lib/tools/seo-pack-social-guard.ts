export function getSeoPackSocialGuard(toolSlug: string) {
  if (toolSlug !== "blog-seo-pack") return "";

  return `

Expanded social share copy requirements:
- In the Social Share Copy section, include copy for every platform below, not only Twitter/X, LinkedIn, and Facebook.
- Twitter / X: one concise post, 280 characters or fewer, with [URL] placeholder.
- LinkedIn: one professional medium-length post with [URL] placeholder.
- Facebook: one conversational post with [URL] placeholder.
- Instagram: one caption with a hook, line breaks, CTA, [URL in bio] placeholder, and 8-15 relevant hashtags.
- Pinterest: one Pin title, one Pin description, suggested board name, and [URL] placeholder.
- YouTube: one Community post with [URL] placeholder, plus one video title idea and one short video description/intro for repurposing the article.
- Keep every platform's copy tailored to that platform's style and audience.
- Do not invent platform metrics, engagement predictions, or guaranteed performance.
`;
}
