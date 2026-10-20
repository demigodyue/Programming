import type { CSSProperties } from "react";
import { GasBurner } from "@/components/motion/gas-burner";

/**
 * An original illustrated gas range for the closing panel, drawn to look like the real thing: a black glass hob with
 * reflections, two burners (GasBurner — the front one under a skillet, the back one off), a brushed-stainless front
 * with knurled chrome knobs, a chrome bar handle and an oven door with a tinted glass window. The skillet is cast iron
 * shaded as a cylinder, with a bright rim, a dark inner wall, shimmering oil, a riveted chrome ferrule and a grained
 * wooden handle; the vegetables are shaded round. Scrolling turns the front knob and the blue gas jets grow under the
 * pan (--p from the panel, see "Stove" in globals.css); once it's lit, the skillet tosses its vegetables in a loop,
 * the jets flicker, oil spits and steam curls up. Decorative (aria-hidden). Reduced motion: lit and still.
 */
export function StoveScene() {
  const knobs = [
    { x: 110, live: true },
    { x: 166, live: false },
    { x: 474, live: false },
    { x: 530, live: false },
  ];
  return (
    <svg aria-hidden viewBox="24 44 592 384" className="stove" focusable="false">
      <defs>
        <linearGradient id="stove-hob" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#353c38" />
          <stop offset="0.3" stopColor="#151917" />
          <stop offset="1" stopColor="#060807" />
        </linearGradient>
        <linearGradient id="stove-steel" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a4aaa5" />
          <stop offset="0.18" stopColor="#e4e7e3" />
          <stop offset="0.4" stopColor="#c3c8c4" />
          <stop offset="0.62" stopColor="#eef0ec" />
          <stop offset="0.85" stopColor="#b5bab6" />
          <stop offset="1" stopColor="#8e948f" />
        </linearGradient>
        <linearGradient id="stove-steel-v" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        <pattern id="stove-brush" width="6" height="2" patternUnits="userSpaceOnUse">
          <rect width="6" height="0.6" fill="#ffffff" fillOpacity="0.16" />
          <rect y="1.2" width="6" height="0.4" fill="#000000" fillOpacity="0.06" />
        </pattern>
        <linearGradient id="stove-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2c3a34" />
          <stop offset="0.5" stopColor="#0d1411" />
          <stop offset="1" stopColor="#040706" />
        </linearGradient>
        <linearGradient id="stove-chrome" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#cdd2ce" />
          <stop offset="0.55" stopColor="#7c837f" />
          <stop offset="0.75" stopColor="#e2e5e1" />
          <stop offset="1" stopColor="#5d6460" />
        </linearGradient>
        <radialGradient id="stove-knob" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#d3d8d4" />
          <stop offset="0.8" stopColor="#8d938f" />
          <stop offset="1" stopColor="#5a605c" />
        </radialGradient>
        <linearGradient id="stove-pan" x1="170" x2="430" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#050606" />
          <stop offset="0.12" stopColor="#262b28" />
          <stop offset="0.24" stopColor="#5a625d" />
          <stop offset="0.3" stopColor="#2c322f" />
          <stop offset="0.65" stopColor="#151917" />
          <stop offset="0.9" stopColor="#2a302d" />
          <stop offset="1" stopColor="#070808" />
        </linearGradient>
        <linearGradient id="stove-rim" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2a2f2c" />
          <stop offset="0.3" stopColor="#8c938e" />
          <stop offset="0.5" stopColor="#4b524e" />
          <stop offset="0.8" stopColor="#6e7571" />
          <stop offset="1" stopColor="#232826" />
        </linearGradient>
        <linearGradient id="stove-pan-in" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#090b0a" />
          <stop offset="1" stopColor="#2a302c" />
        </linearGradient>
        <radialGradient id="stove-oil" cx="0.4" cy="0.42" r="0.65">
          <stop offset="0" stopColor="#f6d77a" />
          <stop offset="0.45" stopColor="#d9a43a" />
          <stop offset="1" stopColor="#7a4e10" />
        </radialGradient>
        <linearGradient id="stove-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a86c3e" />
          <stop offset="0.35" stopColor="#8a5530" />
          <stop offset="1" stopColor="#3e2311" />
        </linearGradient>
        <radialGradient id="stove-tomato" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ff9a7a" />
          <stop offset="0.4" stopColor="#e2412a" />
          <stop offset="1" stopColor="#8a1a0c" />
        </radialGradient>
        <linearGradient id="stove-pepper" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7fd07a" />
          <stop offset="0.45" stopColor="#2f8a3a" />
          <stop offset="1" stopColor="#14501f" />
        </linearGradient>
        <radialGradient id="stove-corn" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff2a6" />
          <stop offset="0.45" stopColor="#f2bd2a" />
          <stop offset="1" stopColor="#a8700c" />
        </radialGradient>
        <linearGradient id="stove-leaf" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d9ead2" />
          <stop offset="0.5" stopColor="#9fc394" />
          <stop offset="1" stopColor="#5e8a55" />
        </linearGradient>
        <filter id="stove-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="stove-vapour" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* wall glow behind the hob */}
      <ellipse className="stove__glow" cx="300" cy="300" rx="250" ry="120" />

      {/* steam, above the pan */}
      <g transform="translate(0 -16)">
        <g className="stove__steam" filter="url(#stove-vapour)">
          <path style={{ "--s": 0 } as CSSProperties} d="M250 190c-14-18 14-30 0-50s14-32 0-52" />
          <path style={{ "--s": 1 } as CSSProperties} d="M300 186c-14-18 14-30 0-50s14-32 0-52" />
          <path style={{ "--s": 2 } as CSSProperties} d="M350 190c-14-18 14-30 0-50s14-32 0-52" />
        </g>
      </g>

      {/* The range: black glass hob with a lit edge and reflections. */}
      <rect x="40" y="316" width="560" height="22" rx="6" fill="url(#stove-hob)" />
      <rect x="46" y="316.8" width="548" height="1.4" rx="0.7" fill="#ffffff" fillOpacity="0.25" />
      <path d="M70 320h120l-14 16H56z" fill="#ffffff" fillOpacity="0.05" />
      <ellipse cx="300" cy="328" rx="120" ry="6" fill="#4a3a20" fillOpacity="0.18" filter="url(#stove-blur)" />
      {/* Brushed-stainless front. */}
      <rect x="50" y="338" width="540" height="88" rx="10" fill="url(#stove-steel)" />
      <rect x="50" y="338" width="540" height="88" rx="10" fill="url(#stove-brush)" />
      <rect x="50" y="338" width="540" height="88" rx="10" fill="url(#stove-steel-v)" />
      <rect x="50" y="338" width="540" height="2.5" fill="#000000" fillOpacity="0.35" />
      <rect x="62" y="372" width="516" height="1.2" fill="#000000" fillOpacity="0.2" />
      <rect x="62" y="373.2" width="516" height="0.8" fill="#ffffff" fillOpacity="0.5" />
      {knobs.map((k) => (
        <g key={k.x} className={k.live ? "stove__knob stove__knob--live" : "stove__knob"} style={{ transformOrigin: `${k.x}px 355px` }}>
          <circle cx={k.x} cy="358" r="14" fill="#000000" fillOpacity="0.22" filter="url(#stove-blur)" />
          <circle cx={k.x} cy="355" r="13.5" fill="url(#stove-knob)" />
          <circle cx={k.x} cy="355" r="13" fill="none" stroke="#5a605c" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="1.2 1.4" />
          <circle cx={k.x} cy="355" r="9" fill="url(#stove-knob)" stroke="#9aa09c" strokeWidth="0.8" />
          <rect x={k.x - 1.6} y="343.5" width="3.2" height="10" rx="1.6" fill="#1c201e" />
          <ellipse cx={k.x - 4} cy="350" rx="3.5" ry="1.6" fill="#ffffff" fillOpacity="0.7" />
        </g>
      ))}
      {/* Chrome bar handle on stand-offs, and the oven door glass with reflections. */}
      <rect x="198" y="381" width="6" height="7" rx="1.5" fill="url(#stove-chrome)" />
      <rect x="436" y="381" width="6" height="7" rx="1.5" fill="url(#stove-chrome)" />
      <rect x="190" y="378" width="260" height="7" rx="3.5" fill="url(#stove-chrome)" />
      <rect x="190" y="386" width="260" height="2" rx="1" fill="#000000" fillOpacity="0.18" filter="url(#stove-blur)" />
      <rect x="176" y="391" width="288" height="31" rx="6" fill="#5f6662" fillOpacity="0.6" />
      <rect x="178" y="393" width="284" height="27" rx="5" fill="url(#stove-glass)" />
      <path d="M200 393h46l-26 27h-46z" fill="#ffffff" fillOpacity="0.09" />
      <path d="M256 393h14l-26 27h-14z" fill="#ffffff" fillOpacity="0.06" />
      <rect x="180" y="393.5" width="280" height="0.8" rx="0.4" fill="#ffffff" fillOpacity="0.25" />

      {/* Burners: the back one off, the front one lit under the pan. */}
      <GasBurner id="stove-back" x={505} y={310} s={1.2} lit={false} outer={60} />
      <GasBurner id="stove-front" x={300} y={308} s={2.2} outer={60} />

      <g transform="translate(0 -16)">
        {/* The skillet and its contents (tilts as it tosses). */}
        <g className="stove__pan">
          {/* Grained wooden handle with a hanging hole, on a riveted chrome ferrule. */}
          <path d="M432 262h128a15 15 0 0 1 0 30H432z" fill="url(#stove-wood)" />
          <path d="M440 268c40-2 80 2 116 0M444 280c36 1 72-1 108 1M450 274c30-1 60 1 90-1" fill="none" stroke="#3e2311" strokeOpacity="0.35" strokeWidth="0.8" />
          <path d="M440 265.5h116" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
          <circle cx="556" cy="277" r="4.5" fill="#1c1008" />
          <circle cx="556" cy="276" r="4.5" fill="none" stroke="#000000" strokeOpacity="0.4" strokeWidth="1" />
          <rect x="416" y="257" width="26" height="40" rx="5" fill="url(#stove-chrome)" />
          <circle cx="429" cy="267" r="2.6" fill="url(#stove-knob)" stroke="#5a605c" strokeWidth="0.5" />
          <circle cx="429" cy="287" r="2.6" fill="url(#stove-knob)" stroke="#5a605c" strokeWidth="0.5" />
          {/* Cast-iron body, shaded as a cylinder, with a soft specular streak. */}
          <path d="M170 246h260l-16 40c-5 12-15 18-28 18H214c-13 0-23-6-28-18z" fill="url(#stove-pan)" />
          <path d="M226 252l-6 44" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="6" strokeLinecap="round" filter="url(#stove-blur)" />
          <path d="M226.5 254l-4.5 36" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="300" cy="303" rx="84" ry="3" fill="#000000" fillOpacity="0.45" filter="url(#stove-blur)" />
          {/* Rim, inner wall, oil with highlights and tiny bubbles. */}
          <ellipse cx="300" cy="246" rx="130" ry="14" fill="url(#stove-rim)" />
          <path d="M171 245.5c16-7.6 70-12.5 129-12.5s113 4.9 129 12.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.1" />
          <ellipse cx="300" cy="246.5" rx="124" ry="11.5" fill="url(#stove-pan-in)" />
          <ellipse cx="300" cy="249" rx="112" ry="8.6" fill="url(#stove-oil)" />
          <ellipse cx="262" cy="246.5" rx="30" ry="2.2" fill="#fffbe6" fillOpacity="0.45" filter="url(#stove-blur)" />
          <ellipse cx="258" cy="246.2" rx="12" ry="0.8" fill="#ffffff" fillOpacity="0.8" />
          {[
            [214, 250],
            [228, 253],
            [300, 254],
            [338, 251],
            [386, 249],
            [352, 254],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff6d6" fillOpacity="0.7" />
          ))}
          {/* food resting in the pan */}
          <g className="stove__food">
            <circle className="stove__veg stove__veg--tomato" cx="240" cy="243" r="11" />
            <rect className="stove__veg stove__veg--pepper" x="270" y="236" width="26" height="11" rx="5" />
            <circle className="stove__veg stove__veg--corn" cx="320" cy="242" r="8" />
            <rect className="stove__veg stove__veg--leaf" x="340" y="236" width="22" height="9" rx="4.5" transform="rotate(-18 351 240)" />
            <circle className="stove__veg stove__veg--tomato" cx="372" cy="244" r="9" />
            <circle cx="236" cy="238.5" r="2.6" fill="#ffffff" fillOpacity="0.6" />
            <circle cx="368.5" cy="240.8" r="2" fill="#ffffff" fillOpacity="0.6" />
            <rect x="273" y="237.4" width="14" height="1.6" rx="0.8" fill="#ffffff" fillOpacity="0.45" />
            <circle cx="317.5" cy="239.5" r="1.6" fill="#ffffff" fillOpacity="0.6" />
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
