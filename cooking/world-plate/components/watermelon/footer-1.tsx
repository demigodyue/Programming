// Watermelon UI `footer-1` — adapted for World Plate:
// - newsletter form removed (the home page has a real, validated signup) and replaced by an `aside` slot
// - <a> → next/link, fixed shadows removed in favour of theme tokens
// - Structured restyle: full-bleed chalk band, uppercase group labels, cropped serif wordmark at the foot
// - Slush motion: the link columns fly in as a card row; links use Slush's .link underline
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
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
  credit: ReactNode;
}

export function Footer1({ logo, description, aside, linkGroups, copyright, credit }: Footer1Props) {
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

        <div className="rule-draw mt-14 flex flex-col items-center justify-between gap-3 pt-8 sm:flex-row">
          <p className="text-muted-foreground text-xs">{copyright}</p>
          <p className="text-muted-foreground text-xs">{credit}</p>
        </div>
      </div>
      <p
        aria-hidden
        className="foot-rise font-display text-headline -mb-[0.1em] text-center text-[19vw] leading-[0.9] tracking-[0.01em] whitespace-nowrap select-none"
      >
        {/* Each letter rises out of the footer's bottom edge as you reach it (scrubbed, .foot-rise). */}
        {Array.from("World Plate").map((ch, i) => (
          <span key={i} style={{ "--li": i } as CSSProperties}>
            {ch === " " ? "\u00a0" : ch}
          </span>
        ))}
      </p>
    </footer>
  );
}
