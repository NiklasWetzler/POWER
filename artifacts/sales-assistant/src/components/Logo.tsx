import logoUrl from "@/assets/niwe-logo-dark.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "hero" | "light";
  className?: string;
}

const HEIGHTS: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-8",   // 32px — nav bars
  sm: "h-10",  // 40px — top bars
  md: "h-16",  // 64px — section header
  lg: "h-24",  // 96px — login card
  xl: "h-32",  // 128px — landing hero
};

/**
 * NIWE Weddings logo — dark, elegant serif on transparent background.
 *
 * variant:
 *   - default: black logo, for light backgrounds
 *   - hero: large with a thin gold underline accent
 *   - light: inverted (white) — for dark backgrounds (admin, dark headers)
 */
export function Logo({ size = "sm", variant = "default", className }: LogoProps) {
  const isLight = variant === "light";

  const img = (
    <img
      src={logoUrl}
      alt="NIWE Weddings"
      className={cn(
        HEIGHTS[size],
        "w-auto select-none object-contain",
        isLight && "invert brightness-200",
      )}
      draggable={false}
    />
  );

  if (variant === "hero") {
    return <div className={cn("inline-flex", className)}>{img}</div>;
  }

  return <div className={cn("inline-flex", className)}>{img}</div>;
}
