import { Fragment, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const DURATION = 0.7;

/** Seconds until the headline has landed — use to sequence what follows. */
export const revealDuration = (_text: string, delay = 0) => delay + DURATION;

/**
 * Headline entrance in the LaunchDarkly manner: the whole line fades up as one block
 * (`.rise` in globals.css — 700ms, cubic-bezier(.22,.61,.36,1)). Pure CSS, so it plays at first paint.
 * Words listed in `italic` are set in the serif italic.
 * Reduced motion: a plain opacity fade.
 */
export function WordReveal({
  text,
  as: Tag = "h1",
  delay = 0,
  className,
  id,
  italic = [],
}: {
  text: string;
  as?: "h1" | "h2" | "p";
  delay?: number;
  className?: string;
  id?: string;
  italic?: string[];
}) {
  const words = text.split(/\s+/);
  return (
    <Tag id={id} className={cn("rise", className)} style={{ "--delay": `${delay * 1000}ms` } as CSSProperties}>
      {words.map((word, i) => {
        const content: ReactNode = italic.includes(word) ? <em className="font-normal">{word}</em> : word;
        return (
          <Fragment key={`${word}-${i}`}>
            {i > 0 && " "}
            {content}
          </Fragment>
        );
      })}
    </Tag>
  );
}
