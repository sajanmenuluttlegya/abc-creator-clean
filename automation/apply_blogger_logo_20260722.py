from pathlib import Path

path = Path("abc-creator-app/components/PlatformToolLogo.tsx")
text = path.read_text(encoding="utf-8")

replacements = [
    (
        '  | "gmail"\n  | "microsoft";',
        '  | "gmail"\n  | "microsoft"\n  | "blogger";',
        "Blogger logo type",
    ),
    (
        '  if (category.includes("youtube") || contains("youtube")) return "youtube";',
        '  if (category.includes("blog")) return "blogger";\n  if (category.includes("youtube") || contains("youtube")) return "youtube";',
        "Blog category mapping",
    ),
    (
        '  switch (name) {\n    case "youtube":',
        '''  switch (name) {\n    case "blogger":\n      return (\n        <PlatformLogoShell>\n          <svg {...common}>\n            <rect x="1.4" y="1.4" width="21.2" height="21.2" rx="4.6" fill="#FF6D2D" />\n            <path fill="#fff" d="M8.6 5.1h3.8a4.6 4.6 0 0 1 4.6 4.6v.8c0 .9.4 1.3 1.3 1.3h.4c1.2 0 2.2 1 2.2 2.2v2.4a3.8 3.8 0 0 1-3.8 3.8H8.6A5.5 5.5 0 0 1 3.1 14.7V10.6a5.5 5.5 0 0 1 5.5-5.5Zm.5 3a1.15 1.15 0 1 0 0 2.3h4a1.15 1.15 0 1 0 0-2.3h-4Zm0 6a1.15 1.15 0 1 0 0 2.3h7.2a1.15 1.15 0 1 0 0-2.3H9.1Z" />\n          </svg>\n        </PlatformLogoShell>\n      );\n    case "youtube":''',
        "Blogger logo renderer",
    ),
]

for old, new, label in replacements:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Applied Blogger logo mapping to all Blog-category tools.")
