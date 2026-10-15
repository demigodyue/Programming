'use client';

// Watermelon UI `emoji-spree-choice-chips` (base) — adapted for World Plate:
// - controlled (`selected` / `onToggle`) so the URL is the source of truth
// - demo heading, drag-to-pan, 500px min-height and "N Interests" pill removed; chips wrap normally
// - real toggle buttons (aria-pressed), visible focus, saffron fill for selected
// - emoji burst rises from the clicked chip; skipped for reduced motion

import React, { useState } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipItem {
  id: string;
  label: string;
  emoji: string;
}

interface Particle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  xOffset: number;
  rotate: number;
}

interface Props {
  items: ChipItem[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
  className?: string;
}

export const EmojiSpreeChips: React.FC<Props> = ({ items, selected, onToggle, label, className }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const reduce = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const burst = (emoji: string, target: HTMLElement) => {
    if (reduce || !containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const chip = target.getBoundingClientRect();
    const fresh = Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      emoji,
      x: chip.left - box.left + chip.width / 2,
      y: chip.top - box.top,
      xOffset: (Math.random() - 0.5) * 90,
      rotate: (Math.random() - 0.5) * 40,
    }));
    setParticles((p) => [...p, ...fresh]);
    setTimeout(() => setParticles((p) => p.filter((x) => !fresh.includes(x))), 1100);
  };

  return (
    <div ref={containerRef} role="group" aria-label={label} className={cn('relative flex flex-wrap gap-2', className)}>
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <m.button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={(e) => {
              if (!isSelected) burst(item.emoji, e.currentTarget);
              onToggle(item.id);
            }}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.95rem] font-medium whitespace-nowrap transition-colors duration-200',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover-fine:bg-muted text-foreground',
            )}
          >
            <span aria-hidden>{item.emoji}</span>
            <span>{item.label}</span>
            <AnimatePresence initial={false}>
              {isSelected && (
                <m.span
                  initial={{ opacity: 0, transform: 'scale(0.6)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={{ opacity: 0, transform: 'scale(0.6)' }}
                  transition={{ duration: 0.18 }}
                  aria-hidden
                >
                  <Check className="size-4" strokeWidth={2.25} />
                </m.span>
              )}
            </AnimatePresence>
          </m.button>
        );
      })}

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
        <AnimatePresence>
          {particles.map((p, i) => (
            <m.span
              key={p.id}
              initial={{ opacity: 0, transform: 'translate(-50%, 0px) scale(0.6) rotate(0deg)' }}
              animate={{
                opacity: [0, 1, 1, 0],
                transform: [
                  'translate(-50%, 0px) scale(0.6) rotate(0deg)',
                  `translate(calc(-50% + ${p.xOffset}px), -70px) scale(1.5) rotate(${p.rotate}deg)`,
                  `translate(calc(-50% + ${p.xOffset * 0.9}px), -80px) scale(1.4) rotate(${p.rotate}deg)`,
                  `translate(calc(-50% + ${p.xOffset * 0.8}px), -40px) scale(0.8) rotate(${p.rotate / 2}deg)`,
                ],
              }}
              transition={{ duration: 0.9, delay: (i % 3) * 0.06, ease: 'easeOut' }}
              style={{ left: p.x, top: p.y }}
              className="absolute text-2xl select-none"
            >
              {p.emoji}
            </m.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
