"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The Sizzle Atlas mark: a frying pan seen from above with a globe as the dish, steam rising. One colour
 * (currentColor): the globe's lines are cut out with a mask, so it works on any background. `small` is the bolder
 * version with fewer lines, for ≤ 32 px (app/icon.svg uses the same drawing).
 */
export function LogoMark({ className, small = false }: { className?: string; small?: boolean }) {
  // Each instance needs its own mask id (header and footer both show the mark); useId's punctuation isn't url()-safe.
  const id = `sa-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-8", className)}>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="#fff" />
        {small ? (
          <g fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round">
            <ellipse cx="25" cy="38" rx="4.6" ry="12" />
            <path d="M13 38H37" />
          </g>
        ) : (
          <>
            <g fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
              <ellipse cx="25" cy="38" rx="4.8" ry="11.5" />
              <path d="M13.5 38H36.5" />
              <path d="M15.2 32.2Q25 34.6 34.8 32.2" />
              <path d="M15.2 43.8Q25 46.4 34.8 43.8" />
            </g>
            <circle cx="57.3" cy="38" r="1.55" fill="#000" />
          </>
        )}
      </mask>
      <g transform="translate(-2.4 1)">
        <g mask={`url(#${id})`} fill="currentColor">
          <circle cx="25" cy="38" r={small ? 12 : 11.5} />
          <path d={small ? "M41.4 34.8H58.4a3.2 3.2 0 0 1 0 6.4H41.4z" : "M41.4 35.3H58.2a2.7 2.7 0 0 1 0 5.4H41.4z"} />
        </g>
        <circle cx="25" cy="38" r="16.5" fill="none" stroke="currentColor" strokeWidth={small ? 4.2 : 3.5} />
        <g fill="none" stroke="currentColor" strokeWidth={small ? 3.4 : 2.7} strokeLinecap="round">
          {small ? (
            <path d="M18 17.4c-3.1-2.7 3.1-5 0-9M32 17.4c-3.1-2.7 3.1-5 0-9" />
          ) : (
            <path d="M17.2 17.4c-3.1-2.58 3.1-4.82 0-8.6M25 16.6c-3.1-3.3 3.1-6.16 0-11M32.8 17.4c-3.1-2.58 3.1-4.82 0-8.6" />
          )}
        </g>
      </g>
    </svg>
  );
}

/** Mark + "Sizzle Atlas" wordmark, set in the display face. */
export function Logo({ className, withName = true }: { className?: string; withName?: boolean }) {
  return (
    <span className={cn("text-headline inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-10" />
      {withName && <span className="font-display text-headline text-2xl leading-none tracking-[0.01em] uppercase">Sizzle Atlas</span>}
    </span>
  );
}
