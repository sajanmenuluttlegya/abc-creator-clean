import type { Tool, ToolInput } from "./public-tools";

const category = "Data Analysis / Business Intelligence Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const audienceOptions = ["Executive leadership", "Business operations", "Finance", "Sales", "Marketing", "Product", "Data / analytics team", "Technical engineering", "General stakeholder", "Custom from brief"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed analytical (7 credits)", "Comprehensive decision pack (9 credits)"];
const toneOptions = ["Executive and decision-ready", "Analytical and rigorous", "Technical and implementation-ready", "Plain-language stakeholder", "Audit and governance focused", "Custom from brief"];
const evidenceOptions = ["Uploaded or pasted data only", "Data plus supplied business context", "Planning without dataset", "Mixed evidence with explicit assumptions"];
const datasetSizeOptions = ["Small sample / extract", "Single operational table", "Multiple related tables", "Large warehouse / lakehouse", "Unknown / discovery required"];
const itemCountOptions = ["5 items", "10 items", "15 items", "20 items", "30 items", "40 items"];
const versionOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const nodeCountOptions = ["10 nodes", "20 nodes", "30 nodes", "40 nodes"];
const chartCountOptions = ["3 charts", "5 charts", "8 charts", "12 charts"];

const commonTail: ToolInput[] = [
  { id: "stakeholder_audience", label: "Primary Stakeholder / Audience", type: "select", required: true, options: audienceOptions },
  { id: "evidence_mode", label: "Evidence Mode", type: "select", required: true, options: evidenceOptions },
  { id: "dataset_scale", label: "Dataset / System Scale", type: "select", required: true, options: datasetSizeOptions },
  { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Definitions / Constraints to Preserve", type: "textarea", placeholder: "Exact metric definitions, date grain, filters, source-system rules, known limitations, privacy requirements, approved numbers, business logic, or terminology that must not change.", required: false },
];

function t(slug: string, name: string, description: string, emoji: string, credit: number, inputs: ToolInput[], aliases: string[] = [], nextActions?: Tool["nextActions"]): Tool {
  return { id: slug, slug, name, description, icon: "chart", detailEmoji: emoji, category, displayCreditCost: credit, outputType: "text", aliases, inputs, nextActions };
}

export const DATA_ANALYSIS_BI_VISUAL_TOOL_SLUGS = [
  "kpi-dashboard-blueprint-generator",
  "data-story-chart-pack-generator",
  "metric-tree-driver-diagram-generator",
  "data-lineage-model-map-generator",
] as const;

export const dataAnalysisBITools: Tool[] = [
  t("data-analysis-brief-generator", "Data Analysis Brief Generator", "Turn a business question, available data, stakeholders, decisions, constraints, and success criteria into a controlled professional analysis brief.", "🧾", 7, [
    { id: "business_question_decision", label: "Business Question / Decision", type: "textarea", placeholder: "What decision must be made, by whom, by when, and what would change because of this analysis?", required: true },
    { id: "available_data_context", label: "Available Data / Business Context", type: "textarea", placeholder: "Sources, tables, date range, grain, entities, definitions, known limitations, and relevant operational context.", required: true },
    { id: "scope_success_constraints", label: "Scope / Success / Constraints", type: "textarea", placeholder: "Inclusions, exclusions, required cuts, privacy, deadlines, tooling, validation, and acceptance criteria.", required: true },
    ...commonTail,
  ], ["analytics-brief", "business-analysis-brief"], [{ label: "Define the KPI system", href: "/tools/kpi-framework-metric-tree-generator", description: "Translate the decision into governed metrics and drivers." }]),

  t("data-dictionary-metric-definition-generator", "Data Dictionary & Metric Definition Generator", "Create governed field and metric definitions with grain, formula logic, filters, owners, lineage, caveats, and validation requirements.", "📚", 7, [
    { id: "fields_metrics_inventory", label: "Fields / Metrics Inventory", type: "textarea", placeholder: "Column names, measures, business terms, current definitions, formulas, examples, and conflicts.", required: true },
    { id: "source_grain_context", label: "Sources / Grain / Context", type: "textarea", placeholder: "Tables, primary keys, event or snapshot grain, date logic, joins, dimensions, and owners.", required: true },
    { id: "governance_requirements", label: "Governance / Usage Requirements", type: "textarea", placeholder: "Certification, privacy, access, refresh, acceptable use, naming, versioning, and review cadence.", required: false },
    ...commonTail,
  ], ["metric-dictionary", "business-glossary-generator"]),

  t("data-quality-audit-planner", "Data Quality Audit Planner", "Design a risk-based audit for completeness, validity, consistency, uniqueness, timeliness, integrity, drift, and business-rule conformance.", "🧪", 9, [
    { id: "data_assets_purpose", label: "Data Assets / Business Purpose", type: "textarea", placeholder: "Datasets, pipelines, reports, critical decisions, consumers, and consequences of bad data.", required: true },
    { id: "known_rules_issues", label: "Known Rules / Issues", type: "textarea", placeholder: "Keys, accepted values, ranges, cross-field rules, SLAs, reconciliation expectations, incidents, and suspected defects.", required: true },
    { id: "audit_constraints", label: "Audit Scope / Constraints", type: "textarea", placeholder: "Environment, access, tools, sample limits, privacy, owners, deadlines, and remediation process.", required: false },
    ...commonTail,
  ], ["data-quality-plan", "dataset-audit-generator"]),

  t("data-cleaning-transformation-plan-generator", "Data Cleaning & Transformation Plan Generator", "Create a reproducible transformation plan for parsing, normalization, deduplication, type handling, joins, derived fields, and validation.", "🧹", 9, [
    { id: "raw_data_structure", label: "Raw Data Structure / Sample", type: "textarea", placeholder: "Columns, types, representative rows, delimiters, encodings, source systems, and file or table grain.", required: true },
    { id: "target_analysis_model", label: "Target Analysis / Model", type: "textarea", placeholder: "Required outputs, target schema, dimensions, measures, reporting grain, and downstream consumers.", required: true },
    { id: "known_quality_rules", label: "Known Quality / Business Rules", type: "textarea", placeholder: "Null policy, duplicates, valid ranges, mappings, date logic, exclusions, joins, and reconciliation totals.", required: false },
    ...commonTail,
  ], ["data-preparation-plan", "etl-cleaning-plan"]),

  t("missing-data-outlier-review-generator", "Missing Data & Outlier Review Generator", "Assess missingness and unusual values without automatically deleting, imputing, winsorizing, or calling legitimate extremes errors.", "🔍", 7, [
    { id: "dataset_profile_sample", label: "Dataset Profile / Sample", type: "textarea", placeholder: "Columns, types, row counts, missing counts, distributions, sample records, and relevant grouping variables.", required: true },
    { id: "business_measurement_context", label: "Business / Measurement Context", type: "textarea", placeholder: "How values are created, valid limits, seasonality, operational events, censoring, and collection changes.", required: true },
    { id: "analysis_use_risk", label: "Analysis Use / Risk", type: "textarea", placeholder: "Reporting, prediction, experimentation, finance, compliance, decisions, and consequences of treatment choices.", required: false },
    ...commonTail,
  ], ["outlier-analysis-plan", "missingness-audit"]),

  t("exploratory-data-analysis-planner", "Exploratory Data Analysis Planner", "Build a disciplined EDA sequence covering grain, quality, distributions, relationships, segments, time, anomalies, and decision-relevant hypotheses.", "🔬", 9, [
    { id: "analysis_question_dataset", label: "Analysis Question / Dataset", type: "textarea", placeholder: "Decision, entities, date range, measures, dimensions, grain, and dataset description or sample.", required: true },
    { id: "business_definitions_hypotheses", label: "Definitions / Prior Hypotheses", type: "textarea", placeholder: "Metric logic, expected patterns, important segments, known events, and questions from stakeholders.", required: true },
    { id: "constraints_tools", label: "Constraints / Tools", type: "textarea", placeholder: "SQL, Python, spreadsheet, BI tool, privacy, performance, sample limits, and delivery format.", required: false },
    ...commonTail,
  ], ["eda-plan", "exploratory-analysis-generator"]),

  t("descriptive-statistics-interpretation-generator", "Descriptive Statistics Interpretation Generator", "Interpret supplied summaries with units, denominators, distribution shape, uncertainty, subgroup context, and business significance.", "📊", 7, [
    { id: "statistics_tables", label: "Statistics / Tables", type: "textarea", placeholder: "Counts, means, medians, percentiles, spread, rates, intervals, group summaries, and units.", required: true },
    { id: "population_measurement_context", label: "Population / Measurement Context", type: "textarea", placeholder: "Who or what is measured, inclusion rules, time range, grain, missingness, weighting, and collection process.", required: true },
    { id: "decision_questions", label: "Decision Questions", type: "textarea", placeholder: "What stakeholders need to understand, compare, monitor, or decide.", required: false },
    ...commonTail,
  ], ["statistics-explainer", "summary-statistics-analysis"]),

  t("segmentation-cohort-analysis-planner", "Segmentation & Cohort Analysis Planner", "Design defensible segments or cohorts with eligibility, observation windows, outcomes, leakage controls, comparability, and actionability.", "👥", 9, [
    { id: "business_goal_entities", label: "Business Goal / Entities", type: "textarea", placeholder: "Customer, account, product, order, campaign, employee, or another entity; include the decision and desired action.", required: true },
    { id: "variables_events_windows", label: "Variables / Events / Windows", type: "textarea", placeholder: "Attributes, behaviours, acquisition dates, lifecycle events, exposure, outcomes, observation and follow-up windows.", required: true },
    { id: "segment_constraints", label: "Constraints / Fairness / Privacy", type: "textarea", placeholder: "Minimum size, stability, sensitive attributes, prohibited uses, operational capacity, and review rules.", required: false },
    ...commonTail,
  ], ["cohort-analysis-plan", "customer-segmentation-planner"]),

  t("time-series-trend-seasonality-analyzer", "Time-Series Trend & Seasonality Analyzer", "Create a source-bounded review of trend, seasonality, calendar effects, structural breaks, anomalies, comparability, and next tests.", "📈", 9, [
    { id: "time_series_data_summary", label: "Time-Series Data / Summary", type: "textarea", placeholder: "Date grain, values, units, start/end, missing periods, sample rows, aggregates, and relevant dimensions.", required: true },
    { id: "events_definition_changes", label: "Events / Definition Changes", type: "textarea", placeholder: "Campaigns, launches, outages, holidays, pricing, policy, tracking changes, backfills, and source migrations.", required: true },
    { id: "analysis_objective", label: "Analysis Objective", type: "textarea", placeholder: "Monitoring, explanation, planning, anomaly review, forecasting readiness, or decision support.", required: false },
    ...commonTail,
  ], ["trend-analysis", "seasonality-review"]),

  t("forecasting-experiment-planner", "Forecasting Experiment Planner", "Plan a forecast with target, horizon, baselines, backtesting, leakage prevention, uncertainty, scenario use, and monitoring.", "🔮", 9, [
    { id: "forecast_target_horizon", label: "Target / Horizon / Decision", type: "textarea", placeholder: "What is forecast, unit, grain, horizon, refresh cadence, decision, and cost of over/under prediction.", required: true },
    { id: "history_drivers_constraints", label: "History / Drivers / Constraints", type: "textarea", placeholder: "Available history, seasonality, known future inputs, promotions, capacity, censoring, sparse series, and hierarchy.", required: true },
    { id: "evaluation_deployment", label: "Evaluation / Deployment Context", type: "textarea", placeholder: "Baselines, metrics, validation windows, operational use, retraining, overrides, and monitoring.", required: false },
    ...commonTail,
  ], ["forecast-design", "time-series-forecast-plan"]),

  t("ab-test-analysis-planner", "A/B Test Analysis Planner", "Create an experiment-analysis plan with estimand, unit, randomization, exposure, guardrails, sample requirements, stopping rules, and interpretation limits.", "🧫", 9, [
    { id: "experiment_hypothesis_design", label: "Experiment / Hypothesis / Design", type: "textarea", placeholder: "Control, variants, unit of randomization, eligibility, exposure, assignment, hypothesis, and decision.", required: true },
    { id: "metrics_data_windows", label: "Metrics / Data / Windows", type: "textarea", placeholder: "Primary outcome, guardrails, event definitions, attribution, pre-period, test duration, follow-up, and missingness.", required: true },
    { id: "risks_analysis_rules", label: "Risks / Analysis Rules", type: "textarea", placeholder: "Power assumptions, interference, novelty, peeking, multiple testing, exclusions, SRM, and rollout policy.", required: false },
    ...commonTail,
  ], ["experiment-analysis-plan", "split-test-analysis"]),

  t("correlation-causation-audit-generator", "Correlation & Causation Audit Generator", "Audit whether an analytical claim is descriptive, associational, predictive, or causal and identify confounding, selection, timing, and identification gaps.", "⚖️", 7, [
    { id: "claim_analysis_result", label: "Claim / Analysis Result", type: "textarea", placeholder: "Exact claim, reported relationship, model or chart, effect estimate, variables, and interpretation.", required: true },
    { id: "data_generation_design", label: "Data Generation / Study Design", type: "textarea", placeholder: "Observational or experimental design, sampling, assignment, measurement timing, controls, exclusions, and missing data.", required: true },
    { id: "alternative_explanations", label: "Known Alternative Explanations", type: "textarea", placeholder: "Confounders, reverse causality, trends, selection, measurement change, leakage, and operational events.", required: false },
    ...commonTail,
  ], ["causal-claim-audit", "correlation-review"]),

  t("root-cause-analysis-generator", "Root Cause Analysis Generator", "Structure an evidence-led root-cause investigation using timelines, segmentation, process evidence, competing hypotheses, and verification tests.", "🧩", 7, [
    { id: "problem_signal_impact", label: "Problem / Signal / Impact", type: "textarea", placeholder: "What changed, when, where, severity, affected entities, metric definition, and business impact.", required: true },
    { id: "available_evidence_timeline", label: "Evidence / Timeline", type: "textarea", placeholder: "Charts, logs, releases, campaigns, incidents, segments, process changes, interviews, and known non-causes.", required: true },
    { id: "investigation_constraints", label: "Investigation Constraints", type: "textarea", placeholder: "Access, deadlines, systems, owners, reversibility, safety, compliance, and decision thresholds.", required: false },
    ...commonTail,
  ], ["analytics-root-cause", "metric-drop-investigation"]),

  t("kpi-framework-metric-tree-generator", "KPI Framework & Metric Tree Generator", "Define governed outcome, driver, diagnostic, guardrail, and health metrics with formulas, ownership, cadence, targets, and decision rules.", "🎯", 9, [
    { id: "business_objective_model", label: "Business Objective / Operating Model", type: "textarea", placeholder: "Strategy, value creation, customer journey, operating process, constraints, and decisions.", required: true },
    { id: "existing_metrics_definitions", label: "Existing Metrics / Definitions", type: "textarea", placeholder: "Current KPIs, formulas, sources, targets, conflicts, gaming risks, owners, and known gaps.", required: true },
    { id: "measurement_governance", label: "Measurement / Governance Needs", type: "textarea", placeholder: "Cadence, drill paths, segmentation, target setting, certification, access, and review process.", required: false },
    ...commonTail,
  ], ["metric-tree-generator", "kpi-design-framework"], [{ label: "Create the dashboard blueprint", href: "/tools/kpi-dashboard-blueprint-generator", description: "Turn governed metrics into a decision-oriented dashboard." }]),

  t("executive-dashboard-requirements-generator", "Executive Dashboard Requirements Generator", "Create a decision-first dashboard specification with audience, questions, KPI definitions, drill paths, exceptions, context, refresh, and governance.", "🖥️", 9, [
    { id: "executive_decisions_questions", label: "Executive Decisions / Questions", type: "textarea", placeholder: "Recurring decisions, strategic questions, meeting cadence, thresholds, and actions.", required: true },
    { id: "metrics_data_availability", label: "Metrics / Data Availability", type: "textarea", placeholder: "Definitions, sources, refresh, dimensions, history, targets, forecasts, quality, and access.", required: true },
    { id: "delivery_constraints", label: "Delivery / Governance Constraints", type: "textarea", placeholder: "BI platform, screen size, permissions, performance, export, accessibility, owners, and certification.", required: false },
    ...commonTail,
  ], ["executive-bi-dashboard-brief", "dashboard-requirements"]),

  t("dashboard-story-layout-planner", "Dashboard Story & Layout Planner", "Plan reading order, visual hierarchy, context, annotations, filters, interactions, exceptions, and responsive layout without decorative chart clutter.", "🧭", 7, [
    { id: "dashboard_purpose_audience", label: "Dashboard Purpose / Audience", type: "textarea", placeholder: "Decisions, users, cadence, device, meeting context, and expected actions.", required: true },
    { id: "metrics_dimensions_questions", label: "Metrics / Dimensions / Questions", type: "textarea", placeholder: "KPIs, comparisons, trends, drivers, segments, targets, alerts, and drill-down needs.", required: true },
    { id: "design_interaction_constraints", label: "Design / Interaction Constraints", type: "textarea", placeholder: "Brand, accessibility, chart restrictions, filters, tooltips, exports, density, and screen sizes.", required: false },
    ...commonTail,
  ], ["dashboard-layout-generator", "bi-story-planner"]),

  t("bi-report-requirements-generator", "BI Report Requirements Generator", "Create implementation-ready requirements for report pages, measures, filters, security, refresh, testing, performance, and acceptance.", "📋", 9, [
    { id: "report_scope_users", label: "Report Scope / Users", type: "textarea", placeholder: "Business process, audiences, decisions, pages, cadence, channels, and current pain points.", required: true },
    { id: "data_metrics_logic", label: "Data / Metrics / Business Logic", type: "textarea", placeholder: "Sources, keys, grain, calculations, filters, hierarchies, targets, and required historical logic.", required: true },
    { id: "platform_nonfunctional", label: "Platform / Non-Functional Requirements", type: "textarea", placeholder: "Power BI, Tableau, Looker or other; refresh, RLS, performance, mobile, export, accessibility, and support.", required: false },
    ...commonTail,
  ], ["bi-report-specification", "analytics-report-requirements"]),

  t("sql-analysis-query-planner", "SQL Analysis Query Planner", "Translate an analytical question into source-aware SQL logic with grain, joins, filters, windows, validation queries, and dialect notes.", "🧮", 7, [
    { id: "analysis_question_output", label: "Analysis Question / Required Output", type: "textarea", placeholder: "Metrics, dimensions, date range, grain, comparison, cohort, funnel, or requested result shape.", required: true },
    { id: "schema_tables_relationships", label: "Schema / Tables / Relationships", type: "textarea", placeholder: "Dialect, tables, columns, keys, grain, relationships, partitions, nulls, and known business logic.", required: true },
    { id: "query_constraints_validation", label: "Constraints / Validation", type: "textarea", placeholder: "Performance, incremental dates, exclusions, expected totals, privacy, output limits, and validation checks.", required: false },
    ...commonTail,
  ], ["sql-query-generator-plan", "analytics-sql-planner"]),

  t("sql-query-review-optimization-generator", "SQL Query Review & Optimization Generator", "Review supplied SQL for correctness, grain, join inflation, null logic, filters, window semantics, readability, performance, and validation.", "🔧", 9, [
    { id: "sql_query", label: "SQL Query", type: "textarea", placeholder: "Paste the complete query. Remove secrets and sensitive literals before submitting.", required: true },
    { id: "schema_intended_result", label: "Schema / Intended Result", type: "textarea", placeholder: "Dialect, relevant table grain, keys, expected output grain, metric definitions, and sample expected results.", required: true },
    { id: "performance_environment", label: "Performance / Environment", type: "textarea", placeholder: "Warehouse, data volume, partitions, clustering/indexes, execution symptoms, and acceptable trade-offs.", required: false },
    ...commonTail,
  ], ["sql-code-review", "query-optimization-review"]),

  t("data-model-star-schema-planner", "Data Model & Star Schema Planner", "Design a governed analytical model with facts, dimensions, grain, conformed dimensions, relationships, slowly changing attributes, and measure ownership.", "⭐", 9, [
    { id: "business_process_questions", label: "Business Process / Questions", type: "textarea", placeholder: "Processes, events, snapshots, decisions, metrics, drill paths, and reporting requirements.", required: true },
    { id: "source_entities_grain", label: "Source Entities / Grain", type: "textarea", placeholder: "Tables, keys, entities, event grain, snapshots, relationships, history, and source limitations.", required: true },
    { id: "platform_governance_constraints", label: "Platform / Governance Constraints", type: "textarea", placeholder: "Warehouse/BI platform, scale, latency, RLS, history, naming, ownership, and compatibility.", required: false },
    ...commonTail,
  ], ["star-schema-generator", "semantic-data-model-planner"]),

  t("semantic-layer-metric-store-planner", "Semantic Layer & Metric Store Planner", "Define reusable dimensions, measures, entities, joins, access rules, time semantics, certification, tests, and change governance.", "🧱", 9, [
    { id: "analytics_consumers_use_cases", label: "Consumers / Use Cases", type: "textarea", placeholder: "Dashboards, notebooks, reverse ETL, embedded analytics, experimentation, finance, and self-service needs.", required: true },
    { id: "metrics_dimensions_models", label: "Metrics / Dimensions / Models", type: "textarea", placeholder: "Definitions, formulas, entities, grains, joins, filters, time logic, and source models.", required: true },
    { id: "governance_platform", label: "Governance / Platform", type: "textarea", placeholder: "Looker, Power BI, dbt Semantic Layer or other; ownership, certification, access, versioning, and deprecation.", required: false },
    ...commonTail,
  ], ["semantic-model-planner", "metric-store-design"]),

  t("etl-elt-pipeline-requirements-generator", "ETL / ELT Pipeline Requirements Generator", "Create a reliable ingestion and transformation specification covering contracts, incremental logic, orchestration, observability, recovery, and ownership.", "🔄", 9, [
    { id: "sources_targets_sla", label: "Sources / Targets / SLA", type: "textarea", placeholder: "Systems, files, APIs, tables, volume, frequency, latency, history, destination, and consumers.", required: true },
    { id: "transformations_business_rules", label: "Transformations / Business Rules", type: "textarea", placeholder: "Parsing, mappings, joins, deduplication, change capture, derived fields, privacy, and reconciliations.", required: true },
    { id: "operations_constraints", label: "Operations / Constraints", type: "textarea", placeholder: "Orchestrator, retries, idempotency, backfill, alerts, cost, security, environments, and ownership.", required: false },
    ...commonTail,
  ], ["data-pipeline-spec", "etl-requirements"]),

  t("dbt-model-test-documentation-planner", "dbt Model, Test & Documentation Planner", "Plan staging, intermediate and mart models with contracts, tests, freshness, exposures, documentation, lineage, and deployment checks.", "🏗️", 9, [
    { id: "sources_business_models", label: "Sources / Business Models", type: "textarea", placeholder: "Source tables, keys, grain, target marts, business entities, dimensions, facts, and metrics.", required: true },
    { id: "quality_deployment_requirements", label: "Quality / Deployment Requirements", type: "textarea", placeholder: "Tests, freshness, contracts, CI, environments, incremental strategy, snapshots, ownership, and SLAs.", required: true },
    { id: "project_conventions", label: "Project / Platform Conventions", type: "textarea", placeholder: "Warehouse dialect, naming, folder structure, tags, packages, macros, exposures, and documentation rules.", required: false },
    ...commonTail,
  ], ["dbt-project-planner", "analytics-engineering-plan"]),

  t("data-validation-reconciliation-plan-generator", "Data Validation & Reconciliation Plan Generator", "Create source-to-target, period-over-period, cross-system, and business-total checks with tolerances, ownership, and incident handling.", "✅", 9, [
    { id: "systems_datasets_flow", label: "Systems / Datasets / Flow", type: "textarea", placeholder: "Sources, transformations, targets, keys, grain, timing, currencies, units, and known control totals.", required: true },
    { id: "critical_metrics_rules", label: "Critical Metrics / Rules", type: "textarea", placeholder: "Counts, amounts, balances, uniqueness, status transitions, accepted values, and expected relationships.", required: true },
    { id: "tolerances_operations", label: "Tolerances / Operations", type: "textarea", placeholder: "Exact or percentage tolerance, latency, exceptions, sign-off, alerting, ownership, and remediation SLA.", required: false },
    ...commonTail,
  ], ["data-reconciliation-plan", "analytics-validation-checklist"]),

  t("spreadsheet-analysis-formula-planner", "Spreadsheet Analysis & Formula Planner", "Design an auditable spreadsheet model with inputs, transformations, formulas, checks, named logic, error handling, and documentation.", "📑", 7, [
    { id: "workbook_goal_structure", label: "Workbook Goal / Structure", type: "textarea", placeholder: "Decision, sheets, input sources, users, update process, output tables, and required calculations.", required: true },
    { id: "fields_rules_examples", label: "Fields / Rules / Examples", type: "textarea", placeholder: "Columns, sample rows, formulas needed, date/currency rules, lookups, exceptions, and expected results.", required: true },
    { id: "platform_constraints", label: "Platform / Constraints", type: "textarea", placeholder: "Excel or Google Sheets, locale, version, array formulas, macros/scripts, collaboration, and protection.", required: false },
    ...commonTail,
  ], ["excel-formula-plan", "google-sheets-analysis-plan"]),

  t("pivot-table-analysis-plan-generator", "Pivot Table & Analysis Plan Generator", "Create a pivot analysis design with row, column, value, filter, grouping, calculated-field, drill, and validation logic.", "🔢", 5, [
    { id: "dataset_columns_grain", label: "Dataset Columns / Grain", type: "textarea", placeholder: "Fields, types, sample values, unique keys, date grain, measures, dimensions, and row meaning.", required: true },
    { id: "analysis_questions", label: "Analysis Questions", type: "textarea", placeholder: "Comparisons, trends, contribution, mix, variance, ranking, cohorts, exceptions, or drill-down needs.", required: true },
    { id: "output_constraints", label: "Output / Tool Constraints", type: "textarea", placeholder: "Excel, Sheets or BI tool, refresh, slicers, chart needs, calculated fields, and stakeholder skill level.", required: false },
    ...commonTail,
  ], ["pivot-table-planner", "spreadsheet-pivot-analysis"]),

  t("business-performance-review-generator", "Business Performance Review Generator", "Turn supplied KPI results into an executive performance review with context, variance, drivers, risks, decisions, and accountable next actions.", "🏢", 9, [
    { id: "performance_results_targets", label: "Performance Results / Targets", type: "textarea", placeholder: "Actuals, targets, prior periods, forecast, units, definitions, segments, and time range.", required: true },
    { id: "business_events_driver_evidence", label: "Business Events / Driver Evidence", type: "textarea", placeholder: "Pricing, volume, mix, campaigns, capacity, outages, launches, external events, and supporting analysis.", required: true },
    { id: "review_decisions", label: "Review / Decision Context", type: "textarea", placeholder: "Audience, meeting cadence, decisions, constraints, owners, and required follow-up.", required: false },
    ...commonTail,
  ], ["monthly-business-review", "kpi-performance-review"]),

  t("sales-revenue-analysis-planner", "Sales & Revenue Analysis Planner", "Plan revenue, bookings, pipeline, conversion, price-volume-mix, retention, territory, product, rep, and forecast analysis.", "💰", 9, [
    { id: "sales_model_questions", label: "Sales Model / Questions", type: "textarea", placeholder: "Business model, funnel, channels, products, territories, quotas, lifecycle, and decisions.", required: true },
    { id: "data_metrics_definitions", label: "Data / Metrics / Definitions", type: "textarea", placeholder: "CRM, orders, invoices, contracts, opportunities, stage history, dates, currency, returns, and definitions.", required: true },
    { id: "constraints_risks", label: "Constraints / Risks", type: "textarea", placeholder: "Attribution, duplicate accounts, split credit, seasonality, currency, censoring, privacy, and target changes.", required: false },
    ...commonTail,
  ], ["revenue-analytics-plan", "sales-performance-analysis"]),

  t("marketing-analytics-plan-generator", "Marketing Analytics Plan Generator", "Design channel, campaign, funnel, attribution, incrementality, creative, cohort, and efficiency analysis with tracking and privacy checks.", "📣", 9, [
    { id: "marketing_decisions_journey", label: "Marketing Decisions / Journey", type: "textarea", placeholder: "Channels, campaigns, audiences, journey stages, offers, conversion events, and decisions.", required: true },
    { id: "tracking_cost_outcome_data", label: "Tracking / Cost / Outcome Data", type: "textarea", placeholder: "UTMs, ad platforms, analytics, CRM, spend, impressions, clicks, leads, revenue, consent, and windows.", required: true },
    { id: "measurement_constraints", label: "Measurement Constraints", type: "textarea", placeholder: "Attribution limits, walled gardens, identity, cookie loss, experiments, seasonality, overlap, and privacy.", required: false },
    ...commonTail,
  ], ["campaign-analytics-plan", "marketing-performance-analysis"]),

  t("customer-product-analytics-plan-generator", "Customer & Product Analytics Plan Generator", "Design acquisition, activation, engagement, retention, churn, feature, funnel, journey, and cohort analysis with event-quality controls.", "🧑‍💻", 9, [
    { id: "product_customer_questions", label: "Product / Customer Questions", type: "textarea", placeholder: "Product model, lifecycle, user roles, jobs, behaviours, value moments, and decisions.", required: true },
    { id: "events_entities_metrics", label: "Events / Entities / Metrics", type: "textarea", placeholder: "Event taxonomy, users/accounts, sessions, features, subscriptions, outcomes, dates, identities, and definitions.", required: true },
    { id: "analysis_constraints", label: "Analysis Constraints", type: "textarea", placeholder: "Instrumentation gaps, bot/internal traffic, multiple devices, censoring, privacy, experiments, and sparse usage.", required: false },
    ...commonTail,
  ], ["product-analytics-plan", "customer-behavior-analysis"]),

  t("operations-inventory-analytics-planner", "Operations & Inventory Analytics Planner", "Plan service, throughput, cycle time, capacity, quality, inventory, fulfilment, waste, backlog, and exception analysis.", "⚙️", 9, [
    { id: "operating_process_decisions", label: "Operating Process / Decisions", type: "textarea", placeholder: "Workflow, locations, resources, constraints, service levels, inventory policy, and decisions.", required: true },
    { id: "events_stock_cost_data", label: "Events / Stock / Cost Data", type: "textarea", placeholder: "Timestamps, statuses, quantities, locations, SKUs, orders, capacity, defects, costs, and units.", required: true },
    { id: "process_data_constraints", label: "Process / Data Constraints", type: "textarea", placeholder: "Late updates, batch timing, substitutions, backorders, seasonality, downtime, censoring, and data gaps.", required: false },
    ...commonTail,
  ], ["operations-analysis-plan", "inventory-analytics-plan"]),

  t("executive-insight-decision-memo-generator", "Executive Insight & Decision Memo Generator", "Convert supplied analysis into a concise decision memo separating evidence, interpretation, uncertainty, options, recommendation, and monitoring.", "📝", 7, [
    { id: "analysis_findings_evidence", label: "Analysis Findings / Evidence", type: "textarea", placeholder: "Verified results, tables, charts, confidence intervals, definitions, segments, caveats, and source references.", required: true },
    { id: "decision_options_constraints", label: "Decision / Options / Constraints", type: "textarea", placeholder: "Decision owner, alternatives, costs, risks, reversibility, timing, capacity, and strategic context.", required: true },
    { id: "recommendation_requirements", label: "Recommendation / Communication Requirements", type: "textarea", placeholder: "Required format, length, approval, actions, owners, milestones, and monitoring metrics.", required: false },
    ...commonTail,
  ], ["analytics-decision-memo", "executive-data-insight-summary"]),

  t("kpi-dashboard-blueprint-generator", "KPI Dashboard Blueprint Generator", "Create a deterministic dashboard wireframe linking decisions, governed KPIs, trends, drivers, exceptions, filters, and actions.", "🖥️", 9, [
    { id: "dashboard_decisions_audience", label: "Dashboard Decisions / Audience", type: "textarea", placeholder: "Users, recurring decisions, meeting cadence, devices, questions, actions, and escalation needs.", required: true },
    { id: "metrics_definitions_data", label: "Metrics / Definitions / Data", type: "textarea", placeholder: "Exact KPI names, formulas, units, targets, dimensions, trends, drivers, source IDs, refresh, and caveats.", required: true },
    { id: "layout_interaction_requirements", label: "Layout / Interaction Requirements", type: "textarea", placeholder: "Pages, filters, drill paths, alerts, responsive behaviour, accessibility, platform, and density.", required: false },
    { id: "chart_count", label: "Visual Count", type: "select", required: true, options: chartCountOptions },
    ...commonTail,
  ], ["dashboard-wireframe-generator", "executive-dashboard-blueprint"]),

  t("data-story-chart-pack-generator", "Data Story Chart Pack Generator", "Create a deterministic chart pack from supplied values with correct chart selection, scales, annotations, uncertainty, and source boundaries.", "📊", 9, [
    { id: "story_question_audience", label: "Story Question / Audience", type: "textarea", placeholder: "Decision, narrative purpose, audience, sequence, and action expected from the chart pack.", required: true },
    { id: "data_values_definitions", label: "Data Values / Definitions", type: "textarea", placeholder: "Supply exact labelled values, dates, units, denominators, groups, targets, intervals, and source IDs.", required: true },
    { id: "chart_constraints", label: "Chart / Communication Constraints", type: "textarea", placeholder: "Permitted chart types, accessibility, brand, comparison baseline, annotations, export, and prohibited transformations.", required: false },
    { id: "chart_count", label: "Chart Count", type: "select", required: true, options: chartCountOptions },
    ...commonTail,
  ], ["chart-pack-generator", "data-story-visualizer"]),

  t("metric-tree-driver-diagram-generator", "Metric Tree & Driver Diagram Generator", "Create a deterministic driver tree separating outcomes, mathematical components, operational drivers, diagnostics, and guardrails.", "🌳", 9, [
    { id: "outcome_decision", label: "Outcome / Decision", type: "textarea", placeholder: "Primary outcome, business model, decision, unit, time grain, and intended use.", required: true },
    { id: "metrics_relationships_formulas", label: "Metrics / Relationships / Formulas", type: "textarea", placeholder: "Supply exact metric definitions, arithmetic decompositions, hypothesized drivers, diagnostics, guardrails, and source IDs.", required: true },
    { id: "governance_priorities", label: "Governance / Priorities", type: "textarea", placeholder: "Owners, targets, cadence, controllability, leading/lagging status, gaming risks, and verification needs.", required: false },
    { id: "node_count", label: "Target Diagram Size", type: "select", required: true, options: nodeCountOptions },
    ...commonTail,
  ], ["driver-tree-generator", "kpi-tree-diagram"]),

  t("data-lineage-model-map-generator", "Data Lineage & Model Map Generator", "Create a deterministic source-to-report map for systems, ingestion, transformations, models, metrics, dashboards, owners, and controls.", "🕸️", 9, [
    { id: "lineage_scope_purpose", label: "Lineage Scope / Purpose", type: "textarea", placeholder: "Data product, report, metric, domain, incident, migration, governance or impact-analysis boundary.", required: true },
    { id: "systems_models_dependencies", label: "Systems / Models / Dependencies", type: "textarea", placeholder: "Supply exact sources, tables, jobs, transformations, models, metrics, reports, identifiers, owners, and relationships.", required: true },
    { id: "controls_unknowns", label: "Controls / Unknowns", type: "textarea", placeholder: "Freshness, tests, contracts, access, PII, SLAs, incidents, undocumented links, and areas requiring verification.", required: false },
    { id: "node_count", label: "Target Map Size", type: "select", required: true, options: nodeCountOptions },
    ...commonTail,
  ], ["data-lineage-diagram", "analytics-model-map"]),
];
