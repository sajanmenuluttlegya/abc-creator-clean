import type { Tool, ToolInput } from "./public-tools";

const category = "Research / Knowledge Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const toneOptions = ["Academic and rigorous", "Executive and concise", "Analytical and neutral", "Plain-language expert", "Policy and decision-ready", "Technical specialist", "Custom from brief"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed analytical (7 credits)", "Comprehensive research pack (9 credits)"];
const disciplineOptions = ["General / interdisciplinary", "Business / management", "Social sciences", "Humanities", "Education", "Health / medicine", "Science / engineering", "Technology / computing", "Law / policy", "Custom from brief"];
const evidenceModeOptions = ["Use supplied sources only", "Use supplied sources + clearly labelled gaps", "Planning framework only", "Mixed evidence with source-by-source traceability"];
const versionOptions = ["1 version (1 credit)", "3 versions (2 credits)", "5 versions (3 credits)", "10 versions (5 credits)"];
const sourceCountOptions = ["5 sources", "10 sources", "20 sources", "30 sources", "50 sources"];
const studyCountOptions = ["10 studies", "20 studies", "30 studies", "50 studies", "Custom from supplied material"];
const nodeCountOptions = ["10 nodes", "20 nodes", "30 nodes", "50 nodes"];
const questionCountOptions = ["10 questions", "20 questions", "30 questions", "40 questions"];

const commonTail: ToolInput[] = [
  { id: "discipline", label: "Discipline / Domain", type: "select", required: true, options: disciplineOptions },
  { id: "evidence_mode", label: "Evidence Mode", type: "select", required: true, options: evidenceModeOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Sources / Constraints to Preserve", type: "textarea", placeholder: "Exact claims, quotations, citations, study details, dates, definitions, exclusions, terminology, stakeholder requirements, or facts that must remain unchanged.", required: false },
];

const countDrivenTail: ToolInput[] = commonTail.filter((input) => input.id !== "output_depth");

function textTool(input: Omit<Tool, "id" | "category" | "outputType"> & { id?: string }): Tool {
  return { ...input, id: input.id || input.slug, category, outputType: "text" };
}

export const researchKnowledgeTools: Tool[] = [
  textTool({
    slug: "research-question-refiner", name: "Research Question Refiner", description: "Turn a broad topic into precise, answerable research questions with scope, constructs, populations, outcomes, boundaries, and feasibility checks.", icon: "search", detailEmoji: "❓", displayCreditCost: 5, aliases: ["research-question-generator", "research-problem-refiner"],
    nextActions: [{ label: "Build the protocol", href: "/tools/research-scope-protocol-planner", description: "Convert the refined question into a controlled research plan." }],
    inputs: [
      { id: "topic_problem", label: "Topic / Problem", type: "textarea", placeholder: "What you want to understand, why it matters, the current uncertainty, and the decision or knowledge gap behind the research.", required: true },
      { id: "context_population", label: "Context / Population / Setting", type: "textarea", placeholder: "Who, where, when, sector, geography, system, population, unit of analysis, or other boundaries.", required: false },
      { id: "known_evidence", label: "Known Evidence / Prior Work", type: "textarea", placeholder: "Existing findings, definitions, theories, datasets, practical constraints, and uncertainties already known.", required: false },
      { id: "version_count", label: "Question Variants", type: "select", required: true, options: versionOptions },
      ...countDrivenTail,
    ],
  }),
  textTool({
    slug: "research-scope-protocol-planner", name: "Research Scope & Protocol Planner", description: "Create a transparent research protocol with objectives, scope, methods, sources, decisions, quality controls, risks, and change-management rules.", icon: "writing-pad", detailEmoji: "📐", displayCreditCost: 9, aliases: ["research-protocol-generator", "research-plan-builder"],
    inputs: [
      { id: "research_question_objectives", label: "Research Question / Objectives", type: "textarea", placeholder: "Primary question, secondary questions, intended outputs, decisions supported, and what success means.", required: true },
      { id: "scope_boundaries", label: "Scope / Boundaries", type: "textarea", placeholder: "Population, concept, context, geography, time period, languages, source types, exclusions, and feasibility limits.", required: true },
      { id: "methods_resources", label: "Methods / Resources", type: "textarea", placeholder: "Review, interviews, survey, data analysis, team, tools, budget, timeline, expertise, stakeholder access, and constraints.", required: true },
      { id: "quality_ethics", label: "Quality / Ethics / Governance", type: "textarea", placeholder: "Review standards, approvals, privacy, consent, bias controls, versioning, conflict-of-interest, and audit expectations.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "literature-search-strategy-generator", name: "Literature Search Strategy Generator", description: "Design a reproducible multi-database literature-search strategy with concepts, synonyms, controlled vocabulary, limits, documentation, and update rules.", icon: "search", detailEmoji: "🔎", displayCreditCost: 9, aliases: ["academic-search-strategy", "database-search-plan-generator"],
    nextActions: [{ label: "Build Boolean queries", href: "/tools/boolean-search-query-builder", description: "Translate the search concepts into database-ready query families." }],
    inputs: [
      { id: "research_question", label: "Research Question", type: "textarea", placeholder: "The exact research question and any PICO, PICo, SPIDER, PCC, or other framework already chosen.", required: true },
      { id: "concepts_terms", label: "Known Concepts / Terms", type: "textarea", placeholder: "Core concepts, synonyms, acronyms, spellings, subject headings, exclusions, and known key papers or authors.", required: true },
      { id: "databases_sources", label: "Databases / Source Types", type: "textarea", placeholder: "Databases, indexes, repositories, grey literature, trial registries, citation searching, hand searching, and language limits.", required: true },
      { id: "date_scope_constraints", label: "Date / Scope / Constraints", type: "textarea", placeholder: "Coverage dates, publication types, languages, geography, access limits, and recall-versus-precision priorities.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "boolean-search-query-builder", name: "Boolean Search Query Builder", description: "Build database-aware Boolean query families with concept blocks, synonyms, proximity logic, field limits, test cases, and translation notes.", icon: "search", detailEmoji: "🧮", displayCreditCost: 7, aliases: ["boolean-query-generator", "academic-database-query-builder"],
    inputs: [
      { id: "question_concepts", label: "Question / Concept Blocks", type: "textarea", placeholder: "Research question plus the concepts that must be represented in the search.", required: true },
      { id: "synonyms_vocabulary", label: "Synonyms / Controlled Vocabulary", type: "textarea", placeholder: "Keywords, acronyms, variants, subject headings, broader/narrower terms, exclusions, and known terminology conflicts.", required: true },
      { id: "target_platforms", label: "Target Databases / Platforms", type: "textarea", placeholder: "Examples: PubMed, Scopus, Web of Science, IEEE Xplore, PsycINFO, ERIC, Google Scholar, legal databases, or custom platforms.", required: true },
      { id: "query_versions", label: "Query Variants", type: "select", required: true, options: versionOptions },
      ...countDrivenTail,
    ],
  }),
  textTool({
    slug: "source-discovery-triage-planner", name: "Source Discovery & Triage Planner", description: "Create a disciplined source-discovery workflow that prioritizes relevant, authoritative, diverse, current, primary, and decision-useful evidence.", icon: "folder", detailEmoji: "🧭", displayCreditCost: 7, aliases: ["source-discovery-plan", "research-source-triage"],
    inputs: [
      { id: "research_need", label: "Research Need / Decision", type: "textarea", placeholder: "Question, deliverable, stakeholder, decision deadline, evidence threshold, and consequence of error.", required: true },
      { id: "source_universe", label: "Potential Source Universe", type: "textarea", placeholder: "Academic literature, official data, standards, laws, company filings, expert interviews, archives, news, grey literature, and internal records.", required: true },
      { id: "selection_priorities", label: "Selection / Triage Priorities", type: "textarea", placeholder: "Authority, recency, directness, methodology, geography, population, independence, accessibility, language, and diversity requirements.", required: false },
      { id: "source_count", label: "Target Priority Set", type: "select", required: true, options: sourceCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "source-credibility-relevance-evaluator", name: "Source Credibility & Relevance Evaluator", description: "Evaluate supplied sources using transparent criteria for authority, methodology, directness, independence, currency, completeness, bias, and decision relevance.", icon: "seo", detailEmoji: "🛡️", displayCreditCost: 7, aliases: ["source-quality-evaluator", "source-credibility-checker"],
    inputs: [
      { id: "source_details", label: "Source Details / Excerpts", type: "textarea", placeholder: "Citation, URL, publisher, author, date, abstract or excerpt, methods, funding, claims, and any available metadata.", required: true },
      { id: "research_question_use", label: "Research Question / Intended Use", type: "textarea", placeholder: "The claim, decision, comparison, or context for which this source may be used.", required: true },
      { id: "evaluation_standard", label: "Evaluation Standard / Concerns", type: "textarea", placeholder: "Relevant appraisal framework, domain-specific criteria, known conflicts, retraction concerns, or evidence hierarchy.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "academic-paper-analyzer", name: "Academic Paper Analyzer", description: "Analyze a supplied paper with traceable separation of question, design, sample, methods, findings, limitations, applicability, and unsupported interpretation.", icon: "file", detailEmoji: "📄", displayCreditCost: 7, aliases: ["research-paper-analyzer", "journal-article-analysis"],
    inputs: [
      { id: "paper_content", label: "Paper / Abstract / Notes", type: "textarea", placeholder: "Paste the paper text, abstract, structured notes, tables, or verified metadata. Include page or section markers where possible.", required: true },
      { id: "analysis_purpose", label: "Analysis Purpose", type: "textarea", placeholder: "Why you are reading it, which question it should inform, required depth, and any claims you need checked.", required: true },
      { id: "comparison_context", label: "Comparison / Domain Context", type: "textarea", placeholder: "Other studies, expected methods, population, baseline knowledge, theoretical frame, or decision context.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "study-design-methods-analyzer", name: "Study Design & Methods Analyzer", description: "Examine study design, sampling, measurement, intervention or exposure, analysis, confounding, missing data, validity, and reproducibility.", icon: "settings", detailEmoji: "🧪", displayCreditCost: 9, aliases: ["research-methods-analyzer", "study-methodology-reviewer"],
    inputs: [
      { id: "methods_content", label: "Methods / Study Details", type: "textarea", placeholder: "Design, setting, participants, sampling, variables, instruments, procedures, intervention, comparison, analysis, missing data, and preregistration details.", required: true },
      { id: "research_claim", label: "Research Question / Claim", type: "textarea", placeholder: "The causal, descriptive, diagnostic, prognostic, qualitative, or theoretical claim the study is intended to support.", required: true },
      { id: "domain_standards", label: "Domain Standards / Appraisal Context", type: "textarea", placeholder: "Relevant reporting guidance, typical confounders, validity threats, ethical expectations, and replication concerns.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "citation-context-analyzer", name: "Citation Context Analyzer", description: "Analyze how a supplied source is cited—supporting, contrasting, mentioning, extending, or misrepresenting—without treating citation count as proof.", icon: "link", detailEmoji: "🔗", displayCreditCost: 7, aliases: ["citation-claim-analyzer", "citation-context-reviewer"],
    inputs: [
      { id: "cited_source_claim", label: "Cited Source / Original Claim", type: "textarea", placeholder: "Original source details, relevant passage, finding, method, limitation, and exact claim being cited.", required: true },
      { id: "citing_contexts", label: "Citing Passages / Contexts", type: "textarea", placeholder: "Paste each citing sentence or paragraph with source identifiers and enough surrounding context to interpret the citation.", required: true },
      { id: "analysis_goal", label: "Analysis Goal", type: "textarea", placeholder: "Misquotation check, consensus review, lineage tracing, literature synthesis, claim verification, or other purpose.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "evidence-extraction-matrix-generator", name: "Evidence Extraction Matrix Generator", description: "Create a structured study-by-study extraction matrix with traceable fields for design, population, methods, results, limitations, and applicability.", icon: "table", detailEmoji: "📊", displayCreditCost: 9, aliases: ["study-extraction-table", "evidence-matrix-builder"],
    inputs: [
      { id: "review_question", label: "Review Question / Purpose", type: "textarea", placeholder: "Question, intended synthesis, decision context, outcomes, and required comparison dimensions.", required: true },
      { id: "studies_sources", label: "Studies / Source Notes", type: "textarea", placeholder: "Paste citations, abstracts, extraction notes, methods, findings, page references, and identifiers for each supplied study.", required: true },
      { id: "extraction_fields", label: "Required Extraction Fields", type: "textarea", placeholder: "Population, exposure/intervention, comparison, outcomes, setting, design, sample, measures, effect estimates, themes, funding, limitations, or custom fields.", required: false },
      { id: "study_count", label: "Matrix Capacity", type: "select", required: true, options: studyCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "literature-review-synthesizer", name: "Literature Review Synthesizer", description: "Synthesize supplied literature by themes, methods, findings, disagreements, evidence quality, context, chronology, and unresolved questions—not source-by-source summary alone.", icon: "writing-pad", detailEmoji: "📚", displayCreditCost: 9, aliases: ["literature-synthesis-generator", "research-literature-review"],
    inputs: [
      { id: "review_question_scope", label: "Review Question / Scope", type: "textarea", placeholder: "Question, audience, review type, date and geography limits, key concepts, and intended conclusion boundaries.", required: true },
      { id: "source_material", label: "Source Material / Extraction Notes", type: "textarea", placeholder: "Paste verified citations, abstracts, findings, methods, limitations, quotations, page markers, and evidence tables.", required: true },
      { id: "synthesis_requirements", label: "Synthesis Requirements", type: "textarea", placeholder: "Themes, chronological structure, theory, methods comparison, populations, outcomes, policy relevance, or required sections.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "systematic-review-protocol-generator", name: "Systematic Review Protocol Generator", description: "Draft a transparent systematic-review protocol covering question, eligibility, search, screening, extraction, appraisal, synthesis, amendments, and reporting.", icon: "writing-pad", detailEmoji: "📑", displayCreditCost: 9, aliases: ["systematic-review-plan", "prisma-protocol-generator"],
    inputs: [
      { id: "review_question_framework", label: "Review Question / Framework", type: "textarea", placeholder: "Question and PICO, PICo, PCC, SPIDER, PECO, or another justified structure.", required: true },
      { id: "eligibility_scope", label: "Eligibility / Scope", type: "textarea", placeholder: "Population, interventions/exposures, comparisons, outcomes, designs, settings, dates, languages, publication status, and exclusions.", required: true },
      { id: "methods_team", label: "Methods / Team / Tools", type: "textarea", placeholder: "Databases, search methods, reviewers, screening, extraction, appraisal, synthesis, software, conflict resolution, and timeline.", required: true },
      { id: "registration_reporting", label: "Registration / Reporting / Amendments", type: "textarea", placeholder: "Protocol registry, reporting guideline, funding, conflicts, stakeholder involvement, data sharing, and amendment policy.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "screening-eligibility-planner", name: "Screening & Eligibility Planner", description: "Operationalize inclusion and exclusion criteria into reproducible title, abstract, and full-text screening rules with conflict-resolution and audit controls.", icon: "check", detailEmoji: "✅", displayCreditCost: 7, aliases: ["study-screening-plan", "eligibility-criteria-generator"],
    inputs: [
      { id: "review_question", label: "Review Question", type: "textarea", placeholder: "The exact review question and framework.", required: true },
      { id: "draft_criteria", label: "Draft Inclusion / Exclusion Criteria", type: "textarea", placeholder: "Population, concept, context, intervention/exposure, comparator, outcomes, study designs, date, language, publication status, and exclusions.", required: true },
      { id: "screening_workflow", label: "Team / Screening Workflow", type: "textarea", placeholder: "Number of reviewers, software, duplicate screening, pilot set, conflict resolution, reasons for exclusion, and audit requirements.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "risk-of-bias-quality-appraisal-planner", name: "Risk of Bias & Quality Appraisal Planner", description: "Select and operationalize suitable appraisal domains for supplied study designs without producing unsupported quality scores.", icon: "check", detailEmoji: "⚖️", displayCreditCost: 9, aliases: ["quality-appraisal-generator", "risk-of-bias-plan"],
    inputs: [
      { id: "study_designs_question", label: "Study Designs / Review Question", type: "textarea", placeholder: "Included designs, research question, outcomes, causal or descriptive intent, and how appraisal will affect synthesis.", required: true },
      { id: "available_study_details", label: "Available Study Details", type: "textarea", placeholder: "Methods, sampling, allocation, blinding, measurement, missing data, confounding, reporting, reflexivity, and funding information.", required: true },
      { id: "preferred_frameworks", label: "Preferred Frameworks / Requirements", type: "textarea", placeholder: "Examples: RoB 2, ROBINS-I, QUADAS-2, CASP, JBI, MMAT, AMSTAR 2, domain-specific standards, or no preference.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "evidence-certainty-strength-assessor", name: "Evidence Certainty & Strength Assessor", description: "Assess confidence in a body of evidence using transparent domains, outcome-level reasoning, limitations, consistency, directness, precision, and publication-bias questions.", icon: "seo", detailEmoji: "📏", displayCreditCost: 9, aliases: ["evidence-strength-evaluator", "certainty-of-evidence-planner"],
    inputs: [
      { id: "question_outcomes", label: "Question / Outcomes", type: "textarea", placeholder: "Population, intervention/exposure, comparison, outcomes, thresholds, decision context, and which outcomes are critical.", required: true },
      { id: "body_of_evidence", label: "Body of Evidence", type: "textarea", placeholder: "Study designs, effect estimates or themes, sample sizes, consistency, limitations, directness, precision, funding, and publication context.", required: true },
      { id: "certainty_framework", label: "Framework / Decision Requirements", type: "textarea", placeholder: "GRADE, CERQual, evidence hierarchy, policy standard, internal rubric, or custom requirements.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "contradiction-consensus-mapper", name: "Contradiction & Consensus Mapper", description: "Map where supplied sources agree, disagree, qualify one another, examine different questions, or conflict because of methods, populations, definitions, or timing.", icon: "network", detailEmoji: "↔️", displayCreditCost: 7, aliases: ["research-consensus-analyzer", "evidence-conflict-mapper"],
    inputs: [
      { id: "research_claim_question", label: "Claim / Research Question", type: "textarea", placeholder: "The exact proposition, outcome, relationship, or question whose evidence landscape should be mapped.", required: true },
      { id: "source_findings", label: "Source Findings / Methods", type: "textarea", placeholder: "For each source: citation, population, design, definitions, findings, uncertainty, limitations, date, and page or section references.", required: true },
      { id: "comparison_dimensions", label: "Comparison Dimensions", type: "textarea", placeholder: "Population, intervention, exposure, outcome, measure, setting, period, design, theory, quality, funding, and contextual moderators.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "research-gap-finder", name: "Research Gap Finder", description: "Identify defensible evidence, method, population, context, theory, implementation, replication, and measurement gaps from supplied literature.", icon: "search", detailEmoji: "🕳️", displayCreditCost: 7, aliases: ["literature-gap-analyzer", "research-opportunity-finder"],
    inputs: [
      { id: "topic_question", label: "Topic / Question", type: "textarea", placeholder: "Domain, problem, decision context, target population, setting, and why another study may be useful.", required: true },
      { id: "literature_summary", label: "Literature / Evidence Summary", type: "textarea", placeholder: "Verified source notes, findings, methods, limitations, populations, dates, debates, and stated future-research recommendations.", required: true },
      { id: "feasibility_priorities", label: "Feasibility / Priority Constraints", type: "textarea", placeholder: "Available data, ethics, expertise, budget, timeline, access, policy relevance, novelty threshold, and replication priorities.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "theoretical-framework-builder", name: "Theoretical Framework Builder", description: "Select, compare, and operationalize theories that explain the research problem while preserving assumptions, boundary conditions, and competing explanations.", icon: "network", detailEmoji: "🏛️", displayCreditCost: 7, aliases: ["theory-framework-generator", "research-theory-builder"],
    inputs: [
      { id: "research_problem", label: "Research Problem / Question", type: "textarea", placeholder: "Phenomenon, unit of analysis, population, setting, expected relationships, and explanatory need.", required: true },
      { id: "candidate_theories_evidence", label: "Candidate Theories / Prior Evidence", type: "textarea", placeholder: "Known theories, constructs, authors, prior findings, disciplinary expectations, and competing explanations.", required: false },
      { id: "method_context", label: "Method / Context / Constraints", type: "textarea", placeholder: "Qualitative, quantitative, mixed methods, data available, scale, culture, time horizon, and intended contribution.", required: true },
      { id: "version_count", label: "Framework Options", type: "select", required: true, options: versionOptions },
      ...countDrivenTail,
    ],
  }),
  textTool({
    slug: "conceptual-framework-generator", name: "Conceptual Framework Generator", description: "Build a research-ready conceptual model of constructs, relationships, mechanisms, moderators, mediators, assumptions, and measurable implications.", icon: "network", detailEmoji: "🧩", displayCreditCost: 7, aliases: ["conceptual-model-builder", "research-concept-map"],
    inputs: [
      { id: "research_question_constructs", label: "Question / Constructs", type: "textarea", placeholder: "Research question, concepts, variables, actors, outcomes, mechanisms, definitions, and units of analysis.", required: true },
      { id: "theory_evidence", label: "Theory / Evidence Basis", type: "textarea", placeholder: "Theories, prior findings, qualitative themes, causal assumptions, domain knowledge, and contradictory evidence.", required: true },
      { id: "measurement_context", label: "Measurement / Study Context", type: "textarea", placeholder: "Population, setting, data, operational definitions, temporal order, confounders, moderators, mediators, and feasibility constraints.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "claim-evidence-matrix-generator", name: "Claim–Evidence Matrix Generator", description: "Link each claim to exact supporting, qualifying, contradicting, or missing evidence with source, location, confidence, and action status.", icon: "table", detailEmoji: "🧾", displayCreditCost: 7, aliases: ["evidence-traceability-matrix", "claim-source-mapper"],
    inputs: [
      { id: "claims", label: "Claims / Draft Conclusions", type: "textarea", placeholder: "List the exact claims, recommendations, statistics, causal statements, quotations, or conclusions to evaluate.", required: true },
      { id: "sources_evidence", label: "Sources / Evidence", type: "textarea", placeholder: "Verified citations, passages, page numbers, methods, results, limitations, corrections, and source identifiers.", required: true },
      { id: "use_context", label: "Use Context / Evidence Threshold", type: "textarea", placeholder: "Academic paper, policy memo, business decision, legal review, public communication, high-stakes claim, or internal analysis.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "fact-checking-research-plan-generator", name: "Fact-Checking Research Plan Generator", description: "Create a source-led verification plan for factual, statistical, causal, historical, legal, scientific, and attribution claims.", icon: "check", detailEmoji: "🕵️", displayCreditCost: 7, aliases: ["fact-check-plan", "claim-verification-research"],
    inputs: [
      { id: "claims_to_verify", label: "Claims to Verify", type: "textarea", placeholder: "Exact wording of each claim, statistic, quote, date, attribution, causal statement, or implication.", required: true },
      { id: "context_stakes", label: "Context / Stakes", type: "textarea", placeholder: "Where the claim will appear, audience, deadline, consequence of error, jurisdiction, time sensitivity, and acceptable uncertainty.", required: true },
      { id: "available_sources", label: "Available Sources / Leads", type: "textarea", placeholder: "Primary documents, datasets, official records, papers, interviews, archives, news reports, screenshots, and missing source details.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "research-notes-organizer", name: "Research Notes Organizer", description: "Turn unstructured research notes into a traceable system of sources, claims, themes, questions, evidence, quotations, decisions, and next searches.", icon: "folder", detailEmoji: "🗃️", displayCreditCost: 5, aliases: ["research-note-cleaner", "knowledge-notes-organizer"],
    inputs: [
      { id: "raw_notes", label: "Raw Research Notes", type: "textarea", placeholder: "Paste notes, excerpts, citations, links, questions, observations, meeting notes, and partial ideas.", required: true },
      { id: "project_question", label: "Project / Research Question", type: "textarea", placeholder: "Purpose, deliverable, scope, audience, deadlines, and decisions the notes should support.", required: true },
      { id: "organization_preference", label: "Organization Preferences", type: "textarea", placeholder: "Themes, source-first, question-first, chronology, methods, stakeholder, claim-evidence, tags, folders, or custom structure.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "source-annotation-reading-note-generator", name: "Source Annotation & Reading Note Generator", description: "Create a precise annotated-bibliography or evergreen reading note from supplied source content with quotation and location traceability.", icon: "writing-pad", detailEmoji: "📝", displayCreditCost: 5, aliases: ["annotated-bibliography-generator", "paper-reading-note"],
    inputs: [
      { id: "source_content_metadata", label: "Source Content / Metadata", type: "textarea", placeholder: "Citation, author, date, title, publisher, abstract or text, page markers, methods, findings, quotations, and notes.", required: true },
      { id: "research_context", label: "Research Context", type: "textarea", placeholder: "Question, project, theory, theme, argument, or decision this source should inform.", required: true },
      { id: "note_style", label: "Note Purpose / Style", type: "select", required: true, options: ["Annotated bibliography", "Evergreen knowledge note", "Critical reading note", "Method-focused note", "Claim-evidence note", "Teaching / briefing note"] },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "citation-reference-audit-generator", name: "Citation & Reference Audit Generator", description: "Audit citation-reference consistency, metadata completeness, source traceability, quotation accuracy, identifier status, and unsupported claims.", icon: "check", detailEmoji: "📎", displayCreditCost: 7, aliases: ["reference-list-auditor", "citation-integrity-checker"],
    inputs: [
      { id: "draft_with_citations", label: "Draft / In-Text Citations", type: "textarea", placeholder: "Paste the draft, claims, quotations, footnotes, endnotes, or citation markers.", required: true },
      { id: "reference_list", label: "Reference List / Metadata", type: "textarea", placeholder: "Paste references, DOI/ISBN/URL, authors, dates, titles, journals, publishers, page ranges, access dates, and identifiers.", required: true },
      { id: "citation_style_requirements", label: "Citation Style / Requirements", type: "textarea", placeholder: "APA, MLA, Chicago, Vancouver, OSCOLA, journal style, organizational standard, or custom rules.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "knowledge-base-architecture-planner", name: "Knowledge Base Architecture Planner", description: "Design a maintainable knowledge base with source records, concepts, claims, projects, tags, relationships, governance, versioning, and retrieval rules.", icon: "folder", detailEmoji: "🧠", displayCreditCost: 7, aliases: ["knowledge-management-system-planner", "research-library-architecture"],
    inputs: [
      { id: "knowledge_domain_users", label: "Knowledge Domain / Users", type: "textarea", placeholder: "What knowledge is managed, who creates and uses it, decisions supported, sensitivity, scale, and collaboration needs.", required: true },
      { id: "content_types_sources", label: "Content Types / Sources", type: "textarea", placeholder: "Papers, reports, notes, meetings, datasets, policies, standards, decisions, projects, experts, links, and internal documents.", required: true },
      { id: "tools_constraints", label: "Tools / Constraints / Governance", type: "textarea", placeholder: "Current software, permissions, retention, privacy, taxonomy, search, integrations, ownership, review cadence, and migration limits.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "knowledge-map-concept-graph-generator", name: "Knowledge Map & Concept Graph Generator", description: "Create a structured concept graph with entities, definitions, relationships, evidence links, uncertainty, hierarchy, and expansion questions.", icon: "network", detailEmoji: "🕸️", displayCreditCost: 7, aliases: ["knowledge-graph-generator", "concept-map-builder"],
    inputs: [
      { id: "topic_scope", label: "Topic / Scope", type: "textarea", placeholder: "Domain, central question, intended audience, boundaries, level of abstraction, and decisions or learning goals.", required: true },
      { id: "source_notes_concepts", label: "Sources / Notes / Concepts", type: "textarea", placeholder: "Verified concepts, entities, definitions, claims, quotations, relationships, theories, sources, and uncertainties.", required: true },
      { id: "graph_purpose", label: "Graph Purpose / Relationship Types", type: "textarea", placeholder: "Taxonomy, causal map, dependency graph, concept map, knowledge graph, process model, stakeholder system, or custom relationships.", required: false },
      { id: "node_count", label: "Target Graph Size", type: "select", required: true, options: nodeCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "evidence-landscape-map-generator", name: "Evidence Landscape Map Generator", description: "Map the distribution of evidence across questions, populations, methods, interventions, outcomes, settings, dates, quality, and gaps.", icon: "chart", detailEmoji: "🗺️", displayCreditCost: 9, aliases: ["evidence-map-builder", "research-landscape-analyzer"],
    inputs: [
      { id: "mapping_question_scope", label: "Mapping Question / Scope", type: "textarea", placeholder: "Domain, users, decisions, population, concepts, interventions/exposures, outcomes, settings, period, and source types.", required: true },
      { id: "evidence_inventory", label: "Evidence Inventory", type: "textarea", placeholder: "For each source: citation, date, design, population, setting, topic, intervention/exposure, outcome, findings, quality, and identifiers.", required: true },
      { id: "mapping_dimensions", label: "Mapping Dimensions / Visual Needs", type: "textarea", placeholder: "Matrix, heatmap, timeline, bubble map, network, taxonomy, geographic layer, evidence gap map, and priority dimensions.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "argument-map-generator", name: "Argument Map Generator", description: "Map a complex argument into claims, reasons, evidence, assumptions, objections, rebuttals, dependencies, uncertainties, and decision implications.", icon: "network", detailEmoji: "🧠", displayCreditCost: 7, aliases: ["reasoning-map-builder", "claim-argument-graph"],
    inputs: [
      { id: "argument_issue", label: "Issue / Central Claim", type: "textarea", placeholder: "Question, disputed proposition, policy choice, theoretical argument, or decision under analysis.", required: true },
      { id: "claims_evidence_objections", label: "Claims / Evidence / Objections", type: "textarea", placeholder: "Arguments, sources, quotations, assumptions, counterclaims, uncertainties, stakeholder positions, and known fallacies or disputes.", required: true },
      { id: "decision_context", label: "Audience / Decision Context", type: "textarea", placeholder: "Who will use the map, decision standard, burden of proof, time horizon, values, and consequences of error.", required: false },
      { id: "node_count", label: "Target Map Size", type: "select", required: true, options: nodeCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "research-brief-generator", name: "Research Brief Generator", description: "Produce a concise but traceable research brief with question, method, evidence, findings, uncertainty, implications, and recommended next work.", icon: "writing-pad", detailEmoji: "📘", displayCreditCost: 7, aliases: ["evidence-brief-generator", "research-summary-brief"],
    inputs: [
      { id: "research_question_audience", label: "Question / Audience / Decision", type: "textarea", placeholder: "Research question, intended reader, decision supported, deadline, prior knowledge, and evidence threshold.", required: true },
      { id: "source_material_findings", label: "Source Material / Findings", type: "textarea", placeholder: "Verified citations, methods, findings, statistics, quotations, limitations, disagreements, page references, and data-quality notes.", required: true },
      { id: "brief_requirements", label: "Brief Requirements", type: "textarea", placeholder: "Word limit, sections, tone, policy or business implications, visuals, recommendations, and citation style.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "executive-research-report-generator", name: "Executive Research Report Generator", description: "Create a decision-ready report with methodology, evidence traceability, findings, alternatives, uncertainty, risks, recommendations, and implementation questions.", icon: "writing-pad", detailEmoji: "📈", displayCreditCost: 9, aliases: ["professional-research-report", "evidence-report-generator"],
    inputs: [
      { id: "mandate_question", label: "Mandate / Research Question", type: "textarea", placeholder: "Commissioning context, decision, stakeholders, scope, objectives, success criteria, and consequences of error.", required: true },
      { id: "evidence_analysis", label: "Evidence / Analysis", type: "textarea", placeholder: "Verified sources, datasets, methods, findings, comparisons, contradictions, limitations, assumptions, and source locations.", required: true },
      { id: "recommendation_context", label: "Recommendation / Implementation Context", type: "textarea", placeholder: "Options, constraints, budget, timeline, risk tolerance, operational capacity, legal or ethical concerns, and decision criteria.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "research-to-action-decision-memo-generator", name: "Research-to-Action Decision Memo Generator", description: "Translate a body of evidence into a bounded decision memo with options, criteria, uncertainty, risks, reversibility, implementation, and monitoring.", icon: "writing-pad", detailEmoji: "🎯", displayCreditCost: 7, aliases: ["evidence-to-decision-memo", "research-action-plan-generator"],
    inputs: [
      { id: "decision_required", label: "Decision Required", type: "textarea", placeholder: "Decision owner, deadline, available choices, non-negotiables, constraints, stakeholders, and what happens if no action is taken.", required: true },
      { id: "research_evidence", label: "Research / Evidence", type: "textarea", placeholder: "Verified findings, source quality, effect sizes or themes, uncertainty, limitations, transferability, costs, harms, and stakeholder evidence.", required: true },
      { id: "implementation_constraints", label: "Implementation / Monitoring Context", type: "textarea", placeholder: "Capacity, resources, dependencies, legal or ethical limits, reversibility, pilot options, metrics, and review timing.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "qualitative-interview-guide-generator", name: "Qualitative Interview Guide Generator", description: "Create a non-leading, ethically appropriate semi-structured interview guide with rapport, probes, transitions, sensitive-topic handling, and analysis alignment.", icon: "chat", detailEmoji: "🎙️", displayCreditCost: 7, aliases: ["research-interview-question-generator", "semi-structured-interview-guide"],
    inputs: [
      { id: "research_question_participants", label: "Research Question / Participants", type: "textarea", placeholder: "Study purpose, participant group, recruitment context, relationship to researchers, setting, and knowledge sought.", required: true },
      { id: "themes_constructs", label: "Themes / Constructs", type: "textarea", placeholder: "Topics, experiences, processes, decisions, meanings, timelines, incidents, contradictions, and concepts to explore.", required: true },
      { id: "ethics_logistics", label: "Ethics / Logistics / Sensitivity", type: "textarea", placeholder: "Consent, recording, privacy, safeguarding, incentives, duration, language, accessibility, power dynamics, and sensitive issues.", required: false },
      { id: "question_count", label: "Guide Length", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "survey-research-plan-generator", name: "Survey Research Plan Generator", description: "Design a survey research plan covering constructs, population, sampling, questionnaire logic, measurement, piloting, bias, data quality, analysis, and reporting.", icon: "form", detailEmoji: "📋", displayCreditCost: 9, aliases: ["survey-methodology-planner", "questionnaire-research-plan"],
    inputs: [
      { id: "research_objectives_population", label: "Objectives / Population", type: "textarea", placeholder: "Research questions, decisions, target population, sampling frame, subgroups, setting, and required estimates or comparisons.", required: true },
      { id: "constructs_measures", label: "Constructs / Measures", type: "textarea", placeholder: "Variables, definitions, existing validated measures, recall periods, response formats, outcomes, predictors, and sensitive questions.", required: true },
      { id: "administration_analysis", label: "Administration / Analysis / Constraints", type: "textarea", placeholder: "Mode, language, accessibility, sample limits, incentives, privacy, timing, branching, quality checks, weighting, and analysis needs.", required: true },
      { id: "question_count", label: "Questionnaire Scope", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "data-collection-coding-plan-generator", name: "Data Collection & Coding Plan Generator", description: "Create a controlled plan for variables, fields, instruments, codebooks, provenance, quality checks, missing data, qualitative coding, storage, and handoff.", icon: "table", detailEmoji: "🗂️", displayCreditCost: 9, aliases: ["research-data-management-plan", "coding-framework-generator"],
    inputs: [
      { id: "research_design_data", label: "Research Design / Data", type: "textarea", placeholder: "Questions, design, units, sources, observations, interviews, surveys, documents, measurements, timing, and expected volume.", required: true },
      { id: "variables_codes", label: "Variables / Codes / Definitions", type: "textarea", placeholder: "Constructs, field names, definitions, values, labels, coding rules, qualitative themes, derived variables, identifiers, and source locations.", required: true },
      { id: "quality_governance", label: "Quality / Governance / Storage", type: "textarea", placeholder: "Collectors or coders, training, inter-rater checks, validation, missing data, versioning, audit, privacy, retention, access, and export formats.", required: false },
      ...commonTail,
    ],
  }),
  textTool({
    slug: "research-ethics-consent-checklist-generator", name: "Research Ethics & Consent Checklist Generator", description: "Create a planning checklist for informed consent, privacy, risk, vulnerable groups, incentives, deception, data use, withdrawal, governance, and professional review.", icon: "check", detailEmoji: "🔐", displayCreditCost: 7, aliases: ["research-ethics-planner", "consent-review-checklist"],
    inputs: [
      { id: "study_context_participants", label: "Study / Participants / Setting", type: "textarea", placeholder: "Purpose, methods, participant groups, recruitment, researcher relationship, locations, online systems, and jurisdictions.", required: true },
      { id: "data_risks", label: "Data / Activities / Risks", type: "textarea", placeholder: "Sensitive topics, identifiers, recordings, biological or location data, interventions, deception, incentives, distress, safeguarding, and downstream use.", required: true },
      { id: "governance_requirements", label: "Governance / Review Requirements", type: "textarea", placeholder: "Institution, ethics board, legal review, funder rules, data-protection requirements, community governance, and consent format.", required: false },
      ...commonTail,
    ],
  }),
];
