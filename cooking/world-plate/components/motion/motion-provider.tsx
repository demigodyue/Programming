"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

let ready = false;
const listeners = new Set<() => void>();
const loadFeatures = () =>
  import("./motion-features").then((mod) => {
    ready = true;
    listeners.forEach((l) => l());
    return mod.default;
  });

/**
 * True once Motion's animation features have loaded. Until then an exit animation never runs, so an
 * `AnimatePresence` would keep its leaving children on screen: lists that filter (RecipeBrowser) swap in place
 * until this turns true.
 */
export function useMotionReady() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ready,
    () => false,
  );
}

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
