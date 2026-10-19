import { Fragment, type ElementType } from "react";

const bare = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

/**
 * Hungry Tiger's scroll text (eathungrytiger.com, recorded 2026-10-19): the text is split into words, and
 * each word fills from 20% to full opacity as you scroll — stagger 0.4, 0.2 each, power1.out — scrubbed from
 * "top 90%" to "top center". ScrollMotion drives it (`data-scrub="words"`); the words start dim only when JS
 * runs and motion is allowed (see globals.css). `em` lists words to emphasise (a colour switch in Anton).
 */
export function ScrubWords({
  as: Tag = "h2",
  text,
  em = [],
  id,
  className,
}: {
  as?: ElementType;
  text: string;
  em?: string[];
  id?: string;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag id={id} data-scrub="words" className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="word">{em.includes(bare(w)) ? <em>{w}</em> : w}</span>
        </Fragment>
      ))}
    </Tag>
  );
}
