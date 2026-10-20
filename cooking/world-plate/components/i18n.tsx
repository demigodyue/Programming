import type { ReactNode } from "react";
import { formatMinutes, formatMinutesJa } from "@/lib/scale";

/**
 * Both languages, side by side: `<T en="Browse recipes" ja="レシピを見る" />`. CSS shows the one matching
 * <html data-lang> (see "Language" in globals.css), so this works in server and client components alike, the
 * switch is instant, and there is no flash of the wrong language on load. The hidden one is display:none, so
 * screen readers skip it too.
 */
export function T({ en, ja }: { en: ReactNode; ja: ReactNode }) {
  return (
    <>
      <span data-l="en">{en}</span>
      <span data-l="ja" lang="ja">
        {ja}
      </span>
    </>
  );
}

/** Japanese copy marks phrase breaks for the word-by-word animations with "|"; strip them for plain display. */
export const plain = (text: string) => text.replaceAll("|", "");

/** A duration in both languages: "1 h 30 min" / "1時間30分". */
export function Minutes({ m }: { m: number }) {
  return <T en={formatMinutes(m)} ja={formatMinutesJa(m)} />;
}

export const difficultyLabel = {
  easy: { en: "Easy", ja: "かんたん" },
  medium: { en: "Medium", ja: "ふつう" },
  hard: { en: "Challenging", ja: "本格派" },
} as const;

export function Difficulty({ d }: { d: keyof typeof difficultyLabel }) {
  return <T {...difficultyLabel[d]} />;
}
