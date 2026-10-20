import { Flame } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * A giant headline band that slides sideways with the scroll: the solid line travels left to right across the
 * screen while an outlined copy beneath it travels the other way. ScrollMotion scrubs it (data-parallax with
 * data-parallax-axis="x", xPercent of the line's own width) over the band's whole pass through the viewport.
 * Decorative (the section keeps its real heading). Reduced motion: it stands still.
 */
export function SlideBand({ text, className }: { text: string; className?: string }) {
  const run = (key: string) => (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Fragment key={`${key}${i}`}>
          <span>{text}</span>
          <Flame aria-hidden strokeWidth={1.5} className="slide-band__mark" />
        </Fragment>
      ))}
    </>
  );
  return (
    <div aria-hidden className={cn("slide-band", className)}>
      <div
        data-parallax
        data-parallax-axis="x"
        data-parallax-start="-38"
        data-parallax-end="-4"
        className="slide-band__line font-display text-headline"
      >
        {run("a")}
      </div>
      <div
        data-parallax
        data-parallax-axis="x"
        data-parallax-start="-4"
        data-parallax-end="-38"
        className="slide-band__line slide-band__line--outline font-display"
      >
        {run("b")}
      </div>
    </div>
  );
}
