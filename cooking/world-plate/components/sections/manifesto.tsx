"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";
import { Scramble } from "@/components/motion/scramble";

type Word = { text: string; key?: boolean };

/**
 * svz.io's scroll-scrubbed manifesto: every word starts dim and lights up in reading order as
 * you scroll; keywords are set in the serif italic. Progress is written to one CSS variable
 * (`--p`) and each word derives its own opacity from it — no per-word React state.
 * Reduced motion / no JS: the paragraph is simply fully lit.
 */
export function Manifesto({ recipeCount, cuisineCount }: { recipeCount: number; cuisineCount: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const write = (p: number) => ref.current?.style.setProperty("--p", p.toFixed(4));
  useMotionValueEvent(scrollYProgress, "change", write);
  // Set the starting state once mounted (the server render is fully lit, for no-JS readers).
  useEffect(() => write(scrollYProgress.get()));

  const copy =
    `World Plate is a kitchen atlas. ${recipeCount} famous dishes from ${cuisineCount} cuisines — *ramen* from Japan, *momo* from Nepal, *carbonara* from Rome — ` +
    "each written up properly, with real ingredients, honest timings and the *story* behind the plate. Pick one tonight and cook it the way it is cooked at home.";
  const words: Word[] = copy.split(" ").map((w) => (w.startsWith("*") ? { text: w.replace(/\*/g, ""), key: true } : { text: w }));

  return (
    <section aria-labelledby="manifesto-label" className="container-page py-28 md:py-40">
      <div className="rule-draw label-caps text-muted-foreground mb-14 flex justify-between pt-4">
        <span id="manifesto-label">
          <Scramble text="[ About ]" />
        </span>
        <Scramble text="Read as you scroll" />
      </div>
      <p
        ref={ref}
        className="manifesto mx-auto max-w-[30ch] text-center font-display text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15]"
        style={{ "--n": words.length } as CSSProperties}
      >
        {words.map((w, i) => (
          <span key={i}>
            <span className="manifesto-word" style={{ "--i": i } as CSSProperties}>
              {w.key ? <em className="font-normal">{w.text}</em> : w.text}
            </span>{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
