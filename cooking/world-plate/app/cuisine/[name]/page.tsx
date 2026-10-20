import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { T } from "@/components/i18n";
import { LImage } from "@/components/i18n-image";
import { CardReveal } from "@/components/motion/card-reveal";
import { FlipFace, flipClass, type FlipAccent } from "@/components/motion/flip-face";
import { ScrubWords } from "@/components/motion/scrub-words";
import { SlantText } from "@/components/motion/slant-text";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { db } from "@/db/db";
import { getCuisine, listCuisines } from "@/db/queries/cuisines";
import { listRecipesByCuisine } from "@/db/queries/recipes";
import { unsplashSized } from "@/lib/site";

const ACCENTS: FlipAccent[] = ["yellow", "mint", "lavender", "orange", "blue"];

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
    <>
      <section aria-labelledby="cuisine-title" className="hero-content container-page pt-24">
        <div className="load-stagger label-caps text-muted-foreground flex items-center justify-between" style={{ "--i": 0 } as CSSProperties}>
          <Link href="/#cuisines" className="hover-fine:text-foreground inline-flex min-h-11 items-center gap-2 transition-colors">
            <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
            <T en="All cuisines" ja="すべての国" />
          </Link>
          <span>
            <T en={cuisine.country} ja={cuisine.ja.country} />
          </span>
        </div>
        <div data-icon-scope className="rule-draw relative isolate flex flex-col items-center pt-12 pb-14 text-center md:pt-16 md:pb-20">
          <SlantText
            as="h1"
            mode="load"
            id="cuisine-title"
            text={cuisine.name}
            ja={cuisine.ja.name}
            className="block text-[clamp(4rem,16vw,11rem)] leading-[0.84] tracking-[-0.02em]"
          />
          <p className="load-stagger text-muted-foreground mt-8 max-w-xl text-base leading-relaxed sm:text-lg" style={{ "--i": 1 } as CSSProperties}>
            <T en={cuisine.intro} ja={cuisine.ja.intro} />
          </p>
        </div>
      </section>
      <div className="load-fade bg-muted relative h-[62svh] overflow-hidden">
        <LImage src={cuisine.image} alt={cuisine.imageAlt} altJa={cuisine.ja.imageAlt} fill loading="eager" fetchPriority="high" sizes="100vw" quality={60} className="object-cover" />
      </div>

      <section aria-labelledby="cuisine-title" className="container-page py-20 md:py-28">
        <p className="rule-draw label-caps text-muted-foreground mb-10 flex justify-between pt-4">
          <span>
            <T en={`${recipes.length} ${recipes.length === 1 ? "dish" : "dishes"}`} ja={`${recipes.length}品`} />
          </span>
          <span>
            <T en={`From ${cuisine.country}`} ja={`${cuisine.ja.country}から`} />
          </span>
        </p>
        <CardReveal className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <li key={r.slug}>
              <RecipeCard recipe={r} headingLevel={2} />
            </li>
          ))}
        </CardReveal>
      </section>

      <nav aria-labelledby="other-cuisines" className="room">
        <div className="container-page py-20 md:py-24">
        <ScrubWords id="other-cuisines" text="Keep exploring" ja="ほかの国も|のぞいてみよう" className="mb-10 block text-center text-[clamp(2.5rem,6vw,3.25rem)] leading-none" />
        <ul className="flex flex-wrap justify-center gap-2">
          {others.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/cuisine/${c.slug}`} data-accent={ACCENTS[i % ACCENTS.length]} className={flipClass("outline")}>
                <FlipFace>
                  <T en={c.name} ja={c.ja.name} />
                </FlipFace>
              </Link>
            </li>
          ))}
        </ul>
        </div>
      </nav>
    </>
  );
}
