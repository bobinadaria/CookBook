import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "peach" | "sage" | "sand";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-charcoal/8 text-charcoal/70",
  peach:   "bg-peach/10 text-peach",
  sage:    "bg-sage/15 text-sage-dark",
  sand:    "bg-sand text-charcoal/60",
};

export default function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
