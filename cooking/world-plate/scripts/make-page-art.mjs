// Generates the site's background artwork (public/art/): one tall 1440 × 3600 tile that repeats down the page
// without a seam, plus a small paper-grain tile. Separate files so the colours can follow the theme:
//   lines.svg — engraved-style food drawings (outlines, fine detail, cross-hatched shading), used as a CSS mask
//               (the ink colour comes from the theme)
//   blobs.svg — soft organic colour shapes in the site palette, used as a plain background image
//   grain.svg — a faint paper-fibre texture laid over everything
// Original drawings (garlic, chilli, basil, bay, tomato, mushroom, lemon, wooden spoon, whisk, star anise, rosemary,
// peppercorns, cinnamon); the idea — a cookbook-sketch canvas with colour blobs flowing top to bottom — came from a
// Refero reference the user shared (Pa'lais). Run: node scripts/make-page-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 1440;
const H = 3600;
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "art");
const f = (n) => Number(n.toFixed(1));

// ---- Engraving helpers ----
// Shading: parallel lines across a region, clipped to it (`cross` adds a second set for the darkest parts).
let uid = 0;
const lineSet = (angle, gap, size, cx, cy) => {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let d = "";
  for (let k = -size; k <= size; k += gap) {
    const ox = cx - dy * k;
    const oy = cy + dx * k;
    d += `M${f(ox - dx * size)} ${f(oy - dy * size)}L${f(ox + dx * size)} ${f(oy + dy * size)}`;
  }
  return d;
};
// `cx`/`cy` centre the line field on the region and `size` is its half-width, so only the lines needed are drawn.
const shade = (region, { angle = 45, gap = 4.5, size = 80, cx = 0, cy = 0, cross = false } = {}) => {
  const id = `s${uid++}`;
  const d = lineSet(angle, gap, size, cx, cy) + (cross ? lineSet(angle + 75, gap * 1.4, size, cx, cy) : "");
  return `<clipPath id="${id}"><path d="${region}"/></clipPath><path class="h" clip-path="url(#${id})" d="${d}"/>`;
};
const P = (d, cls = "") => `<path${cls ? ` class="${cls}"` : ""} d="${d}"/>`;

// A pointed leaf along +x from its base, with a midrib, side veins and its lower half hatched.
const leaf = (len, width = 0.3) => {
  const w = len * width;
  const outline = `M0 0C${f(len * 0.2)} ${f(-w)} ${f(len * 0.7)} ${f(-w * 1.1)} ${len} 0C${f(len * 0.7)} ${f(w * 0.95)} ${f(len * 0.2)} ${f(w * 0.9)} 0 0Z`;
  const lower = `M0 0C${f(len * 0.3)} -1 ${f(len * 0.65)} -1 ${len} 0C${f(len * 0.7)} ${f(w * 0.95)} ${f(len * 0.2)} ${f(w * 0.9)} 0 0Z`;
  let veins = "";
  for (let t = 0.18; t < 0.85; t += 0.14) {
    const x = len * t;
    veins += `M${f(x)} -0.8q${f(len * 0.07)} ${f(-w * 0.45)} ${f(len * 0.17)} ${f(-w * 0.75)}`;
    veins += `M${f(x)} 0.8q${f(len * 0.07)} ${f(w * 0.45)} ${f(len * 0.17)} ${f(w * 0.72)}`;
  }
  return shade(lower, { angle: 70, gap: 3.6, cx: len / 2, size: len * 0.6 }) + P(outline) + P(`M0 0C${f(len * 0.3)} -1.5 ${f(len * 0.65)} -1.5 ${f(len * 0.97)} 0`, "d") + P(veins, "d");
};
const at = (x, y, r, inner, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)})${s !== 1 ? ` scale(${s})` : ""}">${inner}</g>`;

// ---- Motifs, drawn round their own origin; each call makes fresh clip ids ----
const motifs = {
  garlic: () => {
    const bulb = "M0 58C-30 58-52 40-52 14C-52-14-30-30-12-40C-6-46-4-56-6-70L6-70C4-56 6-46 12-40C30-30 52-14 52 14C52 40 30 58 0 58Z";
    let roots = "";
    for (let i = -5; i <= 5; i++) roots += `M${i * 3} 57q${i * 2} 8 ${f(i * 3.4)} ${14 - Math.abs(i)}`;
    return (
      shade("M0-40C-6-10-6 30 0 58C30 58 52 40 52 14C52-14 30-30 12-40Z", { angle: 62, gap: 6.5 }) +
      shade("M10-38C34-18 38 26 16 56C30 54 52 40 52 14C52-14 30-30 12-40Z", { angle: 62, gap: 3.6 }) +
      shade("M16 56C30 54 44 44 50 30C44 40 30 50 16 56Z", { angle: 62, gap: 3, cross: true }) +
      P(bulb) +
      P("M-10-38C-34-18-38 26-16 56M10-38C34-18 38 26 16 56M0-40C-6-10-6 30 0 58") +
      P("M-24-30C-48-6-44 36-30 50M24-30C48-6 44 36 30 50", "d") +
      P("M-4-30C-10 0-10 30-6 52M5-30C10 0 10 30 6 52M-18-26C-28 0-28 30-20 50M18-26C28 0 28 30 20 50M-36-14C-44 6-42 30-34 44", "d") +
      P("M-6-70C-8-84-4-96 2-104M6-70C8-82 6-92 10-100M2-104l-3-8M2-104l6-5") +
      P("M-2-72c0-6 1-12 2-18M2-74c1-6 2-11 4-16", "d") +
      P(roots, "d")
    );
  },
  chilli: () => {
    const pod = "M-14 8C-20 50-10 110 30 160C50 184 70 196 84 198C68 186 54 168 42 146C24 112 18 60 14 8Z";
    return (
      shade(pod, { angle: 40, gap: 7, cx: 34, cy: 100, size: 120 }) +
      shade("M14 8C18 60 24 112 42 146C54 168 68 186 84 198C62 190 40 170 26 146C10 116 4 64 4 10Z", { angle: 40, gap: 3.4, cx: 40, cy: 100, size: 120, cross: true }) +
      P(pod) +
      P("M-6 18C-10 56-2 100 24 140", "d") +
      P("M-10 20C-4 25 6 25 12 20M-12 34c6 3 14 3 22 0", "d") +
      P("M-14 6C-10-4 10-4 14 6C10 12-10 12-14 6Z") +
      P("M-14 6l-8 7M-6 10l-4 9M6 10l4 9M14 6l8 7", "d") +
      P("M0-2C-2-20 6-34 18-42M4-1C3-18 10-30 21-38M18-42L21-38")
    );
  },
  basil: () => {
    const nodes = [
      [30, -1, -58, 70],
      [30, 1, 238, 66],
      [80, -1, -48, 84],
      [80, 1, 228, 80],
      [130, -1, -40, 92],
      [130, 1, 220, 88],
    ];
    return (
      P("M0 0C6 50 10 110 4 186M4 0C10 50 14 110 8 186") +
      nodes.map(([y, side, r, len]) => at(6 + side * 2, y, r, P(`M0 0l${f(len * 0.12)} 0`) + at(len * 0.12, 0, 0, leaf(len)))).join("") +
      at(2, 2, -110, leaf(40, 0.34)) +
      at(6, 2, -70, leaf(44, 0.34))
    );
  },
  bay: () =>
    P("M0 0C20 40 30 100 26 190") +
    [
      [8, 20, -10, 86],
      [18, 50, 200, 92],
      [24, 92, -4, 98],
      [28, 132, 196, 96],
      [27, 172, 10, 84],
    ]
      .map(([x, y, r, len]) => at(x, y, r, leaf(len, 0.22)))
      .join(""),
  tomato: () => {
    const body = "M0-46C30-48 58-28 60 2C62 32 36 54 0 54C-36 54-62 32-60 2C-58-28-30-48 0-46Z";
    const sepals = [0, 72, 144, 216, 288]
      .map((a) => `<g transform="translate(0 -44) scale(1 .45) rotate(${a})"><path d="M0 0C6-3 20 1 32 10C20 9 8 7 0 4Z"/></g>`)
      .join("");
    return (
      shade("M8-46C34-44 58-28 60 2C62 32 36 54 0 54C20 30 24-10 8-46Z", { angle: 30, gap: 6.5 }) +
      shade("M60 2C62 32 36 54 0 54C-36 54-62 32-60 2C-50 30-20 44 8 40C36 36 54 22 60 2Z", { angle: 30, gap: 4 }) +
      shade("M60 2C60 26 44 44 20 52C40 40 54 24 60 2Z", { angle: 30, gap: 3, cross: true }) +
      P(body) +
      P("M-20-42C-30-20-32 10-24 40M20-42C32-18 34 12 26 40", "d") +
      P("M-34-24c-6 6-10 14-10 22", "d") +
      sepals +
      P("M-3-46C-4-56-2-62 2-66L6-64C3-60 2-54 3-46")
    );
  },
  mushroom: () => {
    let gills = "";
    for (let x = -52; x <= 52; x += 7) gills += `M${x} ${f(8 + (1 - (x / 62) ** 2) * 6)}L${f(x * 0.32)} 17`;
    return (
      shade("M62 4C64-40 36-66 2-66C14-50 18-20 14 10C30 9 50 7 62 4Z", { angle: 45, gap: 6.5 }) +
      shade("M62 4C64-40 36-66 2-66C30-56 46-30 44 6C52 6 58 5 62 4Z", { angle: 45, gap: 3.6 }) +
      shade("M-62 4C-40 18 40 18 62 4C40 10-40 10-62 4Z", { angle: 0, gap: 2.4, size: 70 }) +
      shade("M16 14C22 40 22 70 16 86C8 70 6 40 6 16Z", { angle: 80, gap: 3.6 }) +
      shade("M-18 14L16 14L16 30L-18 30Z", { angle: 20, gap: 3.2, cross: true }) +
      P("M-62 4C-62-38-32-66 2-66C36-66 64-40 62 4C42 12-42 12-62 4Z") +
      P("M-62 4C-40 18 40 18 62 4") +
      P(gills, "d") +
      P("M-18 14C-24 40-22 70-14 86C-4 92 6 92 16 86C22 70 22 40 16 14") +
      P("M-14 86C-20 88-24 92-20 96C-6 100 10 100 22 96C24 92 20 88 16 86") +
      P("M-8 30C-10 50-9 68-6 82M2 28C1 48 2 68 4 84", "d") +
      [[-40, -30], [-30, -44], [-14, -52], [-20, -36], [-6, -44], [8, -56], [-36, -16], [-24, -24], [-10, -28], [4, -36], [18, -44], [-46, -8], [-30, -4], [-14, -14], [26, -30], [12, -22]]
        .map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="${x % 3 === 0 ? 1.4 : 1}"/>`)
        .join("")
    );
  },
  lemon: () => {
    let segs = "";
    let pulp = "";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      segs += `M${f(Math.cos(a) * 6)} ${f(Math.sin(a) * 6)}L${f(Math.cos(a) * 45)} ${f(Math.sin(a) * 45)}`;
      for (const [rr, off] of [
        [18, 0.3],
        [30, 0.5],
        [38, 0.25],
      ]) {
        const b = a + (off * Math.PI * 2) / 10;
        const x = Math.cos(b) * rr;
        const y = Math.sin(b) * rr;
        const ux = Math.cos(b) * 5;
        const uy = Math.sin(b) * 5;
        pulp += `M${f(x)} ${f(y)}q${f(ux * 0.6 - uy * 0.4)} ${f(uy * 0.6 + ux * 0.4)} ${f(ux)} ${f(uy)}`;
      }
    }
    let pores = "";
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + 0.07;
      const r = 52.5 + (i % 3) * 1.2;
      pores += `<circle class="dot" cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="0.9"/>`;
    }
    return (
      shade("M56 0A56 56 0 0 1-56 0L-50 0A50 50 0 0 0 50 0Z", { angle: 35, gap: 3.2, size: 60 }) +
      shade("M46 0A46 46 0 0 1-46 0A46 30 0 0 0 46 0Z", { angle: 35, gap: 7, size: 50 }) +
      `<circle r="56"/><circle r="50" class="d"/><circle r="46"/><circle r="6" class="d"/>` +
      P(segs, "d") +
      P(pulp, "d") +
      pores +
      P("M10-22c3 5 3 9 0 13M-22 16c4 3 5 7 4 11", "")
    );
  },
  spoon: () =>
    shade("M0 1L150 2L150 7L0 4Z", { angle: 80, gap: 3.2, cx: 75, size: 90 }) +
    shade("M198 0m-26 0a26 18 0 1 0 52 0a26 18 0 1 0-52 0", { angle: -30, gap: 3.4, cx: 198, size: 40 }) +
    shade("M196 0m-34 0a34 26 0 0 0 68 0a26 18 0 0 1-52 0Z", { angle: 60, gap: 3.4, cx: 196, cy: 10, size: 44 }) +
    P("M0-4L150-7L150 7L0 4A4 4 0 0 1 0-4Z") +
    P("M150-7C158-8 162-13 166-18M150 7C158 8 162 13 166 18") +
    `<ellipse cx="196" cy="0" rx="34" ry="26"/><ellipse cx="198" cy="0" rx="26" ry="18" class="d"/>` +
    P("M8-1C50-2 100-3 146-3M10 2C60 2 110 2 146 3M40-2c10-2 20-2 28 0", "d") +
    P("M84-2.6c5-2.2 11-2.2 14 0", "d"),
  whisk: () => {
    const loop = (w) => `M0-20C${-w} 30 ${f(-w * 0.9)} 120 0 150C${f(w * 0.9)} 120 ${w} 30 0-20`;
    return (
      shade("M2-100L2-24L7-24L8-100Z", { angle: 90, gap: 2.6, cy: -62, size: 50 }) +
      P(loop(46)) +
      P(loop(30)) +
      P(loop(12)) +
      P(loop(38) + loop(20), "d") +
      P("M-8-100L-7-24L7-24L8-100C8-110-8-110-8-100Z") +
      P("M-9-24h18v6h-18z") +
      P("M-4-106C-6-120 6-120 4-106") +
      P("M-4-96v64", "d")
    );
  },
  anise: () => {
    const pods = Array.from({ length: 8 }, (_, i) =>
      at(
        0,
        0,
        i * 45,
        shade("M0 0C10 6 30 10 46 3L46 0C30 2 10 2 0 0Z", { angle: 80, gap: 2.6, cx: 23, size: 30 }) +
          P("M0 0C8-10 30-12 46-2C48 0 48 2 46 3C30 10 10 9 0 0Z") +
          `<ellipse cx="28" cy="-1" rx="7" ry="4" class="d"/>` +
          P("M14-3C22-6 34-6 42-2", "d"),
      ),
    ).join("");
    return pods + `<circle r="6"/>` + P("M-3 0h6M0-3v6", "d");
  },
  rosemary: () => {
    let needles = "";
    for (let i = 0; i < 18; i++) {
      const y = 10 + i * 9.5;
      const side = i % 2 ? 1 : -1;
      const x = -i * 0.35;
      needles += at(x, y, side > 0 ? -40 : 220, P("M0 0C4-3 16-4 28-1.5C16 1 4 2 0 0Z") + P("M2 0C10-1 18-1 26-1", "d"));
    }
    return P("M0 0C4 60 2 120-6 186M3 0C7 60 5 120-3 186") + needles;
  },
  pepper: () =>
    [
      [0, 0],
      [22, 10],
      [8, 28],
      [36, -8],
      [-18, 18],
      [30, 34],
    ]
      .map(
        ([x, y]) =>
          at(
            x,
            y,
            0,
            shade("M7 0A7 7 0 0 1-5 5A9 9 0 0 0 7 0Z", { angle: 40, gap: 1.8, size: 10 }) +
              `<circle r="7"/>` +
              P("M-5 2c3-3 6-5 9-6", "d"),
          ),
      )
      .join(""),
  cinnamon: () => {
    const stick = (len) =>
      shade(`M0 2L${len} 3L${len} 10L0 8Z`, { angle: 80, gap: 2.8, cx: len / 2, size: len * 0.6 }) +
      P(`M0-8L${len}-10L${len} 10L0 8A3 8 0 0 1 0-8Z`) +
      P(`M${len}-10A7 10 0 0 1 ${len} 10M${len - 4}-6c6 2 8 8 4 12M${len - 2}-2c3 1 4 3 2 5`) +
      P(`M10-4C${f(len * 0.4)}-5 ${f(len * 0.7)}-5 ${len - 10}-6M12 4C${f(len * 0.4)} 4 ${f(len * 0.7)} 5 ${len - 10} 6M30-1c10-1 18-1 24 0`, "d");
    return stick(150) + at(14, 22, 8, stick(136));
  },
};

// ---- Where they sit on the tile: in the outer bands, so the content column stays calm ----
const place = [
  ["basil", 60, 50, 12, 1.7],
  ["chilli", 1200, 220, -30, 1.25],
  ["pepper", 250, 640, 0, 1.4],
  ["garlic", 1280, 820, 8, 1.55],
  ["spoon", 20, 1150, -28, 1.35],
  ["anise", 1240, 1380, 12, 1.6],
  ["lemon", 220, 1700, 0, 1.55],
  ["cinnamon", 1130, 1690, 24, 1.15],
  ["whisk", 1300, 2000, 26, 1.25],
  ["mushroom", 170, 2330, -8, 1.55],
  ["tomato", 1230, 2560, 6, 1.55],
  ["rosemary", 260, 2620, 24, 1.6],
  ["bay", 1290, 2930, 18, 1.5],
  ["pepper", 1180, 3300, 10, 1.4],
  ["chilli", 180, 3290, 150, 1.2],
  ["anise", 330, 3500, 30, 1.2],
];

const lines = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  path,circle,ellipse{vector-effect:non-scaling-stroke}
  .d{stroke-width:1.3}
  .h{stroke-width:0.9}
  .dot{fill:#000;stroke:none}
</style>
<g fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
${place.map(([m, x, y, r, s]) => at(x, y, r, motifs[m](), s)).join("\n")}
</g>
</svg>
`;

// ---- Colour blobs (kept off the top and bottom edges so the tile repeats cleanly) ----
const blobs = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<path fill="#f4b942" fill-opacity="0.5" d="M1440 70c-90 20-190 70-230 170-40 110 30 190 10 300-20 100-90 160-40 240 40 60 150 60 260 30z"/>
<path fill="#b7cdb0" fill-opacity="0.7" d="M0 880c120-20 250 30 280 140 30 120-70 190-50 300 20 110 120 150 80 240-40 80-180 90-310 60z"/>
<path fill="none" stroke="#e0603f" stroke-opacity="0.35" stroke-width="28" stroke-linecap="round" d="M40 2050c80-60 170-110 270-150M20 2130c110-70 210-120 320-160M70 2210c80-50 150-80 230-110"/>
<path fill="#b7cdb0" fill-opacity="0.55" d="M1440 1760c-70 10-140 50-150 120-12 80 60 120 40 190-16 60-70 90-40 140 30 46 90 50 150 40z"/>
<path fill="#f4b942" fill-opacity="0.38" d="M1440 2620c-140 0-280 60-320 190-40 140 60 230 20 360-30 100-110 160-60 230 40 50 200 70 360 40z"/>
<path fill="#e0603f" fill-opacity="0.22" d="M0 3000c90 10 170 70 180 160 10 100-80 150-60 230 14 60 60 100 30 140-30 30-90 30-150 20z"/>
</svg>
`;

// ---- Paper grain: fractal noise as faint brown fibres, tiling seamlessly ----
const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<filter id="g" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.16 -0.03"/>
</filter>
<rect width="320" height="320" filter="url(#g)"/>
</svg>
`;

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "lines.svg"), lines);
writeFileSync(join(out, "blobs.svg"), blobs);
writeFileSync(join(out, "grain.svg"), grain);
console.log("wrote lines.svg, blobs.svg and grain.svg to", out);
