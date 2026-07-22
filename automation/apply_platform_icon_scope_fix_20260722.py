from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"
TOOLS_PAGE = APP / "app/tools/page.tsx"
DETAIL_PAGE = APP / "app/tools/[slug]/page.tsx"
COMPONENT = APP / "components/PlatformToolLogo.tsx"
INSTAGRAM_SVG = APP / "public/platform-logos/instagram.svg"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


tools_text = TOOLS_PAGE.read_text(encoding="utf-8")
require(tools_text.count('type ToolCardTool = (typeof publicTools)[number];') == 1, "Tools-page platform block start was not found exactly once.")
require(tools_text.count('export default function ToolsPage()') == 1, "Tools-page component boundary was not found exactly once.")
require(tools_text.count('<ToolCardIcon tool={tool} />') == 1, "Tools-page card icon call was not found exactly once.")

start = tools_text.index('type ToolCardTool = (typeof publicTools)[number];')
end = tools_text.index('export default function ToolsPage()')
platform_block = tools_text[start:end]

instagram_pattern = re.compile(
    r'    case "instagram":\n'
    r'      return \(\n'
    r'        <PlatformLogoShell>\n'
    r'.*?'
    r'      \);\n'
    r'    case "tiktok":',
    re.DOTALL,
)
instagram_replacement = '''    case "instagram":
      return (
        <PlatformLogoShell>
          <img src="/platform-logos/instagram.svg" alt="" className="h-12 w-12 object-contain" />
        </PlatformLogoShell>
      );
    case "tiktok":'''
platform_block, instagram_count = instagram_pattern.subn(instagram_replacement, platform_block, count=1)
require(instagram_count == 1, "Existing Instagram logo case was not replaced exactly once.")

platform_block = platform_block.replace(
    'type ToolCardTool = (typeof publicTools)[number];',
    'type ToolCardTool = Tool;',
    1,
)
old_icon_function = '''function ToolCardIcon({ tool }: { tool: ToolCardTool }) {
  const platformLogo = getPlatformLogoName(tool);
  return platformLogo ? <PlatformLogo name={platformLogo} /> : <ThemeIcon name={tool.icon} size="xl" />;
}
'''
new_icon_function = '''export function PlatformToolIcon({ tool, fallback }: { tool: ToolCardTool; fallback?: ReactNode }) {
  const platformLogo = getPlatformLogoName(tool);
  return platformLogo ? <PlatformLogo name={platformLogo} /> : (fallback ?? <ThemeIcon name={tool.icon} size="xl" />);
}
'''
require(platform_block.count(old_icon_function) == 1, "Existing ToolCardIcon function was not found exactly once.")
platform_block = platform_block.replace(old_icon_function, new_icon_function, 1)

component_text = '''import type { ReactNode } from "react";
import { ThemeIcon } from "@/components/ThemeIcon";
import type { Tool } from "@/lib/tools/public-tools";

''' + platform_block
COMPONENT.write_text(component_text, encoding="utf-8")

tools_text = tools_text[:start] + tools_text[end:]
require(tools_text.count('import type { ReactNode } from "react";\n') == 1, "ReactNode import was not found exactly once in Tools page.")
tools_text = tools_text.replace('import type { ReactNode } from "react";\n', '', 1)
require(tools_text.count('import { ThemeIcon } from "@/components/ThemeIcon";\n') == 1, "ThemeIcon import was not found exactly once in Tools page.")
tools_text = tools_text.replace(
    'import { ThemeIcon } from "@/components/ThemeIcon";\n',
    'import { ThemeIcon } from "@/components/ThemeIcon";\nimport { PlatformToolIcon } from "@/components/PlatformToolLogo";\n',
    1,
)
tools_text = tools_text.replace('<ToolCardIcon tool={tool} />', '<PlatformToolIcon tool={tool} />', 1)
TOOLS_PAGE.write_text(tools_text, encoding="utf-8")

detail_text = DETAIL_PAGE.read_text(encoding="utf-8")
require(detail_text.count('import { ThemeIcon } from "@/components/ThemeIcon";\n') == 1, "ThemeIcon import was not found exactly once in tool detail page.")
detail_text = detail_text.replace(
    'import { ThemeIcon } from "@/components/ThemeIcon";\n',
    'import { ThemeIcon } from "@/components/ThemeIcon";\nimport { PlatformToolIcon } from "@/components/PlatformToolLogo";\n',
    1,
)
old_detail_icon = '<span className="text-5xl leading-none" aria-hidden="true">{tool.detailEmoji}</span>'
new_detail_icon = '<PlatformToolIcon tool={tool} fallback={<span className="text-5xl leading-none" aria-hidden="true">{tool.detailEmoji}</span>} />'
require(detail_text.count(old_detail_icon) == 1, "Tool detail emoji was not found exactly once.")
detail_text = detail_text.replace(old_detail_icon, new_detail_icon, 1)
DETAIL_PAGE.write_text(detail_text, encoding="utf-8")

INSTAGRAM_SVG.parent.mkdir(parents=True, exist_ok=True)
INSTAGRAM_SVG.write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Instagram">
  <defs>
    <radialGradient id="instagram-radial" cx="30%" cy="107%" r="125%">
      <stop offset="0" stop-color="#ffd600"/>
      <stop offset="0.28" stop-color="#ff7a00"/>
      <stop offset="0.52" stop-color="#ff0169"/>
      <stop offset="0.78" stop-color="#d300c5"/>
      <stop offset="1" stop-color="#7638fa"/>
    </radialGradient>
    <linearGradient id="instagram-blue" x1="64" y1="32" x2="260" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00a6ff"/>
      <stop offset="0.35" stop-color="#2878ff" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#2878ff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="488" height="488" rx="122" fill="url(#instagram-radial)"/>
  <rect x="12" y="12" width="488" height="488" rx="122" fill="url(#instagram-blue)"/>
  <rect x="112" y="112" width="288" height="288" rx="86" fill="none" stroke="#fff" stroke-width="38"/>
  <circle cx="256" cy="256" r="70" fill="none" stroke="#fff" stroke-width="38"/>
  <circle cx="354" cy="158" r="25" fill="#fff"/>
</svg>
''', encoding="utf-8")

# Guard the user's strict scope: no tool metadata, credits, categories, routes, or tool behavior are edited.
require('PlatformToolIcon' in TOOLS_PAGE.read_text(encoding="utf-8"), "Tools page did not receive the shared platform icon.")
require('PlatformToolIcon' in DETAIL_PAGE.read_text(encoding="utf-8"), "Tool detail page did not receive the shared platform icon.")
require('/platform-logos/instagram.svg' in COMPONENT.read_text(encoding="utf-8"), "Shared component does not use the transparent Instagram asset.")
print("Applied platform-icon-only UI changes successfully.")
