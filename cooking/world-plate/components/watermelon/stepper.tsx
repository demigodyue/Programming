'use client';

// Watermelon UI `stepper` (base) — adapted for World Plate as the servings adjuster:
// - controlled only, with a visible label and labelled +/- buttons (aria), live value for screen readers
// - lucide icons instead of react-icons; saffron track with charcoal digits
// - digits roll with a spring (y/scale keys so MotionConfig reducedMotion="user" turns it into a fade)

import * as React from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label: React.ReactNode;
  /** Names for the − and + buttons. */
  fewer?: string;
  more?: string;
  unit?: (n: number) => string;
}

const digitVariants = {
  initial: (dir: number) => ({ y: dir > 0 ? 18 : -18, scale: 0.6, opacity: 0 }),
  animate: { y: 0, scale: 1, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -18 : 18, scale: 0.6, opacity: 0 }),
};

export function Stepper({ value, min = 1, max = 99, onChange, label, fewer = 'Fewer', more = 'More', unit }: StepperProps) {
  const [direction, setDirection] = React.useState(0);
  const digits = value.toString().split('');
  const labelId = React.useId();

  const step = (dir: number) => {
    const next = Math.min(max, Math.max(min, value + dir));
    if (next === value) return;
    setDirection(dir);
    onChange(next);
  };

  const buttonClass =
    'bg-background text-foreground flex size-11 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-40';

  return (
    <div className="flex items-center gap-3">
      <span id={labelId} className="text-muted-foreground text-sm">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="bg-primary flex items-center gap-2 rounded-full p-1">
        <m.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => step(-1)}
          disabled={value <= min}
          aria-label={fewer}
          className={buttonClass}
        >
          <Minus className="size-4" strokeWidth={2} aria-hidden />
        </m.button>

        <output aria-live="polite" className="text-primary-foreground relative flex min-w-8 justify-center text-xl font-medium tabular-nums">
          <span className="sr-only">{unit ? unit(value) : value}</span>
          <span aria-hidden className="flex">
            {digits.map((digit, index) => (
              <span key={`${index}-${digits.length}`} className="relative inline-block h-7 w-[0.62em] overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <m.span
                    key={digit}
                    custom={direction}
                    variants={digitVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {digit}
                  </m.span>
                </AnimatePresence>
              </span>
            ))}
          </span>
        </output>

        <m.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => step(1)}
          disabled={value >= max}
          aria-label={more}
          className={buttonClass}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
        </m.button>
      </div>
    </div>
  );
}
