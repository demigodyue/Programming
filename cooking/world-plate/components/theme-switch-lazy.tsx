"use client";

import dynamic from "next/dynamic";

/**
 * The three-way theme switch pulls in Radix ToggleGroup and Watermelon's highlight engine.
 * It only appears in the footer and the mobile menu, so it loads after the critical path.
 */
export const LazyThemeSwitch = dynamic(() => import("./theme-switch").then((m) => m.ThemeSwitch), {
  ssr: false,
  loading: () => <span aria-hidden className="bg-card inline-block h-9 w-[6.75rem] rounded-lg border" />,
});
