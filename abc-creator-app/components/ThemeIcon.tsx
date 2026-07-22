import type { ReactNode } from "react";

type ThemeIconProps = {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

function IconShell({ children, size = "md", className = "" }: ThemeIconProps & { children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-transparent text-purple-100 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClasses[size]}>{children}</svg>
    </span>
  );
}

const stroke = "currentColor";
const commonStroke = { stroke, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function withClass(defaultClass: string, className: string) {
  return `${defaultClass} ${className}`.trim();
}

export function ThemeIcon({ name, size = "md", className = "" }: ThemeIconProps) {
  switch (name) {
    case "folder":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M3.5 7.5h6l1.7 2h9.3v8.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" /><path {...commonStroke} d="M3.5 7.5V6.3a2 2 0 0 1 2-2h4.2l1.8 2.1h7a2 2 0 0 1 2 2v1.1" opacity="0.65" /></IconShell>;
    case "writing-pad":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="5" y="4" width="12" height="16" rx="2" /><path {...commonStroke} d="M8 8h5.5M8 11h4.5M8 14h3.2" opacity="0.7" /><path {...commonStroke} d="M14.2 17.7 20 12a1.7 1.7 0 0 0-2.4-2.4l-5.8 5.8-.4 2.7 2.8-.4Z" /><path {...commonStroke} d="m16.8 10.4 2.4 2.4" opacity="0.65" /></IconShell>;
    case "calendar":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="4" y="5.5" width="16" height="14" rx="2" /><path {...commonStroke} d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16" /><path {...commonStroke} d="M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2" opacity="0.7" /></IconShell>;
    case "blog-topic":
      return <IconShell name={name} size={size} className={withClass("text-amber-300", className)}><path {...commonStroke} d="M8 14.5c-1.35-1.15-2.15-2.75-2.15-4.55A6.15 6.15 0 0 1 12 3.8a6.15 6.15 0 0 1 6.15 6.15c0 1.8-.8 3.4-2.15 4.55-.85.72-1.3 1.35-1.42 2.45H9.42C9.3 15.85 8.85 15.22 8 14.5Z" /><path {...commonStroke} d="M9.5 19h5M10 16.95h4" /></IconShell>;
    case "blog-outline":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M5 6.5h14" /><path {...commonStroke} d="M5 12h14" /><path {...commonStroke} d="M5 17.5h14" /></IconShell>;
    case "blog-content":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M5 20h14" /><path {...commonStroke} d="M8 16.5 17.6 7a2.1 2.1 0 0 0-3-3L5 13.6 4.5 18l3.5-1.5Z" /><path {...commonStroke} d="m13.5 5.2 3.2 3.2" opacity="0.7" /></IconShell>;
    case "image-brief":
    case "image":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="4" y="5" width="16" height="14" rx="2" /><path {...commonStroke} d="m5.5 16 4.2-4.2 3.2 3.2 2-2 3.6 3.8" /><circle cx="15.8" cy="9" r="1.3" fill="currentColor" /></IconShell>;
    case "storyboard":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="5" width="17" height="14" rx="2" /><path {...commonStroke} d="M3.5 10h17M9 5v14M15 10v9" /><path {...commonStroke} d="m5.5 8 1.3-1.2L8 8" opacity="0.7" /></IconShell>;
    case "comic":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 5.5h16v10.8H9.5L5.5 20v-3.7H4V5.5Z" /><path {...commonStroke} d="M8 9h8M8 12.5h5" opacity="0.75" /></IconShell>;
    case "prompt":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4.5 6.5h15v11h-15z" /><path {...commonStroke} d="m7 10 2 2-2 2M11.5 14h4.5" /><path {...commonStroke} d="M7 4v2.5M17 4v2.5" opacity="0.65" /></IconShell>;
    case "animation":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 8h16v11H4V8Z" /><path {...commonStroke} d="m4 8 3-4h4L8 8m6-4h4l-3 4" /><path d="m10 11 5 3-5 3v-6Z" fill="currentColor" /></IconShell>;
    case "animation-character":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="12" cy="7" r="3" /><path {...commonStroke} d="M7.5 20v-3.5A4.5 4.5 0 0 1 12 12a4.5 4.5 0 0 1 4.5 4.5V20M9.5 13.2 7 16M14.5 13.2 17 16" /></IconShell>;
    case "seo":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="10.5" cy="10.5" r="5.7" /><path {...commonStroke} d="m15 15 5 5" /></IconShell>;
    case "ad-copy":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 13.5V9.8l11-4.3v12.8l-11-4.8Z" /><path {...commonStroke} d="M15 8.3h2a3.2 3.2 0 0 1 0 6.4h-2" opacity="0.65" /><path {...commonStroke} d="m7 15 1.5 4" /></IconShell>;
    case "campaign":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 10.2h3L15.5 6v12L7 13.8H4v-3.6Z" /><path {...commonStroke} d="m7 13.8 1.4 5h3l-1.3-3.6" /><path {...commonStroke} d="M18 8.5c1 .9 1.5 2 1.5 3.5s-.5 2.6-1.5 3.5M20.2 6.3c1.6 1.5 2.3 3.4 2.3 5.7s-.7 4.2-2.3 5.7" opacity="0.72" /></IconShell>;
    case "product":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5v-7Z" /><path {...commonStroke} d="m6.5 8.8 5.5 3.3 5.5-3.3M12 12.1V19" opacity="0.7" /></IconShell>;
    case "book":
      return <IconShell name={name} size={size} className={className}><g transform="rotate(-10 12 12)"><path {...commonStroke} d="M6.2 4.5h10.3a1.8 1.8 0 0 1 1.8 1.8v12.2H8.2a2.5 2.5 0 0 0-2.5 1.5V5a.5.5 0 0 1 .5-.5Z" /><path {...commonStroke} d="M8.2 4.5v14M8.2 18.5h10.1M11 8h4.5M11 11h4.5" opacity="0.72" /></g></IconShell>;
    case "email":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="5.5" width="17" height="13" rx="2" /><path {...commonStroke} d="m4.5 7 7.5 6 7.5-6" /></IconShell>;
    case "document":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 3.5h8l4 4V20H6V3.5Z" /><path {...commonStroke} d="M14 3.5V8h4M9 12h6M9 15.5h6" opacity="0.75" /></IconShell>;
    case "code":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" /></IconShell>;
    case "briefcase":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="7" width="17" height="12" rx="2" /><path {...commonStroke} d="M9 7V4.5h6V7M3.5 12h17M10 12v2h4v-2" /></IconShell>;
    case "home":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m3.5 11 8.5-7 8.5 7" /><path {...commonStroke} d="M5.5 9.5V20h13V9.5M10 20v-6h4v6" /></IconShell>;
    case "food":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="13" cy="12" r="6" /><path {...commonStroke} d="M3.8 4v7M2.5 4v4.2a1.3 1.3 0 0 0 2.6 0V4M3.8 11v9M20 4v16M20 4c-2 1.6-2.3 4.8 0 6" /></IconShell>;
    case "fashion":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M10 6.2a2 2 0 1 1 3.5 1.3L12 9" /><path {...commonStroke} d="m12 9-8 7h16l-8-7Z" /></IconShell>;
    case "research":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M5 4h10v9H5z" /><path {...commonStroke} d="M8 7h4M8 10h3" opacity="0.7" /><circle {...commonStroke} cx="15.5" cy="15.5" r="4" /><path {...commonStroke} d="m18.4 18.4 2.1 2.1" /></IconShell>;
    case "education":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="m3 9 9-5 9 5-9 5-9-5Z" /><path {...commonStroke} d="M6 11.5v4.2c3.8 2.6 8.2 2.6 12 0v-4.2M21 9v6" /></IconShell>;
    case "chart":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 20V4M4 20h16" /><path {...commonStroke} d="M8 17v-5M12 17V8M16 17v-9M20 17V5" /></IconShell>;
    case "finance":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="8.5" cy="12" r="5.2" /><path {...commonStroke} d="M8.5 7.3v9.4M10.8 9.2H8a1.8 1.8 0 1 0 0 3.6h1a1.8 1.8 0 1 1 0 3.6H6.2" /><path {...commonStroke} d="m14.5 17.5 2.7-3.2 2 1.1 2.3-4" /></IconShell>;
    case "legal":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M12 4v16M7 20h10M5 7h14M7 7l-3 6h6L7 7ZM17 7l-3 6h6l-3-6Z" /></IconShell>;
    case "support":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 13v-2a8 8 0 0 1 16 0v2" /><path {...commonStroke} d="M4 12h3v5H5a1 1 0 0 1-1-1v-4ZM20 12h-3v5h2a1 1 0 0 0 1-1v-4ZM17 18c-1 1.3-2.6 2-5 2" /></IconShell>;
    case "sales":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M4 19h16M6 16l4-4 3 2 5-7" /><path {...commonStroke} d="M14.5 7H18v3.5" /></IconShell>;
    case "people":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="9" cy="8" r="3" /><circle {...commonStroke} cx="17" cy="9" r="2.2" /><path {...commonStroke} d="M3.5 20v-2.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V20M15 14.2h1.7a3.8 3.8 0 0 1 3.8 3.8v2" /></IconShell>;
    case "shield":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M12 3.5 19 6v5.2c0 4.6-2.7 7.5-7 9.3-4.3-1.8-7-4.7-7-9.3V6l7-2.5Z" /><path {...commonStroke} d="m9 12 2 2 4-4" /></IconShell>;
    case "presentation":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="4" width="17" height="12" rx="1.5" /><path {...commonStroke} d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4" /></IconShell>;
    case "poster":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="5" y="3" width="14" height="18" rx="2" /><path {...commonStroke} d="M8 7h8M8 10h5M8 17l3-3 2 2 3-4" /></IconShell>;
    case "social":
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="6" cy="12" r="2.5" /><circle {...commonStroke} cx="18" cy="6" r="2.5" /><circle {...commonStroke} cx="18" cy="18" r="2.5" /><path {...commonStroke} d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></IconShell>;
    case "video":
      return <IconShell name={name} size={size} className={className}><rect {...commonStroke} x="3.5" y="5" width="17" height="14" rx="3" /><path d="m10 9 5.5 3-5.5 3V9Z" fill="currentColor" /><path {...commonStroke} d="M7 3.5v2M12 3.5v2M17 3.5v2" opacity="0.6" /></IconShell>;
    case "script":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M6 3.5h9l3 3V20H6V3.5Z" /><path {...commonStroke} d="M15 3.5V7h3M9 11h6M9 14h6M9 17h4" opacity="0.75" /></IconShell>;
    case "bolt":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M13 2.8 5.8 13h5.4L10 21.2 18.2 10h-5.6L13 2.8Z" /></IconShell>;
    case "spark":
      return <IconShell name={name} size={size} className={className}><path {...commonStroke} d="M12 3.5 13.8 9l5.7 1.7-5.7 1.8L12 18l-1.8-5.5-5.7-1.8L10.2 9 12 3.5Z" /><path {...commonStroke} d="M18.5 16.5 19.3 19l2.2.7-2.2.7-.8 2.1-.7-2.1-2.3-.7 2.3-.7.7-2.5Z" opacity="0.75" /></IconShell>;
    case "idea":
      return <IconShell name={name} size={size} className={withClass("text-amber-300", className)}><path {...commonStroke} d="M8 14.5c-1.4-1.2-2.2-2.8-2.2-4.6A6.2 6.2 0 0 1 12 3.7a6.2 6.2 0 0 1 6.2 6.2c0 1.8-.8 3.4-2.2 4.6-.8.7-1.3 1.4-1.4 2.5H9.4c-.1-1.1-.6-1.8-1.4-2.5Z" /><path {...commonStroke} d="M9.5 20h5M10 17h4" /></IconShell>;
    default:
      return <IconShell name={name} size={size} className={className}><circle {...commonStroke} cx="12" cy="12" r="7" /><path {...commonStroke} d="M9 12h6M12 9v6" /></IconShell>;
  }
}
