import { ScrollMarquee } from "@/components/motion/scroll-marquee";
import { cn } from "@/lib/utils";

/**
 * Two strips of dish names running in opposite directions, as Slush pairs its marquees: scrolling down,
 * the top strip runs right and the bottom one left; scrolling up flips both. Each strip also drifts
 * 10vw across the screen as you pass it.
 */
export function DishMarquee({ items }: { items: string[] }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <div className="room space-y-3 py-6">
      {rows.map((row, r) => (
        <ScrollMarquee key={r} direction={r === 0 ? "right" : "left"} speed={20}>
          {row.map((name, i) => (
            <span
              key={name}
              className={cn(
                "bg-card font-display mr-3 grid h-24 min-w-56 place-items-center px-8 text-2xl whitespace-nowrap sm:h-28 sm:text-[1.75rem]",
                (i + r) % 3 === 1 ? "rounded-full" : "rounded-lg",
              )}
            >
              {name}
            </span>
          ))}
        </ScrollMarquee>
      ))}
    </div>
  );
}
