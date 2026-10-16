"use client";

import { Menu, Search, X } from "lucide-react";
import { m, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Scramble } from "@/components/motion/scramble";
import { ThemeIconToggle } from "@/components/theme-switch";
import { LazyThemeSwitch } from "@/components/theme-switch-lazy";

const NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/#cuisines", label: "Cuisines" },
  { href: "/favorites", label: "Favorites" },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_LD = [0.22, 0.61, 0.36, 1] as const;

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname.startsWith("/cuisine");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Floating header after launchdarkly.com: the monogram sits in its own chip, the links in a
 * centred pill, the tools in a third. Scrolling collapses the "World Plate" name into the
 * monogram (width, 300ms linear) and the chips gain their surface (350ms morph curve).
 * The active link is marked by a sliding hairline underline.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

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

  const chip = cn(
    "morph-shape border",
    scrolled || open ? "bg-card border-border" : "border-transparent bg-transparent",
  );

  return (
    <header style={{ viewTransitionName: "site-header" }} className="fixed inset-x-0 top-0 z-40">
      <m.div
        aria-hidden
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="bg-background pointer-events-none absolute inset-0 border-b"
      />
      {/* Reading progress: a hairline that fills as you scroll (scroll-driven, no JS). */}
      <span aria-hidden className="scroll-progress bg-foreground pointer-events-none absolute inset-x-0 top-0 h-px" />
      <div className="container-page relative">
        <div className="text-foreground">
          <nav aria-label="Main" className="relative flex h-16 items-center justify-between gap-2 pt-2">
            <Link
              href="/"
              className={cn(chip, "drop-in flex h-11 items-center rounded-full pr-1 pl-1.5")}
              style={{ "--i": 0 } as CSSProperties}
              aria-label="World Plate home"
            >
              <LogoMark />
              {/* The name collapses into the monogram on scroll (LaunchDarkly's wordmark → arrow). */}
              <span
                className={cn(
                  "label-caps grid overflow-hidden whitespace-nowrap transition-[grid-template-columns,opacity,padding] duration-300 ease-linear",
                  scrolled ? "grid-cols-[0fr] pl-0 opacity-0" : "grid-cols-[1fr] pr-2 pl-2.5 opacity-100",
                )}
              >
                <span className="min-w-0">World Plate</span>
              </span>
            </Link>

            <ul
              className="drop-in bg-card absolute left-1/2 hidden h-11 -translate-x-1/2 items-center gap-6 rounded-full border px-6 md:flex"
              style={{ "--i": 1 } as CSSProperties}
            >
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className="link-u relative block py-2 text-[0.8125rem]">
                      <Scramble text={item.label} onHover duration={450} />
                      {active && (
                        <m.span
                          layoutId="nav-active"
                          transition={{ type: "spring", duration: 0.45, bounce: 0 }}
                          className="bg-foreground absolute inset-x-0 bottom-1 h-px"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className={cn(chip, "drop-in flex h-11 items-center gap-0.5 rounded-full px-0.5")} style={{ "--i": 2 } as CSSProperties}>
              <Link
                href="/recipes"
                aria-label="Search recipes"
                className="hover-fine:bg-foreground/8 grid size-10 place-items-center rounded-full transition-colors duration-300"
              >
                <Search className="size-[17px]" strokeWidth={1.5} aria-hidden />
              </Link>
              <ThemeIconToggle />
              <button
                type="button"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((o) => !o)}
                className="hover-fine:bg-foreground/8 grid size-10 place-items-center rounded-full md:hidden"
              >
                {open ? (
                  <X className="size-5" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Menu className="size-5" strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {open && (
              <m.div
                id="mobile-menu"
                // The panel unrolls downward (clip-path), LaunchDarkly curve; reduced motion: fade.
                initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
                exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: 0.45, ease: EASE_LD }}
                className="relative pt-2 pb-6 md:hidden"
              >
                <ul className="grid">
                  {NAV.map((item, i) => (
                    <m.li
                      key={item.href}
                      initial={{ opacity: 0, transform: reduce ? "none" : "translateY(40px)" }}
                      animate={{ opacity: 1, transform: "translateY(0px)" }}
                      transition={{ duration: 0.7, delay: 0.12 + 0.07 * i, ease: EASE_LD }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        className="aria-[current=page]:underline flex items-center justify-between border-b py-3 font-display text-4xl leading-none font-medium underline-offset-[6px]"
                      >
                        {item.label}
                        <span aria-hidden className="hex-outline" />
                      </Link>
                    </m.li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between">
                  <span className="label-caps text-muted-foreground">Theme</span>
                  <LazyThemeSwitch />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
