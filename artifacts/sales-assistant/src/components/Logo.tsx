import logoUrl from "@/assets/niwe-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "framed" | "dark-frame" | "hero";
  className?: string;
}

const HEIGHTS: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-7",   // 28px — tight nav
  sm: "h-9",   // 36px — top bars
  md: "h-14",  // 56px — section header
  lg: "h-20",  // 80px — login card
  xl: "h-28",  // 112px — landing hero
};

/**
 * NIWE Weddings logo. The PNG has a built-in cream backdrop that pairs
 * elegantly with both light and dark layouts.
 *
 * variant:
 *   - default: bare logo (its own cream box is part of the design)
 *   - framed: subtle rounded frame with soft shadow for light contexts
 *   - dark-frame: glowing amber border on dark backgrounds
 *   - hero: large elegant frame with gold underline accent for landing/hero use
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
      <div
        className={cn(
          "inline-flex rounded-lg overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.15)] ring-1 ring-black/5",
          className,
        )}
      >
        {img}
      </div>
    );
  }

  if (variant === "dark-frame") {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg overflow-hidden ring-1 ring-amber-400/40 shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)]",
          className,
        )}
      >
        {img}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-3", className)}>
        <div className="rounded-xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-amber-200/60">
          {img}
        </div>
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400/60" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-amber-600/80 font-medium">
            Hochzeitsportal
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>
      </div>
    );
  }

  return <div className={cn("inline-flex", className)}>{img}</div>;
}
