import Link from "next/link";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/motion/count-up";
import { Scramble } from "@/components/motion/scramble";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { WidgetWall } from "./widget-wall";

const WORDMARK = "World Plate";

/**
 * Gallery-wall hero with LaunchDarkly's motion: labels slide in from their corners, the headline
 * rises line by line, the counts tick up and the wordmark rises letter by letter. Then, as on
 * svz.io, the hero stays pinned while the widget panel slides up over it (rounded top corners)
 * and the hero blurs, dims and shrinks behind it.
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
    // The wrapper bounds the sticky hero, so it only stays pinned until the widget panel has covered it.
    <div className="relative">
      <section aria-labelledby="hero-title" className="sd-hero-stack sticky top-0 z-0 flex min-h-[100svh] flex-col overflow-hidden">
        <div className="container-page label-caps text-muted-foreground flex justify-between overflow-hidden pt-24">
          <span className="slide-in" style={{ "--from-x": "-40px" } as CSSProperties}>
            <Scramble text="A kitchen atlas" duration={900} />
          </span>
          <span className="slide-in" style={{ "--from-x": "40px" } as CSSProperties}>
            <Scramble text="Recipes and their stories" duration={900} />
          </span>
        </div>

        <div className="container-page flex flex-1 flex-col items-center justify-center py-14 text-center">
          <h1 id="hero-title" className="max-w-[16ch] text-[clamp(2.4rem,6vw,3.25rem)] leading-none">
            {/* Two lines rise one after the other. */}
            <span className="rise block" style={{ "--i": 0 } as CSSProperties}>
              Cook the dishes
            </span>
            <span className="rise block" style={{ "--i": 2 } as CSSProperties}>
              <em className="font-normal">the</em> world is proud of.
            </span>
          </h1>
          <dl className="rise mt-7 flex items-center gap-7 text-base font-medium uppercase" style={{ "--delay": "260ms" } as CSSProperties}>
            <div className="flex gap-1.5">
              <dt>Recipes:</dt>
              <dd>
                <CountUp value={recipeCount} />
              </dd>
            </div>
            <span aria-hidden className="hex-outline" />
            <div className="flex gap-1.5">
              <dt>Cuisines:</dt>
              <dd>
                <CountUp value={cuisineCount} />
              </dd>
            </div>
          </dl>
          <div className="rise mt-7 flex flex-wrap items-center justify-center gap-5" style={{ "--delay": "360ms" } as CSSProperties}>
            <Link
              href="/recipes"
              className="btn-swap bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-[17px] py-[9px] text-sm"
            >
              Browse recipes
            </Link>
            <Link href="#cuisines" className="link-u inline-flex items-center py-3 text-sm">
              Pick a cuisine
            </Link>
          </div>
        </div>

        {/* The wordmark is the brand: larger than the screen, cropped at the edges and the floor. */}
        <p
          aria-hidden
          className="font-display -mb-[0.16em] origin-bottom text-center text-[19.5vw] leading-[0.84] font-medium tracking-[-0.03em] whitespace-nowrap select-none"
        >
          {Array.from(WORDMARK).map((ch, i) => (
            <span key={i} className="letter" style={{ "--i": i, "--delay": "350ms" } as CSSProperties}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
      </section>

      <WidgetWall recipes={recipes} allMinutes={allMinutes} cuisines={cuisines} />
    </div>
  );
}
