from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "abc-creator-app" / "lib" / "tools"
REPORT = ROOT / "automation" / "count-driven-text-tools-audit-20260721.txt"

FILES = [
    "public-productivity-planning-tools.ts",
    "public-career-professional-tools.ts",
    "public-interior-architecture-tools.ts",
    "public-food-hospitality-tools.ts",
    "public-fashion-apparel-tools.ts",
    "public-marketing-campaign-tools.ts",
    "public-research-knowledge-tools.ts",
    "public-education-learning-tools.ts",
    "public-data-analysis-bi-tools.ts",
    "public-finance-accounting-tools.ts",
    "public-legal-compliance-tools.ts",
    "public-customer-support-service-tools.ts",
    "public-sales-crm-revops-tools.ts",
    "public-hr-people-operations-tools.ts",
    "public-cybersecurity-it-operations-tools.ts",
    "public-presentation-pitch-tools.ts",
    "public-poster-promotional-tools.ts",
]

COUNT_WORDS = re.compile(r"(?:title|idea|name|headline|hook|concept|territor|version|variation|variant|option|query|question|prompt|angle|topic|subject|caption|tagline|slogan)", re.I)
COUNT_ID = re.compile(r"(?:count|versions?|variations?|variants?)", re.I)


def balanced_blocks(text: str, marker: str) -> list[str]:
    blocks: list[str] = []
    start = 0
    while True:
        index = text.find(marker, start)
        if index < 0:
            return blocks
        brace = text.find("{", index + len(marker))
        if brace < 0:
            return blocks
        depth = 0
        quote: str | None = None
        escaped = False
        for pos in range(brace, len(text)):
            char = text[pos]
            if quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = None
                continue
            if char in {'"', "'", "`"}:
                quote = char
                continue
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    blocks.append(text[index : pos + 1])
                    start = pos + 1
                    break
        else:
            return blocks


def quoted_values(value: str) -> list[str]:
    return re.findall(r"[\"']([^\"']+)[\"']", value)


def option_arrays(text: str) -> dict[str, list[str]]:
    arrays: dict[str, list[str]] = {}
    for match in re.finditer(r"const\s+(\w+)\s*(?::[^=]+)?=\s*\[(.*?)\];", text, re.S):
        arrays[match.group(1)] = quoted_values(match.group(2))
    return arrays


def common_depth_spreads(text: str) -> set[str]:
    result: set[str] = set()
    for match in re.finditer(r"const\s+(\w+)\s*(?::[^=]+)?=\s*\[(.*?)\];", text, re.S):
        if re.search(r'id:\s*[\"\']output_(?:depth|length)[\"\']', match.group(2)):
            result.add(match.group(1))
    return result


def extract(match_pattern: str, block: str) -> str:
    match = re.search(match_pattern, block, re.S)
    return match.group(1).strip() if match else ""


def input_rows(block: str, arrays: dict[str, list[str]]) -> list[tuple[str, str, list[str]]]:
    rows: list[tuple[str, str, list[str]]] = []
    pattern = re.compile(
        r"\{\s*id:\s*[\"']([^\"']+)[\"']\s*,\s*label:\s*[\"']([^\"']+)[\"'][^{}]*?(?:options:\s*(\w+)|options:\s*\[(.*?)\])?[^{}]*?\}",
        re.S,
    )
    for match in pattern.finditer(block):
        option_name = match.group(3) or ""
        inline = quoted_values(match.group(4) or "")
        rows.append((match.group(1), match.group(2), arrays.get(option_name, inline)))
    return rows


def main() -> None:
    lines = [
        "Count-driven text-tool audit — newer categories only",
        "",
        "Scope exclusions: Blog Workflow and Book Tools are not scanned.",
        "Purpose: find title/idea/name/query/question/version-style generators that expose a count control while also inheriting Output Depth/Length.",
        "",
    ]
    total = 0
    for filename in FILES:
        path = TOOLS / filename
        if not path.exists():
            lines.append(f"MISSING: {filename}")
            continue
        text = path.read_text(encoding="utf-8")
        arrays = option_arrays(text)
        depth_spreads = common_depth_spreads(text)
        candidates: list[str] = []
        for block in balanced_blocks(text, "textTool("):
            slug = extract(r"slug:\s*[\"']([^\"']+)[\"']", block)
            name = extract(r"name:\s*[\"']([^\"']+)[\"']", block)
            if not slug:
                continue
            rows = input_rows(block, arrays)
            count_rows = []
            for field_id, label, options in rows:
                field_text = f"{field_id} {label} {' '.join(options)}"
                if COUNT_ID.search(field_text) and COUNT_WORDS.search(f"{slug} {name} {field_text}"):
                    count_rows.append((field_id, label, options))
            inherited = sorted(spread for spread in depth_spreads if f"...{spread}" in block)
            explicit_depth = bool(re.search(r'id:\s*[\"\']output_(?:depth|length)[\"\']', block))
            if not count_rows:
                continue
            total += 1
            rendered = "; ".join(
                f"{field_id} / {label} / options={options or ['<unresolved>']}" for field_id, label, options in count_rows
            )
            candidates.append(
                f"- {slug} | {name} | count={rendered} | output-depth={'explicit' if explicit_depth else ','.join(inherited) if inherited else 'none'}"
            )
        if candidates:
            lines.append(f"## {filename}")
            lines.extend(candidates)
            lines.append("")
    lines.extend([
        f"Total candidates: {total}",
        "",
        "This report is diagnostic only. It does not change UI, pricing, prompts, regeneration, or backend behaviour.",
    ])
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT.relative_to(ROOT)} with {total} candidates")


if __name__ == "__main__":
    main()
