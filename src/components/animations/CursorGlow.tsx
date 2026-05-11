"use client";

import { useEffect, useRef } from "react";

/**
 * Soft peach radial spotlight that follows the cursor — desktop only.
 *
 * Touch devices (iOS Safari, Chrome on iOS, Android Chrome):
 *  - No mouse cursor exists → the effect is meaningless.
 *  - Attaching mousemove on mobile wastes battery and memory.
 *  - Detection: `(hover: none)` media query covers all primary touch devices.
 *
 * Prefers-reduced-motion: also skipped for accessibility.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch devices (no cursor) and when user prefers less motion
    const isTouch   = window.matchMedia("(hover: none)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || isReduced) return;

    // Direct DOM manipulation — no React state — keeps it at 60fps
    const onMove = (e: MouseEvent) => {
      el.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(232,149,109,0.05) 0%, transparent 70%)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 transition-none"
      aria-hidden
    />
  );
}
