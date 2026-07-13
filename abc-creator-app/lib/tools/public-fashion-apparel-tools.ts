import type { Tool, ToolInput } from "./public-tools";

const category = "Fashion / Apparel Creator Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Premium fashion-studio", "Executive and concise", "Technical product-development", "Editorial and refined", "Commercial and practical", "Warm and client-ready", "Custom from brief"];
const unitOptions = ["Metric", "US customary", "Metric + US customary", "Preserve supplied units"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed strategic (7 credits)", "Executive comprehensive (9 credits)"];
const marketTierOptions = ["Value", "Accessible premium", "Contemporary", "Premium", "Luxury", "Performance / technical", "Custom from brief"];
const channelOptions = ["Direct-to-consumer", "Wholesale", "Marketplace", "Retail stores", "Department store", "Made-to-order", "Uniform / B2B", "Multi-channel", "Custom from brief"];
const versionOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const rangeSizeOptions = ["8 styles", "12 styles", "18 styles", "24 styles", "36 styles", "48 styles"];
const lookCountOptions = ["6 looks", "12 looks", "18 looks", "24 looks", "36 looks", "48 looks"];
const outfitCountOptions = ["5 outfits", "10 outfits", "20 outfits", "30 outfits", "40 outfits"];

const commonTail: ToolInput[] = [
  { id: "market_region", label: "Market / Region", type: "text", placeholder: "Country, climate, retail market, cultural context, sizing market, or manufacturing region. Used for context—not compliance certification.", required: false },
  { id: "market_tier", label: "Market Tier", type: "select", required: true, options: marketTierOptions },
  { id: "sales_channel", label: "Primary Sales Channel", type: "select", required: true, options: channelOptions },
  { id: "unit_system", label: "Units", type: "select", required: true, options: unitOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Constraints to Preserve", type: "textarea", placeholder: "Exact measurements, garment details, materials, trims, prices, supplier facts, brand rules, fit comments, approved wording, sustainability evidence, or details that must not change.", required: false },
];

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

function imageTool(slug: string, name: string, description: string, emoji: string, aliases: string[], displayCreditCost: number): Tool {
  return { id: slug, slug, name, description, icon: "image", detailEmoji: emoji, category, displayCreditCost, aliases, inputs: [] };
}

export const FASHION_APPAREL_IMAGE_TOOL_SLUGS = [
  "outfit-concept-generator",
  "fashion-editorial-generator",
  "fashion-lookbook-image-generator",
  "fashion-collection-lineup-generator",
  "garment-flat-lay-generator",
  "apparel-product-mockup-generator",
  "textile-pattern-generator",
  "fashion-moodboard-generator",
  "fashion-on-model-visual-generator",
  "garment-detail-material-closeup-generator",
] as const;

export const fashionApparelTools: Tool[] = [
  textTool({
    slug: "fashion-collection-concept-generator", name: "Fashion Collection Concept Generator",
    description: "Build a coherent fashion collection concept connecting customer, season, product opportunity, design language, assortment, materials, and commercial proof.",
    icon: "idea", detailEmoji: "🧥", displayCreditCost: 7, aliases: ["fashion-range-concept-generator", "clothing-collection-idea-generator"],
    nextActions: [{ label: "Plan the assortment", href: "/tools/collection-range-assortment-planner", description: "Translate the concept into a balanced range of styles, categories, colours, and price roles." }],
    inputs: [
      { id: "brand_founder_context", label: "Brand / Founder Context", type: "textarea", placeholder: "Brand stage, strengths, design heritage, resources, team, customer knowledge, commercial goals, and why this collection should exist.", required: true },
      { id: "season_market_opportunity", label: "Season / Market Opportunity", type: "textarea", placeholder: "Season, climate, demand signal, customer need, competitor context, channel timing, price expectations, and verified evidence.", required: true },
      { id: "creative_direction", label: "Creative Direction", type: "textarea", placeholder: "Inspiration, silhouette, function, mood, colour, material, craft, cultural references, and explicit clichés or trends to avoid.", required: true },
      { id: "commercial_constraints", label: "Commercial / Production Constraints", type: "textarea", placeholder: "Budget, minimums, factory capability, lead time, target margin, category limits, inventory risk, sustainability goals, or launch deadline.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "collection-range-assortment-planner", name: "Collection Range & Assortment Planner",
    description: "Plan a commercially balanced fashion range with hero products, core styles, price architecture, colourways, size breadth, drops, and gap control.",
    icon: "folder", detailEmoji: "🗂️", displayCreditCost: 9, aliases: ["fashion-assortment-planner", "collection-range-plan-generator"],
    nextActions: [{ label: "Create garment briefs", href: "/tools/apparel-design-brief-generator", description: "Turn priority styles into controlled design and development briefs." }],
    inputs: [
      { id: "collection_strategy", label: "Collection Strategy / Concept", type: "textarea", placeholder: "Brand positioning, season, customer, use occasions, categories, design thesis, channel, and commercial objective.", required: true },
      { id: "historical_or_market_data", label: "Sales / Market Evidence", type: "textarea", placeholder: "Verified sales, sell-through, returns, bestsellers, customer feedback, competitor range observations, or clearly labelled hypotheses.", required: false },
      { id: "production_commercial_limits", label: "Production / Commercial Limits", type: "textarea", placeholder: "Style count, budget, MOQs, suppliers, lead times, target price bands, fabric commitments, size range, and inventory limits.", required: true },
      { id: "range_size", label: "Target Range Size", type: "select", required: true, options: rangeSizeOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "apparel-design-brief-generator", name: "Apparel Design Brief Generator",
    description: "Convert a garment idea into a controlled professional brief covering wearer, function, silhouette, construction intent, materials, fit, quality, and development gates.",
    icon: "writing-pad", detailEmoji: "📋", displayCreditCost: 7, aliases: ["garment-design-brief", "fashion-product-brief-generator"],
    inputs: [
      { id: "garment_concept", label: "Garment Concept / Product Role", type: "textarea", placeholder: "Garment category, collection role, wearer, occasion, season, price point, function, and desired emotional or visual impact.", required: true },
      { id: "silhouette_fit_function", label: "Silhouette / Fit / Function", type: "textarea", placeholder: "Volume, length, proportion, ease, mobility, layering, closures, pockets, support, comfort, modesty, accessibility, and performance needs.", required: true },
      { id: "materials_construction", label: "Materials / Construction Direction", type: "textarea", placeholder: "Fabric families, trims, seams, finishes, lining, reinforcement, workmanship, artwork, wash, and durability expectations.", required: true },
      { id: "development_constraints", label: "Development Constraints", type: "textarea", placeholder: "Target cost, factory capability, MOQ, timeline, compliance review, sample limit, approved blocks, components, and must-keep details.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "target-customer-wearing-occasion-mapper", name: "Target Customer & Wearing Occasion Mapper",
    description: "Map evidence-led fashion customers to real wearing occasions, climate, movement, comfort, care, style, price, and purchase decisions without stereotypes.",
    icon: "seo", detailEmoji: "🎯", displayCreditCost: 7, aliases: ["fashion-customer-persona-generator", "wearing-occasion-planner"],
    inputs: [
      { id: "brand_product_context", label: "Brand / Product Context", type: "textarea", placeholder: "Brand, categories, price tier, geography, channel, current customer, desired growth, and collection or product under review.", required: true },
      { id: "customer_evidence", label: "Known Customer Evidence", type: "textarea", placeholder: "Research, reviews, returns, interviews, purchase patterns, fit feedback, lifestyle facts, and hypotheses clearly labelled as assumptions.", required: false },
      { id: "occasion_scope", label: "Occasions / Use Context", type: "textarea", placeholder: "Work, commute, travel, ceremony, sports, leisure, climate, layering, caregiving, pregnancy, disability, religious or cultural context, and wardrobe transition needs.", required: true },
      { id: "business_goal", label: "Business Goal", type: "select", required: true, options: ["New collection", "Improve product-market fit", "Reduce returns", "Enter a new market", "Expand size or occasion coverage", "Reposition the brand", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fashion-trend-research-brief-generator", name: "Fashion Trend Research Brief Generator",
    description: "Create a rigorous fashion-research plan for cultural signals, colour, materials, silhouette, styling, consumer relevance, and commercial validation without inventing trend evidence.",
    icon: "seo", detailEmoji: "🔭", displayCreditCost: 7, aliases: ["fashion-trend-brief", "apparel-research-plan-generator"],
    inputs: [
      { id: "research_question", label: "Research Question / Decision", type: "textarea", placeholder: "What design, assortment, market, colour, material, customer, or timing decision must the research support?", required: true },
      { id: "brand_season_scope", label: "Brand / Season / Scope", type: "textarea", placeholder: "Brand position, target customer, geography, season, categories, horizon, market tier, and existing direction.", required: true },
      { id: "available_sources", label: "Available Sources / Evidence", type: "textarea", placeholder: "Runways, retail, street style, search data, social, trade fairs, archives, sales data, interviews, suppliers, and source-access limitations.", required: false },
      { id: "research_depth", label: "Research Horizon", type: "select", required: true, options: ["Immediate micro-trend", "Next season", "12–24 month direction", "Long-term consumer shift", "Material / colour focus", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "collection-story-naming-generator", name: "Collection Story & Naming Generator",
    description: "Create truthful collection narratives, naming territories, style-name systems, launch language, and vocabulary rules grounded in the supplied concept.",
    icon: "writing-pad", detailEmoji: "📖", displayCreditCost: 5, aliases: ["fashion-collection-name-generator", "collection-story-generator"],
    inputs: [
      { id: "verified_concept_inputs", label: "Verified Concept Inputs", type: "textarea", placeholder: "Collection inspiration, origin, people, place, craft, references, materials, silhouettes, values, and facts that may be stated publicly.", required: true },
      { id: "brand_voice_audience", label: "Brand Voice / Audience", type: "textarea", placeholder: "Tone, customer, price tier, cultural context, vocabulary, channels, language restrictions, and words to avoid.", required: true },
      { id: "naming_scope", label: "Naming Scope", type: "select", required: true, options: ["Collection name only", "Collection + style names", "Collection + colourway names", "Complete naming architecture", "Campaign story + names", "Custom from brief"] },
      { id: "version_count", label: "Versions", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "garment-specification-tech-pack-content-generator", name: "Garment Specification & Tech-Pack Content Generator",
    description: "Create structured tech-pack content for product identification, construction, measurements, components, artwork, labels, workmanship, tolerances, and revision control.",
    icon: "folder", detailEmoji: "📐", displayCreditCost: 9, aliases: ["fashion-tech-pack-generator", "garment-specification-generator"],
    nextActions: [{ label: "Build the BOM and costing sheet", href: "/tools/bill-of-materials-garment-costing-planner", description: "Connect the specification to material, trim, packaging, labour, and verified cost inputs." }],
    inputs: [
      { id: "garment_design_details", label: "Garment / Design Details", type: "textarea", placeholder: "Style name or code, category, front/back details, silhouette, fit intent, construction, seams, pockets, closures, artwork, washes, and approved reference notes.", required: true },
      { id: "measurement_fit_inputs", label: "Measurement / Fit Inputs", type: "textarea", placeholder: "Base size, points of measure, approved block, body or garment measurements, ease, tolerances, grade notes, and unresolved fit questions.", required: true },
      { id: "materials_components", label: "Materials / Components", type: "textarea", placeholder: "Shell, lining, interlining, trims, thread, labels, packaging, colourways, supplier references, approved substitutions, and unknowns.", required: true },
      { id: "production_quality_context", label: "Production / Quality Context", type: "textarea", placeholder: "Factory capability, stitch standards, finishing, testing, compliance, packing, inspection level, sample stage, revision history, and delivery target.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "bill-of-materials-garment-costing-planner", name: "Bill of Materials & Garment Costing Planner",
    description: "Structure a transparent BOM and garment-cost worksheet covering fabric, trims, thread, labels, packaging, consumption, loss, labour, overhead, duty, and verified supplier prices.",
    icon: "seo", detailEmoji: "🧾", displayCreditCost: 9, aliases: ["fashion-bom-generator", "apparel-costing-sheet-generator"],
    inputs: [
      { id: "style_materials", label: "Style / Material Requirements", type: "textarea", placeholder: "Garment details, shell and secondary fabrics, trims, labels, artwork, packaging, colourways, sizes, construction, and quantity plan.", required: true },
      { id: "verified_cost_inputs", label: "Verified Costs / Commercial Inputs", type: "textarea", placeholder: "Supplier, currency, price, MOQ, pack or roll size, width, consumption, wastage, labour, freight, duty, commission, overhead, tax, and date. Leave unknowns blank.", required: false },
      { id: "production_quantity", label: "Production Quantity / Size Mix", type: "textarea", placeholder: "Units by style, colour, size, market, order stage, sample quantity, replenishment assumptions, and factory minimums.", required: true },
      { id: "costing_goal", label: "Costing Goal", type: "select", required: true, options: ["Create first-cost worksheet", "Compare supplier options", "Review cost drivers", "Meet a target cost", "Prepare pricing inputs", "Complete BOM and costing pack"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fabric-trim-specification-planner", name: "Fabric & Trim Specification Planner",
    description: "Define fabric and trim requirements covering fibre, structure, weight, stretch, recovery, drape, hand, finish, colour, performance, testing, care, and supplier approval.",
    icon: "folder", detailEmoji: "🧵", displayCreditCost: 7, aliases: ["fabric-specification-generator", "fashion-material-planner"],
    inputs: [
      { id: "garment_use_fit", label: "Garment / Use / Fit", type: "textarea", placeholder: "Product category, silhouette, fit, movement, climate, layering, skin contact, laundering, durability, price point, and wearer expectations.", required: true },
      { id: "material_direction", label: "Material Direction", type: "textarea", placeholder: "Desired fibre, weave or knit, weight, structure, drape, hand, sheen, stretch, recovery, finish, texture, colour, and visual references.", required: true },
      { id: "performance_compliance", label: "Performance / Compliance Needs", type: "textarea", placeholder: "Abrasion, pilling, shrinkage, colourfastness, dimensional stability, waterproofing, breathability, flame or chemical requirements, and markets requiring specialist review.", required: false },
      { id: "supplier_constraints", label: "Supplier / Production Constraints", type: "textarea", placeholder: "MOQ, lead time, width, available colours, stock, origin, certification evidence, lab-dip process, testing access, substitutions, and budget.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "colorway-palette-planner", name: "Colourway & Palette Planner",
    description: "Build a collection-level colour architecture with core, seasonal, commercial, statement, and carryover roles across products and materials.",
    icon: "idea", detailEmoji: "🎨", displayCreditCost: 5, aliases: ["fashion-color-palette-generator", "apparel-colourway-planner"],
    inputs: [
      { id: "collection_context", label: "Collection / Brand Context", type: "textarea", placeholder: "Season, climate, customer, categories, price tier, visual identity, channel, existing colours, and strategic objectives.", required: true },
      { id: "material_product_map", label: "Materials / Product Categories", type: "textarea", placeholder: "Fabric families, textures, prints, washes, leather, knit, hardware, footwear, accessories, and product categories requiring colour allocation.", required: true },
      { id: "colour_evidence_constraints", label: "Colour Evidence / Constraints", type: "textarea", placeholder: "Sales history, returns, supplier colour cards, brand colours, lab dips, minimums, cultural context, digital/physical mismatch risks, and colours to avoid.", required: false },
      { id: "palette_scope", label: "Palette Scope", type: "select", required: true, options: ["Single product", "Capsule", "Full collection", "Multi-drop season", "Carryover + seasonal update", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "print-pattern-direction-generator", name: "Print & Pattern Direction Generator",
    description: "Develop professional print direction covering motif language, repeat type, scale, placement, colour separation, garment mapping, production method, and approval tests.",
    icon: "idea", detailEmoji: "🌺", displayCreditCost: 7, aliases: ["textile-print-brief-generator", "fashion-pattern-direction"],
    inputs: [
      { id: "collection_print_context", label: "Collection / Print Context", type: "textarea", placeholder: "Brand, customer, season, product categories, inspiration, narrative, price tier, desired distinctiveness, and cultural context.", required: true },
      { id: "motif_visual_direction", label: "Motif / Visual Direction", type: "textarea", placeholder: "Subject matter, abstraction, line, texture, density, movement, scale, placement, negative space, colour, and references to avoid copying.", required: true },
      { id: "production_method_constraints", label: "Production Method / Constraints", type: "textarea", placeholder: "Screen, rotary, digital, sublimation, embroidery, jacquard, placement print, colour count, repeat size, fabric width, registration, MOQ, and cost limits.", required: false },
      { id: "pattern_scope", label: "Pattern Scope", type: "select", required: true, options: ["Seamless repeat", "Placement print", "Border print", "Engineered garment print", "All-over collection family", "Embroidery / embellishment direction", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "size-range-grading-requirements-planner", name: "Size Range & Grading Requirements Planner",
    description: "Define size architecture, base size, body and garment measurement questions, critical grade points, fit intent, inclusivity, validation, and approval requirements without pretending certified grading.",
    icon: "folder", detailEmoji: "📏", displayCreditCost: 9, aliases: ["fashion-size-range-planner", "garment-grading-requirements"],
    inputs: [
      { id: "product_fit_context", label: "Product / Fit Context", type: "textarea", placeholder: "Garment category, stretch, intended fit, layering, movement, body areas under fit pressure, approved block, base size, and target market.", required: true },
      { id: "target_size_range", label: "Target Size Range / Market", type: "textarea", placeholder: "Sizes, alpha or numeric system, region, gender or unisex strategy, petite/tall/curve needs, adaptive needs, and current size standards.", required: true },
      { id: "measurement_data", label: "Available Measurement Data", type: "textarea", placeholder: "Body charts, garment specs, fit-model data, customer returns, scan data, grade rules, tolerances, and gaps. Do not estimate missing figures.", required: false },
      { id: "validation_resources", label: "Validation Resources", type: "textarea", placeholder: "Fit models, avatars, samples, size-set availability, wear testing, 3D simulation, factory pattern team, timeline, and approval authority.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "sampling-fit-review-planner", name: "Sampling & Fit Review Planner",
    description: "Create a disciplined sample and fit-review workflow covering measurements, balance, movement, construction, material behaviour, comments, ownership, and next-sample gates.",
    icon: "calendar", detailEmoji: "🪡", displayCreditCost: 7, aliases: ["fashion-fit-session-planner", "sample-review-generator"],
    inputs: [
      { id: "sample_stage_style", label: "Sample Stage / Style", type: "textarea", placeholder: "Proto, fit, salesman, size set, pre-production, TOP, digital sample, style details, supplier, version, and approval deadline.", required: true },
      { id: "spec_fit_reference", label: "Spec / Fit Reference", type: "textarea", placeholder: "Approved measurements, tolerances, block, fit intent, model or avatar data, previous comments, pattern changes, and must-preserve decisions.", required: true },
      { id: "sample_observations", label: "Current Sample Observations", type: "textarea", placeholder: "Measurement results, balance, drag lines, tension, gaping, twist, mobility, comfort, fabric behaviour, workmanship, and wearer feedback.", required: false },
      { id: "review_resources", label: "Review Team / Resources", type: "textarea", placeholder: "Designer, technical designer, pattern maker, fit model, supplier, 3D team, photos, video, tools, time, and decision authority.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "production-handoff-apparel-qa-generator", name: "Production Handoff & Apparel QA Generator",
    description: "Create a factory-ready handoff and quality plan covering approved standards, workmanship, tolerances, tests, inspection points, defects, packaging, escalation, and change control.",
    icon: "folder", detailEmoji: "✅", displayCreditCost: 9, aliases: ["fashion-production-handoff", "apparel-quality-plan-generator"],
    inputs: [
      { id: "approved_product_package", label: "Approved Product Package", type: "textarea", placeholder: "Tech pack, patterns, specs, BOM, artwork, colours, size range, samples, testing, labels, packing, and final approvals currently available.", required: true },
      { id: "factory_order_context", label: "Factory / Order Context", type: "textarea", placeholder: "Factory capability, order quantity, size/colour breakdown, timeline, critical operations, subcontracting, production location, and communication flow.", required: true },
      { id: "quality_risk_history", label: "Quality Risks / History", type: "textarea", placeholder: "Known defects, prior claims, high-risk materials, shrinkage, shade, seam, print, trim, measurement, packing, or compliance concerns.", required: false },
      { id: "inspection_context", label: "Inspection / Approval Context", type: "textarea", placeholder: "Inline, final, AQL if verified, lab tests, golden sample, TOP sample, third-party inspection, shipment release, and escalation authority.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "sustainable-circular-collection-planner", name: "Sustainable & Circular Collection Planner",
    description: "Evaluate collection decisions through durability, repairability, material efficiency, waste, overproduction, recyclability, traceability, packaging, care, and end-of-use evidence.",
    icon: "idea", detailEmoji: "♻️", displayCreditCost: 7, aliases: ["circular-fashion-planner", "sustainable-apparel-collection-generator"],
    inputs: [
      { id: "collection_product_context", label: "Collection / Product Context", type: "textarea", placeholder: "Brand, products, volumes, materials, price tier, lifespan, channels, production regions, current sustainability commitments, and business constraints.", required: true },
      { id: "verified_impact_evidence", label: "Verified Materials / Impact Evidence", type: "textarea", placeholder: "Supplier declarations, certifications, composition, traceability, test results, LCA data, waste, returns, repair, take-back, packaging, and evidence gaps.", required: false },
      { id: "circularity_goals", label: "Circularity / Responsibility Goals", type: "textarea", placeholder: "Durability, repair, resale, rental, modularity, mono-materiality, recycled content, recyclability, biodegradability, lower waste, lower volume, or social goals.", required: true },
      { id: "commercial_operational_limits", label: "Commercial / Operational Limits", type: "textarea", placeholder: "Cost, MOQ, lead time, factory capability, performance, quality, customer care, logistics, local infrastructure, and legal-claims review.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fashion-merchandising-drop-planner", name: "Fashion Merchandising & Drop Planner",
    description: "Plan product drops, range sequencing, hero styles, continuity, replenishment, price architecture, storytelling, launch dependencies, and inventory questions.",
    icon: "calendar", detailEmoji: "🛍️", displayCreditCost: 9, aliases: ["fashion-drop-calendar-generator", "apparel-merchandising-plan"],
    inputs: [
      { id: "range_inventory_context", label: "Range / Inventory Context", type: "textarea", placeholder: "Collection, product list, categories, colours, sizes, buy quantities, carryover, stock, replenishment, lead times, and open-to-buy if supplied.", required: true },
      { id: "customer_channel_calendar", label: "Customer / Channel / Calendar", type: "textarea", placeholder: "Target customer, retail moments, weather, campaigns, wholesale dates, content, store, online, marketplace, and regional timing.", required: true },
      { id: "sales_performance_evidence", label: "Sales / Performance Evidence", type: "textarea", placeholder: "Verified sales, sell-through, margin, returns, stock cover, waiting lists, demand signals, or assumptions clearly labelled.", required: false },
      { id: "planning_goal", label: "Planning Goal", type: "select", required: true, options: ["Single launch", "Multi-drop season", "Monthly capsule model", "Wholesale delivery plan", "Replenishment strategy", "Complete merchandising calendar"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "outfit-styling-generator", name: "Outfit & Styling Generator",
    description: "Create complete, wearable outfits from supplied garments, body-comfort needs, occasion, climate, dress code, colour, proportion, and personal style.",
    icon: "idea", detailEmoji: "👗", displayCreditCost: 5, aliases: ["fashion-outfit-generator", "personal-styling-generator"],
    inputs: [
      { id: "wardrobe_items", label: "Available Garments / Accessories", type: "textarea", placeholder: "List exact items, colours, cuts, materials, fit, footwear, outerwear, bags, jewellery, and anything unavailable or off-limits.", required: true },
      { id: "wearer_context", label: "Wearer / Comfort Context", type: "textarea", placeholder: "Style preferences, fit comfort, mobility, sensory needs, modesty, body areas to emphasize or de-emphasize only if the user requests, and practical limitations.", required: true },
      { id: "occasion_weather_dresscode", label: "Occasion / Weather / Dress Code", type: "textarea", placeholder: "Event, location, climate, duration, travel, movement, cultural expectations, formality, and day-to-night requirements.", required: true },
      { id: "outfit_count", label: "Number of Outfits", type: "select", required: true, options: outfitCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "capsule-wardrobe-generator", name: "Capsule Wardrobe Generator",
    description: "Build an interchangeable, climate- and lifestyle-aware wardrobe with outfit coverage, purchase priorities, repetition control, care reality, and gap analysis.",
    icon: "folder", detailEmoji: "🧳", displayCreditCost: 7, aliases: ["minimal-wardrobe-planner", "capsule-clothing-generator"],
    inputs: [
      { id: "existing_wardrobe", label: "Existing Wardrobe", type: "textarea", placeholder: "Current garments, colours, fit, condition, favourites, rarely worn pieces, shoes, bags, outerwear, uniforms, and laundry constraints.", required: true },
      { id: "lifestyle_occasions", label: "Lifestyle / Occasions", type: "textarea", placeholder: "Work, commute, home, exercise, travel, events, climate, cultural needs, dress codes, frequency, and seasonal changes.", required: true },
      { id: "style_fit_budget", label: "Style / Fit / Budget", type: "textarea", placeholder: "Personal style, silhouettes, comfort, sensory or mobility needs, palette, shopping budget, quality expectations, and brands or materials to avoid.", required: true },
      { id: "capsule_scope", label: "Capsule Scope", type: "select", required: true, options: ["10-piece mini capsule", "20-piece capsule", "30-piece complete capsule", "Work capsule", "Travel capsule", "Seasonal capsule", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fashion-lookbook-planner", name: "Fashion Lookbook Planner",
    description: "Plan a coherent lookbook sequence covering product coverage, styling, models, location, poses, detail shots, crops, consistency, and sales use.",
    icon: "calendar", detailEmoji: "📚", displayCreditCost: 7, aliases: ["collection-lookbook-plan", "fashion-catalog-shoot-planner"],
    inputs: [
      { id: "collection_product_list", label: "Collection / Product List", type: "textarea", placeholder: "Styles, colourways, categories, hero pieces, commercial priorities, required views, product details, and pieces that must appear together or separately.", required: true },
      { id: "creative_brand_direction", label: "Creative / Brand Direction", type: "textarea", placeholder: "Story, customer, mood, references, location, set, casting, styling, art direction, colour, lighting, and visual consistency rules.", required: true },
      { id: "production_channel_needs", label: "Production / Channel Needs", type: "textarea", placeholder: "Team, budget, days, locations, sample availability, model sizes, e-commerce, wholesale, press, print, social, aspect ratios, and deadlines.", required: true },
      { id: "look_count", label: "Look Count", type: "select", required: true, options: lookCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fashion-photoshoot-planner", name: "Fashion Photoshoot Planner",
    description: "Create a complete fashion-shoot plan covering concept, casting, styling, garment preparation, shot list, call sheet, lighting, usage, approvals, and delivery.",
    icon: "calendar", detailEmoji: "📸", displayCreditCost: 7, aliases: ["apparel-photoshoot-generator", "fashion-campaign-shoot-planner"],
    inputs: [
      { id: "campaign_collection_context", label: "Campaign / Collection Context", type: "textarea", placeholder: "Brand, collection, launch, audience, message, channels, usage period, territories, products, and business objective.", required: true },
      { id: "creative_direction", label: "Creative Direction", type: "textarea", placeholder: "Story, mood, casting, styling, hair, makeup, movement, location, set, lighting, camera, framing, references, and what to avoid.", required: true },
      { id: "production_resources", label: "Production Resources", type: "textarea", placeholder: "Budget, crew, talent, samples, fittings, studio, location, equipment, permits, insurance, transport, schedule, post-production, and approval workflow.", required: true },
      { id: "shoot_type", label: "Shoot Type", type: "select", required: true, options: ["E-commerce", "Editorial", "Campaign", "Lookbook", "Social content", "Wholesale / line sheet", "Runway backstage", "Complete multi-channel shoot"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "runway-collection-presentation-planner", name: "Runway & Collection Presentation Planner",
    description: "Design a professional runway, showroom, digital presentation, or buyer preview with look order, pacing, styling, music, lighting, backstage, and contingency planning.",
    icon: "calendar", detailEmoji: "🎭", displayCreditCost: 7, aliases: ["fashion-show-planner", "collection-presentation-generator"],
    inputs: [
      { id: "collection_story_looks", label: "Collection Story / Looks", type: "textarea", placeholder: "Concept, narrative, look list, hero styles, colour progression, silhouette progression, styling, cast, and product priorities.", required: true },
      { id: "venue_audience_format", label: "Venue / Audience / Format", type: "textarea", placeholder: "Runway, showroom, presentation, film, live stream, buyers, press, clients, capacity, venue dimensions, timing, and accessibility.", required: true },
      { id: "production_constraints", label: "Production Constraints", type: "textarea", placeholder: "Budget, models, fittings, crew, backstage, music rights, lighting, staging, changing time, travel, garment care, safety, and approvals.", required: false },
      { id: "presentation_goal", label: "Primary Goal", type: "select", required: true, options: ["Press impact", "Buyer sell-in", "Brand storytelling", "Client / couture presentation", "Digital launch", "Internal line review", "Complete presentation"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "apparel-product-description-generator", name: "Apparel Product Description Generator",
    description: "Write accurate, premium apparel product copy with fit, material, construction, feature, styling, care, size, claim, and channel controls.",
    icon: "writing-pad", detailEmoji: "🏷️", displayCreditCost: 5, aliases: ["fashion-product-copy-generator", "clothing-description-generator"],
    inputs: [
      { id: "verified_product_facts", label: "Verified Product Facts", type: "textarea", placeholder: "Product name or code, category, material composition, construction, fit, length, closures, pockets, trims, colour, origin, certifications, care, and approved claims.", required: true },
      { id: "customer_channel_context", label: "Customer / Channel Context", type: "textarea", placeholder: "Target customer, price tier, website, marketplace, wholesale, store, campaign, SEO needs, regional wording, and brand voice.", required: true },
      { id: "fit_size_guidance", label: "Fit / Size Guidance", type: "textarea", placeholder: "Model size if verified, garment measurements, fit notes, stretch, intended ease, size advice, body data, and areas requiring technical confirmation.", required: false },
      { id: "version_count", label: "Versions", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),

  imageTool("outfit-concept-generator", "Outfit Concept Generator", "Create a complete fashion look from silhouette, garments, occasion, palette, material, styling, wearer needs, and optional reference images.", "👗", ["fashion-outfit-image-generator", "styled-look-generator"], 2),
  imageTool("fashion-editorial-generator", "Fashion Editorial Generator", "Create premium magazine-style fashion imagery with controlled garment hierarchy, model direction, pose, lighting, environment, and narrative.", "📸", ["fashion-campaign-image-generator", "editorial-fashion-ai"], 2),
  imageTool("fashion-lookbook-image-generator", "Fashion Lookbook Image Generator", "Create clean, consistent collection imagery designed for product visibility, sequencing, crop resilience, and premium lookbook presentation.", "📖", ["lookbook-photo-generator", "collection-look-image-ai"], 2),
  imageTool("fashion-collection-lineup-generator", "Fashion Collection Lineup Generator", "Visualize multiple coordinated looks as one coherent collection lineup with silhouette rhythm, colour progression, and garment distinction.", "🧍", ["fashion-lineup-ai", "collection-range-visualizer"], 2),
  imageTool("garment-flat-lay-generator", "Garment Flat-Lay Generator", "Create professional overhead garment arrangements with believable fabric behaviour, accurate components, clean spacing, and product-ready styling.", "👕", ["clothing-flatlay-ai", "apparel-flat-lay-generator"], 2),
  imageTool("apparel-product-mockup-generator", "Apparel Product Mockup Generator", "Create premium front, back, detail, or presentation mockups while preserving supplied garment shape, construction, print, trim, and colourway details.", "🧥", ["clothing-mockup-generator", "garment-product-visualizer"], 2),
  imageTool("textile-pattern-generator", "Textile Pattern Generator", "Create seamless-repeat or placement-print concepts with motif, repeat, scale, density, colour, production direction, and fabric-context controls.", "🧵", ["fabric-pattern-ai", "seamless-fashion-print-generator"], 2),
  imageTool("fashion-moodboard-generator", "Fashion Moodboard Generator", "Create a restrained editorial moodboard combining silhouette, material, palette, styling, craft, and cultural direction without a cluttered boxed grid.", "🪩", ["fashion-concept-board-generator", "apparel-moodboard-ai"], 2),
  imageTool("fashion-on-model-visual-generator", "Fashion On-Model Visual Generator", "Place or preserve a garment in an editorial or e-commerce on-model visual with identity, body, garment, fit-intent, pose, and background controls.", "🧍‍♀️", ["virtual-fashion-model-generator", "garment-on-model-ai"], 2),
  imageTool("garment-detail-material-closeup-generator", "Garment Detail & Material Close-Up Generator", "Create premium close-ups of fabric texture, seams, stitching, closures, embroidery, trims, hardware, wash, and finish details.", "🔍", ["fashion-detail-shot-generator", "fabric-closeup-ai"], 2),
];
