// Generates the site's background artwork (public/art/):
//   lines.webp — one tall 1440 × 3600 tile (drawn at 2× for sharp screens) of real engraved food illustrations,
//                used as a CSS mask so the ink colour comes from the theme / the section it sits in
//   blobs.svg  — soft organic colour shapes in the site palette (same tile size), a plain background image
//   grain.svg  — a faint paper-fibre texture laid over the canvas
// The drawings are public-domain line art from Pearson Scott Foresman, via Wikimedia Commons (PD-ScottForesman;
// e.g. https://commons.wikimedia.org/wiki/File:Onion_(PSF).png). scripts/art-src/ keeps them cleaned up: ink only,
// trimmed, at most 900 px — the first run turns any raw download dropped in there into that form.
// The idea — a cookbook-sketch canvas with colour blobs flowing top to bottom — came from a Refero reference the
// user shared (Pa'lais). Run: node scripts/make-page-art.mjs
import { readdirSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const W = 1440;
const H = 3600;
const X = 2; // drawn at 2×
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "art-src");
const out = join(here, "..", "public", "art");

// ---- 1. Clean the sources: white paper → transparent, ink → black with its anti-aliasing kept, then trim ----
async function clean(file) {
  const { data, info } = await sharp(file).flatten({ background: "#ffffff" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < data.length; i++) {
    rgba[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(((228 - data[i]) / 188) * 255))); // rgb stays 0 (black ink)
  }
  const trimmed = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
  return sharp(trimmed)
    .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
    .png({ palette: true, colours: 32, dither: 0, compressionLevel: 9, effort: 10 });
}
for (const f of readdirSync(src)) {
  const ext = extname(f).toLowerCase();
  const name = basename(f, extname(f));
  if (name.endsWith(".ink") || ![".png", ".jpg", ".jpeg"].includes(ext)) continue;
  await (await clean(join(src, f))).toFile(join(src, `${name}.ink.png`));
  unlinkSync(join(src, f));
  console.log("cleaned", f);
}

// ---- 2. Lay them out on the tile: down the outer bands, alternating sides, so the content column stays calm ----
// [drawing, x, y, height, rotation] in 1× tile pixels (x/y = the drawing's top-left before rotation).
const place = [
  ["rosemary", 30, 30, 360, -8],
  ["pimento", 1190, 150, 330, 10],
  ["onion", 60, 560, 250, 0],
  ["mushroom", 1110, 640, 250, 0],
  ["parsley", 40, 940, 330, 6],
  ["orange", 1110, 1100, 230, 0],
  ["spoons", 90, 1420, 300, -18],
  ["pomegranate", 1180, 1460, 320, 0],
  ["fennel", 20, 1860, 360, 0],
  ["carrot", 1190, 1930, 300, 16],
  ["fig", 40, 2360, 240, 0],
  ["sage", 1160, 2380, 330, -6],
  ["ginger", 90, 2740, 330, -4],
  ["pear", 1200, 2840, 260, 8],
  ["thyme", 210, 3200, 300, 12],
  ["grapes", 1200, 3260, 250, -6],
];

const layers = [];
for (const [name, x, y, h, rot] of place) {
  let buf = await sharp(join(src, `${name}.ink.png`)).resize({ height: h * X }).png().toBuffer();
  if (rot) buf = await sharp(buf).rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  // Keep everything inside the tile so it repeats without cutting a drawing in half.
  const left = Math.max(0, Math.min(W * X - meta.width, x * X));
  const top = Math.max(0, Math.min(H * X - meta.height, y * X));
  layers.push({ input: buf, left, top });
}

mkdirSync(out, { recursive: true });
// Encoded twice: a near-clean first pass smooths the ink edges so the final pass packs about a third smaller.
const tile = await sharp({ create: { width: W * X, height: H * X, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(layers)
  .webp({ quality: 92, alphaQuality: 92, effort: 4 })
  .toBuffer();
await sharp(tile).webp({ quality: 70, alphaQuality: 70, effort: 6 }).toFile(join(out, "lines.webp"));

// ---- 3. Colour blobs (kept off the top and bottom edges so the tile repeats cleanly) ----
const blobs = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<path fill="#f4b942" fill-opacity="0.5" d="M1440 70c-90 20-190 70-230 170-40 110 30 190 10 300-20 100-90 160-40 240 40 60 150 60 260 30z"/>
<path fill="#b7cdb0" fill-opacity="0.7" d="M0 880c120-20 250 30 280 140 30 120-70 190-50 300 20 110 120 150 80 240-40 80-180 90-310 60z"/>
<path fill="none" stroke="#e0603f" stroke-opacity="0.35" stroke-width="28" stroke-linecap="round" d="M40 2050c80-60 170-110 270-150M20 2130c110-70 210-120 320-160M70 2210c80-50 150-80 230-110"/>
<path fill="#b7cdb0" fill-opacity="0.55" d="M1440 1760c-70 10-140 50-150 120-12 80 60 120 40 190-16 60-70 90-40 140 30 46 90 50 150 40z"/>
<path fill="#f4b942" fill-opacity="0.38" d="M1440 2620c-140 0-280 60-320 190-40 140 60 230 20 360-30 100-110 160-60 230 40 50 200 70 360 40z"/>
<path fill="#e0603f" fill-opacity="0.22" d="M0 3000c90 10 170 70 180 160 10 100-80 150-60 230 14 60 60 100 30 140-30 30-90 30-150 20z"/>
</svg>
`;
writeFileSync(join(out, "blobs.svg"), blobs);

// ---- 4. Paper grain: fractal noise as faint brown fibres, tiling seamlessly ----
const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<filter id="g" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.16 -0.03"/>
</filter>
<rect width="320" height="320" filter="url(#g)"/>
</svg>
`;
writeFileSync(join(out, "grain.svg"), grain);
console.log("wrote lines.webp, blobs.svg and grain.svg to", out);
