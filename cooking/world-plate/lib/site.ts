export const site = {
  name: "Sizzle Atlas",
  description:
    "Famous dishes from around the world with full, tested recipes — ramen to croissants, momo to tacos al pastor.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};

/**
 * The Japanese fonts, from Google Fonts (split by unicode-range, so a page fetches only the glyphs it shows). No 400:
 * Japanese at the regular weight reads thin on the cream canvas, so regular text resolves to Noto Sans JP 500.
 */
export const JA_FONTS = "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Noto+Sans+JP:wght@500;700&display=swap";

/** Metadata `other` entry carrying a page's Japanese tab title (components/title-sync.tsx swaps it in). */
export const jaTitle = (title: string) => ({ "title-ja": `${title} · ${site.name}` });

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Sized Unsplash URL for places that can't use next/image (Open Graph, JSON-LD). */
export function unsplashSized(src: string, width: number, height?: number) {
  const params = new URLSearchParams({ w: String(width), q: "75", auto: "format", fit: "crop" });
  if (height) params.set("h", String(height));
  return `${src}?${params}`;
}
