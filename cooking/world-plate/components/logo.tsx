import { cn } from "@/lib/utils";

/** Circled serif "W" monogram — monoline, no fill, the only graphic mark on the page. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
      <text
        x="16"
        y="21.4"
        textAnchor="middle"
        fill="currentColor"
        className="font-display"
        style={{ fontSize: "15px", fontWeight: 500, letterSpacing: "-0.04em" }}
      >
        W
      </text>
    </svg>
  );
}

export function Logo({ className, withName = true }: { className?: string; withName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {withName && <span className="label-caps">World Plate</span>}
    </span>
  );
}
