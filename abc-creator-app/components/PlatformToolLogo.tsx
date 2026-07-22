import type { ReactNode } from "react";
import { ThemeIcon } from "@/components/ThemeIcon";
import type { Tool } from "@/lib/tools/public-tools";

type ToolCardTool = Tool;
type PlatformLogoName =
  | "youtube"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "pinterest"
  | "google"
  | "meta"
  | "reddit"
  | "whatsapp"
  | "amazon"
  | "shopify"
  | "etsy"
  | "ebay"
  | "snapchat"
  | "telegram"
  | "discord"
  | "threads"
  | "gmail"
  | "microsoft";

function getPlatformLogoName(tool: ToolCardTool): PlatformLogoName | null {
  const identity = `${tool.slug} ${tool.name}`.toLowerCase().replace(/[_/]+/g, " ");
  const category = tool.category.toLowerCase();
  const contains = (...terms: string[]) => terms.some((term) => identity.includes(term));

  if (category.includes("youtube") || contains("youtube")) return "youtube";
  if (contains("linkedin")) return "linkedin";
  if (contains("facebook")) return "facebook";
  if (contains("instagram")) return "instagram";
  if (contains("tiktok", "tik tok")) return "tiktok";
  if (contains("twitter") || /(^|[\s-])x([\s-]|$)/.test(identity)) return "x";
  if (contains("pinterest")) return "pinterest";
  if (contains("google", "adwords")) return "google";
  if (contains("meta ad", "meta campaign", "meta marketing")) return "meta";
  if (contains("reddit")) return "reddit";
  if (contains("whatsapp")) return "whatsapp";
  if (contains("amazon")) return "amazon";
  if (contains("shopify")) return "shopify";
  if (contains("etsy")) return "etsy";
  if (contains("ebay")) return "ebay";
  if (contains("snapchat")) return "snapchat";
  if (contains("telegram")) return "telegram";
  if (contains("discord")) return "discord";
  if (contains("threads")) return "threads";
  if (contains("gmail")) return "gmail";
  if (contains("microsoft", "bing ads", "bing advertising")) return "microsoft";

  return null;
}

function PlatformLogoShell({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-transparent" aria-hidden="true">
      {children}
    </span>
  );
}

function PlatformLogo({ name }: { name: PlatformLogoName }) {
  const common = {
    className: "h-12 w-12",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
    focusable: "false" as const,
  };

  switch (name) {
    case "youtube":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#FF0000" d="M22.2 7.1a2.8 2.8 0 0 0-2-2C18.4 4.6 15.7 4.5 12 4.5s-6.4.1-8.2.6a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1.4 12c0 1.8.1 3.5.4 4.9a2.8 2.8 0 0 0 2 2c1.8.5 4.5.6 8.2.6s6.4-.1 8.2-.6a2.8 2.8 0 0 0 2-2c.3-1.4.4-3.1.4-4.9s-.1-3.5-.4-4.9Z" />
            <path fill="#fff" d="m9.7 15.7 6-3.7-6-3.7v7.4Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "linkedin":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <rect x="2" y="2" width="20" height="20" rx="3.2" fill="#0A66C2" />
            <circle cx="7" cy="7.3" r="1.45" fill="#fff" />
            <path fill="#fff" d="M5.7 9.8h2.6V18H5.7V9.8Zm4.2 0h2.5v1.1h.1c.6-.9 1.6-1.5 3-1.5 3 0 3.8 2 3.8 4.6v4h-2.6v-3.6c0-1.5-.3-2.8-1.9-2.8-1.7 0-2.3 1.2-2.3 2.7V18H9.9V9.8Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "facebook":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <circle cx="12" cy="12" r="10.5" fill="#1877F2" />
            <path fill="#fff" d="M13.7 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.6V14h2.5v7h2.6Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "instagram":
      return (
        <PlatformLogoShell>
          <img src="/platform-logos/instagram.svg" alt="" className="h-12 w-12 object-contain" />
        </PlatformLogoShell>
      );
    case "tiktok":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path d="M14.2 3.2c.3 2.5 1.8 4 4.3 4.2v3a8.7 8.7 0 0 1-4.3-1.2v6.2a5.6 5.6 0 1 1-4.8-5.5v3.1a2.6 2.6 0 1 0 1.8 2.4V3.2h3Z" fill="#25F4EE" transform="translate(-.45 .35)" />
            <path d="M14.2 3.2c.3 2.5 1.8 4 4.3 4.2v3a8.7 8.7 0 0 1-4.3-1.2v6.2a5.6 5.6 0 1 1-4.8-5.5v3.1a2.6 2.6 0 1 0 1.8 2.4V3.2h3Z" fill="#FE2C55" transform="translate(.45 -.2)" />
            <path d="M14.2 3.2c.3 2.5 1.8 4 4.3 4.2v3a8.7 8.7 0 0 1-4.3-1.2v6.2a5.6 5.6 0 1 1-4.8-5.5v3.1a2.6 2.6 0 1 0 1.8 2.4V3.2h3Z" fill="#fff" />
          </svg>
        </PlatformLogoShell>
      );
    case "x":
      return (
        <PlatformLogoShell>
          <svg {...common} fill="none">
            <path d="M4 4 20 20M20 4 4 20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </PlatformLogoShell>
      );
    case "pinterest":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <circle cx="12" cy="12" r="10.3" fill="#E60023" />
            <path fill="#fff" d="M11 18.7c.8-2.1 1.1-3.2 1.6-5.5-.5-1-.1-3.1 1-3.1.9 0 1.2.7 1.2 1.5 0 .9-.6 2.3-.9 3.6-.3 1 .6 1.8 1.6 1.8 1.9 0 3.2-2.4 3.2-5.2 0-2.1-1.7-4.5-5-4.5-3.6 0-5.7 2.7-5.7 5.5 0 1 .4 2.4 1.2 2.8.1.1.1.2.1.4l-.4 1.5c-.1.5-.5.6-.9.4-1.6-.7-2.3-2.8-2.3-5 0-3.7 3.1-8.1 9.2-8.1 4.9 0 8.1 3.5 8.1 7.3 0 5-2.8 8.7-6.9 8.7-1.4 0-2.7-.8-3.1-1.7l-.9 3.4c-.3 1.2-.9 2.4-1.5 3.3H7.2c1-1.4 2.1-3.8 2.6-5.6l1.2-4.5Z" transform="scale(.72) translate(4.7 4.3)" />
          </svg>
        </PlatformLogoShell>
      );
    case "google":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#4285F4" d="M21.4 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.3a4.5 4.5 0 0 1-2 3v2.5h3.2c1.9-1.8 2.9-4.3 2.9-7.3Z" />
            <path fill="#34A853" d="M12 21.7c2.7 0 5-.9 6.6-2.3l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 21.7Z" />
            <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3a10 10 0 0 0 0 8.8l3.4-2.6Z" />
            <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.4 9.4 0 0 0 12 2.3 10 10 0 0 0 3 7.6l3.4 2.6C7.2 7.9 9.4 6.1 12 6.1Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "meta":
      return (
        <PlatformLogoShell>
          <svg {...common} fill="none">
            <path d="M3.1 15.5c1.8-5.1 3.8-8 6.1-8 3.4 0 4.6 9 7.5 9 1.7 0 3-1.7 4.2-5.1" stroke="#0866FF" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M3.1 15.5c1.2 1.1 2.3 1.6 3.4 1.6 3.3 0 4.6-9.1 7.6-9.1 2.5 0 4.5 3.1 6.8 7.5" stroke="#00A6FF" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </PlatformLogoShell>
      );
    case "reddit":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <circle cx="12" cy="12" r="10.3" fill="#FF4500" />
            <path d="M6.1 13.2c0-2 2.6-3.7 5.9-3.7s5.9 1.7 5.9 3.7-2.6 3.7-5.9 3.7-5.9-1.7-5.9-3.7Z" fill="#fff" />
            <circle cx="9.5" cy="13" r="1" fill="#FF4500" />
            <circle cx="14.5" cy="13" r="1" fill="#FF4500" />
            <path d="M9.4 15c1.4 1 3.8 1 5.2 0M12.8 9.6l.8-3.3 2.7.6" fill="none" stroke="#FF4500" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="17.2" cy="7.1" r="1.25" fill="#fff" />
          </svg>
        </PlatformLogoShell>
      );
    case "whatsapp":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <circle cx="12" cy="12" r="10.3" fill="#25D366" />
            <path fill="#fff" d="M7.5 6.8c.4-.4 1-.5 1.4-.2l1.4 2.5c.2.4.1.8-.2 1.1l-.8.8c.7 1.6 2.1 3 3.8 3.8l.8-.9c.3-.3.8-.4 1.1-.2l2.5 1.4c.4.3.5.9.2 1.4-.7 1.1-1.9 1.8-3.2 1.7-4.7-.4-8.3-4-8.7-8.7-.1-1.2.6-2.4 1.7-3.1Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "amazon":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#fff" d="M8.1 14.5c0-2.2 1.8-3.5 5.1-3.5.8 0 1.5.1 2.1.2v-.6c0-1.5-.8-2.2-2.5-2.2-1.3 0-2.7.4-4 1.1L8 7.1A12 12 0 0 1 13.4 6c3.7 0 5.4 1.7 5.4 5v6.8h-3.3v-1.4c-1 1.1-2.4 1.7-4 1.7-2 0-3.4-1.4-3.4-3.6Zm7.2-1.1a8 8 0 0 0-1.7-.2c-1.5 0-2.3.5-2.3 1.4 0 .8.6 1.3 1.6 1.3 1.1 0 1.9-.4 2.4-1v-1.5Z" />
            <path d="M5.4 19.1c3.9 2.3 8.8 2.5 13 .6" fill="none" stroke="#FF9900" strokeWidth="1.7" strokeLinecap="round" />
            <path d="m16.9 18.8 2.4.2-.8 2.1" fill="none" stroke="#FF9900" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PlatformLogoShell>
      );
    case "shopify":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#95BF47" d="m7 6.2 1-2.5c.4-1 1.3-1.7 2.3-1.7.8 0 1.4.4 1.8 1 .6-.4 1.2-.6 1.9-.5 1.6.2 2.4 1.8 2.8 3.2l2.8 1.1-2 14.4L5 18.9 7 6.2Z" />
            <path fill="#fff" d="M14.7 8.3c-.7-.4-1.5-.6-2.3-.6-1.9 0-3.1 1.1-3.1 2.6 0 2.7 3.6 2.6 3.6 4.2 0 .4-.4.8-1.2.8-1 0-2.1-.5-2.8-1l-.8 2.4c.8.6 2.1 1.1 3.5 1.1 2.4 0 3.8-1.3 3.8-3.2 0-2.9-3.7-2.7-3.7-4.2 0-.4.4-.7 1-.7.8 0 1.6.3 2.1.6l-.1-2Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "etsy":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#F1641E" d="M5 3h14v4.1h-2.1c-.4-1.3-1-1.6-2.7-1.6H9.6v5h3.2c1.6 0 2-.4 2.3-1.8h1.8v6.1h-1.8c-.3-1.4-.7-1.8-2.3-1.8H9.6v5.5h4.9c1.9 0 2.6-.5 3.3-2.3H20L19.5 21H5v-2h1.6V5H5V3Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "ebay":
      return (
        <PlatformLogoShell>
          <svg {...common} viewBox="0 0 48 24">
            <text x="1" y="17" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" fill="#E53238">e</text>
            <text x="11" y="17" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" fill="#0064D2">b</text>
            <text x="22" y="17" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" fill="#F5AF02">a</text>
            <text x="33" y="17" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" fill="#86B817">y</text>
          </svg>
        </PlatformLogoShell>
      );
    case "snapchat":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path d="M12 3.1c3 0 4.5 2.3 4.5 5.1 0 1 .1 1.8.7 2.5.5.6 1.3.7 2 .9.5.1.8.5.7.9-.1.6-1.2.9-2.1 1.2-.5.2-.8.4-1 .8-.3.7-.2 1.5-.9 1.8-.5.2-1.2 0-1.9.3-.6.3-1.1 1.1-2 1.1s-1.4-.8-2-1.1c-.7-.3-1.4-.1-1.9-.3-.7-.3-.6-1.1-.9-1.8-.2-.4-.5-.6-1-.8-.9-.3-2-.6-2.1-1.2-.1-.4.2-.8.7-.9.7-.2 1.5-.3 2-.9.6-.7.7-1.5.7-2.5 0-2.8 1.5-5.1 4.5-5.1Z" fill="#fff" stroke="#111" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
        </PlatformLogoShell>
      );
    case "telegram":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <circle cx="12" cy="12" r="10.3" fill="#2AABEE" />
            <path fill="#fff" d="m5.5 11.7 11.7-4.5c.6-.2 1.1.1.9.9l-2 9.4c-.1.7-.6.9-1.2.6l-3.1-2.3-1.5 1.5c-.2.2-.3.3-.6.3l.2-3.2 5.8-5.3c.3-.2 0-.4-.3-.2l-7.2 4.5-3.1-1c-.7-.2-.7-.6.4-.7Z" />
          </svg>
        </PlatformLogoShell>
      );
    case "discord":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <path fill="#5865F2" d="M5.1 5.7A16 16 0 0 1 9 4.4l.5 1a13 13 0 0 1 5 0l.5-1a16 16 0 0 1 3.9 1.3c2.5 3.6 3.1 7.1 2.7 10.5a16 16 0 0 1-4.9 2.5l-1.2-1.7c.8-.3 1.5-.7 2.1-1.2-.2.1-.4.3-.6.4-3.2 1.5-6.8 1.5-10 0l-.6-.4c.7.5 1.4.9 2.1 1.2l-1.2 1.7a16 16 0 0 1-4.9-2.5c-.4-3.4.2-6.9 2.7-10.5Z" />
            <circle cx="9.2" cy="12" r="1.35" fill="#fff" />
            <circle cx="14.8" cy="12" r="1.35" fill="#fff" />
          </svg>
        </PlatformLogoShell>
      );
    case "threads":
      return (
        <PlatformLogoShell>
          <svg {...common} fill="none">
            <path d="M17.8 10.6c-.4-4-2.4-6.3-5.8-6.3-4.3 0-7 3-7 7.7 0 4.9 2.8 7.7 7.2 7.7 3.5 0 5.9-1.9 5.9-4.7 0-2.4-1.8-4-4.7-4-2.3 0-3.8 1.1-3.8 2.8 0 1.5 1.2 2.5 2.9 2.5 2.9 0 5.3-2.1 5.3-5.7 0-2.4-.8-4.4-2.2-5.7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PlatformLogoShell>
      );
    case "gmail":
      return (
        <PlatformLogoShell>
          <svg {...common} fill="none">
            <path d="M3.5 6.5 12 13l8.5-6.5" stroke="#EA4335" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M3.5 6.5V18" stroke="#34A853" strokeWidth="2.5" />
            <path d="M20.5 6.5V18" stroke="#4285F4" strokeWidth="2.5" />
            <path d="M3.5 18h17" stroke="#FBBC05" strokeWidth="2.5" />
          </svg>
        </PlatformLogoShell>
      );
    case "microsoft":
      return (
        <PlatformLogoShell>
          <svg {...common}>
            <rect x="3" y="3" width="8" height="8" fill="#F25022" />
            <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
            <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
            <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
          </svg>
        </PlatformLogoShell>
      );
  }
}

export function PlatformToolIcon({ tool, fallback }: { tool: ToolCardTool; fallback?: ReactNode }) {
  const platformLogo = getPlatformLogoName(tool);
  return platformLogo ? <PlatformLogo name={platformLogo} /> : (fallback ?? <ThemeIcon name={tool.icon} size="xl" />);
}

