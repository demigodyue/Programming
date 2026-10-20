"use client";

import { useSyncExternalStore } from "react";

/**
 * The site's language, English or Japanese. Every page ships both (see components/i18n.tsx): the language is a
 * `data-lang` attribute on <html> that CSS uses to hide the other one, so switching is instant and needs no
 * reload. A head script (LANG_INIT in app/layout.tsx) sets it before first paint from localStorage, or from the
 * browser's language on a first visit. This hook is for the few things CSS can't swap — attributes such as
 * aria-label, alt and placeholder — and for the toggle itself.
 */
export type Lang = "en" | "ja";

export const LANG_KEY = "wp:lang";
const EVENT = "wp:lang";

function current(): Lang {
  return document.documentElement.dataset.lang === "ja" ? "ja" : "en";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** "en" during the server render and hydration, then the visitor's language. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, current, () => "en");
}

/** Picks the string for the current language: `t("Open menu", "メニューを開く")`. */
export function useT() {
  const lang = useLang();
  return (en: string, ja: string) => (lang === "ja" ? ja : en);
}

export function setLang(lang: Lang) {
  const root = document.documentElement;
  root.dataset.lang = lang;
  root.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage blocked: the switch still applies to this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}
