import { asc, count, eq } from "drizzle-orm";
import type { Database } from "../client";
import { cuisines, recipes } from "../schema";
import { cuisinesJa } from "@/data/cuisines.ja";

/** Japanese for a cuisine (data/cuisines.ja.ts); falls back to English if a translation is missing. */
function ja(row: { slug: string; name: string; country: string; intro: string; imageAlt: string }) {
  const j = cuisinesJa[row.slug];
  return {
    name: j?.name ?? row.name,
    country: j?.country ?? row.country,
    intro: j?.intro ?? row.intro,
    imageAlt: j?.imageAlt ?? row.imageAlt,
  };
}

export async function listCuisines(db: Database) {
  const rows = await db
    .select({
      slug: cuisines.slug,
      name: cuisines.name,
      country: cuisines.country,
      emoji: cuisines.emoji,
      intro: cuisines.intro,
      image: cuisines.image,
      imageAlt: cuisines.imageAlt,
      recipeCount: count(recipes.id),
    })
    .from(cuisines)
    .leftJoin(recipes, eq(recipes.cuisineSlug, cuisines.slug))
    .groupBy(cuisines.slug)
    .orderBy(asc(cuisines.position));
  return rows.map((row) => ({ ...row, ja: ja(row) }));
}

export type CuisineSummary = Awaited<ReturnType<typeof listCuisines>>[number];

export async function getCuisine(db: Database, slug: string) {
  const [row] = await db.select().from(cuisines).where(eq(cuisines.slug, slug)).limit(1);
  return row ? { ...row, ja: ja(row) } : null;
}
