import type { Metadata, Viewport } from "next";
import { Anton, Dela_Gothic_One, Inter, Noto_Sans_JP } from "next/font/google";
import { preconnect } from "react-dom";
import { AccountBoot } from "@/components/account/account-boot";
import { T } from "@/components/i18n";
import { Cursor } from "@/components/motion/cursor";
import { IntroCurtain } from "@/components/motion/intro-curtain";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { MouseDepth } from "@/components/motion/mouse-depth";
import { PageArt } from "@/components/page-art";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageSwing } from "@/components/motion/page-swing";
import { ScrollMotion } from "@/components/motion/scroll-motion";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { db } from "@/db/db";
import { searchRecipes } from "@/db/queries/recipes";
import { fold } from "@/lib/recipe-filter";
import { site } from "@/lib/site";
import "./globals.css";

// Foudre type, two families only: Anton for display (standing in for Beni 900) and Inter for everything else
// (standing in for Clash Grotesk). Anton is preloaded because the hero headline and wordmark are set in it.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Japanese, split by unicode-range so a page only downloads the glyphs it uses, and not preloaded — English visitors
// never fetch it. Dela Gothic One, a heavy poster face, stands under Anton; Noto Sans JP under Inter.
const jpDisplay = Dela_Gothic_One({
  variable: "--font-jp-display",
  weight: "400",
  display: "swap",
  preload: false,
});

const jp = Noto_Sans_JP({
  variable: "--font-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — famous dishes from around the world`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6e3b4" },
    { media: "(prefers-color-scheme: dark)", color: "#00522d" },
  ],
};

// The intro greets every full load of the home page only. Before first paint, drop it anywhere else, for reduced
// motion, or when the "wp-intro-skip" flag is set (the E2E specs set it; see tests/e2e/intro.spec.ts).
const HOME = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
const INTRO_SKIP = `try{var p=location.pathname,h=${JSON.stringify(HOME)};if(!(p===h||p===h+"index.html"||p+"/"===h)||localStorage.getItem("wp-intro-skip")||matchMedia("(prefers-reduced-motion: reduce)").matches){var d=document.documentElement;d.removeAttribute("data-intro");d.removeAttribute("data-intro-lock")}}catch(e){}`;

// Pick the language before first paint: the visitor's saved choice, else Japanese for a Japanese browser.
const LANG_INIT = `try{var l=localStorage.getItem("wp:lang");if(!l&&/^ja(-|$)/i.test(navigator.language||""))l="ja";if(l==="ja"){var r=document.documentElement;r.dataset.lang="ja";r.lang="ja"}}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The header search's dish list, built once at build time (trending first).
  const searchItems = (await searchRecipes(db, { cuisine: [], vegetarian: false })).map((r) => ({
    slug: r.slug,
    title: r.title,
    titleJa: r.ja.title,
    cuisine: r.cuisineName,
    cuisineJa: r.ja.cuisineName,
    image: r.image,
    minutes: r.totalMinutes,
    text: fold([r.title, r.ja.title, r.cuisineName, r.ja.cuisineName, r.description, r.ja.description].join(" ")),
  }));
  // Every page leads with an Unsplash photo — open the connection before the <img> is parsed.
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" suppressHydrationWarning data-intro="" data-intro-lock="" className={`${anton.variable} ${inter.variable} ${jpDisplay.variable} ${jp.variable}`}>
      <head>
        {/* Decide about the intro before first paint (see INTRO_SKIP). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SKIP }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />
      </head>
      <body className="relative isolate flex min-h-dvh flex-col">
        <PageArt />
        <ThemeProvider>
          <MotionProvider>
          <a
            href="#main"
            className="bg-primary text-primary-foreground sr-only z-50 rounded-full px-5 py-3 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            <T en="Skip to content" ja="本文へスキップ" />
          </a>
          <IntroCurtain />
          <div aria-hidden className="scroll-progress" />
          <LenisProvider />
          <ScrollMotion />
          <MouseDepth />
          <PageSwing />
          <Cursor />
          <AccountBoot />
          <SiteHeader searchItems={searchItems} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
