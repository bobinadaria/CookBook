"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

/**
 * Wraps children with a stagger-aware IntersectionObserver fade-in.
 * Stagger delay cycles every 4 items (one grid row) — max 0.3s.
 */
export default function RevealCard({ children, index = 0, className }: RevealCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Cycle delay per visual column (max 4 wide), so rows reset rather than accumulate.
  const delay = (index % 4) * 0.1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference at runtime too
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
