import type { Tool, ToolInput } from "./public-tools";

const category = "Interior / Architecture Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Professional and client-ready", "Executive and concise", "Detailed design-studio", "Warm and collaborative", "Technical but accessible", "Custom from brief"];
const measurementOptions = ["Metric", "Imperial", "Mixed / preserve supplied units"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed strategic (7 credits)", "Executive comprehensive (9 credits)"];
const questionCountOptions = ["12 questions", "20 questions", "30 questions", "40 questions"];
const optionCountOptions = ["2 layout options", "3 layout options", "4 layout options"];
const budgetTierOptions = ["Budget-conscious", "Mid-range", "Premium", "Luxury", "Mixed / prioritize key zones", "Use exact stated budget"];

const commonTail: ToolInput[] = [
  { id: "project_region", label: "Project Region / Climate", type: "text", placeholder: "City, country, climate, building type, or local context. Used only for context—not code certification.", required: false },
  { id: "measurement_system", label: "Measurement System", type: "select", required: true, options: measurementOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Constraints to Preserve", type: "textarea", placeholder: "Exact measurements, fixed architecture, existing items, accessibility needs, landlord rules, approvals, budget caps, or anything the output must not change.", required: false },
];

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

function imageTool(slug: string, name: string, description: string, emoji: string, aliases: string[], displayCreditCost: number): Tool {
  return { id: slug, slug, name, description, icon: "image", detailEmoji: emoji, category, displayCreditCost, aliases, inputs: [] };
}

export const INTERIOR_ARCHITECTURE_IMAGE_TOOL_SLUGS = [
  "ai-room-redesign-generator",
  "empty-room-furnisher",
  "kitchen-bathroom-design-generator",
  "workspace-office-interior-generator",
  "exterior-facade-redesign-generator",
  "interior-rendering-generator",
  "commercial-interior-generator",
  "landscape-visualization-generator",
  "interior-moodboard-generator",
  "material-board-generator",
] as const;

export const interiorArchitectureTools: Tool[] = [
  textTool({
    slug: "interior-design-brief-generator", name: "Interior Design Brief Generator",
    description: "Turn client goals, users, measurements, budget, lifestyle, constraints, and existing conditions into a professional design brief.",
    icon: "folder", detailEmoji: "🧾", displayCreditCost: 7, aliases: ["interior-brief-generator", "room-design-brief"],
    nextActions: [{ label: "Create the space program", href: "/tools/space-program-generator", description: "Translate the brief into room, area, adjacency, and functional requirements." }],
    inputs: [
      { id: "project_context", label: "Project Context", type: "textarea", placeholder: "Property type, project stage, rooms, existing condition, ownership or tenancy, and why the project is happening.", required: true },
      { id: "spaces_users", label: "Spaces / Users", type: "textarea", placeholder: "Who uses the space, household or team, routines, ages, mobility, pets, guests, work, storage, and special needs.", required: true },
      { id: "goals_priorities", label: "Goals / Priorities", type: "textarea", placeholder: "Functional outcomes, desired feeling, style direction, maintenance expectations, and priority order.", required: true },
      { id: "site_measurements", label: "Known Site Facts / Measurements", type: "textarea", placeholder: "Room sizes, ceiling heights, openings, fixed services, sunlight, photos, plan notes, and anything still unmeasured.", required: false },
      { id: "budget_timeline", label: "Budget / Timeline", type: "textarea", placeholder: "Stated budget, target dates, phases, procurement constraints, approvals, or move-in deadline.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interior-client-questionnaire-generator", name: "Client Interior Design Questionnaire Generator",
    description: "Create a staged discovery questionnaire covering routines, functionality, style, storage, accessibility, maintenance, budget, and approvals.",
    icon: "writing-pad", detailEmoji: "🗂️", displayCreditCost: 5, aliases: ["interior-client-intake", "interior-design-questionnaire"],
    inputs: [
      { id: "project_type", label: "Project / Client Type", type: "textarea", placeholder: "Residential, office, retail, renovation, rental, new build, whole home, or single room; include client profile.", required: true },
      { id: "known_context", label: "Known Context", type: "textarea", placeholder: "What is already known so questions do not repeat or waste the client's time.", required: false },
      { id: "questionnaire_stage", label: "Questionnaire Stage", type: "select", required: true, options: ["Pre-qualification", "Initial discovery", "Post-measurement briefing", "Concept approval", "Procurement and implementation", "Complete staged questionnaire"] },
      { id: "question_count", label: "Question Count", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "space-program-generator", name: "Space Program Generator",
    description: "Define rooms and zones with users, activities, area targets, adjacency, furniture, storage, environmental, and technical needs.",
    icon: "folder", detailEmoji: "📐", displayCreditCost: 7, aliases: ["architectural-space-program", "room-program-generator"],
    nextActions: [{ label: "Review the floor-plan requirements", href: "/tools/floor-plan-requirements-review-generator", description: "Turn the program into a schematic planning and review brief." }],
    inputs: [
      { id: "project_scope", label: "Project Scope", type: "textarea", placeholder: "Building or interior type, gross area if known, project phase, occupancy, and intended outcome.", required: true },
      { id: "required_spaces", label: "Required Spaces / Zones", type: "textarea", placeholder: "List known rooms, departments, zones, support spaces, outdoor connections, and shared areas.", required: true },
      { id: "users_activities", label: "Users / Activities", type: "textarea", placeholder: "Occupancy, routines, peak use, equipment, privacy, collaboration, service, and accessibility needs.", required: true },
      { id: "area_constraints", label: "Area / Site Constraints", type: "textarea", placeholder: "Known dimensions, total area, shape, columns, openings, services, daylight, circulation, or expansion limits.", required: false },
      { id: "adjacency_priorities", label: "Adjacency / Separation Priorities", type: "textarea", placeholder: "Spaces that must connect, stay apart, share services, receive daylight, or support a sequence.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "room-by-room-design-plan-generator", name: "Room-by-Room Design Plan Generator",
    description: "Create a coordinated whole-project plan for each room while preserving one consistent design language and priority system.",
    icon: "folder", detailEmoji: "🏠", displayCreditCost: 7, aliases: ["whole-home-design-plan", "multi-room-interior-plan"],
    inputs: [
      { id: "home_context", label: "Property / Household Context", type: "textarea", placeholder: "Property type, users, routines, architectural character, existing condition, and project goals.", required: true },
      { id: "room_list", label: "Rooms / Zones", type: "textarea", placeholder: "List every room or zone and its main function, problems, dimensions, and priority.", required: true },
      { id: "whole_home_direction", label: "Whole-Project Direction", type: "textarea", placeholder: "Desired style, palette, materials, continuity rules, must-preserve items, and overall feeling.", required: true },
      { id: "budget_timeline", label: "Budget / Phasing", type: "textarea", placeholder: "Total or room budgets, immediate versus later phases, procurement timing, and deadlines.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "design-revision-brief-generator", name: "Design Revision Brief Generator",
    description: "Convert client feedback into a controlled revision brief with accepted changes, unresolved decisions, impacts, and next-review criteria.",
    icon: "writing-pad", detailEmoji: "📝", displayCreditCost: 5, aliases: ["interior-revision-brief", "design-feedback-action-plan"],
    inputs: [
      { id: "approved_concept", label: "Current / Approved Concept", type: "textarea", placeholder: "Summarize the design, drawings, materials, layouts, assumptions, and decisions already approved.", required: true },
      { id: "client_feedback", label: "Client / Stakeholder Feedback", type: "textarea", placeholder: "Paste notes, comments, meeting outcomes, marked-up changes, objections, and requests.", required: true },
      { id: "non_negotiables", label: "Non-Negotiables / Dependencies", type: "textarea", placeholder: "Budget cap, measurements, fixed architecture, supplier commitments, deadlines, approvals, or technical limits.", required: false },
      { id: "revision_round", label: "Revision Stage", type: "select", required: true, options: ["Early concept", "Developed concept", "Pre-procurement", "Pre-construction", "Site-stage change", "Final snag / styling"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "furniture-layout-planner", name: "Furniture Layout Planner",
    description: "Develop multiple dimension-aware furniture layouts with circulation, focal points, clearances, storage, and explicit trade-offs.",
    icon: "folder", detailEmoji: "🛋️", displayCreditCost: 7, aliases: ["room-layout-planner", "furniture-arrangement-generator"],
    inputs: [
      { id: "room_geometry", label: "Room Geometry / Openings", type: "textarea", placeholder: "Length, width, ceiling height, doors, windows, radiators, columns, built-ins, outlets, focal points, and circulation entries.", required: true },
      { id: "furniture_inventory", label: "Furniture / Equipment", type: "textarea", placeholder: "Existing and desired items with dimensions where known, quantities, items to replace, and must-keep pieces.", required: true },
      { id: "activities", label: "Activities / Users", type: "textarea", placeholder: "Daily use, seating count, TV, conversation, work, dining, play, mobility, entertaining, or flexible use.", required: true },
      { id: "layout_constraints", label: "Layout Constraints", type: "textarea", placeholder: "Clearances, view priorities, accessibility, cable routing, no-block zones, landlord limits, or preferred orientation.", required: false },
      { id: "option_count", label: "Layout Options", type: "select", required: true, options: optionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "space-planning-circulation-analyzer", name: "Space Planning & Circulation Analyzer",
    description: "Audit a layout for movement, zoning, reach, accessibility, furniture conflicts, bottlenecks, privacy, and wasted space.",
    icon: "seo", detailEmoji: "🚶", displayCreditCost: 7, aliases: ["circulation-analysis", "interior-layout-auditor"],
    inputs: [
      { id: "space_description", label: "Space / Plan Description", type: "textarea", placeholder: "Describe or paste the floor-plan layout, dimensions, openings, fixed elements, and adjacent rooms.", required: true },
      { id: "current_layout", label: "Current Furniture / Zoning", type: "textarea", placeholder: "Furniture, equipment, activity zones, storage, circulation routes, and current pain points.", required: true },
      { id: "users_mobility", label: "Users / Mobility Requirements", type: "textarea", placeholder: "Occupancy, children, older adults, wheelchair or mobility needs, carrying paths, peak traffic, and visitors.", required: false },
      { id: "problem_areas", label: "Known Problem Areas", type: "textarea", placeholder: "Blocked doors, awkward corners, glare, noise, privacy, crowding, wasted area, or unsafe-feeling routes.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "floor-plan-requirements-review-generator", name: "Floor Plan Requirements & Review Generator",
    description: "Create a schematic floor-plan requirement pack or review a proposed plan for function, adjacency, privacy, daylight, storage, and circulation.",
    icon: "folder", detailEmoji: "📏", displayCreditCost: 7, aliases: ["floor-plan-review", "schematic-plan-brief"],
    inputs: [
      { id: "plan_description", label: "Existing Plan / Proposed Layout", type: "textarea", placeholder: "Describe the plan or paste room names, dimensions, adjacencies, openings, circulation, and fixed services.", required: true },
      { id: "requirements", label: "Project Requirements", type: "textarea", placeholder: "Users, room list, activities, capacity, privacy, accessibility, storage, daylight, views, and future flexibility.", required: true },
      { id: "site_facts", label: "Known Site Facts", type: "textarea", placeholder: "Orientation, structural grid if verified, fixed shafts, entrances, setbacks, views, noise, existing services, or unknowns.", required: false },
      { id: "review_focus", label: "Review Focus", type: "select", required: true, options: ["Residential functionality", "Workplace planning", "Retail / commercial flow", "Accessibility and circulation", "Adjacency and zoning", "Complete schematic review"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "storage-organization-plan-generator", name: "Storage & Organization Plan Generator",
    description: "Create a practical storage system by item category, frequency, volume, reach, visibility, maintenance, and future growth.",
    icon: "folder", detailEmoji: "🗄️", displayCreditCost: 5, aliases: ["storage-planner", "organization-system-generator"],
    inputs: [
      { id: "space_inventory", label: "Spaces / Existing Storage", type: "textarea", placeholder: "Rooms, wardrobes, cabinets, shelves, utility spaces, dimensions, and what currently works or fails.", required: true },
      { id: "items_to_store", label: "Item Inventory", type: "textarea", placeholder: "Categories, approximate volume, awkward items, seasonal items, valuables, supplies, equipment, and overflow.", required: true },
      { id: "use_frequency", label: "Use / Access Patterns", type: "textarea", placeholder: "Daily, weekly, seasonal, child-access, mobility requirements, visibility preferences, and who puts items away.", required: true },
      { id: "storage_constraints", label: "Constraints / Budget", type: "textarea", placeholder: "Rental limits, moisture, dust, pests, safety, custom joinery budget, existing systems, or no-drill requirements.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "small-space-optimization-generator", name: "Small-Space Optimization Generator",
    description: "Create a realistic multifunctional plan using zoning, vertical storage, convertible furniture, visual openness, and clutter control.",
    icon: "idea", detailEmoji: "↔️", displayCreditCost: 7, aliases: ["tiny-room-optimizer", "compact-space-planner"],
    inputs: [
      { id: "space_dimensions", label: "Space Geometry", type: "textarea", placeholder: "Dimensions, ceiling height, openings, fixed services, awkward corners, and adjacent spaces.", required: true },
      { id: "required_functions", label: "Required Functions", type: "textarea", placeholder: "Sleeping, work, dining, storage, entertaining, exercise, children, guests, hobbies, or other uses.", required: true },
      { id: "existing_items", label: "Existing / Must-Keep Items", type: "textarea", placeholder: "Furniture and appliances with dimensions, sentimental pieces, landlord fixtures, and items that can leave.", required: false },
      { id: "pain_points", label: "Pain Points / Priorities", type: "textarea", placeholder: "Clutter, lack of privacy, poor light, no storage, difficult circulation, visual crowding, or changing daily needs.", required: true },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interior-style-direction-generator", name: "Interior Style Direction Generator",
    description: "Define a distinctive design language with forms, palette, materials, furniture, lighting, styling, references, and explicit avoid rules.",
    icon: "idea", detailEmoji: "🎨", displayCreditCost: 5, aliases: ["interior-style-guide", "design-direction-generator"],
    inputs: [
      { id: "project_brief", label: "Project / User Brief", type: "textarea", placeholder: "Space type, users, architecture, lifestyle, location, budget tier, maintenance, and desired outcome.", required: true },
      { id: "preferences_references", label: "Preferences / References", type: "textarea", placeholder: "Styles, images, designers, eras, brands, materials, colours, objects, or places the client likes.", required: true },
      { id: "desired_feeling", label: "Desired Feeling / Identity", type: "textarea", placeholder: "How the space should feel, perform, age, photograph, welcome people, and express the client.", required: true },
      { id: "avoid_list", label: "Avoid / Dislike List", type: "textarea", placeholder: "Trends, colours, materials, patterns, furniture types, visual clichés, maintenance issues, or cultural concerns to avoid.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "color-palette-coordination-generator", name: "Colour Palette & Coordination Generator",
    description: "Build a coordinated palette with undertones, proportions, room distribution, material pairings, contrast, and lighting considerations.",
    icon: "idea", detailEmoji: "🌈", displayCreditCost: 5, aliases: ["interior-color-palette", "paint-color-coordinator"],
    inputs: [
      { id: "space_light_context", label: "Space / Light Context", type: "textarea", placeholder: "Rooms, orientation, daylight, artificial light, ceiling height, room size, and desired atmosphere.", required: true },
      { id: "existing_fixed_colors", label: "Existing Fixed Colours", type: "textarea", placeholder: "Flooring, stone, timber, cabinetry, upholstery, art, exterior views, and anything that must stay.", required: true },
      { id: "palette_goal", label: "Palette Goal", type: "textarea", placeholder: "Style, mood, contrast level, warmth, boldness, preferred colours, disliked colours, and continuity needs.", required: true },
      { id: "material_context", label: "Material / Maintenance Context", type: "textarea", placeholder: "Children, pets, staining, cleaning, humidity, hospitality use, rental restrictions, or finish preferences.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "material-finish-schedule-generator", name: "Material & Finish Schedule Generator",
    description: "Create a room-by-room finish schedule covering surfaces, performance, transitions, maintenance, samples, and verification status.",
    icon: "folder", detailEmoji: "🪵", displayCreditCost: 7, aliases: ["finish-schedule-generator", "interior-material-specification"],
    inputs: [
      { id: "project_rooms", label: "Rooms / Areas", type: "textarea", placeholder: "List rooms and surfaces: floors, walls, ceilings, joinery, counters, wet areas, hardware, textiles, and special features.", required: true },
      { id: "design_direction", label: "Design Direction / Palette", type: "textarea", placeholder: "Style, colours, materials, texture, sheen, continuity rules, and key visual references.", required: true },
      { id: "performance_needs", label: "Performance Requirements", type: "textarea", placeholder: "Traffic, moisture, slip concern, cleaning, acoustics, fire or hygiene requirements to verify, UV, pets, children, and durability.", required: true },
      { id: "budget_tier", label: "Budget Tier", type: "select", required: true, options: budgetTierOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "lighting-plan-generator", name: "Lighting Plan Generator",
    description: "Plan ambient, task, accent, decorative, daylight, control, and scene layers while flagging electrical and code items for professional review.",
    icon: "idea", detailEmoji: "💡", displayCreditCost: 7, aliases: ["interior-lighting-plan", "lighting-layer-generator"],
    inputs: [
      { id: "space_activities", label: "Spaces / Activities", type: "textarea", placeholder: "Rooms, tasks, occupancy, time of use, mood, display areas, work surfaces, circulation, and special events.", required: true },
      { id: "room_geometry", label: "Geometry / Finishes", type: "textarea", placeholder: "Dimensions, ceiling height, reflective or dark finishes, furniture layout, architectural features, and mounting constraints.", required: true },
      { id: "daylight_context", label: "Daylight / Orientation", type: "textarea", placeholder: "Window direction, shading, glare, views, daylight quality, and changes from day to night.", required: false },
      { id: "mood_control", label: "Mood / Control Goals", type: "textarea", placeholder: "Warmth, brightness, dimming, scenes, smart controls, art emphasis, hospitality feel, or energy priorities.", required: true },
      { id: "electrical_constraints", label: "Known Electrical Constraints", type: "textarea", placeholder: "Existing points, circuit limits if verified, landlord restrictions, ceiling type, or items requiring electrician confirmation.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "furniture-decor-specification-generator", name: "Furniture & Décor Specification Generator",
    description: "Create an execution-ready specification with target dimensions, material, colour, quantity, placement, priority, and acceptable alternatives.",
    icon: "folder", detailEmoji: "🪑", displayCreditCost: 7, aliases: ["furniture-spec-sheet", "decor-specification-generator"],
    inputs: [
      { id: "rooms_needs", label: "Rooms / Functional Needs", type: "textarea", placeholder: "Room list, users, activities, capacities, storage, circulation, ergonomics, and item quantities.", required: true },
      { id: "style_palette", label: "Style / Palette / Materials", type: "textarea", placeholder: "Approved design direction, colours, materials, textures, shapes, and finish consistency rules.", required: true },
      { id: "budget_tier", label: "Budget Tier", type: "select", required: true, options: budgetTierOptions },
      { id: "existing_items", label: "Existing / Approved Items", type: "textarea", placeholder: "Items to retain, dimensions, condition, finishes, supplier details if verified, and pieces that new selections must coordinate with.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interior-budget-procurement-planner", name: "Interior Budget & Procurement Planner",
    description: "Allocate a stated budget across work, furniture, lighting, finishes, labour, delivery, contingency, sourcing, and priority purchases.",
    icon: "folder", detailEmoji: "💰", displayCreditCost: 7, aliases: ["interior-budget-planner", "interior-procurement-plan"],
    inputs: [
      { id: "project_scope", label: "Project Scope / Deliverables", type: "textarea", placeholder: "Rooms, renovation work, furniture, lighting, finishes, styling, services, and what is already owned or contracted.", required: true },
      { id: "stated_budget", label: "Stated Budget", type: "text", placeholder: "Enter the real budget and currency. The tool will not invent market prices.", required: true },
      { id: "priority_level", label: "Priorities / Compromises", type: "textarea", placeholder: "Where quality matters most, what can be phased, acceptable substitutions, sustainability goals, and must-have items.", required: true },
      { id: "procurement_context", label: "Procurement Context", type: "textarea", placeholder: "Location, lead times, local versus online sourcing, storage, delivery, installation, taxes, trade access, and approvals.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "renovation-scope-of-work-generator", name: "Renovation Scope of Work Generator",
    description: "Define demolition, preparation, finishes, installations, responsibilities, exclusions, dependencies, inspections, and acceptance criteria.",
    icon: "folder", detailEmoji: "🛠️", displayCreditCost: 9, aliases: ["interior-renovation-sow", "remodel-scope-generator"],
    inputs: [
      { id: "project_context", label: "Project / Existing Condition", type: "textarea", placeholder: "Property, rooms, occupancy, current condition, known defects, design intent, and project stage.", required: true },
      { id: "work_items", label: "Requested Work / Deliverables", type: "textarea", placeholder: "Demolition, repairs, partitions, ceilings, flooring, joinery, finishes, fixtures, lighting, plumbing, equipment, styling, and handover.", required: true },
      { id: "existing_conditions", label: "Verified Site Facts / Unknowns", type: "textarea", placeholder: "Measurements, services, structural information, hazardous-material surveys, access, protection, and unknown conditions.", required: false },
      { id: "responsibilities", label: "Roles / Responsibilities", type: "textarea", placeholder: "Client, designer, architect, contractor, suppliers, consultants, landlord, approvals, procurement, and coordination responsibilities.", required: false },
      { id: "schedule_constraints", label: "Schedule / Site Constraints", type: "textarea", placeholder: "Working hours, occupancy, shutdowns, lead times, permits, neighbour rules, sequencing, and target completion.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interior-project-timeline-generator", name: "Interior Project Timeline Generator",
    description: "Build a phased timeline for survey, concept, approvals, design development, sourcing, lead times, site work, installation, snagging, and handover.",
    icon: "calendar", detailEmoji: "🗓️", displayCreditCost: 7, aliases: ["interior-design-timeline", "renovation-schedule-generator"],
    inputs: [
      { id: "project_scope", label: "Project Scope / Current Stage", type: "textarea", placeholder: "Rooms, deliverables, renovation level, design work, procurement, installation, and work already completed.", required: true },
      { id: "target_dates", label: "Target Dates / Milestones", type: "textarea", placeholder: "Move-in, opening, handover, event, lease date, approval dates, and immovable commitments.", required: true },
      { id: "procurement_lead_times", label: "Known Lead Times", type: "textarea", placeholder: "Custom joinery, furniture, lighting, stone, appliances, imported items, samples, and contractor availability.", required: false },
      { id: "approval_process", label: "Approvals / Decision Makers", type: "textarea", placeholder: "Client review cadence, landlord, building management, consultants, permits, budget approvals, and sign-off sequence.", required: false },
      { id: "site_constraints", label: "Site / Delivery Constraints", type: "textarea", placeholder: "Occupied site, access, work hours, lift booking, noise restrictions, storage, phased possession, or shutdowns.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "interior-concept-presentation-generator", name: "Interior Concept & Presentation Generator",
    description: "Create a client-ready design narrative, concept rationale, presentation sequence, room stories, decisions, and approval questions.",
    icon: "writing-pad", detailEmoji: "🖼️", displayCreditCost: 7, aliases: ["interior-concept-deck-content", "design-presentation-generator"],
    inputs: [
      { id: "project_brief", label: "Project Brief / Client Goals", type: "textarea", placeholder: "Users, spaces, function, desired feeling, constraints, budget, timeline, and success criteria.", required: true },
      { id: "concept_inputs", label: "Concept Inputs", type: "textarea", placeholder: "Design story, palette, materials, layout, furniture, lighting, references, alternatives, and unresolved issues.", required: true },
      { id: "audience", label: "Presentation Audience", type: "textarea", placeholder: "Client profile, decision makers, technical reviewers, investors, landlord, or internal design team.", required: true },
      { id: "approval_goal", label: "Approval / Decision Goal", type: "textarea", placeholder: "What must be understood, selected, approved, rejected, budgeted, or measured after the presentation.", required: true },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "accessible-sustainable-design-planner", name: "Accessible & Sustainable Design Planner",
    description: "Integrate universal-design questions, durability, maintainability, comfort, low-waste choices, and sustainability priorities without false compliance claims.",
    icon: "idea", detailEmoji: "♿", displayCreditCost: 7, aliases: ["universal-design-planner", "sustainable-interior-planner"],
    inputs: [
      { id: "space_context", label: "Space / Project Context", type: "textarea", placeholder: "Building type, rooms, users, current condition, ownership, climate, project stage, and desired lifespan.", required: true },
      { id: "users_accessibility", label: "Users / Accessibility Needs", type: "textarea", placeholder: "Mobility, reach, vision, hearing, cognition, age, temporary injury, child safety, caregiver use, and future adaptability.", required: true },
      { id: "sustainability_goals", label: "Sustainability / Wellness Goals", type: "textarea", placeholder: "Reuse, low waste, indoor air quality, daylight, energy, water, local materials, repairability, embodied impact, and certifications to investigate.", required: true },
      { id: "maintenance_budget", label: "Maintenance / Budget Reality", type: "textarea", placeholder: "Cleaning, replacement cycles, local availability, household capacity, operating costs, and stated budget.", required: false },
      { id: "known_constraints", label: "Known Constraints / Standards", type: "textarea", placeholder: "Verified local requirements, landlord rules, consultant advice, existing dimensions, or standards requiring professional confirmation.", required: false },
      ...commonTail,
    ],
  }),

  imageTool("ai-room-redesign-generator", "AI Room Redesign Generator", "Redesign an uploaded room while preserving selected architecture, openings, geometry, camera perspective, and must-keep elements.", "✨", ["room-redesign-ai", "interior-photo-redesign"], 7),
  imageTool("empty-room-furnisher", "Empty Room Furnisher", "Furnish an uploaded empty or lightly furnished room with scale-aware zoning, circulation, coordinated materials, and professional styling.", "🛋️", ["virtual-room-furnisher", "empty-room-design-ai"], 7),
  imageTool("kitchen-bathroom-design-generator", "Kitchen & Bathroom Design Generator", "Create a premium kitchen or bathroom concept from an uploaded space while respecting fixed services unless conceptual relocation is explicitly allowed.", "🚿", ["kitchen-design-ai", "bathroom-design-ai"], 7),
  imageTool("workspace-office-interior-generator", "Workspace / Office Interior Generator", "Transform an uploaded workspace into a professional home office, studio, team office, or creative environment with functional zoning.", "🖥️", ["office-interior-ai", "workspace-redesign-generator"], 7),
  imageTool("exterior-facade-redesign-generator", "Exterior & Facade Redesign Generator", "Redesign an uploaded facade while preserving massing, openings, roof, and structural character unless conceptual alteration is selected.", "🏢", ["facade-design-ai", "exterior-redesign-generator"], 7),
  imageTool("interior-rendering-generator", "Interior Rendering Generator", "Generate a polished photorealistic interior concept from spatial facts, room use, design language, materials, lighting, and camera direction.", "🏡", ["interior-visualization-generator", "room-render-generator"], 2),
  imageTool("commercial-interior-generator", "Commercial Interior Generator", "Generate retail, clinic, salon, showroom, coworking, studio, and other non-hospitality commercial interior concepts.", "🏬", ["retail-interior-generator", "commercial-space-ai"], 2),
  imageTool("landscape-visualization-generator", "Landscape Visualization Generator", "Generate gardens, courtyards, terraces, balconies, and outdoor living concepts with climate, use, and maintenance direction.", "🌿", ["garden-visualization-ai", "outdoor-space-generator"], 2),
  imageTool("interior-moodboard-generator", "Interior Moodboard Generator", "Create a refined visual moodboard combining furniture language, palette, materials, lighting, texture, and decorative direction.", "🧵", ["interior-design-moodboard", "room-style-board-generator"], 2),
  imageTool("material-board-generator", "Material Board Generator", "Create a professional presentation board of coordinated timber, stone, paint, textile, metal, glass, hardware, and surface samples.", "🪨", ["finish-board-generator", "material-palette-board"], 2),
];
