"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-spy: index of the item currently crossing the middle band of the viewport.
 * Attach `register(i)` as the ref of each item.
 */
export function useActiveIndex(count: number) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = items.current.indexOf(e.target as HTMLElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.current.slice(0, count).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);

  const register = (i: number) => (el: HTMLElement | null) => {
    items.current[i] = el;
  };
  return { active, register };
}
