import { Flame } from "lucide-react";
import { T } from "@/components/i18n";
import { ScrollMarquee } from "@/components/motion/scroll-marquee";
import { cn } from "@/lib/utils";

/**
 * Two strips of dish names running in opposite directions, as Slush pairs its marquees: scrolling down,
 * the top strip runs right and the bottom one left; scrolling up flips both. Each strip also drifts
 * 10vw across the screen as you pass it. Two tilted bands: tomato with cream type, sand with tomato
 * type, a flame between names.
 */
export function DishMarquee({ items }: { items: { en: string; ja: string }[] }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <div className="space-y-3 overflow-x-clip py-12 md:py-16">
      {rows.map((row, r) => (
        <div
          key={r}
          className={cn(
            "-mx-[5vw] border-y border-border py-3 md:py-4",
            r === 0 ? "bg-headline text-background -rotate-2" : "bg-card text-headline rotate-[1.5deg]",
          )}
        >
          <ScrollMarquee direction={r === 0 ? "right" : "left"} speed={20}>
            {row.map((name) => (
              <span key={name.en} className="font-display flex items-center gap-6 pr-6 text-4xl leading-none tracking-[0.03em] whitespace-nowrap md:text-6xl">
                <T {...name} />
                <Flame aria-hidden strokeWidth={1.5} className={cn("size-7 shrink-0 md:size-9", r === 0 ? "text-background" : "text-headline")} />
              </span>
            ))}
          </ScrollMarquee>
        </div>
      ))}
    </div>
  );
}
