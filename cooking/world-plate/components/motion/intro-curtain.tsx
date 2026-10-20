"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const WORD = "World Plate";
// The letters each reel spins through before it lands (offset per letter so neighbours never match).
const POOL = "RAMENMOMOTACOSPHOSUSHIDALBHATPAELLA";
const DISHES = ["Shoyu ramen", "Chicken momo", "Carbonara", "Tacos al pastor", "Butter chicken", "Pad thai", "Dal bhat", "Croissants"];

/** One copy of the intro picture; it is drawn twice (top and bottom half) so it can split down the middle. */
function Scene() {
  const row = DISHES.map((d) => `${d} ✦ `).join("");
  return (
    <div className="wp-intro__scene">
      <div className="wp-intro__band wp-intro__band--top">
        <span>{row}</span>
        <span>{row}</span>
      </div>
      <div className="wp-intro__mark">
        {[...WORD].map((c, i) =>
          c === " " ? (
            <span key={i} className="wp-intro__gap" />
          ) : (
            <span key={i} className="wp-reel" style={{ "--i": i } as CSSProperties}>
              <span className="wp-reel__ghost">{c}</span>
              <span className="wp-reel__strip">
                {[...POOL.slice(i * 3, i * 3 + 6), c].map((g, k) => (
                  <span key={k}>{g}</span>
                ))}
              </span>
            </span>
          ),
        )}
      </div>
      <p className="wp-intro__tag label-caps">Famous dishes from around the world</p>
      <div className="wp-intro__band wp-intro__band--bottom">
        <span>{row}</span>
        <span>{row}</span>
      </div>
    </div>
  );
}

/**
 * The first-load intro, once per browser session, and every bit of it runs on the visitor's scroll (wheel, swipe,
 * arrow / space / page keys) — nothing plays by itself. It opens on a full-screen panel of mixed-up letters; as you
 * scroll, each letter's reel spins through and lands on WORLD PLATE (one after another), the two bands of dish names
 * slide sideways in opposite directions and the tagline comes up; scroll on and the picture splits through the
 * middle, the halves sliding apart to reveal the page. Scrolling back runs it backwards. A click, Enter or Escape
 * skips straight to open. Progress is --q (0 → 1, eased here); the CSS turns it into each step.
 *
 * While it is up <html> carries `data-intro-lock` (no page scroll, Lenis stopped) and `data-intro` (every page
 * animation paused until the halves start to part, so the hero's entrance plays as they open). An inline script in the layout drops both
 * before first paint when the intro was already seen this session or motion is reduced; CSS hides the panel then.
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
    const nudge = (d: number) => {
      target = clamp(target + d);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const open = () => nudge(1);

    const finish = () => {
      finished = true;
      html.removeAttribute("data-intro");
      html.removeAttribute("data-intro-lock");
      try {
        sessionStorage.setItem("wp-intro", "seen");
      } catch {}
      window.dispatchEvent(new Event("wp:intro-done"));
      cleanup();
    };
    const tick = () => {
      frame = 0;
      q += (target - q) * 0.12;
      if (Math.abs(target - q) < 0.0005) q = target;
      el.style.setProperty("--q", q.toFixed(4));
      // The page starts its own entrance as the halves begin to part.
      if (q > 0.58) html.removeAttribute("data-intro");
      if (q >= 0.999) return finish();
      if (q !== target) frame = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      nudge(px / (window.innerHeight * 2.2));
    };
    const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? lastY;
      nudge((lastY - y) / (window.innerHeight * 1.6));
      lastY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      const step = { ArrowDown: 0.12, PageDown: 0.35, " ": 0.35, ArrowUp: -0.12, PageUp: -0.35 }[e.key];
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
    const cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("click", open);
    };
    return () => {
      if (!finished) cleanup();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="wp-intro">
      <div className="wp-intro__half wp-intro__half--top">
        <Scene />
      </div>
      <div className="wp-intro__half wp-intro__half--bottom">
        <Scene />
      </div>
      <div className="wp-intro__cue">
        <span className="wp-intro__mouse">
          <span />
        </span>
        <span className="label-caps">Scroll to open</span>
        <span className="wp-intro__bar">
          <span />
        </span>
      </div>
    </div>
  );
}
