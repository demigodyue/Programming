import type { CSSProperties } from "react";

const SLICES = 5; // the full glyph + slices of its bottom 30%, 22%, 15% and 5%

/**
 * Slush's home logo (`.home-logo-letter-list`): every letter rolls upward on load. The visible glyph and
 * four ever-thinner slices of its foot leave one after another (0.15s apart, 1.25s on "slush"), smearing
 * upward, while a clean copy rises into place from below at 0.5s. Letters start 0.05s apart.
 * Decorative: render inside an aria-hidden element. Reduced motion: the letters just sit still.
 */
export function LetterRoll({ text }: { text: string }) {
  let li = 0;
  return (
    <>
      {Array.from(text).map((ch, i) => {
        if (ch === " ") return <span key={i}> </span>;
        const style = { "--li": li++ } as CSSProperties;
        return (
          <span key={i} className="roll" style={style}>
            <span className="roll__el">
              {Array.from({ length: SLICES }, (_, ci) => (
                <span key={ci} className="roll__copy" style={{ "--ci": ci } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="roll__el roll__el--next">
              <span className="roll__copy">{ch}</span>
            </span>
          </span>
        );
      })}
    </>
  );
}
