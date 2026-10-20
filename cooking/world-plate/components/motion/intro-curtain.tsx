"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Five slats; the middle one lifts first and the outer ones follow (0, 1, 2 steps from the centre).
const SLATS = [2, 1, 0, 1, 2];

/** An original boiling pot: flames flicker, the lid rattles, bubbles pop at the rim and steam curls up. */
function BoilingPot() {
  return (
    <svg viewBox="0 0 240 210" className="wp-pot" focusable="false">
      <g className="wp-pot__steam">
        {[0, 1, 2].map((s) => (
          <path key={s} style={{ "--s": s } as CSSProperties} d={`M${86 + s * 34} 64c-10-13 10-22 0-36s10-23 0-37`} />
        ))}
      </g>
      <g className="wp-pot__flames">
        {[-44, -22, 0, 22, 44].map((x, i) => (
          <path
            key={x}
            className="wp-pot__flame"
            style={{ "--f": i, transformOrigin: `${120 + x}px 196px` } as CSSProperties}
            d={`M${120 + x} 196c-8 0-12-6-10-14 2-7 7-11 8-21 6 7 12 13 12 22 0 8-4 13-10 13z`}
          />
        ))}
      </g>
      <ellipse className="wp-pot__burner" cx="120" cy="198" rx="70" ry="6" />
      <rect className="wp-pot__handle" x="22" y="104" width="26" height="12" rx="6" />
      <rect className="wp-pot__handle" x="192" y="104" width="26" height="12" rx="6" />
      <path className="wp-pot__body" d="M40 86h160v70c0 16-12 26-28 26H68c-16 0-28-10-28-26z" />
      <rect className="wp-pot__band" x="40" y="120" width="160" height="10" />
      <g className="wp-pot__bubbles">
        {[64, 98, 142, 176].map((x, i) => (
          <circle key={x} style={{ "--b": i } as CSSProperties} cx={x} cy="84" r="5" />
        ))}
      </g>
      <g className="wp-pot__lid">
        <path d="M34 86c6-26 40-40 86-40s80 14 86 40z" />
        <rect x="108" y="32" width="24" height="12" rx="6" />
      </g>
    </svg>
  );
}

/**
 * The intro on every full load of the home page. kervangida.com's preloader, recorded 2026-10-19: a brand-colour
 * panel holds the logo while a mask fills it left to right (2s, linear) — kept exactly as it was. Under it a pot
 * boils (flames, a rattling lid, bubbles, steam) on a loop. It then waits for the visitor: the scroll (wheel, swipe,
 * arrow / space / page keys) drives --q (0 → 1, eased here, reversible). The lid blows off in a puff of steam, the
 * wordmark and pot lift away, and the panel — five slats — peels up from the centre outward, all scrubbed by the
 * scroll. A click, Enter or Escape skips straight to open.
 *
 * While it is up <html> carries `data-intro-lock` (no page scroll, Lenis stopped) and `data-intro` (every page
 * animation paused until the slats start to lift, so the hero's entrance plays as they go). The inline script in
 * app/layout.tsx drops both before first paint off the home page or for reduced motion; CSS then hides the panel.
 */
export function IntroCurtain() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || !html.hasAttribute("data-intro-lock")) return;

    let target = 0;
    let q = 0;
    let frame = 0;
    let lastY = 0;
    let finished = false;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));

    const cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("click", open);
    };
    const finish = () => {
      finished = true;
      html.removeAttribute("data-intro");
      html.removeAttribute("data-intro-lock");
      window.dispatchEvent(new Event("wp:intro-done"));
      cleanup();
    };
    const tick = () => {
      frame = 0;
      q += (target - q) * 0.12;
      if (Math.abs(target - q) < 0.0005) q = target;
      el.style.setProperty("--q", q.toFixed(4));
      // The page starts its own entrance as the slats begin to lift.
      if (q > 0.4) html.removeAttribute("data-intro");
      if (q >= 0.999) return finish();
      if (q !== target) frame = requestAnimationFrame(tick);
    };
    const nudge = (d: number) => {
      target = clamp(target + d);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const open = () => nudge(1);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      nudge(px / (window.innerHeight * 1.8));
    };
    const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? lastY;
      nudge((lastY - y) / (window.innerHeight * 1.3));
      lastY = y;
    };
    const STEPS: Record<string, number> = { ArrowDown: 0.12, PageDown: 0.35, " ": 0.35, ArrowUp: -0.12, PageUp: -0.35 };
    const onKey = (e: KeyboardEvent) => {
      const step = STEPS[e.key];
      if (step) {
        e.preventDefault();
        nudge(step);
      } else if (["Enter", "Escape", "Tab"].includes(e.key)) {
        if (e.key !== "Tab") e.preventDefault();
        open();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    el.addEventListener("click", open);
    return () => {
      if (!finished) cleanup();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="wp-intro">
      {SLATS.map((d, i) => (
        <span key={i} className="wp-intro__slat" style={{ "--s": i, "--d": d } as CSSProperties} />
      ))}
      <div className="wp-intro__stack">
        <span className="wp-intro__mark">
          <span className="wp-intro__outline">World Plate</span>
          <span className="wp-intro__fill">World Plate</span>
        </span>
        <BoilingPot />
      </div>
      <div className="wp-intro__cue">
        <span className="wp-intro__mouse">
          <span />
        </span>
        <span className="label-caps">Scroll to start cooking</span>
      </div>
    </div>
  );
}
