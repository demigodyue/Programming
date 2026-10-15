import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { cuisinesSeed } from "@/data/cuisines.seed";
import { recipesSeed } from "@/data/recipes.seed";
import { seedCuisineSchema, seedRecipeSchema } from "@/data/types";
import { createDatabase, type Database } from "./client";
import { cuisines, ingredients, recipeTags, recipes, steps } from "./schema";

/**
 * Upserts all seed content. Safe to run repeatedly: recipes are matched by slug so their
 * ids (and therefore favorites/ratings) survive, and child rows are replaced wholesale.
 */
export async function seed(db: Database) {
  const cuisineData = z.array(seedCuisineSchema).parse(cuisinesSeed);
  const recipeData = z.array(seedRecipeSchema).parse(recipesSeed);

  const cuisineSlugs = new Set(cuisineData.map((c) => c.slug));
  const unknown = recipeData.filter((r) => !cuisineSlugs.has(r.cuisine));
  if (unknown.length) {
    throw new Error(`Unknown cuisine on: ${unknown.map((r) => r.slug).join(", ")}`);
  }

  await db.transaction(async (tx) => {
    for (const [position, c] of cuisineData.entries()) {
      const row = { ...c, position };
      await tx.insert(cuisines).values(row).onConflictDoUpdate({ target: cuisines.slug, set: row });
    }

    for (const r of recipeData) {
      const row = {
        slug: r.slug,
        title: r.title,
        cuisineSlug: r.cuisine,
        origin: r.origin,
        description: r.description,
        image: r.image,
        imageAlt: r.imageAlt,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        servings: r.servings,
        difficulty: r.difficulty,
        vegetarian: r.vegetarian,
        trending: r.trending,
        story: r.story,
      };
      const [{ id }] = await tx
        .insert(recipes)
        .values(row)
        .onConflictDoUpdate({ target: recipes.slug, set: row })
        .returning({ id: recipes.id });

      await tx.delete(ingredients).where(eq(ingredients.recipeId, id));
      await tx.delete(steps).where(eq(steps.recipeId, id));
      await tx.delete(recipeTags).where(eq(recipeTags.recipeId, id));

      await tx.insert(ingredients).values(
        r.ingredients.map((ing, position) => ({
          recipeId: id,
          position,
          section: ing.section ?? null,
          amount: ing.amount,
          unit: ing.unit,
          item: ing.item,
          note: ing.note ?? null,
        })),
      );
      await tx.insert(steps).values(r.steps.map((text, position) => ({ recipeId: id, position, text })));
      await tx
        .insert(recipeTags)
        .values([...new Set(r.tags)].map((tag) => ({ recipeId: id, tag })));
    }
  });

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(recipes);
  return { cuisines: cuisineData.length, recipes: count };
}

// CLI entry: `npm run db:seed`
if (process.argv[1]?.replace(/\\/g, "/").endsWith("db/seed.ts")) {
  const { db, client } = createDatabase();
  seed(db)
    .then((r) => console.log(`Seeded ${r.cuisines} cuisines and ${r.recipes} recipes.`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => client.close());
}
