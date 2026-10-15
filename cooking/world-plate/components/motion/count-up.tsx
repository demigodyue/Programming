"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatMinutes } from "@/lib/scale";

const formatters = { plain: String, duration: formatMinutes } as const;

/**
 * Counts from 0 to `value` when scrolled into view, then animates between values on change
 * (e.g. the servings adjuster). Text content is set directly to avoid re-renders per frame.
 * The final value is server-rendered, so it's correct without JS and for screen readers.
 */
export function CountUp({ value, format: mode = "plain" }: { value: number; format?: keyof typeof formatters }) {
  const format = formatters[mode];
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const from = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = format(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current ?? 0, value, {
      duration: from.current === null ? 0.9 : 0.35,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        el.textContent = format(Math.round(v));
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce, format]);

  return (
    <>
      <span ref={ref} aria-hidden className="tabular-nums">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
