import { CardReveal } from "@/components/motion/card-reveal";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { SectionHeading } from "./section-heading";

export function QuickMeals({ recipes }: { recipes: RecipeCardData[] }) {
  return (
    <section aria-labelledby="quick-title" className="py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          id="quick-title"
          index="03"
          label="Weeknights"
          title="Quick meals under 30 minutes"
          description="Weeknight dinners, start to finish — prep included."
          action={{ href: "/recipes?time=under-30", label: "See all quick meals" }}
        />
        <CardReveal className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((r) => (
            <li key={r.slug}>
              <RecipeCard recipe={r} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 90vw" />
            </li>
          ))}
        </CardReveal>
      </div>
    </section>
  );
}
