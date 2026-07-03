type AdInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type AdTool = {
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
  inputs: AdInput[];
};

const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["Cold audience", "Warm audience", "Retargeting", "Existing customers", "B2B decision makers", "E-commerce shoppers", "Local customers", "Premium buyers", "Creators/founders"];
const toneOptions = ["Professional", "Premium", "Direct response", "Friendly", "Bold but safe", "Luxury", "Conversational", "Urgent but honest", "Educational"];
const objectiveOptions = ["Awareness", "Traffic", "Leads", "Sales", "App installs", "Bookings", "Retargeting", "Launch", "Testing angles"];
const funnelOptions = ["Top of funnel", "Middle of funnel", "Bottom of funnel", "Retargeting", "Full funnel", "Not sure / recommend"];
const countOptions = ["3 variations", "5 variations", "10 variations"];
const outputLengthOptions = ["Short", "Standard", "Detailed", "Premium campaign pack"];
const adPatternOptions = ["Auto-pick strongest pattern", "PAS: Problem → Solution", "AIDA", "UGC: Hook → Demo → CTA", "Product Demo", "Founder Story", "Objection Reversal", "Before/After, verified only", "Social Proof, supplied proof only", "Comparison Angle", "Offer Stack, real offer only", "Retargeting Reminder", "Google Search Intent / RSA", "Educational Authority"];

function tool(slug: string, name: string, description: string, emoji: string, credits: number, inputs: AdInput[], aliases: string[] = []): AdTool {
  return { id: slug, slug, name, description, icon: "ad-copy", detailEmoji: emoji, category: "Advertising Tools", displayCreditCost: credits, outputType: "text", aliases: [`ai-${slug}`, `${slug}-tool`, `${slug}-generator`, ...aliases], inputs };
}

function adInputs(platform: string): AdInput[] {
  return [
    { id: "product_or_service", label: "Product / Service", type: "textarea", placeholder: "Describe the product/service, offer, verified price, features, benefits, proof, and limitations.", required: true },
    { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions },
    { id: "campaign_objective", label: "Campaign Objective", type: "select", required: true, options: objectiveOptions },
    { id: "ad_pattern", label: "Ad Style / Winning Pattern", type: "select", required: true, options: adPatternOptions },
    { id: "pain_point", label: "Pain Point / Desire", type: "textarea", placeholder: "What problem, desire, objection, or job-to-be-done should the ad speak to?", required: true },
    { id: "key_benefit", label: "Key Benefit", type: "textarea", placeholder: "The strongest truthful benefit or transformation supported by your facts.", required: true },
    { id: "offer", label: "Offer / CTA", type: "text", placeholder: "Optional: offer, CTA, landing page action, demo, or real discount.", required: false },
    { id: "funnel_stage", label: "Funnel Stage", type: "select", required: true, options: funnelOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "variation_count", label: "How Many Variations?", type: "select", required: true, options: countOptions },
    { id: "reference_ad_notes", label: "Reference Ad / Swipe Notes", type: "textarea", placeholder: "Optional: paste public ad examples, competitor notes, or your own swipe notes. Used as inspiration only, not copied.", required: false },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: `Optional: ${platform} placement, keywords, objections, proof, CTA, brand lines, product facts, or compliance copy.`, required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, restricted wording, testimonials, competitor wording, or platform-sensitive angles.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

function scriptInputs(label: string): AdInput[] {
  return [
    { id: "product_or_service", label: "Product / Service", type: "textarea", placeholder: "Describe the product/service, offer, audience, proof, use case, objections, and exact facts.", required: true },
    { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions },
    { id: "campaign_objective", label: "Campaign Objective", type: "select", required: true, options: objectiveOptions },
    { id: "video_length", label: "Ad Length", type: "select", required: true, options: ["15 seconds", "30 seconds", "45 seconds", "60 seconds", "90 seconds"] },
    { id: "script_style", label, type: "select", required: true, options: ["UGC-style", "Founder-led", "Product demo", "Problem-solution", "Story-driven", "Direct response", "Cinematic", "Funny but safe"] },
    { id: "ad_pattern", label: "Ad Style / Winning Pattern", type: "select", required: true, options: adPatternOptions },
    { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions },
    { id: "reference_ad_notes", label: "Reference Ad / Swipe Notes", type: "textarea", placeholder: "Optional: paste ad examples, scene notes, or swipe notes. Used as inspiration only, not copied.", required: false },
    { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: scenes, proof, CTA, overlay text, product shots, offer, line, disclaimer, or exact wording.", required: false },
    { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: claims, restricted wording, unsafe visuals, or platform-sensitive topics.", required: false },
    { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  ];
}

export const adCopyBatchTools: AdTool[] = [
  tool("facebook-ad-copy", "Facebook Ad Copy", "Create Meta/Facebook ad copy with primary text, headlines, descriptions, CTA options, A/B angles, and compliance notes.", "📘", 4, adInputs("Facebook"), ["meta-ad-copy", "facebook-ads-copy-generator"]),
  tool("google-ad-copy", "Google Ad Copy", "Generate Google Search ad headlines, descriptions, keyword-aligned angles, assets, and landing-page match notes.", "🔎", 4, adInputs("Google Ads"), ["google-ads-copy", "google-search-ad-copy", "google-ad-copy-generator"]),
  tool("google-ads-pro", "Google Ads Pro", "Build a premium Google Ads copy pack with RSA headlines, descriptions, keywords, negatives, extensions, and test plan.", "🏆", 5, [...adInputs("Google Ads Pro"), { id: "keywords_or_queries", label: "Keywords / Search Queries", type: "textarea", placeholder: "Optional: target keywords, search terms, negative keywords, campaign groups, or landing page phrases.", required: false }, { id: "competitor_or_serp_notes", label: "Competitor / SERP Notes", type: "textarea", placeholder: "Optional: paste competitor ad notes or SERP observations. No live Google Ads/SERP data is fetched.", required: false }], ["google-ads-generator", "google-rsa-generator", "responsive-search-ad-generator"]),
  tool("instagram-ad-copy", "Instagram Ad Copy", "Write Instagram ad copy with hooks, captions, headline ideas, creative direction, and CTA variations.", "📸", 4, adInputs("Instagram"), ["instagram-ads", "instagram-ad-copy-generator"]),
  tool("tiktok-ads", "TikTok Ads", "Create TikTok ad concepts with thumb-stopping hooks, captions, UGC/script variants, CTAs, and safety notes.", "🎵", 4, adInputs("TikTok"), ["tiktok-ad-copy", "tiktok-ads-generator"]),
  tool("linkedin-ad", "LinkedIn Ad", "Create professional LinkedIn ad copy for B2B audiences with pain points, proof, CTA, and risk notes.", "💼", 4, adInputs("LinkedIn"), ["linkedin-ad-copy", "linkedin-ads", "linkedin-ad-generator"]),
  tool("twitter-x-ads", "Twitter/X Ads", "Generate concise Twitter/X ad copy with hooks, punchy variants, CTA, and A/B test labels.", "𝕏", 4, adInputs("Twitter/X"), ["twitter-ads", "x-ads", "twitter-ad-copy"]),
  tool("commercial-ad-script", "Commercial Ad Script Generator", "Write premium commercial ad scripts with hook, scenes, voiceover, on-screen text, CTA, and production notes.", "🎬", 5, scriptInputs("Script Style"), ["commercial-ad-script-generator", "ad-script-generator", "video-ad-script"]),
  tool("ad-hook-creator", "Ad Hook Creator", "Generate sharp ad hooks by platform, funnel stage, pain point, desire, objection, and safe virality angle.", "🪝", 3, [{ id: "product_or_service", label: "Product / Service", type: "textarea", placeholder: "Describe the offer, audience, benefit, pain point, and proof.", required: true }, { id: "platform", label: "Platform", type: "select", required: true, options: ["Facebook/Instagram", "Google", "TikTok", "LinkedIn", "Twitter/X", "YouTube", "Multi-platform"] }, { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions }, { id: "funnel_stage", label: "Funnel Stage", type: "select", required: true, options: funnelOptions }, { id: "hook_count", label: "How Many Hooks?", type: "select", required: true, options: ["10 hooks", "20 hooks", "30 hooks", "50 hooks"] }, { id: "tone", label: "Tone", type: "select", required: true, options: toneOptions }, { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: clickbait, unsupported claims, competitor wording, or banned words.", required: false }, { id: "language", label: "Language", type: "select", required: true, options: languageOptions }], ["ad-hook-generator", "ad-hooks", "advertising-hook-generator"]),
  tool("ad-copy-generator", "Ad Copy Generator", "Create premium ad copy for any platform with angles, variants, headlines, CTAs, creative notes, and compliance checks.", "✍️", 4, adInputs("Ad Copy"), ["advertising-copy-generator", "general-ad-copy-generator"]),
  tool("ad-targeting-helper", "Ad Targeting Helper", "Build targeting ideas, audience segments, messaging angles, exclusions, and research notes without fake platform data.", "🎯", 3, [{ id: "product_or_service", label: "Product / Service", type: "textarea", placeholder: "Describe what you sell, who it helps, benefits, price range if verified, and market context.", required: true }, { id: "ideal_customer", label: "Ideal Customer", type: "textarea", placeholder: "Describe your best buyer, use cases, pains, desires, objections, location, and buying triggers.", required: true }, { id: "platform", label: "Platform", type: "select", required: true, options: ["Meta", "Google", "TikTok", "LinkedIn", "Twitter/X", "YouTube", "Multi-platform"] }, { id: "campaign_objective", label: "Campaign Objective", type: "select", required: true, options: objectiveOptions }, { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: audiences, keywords, placements, exclusions, countries, interests, buyer personas, or offers.", required: false }, { id: "avoid", label: "Avoid / Compliance Notes", type: "textarea", placeholder: "Optional: restricted targeting, sensitive claims, or platforms to avoid.", required: false }, { id: "language", label: "Language", type: "select", required: true, options: languageOptions }], ["ad-targeting", "audience-targeting-helper", "ad-audience-generator"]),
  tool("find-user-pain-point", "Find User Pain Point", "Identify customer pain points, desires, objections, trigger moments, and ad angles from supplied audience/context.", "🧠", 3, [{ id: "product_or_service", label: "Product / Service", type: "textarea", placeholder: "Describe the offer, audience, product facts, current messaging, reviews/feedback if available, and market context.", required: true }, { id: "target_audience", label: "Target Audience", type: "select", required: true, options: audienceOptions }, { id: "customer_evidence", label: "Customer Evidence / Notes", type: "textarea", placeholder: "Optional: paste reviews, comments, sales calls, objections, survey notes, competitor reviews, or support tickets. No live research is performed.", required: false }, { id: "analysis_depth", label: "Depth", type: "select", required: true, options: outputLengthOptions }, { id: "must_include", label: "Must Include", type: "textarea", placeholder: "Optional: personas, product features, buying triggers, objections, use cases, or ad platforms.", required: false }, { id: "avoid", label: "Avoid", type: "textarea", placeholder: "Optional: stereotypes, sensitive traits, unsupported claims, competitor wording, or angles to avoid.", required: false }, { id: "language", label: "Language", type: "select", required: true, options: languageOptions }], ["pain-point-generator", "user-pain-point-finder", "customer-pain-point-generator"]),
];
