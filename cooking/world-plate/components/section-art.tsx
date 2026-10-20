import type { CSSProperties } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The background engravings (see PageArt) inside a section that paints its own colour, so the illustrated canvas
 * carries on through the green, red and cream sections too. The ink is the section's own text colour at low
 * strength (cream on the forest rooms, butter on tomato, forest on cream), and `offset` starts it at a different
 * point of the tall tile so neighbouring sections don't repeat the same drawings. The section needs `relative
 * isolate` so this sits on its background but under its content.
 */
export function SectionArt({ offset = 0 }: { offset?: number }) {
  return (
    <div
      aria-hidden
      className="section-art"
      style={{ "--art-lines": `url("${BASE}/art/lines.webp")`, "--art-y": `${-offset}px` } as CSSProperties}
    />
  );
}
