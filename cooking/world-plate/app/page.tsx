import Link from "next/link";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { ScrubWords } from "@/components/motion/scrub-words";
import { CuisineGrid } from "@/components/sections/cuisine-grid";
import { DishStage } from "@/components/sections/dish-stage";
import { DishMarquee } from "@/components/sections/dish-marquee";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
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
    <>
      <Hero
        recipeCount={all.length}
        cuisineCount={cuisines.length}
        recipes={trending}
        allMinutes={all.map((r) => r.totalMinutes)}
        cuisines={cuisines}
      />
      <DishMarquee items={all.map((r) => r.title)} />
      <DishStage href="/recipes/butter-chicken" />
      <Manifesto recipeCount={all.length} cuisineCount={cuisines.length} />
      <TrendingDishes recipes={trending} />
      <CuisineGrid cuisines={cuisines} />
      <QuickMeals recipes={quick} />
      <section aria-labelledby="cta-title" className="room scrub-iris py-24 md:py-36">
        <div className="container-page flex flex-col items-center text-center">
          {/* Drifts against the scroll like Slush's floating stickers (yPercent 0 → -30). */}
          <span aria-hidden data-parallax data-parallax-start="0" data-parallax-end="-30" className="hex-outline mb-8 size-6" />
          <ScrubWords id="cta-title" text="Pick a dish. Start cooking tonight." className="text-display block max-w-[14ch]" />
          <div className="mt-8 flex flex-col items-center gap-5">
            <p className="text-muted-foreground max-w-md text-[0.9375rem]">
              Real ingredients, honest timings and a step-by-step Cook Mode that keeps your screen awake.
            </p>
            <Link href="/recipes" data-accent="yellow" className={flipClass()}>
              <FlipFace>Browse recipes</FlipFace>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
