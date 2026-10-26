"use client";

import { Check, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { T } from "@/components/i18n";
import type { Ingredient, IngredientJa } from "@/db/queries/recipes";
import { fly } from "@/lib/fly";
import { formatQuantity, formatQuantityJa } from "@/lib/scale";
import { addToShoppingList, useShoppingList } from "@/lib/shopping-list";

/**
 * "Add to shopping list": stores this recipe's ingredients at the servings currently shown (replacing an earlier
 * copy), and sends a basket flying to the header's Shopping list pill. Once added it turns into a link to the list.
 */
export function ShoppingButton({
  slug,
  title,
  titleJa,
  baseServings,
  servings,
  ingredients,
  ingredientsJa,
}: {
  slug: string;
  title: string;
  titleJa: string;
  baseServings: number;
  servings: number;
  ingredients: Ingredient[];
  ingredientsJa: IngredientJa[];
}) {
  const list = useShoppingList();
  const button = useRef<HTMLButtonElement>(null);
  const saved = list?.find((r) => r.slug === slug);
  const current = saved?.servings === servings;

  const add = () => {
    addToShoppingList({
      slug,
      title: { en: title, ja: titleJa },
      servings,
      items: ingredients.map((ing, i) => {
        const ja = ingredientsJa[i];
        return {
          en: ing.note ? `${ing.item}, ${ing.note}` : ing.item,
          ja: ja ? (ja.note ? `${ja.item}（${ja.note}）` : ja.item) : ing.item,
          qtyEn: formatQuantity(ing.amount, ing.unit, baseServings, servings),
          qtyJa: formatQuantityJa(ing.amount, ing.unit, baseServings, servings, ja?.counter),
        };
      }),
    });
    const target = document.querySelector('.nav-bar a[href*="/shopping-list"]');
    if (button.current && target) {
      const basket = document.createElement("span");
      basket.className = "fly-heart";
      basket.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 11-1 9M19 11l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9"/></svg>';
      fly({ node: basket, from: button.current.getBoundingClientRect(), to: target, spin: 16, duration: 750 });
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        ref={button}
        type="button"
        onClick={add}
        disabled={list === null || current}
        className="hover-fine:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-70"
      >
        {current ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <ShoppingBasket className="size-4" strokeWidth={1.75} aria-hidden />}
        {current ? (
          <T en={`On your list (${servings} servings)`} ja={`買い物リストに追加済み（${servings}人分）`} />
        ) : saved ? (
          <T en={`Update list to ${servings} servings`} ja={`${servings}人分にリストを更新`} />
        ) : (
          <T en="Add to shopping list" ja="買い物リストに追加" />
        )}
      </button>
      {saved && (
        <Link href="/shopping-list" className="link text-sm font-medium">
          <T en="View shopping list" ja="買い物リストを見る" />
        </Link>
      )}
    </div>
  );
}
