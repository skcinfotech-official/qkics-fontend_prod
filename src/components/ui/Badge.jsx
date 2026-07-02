import { cn } from "./cn";

/**
 * Small status/label pill. For role badges use UserBadge.
 * <Badge variant="success">Active</Badge>
 */
const variants = {
  primary: "bg-primary-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  outline: "border border-border text-foreground",
};

export default function Badge({ variant = "neutral", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full",
        "text-xs font-semibold uppercase tracking-wide",
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    />
  );
}
