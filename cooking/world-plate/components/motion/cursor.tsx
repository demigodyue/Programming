"use client";

import { useEffect, useRef } from "react";
import { power3Out } from "./slush-ease";

type Tween = { from: number; to: number; start: number; dur: number };

// The cursor labels in Japanese (labels are written in English on the data-cursor attribute).
const CURSOR_JA: Record<string, string> = { "View recipe": "レシピを見る", Explore: "見てみる" };

/**
 * Slush's cursor label: a small pill that trails the pointer and shows over anything with a
 * `data-cursor` attribute, using that attribute as its text ("View recipe", "Explore"…).
 * Position follows like GSAP's quickTo (each move restarts a 0.525s power3.out tween from where the
 * pill is); near the right edge it flips to the left of the pointer, near the bottom it moves above it
 * (0.9s power3.out). The native cursor stays. Fine pointers and wider than 767px only (CSS); skipped
 * for reduced motion. Visibility is pure CSS: `body:has([data-cursor]:hover)`.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !fine.matches || reduce.matches) return;
    el.dataset.on = "";

    const now = () => performance.now();
    const tween = (from: number, to: number, dur: number): Tween => ({ from, to, start: now(), dur });
    const value = (t: Tween, at: number) => t.from + (t.to - t.from) * power3Out(Math.min(1, (at - t.start) / t.dur));

    let x = tween(0, 0, 1);
    let y = tween(0, 0, 1);
    let xp = tween(6, 6, 1);
    let yp = tween(50, 50, 1);
    let label = "";
    let frame = 0;

    const tick = () => {
      const t = now();
      el.style.transform = `translate3d(${value(x, t)}px, ${value(y, t)}px, 0) translate(${value(xp, t)}%, ${value(yp, t)}%)`;
      frame = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = now();
      const nearRight = e.clientX > window.innerWidth - (el.offsetWidth + 16);
      const nearBottom = e.clientY > window.innerHeight * 0.9;
      x = tween(value(x, t), e.clientX, 525);
      y = tween(value(y, t), e.clientY, 525);
      const toXp = nearRight ? -100 : 6;
      const toYp = nearBottom ? -120 : 50;
      if (toXp !== xp.to) xp = tween(value(xp, t), toXp, 900);
      if (toYp !== yp.to) yp = tween(value(yp, t), toYp, 900);
    };

    const over = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-cursor]") : null;
      const en = target?.dataset.cursor;
      const text = en && document.documentElement.dataset.lang === "ja" ? (CURSOR_JA[en] ?? en) : en;
      if (text && text !== label) {
        label = text;
        el.textContent = text;
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      cancelAnimationFrame(frame);
      delete el.dataset.on;
    };
  }, []);

  return <div ref={ref} aria-hidden className="wp-cursor" />;
}
