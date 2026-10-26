"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/lang";

/**
 * The browser tab title in Japanese. Each page's metadata carries its Japanese title as <meta name="title-ja">
 * (`jaTitle()` in lib/site.ts); in Japanese mode this swaps document.title for it, and back again in English. Next rewrites the
 * title on every navigation, so a MutationObserver on <head> re-applies it.
 */
// The page's own (English) title, remembered across language switches: whenever the title isn't the Japanese one,
// it's the English one Next just set.
let english = "";

export function TitleSync() {
  const lang = useLang();

  useEffect(() => {
    const apply = () => {
      const ja = document.querySelector<HTMLMetaElement>('meta[name="title-ja"]')?.content;
      if (!ja) return;
      if (document.title !== ja) english = document.title;
      if (lang === "ja" && document.title !== ja) document.title = ja;
      else if (lang === "en" && document.title === ja && english) document.title = english;
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [lang]);

  return null;
}
