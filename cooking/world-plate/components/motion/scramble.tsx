"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

/**
 * svz.io's ScrambleText: the label flickers through random glyphs and resolves left → right.
 * Plays once when scrolled into view, and again on hover when `onHover` is set.
 * Screen readers get the real text; the animated copy is aria-hidden. Reduced motion: static text.
 */
export function Scramble({
  text,
  className,
  duration = 700,
  onHover = false,
}: {
  text: string;
  className?: string;
  duration?: number;
  onHover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;

    const run = () => {
      cancelAnimationFrame(frame);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const settled = Math.floor(t * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          out += i < settled || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    const host = onHover ? (el.closest("a, button") ?? el) : null;
    host?.addEventListener("mouseenter", run);
    return () => {
      io.disconnect();
      host?.removeEventListener("mouseenter", run);
      cancelAnimationFrame(frame);
      el.textContent = text;
    };
  }, [text, duration, onHover]);

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      {/* Width is held by an invisible copy so the flicker never shifts the layout. */}
      <span aria-hidden className="invisible">
        {text}
      </span>
      <span aria-hidden ref={ref} className="absolute inset-0 whitespace-nowrap">
        {text}
      </span>
    </span>
  );
}
