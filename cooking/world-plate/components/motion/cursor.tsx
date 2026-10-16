"use client";

import { useEffect, useRef } from "react";

/**
 * svz.io-style cursor follower: a small ink dot trails the pointer (lerped each frame) and
 * swells into a ring over anything clickable; over recipe/cuisine photos it shows a "View" label.
 * `mix-blend-mode: difference` keeps it visible on putty, ink and photos alike.
 * Fine pointers only, never for reduced-motion users; the native cursor is left untouched.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const el = dot.current;
    if (!el || !fine.matches || reduce.matches) return;

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let frame = 0;
    el.dataset.on = "true";

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target instanceof Element ? e.target : null;
      const view = target?.closest("[data-cursor='view']");
      const interactive = target?.closest("a, button, [role='button'], input, label, summary");
      el.dataset.state = view ? "view" : interactive ? "hover" : "idle";
    };
    const leave = () => (el.dataset.state = "hidden");
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={dot} aria-hidden className="wp-cursor">
      <span className="wp-cursor-dot">
        <span className="wp-cursor-label">View</span>
      </span>
    </div>
  );
}
