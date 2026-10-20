import { Fragment, type CSSProperties } from "react";
import { plain, T } from "@/components/i18n";
import { cn } from "@/lib/utils";

type Mode = "scroll" | "load" | "static";

/**
 * English splits into words at spaces (a word never breaks apart). Japanese has no spaces: it splits at the "|"
 * phrase marks in the copy, or into single characters when there are none, and the groups sit side by side with
 * no gap, so the line can still wrap between them.
 */
function words(text: string, ja: boolean) {
  if (!ja) return text.split(/\s+/).filter(Boolean);
  return text.includes("|") ? text.split("|").filter(Boolean) : Array.from(text);
}

function Split({ text, ja = false }: { text: string; ja?: boolean }) {
  const list = words(text, ja);
  const total = list.reduce((n, w) => n + Array.from(w).length, 0);
  let index = 0;
  return (
    <>
      <span className="sr-only">{plain(text)}</span>
      <span aria-hidden>
        {list.map((word, wi) => (
          <Fragment key={wi}>
            {wi > 0 && !ja && " "}
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, ci) => {
                const ciFromEnd = total - 1 - index++;
                return (
                  <span key={ci} className="char" style={{ "--ci": ciFromEnd } as CSSProperties}>
                    {ch}
                  </span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </>
  );
}

/**
 * Slush's character entrance (SplitText "words, chars"): each character slides in from -0.25em and
 * fades up, starting with the LAST character (stagger 0.015s, from "end"), on the slush-bounce curve.
 *
 * - mode="scroll": `data-anim-slant` — plays once the title's top crosses 80% of the viewport.
 * - mode="load":   `data-anim-hero`  — plays with the page load (pure CSS, before hydration).
 * - mode="static": split only; a parent decides when the characters move (the tab system).
 *
 * Split on the server, so there is no layout shift and no hydration work. Words never break apart.
 * Screen readers get the plain text; the split copy is aria-hidden. `ja` adds the Japanese title (see T).
 */
export function SlantText({
  text,
  ja,
  as: Tag = "span",
  mode = "scroll",
  className,
  id,
}: {
  text: string;
  ja?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: Mode;
  className?: string;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn("chars", mode === "load" && "load-chars", className)}
      data-reveal={mode === "scroll" ? "slant" : undefined}
    >
      {ja ? <T en={<Split text={text} />} ja={<Split text={ja} ja />} /> : <Split text={text} />}
    </Tag>
  );
}
