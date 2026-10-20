"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up from 0 the first time it scrolls into view (1.2s, strong ease-out). The server renders the
 * final value, so without JS — or with reduced motion — it simply shows the number.
 */
export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const format = (n: number) => n.toFixed(decimals);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1200);
          const eased = 1 - Math.pow(1 - t, 4);
          const k = 10 ** decimals;
          setShown(Math.round(value * eased * k) / k);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    // Start from zero only while it is still off screen, so nothing visible jumps.
    if (el.getBoundingClientRect().top > window.innerHeight) setShown(0);
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, decimals]);

  return <span ref={ref}>{format(shown)}</span>;
}
