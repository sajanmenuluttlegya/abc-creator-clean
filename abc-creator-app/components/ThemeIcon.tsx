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

function IconShell({
  children,
  size = "md",
  className = "",
}: ThemeIconProps & { children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-transparent text-purple-100 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        {children}
      </svg>
    </span>
  );
}

const stroke = "currentColor";
const commonStroke = {
  stroke,
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function withClass(defaultClass: string, className: string) {
  return `${defaultClass} ${className}`.trim();
}

export function ThemeIcon({ name, size = "md", className = "" }: ThemeIconProps) {
  switch (name) {
    case "folder":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M3.5 7.5h6l1.7 2h9.3v8.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
          <path {...commonStroke} d="M3.5 7.5V6.3a2 2 0 0 1 2-2h4.2l1.8 2.1h7a2 2 0 0 1 2 2v1.1" opacity="0.65" />
        </IconShell>
      );
    case "writing-pad":
      return (
        <IconShell name={name} size={size} className={className}>
          <rect {...commonStroke} x="5" y="4" width="12" height="16" rx="2" />
          <path {...commonStroke} d="M8 8h5.5M8 11h4.5M8 14h3.2" opacity="0.7" />
          <path {...commonStroke} d="M14.2 17.7 20 12a1.7 1.7 0 0 0-2.4-2.4l-5.8 5.8-.4 2.7 2.8-.4Z" />
          <path {...commonStroke} d="m16.8 10.4 2.4 2.4" opacity="0.65" />
        </IconShell>
      );
    case "calendar":
      return (
        <IconShell name={name} size={size} className={className}>
          <rect {...commonStroke} x="4" y="5.5" width="16" height="14" rx="2" />
          <path {...commonStroke} d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16" />
          <path {...commonStroke} d="M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2" opacity="0.7" />
        </IconShell>
      );
    case "blog-topic":
      return (
        <IconShell name={name} size={size} className={withClass("text-amber-300", className)}>
          <path {...commonStroke} d="M8 14.5c-1.35-1.15-2.15-2.75-2.15-4.55A6.15 6.15 0 0 1 12 3.8a6.15 6.15 0 0 1 6.15 6.15c0 1.8-.8 3.4-2.15 4.55-.85.72-1.3 1.35-1.42 2.45H9.42C9.3 15.85 8.85 15.22 8 14.5Z" />
          <path {...commonStroke} d="M9.5 19h5M10 16.95h4" />
        </IconShell>
      );
    case "blog-outline":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M5 6.5h14" />
          <path {...commonStroke} d="M5 12h14" />
          <path {...commonStroke} d="M5 17.5h14" />
        </IconShell>
      );
    case "blog-content":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M5 20h14" />
          <path {...commonStroke} d="M8 16.5 17.6 7a2.1 2.1 0 0 0-3-3L5 13.6 4.5 18l3.5-1.5Z" />
          <path {...commonStroke} d="m13.5 5.2 3.2 3.2" opacity="0.7" />
        </IconShell>
      );
    case "image-brief":
      return (
        <IconShell name={name} size={size} className={className}>
          <rect {...commonStroke} x="4" y="5" width="16" height="14" rx="2" />
          <path {...commonStroke} d="m5.5 16 4.2-4.2 3.2 3.2 2-2 3.6 3.8" />
          <circle cx="15.8" cy="9" r="1.3" fill="currentColor" />
        </IconShell>
      );
    case "seo":
      return (
        <IconShell name={name} size={size} className={className}>
          <circle {...commonStroke} cx="10.5" cy="10.5" r="5.7" />
          <path {...commonStroke} d="m15 15 5 5" />
        </IconShell>
      );
    case "ad-copy":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M4 13.5V9.8l11-4.3v12.8l-11-4.8Z" />
          <path {...commonStroke} d="M15 8.3h2a3.2 3.2 0 0 1 0 6.4h-2" opacity="0.65" />
          <path {...commonStroke} d="m7 15 1.5 4" />
        </IconShell>
      );
    case "product":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5v-7Z" />
          <path {...commonStroke} d="m6.5 8.8 5.5 3.3 5.5-3.3M12 12.1V19" opacity="0.7" />
        </IconShell>
      );
    case "bolt":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M13 2.8 5.8 13h5.4L10 21.2 18.2 10h-5.6L13 2.8Z" />
        </IconShell>
      );
    case "spark":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M12 3.5 13.8 9l5.7 1.7-5.7 1.8L12 18l-1.8-5.5-5.7-1.8L10.2 9 12 3.5Z" />
          <path {...commonStroke} d="M18.5 16.5 19.3 19l2.2.7-2.2.7-.8 2.1-.7-2.1-2.3-.7 2.3-.7.7-2.5Z" opacity="0.75" />
        </IconShell>
      );
    case "idea":
      return (
        <IconShell name={name} size={size} className={withClass("text-amber-300", className)}>
          <path {...commonStroke} d="M8 14.5c-1.4-1.2-2.2-2.8-2.2-4.6A6.2 6.2 0 0 1 12 3.7a6.2 6.2 0 0 1 6.2 6.2c0 1.8-.8 3.4-2.2 4.6-.8.7-1.3 1.4-1.4 2.5H9.4c-.1-1.1-.6-1.8-1.4-2.5Z" />
          <path {...commonStroke} d="M9.5 20h5M10 17h4" />
        </IconShell>
      );
    default:
      return (
        <IconShell name={name} size={size} className={className}>
          <circle {...commonStroke} cx="12" cy="12" r="7" />
          <path {...commonStroke} d="M9 12h6M12 9v6" />
        </IconShell>
      );
  }
}