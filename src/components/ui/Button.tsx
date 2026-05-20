import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "accent" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Растянуть на всю ширину контейнера (как submit в auth-формах). */
  fullWidth?: boolean;
  /** Показывает спиннер и блокирует кнопку пока true. */
  loading?: boolean;
}

/*
 * Стили совпадают с живым дизайном сайта: угольная «таблетка» (rounded-full),
 * primary = charcoal→peach на hover. Раньше компонент был персиковый/rounded-2xl
 * и не совпадал с тем, что в проде, поэтому им никто не пользовался.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-charcoal text-cream hover:bg-peach",
  accent: "bg-peach/10 text-peach border border-peach/20 hover:bg-peach/20",
  ghost:
    "text-charcoal/50 hover:text-charcoal border border-charcoal/10 hover:border-charcoal/25",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/40 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
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
  },
);

Button.displayName = "Button";
export default Button;
