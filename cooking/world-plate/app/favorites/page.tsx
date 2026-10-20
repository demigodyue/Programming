import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { FavoritesNote } from "@/components/account/favorites-note";
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
      <header className="hero-content relative isolate mb-14 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="Your favorites" ja="お気に入り" className="block text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.92]" />
        <div className="load-stagger mt-6 max-w-md" style={{ "--i": 0 } as CSSProperties}>
          <FavoritesNote />
        </div>
      </header>
      <FavoritesGrid allRecipes={all} />
    </div>
  );
}
