import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { T } from "@/components/i18n";
import { SlantText } from "@/components/motion/slant-text";
import { ShoppingListView } from "@/components/recipe/shopping-list-view";
import { jaTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shopping list",
  description: "The ingredients for the recipes you're about to cook, ready to tick off at the shop.",
  robots: { index: false },
  other: jaTitle("買い物リスト"),
};

export default function ShoppingListPage() {
  return (
    <div className="container-page pt-32 pb-24 md:pt-36">
      <header className="hero-content relative isolate mb-12 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="Shopping list" ja="買い物リスト" className="block text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.92]" />
        <p className="load-stagger text-muted-foreground mt-6 max-w-md text-base" style={{ "--i": 0 } as CSSProperties}>
          <T
            en="Everything you need for the recipes you've added, saved on this browser. Tick things off as they go in the basket."
            ja="追加したレシピに必要な材料の一覧です（このブラウザに保存）。かごに入れたらチェックしましょう。"
          />
        </p>
      </header>
      <ShoppingListView />
    </div>
  );
}
