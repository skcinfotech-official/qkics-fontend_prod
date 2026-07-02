import { cn } from "./cn";

/**
 * Surface container. Auto-themed via tokens — no `dark:` needed.
 * <Card><CardHeader>…</CardHeader><CardBody>…</CardBody></Card>
 */
export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-border rounded-2xl shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("p-4 sm:p-5 border-b border-border", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 sm:p-5 border-t border-border flex items-center gap-3",
        className
      )}
      {...props}
    />
  );
}

export default Card;
