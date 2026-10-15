import { describe, expect, it } from "vitest";
import { emptyFilters, filterRecipes, parseFilters, toQuery } from "@/lib/recipe-filter";

const recipes = [
  { slug: "ramen", cuisineSlug: "japanese", difficulty: "hard", vegetarian: false, totalMinutes: 180, searchText: "shoyu ramen pork belly" },
  { slug: "pad-thai", cuisineSlug: "thai", difficulty: "medium", vegetarian: false, totalMinutes: 30, searchText: "pad thai rice noodles garlic" },
  { slug: "dal", cuisineSlug: "nepali", difficulty: "easy", vegetarian: true, totalMinutes: 60, searchText: "dal bhat lentils garlic" },
];

describe("parseFilters", () => {
  it("reads valid params and drops invalid ones", () => {
    expect(parseFilters("q=%20 garlic  &cuisine=thai,BAD!,nepali&difficulty=extreme&time=under-30&vegetarian=1")).toEqual({
      q: "garlic",
      cuisine: ["thai", "nepali"],
      difficulty: "",
      time: "under-30",
      vegetarian: true,
    });
  });

  it("round-trips through toQuery", () => {
    const f = { q: "garlic", cuisine: ["thai"], difficulty: "easy", time: "30-60", vegetarian: true };
    expect(parseFilters(toQuery(f))).toEqual(f);
    expect(toQuery(emptyFilters)).toBe("");
  });
});

describe("filterRecipes", () => {
  const slugs = (q: string) => filterRecipes(recipes, parseFilters(q)).map((r) => r.slug);

  it("matches search text case-insensitively", () => expect(slugs("q=GARLIC")).toEqual(["pad-thai", "dal"]));
  it("filters by cuisine, difficulty and vegetarian", () => {
    expect(slugs("cuisine=japanese,nepali")).toEqual(["ramen", "dal"]);
    expect(slugs("difficulty=medium")).toEqual(["pad-thai"]);
    expect(slugs("vegetarian=1")).toEqual(["dal"]);
  });
  it("uses the same time buckets as the database query", () => {
    expect(slugs("time=under-30")).toEqual(["pad-thai"]);
    expect(slugs("time=30-60")).toEqual(["dal"]);
    expect(slugs("time=over-60")).toEqual(["ramen"]);
  });
});
