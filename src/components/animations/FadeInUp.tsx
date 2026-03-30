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

    const targets = stagger ? Array.from(el.children) : [el];

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
      }
    );

    return () => {
      anim.kill();
    };
  }, [delay, stagger]);

  return (
    <div ref={ref} className={cn(className)} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
