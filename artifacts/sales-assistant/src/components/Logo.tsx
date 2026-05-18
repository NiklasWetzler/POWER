import logoUrl from "@/assets/niwe-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "framed" | "dark-frame";
  className?: string;
}

const HEIGHTS: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-6",   // 24px — tight nav
  sm: "h-8",   // 32px — top bars
  md: "h-12",  // 48px — section header
  lg: "h-16",  // 64px — login card
  xl: "h-24",  // 96px — landing hero
};

/**
 * NIWE Weddings logo. The PNG has a built-in cream backdrop that pairs
 * elegantly with both light and dark layouts.
 *
 * variant:
 *   - default: bare logo (its own cream box is part of the design)
 *   - framed: subtle rounded shadow frame for hero placements
 *   - dark-frame: glowing border on dark backgrounds
 */
export function Logo({ size = "sm", variant = "default", className }: LogoProps) {
  const img = (
    <img
      src={logoUrl}
      alt="NIWE Weddings"
      className={cn(HEIGHTS[size], "w-auto select-none object-contain")}
      draggable={false}
    />
  );

  if (variant === "framed") {
    return (
      <div className={cn("inline-flex rounded-md overflow-hidden shadow-sm ring-1 ring-black/5", className)}>
        {img}
      </div>
    );
  }

  if (variant === "dark-frame") {
    return (
      <div className={cn("inline-flex rounded-md overflow-hidden ring-1 ring-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]", className)}>
        {img}
      </div>
    );
  }

  return <div className={cn("inline-flex", className)}>{img}</div>;
}
