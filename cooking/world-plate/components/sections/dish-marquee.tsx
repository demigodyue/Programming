import { Marquee } from "@/components/watermelon/marquee";
import { cn } from "@/lib/utils";

/**
 * LaunchDarkly's logo strip: a drifting row of cards whose corners alternate between soft and
 * fully round, and morph to the other shape on hover (350ms morph curve).
 */
export function DishMarquee({ items }: { items: string[] }) {
  return (
    <div className="room py-6">
      <Marquee speed="slow" pauseOnHover className="[--gap:0.75rem]">
        {items.map((name, i) => (
          <span
            key={name}
            className={cn(
              "morph-shape bg-card font-display grid h-24 min-w-56 place-items-center px-8 text-2xl whitespace-nowrap sm:h-28 sm:text-[1.75rem]",
              i % 3 === 1 ? "hover-fine:rounded-lg rounded-full" : "hover-fine:rounded-full rounded-lg",
            )}
          >
            {name}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
