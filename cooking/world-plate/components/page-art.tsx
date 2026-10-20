import type { CSSProperties } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The site's background artwork: one tall illustrated canvas that runs behind every page from top to bottom —
 * soft colour blobs at the edges with real engraved food illustrations among them (public-domain line art from
 * Pearson Scott Foresman), on a faint paper grain, like the pages of an illustrated cookbook. Layers of the same
 * 1440 × 3600 tile (public/art, made by scripts/make-page-art.mjs), repeating down the page without a seam: the
 * grain and blobs as images, the drawings as a mask filled with the theme's text colour (so they follow light and
 * dark mode). It sits behind everything; sections with their own colour simply cover it.
 */
export function PageArt() {
  return (
    <div
      aria-hidden
      className="page-art"
      style={
        {
          "--art-blobs": `url("${BASE}/art/blobs.svg")`,
          "--art-lines": `url("${BASE}/art/lines.webp")`,
          "--art-grain": `url("${BASE}/art/grain.svg")`,
        } as CSSProperties
      }
    />
  );
}
