"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { Scramble } from "@/components/motion/scramble";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { useActiveIndex } from "@/components/motion/use-active-index";
import { recipeImageTransitionName } from "@/components/recipe/recipe-card";
import type { RecipeCard } from "@/db/queries/recipes";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * LaunchDarkly's "Control every change in production" section: a sticky title with a 01–05
 * stepper on the left, feature rows on the right. As each row crosses the middle of the
 * viewport its marker morphs from a hairline circle into a filled square (350ms morph curve).
 */
export function TrendingDishes({ recipes }: { recipes: RecipeCard[] }) {
  const rows = recipes.slice(0, 5);
  const { active, register } = useActiveIndex(rows.length);

  return (
    <section aria-labelledby="trending-title" className="container-page py-24 md:py-32">
      <div className="rule-draw label-caps text-muted-foreground mb-12 flex justify-between pt-4">
        <Scramble text="01" />
        <Scramble text="This week" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="trending-title" className="text-display max-w-[10ch]">
            <MaskReveal>Trending dishes</MaskReveal>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-sm text-[0.9375rem] leading-relaxed">
            What people are cooking from World Plate this week.
          </p>
          <ol className="mt-8 hidden gap-1.5 lg:flex" aria-label="Jump to a dish">
            {rows.map((r, i) => (
              <li key={r.slug}>
                <a
                  href={`#trend-${r.slug}`}
                  aria-label={`${pad(i + 1)}: ${r.title}`}
                  aria-current={active === i ? "true" : undefined}
                  className={cn(
                    "morph-shape grid size-12 place-items-center border text-sm tabular-nums",
                    active === i ? "bg-foreground text-background border-foreground rounded-[2px]" : "rounded-full",
                  )}
                >
                  {pad(i + 1)}
                </a>
              </li>
            ))}
          </ol>
          <Link href="/recipes" className="link-u mt-8 inline-flex items-center py-3 text-sm">
            All recipes
          </Link>
        </div>

        <ol>
          {rows.map((r, i) => (
            <li key={r.slug} id={`trend-${r.slug}`} ref={register(i)} className="rule-draw scroll-mt-28 pb-12">
              <Reveal>
                <RevealItem className="flex items-center gap-4 py-5">
                  <span
                    aria-hidden
                    className={cn(
                      "morph-shape grid size-10 shrink-0 place-items-center border",
                      active === i ? "bg-foreground text-background rounded-[2px]" : "rounded-full",
                    )}
                  >
                    <span className="hex-outline size-3" />
                  </span>
                  <h3 className="text-[clamp(1.625rem,3vw,2.125rem)] leading-tight">{r.title}</h3>
                </RevealItem>
                <RevealItem className="grid gap-6 border-t pt-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div className="flex flex-col items-start gap-5">
                    <p className="label-caps text-muted-foreground">{r.cuisineName}</p>
                    <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">{r.description}</p>
                    <Link
                      href={`/recipes/${r.slug}`}
                      className="btn-swap bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-[17px] py-[9px] text-sm"
                    >
                      Open the recipe
                      <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                    </Link>
                  </div>
                  <Link href={`/recipes/${r.slug}`} tabIndex={-1} aria-hidden data-cursor="view" className="group bg-muted relative block aspect-[4/3] overflow-hidden rounded-lg">
                    <ViewTransition name={recipeImageTransitionName(r.slug)} share="morph" default="none">
                      <span className="absolute inset-0">
                        <Image
                          src={r.image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 34vw, (min-width: 640px) 55vw, 90vw"
                          className="sd-parallax group-hover-fine:scale-[1.04] object-cover transition-[scale] duration-500 ease-(--ease-ld)"
                        />
                      </span>
                    </ViewTransition>
                  </Link>
                </RevealItem>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
