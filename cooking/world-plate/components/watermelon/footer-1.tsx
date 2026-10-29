// Watermelon UI `footer-1` — adapted for Sizzle Atlas:
// - newsletter form removed (the home page has a real, validated signup) and replaced by an `aside` slot
// - <a> → next/link, fixed shadows removed in favour of theme tokens
// - Structured restyle: full-bleed chalk band, uppercase group labels, a sign-off line and back-to-top at the foot
// - Slush motion: the link columns fly in as a card row; links use Slush's .link underline
"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CardReveal } from "@/components/motion/card-reveal";
import { SectionArt } from "@/components/section-art";

export interface FooterLink {
  label: ReactNode;
  href: string;
}

export interface FooterLinkGroup {
  title: ReactNode;
  links: FooterLink[];
}

export interface Footer1Props {
  logo: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  linkGroups: FooterLinkGroup[];
  copyright: ReactNode;
  /** A short closing line, set in the display face; each word rises in as you reach it. */
  signoff: ReactNode;
  toTop: ReactNode;
}

export function Footer1({ logo, description, aside, linkGroups, copyright, signoff, toTop }: Footer1Props) {
  return (
    <footer className="bg-chalk relative isolate w-full overflow-hidden border-t">
      <SectionArt offset={3000} />
      <div className="container-page pt-16 pb-8 sm:pt-20">
        <div className="flex flex-col justify-between gap-12 xl:flex-row xl:gap-24">
          <div className="shrink-0 space-y-6 xl:w-[400px]">
            {logo}
            <p className="text-muted-foreground max-w-sm text-[0.9375rem] leading-relaxed">{description}</p>
            {aside}
          </div>

          <CardReveal as="div" className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 xl:gap-8">
            {linkGroups.map((group, gi) => (
              <div key={gi} className="space-y-5">
                <h2 className="label-caps text-muted-foreground">{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardReveal>
        </div>

        <div className="rule-draw mt-14 flex flex-col gap-8 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="foot-signoff font-display text-headline max-w-[16ch] text-[clamp(2rem,4.6vw,3.75rem)] leading-[0.95]">
            {signoff}
          </p>
          <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("wp:scroll-top"))}
              className="group border-foreground/30 hover-fine:bg-foreground hover-fine:text-background inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
            >
              {toTop}
              <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.75} aria-hidden />
            </button>
            <p className="text-muted-foreground text-xs">{copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
