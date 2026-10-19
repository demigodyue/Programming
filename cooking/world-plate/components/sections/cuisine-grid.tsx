import type { CuisineSummary } from "@/db/queries/cuisines";
import { CuisineDeck } from "./cuisine-deck";
import { SectionHeading } from "./section-heading";

/**
 * The forest room: a display title, then the cuisines as a deck of flash cards that deals out with the scroll
 * (CuisineDeck).
 */
export function CuisineGrid({ cuisines }: { cuisines: CuisineSummary[] }) {
  return (
    <section id="cuisines" aria-labelledby="cuisines-title" className="room scroll-mt-16 py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="cuisines-title"
          index="02"
          label="The collection"
          title="Explore by cuisine"
          description="Ten kitchens, from Kathmandu street stalls to Parisian bakeries."
        />
        <CuisineDeck cuisines={cuisines} />
      </div>
    </section>
  );
}
