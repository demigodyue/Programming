import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recipesSeed } from "@/data/recipes.seed";
import { RECIPE_SLUGS } from "@/lib/recipe-slugs";

// Accounts may only save known recipe slugs (firestore.rules); the site filters by the same list before saving.
// Both come from scripts/sync-recipe-slugs.ts — `npm run rules` after adding a recipe, then republish the rules.
const rules = readFileSync(join(__dirname, "..", "..", "firestore.rules"), "utf8");
const block = rules.match(/function recipeSlugs\(\) \{\s*return \[([\s\S]*?)\];/)?.[1] ?? "";
const ruleSlugs = new Set([...block.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));

describe("saved-recipe allow-list", () => {
  it.each(recipesSeed.map((r) => r.slug))("%s can be saved to an account", (slug) => {
    expect(RECIPE_SLUGS.has(slug), "run `npm run rules`").toBe(true);
    expect(ruleSlugs.has(slug), "run `npm run rules` and republish firestore.rules").toBe(true);
  });

  it("the site and the rules list the same slugs", () => {
    expect([...ruleSlugs].sort()).toEqual([...RECIPE_SLUGS].sort());
  });

  it("only allows 1–5 stars and known fields", () => {
    expect(rules).toContain("data.ratings.values().hasOnly([1, 2, 3, 4, 5])");
    expect(rules).toContain('data.keys().hasOnly(["name", "favorites", "ratings", "avatar", "createdAt", "updatedAt"])');
  });
});
