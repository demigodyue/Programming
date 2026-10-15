import { describe, expect, it } from "vitest";
import { formatAmount, formatMinutes, formatQuantity, scaleAmount, toFraction } from "@/lib/scale";

describe("scaleAmount", () => {
  it("scales linearly with servings", () => {
    expect(scaleAmount(200, 4, 2)).toBe(100);
    expect(scaleAmount(1.5, 2, 6)).toBe(4.5);
  });

  it("leaves 'to taste' ingredients alone", () => {
    expect(scaleAmount(null, 4, 8)).toBeNull();
  });

  it("rejects non-positive servings", () => {
    expect(() => scaleAmount(1, 0, 2)).toThrow(RangeError);
    expect(() => scaleAmount(1, 2, -1)).toThrow(RangeError);
  });
});

describe("toFraction", () => {
  it.each([
    [0.5, "½"],
    [1.5, "1½"],
    [0.25, "¼"],
    [0.333, "⅓"],
    [0.6667, "⅔"],
    [2, "2"],
    [2.97, "3"],
    [0.02, "⅛"],
  ])("%d → %s", (input, expected) => {
    expect(toFraction(input)).toBe(expected);
  });
});

describe("formatAmount", () => {
  it("rounds metric weights sensibly", () => {
    expect(formatAmount(233.33, "g")).toBe("235");
    expect(formatAmount(37.5, "g")).toBe("38");
    expect(formatAmount(7.5, "g")).toBe("7.5");
    expect(formatAmount(1.3333, "kg")).toBe("1.33");
  });

  it("uses fractions for spoons, cups and counted items", () => {
    expect(formatAmount(0.75, "tsp")).toBe("¾");
    expect(formatAmount(1.5, null)).toBe("1½");
  });

  it("returns an empty string for unmeasured items", () => {
    expect(formatAmount(null, null)).toBe("");
  });
});

describe("formatQuantity", () => {
  it("halves a 4-serving recipe", () => {
    expect(formatQuantity(3, "tbsp", 4, 2)).toBe("1½ tbsp");
    expect(formatQuantity(700, "g", 4, 2)).toBe("350 g");
    expect(formatQuantity(4, null, 4, 2)).toBe("2");
  });

  it("scales up from odd servings", () => {
    expect(formatQuantity(450, "g", 3, 4)).toBe("600 g");
    expect(formatQuantity(1, "tbsp", 3, 4)).toBe("1⅓ tbsp");
  });
});

describe("formatMinutes", () => {
  it.each([
    [25, "25 min"],
    [60, "1 h"],
    [95, "1 h 35 min"],
    [840, "14 h"],
  ])("%d → %s", (input, expected) => {
    expect(formatMinutes(input)).toBe(expected);
  });
});
