"use client";

import { Heart, Star } from "lucide-react";
import { m, AnimatePresence, useAnimate, useReducedMotion } from "motion/react";
import { useState } from "react";
import { setFavorite, setRating, useFavorites, useRating } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** Saved state lives in this browser (see lib/local-store.ts). */
export function FavoriteButton({ slug }: { slug: string }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const [burstKey, setBurstKey] = useState(0);
  const favorites = useFavorites();
  const saved = favorites?.includes(slug) ?? false;

  const toggle = () => {
    const next = !saved;
    setFavorite(slug, next);
    if (next && !reduce) {
      setBurstKey((k) => k + 1);
      animate(scope.current, { transform: ["scale(1)", "scale(1.28)", "scale(0.94)", "scale(1)"] }, { duration: 0.45, ease: [0.23, 1, 0.32, 1] });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={favorites === null}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full border px-5 font-medium whitespace-nowrap transition-[background-color,border-color,opacity] duration-200 disabled:opacity-60",
          saved ? "border-primary bg-primary text-primary-foreground" : "bg-card hover-fine:bg-muted",
        )}
      >
        <span className="relative grid place-items-center">
          <span ref={scope} className="grid place-items-center">
            <Heart className={cn("size-5 transition-colors duration-200", saved && "fill-current")} strokeWidth={1.75} aria-hidden />
          </span>
          <AnimatePresence>
            {burstKey > 0 && saved && (
              <span key={burstKey} aria-hidden className="pointer-events-none absolute inset-0">
                {BURST.map((angle, i) => (
                  <m.span
                    key={i}
                    className={cn("absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full", i % 2 ? "bg-primary-foreground" : "bg-destructive")}
                    initial={{ opacity: 1, transform: "translate(0px, 0px) scale(1)" }}
                    animate={{
                      opacity: 0,
                      transform: `translate(${Math.cos(angle) * 22}px, ${Math.sin(angle) * 22}px) scale(0.4)`,
                    }}
                    transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                  />
                ))}
              </span>
            )}
          </AnimatePresence>
        </span>
        {saved ? "Saved" : "Save recipe"}
      </button>
    </div>
  );
}

/** This browser's own rating — there's no server, so no community average. */
export function StarRating({ slug }: { slug: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const stored = useRating(slug);
  const rating = stored ?? null;
  const shown = hover ?? rating ?? 0;

  const rate = (stars: number) => {
    setRating(slug, stars);
    setMessage(`Thanks — you rated this ${stars} out of 5.`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Rate this recipe"
          className="flex"
          onMouseLeave={() => setHover(null)}
          onKeyDown={(e) => {
            const current = rating ?? 0;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              rate(Math.min(5, current + 1));
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              rate(Math.max(1, current - 1));
            }
          }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <m.button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              tabIndex={rating ? (rating === n ? 0 : -1) : n === 1 ? 0 : -1}
              disabled={stored === undefined}
              onMouseEnter={(e) => window.matchMedia("(hover: hover)").matches && !e.currentTarget.disabled && setHover(n)}
              onClick={() => rate(n)}
              whileTap={reduce ? undefined : { scale: 0.85 }}
              className="grid size-10 place-items-center rounded-full"
            >
              <Star
                className={cn(
                  "size-6 transition-[color,fill,transform] duration-200 ease-(--ease-out)",
                  n <= shown ? "fill-primary text-primary" : "text-muted-foreground/60",
                  hover !== null && n <= hover && "scale-110",
                )}
                strokeWidth={1.5}
                aria-hidden
              />
            </m.button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          {rating ? (
            <>
              Your rating: <span className="text-foreground font-medium">{rating} / 5</span>
            </>
          ) : (
            "Tap a star to rate it."
          )}
        </p>
      </div>
      <p aria-live="polite" className="text-muted-foreground mt-1 min-h-5 text-sm">
        {message}
      </p>
    </div>
  );
}

export function RecipeActions({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <FavoriteButton slug={slug} />
      <StarRating slug={slug} />
    </div>
  );
}
