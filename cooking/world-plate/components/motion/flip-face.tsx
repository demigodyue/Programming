import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FlipAccent = "blue" | "yellow" | "lavender" | "mint" | "orange" | "violet" | "paper";

/**
 * Class for a Slush pill button (`.button-main`). `outline` is their light theme: a card-coloured pill
 * with an ink edge. Put `data-accent` on the same element to pick the colour of the face that flips up.
 */
export const flipClass = (tone: "solid" | "outline" = "solid", className?: string) =>
  cn("btn-flip text-sm", tone === "outline" && "btn-flip--outline", className);

/**
 * The inside of a Slush pill button: the visible face, plus a candy-coloured back face that swings up
 * in 3D on hover / keyboard focus (see `.btn-flip` in globals.css). The back face repeats the label for
 * sighted users only (aria-hidden), so the accessible name is read once.
 */
export function FlipFace({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className="btn-flip__inner">
      <span aria-hidden className="btn-flip__back">
        <span className={cn("btn-flip__label", className)}>{children}</span>
      </span>
      <span className="btn-flip__front">
        <span className="btn-flip__bg" />
        <span className={cn("btn-flip__text", className)}>{children}</span>
      </span>
    </span>
  );
}

/** Slush's `[data-text-link]` underline: it sweeps out to the right on hover as a copy sweeps in behind it. */
export function TextLinkLine() {
  return (
    <span aria-hidden className="text-link__track">
      <span className="text-link__bar" />
    </span>
  );
}
