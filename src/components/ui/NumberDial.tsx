import { cn } from "@/lib/utils";

interface NumberDialProps {
  /** Цифра/символ в центре (например римская I или число). */
  n: React.ReactNode;
  /** Опциональная caps-подпись под цифрой. */
  label?: string;
  className?: string;
}

/**
 * NumberDial — квадрат 88×88 на ochre с display-цифрой и опциональной caps-подписью.
 */
export default function NumberDial({ n, label, className }: NumberDialProps) {
  return (
    <div
      className={cn(
        "flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center bg-ochre",
        className,
      )}
    >
      <span className="font-display text-[38px] font-normal leading-none text-burg">{n}</span>
      {label && (
        <span className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-[0.16em] text-burg">
          {label}
        </span>
      )}
    </div>
  );
}
