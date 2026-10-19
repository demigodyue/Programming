"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * kervangida.com's intro, recorded 2026-10-19: a full-screen brand-colour panel holds the logo while a mask
 * fills it left to right (a rect going scaleX 0 → 1 over 2s, linear); after a short hold the whole panel slides
 * up out of the screen (translateY 0 → -100% in ~0.75s on an ease-in-out close to easeInOutSine), the logo
 * riding up with it. Here it is pure CSS (`.wp-intro` in globals.css) so it plays from first paint, on every full
 * page load. While it runs, `data-intro` on <html> pushes the Slush page-load clock past it; that flag is
 * dropped on the first client navigation so later pages load on their normal clock. Reduced motion: no intro.
 */
export function IntroCurtain() {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) delete document.documentElement.dataset.intro;
  }, [pathname]);

  return (
    <div aria-hidden className="wp-intro">
      <span className="wp-intro__mark">
        <span className="wp-intro__outline">World Plate</span>
        <span className="wp-intro__fill">World Plate</span>
      </span>
    </div>
  );
}
