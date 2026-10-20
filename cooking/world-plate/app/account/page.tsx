import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";
import { T } from "@/components/i18n";
import { SlantText } from "@/components/motion/slant-text";

export const metadata: Metadata = {
  title: "Your account",
  description: "Sign in or create a World Plate account to keep your favorite recipes on every device.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="container-page pt-32 pb-24 md:pt-36">
      <header className="hero-content relative isolate mb-12 flex flex-col items-center border-b pb-12 text-center">
        <SlantText as="h1" mode="load" text="Your account" ja="アカウント" className="block text-[clamp(3.5rem,11vw,5.875rem)] leading-[0.92]" />
        <p className="load-stagger text-muted-foreground mt-6 max-w-md text-base" style={{ "--i": 0 } as CSSProperties}>
          <T
            en="Save recipes to your account and find them again on any phone or computer."
            ja="レシピをアカウントに保存して、どのスマホやパソコンからでも見られます。"
          />
        </p>
      </header>
      <div className="load-stagger" style={{ "--i": 1 } as CSSProperties}>
        <AccountPanel />
      </div>
    </div>
  );
}
