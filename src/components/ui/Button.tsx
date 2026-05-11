import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-peach text-white hover:bg-peach-dark active:scale-[0.98] shadow-sm",
  secondary:
    "bg-sage text-white hover:bg-sage-dark active:scale-[0.98] shadow-sm",
  ghost:
    "bg-transparent text-charcoal border border-charcoal/15 hover:border-charcoal/35 hover:bg-sand",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-2xl",
  lg: "px-7 py-3.5 text-base rounded-2xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
