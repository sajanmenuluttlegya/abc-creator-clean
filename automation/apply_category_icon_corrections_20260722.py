from pathlib import Path

root = Path(__file__).resolve().parents[1] / "abc-creator-app"
platform = root / "components/PlatformToolLogo.tsx"
theme = root / "components/ThemeIcon.tsx"


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match in {path}, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    platform,
    '''function getCategoryLogoName(category: string): PlatformLogoName | null {\n  const value = category.toLowerCase();\n  if (value.includes("blog")) return "blogger";\n  if (value.includes("youtube")) return "youtube";\n  return null;\n}\n\nfunction getCategoryThemeIcon(category: string): string | null {''',
    '''function getCategoryLogoName(category: string): PlatformLogoName | null {\n  const value = category.toLowerCase();\n  if (value.includes("blog")) return "blogger";\n  if (value.includes("youtube")) return "youtube";\n  return null;\n}\n\nfunction getCategoryNavigationLogoName(category: string): PlatformLogoName | null {\n  const value = category.toLowerCase();\n  if (value.includes("social")) return "instagram";\n  return getCategoryLogoName(category);\n}\n\nfunction getCategoryThemeIcon(category: string): string | null {''',
    "category-navigation logo resolver",
)

replace_once(
    platform,
    '''  if (value.includes("data") || value.includes("business intelligence")) return "chart";\n  if (value.includes("finance") || value.includes("accounting")) return "finance";''',
    '''  if (value.includes("data") || value.includes("business intelligence")) return "chart";\n  if (value.includes("business")) return "briefcase";\n  if (value.includes("finance") || value.includes("accounting")) return "finance";''',
    "Business category briefcase mapping",
)

replace_once(
    platform,
    '''export function ToolCategoryIcon({ category, size = "sm" }: { category: string; size?: ToolSymbolSize }) {\n  const categoryLogo = getCategoryLogoName(category);''',
    '''export function ToolCategoryIcon({ category, size = "sm" }: { category: string; size?: ToolSymbolSize }) {\n  const categoryLogo = getCategoryNavigationLogoName(category);''',
    "category-only social Instagram mapping",
)

replace_once(
    theme,
    '''    case "book":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4.5 5.5A3.5 3.5 0 0 1 8 4h4v15H8a3.5 3.5 0 0 0-3.5 1.5v-15Z" /><path {...commonStroke} d="M19.5 5.5A3.5 3.5 0 0 0 16 4h-4v15h4a3.5 3.5 0 0 1 3.5 1.5v-15Z" /></IconShell>;''',
    '''    case "book":\n      return <IconShell name={name} size={size} className={className}><g transform="rotate(-10 12 12)"><path {...commonStroke} d="M6.2 4.5h10.3a1.8 1.8 0 0 1 1.8 1.8v12.2H8.2a2.5 2.5 0 0 0-2.5 1.5V5a.5.5 0 0 1 .5-.5Z" /><path {...commonStroke} d="M8.2 4.5v14M8.2 18.5h10.1M11 8h4.5M11 11h4.5" opacity="0.72" /></g></IconShell>;''',
    "angled closed-book icon",
)

platform_text = platform.read_text(encoding="utf-8")
theme_text = theme.read_text(encoding="utf-8")
assert 'if (value.includes("social")) return "instagram";' in platform_text
assert 'if (value.includes("business")) return "briefcase";' in platform_text
assert 'const categoryLogo = getCategoryNavigationLogoName(category);' in platform_text
assert 'transform="rotate(-10 12 12)"' in theme_text
assert 'getPlatformLogoName(tool' in platform_text

print("Applied UI-only category icon corrections.")
