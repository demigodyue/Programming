"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { SectionArt } from "@/components/section-art";
import type { CuisineSummary } from "@/db/queries/cuisines";

/** How far each card leans while it is still in the stack (degrees). */
const TILT = [-7, 5, -3, 8, -5, 3, -8, 6, -2, 4];

/**
 * Cuisines as a card stack that opens with the scroll: the section pins with all ten cuisine cards piled up in
 * the middle of the grid, each leaning its own way; scrolling deals them out one by one (the top card first) to
 * their places in the grid — 5 × 2 on large screens, 2 × 5 on phones. Scrubbed by ScrollMotion's --p; each card's
 * offset from the pile is measured here (--dx / --dy). Tabbing to a card while the stack is closed scrolls to the
 * open grid. Reduced motion / no JS: the open grid as a normal section.
 */
export function CuisinePanel({ cuisines }: { cuisines: CuisineSummary[] }) {
  const section = useRef<HTMLElement>(null);
  const grid = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const g = grid.current;
    if (!g) return;
    const measure = () => {
      const a = g.getBoundingClientRect();
      const cx = a.left + a.width / 2;
      const cy = a.top + a.height / 2;
      g.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => {
        // offsetLeft/Top ignore the li's own transform, so this is its resting place in the grid.
        const x = a.left + li.offsetLeft + li.offsetWidth / 2;
        const y = a.top + li.offsetTop + li.offsetHeight / 2;
        li.style.setProperty("--dx", `${(cx - x).toFixed(1)}px`);
        li.style.setProperty("--dy", `${(cy - y).toFixed(1)}px`);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(g);
    return () => ro.disconnect();
  }, []);

  // A card still in the stack can't be reached, so jump to where the grid has opened.
  const reveal = () => {
    const el = section.current;
    const p = Number(el?.style.getPropertyValue("--p") || 1);
    if (!el || p >= 1) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + el.offsetHeight - window.innerHeight, behavior: "instant" });
  };

  return (
    <section
      ref={section}
      id="cuisines"
      aria-labelledby="cuisines-title"
      data-progress
      data-progress-start="top top"
      data-progress-end="bottom bottom"
      className="room cuisine-stack relative isolate scroll-mt-0"
    >
      <SectionArt offset={1200} />
      <div className="cuisine-stack__stage container-page">
        <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
          <span>02 · The collection</span>
          <span>{cuisines.length} kitchens</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <h2 id="cuisines-title" className="cuisine-stack__title font-display">
            Explore by <em>cuisine</em>
          </h2>
          <p className="text-muted-foreground max-w-xs pb-1 text-[0.9375rem] leading-relaxed">
            Ten kitchens, from Kathmandu street stalls to Parisian bakeries.
          </p>
        </div>
        <ul ref={grid} className="cuisine-stack__grid">
          {cuisines.map((c, i) => (
            <li
              key={c.slug}
              className="cuisine-stack__slot"
              style={{ "--k": i, "--t": `${TILT[i % TILT.length]}deg`, zIndex: cuisines.length - i } as CSSProperties}
            >
              <Link href={`/cuisine/${c.slug}`} data-cursor="Explore" onFocus={reveal} className="cuisine-card group">
                <span className="cuisine-card__photo">
                  <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 20vw, 46vw" className="object-cover" />
                </span>
                <span className="label-caps cuisine-card__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="cuisine-card__meta">
                  <span className="font-display block truncate text-[clamp(1rem,1.9vw,1.75rem)] leading-none uppercase">{c.name}</span>
                  <span className="label-caps mt-1.5 hidden truncate text-[0.6875rem] sm:block">
                    {c.country} · {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
