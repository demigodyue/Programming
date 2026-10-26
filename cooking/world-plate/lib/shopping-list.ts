"use client";

import { useSyncExternalStore } from "react";

/**
 * The shopping list, kept in this browser's localStorage. "Add to shopping list" on a recipe stores a snapshot of its
 * ingredients at the chosen servings, in both languages, so the list page needs no recipe data of its own and
 * switches language like everything else. Ticked lines are remembered per recipe. Everything read back is checked
 * (storage can be edited by anyone with the browser), and lists are capped.
 */
export type ShoppingItem = { en: string; ja: string; qtyEn: string; qtyJa: string };
export type ShoppingRecipe = {
  slug: string;
  title: { en: string; ja: string };
  servings: number;
  items: ShoppingItem[];
  /** Indexes into `items` that have been ticked off. */
  checked: number[];
};

const KEY = "wp:shopping";
const EVENT = "wp:shopping";
const MAX_RECIPES = 30;
const MAX_ITEMS = 60;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

export function cleanShopping(value: unknown): ShoppingRecipe[] {
  if (!Array.isArray(value)) return [];
  const out: ShoppingRecipe[] = [];
  for (const raw of value.slice(0, MAX_RECIPES)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const slug = str(r.slug, 80);
    if (!SLUG.test(slug) || out.some((o) => o.slug === slug)) continue;
    const title = (r.title ?? {}) as Record<string, unknown>;
    const items = (Array.isArray(r.items) ? r.items : []).slice(0, MAX_ITEMS).map((i) => {
      const it = (i ?? {}) as Record<string, unknown>;
      return { en: str(it.en), ja: str(it.ja), qtyEn: str(it.qtyEn, 40), qtyJa: str(it.qtyJa, 40) };
    });
    const checked = (Array.isArray(r.checked) ? r.checked : []).filter(
      (n): n is number => Number.isInteger(n) && n >= 0 && n < items.length,
    );
    const servings = Number.isInteger(r.servings) && (r.servings as number) > 0 ? Math.min(r.servings as number, 99) : 1;
    out.push({ slug, title: { en: str(title.en), ja: str(title.ja) }, servings, items, checked: [...new Set(checked)] });
  }
  return out;
}

function read(): ShoppingRecipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    return cleanShopping(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

let cache: ShoppingRecipe[] | null = null;
function write(list: ShoppingRecipe[]) {
  const clean = cleanShopping(list);
  try {
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {}
  cache = clean;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent) cache = null;
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** The list (newest recipe first). `null` until hydrated. */
export function useShoppingList(): ShoppingRecipe[] | null {
  return useSyncExternalStore(
    subscribe,
    () => (cache ??= read()),
    () => null,
  );
}

/** Add (or replace, at the new servings) a recipe's ingredients. */
export function addToShoppingList(recipe: Omit<ShoppingRecipe, "checked">) {
  write([{ ...recipe, checked: [] }, ...read().filter((r) => r.slug !== recipe.slug)]);
}

export function removeFromShoppingList(slug: string) {
  write(read().filter((r) => r.slug !== slug));
}

export function toggleShoppingItem(slug: string, index: number) {
  write(
    read().map((r) =>
      r.slug !== slug ? r : { ...r, checked: r.checked.includes(index) ? r.checked.filter((i) => i !== index) : [...r.checked, index] },
    ),
  );
}

export function clearShoppingList() {
  write([]);
}

/** The list as plain text, for copying into a notes app or a message. */
export function shoppingText(list: ShoppingRecipe[], lang: "en" | "ja") {
  return list
    .map((r) => {
      const lines = r.items
        .map((item, i) => (r.checked.includes(i) ? null : lang === "ja" ? `・${item.ja}${item.qtyJa ? ` ${item.qtyJa}` : ""}` : `- ${item.qtyEn ? `${item.qtyEn} ` : ""}${item.en}`))
        .filter(Boolean);
      const head = lang === "ja" ? `■ ${r.title.ja}（${r.servings}人分）` : `${r.title.en} (${r.servings} servings)`;
      return [head, ...lines].join("\n");
    })
    .join("\n\n");
}
