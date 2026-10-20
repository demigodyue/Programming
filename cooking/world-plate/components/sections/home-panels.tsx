import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/motion/count-up";
import { FlipFace, flipClass, TextLinkLine } from "@/components/motion/flip-face";
import { ScrubWords } from "@/components/motion/scrub-words";
import type { CuisineSummary } from "@/db/queries/cuisines";
import type { RecipeCard } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";

// The home page from the About section down: full-screen panels that StackPanels piles up as you scroll.
// Each one fills its card (h-full) and carries its own background so it covers the panel beneath.

/**
 * About: the pitch and three numbers on the left (they count up as the panel arrives); on the right, three tall
 * columns of dish photos run endlessly — the middle one the other way, each at its own speed — and pause while you
 * point at them. Every photo links to its recipe. Reduced motion: the columns stand still.
 */
export function AboutPanel({ recipes, cuisineCount }: { recipes: RecipeCard[]; cuisineCount: number }) {
  const averageHours = Math.round(recipes.reduce((s, r) => s + r.totalMinutes, 0) / Math.max(recipes.length, 1) / 6) / 10;
  const columns = [0, 1, 2].map((c) => recipes.filter((_, i) => i % 3 === c));
  return (
    <section aria-labelledby="about-title" className="room relative flex h-full flex-col justify-center overflow-hidden py-20 lg:py-0">
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
 * Ten tall photo strips side by side; the one you point at (or tab to) widens to show its name and recipe count,
 * the first one is open when nothing is. Small screens: a two-column grid of tiles.
 */
export function CuisinePanel({ cuisines }: { cuisines: CuisineSummary[] }) {
  return (
    <section id="cuisines" aria-labelledby="cuisines-title" className="room flex h-full scroll-mt-0 flex-col justify-center py-20 lg:py-10">
      <div className="container-page">
        <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
          <span>02 · The collection</span>
          <span>{cuisines.length} kitchens</span>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="cuisines-title" className="text-display">
            Explore by cuisine
          </h2>
          <p className="text-muted-foreground max-w-xs pb-2 text-[0.9375rem] leading-relaxed">
            Ten kitchens, from Kathmandu street stalls to Parisian bakeries.
          </p>
        </div>
        <ul className="cuisine-strips mt-8">
          {cuisines.map((c, i) => (
            <li key={c.slug} style={{ "--i": i } as CSSProperties}>
              <Link href={`/cuisine/${c.slug}`} data-cursor="Explore" className="cuisine-strip group">
                <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 40vw, 50vw" className="object-cover" />
                <span className="cuisine-strip__label font-display">{c.name}</span>
                <span className="cuisine-strip__meta">
                  <span className="font-display block text-[clamp(1.125rem,2.6vw,2.75rem)] leading-none uppercase">{c.name}</span>
                  <span className="label-caps mt-2 block">
                    {c.country} · {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function QuickPanel({ recipes }: { recipes: RecipeCard[] }) {
  return (
    <section aria-labelledby="quick-title" className="bg-card text-card-foreground flex h-full flex-col justify-center py-20 lg:py-10">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <div className="label-caps text-muted-foreground flex justify-between border-b pb-3">
            <span>03 · Weeknights</span>
            <span>Under 30 min</span>
          </div>
          <h2 id="quick-title" className="text-display mt-6">
            Quick meals
          </h2>
          <p className="text-muted-foreground mt-5 max-w-sm text-[0.9375rem] leading-relaxed">
            Weeknight dinners under 30 minutes, start to finish — prep included.
          </p>
          <Link href="/recipes?time=under-30" className="text-link mt-4 py-3 text-sm">
            See all quick meals
            <TextLinkLine />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:gap-4">
          {recipes.slice(0, 4).map((r) => (
            <li key={r.slug}>
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

export function CtaPanel() {
  return (
    <section aria-labelledby="cta-title" className="bg-headline text-background flex h-full flex-col justify-center py-24 lg:py-12">
      <div className="container-page flex flex-col items-start gap-8">
        <span className="label-caps">04 · Tonight</span>
        <h2 id="cta-title" className="text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] text-inherit">
          Pick a dish.
          <br />
          Start cooking tonight.
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
  );
}
