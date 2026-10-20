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
      if (cancelled) return;
      lenisRef.current = new LenisCtor({ autoRaf: true, lerp: 0.12, anchors: true });
      // The intro owns the wheel until it has opened (IntroCurtain).
      if (document.documentElement.hasAttribute("data-intro-lock")) lenisRef.current.stop();
    };
    const resume = () => lenisRef.current?.start();
    // "Back to the top" (the header logo on the home page): a quick glide, or a jump for reduced motion.
    const toTop = () => {
      if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: media.matches ? "auto" : "smooth" });
    };
    void start();
    media.addEventListener("change", start);
    window.addEventListener("wp:intro-done", resume);
    window.addEventListener("wp:scroll-top", toTop);
    return () => {
      cancelled = true;
      media.removeEventListener("change", start);
      window.removeEventListener("wp:intro-done", resume);
      window.removeEventListener("wp:scroll-top", toTop);
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
