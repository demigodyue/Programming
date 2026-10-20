"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { TextLinkLine } from "@/components/motion/flip-face";
import type { RecipeCard } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";

/**
 * Quick meals as a zoom-out: the section pins, and its first dish arrives as a full-screen photo under a giant
 * "30 minutes". Scrolling shrinks that photo down into its slot in a row of four (uniform scale, so it never
 * distorts), the headline fades, the other three dishes rise in beside it and the heading slides up. All scrubbed by
 * ScrollMotion's --p; the hero tile's start (offset and scale to cover the stage) is measured here. Reduced motion /
 * no JS: a normal section showing the finished grid.
 */
export function QuickPanel({ recipes }: { recipes: RecipeCard[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLLIElement>(null);
  const tiles = recipes.slice(0, 4);

  useEffect(() => {
    const s = stage.current;
    const t = slot.current;
    if (!s || !t) return;
    const measure = () => {
      const a = s.getBoundingClientRect();
      const b = t.getBoundingClientRect();
      if (!b.width || !b.height) return;
      s.style.setProperty("--dx", `${(a.left + a.width / 2 - (b.left + b.width / 2)).toFixed(1)}px`);
      s.style.setProperty("--dy", `${(a.top + a.height / 2 - (b.top + b.height / 2)).toFixed(1)}px`);
      s.style.setProperty("--s", Math.max(a.width / b.width, a.height / b.height).toFixed(4));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="quick-title"
      data-progress
      data-progress-start="top top"
      data-progress-end="bottom bottom"
      className="quick-zoom bg-card text-card-foreground"
    >
      <div ref={stage} className="quick-zoom__stage">
        <div className="container-page quick-zoom__head">
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>03 · Weeknights</span>
            <span>Under 30 min</span>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <h2 id="quick-title" className="text-display">
              Quick <em>meals</em>
            </h2>
            <div className="max-w-sm pb-2">
              <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Weeknight dinners under 30 minutes, start to finish — prep included.
              </p>
              <Link href="/recipes?time=under-30" className="text-link mt-2 py-2 text-sm">
                See all quick meals
                <TextLinkLine />
              </Link>
            </div>
          </div>
        </div>

        <ul className="container-page quick-zoom__grid">
          {tiles.map((r, i) => (
            <li key={r.slug} ref={i === 0 ? slot : undefined} className="quick-zoom__slot" style={{ "--k": i } as CSSProperties}>
              <Link
                href={`/recipes/${r.slug}`}
                data-cursor="View recipe"
                className={`quick-tile group ${i === 0 ? "quick-zoom__hero" : "quick-zoom__rest"}`}
              >
                <Image
                  src={r.image}
                  alt={r.imageAlt}
                  fill
                  sizes={i === 0 ? "100vw" : "(min-width: 1024px) 24vw, 46vw"}
                  className="object-cover"
                />
                <span className="quick-zoom__pill bg-card text-card-foreground absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full px-3.5 py-1.5">
                  <span className="font-display truncate text-sm uppercase">{r.title}</span>
                  <span className="label-caps shrink-0 text-[0.6875rem]">{formatMinutes(r.totalMinutes)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p aria-hidden className="quick-zoom__title font-display">
          <span>Dinner in</span>
          <span>30 minutes</span>
        </p>
      </div>
    </section>
  );
}
