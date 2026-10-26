import { describe, expect, it } from "vitest";
import { mergeFavorites, mergeRatings } from "@/lib/account/backend";
import { cleanFavorites, cleanRatings } from "@/lib/local-store";
import { cleanShopping, shoppingText } from "@/lib/shopping-list";

// Storage and account documents are outside our control, so everything read back is validated.
describe("cleanFavorites", () => {
  it("keeps only slug-shaped strings, once each", () => {
    expect(cleanFavorites(["pho-bo", "pho-bo", "<script>", 42, null, "Bad Slug", "ramen"])).toEqual(["pho-bo", "ramen"]);
  });
  it("turns anything that isn't a list into an empty one", () => {
    expect(cleanFavorites({ 0: "pho-bo" })).toEqual([]);
    expect(cleanFavorites("pho-bo")).toEqual([]);
    expect(cleanFavorites(null)).toEqual([]);
  });
  it("caps the list", () => {
    expect(cleanFavorites(Array.from({ length: 500 }, (_, i) => `dish-${i}`))).toHaveLength(300);
  });
});

describe("cleanRatings", () => {
  it("keeps whole stars from 1 to 5 on slug keys", () => {
    expect(cleanRatings({ "pho-bo": 5, ramen: 0, curry: 6, sushi: 3.5, "x y": 4, tacos: "5", dosa: 2 })).toEqual({ "pho-bo": 5, dosa: 2 });
  });
  it("rejects lists and other non-objects", () => {
    expect(cleanRatings([5])).toEqual({});
    expect(cleanRatings("5")).toEqual({});
  });
});

describe("merging an account with this browser", () => {
  it("puts this browser's favourites first without repeats", () => {
    expect(mergeFavorites(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
  it("lets this browser's newer ratings win", () => {
    expect(mergeRatings({ a: 5 }, { a: 2, b: 4 })).toEqual({ a: 5, b: 4 });
  });
});

describe("shopping list", () => {
  const recipe = {
    slug: "pho-bo",
    title: { en: "Phở Bò", ja: "フォー・ボー" },
    servings: 6,
    items: [
      { en: "beef brisket", ja: "牛ブリスケット", qtyEn: "500 g", qtyJa: "500g" },
      { en: "star anise", ja: "八角", qtyEn: "5", qtyJa: "5個" },
    ],
    checked: [1],
  };

  it("keeps valid recipes and drops broken or duplicate ones", () => {
    const cleaned = cleanShopping([recipe, { ...recipe }, { slug: "../evil" }, "nope", { ...recipe, slug: "ramen", checked: [9, -1, 0, 0] }]);
    expect(cleaned.map((r) => r.slug)).toEqual(["pho-bo", "ramen"]);
    expect(cleaned[1].checked).toEqual([0]);
  });

  it("writes the remaining items as text in either language", () => {
    expect(shoppingText([recipe], "en")).toBe("Phở Bò (6 servings)\n- 500 g beef brisket");
    expect(shoppingText([recipe], "ja")).toBe("■ フォー・ボー（6人分）\n・牛ブリスケット 500g");
  });
});
