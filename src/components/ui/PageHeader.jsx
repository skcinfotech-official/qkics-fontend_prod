import { FaArrowLeft } from "react-icons/fa";
import { cn } from "./cn";

// Unified page-title scale — every page header renders the same size for symmetry.
const STANDARD_HEADING = "text-2xl md:text-3xl font-bold tracking-tight";
const headingSizes = {
  sm: STANDARD_HEADING,
  md: STANDARD_HEADING,
  lg: STANDARD_HEADING,
};

const alignments = {
  end: "md:items-end",
  center: "md:items-center",
  start: "md:items-start",
};

export function PageHeader({ icon, title, subtitle, description, onBack, size = "md", align = "end", className, children }) {
  return (
    <div className={cn("flex flex-col md:flex-row justify-between gap-6 mb-8 animate-fadeIn", alignments[align], className)}>
      <div className="flex-1">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <FaArrowLeft /> Back
          </button>
        )}
        <h1 className={cn(headingSizes[size] || headingSizes.md, "flex items-center gap-3")}>
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground font-medium mt-1">{subtitle}</p>}
        {description && <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed mt-2">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

export default PageHeader;
