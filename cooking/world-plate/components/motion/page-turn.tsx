"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SectionArt } from "@/components/section-art";

/**
 * The page transition: the site is an illustrated cookbook, so changing page turns the page. Internal link clicks
 * run Next's navigation inside `document.startViewTransition`, and the old page's snapshot is turned like a leaf of
 * paper, from the bottom-right corner:
 *
 * - A fold line, tilted a little (its foot leads, so the bottom corner lifts first), sweeps from beyond the right
 *   edge to beyond the left edge (1.15s, ease in-out).
 * - The old page stays only on the side of the fold it hasn't reached (clip-path polygon).
 * - The part already turned shows the back of the leaf: a plain cream sheet with faint engravings (rendered
 *   here, shown only while a turn is captured), clipped to the turned part and mirrored across the fold line, with
 *   a soft shadow on the new page beneath, a crease shadow along the fold and a curl shade and sheen on the leaf.
 * - The new page waits underneath, a touch darker at first, and its own entrance starts as the leaf passes the
 *   middle (`data-load="turn"`, globals.css).
 *
 * Keyframes are computed per frame (the mirror is a reflection matrix across the moving fold). The header keeps its
 * own view-transition name and stays put. Reduced motion: the old page fades out while the new one fades in.
 * Browser back/forward and browsers without view transitions navigate without it.
 */

const DUR = 1150;
const FPS = 60;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const normalise = (path: string) => path.replace(/\/+$/, "") || "/";
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const px = (n: number) => `${n.toFixed(1)}px`;

/** One frame of the turn at progress p (0 → 1): where the fold is, and what that means for each layer. */
function frame(p: number, W: number, H: number) {
  const slant = W * 0.14;
  // The fold's middle travels from past the right edge to past the left edge; top = mid + slant, foot = mid - slant.
  const mid = W + slant - easeInOut(p) * (W + 2 * slant);
  const a = mid + slant; // where the fold meets the top edge
  const b = mid - slant; // ... and the bottom edge
  // Reflection across the fold line (through (a, 0) and (b, H)): x' = M x + t.
  const len = Math.hypot(b - a, H);
  const ux = (b - a) / len;
  const uy = H / len;
  const m11 = 2 * ux * ux - 1;
  const m12 = 2 * ux * uy;
  const m22 = 2 * uy * uy - 1;
  const tx = a - (m11 * a);
  const ty = -(m12 * a);
  return {
    old: `polygon(0px 0px, ${px(a)} 0px, ${px(b)} ${px(H)}, 0px ${px(H)})`,
    leafClip: `polygon(${px(a)} 0px, ${px(W)} 0px, ${px(W)} ${px(H)}, ${px(b)} ${px(H)})`,
    leafMatrix: `matrix(${m11.toFixed(5)}, ${m12.toFixed(5)}, ${m12.toFixed(5)}, ${m22.toFixed(5)}, ${tx.toFixed(2)}, ${ty.toFixed(2)})`,
    // The crease band is 2W wide with its fold-shaped edge through its centre: slide it so that edge sits on the
    // fold, and keep only its new-page side.
    crease: `translateX(${px(mid - W)})`,
    // The curl shade rides on the leaf: the same band, slid onto the fold and then mirrored with the leaf.
    leafShade: `matrix(${m11.toFixed(5)}, ${m12.toFixed(5)}, ${m12.toFixed(5)}, ${m22.toFixed(5)}, ${(tx + m11 * (mid - W)).toFixed(2)}, ${(ty + m12 * (mid - W)).toFixed(2)})`,
    creaseClip: `polygon(${px(W + slant)} 0px, ${px(2 * W)} 0px, ${px(2 * W)} ${px(H)}, ${px(W - slant)} ${px(H)})`,
  };
}

export function PageTurn() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    const root = document.documentElement;
    let running = false;
    let clearLoad = 0;

    // Resolve once the new page is really in the DOM: the URL has changed and React has swapped <main>'s
    // content (the turn reveals the new page as it goes, so it must be there from the first frame).
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

    const turn = (url: URL) => {
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
          root.dataset.load = reduce ? "fade" : "turn";
          if (!reduce) {
            // The crease gradient runs across the fold: perpendicular to it, pointing right and a little down.
            const slant = window.innerWidth * 0.14;
            const angle = (Math.atan2(window.innerHeight, -2 * slant) * 180) / Math.PI;
            root.style.setProperty("--crease-angle", `${angle.toFixed(2)}deg`);
            root.dataset.turnLeaf = "";
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
          if (reduce) {
            const ease = "cubic-bezier(0.65, 0.05, 0, 1)";
            root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 525, easing: ease, fill: "both", pseudoElement: "::view-transition-old(root)" });
            root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: ease, fill: "both", pseudoElement: "::view-transition-new(root)" });
            return;
          }
          const W = window.innerWidth;
          const H = window.innerHeight;
          const old: Keyframe[] = [];
          const leaf: Keyframe[] = [];
          const crease: Keyframe[] = [];
          const shade: Keyframe[] = [];
          const steps = Math.round((DUR / 1000) * FPS);
          for (let s = 0; s <= steps; s++) {
            const p = s / steps;
            const f = frame(p, W, H);
            old.push({ clipPath: f.old });
            leaf.push({ clipPath: f.leafClip, transform: f.leafMatrix });
            crease.push({ clipPath: f.creaseClip, transform: f.crease, opacity: p < 0.96 ? 1 : 0 });
            shade.push({ clipPath: f.creaseClip, transform: f.leafShade });
          }
          const opts = { duration: DUR, easing: "linear", fill: "both" } as const;
          root.animate(old, { ...opts, pseudoElement: "::view-transition-old(root)" });
          root.animate([{ filter: "brightness(0.8)" }, { filter: "brightness(1)" }], { duration: DUR, easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "both", pseudoElement: "::view-transition-new(root)" });
          root.animate(leaf, { ...opts, pseudoElement: "::view-transition-new(wp-leaf)" });
          root.animate(crease, { ...opts, pseudoElement: "::view-transition-new(wp-crease)" });
          root.animate(shade, { ...opts, pseudoElement: "::view-transition-new(wp-leaf-shade)" });
        })
        .catch(() => {});

      transition.finished.finally(() => {
        delete root.dataset.turnLeaf;
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
      if (running) return; // ignore clicks mid-turn
      turn(url);
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
      {/* The back of the leaf: plain cream paper with faint engravings. Only rendered while a turn is captured. */}
      <div aria-hidden className="wp-leaf" style={{ viewTransitionName: "wp-leaf" }}>
        <SectionArt offset={900} />
      </div>
      {/* The curl: a soft shade and sheen along the fold, on the leaf. */}
      <div aria-hidden className="wp-crease wp-leaf-shade" style={{ viewTransitionName: "wp-leaf-shade" }} />
      {/* The shadow the turning leaf throws on the page beneath, along the fold. */}
      <div aria-hidden className="wp-crease" style={{ viewTransitionName: "wp-crease" }} />
    </>
  );
}
