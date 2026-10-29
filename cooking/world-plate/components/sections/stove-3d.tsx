"use client";

import { useEffect, useRef } from "react";
import { StoveScene } from "@/components/sections/stove-scene";

/**
 * The closing panel's stove: the real-time 3D one (lib/three/stove.ts) once three.js has loaded — fetched only as
 * the panel comes near — over the illustrated StoveScene, which stays as the fallback without WebGL. The flame
 * follows the panel's scroll progress (--p on the [data-progress] section, the same --lit curve as the drawing).
 * Reduced motion: one still frame, lit.
 */
export function Stove3D() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const canvas = el?.querySelector("canvas");
    if (!el || !canvas) return;
    const section = el.closest<HTMLElement>("[data-progress]");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const getLit = () => {
      const p = parseFloat(section?.style.getPropertyValue("--p") ?? "");
      const v = Number.isFinite(p) ? p : 1;
      return Math.min(1, Math.max(0, (v - 0.12) / 0.3));
    };
    let stop: (() => void) | undefined;
    let gone = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        import("@/lib/three/kit")
          .then(async (kit) => {
            if (gone || !kit.webglAvailable()) return;
            const { startStove } = await import("@/lib/three/stove");
            if (gone) return;
            stop = startStove(canvas, getLit, still);
            el.dataset.three = "";
          })
          .catch(() => {});
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => {
      gone = true;
      io.disconnect();
      stop?.();
    };
  }, []);

  return (
    <div ref={root} className="stove-3d" aria-hidden>
      <canvas className="stove-3d__canvas" />
      <StoveScene />
    </div>
  );
}
