import type { CSSProperties } from "react";

/**
 * An original illustrated stove for the closing panel: a hob with a pan on the front burner. Scrolling turns the
 * knob and the flame grows under the pan (--p from the panel, see "Stove" in globals.css); once it's lit, the pan
 * tosses its vegetables in a loop, the flames flicker, oil spits and steam curls up. Decorative (aria-hidden).
 * Reduced motion: the stove stands lit and still.
 */
export function StoveScene() {
  return (
    <svg
      aria-hidden
      viewBox="24 44 592 384"
      className="stove"
      focusable="false"
    >
      {/* wall glow behind the hob */}
      <ellipse className="stove__glow" cx="300" cy="300" rx="250" ry="120" />

      {/* everything above the hob sits a little higher so the flames show under the pan */}
      <g transform="translate(0 -26)">
        {/* steam */}
        <g className="stove__steam">
          <path
            style={{ "--s": 0 } as CSSProperties}
            d="M250 190c-14-18 14-30 0-50s14-32 0-52"
          />
          <path
            style={{ "--s": 1 } as CSSProperties}
            d="M300 186c-14-18 14-30 0-50s14-32 0-52"
          />
          <path
            style={{ "--s": 2 } as CSSProperties}
            d="M350 190c-14-18 14-30 0-50s14-32 0-52"
          />
        </g>
      </g>

      {/* hob */}
      <rect
        className="stove__top"
        x="40"
        y="318"
        width="560"
        height="26"
        rx="8"
      />
      <rect
        className="stove__body"
        x="56"
        y="344"
        width="528"
        height="78"
        rx="14"
      />
      <rect
        className="stove__window"
        x="200"
        y="360"
        width="240"
        height="46"
        rx="8"
      />
      <g
        className="stove__knob stove__knob--live"
        style={{ transformOrigin: "120px 383px" }}
      >
        <circle cx="120" cy="383" r="18" />
        <rect x="117" y="367" width="6" height="16" rx="3" />
      </g>
      <g className="stove__knob" style={{ transformOrigin: "520px 383px" }}>
        <circle cx="520" cy="383" r="18" />
        <rect x="517" y="367" width="6" height="16" rx="3" />
      </g>
      {/* back burner, off */}
      <ellipse className="stove__burner" cx="490" cy="314" rx="62" ry="7" />

      {/* front burner: grate and flames */}
      <ellipse className="stove__burner" cx="300" cy="314" rx="92" ry="8" />
      <g className="stove__flames">
        {[-72, -48, -24, 0, 24, 48, 72].map((x, i) => (
          <path
            key={x}
            className="stove__flame"
            style={
              {
                "--f": i,
                transformOrigin: `${300 + x}px 312px`,
              } as CSSProperties
            }
            d={`M${300 + x} 312c-10 0-15-8-13-18 2-9 9-14 11-27 7 9 15 17 15 28 0 10-5 17-13 17z`}
          />
        ))}
      </g>

      <g transform="translate(0 -26)">
        {/* pan and its contents (tilts as it tosses) */}
        <g className="stove__pan">
          <path
            className="stove__pan-handle"
            d="M420 262h150a14 14 0 0 1 0 28H420z"
          />
          <path
            className="stove__pan-body"
            d="M170 246h260l-16 40c-5 12-15 18-28 18H214c-13 0-23-6-28-18z"
          />
          <ellipse
            className="stove__pan-rim"
            cx="300"
            cy="246"
            rx="130"
            ry="14"
          />
          <ellipse
            className="stove__pan-oil"
            cx="300"
            cy="248"
            rx="112"
            ry="9"
          />
          {/* food resting in the pan */}
          <g className="stove__food">
            <circle
              className="stove__veg stove__veg--tomato"
              cx="240"
              cy="243"
              r="11"
            />
            <rect
              className="stove__veg stove__veg--pepper"
              x="270"
              y="236"
              width="26"
              height="11"
              rx="5"
            />
            <circle
              className="stove__veg stove__veg--corn"
              cx="320"
              cy="242"
              r="8"
            />
            <rect
              className="stove__veg stove__veg--leaf"
              x="340"
              y="236"
              width="22"
              height="9"
              rx="4.5"
              transform="rotate(-18 351 240)"
            />
            <circle
              className="stove__veg stove__veg--tomato"
              cx="372"
              cy="244"
              r="9"
            />
          </g>
        </g>

        {/* food in the air: each piece arcs up out of the pan and drops back in */}
        <g className="stove__toss">
          <circle
            className="stove__bit stove__veg--tomato"
            style={{ "--b": 0, "--x": "-40px" } as CSSProperties}
            cx="282"
            cy="238"
            r="10"
          />
          <rect
            className="stove__bit stove__veg--pepper"
            style={{ "--b": 1, "--x": "18px" } as CSSProperties}
            x="300"
            y="232"
            width="24"
            height="10"
            rx="5"
          />
          <circle
            className="stove__bit stove__veg--corn"
            style={{ "--b": 2, "--x": "-12px" } as CSSProperties}
            cx="330"
            cy="238"
            r="7"
          />
          <rect
            className="stove__bit stove__veg--leaf"
            style={{ "--b": 3, "--x": "34px" } as CSSProperties}
            x="256"
            y="234"
            width="20"
            height="8"
            rx="4"
          />
        </g>

        {/* spitting oil */}
        <g className="stove__spit">
          {[208, 252, 348, 392].map((x, i) => (
            <circle
              key={x}
              style={{ "--o": i } as CSSProperties}
              cx={x}
              cy="240"
              r="2.6"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
