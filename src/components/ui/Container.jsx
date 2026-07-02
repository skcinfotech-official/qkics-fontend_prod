import { cn } from "./cn";

/**
 * Page width + responsive padding in ONE place. Fixes:
 *  - inconsistent max-w-* across pages
 *  - oversized p-8/p-12 that crush small screens
 *
 * Padding scales: px-4 (mobile) → sm:px-6 → lg:px-8. Never a fixed px width.
 *
 * size: "sm" | "md" | "lg" | "xl" | "full"
 */
const widths = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export default function Container({ size = "xl", className, ...props }) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        widths[size] || widths.xl,
        className
      )}
      {...props}
    />
  );
}
