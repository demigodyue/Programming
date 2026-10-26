"use client";

import { Check, Heart, Printer, Share2, Star } from "lucide-react";
import { m, AnimatePresence, useAnimate, useReducedMotion } from "motion/react";
import { useState } from "react";
import { T } from "@/components/i18n";
import { fly } from "@/lib/fly";
import { useT } from "@/lib/lang";
import { setFavorite, setRating, useFavorites, useRating } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** Where a saved recipe's heart flies: the header's Favorites pill, or the account circle when the pills are away. */
function favoritesTarget() {
  const visible = (el: Element | null) => {
    const r = el?.getBoundingClientRect();
    return r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.left < window.innerWidth ? el : null;
  };
  return visible(document.querySelector('.nav-bar a[href*="/favorites"]')) ?? visible(document.querySelector('.nav-bar a[href*="/account"]'));
}

/** A heart leaves the button and arcs up into the header, which bumps as it lands. */
function sendHeart(from: Element) {
  const target = favoritesTarget();
  if (!target) return;
  const heart = document.createElement("span");
  heart.className = "fly-heart";
  heart.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.5-9.2C1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.5 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  fly({ node: heart, from: from.getBoundingClientRect(), to: target, spin: 20, duration: 750 });
}

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
      if (scope.current) sendHeart(scope.current);
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
        {saved ? <T en="Saved" ja="保存済み" /> : <T en="Save recipe" ja="レシピを保存" />}
      </button>
    </div>
  );
}

/** This browser's own rating — there's no server, so no community average. */
export function StarRating({ slug }: { slug: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const t = useT();
  const stored = useRating(slug);
  const rating = stored ?? null;
  const shown = hover ?? rating ?? 0;

  const rate = (stars: number) => {
    setRating(slug, stars);
    setMessage(t(`Thanks — you rated this ${stars} out of 5.`, `ありがとうございます。5段階中${stars}の評価をつけました。`));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label={t("Rate this recipe", "このレシピを評価")}
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
              aria-label={t(`${n} ${n === 1 ? "star" : "stars"}`, `星${n}つ`)}
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
              <T en="Your rating:" ja="あなたの評価：" /> <span className="text-foreground font-medium">{rating} / 5</span>
            </>
          ) : (
            <T en="Tap a star to rate it." ja="星をタップして評価" />
          )}
        </p>
      </div>
      <p aria-live="polite" className="text-muted-foreground mt-1 min-h-5 text-sm">
        {message}
      </p>
    </div>
  );
}

/** Share (the phone's share sheet, or copy the link) and print (a clean ingredients-and-method page, globals.css). */
function ShareAndPrint({ title }: { title: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // the visitor closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const pill = "hover-fine:bg-muted inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors";
  return (
    <div data-print="hide" className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className={pill} aria-live="polite">
        {copied ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <Share2 className="size-4" strokeWidth={1.75} aria-hidden />}
        {copied ? <T en="Link copied" ja="リンクをコピーしました" /> : <T en="Share" ja="共有" />}
      </button>
      <button type="button" onClick={() => window.print()} className={pill} aria-label={t("Print this recipe", "このレシピを印刷")}>
        <Printer className="size-4" strokeWidth={1.75} aria-hidden />
        <T en="Print" ja="印刷" />
      </button>
    </div>
  );
}

export function RecipeActions({ slug, title, titleJa }: { slug: string; title: string; titleJa: string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <div data-print="hide" className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        <FavoriteButton slug={slug} />
        <StarRating slug={slug} />
      </div>
      <ShareAndPrint title={t(title, titleJa)} />
    </div>
  );
}
