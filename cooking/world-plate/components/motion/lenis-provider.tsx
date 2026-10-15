"use client";

import type Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Smooth scrolling on every page. Skipped entirely for reduced-motion users. */
export function LenisProvider() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    // Loaded on demand so smooth scrolling never competes with the first paint.
    const start = async () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if (media.matches) return;
      const { default: LenisCtor } = await import("lenis");
      if (!cancelled) lenisRef.current = new LenisCtor({ autoRaf: true, lerp: 0.12, anchors: true });
    };
    void start();
    media.addEventListener("change", start);
    return () => {
      cancelled = true;
      media.removeEventListener("change", start);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Next resets scroll on navigation; snap Lenis's internal position to match.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
