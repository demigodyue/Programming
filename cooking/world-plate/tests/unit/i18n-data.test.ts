import { describe, expect, it } from "vitest";
import { cuisinesJa } from "@/data/cuisines.ja";
import { cuisinesSeed } from "@/data/cuisines.seed";
import { recipesJa } from "@/data/recipes.ja";
import { recipesSeed } from "@/data/recipes.seed";
import { formatMinutesJa, formatQuantityJa } from "@/lib/scale";

// The Japanese edition lines up with the English seed by position, so a missing or extra line would put every
// following ingredient or step next to the wrong amount.
describe("Japanese recipe data", () => {
  it.each(recipesSeed.map((r) => [r.slug, r] as const))("%s is fully translated", (slug, recipe) => {
    const ja = recipesJa[slug];
    expect(ja, `no Japanese for ${slug}`).toBeDefined();
    expect(ja.ingredients).toHaveLength(recipe.ingredients.length);
    expect(ja.steps).toHaveLength(recipe.steps.length);
    for (const ing of recipe.ingredients) {
      if (ing.section) expect(ja.sections?.[ing.section], `${slug}: section "${ing.section}"`).toBeTruthy();
    }
    for (const text of [ja.title, ja.description, ja.story, ja.imageAlt, ja.origin, ...ja.steps]) {
      expect(text.trim()).not.toBe("");
    }
  });

  it("has no translations for recipes that don't exist", () => {
    const slugs = new Set(recipesSeed.map((r) => r.slug));
    expect(Object.keys(recipesJa).filter((s) => !slugs.has(s))).toEqual([]);
  });

  it("translates every cuisine", () => {
    for (const c of cuisinesSeed) expect(cuisinesJa[c.slug], c.slug).toBeDefined();
  });
});

describe("formatQuantityJa", () => {
  it("puts spoons first and keeps metric units tight", () => {
    expect(formatQuantityJa(2, "tsp", 4, 4)).toBe("小さじ2");
    expect(formatQuantityJa(1.5, "tbsp", 2, 2)).toBe("大さじ1½");
    expect(formatQuantityJa(250, "g", 4, 4)).toBe("250g");
    expect(formatQuantityJa(1.5, "l", 4, 4)).toBe("1.5L");
  });

  it("counts unitless items with a counter", () => {
    expect(formatQuantityJa(4, null, 4, 4)).toBe("4個");
    expect(formatQuantityJa(2, null, 4, 8, "片")).toBe("4片");
    expect(formatQuantityJa(1, "pinch", 4, 4)).toBe("ひとつまみ");
  });

  it("leaves 'to taste' lines empty and scales like the English", () => {
    expect(formatQuantityJa(null, null, 4, 8)).toBe("");
    expect(formatQuantityJa(200, "g", 4, 2)).toBe("100g");
  });
});

describe("formatMinutesJa", () => {
  it.each([
    [25, "25分"],
    [60, "1時間"],
    [95, "1時間35分"],
  ])("%d → %s", (m, expected) => expect(formatMinutesJa(m)).toBe(expected));
});
