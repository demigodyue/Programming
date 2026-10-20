"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StepIcon } from "@/components/recipe/step-icon";
import { StepTimer } from "@/components/recipe/step-timer";
import { StepIndicator } from "@/components/watermelon/step-indicator";
import { useT } from "@/lib/lang";
import type { StepAction } from "@/lib/step-info";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Full-screen, one-step-at-a-time view for cooking with messy hands:
 * huge text, big buttons, arrow keys / space to advance, Esc to exit, screen kept awake.
 * Each step brings its animated action drawing and big timer buttons (shared with the page, so a running
 * timer carries on here).
 */
export function CookMode({
  slug,
  title,
  steps,
  onClose,
}: {
  slug: string;
  title: string;
  steps: { text: string; action: StepAction; timers: number[] }[];
  onClose: () => void;
}) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLast = index === steps.length - 1;

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= steps.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, steps.length],
  );

  // Focus, scroll lock, keyboard, restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON")) {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Tab") {
        // Keep focus inside the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // Keep the screen on while cooking, where supported.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  const offset = reduce ? 0 : 40;

  return createPortal(
    <m.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cook-mode-title"
      tabIndex={-1}
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-background fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none"
    >
      <div className="container-page flex items-center justify-between gap-4 pt-5">
        <div className="min-w-0">
          <p className="label-caps text-muted-foreground">{t("Cook Mode", "クックモード")}</p>
          <h2 id="cook-mode-title" className="truncate text-xl font-medium">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Exit Cook Mode", "クックモードを終了")}
          className="bg-card hover-fine:bg-muted grid size-12 shrink-0 place-items-center rounded-full border"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="container-page mt-10">
        <StepIndicator
          steps={steps.map((_, i) => ({ id: String(i), label: t(`Step ${i + 1}`, `手順${i + 1}`), aria: t(`Go to step ${i + 1}`, `手順${i + 1}へ`) }))}
          current={index}
          onStepChange={go}
        />
      </div>

      <div className="container-page flex flex-1 flex-col justify-center py-10">
        <div className="flex items-center gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={index}
              initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.6) rotate(-12deg)" }}
              animate={{ opacity: 1, transform: "scale(1) rotate(0deg)" }}
              exit={{ opacity: 0, transform: reduce ? "none" : "scale(0.6) rotate(12deg)" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              data-active
              className="text-headline grid"
            >
              <StepIcon action={steps[index].action} className="size-16 sm:size-20" />
            </m.span>
          </AnimatePresence>
          <p className="text-accent-ink font-display text-2xl" aria-live="polite">
            {t(`Step ${index + 1} of ${steps.length}`, `手順 ${index + 1} / ${steps.length}`)}
          </p>
        </div>
        <div className="relative mt-4">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <m.p
              key={index}
              custom={direction}
              initial={{ opacity: 0, transform: `translateX(${direction * offset}px)` }}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={{ opacity: 0, transform: `translateX(${direction * -offset}px)` }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="font-display max-w-[30ch] text-[clamp(1.75rem,4.6vw,3.25rem)] leading-[1.2] text-pretty"
            >
              {steps[index].text}
            </m.p>
          </AnimatePresence>
        </div>
        {steps[index].timers.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {steps[index].timers.map((sec, k) => (
              <StepTimer key={`${index}-${k}`} id={`${slug}:${index}:${k}`} seconds={sec} large />
            ))}
          </div>
        )}
      </div>

      <div className="container-page flex items-center justify-between gap-3 pb-8">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="bg-card hover-fine:bg-muted inline-flex h-16 items-center gap-2 rounded-full border px-6 text-lg font-medium disabled:opacity-40 sm:px-8"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden />
          {t("Back", "戻る")}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onClose}
            className="bg-primary text-primary-foreground inline-flex h-16 items-center gap-2 rounded-full px-8 text-lg font-medium transition-transform duration-150 active:scale-[0.97]"
          >
            <Check className="size-5" strokeWidth={2} aria-hidden />
            {t("Done — enjoy", "完成！めしあがれ")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="bg-primary text-primary-foreground inline-flex h-16 items-center gap-2 rounded-full px-8 text-lg font-medium transition-transform duration-150 active:scale-[0.97]"
          >
            {t("Next step", "次の手順")}
            <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
    </m.div>,
    document.body,
  );
}
