import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-soft uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2.5 rounded-none text-sm text-ink bg-crust/50",
            "border border-rule placeholder:text-muted",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-burg/30 focus:border-burg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:ring-red-300/40 focus:border-red-400",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-soft">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
