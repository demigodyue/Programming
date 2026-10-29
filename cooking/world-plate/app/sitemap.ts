import type { MetadataRoute } from "next";
import { db } from "@/db/db";
import { listCuisines } from "@/db/queries/cuisines";
import { listRecipeSlugs } from "@/db/queries/recipes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, cuisines] = await Promise.all([listRecipeSlugs(db), listCuisines(db)]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/recipes"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...cuisines.map((c) => ({ url: absoluteUrl(`/cuisine/${c.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...recipes.map((r) => ({
      url: absoluteUrl(`/recipes/${r.slug}`),
      lastModified: r.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
