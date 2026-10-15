"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE_LD = [0.22, 0.61, 0.36, 1] as const;

/**
 * Scroll-triggered heading entrance: fades up 40px once, LaunchDarkly curve.
 * Reduced motion: MotionConfig reducedMotion="user" drops `y`, leaving the fade.
 */
export function MaskReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <m.span
      className={cn("inline-block", className)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_LD }}
    >
      {children}
    </m.span>
  );
}
