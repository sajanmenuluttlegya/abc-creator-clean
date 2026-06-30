export function getOutlineScalingGuard(toolSlug: string) {
  if (toolSlug !== "blog-outline" && toolSlug !== "blog-content") return "";

  return `

Outline depth scaling:
- Scale the total heading count strictly and proportionally according to the selected word_count/article length.
- Total heading count means H2 + H3 headings only. Do not count the single H1 title.
- The heading ranges must be monotonic. A longer article length must never produce fewer total headings than a shorter article length.
- Use the target range, not a random count. Stay near the middle of the range for normal topics, the lower end for narrow/simple topics, and the upper end only for broad, technical, or pillar-style topics.
- Short article (800-1,200 words): 10-12 total headings, usually 5-6 H2 sections and 5-6 H3 subsections.
- Standard article (1,200-1,800 words): 18-22 total headings, usually 7-8 H2 sections and 11-14 H3 subsections.
- Long article (1,800-2,500 words): 26-30 total headings, usually 9-10 H2 sections and 17-20 H3 subsections.
- Very long article (2,500-3,500 words): 34-40 total headings, usually 11-13 H2 sections and 23-27 H3 subsections.
- Premium pillar article (3,500-5,000 words): 48-60 total headings, usually 14-18 H2 sections and 34-42 H3 subsections.
- Do not let Premium pillar cap at the same heading count as Very long. Premium pillar must be visibly deeper.
- Do not let Long article fall below Standard article. Long must be visibly deeper than Standard.
- Preserve relevance. If a topic is too narrow for the range, use practical subtopics, examples, comparisons, mistakes, steps, tools, FAQs, implementation notes, or decision criteria instead of filler.
- For blog-outline, output a clean Markdown outline within the selected range.
- For blog-content, respect the supplied outline, but develop section depth proportionally to the selected article length. If the supplied outline is too thin for a pillar article, expand only with genuinely useful H2/H3 sections.
`;
}
