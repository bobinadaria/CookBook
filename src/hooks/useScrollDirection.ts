"use client";

import { useEffect, useState } from "react";

export function useScrollDirection() {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let prev = window.scrollY;

    const onScroll = () => {
      const curr = window.scrollY;
      if (Math.abs(curr - prev) < 5) return; // ignore micro-movements
      setDirection(curr > prev ? "down" : "up");
      setScrollY(curr);
      prev = curr;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return {
    scrollY,
    direction,
    isAtTop: scrollY < 10,
  };
}
