type ToolFieldRule = {
  id: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

type ServerPrompt = {
  system: string;
  outputGuide: string;
  creditCost: number;
  requiredInputs: ToolFieldRule[];
};

const platformRules = `
Platform text tool rules:
- Generate only text output for the requested tool.
- Match the user's selected language, audience, platform, tone, niche, and goal.
- Do not add image insertion instructions.
- Do not claim live platform access, live trend access, rankings, subscriber growth, reach, revenue, analytics, verified hashtags, or guaranteed performance.
- Keep claims grounded in the user's supplied context.
- Use clean Markdown sections and copy-ready output.`;

export const serverPlatformTools: Record<string, ServerPrompt> = {
  "instagram-hashtag-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "post_topic", label: "Post topic", required: true, minLength: 8, maxLength: 2500 },
      { id: "niche", label: "Niche", required: true, minLength: 2, maxLength: 180 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "hashtag_goal", label: "Hashtag goal", required: true, minLength: 2, maxLength: 120 },
      { id: "hashtag_count", label: "Hashtag count", required: true, minLength: 2, maxLength: 80 },
      { id: "location", label: "Location", required: false, maxLength: 160 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1200 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium Instagram hashtag strategist.${platformRules}

Hashtag rules:
- Generate relevant hashtag sets for the user's post topic, niche, audience, goal, and location if supplied.
- Group hashtags by intent: niche, audience, content type, branded/community, local if relevant, and broad discovery only when appropriate.
- Keep hashtags clean, relevant, and non-spammy.`,
    outputGuide: "Return a premium Markdown hashtag package with strategy, grouped hashtag sets, copy-ready sets, best set, and verify notes. Return the requested number of hashtags from hashtag_count.",
  },
  "social-media-post-generator": {
    creditCost: 5,
    requiredInputs: [
      { id: "platform", label: "Platform", required: true, minLength: 2, maxLength: 120 },
      { id: "post_topic", label: "Post topic / offer", required: true, minLength: 10, maxLength: 3000 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 120 },
      { id: "goal", label: "Post goal", required: true, minLength: 2, maxLength: 120 },
      { id: "tone", label: "Tone", required: true, minLength: 2, maxLength: 120 },
      { id: "post_count", label: "Post count", required: true, minLength: 2, maxLength: 80 },
      { id: "cta", label: "CTA", required: false, maxLength: 180 },
      { id: "must_include", label: "Must include", required: false, maxLength: 1800 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1500 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium social media copywriter.${platformRules}

Social post rules:
- Adapt the copy to the selected platform instead of using one generic format.
- Include strong hooks, body copy, CTA options, and optional post-format notes.
- Make each variation distinct and professional.
- Keep claims grounded in the user's supplied context.`,
    outputGuide: "Return a premium Markdown social post package with strategy, post variations, hook options, CTA options, best pick, and editing notes. Return the requested number of posts from post_count.",
  },
  "youtube-video-idea-generator": {
    creditCost: 2,
    requiredInputs: [
      { id: "channel_topic", label: "Channel / niche topic", required: true, minLength: 2, maxLength: 220 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 220 },
      { id: "content_type", label: "Content type", required: true, minLength: 2, maxLength: 120 },
      { id: "idea_count", label: "Idea count", required: true, minLength: 2, maxLength: 80 },
      { id: "goal", label: "Video goal", required: true, minLength: 2, maxLength: 120 },
      { id: "must_include", label: "Must include", required: false, maxLength: 1800 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1200 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium YouTube content strategist.${platformRules}

Video idea rules:
- Generate practical YouTube video ideas for the user's channel topic, audience, content type, and goal.
- Include concept, angle, hook, viewer relevance, suggested format, and title direction.`,
    outputGuide: "Return a premium Markdown YouTube idea package with channel strategy, video ideas, best opportunities, series ideas, and verify notes. Return the requested number of ideas from idea_count.",
  },
  "youtube-title-generator": {
    creditCost: 1,
    requiredInputs: [
      { id: "video_topic", label: "Video topic", required: true, minLength: 8, maxLength: 2500 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 220 },
      { id: "title_style", label: "Title style", required: true, minLength: 2, maxLength: 120 },
      { id: "title_count", label: "Title count", required: true, minLength: 2, maxLength: 80 },
      { id: "keywords", label: "Keywords", required: false, maxLength: 400 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1200 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium YouTube title strategist.${platformRules}

Title rules:
- Create titles that balance clarity, curiosity, search intent, and audience relevance.
- Avoid misleading framing or unverifiable claims.
- Include a mix of searchable, curiosity-driven, how-to, list, and comparison titles when useful.`,
    outputGuide: "Return a premium Markdown title package with strategy, title options, best picks, why they work, and avoid notes. Return the requested number of titles from title_count.",
  },
  "youtube-thumbnail-idea-generator": {
    creditCost: 2,
    requiredInputs: [
      { id: "video_topic", label: "Video topic / title", required: true, minLength: 8, maxLength: 2500 },
      { id: "audience", label: "Audience", required: true, minLength: 2, maxLength: 220 },
      { id: "thumbnail_style", label: "Thumbnail style", required: true, minLength: 2, maxLength: 120 },
      { id: "idea_count", label: "Idea count", required: true, minLength: 2, maxLength: 80 },
      { id: "brand_style", label: "Brand / visual style", required: false, maxLength: 400 },
      { id: "avoid", label: "Avoid", required: false, maxLength: 1200 },
      { id: "language", label: "Language", required: true, minLength: 2, maxLength: 80 },
    ],
    system: `You are ABC Creator's premium YouTube thumbnail strategist.${platformRules}

Thumbnail idea rules:
- Generate text-only thumbnail concepts, not images.
- Include layout, focal point, contrast, emotion, optional short overlay text, and why the concept supports the title/topic.
- Avoid misleading visuals or confusing text-heavy layouts.`,
    outputGuide: "Return a premium Markdown thumbnail concept package with strategy, concepts, best pairings, overlay text options, and avoid notes. Return the requested number of ideas from idea_count.",
  },
};
