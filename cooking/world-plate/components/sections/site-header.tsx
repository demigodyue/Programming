"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AccountButton } from "@/components/account/account-button";
import { T } from "@/components/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { LogoMark } from "@/components/logo";
import { FlipFace, flipClass, type FlipAccent } from "@/components/motion/flip-face";
import { ThemeIconToggle } from "@/components/theme-switch";
import { HeaderSearch, type SearchItem, type SearchPlace } from "./header-search";
import { useT } from "@/lib/lang";

const NAV: { href: string; label: string; ja: string; accent: FlipAccent }[] = [
  { href: "/recipes", label: "Recipes", ja: "レシピ", accent: "yellow" },
  { href: "/#cuisines", label: "Cuisines", ja: "各国料理", accent: "orange" },
  { href: "/favorites", label: "Favorites", ja: "お気に入り", accent: "mint" },
  { href: "/shopping-list", label: "Shopping list", ja: "買い物リスト", accent: "lavender" },
];

const MOBILE = "(max-width: 991px)";

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname.startsWith("/cuisine");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Slush's floating nav: a logo circle at the left edge of the screen; at the right edge a row of pill links, then
 * the language, theme, plus and search circles, and the account circle last. Every pill flips in 3D on hover.
 * The search circle opens a search box with live results (HeaderSearch).
 *
 * - The bar rides lower on the home page until you scroll 50px, then moves up (top, 0.6s elastic).
 * - Desktop: scrolling down flies the pills up out of view, first pill first (0.03s apart, 0.75s
 *   elastic); scrolling up — or hovering the plus — brings them back, last pill first. Leaving the
 *   right-hand group while scrolled down hides them again.
 * - ≤991px: the pills wait off-screen to the right; the plus slides them in under the bar (last pill
 *   first) and turns into a minus. No backdrop, as on Slush.
 * - Scroll direction is only read after 10px of movement (initDetectScrollingDirection).
 */
export function SiteHeader({ searchItems, searchPlaces }: { searchItems: SearchItem[]; searchPlaces: SearchPlace[] }) {
  const pathname = usePathname();
  const t = useT();
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
      <nav aria-label={t("Main", "メイン")} className="nav-intro relative flex w-full items-start justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={t("World Plate home", "World Plate ホーム")}
          onClick={(e) => {
            // Already home: a link to the same page would do nothing, so glide back to the top instead.
            if (pathname !== "/") return;
            e.preventDefault();
            window.dispatchEvent(new Event("wp:scroll-top"));
          }}
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
                  <FlipFace className="min-h-11">
                    <T en={item.label} ja={item.ja} />
                  </FlipFace>
                </Link>
              </li>
            ))}
          </ul>

          <LangToggle className="nav-circle nav-circle--text bg-dot text-dot-foreground size-[50px]" />
          {/* Phones keep the bar on one line without it; the footer has the full theme switch. */}
          <ThemeIconToggle className="nav-circle bg-dot text-dot-foreground size-[50px] max-sm:hidden" />

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="site-nav"
            aria-label={mobile ? (open ? t("Close menu", "メニューを閉じる") : t("Open menu", "メニューを開く")) : t("Show navigation", "ナビゲーションを表示")}
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

          <HeaderSearch items={searchItems} places={searchPlaces} className="nav-circle bg-primary text-primary-foreground size-[50px]" />
          <AccountButton className="nav-circle nav-circle--text bg-dot text-dot-foreground size-[50px]" />
        </div>
      </nav>
    </header>
  );
}
