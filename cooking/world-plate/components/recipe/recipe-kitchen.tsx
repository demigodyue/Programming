"use client";

import { ChefHat, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { T } from "@/components/i18n";
import { FlipFace, flipClass } from "@/components/motion/flip-face";
import { useActiveIndex } from "@/components/motion/use-active-index";
import { StepIcon } from "@/components/recipe/step-icon";
import { StepTimer } from "@/components/recipe/step-timer";
import { Stepper } from "@/components/watermelon/stepper";
import type { Ingredient, IngredientJa } from "@/db/queries/recipes";
import { useLang, useT } from "@/lib/lang";
import { formatQuantity, formatQuantityJa } from "@/lib/scale";
import { parseDurations, stepAction } from "@/lib/step-info";
import { cn } from "@/lib/utils";

// Cook Mode is only needed after a click — keep it out of the initial bundle.
const CookMode = dynamic(() => import("./cook-mode").then((m) => m.CookMode), { ssr: false });

function groupBySection(ingredients: Ingredient[]) {
  const groups: { section: string | null; items: { ing: Ingredient; index: number }[] }[] = [];
  ingredients.forEach((ing, index) => {
    const last = groups.at(-1);
    if (last && last.section === ing.section) last.items.push({ ing, index });
    else groups.push({ section: ing.section, items: [{ ing, index }] });
  });
  return groups;
}

/* Ingredient ticks live in sessionStorage (a per-tab convenience), exposed as an external store
   so hydration renders the empty server snapshot first, then the saved ticks — no mismatch. */
const tickListeners = new Set<() => void>();
const subscribeTicks = (cb: () => void) => {
  tickListeners.add(cb);
  return () => tickListeners.delete(cb);
};
function readTicks(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}
function writeTicks(key: string, ticks: Set<number>) {
  try {
    sessionStorage.setItem(key, JSON.stringify([...ticks]));
  } catch {}
  tickListeners.forEach((l) => l());
}
function parseTicks(raw: string): Set<number> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

/** A point on the flight from the row into the pot: straight across, lifted into an arc. */
function flightKeyframes(dx: number, dy: number) {
  const lift = 70 + Math.abs(dx) * 0.25;
  return Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const x = dx * t;
    const y = dy * t - lift * 4 * t * (1 - t);
    return {
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(-28 * t).toFixed(1)}deg) scale(${(1 - 0.65 * t).toFixed(3)})`,
      opacity: t > 0.9 ? (1 - t) * 10 : 1,
    };
  });
}

/**
 * The mise-en-place pot over the ingredient list: it fills as you tick ingredients off (each one flies in on an
 * arc, the pot bobs and the surface splashes), starts to bubble when it's half full and steams when everything's in.
 */
function MisePot({ fill, potRef }: { fill: number; potRef: React.RefObject<SVGSVGElement | null> }) {
  // The soup is drawn full (surface at y 36) and lowered by --fill in CSS, so the level glides as it changes.
  return (
    <svg
      ref={potRef}
      viewBox="0 0 160 112"
      aria-hidden
      className="mise-pot"
      data-bubbling={fill >= 0.5 || undefined}
      data-full={fill >= 1 || undefined}
      style={{ "--fill": fill } as CSSProperties}
    >
      <defs>
        <clipPath id="mise-pot-inside">
          <path d="M34 34h92v44a16 16 0 0 1-16 16H50a16 16 0 0 1-16-16z" />
        </clipPath>
      </defs>
      <g className="mise-pot__steam" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M62 24c-4-6 4-10 0-16" />
        <path d="M80 22c-4-6 4-10 0-16" />
        <path d="M98 24c-4-6 4-10 0-16" />
      </g>
      <g clipPath="url(#mise-pot-inside)">
        <g className="mise-pot__level">
          <rect className="mise-pot__soup" x="30" y="38" width="100" height="70" />
          <path className="mise-pot__wave" d="M10 38q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0v8H10z" />
        </g>
        <circle className="mise-pot__bubble" cx="60" cy="86" r="3.2" />
        <circle className="mise-pot__bubble" cx="84" cy="88" r="4" style={{ animationDelay: "0.4s" }} />
        <circle className="mise-pot__bubble" cx="104" cy="86" r="2.6" style={{ animationDelay: "0.8s" }} />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 34v44a16 16 0 0 0 16 16h60a16 16 0 0 0 16-16V34" />
        <path d="M26 34h108" />
        <path d="M34 44H18a6 6 0 0 1 0-12h8M126 44h16a6 6 0 0 0 0-12h-8" />
      </g>
      <g className="mise-pot__level">
        <ellipse className="mise-pot__splash" cx="80" cy="38" rx="22" ry="5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0" />
      </g>
    </svg>
  );
}

export function RecipeKitchen({
  slug,
  title,
  titleJa,
  baseServings,
  ingredients,
  ingredientsJa,
  steps,
  stepsJa,
}: {
  slug: string;
  title: string;
  titleJa: string;
  baseServings: number;
  ingredients: Ingredient[];
  ingredientsJa: IngredientJa[];
  steps: string[];
  stepsJa: string[];
}) {
  const [servings, setServings] = useState(baseServings);
  const t = useT();
  const lang = useLang();

  const [cooking, setCooking] = useState(false);
  const { active: activeStep, register: registerStep } = useActiveIndex(steps.length);
  const storageKey = `wp:checked:${slug}`;
  const raw = useSyncExternalStore(subscribeTicks, () => readTicks(storageKey), () => "[]");
  const checked = useMemo(() => parseTicks(raw), [raw]);
  const groups = useMemo(() => groupBySection(ingredients), [ingredients]);
  const meta = useMemo(() => steps.map((s) => ({ action: stepAction(s), timers: parseDurations(s) })), [steps]);
  const pot = useRef<SVGSVGElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const fill = ingredients.length ? checked.size / ingredients.length : 0;

  /** The ticked ingredient's name lifts off its row and drops into the pot. */
  const flyIntoPot = (index: number) => {
    const row = card.current?.querySelector<HTMLElement>(`[data-ing="${index}"] [data-l="${lang}"] .ing-name`);
    const target = pot.current;
    if (!row || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const from = row.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (to.bottom < 0 || to.top > window.innerHeight) return; // the pot is off-screen: just tick
    const chip = document.createElement("span");
    chip.className = "fly-chip";
    chip.textContent = row.textContent;
    chip.style.left = `${from.left}px`;
    chip.style.top = `${from.top}px`;
    document.body.append(chip);
    const dx = to.left + to.width / 2 - (from.left + chip.offsetWidth / 2);
    const dy = to.top + to.height * 0.38 - (from.top + chip.offsetHeight / 2);
    const flight = chip.animate(flightKeyframes(dx, dy), { duration: 650, easing: "cubic-bezier(0.45, 0, 0.55, 1)" });
    flight.onfinish = () => {
      chip.remove();
      target.animate(
        [{ transform: "scale(1, 1)" }, { transform: "scale(1.08, 0.9)" }, { transform: "scale(0.96, 1.05)" }, { transform: "scale(1, 1)" }],
        { duration: 450, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
      target.querySelector(".mise-pot__splash")?.animate(
        [
          { opacity: 0.9, transform: "scale(0.4)" },
          { opacity: 0, transform: "scale(1.6)" },
        ],
        { duration: 500, easing: "ease-out" },
      );
    };
  };

  const toggle = (index: number) => {
    const next = new Set(checked);
    if (next.has(index)) next.delete(index);
    else {
      next.add(index);
      flyIntoPot(index);
    }
    writeTicks(storageKey, next);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <section aria-labelledby="ingredients-title" className="lg:sticky lg:top-28 lg:self-start">
        <div ref={card} className="bg-card rounded-lg border p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="ingredients-title" className="text-[2.125rem] leading-none">
              <T en="Ingredients" ja="材料" />
            </h2>
            <Stepper
              label={<T en="Servings" ja="人数" />}
              fewer={t("Fewer servings", "人数を減らす")}
              more={t("More servings", "人数を増やす")}
              value={servings}
              min={1}
              max={Math.max(24, baseServings * 3)}
              onChange={setServings}
              unit={(n) => t(`${n} ${n === 1 ? "serving" : "servings"}`, `${n}人分`)}
            />
          </div>
          {servings !== baseServings && (
            <button
              type="button"
              onClick={() => setServings(baseServings)}
              className="text-accent-ink mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
            >
              <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden />
              <span className="link">
                <T en={`Back to original ${baseServings} servings`} ja={`元の${baseServings}人分に戻す`} />
              </span>
            </button>
          )}

          {/* The pot rides along at the top of the card while the list scrolls under it. */}
          <div className="bg-card sticky top-20 z-10 -mx-2 mt-5 flex items-center gap-4 px-2 py-2 lg:static">
            <MisePot fill={fill} potRef={pot} />
            <div className="min-w-0">
              <p className="font-display text-headline text-3xl leading-none tabular-nums">
                {checked.size}
                <span className="text-muted-foreground text-xl"> / {ingredients.length}</span>
              </p>
              <p className="text-muted-foreground mt-1 text-sm" aria-live="polite">
                {fill >= 1 ? (
                  <T en="Everything's in the pot. Time to cook!" ja="材料がそろいました。さあ、作りましょう！" />
                ) : (
                  <T en="Tick each one off as it goes in the pot." ja="鍋に入れたら、ひとつずつチェック。" />
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {groups.map((group) => (
              <div key={group.section ?? "main"}>
                {group.section && (
                  <h3 className="label-caps text-muted-foreground mb-2">
                    <T en={group.section} ja={ingredientsJa[group.items[0].index]?.section ?? group.section} />
                  </h3>
                )}
                <ul data-reveal="rows" data-reveal-at="100" className="divide-border divide-y">
                  {group.items.map(({ ing, index }, k) => {
                    const isChecked = checked.has(index);
                    const ja = ingredientsJa[index];
                    const qty = formatQuantity(ing.amount, ing.unit, baseServings, servings);
                    const qtyJa = formatQuantityJa(ing.amount, ing.unit, baseServings, servings, ja?.counter);
                    return (
                      <li key={index} data-ing={index} data-checked={isChecked} className="reveal-row" style={{ "--i": k } as CSSProperties}>
                        <label className="group flex cursor-pointer items-start gap-3 py-3">
                          <input type="checkbox" checked={isChecked} onChange={() => toggle(index)} className="peer sr-only" />
                          <span
                            aria-hidden
                            className={cn(
                              "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-card mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border transition-[background-color,border-color,scale] duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                              isChecked ? "border-primary bg-primary scale-110" : "border-muted-foreground/50",
                            )}
                          >
                            <svg viewBox="0 0 16 16" className="size-3.5">
                              <path
                                d="M3.5 8.5l3 3 6-7"
                                fill="none"
                                className="stroke-primary-foreground transition-[stroke-dashoffset] duration-300 ease-(--ease-out) motion-reduce:transition-none"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="16"
                                strokeDashoffset={isChecked ? 0 : 16}
                              />
                            </svg>
                          </span>
                          <span className={cn("leading-snug transition-colors duration-300", isChecked && "text-muted-foreground")}>
                            <T
                              en={
                                <>
                                  <span className="strike">
                                    {qty && <span className="font-medium tabular-nums">{qty} </span>}
                                    <span className="ing-name">{ing.item}</span>
                                  </span>
                                  {ing.note && <span className="text-muted-foreground">, {ing.note}</span>}
                                </>
                              }
                              ja={
                                <>
                                  <span className="strike">
                                    <span className="ing-name">{ja?.item ?? ing.item}</span>
                                    {qtyJa && <span className="ml-2 font-medium tabular-nums">{qtyJa}</span>}
                                  </span>
                                  {ja?.note && <span className="text-muted-foreground">（{ja.note}）</span>}
                                </>
                              }
                            />
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {fill >= 1 && (
            <button type="button" onClick={() => setCooking(true)} data-accent="orange" className={flipClass("solid", "mt-6 w-full justify-center")}>
              <FlipFace className="w-full justify-center">
                <ChefHat className="size-4" strokeWidth={1.5} aria-hidden />
                <T en="Start Cook Mode" ja="クックモードを開始" />
              </FlipFace>
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="method-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="method-title" className="text-[clamp(2.25rem,5vw,3.25rem)] leading-none">
            <T en="Method" ja="作り方" />
          </h2>
          <button type="button" onClick={() => setCooking(true)} data-accent="orange" className={flipClass()}>
            <FlipFace>
              <ChefHat className="size-4" strokeWidth={1.5} aria-hidden />
              <T en="Start Cook Mode" ja="クックモードを開始" />
            </FlipFace>
          </button>
        </div>
        {/* A rail joins the step numbers; each link fills in as you read past its step. */}
        <ol className="relative mt-8 space-y-6">
          {steps.map((step, i) => (
            <li
              key={i}
              id={`step-${i + 1}`}
              ref={registerStep(i)}
              data-reveal="step"
              data-active={activeStep === i || undefined}
              data-done={activeStep > i || undefined}
              className="method-step relative grid scroll-mt-28 grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 rounded-lg p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              {/* The step you're reading turns from a circle into a filled square (elastic radius). */}
              <span
                aria-hidden
                className={cn(
                  "morph-shape font-display bg-background relative z-10 grid size-11 shrink-0 place-items-center border text-lg",
                  activeStep === i ? "bg-foreground text-background border-foreground rounded-[2px]" : "rounded-full",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="pt-1.5 text-lg leading-relaxed">
                  <span className="sr-only">
                    <T en={`Step ${i + 1}: `} ja={`手順${i + 1}：`} />
                  </span>
                  <T en={step} ja={stepsJa[i] ?? step} />
                </p>
                {meta[i].timers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meta[i].timers.map((sec, k) => (
                      <StepTimer key={k} id={`${slug}:${i}:${k}`} seconds={sec} />
                    ))}
                  </div>
                )}
              </div>
              <StepIcon action={meta[i].action} className="text-headline hidden size-14 sm:block" />
            </li>
          ))}
        </ol>
      </section>

      {cooking && (
        <CookMode
          slug={slug}
          title={t(title, titleJa)}
          steps={steps.map((s, i) => ({ text: t(s, stepsJa[i] ?? s), action: meta[i].action, timers: meta[i].timers }))}
          onClose={() => setCooking(false)}
        />
      )}
    </div>
  );
}
