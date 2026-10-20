"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SectionArt } from "@/components/section-art";
import { slush, slushBounce } from "./slush-ease";

/**
 * Slush's page transition (their Barba `runTransition`), rebuilt on the View Transitions API.
 *
 * Internal link clicks are taken over: Next's navigation runs inside `document.startViewTransition`,
 * then the old page, the new page and three candy-coloured panels are animated with keyframes sampled
 * from Slush's GSAP timeline (below — times in seconds, z in vw, x in % of the viewport width):
 *   0.00  the old page becomes a card with 2rem corners and sinks to z -100vw (0.8s, slush-bounce)
 *   0.55  it swings out left (rotateY 45°, x -200%) as the new page swings in from the right
 *         (rotateY -45° → 0, x 200% → 0); the panels sweep past behind both (1.25s, slush-bounce)
 *   1.30  the new page comes forward to z 0 and its corners square off (0.8s, slush)
 *   1.65  the new page's own entrance starts (the `data-load="swing"` clock in globals.css)
 * World Plate's changes to Slush's swing (2026-10-20, "change some animations in the previous one"): the cards
 * travel on an arc with a tilt — the old page lifts a little as it shrinks, then is tossed out down-left with a
 * spin (rotateZ) like a flicked recipe card; the new page tilts in from the right and straightens as it lands; the
 * panels arc and tilt too and carry the site's food engravings; the cards throw a soft shadow.
 * The header has its own view-transition name and stays put. Reduced motion: Slush's
 * `runReducedTransition` — the old page fades out (0.525s) while the new one fades in (1s).
 * Browser back/forward and browsers without view transitions navigate without the swing.
 */

type Prop = "xp" | "z" | "ry" | "r" | "rz" | "y";
type Tween = { at: number; dur: number; ease: (t: number) => number; to: Partial<Record<Prop, number>> };
type Track = { from: Record<Prop, number>; tweens: Tween[] };

const C = 0.8;
const D = 1.25;
const END = 2.1; // the new page is flat and full-screen; the panels finish behind it
const OLD_GONE = 1.8; // Slush removes the old page here
const FPS = 60;

// rz: tilt (deg); y: drop (vh). Slush's x / z / rotateY timings are kept; the arc and tilt ride on them.
const OLD: Track = {
  from: { xp: 0, z: 0, ry: 0, r: 2, rz: 0, y: 0 },
  tweens: [
    { at: 0, dur: C, ease: slushBounce, to: { z: -100, rz: -2.5, y: -3 } },
    { at: 0.55, dur: D, ease: slushBounce, to: { ry: 45, xp: -200, z: -50, rz: -14, y: 14 } },
  ],
};
const NEW: Track = {
  from: { xp: 200, z: -50, ry: -45, r: 2, rz: 12, y: 12 },
  tweens: [
    { at: 0.55, dur: D, ease: slushBounce, to: { ry: 0, xp: 0, z: -100, rz: 0, y: 0 } },
    { at: 1.3, dur: C, ease: slush, to: { z: 0, r: 0 } },
  ],
};
const PANELS: Track[] = [
  {
    from: { xp: -200, z: -50, ry: 45, r: 2, rz: -10, y: 10 },
    tweens: [
      { at: 0, dur: C, ease: slushBounce, to: { xp: -100, ry: 22.5, z: -85, rz: -5, y: 4 } },
      { at: 0.55, dur: D, ease: slushBounce, to: { xp: -300, ry: 67.5, z: -25, rz: -16, y: 16 } },
    ],
  },
  {
    from: { xp: 200, z: -50, ry: -45, r: 2, rz: 10, y: 10 },
    tweens: [
      { at: 0, dur: C, ease: slushBounce, to: { xp: 100, ry: -22.5, z: -85, rz: 5, y: 4 } },
      { at: 0.55, dur: D, ease: slushBounce, to: { xp: -100, ry: 22.5, z: -85, rz: -5, y: -4 } },
      { at: 1.5, dur: 1.875, ease: slushBounce, to: { xp: -200, ry: 45, z: -25, rz: -12, y: 10 } },
    ],
  },
  {
    from: { xp: 200, z: -25, ry: -45, r: 2, rz: 14, y: 14 },
    tweens: [
      { at: 0.55, dur: D, ease: slushBounce, to: { xp: 100, ry: -22.5, z: -85, rz: 5, y: -4 } },
      { at: 1.5, dur: 1.875, ease: slushBounce, to: { xp: 200, ry: -45, z: -25, rz: 12, y: 10 } },
    ],
  },
];

const COLOURS = ["--slush-blue", "--slush-yellow", "--slush-lavender", "--slush-mint", "--slush-orange", "--slush-violet"];
const LIGHT = new Set(["--slush-yellow", "--slush-lavender", "--slush-mint"]);
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * GSAP timeline semantics: the latest-starting tween that has begun owns a property, and it starts
 * from whatever value the property had at that moment.
 */
function valueAt(track: Track, prop: Prop, t: number, limit = track.tweens.length): number {
  for (let i = limit - 1; i >= 0; i--) {
    const tw = track.tweens[i];
    const target = tw.to[prop];
    if (tw.at > t || target === undefined) continue;
    const from = valueAt(track, prop, tw.at, i);
    return from + (target - from) * tw.ease(Math.min(1, (t - tw.at) / tw.dur));
  }
  return track.from[prop];
}

function keyframes(track: Track, vw: number, opts: { radius?: boolean; goneAt?: number } = {}): Keyframe[] {
  const frames: Keyframe[] = [];
  const steps = Math.round(END * FPS);
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * END;
    const [xp, z, ry, rz, y] = (["xp", "z", "ry", "rz", "y"] as const).map((p) => valueAt(track, p, t));
    const frame: Keyframe = {
      transform: `perspective(1000px) translateX(${xp.toFixed(3)}%) translateY(${y.toFixed(3)}vh) translateZ(${(z * vw).toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`,
    };
    if (opts.radius) frame.clipPath = `inset(0 round ${valueAt(track, "r", t).toFixed(4)}rem)`;
    if (opts.goneAt !== undefined) frame.opacity = t >= opts.goneAt ? 0 : 1;
    frames.push(frame);
  }
  return frames;
}

const normalise = (path: string) => path.replace(/\/+$/, "") || "/";

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PageSwing() {
  const router = useRouter();
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    const root = document.documentElement;
    let running = false;
    let clearLoad = 0;

    // Resolve once the new page is really in the DOM: the URL has changed and React has swapped <main>'s content.
    const waitForPage = (target: string, before: Element | null) =>
      new Promise<void>((resolve) => {
        const started = performance.now();
        const check = () => {
          const here = normalise(location.pathname) + location.search;
          const swapped = document.querySelector("main")?.firstElementChild !== before;
          // Give up after 3s so a slow or failed navigation can't hold the old page on screen.
          // setTimeout, not requestAnimationFrame: rendering is paused while a view transition captures.
          if ((here === target && swapped) || performance.now() - started > 3000) resolve();
          else window.setTimeout(check, 16);
        };
        check();
      });

    const swing = (url: URL) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const href = (url.pathname.slice(BASE.length) || "/") + url.search + url.hash;
      const target = normalise(url.pathname) + url.search;
      running = true;
      window.clearTimeout(clearLoad);
      const before = document.querySelector("main")?.firstElementChild ?? null;

      let transition: ViewTransition;
      try {
        transition = document.startViewTransition(async () => {
          // The old page has been captured; everything below happens in the new state.
          root.dataset.load = reduce ? "fade" : "swing";
          if (!reduce) {
            shuffle(COLOURS).forEach((colour, i) => {
              const el = panels.current[i];
              if (!el) return;
              el.style.backgroundColor = `var(${colour})`;
              el.style.color = LIGHT.has(colour) ? "var(--slush-violet)" : "#fff8ec";
            });
            root.dataset.swingPanels = "";
          }
          router.push(href);
          await waitForPage(target, before);
        });
      } catch {
        running = false;
        router.push(href);
        return;
      }

      transition.ready
        .then(() => {
          const opts = { duration: END * 1000, easing: "linear", fill: "both" } as const;
          if (reduce) {
            const ease = "cubic-bezier(0.65, 0.05, 0, 1)";
            root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 525, easing: ease, fill: "both", pseudoElement: "::view-transition-old(root)" });
            root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: ease, fill: "both", pseudoElement: "::view-transition-new(root)" });
            return;
          }
          const vw = window.innerWidth / 100;
          root.animate(keyframes(OLD, vw, { goneAt: OLD_GONE }), { ...opts, pseudoElement: "::view-transition-old(root)" });
          root.animate(keyframes(NEW, vw, { radius: true }), { ...opts, pseudoElement: "::view-transition-new(root)" });
          PANELS.forEach((track, i) =>
            root.animate(keyframes(track, vw), { ...opts, pseudoElement: `::view-transition-group(wp-panel-${i})` }),
          );
        })
        .catch(() => {});

      transition.finished.finally(() => {
        delete root.dataset.swingPanels;
        running = false;
        // Hand the page-load clock back once the new page's entrance has played out.
        clearLoad = window.setTimeout(() => delete root.dataset.load, 2500);
      });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
      // Same page (an in-page anchor, or the current URL): leave it to the browser / Lenis.
      if (normalise(url.pathname) === normalise(location.pathname) && url.search === location.search) return;
      e.preventDefault(); // next/link skips its own navigation when the click is already handled
      if (running) return; // Barba's preventRunning: ignore clicks mid-transition
      swing(url);
    };

    // Back/forward isn't animated, so give the new page the normal load timing.
    const onPop = () => {
      window.clearTimeout(clearLoad);
      delete root.dataset.load;
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(clearLoad);
    };
  }, [router]);

  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden
          ref={(el) => {
            panels.current[i] = el;
          }}
          className="wp-panel"
          style={{ viewTransitionName: `wp-panel-${i}` }}
        >
          <SectionArt offset={i * 1200} />
        </div>
      ))}
    </>
  );
}
