import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import type { CuisineSummary } from "@/db/queries/cuisines";
import { SectionHeading } from "./section-heading";

/**
 * The dark room: a centred serif title, then circular vignettes — serif caption above,
 * a round crop of the dish, a hexagon marker and the count below.
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
        <Reveal as="ul" className="grid grid-cols-2 gap-x-7 gap-y-14 sm:grid-cols-3 lg:grid-cols-5">
          {cuisines.map((c) => (
            <RevealItem as="li" key={c.slug}>
              <Link
                href={`/cuisine/${c.slug}`}
                className="group flex flex-col items-center gap-4 text-center focus-visible:outline-offset-8"
              >
                <h3 className="text-[1.375rem] leading-tight font-normal">{c.name}</h3>
                <span className="bg-muted relative block aspect-square w-full max-w-[200px] overflow-hidden rounded-full">
                  <Image
                    src={c.image}
                    alt={c.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                    className="group-hover-fine:scale-[1.08] object-cover transition-transform duration-700 ease-(--ease-out)"
                  />
                </span>
                <span className="label-caps text-muted-foreground flex items-center gap-2">
                  <span
                    aria-hidden
                    className="hex-outline text-foreground group-hover-fine:rotate-[120deg] transition-transform duration-500 ease-(--ease-out)"
                  />
                  {c.recipeCount} {c.recipeCount === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
