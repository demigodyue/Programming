"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { T } from "@/components/i18n";
import { ScrubWords } from "@/components/motion/scrub-words";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The pinned product stage from eathungrytiger.com, recorded 2026-10-19: one object stays in the middle of the
// screen while three headlines scroll past it. Their jar container (Webflow scroll interaction) was sampled every
// 400px of scroll and normalised here to 0–1 of the stage: it rises 32vh while easing to 0.91×, grows back to 1×
// as it tilts -10°, holds, then shrinks to nothing turning a further ~25° and fading.
// [progress, scale, y (vh), rotate (deg), opacity]
const KEYS: number[][] = [
  [0, 1, 32, 0, 1],
  [0.3, 0.912, 0, 0, 1],
  [0.45, 0.95, 0, 0, 1],
  [0.65, 1, 4.8, -10, 1],
  [0.75, 1, 4.8, -10, 1],
  [0.8, 0.953, 4.8, -11.2, 1],
  [0.85, 0.755, 4.8, -16, 1],
  [0.9, 0.507, 4.8, -22.3, 0.845],
  [0.95, 0.192, 4.8, -30.2, 0.32],
  [1, 0, 4.8, -35, 0],
];

// Their jar itself tumbles (a scroll-scrubbed Lottie): upright, tips back to show the lid, flips over to the back
// label and the base, comes upright again, then turns to the diagonal it holds as it shrinks away. These poses are
// read off their frames at the same scroll positions. [progress, rotateX, rotateY, rotateZ] in degrees.
const POSES: number[][] = [
  [0, -8, 0, 0],
  [0.11, -10, 0, 0],
  [0.15, -18, 0, -8],
  [0.22, -38, 0, -15],
  [0.26, -60, 0, -22],
  [0.3, -82, 0, -20],
  [0.34, -112, 0, -14],
  [0.375, -148, 0, -8],
  [0.42, -180, 180, -4],
  [0.47, -185, 185, 6],
  [0.52, -205, 190, 14],
  [0.56, -235, 200, 20],
  [0.62, -290, 270, 12],
  [0.68, -345, 345, 4],
  [0.72, -368, 360, 0],
  [0.78, -380, 380, -8],
  [0.84, -398, 395, -24],
  [1, -400, 400, -26],
];

function sample(table: number[][], p: number) {
  let i = 1;
  while (i < table.length - 1 && table[i][0] < p) i++;
  const a = table[i - 1];
  const b = table[i];
  const t = b[0] === a[0] ? 1 : Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0])));
  return a.map((v, k) => v + (b[k] - v) * t);
}

const N = 24; // strips around the jar
const STRIPS = Array.from({ length: N }, (_, i) => i);
const LIGHT = (() => {
  const v = [-0.35, -0.55, 0.76]; // from the upper left, toward the viewer (CSS y points down)
  const m = Math.hypot(...v);
  return v.map((c) => c / m);
})();

/** Rotate a normal by the jar's CSS transform `rotateZ(z) rotateX(x) rotateY(y)` (applied right to left). */
function turn([nx, ny, nz]: number[], rx: number, ry: number, rz: number) {
  const r = Math.PI / 180;
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx * r), Math.sin(rx * r), Math.cos(ry * r), Math.sin(ry * r), Math.cos(rz * r), Math.sin(rz * r)];
  // rotateY
  const x1 = nx * cy + nz * sy;
  const z1 = -nx * sy + nz * cy;
  // rotateX
  const y2 = ny * cx - z1 * sx;
  const z2 = ny * sx + z1 * cx;
  // rotateZ
  return [x1 * cz - y2 * sz, x1 * sz + y2 * cz, z2];
}

/**
 * The Sizzle Atlas "House Masala" jar, built in CSS 3D: 24 label strips and 24 lid strips around a cylinder,
 * a lid top and a base. Each face is shaded from its turned normal (an overlay's opacity, so it stays cheap).
 */
function Jar({ jarRef }: { jarRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={jarRef} className="jar" style={{ "--jar-label": `url(${BASE}/jar-label.svg)` } as CSSProperties}>
      {STRIPS.map((i) => (
        <span key={`b${i}`} className="jar__body" style={{ "--a": `${(i * 360) / N}deg`, "--o": -i - N / 2 + 0.5 } as CSSProperties}>
          <span className="jar__shade" />
        </span>
      ))}
      {STRIPS.map((i) => (
        <span key={`l${i}`} className="jar__lid" style={{ "--a": `${(i * 360) / N}deg` } as CSSProperties}>
          <span className="jar__shade" />
        </span>
      ))}
      <span className="jar__top">
        <span className="jar__mark">WP</span>
        <span className="jar__shade" />
      </span>
      <span className="jar__bottom">
        <span className="jar__shade" />
      </span>
    </div>
  );
}

/**
 * Hungry Tiger's pinned stage with an original Sizzle Atlas jar in place of theirs. It stays in the middle of the
 * screen, tumbles through their poses as you scroll and moves on their container curve, passing in front of the
 * three headlines, which fill word by word (ScrubWords). Reduced motion: the jar rests upright in the middle.
 */
export function DishStage({ href }: { href: string }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const jar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    const box = stage.current;
    const body = jar.current;
    if (!el || !box || !body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shades = (sel: string) => Array.from(body.querySelectorAll<HTMLElement>(`${sel} > .jar__shade`));
    const bodyShades = shades(".jar__body");
    const lidShades = shades(".jar__lid");
    const [topShade] = shades(".jar__top");
    const [bottomShade] = shades(".jar__bottom");
    const normals = STRIPS.map((i) => {
      const a = ((i * 360) / N) * (Math.PI / 180);
      return [Math.sin(a), 0, Math.cos(a)];
    });
    const shade = (n: number[], rx: number, ry: number, rz: number) => {
      const [x, y, z] = turn(n, rx, ry, rz);
      const lit = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
      return (0.62 * (1 - lit)).toFixed(3);
    };

    let frame = 0;
    const render = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      const [, s, y, rot, op] = sample(KEYS, p);
      box.style.transform = `translate3d(0, ${y.toFixed(2)}vh, 0) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      box.style.opacity = op.toFixed(3);
      const [, rx, ry, rz] = sample(POSES, p);
      body.style.transform = `rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      normals.forEach((n, i) => {
        const o = shade(n, rx, ry, rz);
        bodyShades[i].style.opacity = o;
        lidShades[i].style.opacity = o;
      });
      topShade.style.opacity = shade([0, -1, 0], rx, ry, rz);
      bottomShade.style.opacity = shade([0, 1, 0], rx, ry, rz);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={section} aria-labelledby="stage-title" className="relative">
      {/* The pinned jar, drawn above the headlines so it passes in front of them. */}
      <div aria-hidden className="pointer-events-none sticky top-0 z-20 flex h-[100svh] items-center justify-center overflow-hidden [perspective:1400px]">
        <div ref={stage} className="[transform-style:preserve-3d] will-change-transform">
          <Jar jarRef={jar} />
        </div>
      </div>

      <div className="relative z-10 -mt-[100svh]">
        <div className="container-page flex h-[100svh] flex-col items-center pt-28 text-center md:pt-32">
          <p className="label-caps text-muted-foreground">
            <T en="Sizzle Atlas · House masala" ja="Sizzle Atlas · 特製マサラ" />
          </p>
          <ScrubWords id="stage-title" text="Spice it up" ja="スパイスで|もっと|おいしく" className="text-display mt-3 max-w-[12ch]" />
        </div>
        <div className="container-page flex h-[130svh] items-center">
          <ScrubWords text="Every turn, more flavour" ja="ひとふりごとに、|香りが|広がる" className="text-display max-w-[10ch]" />
        </div>
        <div className="container-page flex h-[130svh] flex-col items-center justify-center gap-8 text-center">
          <ScrubWords text="Open the jar tonight" ja="今夜、|瓶を|開けよう" className="text-display max-w-[12ch]" />
          <Link href={href} data-accent="yellow" className={flipClass()}>
            <FlipFace>
              <T en="Cook with it" ja="これで作る" />
            </FlipFace>
          </Link>
        </div>
      </div>
    </section>
  );
}
