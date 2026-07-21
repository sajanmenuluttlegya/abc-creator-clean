from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match in {path}, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_all_exact(path: Path, old: str, new: str, expected: int, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} matches in {path}, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")


# ---------------------------------------------------------------------------
# 1) Restore protected Blog output presentation and add only free Edit + paid
#    Regenerate. Existing visual/table/editor behavior remains untouched.
# ---------------------------------------------------------------------------
preset = APP / "components/PresetBlogOutputPanel.tsx"
replace_once(
    preset,
    '  const [editDraft, setEditDraft] = useState("");\n  const exportContentRef = useRef<HTMLDivElement | null>(null);',
    '  const [editDraft, setEditDraft] = useState("");\n  const [isRegenerating, setIsRegenerating] = useState(false);\n  const exportContentRef = useRef<HTMLDivElement | null>(null);',
    "preset blog regeneration state",
)
replace_once(
    preset,
    '  const undoManualEdit = () => { if (!previousManualOutput) return; setManualOutput(previousManualOutput); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); };\n\n  const copyOutput = async () => {',
    '''  const undoManualEdit = () => { if (!previousManualOutput) return; setManualOutput(previousManualOutput); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); };\n\n  const regenerateOutput = async () => {\n    if (!displayOutput.trim() || isRegenerating) return;\n    setIsRegenerating(true);\n    setDownloadError("");\n    try {\n      const response = await fetch("/api/generate/section-regenerate", {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({\n          toolSlug,\n          sectionText: displayOutput,\n          instruction: "Regenerate the complete blog output while preserving the selected tool purpose, user inputs, factual constraints, structure quality, useful visuals/tables, and professional formatting. Return only the complete replacement output.",\n        }),\n      });\n      const data = (await response.json()) as { ok?: boolean; text?: string; error?: string; details?: string };\n      if (!response.ok || !data.ok || !data.text?.trim()) throw new Error([data.error || "Regeneration failed.", data.details].filter(Boolean).join(" "));\n      setPreviousManualOutput(displayOutput);\n      setManualOutput(data.text.trim());\n      setIsEditingText(false);\n      setEditDraft("");\n    } catch (error) {\n      setDownloadError(error instanceof Error ? error.message : "Regeneration failed. Please try again.");\n    } finally {\n      setIsRegenerating(false);\n    }\n  };\n\n  const copyOutput = async () => {''',
    "preset blog regenerate handler",
)
replace_once(
    preset,
    '            <button type="button" onClick={openManualEdit} className="rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white">Edit</button>\n            {previousManualOutput ? <button type="button" onClick={undoManualEdit} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-300">Undo edit</button> : null}',
    '            <button type="button" onClick={openManualEdit} className="rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white">Edit</button>\n            <button type="button" onClick={() => void regenerateOutput()} disabled={isRegenerating || isLoading || isErrorOutput} className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-55">{isRegenerating ? "Regenerating..." : "Regenerate — 2 credits"}</button>\n            {previousManualOutput ? <button type="button" onClick={undoManualEdit} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-300">Undo edit</button> : null}',
    "preset blog edit alongside regenerate",
)
replace_once(
    preset,
    'className="abc-download-control cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"',
    'className="cursor-pointer rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"',
    "restore preset blog download styling",
)

# ---------------------------------------------------------------------------
# 2) Scope newer-workspace wording/download upgrades away from protected old
#    tools. Blog next actions retain their old presentation; non-blog text
#    tools keep the approved unboxed continuation treatment.
# ---------------------------------------------------------------------------
out = APP / "components/OutputPanel.tsx"
replace_once(
    out,
    'import type { RecommendedNextAction } from "@/lib/tools/public-tools";',
    'import { getToolBySlug, type RecommendedNextAction } from "@/lib/tools/public-tools";',
    "OutputPanel tool metadata import",
)
replace_once(
    out,
    'const BLOG_IMAGE_OUTPUT_TOOL_SET = new Set<string>(BLOG_IMAGE_OUTPUT_TOOLS);\n',
    '''const BLOG_IMAGE_OUTPUT_TOOL_SET = new Set<string>(BLOG_IMAGE_OUTPUT_TOOLS);\nconst MODERN_OUTPUT_CATEGORIES = new Set([\n  "Personal Productivity Planning Tools", "Career / Professional Tools", "Interior / Architecture Tools", "Interior Architecture Tools",\n  "Food / Hospitality Creator Tools", "Food / Hospitality Tools", "Fashion / Apparel Creator Tools", "Fashion / Apparel Tools",\n  "Marketing Campaign Tools", "Research / Knowledge Tools", "Education / Learning Tools", "Data Analysis / Business Intelligence Tools",\n  "Finance / Accounting Tools", "Legal / Compliance Tools", "Customer Support / Service Operations Tools",\n  "Sales / CRM / Revenue Operations Tools", "HR / People Operations Tools", "Cybersecurity / IT Operations Tools",\n  "Presentation / Pitch Creator Tools", "Poster / Promotional Design Tools",\n]);\n\nfunction toolCategory(toolSlug: string) { return getToolBySlug(toolSlug)?.category || ""; }\nfunction isModernOutputTool(toolSlug: string) { return MODERN_OUTPUT_CATEGORIES.has(toolCategory(toolSlug)); }\nfunction isBlogWorkflowTool(toolSlug: string) { return toolCategory(toolSlug) === "Blog Workflow"; }\n''',
    "OutputPanel category scoping",
)
replace_once(
    out,
    'function cleanOutputForDisplay(value: string) {',
    'function cleanOutputForDisplay(value: string, toolSlug: string) {',
    "OutputPanel cleaner signature",
)
replace_once(
    out,
    '  return kept.join("\\n").replace(/^(#{1,6}\\s+)ultra[-\\s]*premium\\s+/gim, "$1").replace(/^(#{1,6}\\s+)premium\\s+(output|result|deliverable|canvas|studio)\\b/gim, "$1$2").replace(/\\n{4,}/g, "\\n\\n\\n").trim();',
    '  const cleaned = kept.join("\\n").replace(/\\n{4,}/g, "\\n\\n\\n").trim();\n  if (!isModernOutputTool(toolSlug)) return cleaned;\n  return cleaned.replace(/^(#{1,6}\\s+)ultra[-\\s]*premium\\s+/gim, "$1").replace(/^(#{1,6}\\s+)premium\\s+(output|result|deliverable|canvas|studio)\\b/gim, "$1$2").trim();',
    "scope promotional heading cleanup",
)
replace_once(
    out,
    'function defaultRegenerateInstruction(sectionText: string) {\n  return `Rewrite this section to be clearer, more precise, and professional while preserving the same meaning and Markdown heading. If this is book prose, write like a professional author, preserve canon, keep natural paragraphing, and never sound AI-generated.\\n\\n${sectionText}`;\n}',
    '''function defaultRegenerateInstruction(sectionText: string, toolSlug: string) {\n  const instruction = isModernOutputTool(toolSlug)\n    ? "Rewrite this section to be clearer, more precise, and professional while preserving the same meaning and Markdown heading."\n    : "Rewrite this section to be more premium and professional while preserving the same meaning and Markdown heading.";\n  return `${instruction} If this is book prose, write like a professional author, preserve canon, keep natural paragraphing, and never sound AI-generated.\\n\\n${sectionText}`;\n}''',
    "restore protected regeneration instruction",
)
replace_once(
    out,
    '  const displayOutput = useMemo(() => cleanOutputForDisplay(output), [output]);',
    '  const displayOutput = useMemo(() => cleanOutputForDisplay(output, toolSlug), [output, toolSlug]);',
    "OutputPanel cleaner invocation",
)
replace_once(
    out,
    '        setBookTitleOutputOverride(cleanOutputForDisplay(data.text));',
    '        setBookTitleOutputOverride(cleanOutputForDisplay(data.text, toolSlug));',
    "Book Title override cleaner",
)
replace_once(
    out,
    '    setRegenerateInstruction(defaultRegenerateInstruction(block.content));',
    '    setRegenerateInstruction(defaultRegenerateInstruction(block.content, toolSlug));',
    "regenerate instruction invocation",
)
replace_once(
    out,
    '          {showNextActions ? <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div> : null}',
    '''          {showNextActions ? (isBlogWorkflowTool(toolSlug) ? (\n            <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">\n              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">Recommended next actions</h3>\n              <div className="space-y-3">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10"><div className="text-sm font-semibold text-white">{action.label}</div><p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p></Link>)}</div>\n            </div>\n          ) : (\n            <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div>\n          )) : null}''',
    "restore blog next-action presentation",
)

# ---------------------------------------------------------------------------
# 3) Keep newer download styling scoped, while making native and formerly
#    hidden drop-zone inputs use the same neutral chooser without deleting
#    previews, validation, handlers, accepted types, or upload capability.
# ---------------------------------------------------------------------------
css = APP / "app/globals.css"
replace_once(
    css,
    '[data-abc-download-control="true"],.abc-download-control,select[aria-label="Download output"],button[aria-label^="Download"],button[title^="Download"],a[download]{border:1px solid rgba(255,255,255,.18)!important;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;color:#f8fafc!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 38px rgba(0,0,0,.22)!important}',
    '.abc-modern-tool-ui [data-abc-download-control="true"],.abc-modern-tool-ui .abc-download-control,.abc-modern-tool-ui select[aria-label="Download output"],.abc-modern-tool-ui button[aria-label^="Download"],.abc-modern-tool-ui button[title^="Download"],.abc-modern-tool-ui a[download]{border:1px solid rgba(255,255,255,.18)!important;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;color:#f8fafc!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 38px rgba(0,0,0,.22)!important}',
    "scope download styling",
)
css_text = css.read_text(encoding="utf-8")
chooser_addition = '''\n\n/* Convert custom drop-zone file inputs to the same neutral native chooser while preserving previews and handlers. */\nlabel:has(> input[type="file"].absolute),label:has(> input[type="file"].hidden){min-height:0!important;display:flex!important;flex-direction:column!important;place-items:initial!important;overflow:visible!important;border-color:transparent!important;background:transparent!important;box-shadow:none!important;padding:0!important}\nlabel:has(> input[type="file"].absolute) > input[type="file"],label:has(> input[type="file"].hidden) > input[type="file"]{position:static!important;inset:auto!important;display:block!important;opacity:1!important;height:auto!important;margin-top:.75rem!important;pointer-events:auto!important}\nlabel:has(> input[type="file"].absolute) > img,label:has(> input[type="file"].hidden) > img{margin-bottom:.25rem!important}\n'''
if "Convert custom drop-zone file inputs" in css_text:
    raise RuntimeError("neutral hidden/drop-zone chooser rules already present")
css.write_text(css_text.rstrip() + chooser_addition, encoding="utf-8")

# ---------------------------------------------------------------------------
# 4) Reconnect Poster / Promotional tools additively in public registry,
#    server prompt registry, and the shared exact credit calculator.
# ---------------------------------------------------------------------------
public_tools = APP / "lib/tools/public-tools.ts"
replace_once(
    public_tools,
    'import { presentationPitchTools } from "./public-presentation-pitch-tools";\nimport { aiPromptBatchTools } from "./public-ai-prompt-batch-tools";',
    'import { presentationPitchTools } from "./public-presentation-pitch-tools";\nimport { posterPromotionalTools } from "./public-poster-promotional-tools";\nimport { aiPromptBatchTools } from "./public-ai-prompt-batch-tools";',
    "poster public import",
)
replace_once(
    public_tools,
    '  ...presentationPitchTools,\n  ...aiPromptBatchTools,',
    '  ...presentationPitchTools,\n  ...posterPromotionalTools,\n  ...aiPromptBatchTools,',
    "poster public registry spread",
)

server_poster = APP / "lib/tools/server-poster-promotional-tools.ts"
server_poster.write_text('''import { posterPromotionalTools } from "./public-poster-promotional-tools";\n\ntype Rule = { id: string; label: string; required?: boolean; minLength?: number; maxLength?: number };\ntype Prompt = { system: string; outputGuide: string; creditCost: number; requiredInputs: Rule[] };\n\nconst SYSTEM = `You are ABC Creator's senior promotional designer, poster strategist, information-hierarchy specialist, print-production adviser, accessibility reviewer, localisation planner, and brand-integrity lead. Create a professional deliverable grounded only in the supplied facts and source material.\n\nNever invent dates, times, prices, discounts, eligibility, locations, contact details, QR destinations, product capabilities, medical claims, event participants, performers, speakers, sponsors, legal wording, testimonials, awards, availability, stock, property facts, fundraising use, statistics, print specifications, approvals, accessibility compliance, or campaign outcomes. Separate verified facts, user-supplied assumptions, proposed creative options, and missing information. Mark gaps clearly.\n\nDesign for fast comprehension. Establish one primary message, one desired action, and a clear hierarchy across headline, supporting line, essential details, CTA, brand mark, QR/contact route, and required legal copy. Keep poster copy concise and natural. Protect readability, whitespace, contrast, safe areas, distance viewing, multilingual expansion, exact spelling, and editable handoff.\n\nFor print outputs, distinguish final size, bleed, trim, safe area, resolution, colour mode/profile, overprint, fonts, transparency, linked assets, QR/barcode verification, proofing, finishing, packaging, and sign-off. Do not certify accessibility, localisation, legal compliance, printer acceptance, or production readiness from incomplete evidence. Write like a skilled human creative director and production designer.`;\n\nconst GUIDES: Record<string, string> = {\n  "promotional-design-brief-generator": "Return # Promotional Design Brief with objective, audience, context, single-minded message, desired action, evidence, mandatory copy, deliverables, sizes, brand system, visual territory, image requirements, production constraints, accessibility, localisation, approvals, risks, open questions and acceptance criteria.",\n  "poster-copy-message-hierarchy-generator": "Return # Poster Copy & Message Hierarchy with governing message, headline routes, recommended headline, supporting line, essential details, CTA, QR/contact microcopy, legal line, hierarchy order, word-count discipline, readability notes, claims/source register, channel variants and prohibited overclaims.",\n  "poster-layout-art-direction-planner": "Return # Poster Layout & Art Direction with concept, focal point, hierarchy, grid, composition, image treatment, typography, colour roles, text zones, CTA/QR placement, safe areas, distance-viewing logic, responsive crops, accessibility, production notes and avoid list.",\n  "promotional-size-version-plan-generator": "Return # Promotional Size & Version Plan with master asset, channel and placement matrix, dimensions to verify, orientation, crop strategy, safe area, copy length, hierarchy changes, image treatment, CTA, localisation, export format, file naming, owner and approval status.",\n  "print-production-preflight-planner": "Return # Print Production & Preflight Plan with job specification, artwork setup, bleed/trim/safe area, colour, images, fonts, transparency, overprint, QR/barcode, linked assets, finishing, proofing, packaging, vendor questions, preflight checklist, release blockers and sign-off register.",\n  "poster-accessibility-readability-auditor": "Return # Poster Accessibility & Readability Audit with evidence limits, reading order, hierarchy, contrast risks, type-size and viewing-distance review, language clarity, symbol and QR usability, motion/dwell-time concerns, alternative access, issue severity, remediation actions, verification owners and unresolved limitations. Never certify compliance.",\n  "multilingual-localization-poster-planner": "Return # Multilingual Poster Localisation Plan with source-copy lock, terminology, target locales, cultural review, text expansion, script and font support, line-break strategy, date/currency/number formats, image sensitivity, legal review, layout adaptations, review owners, QA checklist and release gates.",\n  "promotional-campaign-asset-rollout-planner": "Return # Promotional Campaign Asset Rollout Plan with phases, asset inventory, master dependencies, owners, copy/design/image/localisation/production workflow, approvals, vendors, release schedule, installation or upload checks, risks, contingency, quality gates and final status register.",\n};\n\nexport const serverPosterPromotionalTools: Record<string, Prompt> = Object.fromEntries(\n  posterPromotionalTools\n    .filter((tool) => tool.outputType === "text")\n    .map((tool) => [\n      tool.slug,\n      {\n        creditCost: tool.displayCreditCost,\n        system: SYSTEM,\n        outputGuide: GUIDES[tool.slug] || `Return a complete professional ${tool.name} grounded only in supplied facts, with assumptions, missing information, decisions, risks, owners, verification notes and next actions.`,\n        requiredInputs: tool.inputs.map((input) => ({\n          id: input.id,\n          label: input.label,\n          required: input.required,\n          minLength: input.required ? (input.type === "textarea" ? 10 : 1) : undefined,\n          maxLength: input.type === "textarea" ? 20000 : 300,\n        })),\n      },\n    ])\n);\n''', encoding="utf-8")

registry = APP / "lib/tools/server-prompt-registry.ts"
replace_once(
    registry,
    'import { serverPresentationPitchVisualTools } from "./server-presentation-pitch-visual-tools";\n',
    'import { serverPresentationPitchVisualTools } from "./server-presentation-pitch-visual-tools";\nimport { serverPosterPromotionalTools } from "./server-poster-promotional-tools";\n',
    "poster server import",
)
replace_once(
    registry,
    ' || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug];',
    ' || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug] || serverPosterPromotionalTools[toolSlug];',
    "poster registered tool lookup",
)
replace_once(
    registry,
    ' || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug] || getBaseServerPrompt(toolSlug);',
    ' || serverPresentationPitchVisualTools[toolSlug] || serverPresentationPitchTools[toolSlug] || serverPosterPromotionalTools[toolSlug] || getBaseServerPrompt(toolSlug);',
    "poster raw prompt lookup",
)

credits = APP / "lib/tools/credit-costs.ts"
replace_once(
    credits,
    'import { PRESENTATION_PITCH_TOOL_CREDIT_COSTS, PRESENTATION_PITCH_TOOL_SLUGS, calculatePresentationPitchToolCreditCost, getPresentationPitchToolBaseCost, isPresentationPitchTool } from "./presentation-pitch-tool-credits";\n',
    'import { PRESENTATION_PITCH_TOOL_CREDIT_COSTS, PRESENTATION_PITCH_TOOL_SLUGS, calculatePresentationPitchToolCreditCost, getPresentationPitchToolBaseCost, isPresentationPitchTool } from "./presentation-pitch-tool-credits";\nimport { POSTER_PROMOTIONAL_TOOL_CREDIT_COSTS, POSTER_PROMOTIONAL_TOOL_SLUGS, calculatePosterPromotionalToolCreditCost, getPosterPromotionalToolBaseCost, isPosterPromotionalTool } from "./poster-promotional-tool-credits";\n',
    "poster credit import",
)
replace_once(
    credits,
    '  if (isPresentationPitchTool(toolSlug)) return calculatePresentationPitchToolCreditCost(toolSlug, inputs);\n',
    '  if (isPosterPromotionalTool(toolSlug)) return calculatePosterPromotionalToolCreditCost(toolSlug, inputs);\n  if (isPresentationPitchTool(toolSlug)) return calculatePresentationPitchToolCreditCost(toolSlug, inputs);\n',
    "poster credit delegation",
)
replace_once(
    credits,
    '...CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS, ...PRESENTATION_PITCH_TOOL_SLUGS];',
    '...CYBERSECURITY_IT_OPERATIONS_TOOL_SLUGS, ...PRESENTATION_PITCH_TOOL_SLUGS, ...POSTER_PROMOTIONAL_TOOL_SLUGS];',
    "poster dynamic tool list",
)
replace_once(
    credits,
    'export function getToolCreditLabel(toolSlug: string) { if (isPresentationPitchTool(toolSlug))',
    'export function getToolCreditLabel(toolSlug: string) { if (isPosterPromotionalTool(toolSlug)) return `From ${creditText(getPosterPromotionalToolBaseCost(toolSlug))}`; if (isPresentationPitchTool(toolSlug))',
    "poster catalog credit label",
)

# ---------------------------------------------------------------------------
# 5) Add approved Recommended Next Actions to the special Email editor without
#    changing its existing editor, formatting, copy, download, or generation.
# ---------------------------------------------------------------------------
email_panel = APP / "components/EmailOutputEditorPanel.tsx"
replace_once(
    email_panel,
    'import { downloadHtmlOutput } from "@/lib/download/exportHtml";\n',
    'import { downloadHtmlOutput } from "@/lib/download/exportHtml";\nimport type { RecommendedNextAction } from "@/lib/tools/public-tools";\n',
    "email next action type import",
)
replace_once(
    email_panel,
    '  downloadFileBaseName?: string;\n}',
    '  downloadFileBaseName?: string;\n  recommendedNextActions?: RecommendedNextAction[];\n}',
    "email next action prop",
)
replace_once(
    email_panel,
    'export function EmailOutputEditorPanel({ isLoading, output, downloadFileBaseName = "email-output" }: EmailOutputEditorPanelProps) {',
    'export function EmailOutputEditorPanel({ isLoading, output, downloadFileBaseName = "email-output", recommendedNextActions = [] }: EmailOutputEditorPanelProps) {',
    "email next action parameter",
)
replace_once(
    email_panel,
    '  const isStreamingVisible = isLoading && hasOutput;\n',
    '  const isStreamingVisible = isLoading && hasOutput;\n  const showNextActions = hasOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;\n',
    "email next action visibility",
)
replace_once(
    email_panel,
    '          </div>\n        )\n      ) : isLoading ?',
    '''          </div>\n        )\n      ) : isLoading ?''',
    "email output close guard",
)
# Insert unboxed continuation immediately after the output-state conditional.
replace_once(
    email_panel,
    '      ) : isLoading ? <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" /><p>Generating...</p></div> : <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">Your generated result will appear here. Email outputs can be edited, copied, or downloaded from this panel.</div>}\n    </div>',
    '''      ) : isLoading ? <div className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-white/5 p-5 text-purple-200"><div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" /><p>Generating...</p></div> : <div className="rounded-2xl border border-purple-500/15 bg-black/70 p-6 text-gray-400">Your generated result will appear here. Email outputs can be edited, copied, or downloaded from this panel.</div>}\n      {showNextActions ? <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <a key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></a>)}</div></div> : null}\n    </div>''',
    "email unboxed next actions",
)

renderer = APP / "components/ToolFormRenderer.tsx"
replace_once(
    renderer,
    '<EmailOutputEditorPanel isLoading={isLoading} output={output} downloadFileBaseName={`${tool.slug}-output`} />',
    '<EmailOutputEditorPanel isLoading={isLoading} output={output} recommendedNextActions={tool.nextActions} downloadFileBaseName={`${tool.slug}-output`} />',
    "pass email next actions",
)

# ---------------------------------------------------------------------------
# 6) Enforce exact Book Title counts before credits are finalized. Incorrect
#    model shape is retried once, then refunded rather than shown to the user.
# ---------------------------------------------------------------------------
book_regen = APP / "app/api/generate/book-title-regenerate/route.ts"
replace_once(
    book_regen,
    'function inputContext(inputs: Record<string, string>) {',
    '''function exactTitleNumbers(value: string) {\n  return Array.from(value.matchAll(/^##\\s+Title\\s+(\\d+)\\s*[—–:-]/gim)).map((match) => Number(match[1]));\n}\n\nfunction hasExactTitleShape(value: string, scope: "single" | "all", titleIndex: number, expectedCount: number) {\n  const numbers = exactTitleNumbers(value);\n  if (scope === "single") return numbers.length === 1 && numbers[0] === titleIndex;\n  return numbers.length === expectedCount && numbers.every((number, index) => number === index + 1);\n}\n\nfunction inputContext(inputs: Record<string, string>) {''',
    "Book Title shape validator",
)
replace_once(
    book_regen,
    '''    const result = await routeToAI({\n      requestLabel: `book-title-regenerate:${scope}`,\n      temperature: 0.78,\n      maxTokens: scope === "single" ? 700 : Math.min(4200, 1100 + selection.count * 280),\n      messages: [{ role: "system", content: system }, { role: "user", content: user }],\n    });\n\n    const text = result.text.trim();\n    if (!text) {\n      await refundIfReserved("book_title_regeneration_empty");\n      return Response.json({ ok: false, error: "Title regeneration returned no text.", requiredCredits }, { status: 502 });\n    }\n''',
    '''    let result: Awaited<ReturnType<typeof routeToAI>> | null = null;\n    let text = "";\n    for (let attempt = 0; attempt < 2; attempt += 1) {\n      const attemptUser = attempt === 0 ? user : `${user}\\n\\nCorrection required: the previous response had the wrong number or numbering of title sections. Return the exact required Markdown title sections and nothing extra beyond the allowed structure.`;\n      const candidate = await routeToAI({\n        requestLabel: `book-title-regenerate:${scope}:attempt-${attempt + 1}`,\n        temperature: 0.78,\n        maxTokens: scope === "single" ? 700 : Math.min(4200, 1100 + selection.count * 280),\n        messages: [{ role: "system", content: system }, { role: "user", content: attemptUser }],\n      });\n      const candidateText = candidate.text.trim();\n      if (candidateText && hasExactTitleShape(candidateText, scope, titleIndex, selection.count)) {\n        result = candidate;\n        text = candidateText;\n        break;\n      }\n    }\n\n    if (!result || !text) {\n      await refundIfReserved("book_title_regeneration_invalid_count");\n      return Response.json({ ok: false, error: `Title regeneration did not return the exact required ${scope === "single" ? 1 : selection.count} title option${scope === "single" || selection.count === 1 ? "" : "s"}. No credits were charged.`, requiredCredits }, { status: 502 });\n    }\n''',
    "Book Title regeneration exact retry",
)

stream = APP / "app/api/generate/stream/route.ts"
replace_once(
    stream,
    'import { calculateToolCreditCost } from "@/lib/tools/credit-costs";\n',
    'import { calculateToolCreditCost } from "@/lib/tools/credit-costs";\nimport { getBookTitleSelection } from "@/lib/tools/book-title-selection";\n',
    "stream Book Title selection import",
)
replace_once(
    stream,
    'function makeTextStreamFromText(text: string) {',
    '''function hasExactBookTitleOptions(value: string, expectedCount: number) {\n  const numbers = Array.from(value.matchAll(/^##\\s+Title\\s+(\\d+)\\s*[—–:-]/gim)).map((match) => Number(match[1]));\n  return numbers.length === expectedCount && numbers.every((number, index) => number === index + 1);\n}\n\nfunction makeTextStreamFromText(text: string) {''',
    "stream Book Title validator",
)
replace_once(
    stream,
    '    const maxTokens = 25000;\n    const failures: string[] = [];',
    '''    if (toolSlug === "book-title-generator") {\n      const selection = getBookTitleSelection(inputs.title_count);\n      let validResult: Awaited<ReturnType<typeof routeToAI>> | null = null;\n      let validText = "";\n      for (let attempt = 0; attempt < 2; attempt += 1) {\n        const attemptMessages: ChatMessage[] = attempt === 0 ? messages : [...messages, { role: "user", content: `Correction required: return exactly ${selection.count} title options numbered consecutively from Title 1 through Title ${selection.count}. Do not return more or fewer.` }];\n        const candidate = await routeToAI({ requestLabel: `book-title-generator:attempt-${attempt + 1}`, temperature: 0.72, maxTokens: Math.min(4200, 1100 + selection.count * 280), messages: attemptMessages });\n        const candidateText = candidate.text.trim();\n        if (candidateText && hasExactBookTitleOptions(candidateText, selection.count)) { validResult = candidate; validText = candidateText; break; }\n      }\n      if (!validResult || !validText) {\n        await refundIfReserved("book_title_generation_invalid_count");\n        return Response.json({ ok: false, error: `Book Title Generator did not return exactly ${selection.count} title option${selection.count === 1 ? "" : "s"}. No credits were charged.`, code: "INVALID_TITLE_COUNT" }, { status: 502 });\n      }\n      const spend = await spendReservation(validResult.provider, validResult.model);\n      if (!spend.ok) return spend.response;\n      return new Response(makeTextStreamFromText(validText), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Creator-Stream-Provider": validResult.provider, "X-Creator-Stream-Model": validResult.model } });\n    }\n\n    const maxTokens = 25000;\n    const failures: string[] = [];''',
    "stream exact Book Title branch",
)

# ---------------------------------------------------------------------------
# Final invariants: no tool/category/input deletion; approved Book Idea and
# Book Cover overrides remain; Blog change is additive Edit + Regenerate only.
# ---------------------------------------------------------------------------
checks = {
    preset: ["Regenerate — 2 credits", "Manual editing is free", "PresetBlogOutputEditor"],
    public_tools: ["...posterPromotionalTools", "...bookVariationOverrideTools", "...blogTools"],
    registry: ["serverPosterPromotionalTools", "serverBlogBatchTools", "serverPresentationPitchTools"],
    credits: ["calculatePosterPromotionalToolCreditCost", "BOOK_TITLE_COUNT_CREDITS", "EXACT_VARIATION_TOOLS"],
    out: ["isBlogWorkflowTool", "Edit this output section manually", "Regenerate this output section"],
    stream: ["hasExactBookTitleOptions", "book_title_generation_invalid_count"],
    book_regen: ["hasExactTitleShape", "book_title_regeneration_invalid_count"],
}
for path, needles in checks.items():
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            raise RuntimeError(f"invariant failed: {needle!r} missing from {path}")

print("Applied guarded additive audit fixes successfully.")
