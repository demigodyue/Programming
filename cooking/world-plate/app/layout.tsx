import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { preconnect } from "react-dom";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // opsz only: the SOFT axis doubled the file size. Not preloaded so it never competes with the
  // LCP photo; next/font's metric-matched fallback keeps the swap shift-free.
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
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
    { media: "(prefers-color-scheme: light)", color: "#c4c3b6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Every page leads with an Unsplash photo — open the connection before the <img> is parsed.
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${instrument.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <MotionProvider>
          <a
            href="#main"
            className="bg-primary text-primary-foreground sr-only z-50 rounded-full px-5 py-3 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <LenisProvider />
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
