import type { CSSProperties } from "react";

// Jets round the burner crown: angle round the ring (0 = right, π/2 = front), on an ellipse 30 × 4.5 local units.
const JETS = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * Math.PI * 2;
  return { x: 30 * Math.cos(a), y: 4.5 * Math.sin(a), tilt: Math.cos(a) * 28, front: Math.sin(a) >= 0, k };
});

/** One gas jet: a blue flame with a pale core and an orange tip, leaning outward round the ring. */
function Jet({ x, y, tilt, k, small }: { x: number; y: number; tilt: number; k: number; small?: boolean }) {
  return (
    <g transform={`rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${small ? 0.75 : 1})`}>
      {/* Inner group: its origin is the jet base, so the flicker grows the flame up from there. */}
      <g className="gas-jet" style={{ "--f": k } as CSSProperties}>
        <path fill="#2f6bff" fillOpacity="0.85" d="M0 0c-3.4 0-4.8-2.8-4-5.8.8-2.8 2.8-3.9 4-7.4 1.2 3.5 3.2 4.6 4 7.4.8 3-.6 5.8-4 5.8z" />
        <path fill="#a9d1ff" d="M0-.6c-1.9 0-2.7-1.6-2.2-3.2.5-1.6 1.5-2.2 2.2-4.2.7 2 1.7 2.6 2.2 4.2.5 1.6-.3 3.2-2.2 3.2z" />
        <path fill="#f4b942" fillOpacity="0.7" d="M0-12.4c-.6 1.2-1.1 1.8-1.1 2.6 0 .7.5 1.2 1.1 1.2s1.1-.5 1.1-1.2c0-.8-.5-1.4-1.1-2.6z" />
      </g>
    </g>
  );
}

/**
 * An original gas burner, drawn in local units round the crown centre and placed with `x`, `y` and `s` (scale):
 * an enamelled drip bowl, a ring of 16 blue jets (the back ones behind the crown), a metal crown and a cast-iron cap,
 * a soft blue glow, and the cast-iron grate arms (inner gap ±34, out to ±`outer`) with feet. `lit={false}` leaves
 * the jets and glow off. Used by the intro's boiling pot and the closing panel's stove; `id` keeps gradient ids apart.
 * The jets flicker (`.gas-jet`, globals.css); `.gas-burner__jets` / `__glow` let a scene dim or grow them.
 */
export function GasBurner({ id, x, y, s = 1, lit = true, outer = 86 }: { id: string; x: number; y: number; s?: number; lit?: boolean; outer?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-crown`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#aab0ab" />
          <stop offset="1" stopColor="#4c534f" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="5" rx="54" ry="7" fill="#1d2220" stroke="#3b423e" strokeWidth="1.2" />
      {lit && <ellipse className="gas-burner__glow" cx="0" cy="-7" rx="58" ry="8" fill="#6aa0ff" />}
      {lit && (
        <g className="gas-burner__jets">
          {JETS.filter((j) => !j.front).map((j) => (
            <Jet key={j.k} {...j} small />
          ))}
        </g>
      )}
      <ellipse cx="0" cy="1" rx="31" ry="5.5" fill={`url(#${id}-crown)`} />
      <ellipse cx="0" cy="-1.5" rx="22" ry="3.6" fill="#232826" />
      <ellipse cx="-3" cy="-2.2" rx="8" ry="1.1" fill="#ffffff" fillOpacity="0.18" />
      {lit && (
        <g className="gas-burner__jets">
          {JETS.filter((j) => j.front).map((j) => (
            <Jet key={j.k} {...j} />
          ))}
        </g>
      )}
      {/* Cast-iron grate arms the pan rests on, with their feet down to the hob. */}
      <g fill="#111513">
        <rect x={-outer} y="-9" width={outer - 34} height="4.5" rx="2" />
        <rect x="34" y="-9" width={outer - 34} height="4.5" rx="2" />
        <rect x={-outer + 2} y="-9" width="4.5" height="16" rx="2" />
        <rect x={outer - 6.5} y="-9" width="4.5" height="16" rx="2" />
        <rect x="-24" y="-10.5" width="48" height="2.5" rx="1.25" fillOpacity="0.8" />
        <rect x={-outer} y="-9" width={outer - 34} height="1.2" rx="0.6" fill="#ffffff" fillOpacity="0.08" />
        <rect x="34" y="-9" width={outer - 34} height="1.2" rx="0.6" fill="#ffffff" fillOpacity="0.08" />
      </g>
    </g>
  );
}
