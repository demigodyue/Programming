import type { RecipeDetail } from "@/db/queries/recipes";
import { formatQuantity } from "./scale";
import { absoluteUrl, site, unsplashSized } from "./site";

const isoDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
};

/** schema.org/Recipe for rich results. Built only from our own seed data. */
export function recipeJsonLd(r: RecipeDetail, rating?: { average: number | null; count: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.title,
    description: r.description,
    image: [unsplashSized(r.image, 1200, 1200), unsplashSized(r.image, 1200, 900), unsplashSized(r.image, 1200, 675)],
    url: absoluteUrl(`/recipes/${r.slug}`),
    author: { "@type": "Organization", name: site.name },
    recipeCuisine: r.cuisineName,
    recipeCategory: "Main course",
    keywords: r.tags.join(", "),
    prepTime: isoDuration(r.prepMinutes),
    cookTime: isoDuration(r.cookMinutes),
    totalTime: isoDuration(r.totalMinutes),
    recipeYield: `${r.servings} servings`,
    ...(r.vegetarian ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
    recipeIngredient: r.ingredients.map((i) =>
      [formatQuantity(i.amount, i.unit, r.servings, r.servings), i.item, i.note ? `(${i.note})` : ""].filter(Boolean).join(" "),
    ),
    recipeInstructions: r.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
      url: absoluteUrl(`/recipes/${r.slug}#step-${i + 1}`),
    })),
    ...(rating?.average && rating.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, ratingCount: rating.count } }
      : {}),
  };
}

/** Serialise for a <script type="application/ld+json"> tag without allowing </script> breakouts. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
