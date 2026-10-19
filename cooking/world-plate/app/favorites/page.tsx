import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SlantText } from "@/components/motion/slant-text";
import { FavoritesGrid } from "@/components/recipe/favorites-grid";
import { db } from "@/db/db";
import { searchRecipes } from "@/db/queries/recipes";

export const metadata: Metadata = {
  title: "Your favorites",
  description: "Recipes you've saved on World Plate.",
  robots: { index: false },
};

export default async function FavoritesPage() {
  const all = await searchRecipes(db, { cuisine: [], vegetarian: false });

  return (
    <div className="container-page pt-32 pb-24 md:pt-36">
      <header className="hero-content mb-14 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="Your favorites" className="block text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.84]" />
        <p className="load-stagger text-muted-foreground mt-6 max-w-md text-base" style={{ "--i": 0 } as CSSProperties}>
          Saved on this browser. No account needed.
        </p>
      </header>
      <FavoritesGrid allRecipes={all} />
    </div>
  );
}
