import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "peach" | "sage" | "sand";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-burg/8 text-soft",
  peach:   "bg-ochre/15 text-ochre-dk",
  sage:    "bg-olive/15 text-olive",
  sand:    "bg-crust text-soft",
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
        "inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
