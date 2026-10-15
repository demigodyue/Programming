// Watermelon UI `footer-1` — adapted for World Plate:
// - newsletter form removed (the home page has a real, validated signup) and replaced by an `aside` slot
// - <a> → next/link, fixed shadows removed in favour of theme tokens
// - Structured restyle: full-bleed chalk band, uppercase group labels, cropped serif wordmark at the foot
import Link from "next/link";
import type { ReactNode } from "react";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface Footer1Props {
  logo: ReactNode;
  description: string;
  aside?: ReactNode;
  linkGroups: FooterLinkGroup[];
  copyright: string;
}

export function Footer1({ logo, description, aside, linkGroups, copyright }: Footer1Props) {
  return (
    <footer className="bg-chalk w-full overflow-hidden border-t">
      <div className="container-page pt-16 pb-8 sm:pt-20">
        <div className="flex flex-col justify-between gap-12 xl:flex-row xl:gap-24">
          <div className="sd-rise shrink-0 space-y-6 xl:w-[400px]">
            {logo}
            <p className="text-muted-foreground max-w-sm text-[0.9375rem] leading-relaxed">{description}</p>
            {aside}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 xl:gap-8">
            {linkGroups.map((group) => (
              <div key={group.title} className="sd-rise space-y-5">
                <h2 className="label-caps text-muted-foreground">{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-u text-sm underline-offset-4"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rule-draw mt-14 flex flex-col items-center justify-between gap-3 pt-8 sm:flex-row">
          <p className="text-muted-foreground text-xs">{copyright}</p>
          <p className="text-muted-foreground text-xs">
            Photos from{" "}
            <a href="https://unsplash.com" className="hover-fine:text-foreground underline underline-offset-2">
              Unsplash
            </a>
          </p>
        </div>
      </div>
      <p
        aria-hidden
        className="sd-rise font-display -mb-[0.2em] text-center text-[19.5vw] leading-[0.84] font-medium tracking-[-0.03em] whitespace-nowrap select-none"
      >
        World Plate
      </p>
    </footer>
  );
}
