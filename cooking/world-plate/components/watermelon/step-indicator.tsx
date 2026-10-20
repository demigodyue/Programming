'use client';

// Watermelon UI `step-indicator` (base) — adapted for Cook Mode:
// - `current` prop: completed and current bars are filled, so it doubles as a progress bar
// - icons optional; demo padding/width removed; buttons labelled "Go to step N"
// - the clip-path tooltip that glides between bars on hover/focus is kept as-is

import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';

export type Step = { id: string; label: string; /** Accessible name of the step's button; defaults to "Go to <label>". */ aria?: string };

interface StepIndicatorProps {
  steps: Step[];
  current: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export const StepIndicator = ({ steps, current, onStepChange, className }: StepIndicatorProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState({ clipPath: '', translateX: 0 });
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isEntering, setIsEntering] = useState(true);

  const calculatePosition = (index: number) => {
    const activeLabel = measureRefs.current[index];
    const activeButton = buttonRefs.current[index];
    if (!activeLabel || !activeButton) return null;
    const labelLeft = activeLabel.offsetLeft;
    const labelWidth = activeLabel.offsetWidth;
    const buttonCenter = activeButton.offsetLeft + activeButton.offsetWidth / 2;
    const totalWidth = measureRefs.current.reduce((acc, el) => acc + (el?.offsetWidth || 0), 0);
    const cLeft = (labelLeft / totalWidth) * 100;
    const cRight = 100 - ((labelLeft + labelWidth) / totalWidth) * 100;
    return {
      clipPath: `inset(0 ${cRight}% 0 ${cLeft}% round 999px)`,
      translateX: buttonCenter - (labelLeft + labelWidth / 2),
    };
  };

  const handleShow = (index: number) => {
    const next = calculatePosition(index);
    if (!next) return;
    setIsEntering(activeIndex === null);
    setCoords(next);
    setActiveIndex(index);
  };
  const handleHide = () => {
    setActiveIndex(null);
    setCoords({ clipPath: '', translateX: 0 });
    setIsEntering(true);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex h-3 w-full items-center gap-1.5" onMouseLeave={handleHide}>
        <AnimatePresence>
          {activeIndex !== null && coords.clipPath !== '' && (
            <m.div
              className="pointer-events-none absolute bottom-6 left-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <m.div
                className="bg-foreground flex"
                animate={{ clipPath: coords.clipPath, x: coords.translateX }}
                transition={{ type: 'spring', bounce: 0, duration: isEntering ? 0 : 0.4 }}
              >
                <div className="inline-flex items-center justify-center">
                  {steps.map((step, index) => (
                    <m.div
                      key={`real-${step.id}`}
                      animate={{ opacity: activeIndex === index ? 1 : 0, filter: activeIndex === index ? 'blur(0px)' : 'blur(4px)' }}
                      transition={{ duration: 0.3 }}
                      className="text-background px-3 py-1.5 text-sm font-medium whitespace-nowrap"
                    >
                      {step.label}
                    </m.div>
                  ))}
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {steps.map((step, index) => (
          <button
            key={step.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            aria-label={step.aria ?? `Go to ${step.label.toLowerCase()}`}
            aria-current={index === current ? 'step' : undefined}
            onMouseEnter={() => handleShow(index)}
            onFocus={() => handleShow(index)}
            onBlur={handleHide}
            onClick={() => onStepChange?.(index)}
            className="group relative h-6 flex-1 cursor-pointer outline-none"
          >
            <span
              className={cn(
                'absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-colors duration-300',
                'group-focus-visible:ring-ring group-focus-visible:ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-offset-2',
                index < current ? 'bg-foreground/70' : index === current ? 'bg-primary' : 'bg-muted-foreground/25',
              )}
            />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 flex h-0 overflow-hidden whitespace-nowrap opacity-0" aria-hidden="true">
        {steps.map((step, index) => (
          <div
            key={`measure-${step.id}`}
            ref={(el) => {
              measureRefs.current[index] = el;
            }}
            className="px-3 py-1.5 text-sm font-medium"
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
};
