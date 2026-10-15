"use client";

import { Leaf, Search, X } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { ContinuousTabs } from "@/components/watermelon/continuous-tabs";
import { EmojiSpreeChips } from "@/components/watermelon/emoji-spree-choice-chips";
import { FloatingInput } from "@/components/watermelon/floating-input";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { emptyFilters, filterRecipes, parseFilters, toQuery, type Filters } from "@/lib/recipe-filter";
import { cn } from "@/lib/utils";

const DIFFICULTY = [
  { id: "", label: "Any" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Challenging" },
];
const TIME = [
  { id: "", label: "Any time" },
  { id: "under-30", label: "≤ 30 min" },
  { id: "30-60", label: "30–60 min" },
  { id: "over-60", label: "1 h +" },
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
  cuisines: { id: string; label: string; emoji: string }[];
}) {
  const reduce = useReducedMotion();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const lastWritten = useRef<string | null>(null);
  // Bumped when filters come from the URL (page load, footer links): the list is swapped in place
  // instead of animating exits, which can stall if they fire before Motion's features have loaded.
  const [urlVersion, setUrlVersion] = useState(0);
  const recipes = useMemo(() => filterRecipes(all, filters), [all, filters]);

  const onUrl = useCallback((query: string) => {
    if (query === lastWritten.current) return;
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
            label="Search dishes, ingredients or cuisines"
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
          label="Filter by cuisine"
          items={cuisines}
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
            label="Difficulty"
            tabs={DIFFICULTY}
            value={filters.difficulty}
            onChange={(difficulty) => apply({ ...filters, difficulty })}
          />
          <ContinuousTabs label="Total time" tabs={TIME} value={filters.time} onChange={(time) => apply({ ...filters, time })} />
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
            Vegetarian
          </button>
        </div>
      </div>

      <div className="mt-10 mb-6 flex min-h-9 items-center justify-between gap-4">
        <p aria-live="polite" className="text-muted-foreground">
          <span className="text-foreground font-medium">{recipes.length}</span> {recipes.length === 1 ? "recipe" : "recipes"}
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
              Clear filters
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <div>
        {recipes.length === 0 ? (
          <div className="bg-card rounded-lg border px-6 py-20 text-center">
            <p className="font-display text-[2.125rem] leading-tight">No dishes match those filters.</p>
            <p className="text-muted-foreground mt-2">Try another cuisine, a longer cooking time, or clear the filters to see everything.</p>
            <button
              type="button"
              onClick={clear}
              className="btn-swap bg-primary text-primary-foreground mt-6 inline-flex h-11 items-center rounded-full px-6 font-medium"
            >
              Show all recipes
            </button>
          </div>
        ) : (
          <ul key={urlVersion} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
                  <RecipeCard recipe={r} eager={i < 3} headingLevel={2} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
