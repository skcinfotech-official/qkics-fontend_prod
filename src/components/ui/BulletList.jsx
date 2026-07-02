import { cn } from "./cn";

export function BulletList({ items, className }) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default BulletList;
