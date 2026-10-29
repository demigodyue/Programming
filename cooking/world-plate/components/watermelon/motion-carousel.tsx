'use client';

// Watermelon UI `motion-carousel` — adapted for Sizzle Atlas:
// - renders arbitrary slides (recipe cards) instead of numbered boxes
// - carousel/slide ARIA semantics, labelled controls, keyboard arrows
// - pagination dots no longer animate width/height; a shared `layoutId` pill moves between them (transform only)
// - reduced motion: no active-slide scaling, instant scroll

import * as React from 'react';
import { m, useReducedMotion, type Transition } from 'motion/react';
import { type EmblaOptionsType, type EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type PropType = {
  label: string;
  slides: { key: string; label: string; content: React.ReactNode }[];
  options?: EmblaOptionsType;
  className?: string;
};

const transition: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 24,
  mass: 1,
};

const useEmblaControls = (emblaApi: EmblaCarouselType | undefined) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [prevDisabled, setPrevDisabled] = React.useState(true);
  const [nextDisabled, setNextDisabled] = React.useState(true);

  const onDotClick = React.useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const onPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const onNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    const sync = (api: EmblaCarouselType) => {
      setSelectedIndex(api.selectedScrollSnap());
      setPrevDisabled(!api.canScrollPrev());
      setNextDisabled(!api.canScrollNext());
    };
    const onInit = (api: EmblaCarouselType) => {
      setScrollSnaps(api.scrollSnapList());
      sync(api);
    };
    onInit(emblaApi);
    emblaApi.on('reInit', onInit).on('select', sync);
    return () => {
      emblaApi.off('reInit', onInit).off('select', sync);
    };
  }, [emblaApi]);

  return { selectedIndex, scrollSnaps, prevDisabled, nextDisabled, onDotClick, onPrev, onNext };
};

function MotionCarousel({ label, slides, options, className }: PropType) {
  const reduce = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', duration: reduce ? 0 : 28, ...options });
  const { selectedIndex, scrollSnaps, prevDisabled, nextDisabled, onDotClick, onPrev, onNext } =
    useEmblaControls(emblaApi);
  const id = React.useId();

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onPrev();
        if (e.key === 'ArrowRight') onNext();
      }}
      className={cn('w-full space-y-6', className)}
    >
      <div className="-mx-1 overflow-hidden px-1 py-3" ref={emblaRef}>
        <div className="flex touch-pan-y touch-pinch-zoom">
          {slides.map((slide, index) => (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
              className="mr-5 flex min-w-0 flex-none basis-[82%] sm:basis-[46%] lg:basis-[31.5%]"
            >
              <m.div
                className="size-full"
                initial={false}
                animate={{ transform: !reduce && index < selectedIndex ? 'scale(0.94)' : 'scale(1)', opacity: index < selectedIndex ? 0.6 : 1 }}
                transition={transition}
              >
                {slide.content}
              </m.div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1" aria-label="Choose slide" role="group">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
              className="relative grid size-6 place-items-center rounded-full"
            >
              <span className="hex-outline text-foreground/45 size-3" />
              {index === selectedIndex && (
                <m.span
                  layoutId={`${id}-dot`}
                  transition={transition}
                  className="hex text-foreground absolute size-3"
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled}
            aria-label="Previous dishes"
            className="hover-fine:bg-foreground hover-fine:text-background grid size-11 place-items-center rounded-full border transition-[background-color,color,opacity,transform] duration-150 active:scale-95 disabled:opacity-40"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label="Next dishes"
            className="hover-fine:bg-foreground hover-fine:text-background grid size-11 place-items-center rounded-full border transition-[background-color,color,opacity,transform] duration-150 active:scale-95 disabled:opacity-40"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export { MotionCarousel };
