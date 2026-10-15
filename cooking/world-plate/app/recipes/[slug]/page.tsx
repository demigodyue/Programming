import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition, type CSSProperties } from "react";
import { CountUp } from "@/components/motion/count-up";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { RecipeActions } from "@/components/recipe/recipe-actions";
import { RecipeCard, recipeImageTransitionName } from "@/components/recipe/recipe-card";
import { RecipeKitchen } from "@/components/recipe/recipe-kitchen";
import { SectionHeading } from "@/components/sections/section-heading";
import { db } from "@/db/db";
import { getRecipeBySlug, listRecipeSlugs, listRelatedRecipes } from "@/db/queries/recipes";
import { recipeJsonLd, serializeJsonLd } from "@/lib/json-ld";
import { unsplashSized } from "@/lib/site";

const difficultyLabel = { easy: "Easy", medium: "Medium", hard: "Challenging" } as const;

export async function generateStaticParams() {
  return (await listRecipeSlugs(db)).map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const recipe = await getRecipeBySlug(db, (await params).slug);
  if (!recipe) return {};
  const title = `${recipe.title} (${recipe.cuisineName})`;
  return {
    title,
    description: recipe.description,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      type: "article",
      title,
      description: recipe.description,
      url: `/recipes/${recipe.slug}`,
      images: [{ url: unsplashSized(recipe.image, 1200, 630), width: 1200, height: 630, alt: recipe.imageAlt }],
    },
    twitter: { card: "summary_large_image", title, description: recipe.description, images: [unsplashSized(recipe.image, 1200, 630)] },
  };
}

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const recipe = await getRecipeBySlug(db, (await params).slug);
  if (!recipe) notFound();
  const related = await listRelatedRecipes(db, recipe, 3);

  const stats = [
    { label: "Prep", value: <CountUp value={recipe.prepMinutes} format="duration" /> },
    { label: "Cook", value: <CountUp value={recipe.cookMinutes} format="duration" /> },
    { label: "Serves", value: <CountUp value={recipe.servings} /> },
    { label: "Effort", value: difficultyLabel[recipe.difficulty] },
  ];

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(recipeJsonLd(recipe)) }} />

      <article>
        <header className="container-page pt-28 md:pt-36">
          <Link
            href="/recipes"
            className="label-caps text-muted-foreground hover-fine:text-foreground inline-flex min-h-11 items-center gap-2 transition-colors"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
            All recipes
          </Link>

          <div className="mt-4 grid items-center gap-10 border-t pt-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <ViewTransition name={recipeImageTransitionName(recipe.slug)} share="morph" default="none">
                <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg lg:aspect-[4/5]">
                  <Image
                    src={recipe.image}
                    alt={recipe.imageAlt}
                    fill
                    loading="eager"
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    quality={55}
                    className="object-cover"
                  />
                </div>
              </ViewTransition>
            </div>
            <div className="lg:order-1">
                <p className="rise label-caps text-muted-foreground flex items-center gap-2" style={{ "--i": 0 } as CSSProperties}>
                  <span aria-hidden className="hex-outline text-foreground" />
                  <span>
                    From {recipe.origin}.{" "}
                    <Link href={`/cuisine/${recipe.cuisineSlug}`} className="text-foreground underline underline-offset-4">
                      More {recipe.cuisineName} dishes
                    </Link>
                  </span>
                </p>
                <WordReveal text={recipe.title} delay={0.08} className="mt-5 text-[clamp(3rem,8vw,5.875rem)] leading-[0.9]" />
                <p className="rise text-muted-foreground mt-6 max-w-xl text-base leading-relaxed sm:text-lg" style={{ "--i": 2 } as CSSProperties}>
                  {recipe.description}
                </p>
                <div className="rise" style={{ "--i": 3 } as CSSProperties}>
                  <dl className="mt-8 grid max-w-xl grid-cols-2 border-y sm:grid-cols-4">
                    {stats.map((s) => (
                      <div key={s.label} className="py-4 pr-4 sm:not-first:border-l sm:not-first:pl-4">
                        <dt className="label-caps text-muted-foreground">{s.label}</dt>
                        <dd className="font-display mt-1 text-2xl font-medium">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {recipe.prepMinutes >= 60 && (
                    <p className="text-muted-foreground mt-2 text-sm">Prep includes resting, rising or marinating time.</p>
                  )}
                </div>
                <div className="rise mt-8" style={{ "--i": 4 } as CSSProperties}>
                  <RecipeActions slug={recipe.slug} />
                </div>
            </div>

          </div>
        </header>

        <div className="container-page py-20 md:py-28">
          <RecipeKitchen
            slug={recipe.slug}
            title={recipe.title}
            baseServings={recipe.servings}
            ingredients={recipe.ingredients}
            steps={recipe.steps}
          />
        </div>

        <section aria-labelledby="story-title" className="room">
          <Reveal className="container-page grid gap-6 py-20 md:grid-cols-[1fr_2fr] md:gap-16 md:py-28">
            <RevealItem as="h2" id="story-title" className="text-[clamp(2.5rem,6vw,3.25rem)] leading-none">
              The story of this dish
            </RevealItem>
            <RevealItem as="p" className="font-display max-w-[60ch] text-[1.375rem] leading-[1.5] text-pretty sm:text-[1.625rem]">
              {recipe.story}
            </RevealItem>
          </Reveal>
        </section>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-page py-20 md:py-28">
          <SectionHeading id="related-title" index="More" label={recipe.cuisineName} title="You might also cook" />
          <Reveal as="ul" className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RevealItem as="li" key={r.slug}>
                <RecipeCard recipe={r} />
              </RevealItem>
            ))}
          </Reveal>
        </section>
      )}
    </PageTransition>
  );
}
