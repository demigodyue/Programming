import type { NextConfig } from "next";

/**
 * Static export: `npm run build` writes plain HTML/CSS/JS to `out/` and copies it to `../site`,
 * so the app opens with VS Code Live Server — no Node server, no port to start.
 *
 * Live Server serves the whole VS Code workspace folder, so the site is not at the URL root.
 * BASE_PATH is its path under that folder (default: workspace = the GitHub folder, giving
 * http://127.0.0.1:5500/Programming/cooking/site/). Change it if you open a different folder:
 *   BASE_PATH=/cooking/site npm run build      (workspace = Programming)
 *   BASE_PATH=/site npm run build              (workspace = cooking)
 * `npm run dev` ignores it and still serves at http://localhost:3000/.
 *
 * Security headers (CSP etc.) can't be sent by a static file server, so they're gone with the server.
 */
const isBuild = process.env.NODE_ENV === "production";
const basePath = isBuild ? (process.env.BASE_PATH ?? "/Programming/cooking/site").replace(/\/$/, "") : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // /recipes/ → recipes/index.html, which any static server (Live Server included) resolves.
  trailingSlash: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Tailwind runs through postcss.config.mjs (builds use webpack; see that file).
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    qualities: [50, 55, 60, 70, 80],
  },
};

export default nextConfig;
