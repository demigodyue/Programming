import { describe, expect, it } from "vitest";
import { recipesSeed } from "@/data/recipes.seed";
import { clock, parseDurations, stepAction } from "@/lib/step-info";

describe("parseDurations", () => {
  it.each([
    ["Simmer for 20 minutes.", [1200]],
    ["Fry for 8–10 minutes until golden.", [480]],
    ["Braise on low for 2 hours, turning every 30 minutes.", [7200, 1800]],
    ["Boil the eggs for 6½ minutes.", [390]],
    ["Simmer for 2½–3 hours.", [9000]],
    ["Stir for 30 seconds, then 1 minute more.", [30, 60]],
    ["Rest for 1½ hours.", [5400]],
  ])("%s", (text, expected) => expect(parseDurations(text)).toEqual(expected));

  it("skips overnight soaks and blinks", () => {
    expect(parseDurations("Soak for 12–24 hours.")).toEqual([]);
    expect(parseDurations("Dip each biscuit for 1 second.")).toEqual([]);
  });

  it("ignores numbers that aren't times", () => {
    expect(parseDurations("Heat the oven to 200 °C and cut 5 mm slices.")).toEqual([]);
  });

  it("finds at least one timer in most recipes", () => {
    const withTimers = recipesSeed.filter((r) => r.steps.some((s) => parseDurations(s).length > 0));
    expect(withTimers.length).toBeGreaterThan(recipesSeed.length * 0.9);
  });
});

describe("stepAction", () => {
  it.each([
    ["Heat the oven to 190 °C and bake for 30 minutes.", "bake"],
    ["Heat the oil in a wok and fry the garlic.", "fry"],
    ["Bring a large pot of water to a boil.", "boil"],
    ["Slice the pork 5 mm thick.", "chop"],
    ["Whisk the eggs with the sugar.", "mix"],
    ["Cover and chill for 6 hours.", "rest"],
    ["Serve with lime wedges.", "serve"],
    ["Warm the milk gently.", "heat"],
  ])("%s → %s", (text, action) => expect(stepAction(text)).toBe(action));
});

describe("clock", () => {
  it.each([
    [90, "1:30"],
    [5, "0:05"],
    [3725, "1:02:05"],
    [0.4, "0:01"],
  ])("%d → %s", (s, expected) => expect(clock(s)).toBe(expected));
});
