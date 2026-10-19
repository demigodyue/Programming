"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Slush's `marquee-advanced` (initMarqueeScrollDirection):
 * - The strip loops forever, one copy every `speed × (strip width ÷ viewport width) × k` seconds, where
 *   k is 1 on desktop, 0.5 under 991px and 0.25 under 479px.
 * - Its direction follows your scroll: scrolling down runs a `left` strip leftward and a `right` strip
 *   rightward; scrolling up reverses both. Until you scroll, every strip runs leftward (as on Slush).
 * - The whole track also drifts ±`scrollSpeed`vw as it crosses the viewport (scrub).
 * Copies after the first are aria-hidden. Reduced motion: it stands still.
 */
export function ScrollMarquee({
  children,
  direction = "left",
  speed = 20,
  duplicate = 2,
  scrollSpeed = 10,
  className,
}: {
  children: ReactNode;
  direction?: "left" | "right";
  speed?: number;
  duplicate?: number;
  scrollSpeed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = root.querySelector<HTMLElement>(".marquee__scroll");
    const copies = Array.from(root.querySelectorAll<HTMLElement>(".marquee__collection"));
    if (!track || copies.length === 0) return;

    const l = direction === "right" ? 1 : -1;
    const k = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
    const seconds = Math.max(1, speed * (copies[0].offsetWidth / window.innerWidth) * k);
    const anims = copies.map((copy) =>
      copy.animate([{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }], {
        duration: seconds * 1000,
        iterations: Infinity,
        easing: "linear",
      }),
    );
    anims.forEach((a) => (a.currentTime = seconds * 500)); // GSAP's .totalProgress(0.5)

    const from = l === -1 ? scrollSpeed : -scrollSpeed;
    let lastY = window.scrollY;
    const update = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const y = window.scrollY;
      if (rect.bottom < 0 || rect.top > vh) {
        lastY = y;
        return;
      }
      if (y !== lastY) {
        const rate = y > lastY ? -l : l;
        anims.forEach((a) => {
          if (a.playbackRate !== rate) a.playbackRate = rate;
        });
        root.dataset.marqueeStatus = y > lastY ? "normal" : "inverted";
        lastY = y;
      }
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      track.style.translate = `${(from - 2 * from * progress).toFixed(3)}vw 0`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      anims.forEach((a) => a.cancel());
      track.style.translate = "";
    };
  }, [direction, speed, scrollSpeed]);

  return (
    <div ref={ref} className={cn("marquee", className)} data-marquee-status="normal">
      <div className="marquee__scroll">
        {Array.from({ length: duplicate + 1 }, (_, i) => (
          <div key={i} className="marquee__collection" aria-hidden={i > 0 || undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
