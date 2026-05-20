import { cn } from "@/lib/utils";

interface DropCapProps {
  children: React.ReactNode;
  /** Tailwind text-color класс. По умолчанию text-burg. */
  color?: string;
  className?: string;
}

/**
 * DropCap — буквица для первого символа «story»-абзацев.
 * Display-шрифт (Playfair) 92px, float:left, плотный leading.
 */
export default function DropCap({
  children,
  color = "text-burg",
  className,
}: DropCapProps) {
  return (
    <span
      className={cn(
        "float-left pr-[14px] pt-[8px] font-display text-[92px] font-normal not-italic leading-[0.82]",
        color,
        className,
      )}
    >
      {children}
    </span>
  );
}
