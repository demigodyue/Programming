import type { StepAction } from "@/lib/step-info";
import { cn } from "@/lib/utils";

/**
 * A small animated drawing of what a step asks you to do: bubbles rise from a pot, oil spits in a pan, a knife
 * chops, a whisk spins, an oven window glows, a clock hand sweeps, a cloche lifts off a plate, a flame flickers.
 * Line art in currentColor. The animation plays only on the step you're reading (`.step-icon` under
 * `[data-active]`, globals.css) and not at all with reduced motion.
 */
export function StepIcon({ action, className }: { action: StepAction; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("step-icon", `step-icon--${action}`, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {action === "boil" && (
        <>
          <path className="si-steam" d="M24 14c-2-3 2-5 0-8M32 14c-2-3 2-5 0-8M40 14c-2-3 2-5 0-8" />
          <path d="M12 26h40M16 26v20a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6V26M10 30h6M48 30h6" />
          <circle className="si-bubble" cx="24" cy="38" r="2.4" style={{ animationDelay: "0s" }} />
          <circle className="si-bubble" cx="32" cy="42" r="3" style={{ animationDelay: "0.35s" }} />
          <circle className="si-bubble" cx="40" cy="38" r="2" style={{ animationDelay: "0.7s" }} />
        </>
      )}
      {action === "fry" && (
        <>
          <path d="M8 36h34a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8zM42 38h14" />
          <path className="si-food" d="M18 33c2-4 10-4 12 0" />
          <circle className="si-spit" cx="16" cy="26" r="1.4" style={{ animationDelay: "0s" }} />
          <circle className="si-spit" cx="26" cy="22" r="1.4" style={{ animationDelay: "0.25s" }} />
          <circle className="si-spit" cx="35" cy="26" r="1.4" style={{ animationDelay: "0.5s" }} />
          <path className="si-sizzle" d="M20 18l-2-4M30 16v-4M38 18l2-4" />
        </>
      )}
      {action === "bake" && (
        <>
          <rect x="10" y="12" width="44" height="40" rx="4" />
          <path d="M10 22h44M16 17h4M24 17h4" />
          <rect className="si-glow" x="16" y="28" width="32" height="18" rx="2" />
          <path className="si-heat" d="M24 42c-2-3 2-5 0-8M32 42c-2-3 2-5 0-8M40 42c-2-3 2-5 0-8" />
        </>
      )}
      {action === "chop" && (
        <>
          <path d="M8 50h48" />
          <g className="si-knife">
            <path d="M22 44l20-20 6 6-20 14z" />
            <path d="M42 24l6-6 4 4-6 6" />
          </g>
          <path className="si-bits" d="M14 46h3M19 46h2M12 43h2" />
        </>
      )}
      {action === "mix" && (
        <>
          <path d="M10 34h44a22 18 0 0 1-44 0z" />
          <g className="si-whisk">
            <path d="M32 34V8" />
            <path d="M32 34c-6-6-6-14 0-18c6 4 6 12 0 18z" />
          </g>
          <path className="si-swirl" d="M20 40c6 3 18 3 24 0" />
        </>
      )}
      {action === "rest" && (
        <>
          <circle cx="32" cy="34" r="20" />
          <path d="M28 10h8M32 10v4" />
          <path className="si-hand" d="M32 34V22" />
          <circle cx="32" cy="34" r="1.6" fill="currentColor" />
        </>
      )}
      {action === "serve" && (
        <>
          <path d="M8 46h48M14 46a18 18 0 0 1 36 0" className="si-cloche" />
          <path d="M8 50h48" />
          <path className="si-spark" d="M18 20v4M16 22h4M46 16v4M44 18h4M32 10v4M30 12h4" />
        </>
      )}
      {action === "heat" && (
        <>
          <path d="M14 50h36" />
          <path className="si-flame" d="M32 46c-9 0-12-7-9-14 2-5 6-7 6-14 6 4 12 11 12 19 0 6-4 9-9 9z" />
          <path className="si-flame-in" d="M32 46c-4 0-5-3-4-6 1-2 3-3 3-6 3 2 5 5 5 8 0 3-2 4-4 4z" />
        </>
      )}
    </svg>
  );
}
