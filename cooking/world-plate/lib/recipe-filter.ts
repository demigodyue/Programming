/**
 * Client-side recipe filtering for the static /recipes page — mirrors `searchRecipes` in
 * db/queries/recipes.ts (which still runs at build time). Pure, so it's unit-tested.
 */

export type Filters = {
  q: string;
  cuisine: string[];
  difficulty: string;
  time: string;
  vegetarian: boolean;
};

export type Searchable = {
  slug: string;
  cuisineSlug: string;
  difficulty: string;
  vegetarian: boolean;
  totalMinutes: number;
  /** Title, description, cuisine, tags and ingredient names in both languages, folded (see fold). */
  searchText: string;
};

const DIFFICULTIES = ["easy", "medium", "hard"];
const TIMES = ["under-30", "30-60", "over-60"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Search text and queries are compared folded: lower case, Latin accents dropped ("Phở" → "pho", "crêpes" →
 * "crepes"). Only the Latin combining marks go, so Japanese kana keep their voicing marks (が stays が).
 */
export function fold(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

export const emptyFilters: Filters = { q: "", cuisine: [], difficulty: "", time: "", vegetarian: false };

/** Reads filters from a query string. Invalid values are dropped, never thrown. */
export function parseFilters(query: string): Filters {
  const p = new URLSearchParams(query);
  const difficulty = p.get("difficulty") ?? "";
  const time = p.get("time") ?? "";
  const vegetarian = p.get("vegetarian");
  return {
    q: (p.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    cuisine: (p.get("cuisine") ?? "")
      .split(",")
      .filter((c) => SLUG.test(c))
      .slice(0, 10),
    difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "",
    time: TIMES.includes(time) ? time : "",
    vegetarian: vegetarian === "1" || vegetarian === "true",
  };
}

export function toQuery(f: Filters) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.cuisine.length) p.set("cuisine", f.cuisine.join(","));
  if (f.difficulty) p.set("difficulty", f.difficulty);
  if (f.time) p.set("time", f.time);
  if (f.vegetarian) p.set("vegetarian", "1");
  return p.toString();
}

export function filterRecipes<T extends Searchable>(recipes: T[], f: Filters): T[] {
  const q = fold(f.q.trim());
  return recipes.filter((r) => {
    if (q && !r.searchText.includes(q)) return false;
    if (f.cuisine.length && !f.cuisine.includes(r.cuisineSlug)) return false;
    if (f.difficulty && r.difficulty !== f.difficulty) return false;
    if (f.vegetarian && !r.vegetarian) return false;
    if (f.time === "under-30" && r.totalMinutes > 30) return false;
    if (f.time === "30-60" && (r.totalMinutes <= 30 || r.totalMinutes > 60)) return false;
    if (f.time === "over-60" && r.totalMinutes <= 60) return false;
    return true;
  });
}
