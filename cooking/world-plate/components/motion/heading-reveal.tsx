"use client";

import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Slush's `data-heading-reveal`: the text is split into lines, and each line tips in from
 * rotateY(-45°) and z 5em with a fade, 0.15s after the one above (0.85s, slush-bounce), once its top
 * crosses 80% of the viewport. The heading carries perspective 1000px.
 *
 * Lines aren't known until layout, so words are rendered on the server and grouped into lines here:
 * each word gets its line index (--line) and a transform-origin on the line's axis (--ox — the
 * centre of the block, as SplitText's full-width line divs have), so every word turns exactly as the
 * whole line would. Re-measured on resize and once fonts load. Words in `italic` use the serif italic.
 */
export function HeadingReveal({
  text,
  as: Tag = "h2",
  className,
  id,
  italic = [],
}: {
  text: string;
  as?: "h2" | "h3" | "p";
  className?: string;
  id?: string;
  italic?: string[];
}) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const centre = el.clientWidth / 2;
      let line = -1;
      let lastTop = -Infinity;
      el.querySelectorAll<HTMLElement>(":scope > .word").forEach((word) => {
        if (word.offsetTop > lastTop + 2) {
          line += 1;
          lastTop = word.offsetTop;
        }
        word.style.setProperty("--line", String(line));
        word.style.setProperty("--ox", `${(centre - word.offsetLeft).toFixed(1)}px`);
      });
    };
    measure();
    void document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag ref={ref} id={id} className={cn(className)} data-reveal="lines">
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="word">{italic.includes(word) ? <em className="font-normal">{word}</em> : word}</span>
        </Fragment>
      ))}
    </Tag>
  );
}
