import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "World Plate — famous dishes from around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't read CSS variables, so the palette is inlined here (mirrors globals.css).
const CREAM = "#c4c3b6"; // putty
const INK = "#000000";
const SAFFRON = "#000000"; // no accent colour in the Structured system

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
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: SAFFRON, border: `4px solid ${INK}` }} />
          World Plate
        </div>
        <div style={{ fontSize: 104, lineHeight: 1, letterSpacing: -3, maxWidth: 900 }}>
          Cook the dishes the world is proud of.
        </div>
        <div style={{ fontSize: 30, opacity: 0.7, fontFamily: "sans-serif" }}>
          Ramen · Momo · Carbonara · Tacos al pastor · Croissants
        </div>
      </div>
    ),
    size,
  );
}
