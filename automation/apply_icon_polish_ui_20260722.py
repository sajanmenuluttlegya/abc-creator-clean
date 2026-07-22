from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match in {path}, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_regex_once(path: Path, pattern: str, replacement: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one regex match in {path}, found {count}")
    path.write_text(updated, encoding="utf-8")


platform = APP / "components/PlatformToolLogo.tsx"
theme = APP / "components/ThemeIcon.tsx"

# Marketing Campaign Tools: use a dedicated campaign/bullhorn symbol rather
# than falling through to any prompt/terminal-looking visual.
replace_once(
    platform,
    '  if (value.includes("marketing")) return "ad-copy";',
    '  if (value.includes("marketing")) return "campaign";',
    "marketing campaign category mapping",
)

# Cybersecurity cards/tool headers: give the long category pill breathing room
# by slightly reducing only the XL shield and adding a right-side gap. Compact
# uses in category headings and recommendations are unchanged.
replace_regex_once(
    platform,
    r'''export function PlatformToolIcon\(\{ tool, fallback, size = "xl" \}: \{ tool: ToolCardTool; fallback\?: ReactNode; size\?: ToolSymbolSize \}\) \{\n  const platformLogo = getPlatformLogoName\(tool\);\n  if \(platformLogo\) return <PlatformLogo name=\{platformLogo\} size=\{size\} />;\n  const categoryIcon = getCategoryThemeIcon\(tool\.category\);\n  if \(categoryIcon\) return <ThemeIcon name=\{categoryIcon\} size=\{size\} />;\n  return fallback \?\? <ThemeIcon name=\{tool\.icon\} size=\{size\} />;\n\}''',
    '''export function PlatformToolIcon({ tool, fallback, size = "xl" }: { tool: ToolCardTool; fallback?: ReactNode; size?: ToolSymbolSize }) {\n  const platformLogo = getPlatformLogoName(tool);\n  if (platformLogo) return <PlatformLogo name={platformLogo} size={size} />;\n  const categoryIcon = getCategoryThemeIcon(tool.category);\n  if (categoryIcon) {\n    const isCybersecurity = tool.category.toLowerCase().includes("cybersecurity");\n    const renderedSize: ToolSymbolSize = isCybersecurity && size === "xl" ? "lg" : size;\n    return (\n      <span className={isCybersecurity && size === "xl" ? "mr-4 inline-flex shrink-0" : "inline-flex shrink-0"}>\n        <ThemeIcon name={categoryIcon} size={renderedSize} />\n      </span>\n    );\n  }\n  return fallback ?? <ThemeIcon name={tool.icon} size={size} />;\n}''',
    "cybersecurity icon spacing",
)

# Replace the old circular animation/play treatment with a cleaner clapperboard
# and play mark that remains readable at heading and card sizes.
replace_regex_once(
    theme,
    r'''    case "animation":\n      return .*?;\n    case "animation-character":''',
    '''    case "animation":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 8h16v11H4V8Z" /><path {...commonStroke} d="m4 8 3-4h4L8 8m6-4h4l-3 4" /><path d="m10 11 5 3-5 3v-6Z" fill="currentColor" /></IconShell>;\n    case "animation-character":''',
    "animation/video icon polish",
)

# Keep generic video tools equally clear with a simple rounded screen and play
# triangle rather than the previous camera-tail construction.
replace_regex_once(
    theme,
    r'''    case "video":\n      return .*?;\n    case "script":''',
    '''    case "video":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="5" width="17" height="14" rx="3" /><path d="m10 9 5.5 3-5.5 3V9Z" fill="currentColor" /><path {...commonStroke} d="M7 3.5v2M12 3.5v2M17 3.5v2" opacity="0.6" /></IconShell>;\n    case "script":''',
    "generic video icon polish",
)

# Add a dedicated, unmistakable campaign bullhorn.
replace_once(
    theme,
    '    case "ad-copy":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 13.5V9.8l11-4.3v12.8l-11-4.8Z" /><path {...commonStroke} d="M15 8.3h2a3.2 3.2 0 0 1 0 6.4h-2" opacity="0.65" /><path {...commonStroke} d="m7 15 1.5 4" /></IconShell>;',
    '    case "ad-copy":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 13.5V9.8l11-4.3v12.8l-11-4.8Z" /><path {...commonStroke} d="M15 8.3h2a3.2 3.2 0 0 1 0 6.4h-2" opacity="0.65" /><path {...commonStroke} d="m7 15 1.5 4" /></IconShell>;\n    case "campaign":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 10.2h3L15.5 6v12L7 13.8H4v-3.6Z" /><path {...commonStroke} d="m7 13.8 1.4 5h3l-1.3-3.6" /><path {...commonStroke} d="M18 8.5c1 .9 1.5 2 1.5 3.5s-.5 2.6-1.5 3.5M20.2 6.3c1.6 1.5 2.3 3.4 2.3 5.7s-.7 4.2-2.3 5.7" opacity="0.72" /></IconShell>;',
    "campaign bullhorn icon",
)

# Rebuild the finance coin so the dollar mark reads in its normal orientation.
replace_regex_once(
    theme,
    r'''    case "finance":\n      return .*?;\n    case "legal":''',
    '''    case "finance":\n      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="8.5" cy="12" r="5.2" /><path {...commonStroke} d="M8.5 7.3v9.4M10.8 9.2H8a1.8 1.8 0 1 0 0 3.6h1a1.8 1.8 0 1 1 0 3.6H6.2" /><path {...commonStroke} d="m14.5 17.5 2.7-3.2 2 1.1 2.3-4" /></IconShell>;\n    case "legal":''',
    "upright finance dollar icon",
)

# UI-only invariants.
platform_text = platform.read_text(encoding="utf-8")
theme_text = theme.read_text(encoding="utf-8")
for needle in [
    'return "campaign"',
    'isCybersecurity',
    'mr-4 inline-flex shrink-0',
    'export function ToolActionIcon',
]:
    if needle not in platform_text:
        raise RuntimeError(f"Missing PlatformToolLogo invariant: {needle}")
for needle in [
    'case "campaign"',
    'case "animation"',
    'case "video"',
    'case "finance"',
    'M8.5 7.3v9.4',
]:
    if needle not in theme_text:
        raise RuntimeError(f"Missing ThemeIcon invariant: {needle}")

print("Applied UI-only video, campaign, finance and cybersecurity icon polish.")
