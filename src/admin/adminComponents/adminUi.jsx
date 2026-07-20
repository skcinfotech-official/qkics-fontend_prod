import { useRef, useState } from "react";
import { FaSearch, FaCheck, FaChevronDown } from "react-icons/fa";
import { cn } from "../../components/ui/cn";
import { LoadingSpinner, EmptyState } from "../../components/ui";
import useClickOutside from "../../components/hooks/useClickOutside";

/* Shared form-field styles for admin modals (token-themed). */
export const FIELD_CLASS =
  "w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-foreground " +
  "outline-none transition-colors focus:border-primary focus:bg-card placeholder:text-muted-foreground";

export const LABEL_CLASS =
  "block text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1";

/* Section heading inside a modal form. */
export function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 mb-3">{title}</h3>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Role / status pills — token-themed, consistent across admin.
─────────────────────────────────────────────────────────────── */
const ROLE_STYLES = {
  superadmin:   "bg-primary-soft text-primary",
  admin:        "bg-primary-soft text-primary",
  expert:       "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  investor:     "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  entrepreneur: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  normal:       "bg-muted text-muted-foreground",
};

export function RoleBadge({ role, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wide",
        ROLE_STYLES[role] || ROLE_STYLES.normal,
        className
      )}
    >
      {role || "—"}
    </span>
  );
}

export function StatusBadge({ active, activeLabel = "Active", inactiveLabel = "Inactive", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wide",
        active
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-green-500" : "bg-red-500")} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────
   AdminTable — one themed table shell for every list page.
   columns: [{ key, label, align?: "center"|"right", className? }]
   renderRow(row, index) → array/fragment of <td>s
─────────────────────────────────────────────────────────────── */
export function AdminTable({
  columns,
  rows = [],
  loading = false,
  renderRow,
  keyField = "id",
  empty = {},
  footer,
  loadingLabel = "Loading…",
  className,
}) {
  const alignClass = (a) => (a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left");

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      {loading ? (
        <div className="py-20">
          <LoadingSpinner label={loadingLabel} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title || "Nothing here yet"}
          description={empty.description}
        />
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "py-3.5 px-5 text-2xs font-bold uppercase tracking-wider whitespace-nowrap",
                      alignClass(c.align),
                      c.className
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={row[keyField] ?? i} className="transition-colors hover:bg-muted/40">
                  {renderRow(row, i)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   SearchableMultiSelect — token-themed multi-pick dropdown.
   options: [{ id, name }]
─────────────────────────────────────────────────────────────── */
export function SearchableMultiSelect({ label, options = [], selectedIds = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const ref = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggle = (id) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );

  const display =
    selectedIds.length > 0
      ? options.filter((o) => selectedIds.includes(o.id)).map((o) => o.name).join(", ")
      : `Select ${label}`;

  return (
    <div className="relative" ref={ref}>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(FIELD_CLASS, "flex items-center justify-between text-left")}
      >
        <span className={cn("truncate pr-3", selectedIds.length === 0 && "text-muted-foreground")}>
          {display}
        </span>
        <FaChevronDown className="shrink-0 text-2xs text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
              <FaSearch className="text-2xs text-muted-foreground" />
              <input
                type="text"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder={`Search ${label}…`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filtered.length > 0 ? (
              filtered.map((o) => {
                const active = selectedIds.includes(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md p-2 text-sm text-left transition-colors",
                      active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        active ? "bg-primary border-primary" : "border-input"
                      )}
                    >
                      {active && <FaCheck className="text-primary-foreground text-3xs" />}
                    </span>
                    {o.name}
                  </button>
                );
              })
            ) : (
              <p className="p-3 text-center text-sm text-muted-foreground">
                No matching {label?.toLowerCase()} found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable Prev/Next pagination bar for AdminTable footers. */
export function TablePagination({ page, totalPages, totalItems, shownItems, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
      <span className="text-xs text-muted-foreground font-medium">
        Showing <strong className="text-foreground">{shownItems}</strong> of{" "}
        <strong className="text-foreground">{totalItems}</strong>
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
