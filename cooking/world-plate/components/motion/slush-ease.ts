/**
 * Slush's two GSAP eases as functions (for sampling keyframes in JS). The CSS twins are
 * `--ease-slush` and `--ease-slush-bounce` in app/globals.css.
 */

// CustomEase "slush-bounce": a straight-line path through these points (Slush's own --elastic-ease-out).
const BOUNCE: [number, number][] = [
  [0, 0],
  [0.076, 0.5737],
  [0.1187, 0.8382],
  [0.1419, 0.9463],
  [0.1654, 1.0292],
  [0.1897, 1.0886],
  [0.2153, 1.1258],
  [0.2297, 1.137],
  [0.2448, 1.1424],
  [0.261, 1.1423],
  [0.2786, 1.1366],
  [0.3101, 1.1165],
  [0.3862, 1.0507],
  [0.4257, 1.0219],
  [0.4699, 0.9995],
  [0.5163, 0.9872],
  [0.5877, 0.9842],
  [0.8126, 1.0011],
  [1, 1],
];

export function slushBounce(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  for (let i = 1; i < BOUNCE.length; i++) {
    const [x1, y1] = BOUNCE[i];
    if (t <= x1) {
      const [x0, y0] = BOUNCE[i - 1];
      return y0 + ((t - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 1;
}

/** cubic-bezier(x1, y1, x2, y2) solved for y at progress t (Newton–Raphson, bisection fallback). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  const solve = (x: number) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(s) - x;
      if (Math.abs(err) < 1e-6) return s;
      const d = slopeX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    while (hi - lo > 1e-6) {
      if (sampleX(s) < x) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solve(t)));
}

/** CustomEase "slush": cubic-bezier(0.65, 0.05, 0, 1) — GSAP's default ease on slush.app. */
export const slush = cubicBezier(0.65, 0.05, 0, 1);

/** GSAP's power3.out, used by the cursor label. */
export const power3Out = (t: number) => 1 - Math.pow(1 - t, 3);
