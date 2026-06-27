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

export function ThemeIcon({ name, size = "md", className = "" }: ThemeIconProps) {
  switch (name) {
    case "folder":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M3.5 7.5h6l1.7 2h9.3v8.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
          <path {...commonStroke} d="M3.5 7.5V6.3a2 2 0 0 1 2-2h4.2l1.8 2.1h7a2 2 0 0 1 2 2v1.1" opacity="0.65" />
        </IconShell>
      );
    case "blog-topic":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M7 3.8h7.2L19 8.6v11.6H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" />
          <path {...commonStroke} d="M14 4v5h5" opacity="0.7" />
          <path {...commonStroke} d="M8.5 13h6.2M8.5 16h4" />
          <path {...commonStroke} d="m16 14.5 2 2 2.8-3.4" />
        </IconShell>
      );
    case "blog-outline":
      return (
        <IconShell name={name} size={size} className={className}>
          <path {...commonStroke} d="M5 5.5h14M5 12h14M5 18.5h14" />
          <path {...commonStroke} d="M8 8.5v7M12 8.5v7M16 8.5v7" opacity="0.55" />
          <circle cx="5" cy="5.5" r="1.2" fill="currentColor" />
          <circle cx="5" cy="12" r="1.2" fill="currentColor" />
          <circle cx="5" cy="18.5" r="1.2" fill="currentColor" />
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
          <path {...commonStroke} d="M7.8 10.4h5.4M10.5 7.7v5.4" opacity="0.65" />
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
        <IconShell name={name} size={size} className={className}>
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
