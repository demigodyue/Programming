import Image from "next/image";
import Link from "next/link";
import { CardReveal } from "@/components/motion/card-reveal";
import type { CuisineSummary } from "@/db/queries/cuisines";
import { SectionHeading } from "./section-heading";

const BLOBS = ["mask-blob-1", "mask-blob-2", "mask-blob-3", "mask-blob-4"];

/**
 * The dark room: a centred display title, then vignettes — caption above, a blob-cut crop of the dish
 * (Cult Eats' mask shapes, cycling through four), a hexagon marker and the count below. The row flies in like Slush's cards; hovering a
 * vignette sinks the photo to 0.92 on the elastic curve (Slush's footer tiles).
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
        <CardReveal className="grid grid-cols-2 gap-x-7 gap-y-14 sm:grid-cols-3 lg:grid-cols-5">
          {cuisines.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/cuisine/${c.slug}`} className="group flex flex-col items-center gap-4 text-center focus-visible:outline-offset-8">
                <h3 className="link-group text-[1.625rem] leading-tight font-normal">{c.name}</h3>
                <span
                  data-cursor="Explore"
                  className={`tile-press-group bg-muted relative block aspect-square w-full max-w-[200px] overflow-hidden ${BLOBS[i % BLOBS.length]}`}
                >
                  <Image
                    src={c.image}
                    alt={c.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                    className="object-cover"
                  />
                </span>
                <span className="label-caps text-muted-foreground flex items-center gap-2">
                  <span aria-hidden className="hex-outline text-foreground" />
                  {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            </li>
          ))}
        </CardReveal>
      </div>
    </section>
  );
}
