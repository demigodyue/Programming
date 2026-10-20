// Generates the site's background artwork (public/art/): one tall 1440 × 3600 tile that repeats down the page
// without a seam. Two files so the colours can follow the theme:
//   lines.svg — monoline "toile" food drawings, used as a CSS mask (the line colour comes from the theme)
//   blobs.svg — soft organic colour shapes in the site palette, used as a plain background image
// Original drawings (chilli, garlic, basil, wooden spoon, whisk, star anise, lemon, mushroom, tomato, rosemary,
// peppercorns); the idea — a cookbook-sketch canvas with colour blobs flowing top to bottom — came from a Refero
// reference the user shared (Pa'lais). Run: node scripts/make-page-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 1440;
const H = 3600;
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "art");

// ---- Motifs, drawn round their own origin ----
const hatch = (x, y, n, dx, dy, len, angle = -35) =>
  Array.from({ length: n }, (_, i) => {
    const a = (angle * Math.PI) / 180;
    const x0 = x + i * dx;
    const y0 = y + i * dy;
    return `M${x0.toFixed(1)} ${y0.toFixed(1)}l${(Math.cos(a) * len).toFixed(1)} ${(Math.sin(a) * len).toFixed(1)}`;
  }).join("");

const motifs = {
  chilli: `
    <path d="M0 0c22-8 50 2 68 26s24 56 14 82c-6-28-22-50-44-66S6 14 0 0z"/>
    <path d="M14 10c18 3 34 14 44 32"/>
    <path d="M0 0c-8-6-12-16-8-26 4-8 12-10 16-6"/>
    <path d="M-2-2c6-6 16-6 22 0"/>
    <path d="${hatch(46, 40, 6, 4, 7, 9, 60)}"/>`,
  garlic: `
    <path d="M0 64c-26 0-44-18-44-40S-20-12 0-28c20 16 44 30 44 52S26 64 0 64z"/>
    <path d="M0-28c-6 24-6 62 0 92"/>
    <path d="M-20-8c-8 22-6 50 8 72"/><path d="M20-8c8 22 6 50-8 72"/>
    <path d="M0-28c-2-12 0-24 8-34"/><path d="M4-30c4-10 10-18 16-22"/>
    <path d="M-8 64l-5 9M0 64v10M8 64l5 9"/>
    <path d="${hatch(-36, 10, 5, 3, 8, 10, 70)}"/>`,
  basil: `
    <path d="M0 0c12 44 16 100 8 160"/>
    ${[
      [6, 20, -30],
      [10, 52, 200],
      [13, 84, -20],
      [13, 116, 190],
      [11, 146, -10],
    ]
      .map(
        ([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">
          <path d="M0 0c20-18 50-16 66 4-20 14-50 14-66-4z"/>
          <path d="M0 0c22 1 44 3 66 4"/>
          <path d="M18 2l8-9M32 3l8-9M46 3l7-8M18 2l8 8M32 3l8 8M46 4l6 7"/>
        </g>`,
      )
      .join("")}`,
  spoon: `
    <path d="M0-5h150a5 5 0 0 1 0 10H0a5 5 0 0 1 0-10z"/>
    <ellipse cx="190" cy="0" rx="40" ry="24"/>
    <ellipse cx="192" cy="0" rx="28" ry="14"/>
    <path d="M14 0h120" stroke-dasharray="2 9"/>
    <path d="${hatch(176, -8, 5, 7, 0, 12, 50)}"/>`,
  whisk: `
    <path d="M-7-90h14v70h-14z"/><path d="M-7-80h14M-7-30h14"/>
    <path d="M0-20c-30 50-30 120 0 150 30-30 30-100 0-150z"/>
    <path d="M0-20c-18 50-18 120 0 150 18-30 18-100 0-150z"/>
    <path d="M0-20c-6 50-6 120 0 150 6-30 6-100 0-150z"/>`,
  anise: `${Array.from({ length: 8 }, (_, i) => {
    const r = i * 45;
    return `<g transform="rotate(${r})"><path d="M0 0c8-8 28-10 44 0-16 10-36 8-44 0z"/><circle cx="26" cy="0" r="3.2"/></g>`;
  }).join("")}<circle r="6"/>`,
  lemon: `
    <circle r="54"/><circle r="46"/>
    ${Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return `<path d="M0 0L${(Math.cos(a) * 44).toFixed(1)} ${(Math.sin(a) * 44).toFixed(1)}"/>`;
    }).join("")}
    <path d="M12 -26c2 4 2 7 0 10M-20 18c3 3 4 6 3 9"/>`,
  mushroom: `
    <path d="M-56 0c0-40 24-64 56-64s56 24 56 64c-18 8-38 10-56 10S-38 8-56 0z"/>
    <path d="M-30 6l4 8M-18 8l2 9M18 8l-2 9M30 6l-4 8"/>
    <path d="M-16 6c-4 24-4 42 2 58h28c6-16 6-34 2-58"/>
    <circle cx="-26" cy="-34" r="5"/><circle cx="14" cy="-46" r="6.5"/><circle cx="30" cy="-20" r="3.5"/><circle cx="-4" cy="-22" r="3"/>
    <path d="${hatch(-10, 20, 4, 6, 6, 9, -60)}"/>`,
  tomato: `
    <path d="M0-44c34 0 56 22 56 48S32 52 0 52-56 30-56 4-34-44 0-44z"/>
    <path d="M0-44c-8-10-24-14-34-8 12 2 20 8 24 14-14 0-24 6-28 14 12-4 26-4 38 0-2 8 0 16 6 22 2-10 6-18 12-22 10 4 22 4 32-2-10-6-20-10-30-10 6-8 6-16 2-22-6 6-12 12-22 14z"/>
    <path d="M0-50c0-8 2-14 8-18"/>
    <path d="M24-20c10 6 16 16 18 28"/>`,
  rosemary: `
    <path d="M0 0c4 60 2 120-6 170"/>
    ${Array.from({ length: 14 }, (_, i) => {
      const y = 8 + i * 11.5;
      const x = 0.6 * Math.sin(i) + (i * -0.4);
      return `<path d="M${x.toFixed(1)} ${y}l${(-18 + (i % 2) * 2).toFixed(0)} -10M${x.toFixed(1)} ${y}l${(18 - (i % 2) * 2).toFixed(0)} -10"/>`;
    }).join("")}`,
  pepper: `${[
    [0, 0],
    [22, 10],
    [8, 28],
    [36, -8],
    [-18, 18],
    [30, 34],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5"/><path d="M${x - 2} ${y - 2}c1-1 3-1 4 0"/>`)
    .join("")}`,
};

// ---- Where they sit on the tile: mostly in the outer bands, so the content column stays calm ----
const place = [
  ["basil", 70, 60, 14, 2.1],
  ["chilli", 1190, 260, -24, 1.8],
  ["pepper", 250, 640, 0, 1.4],
  ["garlic", 1270, 820, 8, 1.8],
  ["spoon", 30, 1150, -28, 1.5],
  ["anise", 1240, 1380, 12, 1.7],
  ["lemon", 230, 1700, 0, 1.6],
  ["pepper", 1200, 1700, 40, 1.3],
  ["whisk", 1290, 1980, 28, 1.6],
  ["mushroom", 170, 2330, -8, 1.8],
  ["tomato", 1220, 2560, 6, 1.7],
  ["rosemary", 250, 2640, 24, 1.8],
  ["basil", 1330, 3000, -175, 1.8],
  ["pepper", 1180, 3260, 10, 1.4],
  ["chilli", 170, 3380, 150, 1.7],
  ["anise", 300, 3500, 30, 1.3],
];

const lines = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>path,circle,ellipse{vector-effect:non-scaling-stroke}</style>
<g fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
${place.map(([m, x, y, r, s]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${motifs[m]}</g>`).join("\n")}
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

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "lines.svg"), lines);
writeFileSync(join(out, "blobs.svg"), blobs);
console.log("wrote", join(out, "lines.svg"), "and blobs.svg");
