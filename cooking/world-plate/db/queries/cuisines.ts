import { asc, count, eq } from "drizzle-orm";
import type { Database } from "../client";
import { cuisines, recipes } from "../schema";

export async function listCuisines(db: Database) {
  return db
    .select({
      slug: cuisines.slug,
      name: cuisines.name,
      country: cuisines.country,
      emoji: cuisines.emoji,
      image: cuisines.image,
      imageAlt: cuisines.imageAlt,
      recipeCount: count(recipes.id),
    })
    .from(cuisines)
    .leftJoin(recipes, eq(recipes.cuisineSlug, cuisines.slug))
    .groupBy(cuisines.slug)
    .orderBy(asc(cuisines.position));
}

export type CuisineSummary = Awaited<ReturnType<typeof listCuisines>>[number];

export async function getCuisine(db: Database, slug: string) {
  const [row] = await db.select().from(cuisines).where(eq(cuisines.slug, slug)).limit(1);
  return row ?? null;
}
