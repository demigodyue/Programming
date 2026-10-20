import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/motion/count-up";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { ScrubWords } from "@/components/motion/scrub-words";
import { StoveScene } from "@/components/sections/stove-scene";
import type { RecipeCard } from "@/db/queries/recipes";

// The home page from the About section down. After About every section moves its own way with the scroll:
// Trending slides its headline sideways (trending-panel.tsx), Cuisines deals a card stack out into a grid
// (cuisine-panel.tsx), Quick meals zooms a full-screen photo down into a grid (quick-panel.tsx), and the call to
// action turns on an illustrated stove (stove-scene.tsx).

/**
 * About: the pitch and three numbers on the left (they count up as the panel arrives); on the right, three tall
 * columns of dish photos run endlessly — the middle one the other way, each at its own speed — and pause while you
 * point at them. Every photo links to its recipe. Reduced motion: the columns stand still.
 */
export function AboutPanel({ recipes, cuisineCount }: { recipes: RecipeCard[]; cuisineCount: number }) {
  const averageHours = Math.round(recipes.reduce((s, r) => s + r.totalMinutes, 0) / Math.max(recipes.length, 1) / 6) / 10;
  const columns = [0, 1, 2].map((c) => recipes.filter((_, i) => i % 3 === c));
  return (
    <section aria-labelledby="about-title" className="room relative flex flex-col justify-center overflow-hidden py-20 lg:h-svh lg:py-0">
      <div className="container-page grid h-full items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="relative z-10 lg:py-16">
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>[ About ]</span>
            <span>World Plate</span>
          </div>
          <h2 id="about-title" className="text-display mt-6">
            A kitchen <em>atlas</em>
          </h2>
          <ScrubWords
            as="p"
            text="Famous dishes from Japan to Nepal to Rome — ramen, momo, carbonara — each written up properly, with real ingredients, honest timings and the story behind the plate."
            em={["ramen", "momo", "carbonara", "story"]}
            className="font-display mt-6 max-w-[34ch] text-[clamp(1.25rem,1.9vw,1.75rem)] leading-[1.15]"
          />
          <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t pt-5">
            {[
              { n: recipes.length, label: "Famous dishes" },
              { n: cuisineCount, label: "Cuisines" },
              { n: averageHours, label: "Avg. hours", decimals: 1 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="label-caps text-muted-foreground order-last mt-1 text-[0.6875rem]">{s.label}</dt>
                <dd className="font-display text-headline text-[clamp(2.75rem,5vw,4.5rem)] leading-none">
                  <CountUp value={s.n} decimals={"decimals" in s ? s.decimals : 0} />
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/recipes" data-accent="yellow" className={flipClass("solid", "mt-8")}>
            <FlipFace>Browse all recipes</FlipFace>
          </Link>
        </div>

        <div aria-label="Dishes on World Plate" className="about-cols h-[60svh] lg:h-full">
          {columns.map((col, c) => (
            <div key={c} className="about-col" style={{ "--speed": `${[46, 38, 54][c]}s` } as CSSProperties}>
              <ul className={`about-col__track ${c === 1 ? "about-col__track--down" : ""}`}>
                {[...col, ...col].map((r, i) => (
                  <li key={`${r.slug}-${i}`} aria-hidden={i >= col.length || undefined}>
                    <Link
                      href={`/recipes/${r.slug}`}
                      tabIndex={i >= col.length ? -1 : undefined}
                      data-cursor="View recipe"
                      className="about-shot group"
                    >
                      <Image src={r.image} alt={i >= col.length ? "" : r.imageAlt} fill sizes="(min-width: 1024px) 15vw, 30vw" className="object-cover" />
                      <span className="bg-card text-card-foreground absolute inset-x-2 bottom-2 rounded-full px-3 py-1">
                        <span className="font-display block truncate text-xs uppercase">{r.title}</span>
                        <span className="label-caps block truncate text-[0.625rem]">{r.cuisineName}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The closing call to action: the panel pins, and scrolling turns on the stove — the knob turns, the flame grows
 * under the pan and the cooking starts (StoveScene) — while "Cook tonight" rises line by line out of a mask and the
 * line and button follow. Scrubbed by --p. Reduced motion / no JS: the finished panel with the stove lit.
 */
export function CtaPanel() {
  return (
    <section
      aria-labelledby="cta-title"
      data-progress
      data-progress-start="top top"
      data-progress-end="bottom bottom"
      className="cta-stove bg-headline text-background"
    >
      <div className="cta-stove__stage container-page">
        <div className="label-caps flex justify-between border-b border-current pb-3">
          <span>04 · Tonight</span>
          <span>Pick a dish</span>
        </div>
        <div className="cta-stove__body">
          <div>
            <h2 id="cta-title" className="cta-stove__title font-display">
              <span className="cta-stove__line" style={{ "--l": 0 } as CSSProperties}>
                <span>Cook</span>
              </span>
              <span className="cta-stove__line" style={{ "--l": 1 } as CSSProperties}>
                <span>tonight</span>
              </span>
            </h2>
            <div className="cta-stove__foot mt-6 flex flex-col items-start gap-5">
              <p className="max-w-sm text-[0.9375rem] leading-relaxed">
                Real ingredients, honest timings and a step-by-step Cook Mode that keeps your screen awake.
              </p>
              <Link href="/recipes" data-accent="yellow" className={flipClass()}>
                <FlipFace>Browse recipes</FlipFace>
              </Link>
            </div>
          </div>
          <StoveScene />
        </div>
      </div>
    </section>
  );
}
