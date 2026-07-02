import { cn } from "./cn";

const sizes = {
  sm: "h-6 w-6 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-2",
};

export function LoadingSpinner({ size = "md", className, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "animate-spin rounded-full border-t-primary border-muted",
          sizes[size] || sizes.md,
          className
        )}
      />
      {label && (
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>
      )}
    </div>
  );
}

export function FullPageLoader({ label }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

export default LoadingSpinner;
