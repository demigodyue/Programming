'use client';

// Watermelon UI `continuous-tabs` (base) — adapted for World Plate:
// - controlled (`value` / `onChange`); renders on the server (the original returned null until mounted)
// - radiogroup semantics with arrow-key navigation; per-instance layoutId so several can coexist
// - saffron active pill; reduced motion snaps instead of sliding

import { useId, useRef, type FC, type KeyboardEvent, type ReactNode } from 'react';
import { m, LayoutGroup, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: ReactNode;
}

interface ContinuousTabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}

export const ContinuousTabs: FC<ContinuousTabsProps> = ({ tabs, value, onChange, label, className }) => {
  const id = useId();
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn('border-border bg-card relative inline-flex items-center gap-0.5 rounded-full border p-1', className)}
      >
        {tabs.map((tab, index) => {
          const isActive = value === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className="relative min-h-9 rounded-full px-3.5 py-1.5 sm:px-4"
            >
              {isActive && (
                <m.div
                  layoutId="active-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
                  className="bg-primary absolute inset-0 rounded-full"
                />
              )}
              <span
                className={cn(
                  'relative z-10 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover-fine:text-foreground',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
};
