// Copies the static export (out/) to ../site so cooking/index.html can open it with Live Server.
import { copyFileSync, cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "out");
const to = resolve(root, "..", "site");

if (!existsSync(join(from, "index.html"))) {
  console.error("No out/index.html — run `next build` first.");
  process.exit(1);
}
// Empty the folder rather than deleting it: Live Server, OneDrive or an open terminal may hold it open.
if (existsSync(to)) {
  for (const entry of readdirSync(to)) rmSync(join(to, entry), { recursive: true, force: true, maxRetries: 3 });
}
cpSync(from, to, { recursive: true });

/**
 * Next 16's export writes route-segment prefetch payloads as nested folders
 * (`__next.recipes/$d$slug/__PAGE__.txt`) but the client requests flat names
 * (`__next.recipes.$d$slug.__PAGE__.txt`). Without the flat copies every client-side
 * navigation 404s and falls back to a full page load (losing the page transitions).
 */
let flattened = 0;
function flatten(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name.startsWith("__next.")) copyNested(full, dir, entry.name);
    else flatten(full);
  }
}
function copyNested(srcDir, targetDir, prefix) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) copyNested(src, targetDir, name);
    else {
      copyFileSync(src, join(targetDir, name));
      flattened++;
    }
  }
}
flatten(to);

/**
 * A <meta> Content-Security-Policy only covers what comes after it, and Next writes its own preload links and chunk
 * scripts into <head> before the layout's tags. Move the policy up to sit right after <meta charset> in every page.
 */
const CSP_META = /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/;
let hoisted = 0;
function hoistCsp(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) hoistCsp(full);
    else if (entry.name.endsWith(".html")) {
      const html = readFileSync(full, "utf8");
      const meta = html.match(CSP_META)?.[0];
      if (!meta) continue;
      const moved = html.replace(meta, "").replace(/<meta charSet="utf-8"\/>/, (charset) => charset + meta);
      writeFileSync(full, moved);
      hoisted++;
    }
  }
}
hoistCsp(to);

console.log(`Static site ready: ${to} (${flattened} prefetch files flattened, CSP first in ${hoisted} pages)\nOpen cooking/index.html with Live Server.`);
