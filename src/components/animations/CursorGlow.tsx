"use client";

import { useEffect, useRef } from "react";

/**
 * Replaces WaterEffect.
 *
 * — On background: soft peach radial spotlight (600px, 4% opacity) that follows the cursor.
 *   Gives a warm "flashlight on parchment" feel without distracting motion.
 *
 * — On interactive elements (links, buttons): no special treatment here —
 *   see the arrow indicator in RecipeCard for the clickability affordance.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use direct DOM manipulation (no React state) for silky-smooth 60 fps
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
