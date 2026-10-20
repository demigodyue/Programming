import { StackPanels } from "@/components/motion/stack-panels";
import { DishStage } from "@/components/sections/dish-stage";
import { DishMarquee } from "@/components/sections/dish-marquee";
import { Hero } from "@/components/sections/hero";
import { AboutPanel, CtaPanel, CuisinePanel, QuickPanel } from "@/components/sections/home-panels";
import { TrendingPanel } from "@/components/sections/trending-panel";
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
      {/* From the About section down: full-screen panels that slide up over one another. */}
      <StackPanels>
        <AboutPanel recipeCount={all.length} cuisineCount={cuisines.length} />
        <TrendingPanel recipes={trending} />
        <CuisinePanel cuisines={cuisines} />
        <QuickPanel recipes={quick} />
        <CtaPanel />
      </StackPanels>
    </>
  );
}
