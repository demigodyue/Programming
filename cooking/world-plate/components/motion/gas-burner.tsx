import type { CSSProperties } from "react";

// Jets round the burner crown: angle round the ring (0 = right, π/2 = front), on an ellipse 30 × 4.5 local units.
const JETS = Array.from({ length: 18 }, (_, k) => {
  const a = (k / 18) * Math.PI * 2;
  return { x: 30 * Math.cos(a), y: 4.5 * Math.sin(a), tilt: Math.cos(a) * 30, front: Math.sin(a) >= 0, k };
});
// Gas ports round the crown's edge (the little dark holes the jets come out of).
const PORTS = Array.from({ length: 22 }, (_, k) => {
  const a = (k / 22) * Math.PI * 2;
  return { x: 29.4 * Math.cos(a), y: 1 + 5 * Math.sin(a), front: Math.sin(a) > -0.15 };
});

/** One gas jet: a translucent blue flame (graded from a pale hot base to a fading tip), an inner cone, a faint tip. */
function Jet({ id, x, y, tilt, k, small }: { id: string; x: number; y: number; tilt: number; k: number; small?: boolean }) {
  return (
    <g transform={`rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${small ? 0.72 : 1})`}>
      {/* Inner group: its origin is the jet base, so the flicker grows the flame up from there. */}
      <g className="gas-jet" style={{ "--f": k } as CSSProperties}>
        <path fill={`url(#${id}-flame)`} d="M0 0c-3.6 0-5-3-4.2-6.2.8-3 3-4.2 4.2-8 1.2 3.8 3.4 5 4.2 8 .8 3.2-.6 6.2-4.2 6.2z" />
        <path fill={`url(#${id}-cone)`} d="M0-.4c-1.8 0-2.6-1.5-2.1-3.1.5-1.5 1.4-2.1 2.1-4 .7 1.9 1.6 2.5 2.1 4 .5 1.6-.3 3.1-2.1 3.1z" />
        <path fill="#ffb347" fillOpacity="0.45" d="M0-13.4c-.5 1-.9 1.6-.9 2.3 0 .6.4 1 .9 1s.9-.4.9-1c0-.7-.4-1.3-.9-2.3z" />
      </g>
    </g>
  );
}

/**
 * An original gas burner, drawn in local units round the crown centre and placed with `x`, `y` and `s` (scale):
 * a dished enamel drip bowl, a ring of 18 blue jets (the back ones behind the crown) with a soft glow, an aluminium
 * crown with its ring of gas ports and a black cast-iron cap, and the cast-iron grate arms (inner gap ±34, out to
 * ±`outer`) with feet, lit along their top edges. `lit={false}` leaves the jets and glow off. Used by the intro's
 * boiling pot and the closing panel's stove; `id` keeps gradient ids apart. The jets flicker (`.gas-jet`,
 * globals.css); `.gas-burner__jets` / `__glow` let a scene dim or grow them.
 */
export function GasBurner({ id, x, y, s = 1, lit = true, outer = 86 }: { id: string; x: number; y: number; s?: number; lit?: boolean; outer?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-bowl`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#0c0f0d" />
          <stop offset="0.7" stopColor="#1f2522" />
          <stop offset="0.92" stopColor="#4a524d" />
          <stop offset="1" stopColor="#262b28" />
        </radialGradient>
        <linearGradient id={`${id}-crown`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5d645f" />
          <stop offset="0.3" stopColor="#d5dad6" />
          <stop offset="0.45" stopColor="#f4f6f3" />
          <stop offset="0.75" stopColor="#8f9691" />
          <stop offset="1" stopColor="#4a514c" />
        </linearGradient>
        <radialGradient id={`${id}-cap`} cx="0.38" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#4b524e" />
          <stop offset="0.5" stopColor="#1d2220" />
          <stop offset="1" stopColor="#0a0c0b" />
        </radialGradient>
        <linearGradient id={`${id}-iron`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4c534f" />
          <stop offset="0.35" stopColor="#1b1f1d" />
          <stop offset="1" stopColor="#070908" />
        </linearGradient>
        <linearGradient id={`${id}-flame`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-14">
          <stop offset="0" stopColor="#cfe6ff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#4f8dff" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#2a5ee8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#3a52c8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-cone`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-7.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9fd0ff" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${id}-glowfill`}>
          <stop offset="0" stopColor="#8fb8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#3d6bff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Drip bowl, with a bright rim where it catches the light. */}
      <ellipse cx="0" cy="5" rx="54" ry="7.5" fill={`url(#${id}-bowl)`} />
      <path d="M-52 4c10 4.6 30 7 52 7s42-2.4 52-7" fill="none" stroke="#7b837e" strokeOpacity="0.55" strokeWidth="0.9" />
      {lit && <ellipse className="gas-burner__glow" cx="0" cy="-6" rx="60" ry="10" fill={`url(#${id}-glowfill)`} />}
      {lit && (
        <g className="gas-burner__jets" filter={`url(#${id}-soft)`}>
          {JETS.filter((j) => !j.front).map((j) => (
            <Jet key={j.k} id={id} {...j} small />
          ))}
        </g>
      )}
      {/* Crown: a short aluminium cylinder with its ports, under a black cap. */}
      <path d="M-31 1v2.6c0 3 13.9 5.5 31 5.5s31-2.5 31-5.5V1z" fill={`url(#${id}-crown)`} />
      <ellipse cx="0" cy="1" rx="31" ry="5.5" fill={`url(#${id}-crown)`} />
      {PORTS.filter((p) => p.front).map((p, i) => (
        <ellipse key={i} cx={p.x.toFixed(1)} cy={(p.y + 2.2).toFixed(1)} rx="0.9" ry="0.55" fill="#2a2f2c" />
      ))}
      <ellipse cx="0" cy="-1.6" rx="22.5" ry="3.8" fill={`url(#${id}-cap)`} />
      <ellipse cx="-5" cy="-2.6" rx="9" ry="1.2" fill="#ffffff" fillOpacity="0.16" />
      {lit && (
        <g className="gas-burner__jets" filter={`url(#${id}-soft)`}>
          {JETS.filter((j) => j.front).map((j) => (
            <Jet key={j.k} id={id} {...j} />
          ))}
        </g>
      )}
      {/* Cast-iron grate arms the pan rests on, with their feet down to the hob, lit along the top. */}
      <g fill={`url(#${id}-iron)`}>
        <rect x={-outer} y="-9.5" width={outer - 34} height="5" rx="2.2" />
        <rect x="34" y="-9.5" width={outer - 34} height="5" rx="2.2" />
        <rect x={-outer + 2} y="-9.5" width="5" height="17" rx="2.2" />
        <rect x={outer - 7} y="-9.5" width="5" height="17" rx="2.2" />
        <rect x="-24" y="-11" width="48" height="2.6" rx="1.3" />
      </g>
      <g fill="#ffffff" fillOpacity="0.14">
        <rect x={-outer + 1} y="-9.3" width={outer - 36} height="0.9" rx="0.45" />
        <rect x="35" y="-9.3" width={outer - 36} height="0.9" rx="0.45" />
      </g>
    </g>
  );
}
