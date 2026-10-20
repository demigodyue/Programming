import { Fragment, type ElementType } from "react";
import { T } from "@/components/i18n";

const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

function Words({ text, em, ja = false }: { text: string; em: string[]; ja?: boolean }) {
  // Japanese copy marks its phrases with "|" and is set without spaces.
  const words = ja ? text.split("|").filter(Boolean) : text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => (
    <Fragment key={i}>
      {i > 0 && !ja && " "}
      <span className="word">{em.includes(bare(w)) ? <em>{w}</em> : w}</span>
    </Fragment>
  ));
}

/**
 * Hungry Tiger's scroll text (eathungrytiger.com, recorded 2026-10-19): the text is split into words, and
 * each word fills from 20% to full opacity as you scroll — stagger 0.4, 0.2 each, power1.out — scrubbed from
 * "top 90%" to "top center". ScrollMotion drives it (`data-scrub="words"`); the words start dim only when JS
 * runs and motion is allowed (see globals.css). `em` lists words to emphasise (a colour switch in Anton).
 * `ja` is the Japanese copy, phrases separated by "|"; `emJa` lists its emphasised phrases.
 */
export function ScrubWords({
  as: Tag = "h2",
  text,
  ja,
  em = [],
  emJa = [],
  id,
  className,
}: {
  as?: ElementType;
  text: string;
  ja?: string;
  em?: string[];
  emJa?: string[];
  id?: string;
  className?: string;
}) {
  return (
    <Tag id={id} data-scrub="words" className={className}>
      {ja ? <T en={<Words text={text} em={em} />} ja={<Words text={ja} em={emJa} ja />} /> : <Words text={text} em={em} />}
    </Tag>
  );
}
