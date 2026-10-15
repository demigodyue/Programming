import { and, asc, avg, count, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { cuisines, favorites, newsletterSubscribers, ratings, recipes, sessions } from "../schema";

/** Creates the anonymous session row on first write. No-op if it exists. */
export async function ensureSession(db: Database, sessionId: string) {
  await db.insert(sessions).values({ id: sessionId }).onConflictDoNothing();
}

/** Idempotent: sets the desired state rather than toggling, so double-submits are harmless. */
export async function setFavorite(db: Database, sessionId: string, recipeId: number, saved: boolean) {
  if (saved) {
    await ensureSession(db, sessionId);
    await db.insert(favorites).values({ sessionId, recipeId }).onConflictDoNothing();
  } else {
    await db.delete(favorites).where(and(eq(favorites.sessionId, sessionId), eq(favorites.recipeId, recipeId)));
  }
  return saved;
}

export async function isFavorite(db: Database, sessionId: string, recipeId: number) {
  const [row] = await db
    .select({ one: sql`1` })
    .from(favorites)
    .where(and(eq(favorites.sessionId, sessionId), eq(favorites.recipeId, recipeId)))
    .limit(1);
  return Boolean(row);
}

export async function listFavoriteRecipes(db: Database, sessionId: string) {
  return db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      title: recipes.title,
      description: recipes.description,
      image: recipes.image,
      imageAlt: recipes.imageAlt,
      prepMinutes: recipes.prepMinutes,
      cookMinutes: recipes.cookMinutes,
      totalMinutes: sql<number>`${recipes.prepMinutes} + ${recipes.cookMinutes}`.mapWith(Number),
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      vegetarian: recipes.vegetarian,
      cuisineSlug: recipes.cuisineSlug,
      cuisineName: cuisines.name,
    })
    .from(favorites)
    .innerJoin(recipes, eq(favorites.recipeId, recipes.id))
    .innerJoin(cuisines, eq(recipes.cuisineSlug, cuisines.slug))
    .where(eq(favorites.sessionId, sessionId))
    .orderBy(desc(favorites.createdAt), asc(recipes.title));
}

export async function setRating(db: Database, sessionId: string, recipeId: number, stars: number) {
  await ensureSession(db, sessionId);
  await db
    .insert(ratings)
    .values({ sessionId, recipeId, stars })
    .onConflictDoUpdate({
      target: [ratings.sessionId, ratings.recipeId],
      set: { stars, updatedAt: sql`(unixepoch())` },
    });
}

export async function getRatingSummary(db: Database, recipeId: number) {
  const [row] = await db
    .select({ average: avg(ratings.stars), count: count() })
    .from(ratings)
    .where(eq(ratings.recipeId, recipeId));
  return {
    average: row?.average == null ? null : Math.round(Number(row.average) * 10) / 10,
    count: row?.count ?? 0,
  };
}

export async function getUserRating(db: Database, sessionId: string, recipeId: number) {
  const [row] = await db
    .select({ stars: ratings.stars })
    .from(ratings)
    .where(and(eq(ratings.sessionId, sessionId), eq(ratings.recipeId, recipeId)))
    .limit(1);
  return row?.stars ?? null;
}

/** Returns false when the address was already on the list. */
export async function subscribeToNewsletter(db: Database, email: string) {
  const inserted = await db
    .insert(newsletterSubscribers)
    .values({ email })
    .onConflictDoNothing()
    .returning({ id: newsletterSubscribers.id });
  return inserted.length > 0;
}
