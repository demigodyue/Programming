"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * - LazyMotion: components use the tiny `m.*` renderer; animation/layout features load after
 *   hydration, off the critical path (strict = a stray full `motion.*` component throws in dev).
 * - reducedMotion="user": for visitors who prefer reduced motion, Motion skips transform and layout
 *   animations and keeps opacity — "simple fades only" — without components branching at render time.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
