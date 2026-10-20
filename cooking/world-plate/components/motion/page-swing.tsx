"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SectionArt } from "@/components/section-art";
import { slush } from "./slush-ease";

/**
 * The page transition: Slush's card style (their Barba `runTransition` — the page becomes a rounded card in 3D, with
 * candy-coloured panels), rebuilt on the View Transitions API, now moving as a card shuffle (timeline below).
 *
 * Internal link clicks are taken over: Next's navigation runs inside `document.startViewTransition`, then the old
 * page, the new page and three panels (each carrying the site's engravings) are animated with keyframes sampled
 * per frame from the tracks below. The old card tips back and falls away down the screen, the panels tumble down past
 * the middle, and the new card drops in from the top, straightens and comes forward to full screen; the new page's own
 * entrance starts as it lands (the `data-load="swing"` clock in globals.css).
 * The header has its own view-transition name and stays put. Reduced motion: Slush's
 * `runReducedTransition` — the old page fades out (0.525s) while the new one fades in (1s).
 * Browser back/forward and browsers without view transitions navigate without it.
 */

type Prop = "xp" | "z" | "ry" | "r" | "rz" | "y" | "rx";
type Tween = { at: number; dur: number; ease: (t: number) => number; to: Partial<Record<Prop, number>> };
type Track = { from: Record<Prop, number>; tweens: Tween[] };

// The card cascade (2026-10-20, "same style, different animation"), in real seconds — everything flows downward,
// so no two cards ever cross:
//   0.00  the old page becomes a card (z -100, corners 2rem)
//   0.20  it tips back (rotateX) and falls away out of the bottom, tilting (gone by 0.72)
//   0.15+ the three engraved panels tumble down past the middle behind it, 0.08s apart, each tilted its own way
//   0.52  the new page drops in from the top, tilted, on top of everything, and straightens into the middle
//   1.00  it comes forward to full screen and its corners square off
const END = 1.35;
// Played 1.3× faster than the timeline above ("a bit more fast"): ~1.04s in all.
const SPEED = 1.3;
const OLD_GONE = 0.75; // the old card has fallen off the bottom by now
const FPS = 60;
// Smooth in-out; cubic in (things falling away) and out (things arriving).
const smooth = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const at0 = { xp: 0, z: 0, ry: 0, r: 2, rz: 0, y: 0, rx: 0 };
// y is applied in 3D, far back (z -100vw), where perspective shrinks it to ~40% on screen — so "off-screen" is
// ~260vh for the cards and ~280vh for the panels (further back still).
const OFF = 260;

const OLD: Track = {
  from: at0,
  tweens: [
    { at: 0, dur: 0.45, ease: smooth, to: { z: -100 } },
    { at: 0.2, dur: 0.52, ease: easeIn, to: { y: OFF, rx: 24, rz: -7 } },
  ],
};
const NEW: Track = {
  from: { ...at0, z: -100, y: -OFF, rx: -20, rz: -6 },
  tweens: [
    { at: 0.52, dur: 0.5, ease: easeOut, to: { y: 0, rx: 0, rz: 0 } },
    { at: 1.0, dur: 0.35, ease: slush, to: { z: 0, r: 0 } },
  ],
};
// Each panel falls from above the screen to below it, passing the middle behind the cards.
const PANELS: Track[] = [-9, 6, -4].map((tilt, i) => ({
  from: { ...at0, z: -130, y: -OFF - 20, rx: 14, rz: -tilt },
  tweens: [{ at: 0.15 + i * 0.08, dur: 0.72, ease: smooth, to: { y: OFF + 20, rx: -14, rz: tilt } }],
}));

// Forest (--slush-violet) is left out: a forest panel would vanish into the forest backdrop.
const COLOURS = ["--slush-blue", "--slush-yellow", "--slush-lavender", "--slush-mint", "--slush-orange"];
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
    const [xp, z, ry, rz, y, rx] = (["xp", "z", "ry", "rz", "y", "rx"] as const).map((p) => valueAt(track, p, t));
    const frame: Keyframe = {
      transform: `perspective(1000px) translateX(${xp.toFixed(3)}%) translateY(${y.toFixed(3)}vh) translateZ(${(z * vw).toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`,
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
          const opts = { duration: (END * 1000) / SPEED, easing: "linear", fill: "both" } as const;
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
