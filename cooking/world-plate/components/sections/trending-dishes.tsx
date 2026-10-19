"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { FlipFace, flipClass, TextLinkLine, type FlipAccent } from "@/components/motion/flip-face";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { SlantText } from "@/components/motion/slant-text";
import type { RecipeCard } from "@/db/queries/recipes";

// Slush gives every tab its own frame colour (data-visual-bg); it shows while the photos swap.
const FRAMES = ["--slush-lavender", "--slush-yellow", "--slush-mint", "--slush-blue", "--slush-orange"];
const ACCENTS: FlipAccent[] = ["lavender", "yellow", "mint", "blue", "orange"];
const SWAP_MS = 1000; // a tab change can't be interrupted (Slush ignores clicks mid-swap)
const PILL_EASE = "cubic-bezier(0.65, 0.05, 0, 1)";

/**
 * Slush's tab system (initTabSystem) holding this week's five trending dishes.
 * - The highlight pill follows the hovered tab and settles back on the active one (Flip, 0.5s slush).
 * - Changing tab: the old text slides off -15% and the old photo drops 10% as they fade; the new title's
 *   characters slide in from -0.35em starting with the last; the paragraph and button follow from -3em;
 *   the new photo rises 10% into a frame that has turned the tab's colour. 0.65s, "slush" throughout.
 * - Like Slush, it moves on to the second dish by itself when the panel reaches 75% of the viewport.
 */
export function TrendingDishes({ recipes }: { recipes: RecipeCard[] }) {
  const rows = recipes.slice(0, 5);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [pillAt, setPillAt] = useState(0);
  const activeRef = useRef(0);
  const busy = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const content = useRef<HTMLDivElement>(null);

  const select = useCallback((i: number) => {
    if (busy.current || i === activeRef.current) return;
    busy.current = true;
    setLeaving(activeRef.current);
    activeRef.current = i;
    setActive(i);
    setPillAt(i);
    window.setTimeout(() => (busy.current = false), SWAP_MS);
  }, []);

  // Move the pill: Flip from wherever it is now (mid-flight included) to the target tab.
  const placePill = useCallback((i: number, animate: boolean) => {
    const el = pill.current;
    const box = list.current;
    const tab = tabs.current[i];
    if (!el || !box || !tab) return;
    const origin = box.getBoundingClientRect();
    const now = el.getBoundingClientRect();
    const to = { x: tab.offsetLeft, y: tab.offsetTop, w: tab.offsetWidth, h: tab.offsetHeight };
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = `translate(${to.x}px, ${to.y}px)`;
    el.style.width = `${to.w}px`;
    el.style.height = `${to.h}px`;
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches || now.width === 0) return;
    el.animate(
      [
        { transform: `translate(${now.left - origin.left}px, ${now.top - origin.top}px)`, width: `${now.width}px`, height: `${now.height}px` },
        { transform: `translate(${to.x}px, ${to.y}px)`, width: `${to.w}px`, height: `${to.h}px` },
      ],
      { duration: 500, easing: PILL_EASE },
    );
  }, []);

  const firstPlace = useRef(true);
  const pillAtRef = useRef(0);
  useLayoutEffect(() => {
    pillAtRef.current = pillAt;
    placePill(pillAt, !firstPlace.current);
    firstPlace.current = false;
  }, [pillAt, placePill]);

  // Keep the pill on its tab when the tab row reflows (resize, fonts).
  useEffect(() => {
    const box = list.current;
    if (!box) return;
    const ro = new ResizeObserver(() => placePill(pillAtRef.current, false));
    ro.observe(box);
    return () => ro.disconnect();
  }, [placePill]);

  // ScrollTrigger { start: "center 75%", once } → show the second tab.
  useEffect(() => {
    const el = content.current;
    if (!el || rows.length < 2) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top + r.height / 2 > window.innerHeight * 0.75) return;
      window.removeEventListener("scroll", check);
      select(1);
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, [rows.length, select]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + rows.length) % rows.length;
    tabs.current[next]?.focus();
    select(next);
  };

  const state = (i: number) => (i === active ? "enter" : i === leaving ? "leave" : "idle");

  return (
    <section aria-labelledby="trending-title" className="container-page py-24 md:py-32">
      <div className="rule-draw label-caps text-muted-foreground mb-12 flex justify-between pt-4">
        <span>01</span>
        <span>This week</span>
      </div>

      <div className="flex flex-col items-start gap-8">
        <div>
          <HeadingReveal id="trending-title" text="Trending dishes" className="text-display max-w-[10ch]" />
          <p className="text-muted-foreground mt-5 max-w-sm text-[0.9375rem] leading-relaxed">What people are cooking from World Plate this week.</p>
        </div>
        <div
          ref={list}
          role="tablist"
          aria-label="Trending dishes"
          onMouseLeave={() => setPillAt(activeRef.current)}
          className="bg-card relative isolate flex flex-wrap gap-1 rounded-[1.75rem] border border-foreground p-1"
        >
          <span ref={pill} aria-hidden className="tabs-pill" />
          {rows.map((r, i) => (
            <button
              key={r.slug}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`trend-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`trend-panel-${i}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              onMouseEnter={() => setPillAt(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="label-caps relative min-h-11 rounded-full px-4 text-foreground"
            >
              {r.title}
            </button>
          ))}
        </div>
      </div>

      <div ref={content} className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <div
          className="tab-frame bg-muted relative order-last aspect-square overflow-hidden rounded-lg border md:order-0"
          style={{ backgroundColor: `var(${FRAMES[active % FRAMES.length]})` }}
        >
          {rows.map((r, i) => (
            <Link
              key={r.slug}
              href={`/recipes/${r.slug}`}
              tabIndex={-1}
              aria-hidden
              data-cursor="View recipe"
              data-state={state(i)}
              className="tab-visual absolute inset-0"
            >
              <Image src={r.image} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
            </Link>
          ))}
        </div>

        <div className="grid">
          {rows.map((r, i) => (
            <div
              key={r.slug}
              role="tabpanel"
              id={`trend-panel-${i}`}
              aria-labelledby={`trend-tab-${i}`}
              data-state={state(i)}
              className="tab-text flex flex-col items-start gap-6"
            >
              <p className="tab-text__p label-caps text-muted-foreground">{r.cuisineName}</p>
              <SlantText as="h3" mode="static" text={r.title} className="text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.9]" />
              <p className="tab-text__p text-muted-foreground max-w-md text-[0.9375rem] leading-relaxed">{r.description}</p>
              <div className="tab-text__cta flex flex-wrap items-center gap-5">
                <Link href={`/recipes/${r.slug}`} data-accent={ACCENTS[i % ACCENTS.length]} className={flipClass()}>
                  <FlipFace>
                    Open the recipe
                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </FlipFace>
                </Link>
                <Link href="/recipes" className="text-link py-3 text-sm">
                  All recipes
                  <TextLinkLine />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
