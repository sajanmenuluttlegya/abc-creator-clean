import type { Tool, ToolInput } from "./public-tools";

const category = "Poster / Promotional Design Tools";
const languages = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audiences = ["General public", "Customers / shoppers", "Event attendees", "Business buyers", "Students / parents", "Local community", "Members / supporters", "Employees / candidates", "Custom from brief"];
const channels = ["Print poster", "Flyer / handout", "Social media", "Digital signage", "Retail / point of sale", "Outdoor / billboard", "Email / landing page", "Integrated campaign", "Custom from brief"];
const depth = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed design pack (7 credits)", "Comprehensive production pack (9 credits)"];
const tones = ["Premium commercial", "Bold high-impact", "Elegant editorial", "Friendly accessible", "Urgent promotional", "Cultural / artistic", "Corporate professional", "Educational / public information", "Custom from brief"];

const common: ToolInput[] = [
  { id: "primary_audience", label: "Primary Audience", type: "select", required: true, options: audiences },
  { id: "primary_channel", label: "Primary Channel", type: "select", required: true, options: channels },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depth },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: tones },
  { id: "language", label: "Language", type: "select", required: true, options: languages },
  { id: "must_preserve", label: "Exact Copy / Facts / Brand Rules to Preserve", type: "textarea", placeholder: "Approved headline, dates, prices, offer terms, address, contact details, QR destination, source wording, brand colours, legal line, accessibility or print requirements.", required: false },
];

type TextSpec = [string, string, string, string, number, Array<[string, string, string]>];
function textTool([slug, name, description, emoji, cost, fields]: TextSpec): Tool {
  return {
    id: slug, slug, name, description, icon: "poster", detailEmoji: emoji, category, displayCreditCost: cost, outputType: "text",
    inputs: [...fields.map(([id, label, placeholder]) => ({ id, label, type: "textarea" as const, placeholder, required: true })), ...common],
  };
}
function imageTool(slug: string, name: string, description: string, emoji: string): Tool {
  return { id: slug, slug, name, description, icon: "image", detailEmoji: emoji, category, displayCreditCost: 2, inputs: [] };
}

export const POSTER_PROMOTIONAL_IMAGE_TOOL_SLUGS = [
  "ai-poster-generator", "event-poster-generator", "concert-music-poster-generator", "festival-poster-generator", "movie-poster-generator", "theatre-performance-poster-generator", "exhibition-gallery-poster-generator", "conference-seminar-poster-generator", "webinar-online-event-poster-generator", "workshop-class-poster-generator", "product-launch-poster-generator", "sale-discount-poster-generator", "retail-promotion-poster-generator", "grand-opening-poster-generator", "restaurant-food-offer-poster-generator", "real-estate-open-house-poster-generator", "travel-tourism-poster-generator", "fitness-gym-poster-generator", "beauty-salon-poster-generator", "healthcare-awareness-poster-generator", "education-school-poster-generator", "recruitment-hiring-poster-generator", "fundraiser-charity-poster-generator", "public-information-notice-poster-generator", "social-media-promotional-poster-generator", "flyer-design-generator", "digital-signage-poster-generator", "billboard-outdoor-ad-generator",
] as const;

const textSpecs: TextSpec[] = [
  ["promotional-design-brief-generator", "Promotional Design Brief Generator", "Turn campaign facts into an agency-ready poster or promotional-design brief.", "🧭", 7, [["promotion_goal_context", "Promotion Goal / Context", "Offer, event, problem, desired action, timing, location and current context."], ["audience_message_evidence", "Audience / Message / Evidence", "Audience insight, approved promise, proof, objections and source material."], ["deliverables_brand_constraints", "Deliverables / Brand / Constraints", "Formats, quantities, brand assets, copy, legal line, print and approval requirements."]]],
  ["poster-copy-message-hierarchy-generator", "Poster Copy & Message Hierarchy Generator", "Create concise, exact and scannable poster copy with a defensible information hierarchy.", "✍️", 7, [["offer_event_facts", "Offer / Event Facts", "Verified product, event, date, price, location, eligibility and contact facts."], ["audience_action", "Audience / Desired Action", "Who must notice, understand and act; context, objections and urgency."], ["copy_constraints", "Copy / Compliance Constraints", "Approved claims, required wording, word limits, exclusions and review boundaries."]]],
  ["poster-layout-art-direction-planner", "Poster Layout & Art Direction Planner", "Plan hierarchy, composition, imagery, typography and production-safe visual direction.", "🎨", 7, [["content_hierarchy", "Content Hierarchy", "Headline, supporting line, details, CTA, logo, QR and legal copy."], ["brand_visual_context", "Brand / Visual Context", "Brand assets, campaign idea, image references, mood, colour and type guidance."], ["format_environment", "Format / Viewing Environment", "Dimensions, orientation, distance, lighting, print or screen context and constraints."]]],
  ["promotional-size-version-plan-generator", "Promotional Size & Version Plan Generator", "Plan channel-specific sizes, crops, copy lengths and reusable master components.", "📐", 7, [["master_campaign_asset", "Master Campaign Asset", "Campaign idea, key visual, master copy and mandatory elements."], ["channel_format_inventory", "Channel / Format Inventory", "Required print, social, signage, retail, outdoor and digital placements."], ["adaptation_constraints", "Adaptation Constraints", "Safe areas, crop rules, platform limits, localisation, accessibility and approvals."]]],
  ["print-production-preflight-planner", "Print Production & Preflight Planner", "Create a controlled print handoff covering size, bleed, colour, images, fonts and proofing.", "🖨️", 9, [["print_specification", "Print Specification", "Final dimensions, orientation, stock, finishing, quantity, printer requirements and deadline."], ["artwork_assets", "Artwork / Assets", "Document setup, linked images, vector marks, fonts, colours, QR/barcodes and source ownership."], ["proof_delivery_controls", "Proof / Delivery Controls", "Bleed, trim, safe area, resolution, colour profile, overprint, proofing and sign-off."]]],
  ["poster-accessibility-readability-auditor", "Poster Accessibility & Readability Auditor", "Audit hierarchy, contrast, text size, reading order, language and viewing-distance usability.", "♿", 9, [["poster_content_structure", "Poster Content / Structure", "All visible copy, hierarchy, reading order, symbols, QR and alternative access method."], ["design_viewing_context", "Design / Viewing Context", "Colours, typography, layout, size, distance, lighting, motion and display duration."], ["review_requirements", "Review Requirements", "Audience needs, language, accessibility expectations, evidence and known limitations."]]],
  ["multilingual-localization-poster-planner", "Multilingual Poster Localization Planner", "Adapt promotional design across languages without breaking meaning or layout.", "🌍", 7, [["master_copy_design", "Master Copy / Design", "Approved source copy, hierarchy, layout, imagery, icons and editable components."], ["target_markets_languages", "Target Markets / Languages", "Languages, locales, cultural context, required terminology and review owners."], ["localization_constraints", "Localization Constraints", "Expansion, scripts, fonts, line breaks, date/currency formats, legal wording and image sensitivity."]]],
  ["promotional-campaign-asset-rollout-planner", "Promotional Campaign Asset Rollout Planner", "Coordinate poster, flyer, signage and social adaptations through production and release.", "📅", 9, [["campaign_schedule_scope", "Campaign Schedule / Scope", "Launch date, phases, placements, markets, locations and asset inventory."], ["production_workflow", "Production Workflow", "Brief, copy, design, imagery, localisation, proof, print, upload and installation steps."], ["owners_approvals_risks", "Owners / Approvals / Risks", "Owners, dependencies, legal/brand review, vendors, contingency, quality checks and deadlines."]]],
];

export const posterPromotionalTools: Tool[] = [
  ...textSpecs.map(textTool),
  imageTool("ai-poster-generator", "AI Poster Generator", "Create an editable text-layer poster over a generated premium key visual.", "🖼️"),
  imageTool("event-poster-generator", "Event Poster Generator", "Design a clear, high-impact event poster with editable details and CTA.", "🎟️"),
  imageTool("concert-music-poster-generator", "Concert & Music Poster Generator", "Create expressive music promotion with artist, venue and ticket text kept editable.", "🎵"),
  imageTool("festival-poster-generator", "Festival Poster Generator", "Create layered festival artwork with readable schedules, dates and venue details.", "🎪"),
  imageTool("movie-poster-generator", "Movie Poster Generator", "Create cinematic poster art with editable title, billing and release information.", "🎬"),
  imageTool("theatre-performance-poster-generator", "Theatre & Performance Poster Generator", "Create dramatic performance promotion with exact show information.", "🎭"),
  imageTool("exhibition-gallery-poster-generator", "Exhibition & Gallery Poster Generator", "Create refined cultural promotion with editable artist and exhibition details.", "🖼️"),
  imageTool("conference-seminar-poster-generator", "Conference & Seminar Poster Generator", "Create professional conference promotion with speakers, date and registration CTA.", "🎤"),
  imageTool("webinar-online-event-poster-generator", "Webinar & Online Event Poster Generator", "Create digital event promotion with editable platform, time and registration details.", "💻"),
  imageTool("workshop-class-poster-generator", "Workshop & Class Poster Generator", "Create practical learning promotion with topic, instructor, schedule and CTA.", "🧑‍🏫"),
  imageTool("product-launch-poster-generator", "Product Launch Poster Generator", "Create a premium launch visual while preserving exact product claims and CTA text.", "🚀"),
  imageTool("sale-discount-poster-generator", "Sale & Discount Poster Generator", "Create bold promotional artwork with exact price, discount and terms as editable layers.", "🏷️"),
  imageTool("retail-promotion-poster-generator", "Retail Promotion Poster Generator", "Create point-of-sale promotion with product, offer and store details.", "🛍️"),
  imageTool("grand-opening-poster-generator", "Grand Opening Poster Generator", "Create location-led opening promotion with exact date, address and offer.", "🎉"),
  imageTool("restaurant-food-offer-poster-generator", "Restaurant & Food Offer Poster Generator", "Create appetising food promotion with editable menu, price and ordering details.", "🍽️"),
  imageTool("real-estate-open-house-poster-generator", "Real Estate & Open House Poster Generator", "Create property promotion with exact location, date and contact details.", "🏠"),
  imageTool("travel-tourism-poster-generator", "Travel & Tourism Poster Generator", "Create destination-led promotion with editable package and booking details.", "✈️"),
  imageTool("fitness-gym-poster-generator", "Fitness & Gym Poster Generator", "Create energetic membership, programme or class promotion.", "🏋️"),
  imageTool("beauty-salon-poster-generator", "Beauty & Salon Poster Generator", "Create polished service promotion with editable treatment, price and booking CTA.", "✨"),
  imageTool("healthcare-awareness-poster-generator", "Healthcare Awareness Poster Generator", "Create clear public-awareness artwork without inventing medical claims.", "🩺"),
  imageTool("education-school-poster-generator", "Education & School Poster Generator", "Create readable academic, admissions or campus promotion.", "🏫"),
  imageTool("recruitment-hiring-poster-generator", "Recruitment & Hiring Poster Generator", "Create inclusive hiring promotion with exact role and application details.", "👥"),
  imageTool("fundraiser-charity-poster-generator", "Fundraiser & Charity Poster Generator", "Create credible cause promotion with editable event, donation and contact details.", "🤲"),
  imageTool("public-information-notice-poster-generator", "Public Information & Notice Poster Generator", "Create accessible notices with exact instructions, dates and contact channels.", "📢"),
  imageTool("social-media-promotional-poster-generator", "Social Media Promotional Poster Generator", "Create square, portrait or story promotional graphics with editable copy.", "📱"),
  imageTool("flyer-design-generator", "Flyer Design Generator", "Create front-facing flyer artwork with editable promotional information.", "📄"),
  imageTool("digital-signage-poster-generator", "Digital Signage Poster Generator", "Create distance-readable screen promotion with controlled dwell-time copy.", "🖥️"),
  imageTool("billboard-outdoor-ad-generator", "Billboard & Outdoor Ad Generator", "Create ultra-concise outdoor promotion with exact high-visibility text layers.", "🏙️"),
];
