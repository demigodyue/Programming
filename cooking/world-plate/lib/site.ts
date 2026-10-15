export const site = {
  name: "World Plate",
  description:
    "Famous dishes from around the world with full, tested recipes — ramen to croissants, momo to tacos al pastor.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Sized Unsplash URL for places that can't use next/image (Open Graph, JSON-LD). */
export function unsplashSized(src: string, width: number, height?: number) {
  const params = new URLSearchParams({ w: String(width), q: "75", auto: "format", fit: "crop" });
  if (height) params.set("h", String(height));
  return `${src}?${params}`;
}
