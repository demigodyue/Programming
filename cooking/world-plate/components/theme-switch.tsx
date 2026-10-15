"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/watermelon/theme-toggler";
import { cn } from "@/lib/utils";

const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

const OPTIONS = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Match system theme", Icon: Monitor },
] as const;

/** Three-way Light / Dark / System switch (Watermelon theme-toggler). */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Colour theme"
      value={mounted ? (theme ?? "system") : ""}
      onValueChange={(v: string) => v && setTheme(v)}
      className={cn("bg-card", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} title={label}>
          <Icon strokeWidth={1.75} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Compact sun/moon icon swap for the header. */
export function ThemeIconToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const reduce = useReducedMotion();
  const isDark = mounted && resolvedTheme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative grid size-10 place-items-center rounded-full transition-colors duration-200 hover-fine:bg-foreground/8",
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={isDark ? "moon" : "sun"}
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "rotate(-60deg) scale(0.6)", filter: "blur(4px)" }}
          animate={{ opacity: 1, transform: "rotate(0deg) scale(1)", filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "rotate(60deg) scale(0.6)", filter: "blur(4px)" }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="grid place-items-center"
        >
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </m.span>
      </AnimatePresence>
    </button>
  );
}
