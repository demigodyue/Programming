"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";
import { cn } from "@/lib/utils";

type Motion = { delay: number; entryX?: number; entryY?: number; floatX?: number; floatY?: number; dir?: 1 | -1; duration?: number };

/**
 * LaunchDarkly's hero "widget wall", rebuilt with World Plate's own data: each card rises 120px
 * and fades in (700ms, staggered), then drifts on a slow loop; charts draw themselves on.
 * Animations are paused until the wall scrolls into view so nobody misses them.
 */
function Widget({ motion, className, children }: { motion: Motion; className?: string; children: ReactNode }) {
  const style = {
    "--delay": `${motion.delay}ms`,
    "--entry-x": `${motion.entryX ?? 0}px`,
    "--entry-y": `${motion.entryY ?? 120}px`,
    "--float-x": `${motion.floatX ?? 5}px`,
    "--float-y": `${motion.floatY ?? 8}px`,
    "--float-dir": motion.dir ?? 1,
    "--float-duration": `${motion.duration ?? 9}s`,
  } as CSSProperties;
  return (
    <div className={cn("widget", className)} style={style}>
      <div className="widget-float bg-card h-full rounded-lg border">{children}</div>
    </div>
  );
}

function DishWidget({ recipe, motion, className }: { recipe: RecipeCard; motion: Motion; className?: string }) {
  return (
    <Widget motion={motion} className={className}>
      <Link href={`/recipes/${recipe.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg">
        <span className="bg-muted relative block min-h-32 flex-1 overflow-hidden">
          <Image
            src={recipe.image}
            alt={recipe.imageAlt}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="group-hover-fine:scale-[1.05] object-cover transition-transform duration-500 ease-(--ease-ld)"
          />
        </span>
        <span className="flex items-end justify-between gap-3 p-4">
          <span className="font-display text-lg leading-tight">{recipe.title}</span>
          <span className="label-caps text-muted-foreground shrink-0">{formatMinutes(recipe.totalMinutes)}</span>
        </span>
      </Link>
    </Widget>
  );
}

/** Polyline through the values, scaled into a w×h box. */
function linePath(values: number[], w: number, h: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ");
}

export function WidgetWall({
  recipes,
  allMinutes,
  cuisines,
}: {
  recipes: RecipeCard[];
  allMinutes: number[];
  cuisines: CuisineSummary[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [a, b, c] = recipes;
  const quickest = [...recipes].sort((x, y) => x.totalMinutes - y.totalMinutes)[0];
  const average = Math.round(allMinutes.reduce((s, m) => s + m, 0) / Math.max(allMinutes.length, 1));
  const sorted = [...allMinutes].sort((x, y) => x - y);
  const maxCount = Math.max(...cuisines.map((cu) => cu.recipeCount), 1);
  const pills = cuisines.map((cu) => cu.name);

  return (
    <section aria-label="A look inside the collection" className="room overflow-hidden py-16 md:py-24">
      <div
        ref={ref}
        data-inview={inView || undefined}
        className="widget-wall container-page grid auto-rows-[minmax(0,auto)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4"
      >
        {/* Cuisine pill strip — LaunchDarkly's pillRowMarquee (22s linear). */}
        <Widget motion={{ delay: 160 }} className="col-span-2 md:col-span-7">
          <div className="flex h-full flex-col justify-between gap-6 p-5">
            <span className="label-caps text-muted-foreground">{cuisines.length} kitchens</span>
            <p className="font-display max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.125rem)] leading-[1.1]">
              Ramen to croissants, momo to tacos al pastor.
            </p>
            <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
              <div className="pill-scroll flex w-max gap-2">
                {[...pills, ...pills].map((name, i) => (
                  <span key={i} aria-hidden={i >= pills.length || undefined} className="rounded-full border px-3 py-1 text-xs whitespace-nowrap">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Widget>

        {/* Icon tile. */}
        <Widget motion={{ delay: 400, floatX: 4, floatY: 10, dir: -1, duration: 7 }} className="hidden md:col-span-1 md:block">
          <div className="grid h-full min-h-24 place-items-center">
            <span aria-hidden className="hex-outline size-6" />
          </div>
        </Widget>

        {/* Average time with a sparkline that draws itself (costLineReveal). */}
        <Widget motion={{ delay: 480, dir: -1 }} className="col-span-2 md:col-span-4">
          <div className="flex h-full flex-col justify-between gap-4 p-5">
            <span className="label-caps text-muted-foreground">Average time to table</span>
            <div className="flex items-end justify-between gap-4">
              <span className="font-display text-4xl leading-none whitespace-nowrap">{formatMinutes(average)}</span>
              <svg viewBox="0 0 160 48" className="line-reveal h-12 w-32 shrink-0 sm:w-40" style={{ "--delay": "1100ms" } as CSSProperties} aria-hidden>
                <path d={linePath(sorted, 160, 44)} transform="translate(0 2)" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-muted-foreground text-xs">Across all {allMinutes.length} recipes, quickest to slowest</span>
          </div>
        </Widget>

        {a && <DishWidget recipe={a} motion={{ delay: 300, floatY: 10 }} className="col-span-1 h-64 md:col-span-3 md:h-72" />}

        {/* Recipes per cuisine: bars grow from the floor. */}
        <Widget motion={{ delay: 400, dir: -1, duration: 11 }} className="col-span-1 md:col-span-3">
          <div className="flex h-full min-h-64 flex-col gap-4 p-5 md:min-h-72">
            <span className="label-caps text-muted-foreground">Recipes per cuisine</span>
            <div className="flex flex-1 items-end gap-1.5">
              {cuisines.map((cu, i) => (
                <span key={cu.slug} className="flex h-full flex-1 items-end" title={`${cu.name}: ${cu.recipeCount}`}>
                  <span
                    className="grow-bar bg-foreground block w-full rounded-t-[2px]"
                    style={{ height: `${(cu.recipeCount / maxCount) * 100}%`, "--delay": `${900 + i * 60}ms` } as CSSProperties}
                  />
                </span>
              ))}
            </div>
          </div>
        </Widget>

        {b && <DishWidget recipe={b} motion={{ delay: 480, floatX: 6, dir: -1, duration: 10 }} className="col-span-1 h-64 md:col-span-3 md:h-72" />}

        {/* Quickest tonight. */}
        {quickest && (
          <Widget motion={{ delay: 560, floatY: 6, duration: 8 }} className="col-span-1 md:col-span-3">
            <Link href={`/recipes/${quickest.slug}`} className="group flex h-full min-h-64 flex-col justify-between gap-6 p-5 md:min-h-72">
              <span className="label-caps text-muted-foreground">Quickest tonight</span>
              <span>
                <span className="font-display group-hover-fine:underline block text-2xl leading-tight decoration-1 underline-offset-4">
                  {quickest.title}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {[quickest.cuisineName, formatMinutes(quickest.totalMinutes), quickest.vegetarian ? "Vegetarian" : null]
                    .filter(Boolean)
                    .map((chip) => (
                      <span key={chip} className="rounded-full border px-2.5 py-0.5 text-xs">
                        {chip}
                      </span>
                    ))}
                </span>
              </span>
            </Link>
          </Widget>
        )}

        {c && <DishWidget recipe={c} motion={{ delay: 640, floatX: 4, floatY: 9, duration: 12 }} className="col-span-2 h-64 md:col-span-12 md:hidden" />}
      </div>
    </section>
  );
}
