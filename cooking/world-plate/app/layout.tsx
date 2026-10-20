import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { preconnect } from "react-dom";
import { Cursor } from "@/components/motion/cursor";
import { IntroCurtain } from "@/components/motion/intro-curtain";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { MouseDepth } from "@/components/motion/mouse-depth";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageSwing } from "@/components/motion/page-swing";
import { ScrollMotion } from "@/components/motion/scroll-motion";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { ThemeProvider } from "@/components/theme-provider";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Every page leads with an Unsplash photo — open the connection before the <img> is parsed.
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" suppressHydrationWarning data-intro="" data-intro-lock="" className={`${anton.variable} ${inter.variable}`}>
      <head>
        {/* Decide about the intro before first paint (see INTRO_SKIP). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SKIP }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <MotionProvider>
          <a
            href="#main"
            className="bg-primary text-primary-foreground sr-only z-50 rounded-full px-5 py-3 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <IntroCurtain />
          <div aria-hidden className="scroll-progress" />
          <LenisProvider />
          <ScrollMotion />
          <MouseDepth />
          <PageSwing />
          <Cursor />
          <SiteHeader />
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
