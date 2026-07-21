from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"
TOOLS = APP / "lib" / "tools"

COUNT_DRIVEN_TOOLS = {
    "restaurant-brand-story-generator",
    "menu-description-dish-naming-generator",
    "collection-story-naming-generator",
    "apparel-product-description-generator",
    "campaign-positioning-big-idea-generator",
    "research-question-refiner",
    "boolean-search-query-builder",
    "theoretical-framework-builder",
    "learning-objectives-success-criteria-generator",
    "classroom-activity-engagement-designer",
    "scaffold-worked-example-generator",
}

PUBLIC_TOOL_FILES: dict[str, list[str]] = {
    "public-food-hospitality-tools.ts": [
        "restaurant-brand-story-generator",
        "menu-description-dish-naming-generator",
    ],
    "public-fashion-apparel-tools.ts": [
        "collection-story-naming-generator",
        "apparel-product-description-generator",
    ],
    "public-marketing-campaign-tools.ts": [
        "campaign-positioning-big-idea-generator",
    ],
    "public-research-knowledge-tools.ts": [
        "research-question-refiner",
        "boolean-search-query-builder",
        "theoretical-framework-builder",
    ],
    "public-education-learning-tools.ts": [
        "learning-objectives-success-criteria-generator",
        "classroom-activity-engagement-designer",
        "scaffold-worked-example-generator",
    ],
}

VERSION_OPTIONS_OLD = 'const versionOptions = ["1 version", "3 versions", "5 versions", "10 versions"];'
VERSION_OPTIONS_NEW = 'const versionOptions = ["1 version (1 credit)", "3 versions (2 credits)", "5 versions (3 credits)", "10 versions (5 credits)"];'
VERSION_CREDITS_OLD = 'const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 9], ["5 versions", 7], ["3 versions", 5], ["1 version", 2]];'
VERSION_CREDITS_NEW = 'const VERSION_CREDITS: Array<[string, number]> = [["10 versions", 5], ["5 versions", 3], ["3 versions", 2], ["1 version", 1]];'


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    current = path.read_text(encoding="utf-8") if path.exists() else None
    if current != text:
        path.write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise RuntimeError(f"Expected block not found: {label}")


def tool_object_bounds(text: str, slug: str) -> tuple[int, int]:
    slug_token = f'slug: "{slug}"'
    slug_index = text.find(slug_token)
    if slug_index < 0:
        raise RuntimeError(f"Tool slug not found: {slug}")
    start = text.rfind("textTool({", 0, slug_index)
    if start < 0:
        raise RuntimeError(f"Tool block start not found: {slug}")
    brace = text.find("{", start)
    depth = 0
    quote: str | None = None
    escaped = False
    for index in range(brace, len(text)):
        char = text[index]
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
                return start, index + 1
    raise RuntimeError(f"Tool block end not found: {slug}")


def add_count_driven_tail(text: str, filename: str) -> str:
    declaration = 'const countDrivenTail: ToolInput[] = commonTail.filter((input) => input.id !== "output_depth");'
    if declaration in text:
        return text
    marker = "];\n\nfunction textTool"
    if marker not in text:
        raise RuntimeError(f"commonTail terminator not found: {filename}")
    return text.replace(marker, f"];\n\n{declaration}\n\nfunction textTool", 1)


def switch_tool_tail(text: str, slug: str) -> str:
    start, end = tool_object_bounds(text, slug)
    block = text[start:end]
    if "...countDrivenTail" in block:
        return text
    if "...commonTail" not in block:
        raise RuntimeError(f"commonTail spread not found in {slug}")
    block = block.replace("...commonTail", "...countDrivenTail", 1)
    return text[:start] + block + text[end:]


def patch_public_files() -> None:
    for filename, slugs in PUBLIC_TOOL_FILES.items():
        path = TOOLS / filename
        text = read(path)
        text = replace_once(text, VERSION_OPTIONS_OLD, VERSION_OPTIONS_NEW, f"version options in {filename}")
        text = add_count_driven_tail(text, filename)
        for slug in slugs:
            text = switch_tool_tail(text, slug)
        write(path, text)


def patch_credit_file(filename: str, old_block: str, new_block: str) -> None:
    path = TOOLS / filename
    text = read(path)
    text = replace_once(text, VERSION_CREDITS_OLD, VERSION_CREDITS_NEW, f"version credits in {filename}")
    text = replace_once(text, old_block, new_block, f"count-only pricing in {filename}")
    write(path, text)


def patch_credit_files() -> None:
    patch_credit_file(
        "food-hospitality-tool-credits.ts",
        '''  if (["restaurant-brand-story-generator", "menu-description-dish-naming-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }''',
        '''  if (["restaurant-brand-story-generator", "menu-description-dish-naming-generator"].includes(toolSlug)) {
    return matchCredit(inputs.version_count, VERSION_CREDITS, 1);
  }''',
    )
    patch_credit_file(
        "fashion-apparel-tool-credits.ts",
        '''  if (["collection-story-naming-generator", "apparel-product-description-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }''',
        '''  if (["collection-story-naming-generator", "apparel-product-description-generator"].includes(toolSlug)) {
    return matchCredit(inputs.version_count, VERSION_CREDITS, 1);
  }''',
    )
    patch_credit_file(
        "marketing-campaign-tool-credits.ts",
        '''  if (toolSlug === "campaign-positioning-big-idea-generator") {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }''',
        '''  if (toolSlug === "campaign-positioning-big-idea-generator") {
    return matchCredit(inputs.version_count, VERSION_CREDITS, 1);
  }''',
    )
    patch_credit_file(
        "research-knowledge-tool-credits.ts",
        '''  if (["research-question-refiner", "boolean-search-query-builder", "theoretical-framework-builder"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count || inputs.query_versions, VERSION_CREDITS, base));
  }''',
        '''  if (["research-question-refiner", "boolean-search-query-builder", "theoretical-framework-builder"].includes(toolSlug)) {
    return matchCredit(inputs.version_count || inputs.query_versions, VERSION_CREDITS, 1);
  }''',
    )
    patch_credit_file(
        "education-learning-tool-credits.ts",
        '''  if (["learning-objectives-success-criteria-generator", "classroom-activity-engagement-designer", "scaffold-worked-example-generator"].includes(toolSlug)) {
    credits = Math.max(credits, matchCredit(inputs.version_count, VERSION_CREDITS, base));
  }''',
        '''  if (["learning-objectives-success-criteria-generator", "classroom-activity-engagement-designer", "scaffold-worked-example-generator"].includes(toolSlug)) {
    return matchCredit(inputs.version_count, VERSION_CREDITS, 1);
  }''',
    )


def patch_preprocessor() -> None:
    path = TOOLS / "preprocess-inputs.ts"
    text = read(path)
    set_block = '''const COUNT_DRIVEN_NO_DEPTH_TOOLS = new Set([
  "restaurant-brand-story-generator",
  "menu-description-dish-naming-generator",
  "collection-story-naming-generator",
  "apparel-product-description-generator",
  "campaign-positioning-big-idea-generator",
  "research-question-refiner",
  "boolean-search-query-builder",
  "theoretical-framework-builder",
  "learning-objectives-success-criteria-generator",
  "classroom-activity-engagement-designer",
  "scaffold-worked-example-generator",
]);
'''
    if "const COUNT_DRIVEN_NO_DEPTH_TOOLS" not in text:
        text = replace_once(
            text,
            'const LENGTH_CONTROL_FIELD = "length_control_note";\n',
            'const LENGTH_CONTROL_FIELD = "length_control_note";\n' + set_block,
            "count-driven preprocessing set",
        )
    fallback = '''
  if (COUNT_DRIVEN_NO_DEPTH_TOOLS.has(toolSlug) && !(next.output_depth || "").trim()) {
    // UI intentionally uses quantity instead of a redundant depth selector for these tools.
    // Keep the legacy server contract satisfied without exposing or pricing this fallback.
    next.output_depth = "Quick professional (2 credits)";
  }
'''
    if "COUNT_DRIVEN_NO_DEPTH_TOOLS.has(toolSlug)" not in text:
        text = replace_once(text, "\n  return next;\n}", fallback + "\n  return next;\n}", "count-driven hidden depth fallback")
    write(path, text)


def write_scope_report() -> None:
    report = ROOT / "automation" / "count-driven-generator-finalization-20260721.txt"
    lines = [
        "Count-driven generator finalization",
        "",
        "Applied only to newer non-blog/non-book text tools where a selected number of alternatives is the real output-size control.",
        "",
        "Exact quantity pricing:",
        "- 1 version = 1 credit",
        "- 3 versions = 2 credits",
        "- 5 versions = 3 credits",
        "- 10 versions = 5 credits",
        "",
        "Output Depth is removed from the visible form for:",
        *[f"- {slug}" for slug in sorted(COUNT_DRIVEN_TOOLS)],
        "",
        "Intentionally retained:",
        "- Output Depth for planners, questionnaires, maps, matrices, question banks, long-form packs, and other tools where count and detail are independent workload controls.",
        "- Existing Blog Workflow and other Book Tool behaviour.",
        "- Existing input fields, prompts, routing, models, generation endpoints, and output capabilities outside the targeted quantity/depth conflict.",
    ]
    write(report, "\n".join(lines) + "\n")


def main() -> None:
    patch_public_files()
    patch_credit_files()
    patch_preprocessor()
    write_scope_report()
    print(f"Finalized {len(COUNT_DRIVEN_TOOLS)} newer count-driven generators.")


if __name__ == "__main__":
    main()
