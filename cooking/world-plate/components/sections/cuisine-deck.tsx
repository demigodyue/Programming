"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { CuisineSummary } from "@/db/queries/cuisines";

const PIN = "(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
const SEG = 42; // svh of scroll per card while pinned
const TAIL = 0.6; // the last card still flips over at the end

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Where card `i` sits when the deck is at position `s` (0 = first card on top, 1 = second, …). Within one card's
 * stretch: the photo side holds, the card flips over to its back (0.30–0.55), holds, then flies off to the left
 * (0.72–1) while the cards beneath move up one place. Deeper cards fan slightly and fade after the third.
 */
function place(i: number, s: number, n: number) {
  const top = Math.min(n - 1, Math.floor(s));
  const f = s - top;
  const flip = easeInOut(clamp01((f - 0.3) / 0.25));
  const fly = i === n - 1 ? 0 : easeInOut(clamp01((f - 0.72) / 0.28));
  if (i < top) return { card: "translate3d(-120%, -4%, 0) rotate(-16deg)", face: "rotateY(180deg)", opacity: 0, z: 0 };
  if (i === top) {
    return {
      card: `translate3d(${(-fly * 120).toFixed(2)}%, ${(-fly * 4).toFixed(2)}%, 0) rotate(${(-fly * 16).toFixed(2)}deg)`,
      face: `rotateY(${(flip * 180).toFixed(1)}deg)`,
      opacity: 1 - fly * fly,
      z: 100,
    };
  }
  const depth = i - top - fly;
  const side = i % 2 ? 1 : -1;
  return {
    card: `translate3d(0, ${(depth * 5).toFixed(2)}%, 0) rotate(${(depth * 2.4 * side).toFixed(2)}deg) scale(${(1 - depth * 0.06).toFixed(4)})`,
    face: "rotateY(0deg)",
    opacity: clamp01(3.4 - depth),
    z: 100 - (i - top),
  };
}

/**
 * The cuisines as a stack of flash cards. Large screens: the section pins and the scroll works through the stack —
 * each card shows its photo, flips to its back (country, recipe count, link) and flies off as the next one comes
 * up — like the jar stage, everything is scrubbed by the scroll. Elsewhere Previous / Next step through the stack
 * (with a short eased move) and hovering the top card flips it. A side panel names the card on top.
 * Reduced motion: no pin, the cards just change place.
 */
export function CuisineDeck({ cuisines }: { cuisines: CuisineSummary[] }) {
  const n = cuisines.length;
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const faces = useRef<(HTMLAnchorElement | null)[]>([]);
  const pinned = useRef(false);
  const [index, setIndex] = useState(0); // unpinned position (and the panel's card)
  const [active, setActive] = useState(0);

  const paint = useCallback(
    (s: number, scrubbed: boolean) => {
      cuisines.forEach((_, i) => {
        const card = cards.current[i];
        const face = faces.current[i];
        if (!card || !face) return;
        const p = place(i, s, n);
        card.style.transform = p.card;
        card.style.opacity = String(p.opacity);
        card.style.zIndex = String(p.z);
        card.style.visibility = p.opacity <= 0.01 ? "hidden" : "visible";
        // Scrubbed: the scroll owns the flip. Stepping: leave the flip to :hover.
        face.style.transform = scrubbed ? p.face : "";
      });
    },
    [cuisines, n],
  );

  // Pinned mode: the scroll position drives the stack.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const mq = window.matchMedia(PIN);
    let frame = 0;
    const render = () => {
      frame = 0;
      if (!pinned.current) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? clamp01(-r.top / span) : 0;
      const s = p * (n - 1 + TAIL);
      paint(s, true);
      setActive(Math.min(n - 1, Math.floor(s)));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const sync = () => {
      pinned.current = mq.matches;
      if (pinned.current) {
        el.dataset.pinned = "";
        render();
      } else {
        delete el.dataset.pinned;
      }
    };
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [n, paint]);

  // Stepping mode: buttons move the stack.
  useEffect(() => {
    if (pinned.current) return;
    paint(index, false);
    setActive(index);
  }, [index, paint]);

  const go = (target: number) => {
    const t = Math.max(0, Math.min(n - 1, target));
    const el = track.current;
    if (pinned.current && el) {
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      window.scrollTo({ top: window.scrollY + r.top + ((t + 0.05) / (n - 1 + TAIL)) * span, behavior: "smooth" });
    } else {
      setIndex(t);
    }
  };

  const current = cuisines[active];

  return (
    <div ref={track} className="fc-track" style={{ "--n": n, "--seg": `${SEG}svh` } as CSSProperties}>
      <div className="fc-pin">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          {/* The panel: which card is on top. */}
          <div className="order-last lg:order-first">
            <p className="label-caps text-muted-foreground" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {current?.country}
            </p>
            <p className="font-display text-headline mt-3 text-[clamp(3rem,7vw,6rem)] leading-[0.92] uppercase">{current?.name}</p>
            <p className="text-muted-foreground mt-4 max-w-sm text-[0.9375rem] leading-relaxed">
              {current?.recipeCount} {current?.recipeCount === 1 ? "recipe" : "recipes"} from {current?.country}. Flip through the deck to see
              every kitchen.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous cuisine" className="fc-btn">
                <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1} aria-label="Next cuisine" className="fc-btn">
                <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
              {current && (
                <Link href={`/cuisine/${current.slug}`} className="text-link ml-2 py-3 text-sm">
                  Explore {current.name}
                </Link>
              )}
            </div>
          </div>

          {/* The stack. */}
          <ul className="fc-stack" aria-label="Cuisines">
            {cuisines.map((c, i) => (
              <li
                key={c.slug}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="fc"
                style={{ zIndex: n - i }}
              >
                <Link
                  ref={(el) => {
                    faces.current[i] = el;
                  }}
                  href={`/cuisine/${c.slug}`}
                  data-cursor="Explore"
                  aria-label={`${c.name} cuisine, ${c.recipeCount} ${c.recipeCount === 1 ? "recipe" : "recipes"}`}
                  tabIndex={i === active ? 0 : -1}
                  className="fc__inner"
                >
                  <span className="fc__face fc__front">
                    <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 416px, 80vw" className="object-cover" />
                    <span className="bg-card text-card-foreground absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-full px-4 py-2">
                      <span className="font-display text-xl leading-none uppercase">{c.name}</span>
                      <span className="label-caps shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  </span>
                  <span className="fc__face fc__back">
                    <span className="label-caps">{c.country}</span>
                    <span>
                      <span className="font-display block text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.92] uppercase">{c.name}</span>
                      <span className="mt-3 block text-sm">
                        {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"} to cook
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      Explore the kitchen <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
