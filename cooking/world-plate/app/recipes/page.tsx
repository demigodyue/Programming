import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { T } from "@/components/i18n";
import { SlantText } from "@/components/motion/slant-text";
import { RecipeBrowser } from "@/components/recipe/recipe-browser";
import { db } from "@/db/db";
import { listCuisines } from "@/db/queries/cuisines";
import { getRecipeBySlug, searchRecipes } from "@/db/queries/recipes";
import { fold } from "@/lib/recipe-filter";

export const metadata: Metadata = {
  title: "All recipes",
  description: "Search and filter famous dishes from around the world by cuisine, difficulty, cooking time and vegetarian.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  const [recipes, cuisines] = await Promise.all([searchRecipes(db, { cuisine: [], vegetarian: false }), listCuisines(db)]);
  // Static page: build a small search index (title, description, cuisine, tags, ingredients — in both languages) per recipe.
  const searchable = await Promise.all(
    recipes.map(async (r) => {
      const detail = await getRecipeBySlug(db, r.slug);
      const text = [
        r.title,
        r.description,
        r.cuisineName,
        ...(detail?.tags ?? []),
        ...(detail?.ingredients.map((i) => i.item) ?? []),
        r.ja.title,
        r.ja.description,
        r.ja.cuisineName,
        ...(detail?.ja.ingredients.map((i) => i.item) ?? []),
      ];
      return { ...r, searchText: fold(text.join(" ")) };
    }),
  );

  return (
    <div className="container-page pt-32 pb-24 md:pt-36">
      <header className="hero-content relative isolate mb-14 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="All recipes" ja="すべてのレシピ" className="block text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.92]" />
        <p className="load-stagger text-muted-foreground mt-6 max-w-md text-base" style={{ "--i": 0 } as CSSProperties}>
          <T
            en="Every dish on World Plate. Search by name or ingredient, or narrow it down by cuisine, effort and time."
            ja="World Plateのすべての料理。名前や材料で検索したり、国・難しさ・時間で絞り込んだりできます。"
          />
        </p>
      </header>
      <RecipeBrowser recipes={searchable} cuisines={cuisines.map((c) => ({ id: c.slug, label: c.name, ja: c.ja.name, emoji: c.emoji }))} />
    </div>
  );
}
