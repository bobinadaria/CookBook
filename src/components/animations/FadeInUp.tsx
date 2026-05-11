"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

interface FadeInUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
}

export default function FadeInUp({
  children,
  className,
  delay = 0,
  stagger = false,
}: FadeInUpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip animation entirely when user requests reduced motion.
    // Also skips on touch devices where GSAP ScrollTrigger can be janky
    // due to inertial scrolling and viewport resizes from the address bar.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const targets = stagger ? Array.from(el.children) : [el];

    // Apply willChange only during animation — constant willChange on many
    // elements causes GPU memory pressure on mobile devices.
    gsap.set(targets, { willChange: "transform, opacity" });

    const anim = gsap.fromTo(
      targets,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onComplete: () => {
          // Release GPU layer after animation finishes
          gsap.set(targets, { willChange: "auto" });
        },
      }
    );

    return () => {
      anim.kill();
    };
  }, [delay, stagger]);

  // No inline willChange — it's set/unset dynamically by GSAP above
  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
