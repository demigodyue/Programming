import { describe, expect, it } from "vitest";
import { cuisinesSeed } from "@/data/cuisines.seed";
import { cuisinesJa } from "@/data/cuisines.ja";
import { placeWords } from "@/lib/places";
import { fold } from "@/lib/recipe-filter";

const words = (slug: string) => {
  const c = cuisinesSeed.find((x) => x.slug === slug)!;
  return fold(placeWords({ ...c, ja: cuisinesJa[slug] }).join(" "));
};

describe("placeWords", () => {
  it("finds a cuisine by its country in both languages", () => {
    expect(words("nepali")).toContain(fold("Nepal"));
    expect(words("nepali")).toContain(fold("ネパール"));
    expect(words("korean")).toContain(fold("Korea"));
    expect(words("korean")).toContain(fold("韓国"));
  });

  it("adds the names a cuisine's own data doesn't contain", () => {
    expect(words("nepali")).toContain(fold("Nepalese"));
    expect(words("middle-eastern")).toContain(fold("Lebanon"));
    expect(words("middle-eastern")).toContain(fold("レバノン"));
  });

  it("is empty for an unknown cuisine", () => {
    expect(placeWords(undefined)).toEqual([]);
  });
});
