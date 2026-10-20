import Link from "next/link";
import { Difficulty, Minutes, T } from "@/components/i18n";
import { LImage } from "@/components/i18n-image";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { cn } from "@/lib/utils";

type Props = {
  recipe: RecipeCardData;
  sizes?: string;
  className?: string;
  /** Load immediately — for cards in the first visible row. */
  eager?: boolean;
  /** Keep the document outline valid: 2 on pages where cards sit directly under the h1. */
  headingLevel?: 2 | 3;
};

/**
 * Flat burgundy card with a black hairline edge. No shadows. The photo settles inside its frame as the
 * card crosses the viewport (Cult Eats' image zoom, .scroll-zoom).
 * Hover (fine pointers only): the card lifts on Slush's elastic curve and the title underlines.
 */
export function RecipeCard({ recipe, sizes, className, eager, headingLevel = 3 }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article data-cursor="View recipe" className={cn("group relative h-full", className)}>
      <div className="bg-card text-card-foreground group-hover-fine:-translate-y-1.5 relative flex h-full flex-col overflow-hidden rounded-lg border transition-[translate] duration-500 ease-(--ease-slush-bounce) group-has-focus-visible:outline-ring group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2">
        <div className="bg-muted relative aspect-4/3 overflow-hidden">
          <LImage
            src={recipe.image}
            alt={recipe.imageAlt}
            altJa={recipe.ja.imageAlt}
            fill
            loading={eager ? "eager" : undefined}
            sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"}
            className="scroll-zoom object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-6">
          <p className="label-caps text-muted-foreground flex items-center justify-between gap-3">
            <span>
              <T en={recipe.cuisineName} ja={recipe.ja.cuisineName} />
            </span>
            {recipe.vegetarian && (
              <span>
                <T en="Vegetarian" ja="ベジタリアン" />
              </span>
            )}
          </p>
          <Heading className="text-[1.625rem] leading-[1.1] font-normal">
            <Link
              href={`/recipes/${recipe.slug}`}
              className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              <span className="link-group">
                <T en={recipe.title} ja={recipe.ja.title} />
              </span>
            </Link>
          </Heading>
          <p className="text-muted-foreground line-clamp-2 text-[0.9375rem] leading-relaxed">
            <T en={recipe.description} ja={recipe.ja.description} />
          </p>
          <p className="mt-auto flex items-center gap-4 border-t pt-3 text-xs font-medium uppercase">
            <span>
              <span className="sr-only">
                <T en="Total time:" ja="合計時間：" />
              </span>
              <Minutes m={recipe.totalMinutes} />
            </span>
            <span aria-hidden className="hex-outline size-2" />
            <span>
              <Difficulty d={recipe.difficulty} />
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
