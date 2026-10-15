import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { db } from "@/db/db";
import { getCuisine, listCuisines } from "@/db/queries/cuisines";
import { listRecipesByCuisine } from "@/db/queries/recipes";
import { unsplashSized } from "@/lib/site";

export async function generateStaticParams() {
  return (await listCuisines(db)).map((c) => ({ name: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/cuisine/[name]">): Promise<Metadata> {
  const cuisine = await getCuisine(db, (await params).name);
  if (!cuisine) return {};
  const title = `${cuisine.name} recipes`;
  return {
    title,
    description: cuisine.intro,
    alternates: { canonical: `/cuisine/${cuisine.slug}` },
    openGraph: {
      title,
      description: cuisine.intro,
      url: `/cuisine/${cuisine.slug}`,
      images: [{ url: unsplashSized(cuisine.image, 1200, 630), width: 1200, height: 630, alt: cuisine.imageAlt }],
    },
  };
}

export default async function CuisinePage({ params }: PageProps<"/cuisine/[name]">) {
  const { name } = await params;
  const [cuisine, recipes, all] = await Promise.all([getCuisine(db, name), listRecipesByCuisine(db, name), listCuisines(db)]);
  if (!cuisine) notFound();
  const others = all.filter((c) => c.slug !== cuisine.slug);

  return (
    <PageTransition>
      <section aria-labelledby="cuisine-title" className="container-page pt-24">
        <div className="rise label-caps text-muted-foreground flex items-center justify-between">
          <Link href="/#cuisines" className="hover-fine:text-foreground inline-flex min-h-11 items-center gap-2 transition-colors">
            <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
            All cuisines
          </Link>
          <span>{cuisine.country}</span>
        </div>
        <div className="rule-draw flex flex-col items-center pt-12 pb-14 text-center md:pt-16 md:pb-20">
          <WordReveal
            id="cuisine-title"
            text={cuisine.name}
            className="text-[clamp(4rem,16vw,11rem)] leading-[0.84] tracking-[-0.02em]"
          />
          <p className="rise text-muted-foreground mt-8 max-w-xl text-base leading-relaxed sm:text-lg" style={{ "--delay": "450ms" } as CSSProperties}>
            {cuisine.intro}
          </p>
        </div>
      </section>
      <div className="frame-in bg-muted relative h-[62svh] overflow-hidden" style={{ "--delay": "200ms" } as CSSProperties}>
        <Image src={cuisine.image} alt={cuisine.imageAlt} fill loading="eager" fetchPriority="high" sizes="100vw" quality={60} className="object-cover" />
      </div>

      <section aria-label={`${cuisine.name} recipes`} className="container-page py-20 md:py-28">
        <p className="rule-draw label-caps text-muted-foreground mb-10 flex justify-between pt-4">
          <span>{recipes.length} {recipes.length === 1 ? "dish" : "dishes"}</span>
          <span>From {cuisine.country}</span>
        </p>
        <Reveal as="ul" className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RevealItem as="li" key={r.slug}>
              <RecipeCard recipe={r} headingLevel={2} />
            </RevealItem>
          ))}
        </Reveal>
      </section>

      <nav aria-labelledby="other-cuisines" className="room">
        <div className="container-page py-20 md:py-24">
        <h2 id="other-cuisines" className="mb-10 text-center text-[clamp(2.5rem,6vw,3.25rem)] leading-none">
          Keep exploring
        </h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {others.map((c) => (
            <li key={c.slug} className="sd-rise">
              <Link
                href={`/cuisine/${c.slug}`}
                className="hover-fine:bg-foreground hover-fine:text-background inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-200"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        </div>
      </nav>
    </PageTransition>
  );
}
