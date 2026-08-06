import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // `next/image` rejects any absolute URL whose host isn't listed here with a
    // 400, so the scroll-expansion hero's remote artwork has to be allow-listed.
    // `search` is deliberately omitted: Unsplash only serves through query
    // strings (`?q=80&w=1280&auto=format&fit=crop`), and an empty `search`
    // would reject every one of those.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
