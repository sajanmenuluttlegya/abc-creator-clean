from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "abc-creator-app/components/OutputPanel.tsx"
text = path.read_text(encoding="utf-8")
old = 'return kept.join("\\n").replace(/^(#{1,6}\\s+)(?:ultra[-\\s]*)?premium\\s+/gim, "$1").replace(/\\n{4,}/g, "\\n\\n\\n").trim();'
new = 'return kept.join("\\n").replace(/^(#{1,6}\\s+)ultra[-\\s]*premium\\s+/gim, "$1").replace(/^(#{1,6}\\s+)premium\\s+(output|result|deliverable|canvas|studio)\\b/gim, "$1$2").replace(/\\n{4,}/g, "\\n\\n\\n").trim();'
if old in text:
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
elif new not in text:
    raise SystemExit("Expected output-copy preservation expression was not found.")

audit = ROOT / "automation/ui-credit-upgrade-audit-20260721.txt"
audit_text = audit.read_text(encoding="utf-8")
line = "- Output copy preservation removes only self-promotional heading labels; legitimate Premium product/tier/content wording is preserved."
if line not in audit_text:
    marker = "- Planner/calendar/roadmap outputs retain requested sections but receive a concise planning guard."
    if marker not in audit_text:
        raise SystemExit("Audit insertion marker was not found.")
    audit.write_text(audit_text.replace(marker, marker + "\n" + line, 1), encoding="utf-8")

print("Output-copy preservation refinement applied.")
