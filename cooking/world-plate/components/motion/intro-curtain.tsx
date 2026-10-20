"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Five slats; the middle one lifts first and the outer ones follow (0, 1, 2 steps from the centre).
const SLATS = [2, 1, 0, 1, 2];

// Gas jets around the burner crown: angle round the ring (0 = right, π/2 = front), on an ellipse 30 × 4.5 units.
const JETS = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * Math.PI * 2;
  return {
    x: 120 + 30 * Math.cos(a),
    y: 191 + 4.5 * Math.sin(a),
    tilt: Math.cos(a) * 28,
    front: Math.sin(a) >= 0,
    k,
  };
});

/** One gas jet: a blue flame with a pale core, leaning outward round the ring. */
function Jet({
  x,
  y,
  tilt,
  k,
  small,
}: {
  x: number;
  y: number;
  tilt: number;
  k: number;
  small?: boolean;
}) {
  const s = small ? 0.75 : 1;
  return (
    <g
      transform={`rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}
    >
      {/* Inner group: its own origin is the jet base, so the flicker grows the flame up from there. */}
      <g className="wp-pot__jet" style={{ "--f": k } as CSSProperties}>
        <path
          fill="#2f6bff"
          fillOpacity="0.85"
          d="M0 0c-3.4 0-4.8-2.8-4-5.8.8-2.8 2.8-3.9 4-7.4 1.2 3.5 3.2 4.6 4 7.4.8 3-.6 5.8-4 5.8z"
        />
        <path
          fill="#a9d1ff"
          d="M0-.6c-1.9 0-2.7-1.6-2.2-3.2.5-1.6 1.5-2.2 2.2-4.2.7 2 1.7 2.6 2.2 4.2.5 1.6-.3 3.2-2.2 3.2z"
        />
        <path
          fill="#f4b942"
          fillOpacity="0.7"
          d="M0-12.4c-.6 1.2-1.1 1.8-1.1 2.6 0 .7.5 1.2 1.1 1.2s1.1-.5 1.1-1.2c0-.8-.5-1.4-1.1-2.6z"
        />
      </g>
    </g>
  );
}

/**
 * An original boiling pot on a gas hob: a cast-iron grate, a burner crown with a ring of blue gas jets (flickering),
 * an enamel pot and a domed enamel lid with a metal knob (it rattles), bubbles at the rim and steam curling up.
 * The hob runs below the 240 × 210 box (the svg shows overflow) so the zoom maths, keyed to that box, stay put.
 */
function BoilingPot() {
  return (
    <svg viewBox="0 0 240 210" className="wp-pot" focusable="false">
      <defs>
        <linearGradient id="wp-pot-body" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#0b6b3e" />
          <stop offset="0.45" stopColor="#00522d" />
          <stop offset="1" stopColor="#003a20" />
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
        <linearGradient id="wp-pot-crown" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#aab0ab" />
          <stop offset="1" stopColor="#4c534f" />
        </linearGradient>
        <linearGradient id="wp-pot-hob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a302c" />
          <stop offset="1" stopColor="#151917" />
        </linearGradient>
      </defs>

      <g className="wp-pot__steam">
        {[0, 1, 2].map((s) => (
          <path
            key={s}
            style={{ "--s": s } as CSSProperties}
            d={`M${86 + s * 34} 64c-10-13 10-22 0-36s10-23 0-37`}
          />
        ))}
      </g>

      {/* The hob: glass-black top with a lit edge, a front lip with two control knobs. */}
      <rect
        x="8"
        y="196"
        width="224"
        height="20"
        rx="6"
        fill="url(#wp-pot-hob)"
      />
      <rect
        x="14"
        y="197"
        width="212"
        height="1.5"
        rx="0.75"
        fill="#ffffff"
        fillOpacity="0.12"
      />
      <rect x="12" y="214" width="216" height="12" rx="4" fill="#0e1210" />
      {[34, 206].map((x) => (
        <g key={x}>
          <circle cx={x} cy="220" r="5" fill="#d9d4c7" />
          <rect
            x={x - 0.9}
            y="215.5"
            width="1.8"
            height="4.5"
            rx="0.9"
            fill="#151917"
            transform={`rotate(-40 ${x} 220)`}
          />
        </g>
      ))}
      {/* Burner bowl, then the jets behind the crown, the crown and cap, the jets in front of it. */}
      <ellipse
        cx="120"
        cy="196"
        rx="54"
        ry="7"
        fill="#1d2220"
        stroke="#3b423e"
        strokeWidth="1.2"
      />
      <ellipse
        className="wp-pot__glow"
        cx="120"
        cy="184"
        rx="58"
        ry="8"
        fill="#6aa0ff"
      />
      <g className="wp-pot__gas">
        {JETS.filter((j) => !j.front).map((j) => (
          <Jet key={j.k} {...j} small />
        ))}
      </g>
      <ellipse cx="120" cy="192" rx="31" ry="5.5" fill="url(#wp-pot-crown)" />
      <ellipse cx="120" cy="189.5" rx="22" ry="3.6" fill="#232826" />
      <ellipse
        cx="117"
        cy="188.8"
        rx="8"
        ry="1.1"
        fill="#ffffff"
        fillOpacity="0.18"
      />
      <g className="wp-pot__gas">
        {JETS.filter((j) => j.front).map((j) => (
          <Jet key={j.k} {...j} />
        ))}
      </g>
      {/* Cast-iron grate arms the pot rests on, with their feet down to the hob. */}
      <g fill="#111513">
        <rect x="34" y="182" width="52" height="4.5" rx="2" />
        <rect x="154" y="182" width="52" height="4.5" rx="2" />
        <rect x="36" y="182" width="4.5" height="16" rx="2" />
        <rect x="199.5" y="182" width="4.5" height="16" rx="2" />
        <rect
          x="96"
          y="180.5"
          width="48"
          height="2.5"
          rx="1.25"
          fillOpacity="0.8"
        />
      </g>

      {/* The pot. */}
      <rect
        className="wp-pot__handle"
        x="22"
        y="104"
        width="26"
        height="12"
        rx="6"
      />
      <rect
        className="wp-pot__handle"
        x="192"
        y="104"
        width="26"
        height="12"
        rx="6"
      />
      <path
        d="M40 86h160v70c0 16-12 26-28 26H68c-16 0-28-10-28-26z"
        fill="url(#wp-pot-body)"
      />
      <rect className="wp-pot__band" x="40" y="120" width="160" height="10" />
      <path
        d="M48 92v58"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="120" cy="86" rx="81" ry="7.6" fill="#1d6b45" />
      <ellipse className="wp-pot__water" cx="120" cy="86" rx="78" ry="6.4" />
      <g className="wp-pot__bubbles">
        {[64, 98, 142, 176].map((x, i) => (
          <circle
            key={x}
            style={{ "--b": i } as CSSProperties}
            cx={x}
            cy="84"
            r="5"
          />
        ))}
      </g>

      {/* The lid: a lip, an enamel dome with a sheen, a washer, a stem and a turned metal knob. */}
      <g className="wp-pot__lid">
        <ellipse cx="120" cy="86" rx="88" ry="5.5" fill="#06301b" />
        <path
          d="M33 85c5-24 40-38 87-38s82 14 87 38c-20 4-52 6-87 6s-67-2-87-6z"
          fill="url(#wp-pot-lid)"
        />
        <path
          d="M33 85c20 4 52 6 87 6s67-2 87-6"
          fill="none"
          stroke="#2a8a58"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
        <path
          d="M54 73c11-12 32-19 58-20"
          fill="none"
          stroke="#fff8ec"
          strokeOpacity="0.35"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse cx="120" cy="48" rx="15" ry="3.4" fill="#0b3b23" />
        <rect x="116" y="39" width="8" height="9" fill="#1c201e" />
        <ellipse cx="120" cy="38" rx="15" ry="6.5" fill="url(#wp-pot-knob)" />
        <ellipse
          cx="115"
          cy="36"
          rx="5"
          ry="1.7"
          fill="#ffffff"
          fillOpacity="0.35"
        />
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
