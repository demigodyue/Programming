"use client";

import { useRef, type MouseEvent } from "react";
import { T } from "@/components/i18n";
import { circleReveal } from "@/lib/circle-reveal";
import { setLang, useLang, useT } from "@/lib/lang";
import { cn } from "@/lib/utils";

/**
 * The English ⇄ Japanese switch: a header circle that shows the language you'd switch to ("あ" or "EN").
 * Clicking flips the circle over on its vertical axis while the new language spreads across the page in a circle
 * growing out of the button.
 */
export function LangToggle({ className }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  const face = useRef<HTMLSpanElement>(null);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = lang === "ja" ? "en" : "ja";
    // The new language spreads over the page from this button (lib/circle-reveal.ts).
    circleReveal(e.currentTarget, () => setLang(next));
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      face.current?.animate(
        [{ transform: "perspective(200px) rotateY(-180deg) scale(0.8)" }, { transform: "perspective(200px) rotateY(0deg) scale(1)" }],
        { duration: 550, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("日本語に切り替え", "Switch to English")}
      title={t("日本語", "English")}
      lang={lang === "ja" ? "en" : "ja"}
      className={cn("grid place-items-center rounded-full", className)}
    >
      <span ref={face} aria-hidden className="grid place-items-center text-[0.9375rem] leading-none font-bold">
        <T en="あ" ja={<span className="text-[0.75rem] tracking-wide">EN</span>} />
      </span>
    </button>
  );
}
