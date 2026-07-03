type BatchToolInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type BatchTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType: "text";
  aliases?: string[];
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: BatchToolInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Premium", "Professional", "Friendly", "Bold", "Luxury", "Witty", "Emotional", "Simple and clear"];
const audienceOptions = ["General audience", "Customers", "Founders", "Professionals", "Students", "Creators", "Fans", "Executives", "Local buyers"];
const countOptions = ["3 variations", "5 variations", "10 variations"];
const nameCountOptions = ["10 names", "20 names", "30 names", "50 names"];
const poemStyleOptions = ["Modern free verse", "Rhyming poem", "Romantic", "Inspirational", "Spoken word", "Short social poem", "Narrative poem"];
const dramaLengthOptions = ["3 minutes", "4 minutes", "5 minutes", "Episode outline + script beats"];
const dramaFormatOptions = ["ReelShort style", "DramaBox style", "Vertical micro-drama", "Romance cliffhanger", "Thriller cliffhanger", "Comedy mini-episode"];
const coldEmailSourceOptions = [
  "Paste LinkedIn + Gmail context manually",
  "Connect to LinkedIn + Gmail",
  "LinkedIn recent posts only",
  "Gmail relationship notes only",
];
const coldEmailGoalOptions = ["Book a call", "Start a partnership", "Sell a service", "Pitch SaaS/product", "Recruiting outreach", "Follow up after no reply", "Reconnect warmly"];

function standardCreativeInputs(mainLabel: string): BatchToolInput[] {
  return [
    { id: "brief", label: mainLabel, type: "textarea", placeholder: "Describe the product, topic, audience, offer, emotion, or context. Include must-use details and facts.", required: true },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "output_count", label: "How Many Options?", type: "select", required: true, options: countOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: keywords, benefits, brand phrases, product points, emotional cues, CTA, or constraints.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: banned words, claims, competitor names, clichés, tone limits, or compliance notes.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function tool(slug: string, name: string, description: string, category: string, emoji: string, credit: number, inputs: BatchToolInput[], aliases: string[] = []): BatchTool {
  return {
    id: slug,
    slug,
    name,
    description,
    icon: category === "Email Tools" ? "email" : category === "Ad Copy" ? "megaphone" : category === "AI Tools" ? "spark" : "writing-pad",
    detailEmoji: emoji,
    category,
    displayCreditCost: credit,
    outputType: "text",
    aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases],
    inputs,
  };
}

export const creativeEmailBatchTools: BatchTool[] = [
  tool("poem-generator", "Poem Generator", "Create premium original poems for posts, gifts, brands, speeches, and creative writing.", "Writing Tools", "🪶", 2, [
    { id: "theme", label: "Poem Theme / Occasion", type: "textarea", placeholder: "e.g., a motivational poem for founders, a romantic anniversary poem, a brand launch poem", required: true },
    { id: "poem_style", label: "Poem Style", type: "select", required: true, options: poemStyleOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "length", label: "Length", type: "select", required: true, options: ["Short", "Medium", "Long", "Detailed"] },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional names, memories, metaphors, brand details, words, or emotions to include.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional clichés, words, topics, or style limits to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["poem-writer", "poetry-generator"]),
  tool("slogan-generator", "Slogan Generator", "Generate premium brand, campaign, product, and startup slogans with strategic notes.", "Ad Copy", "📣", 2, standardCreativeInputs("Brand / Product / Campaign Brief"), ["brand-slogan-generator", "campaign-slogan-generator"]),
  tool("tagline-generator", "Tagline Generator", "Create polished taglines that express positioning, value, and memorability.", "Ad Copy", "🏷️", 2, standardCreativeInputs("Brand / Product / Positioning Brief"), ["brand-tagline-generator"]),
  tool("name-generator", "Name Generator", "Generate premium names for brands, products, projects, apps, newsletters, characters, and campaigns.", "Business Tools", "✨", 2, [
    { id: "naming_context", label: "What Needs a Name?", type: "textarea", placeholder: "Describe the brand, product, project, character, app, newsletter, or campaign.", required: true },
    { id: "name_type", label: "Name Type", type: "select", required: true, options: ["Brand", "Product", "App / SaaS", "Project", "Newsletter", "Character", "Community", "Campaign", "Other"] },
    { id: "name_style", label: "Name Style", type: "select", required: true, options: ["Premium", "Short and brandable", "Luxury", "Playful", "Tech/startup", "Descriptive", "Fantasy", "Modern minimal"] },
    { id: "name_count", label: "How Many Names?", type: "select", required: true, options: nameCountOptions },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional words, roots, letters, emotions, domain hints, or themes to include.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional words, styles, competitors, meanings, or legal/trademark-sensitive notes to avoid.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["generic-name-generator", "name-ideas-generator"]),
  tool("headline-generator", "Headline Generator", "Write premium headlines for ads, landing pages, blogs, emails, videos, and social posts.", "Ad Copy", "📰", 2, standardCreativeInputs("Content / Offer / Page Brief"), ["title-headline-generator", "ad-headline-generator"]),
  tool("cta-generator", "CTA Generator", "Create high-converting calls-to-action for pages, ads, emails, social posts, and funnels.", "Ad Copy", "🎯", 1, standardCreativeInputs("Offer / Action Brief"), ["call-to-action-generator", "button-copy-generator"]),
  tool("universal-prompt-enhancer", "Universal Prompt Enhancer", "Turn rough prompts into premium, structured, reliable prompts with roles, constraints, examples, and output format.", "AI Tools", "⚙️", 2, [
    { id: "raw_prompt", label: "Raw Prompt", type: "textarea", placeholder: "Paste the prompt you want improved.", required: true },
    { id: "target_model", label: "Target AI / Model", type: "text", placeholder: "Optional: ChatGPT, Claude, Gemini, image model, coding agent, etc.", required: false },
    { id: "task_type", label: "Task Type", type: "select", required: true, options: ["Writing", "Marketing", "Coding", "Image generation", "Research", "Business strategy", "Data analysis", "General"] },
    { id: "prompt_depth", label: "Prompt Depth", type: "select", required: true, options: ["Quick improvement", "Professional prompt", "Advanced prompt with constraints", "Prompt pack with variations"] },
    { id: "output_format", label: "Desired Output Format", type: "text", placeholder: "Optional: table, article, JSON, checklist, code, image prompt, etc.", required: false },
    { id: "avoid", label: "Avoid / Constraints", type: "textarea", placeholder: "Optional: what the prompt must not do, risks, banned tone, facts to preserve.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["prompt-enhancer", "prompt-improver", "universal-ai-prompt-enhancer"]),
  tool("fan-fiction-short-drama-builder", "Fan-Fiction Short Drama Builder", "Build short episodic drama concepts from a chosen universe, genre, or fandom-style world with episode beats and community writer notes.", "Writing Tools", "🎭", 3, [
    { id: "universe", label: "Universe / Genre", type: "text", placeholder: "e.g., original superhero universe, fantasy academy, romance office, sci-fi rebellion, custom fandom-style world", required: true },
    { id: "core_idea", label: "Core Story Idea", type: "textarea", placeholder: "Describe the characters, conflict, setting, emotional hook, and what should happen.", required: true },
    { id: "episode_length", label: "Episode Length", type: "select", required: true, options: dramaLengthOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: ["Dramatic", "Romantic", "Dark", "Funny", "Epic", "Emotional", "Suspenseful"] },
    { id: "community_notes", label: "Community Writer Notes", type: "textarea", placeholder: "Optional: notes from collaborators/community writers, character rules, canon limits, twist ideas, ships, scenes to include.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: protected character copying, explicit content, violence level, tropes, endings, or tone limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["fanfiction-builder", "fan-fiction-builder", "fanfiction-short-drama"]),
  tool("short-drama-creator-studio", "Short Drama Creator Studio", "Write 3–5 minute vertical short-drama scripts optimized for ReelShort/DramaBox-style pacing, hooks, and cliffhangers.", "Writing Tools", "🎬", 4, [
    { id: "drama_concept", label: "Drama Concept", type: "textarea", placeholder: "Describe the premise, characters, conflict, twist, setting, and target audience.", required: true },
    { id: "format", label: "Short Drama Format", type: "select", required: true, options: dramaFormatOptions },
    { id: "episode_length", label: "Episode Length", type: "select", required: true, options: dramaLengthOptions },
    { id: "audience", label: "Audience", type: "select", required: true, options: audienceOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: ["High-drama", "Romantic", "Suspenseful", "Comedy", "Luxury melodrama", "Emotional"] },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: hook, plot twist, character names, setting, product/brand mention, cliffhanger, platform notes.", required: false },
    { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: explicit content, violence level, clichés, claims, unsafe themes, or platform limits.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["short-drama-script-generator", "reelshort-script-generator", "dramabox-script-generator"]),
  tool("cold-email-personalizer", "AI Cold Email Personalizer", "Draft hyper-personalized cold emails from LinkedIn-style recent posts, Gmail relationship context, and offer details.", "Email Tools", "📧", 5, [
    { id: "source_mode", label: "Personalization Source", type: "select", required: true, options: coldEmailSourceOptions },
    { id: "target_name", label: "Target Name", type: "text", placeholder: "e.g., Priya Sharma", required: true },
    { id: "target_role_company", label: "Target Role / Company", type: "text", placeholder: "e.g., Head of Growth at Acme", required: true },
    { id: "linkedin_profile_url", label: "LinkedIn Profile URL", type: "text", placeholder: "Optional: paste URL for reference when using connected/pasted LinkedIn context.", required: false },
    { id: "recent_linkedin_posts", label: "Recent LinkedIn Posts / Notes", type: "textarea", placeholder: "Paste recent posts, profile notes, announcements, comments, or public context. Required if not using a real connected source.", required: false },
    { id: "gmail_context", label: "Gmail / Previous Conversation Context", type: "textarea", placeholder: "Paste prior email relationship notes, earlier replies, meeting notes, or thread summary. Do not paste private data without permission.", required: false },
    { id: "offer_context", label: "Your Offer / Product / Reason for Outreach", type: "textarea", placeholder: "What are you offering? Who is it for? Why is it relevant? Include proof only if verified.", required: true },
    { id: "goal", label: "Email Goal", type: "select", required: true, options: coldEmailGoalOptions },
    { id: "email_count", label: "How Many Email Options?", type: "select", required: true, options: countOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: ["Warm professional", "Concise executive", "Friendly founder", "Premium consultative", "Direct sales", "Soft follow-up"] },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims to avoid, privacy limits, regulated promises, words, industries, or aggressive tactics.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ], ["ai-cold-email-generator", "cold-email-generator", "linkedin-gmail-cold-email"]),
];
