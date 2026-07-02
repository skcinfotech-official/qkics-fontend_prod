import { cn } from "./cn";

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("py-20 text-center text-muted-foreground", className)}>
      {icon && <div className="text-4xl mb-4 opacity-40">{icon}</div>}
      {title && (
        <p className="text-sm font-black tracking-widest uppercase mb-1">
          {title}
        </p>
      )}
      {description && (
        <p className="text-xs font-medium opacity-60 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
