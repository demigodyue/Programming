import { ScrubWords } from "@/components/motion/scrub-words";

/**
 * The about paragraph, set large in Anton. It fills word by word as you scroll (Hungry Tiger's scrub,
 * ScrubWords). Keywords switch to the headline colour.
 */
export function Manifesto({ recipeCount, cuisineCount }: { recipeCount: number; cuisineCount: number }) {
  const copy =
    `World Plate is a kitchen atlas. ${recipeCount} famous dishes from ${cuisineCount} cuisines — ramen from Japan, momo from Nepal, carbonara from Rome — ` +
    "each written up properly, with real ingredients, honest timings and the story behind the plate. Pick one tonight and cook it the way it is cooked at home.";

  return (
    <section aria-labelledby="manifesto-label" className="container-page py-28 md:py-40">
      <div className="rule-draw label-caps text-muted-foreground mb-14 flex justify-between pt-4">
        <span id="manifesto-label">[ About ]</span>
        <span>World Plate</span>
      </div>
      <ScrubWords
        as="p"
        text={copy}
        em={["ramen", "momo", "carbonara", "story"]}
        className="mx-auto max-w-[30ch] text-center font-display text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15]"
      />
    </section>
  );
}
