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
 * The first-load intro, once per browser session: a full-screen panel where WORLD PLATE spins into place letter by
 * letter like slot-machine reels while dish names scroll past above and below. Then it waits for the visitor:
 * scrolling (wheel, swipe or the arrow / space keys) opens it — the picture splits through the middle and the halves
 * slide apart as you scroll, so you can scroll it back a little too — and a click or Enter opens it straight away.
 * If nobody touches it, it opens by itself after a few seconds.
 *
 * While it is up <html> carries `data-intro-lock` (no page scroll, Lenis stopped) and `data-intro` (every page
 * animation paused until the visitor starts opening, so the hero's entrance plays as the halves part). An inline script in the layout drops both
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
      // The page starts its own entrance as soon as the visitor starts opening, so it is under way as the halves part.
      if (target > 0) html.removeAttribute("data-intro");
      restartIdle();
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
      if (q >= 0.999) return finish();
      if (q !== target) frame = requestAnimationFrame(tick);
    };

    // Open by itself if left alone; after a partial scroll, finish the move a moment later.
    let idle = window.setTimeout(open, 5200);
    const restartIdle = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(open, target > 0 ? 1400 : 5200);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      nudge(px / (window.innerHeight * 1.1));
    };
    const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? lastY;
      nudge((lastY - y) / (window.innerHeight * 0.7));
      lastY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " ", "Enter", "Escape", "Tab"].includes(e.key)) {
        if (e.key !== "Tab") e.preventDefault();
        open();
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        nudge(-0.25);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    el.addEventListener("click", open);
    const cleanup = () => {
      window.clearTimeout(idle);
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
