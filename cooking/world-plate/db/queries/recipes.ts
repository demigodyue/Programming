import { and, asc, desc, eq, exists, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import type { Database } from "../client";
import { cuisines, ingredients, recipeTags, recipes, steps, type Difficulty } from "../schema";
import { cuisinesJa } from "@/data/cuisines.ja";
import { recipesJa } from "@/data/recipes.ja";
import type { RecipeSearch } from "@/lib/validation";

export type RecipeCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servings: number;
  difficulty: Difficulty;
  vegetarian: boolean;
  cuisineSlug: string;
  cuisineName: string;
  /** The Japanese edition of the card's text (data/recipes.ja.ts, data/cuisines.ja.ts). */
  ja: { title: string; description: string; imageAlt: string; cuisineName: string };
};

export type Ingredient = {
  section: string | null;
  amount: number | null;
  unit: string | null;
  item: string;
  note: string | null;
};

export type IngredientJa = { section: string | null; item: string; note: string | null; counter: string };

export type RecipeDetail = Omit<RecipeCard, "ja"> & {
  origin: string;
  story: string;
  country: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  ja: RecipeCard["ja"] & { origin: string; story: string; country: string; ingredients: IngredientJa[]; steps: string[] };
};

type CardRow = Omit<RecipeCard, "ja">;

/** Japanese for a card. Missing translations fall back to English (the unit test keeps them complete). */
function cardJa(row: CardRow): RecipeCard["ja"] {
  const r = recipesJa[row.slug];
  return {
    title: r?.title ?? row.title,
    description: r?.description ?? row.description,
    imageAlt: r?.imageAlt ?? row.imageAlt,
    cuisineName: cuisinesJa[row.cuisineSlug]?.name ?? row.cuisineName,
  };
}

const withJa = (rows: CardRow[]): RecipeCard[] => rows.map((row) => ({ ...row, ja: cardJa(row) }));

const totalMinutes = sql<number>`${recipes.prepMinutes} + ${recipes.cookMinutes}`;

const cardColumns = {
  id: recipes.id,
  slug: recipes.slug,
  title: recipes.title,
  description: recipes.description,
  image: recipes.image,
  imageAlt: recipes.imageAlt,
  prepMinutes: recipes.prepMinutes,
  cookMinutes: recipes.cookMinutes,
  totalMinutes: totalMinutes.mapWith(Number),
  servings: recipes.servings,
  difficulty: recipes.difficulty,
  vegetarian: recipes.vegetarian,
  cuisineSlug: recipes.cuisineSlug,
  cuisineName: cuisines.name,
};

function cardQuery(db: Database) {
  return db.select(cardColumns).from(recipes).innerJoin(cuisines, eq(recipes.cuisineSlug, cuisines.slug));
}

/** Escape LIKE wildcards so user input is matched literally (used with ESCAPE '\'). */
export function likePattern(input: string) {
  return `%${input.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function like(column: SQL | typeof recipes.title, pattern: string) {
  return sql`${column} LIKE ${pattern} ESCAPE '\\'`;
}

export async function searchRecipes(db: Database, filters: RecipeSearch): Promise<RecipeCard[]> {
  const where: SQL[] = [];

  if (filters.q) {
    const p = likePattern(filters.q);
    where.push(
      or(
        like(recipes.title, p),
        like(sql`${recipes.description}`, p),
        like(sql`${cuisines.name}`, p),
        exists(
          db
            .select({ one: sql`1` })
            .from(recipeTags)
            .where(and(eq(recipeTags.recipeId, recipes.id), like(sql`${recipeTags.tag}`, p))),
        ),
        exists(
          db
            .select({ one: sql`1` })
            .from(ingredients)
            .where(and(eq(ingredients.recipeId, recipes.id), like(sql`${ingredients.item}`, p))),
        ),
      )!,
    );
  }
  if (filters.cuisine.length) where.push(inArray(recipes.cuisineSlug, filters.cuisine));
  if (filters.difficulty) where.push(eq(recipes.difficulty, filters.difficulty));
  if (filters.vegetarian) where.push(eq(recipes.vegetarian, true));
  if (filters.time === "under-30") where.push(sql`${totalMinutes} <= 30`);
  if (filters.time === "30-60") where.push(sql`${totalMinutes} > 30 AND ${totalMinutes} <= 60`);
  if (filters.time === "over-60") where.push(sql`${totalMinutes} > 60`);

  return cardQuery(db)
    .where(and(...where))
    .orderBy(desc(recipes.trending), asc(recipes.title))
    .then(withJa);
}

export async function listTrendingRecipes(db: Database, limit = 8) {
  return cardQuery(db).where(eq(recipes.trending, true)).orderBy(asc(recipes.id)).limit(limit).then(withJa);
}

export async function listQuickRecipes(db: Database, maxMinutes = 30, limit = 6) {
  return cardQuery(db)
    .where(sql`${totalMinutes} <= ${maxMinutes}`)
    .orderBy(asc(totalMinutes), asc(recipes.title))
    .limit(limit)
    .then(withJa);
}

export async function listRecipesByCuisine(db: Database, cuisineSlug: string) {
  return cardQuery(db).where(eq(recipes.cuisineSlug, cuisineSlug)).orderBy(asc(recipes.title)).then(withJa);
}

export async function listRecipeSlugs(db: Database) {
  return db.select({ slug: recipes.slug, createdAt: recipes.createdAt }).from(recipes).orderBy(asc(recipes.slug));
}

export async function getRecipeBySlug(db: Database, slug: string): Promise<RecipeDetail | null> {
  const [row] = await db
    .select({ ...cardColumns, origin: recipes.origin, story: recipes.story, country: cuisines.country })
    .from(recipes)
    .innerJoin(cuisines, eq(recipes.cuisineSlug, cuisines.slug))
    .where(eq(recipes.slug, slug))
    .limit(1);
  if (!row) return null;

  const [ingredientRows, stepRows, tagRows] = await Promise.all([
    db
      .select({
        section: ingredients.section,
        amount: ingredients.amount,
        unit: ingredients.unit,
        item: ingredients.item,
        note: ingredients.note,
      })
      .from(ingredients)
      .where(eq(ingredients.recipeId, row.id))
      .orderBy(asc(ingredients.position)),
    db.select({ text: steps.text }).from(steps).where(eq(steps.recipeId, row.id)).orderBy(asc(steps.position)),
    db.select({ tag: recipeTags.tag }).from(recipeTags).where(eq(recipeTags.recipeId, row.id)).orderBy(asc(recipeTags.tag)),
  ]);

  const ja = recipesJa[row.slug];
  const cuisineJa = cuisinesJa[row.cuisineSlug];
  return {
    ...row,
    ingredients: ingredientRows,
    steps: stepRows.map((s) => s.text),
    tags: tagRows.map((t) => t.tag),
    ja: {
      ...cardJa(row),
      origin: ja?.origin ?? row.origin,
      story: ja?.story ?? row.story,
      country: cuisineJa?.country ?? row.country,
      ingredients: ingredientRows.map((ing, i) => {
        const entry = ja?.ingredients[i];
        const [item, note, counter] = typeof entry === "string" ? [entry] : (entry ?? [ing.item, ing.note ?? undefined]);
        return {
          section: ing.section ? (ja?.sections?.[ing.section] ?? ing.section) : null,
          item,
          note: note ?? null,
          counter: counter ?? "個",
        };
      }),
      steps: stepRows.map((s, i) => ja?.steps[i] ?? s.text),
    },
  };
}

/** Same-cuisine dishes first, then dishes sharing the most tags. */
export async function listRelatedRecipes(db: Database, recipe: Pick<RecipeDetail, "id" | "cuisineSlug">, limit = 3) {
  const sharedTags = sql<number>`(
    SELECT count(*) FROM ${recipeTags} rt
    WHERE rt.recipe_id = ${recipes.id}
      AND rt.tag IN (SELECT tag FROM ${recipeTags} WHERE recipe_id = ${recipe.id})
  )`;
  return cardQuery(db)
    .where(ne(recipes.id, recipe.id))
    .orderBy(desc(sql`${recipes.cuisineSlug} = ${recipe.cuisineSlug}`), desc(sharedTags), asc(recipes.title))
    .limit(limit)
    .then(withJa);
}

export async function getRecipeIdBySlug(db: Database, slug: string) {
  const [row] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.slug, slug)).limit(1);
  return row?.id ?? null;
}

