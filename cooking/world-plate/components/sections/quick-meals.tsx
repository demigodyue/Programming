import SocialCards from "@/components/ui/card-fan-carousel";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";
import { SectionHeading } from "./section-heading";

/**
 * Weeknight dishes as a fanned hand of cards (the user's card fan carousel): they spring out of a pile into the fan
 * when the section comes into view, and hovering a card lifts it while its neighbours lean away.
 */
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
      </div>
      <SocialCards
        cards={recipes.map((r) => ({
          imgUrl: r.image,
          alt: r.imageAlt,
          linkUrl: `/recipes/${r.slug}`,
          title: r.title,
          meta: formatMinutes(r.totalMinutes),
        }))}
      />
    </section>
  );
}
