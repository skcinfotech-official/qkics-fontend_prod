import { forwardRef } from "react";
import { cn } from "./cn";

/**
 * Consistent button. Replaces 385 hand-styled <button>s.
 *
 * <Button>Primary</Button>
 * <Button variant="outline" size="sm">…</Button>
 * <Button variant="danger" loading>…</Button>
 */
const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "rounded-[var(--radius)] transition-all duration-200 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background active:scale-[0.97] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 border border-border",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm shadow-danger/20",
  soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm",
  icon: "h-10 w-10 p-0",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className,
    loading = false,
    disabled,
    children,
    type = "button",
    fullWidth = false,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});

export default Button;
