// Builds the site for AWS Amplify Hosting and packs it for Amplify's "Deploy without Git":
//
//   npm run build:aws -- https://main.d1abc23.amplifyapp.com
//
// The site is served from the root of its own domain there (not /Programming/cooking/site/ as for Live Server), and
// the address given is used for canonical links, Open Graph and the sitemap. The output is dist/ plus
// world-plate-aws.zip, with a customHttp.yml inside so Amplify sends real security headers (lib/csp.ts).
// Amplify's own Git builds aren't used: they only support Next.js 12–15, and this is a static export anyway.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";
import { CSP_HEADER } from "../lib/csp.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const zipPath = join(root, "world-plate-aws.zip");

const siteUrl = (process.argv[2] || process.env.AWS_SITE_URL || "").replace(/\/$/, "");
if (siteUrl && !/^https:\/\/[\w.-]+$/.test(siteUrl)) {
  console.error(`Not a site address: ${siteUrl} (expected something like https://main.d1abc23.amplifyapp.com)`);
  process.exit(1);
}
if (!siteUrl) console.warn("No site address given: canonical links and the sitemap will point at localhost.");

const build = spawnSync("npm run build", {
  cwd: root,
  stdio: "inherit",
  shell: true,
  // BASE_PATH "/" = the domain root (next.config.ts strips the trailing slash).
  env: { ...process.env, BASE_PATH: "/", SITE_OUT: "dist", NEXT_PUBLIC_SITE_URL: siteUrl || "http://localhost:3000" },
});
if (build.status !== 0) process.exit(build.status ?? 1);

// Amplify reads customHttp.yml from the root of a manual deploy.
const yaml = `customHeaders:
  - pattern: '**'
    headers:
      - key: 'Content-Security-Policy'
        value: "${CSP_HEADER}"
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
      - key: 'Permissions-Policy'
        value: 'camera=(), microphone=(), geolocation=(), payment=()'
  - pattern: '/_next/static/**'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
`;
writeFileSync(join(dist, "customHttp.yml"), yaml);

// A plain zip (deflate, forward-slash paths) so it unpacks the same on Amplify's Linux servers.
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const local = [];
const central = [];
let offset = 0;
for (const file of files(dist)) {
  const name = Buffer.from(relative(dist, file).split("\\").join("/"));
  const data = readFileSync(file);
  const packed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);
  head.writeUInt16LE(20, 4); // version needed
  head.writeUInt16LE(0x0800, 6); // UTF-8 names
  head.writeUInt16LE(8, 8); // deflate
  head.writeUInt16LE(0, 10); // time
  head.writeUInt16LE(0x21, 12); // date: 1980-01-01
  head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(packed.length, 18);
  head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(name.length, 26);
  head.writeUInt16LE(0, 28);
  local.push(head, name, packed);

  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50, 0);
  entry.writeUInt16LE(20, 4); // made by
  head.copy(entry, 6, 4, 30); // version needed … name length, same as the local header
  entry.writeUInt16LE(0, 30); // extra
  entry.writeUInt16LE(0, 32); // comment
  entry.writeUInt16LE(0, 34); // disk
  entry.writeUInt16LE(0, 36); // internal attrs
  entry.writeUInt32LE(0, 38); // external attrs
  entry.writeUInt32LE(offset, 42);
  central.push(entry, name);
  offset += head.length + name.length + packed.length;
}
const centralSize = central.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(central.length / 2, 8);
end.writeUInt16LE(central.length / 2, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
writeFileSync(zipPath, Buffer.concat([...local, ...central, end]));

const mb = (statSync(zipPath).size / 1048576).toFixed(1);
console.log(`\nAWS build ready: ${zipPath} (${central.length / 2} files, ${mb} MB) for ${siteUrl || "an address not set yet"}.`);
console.log("Upload it in Amplify → your app → Deploy updates (or Create new app → Deploy without Git).");
