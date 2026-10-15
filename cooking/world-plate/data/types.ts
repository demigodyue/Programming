import { z } from "zod";
import { difficulties } from "@/db/schema";

const unsplash = z
  .string()
  .regex(/^https:\/\/images\.unsplash\.com\/photo-[\w-]+$/, "Use a bare Unsplash photo URL");

export const seedIngredientSchema = z.object({
  section: z.string().min(1).optional(),
  amount: z.number().positive().nullable(),
  unit: z.string().min(1).nullable(),
  item: z.string().min(1),
  note: z.string().min(1).optional(),
});

export const seedRecipeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  cuisine: z.string().min(1),
  origin: z.string().min(1),
  description: z.string().min(20).max(220),
  image: unsplash,
  imageAlt: z.string().min(10),
  /** Includes passive time such as marinating, rising or soaking. */
  prepMinutes: z.number().int().nonnegative(),
  cookMinutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  difficulty: z.enum(difficulties),
  vegetarian: z.boolean(),
  trending: z.boolean().default(false),
  tags: z.array(z.string().min(1)).min(1),
  ingredients: z.array(seedIngredientSchema).min(3),
  steps: z.array(z.string().min(10)).min(3),
  story: z.string().min(80),
});

export const seedCuisineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  country: z.string().min(1),
  emoji: z.string().min(1),
  intro: z.string().min(40),
  image: unsplash,
  imageAlt: z.string().min(10),
});

export type SeedIngredient = z.input<typeof seedIngredientSchema>;
export type SeedRecipe = z.input<typeof seedRecipeSchema>;
export type SeedCuisine = z.input<typeof seedCuisineSchema>;
