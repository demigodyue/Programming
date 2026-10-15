"use client";

import { X } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { setFavorite, useFavorites } from "@/lib/local-store";

/**
 * Favorites saved in this browser, picked out of every recipe (the page is static).
 * In-place removal; remaining cards glide into the gap (layout animation).
 */
export function FavoritesGrid({ allRecipes }: { allRecipes: RecipeCardData[] }) {
  const favorites = useFavorites();
  const [message, setMessage] = useState("");
  const reduce = useReducedMotion();
  const bySlug = new Map(allRecipes.map((r) => [r.slug, r]));
  const recipes = (favorites ?? []).flatMap((slug) => bySlug.get(slug) ?? []);

  const remove = (r: RecipeCardData) => {
    setFavorite(r.slug, false);
    setMessage(`Removed ${r.title} from favorites.`);
  };

  if (favorites === null) return <div className="min-h-[40svh]" aria-busy="true" />;

  if (recipes.length === 0 && !message) {
    return (
      <div className="bg-card rounded-lg border px-6 py-20 text-center">
        <span aria-hidden className="hex-outline mx-auto block size-6" />
        <p className="font-display mt-6 text-[2.125rem] leading-tight">Nothing saved yet.</p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">Tap “Save recipe” on any dish and it will wait for you here.</p>
        <Link
          href="/recipes"
          className="btn-swap bg-primary text-primary-foreground mt-8 inline-flex min-h-11 items-center rounded-full px-[17px] py-[9px] text-sm"
        >
          Browse recipes
        </Link>
      </div>
    );
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
      {recipes.length === 0 && <p className="text-muted-foreground">All cleared. Your saved recipes will show up here.</p>}
      <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {recipes.map((r) => (
            <m.li
              key={r.slug}
              layout={!reduce}
              exit={{ opacity: 0, transform: reduce ? "none" : "scale(0.94)" }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], layout: { type: "spring", duration: 0.45, bounce: 0.1 } }}
              className="relative"
            >
              <RecipeCard recipe={r} headingLevel={2} />
              <button
                type="button"
                onClick={() => remove(r)}
                aria-label={`Remove ${r.title} from favorites`}
                className="bg-background hover-fine:bg-foreground hover-fine:text-background absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full border transition-colors duration-200"
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}
