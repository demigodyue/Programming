/**
 * Reads a method step (in English, the source text) for the recipe page's animations:
 * which kind of kitchen action it is (for the animated step icon) and which timings it mentions (for timers).
 * Pure, so it's unit-tested.
 */

export type StepAction = "bake" | "fry" | "boil" | "chop" | "mix" | "rest" | "serve" | "heat";

// Each action's verbs. The verb that appears first in the step decides: "Heat the oven…" bakes, "Heat the oil and
// fry…" fries, "Bring a pot of water to a boil…" boils.
const ACTIONS: [StepAction, RegExp][] = [
  ["bake", /\b(oven|bake[sd]?|baking|roast(?:ed|ing)?|grill(?:ed)?|broil(?:er)?)\b/],
  ["fry", /\b(fry|fries|fried|frying|sear|saut[ée]|stir-fry|brown(?:ed)?|toast(?:ed)?|char(?:red)?|wok|griddle|frying pan|skillet)\b/],
  ["boil", /\b(boil(?:ing)?|simmer(?:ing)?|blanch|steam(?:er|ing)?|poach|braise|stock|broth)\b/],
  ["chop", /\b(chop|slice[sd]?|cut|dice|mince|grate|shred|pound|julienne|score|peel|trim)\b/],
  ["mix", /\b(mix|stir|whisk|knead|fold|blend|beat|combine|toss|grind|pulse|roll|shape|pleat|fill|spread|layer|rub|coat|dip|pipe)\b/],
  ["rest", /\b(marinate|rest|soak|chill|refrigerate|proof|prove|rise|ferment|cool|overnight)\b/],
  ["serve", /\b(serve|garnish|scatter|sprinkle|drizzle|plate|top with|enjoy)\b/],
];

export function stepAction(text: string): StepAction {
  const t = text.toLowerCase();
  let best: StepAction = "heat";
  let at = Infinity;
  for (const [action, re] of ACTIONS) {
    const m = re.exec(t);
    if (m && m.index < at) {
      at = m.index;
      best = action;
    }
  }
  return best;
}

const NUM = String.raw`(\d+(?:\.\d+)?)?\s*(½|¼|¾)?`;
const DURATION = new RegExp(
  `${NUM}(?:\\s*(?:–|-|to)\\s*${NUM})?\\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\\b`,
  "gi",
);
const FRACTION: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };

/** The shortest useful timer and the longest (soaks and overnight rests get none). */
const MIN_SECONDS = 10;
const MAX_SECONDS = 6 * 3600;

/**
 * Timings in a step, in seconds, in order and without repeats: "8–10 minutes" → 480 (check at the earliest
 * time), "1½ hours" → 5400, "30 seconds" → 30. Each number is read with its own fraction; a range's first value wins.
 */
export function parseDurations(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(DURATION)) {
    const [, whole, frac, , , unit] = m;
    if (!whole && !frac) continue;
    const value = Number(whole ?? 0) + (frac ? FRACTION[frac] : 0);
    const u = unit.toLowerCase();
    const seconds = Math.round(value * (u.startsWith("h") ? 3600 : u.startsWith("m") ? 60 : 1));
    if (seconds >= MIN_SECONDS && seconds <= MAX_SECONDS && !out.includes(seconds)) out.push(seconds);
  }
  return out;
}

/** 90 → "1:30", 3725 → "1:02:05". */
export function clock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}
