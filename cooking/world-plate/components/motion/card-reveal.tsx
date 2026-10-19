import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChildProps = { className?: string; style?: CSSProperties };

/**
 * Slush's `data-card-reveal`: once the row's top crosses 80% of the viewport, every card flies in
 * from x 5em, z 20em, rotateY(-30°) and scale 0.75 (0.85s, slush-bounce), the row spread over 0.2s.
 * The row carries perspective 1000px, so cards near the edges swing in at an angle.
 * Each direct child becomes a card (it must accept className and style).
 */
export function CardReveal({
  as: Tag = "ul",
  className,
  children,
  at,
}: {
  as?: "ul" | "ol" | "div";
  className?: string;
  children: ReactNode;
  /** Trigger line as a % of the viewport height (default 80). */
  at?: number;
}) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<ChildProps>[];
  const n = items.length;
  return (
    <Tag className={className} data-reveal="cards" data-reveal-at={at}>
      {items.map((child, i) =>
        cloneElement(child, {
          className: cn("reveal-card", child.props.className),
          style: { ...child.props.style, "--i": i, "--n": n } as CSSProperties,
        }),
      )}
    </Tag>
  );
}
