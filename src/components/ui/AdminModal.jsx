import { FaTimes } from "react-icons/fa";
import ModalOverlay from "./ModalOverlay";
import { cn } from "./cn";

/**
 * Shared themed modal shell for the admin panel. Built on ModalOverlay
 * (portal + Esc-to-close + backdrop click + body scroll lock) and the
 * red/white token system, so no `dark:` / isDark branching is needed.
 *
 *   <AdminModal open={x} onClose={close} title="…" icon={<FaUser/>}
 *               footer={<Button>Save</Button>}>
 *     …body…
 *   </AdminModal>
 */
const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function AdminModal({
  open = true,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  footer,
  headerExtra,
  bodyClassName = "px-5 sm:px-6 py-5",
  className,
  children,
}) {
  if (!open) return null;

  return (
    <ModalOverlay close={onClose}>
      <div
        className={cn(
          "w-full text-left bg-card text-card-foreground border border-border",
          "rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-pop overflow-hidden",
          sizes[size] || sizes.md,
          className
        )}
      >
        {/* Header */}
        {(title || icon) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary text-lg">
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-lg font-bold tracking-tight truncate">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className={cn("flex-1 overflow-y-auto custom-scrollbar", bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
