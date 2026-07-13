import type { Tool, ToolInput } from "./public-tools";

const category = "Food / Hospitality Creator Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Premium hospitality", "Executive and concise", "Chef-led professional", "Warm and guest-focused", "Commercial and practical", "Editorial and refined", "Custom from brief"];
const unitOptions = ["Metric", "US customary", "Metric + US customary", "Preserve supplied units"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed strategic (7 credits)", "Executive comprehensive (9 credits)"];
const serviceModelOptions = ["Full service", "Fine dining", "Casual dining", "Fast casual", "Quick service", "Café / bakery", "Bar / lounge", "Delivery / takeaway", "Catering / events", "Hotel / resort dining", "Multi-unit group", "Custom from brief"];
const menuItemCountOptions = ["8 items", "12 items", "18 items", "24 items", "36 items", "48 items"];
const recipeYieldOptions = ["2 portions", "4 portions", "6 portions", "10 portions", "20 portions", "50 portions", "100 portions", "Custom yield from brief"];
const versionOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const questionCountOptions = ["12 questions", "20 questions", "30 questions", "40 questions"];

const commonTail: ToolInput[] = [
  { id: "market_region", label: "Market / Region", type: "text", placeholder: "Country, city, climate, guest market, cultural context, or regulatory region. Used for context—not legal certification.", required: false },
  { id: "service_model", label: "Service Model", type: "select", required: true, options: serviceModelOptions },
  { id: "unit_system", label: "Units", type: "select", required: true, options: unitOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Constraints to Preserve", type: "textarea", placeholder: "Exact ingredients, yields, prices, dietary statements, equipment, brand rules, service standards, supplier facts, names, wording, or details that must remain unchanged.", required: false },
];

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

function imageTool(slug: string, name: string, description: string, emoji: string, aliases: string[], displayCreditCost: number): Tool {
  return { id: slug, slug, name, description, icon: "image", detailEmoji: emoji, category, displayCreditCost, aliases, inputs: [] };
}

export const FOOD_HOSPITALITY_IMAGE_TOOL_SLUGS = [
  "food-photography-generator",
  "dish-presentation-generator",
  "menu-hero-image-generator",
  "restaurant-poster-generator",
  "restaurant-social-creative-generator",
  "restaurant-interior-mood-image-generator",
  "recipe-illustration-generator",
  "food-packaging-concept-generator",
  "menu-cover-generator",
] as const;

export const foodHospitalityTools: Tool[] = [
  textTool({
    slug: "restaurant-concept-generator", name: "Restaurant Concept Generator",
    description: "Build a commercially coherent restaurant concept covering guest need, positioning, offer, service, experience, operations, and launch assumptions.",
    icon: "idea", detailEmoji: "🍽️", displayCreditCost: 7, aliases: ["restaurant-business-concept", "restaurant-idea-generator"],
    nextActions: [{ label: "Design the guest experience", href: "/tools/dining-experience-designer", description: "Translate the concept into a complete service and atmosphere journey." }],
    inputs: [
      { id: "founder_context", label: "Founder / Operator Context", type: "textarea", placeholder: "Experience, resources, strengths, limitations, location access, team, existing brand, and why this concept should exist.", required: true },
      { id: "market_opportunity", label: "Market / Opportunity", type: "textarea", placeholder: "Target area, unmet need, competitors, guest occasions, demand evidence, price expectations, and constraints.", required: true },
      { id: "culinary_direction", label: "Cuisine / Product Direction", type: "textarea", placeholder: "Cuisine, hero products, sourcing philosophy, cooking format, beverage role, dietary scope, and what must make the food distinctive.", required: true },
      { id: "commercial_constraints", label: "Commercial Constraints", type: "textarea", placeholder: "Budget, footprint, covers, dayparts, labour, equipment, rent assumptions, target opening, or multi-unit ambitions.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "cafe-concept-generator", name: "Café Concept Generator",
    description: "Create a differentiated café, bakery, coffee, tea, dessert, or all-day concept with a realistic offer, service rhythm, and operating model.",
    icon: "idea", detailEmoji: "☕", displayCreditCost: 7, aliases: ["coffee-shop-concept-generator", "bakery-cafe-concept"],
    inputs: [
      { id: "cafe_vision", label: "Café Vision / Format", type: "textarea", placeholder: "Coffee, bakery, tea, dessert, brunch, grab-and-go, community, specialty, kiosk, or hybrid concept.", required: true },
      { id: "location_audience", label: "Location / Audience", type: "textarea", placeholder: "Neighbourhood, footfall, nearby uses, customer segments, occasions, dwell time, and local price sensitivity.", required: true },
      { id: "offer_direction", label: "Food / Beverage Offer", type: "textarea", placeholder: "Core beverages, food range, production model, signature items, dietary needs, sourcing, and service speed.", required: true },
      { id: "operating_reality", label: "Operating Reality", type: "textarea", placeholder: "Space, seats, kitchen capacity, staffing, opening hours, equipment, delivery, budget, and target launch.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "food-brand-concept-generator", name: "Food Brand Concept Generator",
    description: "Develop a premium food, beverage, packaged-goods, delivery, catering, or culinary brand concept with a defendable market role.",
    icon: "product", detailEmoji: "🥫", displayCreditCost: 7, aliases: ["food-business-brand-generator", "culinary-brand-concept"],
    inputs: [
      { id: "product_business_idea", label: "Product / Business Idea", type: "textarea", placeholder: "What is being sold, format, category, use occasion, channel, preparation or manufacturing model, and current stage.", required: true },
      { id: "audience_problem", label: "Audience / Problem", type: "textarea", placeholder: "Target customer, need, frustration, desired outcome, alternatives, and buying context.", required: true },
      { id: "brand_ambition", label: "Brand Ambition", type: "textarea", placeholder: "Desired reputation, price tier, personality, values, origin, sensory identity, and expansion goals.", required: true },
      { id: "commercial_constraints", label: "Commercial / Production Constraints", type: "textarea", placeholder: "Budget, shelf life, channel, packaging, supply, equipment, delivery, regulations, and facts requiring specialist verification.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "restaurant-positioning-guest-persona-generator", name: "Restaurant Positioning & Guest Persona Generator",
    description: "Define a credible market position and evidence-led guest personas tied to occasions, value perception, booking behaviour, and service expectations.",
    icon: "seo", detailEmoji: "🎯", displayCreditCost: 7, aliases: ["restaurant-positioning-generator", "restaurant-guest-persona"],
    inputs: [
      { id: "concept_offer", label: "Concept / Offer", type: "textarea", placeholder: "Cuisine, format, location, price tier, service, dayparts, atmosphere, differentiators, and current assumptions.", required: true },
      { id: "market_competition", label: "Market / Competition", type: "textarea", placeholder: "Target area, competitor set, substitutes, category conventions, gaps, and verified market observations.", required: true },
      { id: "known_guests", label: "Known Guest Evidence", type: "textarea", placeholder: "Bookings, reviews, interviews, demographics, occasions, spend patterns, preferences, objections, or hypotheses clearly labelled as such.", required: false },
      { id: "business_goal", label: "Business Goal", type: "select", required: true, options: ["New concept validation", "Reposition an existing venue", "Increase premium perception", "Attract a new segment", "Improve repeat visits", "Support expansion", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "restaurant-brand-story-generator", name: "Restaurant Brand Story Generator",
    description: "Create a distinctive, truthful restaurant or hospitality brand story that connects origin, food, people, place, and guest promise.",
    icon: "writing-pad", detailEmoji: "📖", displayCreditCost: 5, aliases: ["restaurant-about-us-generator", "hospitality-brand-story"],
    inputs: [
      { id: "verified_origin", label: "Verified Origin / History", type: "textarea", placeholder: "Founder story, place, family, culture, chef journey, milestones, recipes, and facts that may be stated publicly.", required: true },
      { id: "concept_identity", label: "Concept / Identity", type: "textarea", placeholder: "Cuisine, values, sourcing, atmosphere, guest relationship, signature details, and what the venue stands for.", required: true },
      { id: "audiences_channels", label: "Audience / Channels", type: "textarea", placeholder: "Website, menu, press kit, investor material, social, in-venue copy, team induction, or other uses.", required: true },
      { id: "version_count", label: "Versions", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "dining-experience-designer", name: "Dining Experience Designer",
    description: "Design the complete guest journey from discovery and booking through arrival, service, recovery, departure, and return.",
    icon: "folder", detailEmoji: "✨", displayCreditCost: 7, aliases: ["restaurant-guest-journey-designer", "hospitality-experience-planner"],
    inputs: [
      { id: "venue_concept", label: "Venue Concept / Promise", type: "textarea", placeholder: "Cuisine, positioning, price point, atmosphere, guest promise, capacity, service style, and signature moments.", required: true },
      { id: "guest_segments_occasions", label: "Guests / Occasions", type: "textarea", placeholder: "Primary guest types, visit occasions, expectations, accessibility needs, anxieties, preferences, and desired emotions.", required: true },
      { id: "current_journey", label: "Current Journey / Pain Points", type: "textarea", placeholder: "Discovery, booking, arrival, wait, seating, ordering, pacing, payment, feedback, recovery, and repeat-visit issues.", required: false },
      { id: "operational_constraints", label: "Operational Constraints", type: "textarea", placeholder: "Staffing, technology, layout, table turns, kitchen capacity, booking rules, privacy, and service limitations.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "restaurant-launch-plan-generator", name: "Restaurant Launch Plan Generator",
    description: "Build a phased, dependency-aware restaurant or café launch plan covering concept lock, testing, operations, team, marketing, and opening controls.",
    icon: "calendar", detailEmoji: "🚀", displayCreditCost: 9, aliases: ["restaurant-opening-plan", "food-business-launch-roadmap"],
    inputs: [
      { id: "launch_context", label: "Concept / Current Stage", type: "textarea", placeholder: "Concept, location status, legal entity, design, menu, suppliers, team, systems, funding, and work already completed.", required: true },
      { id: "target_dates", label: "Target Dates / Milestones", type: "textarea", placeholder: "Lease, handover, permits, fit-out, recruitment, training, soft opening, launch, and immovable dates.", required: true },
      { id: "resources_owners", label: "Resources / Owners", type: "textarea", placeholder: "Founder, chef, GM, consultants, contractors, agencies, budgets, hours, and decision makers.", required: true },
      { id: "known_risks", label: "Known Risks / Constraints", type: "textarea", placeholder: "Permits, construction, equipment, supply, staffing, cash runway, technology, testing, seasonality, or landlord constraints.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "restaurant-menu-generator", name: "Restaurant Menu Generator",
    description: "Create a coherent, operationally realistic menu architecture from the concept, kitchen, guest, price, and ingredient constraints.",
    icon: "writing-pad", detailEmoji: "📋", displayCreditCost: 7, aliases: ["professional-menu-generator", "restaurant-food-menu-builder"],
    nextActions: [{ label: "Engineer menu profitability", href: "/tools/menu-engineering-profitability-planner", description: "Analyse item economics and performance once real prices and sales data are available." }],
    inputs: [
      { id: "concept_cuisine", label: "Concept / Cuisine", type: "textarea", placeholder: "Positioning, culinary identity, service style, daypart, price tier, signature techniques, and guest promise.", required: true },
      { id: "kitchen_capacity", label: "Kitchen / Production Capacity", type: "textarea", placeholder: "Equipment, stations, staffing, storage, prep windows, service volume, suppliers, and operational limits.", required: true },
      { id: "guest_price_context", label: "Guest / Price Context", type: "textarea", placeholder: "Audience, occasions, average check target, local expectations, dietary range, and value strategy.", required: true },
      { id: "ingredients_constraints", label: "Ingredients / Constraints", type: "textarea", placeholder: "Available ingredients, seasonality, must-use items, exclusions, cross-utilization goals, sourcing, allergens, and waste concerns.", required: false },
      { id: "menu_item_count", label: "Approximate Item Count", type: "select", required: true, options: menuItemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "menu-engineering-profitability-planner", name: "Menu Engineering & Profitability Planner",
    description: "Analyse popularity, contribution margin, food-cost percentage, operational burden, and strategic action using only supplied sales and cost data.",
    icon: "seo", detailEmoji: "📈", displayCreditCost: 9, aliases: ["menu-engineering-planner", "menu-profitability-analyzer"],
    inputs: [
      { id: "menu_sales_data", label: "Menu / Sales Data", type: "textarea", placeholder: "For each item: name, category, price, units sold, period, discounts, channel, and any reliable mix data.", required: true },
      { id: "recipe_cost_data", label: "Recipe / Cost Data", type: "textarea", placeholder: "Ingredient cost, yield, portion cost, prep loss, packaging, variable cost, and date/source of cost data.", required: true },
      { id: "operational_context", label: "Operational Context", type: "textarea", placeholder: "Prep time, station load, ticket time, waste, equipment, labour intensity, stock risk, and service complexity.", required: false },
      { id: "analysis_goal", label: "Analysis Goal", type: "select", required: true, options: ["Improve gross profit", "Reduce menu complexity", "Prepare price changes", "Improve item mix", "Support a menu redesign", "Compare channels / dayparts", "Full menu review"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "menu-description-dish-naming-generator", name: "Menu Description & Dish Naming Generator",
    description: "Create specific, credible dish names and menu descriptions that communicate ingredients, technique, value, and dietary facts without empty hype.",
    icon: "writing-pad", detailEmoji: "✍️", displayCreditCost: 5, aliases: ["dish-name-generator", "restaurant-menu-description-generator"],
    inputs: [
      { id: "dish_facts", label: "Dish Facts", type: "textarea", placeholder: "Dish name or working title, ingredients, preparation, garnish, origin, serving format, portion, and verified dietary or allergen facts.", required: true },
      { id: "menu_context", label: "Menu / Brand Context", type: "textarea", placeholder: "Restaurant concept, menu section, neighbouring items, price tier, guest, language style, and space limits.", required: true },
      { id: "description_length", label: "Description Length", type: "select", required: true, options: ["Very short (3–7 words)", "Concise menu line (8–15 words)", "Standard premium (16–28 words)", "Story-led (29–50 words)", "Mixed set"] },
      { id: "version_count", label: "Versions", type: "select", required: true, options: versionOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "prix-fixe-tasting-menu-generator", name: "Prix Fixe & Tasting Menu Generator",
    description: "Design a paced, balanced prix fixe, degustation, event, chef's-table, or set menu with progression and operational logic.",
    icon: "writing-pad", detailEmoji: "🥂", displayCreditCost: 7, aliases: ["tasting-menu-generator", "set-menu-generator"],
    inputs: [
      { id: "occasion_concept", label: "Occasion / Concept", type: "textarea", placeholder: "Venue, theme, season, event, culinary direction, service style, guest expectation, and experience goal.", required: true },
      { id: "course_parameters", label: "Course Parameters", type: "textarea", placeholder: "Course count, optional choices, snacks, bread, palate cleanser, dessert, petit fours, pairings, and service duration.", required: true },
      { id: "ingredients_constraints", label: "Ingredients / Constraints", type: "textarea", placeholder: "Available products, season, exclusions, dietary routes, allergens, equipment, stations, and cross-utilization needs.", required: true },
      { id: "price_service_context", label: "Price / Service Context", type: "textarea", placeholder: "Target selling price, cost target if known, cover count, staffing, table turns, prep capacity, and plating limits.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "seasonal-menu-planner", name: "Seasonal Menu Planner",
    description: "Plan a seasonal menu change around real availability, guest demand, operational capacity, cross-utilization, testing, and rollout.",
    icon: "calendar", detailEmoji: "🌱", displayCreditCost: 7, aliases: ["seasonal-restaurant-menu-generator", "menu-change-planner"],
    inputs: [
      { id: "current_menu", label: "Current Menu / Performance", type: "textarea", placeholder: "Existing items, sales, costs, guest feedback, operational issues, hero items, and items that must remain.", required: true },
      { id: "season_supply_context", label: "Season / Supply Context", type: "textarea", placeholder: "Region, months, verified supplier availability, weather, events, ingredient opportunities, and price volatility.", required: true },
      { id: "change_goal", label: "Change Goal", type: "textarea", placeholder: "Refresh, margin, speed, waste reduction, premium perception, dietary breadth, daypart, event, or brand evolution.", required: true },
      { id: "rollout_constraints", label: "Rollout Constraints", type: "textarea", placeholder: "Testing time, training, print deadlines, stock depletion, equipment, supplier minimums, approvals, and launch date.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "beverage-menu-generator", name: "Beverage Menu Generator",
    description: "Create a commercially and operationally coherent non-prescriptive beverage menu for coffee, tea, zero-proof, cocktails, wine, beer, or mixed programs.",
    icon: "writing-pad", detailEmoji: "🍹", displayCreditCost: 7, aliases: ["drink-menu-generator", "restaurant-beverage-program"],
    inputs: [
      { id: "beverage_program", label: "Program Type / Direction", type: "textarea", placeholder: "Coffee, tea, juice, zero-proof, cocktails, wine, beer, pairings, mixed program, signature direction, and service goals.", required: true },
      { id: "venue_guest_context", label: "Venue / Guest Context", type: "textarea", placeholder: "Concept, cuisine, price tier, guest, dayparts, occasions, service speed, average check, and market expectations.", required: true },
      { id: "inventory_equipment", label: "Inventory / Equipment / Skills", type: "textarea", placeholder: "Available products, suppliers, bar or café equipment, glassware, staff skills, prep space, storage, and exclusions.", required: true },
      { id: "menu_item_count", label: "Approximate Item Count", type: "select", required: true, options: menuItemCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "dietary-allergen-communication-generator", name: "Dietary & Allergen Communication Generator",
    description: "Create cautious, transparent guest and staff communication from verified ingredient and process information without claiming certified safety.",
    icon: "writing-pad", detailEmoji: "⚠️", displayCreditCost: 7, aliases: ["restaurant-allergen-matrix", "dietary-menu-communication"],
    inputs: [
      { id: "menu_recipe_data", label: "Verified Menu / Recipe Data", type: "textarea", placeholder: "Ingredients, sub-recipes, brands, processing aids, garnishes, sauces, substitutions, and supplier statements for each item.", required: true },
      { id: "kitchen_process", label: "Kitchen / Service Process", type: "textarea", placeholder: "Shared fryers, grills, utensils, prep areas, storage, cleaning, order communication, substitutions, and known cross-contact risks.", required: true },
      { id: "communication_channels", label: "Communication Channels", type: "textarea", placeholder: "Menu, website, QR, allergen matrix, server guide, booking notes, order-taking script, kitchen ticket, or guest response.", required: true },
      { id: "regulatory_context", label: "Known Regulatory / Policy Context", type: "textarea", placeholder: "Verified local requirements, company policy, legal advice, allergen list, or standards requiring final review.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "professional-recipe-generator", name: "Professional Recipe Generator",
    description: "Create a testable chef-ready recipe with structured ingredients, preparation states, method, yield, quality standards, and verification controls.",
    icon: "writing-pad", detailEmoji: "👨‍🍳", displayCreditCost: 7, aliases: ["chef-recipe-generator", "commercial-kitchen-recipe"],
    inputs: [
      { id: "dish_brief", label: "Dish Brief", type: "textarea", placeholder: "Dish, cuisine, flavour profile, texture, format, occasion, price tier, presentation, and creative constraints.", required: true },
      { id: "ingredients_available", label: "Ingredients / Required Components", type: "textarea", placeholder: "Ingredients, sub-recipes, must-use products, exclusions, substitutions, seasonality, and verified dietary facts.", required: true },
      { id: "equipment_skill", label: "Equipment / Skill / Service", type: "textarea", placeholder: "Kitchen equipment, staff level, batch production, prep window, service method, holding, transport, and plating limits.", required: true },
      { id: "target_yield", label: "Target Yield", type: "select", required: true, options: recipeYieldOptions },
      { id: "recipe_goal", label: "Recipe Goal", type: "select", required: true, options: ["Development starting point", "Restaurant service recipe", "Batch prep recipe", "Catering recipe", "Bakery / pastry formula", "Home recipe with professional detail", "Custom from brief"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "recipe-standardization-scaling-yield-planner", name: "Recipe Standardization, Scaling & Yield Planner",
    description: "Convert an existing recipe into a controlled master recipe with batch scaling, unit conversion, yield, prep loss, portion, and test requirements.",
    icon: "folder", detailEmoji: "⚖️", displayCreditCost: 9, aliases: ["recipe-scaling-generator", "standard-recipe-card-planner"],
    inputs: [
      { id: "source_recipe", label: "Source Recipe", type: "textarea", placeholder: "Paste the complete recipe, including quantities, units, method, yield, portion, sub-recipes, and any existing notes.", required: true },
      { id: "source_target_yield", label: "Source / Target Yield", type: "textarea", placeholder: "Original batch yield, finished weight or volume, portion size, target covers or batch, and expected prep loss.", required: true },
      { id: "production_context", label: "Production Context", type: "textarea", placeholder: "Equipment capacity, pan sizes, mixer limits, cooking method, holding, service, transport, staff, and station.", required: true },
      { id: "scaling_mode", label: "Scaling Mode", type: "select", required: true, options: ["Scale by portions", "Scale by finished weight", "Scale by finished volume", "Scale by pan / vessel", "Scale by ingredient percentage", "Create multiple production batches"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "recipe-card-kitchen-training-generator", name: "Recipe Card & Kitchen Training Generator",
    description: "Turn a verified recipe into a clear production card and step-by-step training guide for consistent execution across shifts or locations.",
    icon: "writing-pad", detailEmoji: "🧑‍🍳", displayCreditCost: 7, aliases: ["kitchen-recipe-card-generator", "recipe-training-guide"],
    inputs: [
      { id: "verified_recipe", label: "Verified Recipe", type: "textarea", placeholder: "Approved ingredients, quantities, yield, method, equipment, critical quality details, holding, service, and plating.", required: true },
      { id: "team_context", label: "Team / Training Context", type: "textarea", placeholder: "Skill level, language, station, location count, onboarding needs, known errors, and available photos or videos.", required: true },
      { id: "quality_standards", label: "Quality / Failure Standards", type: "textarea", placeholder: "Appearance, taste, texture, aroma, temperature, portion, timing, common mistakes, reject criteria, and correction rules.", required: true },
      { id: "training_format", label: "Training Format", type: "select", required: true, options: ["One-page station card", "Detailed training module", "Visual step list", "New-hire checklist", "Multi-location rollout pack", "Complete premium set"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "food-preparation-workflow-prep-list-generator", name: "Food Preparation Workflow & Prep List Generator",
    description: "Create a station-ready prep system from menus, forecasts, recipes, yields, dependencies, equipment, and service deadlines.",
    icon: "calendar", detailEmoji: "🧾", displayCreditCost: 7, aliases: ["kitchen-prep-list-generator", "restaurant-production-plan"],
    inputs: [
      { id: "service_forecast", label: "Service Forecast / Menu", type: "textarea", placeholder: "Expected covers or orders, dayparts, menu mix, reservations, events, channel split, and service times.", required: true },
      { id: "recipes_yields", label: "Recipes / Yields / Pars", type: "textarea", placeholder: "Recipe names, batch yields, portions, current stock, pars, shelf-life facts, carryover, and waste allowances.", required: true },
      { id: "team_equipment", label: "Team / Stations / Equipment", type: "textarea", placeholder: "Staff, shifts, stations, skill, equipment capacity, storage, cooling, transport, and bottlenecks.", required: true },
      { id: "workflow_goal", label: "Workflow Goal", type: "select", required: true, options: ["Daily prep list", "Multi-day production plan", "Event / catering production", "Opening shift plan", "Menu-change rollout", "Complete kitchen workflow"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "food-costing-cross-utilization-planner", name: "Food Costing & Ingredient Cross-Utilization Planner",
    description: "Build a transparent costing worksheet and identify responsible ingredient reuse opportunities without inventing supplier prices or demand.",
    icon: "seo", detailEmoji: "💰", displayCreditCost: 9, aliases: ["recipe-costing-calculator-plan", "ingredient-cross-utilization-planner"],
    inputs: [
      { id: "recipes_ingredients", label: "Recipes / Ingredient Use", type: "textarea", placeholder: "Menu items, recipes, sub-recipes, quantities, yields, portion sizes, trim, prep loss, pack sizes, and current uses.", required: true },
      { id: "supplier_costs", label: "Verified Supplier Costs", type: "textarea", placeholder: "Supplier, item, pack, net weight, price, tax, freight, currency, date, and known yield. Leave unknowns blank rather than estimating.", required: false },
      { id: "sales_waste_context", label: "Sales / Waste / Stock Context", type: "textarea", placeholder: "Sales mix, forecast, spoilage, overproduction, stock turns, minimum orders, seasonality, and items at risk.", required: false },
      { id: "commercial_goal", label: "Commercial Goal", type: "select", required: true, options: ["Calculate recipe and portion cost", "Reduce waste", "Improve cross-utilization", "Prepare menu pricing", "Compare supplier / ingredient options", "Complete costing review"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "hospitality-sop-service-recovery-generator", name: "Hospitality SOP & Service Recovery Generator",
    description: "Create human, role-clear hospitality SOPs plus proportionate guest-recovery scripts, escalation rules, logging, and follow-up.",
    icon: "folder", detailEmoji: "🤝", displayCreditCost: 7, aliases: ["restaurant-service-sop-generator", "guest-complaint-response-generator"],
    inputs: [
      { id: "operation_scenario", label: "Operation / Scenario", type: "textarea", placeholder: "Venue, service model, process or incident, guest context, current practice, pain points, and why the SOP is needed.", required: true },
      { id: "roles_systems", label: "Roles / Systems / Authority", type: "textarea", placeholder: "Host, server, manager, kitchen, bar, delivery, hotel, CRM, POS, booking, escalation, compensation authority, and documentation.", required: true },
      { id: "brand_standards", label: "Brand / Service Standards", type: "textarea", placeholder: "Tone, guest promise, response time, privacy, accessibility, fairness, exclusions, and non-negotiable behaviours.", required: true },
      { id: "sop_type", label: "SOP Type", type: "select", required: true, options: ["Standard service procedure", "Pre-shift / opening", "Reservation / arrival", "Complaint and recovery", "Dietary / allergen communication", "Delivery / takeaway issue", "VIP / special occasion", "Complete service playbook"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "restaurant-marketing-photoshoot-planner", name: "Restaurant Marketing, Promotion & Food Photoshoot Planner",
    description: "Build a commercially focused campaign and photoshoot plan connecting guest segments, offers, channels, content, food styling, shot lists, and measurement.",
    icon: "calendar", detailEmoji: "📣", displayCreditCost: 7, aliases: ["restaurant-promotion-generator", "food-photoshoot-planner", "restaurant-social-content-planner"],
    inputs: [
      { id: "venue_campaign_context", label: "Venue / Campaign Context", type: "textarea", placeholder: "Concept, location, audience, occasion, business challenge, offer, event, season, dates, channels, and current performance.", required: true },
      { id: "menu_brand_assets", label: "Menu / Brand / Assets", type: "textarea", placeholder: "Hero dishes, drinks, interiors, people, packaging, brand rules, existing photography, permissions, and must-feature details.", required: true },
      { id: "production_resources", label: "Production Resources", type: "textarea", placeholder: "Budget, team, photographer, stylist, location, equipment, time, models, approvals, editing, media sizes, and deadlines.", required: false },
      { id: "campaign_goal", label: "Primary Goal", type: "select", required: true, options: ["Launch / opening", "Drive reservations", "Promote a menu change", "Increase repeat visits", "Event / experience sales", "Delivery / takeaway", "Brand awareness", "Complete campaign"] },
      ...commonTail,
    ],
  }),

  imageTool("food-photography-generator", "Food Photography Generator", "Create premium editorial or commercial food photography from a detailed dish brief, with optional reference-image fidelity and realistic ingredient texture.", "📸", ["ai-food-photo-generator", "dish-photography-ai"], 2),
  imageTool("dish-presentation-generator", "Dish Presentation Generator", "Develop a refined plating concept with believable portion, component logic, sauce, garnish, vessel, negative space, and service practicality.", "🍽️", ["food-plating-generator", "dish-plating-ai"], 2),
  imageTool("menu-hero-image-generator", "Menu Hero Image Generator", "Create a textless, premium hero visual for a menu, website, delivery listing, campaign, or launch with controlled negative space.", "🌟", ["restaurant-hero-image", "menu-banner-image-generator"], 2),
  imageTool("restaurant-poster-generator", "Restaurant Poster Generator", "Generate a polished text-safe restaurant campaign key visual for launches, events, seasonal menus, dining experiences, or signature dishes.", "🖼️", ["food-poster-generator", "restaurant-promo-poster-ai"], 2),
  imageTool("restaurant-social-creative-generator", "Restaurant Social Creative Generator", "Create a premium, platform-ready textless restaurant social visual with clear food hierarchy and copy-safe composition.", "📱", ["food-social-media-image", "restaurant-instagram-creative"], 2),
  imageTool("restaurant-interior-mood-image-generator", "Restaurant Interior Mood Image Generator", "Create a hospitality mood image connecting cuisine, guest experience, lighting, materials, table setting, and brand atmosphere.", "🕯️", ["restaurant-ambience-generator", "hospitality-mood-image"], 2),
  imageTool("recipe-illustration-generator", "Recipe Illustration Generator", "Create an accurate, appetizing editorial recipe illustration or step-support visual without labels, fake text, or invented ingredients.", "🎨", ["food-recipe-illustration", "cookbook-image-generator"], 2),
  imageTool("food-packaging-concept-generator", "Food Packaging Concept Generator", "Create a premium packaging concept for food or beverage products with believable structure, material, product cues, and label-safe space.", "📦", ["food-package-design-ai", "beverage-packaging-concept"], 2),
  imageTool("menu-cover-generator", "Menu Cover Generator", "Create a refined, textless menu-cover visual that expresses the venue's identity, cuisine, price tier, and atmosphere with elegant copy-safe space.", "📕", ["restaurant-menu-cover-ai", "menu-cover-image-generator"], 2),
];
