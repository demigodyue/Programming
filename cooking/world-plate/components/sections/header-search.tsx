"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Minutes, T } from "@/components/i18n";
import { useLang, useT } from "@/lib/lang";
import { fold } from "@/lib/recipe-filter";
import { cn } from "@/lib/utils";

/** One dish in the header search, both languages (built at build time in app/layout.tsx). */
export type SearchItem = {
  slug: string;
  title: string;
  titleJa: string;
  cuisine: string;
  cuisineJa: string;
  image: string;
  minutes: number;
  /** Title, description, cuisine, country and origin in both languages, folded (lib/recipe-filter.ts). */
  text: string;
};

/** One cuisine in the header search, found by its name or country (app/layout.tsx, lib/places.ts). */
export type SearchPlace = {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  countryJa: string;
  emoji: string;
  count: number;
  text: string;
};

const MAX = 6;
const MAX_PLACES = 2;

type Option = { kind: "dish"; item: SearchItem; href: string } | { kind: "place"; place: SearchPlace; href: string };

/** Matching cuisines first (typing "Nepal" offers the whole Nepali page), then dishes. */
function match(items: SearchItem[], places: SearchPlace[], query: string): Option[] {
  const dish = (item: SearchItem): Option => ({ kind: "dish", item, href: `/recipes/${item.slug}` });
  const q = fold(query.trim());
  if (!q) return items.slice(0, MAX).map(dish);
  const starts = (s: string) => fold(s).startsWith(q);
  const placeHits = places
    .filter((p) => p.text.includes(q))
    .slice(0, MAX_PLACES)
    .map((place): Option => ({ kind: "place", place, href: `/cuisine/${place.slug}` }));
  const dishHits = items
    .filter((r) => r.text.includes(q))
    .sort((a, b) => Number(starts(b.title) || starts(b.titleJa)) - Number(starts(a.title) || starts(a.titleJa)))
    .slice(0, MAX)
    .map(dish);
  return [...placeHits, ...dishHits];
}

/**
 * The header's round search button. It opens a search box that grows out of the button: type and the matching
 * cuisines and dishes appear under it (in either language, by name or country), arrow keys move through them, Enter opens one — or the full search
 * on /recipes when none is picked. "/" or Ctrl/⌘+K opens it from anywhere; Esc, a click outside or navigating
 * closes it. The box stays mounted and animates with CSS (`.nav-search`, globals.css).
 */
export function HeaderSearch({ items, places, className }: { items: SearchItem[]; places: SearchPlace[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const lang = useLang();
  const t = useT();
  const listId = useId();
  const results = useMemo(() => match(items, places, query), [items, places, query]);

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const show = (next: boolean) => {
    setOpen(next);
    setActive(-1);
    if (next) requestAnimationFrame(() => input.current?.focus());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
        setActive(-1);
        requestAnimationFrame(() => input.current?.focus());
      } else if (e.key === "Escape" && open) setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (open && root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const submit = () => {
    const pick = results[active];
    if (pick) router.push(pick.href);
    else router.push(query.trim() ? `/recipes?q=${encodeURIComponent(query.trim())}` : "/recipes");
    setOpen(false);
  };

  return (
    <div ref={root}>
      <button
        type="button"
        onClick={() => show(!open)}
        aria-expanded={open}
        aria-controls={`${listId}-box`}
        aria-label={open ? t("Close search", "検索を閉じる") : t("Search recipes", "レシピを検索")}
        data-open={open || undefined}
        className={cn("nav-search-btn grid place-items-center rounded-full", className)}
      >
        <Search className="nav-search-btn__glass size-[18px]" strokeWidth={2} aria-hidden />
        <X className="nav-search-btn__x size-[18px]" strokeWidth={2} aria-hidden />
      </button>

      <div id={`${listId}-box`} className="nav-search" data-open={open || undefined} inert={!open}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="nav-search__field"
        >
          <Search className="text-muted-foreground size-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const n = results.length;
                if (n) setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n));
              }
            }}
            placeholder={t("Search dishes, countries…", "料理名・国で検索…")}
            aria-label={t("Search recipes", "レシピを検索")}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            enterKeyHint="search"
            maxLength={80}
            lang={lang}
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          <kbd className="text-muted-foreground hidden rounded border px-1.5 py-0.5 text-[0.6875rem] sm:block">Esc</kbd>
        </form>

        <p className="label-caps text-muted-foreground px-5 pt-3 pb-1 text-[0.6875rem]">
          {query.trim() ? (
            <T en={results.length ? "Results" : "No dishes found"} ja={results.length ? "検索結果" : "見つかりませんでした"} />
          ) : (
            <T en="Popular right now" ja="いま人気" />
          )}
        </p>
        <ul id={listId} role="listbox" aria-label={t("Matching dishes", "一致する料理")} className="px-2 pb-2">
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              className="nav-search__item"
              style={{ "--i": i } as CSSProperties}
            >
              <Link
                href={r.href}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                data-active={active === i || undefined}
                className="nav-search__link"
              >
                {r.kind === "place" ? (
                  <>
                    <span className="bg-secondary grid size-11 shrink-0 place-items-center rounded-md text-xl" aria-hidden>
                      {r.place.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        <T en={`All ${r.place.name} dishes`} ja={`${r.place.nameJa}をすべて見る`} />
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        <T
                          en={`${r.place.country} · ${r.place.count} ${r.place.count === 1 ? "recipe" : "recipes"}`}
                          ja={`${r.place.countryJa} · ${r.place.count}品`}
                        />
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-muted relative size-11 shrink-0 overflow-hidden rounded-md">
                      <Image src={r.item.image} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        <T en={r.item.title} ja={r.item.titleJa} />
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        <T en={r.item.cuisine} ja={r.item.cuisineJa} /> · <Minutes m={r.item.minutes} />
                      </span>
                    </span>
                  </>
                )}
                <ArrowRight className="nav-search__arrow size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={query.trim() ? `/recipes?q=${encodeURIComponent(query.trim())}` : "/recipes"}
          className="nav-search__all"
        >
          {query.trim() ? (
            <T en={`See all results for “${query.trim()}”`} ja={`「${query.trim()}」の検索結果をすべて見る`} />
          ) : (
            <T en="Browse all recipes" ja="すべてのレシピを見る" />
          )}
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
