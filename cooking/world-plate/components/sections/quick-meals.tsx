import type { CSSProperties } from "react";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { SectionHeading } from "./section-heading";

// Where each card starts in the fan: pulled toward the middle, dropped and tilted. They straighten into the row
// as the section scrolls in (.scrub-fan, scrubbed by its view timeline).
const FAN = [
  { fx: "14vw", fy: "26vh", fr: "-14deg" },
  { fx: "5vw", fy: "16vh", fr: "-5deg" },
  { fx: "-5vw", fy: "16vh", fr: "5deg" },
  { fx: "-14vw", fy: "26vh", fr: "14deg" },
];

export function QuickMeals({ recipes }: { recipes: RecipeCardData[] }) {
  return (
    <section aria-labelledby="quick-title" className="overflow-x-clip py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          id="quick-title"
          index="03"
          label="Weeknights"
          title="Quick meals under 30 minutes"
          description="Weeknight dinners, start to finish — prep included."
          action={{ href: "/recipes?time=under-30", label: "See all quick meals" }}
        />
        <ul className="scrub-fan grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((r, i) => {
            const f = FAN[i % FAN.length];
            return (
              <li key={r.slug} style={{ "--fx": f.fx, "--fy": f.fy, "--fr": f.fr } as CSSProperties}>
                <RecipeCard recipe={r} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 90vw" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
