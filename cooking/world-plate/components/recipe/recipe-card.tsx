import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { RecipeCard as RecipeCardData } from "@/db/queries/recipes";
import { formatMinutes } from "@/lib/scale";
import { cn } from "@/lib/utils";

export const recipeImageTransitionName = (slug: string) => `recipe-image-${slug}`;

const difficultyLabel = { easy: "Easy", medium: "Medium", hard: "Challenging" } as const;

type Props = {
  recipe: RecipeCardData;
  /**
   * Give the image a shared view-transition name so it morphs into the recipe hero.
   * Names must be unique on a page — turn this off when the same dish appears twice.
   */
  morph?: boolean;
  sizes?: string;
  className?: string;
  /** Load immediately — for cards in the first visible row. */
  eager?: boolean;
  /** Keep the document outline valid: 2 on pages where cards sit directly under the h1. */
  headingLevel?: 2 | 3;
};

/**
 * Flat bone card with a hairline edge — a wall label under a framed plate. No shadows.
 * Hover (fine pointers only): the image settles in slowly and the title underlines.
 */
export function RecipeCard({ recipe, morph = true, sizes, className, eager, headingLevel = 3 }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const image = (
    <Image
      src={recipe.image}
      alt={recipe.imageAlt}
      fill
      loading={eager ? "eager" : undefined}
      sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"}
      className="group-hover-fine:scale-[1.05] object-cover transition-transform duration-700 ease-(--ease-out)"
    />
  );

  return (
    <article className={cn("group relative h-full", className)}>
      <div className="bg-card text-card-foreground relative flex h-full flex-col overflow-hidden rounded-lg border group-has-focus-visible:outline-ring group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden">
          {morph ? (
            <ViewTransition name={recipeImageTransitionName(recipe.slug)} share="morph" default="none">
              <div className="absolute inset-0">{image}</div>
            </ViewTransition>
          ) : (
            image
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-6">
          <p className="label-caps text-muted-foreground flex items-center justify-between gap-3">
            <span>{recipe.cuisineName}</span>
            {recipe.vegetarian && <span>Vegetarian</span>}
          </p>
          <Heading className="text-[1.625rem] leading-[1.1] font-normal">
            <Link
              href={`/recipes/${recipe.slug}`}
              className="group-hover-fine:underline decoration-1 underline-offset-4 after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              {recipe.title}
            </Link>
          </Heading>
          <p className="text-muted-foreground line-clamp-2 text-[0.9375rem] leading-relaxed">{recipe.description}</p>
          <p className="mt-auto flex items-center gap-4 border-t pt-3 text-xs font-medium uppercase">
            <span>
              <span className="sr-only">Total time:</span>
              {formatMinutes(recipe.totalMinutes)}
            </span>
            <span aria-hidden className="hex-outline size-2" />
            <span>{difficultyLabel[recipe.difficulty]}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
