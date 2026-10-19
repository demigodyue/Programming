import { Fragment, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Mode = "scroll" | "load" | "static";

/**
 * Slush's character entrance (SplitText "words, chars"): each character slides in from -0.25em and
 * fades up, starting with the LAST character (stagger 0.015s, from "end"), on the slush-bounce curve.
 *
 * - mode="scroll": `data-anim-slant` — plays once the title's top crosses 80% of the viewport.
 * - mode="load":   `data-anim-hero`  — plays with the page load (pure CSS, before hydration).
 * - mode="static": split only; a parent decides when the characters move (the tab system).
 *
 * Split on the server, so there is no layout shift and no hydration work. Words never break apart.
 * Screen readers get the plain text; the split copy is aria-hidden.
 */
export function SlantText({
  text,
  as: Tag = "span",
  mode = "scroll",
  className,
  id,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: Mode;
  className?: string;
  id?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + Array.from(w).length, 0);
  let index = 0;

  return (
    <Tag
      id={id}
      className={cn("chars", mode === "load" && "load-chars", className)}
      data-reveal={mode === "scroll" ? "slant" : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, wi) => (
          <Fragment key={wi}>
            {wi > 0 && " "}
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
    </Tag>
  );
}
