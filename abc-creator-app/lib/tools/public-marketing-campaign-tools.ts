import type { Tool, ToolInput } from "./public-tools";

const category = "Marketing Campaign Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Premium agency strategy", "Executive and concise", "Commercial and practical", "Creative and persuasive", "Analytical and evidence-led", "Warm and customer-focused", "Custom from brief"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed strategic (7 credits)", "Executive comprehensive (9 credits)"];
const businessModelOptions = ["B2C", "B2B", "B2B2C", "E-commerce", "SaaS / subscription", "Marketplace", "Local / service business", "Nonprofit / public-interest", "Enterprise / complex sale", "Custom from brief"];
const stageOptions = ["Planning", "Pre-launch", "Launch", "Always-on", "Growth / scale", "Optimization", "Recovery / turnaround", "Post-campaign review"];
const channelOptions = ["Integrated multi-channel", "Paid media", "Organic social", "Email / lifecycle", "Content / SEO", "Partnerships / creators", "Events / webinars", "Offline / field", "Custom from brief"];
const versionOptions = ["1 version (1 credit)", "3 versions (2 credits)", "5 versions (3 credits)", "10 versions (5 credits)"];
const assetCountOptions = ["8 assets", "12 assets", "18 assets", "24 assets", "36 assets", "48 assets"];
const segmentCountOptions = ["2 segments", "3 segments", "4 segments", "5 segments", "6 segments"];
const scenarioOptions = ["1 scenario", "3 scenarios", "5 scenarios"];

const commonTail: ToolInput[] = [
  { id: "market_region", label: "Market / Region", type: "text", placeholder: "Country, region, language market, cultural context, regulatory context, or sales territory. Used for context—not legal certification.", required: false },
  { id: "business_model", label: "Business Model", type: "select", required: true, options: businessModelOptions },
  { id: "campaign_stage", label: "Campaign Stage", type: "select", required: true, options: stageOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Constraints to Preserve", type: "textarea", placeholder: "Exact product facts, prices, dates, offer terms, audience evidence, brand rules, approved claims, budgets, channel limits, legal wording, or details that must remain unchanged.", required: false },
];

const countDrivenTail: ToolInput[] = commonTail.filter((input) => input.id !== "output_depth");

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

function imageTool(slug: string, name: string, description: string, emoji: string, aliases: string[], displayCreditCost: number): Tool {
  return { id: slug, slug, name, description, icon: "image", detailEmoji: emoji, category, displayCreditCost, aliases, inputs: [] };
}

export const MARKETING_CAMPAIGN_IMAGE_TOOL_SLUGS = [
  "campaign-key-visual-generator",
  "multi-channel-campaign-creative-generator",
  "campaign-social-creative-generator",
  "campaign-email-landing-hero-generator",
  "campaign-creative-variation-generator",
  "campaign-moodboard-art-direction-generator",
] as const;

export const marketingCampaignTools: Tool[] = [
  textTool({
    slug: "integrated-marketing-campaign-planner", name: "Integrated Marketing Campaign Planner",
    description: "Build a complete cross-channel campaign strategy with objectives, audiences, message architecture, channel roles, assets, owners, budget logic, measurement, and optimization gates.",
    icon: "calendar", detailEmoji: "🎯", displayCreditCost: 9, aliases: ["full-marketing-campaign-plan", "360-campaign-planner"],
    nextActions: [{ label: "Create the professional brief", href: "/tools/professional-campaign-brief-generator", description: "Turn the strategy into a controlled agency-ready campaign brief." }],
    inputs: [
      { id: "business_campaign_context", label: "Business / Campaign Context", type: "textarea", placeholder: "Business, offer, current situation, why the campaign is needed, market evidence, previous activity, timing, and constraints.", required: true },
      { id: "objective_audience", label: "Objective / Audience", type: "textarea", placeholder: "Business outcome, marketing objective, target segments, journey stage, problem, motivation, barriers, and known evidence.", required: true },
      { id: "offer_message_channels", label: "Offer / Message / Channels", type: "textarea", placeholder: "Offer, value proposition, proof, campaign idea, priority channels, owned assets, sales path, and required touchpoints.", required: true },
      { id: "resources_budget_timeline", label: "Resources / Budget / Timeline", type: "textarea", placeholder: "Budget, team, agencies, technology, dates, production capacity, media constraints, approvals, and risk tolerance.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "professional-campaign-brief-generator", name: "Professional Campaign Brief Generator",
    description: "Convert scattered marketing inputs into a precise agency-style brief with one objective, one audience problem, one promise, mandatory evidence, deliverables, and approval criteria.",
    icon: "writing-pad", detailEmoji: "📋", displayCreditCost: 7, aliases: ["marketing-campaign-brief", "agency-creative-brief-generator"],
    inputs: [
      { id: "business_background", label: "Business / Background", type: "textarea", placeholder: "Brand, product, market situation, campaign trigger, prior learning, commercial context, and verified facts.", required: true },
      { id: "campaign_problem_objective", label: "Campaign Problem / Objective", type: "textarea", placeholder: "Problem to solve, desired behaviour or outcome, target metric, baseline if known, and deadline.", required: true },
      { id: "audience_insight", label: "Audience / Insight", type: "textarea", placeholder: "Target audience, need, tension, journey stage, objections, behaviour, research, and assumptions requiring validation.", required: true },
      { id: "deliverables_constraints", label: "Deliverables / Constraints", type: "textarea", placeholder: "Channels, assets, budget, timing, mandatories, claims, legal limits, brand rules, approvals, and exclusions.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-objective-kpi-framework-generator", name: "Campaign Objective & KPI Framework Generator",
    description: "Define a rigorous measurement framework separating business outcomes, marketing objectives, leading indicators, conversions, data sources, baselines, targets, and decision thresholds.",
    icon: "seo", detailEmoji: "📊", displayCreditCost: 7, aliases: ["campaign-kpi-planner", "marketing-objectives-generator"],
    inputs: [
      { id: "business_goal", label: "Business Goal", type: "textarea", placeholder: "Commercial or organizational outcome, timeframe, market, product, constraints, and why it matters.", required: true },
      { id: "campaign_role", label: "Campaign Role / Funnel Stage", type: "textarea", placeholder: "What marketing can realistically influence, audience stage, intended behaviour, channel scope, and sales or service handoff.", required: true },
      { id: "available_data", label: "Available Data / Tracking", type: "textarea", placeholder: "Analytics, CRM, ad platforms, ecommerce, call tracking, offline data, historical baselines, attribution limits, and data quality.", required: true },
      { id: "reporting_requirements", label: "Reporting / Decision Requirements", type: "textarea", placeholder: "Stakeholders, reporting frequency, decision dates, budget gates, minimum evidence, and metrics that must not be used.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-audience-segmentation-planner", name: "Campaign Audience Segmentation Planner",
    description: "Create evidence-led campaign segments based on needs, behaviour, value, context, readiness, and channel accessibility—without stereotype-based targeting.",
    icon: "seo", detailEmoji: "👥", displayCreditCost: 7, aliases: ["marketing-segmentation-generator", "campaign-audience-planner"],
    inputs: [
      { id: "offer_market_context", label: "Offer / Market Context", type: "textarea", placeholder: "Product or service, category, alternatives, purchase cycle, price, market, and campaign objective.", required: true },
      { id: "customer_evidence", label: "Customer Evidence", type: "textarea", placeholder: "CRM data, research, interviews, analytics, sales feedback, support themes, behaviour, lifecycle, or clearly labelled hypotheses.", required: true },
      { id: "activation_constraints", label: "Activation / Privacy Constraints", type: "textarea", placeholder: "Available channels, consent, data fields, list size, exclusions, frequency, geographic limits, platform restrictions, and privacy concerns.", required: false },
      { id: "segment_count", label: "Number of Priority Segments", type: "select", required: true, options: segmentCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "customer-journey-campaign-funnel-mapper", name: "Customer Journey & Campaign Funnel Mapper",
    description: "Map the audience journey from first awareness through evaluation, conversion, onboarding, adoption, retention, and advocacy with channel, message, friction, and measurement controls.",
    icon: "folder", detailEmoji: "🗺️", displayCreditCost: 7, aliases: ["marketing-funnel-mapper", "campaign-customer-journey-generator"],
    inputs: [
      { id: "audience_offer", label: "Audience / Offer", type: "textarea", placeholder: "Audience segments, product or service, buying context, price, sales cycle, use case, and desired relationship.", required: true },
      { id: "current_journey", label: "Current Journey / Evidence", type: "textarea", placeholder: "Existing touchpoints, channels, behaviours, conversion data, drop-offs, objections, support issues, and sales observations.", required: true },
      { id: "target_outcome", label: "Target Outcome / Campaign Role", type: "textarea", placeholder: "Desired progression, conversion event, adoption milestone, retention behaviour, campaign timeframe, and success definition.", required: true },
      { id: "systems_constraints", label: "Systems / Constraints", type: "textarea", placeholder: "CRM, automation, analytics, consent, content capacity, sales handoff, service limits, and known tracking gaps.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-positioning-big-idea-generator", name: "Campaign Positioning & Big-Idea Generator",
    description: "Develop differentiated campaign territories connecting audience tension, brand role, promise, proof, emotional payoff, distinctiveness, and channel potential.",
    icon: "idea", detailEmoji: "💡", displayCreditCost: 7, aliases: ["campaign-big-idea-generator", "creative-platform-generator"],
    inputs: [
      { id: "brand_offer_facts", label: "Brand / Offer Facts", type: "textarea", placeholder: "Brand positioning, product facts, value, proof, tone, distinctive assets, history, and non-negotiable claims.", required: true },
      { id: "audience_tension", label: "Audience Tension / Insight", type: "textarea", placeholder: "Need, frustration, desire, barrier, cultural or category tension, research evidence, and assumptions.", required: true },
      { id: "competitive_context", label: "Competitive / Category Context", type: "textarea", placeholder: "Competitor messages, conventions, clichés, overused claims, white space, and what the campaign must not resemble.", required: true },
      { id: "version_count", label: "Creative Territories", type: "select", required: true, options: versionOptions },
      ...countDrivenTail,
    ],
  }),
  textTool({
    slug: "campaign-messaging-architecture-generator", name: "Campaign Messaging Architecture Generator",
    description: "Create a master campaign message system with audience-specific pillars, proof, objections, CTAs, channel adaptations, claims controls, and consistency rules.",
    icon: "writing-pad", detailEmoji: "🧱", displayCreditCost: 7, aliases: ["campaign-message-house-generator", "marketing-message-framework"],
    inputs: [
      { id: "campaign_strategy", label: "Campaign Strategy / Big Idea", type: "textarea", placeholder: "Objective, audience, insight, positioning, campaign idea, desired behaviour, and emotional payoff.", required: true },
      { id: "offer_proof", label: "Offer / Proof / Claims", type: "textarea", placeholder: "Product facts, benefits, evidence, testimonials with permission, demonstrations, guarantees, terms, and claims requiring review.", required: true },
      { id: "segments_objections", label: "Segments / Objections", type: "textarea", placeholder: "Priority segments, journey stages, motivations, anxieties, alternatives, objections, and sales or service feedback.", required: true },
      { id: "channel_scope", label: "Primary Channel Scope", type: "select", required: true, options: channelOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-offer-incentive-strategy-planner", name: "Campaign Offer & Incentive Strategy Planner",
    description: "Design a commercially responsible campaign offer with value exchange, eligibility, economics, terms, urgency, redemption, abuse controls, and testing alternatives.",
    icon: "product", detailEmoji: "🎁", displayCreditCost: 7, aliases: ["marketing-offer-planner", "campaign-promotion-strategy"],
    inputs: [
      { id: "product_customer_context", label: "Product / Customer Context", type: "textarea", placeholder: "Offer, price, margin inputs, audience, purchase cycle, current demand, objections, and customer lifetime considerations.", required: true },
      { id: "campaign_goal", label: "Campaign Goal", type: "textarea", placeholder: "Acquisition, trial, conversion, upgrade, retention, reactivation, event registration, referral, or another verified goal.", required: true },
      { id: "commercial_inputs", label: "Commercial Inputs", type: "textarea", placeholder: "Budget, discount limits, unit economics, stock, capacity, fulfilment, taxes, existing customers, exclusions, and approval limits.", required: false },
      { id: "offer_scenarios", label: "Offer Scenarios", type: "select", required: true, options: scenarioOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "channel-mix-media-strategy-generator", name: "Channel Mix & Media Strategy Generator",
    description: "Assign clear roles to paid, owned, earned, partner, search, social, email, content, event, retail, and offline channels based on audience behaviour and campaign economics.",
    icon: "folder", detailEmoji: "📡", displayCreditCost: 9, aliases: ["media-mix-planner", "campaign-channel-strategy"],
    inputs: [
      { id: "campaign_objective_audience", label: "Campaign Objective / Audience", type: "textarea", placeholder: "Objective, segments, journey stage, geography, buying cycle, conversion path, and channel behaviour evidence.", required: true },
      { id: "current_channel_data", label: "Current Channel Data", type: "textarea", placeholder: "Spend, reach, traffic, leads, sales, conversion, CAC, engagement, CRM, attribution, capacity, and confidence in each data source.", required: true },
      { id: "budget_resources", label: "Budget / Resources", type: "textarea", placeholder: "Total budget, production capacity, internal skills, partners, sales coverage, technology, and fixed commitments.", required: true },
      { id: "channel_constraints", label: "Channel / Policy Constraints", type: "textarea", placeholder: "Platform restrictions, targeting limitations, brand-safety rules, consent, geography, frequency, offline limits, and exclusions.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-budget-allocation-planner", name: "Campaign Budget Allocation Planner",
    description: "Allocate a supplied campaign budget across media, creative, production, technology, partners, testing, contingency, and measurement using transparent scenarios and decision gates.",
    icon: "seo", detailEmoji: "💰", displayCreditCost: 9, aliases: ["marketing-budget-planner", "campaign-spend-allocation"],
    inputs: [
      { id: "total_budget_currency", label: "Verified Total Budget / Currency", type: "textarea", placeholder: "Approved or provisional budget, currency, tax treatment, committed costs, agency fees, and dates.", required: true },
      { id: "campaign_strategy", label: "Campaign Strategy / Channels", type: "textarea", placeholder: "Objective, audience, duration, geographies, channel roles, funnel stages, creative needs, and conversion path.", required: true },
      { id: "cost_performance_inputs", label: "Verified Cost / Performance Inputs", type: "textarea", placeholder: "Historical CPM, CPC, CPL, CPA, conversion rates, production quotes, creator fees, event costs, or leave unknowns blank.", required: false },
      { id: "budget_scenarios", label: "Budget Scenarios", type: "select", required: true, options: scenarioOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-calendar-rollout-planner", name: "Campaign Calendar & Rollout Planner",
    description: "Create a dependency-aware campaign rollout across strategy, production, teaser, launch, sustain, urgency, close, nurture, reporting, and post-campaign learning.",
    icon: "calendar", detailEmoji: "🗓️", displayCreditCost: 7, aliases: ["campaign-timeline-generator", "marketing-rollout-calendar"],
    inputs: [
      { id: "campaign_scope_dates", label: "Campaign Scope / Dates", type: "textarea", placeholder: "Campaign, objective, start, launch, end, events, sales dates, blackout dates, regions, and fixed milestones.", required: true },
      { id: "channels_assets", label: "Channels / Assets", type: "textarea", placeholder: "Channels, asset types, content volumes, landing pages, email, sales enablement, creator work, events, and localization.", required: true },
      { id: "team_approvals", label: "Team / Approvals / Lead Times", type: "textarea", placeholder: "Owners, vendors, production lead times, legal review, platform review, translations, stakeholder approvals, and dependencies.", required: true },
      { id: "rollout_style", label: "Rollout Style", type: "select", required: true, options: ["Single launch", "Teaser → launch → sustain", "Always-on with bursts", "Phased market rollout", "Event-led", "Seasonal / deadline-led", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-content-matrix-generator", name: "Campaign Content Matrix Generator",
    description: "Map segments, funnel stages, messages, proof, formats, channels, CTA, owners, reuse, and measurement into a controlled campaign content system.",
    icon: "folder", detailEmoji: "🧩", displayCreditCost: 7, aliases: ["campaign-content-plan-generator", "marketing-content-matrix"],
    inputs: [
      { id: "campaign_messaging", label: "Campaign Strategy / Messaging", type: "textarea", placeholder: "Objective, audience segments, journey stages, big idea, message pillars, proof, objections, offer, and CTA.", required: true },
      { id: "channels_formats", label: "Channels / Formats", type: "textarea", placeholder: "Paid social, search, email, landing pages, video, articles, sales, retail, events, partners, creators, or other channels.", required: true },
      { id: "production_capacity", label: "Production Capacity / Existing Assets", type: "textarea", placeholder: "Team, budget, skills, current assets, repurposing rights, production limits, cadence, and deadlines.", required: false },
      { id: "asset_count", label: "Approximate Asset Count", type: "select", required: true, options: assetCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-asset-requirements-generator", name: "Campaign Asset Requirements Generator",
    description: "Produce a production-ready asset inventory covering purpose, audience, channel, message, dimensions, variants, source material, owner, deadline, rights, QA, and approval status.",
    icon: "folder", detailEmoji: "🗃️", displayCreditCost: 7, aliases: ["campaign-deliverables-list", "marketing-asset-inventory-generator"],
    inputs: [
      { id: "campaign_plan", label: "Campaign Plan / Message System", type: "textarea", placeholder: "Objective, audiences, stages, channels, campaign idea, message pillars, offer, CTA, and timing.", required: true },
      { id: "channel_requirements", label: "Channel / Placement Requirements", type: "textarea", placeholder: "Platforms, placements, formats, dimensions, duration, file types, accessibility, localization, and known technical requirements.", required: true },
      { id: "existing_assets_rights", label: "Existing Assets / Rights", type: "textarea", placeholder: "Approved photography, video, logos, product renders, testimonials, licenses, usage periods, talent rights, and gaps.", required: false },
      { id: "asset_count", label: "Approximate Asset Count", type: "select", required: true, options: assetCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-production-workflow-generator", name: "Campaign Production Workflow Generator",
    description: "Build a controlled workflow from brief through copy, design, production, claims review, QA, localization, scheduling, publishing, version control, and archive.",
    icon: "folder", detailEmoji: "⚙️", displayCreditCost: 7, aliases: ["marketing-production-process", "campaign-operations-workflow"],
    inputs: [
      { id: "campaign_deliverables", label: "Campaign / Deliverables", type: "textarea", placeholder: "Campaign type, channels, asset list, volume, formats, localization, production complexity, and deadlines.", required: true },
      { id: "team_tools", label: "Team / Tools / Vendors", type: "textarea", placeholder: "Roles, agencies, freelancers, creative tools, project management, DAM, review systems, and publishing platforms.", required: true },
      { id: "approval_compliance", label: "Approval / Compliance Requirements", type: "textarea", placeholder: "Brand, product, legal, regulatory, privacy, platform, accessibility, rights, claims, security, and stakeholder reviews.", required: true },
      { id: "current_pain_points", label: "Current Process / Pain Points", type: "textarea", placeholder: "Rework, missed deadlines, unclear ownership, version confusion, bottlenecks, handoff failures, and quality issues.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-team-responsibility-planner", name: "Campaign Team & Responsibility Planner",
    description: "Define accountable ownership, decision rights, contributors, approvers, service levels, handoffs, escalation, and meeting rhythm for a campaign team.",
    icon: "folder", detailEmoji: "🧑‍💼", displayCreditCost: 5, aliases: ["campaign-raci-generator", "marketing-team-roles-planner"],
    inputs: [
      { id: "campaign_workstreams", label: "Campaign / Workstreams", type: "textarea", placeholder: "Strategy, audience, creative, content, media, web, CRM, sales, data, events, creators, legal, finance, and other workstreams.", required: true },
      { id: "people_roles", label: "People / Roles / Partners", type: "textarea", placeholder: "Named people or role titles, internal teams, agencies, vendors, executives, regional teams, and decision authority.", required: true },
      { id: "governance_constraints", label: "Governance / Constraints", type: "textarea", placeholder: "Approval rules, meeting limits, time zones, SLAs, escalation, budget authority, compliance, and known conflicts.", required: false },
      { id: "planning_format", label: "Planning Format", type: "select", required: true, options: ["RACI-style matrix", "DACI decision model", "Owner / approver workflow", "Small-team lean model", "Agency-client model", "Global / regional model", "Complete governance pack"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "product-launch-campaign-planner", name: "Product Launch Campaign Planner",
    description: "Plan a product or feature launch across validation, positioning, readiness, waitlist, education, announcement, conversion, onboarding, adoption, and post-launch learning.",
    icon: "calendar", detailEmoji: "🚀", displayCreditCost: 9, aliases: ["product-marketing-launch-plan", "go-to-market-campaign-planner"],
    inputs: [
      { id: "product_launch_context", label: "Product / Launch Context", type: "textarea", placeholder: "Product, feature, stage, audience, problem, differentiation, proof, availability, price, markets, and launch reason.", required: true },
      { id: "launch_objectives", label: "Launch Objectives / Success", type: "textarea", placeholder: "Business and marketing goals, target behaviour, adoption milestone, sales or pipeline outcome, timeframe, and evidence.", required: true },
      { id: "readiness_dependencies", label: "Readiness / Dependencies", type: "textarea", placeholder: "Product readiness, stock, pricing, sales enablement, support, legal, analytics, website, onboarding, partners, and localization.", required: true },
      { id: "launch_dates_budget", label: "Dates / Budget / Resources", type: "textarea", placeholder: "Announcement, availability, events, embargo, launch window, budget, team, agencies, and fixed commitments.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "lead-generation-campaign-planner", name: "Lead Generation Campaign Planner",
    description: "Connect audience, value exchange, acquisition channels, landing experience, form strategy, qualification, nurture, routing, sales follow-up, and closed-loop measurement.",
    icon: "calendar", detailEmoji: "🧲", displayCreditCost: 9, aliases: ["lead-gen-marketing-plan", "demand-generation-campaign-planner"],
    inputs: [
      { id: "offer_audience", label: "Offer / Audience", type: "textarea", placeholder: "Product, service, target accounts or consumers, problem, buying stage, value proposition, and sales cycle.", required: true },
      { id: "lead_magnet_conversion", label: "Value Exchange / Conversion", type: "textarea", placeholder: "Lead magnet, consultation, trial, demo, event, form, qualification, consent, expected next step, and friction.", required: true },
      { id: "channels_sales_process", label: "Channels / Sales Process", type: "textarea", placeholder: "Acquisition channels, landing pages, CRM, scoring, routing, response SLA, nurture, sales capacity, and feedback loop.", required: true },
      { id: "budget_tracking", label: "Budget / Tracking / Benchmarks", type: "textarea", placeholder: "Verified budget, cost history, conversion data, tracking, attribution, targets, and unknowns requiring measurement.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "customer-nurture-product-adoption-planner", name: "Customer Nurture & Product-Adoption Campaign Planner",
    description: "Create lifecycle communication that moves customers from onboarding through activation, education, habit formation, value realization, expansion, and advocacy.",
    icon: "calendar", detailEmoji: "🌱", displayCreditCost: 7, aliases: ["customer-nurture-campaign", "product-adoption-marketing-plan"],
    inputs: [
      { id: "product_customer_context", label: "Product / Customer Context", type: "textarea", placeholder: "Product, user segments, purchase or signup path, promised value, onboarding, support, renewal, and business model.", required: true },
      { id: "lifecycle_data", label: "Lifecycle / Behaviour Evidence", type: "textarea", placeholder: "Activation events, usage data, milestones, drop-offs, support questions, churn reasons, expansion signals, and data confidence.", required: true },
      { id: "desired_behaviours", label: "Desired Behaviours / Outcomes", type: "textarea", placeholder: "First value, repeated use, feature adoption, education, upgrade, referral, retention, or other customer outcomes.", required: true },
      { id: "channels_consent", label: "Channels / Consent / Capacity", type: "textarea", placeholder: "Email, in-app, SMS, push, customer success, community, frequency, consent, service capacity, and exclusions.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "re-engagement-win-back-campaign-planner", name: "Re-Engagement & Win-Back Campaign Planner",
    description: "Build a respectful inactivity or churn-recovery campaign using meaningful segmentation, value restoration, preference control, suppression, and measurement—not manipulative pressure.",
    icon: "calendar", detailEmoji: "↩️", displayCreditCost: 7, aliases: ["winback-marketing-plan", "customer-reactivation-campaign"],
    inputs: [
      { id: "inactive_churn_context", label: "Inactivity / Churn Context", type: "textarea", placeholder: "Product, audience, inactivity definition, churn point, cancellation reasons, lifecycle, subscription or purchase model, and current messaging.", required: true },
      { id: "customer_evidence", label: "Customer Evidence", type: "textarea", placeholder: "Usage, purchase history, feedback, support issues, survey data, price concerns, competitor movement, and data limitations.", required: true },
      { id: "recovery_options", label: "Recovery Options / Value", type: "textarea", placeholder: "Product improvements, education, preference changes, support, content, offers, pauses, downgrade, cancellation experience, and verified terms.", required: true },
      { id: "contact_rules", label: "Consent / Frequency / Suppression Rules", type: "textarea", placeholder: "Eligible lists, consent, opt-out, frequency caps, exclusions, complaint risk, deliverability, and legal review.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "event-webinar-campaign-planner", name: "Event & Webinar Campaign Planner",
    description: "Plan an event campaign from value proposition and speaker readiness through registration, reminders, attendance, engagement, follow-up, sales routing, and content reuse.",
    icon: "calendar", detailEmoji: "🎤", displayCreditCost: 7, aliases: ["webinar-marketing-plan", "event-promotion-campaign-planner"],
    inputs: [
      { id: "event_details", label: "Event / Webinar Details", type: "textarea", placeholder: "Topic, format, date, time zones, speakers, audience, capacity, price, platform, venue, content, and event purpose.", required: true },
      { id: "audience_value", label: "Audience / Value Proposition", type: "textarea", placeholder: "Who should attend, problem, desired outcome, objections, proof, urgency, accessibility, and why this event deserves attention.", required: true },
      { id: "channels_assets", label: "Channels / Assets / Partners", type: "textarea", placeholder: "Email, paid media, social, speakers, partners, landing page, calendar, sales outreach, community, PR, and required assets.", required: true },
      { id: "targets_followup", label: "Targets / Follow-Up / Constraints", type: "textarea", placeholder: "Registration and attendance goals, budget, lead handling, replay, nurture, sales routing, data consent, and fixed deadlines.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "influencer-creator-campaign-planner", name: "Influencer & Creator Campaign Planner",
    description: "Plan creator partnerships with audience fit, creative freedom, deliverables, usage rights, disclosure, brand safety, approvals, payment, measurement, and learning controls.",
    icon: "calendar", detailEmoji: "🎬", displayCreditCost: 9, aliases: ["creator-marketing-campaign-plan", "influencer-brief-generator"],
    inputs: [
      { id: "brand_campaign_context", label: "Brand / Campaign Context", type: "textarea", placeholder: "Brand, product, objective, audience, market, offer, campaign idea, proof, risks, and non-negotiable claims.", required: true },
      { id: "creator_strategy", label: "Creator Strategy / Fit", type: "textarea", placeholder: "Creator categories, audience overlap, content style, credibility, brand fit, diversity, scale, quality, and exclusion criteria.", required: true },
      { id: "deliverables_rights", label: "Deliverables / Rights / Compensation", type: "textarea", placeholder: "Platforms, content, dates, revisions, exclusivity, usage, whitelisting, paid amplification, geography, term, fees, products, and approvals.", required: true },
      { id: "disclosure_measurement", label: "Disclosure / Measurement / Safety", type: "textarea", placeholder: "Required disclosures, local rules, brand safety, comment moderation, tracking links, codes, lift, conversions, content quality, and incident plan.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "partnership-co-marketing-campaign-planner", name: "Partnership & Co-Marketing Campaign Planner",
    description: "Structure a co-marketing campaign with mutual value, audience fit, responsibilities, lead ownership, brand rules, rights, data handling, economics, approvals, and shared measurement.",
    icon: "calendar", detailEmoji: "🤝", displayCreditCost: 7, aliases: ["co-marketing-plan-generator", "brand-partnership-campaign-planner"],
    inputs: [
      { id: "partner_context", label: "Partners / Strategic Context", type: "textarea", placeholder: "Organizations, products, audiences, relationship, opportunity, conflicts, strategic value, and previous work.", required: true },
      { id: "joint_offer_audience", label: "Joint Offer / Audience", type: "textarea", placeholder: "Shared audience, problem, value proposition, campaign idea, assets, event or content, and customer experience.", required: true },
      { id: "roles_economics", label: "Roles / Economics / Lead Ownership", type: "textarea", placeholder: "Budget, contributions, revenue, costs, leads, data, sales follow-up, staffing, production, distribution, and support.", required: true },
      { id: "rights_approval_measurement", label: "Rights / Approvals / Measurement", type: "textarea", placeholder: "Brand usage, IP, privacy, consent, claims, approval rights, crisis handling, reporting, attribution, and exit terms.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-experiment-ab-test-planner", name: "Campaign Experiment & A/B Test Planner",
    description: "Design a disciplined campaign experiment with one decision, explicit hypothesis, controlled variable, audience allocation, guardrails, evidence threshold, analysis plan, and rollout rule.",
    icon: "seo", detailEmoji: "🧪", displayCreditCost: 7, aliases: ["marketing-ab-test-planner", "campaign-experiment-design"],
    inputs: [
      { id: "decision_hypothesis", label: "Decision / Hypothesis", type: "textarea", placeholder: "Decision to make, expected mechanism, target audience, outcome, rationale, and what evidence would change the decision.", required: true },
      { id: "variants_control", label: "Control / Variants / Variable", type: "textarea", placeholder: "Control, treatment, exactly what changes, what stays constant, asset versions, channel settings, and contamination risks.", required: true },
      { id: "audience_data", label: "Audience / Data / Volume", type: "textarea", placeholder: "Eligible population, traffic, sample history, randomization, platform delivery, conversion rate, seasonality, and known constraints.", required: true },
      { id: "metrics_timing", label: "Metrics / Timing / Decision Rule", type: "textarea", placeholder: "Primary metric, guardrails, minimum detectable effect if known, duration, attribution window, stopping rule, and rollout threshold.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "campaign-performance-review-optimization-generator", name: "Campaign Performance Review & Optimization Generator",
    description: "Turn campaign data into a careful performance review separating observation, attribution, evidence, creative learning, audience learning, operational issues, and next tests.",
    icon: "seo", detailEmoji: "📈", displayCreditCost: 9, aliases: ["post-campaign-analysis-generator", "campaign-optimization-review"],
    inputs: [
      { id: "campaign_plan_goals", label: "Campaign Plan / Goals", type: "textarea", placeholder: "Objective, audience, offer, channels, dates, budget, KPIs, targets, assumptions, and original decision criteria.", required: true },
      { id: "performance_data", label: "Performance Data", type: "textarea", placeholder: "Spend, reach, frequency, traffic, leads, sales, revenue, conversion, creative, segment, channel, lifecycle, and time-series data with source notes.", required: true },
      { id: "tracking_attribution", label: "Tracking / Attribution / Data Quality", type: "textarea", placeholder: "UTMs, pixels, CRM, offline data, attribution models, consent, missing data, platform differences, association dates, and known measurement limitations.", required: true },
      { id: "context_changes", label: "Context / Changes / Qualitative Evidence", type: "textarea", placeholder: "Market events, stock, price, site issues, sales feedback, support, comments, experiments, creative changes, competitors, and operational incidents.", required: false },
      ...commonTail,
    ],
  }),

  imageTool("campaign-key-visual-generator", "Campaign Key Visual Generator", "Create the central text-safe campaign visual system with distinctive subject, brand cues, emotional idea, composition, and reusable channel identity.", "🎯", ["campaign-hero-visual-generator", "marketing-key-art-ai"], 2),
  imageTool("multi-channel-campaign-creative-generator", "Multi-Channel Campaign Creative Generator", "Create a premium campaign visual adapted to a selected channel and placement while preserving approved campaign identity and message hierarchy.", "📡", ["campaign-format-adapter", "cross-channel-creative-generator"], 2),
  imageTool("campaign-social-creative-generator", "Campaign Social Creative Generator", "Create platform-ready, text-safe campaign imagery with immediate focal hierarchy, crop resilience, authentic audience context, and brand consistency.", "📱", ["marketing-social-visual-generator", "campaign-post-image-ai"], 2),
  imageTool("campaign-email-landing-hero-generator", "Campaign Email & Landing Hero Generator", "Create premium email or landing-page hero imagery with controlled headline and CTA space, responsive crop logic, and no unreliable generated copy.", "🖥️", ["landing-page-hero-ai", "email-campaign-hero-generator"], 2),
  imageTool("campaign-creative-variation-generator", "Campaign Creative Variation Generator", "Develop controlled visual variations from an approved reference by changing one planned dimension while preserving campaign, product, and brand identity.", "🧪", ["ad-creative-variation-generator", "campaign-visual-ab-test-generator"], 2),
  imageTool("campaign-moodboard-art-direction-generator", "Campaign Moodboard & Art-Direction Generator", "Create a restrained editorial art-direction board covering palette, subject, environment, lighting, texture, composition, typography-safe space, and channel mood without a boxed collage.", "🎨", ["campaign-creative-moodboard", "marketing-art-direction-board"], 2),
];
