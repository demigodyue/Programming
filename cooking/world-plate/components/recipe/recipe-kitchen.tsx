"use client";

import { ChefHat, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { useActiveIndex } from "@/components/motion/use-active-index";
import { Stepper } from "@/components/watermelon/stepper";
import type { Ingredient } from "@/db/queries/recipes";
import { formatQuantity } from "@/lib/scale";
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

export function RecipeKitchen({
  slug,
  title,
  baseServings,
  ingredients,
  steps,
}: {
  slug: string;
  title: string;
  baseServings: number;
  ingredients: Ingredient[];
  steps: string[];
}) {
  const [servings, setServings] = useState(baseServings);

  const [cooking, setCooking] = useState(false);
  const { active: activeStep, register: registerStep } = useActiveIndex(steps.length);
  const storageKey = `wp:checked:${slug}`;
  const raw = useSyncExternalStore(subscribeTicks, () => readTicks(storageKey), () => "[]");
  const checked = useMemo(() => parseTicks(raw), [raw]);
  const groups = useMemo(() => groupBySection(ingredients), [ingredients]);

  const toggle = (index: number) => {
    const next = new Set(checked);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    writeTicks(storageKey, next);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <section aria-labelledby="ingredients-title" className="lg:sticky lg:top-28 lg:self-start">
        <div className="bg-card rounded-lg border p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="ingredients-title" className="text-[2.125rem] leading-none">
              Ingredients
            </h2>
            <Stepper
              label="Servings"
              value={servings}
              min={1}
              max={Math.max(24, baseServings * 3)}
              onChange={setServings}
              unit={(n) => `${n} ${n === 1 ? "serving" : "servings"}`}
            />
          </div>
          {servings !== baseServings && (
            <button
              type="button"
              onClick={() => setServings(baseServings)}
              className="text-accent-ink mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover-fine:underline"
            >
              <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden />
              Back to original {baseServings} servings
            </button>
          )}

          <div className="mt-6 space-y-6">
            {groups.map((group) => (
              <div key={group.section ?? "main"}>
                {group.section && <h3 className="label-caps text-muted-foreground mb-2">{group.section}</h3>}
                <ul className="divide-border divide-y">
                  {group.items.map(({ ing, index }) => {
                    const isChecked = checked.has(index);
                    const qty = formatQuantity(ing.amount, ing.unit, baseServings, servings);
                    return (
                      <li key={index} data-checked={isChecked}>
                        <label className="group flex cursor-pointer items-start gap-3 py-3">
                          <input type="checkbox" checked={isChecked} onChange={() => toggle(index)} className="peer sr-only" />
                          <span
                            aria-hidden
                            className={cn(
                              "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-card mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border transition-[background-color,border-color] duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                              isChecked ? "border-primary bg-primary" : "border-muted-foreground/50",
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
                            <span className="strike">
                              {qty && <span className="font-medium tabular-nums">{qty} </span>}
                              {ing.item}
                            </span>
                            {ing.note && <span className="text-muted-foreground">, {ing.note}</span>}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-sm" aria-live="polite">
            {checked.size} of {ingredients.length} ticked off
          </p>
        </div>
      </section>

      <section aria-labelledby="method-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="method-title" className="text-[clamp(2.25rem,5vw,3.25rem)] leading-none">
            Method
          </h2>
          <button
            type="button"
            onClick={() => setCooking(true)}
            className="btn-swap bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-[17px] py-[9px] text-sm"
          >
            <ChefHat className="size-4" strokeWidth={1.5} aria-hidden />
            Start Cook Mode
          </button>
        </div>
        <Reveal as="ol" className="mt-8 space-y-8">
          {steps.map((step, i) => (
            <RevealItem as="li" key={i} id={`step-${i + 1}`} ref={registerStep(i)} className="flex scroll-mt-28 gap-5">
              {/* LaunchDarkly stepper: the step you're reading morphs from circle to filled square. */}
              <span
                aria-hidden
                className={cn(
                  "morph-shape font-display grid size-11 shrink-0 place-items-center border text-lg",
                  activeStep === i ? "bg-foreground text-background border-foreground rounded-[2px]" : "rounded-full",
                )}
              >
                {i + 1}
              </span>
              <p className="pt-1.5 text-lg leading-relaxed">
                <span className="sr-only">Step {i + 1}: </span>
                {step}
              </p>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      {cooking && <CookMode title={title} steps={steps} onClose={() => setCooking(false)} />}
    </div>
  );
}
