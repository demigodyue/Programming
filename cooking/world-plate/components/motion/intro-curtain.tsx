"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { GasBurner } from "@/components/motion/gas-burner";

// Five slats; the middle one lifts first and the outer ones follow (0, 1, 2 steps from the centre).
const SLATS = [2, 1, 0, 1, 2];

/**
 * An original boiling pot on a gas hob (GasBurner): an enamel stockpot with a rolled rim, loop handles riveted on,
 * soft reflections and a shadow on the grate; inside, the back wall and the boiling water with ripples and bubbles;
 * a domed enamel lid with a sheen, a steam vent and a turned metal knob (it rattles); steam curling up. The hob runs
 * below the 240 × 210 box (the svg shows overflow) so the zoom maths, keyed to that box, stay put.
 */
function BoilingPot() {
  return (
    <svg viewBox="0 0 240 210" className="wp-pot" focusable="false">
      <defs>
        <linearGradient id="wp-pot-body" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#0b6b3e" />
          <stop offset="0.18" stopColor="#0f7a47" />
          <stop offset="0.5" stopColor="#00522d" />
          <stop offset="0.85" stopColor="#003a20" />
          <stop offset="1" stopColor="#004727" />
        </linearGradient>
        <linearGradient id="wp-pot-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="wp-pot-band" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f7cd6a" />
          <stop offset="0.5" stopColor="#f4b942" />
          <stop offset="1" stopColor="#c98f22" />
        </linearGradient>
        <linearGradient id="wp-pot-lid" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1f7247" />
          <stop offset="0.55" stopColor="#0d4a2c" />
          <stop offset="1" stopColor="#06301b" />
        </linearGradient>
        <linearGradient id="wp-pot-knob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5c635e" />
          <stop offset="1" stopColor="#141816" />
        </linearGradient>
        <linearGradient id="wp-pot-rivet" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#eef0ec" />
          <stop offset="1" stopColor="#6d736f" />
        </linearGradient>
        <linearGradient id="wp-pot-hob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a302c" />
          <stop offset="1" stopColor="#151917" />
        </linearGradient>
      </defs>

      <g className="wp-pot__steam">
        {[0, 1, 2].map((s) => (
          <path key={s} style={{ "--s": s } as CSSProperties} d={`M${86 + s * 34} 64c-10-13 10-22 0-36s10-23 0-37`} />
        ))}
      </g>

      {/* The hob: black top with a lit edge, a front lip with two control knobs. */}
      <rect x="8" y="196" width="224" height="20" rx="6" fill="url(#wp-pot-hob)" />
      <rect x="14" y="197" width="212" height="1.5" rx="0.75" fill="#ffffff" fillOpacity="0.12" />
      <rect x="12" y="214" width="216" height="12" rx="4" fill="#0e1210" />
      {[34, 206].map((x) => (
        <g key={x}>
          <circle cx={x} cy="220" r="5" fill="url(#wp-pot-rivet)" />
          <rect x={x - 0.9} y="215.5" width="1.8" height="4.5" rx="0.9" fill="#151917" transform={`rotate(-40 ${x} 220)`} />
        </g>
      ))}
      <GasBurner id="wp-pot-burner" x={120} y={191} />
      <ellipse className="wp-pot__shadow" cx="120" cy="182" rx="76" ry="4" fill="#000000" />

      {/* Loop handles, riveted on. */}
      {[
        { d: "M41 99H29a9 9 0 0 0 0 18h12v-4.5H29.5a4.5 4.5 0 0 1 0-9H41z", r: 45 },
        { d: "M199 99h12a9 9 0 0 1 0 18h-12v-4.5h11.5a4.5 4.5 0 0 0 0-9H199z", r: 195 },
      ].map((h) => (
        <g key={h.r}>
          <path d={h.d} fill="#0b3b23" />
          <circle cx={h.r} cy="102" r="1.9" fill="url(#wp-pot-rivet)" />
          <circle cx={h.r} cy="114" r="1.9" fill="url(#wp-pot-rivet)" />
        </g>
      ))}

      {/* The body: enamel with reflections, the band, shading toward the base. */}
      <path d="M40 86h160v70c0 16-12 26-28 26H68c-16 0-28-10-28-26z" fill="url(#wp-pot-body)" />
      <rect x="40" y="120" width="160" height="10" fill="url(#wp-pot-band)" />
      <rect x="40" y="130" width="160" height="1.6" fill="#002814" fillOpacity="0.5" />
      <path d="M40 86h160v70c0 16-12 26-28 26H68c-16 0-28-10-28-26z" fill="url(#wp-pot-shade)" />
      <path d="M50 94v56" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="6" strokeLinecap="round" />
      <path d="M61 96v40" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
      <path d="M186 96v52" stroke="#000000" strokeOpacity="0.12" strokeWidth="5" strokeLinecap="round" />

      {/* The rim, the back wall inside it, the water with ripples and bubbles. */}
      <ellipse cx="120" cy="86" rx="81" ry="7.6" fill="#1d6b45" />
      <path d="M40 87c16 5 46 7.5 80 7.5s64-2.5 80-7.5" fill="none" stroke="#3aa06a" strokeOpacity="0.6" strokeWidth="1.4" />
      <ellipse className="wp-pot__water" cx="120" cy="86" rx="78" ry="6.4" />
      <path d="M43 86c0-3.6 34-6.2 77-6.2s77 2.6 77 6.2" fill="#0a3f25" />
      <ellipse cx="104" cy="88" rx="22" ry="1.6" fill="none" stroke="#1f6b47" strokeOpacity="0.55" strokeWidth="0.8" />
      <ellipse cx="146" cy="87.5" rx="15" ry="1.2" fill="none" stroke="#1f6b47" strokeOpacity="0.45" strokeWidth="0.8" />
      <g className="wp-pot__bubbles">
        {[64, 98, 142, 176].map((x, i) => (
          <circle key={x} style={{ "--b": i } as CSSProperties} cx={x} cy="84" r="5" />
        ))}
      </g>

      {/* The lid: a lip, an enamel dome with a sheen and a steam vent, a washer, a stem and a turned metal knob. */}
      <g className="wp-pot__lid">
        <ellipse cx="120" cy="86" rx="88" ry="5.5" fill="#06301b" />
        <path d="M33 85c5-24 40-38 87-38s82 14 87 38c-20 4-52 6-87 6s-67-2-87-6z" fill="url(#wp-pot-lid)" />
        <path d="M33 85c20 4 52 6 87 6s67-2 87-6" fill="none" stroke="#2a8a58" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d="M54 73c11-12 32-19 58-20" fill="none" stroke="#fff8ec" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
        <path d="M66 80c6-6 16-10 28-11.5" fill="none" stroke="#fff8ec" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="160" cy="66" rx="3.2" ry="1.5" fill="#031a0e" />
        <ellipse cx="120" cy="48" rx="15" ry="3.4" fill="#0b3b23" />
        <rect x="116" y="39" width="8" height="9" fill="#1c201e" />
        <ellipse cx="120" cy="38" rx="15" ry="6.5" fill="url(#wp-pot-knob)" />
        <ellipse cx="115" cy="36" rx="5" ry="1.7" fill="#ffffff" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

/**
 * The intro on every full load of the home page. kervangida.com's preloader, recorded 2026-10-19: a brand-colour
 * panel holds the logo while a mask fills it left to right (2s, linear) — kept exactly as it was. Under it a pot
 * boils (flames, a rattling lid, bubbles, steam) on a loop. It then waits for the visitor: the scroll (wheel, swipe,
 * arrow / space / page keys) drives --q (0 → 1, eased here, reversible). The lid blows off in a puff of steam and the
 * wordmark lifts away, the pot travels to the middle of the screen and grows; then the lid flies off and the page
 * opens out of the pot's mouth — all scrubbed by the scroll. (--pdx / --pdy, measured here, are the pot's way to
 * the centre.) A click, Enter or Escape skips straight to open.
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

    // How far the pot travels to sit in the middle of the screen as it grows (measured while it is at rest).
    const pot = el.querySelector<HTMLElement>(".wp-pot-zoom");
    const measure = () => {
      if (!pot || q > 0) return;
      const r = pot.getBoundingClientRect();
      el.style.setProperty(
        "--pdx",
        `${(window.innerWidth / 2 - (r.left + r.width / 2)).toFixed(1)}px`,
      );
      // The zoom point is low on the pot's body (transform-origin 50% 72% in globals.css), so the pot covers the screen.
      el.style.setProperty(
        "--pdy",
        `${(window.innerHeight / 2 - (r.top + r.height * 0.72)).toFixed(1)}px`,
      );
    };
    measure();
    window.addEventListener("resize", measure);

    const cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
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
      // The page starts its own entrance as it begins to open out of the pot.
      if (q > 0.5) html.removeAttribute("data-intro");
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
      const px =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * window.innerHeight
            : e.deltaY;
      nudge(px / (window.innerHeight * 1.8));
    };
    const onTouchStart = (e: TouchEvent) =>
      (lastY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? lastY;
      nudge((lastY - y) / (window.innerHeight * 1.3));
      lastY = y;
    };
    const STEPS: Record<string, number> = {
      ArrowDown: 0.12,
      PageDown: 0.35,
      " ": 0.35,
      ArrowUp: -0.12,
      PageUp: -0.35,
    };
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
        <span
          key={i}
          className="wp-intro__slat"
          style={{ "--s": i, "--d": d } as CSSProperties}
        />
      ))}
      <div className="wp-intro__stack">
        <span className="wp-intro__mark">
          <span className="wp-intro__outline">World Plate</span>
          <span className="wp-intro__fill">World Plate</span>
        </span>
        <span className="wp-pot-zoom">
          <BoilingPot />
        </span>
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
