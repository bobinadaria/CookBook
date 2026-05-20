import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  /** Tailwind text-color класс. По умолчанию text-soft. */
  color?: string;
  as?: "div" | "span" | "p";
  className?: string;
}

/**
 * SectionLabel — caps-label поменьше Eyebrow, для подсекций и мета-строк.
 * Work Sans 10px, weight 600, uppercase.
 */
export default function SectionLabel({
  children,
  color = "text-soft",
  as: Tag = "div",
  className,
}: SectionLabelProps) {
  return (
    <Tag
      className={cn(
        "font-body text-[10px] font-semibold uppercase tracking-[0.18em]",
        color,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
