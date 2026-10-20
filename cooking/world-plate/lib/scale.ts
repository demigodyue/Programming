/** Units measured with spoons/cups or counted items read better as fractions. */
const FRACTION_UNITS = new Set(["cup", "cups", "tbsp", "tsp", "pinch"]);
const METRIC_UNITS = new Set(["g", "ml", "kg", "l"]);

const FRACTIONS: [number, string][] = [
  [0, ""],
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
  [1, ""],
];

export function scaleAmount(amount: number | null, fromServings: number, toServings: number): number | null {
  if (amount == null) return null;
  if (fromServings <= 0 || toServings <= 0) throw new RangeError("Servings must be positive");
  return (amount * toServings) / fromServings;
}

/** 1.5 → "1½", 0.33 → "⅓", 2.97 → "3". Rounds to the nearest common kitchen fraction. */
export function toFraction(value: number): string {
  const whole = Math.floor(value);
  const rest = value - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  const w = best[0] === 1 ? whole + 1 : whole;
  if (w === 0 && best[1] === "") return value > 0 ? "⅛" : "0";
  return `${w || ""}${best[1]}`;
}

function roundMetric(value: number, unit: string): string {
  if (unit === "kg" || unit === "l") return String(Math.round(value * 100) / 100);
  if (value >= 100) return String(Math.round(value / 5) * 5);
  if (value >= 10) return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return "";
  if (unit && METRIC_UNITS.has(unit)) return roundMetric(amount, unit);
  if (!unit || FRACTION_UNITS.has(unit)) return toFraction(amount);
  return String(Math.round(amount * 100) / 100);
}

/** Rescales and formats an ingredient quantity, e.g. "1½ tbsp" or "250 g". */
export function formatQuantity(
  amount: number | null,
  unit: string | null,
  fromServings: number,
  toServings: number,
): string {
  const scaled = scaleAmount(amount, fromServings, toServings);
  const value = formatAmount(scaled, unit);
  if (!value) return "";
  return unit ? `${value} ${unit}` : value;
}

/**
 * The same quantity written the Japanese way: spoons lead (小さじ2, 大さじ1½), metric units sit tight (250g),
 * and a counted item takes its counter (卵 4個, にんにく 2片 — `counter` defaults to 個).
 */
export function formatQuantityJa(
  amount: number | null,
  unit: string | null,
  fromServings: number,
  toServings: number,
  counter = "個",
): string {
  const scaled = scaleAmount(amount, fromServings, toServings);
  const value = formatAmount(scaled, unit);
  if (!value) return "";
  if (unit === "tsp") return `小さじ${value}`;
  if (unit === "tbsp") return `大さじ${value}`;
  if (unit === "cup" || unit === "cups") return `${value}カップ`;
  if (unit === "pinch") return value === "1" ? "ひとつまみ" : `${value}つまみ`;
  if (unit === "l") return `${value}L`;
  if (unit) return `${value}${unit}`;
  return `${value}${counter}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatMinutesJa(minutes: number): string {
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}時間${m}分` : `${h}時間`;
}
