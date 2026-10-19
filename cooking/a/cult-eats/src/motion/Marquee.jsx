import { Flame } from 'lucide-react';

// Full-bleed tilted band. The track holds the items twice so a -50% loop is seamless.
// tone "red" = red band / black type, "wine" = burgundy band / blush type.
export default function Marquee({ items, tone = 'red', reverse = false, tilt = -2, speed = 28 }) {
  const band =
    tone === 'red'
      ? 'bg-impossible-red text-butcher-black'
      : 'bg-burgundy-stage text-blush-highlight';
  const sep = tone === 'red' ? 'text-bone-white' : 'text-impossible-red';
  const run = (copy) =>
    items.map((item, i) => (
      <span key={`${copy}-${i}`} className="flex items-center gap-6 pr-6" aria-hidden={copy === 1 || undefined}>
        <span>{item}</span>
        <Flame className={`w-7 h-7 md:w-9 md:h-9 shrink-0 ${sep}`} strokeWidth={1.5} />
      </span>
    ));

  return (
    <div
      data-marquee={reverse ? 'reverse' : ''}
      data-speed={speed}
      className={`relative w-[110vw] -ml-[5vw] overflow-hidden border-y border-butcher-black py-3 md:py-4 ${band}`}
      style={{ rotate: `${tilt}deg` }}
    >
      <div data-marquee-track className="flex w-max font-meat text-4xl md:text-6xl leading-none tracking-[0.03em] whitespace-nowrap">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
