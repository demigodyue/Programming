// Minimal static file server for the E2E run (serves out/ at the URL root, like a static host).
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 3200);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

/**
 * The client asks for flat segment-prefetch names (`__next.recipes.$d$slug.__PAGE__.txt`) but Next 16's
 * export writes them nested (`__next.recipes/$d$slug/__PAGE__.txt`). scripts/copy-site.mjs flattens them
 * for Live Server; here we resolve the nested file instead, so client navigations (and the page swing)
 * work in E2E runs too.
 */
function nestedPrefetch(file) {
  const name = basename(file);
  if (!name.startsWith("__next.")) return null;
  const parts = name.split(".");
  if (parts.length < 4) return null;
  const nested = [`__next.${parts[1]}`, ...parts.slice(2, -2), `${parts.at(-2)}.${parts.at(-1)}`];
  return join(dirname(file), ...nested);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) file = nestedPrefetch(file) ?? file;
  if (!existsSync(file)) {
    res.writeHead(404, { "Content-Type": types[".html"] });
    return createReadStream(join(root, "404.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
