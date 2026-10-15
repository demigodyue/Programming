import { z } from "zod";
import { difficulties } from "@/db/schema";

export const timeFilters = ["under-30", "30-60", "over-60"] as const;
export type TimeFilter = (typeof timeFilters)[number];

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60);

/** First value of a search param that may arrive as string | string[]. */
const single = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/**
 * Search params for /recipes. Invalid values are dropped rather than throwing,
 * so a hand-edited URL degrades to "no filter" instead of an error page.
 */
export const recipeSearchSchema = z.object({
  q: z.preprocess(
    single,
    z
      .string()
      .transform((s) => s.replace(/\s+/g, " ").trim().slice(0, 80))
      .optional()
      .catch(undefined),
  ),
  cuisine: z.preprocess(
    (v) => {
      const raw = Array.isArray(v) ? v.join(",") : v;
      return typeof raw === "string" && raw ? raw.split(",").slice(0, 10) : [];
    },
    z.array(slug).catch([]),
  ),
  difficulty: z.preprocess(single, z.enum(difficulties).optional().catch(undefined)),
  time: z.preprocess(single, z.enum(timeFilters).optional().catch(undefined)),
  vegetarian: z.preprocess((v) => single(v) === "1" || single(v) === "true", z.boolean()),
});

export type RecipeSearch = z.output<typeof recipeSearchSchema>;

export function parseRecipeSearch(params: Record<string, string | string[] | undefined>): RecipeSearch {
  const parsed = recipeSearchSchema.parse(params);
  return { ...parsed, q: parsed.q || undefined };
}

export const sessionIdSchema = z.uuid();

export const favoriteInputSchema = z.object({
  slug,
  saved: z.boolean(),
});

export const ratingInputSchema = z.object({
  slug,
  stars: z.number().int().min(1).max(5),
});

export const newsletterInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ message: "Enter a valid email address, like name@example.com." })),
  // Honeypot: real people never see or fill this field.
  company: z.string().max(0).optional().or(z.literal("")),
});
