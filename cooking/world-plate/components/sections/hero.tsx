import Link from "next/link";
import type { CSSProperties } from "react";
import { WordReveal } from "@/components/motion/word-reveal";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { WidgetWall } from "./widget-wall";

const HEADLINE = "Cook the dishes the world is proud of.";

/**
 * Gallery-wall hero with LaunchDarkly's motion: the copy simply fades up as a block, then a
 * wall of floating recipe widgets rises in underneath and keeps drifting.
 */
export function Hero({
  recipeCount,
  cuisineCount,
  recipes,
  allMinutes,
  cuisines,
}: {
  recipeCount: number;
  cuisineCount: number;
  recipes: RecipeCard[];
  allMinutes: number[];
  cuisines: CuisineSummary[];
}) {
  return (
    <>
      <section aria-labelledby="hero-title" className="relative flex min-h-[92svh] flex-col overflow-hidden">
        <div className="container-page label-caps text-muted-foreground flex justify-between pt-24">
          <span className="rise">A kitchen atlas</span>
          <span className="rise">Recipes and their stories</span>
        </div>

        <div className="container-page flex flex-1 flex-col items-center justify-center py-14 text-center">
          <WordReveal
            id="hero-title"
            text={HEADLINE}
            italic={["the"]}
            className="max-w-[16ch] text-[clamp(2.4rem,6vw,3.25rem)] leading-none"
          />
          <dl className="rise mt-7 flex items-center gap-7 text-base font-medium uppercase" style={{ "--delay": "120ms" } as CSSProperties}>
            <div className="flex gap-1.5">
              <dt>Recipes:</dt>
              <dd>{recipeCount}</dd>
            </div>
            <span aria-hidden className="hex-outline" />
            <div className="flex gap-1.5">
              <dt>Cuisines:</dt>
              <dd>{cuisineCount}</dd>
            </div>
          </dl>
          <div className="rise mt-7 flex flex-wrap items-center justify-center gap-5" style={{ "--delay": "200ms" } as CSSProperties}>
            <Link
              href="/recipes"
              className="btn-swap bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-[17px] py-[9px] text-sm"
            >
              Browse recipes
            </Link>
            <Link href="#cuisines" className="hover-fine:underline inline-flex min-h-11 items-center text-sm underline-offset-4">
              Pick a cuisine
            </Link>
          </div>
        </div>

        {/* The wordmark is the brand: larger than the screen, cropped at the edges and the floor. */}
        <p
          aria-hidden
          className="rise font-display -mb-[0.16em] text-center text-[19.5vw] leading-[0.84] font-medium tracking-[-0.03em] whitespace-nowrap select-none"
          style={{ "--delay": "280ms" } as CSSProperties}
        >
          World Plate
        </p>
      </section>

      <WidgetWall recipes={recipes} allMinutes={allMinutes} cuisines={cuisines} />
    </>
  );
}
