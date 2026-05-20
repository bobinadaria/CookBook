import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  /** Tailwind text-color класс. По умолчанию text-ochre-dk (как в §4 хендоффа). */
  color?: string;
  /** HTML-тег. По умолчанию div. */
  as?: "div" | "span" | "p";
  className?: string;
}

/**
 * Eyebrow — caps-label над заголовками секций.
 * Work Sans (font-body) 11px, weight 600, uppercase, широкий трекинг.
 * Цвет передаётся отдельным пропом `color`, чтобы не было конфликта
 * двух text-* классов в className.
 */
export default function Eyebrow({
  children,
  color = "text-ochre-dk",
  as: Tag = "div",
  className,
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "font-body text-[11px] font-semibold uppercase tracking-[0.2em]",
        color,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
