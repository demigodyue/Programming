"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CuisineSummary } from "@/db/queries/cuisines";

const PIN = "(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)";
const START = 0.05; // first card leaves the deck
const STAGGER = 0.07; // between cards
const DEAL = 0.22; // each card's flight, as a share of the pinned scroll (the tenth lands at ~90%)

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The cuisines as flash cards. On large screens the grid pins while you scroll and starts as one stacked deck,
 * face down, in the middle of the screen; each card in turn lifts off in an arc, flips face up and lands in its
 * place, all scrubbed by the scroll (like the jar stage). Once landed, a card flips over on hover or keyboard focus
 * to show its back: country, recipe count and a link. Elsewhere the cards swing in as they enter the screen.
 * Reduced motion: a plain grid; the flip is an instant swap.
 */
export function CuisineDeck({ cuisines }: { cuisines: CuisineSummary[] }) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = track.current;
    const grid = stage.current;
    if (!el || !grid) return;
    const mq = window.matchMedia(PIN);
    const items = Array.from(grid.querySelectorAll<HTMLLIElement>(":scope > li"));
    const deals = items.map((li) => li.querySelector<HTMLElement>(".flash__deal")!);
    let offsets: [number, number][] = [];
    let frame = 0;
    let on = false;

    const measure = () => {
      deals.forEach((d) => (d.style.transform = ""));
      const g = grid.getBoundingClientRect();
      const cx = g.left + g.width / 2;
      const cy = g.top + g.height / 2;
      offsets = deals.map((d) => {
        const r = d.getBoundingClientRect();
        return [cx - (r.left + r.width / 2), cy - (r.top + r.height / 2)];
      });
    };

    const render = () => {
      frame = 0;
      if (!on) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? clamp01(-r.top / span) : 1;
      deals.forEach((d, i) => {
        const e = easeInOutCubic(clamp01((p - START - i * STAGGER) / DEAL));
        const [dx, dy] = offsets[i] ?? [0, 0];
        const k = 1 - e;
        const tilt = (((i * 37) % 13) - 6) * k;
        const lift = -Math.sin(Math.PI * e) * 80;
        d.style.transform = `translate3d(${(dx * k).toFixed(1)}px, ${(dy * k + lift - i * 3 * k).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) rotateY(${(180 * k).toFixed(1)}deg)`;
        items[i].style.zIndex = String(e >= 1 ? 1 : e > 0 ? 200 : 100 - i);
        if (e >= 1) d.dataset.landed = "";
        else delete d.dataset.landed;
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const sync = () => {
      on = mq.matches;
      if (on) {
        el.dataset.pinned = "";
        measure();
        render();
      } else {
        delete el.dataset.pinned;
        deals.forEach((d) => {
          d.style.transform = "";
          delete d.dataset.landed;
        });
        items.forEach((li) => (li.style.zIndex = ""));
      }
    };
    const onResize = () => {
      if (!on) return;
      measure();
      render();
    };

    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={track} className="deck-track">
      <div className="deck-pin">
        <ul ref={stage} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {cuisines.map((c) => (
            <li key={c.slug} className="flash">
              <div className="flash__deal">
                <span aria-hidden className="flash__cover">
                  <span className="font-display grid size-16 place-items-center rounded-full border-2 border-current text-2xl">WP</span>
                </span>
                <Link
                  href={`/cuisine/${c.slug}`}
                  data-cursor="Explore"
                  aria-label={`${c.name} cuisine, ${c.recipeCount} ${c.recipeCount === 1 ? "recipe" : "recipes"}`}
                  className="flash__card focus-visible:outline-none"
                >
                  <span className="flash__front">
                    <span className="bg-muted relative block flex-1">
                      <Image
                        src={c.image}
                        alt={c.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"
                        className="object-cover"
                      />
                    </span>
                    <span className="flex items-end justify-between gap-2 p-4">
                      <span className="font-display text-headline text-2xl leading-none">{c.name}</span>
                      <span className="label-caps shrink-0">{c.recipeCount}</span>
                    </span>
                  </span>
                  <span className="flash__back">
                    <span className="label-caps">{c.country}</span>
                    <span>
                      <span className="font-display block text-3xl leading-[0.95]">{c.name}</span>
                      <span className="mt-2 block text-sm">
                        {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      Explore <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
