import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "Sizzle Atlas — famous dishes from around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read CSS variables, so the palette is inlined here (mirrors globals.css).
const CREAM = "#f6e3b4"; // butter canvas
const TOMATO = "#c2321b"; // headline
const FOREST = "#00522d"; // ink
const WHITE = "#fff8f6";

// The logo mark (components/logo.tsx) in warm white on the tomato circle, as an image: ImageResponse draws SVG
// passed as an <img>, masks included.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><ellipse cx="25" cy="38" rx="4.8" ry="11.5"/><path d="M13.5 38H36.5"/><path d="M15.2 32.2Q25 34.6 34.8 32.2"/><path d="M15.2 43.8Q25 46.4 34.8 43.8"/></g><circle cx="57.3" cy="38" r="1.55" fill="#000"/></mask><circle cx="32" cy="32" r="32" fill="${TOMATO}"/><g transform="translate(8.6 8.3) scale(0.74)"><g transform="translate(-2.4 1)"><g mask="url(#m)" fill="${WHITE}"><circle cx="25" cy="38" r="11.5"/><path d="M41.4 35.3H58.2a2.7 2.7 0 0 1 0 5.4H41.4z"/></g><circle cx="25" cy="38" r="16.5" fill="none" stroke="${WHITE}" stroke-width="3.5"/><path d="M17.2 17.4c-3.1-2.58 3.1-4.82 0-8.6M25 16.6c-3.1-3.3 3.1-6.16 0-11M32.8 17.4c-3.1-2.58 3.1-4.82 0-8.6" fill="none" stroke="${WHITE}" stroke-width="2.7" stroke-linecap="round"/></g></g></svg>`;
const MARK_SRC = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          color: TOMATO,
          padding: 72,
          fontFamily: "sans-serif",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 44, letterSpacing: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain <img> */}
          <img src={MARK_SRC} width={84} height={84} alt="" />
          Sizzle Atlas
        </div>
        <div style={{ fontSize: 96, lineHeight: 0.95, letterSpacing: 1, maxWidth: 1060 }}>
          Cook the dishes the world is proud of.
        </div>
        <div style={{ fontSize: 30, color: FOREST, fontFamily: "sans-serif" }}>
          Ramen · Momo · Carbonara · Tacos al pastor · Croissants
        </div>
      </div>
    ),
    size,
  );
}
