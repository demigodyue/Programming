import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/motion/count-up";
import { FlipFace, flipClass, TextLinkLine } from "@/components/motion/flip-face";
import { ScrubWords } from "@/components/motion/scrub-words";
import type { RecipeCard } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";

// The home page from the About section down. After About every section moves its own way with the scroll:
// Trending slides its headline sideways (trending-panel.tsx), Cuisines pins and pans sideways (cuisine-panel.tsx),
// Quick meals opens with a circle wipe and 3D tiles, and the call to action grows from a card to full bleed.

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
 * Quick meals, opened by a circle wipe: the section starts in the cuisine section's colour and its own colour
 * grows out from the top centre as it scrolls in. The heading fills word by word, and the four tiles stand up out of
 * the table one after another (3D, hinged at the bottom). All scrubbed by --p; reduced motion shows the end state.
 */
export function QuickPanel({ recipes }: { recipes: RecipeCard[] }) {
  return (
    <section
      aria-labelledby="quick-title"
      data-progress
      data-progress-start="top bottom"
      data-progress-end="top 10%"
      className="quick-wipe text-card-foreground relative isolate overflow-x-clip py-24 lg:py-36"
    >
      <span aria-hidden className="quick-wipe__circle" />
      <div className="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>03 · Weeknights</span>
            <span>Under 30 min</span>
          </div>
          <ScrubWords
            id="quick-title"
            text="Dinner on the table in thirty minutes"
            em={["thirty"]}
            className="text-display mt-6"
          />
          <p className="text-muted-foreground mt-5 max-w-sm text-[0.9375rem] leading-relaxed">
            Weeknight dinners under 30 minutes, start to finish — prep included.
          </p>
          <Link href="/recipes?time=under-30" className="text-link mt-4 py-3 text-sm">
            See all quick meals
            <TextLinkLine />
          </Link>
        </div>
        <ul data-progress data-progress-start="top 95%" data-progress-end="top 30%" className="quick-tiles grid grid-cols-2 gap-3 lg:gap-4">
          {recipes.slice(0, 4).map((r, i) => (
            <li key={r.slug} className="quick-tiles__item" style={{ "--k": i } as CSSProperties}>
              <Link href={`/recipes/${r.slug}`} data-cursor="View recipe" className="quick-tile group">
                <Image src={r.image} alt={r.imageAlt} fill sizes="(min-width: 1024px) 26vw, 46vw" className="object-cover" />
                <span className="bg-card text-card-foreground absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full px-3.5 py-1.5">
                  <span className="font-display truncate text-sm uppercase">{r.title}</span>
                  <span className="label-caps shrink-0 text-[0.6875rem]">{formatMinutes(r.totalMinutes)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The closing call to action, as a window that grows: it arrives as an inset rounded card and widens to full bleed
 * as it scrolls up, while its two lines slide in from opposite sides and meet. Scrubbed by --p.
 */
export function CtaPanel() {
  return (
    <div className="bg-card">
      <section
        aria-labelledby="cta-title"
        data-progress
        data-progress-start="top bottom"
        data-progress-end="top 15%"
        className="cta-window bg-headline text-background flex flex-col justify-center overflow-x-clip py-24 lg:py-36"
      >
        <div className="container-page flex flex-col items-start gap-8">
          <span className="label-caps">04 · Tonight</span>
          <h2 id="cta-title" className="text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] text-inherit">
            <span className="cta-window__line block">Pick a dish.</span>
            <span className="cta-window__line cta-window__line--right block">Start cooking tonight.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <p className="max-w-md text-[0.9375rem] leading-relaxed">
              Real ingredients, honest timings and a step-by-step Cook Mode that keeps your screen awake.
            </p>
            <Link href="/recipes" data-accent="yellow" className={flipClass()}>
              <FlipFace>Browse recipes</FlipFace>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
