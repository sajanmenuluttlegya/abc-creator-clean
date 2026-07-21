from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"

changed: list[str] = []

def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")

def write(rel: str, text: str) -> None:
    path = ROOT / rel
    old = path.read_text(encoding="utf-8")
    if old == text:
        return
    path.write_text(text, encoding="utf-8")
    changed.append(rel)

def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Expected block not found: {label}")
    return text.replace(old, new, 1)

def append_once(text: str, marker: str, addition: str) -> str:
    if marker in text:
        return text
    return text.rstrip() + "\n\n" + addition.strip() + "\n"

def patch_book_title_variations() -> None:
    rel = "abc-creator-app/lib/tools/public-book-variation-overrides.ts"
    text = read(rel)
    if 'slug: "book-title-generator"' not in text:
        insertion = '''
  {
    id: "book-title-generator",
    slug: "book-title-generator",
    name: "Book Title Generator",
    description: "Generate an exact number of book-title options with concise supporting notes.",
    icon: "book",
    detailEmoji: "🏷️",
    category: "Book Tools",
    displayCreditCost: 1,
    outputType: "text",
    aliases: ["novel-title-generator", "book-name-generator"],
    nextActions: [{ label: "Build a book outline", href: "/tools/book-outline-generator", description: "Turn the selected title direction into a structured book plan." }],
    inputs: [
      ...commonBookInputs,
      { id: "title_count", label: "Number of Titles", type: "select", required: true, options: ["1 title (1 credit)", "3 titles (2 credits)", "5 titles (3 credits)", "10 titles (5 credits)"] },
      { id: "book_brief", label: "Book Brief", type: "textarea", placeholder: "Describe the plot, topic, themes, audience, world, tone, and market angle.", required: true },
      { id: "title_style", label: "Title Style", type: "select", required: true, options: ["Commercial", "Literary", "Fantasy", "Thriller", "Romance", "Children's", "Non-fiction authority", "Short and punchy", "Poetic", "Mixed"] },
    ],
  },
'''
        text = replace_once(text, "\n];", insertion + "\n];", "book title override insertion")
    write(rel, text)

    rel = "abc-creator-app/lib/tools/credit-costs.ts"
    text = read(rel)
    if "BOOK_TITLE_COUNT_CREDITS" not in text:
        anchor = 'const PROMPT_VARIATION_CREDITS: Array<[string, number]> = [["10 variations", 5], ["5 variations", 3], ["3 variations", 2], ["1 variation", 1]];'
        text = replace_once(text, anchor, anchor + '\nconst BOOK_TITLE_COUNT_CREDITS: Array<[string, number]> = [["10 titles", 5], ["5 titles", 3], ["3 titles", 2], ["1 title", 1]];', "book title credit table")
    if 'toolSlug === "book-title-generator"' not in text:
        anchor = '  if (EXACT_VARIATION_TOOLS.has(toolSlug)) return calculateExactVariationCredits(inputs.variation_count);'
        text = replace_once(text, anchor, '  if (toolSlug === "book-title-generator") return matchCredit(inputs.title_count, BOOK_TITLE_COUNT_CREDITS, 1);\n' + anchor, "book title credit dispatch")
    write(rel, text)

    rel = "abc-creator-app/lib/tools/server-book-tools.ts"
    text = read(rel)
    old_required = 'requiredInputs: [...commonRequired, outputLengthRequired, { id: "book_brief", label: "Book brief", required: true, minLength: 10, maxLength: 9000 }, { id: "title_style", label: "Title style", required: true, minLength: 2, maxLength: 120 }],'
    new_required = 'requiredInputs: [...commonRequired, { id: "title_count", label: "Number of titles", required: true, minLength: 2, maxLength: 80 }, { id: "book_brief", label: "Book brief", required: true, minLength: 10, maxLength: 9000 }, { id: "title_style", label: "Title style", required: true, minLength: 2, maxLength: 120 }],'
    if old_required in text:
        text = text.replace(old_required, new_required, 1)
    elif new_required not in text:
        raise RuntimeError("Book title required-input block not found")
    old_guide = 'outputGuide: `${titlePageGuide}\\n\\nReturn: # Book Title Options. Scale title count by output_length: Compact = 10 titles, Standard = 20 titles, Long = 40 titles, Premium deep = 60 titles plus deeper subtitle, series, tagline, positioning, reader-promise, and shortlist notes. Include ## Title Strategy, ## Premium Titles, ## Subtitle Options, ## Series Title Options, ## Taglines, ## Best Picks by Reader Promise, and ## Verify Before Publishing. Do not claim availability.`'
    new_guide = 'outputGuide: `${titlePageGuide}\\n\\nReturn # Book Title Options. Produce exactly the selected title_count: 1, 3, 5, or 10 title options—never extra titles. Keep the response focused. For each title include one concise rationale and, only when useful, one subtitle or series-line suggestion. End with a short Best Fit note and a Verify Availability reminder. Do not claim title, domain, trademark, or marketplace availability.`'
    if old_guide in text:
        text = text.replace(old_guide, new_guide, 1)
    elif new_guide not in text:
        raise RuntimeError("Book title output-guide block not found")
    write(rel, text)

def patch_credit_floors() -> None:
    tools_dir = APP / "lib" / "tools"
    for path in sorted(tools_dir.glob("*-tool-credits.ts")):
        text = path.read_text(encoding="utf-8")
        original = text
        text = text.replace("return Math.max(fallback, matchCredit(value, DEPTH_CREDITS, fallback));", "return value ? matchCredit(value, DEPTH_CREDITS, fallback) : fallback;")
        text = text.replace("return Math.max(fallback, matchCredit(selected, DEPTH_CREDITS, fallback));", "return selected ? matchCredit(selected, DEPTH_CREDITS, fallback) : fallback;")
        text = text.replace("return Math.max(fallback, matchCredit(value, DEPTH, fallback));", "return value ? matchCredit(value, DEPTH, fallback) : fallback;")
        text = text.replace("return Math.max(fallback, matchCredit(selected, DEPTH, fallback));", "return selected ? matchCredit(selected, DEPTH, fallback) : fallback;")
        text = re.sub(r'inputs\.output_depth\?Math\.max\(base,match\(inputs\.output_depth,DEPTH,base\)\):base', 'inputs.output_depth?match(inputs.output_depth,DEPTH,base):base', text)
        text = re.sub(r'inputs\.output_depth\s*\?\s*Math\.max\(base,\s*matchCredit\(inputs\.output_depth,\s*DEPTH_CREDITS,\s*base\)\)\s*:\s*base', 'inputs.output_depth ? matchCredit(inputs.output_depth, DEPTH_CREDITS, base) : base', text)
        patterns = [
            (r'return Math\.max\(base, matchCredit\(inputs\.(variation_count|question_count|bullet_count|meeting_duration|prompt_count|idea_count|milestone_count), ([A-Z0-9_]+), base\)\);', r'return inputs.\1 ? matchCredit(inputs.\1, \2, base) : base;'),
            (r'return Math\.max\(base,match\(inputs\.(variation_count|question_count|bullet_count|meeting_duration|prompt_count|idea_count|milestone_count),([A-Z0-9_]+),base\)\);', r'return inputs.\1?match(inputs.\1,\2,base):base;'),
        ]
        for pattern, replacement in patterns:
            text = re.sub(pattern, replacement, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))

def patch_dynamic_page_scope() -> None:
    rel = "abc-creator-app/app/tools/[slug]/page.tsx"
    text = read(rel)
    if "MODERN_UI_CATEGORIES" not in text:
        anchor = 'import { getToolBySlug } from "@/lib/tools/public-tools";\n'
        addition = '''
const MODERN_UI_CATEGORIES = new Set([
  "Personal Productivity Planning Tools", "Career / Professional Tools", "Interior / Architecture Tools", "Interior Architecture Tools",
  "Food / Hospitality Creator Tools", "Food / Hospitality Tools", "Fashion / Apparel Creator Tools", "Fashion / Apparel Tools",
  "Marketing Campaign Tools", "Research / Knowledge Tools", "Education / Learning Tools", "Data Analysis / Business Intelligence Tools",
  "Finance / Accounting Tools", "Legal / Compliance Tools", "Customer Support / Service Operations Tools",
  "Sales / CRM / Revenue Operations Tools", "HR / People Operations Tools", "Cybersecurity / IT Operations Tools",
  "Presentation / Pitch Creator Tools", "Poster / Promotional Design Tools",
]);
'''
        text = replace_once(text, anchor, anchor + addition + "\n", "modern category set")
    if "const useModernToolUI" not in text:
        anchor = "  const tool = getToolBySlug(slug);\n"
        text = replace_once(text, anchor, anchor + "  const useModernToolUI = Boolean(tool && MODERN_UI_CATEGORIES.has(tool.category));\n", "modern category bool")
    old_section = '      <section className="mx-auto max-w-[1500px] px-6 pb-12">'
    new_section = '      <section className={`mx-auto max-w-[1500px] px-6 pb-12 ${useModernToolUI ? "abc-modern-tool-ui" : ""}`}> '
    if old_section in text:
        text = text.replace(old_section, new_section, 1)
    elif "abc-modern-tool-ui" not in text:
        raise RuntimeError("Dynamic tool section not found")
    write(rel, text)

def patch_tool_form_generate_button() -> None:
    rel = "abc-creator-app/components/ToolFormRenderer.tsx"
    text = read(rel)
    old = '<button type="submit" disabled={isLoading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-purple-500/40 disabled:from-indigo-600/50 disabled:to-purple-600/50">'
    new = '<button type="submit" data-abc-generate-button="true" disabled={isLoading} className="abc-flow-generate-button mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:shadow-purple-500/40 disabled:opacity-55">'
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise RuntimeError("ToolFormRenderer generate button not found")
    write(rel, text)

def patch_output_panel() -> None:
    rel = "abc-creator-app/components/OutputPanel.tsx"
    text = read(rel)
    old_return = '  return kept.join("\\n").replace(/\\n{4,}/g, "\\n\\n\\n").trim();'
    new_return = '  return kept.join("\\n").replace(/^(#{1,6}\\s+)(?:ultra[-\\s]*)?premium\\s+/gim, "$1").replace(/\\n{4,}/g, "\\n\\n\\n").trim();'
    if old_return in text:
        text = text.replace(old_return, new_return, 1)
    text = text.replace("Rewrite this section to be more premium and professional while preserving the same meaning and Markdown heading.", "Rewrite this section to be clearer, more precise, and professional while preserving the same meaning and Markdown heading.")
    text = text.replace("Make this section shorter, sharper, and more premium while preserving the meaning and Markdown heading.", "Make this section shorter and sharper while preserving the meaning and Markdown heading.")
    text = text.replace("Make this section longer, richer, more author-level, and more premium while preserving the meaning, canon, and Markdown heading.", "Make this section richer and more complete while preserving the meaning, canon, and Markdown heading.")
    state_anchor = '  const [blockOverrides, setBlockOverrides] = useState<Record<string, string>>({});\n'
    state_add = '  const [previousBlockOverrides, setPreviousBlockOverrides] = useState<Record<string, string | null>>({});\n  const [activeEditBlockId, setActiveEditBlockId] = useState<string | null>(null);\n  const [editDraft, setEditDraft] = useState("");\n'
    if "activeEditBlockId" not in text:
        text = replace_once(text, state_anchor, state_anchor + state_add, "manual edit states")
    reset_anchor = '    setBlockOverrides({});\n'
    if "setPreviousBlockOverrides({});" not in text:
        text = replace_once(text, reset_anchor, reset_anchor + '    setPreviousBlockOverrides({});\n    setActiveEditBlockId(null);\n    setEditDraft("");\n', "manual edit reset")
    functions_anchor = '  const deleteOutputBlock = (blockId: string) => setDeletedBlockIds((current) => new Set([...current, blockId]));\n'
    functions = '''  const openManualEdit = (block: DeletableOutputBlock) => {
    setActiveRegenerateBlockId(null); setActiveImageBlockId(null); setActiveEditBlockId(block.id);
    setEditDraft(blockOverrides[block.id] ?? block.content); setSectionActionMessage("");
  };
  const saveManualEdit = (block: DeletableOutputBlock) => {
    const next = editDraft.trim(); if (!next) { setSectionActionMessage("Edited text cannot be empty."); return; }
    const current = blockOverrides[block.id] ?? block.content;
    setPreviousBlockOverrides((items) => ({ ...items, [block.id]: current }));
    setBlockOverrides((items) => ({ ...items, [block.id]: next }));
    setActiveEditBlockId(null); setEditDraft(""); setSectionActionMessage("Manual edit saved. No credits were used.");
  };
  const undoManualEdit = (blockId: string) => {
    const previous = previousBlockOverrides[blockId]; if (previous === undefined) return;
    setBlockOverrides((items) => ({ ...items, [blockId]: previous || "" }));
    setPreviousBlockOverrides((items) => { const next = { ...items }; delete next[blockId]; return next; });
    setSectionActionMessage("Manual edit undone.");
  };

'''
    if "const openManualEdit" not in text:
        text = replace_once(text, functions_anchor, functions + functions_anchor, "manual edit functions")
    controls_old = '<div data-export-ignore="true" className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-2 opacity-0 transition group-hover:opacity-100">\n                    <button type="button" aria-label="Regenerate this output section"'
    controls_new = '<div data-export-ignore="true" className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-2 opacity-0 transition group-hover:opacity-100">\n                    <button type="button" aria-label="Edit this output section manually" title="Edit this output section manually — no credits" onClick={() => openManualEdit(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.07] px-3 text-xs font-semibold text-white">Edit</button>\n                    {previousBlockOverrides[block.id] !== undefined ? <button type="button" onClick={() => undoManualEdit(block.id)} className="inline-flex h-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] px-3 text-xs font-semibold text-slate-200">Undo edit</button> : null}\n                    <button type="button" aria-label="Regenerate this output section"'
    if controls_old in text:
        text = text.replace(controls_old, controls_new, 1)
    elif 'aria-label="Edit this output section manually"' not in text:
        raise RuntimeError("Output hover controls not found")
    panel_anchor = '                  {activeRegenerateBlockId === block.id ? (\n'
    edit_panel = '''                  {activeEditBlockId === block.id ? (
                    <div data-export-ignore="true" className="mb-4 border-y border-white/10 bg-white/[0.025] px-1 py-5 pr-4 pt-12">
                      <div className="flex items-center justify-between gap-3"><label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Edit text manually</label><span className="text-xs text-slate-500">Free — no credits</span></div>
                      <textarea value={editDraft} onChange={(event) => setEditDraft(event.currentTarget.value)} className="mt-3 min-h-44 w-full resize-y rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-7 text-white" />
                      <div className="mt-3 flex gap-2"><button type="button" onClick={() => saveManualEdit(block)} className="rounded-full border border-purple-300/35 bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-100">Save edit</button><button type="button" onClick={() => { setActiveEditBlockId(null); setEditDraft(""); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">Cancel</button></div>
                    </div>
                  ) : null}
'''
    if "Edit text manually" not in text:
        text = replace_once(text, panel_anchor, edit_panel + panel_anchor, "manual edit panel")
    next_old = '{showNextActions ? <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5"><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">Recommended next actions</h3><div className="space-y-3">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10"><div className="text-sm font-semibold text-white">{action.label}</div><p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p></Link>)}</div></div> : null}'
    next_new = '{showNextActions ? <div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div> : null}'
    if next_old in text:
        text = text.replace(next_old, next_new, 1)
    menu_old = '<button ref={buttonRef} type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className="inline-flex min-h-10'
    menu_new = '<button ref={buttonRef} type="button" data-abc-download-control={label === "Download" ? "true" : undefined} disabled={disabled} onClick={() => setOpen((current) => !current)} className="inline-flex min-h-10'
    if menu_old in text:
        text = text.replace(menu_old, menu_new, 1)
    write(rel, text)

def patch_preset_blog_output() -> None:
    rel = "abc-creator-app/components/PresetBlogOutputPanel.tsx"
    text = read(rel)
    text = text.replace('import { useMemo, useRef, useState } from "react";', 'import { useEffect, useMemo, useRef, useState } from "react";')
    if "manualOutput" not in text:
        anchor = '  const [downloadError, setDownloadError] = useState("");\n'
        text = replace_once(text, anchor, anchor + '  const [manualOutput, setManualOutput] = useState("");\n  const [previousManualOutput, setPreviousManualOutput] = useState("");\n  const [isEditingText, setIsEditingText] = useState(false);\n  const [editDraft, setEditDraft] = useState("");\n', "preset states")
        text = text.replace('  const displayOutput = useMemo(() => cleanOutput(output), [output]);', '  const displayOutput = useMemo(() => cleanOutput(manualOutput || output), [manualOutput, output]);', 1)
        hook = '  const showNextActions = hasOutput && !isLoading && !isErrorOutput && recommendedNextActions.length > 0;\n'
        addon = '''
  useEffect(() => { setManualOutput(""); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); }, [output]);
  const openManualEdit = () => { setEditDraft(displayOutput); setIsEditingText(true); };
  const saveManualEdit = () => { const next = editDraft.trim(); if (!next) { setDownloadError("Edited text cannot be empty."); return; } setPreviousManualOutput(displayOutput); setManualOutput(next); setIsEditingText(false); setEditDraft(""); setDownloadError(""); };
  const undoManualEdit = () => { if (!previousManualOutput) return; setManualOutput(previousManualOutput); setPreviousManualOutput(""); setIsEditingText(false); setEditDraft(""); };
'''
        text = replace_once(text, hook, hook + addon, "preset functions")
    copy = '<button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">'
    if 'onClick={openManualEdit}' not in text:
        text = replace_once(text, copy, '<button type="button" onClick={openManualEdit} className="rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white">Edit</button>\n            {previousManualOutput ? <button type="button" onClick={undoManualEdit} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-slate-300">Undo edit</button> : null}\n            ' + copy, "preset edit buttons")
    text = text.replace('className="cursor-pointer rounded-full border border-purple-400/30', 'className="abc-download-control cursor-pointer rounded-full border border-purple-400/30')
    old = '            <PresetBlogOutputEditor output={displayOutput} toolSlug={toolSlug} inputs={inputs} />'
    new = '            {isEditingText ? <div data-export-ignore="true"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">Edit generated text</p><p className="mt-1 text-xs text-slate-500">Manual editing is free. Regeneration continues to use credits.</p></div><div className="flex gap-2"><button type="button" onClick={saveManualEdit} className="rounded-full border border-purple-300/35 bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-100">Save edit</button><button type="button" onClick={() => { setIsEditingText(false); setEditDraft(""); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">Cancel</button></div></div><textarea value={editDraft} onChange={(event) => setEditDraft(event.currentTarget.value)} className="min-h-[55vh] w-full resize-y rounded-2xl border border-white/15 bg-black/35 px-5 py-4 font-mono text-sm leading-7 text-white" /></div> : <PresetBlogOutputEditor output={displayOutput} toolSlug={toolSlug} inputs={inputs} />}'
    if old in text:
        text = text.replace(old, new, 1)
    write(rel, text)

def patch_public_tools_fallback_actions() -> None:
    rel = "abc-creator-app/lib/tools/public-tools.ts"
    text = read(rel)
    if "inferRecommendedAction" in text: return
    index = text.find("export const publicTools = rawPublicTools.filter")
    if index < 0: raise RuntimeError("publicTools export marker not found")
    addition = '''
function nextActionScore(source: Tool, candidate: Tool) {
  if (source.slug === candidate.slug || source.category !== candidate.category) return -1000;
  const current = `${source.name} ${source.slug}`.toLowerCase(); const next = `${candidate.name} ${candidate.slug}`.toLowerCase(); let score = 0;
  if (/(idea|name|title|brief|prompt|question|research)/.test(current) && /(outline|planner|strategy|roadmap|framework|brief)/.test(next)) score += 9;
  if (/(plan|planner|outline|strategy|roadmap|framework|brief)/.test(current) && /(writer|generator|builder|creator|draft|content)/.test(next)) score += 9;
  if (/(writer|generator|builder|creator|draft|copy|content)/.test(current) && /(analy|audit|checker|review|optimizer|assessment)/.test(next)) score += 8;
  if (/(analy|audit|checker|review|assessment|diagnostic)/.test(current) && /(plan|planner|strategy|roadmap|optimizer|remediation|action)/.test(next)) score += 9;
  if (/generator|planner|analyzer|auditor|builder|writer|optimizer/.test(next)) score += 2; return score;
}
function inferRecommendedAction(tool: Tool, tools: Tool[]): RecommendedNextAction[] | undefined {
  if (tool.category === "Blog Workflow" || tool.outputType !== "text") return undefined;
  const best = tools.map((candidate) => ({ candidate, score: nextActionScore(tool, candidate) })).filter((item) => item.score > 2).sort((a,b) => b.score-a.score || a.candidate.name.localeCompare(b.candidate.name))[0]?.candidate;
  return best ? [{ label: best.name, href: `/tools/${best.slug}`, description: `Continue this workflow with ${best.name.toLowerCase()}.` }] : undefined;
}

'''
    text = text[:index] + addition + text[index:]
    old = 'export const publicTools = rawPublicTools.filter((tool, index, tools) => tools.findIndex((candidate) => candidate.slug === tool.slug) === index);'
    new = 'const deduplicatedPublicTools = rawPublicTools.filter((tool, index, tools) => tools.findIndex((candidate) => candidate.slug === tool.slug) === index);\nexport const publicTools = deduplicatedPublicTools.map((tool) => tool.nextActions?.length ? tool : { ...tool, nextActions: inferRecommendedAction(tool, deduplicatedPublicTools) });'
    if old in text: text = text.replace(old, new, 1)
    else:
        old2 = 'export const publicTools = rawPublicTools.filter(\n  (tool, index, tools) => tools.findIndex((candidate) => candidate.slug === tool.slug) === index\n);'
        new2 = 'const deduplicatedPublicTools = rawPublicTools.filter(\n  (tool, index, tools) => tools.findIndex((candidate) => candidate.slug === tool.slug) === index\n);\nexport const publicTools = deduplicatedPublicTools.map((tool) => tool.nextActions?.length ? tool : { ...tool, nextActions: inferRecommendedAction(tool, deduplicatedPublicTools) });'
        text = replace_once(text, old2, new2, "publicTools dedupe")
    write(rel, text)

def patch_global_css() -> None:
    rel = "abc-creator-app/app/globals.css"; text = read(rel)
    css = '''
/* 2026-07-21 additive tool-workspace UI upgrade. */
@keyframes abc-generate-flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
.abc-flow-generate-button,.abc-premium-generate-button,button[data-abc-generate-button="true"],.abc-modern-tool-ui button[type="submit"]{background-image:linear-gradient(110deg,#4f46e5 0%,#7c3aed 26%,#c026d3 52%,#7c3aed 76%,#4f46e5 100%)!important;background-size:240% 240%!important;animation:abc-generate-flow 5.5s ease-in-out infinite!important;border:1px solid rgba(216,180,254,.28)!important;box-shadow:0 18px 55px rgba(88,28,135,.28),inset 0 1px 0 rgba(255,255,255,.18)!important}
input[type="file"]{width:100%!important;color:rgba(203,213,225,.9)!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important;padding:.3rem 0!important;font-size:.8rem!important}
input[type="file"]::file-selector-button{margin-right:.75rem!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:999px!important;background:rgba(255,255,255,.065)!important;color:#fff!important;padding:.55rem .95rem!important;font-size:.75rem!important;font-weight:700!important;cursor:pointer!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 28px rgba(0,0,0,.24)!important}
input[type="file"]::file-selector-button:hover{border-color:rgba(216,180,254,.42)!important;background:rgba(139,92,246,.16)!important}
.abc-modern-tool-ui form{border-color:transparent!important;background:transparent!important;box-shadow:none!important}.abc-modern-tool-ui form.rounded-2xl,.abc-modern-tool-ui form.rounded-3xl,.abc-modern-tool-ui form[class*="bg-white/"]{padding:0!important;backdrop-filter:none!important}
.abc-modern-tool-ui input:not([type="file"]):not([type="hidden"]),.abc-modern-tool-ui textarea{border:1px solid rgba(255,255,255,.13)!important;border-radius:.9rem!important;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.028))!important;padding:.9rem 1rem!important;color:#f8fafc!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 16px 45px rgba(0,0,0,.18)!important}.abc-modern-tool-ui textarea{min-height:8rem;line-height:1.7}.abc-modern-tool-ui input:not([type="file"]):not([type="hidden"]):focus,.abc-modern-tool-ui textarea:focus{border-color:rgba(192,132,252,.68)!important;box-shadow:0 0 0 3px rgba(126,34,206,.16),inset 0 1px 0 rgba(255,255,255,.08)!important;outline:none!important}
.abc-modern-tool-ui button[aria-haspopup="listbox"]{min-height:3.15rem!important;border-radius:.9rem!important;border-color:rgba(255,255,255,.14)!important;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.03))!important}
[data-abc-download-control="true"],.abc-download-control,select[aria-label="Download output"],button[aria-label^="Download"],button[title^="Download"],a[download]{border:1px solid rgba(255,255,255,.18)!important;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;color:#f8fafc!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 38px rgba(0,0,0,.22)!important}
'''
    text = append_once(text, "/* 2026-07-21 additive tool-workspace UI upgrade.", css); write(rel,text)

def write_audit_report() -> None:
    suspicious=[]
    for path in sorted((APP/"lib"/"tools").glob("*-tool-credits.ts")):
        for number,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
            if "Math.max(base" in line or "Math.max(fallback" in line: suspicious.append(f"{path.name}:{number}: {line.strip()}")
    rel="automation/ui-credit-upgrade-audit-20260721.txt"
    (ROOT/rel).write_text("UI and dynamic-credit additive upgrade audit\n\nChanged files:\n"+"\n".join(f"- {x}" for x in sorted(set(changed)))+"\n\nRemaining expressions intentionally retained for secondary-control review:\n"+"\n".join(f"- {x}" for x in suspicious)+"\n",encoding="utf-8")
    changed.append(rel)

def main() -> None:
    patch_book_title_variations(); patch_credit_floors(); patch_dynamic_page_scope(); patch_tool_form_generate_button(); patch_output_panel(); patch_preset_blog_output(); patch_public_tools_fallback_actions(); patch_global_css(); write_audit_report()
    print("Additive UI and credit upgrade applied.")
    for item in sorted(set(changed)): print(f"CHANGED {item}")

if __name__ == "__main__": main()
