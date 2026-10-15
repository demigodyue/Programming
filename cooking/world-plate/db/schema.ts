import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const difficulties = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof difficulties)[number];

export const cuisines = sqliteTable("cuisines", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  emoji: text("emoji").notNull(),
  intro: text("intro").notNull(),
  image: text("image").notNull(),
  imageAlt: text("image_alt").notNull(),
  position: integer("position").notNull(),
});

export const recipes = sqliteTable(
  "recipes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    cuisineSlug: text("cuisine_slug")
      .notNull()
      .references(() => cuisines.slug, { onDelete: "restrict" }),
    origin: text("origin").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    imageAlt: text("image_alt").notNull(),
    prepMinutes: integer("prep_minutes").notNull(),
    cookMinutes: integer("cook_minutes").notNull(),
    servings: integer("servings").notNull(),
    difficulty: text("difficulty", { enum: difficulties }).notNull(),
    vegetarian: integer("vegetarian", { mode: "boolean" }).notNull(),
    trending: integer("trending", { mode: "boolean" }).notNull().default(false),
    story: text("story").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("recipes_slug_uq").on(t.slug),
    index("recipes_cuisine_idx").on(t.cuisineSlug),
    check("recipes_servings_ck", sql`${t.servings} > 0`),
    check("recipes_minutes_ck", sql`${t.prepMinutes} >= 0 AND ${t.cookMinutes} >= 0`),
  ],
);

export const recipeTags = sqliteTable(
  "recipe_tags",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.tag] }), index("recipe_tags_tag_idx").on(t.tag)],
);

export const ingredients = sqliteTable(
  "ingredients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    /** Optional sub-heading such as "For the broth". */
    section: text("section"),
    /** Null for "to taste" style ingredients. */
    amount: real("amount"),
    unit: text("unit"),
    item: text("item").notNull(),
    note: text("note"),
  },
  (t) => [uniqueIndex("ingredients_recipe_pos_uq").on(t.recipeId, t.position)],
);

export const steps = sqliteTable(
  "steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
  },
  (t) => [uniqueIndex("steps_recipe_pos_uq").on(t.recipeId, t.position)],
);

/**
 * Anonymous visitor sessions. Created lazily on the first write (favorite / rating).
 * `userId` is reserved for real accounts: when login lands, link sessions to users
 * instead of migrating every favorite/rating row.
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  createdAt: createdAt(),
});

export const favorites = sqliteTable(
  "favorites",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.recipeId] })],
);

export const ratings = sqliteTable(
  "ratings",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.recipeId] }),
    index("ratings_recipe_idx").on(t.recipeId),
    check("ratings_stars_ck", sql`${t.stars} BETWEEN 1 AND 5`),
  ],
);

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)],
);

export type Cuisine = typeof cuisines.$inferSelect;
export type RecipeRow = typeof recipes.$inferSelect;
export type IngredientRow = typeof ingredients.$inferSelect;
export type StepRow = typeof steps.$inferSelect;
