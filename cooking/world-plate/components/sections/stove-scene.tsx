import type { CSSProperties } from "react";
import { GasBurner } from "@/components/motion/gas-burner";

/**
 * An original illustrated gas range for the closing panel: a black hob with two burners (GasBurner — the front one
 * under a skillet, the back one off), a stainless front with chrome knobs, an oven door with a glass window and a
 * handle. Scrolling turns the front knob and the blue gas jets grow under the pan (--p from the panel, see "Stove"
 * in globals.css); once it's lit, the skillet tosses its vegetables in a loop, the jets flicker, oil spits and steam
 * curls up. Decorative (aria-hidden). Reduced motion: the stove stands lit and still.
 */
export function StoveScene() {
  return (
    <svg aria-hidden viewBox="24 44 592 384" className="stove" focusable="false">
      <defs>
        <linearGradient id="stove-hob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a302c" />
          <stop offset="1" stopColor="#141816" />
        </linearGradient>
        <linearGradient id="stove-steel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#eceee9" />
          <stop offset="0.5" stopColor="#c9cdc8" />
          <stop offset="1" stopColor="#9da29e" />
        </linearGradient>
        <linearGradient id="stove-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#24302b" />
          <stop offset="1" stopColor="#080c0a" />
        </linearGradient>
        <linearGradient id="stove-chrome" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fbfcf9" />
          <stop offset="1" stopColor="#7f8581" />
        </linearGradient>
        <linearGradient id="stove-pan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3c433f" />
          <stop offset="1" stopColor="#101412" />
        </linearGradient>
        <radialGradient id="stove-oil" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#e9c25a" />
          <stop offset="1" stopColor="#a8761c" />
        </radialGradient>
        <linearGradient id="stove-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8a5732" />
          <stop offset="1" stopColor="#4a2b16" />
        </linearGradient>
      </defs>

      {/* wall glow behind the hob */}
      <ellipse className="stove__glow" cx="300" cy="300" rx="250" ry="120" />

      {/* steam, above the pan */}
      <g transform="translate(0 -16)">
        <g className="stove__steam">
          <path style={{ "--s": 0 } as CSSProperties} d="M250 190c-14-18 14-30 0-50s14-32 0-52" />
          <path style={{ "--s": 1 } as CSSProperties} d="M300 186c-14-18 14-30 0-50s14-32 0-52" />
          <path style={{ "--s": 2 } as CSSProperties} d="M350 190c-14-18 14-30 0-50s14-32 0-52" />
        </g>
      </g>

      {/* The range: black hob top with a lit edge; stainless front with knobs, an oven door, glass and a handle. */}
      <rect x="40" y="316" width="560" height="22" rx="6" fill="url(#stove-hob)" />
      <rect x="48" y="317" width="544" height="1.6" rx="0.8" fill="#ffffff" fillOpacity="0.12" />
      <rect x="50" y="338" width="540" height="88" rx="10" fill="url(#stove-steel)" />
      <rect x="50" y="338" width="540" height="2" fill="#000000" fillOpacity="0.25" />
      <rect x="62" y="372" width="516" height="1.2" fill="#000000" fillOpacity="0.18" />
      {[
        { x: 110, live: true },
        { x: 166, live: false },
        { x: 474, live: false },
        { x: 530, live: false },
      ].map((k) => (
        <g
          key={k.x}
          className={k.live ? "stove__knob stove__knob--live" : "stove__knob"}
          style={{ transformOrigin: `${k.x}px 355px` }}
        >
          <circle cx={k.x} cy="357" r="13" fill="#000000" fillOpacity="0.18" />
          <circle cx={k.x} cy="355" r="13" fill="url(#stove-chrome)" />
          <circle cx={k.x} cy="355" r="8.5" fill="#d9ddd8" stroke="#a3a8a4" strokeWidth="1" />
          <rect x={k.x - 1.6} y="343" width="3.2" height="10" rx="1.6" fill="#1c201e" />
        </g>
      ))}
      <rect x="196" y="380" width="248" height="6" rx="3" fill="url(#stove-chrome)" />
      <rect x="196" y="385" width="248" height="2" rx="1" fill="#000000" fillOpacity="0.15" />
      <rect x="178" y="392" width="284" height="28" rx="5" fill="url(#stove-glass)" />
      <path d="M200 392h40l-26 28h-40z" fill="#ffffff" fillOpacity="0.07" />
      <path d="M252 392h14l-26 28h-14z" fill="#ffffff" fillOpacity="0.05" />

      {/* Burners: the back one off, the front one lit under the pan. */}
      <GasBurner id="stove-back" x={505} y={310} s={1.2} lit={false} outer={60} />
      <GasBurner id="stove-front" x={300} y={308} s={2.2} outer={60} />

      <g transform="translate(0 -16)">
        {/* The skillet and its contents (tilts as it tosses). */}
        <g className="stove__pan">
          <path d="M432 262h128a15 15 0 0 1 0 30H432z" fill="url(#stove-wood)" />
          <path d="M440 266h116" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
          <circle cx="556" cy="277" r="4.5" fill="#2b1a0e" />
          <rect x="418" y="258" width="24" height="38" rx="4" fill="url(#stove-chrome)" />
          <circle cx="430" cy="268" r="2.4" fill="#6d736f" />
          <circle cx="430" cy="286" r="2.4" fill="#6d736f" />
          <path d="M170 246h260l-16 40c-5 12-15 18-28 18H214c-13 0-23-6-28-18z" fill="url(#stove-pan)" />
          <path d="M186 258c4 14 10 24 22 28" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="300" cy="303" rx="84" ry="3" fill="#000000" fillOpacity="0.35" />
          <ellipse cx="300" cy="246" rx="130" ry="14" fill="#5b625d" />
          <ellipse cx="300" cy="246.5" rx="124" ry="11.5" fill="#262b28" />
          <ellipse cx="300" cy="249" rx="112" ry="8.6" fill="url(#stove-oil)" />
          <ellipse cx="268" cy="246.5" rx="26" ry="2" fill="#fff8ec" fillOpacity="0.28" />
          <path d="M172 244c30-9 84-12 128-12" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" />
          {/* food resting in the pan */}
          <g className="stove__food">
            <circle className="stove__veg stove__veg--tomato" cx="240" cy="243" r="11" />
            <rect className="stove__veg stove__veg--pepper" x="270" y="236" width="26" height="11" rx="5" />
            <circle className="stove__veg stove__veg--corn" cx="320" cy="242" r="8" />
            <rect className="stove__veg stove__veg--leaf" x="340" y="236" width="22" height="9" rx="4.5" transform="rotate(-18 351 240)" />
            <circle className="stove__veg stove__veg--tomato" cx="372" cy="244" r="9" />
            <circle cx="236" cy="239" r="3" fill="#ffffff" fillOpacity="0.35" />
            <circle cx="369" cy="241" r="2.4" fill="#ffffff" fillOpacity="0.35" />
          </g>
        </g>

        {/* food in the air: each piece arcs up out of the pan and drops back in */}
        <g className="stove__toss">
          <circle className="stove__bit stove__veg--tomato" style={{ "--b": 0, "--x": "-40px" } as CSSProperties} cx="282" cy="238" r="10" />
          <rect className="stove__bit stove__veg--pepper" style={{ "--b": 1, "--x": "18px" } as CSSProperties} x="300" y="232" width="24" height="10" rx="5" />
          <circle className="stove__bit stove__veg--corn" style={{ "--b": 2, "--x": "-12px" } as CSSProperties} cx="330" cy="238" r="7" />
          <rect className="stove__bit stove__veg--leaf" style={{ "--b": 3, "--x": "34px" } as CSSProperties} x="256" y="234" width="20" height="8" rx="4" />
        </g>

        {/* spitting oil */}
        <g className="stove__spit">
          {[208, 252, 348, 392].map((x, i) => (
            <circle key={x} style={{ "--o": i } as CSSProperties} cx={x} cy="240" r="2.6" />
          ))}
        </g>
      </g>
    </svg>
  );
}
