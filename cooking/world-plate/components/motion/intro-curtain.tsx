"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { T } from "@/components/i18n";
import { GasBurner } from "@/components/motion/gas-burner";
import { SectionArt } from "@/components/section-art";

// Five slats; the middle one lifts first and the outer ones follow (0, 1, 2 steps from the centre).
const SLATS = [2, 1, 0, 1, 2];

/**
 * An original boiling pot on a gas hob (GasBurner), drawn to look like real cookware: a glossy enamel stockpot shaded
 * as a cylinder (a soft key light from the left, a bright specular streak, reflected light on the far edge, a darker
 * base), a saffron band shaded the same way, a rolled rim, polished steel loop handles; inside, the dark back wall
 * and the boiling water with ripples and a sheen; a domed enamel lid with a polished steel rim, a specular highlight
 * and a glossy black knob on a steel collar (it rattles); soft vapour curling up; a black glass hob with a faint
 * reflection of the pot. The hob runs below the 240 × 210 box (the svg shows overflow) so the zoom maths, keyed to
 * that box, stay put.
 */
function BoilingPot() {
  const body = "M40 86h160v70c0 16-12 26-28 26H68c-16 0-28-10-28-26z";
  return (
    <svg viewBox="0 0 240 210" className="wp-pot" focusable="false">
      <defs>
        {/* Cylinder shading: dark edge, key light, specular, falloff, reflected light, dark edge. */}
        <linearGradient id="wp-pot-body" x1="40" x2="200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#03200f" />
          <stop offset="0.07" stopColor="#0a4a2a" />
          <stop offset="0.2" stopColor="#168a52" />
          <stop offset="0.26" stopColor="#4fbf86" />
          <stop offset="0.3" stopColor="#1c9259" />
          <stop offset="0.55" stopColor="#06603a" />
          <stop offset="0.82" stopColor="#023d22" />
          <stop offset="0.93" stopColor="#0b5434" />
          <stop offset="1" stopColor="#021a0d" />
        </linearGradient>
        <linearGradient id="wp-pot-band" x1="40" x2="200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6e460c" />
          <stop offset="0.12" stopColor="#c58a20" />
          <stop offset="0.24" stopColor="#f6cb62" />
          <stop offset="0.27" stopColor="#fff2c8" />
          <stop offset="0.31" stopColor="#f2c050" />
          <stop offset="0.62" stopColor="#d99a2c" />
          <stop offset="0.9" stopColor="#9a6614" />
          <stop offset="1" stopColor="#5a3a08" />
        </linearGradient>
        <linearGradient id="wp-pot-shade" x1="0" x2="0" y1="86" y2="182" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000000" stopOpacity="0.35" />
          <stop offset="0.12" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="wp-pot-steel" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5f6662" />
          <stop offset="0.2" stopColor="#e9ece8" />
          <stop offset="0.35" stopColor="#9aa19c" />
          <stop offset="0.55" stopColor="#f7f8f6" />
          <stop offset="0.8" stopColor="#7b827e" />
          <stop offset="1" stopColor="#3f4542" />
        </linearGradient>
        <linearGradient id="wp-pot-steel-v" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f4f6f3" />
          <stop offset="0.45" stopColor="#a3aaa5" />
          <stop offset="1" stopColor="#4c524f" />
        </linearGradient>
        <radialGradient id="wp-pot-lid" cx="0.36" cy="0.22" r="0.85">
          <stop offset="0" stopColor="#47b07c" />
          <stop offset="0.28" stopColor="#14824c" />
          <stop offset="0.7" stopColor="#05522e" />
          <stop offset="1" stopColor="#02301a" />
        </radialGradient>
        <radialGradient id="wp-pot-knob" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#6d7470" />
          <stop offset="0.35" stopColor="#202523" />
          <stop offset="1" stopColor="#050606" />
        </radialGradient>
        <linearGradient id="wp-pot-wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#01180c" />
          <stop offset="1" stopColor="#063d24" />
        </linearGradient>
        <radialGradient id="wp-pot-water-g" cx="0.42" cy="0.55" r="0.7">
          <stop offset="0" stopColor="#1f5f45" />
          <stop offset="0.6" stopColor="#0b3a26" />
          <stop offset="1" stopColor="#04200f" />
        </radialGradient>
        <linearGradient id="wp-pot-hob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2e3431" />
          <stop offset="0.25" stopColor="#141816" />
          <stop offset="1" stopColor="#070908" />
        </linearGradient>
        <radialGradient id="wp-pot-reflect" cx="0.5" cy="0.2" r="0.6">
          <stop offset="0" stopColor="#1b8a52" stopOpacity="0.5" />
          <stop offset="1" stopColor="#1b8a52" stopOpacity="0" />
        </radialGradient>
        <filter id="wp-pot-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="wp-pot-vapour" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      <g className="wp-pot__steam" filter="url(#wp-pot-vapour)">
        {[0, 1, 2].map((s) => (
          <path key={s} style={{ "--s": s } as CSSProperties} d={`M${86 + s * 34} 64c-10-13 10-22 0-36s10-23 0-37`} />
        ))}
      </g>

      {/* The hob: black glass with a lit front edge and a soft reflection of the pot; a front lip with two knobs. */}
      <rect x="8" y="196" width="224" height="20" rx="6" fill="url(#wp-pot-hob)" />
      <ellipse cx="120" cy="203" rx="78" ry="6" fill="url(#wp-pot-reflect)" />
      <rect x="14" y="196.8" width="212" height="1.3" rx="0.65" fill="#ffffff" fillOpacity="0.22" />
      <path d="M30 199h70l-8 15H22z" fill="#ffffff" fillOpacity="0.035" />
      <rect x="12" y="214" width="216" height="12" rx="4" fill="#0b0e0c" />
      <rect x="12" y="214" width="216" height="1" fill="#ffffff" fillOpacity="0.08" />
      {[34, 206].map((x) => (
        <g key={x}>
          <circle cx={x} cy="220.6" r="5.4" fill="#000000" fillOpacity="0.4" />
          <circle cx={x} cy="220" r="5" fill="url(#wp-pot-steel-v)" />
          <rect x={x - 0.9} y="215.5" width="1.8" height="4.5" rx="0.9" fill="#151917" transform={`rotate(-40 ${x} 220)`} />
        </g>
      ))}
      <GasBurner id="wp-pot-burner" x={120} y={191} />
      <ellipse className="wp-pot__shadow" cx="120" cy="182" rx="76" ry="4" fill="#000000" />

      {/* Polished steel loop handles, riveted on. */}
      {[
        { d: "M41 99H29a9 9 0 0 0 0 18h12v-4.5H29.5a4.5 4.5 0 0 1 0-9H41z", r: 45 },
        { d: "M199 99h12a9 9 0 0 1 0 18h-12v-4.5h11.5a4.5 4.5 0 0 0 0-9H199z", r: 195 },
      ].map((h) => (
        <g key={h.r}>
          <path d={h.d} fill="url(#wp-pot-steel-v)" />
          <path d={h.d} fill="none" stroke="#2f3532" strokeOpacity="0.6" strokeWidth="0.6" />
          <circle cx={h.r} cy="102" r="1.9" fill="url(#wp-pot-steel-v)" />
          <circle cx={h.r} cy="114" r="1.9" fill="url(#wp-pot-steel-v)" />
        </g>
      ))}

      {/* The body: shaded enamel, the band, darker toward the rim and the base, a specular streak and reflections. */}
      <path d={body} fill="url(#wp-pot-body)" />
      <rect x="40" y="119" width="160" height="11" fill="url(#wp-pot-band)" />
      <rect x="40" y="119" width="160" height="0.8" fill="#ffffff" fillOpacity="0.35" />
      <rect x="40" y="129.6" width="160" height="1.4" fill="#000000" fillOpacity="0.35" />
      <path d={body} fill="url(#wp-pot-shade)" />
      <rect x="77" y="92" width="7" height="80" rx="3.5" fill="#ffffff" fillOpacity="0.45" filter="url(#wp-pot-blur)" />
      <rect x="79.5" y="96" width="1.6" height="60" rx="0.8" fill="#ffffff" fillOpacity="0.7" />
      <rect x="52" y="94" width="3" height="70" rx="1.5" fill="#ffffff" fillOpacity="0.12" filter="url(#wp-pot-blur)" />
      <rect x="182" y="96" width="5" height="70" rx="2.5" fill="#7fe0ad" fillOpacity="0.12" filter="url(#wp-pot-blur)" />

      {/* The rolled rim, the back wall inside it, the water with ripples, a sheen and bubbles. */}
      <ellipse cx="120" cy="86" rx="81" ry="7.6" fill="#0d5a35" />
      <path d="M39.5 86.5c14 5.2 46 8.1 80.5 8.1s66.5-2.9 80.5-8.1" fill="none" stroke="#5cc08c" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M41 84.5c16-4.6 46-6.9 79-6.9s63 2.3 79 6.9" fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="1" />
      <ellipse className="wp-pot__water" cx="120" cy="86" rx="78" ry="6.4" fill="url(#wp-pot-water-g)" />
      <path d="M43 86c0-3.6 34-6.2 77-6.2s77 2.6 77 6.2" fill="url(#wp-pot-wall)" />
      <ellipse cx="104" cy="88" rx="22" ry="1.6" fill="none" stroke="#3f8f6a" strokeOpacity="0.55" strokeWidth="0.7" />
      <ellipse cx="146" cy="87.5" rx="15" ry="1.2" fill="none" stroke="#3f8f6a" strokeOpacity="0.45" strokeWidth="0.7" />
      <ellipse cx="96" cy="89.2" rx="14" ry="0.9" fill="#bfeedd" fillOpacity="0.18" />
      <g className="wp-pot__bubbles">
        {[64, 98, 142, 176].map((x, i) => (
          <circle key={x} style={{ "--b": i } as CSSProperties} cx={x} cy="84" r="5" />
        ))}
      </g>

      {/* The lid: a polished steel rim, a shaded enamel dome with a specular highlight and a steam vent, a steel
          collar and a glossy black knob. */}
      <g className="wp-pot__lid">
        <ellipse cx="120" cy="87" rx="88" ry="5.5" fill="#000000" fillOpacity="0.35" />
        <path d="M33 85c5-24 40-38 87-38s82 14 87 38c-20 4-52 6-87 6s-67-2-87-6z" fill="url(#wp-pot-lid)" />
        <path d="M31.5 84.4c21 4.6 53 6.9 88.5 6.9s67.5-2.3 88.5-6.9l.6 2.2c-21 4.8-53 7.2-89.1 7.2s-68.1-2.4-89.1-7.2z" fill="url(#wp-pot-steel)" />
        <ellipse cx="78" cy="63" rx="26" ry="7" fill="#ffffff" fillOpacity="0.35" transform="rotate(-14 78 63)" filter="url(#wp-pot-blur)" />
        <path d="M58 70c10-11 30-17 54-18" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M150 52c18 4 33 12 42 24" fill="none" stroke="#9de6bf" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="160" cy="66" rx="3.2" ry="1.5" fill="#021409" />
        <ellipse cx="160" cy="65.4" rx="3.2" ry="0.6" fill="#ffffff" fillOpacity="0.15" />
        <ellipse cx="120" cy="48.5" rx="16" ry="3.6" fill="#000000" fillOpacity="0.35" />
        <path d="M107 47v-3.2c0-1.6 5.8-2.8 13-2.8s13 1.2 13 2.8V47c0 1.6-5.8 2.8-13 2.8s-13-1.2-13-2.8z" fill="url(#wp-pot-steel)" />
        <path d="M112 44V39h16v5z" fill="#141816" />
        <ellipse cx="120" cy="38" rx="15" ry="6.5" fill="url(#wp-pot-knob)" />
        <ellipse cx="114" cy="35.6" rx="5.5" ry="1.8" fill="#ffffff" fillOpacity="0.45" filter="url(#wp-pot-blur)" />
        <ellipse cx="113.5" cy="35.4" rx="2.4" ry="0.7" fill="#ffffff" fillOpacity="0.8" />
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
      {/* The site's engravings on the panel too, in its cream ink, behind the wordmark and pot. */}
      <SectionArt offset={0} />
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
        <span className="label-caps">
          <T en="Scroll to start cooking" ja="スクロールして料理をはじめよう" />
        </span>
      </div>
    </div>
  );
}
