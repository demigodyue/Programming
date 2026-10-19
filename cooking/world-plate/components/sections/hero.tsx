import Link from "next/link";
import type { CSSProperties } from "react";
import { FlipFace, flipClass, TextLinkLine } from "@/components/motion/flip-face";
import { LetterRoll } from "@/components/motion/letter-roll";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { WidgetWall } from "./widget-wall";

/**
 * Gallery-wall hero with Slush's home load (runPageLoad + runHomeLoad), all pure CSS:
 * the content appears at 0.1s; the oversized wordmark rolls up letter by letter (as Slush's logo);
 * the counts and buttons rise 3em, 0.1s apart, from 0.6s; the hexagon pops in like their stickers;
 * the two-line headline (their "Your money. Unstuck.") rises 2em at 1.5s, lines 0.3s apart.
 * Scrolling away, the wordmark drifts down 20% (Slush's hero-background parallax).
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
      <section aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="hero-content flex flex-1 flex-col">
          <div className="container-page label-caps text-muted-foreground flex justify-between pt-28">
            <span className="load-fade">A kitchen atlas</span>
            <span className="load-fade">Recipes and their stories</span>
          </div>

          <div className="container-page flex flex-1 flex-col items-center justify-center py-14 text-center">
            <h1 id="hero-title" className="max-w-[16ch] text-[clamp(2.4rem,6vw,3.25rem)] leading-none">
              <span className="home-sub" style={{ "--i": 0 } as CSSProperties}>
                Cook the dishes
              </span>{" "}
              <span className="home-sub" style={{ "--i": 1 } as CSSProperties}>
                <em className="font-normal">the</em> world is proud of.
              </span>
            </h1>
            <dl className="load-stagger mt-7 flex items-center gap-7 text-base font-medium uppercase" style={{ "--i": 0 } as CSSProperties}>
              <div className="flex gap-1.5">
                <dt>Recipes:</dt>
                <dd>{recipeCount}</dd>
              </div>
              <span aria-hidden className="load-pop hex-outline" />
              <div className="flex gap-1.5">
                <dt>Cuisines:</dt>
                <dd>{cuisineCount}</dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
              <Link href="/recipes" data-accent="yellow" className={flipClass("solid", "load-stagger")} style={{ "--i": 1 } as CSSProperties}>
                <FlipFace>Browse recipes</FlipFace>
              </Link>
              <Link href="#cuisines" className="load-stagger text-link py-3 text-sm" style={{ "--i": 2 } as CSSProperties}>
                Pick a cuisine
                <TextLinkLine />
              </Link>
            </div>
          </div>

          {/* The wordmark is the brand: larger than the screen, cropped at the edges and the floor. */}
          <p
            aria-hidden
            data-parallax
            data-parallax-trigger="section"
            data-parallax-start="0"
            data-parallax-end="20"
            data-parallax-scroll-start="top top"
            data-parallax-scroll-end="bottom top-=20%"
            className="font-display -mb-[0.16em] text-center text-[19.5vw] leading-[0.84] font-medium tracking-[-0.03em] whitespace-nowrap select-none"
          >
            <LetterRoll text="World Plate" />
          </p>
        </div>
      </section>

      <WidgetWall recipes={recipes} allMinutes={allMinutes} cuisines={cuisines} />
    </>
  );
}
