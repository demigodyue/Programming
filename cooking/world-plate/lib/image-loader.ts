"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

/** Lets Unsplash's CDN resize and pick the format (AVIF/WebP) instead of proxying full-size originals. */
export default function imageLoader({ src, width, quality }: LoaderArgs) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const params = new URLSearchParams({
      w: String(width),
      q: String(quality ?? 70),
      auto: "format",
      fit: "crop",
    });
    return `${src}?${params}`;
  }
  return src;
}
