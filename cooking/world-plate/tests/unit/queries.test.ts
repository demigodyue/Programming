import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase, type Database } from "@/db/client";
import { getCuisine, listCuisines } from "@/db/queries/cuisines";
import {
  getRatingSummary,
  getUserRating,
  isFavorite,
  listFavoriteRecipes,
  setFavorite,
  setRating,
  subscribeToNewsletter,
} from "@/db/queries/engagement";
import {
  getRecipeBySlug,
  likePattern,
  listQuickRecipes,
  listRecipesByCuisine,
  listRelatedRecipes,
  searchRecipes,
} from "@/db/queries/recipes";
import { seed } from "@/db/seed";
import { parseRecipeSearch } from "@/lib/validation";
import { recipesSeed } from "@/data/recipes.seed";

let dir: string;
let db: Database;
let close: () => void;

const search = (params: Record<string, string>) => searchRecipes(db, parseRecipeSearch(params));
const SESSION_A = "6f1c2b8e-3c1d-4a5e-9f00-0a1b2c3d4e5f";
const SESSION_B = "7a2d3c9f-4d2e-4b6f-8a11-1b2c3d4e5f60";

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "world-plate-test-"));
  const created = createDatabase(`file:${path.join(dir, "test.db").replace(/\\/g, "/")}`);
  db = created.db;
  close = () => created.client.close();
  await migrate(db, { migrationsFolder: "db/migrations" });
  await seed(db);
});

afterAll(() => {
  close();
  // Best-effort: on Windows libsql may keep the file handle until the process exits.
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});

describe("seed", () => {
  it("is idempotent", async () => {
    const before = await getRecipeBySlug(db, "pad-thai");
    await seed(db);
    const [{ n }] = await db.all<{ n: number }>(sql`select count(*) as n from recipes`);
    const after = await getRecipeBySlug(db, "pad-thai");
    expect(n).toBe(recipesSeed.length);
    expect(after?.id).toBe(before?.id);
    expect(after?.ingredients).toHaveLength(before!.ingredients.length);
  });
});

describe("recipe queries", () => {
  it("loads a full recipe with ordered ingredients and steps", async () => {
    const r = await getRecipeBySlug(db, "spaghetti-carbonara");
    expect(r).not.toBeNull();
    expect(r!.cuisineName).toBe("Italian");
    expect(r!.ingredients[0].item).toBe("spaghetti");
    expect(r!.steps).toHaveLength(7);
    expect(r!.totalMinutes).toBe(25);
    expect(r!.tags).toContain("pasta");
    // The Japanese edition comes along, lined up with the English lists.
    expect(r!.ja.title).toBe("スパゲッティ・カルボナーラ");
    expect(r!.ja.cuisineName).toBe("イタリア料理");
    expect(r!.ja.ingredients).toHaveLength(r!.ingredients.length);
    expect(r!.ja.steps).toHaveLength(r!.steps.length);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getRecipeBySlug(db, "not-a-dish")).toBeNull();
  });

  it("searches across title, cuisine, tags and ingredients", async () => {
    expect((await search({ q: "ramen" })).map((r) => r.slug)).toEqual(["shoyu-ramen"]);
    expect((await search({ q: "korean" })).map((r) => r.slug).sort()).toEqual(["bibimbap", "kimchi-jjigae", "tteokbokki", "yangnyeom-chicken"]);
    expect((await search({ q: "tamarind" })).map((r) => r.slug)).toContain("pad-thai");
    expect((await search({ q: "dumplings" })).map((r) => r.slug)).toContain("chicken-momo");
  });

  it("treats LIKE wildcards in the query literally", async () => {
    expect(likePattern("50%_off")).toBe("%50\\%\\_off%");
    // Only two recipes contain a literal "%" ("82% fat" butter, "60–70%" chocolate); unescaped it would match everything.
    expect((await search({ q: "%" })).map((r) => r.slug).sort()).toEqual(["churros", "croissants"]);
    expect(await search({ q: "_" })).toHaveLength(0);
  });

  it("combines cuisine, difficulty, time and vegetarian filters", async () => {
    const veg = await search({ vegetarian: "1" });
    expect(veg.every((r) => r.vegetarian)).toBe(true);
    expect(veg.length).toBeGreaterThan(0);

    const quick = await search({ time: "under-30" });
    expect(quick.every((r) => r.totalMinutes <= 30)).toBe(true);

    const easyNepali = await search({ cuisine: "nepali", difficulty: "easy" });
    expect(easyNepali.map((r) => r.slug).sort()).toEqual(["dal-bhat", "kukhura-ko-masu", "thukpa"]);

    const multi = await search({ cuisine: "japanese,thai" });
    expect(new Set(multi.map((r) => r.cuisineSlug))).toEqual(new Set(["japanese", "thai"]));
  });

  it("ignores invalid filter values instead of failing", async () => {
    const all = await search({});
    const junk = await search({ difficulty: "impossible", time: "forever", cuisine: "DROP TABLE" });
    expect(junk).toHaveLength(all.length);
  });

  it("lists quick meals under 30 minutes, fastest first", async () => {
    const quick = await listQuickRecipes(db, 30);
    expect(quick.length).toBeGreaterThanOrEqual(3);
    expect(quick.every((r) => r.totalMinutes <= 30)).toBe(true);
    const totals = quick.map((r) => r.totalMinutes);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });

  it("puts same-cuisine dishes first in related recipes", async () => {
    const ramen = (await getRecipeBySlug(db, "shoyu-ramen"))!;
    const related = await listRelatedRecipes(db, ramen, 3);
    expect(related.map((r) => r.cuisineSlug)).toEqual(["japanese", "japanese", "japanese"]);
    expect(related.map((r) => r.slug)).not.toContain("shoyu-ramen");
  });
});

describe("cuisine queries", () => {
  it("lists every cuisine in display order with recipe counts", async () => {
    const list = await listCuisines(db);
    expect(list).toHaveLength(12);
    expect(list[0].slug).toBe("japanese");
    expect(list.every((c) => c.recipeCount >= 1)).toBe(true);
  });

  it("gets a cuisine and its dishes", async () => {
    expect((await getCuisine(db, "nepali"))?.country).toBe("Nepal");
    expect(await getCuisine(db, "atlantis")).toBeNull();
    expect((await listRecipesByCuisine(db, "nepali")).map((r) => r.slug).sort()).toEqual([
      "chicken-momo",
      "dal-bhat",
      "jhol-momo",
      "kukhura-ko-masu",
      "sel-roti",
      "thukpa",
    ]);
    expect((await getCuisine(db, "vietnamese"))?.ja.name).toBe("ベトナム料理");
  });
});

describe("favorites and ratings", () => {
  it("saves and removes favorites idempotently, scoped to the session", async () => {
    const pizza = (await getRecipeBySlug(db, "margherita-pizza"))!;
    await setFavorite(db, SESSION_A, pizza.id, true);
    await setFavorite(db, SESSION_A, pizza.id, true);
    expect(await isFavorite(db, SESSION_A, pizza.id)).toBe(true);
    expect(await isFavorite(db, SESSION_B, pizza.id)).toBe(false);
    expect((await listFavoriteRecipes(db, SESSION_A)).map((r) => r.slug)).toEqual(["margherita-pizza"]);

    await setFavorite(db, SESSION_A, pizza.id, false);
    expect(await listFavoriteRecipes(db, SESSION_A)).toHaveLength(0);
  });

  it("upserts one rating per session and averages across sessions", async () => {
    const momo = (await getRecipeBySlug(db, "chicken-momo"))!;
    await setRating(db, SESSION_A, momo.id, 3);
    await setRating(db, SESSION_A, momo.id, 5);
    await setRating(db, SESSION_B, momo.id, 4);
    expect(await getUserRating(db, SESSION_A, momo.id)).toBe(5);
    expect(await getRatingSummary(db, momo.id)).toEqual({ average: 4.5, count: 2 });
  });

  it("enforces the 1–5 star range in the database", async () => {
    const momo = (await getRecipeBySlug(db, "chicken-momo"))!;
    await expect(setRating(db, SESSION_A, momo.id, 9)).rejects.toThrow();
  });

  it("keeps favorites when recipes are reseeded", async () => {
    const falafel = (await getRecipeBySlug(db, "falafel"))!;
    await setFavorite(db, SESSION_B, falafel.id, true);
    await seed(db);
    expect(await isFavorite(db, SESSION_B, falafel.id)).toBe(true);
  });
});

describe("newsletter", () => {
  it("stores each address once", async () => {
    expect(await subscribeToNewsletter(db, "cook@example.com")).toBe(true);
    expect(await subscribeToNewsletter(db, "cook@example.com")).toBe(false);
  });
});
