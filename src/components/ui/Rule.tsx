import { cn } from "@/lib/utils";

interface RuleProps {
  /** thin = 1px rule-цвет; bold = 2px burg. */
  variant?: "thin" | "bold";
  className?: string;
}

/**
 * Rule — горизонтальная линия-правило. Основной способ создавать глубину
 * в magazine-стиле (вместо теней).
 */
export default function Rule({ variant = "thin", className }: RuleProps) {
  return (
    <div
      role="separator"
      aria-hidden
      className={cn(variant === "bold" ? "h-0.5 bg-burg" : "h-px bg-rule", className)}
    />
  );
}
