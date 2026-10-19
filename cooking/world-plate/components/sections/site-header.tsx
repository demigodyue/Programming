"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LogoMark } from "@/components/logo";
import { FlipFace, flipClass, type FlipAccent } from "@/components/motion/flip-face";
import { ThemeIconToggle } from "@/components/theme-switch";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; accent: FlipAccent }[] = [
  { href: "/recipes", label: "Recipes", accent: "yellow" },
  { href: "/#cuisines", label: "Cuisines", accent: "orange" },
  { href: "/favorites", label: "Favorites", accent: "mint" },
];

const MOBILE = "(max-width: 991px)";

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname.startsWith("/cuisine");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Slush's floating nav: a logo circle on the left; on the right a row of pill links, a plus button,
 * the theme circle and a dark "Search" pill. Every pill flips in 3D on hover.
 *
 * - The bar rides lower on the home page until you scroll 50px, then moves up (top, 0.6s elastic).
 * - Desktop: scrolling down flies the pills up out of view, first pill first (0.03s apart, 0.75s
 *   elastic); scrolling up — or hovering the plus — brings them back, last pill first. Leaving the
 *   right-hand group while scrolled down hides them again.
 * - ≤991px: the pills wait off-screen to the right; the plus slides them in under the bar (last pill
 *   first) and turns into a minus. No backdrop, as on Slush.
 * - Scroll direction is only read after 10px of movement (initDetectScrollingDirection).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pillsHidden, setPillsHidden] = useState(false);
  const [mobile, setMobile] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const media = window.matchMedia(MOBILE);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) < 10) return;
      const down = y > lastY.current;
      const started = y > 50;
      lastY.current = y;
      setScrolled(started);
      if (down && started) setPillsHidden(true);
      else if (!down) setPillsHidden(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the mobile menu on navigation and on Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const expanded = mobile ? open : !pillsHidden;
  const onPlus = () => {
    if (window.matchMedia(MOBILE).matches) setOpen((o) => !o);
    else setPillsHidden(false);
  };

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="nav-bar"
      data-home={pathname === "/" || undefined}
      data-scrolled={scrolled || undefined}
    >
      <nav aria-label="Main" className="nav-intro container-page flex items-start justify-between gap-3">
        <Link
          href="/"
          aria-label="World Plate home"
          className="nav-circle nav-logo bg-dot text-dot-foreground pointer-events-auto grid size-[50px] shrink-0 place-items-center rounded-full"
        >
          <LogoMark ring={false} className="size-9" />
        </Link>

        <div
          className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5"
          onMouseLeave={() => {
            if (window.scrollY > 50 && !window.matchMedia(MOBILE).matches) setPillsHidden(true);
          }}
        >
          <ul
            id="site-nav"
            className="nav-pills flex items-center gap-1.5"
            data-hidden={pillsHidden || undefined}
            data-open={open || undefined}
            inert={mobile && !open}
            style={{ "--n": NAV.length } as CSSProperties}
          >
            {NAV.map((item, i) => (
              <li key={item.href} className="nav-pill" style={{ "--i": i } as CSSProperties}>
                <Link
                  href={item.href}
                  data-accent={item.accent}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={flipClass("outline", "text-[0.8125rem]")}
                >
                  <FlipFace className="min-h-11">{item.label}</FlipFace>
                </Link>
              </li>
            ))}
          </ul>

          <ThemeIconToggle className="nav-circle bg-dot text-dot-foreground size-[50px]" />

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="site-nav"
            aria-label={mobile ? (open ? "Close menu" : "Open menu") : "Show navigation"}
            data-open={(mobile && open) || undefined}
            onMouseEnter={() => !window.matchMedia(MOBILE).matches && setPillsHidden(false)}
            onClick={onPlus}
            className="nav-circle nav-menu bg-dot text-dot-foreground grid size-[50px] place-items-center rounded-full"
          >
            <span aria-hidden className="relative grid size-4 place-items-center">
              <span className="nav-menu__line nav-menu__h" />
              <span className="nav-menu__line nav-menu__v" />
            </span>
          </button>

          <Link href="/recipes" data-accent="yellow" className={cn(flipClass("solid"), "text-[0.8125rem]")}>
            <FlipFace>
              <Search className="size-4" strokeWidth={1.75} aria-hidden />
              Search
            </FlipFace>
          </Link>
        </div>
      </nav>
    </header>
  );
}
