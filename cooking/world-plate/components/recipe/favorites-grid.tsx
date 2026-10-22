"use client";

import { X } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { useT } from "@/lib/lang";
import { setFavorite, useFavorites } from "@/lib/local-store";

/**
 * Favorites saved in this browser, picked out of every recipe (the page is static).
 * In-place removal; remaining cards glide into the gap (layout animation).
 */
export function FavoritesGrid({ allRecipes }: { allRecipes: RecipeCardData[] }) {
  const favorites = useFavorites();
  const [message, setMessage] = useState("");
  const reduce = useReducedMotion();
  const t = useT();
  const bySlug = new Map(allRecipes.map((r) => [r.slug, r]));
  const recipes = (favorites ?? []).flatMap((slug) => bySlug.get(slug) ?? []);

  const remove = (r: RecipeCardData) => {
    setFavorite(r.slug, false);
    setMessage(t(`Removed ${r.title} from favorites.`, `${r.ja.title}をお気に入りから外しました。`));
  };

  if (favorites === null) return <div className="min-h-[40svh]" aria-busy="true" />;

  if (recipes.length === 0 && !message) {
    return (
      <div className="bg-card rounded-lg border px-6 py-20 text-center">
        <span aria-hidden className="hex-outline mx-auto block size-6" />
        <p className="font-display mt-6 text-[2.125rem] leading-tight">
          <T en="Nothing saved yet." ja="まだ何も保存されていません。" />
        </p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          <T en="Tap “Save recipe” on any dish and it will wait for you here." ja="料理の「レシピを保存」を押すと、ここに並びます。" />
        </p>
        <Link href="/recipes" data-accent="yellow" className={flipClass("solid", "mt-8")}>
          <FlipFace>
            <T en="Browse recipes" ja="レシピを見る" />
          </FlipFace>
        </Link>
      </div>
    );
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
      {recipes.length === 0 && (
        <p className="text-muted-foreground">
          <T en="All cleared. Your saved recipes will show up here." ja="すべて外しました。保存したレシピはここに表示されます。" />
        </p>
      )}
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
              <div className="card-rise h-full">
                <RecipeCard recipe={r} headingLevel={2} />
              </div>
              <button
                type="button"
                onClick={() => remove(r)}
                aria-label={t(`Remove ${r.title} from favorites`, `${r.ja.title}をお気に入りから外す`)}
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
