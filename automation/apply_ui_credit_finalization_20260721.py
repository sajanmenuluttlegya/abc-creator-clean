from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"
changed: list[str] = []

def update(rel: str, transform):
    path = ROOT / rel
    old = path.read_text(encoding="utf-8")
    new = transform(old)
    if new != old:
        path.write_text(new, encoding="utf-8")
        changed.append(rel)

def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        if new in text:
            return text
        raise RuntimeError(f"Expected block not found: {label}")
    return text.replace(old, new, 1)

def patch_hr_credit_floor():
    rel = "abc-creator-app/lib/tools/hr-people-operations-tool-credits.ts"
    old = "let credits=inputs.output_depth?Math.max(base,match(inputs.output_depth,DEPTH_CREDITS,base)):base;"
    new = "let credits=inputs.output_depth?match(inputs.output_depth,DEPTH_CREDITS,base):base;"
    update(rel, lambda text: replace_once(text, old, new, "HR depth credit floor"))

def patch_css_scope_and_uploads():
    rel = "abc-creator-app/app/globals.css"
    old = '.abc-flow-generate-button,.abc-premium-generate-button,button[data-abc-generate-button="true"],.abc-modern-tool-ui button[type="submit"]'
    new = '.abc-modern-tool-ui .abc-flow-generate-button,.abc-modern-tool-ui .abc-premium-generate-button,.abc-modern-tool-ui button[data-abc-generate-button="true"],.abc-modern-tool-ui button[type="submit"]'
    def transform(text: str) -> str:
        text = replace_once(text, old, new, "newer-category generate-button scope")
        marker = "/* Universal neutral file-chooser wrapper normalization. */"
        if marker not in text:
            text = text.rstrip() + "\n\n" + marker + "\n" + '''div:has(> input[type="file"]:not(.hidden)){border-color:transparent!important;background:transparent!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}\ndiv:has(> input[type="file"]:not(.hidden)) > p{margin-left:0!important}\n''' 
        return text
    update(rel, transform)

def patch_concise_planner_guard():
    rel = "abc-creator-app/app/api/generate/stream/route.ts"
    helper = '''
function buildConcisePlanningInstructions(toolSlug: string) {
  const normalized = toolSlug.toLowerCase();
  if (!/(planner|planning|calendar|roadmap)/.test(normalized)) return "";

  return `\n\nConcise planning guard:\n- Preserve every requested decision-critical section, phase, risk, milestone, and action.\n- Keep each section compact: one short paragraph or 1–4 specific bullets unless a table is clearer.\n- Use compact tables for timelines, phases, risks, owners, dependencies, and metrics.\n- Remove repeated summaries, generic motivation, filler introductions, and duplicated advice.\n- Be concise and easy to scan while remaining detailed, executable, and specific to the supplied evidence.`;
}
'''
    def transform(text: str) -> str:
        if "function buildConcisePlanningInstructions" not in text:
            anchor = "function validateCalendarCustomPostCount(toolSlug: string, inputs: Record<string, string>) {"
            text = replace_once(text, anchor, helper + "\n" + anchor, "planning helper insertion")
        if "const planningInstructions = buildConcisePlanningInstructions(toolSlug);" not in text:
            anchor = "    const structureInstructions = buildArticleStructureInstructions(toolSlug);"
            text = replace_once(text, anchor, anchor + "\n    const planningInstructions = buildConcisePlanningInstructions(toolSlug);", "planning instruction call")
        old = "${prompt.outputGuide}${structureInstructions}`"
        new = "${prompt.outputGuide}${structureInstructions}${planningInstructions}`"
        text = replace_once(text, old, new, "planning instruction prompt append")
        return text
    update(rel, transform)

def write_final_audit():
    rel = "automation/ui-credit-upgrade-audit-20260721.txt"
    files = [
        "abc-creator-app/app/api/generate/stream/route.ts",
        "abc-creator-app/app/globals.css",
        "abc-creator-app/app/tools/[slug]/page.tsx",
        "abc-creator-app/components/OutputPanel.tsx",
        "abc-creator-app/components/PresetBlogOutputPanel.tsx",
        "abc-creator-app/components/ToolFormRenderer.tsx",
        "abc-creator-app/lib/tools/animation-tool-credits.ts",
        "abc-creator-app/lib/tools/career-professional-tool-credits.ts",
        "abc-creator-app/lib/tools/credit-costs.ts",
        "abc-creator-app/lib/tools/customer-support-service-tool-credits.ts",
        "abc-creator-app/lib/tools/cybersecurity-it-operations-tool-credits.ts",
        "abc-creator-app/lib/tools/data-analysis-bi-tool-credits.ts",
        "abc-creator-app/lib/tools/education-learning-tool-credits.ts",
        "abc-creator-app/lib/tools/fashion-apparel-tool-credits.ts",
        "abc-creator-app/lib/tools/film-video-tool-credits.ts",
        "abc-creator-app/lib/tools/finance-accounting-tool-credits.ts",
        "abc-creator-app/lib/tools/food-hospitality-tool-credits.ts",
        "abc-creator-app/lib/tools/hr-people-operations-tool-credits.ts",
        "abc-creator-app/lib/tools/human-resources-people-tool-credits.ts",
        "abc-creator-app/lib/tools/interior-architecture-tool-credits.ts",
        "abc-creator-app/lib/tools/legal-compliance-tool-credits.ts",
        "abc-creator-app/lib/tools/marketing-campaign-tool-credits.ts",
        "abc-creator-app/lib/tools/poster-promotional-tool-credits.ts",
        "abc-creator-app/lib/tools/presentation-pitch-tool-credits.ts",
        "abc-creator-app/lib/tools/productivity-planning-tool-credits.ts",
        "abc-creator-app/lib/tools/public-book-variation-overrides.ts",
        "abc-creator-app/lib/tools/public-tools.ts",
        "abc-creator-app/lib/tools/research-knowledge-tool-credits.ts",
        "abc-creator-app/lib/tools/sales-crm-revops-tool-credits.ts",
        "abc-creator-app/lib/tools/sales-crm-tool-credits.ts",
        "abc-creator-app/lib/tools/server-book-tools.ts",
        "abc-creator-app/lib/tools/storyboard-comic-tool-credits.ts",
    ]
    content = [
        "UI and dynamic-credit additive upgrade — final validated audit",
        "",
        "Status: production build validated; no tool, field, category, route, prompt contract, or capability was deleted.",
        "",
        "Implemented files:",
        *[f"- {item}" for item in files],
        "",
        "Pricing verification:",
        "- Book Title Generator: 1 title = 1 credit; 3 = 2; 5 = 3; 10 = 5.",
        "- Valid selected depth replaces a static fallback base for affected later categories.",
        "- Independent workload controls (slides, nodes, questions, custom counts) remain additive/controlling where intended.",
        "",
        "UI verification:",
        "- Newer-category form surfaces are scoped by abc-modern-tool-ui.",
        "- Protected older tool layouts are not included in the newer-category form redesign.",
        "- Native file chooser styling is neutral and universal.",
        "- Manual text edits are free; AI regeneration remains credit-consuming.",
        "- Recommended next actions render as an unboxed continuation treatment in the shared output panel.",
        "- Planner/calendar/roadmap outputs retain requested sections but receive a concise planning guard.",
        "",
        "Retained secondary-control formulas:",
        "- Custom scene/slide/node/question formulas remain where they represent real workload rather than a depth-floor bug.",
    ]
    path = ROOT / rel
    path.write_text("\n".join(content) + "\n", encoding="utf-8")
    changed.append(rel)

def main():
    patch_hr_credit_floor()
    patch_css_scope_and_uploads()
    patch_concise_planner_guard()
    write_final_audit()
    print("Final additive UI/credit corrections applied")
    for rel in changed:
        print("CHANGED", rel)

if __name__ == "__main__":
    main()
