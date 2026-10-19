import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "World Plate — famous dishes from around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read CSS variables, so the palette is inlined here (mirrors globals.css).
const CREAM = "#8b3a10"; // ember canvas
const INK = "#fdae2d"; // gold headline
const SAFFRON = "#e10600"; // impossible red

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
          color: INK,
          padding: 72,
          fontFamily: "sans-serif",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: SAFFRON, border: `4px solid ${INK}` }} />
          World Plate
        </div>
        <div style={{ fontSize: 104, lineHeight: 0.95, letterSpacing: 2, maxWidth: 900 }}>
          Cook the dishes the world is proud of.
        </div>
        <div style={{ fontSize: 30, color: "#ffc7c6", fontFamily: "sans-serif" }}>
          Ramen · Momo · Carbonara · Tacos al pastor · Croissants
        </div>
      </div>
    ),
    size,
  );
}
