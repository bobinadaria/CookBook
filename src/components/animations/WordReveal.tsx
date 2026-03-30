"use client";

import { useRef, useEffect, useState } from "react";

interface WordRevealProps {
  children: string;
  className?: string;
  /** Stagger delay per word in seconds (default 0.05) */
  staggerDelay?: number;
}

/**
 * Splits text into words and reveals each word sequentially when
 * the element enters the viewport (IntersectionObserver).
 */
export default function WordReveal({ children, className, staggerDelay = 0.05 }: WordRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = children.split(" ");

  return (
    <span ref={ref} className={className} aria-label={children}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: "inline-block",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(12px)",
            transition: revealed
              ? `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * staggerDelay}s, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * staggerDelay}s`
              : "none",
            willChange: "transform, opacity",
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}
