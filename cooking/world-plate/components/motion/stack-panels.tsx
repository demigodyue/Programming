"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";

const STACK = "(min-width: 1024px) and (min-height: 700px)";

/**
 * Stacking full-screen panels. On large screens every child becomes a sticky, full-height card; the next card slides
 * up over it (rounded top corners) after a short pause, and as it covers the one below, that one sinks back — it
 * scales to 0.92, rises 2% and darkens — so the panels pile up like a deck. The sinking is scrubbed by the scroll
 * (the next card's distance from the top of the screen). Elsewhere, and with reduced motion for the sinking, the
 * children are ordinary sections. Children should fill their card (`h-full`) and carry their own background.
 */
export function StackPanels({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mq = window.matchMedia(STACK);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const panels = Array.from(el.querySelectorAll<HTMLElement>(":scope > .stack-panel"));
    const cards = panels.map((p) => p.querySelector<HTMLElement>(":scope > .stack-card"));
    const dims = panels.map((p) => p.querySelector<HTMLElement>(".stack-dim"));
    let frame = 0;

    const clear = () => {
      cards.forEach((c) => c && (c.style.transform = ""));
      dims.forEach((d) => d && (d.style.opacity = ""));
    };
    const render = () => {
      frame = 0;
      if (!mq.matches || reduce.matches) return clear();
      const vh = window.innerHeight;
      for (let i = 0; i < panels.length - 1; i++) {
        const next = panels[i + 1].getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, 1 - next / vh));
        const card = cards[i];
        const dim = dims[i];
        if (card) card.style.transform = `translate3d(0, ${(-2 * p).toFixed(3)}%, 0) scale(${(1 - 0.08 * p).toFixed(4)})`;
        if (dim) dim.style.opacity = (0.55 * p).toFixed(3);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mq.addEventListener("change", schedule);
    reduce.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
      reduce.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={root} className="stack">
      {items.map((child, i) => [
        <div key={`p${i}`} className="stack-panel">
          <div className="stack-card">
            {child}
            <span aria-hidden className="stack-dim" />
          </div>
        </div>,
        i < items.length - 1 ? <div key={`s${i}`} aria-hidden className="stack-spacer" /> : null,
      ])}
    </div>
  );
}
