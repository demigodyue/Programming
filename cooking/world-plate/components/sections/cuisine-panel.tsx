"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { T } from "@/components/i18n";
import { LImage } from "@/components/i18n-image";
import { SectionArt } from "@/components/section-art";
import type { CuisineSummary } from "@/db/queries/cuisines";

/** How far each card leans while it is still in the stack (degrees). */
const TILT = [-7, 5, -3, 8, -5, 3, -8, 6, -2, 4, -6, 7];

/**
 * Cuisines as a card stack that opens with the scroll: the section pins with all the cuisine cards piled up in
 * the middle of the grid, each leaning its own way; scrolling deals them out one by one (the top card first) to
 * their places in the grid — 6 × 2 on large screens, 3 × 4 on phones (--n spreads the deal over the scroll). Scrubbed by ScrollMotion's --p; each card's
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
          <span>
            <T en="02 · The collection" ja="02 · コレクション" />
          </span>
          <span>
            <T en={`${cuisines.length} kitchens`} ja={`${cuisines.length}の食文化`} />
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <h2 id="cuisines-title" className="cuisine-stack__title font-display">
            <T
              en={
                <>
                  Explore by <em>cuisine</em>
                </>
              }
              ja={
                <>
                  <em>国</em>から探す
                </>
              }
            />
          </h2>
          <p className="text-muted-foreground max-w-xs pb-1 text-[0.9375rem] leading-relaxed">
            <T
              en={`${cuisines.length} kitchens, from Kathmandu street stalls to Parisian bakeries.`}
              ja={`カトマンズの屋台からパリのパン屋まで、${cuisines.length}の食文化。`}
            />
          </p>
        </div>
        <ul ref={grid} className="cuisine-stack__grid" style={{ "--n": cuisines.length } as CSSProperties}>
          {cuisines.map((c, i) => (
            <li
              key={c.slug}
              className="cuisine-stack__slot"
              style={{ "--k": i, "--t": `${TILT[i % TILT.length]}deg`, zIndex: cuisines.length - i } as CSSProperties}
            >
              <Link href={`/cuisine/${c.slug}`} data-cursor="Explore" onFocus={reveal} className="cuisine-card group">
                <span className="cuisine-card__photo">
                  <LImage src={c.image} alt={c.imageAlt} altJa={c.ja.imageAlt} fill sizes="(min-width: 1024px) 20vw, 46vw" className="object-cover" />
                </span>
                <span className="label-caps cuisine-card__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="cuisine-card__meta">
                  <span className="cuisine-card__name font-display block truncate text-[clamp(1rem,1.9vw,1.75rem)] leading-none uppercase">
                    <T en={c.name} ja={c.ja.name} />
                  </span>
                  <span className="label-caps mt-1.5 hidden truncate text-[0.6875rem] sm:block">
                    <T
                      en={`${c.country} · ${c.recipeCount} ${c.recipeCount === 1 ? "recipe" : "recipes"}`}
                      ja={`${c.ja.country} · ${c.recipeCount}品`}
                    />
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
