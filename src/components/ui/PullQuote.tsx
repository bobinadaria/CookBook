import { cn } from "@/lib/utils";

interface PullQuoteProps {
  children: React.ReactNode;
  /** Подпись под цитатой (caps-eyebrow стилем). */
  author?: string;
  className?: string;
}

/**
 * PullQuote — крупная цитата с кавычками-засечками.
 * Сетка [marks 1fr marks], бордеры сверху/снизу 2px burg, текст display italic.
 * Мобильные размеры уменьшены, десктоп — как в прототипе.
 */
export default function PullQuote({ children, author, className }: PullQuoteProps) {
  return (
    <figure
      className={cn(
        "my-8 grid grid-cols-[28px_1fr_28px] items-center gap-4 border-y-2 border-burg py-8 sm:grid-cols-[60px_1fr_60px] sm:gap-8 sm:py-10",
        className,
      )}
    >
      <span aria-hidden className="text-right font-display text-[56px] leading-[0.5] text-ochre sm:text-[96px]">
        &ldquo;
      </span>
      <div className="text-center">
        <blockquote className="font-display text-[26px] font-normal italic leading-[1.2] tracking-[-0.5px] text-burg sm:text-[44px] sm:leading-[1.15]">
          {children}
        </blockquote>
        {author && (
          <figcaption className="mt-[18px] font-body text-[11px] font-semibold uppercase not-italic tracking-[0.2em] text-soft sm:mt-[22px]">
            {author}
          </figcaption>
        )}
      </div>
      <span aria-hidden className="text-left font-display text-[56px] leading-[0.5] text-ochre sm:text-[96px]">
        &rdquo;
      </span>
    </figure>
  );
}
