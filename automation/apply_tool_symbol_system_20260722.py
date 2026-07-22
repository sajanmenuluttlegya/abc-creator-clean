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


def replace_all(path: Path, old: str, new: str, expected: int, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} matches in {path}, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")


# ---------------------------------------------------------------------------
# Central symbol resolver: platform marks first, approved category identities
# second, existing per-tool icons/fallbacks last. Supports compact reuse in
# recommendation links without touching tool data or behavior.
# ---------------------------------------------------------------------------
platform = APP / "components/PlatformToolLogo.tsx"
replace_once(
    platform,
    'import type { Tool } from "@/lib/tools/public-tools";',
    'import { getToolBySlug, type Tool } from "@/lib/tools/public-tools";',
    "runtime tool lookup import",
)
replace_once(
    platform,
    'type ToolCardTool = Tool;\ntype PlatformLogoName =',
    'type ToolCardTool = Tool;\nexport type ToolSymbolSize = "xs" | "sm" | "md" | "lg" | "xl";\ntype PlatformLogoName =',
    "tool symbol size type",
)
replace_once(
    platform,
    '''  | "microsoft"\n  | "blogger";\n\nfunction getPlatformLogoName(tool: ToolCardTool): PlatformLogoName | null {''',
    '''  | "microsoft"\n  | "blogger";\n\nconst symbolSizeClasses: Record<ToolSymbolSize, string> = {\n  xs: "h-4 w-4",\n  sm: "h-5 w-5",\n  md: "h-7 w-7",\n  lg: "h-10 w-10",\n  xl: "h-12 w-12",\n};\n\nfunction getCategoryLogoName(category: string): PlatformLogoName | null {\n  const value = category.toLowerCase();\n  if (value.includes("blog")) return "blogger";\n  if (value.includes("youtube")) return "youtube";\n  return null;\n}\n\nfunction getCategoryThemeIcon(category: string): string | null {\n  const value = category.toLowerCase();\n  if (value.includes("book")) return "book";\n  if (value.includes("screenwriting")) return "script";\n  if (value.includes("film") || value.includes("video")) return "video";\n  if (value.includes("animation")) return "animation";\n  if (value.includes("storyboard") || value.includes("comic")) return "storyboard";\n  if (value.includes("email")) return "email";\n  if (value.includes("image")) return "image";\n  if (value.includes("ad copy")) return "ad-copy";\n  if (value.includes("seo")) return "seo";\n  if (value.includes("summar") || value.includes("file")) return "document";\n  if (value.includes("coding") || value.includes("developer")) return "code";\n  if (value.includes("ai") || value.includes("prompt")) return "prompt";\n  if (value.includes("productivity") || value.includes("planning")) return "calendar";\n  if (value.includes("career") || value.includes("professional")) return "briefcase";\n  if (value.includes("interior") || value.includes("architecture")) return "home";\n  if (value.includes("food") || value.includes("hospitality")) return "food";\n  if (value.includes("fashion") || value.includes("apparel")) return "fashion";\n  if (value.includes("marketing")) return "ad-copy";\n  if (value.includes("research") || value.includes("knowledge")) return "research";\n  if (value.includes("education") || value.includes("learning")) return "education";\n  if (value.includes("data") || value.includes("business intelligence")) return "chart";\n  if (value.includes("finance") || value.includes("accounting")) return "finance";\n  if (value.includes("legal") || value.includes("compliance")) return "legal";\n  if (value.includes("customer support") || value.includes("service operations")) return "support";\n  if (value.includes("sales") || value.includes("crm") || value.includes("revenue")) return "sales";\n  if (value.includes("hr") || value.includes("people operations")) return "people";\n  if (value.includes("cybersecurity") || value.includes("it operations")) return "shield";\n  if (value.includes("presentation") || value.includes("pitch")) return "presentation";\n  if (value.includes("poster") || value.includes("promotional")) return "poster";\n  if (value.includes("social")) return "social";\n  if (value.includes("e-commerce") || value.includes("ecommerce")) return "product";\n  if (value.includes("writing")) return "writing-pad";\n  return null;\n}\n\nfunction getPlatformLogoName(tool: ToolCardTool): PlatformLogoName | null {''',
    "central category identity map",
)
replace_once(
    platform,
    '''  if (category.includes("blog")) return "blogger";\n  if (category.includes("youtube") || contains("youtube")) return "youtube";''',
    '''  const categoryLogo = getCategoryLogoName(tool.category);\n  if (categoryLogo) return categoryLogo;\n  if (contains("youtube")) return "youtube";''',
    "platform/category priority",
)
replace_once(
    platform,
    '''function PlatformLogoShell({ children }: { children: ReactNode }) {\n  return (\n    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-transparent" aria-hidden="true">\n      {children}\n    </span>\n  );\n}\n\nfunction PlatformLogo({ name }: { name: PlatformLogoName }) {\n  const common = {\n    className: "h-12 w-12",''',
    '''function PlatformLogoShell({ children, size }: { children: ReactNode; size: ToolSymbolSize }) {\n  return (\n    <span className={`inline-flex ${symbolSizeClasses[size]} shrink-0 items-center justify-center bg-transparent`} aria-hidden="true">\n      {children}\n    </span>\n  );\n}\n\nfunction PlatformLogo({ name, size }: { name: PlatformLogoName; size: ToolSymbolSize }) {\n  const common = {\n    className: symbolSizeClasses[size],''',
    "responsive platform symbol sizing",
)
replace_all(platform, "<PlatformLogoShell>", "<PlatformLogoShell size={size}>", 21, "platform logo shell sizing")
replace_once(
    platform,
    '''export function PlatformToolIcon({ tool, fallback }: { tool: ToolCardTool; fallback?: ReactNode }) {\n  const platformLogo = getPlatformLogoName(tool);\n  return platformLogo ? <PlatformLogo name={platformLogo} /> : (fallback ?? <ThemeIcon name={tool.icon} size="xl" />);\n}\n''',
    '''export function PlatformToolIcon({ tool, fallback, size = "xl" }: { tool: ToolCardTool; fallback?: ReactNode; size?: ToolSymbolSize }) {\n  const platformLogo = getPlatformLogoName(tool);\n  if (platformLogo) return <PlatformLogo name={platformLogo} size={size} />;\n  const categoryIcon = getCategoryThemeIcon(tool.category);\n  if (categoryIcon) return <ThemeIcon name={categoryIcon} size={size} />;\n  return fallback ?? <ThemeIcon name={tool.icon} size={size} />;\n}\n\nexport function ToolCategoryIcon({ category, size = "sm" }: { category: string; size?: ToolSymbolSize }) {\n  const categoryLogo = getCategoryLogoName(category);\n  if (categoryLogo) return <PlatformLogo name={categoryLogo} size={size} />;\n  return <ThemeIcon name={getCategoryThemeIcon(category) || "folder"} size={size} />;\n}\n\nfunction slugFromToolHref(href: string) {\n  const cleanHref = href.split("#", 1)[0].split("?", 1)[0];\n  const parts = cleanHref.split("/").filter(Boolean);\n  return parts.at(-1) || "";\n}\n\nexport function ToolActionIcon({ href, size = "md" }: { href: string; size?: ToolSymbolSize }) {\n  const tool = getToolBySlug(slugFromToolHref(href));\n  return tool ? <PlatformToolIcon tool={tool} size={size} /> : <ThemeIcon name="spark" size={size} />;\n}\n''',
    "shared tool/category/action icon exports",
)

# ---------------------------------------------------------------------------
# Add clean category identity line symbols to the existing ThemeIcon library.
# ---------------------------------------------------------------------------
theme = APP / "components/ThemeIcon.tsx"
replace_once(
    theme,
    '''    case "product":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5v-7Z" /><path {...commonStroke} d="m6.5 8.8 5.5 3.3 5.5-3.3M12 12.1V19" opacity="0.7" /></IconShell>;\n    case "bolt":''',
    '''    case "product":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5v-7Z" /><path {...commonStroke} d="m6.5 8.8 5.5 3.3 5.5-3.3M12 12.1V19" opacity="0.7" /></IconShell>;\n    case "book":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4.5 5.5A3.5 3.5 0 0 1 8 4h4v15H8a3.5 3.5 0 0 0-3.5 1.5v-15Z" /><path {...commonStroke} d="M19.5 5.5A3.5 3.5 0 0 0 16 4h-4v15h4a3.5 3.5 0 0 1 3.5 1.5v-15Z" /></IconShell>;\n    case "email":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="5.5" width="17" height="13" rx="2" /><path {...commonStroke} d="m4.5 7 7.5 6 7.5-6" /></IconShell>;\n    case "document":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 3.5h8l4 4V20H6V3.5Z" /><path {...commonStroke} d="M14 3.5V8h4M9 12h6M9 15.5h6" opacity="0.75" /></IconShell>;\n    case "code":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" /></IconShell>;\n    case "briefcase":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="7" width="17" height="12" rx="2" /><path {...commonStroke} d="M9 7V4.5h6V7M3.5 12h17M10 12v2h4v-2" /></IconShell>;\n    case "home":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m3.5 11 8.5-7 8.5 7" /><path {...commonStroke} d="M5.5 9.5V20h13V9.5M10 20v-6h4v6" /></IconShell>;\n    case "food":\n      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="13" cy="12" r="6" /><path {...commonStroke} d="M3.8 4v7M2.5 4v4.2a1.3 1.3 0 0 0 2.6 0V4M3.8 11v9M20 4v16M20 4c-2 1.6-2.3 4.8 0 6" /></IconShell>;\n    case "fashion":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M10 6.2a2 2 0 1 1 3.5 1.3L12 9" /><path {...commonStroke} d="m12 9-8 7h16l-8-7Z" /></IconShell>;\n    case "research":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M5 4h10v9H5z" /><path {...commonStroke} d="M8 7h4M8 10h3" opacity="0.7" /><circle {...commonStroke} cx="15.5" cy="15.5" r="4" /><path {...commonStroke} d="m18.4 18.4 2.1 2.1" /></IconShell>;\n    case "education":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m3 9 9-5 9 5-9 5-9-5Z" /><path {...commonStroke} d="M6 11.5v4.2c3.8 2.6 8.2 2.6 12 0v-4.2M21 9v6" /></IconShell>;\n    case "chart":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 20V4M4 20h16" /><path {...commonStroke} d="M8 17v-5M12 17V8M16 17v-9M20 17V5" /></IconShell>;\n    case "finance":\n      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="8" cy="12" r="4.5" /><path {...commonStroke} d="M8 9.5v5M6.5 10.5h2.2a1.1 1.1 0 0 1 0 2.2H7.3a1.1 1.1 0 0 0 0 2.2H9.5M13.5 17l2.5-3 2 1 2.5-4" /></IconShell>;\n    case "legal":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M12 4v16M7 20h10M5 7h14M7 7l-3 6h6L7 7ZM17 7l-3 6h6l-3-6Z" /></IconShell>;\n    case "support":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 13v-2a8 8 0 0 1 16 0v2" /><path {...commonStroke} d="M4 12h3v5H5a1 1 0 0 1-1-1v-4ZM20 12h-3v5h2a1 1 0 0 0 1-1v-4ZM17 18c-1 1.3-2.6 2-5 2" /></IconShell>;\n    case "sales":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 19h16M6 16l4-4 3 2 5-7" /><path {...commonStroke} d="M14.5 7H18v3.5" /></IconShell>;\n    case "people":\n      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="9" cy="8" r="3" /><circle {...commonStroke} cx="17" cy="9" r="2.2" /><path {...commonStroke} d="M3.5 20v-2.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V20M15 14.2h1.7a3.8 3.8 0 0 1 3.8 3.8v2" /></IconShell>;\n    case "shield":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M12 3.5 19 6v5.2c0 4.6-2.7 7.5-7 9.3-4.3-1.8-7-4.7-7-9.3V6l7-2.5Z" /><path {...commonStroke} d="m9 12 2 2 4-4" /></IconShell>;\n    case "presentation":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="4" width="17" height="12" rx="1.5" /><path {...commonStroke} d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4" /></IconShell>;\n    case "poster":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="5" y="3" width="14" height="18" rx="2" /><path {...commonStroke} d="M8 7h8M8 10h5M8 17l3-3 2 2 3-4" /></IconShell>;\n    case "social":\n      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="6" cy="12" r="2.5" /><circle {...commonStroke} cx="18" cy="6" r="2.5" /><circle {...commonStroke} cx="18" cy="18" r="2.5" /><path {...commonStroke} d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></IconShell>;\n    case "video":\n      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="6" width="13" height="12" rx="2" /><path {...commonStroke} d="m16.5 10 4-2v8l-4-2" /><path d="m8.5 9.5 4.5 2.5-4.5 2.5v-5Z" fill="currentColor" /></IconShell>;\n    case "script":\n      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 3.5h9l3 3V20H6V3.5Z" /><path {...commonStroke} d="M15 3.5V7h3M9 11h6M9 14h6M9 17h4" opacity="0.75" /></IconShell>;\n    case "bolt":''',
    "category identity icon set",
)

# ---------------------------------------------------------------------------
# Use the same category symbols in the library and category navigation while
# keeping the sidebar's tool links text-only.
# ---------------------------------------------------------------------------
tools_page = APP / "app/tools/page.tsx"
replace_once(tools_page, 'import { ThemeIcon } from "@/components/ThemeIcon";\nimport { PlatformToolIcon } from "@/components/PlatformToolLogo";', 'import { PlatformToolIcon, ToolCategoryIcon } from "@/components/PlatformToolLogo";', "tools page symbol imports")
replace_once(tools_page, '''function getCategoryIcon(category: string) {\n  if (category === "Writing Tools") return "writing-pad";\n  return "folder";\n}\n\n''', '', "remove local tools-page category mapping")
replace_once(tools_page, '<ThemeIcon name={getCategoryIcon(category)} size="sm" />', '<ToolCategoryIcon category={category} size="sm" />', "tools page category symbol")

sidebar = APP / "components/ToolCategorySidebar.tsx"
replace_once(sidebar, 'import { ThemeIcon } from "@/components/ThemeIcon";\n', 'import { ToolCategoryIcon } from "@/components/PlatformToolLogo";\n', "sidebar category symbol import")
replace_once(sidebar, '''function getCategoryIcon(category: string) {\n  if (category === "Writing Tools") return "writing-pad";\n  return "folder";\n}\n\n''', '', "remove local sidebar category mapping")
replace_once(sidebar, '<ThemeIcon name={getCategoryIcon(category)} size="xs" />', '<ToolCategoryIcon category={category} size="xs" />', "sidebar category symbol")

# ---------------------------------------------------------------------------
# Add the destination tool's exact shared symbol to every Recommended Next
# Action presentation, preserving all established cards, spacing, wording and
# Blog/non-Blog visual treatments.
# ---------------------------------------------------------------------------
output = APP / "components/OutputPanel.tsx"
replace_once(output, 'import { getToolBySlug, type RecommendedNextAction } from "@/lib/tools/public-tools";\n', 'import { getToolBySlug, type RecommendedNextAction } from "@/lib/tools/public-tools";\nimport { ToolActionIcon } from "./PlatformToolLogo";\n', "OutputPanel action symbol import")
replace_once(
    output,
    '<div className="space-y-3">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10"><div className="text-sm font-semibold text-white">{action.label}</div><p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p></Link>)}</div>',
    '<div className="space-y-3">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="flex items-start gap-3 rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10"><ToolActionIcon href={action.href} size="md" /><div><div className="text-sm font-semibold text-white">{action.label}</div><p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p></div></Link>)}</div>',
    "Blog recommended action symbols",
)
replace_once(
    output,
    '<div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div>',
    '<div className="mt-7 border-t border-white/10 pt-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Continue with</h3><div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div className="flex items-center gap-3"><ToolActionIcon href={action.href} size="sm" /><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></Link>)}</div></div>',
    "standard recommended action symbols",
)

preset = APP / "components/PresetBlogOutputPanel.tsx"
replace_once(preset, 'import { PresetBlogOutputEditor } from "./PresetBlogOutputEditor";\n', 'import { PresetBlogOutputEditor } from "./PresetBlogOutputEditor";\nimport { ToolActionIcon } from "./PlatformToolLogo";\n', "preset Blog action symbol import")
replace_once(
    preset,
    '''                  <a key={`${action.href}-${action.label}`} href={action.href} className="block rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10">\n                    <div className="text-sm font-semibold text-white">{action.label}</div>\n                    <p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p>\n                  </a>''',
    '''                  <a key={`${action.href}-${action.label}`} href={action.href} className="flex items-start gap-3 rounded-xl border border-purple-400/20 bg-black/35 p-4 transition hover:border-purple-300/50 hover:bg-purple-500/10">\n                    <ToolActionIcon href={action.href} size="md" />\n                    <div>\n                      <div className="text-sm font-semibold text-white">{action.label}</div>\n                      <p className="mt-1 text-xs leading-5 text-gray-400">{action.description}</p>\n                    </div>\n                  </a>''',
    "preset Blog recommended action symbols",
)

email = APP / "components/EmailOutputEditorPanel.tsx"
replace_once(email, 'import type { RecommendedNextAction } from "@/lib/tools/public-tools";\n', 'import type { RecommendedNextAction } from "@/lib/tools/public-tools";\nimport { ToolActionIcon } from "./PlatformToolLogo";\n', "email action symbol import")
replace_once(
    email,
    '<div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <a key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></a>)}</div>',
    '<div className="divide-y divide-white/[0.07]">{recommendedNextActions.map((action) => <a key={`${action.href}-${action.label}`} href={action.href} className="group/action flex items-center justify-between gap-5 py-4"><div className="flex items-center gap-3"><ToolActionIcon href={action.href} size="sm" /><div><div className="text-sm font-semibold text-white group-hover/action:text-purple-200">{action.label}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{action.description}</p></div></div><span className="text-lg text-purple-300 transition-transform group-hover/action:translate-x-1">→</span></a>)}</div>',
    "email recommended action symbols",
)

# Guard the user's add/upgrade-only scope.
checks = {
    platform: ["ToolCategoryIcon", "ToolActionIcon", "getCategoryThemeIcon", 'return "blogger"'],
    theme: ['case "book"', 'case "email"', 'case "shield"', 'case "presentation"'],
    tools_page: ["PlatformToolIcon", "ToolCategoryIcon", "getToolCreditLabel"],
    sidebar: ["ToolCategoryIcon", "getToolCreditLabel", "tool.name"],
    output: ["ToolActionIcon", "Recommended next actions", "Continue with"],
    preset: ["ToolActionIcon", "Regenerate", "Manual editing is free"],
    email: ["ToolActionIcon", "contentEditable", "Download"],
}
for path, needles in checks.items():
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            raise RuntimeError(f"scope invariant failed: {needle!r} missing from {path}")

print("Applied the unified tool-symbol system without changing tool data or behavior.")
