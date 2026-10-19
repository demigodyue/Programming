"use client";

import { useEffect } from "react";

/**
 * Cult Eats' mouse depth: every `[data-depth]` element drifts with the pointer by depth × (40px, 30px),
 * eased toward the target each frame (8% of the gap per frame), so near layers move more than far ones.
 * It writes `transform` only, which composes with ScrollMotion's parallax (that writes `translate`).
 * Fine pointers only; skipped for reduced motion. Elements from client navigations are picked up.
 */
export function MouseDepth() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let layers: { el: HTMLElement; depth: number }[] = [];
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let pending = 0;

    const collect = () => {
      pending = 0;
      layers = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"), (el) => ({
        el,
        depth: Number(el.dataset.depth) || 0,
      }));
    };
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      for (const { el, depth } of layers) {
        el.style.transform = `translate3d(${(x * depth * 40).toFixed(2)}px, ${(y * depth * 30).toFixed(2)}px, 0)`;
      }
      frame = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    collect();
    const mo = new MutationObserver(() => {
      if (!pending) pending = requestAnimationFrame(collect);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      layers.forEach(({ el }) => (el.style.transform = ""));
    };
  }, []);

  return null;
}
