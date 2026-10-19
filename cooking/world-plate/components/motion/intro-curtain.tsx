"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";

// Five slats; the middle one lifts first and the outer ones follow (0, 1, 2 steps from the centre).
const SLATS = [2, 1, 0, 1, 2];

/**
 * The first-load intro. kervangida.com's preloader, recorded 2026-10-19: a full-screen brand-colour panel holds
 * the logo while a mask fills it left to right (scaleX 0 → 1 over 2s, linear), then the panel slides up out of the
 * screen (~0.75s, ease-in-out close to easeInOutSine). Here the panel is cut into five slats that peel up from the
 * centre outward, 70ms apart, while the wordmark lifts away, and the page's own entrance follows. Pure CSS
 * (`.wp-intro` in globals.css) so it plays from first paint, on every full page load. While it runs, `data-intro`
 * on <html> pushes the Slush page-load clock past it; the flag is dropped on the first client navigation.
 * Reduced motion: no intro.
 */
export function IntroCurtain() {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) delete document.documentElement.dataset.intro;
  }, [pathname]);

  return (
    <div aria-hidden className="wp-intro">
      {SLATS.map((d, i) => (
        <span key={i} className="wp-intro__slat" style={{ "--s": i, "--d": d } as CSSProperties} />
      ))}
      <span className="wp-intro__mark">
        <span className="wp-intro__outline">World Plate</span>
        <span className="wp-intro__fill">World Plate</span>
      </span>
    </div>
  );
}
