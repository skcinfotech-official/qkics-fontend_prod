import { forwardRef } from "react";
import { cn } from "./cn";

/**
 * Token-themed input. Optional label + error.
 * <Input label="Email" type="email" error={errors.email} />
 */
const Input = forwardRef(function Input(
  { label, error, className, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold text-muted-foreground"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full h-11 px-3.5 rounded-[var(--radius)] text-sm",
          "bg-card text-foreground border border-input",
          "placeholder:text-muted-foreground/70",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "transition-shadow disabled:opacity-60",
          error && "border-danger focus:ring-danger",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export default Input;
