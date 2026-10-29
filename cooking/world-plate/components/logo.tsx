import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The Sizzle Atlas logo: the owner's artwork (logo/ in this folder), a cast-iron pan holding a glowing globe with map
 * pins, steam and sparks. public/brand/ holds transparent cut-outs made from it: the mark (pan only) and the full
 * lockup in two versions, the original cream "ATLAS" for dark backgrounds and a navy one for light backgrounds.
 * Favicon, Apple icon and the link preview (app/icon.png, apple-icon.png, opengraph-image.png) come from the same art.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export: next/image's loader is for Unsplash
    <img
      src={`${BASE}/brand/mark-160.webp`}
      srcSet={`${BASE}/brand/mark-96.webp 96w, ${BASE}/brand/mark-160.webp 160w, ${BASE}/brand/mark-320.webp 320w`}
      sizes="56px"
      width={984}
      height={889}
      alt=""
      decoding="async"
      className={cn("h-auto w-14 select-none", className)}
      draggable={false}
    />
  );
}

/** The full lockup (mark, "SIZZLE ATLAS", "World recipe collection"), switching versions with the theme. */
export function Logo({ className }: { className?: string }) {
  const img = (tone: "light" | "dark", cls: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- see LogoMark
    <img
      src={`${BASE}/brand/lockup-${tone}-360.webp`}
      srcSet={`${BASE}/brand/lockup-${tone}-360.webp 360w, ${BASE}/brand/lockup-${tone}-720.webp 720w`}
      sizes="180px"
      width={1096}
      height={1178}
      alt=""
      decoding="async"
      className={cls}
      draggable={false}
    />
  );
  return (
    <span className={cn("inline-block w-[180px]", className)} role="img" aria-label="Sizzle Atlas">
      {img("light", "h-auto w-full dark:hidden")}
      {img("dark", "hidden h-auto w-full dark:block")}
    </span>
  );
}
