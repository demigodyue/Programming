"use client";

import { Leaf, Search, X } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { useMotionReady } from "@/components/motion/motion-provider";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { ContinuousTabs } from "@/components/watermelon/continuous-tabs";
import { EmojiSpreeChips } from "@/components/watermelon/emoji-spree-choice-chips";
import { FloatingInput } from "@/components/watermelon/floating-input";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { useT } from "@/lib/lang";
import { emptyFilters, filterRecipes, parseFilters, toQuery, type Filters } from "@/lib/recipe-filter";
import { cn } from "@/lib/utils";

const DIFFICULTY = [
  { id: "", label: <T en="Any" ja="すべて" /> },
  { id: "easy", label: <T en="Easy" ja="かんたん" /> },
  { id: "medium", label: <T en="Medium" ja="ふつう" /> },
  { id: "hard", label: <T en="Challenging" ja="本格派" /> },
];
const TIME = [
  { id: "", label: <T en="Any time" ja="時間指定なし" /> },
  { id: "under-30", label: <T en="≤ 30 min" ja="30分以内" /> },
  { id: "30-60", label: <T en="30–60 min" ja="30〜60分" /> },
  { id: "over-60", label: <T en="1 h +" ja="1時間以上" /> },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Reports query-string changes (e.g. a footer link to /recipes?time=under-30 while already here). */
function UrlWatcher({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

/**
 * The page is static, so every recipe ships with it and filtering happens right here.
 * Filters are mirrored into the URL (history.replaceState) so results stay shareable.
 */
export function RecipeBrowser({
  recipes: all,
  cuisines,
}: {
  recipes: (RecipeCardData & { searchText: string })[];
  cuisines: { id: string; label: string; ja: string; emoji: string }[];
}) {
  const reduce = useReducedMotion();
  const motionReady = useMotionReady();
  const t = useT();
  const chips = useMemo(() => cuisines.map((c) => ({ id: c.id, emoji: c.emoji, label: <T en={c.label} ja={c.ja} /> })), [cuisines]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const lastWritten = useRef<string | null>(null);
  // Bumped when filters come from the URL (page load, footer links): the list is swapped in place
  // instead of animating exits, which can stall if they fire before Motion's features have loaded.
  const [urlVersion, setUrlVersion] = useState(0);
  const recipes = useMemo(() => filterRecipes(all, filters), [all, filters]);

  const onUrl = useCallback((query: string) => {
    if (query === lastWritten.current) return;
    // A late report of a query the address bar has already moved past (the watcher can resolve after the
    // visitor starts typing) would wipe their filters: only follow what the address bar says now.
    if (query !== new URLSearchParams(window.location.search).toString()) return;
    lastWritten.current = query;
    setFilters(parseFilters(query));
    setUrlVersion((v) => v + 1);
  }, []);

  const apply = (next: Filters) => {
    setFilters(next);
    const qs = toQuery(next);
    lastWritten.current = qs;
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const activeCount =
    filters.cuisine.length + Number(Boolean(filters.difficulty)) + Number(Boolean(filters.time)) + Number(filters.vegetarian) + Number(Boolean(filters.q.trim()));
  const clear = () => apply({ q: "", cuisine: [], difficulty: "", time: "", vegetarian: false });

  return (
    <div>
      <Suspense fallback={null}>
        <UrlWatcher onChange={onUrl} />
      </Suspense>
      <div className="space-y-5">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-xl">
          <FloatingInput
            label={<T en="Search dishes, ingredients or countries" ja="料理名・材料・国で検索" />}
            icon={<Search className="size-5" strokeWidth={1.75} />}
            type="search"
            name="q"
            value={filters.q}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="search"
            onChange={(e) => apply({ ...filters, q: e.target.value })}
          />
        </form>

        <EmojiSpreeChips
          label={t("Filter by cuisine", "国で絞り込む")}
          items={chips}
          selected={filters.cuisine}
          onToggle={(id) =>
            apply({
              ...filters,
              cuisine: filters.cuisine.includes(id) ? filters.cuisine.filter((c) => c !== id) : [...filters.cuisine, id],
            })
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <ContinuousTabs
            label={t("Difficulty", "難しさ")}
            tabs={DIFFICULTY}
            value={filters.difficulty}
            onChange={(difficulty) => apply({ ...filters, difficulty })}
          />
          <ContinuousTabs label={t("Total time", "合計時間")} tabs={TIME} value={filters.time} onChange={(time) => apply({ ...filters, time })} />
          <button
            type="button"
            aria-pressed={filters.vegetarian}
            onClick={() => apply({ ...filters, vegetarian: !filters.vegetarian })}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
              filters.vegetarian ? "border-primary bg-primary text-primary-foreground" : "bg-card hover-fine:bg-muted",
            )}
          >
            <Leaf className="size-4" strokeWidth={1.75} aria-hidden />
            <T en="Vegetarian" ja="ベジタリアン" />
          </button>
        </div>
      </div>

      <div className="mt-10 mb-6 flex min-h-9 items-center justify-between gap-4">
        <p aria-live="polite" className="text-muted-foreground">
          <T
            en={
              <>
                <span className="text-foreground font-medium">{recipes.length}</span> {recipes.length === 1 ? "recipe" : "recipes"}
              </>
            }
            ja={
              <>
                <span className="text-foreground font-medium">{recipes.length}</span>件のレシピ
              </>
            }
          />
        </p>
        <AnimatePresence>
          {activeCount > 0 && (
            <m.button
              type="button"
              onClick={clear}
              initial={{ opacity: 0, transform: "scale(0.95)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: "scale(0.95)" }}
              transition={{ duration: 0.18 }}
              className="text-accent-ink hover-fine:bg-muted inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium"
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
              <T en="Clear filters" ja="条件をクリア" />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <div>
        {recipes.length === 0 ? (
          <div className="bg-card rounded-lg border px-6 py-20 text-center">
            <p className="font-display text-[2.125rem] leading-tight">
              <T en="No dishes match those filters." ja="条件に合う料理がありません。" />
            </p>
            <p className="text-muted-foreground mt-2">
              <T
                en="Try another cuisine, a longer cooking time, or clear the filters to see everything."
                ja="別の国や長めの調理時間を試すか、条件をクリアしてすべて表示してください。"
              />
            </p>
            <button type="button" onClick={clear} data-accent="mint" className={flipClass("solid", "mt-6")}>
              <FlipFace>
                <T en="Show all recipes" ja="すべてのレシピを表示" />
              </FlipFace>
            </button>
          </div>
        ) : (
          // Until Motion's features load, exits can't run and filtered-out cards would linger: swap the list in place.
          <ul key={motionReady ? urlVersion : `${urlVersion}:${toQuery(filters)}`} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {recipes.map((r, i) => (
                <m.li
                  key={r.slug}
                  layout={!reduce}
                  initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
                  transition={{ duration: 0.3, ease: EASE_OUT, layout: { type: "spring", duration: 0.45, bounce: 0.1 } }}
                >
                  <div className="card-rise h-full" style={{ "--c": i % 3 } as CSSProperties}>
                    <RecipeCard recipe={r} eager={i < 3} headingLevel={2} />
                  </div>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
