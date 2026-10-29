import type { StepAction } from "@/lib/step-info";
import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A small 3D-rendered picture of what a step asks you to do: a pot of soup, an egg in a frying pan, a loaf, a
 * kitchen knife, a mixing bowl, an hourglass, a laid plate, a flame. From Microsoft's Fluent Emoji 3D set (MIT
 * licence, public/icons/steps/LICENSE.txt). Each one moves a little on the step you're reading (`.step-icon--*`
 * under `[data-active]`, globals.css); not at all with reduced motion.
 */
export function StepIcon({ action, className }: { action: StepAction; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export: next/image's loader is for Unsplash
    <img
      src={`${BASE}/icons/steps/${action}.webp`}
      width={160}
      height={160}
      alt=""
      aria-hidden
      decoding="async"
      loading="lazy"
      draggable={false}
      className={cn("step-icon select-none", `step-icon--${action}`, className)}
    />
  );
}
