"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { SlideBand } from "@/components/motion/slide-band";
import type { RecipeCard } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";

/**
 * Trending dishes as a big numbered list beside one large photo, under a sliding headline band. Scrolled in, each
 * row's rule draws across and its title rises out of a mask, one after another, while the photo window opens and
 * zooms out (both scrubbed by ScrollMotion's --p, see "Trending" in globals.css). Hovering (or focusing) a row makes it the active
 * dish: its title turns to the headline colour and its photo wipes up into the frame over the previous one.
 */
export function TrendingPanel({ recipes }: { recipes: RecipeCard[] }) {
  const rows = recipes.slice(0, 5);
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="trending-title" className="bg-background flex flex-col justify-center overflow-x-clip pb-24 lg:pb-32">
      <SlideBand text="Trending this week" />
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>01 · This week</span>
            <span>Trending</span>
          </div>
          <h2 id="trending-title" className="sr-only">
            Trending dishes
          </h2>
          <ol data-progress data-progress-start="top 92%" data-progress-end="top 30%" className="trend-rows mt-6">
            {rows.map((r, i) => (
              <li key={r.slug} className="trend-rows__item" style={{ "--k": i } as CSSProperties}>
                <Link
                  href={`/recipes/${r.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  data-active={active === i || undefined}
                  className="trend-row group flex items-center gap-5 py-3.5"
                >
                  <span className="label-caps text-muted-foreground w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display trend-row__title flex-1 text-[clamp(1.75rem,3vw,2.75rem)] leading-none uppercase">{r.title}</span>
                  <span className="label-caps text-muted-foreground hidden shrink-0 sm:block">
                    {r.cuisineName} · {formatMinutes(r.totalMinutes)}
                  </span>
                  <ArrowUpRight aria-hidden strokeWidth={1.5} className="trend-row__arrow size-6 shrink-0" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div data-progress
          data-progress-start="top bottom"
          data-progress-end="top 25%"
          className="trend-frame relative aspect-[4/5] w-full overflow-hidden rounded-lg border lg:max-h-[74svh]">
          <span className="trend-frame__zoom">
            {rows.map((r, i) => (
              <span key={r.slug} aria-hidden data-on={active === i || undefined} className="trend-shot">
                <Image src={r.image} alt="" fill sizes="(min-width: 1024px) 42vw, 92vw" className="object-cover" />
              </span>
            ))}
          </span>
          <span className="bg-card text-card-foreground label-caps absolute bottom-4 left-4 rounded-full px-3.5 py-1.5">
            {rows[active]?.cuisineName}
          </span>
        </div>
      </div>
    </section>
  );
}
