import Link from "next/link";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { CuisineGrid } from "@/components/sections/cuisine-grid";
import { DishMarquee } from "@/components/sections/dish-marquee";
import { Hero } from "@/components/sections/hero";
import { QuickMeals } from "@/components/sections/quick-meals";
import { TrendingDishes } from "@/components/sections/trending-dishes";
import { db } from "@/db/db";
import { listCuisines } from "@/db/queries/cuisines";
import { listQuickRecipes, listTrendingRecipes, searchRecipes } from "@/db/queries/recipes";

export default async function HomePage() {
  const [trending, cuisines, quick, all] = await Promise.all([
    listTrendingRecipes(db, 8),
    listCuisines(db),
    listQuickRecipes(db, 30, 4),
    searchRecipes(db, { cuisine: [], vegetarian: false }),
  ]);

  return (
    <PageTransition>
      <Hero
        recipeCount={all.length}
        cuisineCount={cuisines.length}
        recipes={trending}
        allMinutes={all.map((r) => r.totalMinutes)}
        cuisines={cuisines}
      />
      <DishMarquee items={all.map((r) => r.title)} />
      <TrendingDishes recipes={trending} />
      <CuisineGrid cuisines={cuisines} />
      <QuickMeals recipes={quick} morphExclude={new Set(trending.map((r) => r.slug))} />
      <section aria-labelledby="cta-title" className="room py-24 md:py-36">
        <div className="container-page flex flex-col items-center text-center">
          <span aria-hidden className="hex-outline mb-8" />
          <h2 id="cta-title" className="text-display max-w-[14ch]">
            <MaskReveal>Pick a dish. Start cooking tonight.</MaskReveal>
          </h2>
          <Reveal className="mt-8 flex flex-col items-center gap-5">
            <RevealItem as="p" className="text-muted-foreground max-w-md text-[0.9375rem]">
              Real ingredients, honest timings and a step-by-step Cook Mode that keeps your screen awake.
            </RevealItem>
            <RevealItem>
              <Link
                href="/recipes"
                className="btn-swap bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-[17px] py-[9px] text-sm"
              >
                Browse recipes
              </Link>
            </RevealItem>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
