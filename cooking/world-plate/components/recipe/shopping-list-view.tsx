"use client";

import { Check, ClipboardCopy, Printer, ShoppingBasket, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { useLang, useT } from "@/lib/lang";
import { clearShoppingList, removeFromShoppingList, shoppingText, toggleShoppingItem, useShoppingList } from "@/lib/shopping-list";
import { cn } from "@/lib/utils";

/**
 * The shopping list: one card per recipe, its ingredients as tick-off rows (they slide in one after another, and a
 * ticked row strikes through like the recipe checklist). Copy the remaining items as text, print it, remove a recipe,
 * or clear everything.
 */
export function ShoppingListView() {
  const list = useShoppingList();
  const lang = useLang();
  const t = useT();
  const [copied, setCopied] = useState(false);

  if (list === null) return <div className="min-h-[40svh]" aria-busy="true" />;

  if (list.length === 0) {
    return (
      <div className="bg-card rounded-lg border px-6 py-20 text-center">
        <ShoppingBasket aria-hidden className="mx-auto size-8" strokeWidth={1.5} />
        <p className="font-display mt-6 text-[2.125rem] leading-tight">
          <T en="Your list is empty." ja="買い物リストは空です。" />
        </p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          <T
            en="Open a recipe, pick how many you're cooking for, and press “Add to shopping list”."
            ja="レシピを開いて人数を選び、「買い物リストに追加」を押してください。"
          />
        </p>
        <Link href="/recipes" data-accent="yellow" className={flipClass("solid", "mt-8")}>
          <FlipFace>
            <T en="Browse recipes" ja="レシピを見る" />
          </FlipFace>
        </Link>
      </div>
    );
  }

  const left = list.reduce((n, r) => n + r.items.length - r.checked.length, 0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText(list, lang));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      <div data-print="hide" className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground" aria-live="polite">
          <T
            en={
              <>
                <span className="text-foreground font-medium">{left}</span> {left === 1 ? "item" : "items"} to buy from {list.length}{" "}
                {list.length === 1 ? "recipe" : "recipes"}
              </>
            }
            ja={
              <>
                {list.length}品のレシピから、残り<span className="text-foreground font-medium">{left}</span>点
              </>
            }
          />
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="hover-fine:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium">
            {copied ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <ClipboardCopy className="size-4" strokeWidth={1.75} aria-hidden />}
            {copied ? <T en="Copied" ja="コピーしました" /> : <T en="Copy as text" ja="テキストでコピー" />}
          </button>
          <button type="button" onClick={() => window.print()} className="hover-fine:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium">
            <Printer className="size-4" strokeWidth={1.75} aria-hidden />
            <T en="Print" ja="印刷" />
          </button>
          <button
            type="button"
            onClick={clearShoppingList}
            className="hover-fine:bg-muted text-muted-foreground inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium"
          >
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            <T en="Clear list" ja="すべて消去" />
          </button>
        </div>
      </div>

      <ul className="grid gap-6 md:grid-cols-2">
        {list.map((r) => (
          <li key={r.slug} className="card-rise bg-card rounded-lg border p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-[1.625rem] leading-tight">
                <Link href={`/recipes/${r.slug}`} className="link-group">
                  <T en={r.title.en} ja={r.title.ja} />
                </Link>
              </h2>
              <button
                type="button"
                data-print="hide"
                onClick={() => removeFromShoppingList(r.slug)}
                aria-label={t(`Remove ${r.title.en} from the list`, `${r.title.ja}をリストから外す`)}
                className="hover-fine:bg-muted grid size-10 shrink-0 place-items-center rounded-full border"
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <p className="label-caps text-muted-foreground mt-1">
              <T en={`${r.servings} servings`} ja={`${r.servings}人分`} />
            </p>
            <ul data-reveal="rows" data-reveal-at="100" className="divide-border mt-4 divide-y">
              {r.items.map((item, i) => {
                const done = r.checked.includes(i);
                return (
                  <li key={i} data-checked={done} className="reveal-row" style={{ "--i": i } as CSSProperties}>
                    <label className="flex cursor-pointer items-start gap-3 py-2.5">
                      <input type="checkbox" checked={done} onChange={() => toggleShoppingItem(r.slug, i)} className="peer sr-only" />
                      <span
                        aria-hidden
                        className={cn(
                          "peer-focus-visible:ring-ring mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border transition-colors duration-200 peer-focus-visible:ring-2",
                          done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
                        )}
                      >
                        {done && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={cn("leading-snug transition-colors duration-300", done && "text-muted-foreground")}>
                        <span className="strike">
                          <T
                            en={
                              <>
                                {item.qtyEn && <span className="font-medium tabular-nums">{item.qtyEn} </span>}
                                {item.en}
                              </>
                            }
                            ja={
                              <>
                                {item.ja}
                                {item.qtyJa && <span className="ml-2 font-medium tabular-nums">{item.qtyJa}</span>}
                              </>
                            }
                          />
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
