import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { WordReveal } from "@/components/motion/word-reveal";
import { RecipeBrowser } from "@/components/recipe/recipe-browser";
import { db } from "@/db/db";
import { listCuisines } from "@/db/queries/cuisines";
import { getRecipeBySlug, searchRecipes } from "@/db/queries/recipes";

export const metadata: Metadata = {
  title: "All recipes",
  description: "Search and filter famous dishes from ten cuisines by cuisine, difficulty, cooking time and vegetarian.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  const [recipes, cuisines] = await Promise.all([searchRecipes(db, { cuisine: [], vegetarian: false }), listCuisines(db)]);
  // Static page: build a small search index (title, description, cuisine, tags, ingredients) per recipe.
  const searchable = await Promise.all(
    recipes.map(async (r) => {
      const detail = await getRecipeBySlug(db, r.slug);
      const text = [r.title, r.description, r.cuisineName, ...(detail?.tags ?? []), ...(detail?.ingredients.map((i) => i.item) ?? [])];
      return { ...r, searchText: text.join(" ").toLowerCase() };
    }),
  );

  return (
    <PageTransition>
      <div className="container-page pt-32 pb-24 md:pt-36">
        <header className="mb-14 flex flex-col items-center border-b pb-12 text-center">
          <WordReveal text="All recipes" className="text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.84]" />
          <p className="rise text-muted-foreground mt-6 max-w-md text-base" style={{ "--delay": "350ms" } as CSSProperties}>
            Every dish on World Plate. Search by name or ingredient, or narrow it down by cuisine, effort and time.
          </p>
        </header>
        <RecipeBrowser recipes={searchable} cuisines={cuisines.map((c) => ({ id: c.slug, label: c.name, emoji: c.emoji }))} />
      </div>
    </PageTransition>
  );
}
