import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Minutes, T } from "@/components/i18n";
import { LImage } from "@/components/i18n-image";
import { ScrollMarquee } from "@/components/motion/scroll-marquee";
import { SectionArt } from "@/components/section-art";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { cn } from "@/lib/utils";

function Widget({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-card rounded-lg border", className)}>{children}</div>;
}

function DishWidget({ recipe, className }: { recipe: RecipeCard; className?: string }) {
  return (
    // Hover: the whole tile sinks to 0.92 on the elastic curve (Slush's footer tiles).
    <Widget className={cn("tile-press", className)}>
      <Link href={`/recipes/${recipe.slug}`} data-cursor="View recipe" className="flex h-full flex-col overflow-hidden rounded-lg">
        <span className="bg-muted relative block min-h-32 flex-1 overflow-hidden">
          <LImage src={recipe.image} alt={recipe.imageAlt} altJa={recipe.ja.imageAlt} fill sizes="(min-width: 768px) 25vw, 50vw" className="scroll-zoom object-cover" />
        </span>
        <span className="flex items-end justify-between gap-3 p-4">
          <span className="font-display text-lg leading-tight">
            <T en={recipe.title} ja={recipe.ja.title} />
          </span>
          <span className="label-caps text-muted-foreground shrink-0">
            <Minutes m={recipe.totalMinutes} />
          </span>
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

/**
 * A look inside the collection — a bento of live numbers and dishes. It takes the place of Slush's app
 * video (initHomeVideoIntro): once the panel's top reaches the middle of the screen the whole wall rises
 * 40% and grows from 0.75 to full size (1.2s, slush-bounce). The cuisine strip is a scroll-direction marquee.
 */
export function WidgetWall({
  recipes,
  allMinutes,
  cuisines,
}: {
  recipes: RecipeCard[];
  allMinutes: number[];
  cuisines: CuisineSummary[];
}) {
  const [a, b, c] = recipes;
  const quickest = [...recipes].sort((x, y) => x.totalMinutes - y.totalMinutes)[0];
  const average = Math.round(allMinutes.reduce((s, m) => s + m, 0) / Math.max(allMinutes.length, 1));
  const sorted = [...allMinutes].sort((x, y) => x - y);
  const maxCount = Math.max(...cuisines.map((cu) => cu.recipeCount), 1);

  return (
    <section aria-labelledby="wall-title" className="room relative isolate z-10 overflow-hidden rounded-t-[28px] py-16 md:rounded-t-[40px] md:py-24">
      <SectionArt offset={1800} />
      <div
        data-reveal="intro"
        data-reveal-at="50"
        className="container-page grid auto-rows-[minmax(0,auto)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4"
      >
        <Widget className="col-span-2 md:col-span-7">
          <div className="flex h-full flex-col justify-between gap-6 overflow-hidden p-5">
            <span className="label-caps text-muted-foreground">
              <T en={`${cuisines.length} kitchens`} ja={`${cuisines.length}の国の台所`} />
            </span>
            <h2 id="wall-title" className="font-display max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.125rem)] leading-[1.1]">
              <T en="Ramen to croissants, pho to paella." ja="ラーメンからクロワッサン、フォーからパエリアまで。" />
            </h2>
            <ScrollMarquee speed={15} scrollSpeed={0} className="-mx-5">
              {cuisines.map((cu) => (
                <span key={cu.slug} className="mr-2 rounded-full border px-3 py-1 text-xs whitespace-nowrap">
                  <T en={cu.name} ja={cu.ja.name} />
                </span>
              ))}
            </ScrollMarquee>
          </div>
        </Widget>

        {/* Icon tile. */}
        <Widget className="hidden md:col-span-1 md:block">
          <div className="grid h-full min-h-24 place-items-center">
            <span aria-hidden className="hex-outline size-6" />
          </div>
        </Widget>

        {/* Average time with a sparkline. */}
        <Widget className="col-span-2 md:col-span-4">
          <div className="flex h-full flex-col justify-between gap-4 p-5">
            <span className="label-caps text-muted-foreground">
              <T en="Average time to table" ja="食卓までの平均時間" />
            </span>
            <div className="flex items-end justify-between gap-4">
              <span className="font-display text-4xl leading-none whitespace-nowrap">
                <Minutes m={average} />
              </span>
              <svg viewBox="0 0 160 48" className="h-12 w-32 shrink-0 sm:w-40" aria-hidden>
                <path d={linePath(sorted, 160, 44)} transform="translate(0 2)" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-muted-foreground text-xs">
              <T
                en={`Across all ${allMinutes.length} recipes, quickest to slowest`}
                ja={`全${allMinutes.length}レシピを、早い順から遅い順に`}
              />
            </span>
          </div>
        </Widget>

        {a && <DishWidget recipe={a} className="col-span-1 h-64 md:col-span-3 md:h-72" />}

        {/* Recipes per cuisine. */}
        <Widget className="col-span-1 md:col-span-3">
          <div className="flex h-full min-h-64 flex-col gap-4 p-5 md:min-h-72">
            <span className="label-caps text-muted-foreground">
              <T en="Recipes per cuisine" ja="国ごとのレシピ数" />
            </span>
            <div className="flex flex-1 items-end gap-1.5">
              {cuisines.map((cu) => (
                <span key={cu.slug} className="flex h-full flex-1 items-end" title={`${cu.name}: ${cu.recipeCount}`}>
                  <span
                    className="bg-foreground block w-full rounded-t-[2px]"
                    style={{ height: `${(cu.recipeCount / maxCount) * 100}%` } as CSSProperties}
                  />
                </span>
              ))}
            </div>
          </div>
        </Widget>

        {b && <DishWidget recipe={b} className="col-span-1 h-64 md:col-span-3 md:h-72" />}

        {/* Quickest tonight. */}
        {quickest && (
          <Widget className="col-span-1 md:col-span-3">
            <Link href={`/recipes/${quickest.slug}`} className="group flex h-full min-h-64 flex-col justify-between gap-6 p-5 md:min-h-72">
              <span className="label-caps text-muted-foreground">
                <T en="Quickest tonight" ja="今夜いちばん早い一品" />
              </span>
              <span>
                <span className="font-display link-group text-2xl leading-tight">
                  <T en={quickest.title} ja={quickest.ja.title} />
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border px-2.5 py-0.5 text-xs">
                    <T en={quickest.cuisineName} ja={quickest.ja.cuisineName} />
                  </span>
                  <span className="rounded-full border px-2.5 py-0.5 text-xs">
                    <Minutes m={quickest.totalMinutes} />
                  </span>
                  {quickest.vegetarian && (
                    <span className="rounded-full border px-2.5 py-0.5 text-xs">
                      <T en="Vegetarian" ja="ベジタリアン" />
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </Widget>
        )}

        {c && <DishWidget recipe={c} className="col-span-2 h-64 md:col-span-12 md:hidden" />}
      </div>
    </section>
  );
}
