export function getOutlineScalingGuard(toolSlug: string) {
  if (toolSlug !== "blog-outline" && toolSlug !== "blog-content") return "";

  return `

Outline depth scaling:
- Scale the number of H2/H3 sections according to the selected word_count/article length.
- Keep the outline relevant. Do not add filler headings just to hit the maximum.
- Use the lower end of the range for narrow/simple topics and the higher end only for broad, technical, high-intent, or pillar-style topics.
- Short article (800-1,200 words): 4-5 H2 sections, 0-2 H3 subsections total.
- Standard article (1,200-1,800 words): 5-7 H2 sections, 2-5 H3 subsections total.
- Long article (1,800-2,500 words): 7-9 H2 sections, 4-8 H3 subsections total.
- Very long article (2,500-3,500 words): 8-11 H2 sections, 6-12 H3 subsections total.
- Premium pillar article (3,500-5,000 words): 10-14 H2 sections, 10-20 H3 subsections total.
- For blog-outline, produce an outline within the right range unless the topic is too narrow, in which case stay relevant and do not pad.
- For blog-content, respect the supplied outline, but develop section depth proportionally to the selected article length. If the supplied outline is too thin for a pillar article, expand only with genuinely useful H2/H3 sections.
`;
}
