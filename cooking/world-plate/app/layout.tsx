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

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Every page leads with an Unsplash photo — open the connection before the <img> is parsed.
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" suppressHydrationWarning data-intro="" className={`${anton.variable} ${inter.variable}`}>
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
