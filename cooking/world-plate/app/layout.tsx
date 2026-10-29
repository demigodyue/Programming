import type { Metadata, Viewport } from "next";
import { Archivo, Plus_Jakarta_Sans } from "next/font/google";
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
import { TitleSync } from "@/components/title-sync";
import { db } from "@/db/db";
import { listCuisines } from "@/db/queries/cuisines";
import { getRecipeBySlug, searchRecipes } from "@/db/queries/recipes";
import { CSP } from "@/lib/csp";
import { placeWords } from "@/lib/places";
import { fold } from "@/lib/recipe-filter";
import { JA_FONTS, site } from "@/lib/site";
import "./globals.css";

// Two families: Archivo for display (variable: set expanded and extra bold in globals.css, .font-display) and Plus
// Jakarta Sans for everything else. Both are variable fonts, so one file each covers every weight.
const display = Archivo({
  variable: "--font-display-face",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-face",
  subsets: ["latin"],
  display: "swap",
});

// The Japanese fonts (Dela Gothic One under the display face, Noto Sans JP under Plus Jakarta Sans) aren't bundled: their stylesheet is
// hundreds of unicode-range rules, render-blocking for every visitor if next/font included it. It's added only when
// the page is in Japanese — by LANG_INIT below, or by setLang() (lib/lang.ts; the URL is JA_FONTS in lib/site.ts).

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — famous dishes from around the world`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  other: { "title-ja": `${site.name} — 世界の名物料理` },
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
const LANG_INIT = `try{var l=localStorage.getItem("wp:lang");if(!l&&/^ja(-|$)/i.test(navigator.language||""))l="ja";if(l==="ja"){var r=document.documentElement;r.dataset.lang="ja";r.lang="ja";var f=document.createElement("link");f.rel="stylesheet";f.id="wp-ja-fonts";f.href=${JSON.stringify(JA_FONTS)};document.head.appendChild(f)}}catch(e){}`;

// Clickjacking guard: a <meta> CSP can't forbid framing, so a page loaded inside someone else's frame hides itself
// and asks the top window to load it directly instead.
const FRAME_GUARD = `if(window.top!==window.self){document.documentElement.style.visibility="hidden";try{window.top.location.replace(window.self.location.href)}catch(e){}}`;

// The background engravings (a large image) wait until the page has loaded and the browser is idle (globals.css,
// :root[data-art]), so they never compete with the page's own photos and code on a slow connection.
const ART_LATER = `addEventListener("load",function(){(window.requestIdleCallback||function(f){setTimeout(f,200)})(function(){document.documentElement.dataset.art=""},{timeout:1500})})`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The header search's lists, built once at build time: dishes (trending first) and cuisines. Both can be found by
  // country, in either language (lib/places.ts); dishes also by the city or region they come from.
  const [cards, cuisines] = await Promise.all([searchRecipes(db, { cuisine: [], vegetarian: false }), listCuisines(db)]);
  const cuisineBySlug = new Map(cuisines.map((c) => [c.slug, c]));
  const searchItems = await Promise.all(
    cards.map(async (r) => {
      const detail = await getRecipeBySlug(db, r.slug);
      return {
        slug: r.slug,
        title: r.title,
        titleJa: r.ja.title,
        cuisine: r.cuisineName,
        cuisineJa: r.ja.cuisineName,
        image: r.image,
        minutes: r.totalMinutes,
        text: fold(
          [
            r.title,
            r.ja.title,
            ...placeWords(cuisineBySlug.get(r.cuisineSlug)),
            detail?.origin,
            detail?.ja.origin,
            r.description,
            r.ja.description,
          ].join(" "),
        ),
      };
    }),
  );
  const searchPlaces = cuisines.map((c) => ({
    slug: c.slug,
    name: c.name,
    nameJa: c.ja.name,
    country: c.country,
    countryJa: c.ja.country,
    emoji: c.emoji,
    count: c.recipeCount,
    text: fold(placeWords(c).join(" ")),
  }));
  // Every page leads with an Unsplash photo — open the connection before the <img> is parsed.
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" suppressHydrationWarning data-intro="" data-intro-lock="" className={`${display.variable} ${sans.variable}`}>
      <head>
        {process.env.NODE_ENV === "production" && <meta httpEquiv="Content-Security-Policy" content={CSP} />}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script dangerouslySetInnerHTML={{ __html: FRAME_GUARD }} />
        {/* Decide about the intro before first paint (see INTRO_SKIP). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SKIP }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: ART_LATER }} />
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
          <TitleSync />
          <SiteHeader searchItems={searchItems} searchPlaces={searchPlaces} />
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
