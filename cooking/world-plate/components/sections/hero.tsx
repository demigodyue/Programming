import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FlipFace, flipClass, TextLinkLine } from "@/components/motion/flip-face";
import { LetterRoll } from "@/components/motion/letter-roll";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { WidgetWall } from "./widget-wall";

// Floating hero photos: placement, resting tilt, mouse depth, scroll drift, float timing. Plain rectangular slabs (Foudre).
const PHOTOS = [
  { place: "top-[17%] left-[3%] size-48 xl:size-56", tilt: "-6deg", depth: -0.6, drift: -45, dur: "6.5s", delay: "-1s", label: "left-3 bottom-2" },
  { place: "top-[15%] right-[3%] size-48 xl:size-56", tilt: "8deg", depth: 0.7, drift: -35, dur: "7.2s", delay: "-3s", label: "right-3 bottom-2" },
  { place: "top-[47%] left-[8%] size-40 xl:size-48", tilt: "5deg", depth: -0.45, drift: -15, dur: "5.8s", delay: "-2s", label: "left-3 top-1" },
  { place: "top-[45%] right-[8%] size-40 xl:size-48", tilt: "-7deg", depth: 0.55, drift: -22, dur: "6.8s", delay: "-4s", label: "right-3 top-1" },
] as const;

/**
 * Gallery-wall hero with Slush's home load (runPageLoad + runHomeLoad), all pure CSS:
 * the content appears at 0.1s; the oversized wordmark rolls up letter by letter (as Slush's logo);
 * the counts and buttons rise 3em, 0.1s apart, from 0.6s; the hexagon pops in like their stickers;
 * the two-line headline (their "Your money. Unstuck.") rises 2em at 1.5s, lines 0.3s apart.
 * Scrolling away, the wordmark drifts down 20% (Slush's hero-background parallax).
 * Cult Eats layer on top: dish photos (rectangular slabs) float around the headline all the time, follow the mouse at
 * different depths (MouseDepth) and rise as you scroll. Scrolling away is scrubbed too: the headline block sinks
 * back and fades, and the wordmark's letters fan apart (.hero-exit / .hero-fan, a view timeline).
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
      <section aria-labelledby="hero-title" className="hero-scroll relative isolate flex min-h-[100svh] flex-col overflow-hidden">
        {/* Layers: scroll drift + mouse depth › sticker pop › always-on float. Large screens only. */}
        {recipes.slice(0, PHOTOS.length).map((r, i) => {
          const p = PHOTOS[i];
          return (
            <div
              key={r.slug}
              data-depth={p.depth}
              data-parallax
              data-parallax-trigger="section"
              data-parallax-start="0"
              data-parallax-end={p.drift}
              data-parallax-scroll-start="top top"
              data-parallax-scroll-end="bottom top"
              className={`absolute z-30 hidden lg:block ${p.place}`}
            >
              <div className="load-pop size-full" style={{ "--r": i } as CSSProperties}>
                <Link
                  href={`/recipes/${r.slug}`}
                  data-cursor="View recipe"
                  className="animate-float group relative block size-full"
                  style={{ rotate: p.tilt, "--float-dur": p.dur, "--float-delay": p.delay, "--float-y": "12px", "--float-r": "3deg" } as CSSProperties}
                >
                  <span className="relative block size-full">
                    <Image
                      src={r.image}
                      alt={r.imageAlt}
                      fill
                      sizes="224px"
                      className="group-hover-fine:scale-105 object-cover saturate-150 transition-[scale] duration-300"
                    />
                  </span>
                  <span className={`label-caps absolute ${p.label} bg-card text-card-foreground rounded-full px-3.5 py-1 text-xs whitespace-nowrap`}>
                    {r.cuisineName} ▸
                  </span>
                </Link>
              </div>
            </div>
          );
        })}

        <div className="hero-content relative z-20 flex flex-1 flex-col">
          <div className="container-page label-caps text-muted-foreground flex justify-between pt-28">
            <span className="load-fade">A kitchen atlas</span>
            <span className="load-fade">Recipes and their stories</span>
          </div>

          <div className="hero-exit container-page flex flex-1 flex-col items-center justify-center py-14 text-center">
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
            className="hero-fan font-display text-headline -mb-[0.1em] text-center text-[19vw] leading-[0.9] tracking-[0.01em] whitespace-nowrap select-none"
          >
            <LetterRoll text="World Plate" />
          </p>
        </div>
      </section>

      <WidgetWall recipes={recipes} allMinutes={allMinutes} cuisines={cuisines} />
    </>
  );
}
