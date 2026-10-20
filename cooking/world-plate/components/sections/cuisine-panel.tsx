"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import type { CuisineSummary } from "@/db/queries/cuisines";

/**
 * Cuisines as a pinned horizontal gallery: the section is several screens tall, its stage sticks to the viewport,
 * and scrolling down pans a row of tall cuisine cards from right to left (ScrollMotion's --p, "top top" →
 * "bottom bottom"), each photo drifting inside its card and a bar filling underneath. Tabbing to a card scrolls the
 * page to where that card is in view. Reduced motion / no JS: a normal section with a sideways-scrolling row.
 */
export function CuisinePanel({ cuisines }: { cuisines: CuisineSummary[] }) {
  const ref = useRef<HTMLElement>(null);

  // A card panned off-screen can't be scrolled to by the browser, so move the page to where the track shows it.
  const reveal = (i: number) => {
    const el = ref.current;
    if (!el || el.style.getPropertyValue("--p") === "") return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + travel * ((i + 1) / (cuisines.length + 1)), behavior: "instant" });
  };

  return (
    <section
      ref={ref}
      id="cuisines"
      aria-labelledby="cuisines-title"
      data-progress
      data-progress-start="top top"
      data-progress-end="bottom bottom"
      className="room cuisine-pin scroll-mt-0"
      style={{ "--n": cuisines.length } as CSSProperties}
    >
      <div className="cuisine-pin__stage">
        <div className="container-page w-full">
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>02 · The collection</span>
            <span>{cuisines.length} kitchens</span>
          </div>
        </div>
        <ul className="cuisine-track">
          <li className="cuisine-track__intro">
            <h2 id="cuisines-title" className="text-display">
              Explore by <em>cuisine</em>
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xs text-[0.9375rem] leading-relaxed">
              Ten kitchens, from Kathmandu street stalls to Parisian bakeries. Keep scrolling.
            </p>
          </li>
          {cuisines.map((c, i) => (
            <li key={c.slug} className="cuisine-track__item">
              <Link href={`/cuisine/${c.slug}`} data-cursor="Explore" onFocus={() => reveal(i)} className="cuisine-card group">
                <span className="cuisine-card__photo">
                  <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 24vw, 72vw" className="object-cover" />
                </span>
                <span className="label-caps cuisine-card__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="cuisine-card__meta">
                  <span className="font-display block text-[clamp(1.5rem,2.4vw,2.25rem)] leading-none uppercase">{c.name}</span>
                  <span className="label-caps mt-2 block">
                    {c.country} · {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div aria-hidden className="container-page w-full">
          <div className="cuisine-pin__bar">
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
