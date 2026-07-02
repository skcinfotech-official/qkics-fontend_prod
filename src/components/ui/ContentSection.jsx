import { cn } from "./cn";

export function ContentSection({ title, last, className, children }) {
  return (
    <section className={cn(last ? "" : "pb-6 border-b border-border", className)}>
      {title && <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default ContentSection;
