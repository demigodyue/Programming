import {
  Pizza,
  Croissant,
  Coffee,
  Cherry,
  IceCreamCone,
  Popcorn,
  Drumstick,
  Salad,
  Soup,
  Carrot,
  Fish,
  Donut,
  Sandwich,
  Citrus,
  EggFried,
  Wheat,
  CookingPot,
  Shrimp,
  Hamburger,
  ChefHat,
  Flame,
  CakeSlice,
} from 'lucide-react';

// x / y are % of the field. Kept off the centre column so icons never sit behind the red headline.
// depth = mouse parallax, speed = scroll parallax, dur / delay / rot drive the CSS float.
const HERO_ICONS = [
  { Icon: Croissant, x: 24, y: 5, size: 40, red: false, depth: 0.5, speed: -0.25, dur: 6.5, delay: -1, rot: 8, phone: true },
  { Icon: Coffee, x: 37, y: 2, size: 30, red: true, depth: -0.4, speed: -0.4, dur: 5.2, delay: -3, rot: 5 },
  { Icon: Cherry, x: 52, y: 6, size: 34, red: false, depth: 0.8, speed: -0.15, dur: 7, delay: -2, rot: 10, phone: true },
  { Icon: IceCreamCone, x: 65, y: 2, size: 38, red: true, depth: -0.7, speed: -0.32, dur: 5.8, delay: -4, rot: 6 },
  { Icon: Popcorn, x: 77, y: 7, size: 32, red: false, depth: 0.6, speed: -0.2, dur: 6.2, delay: -0.5, rot: 9, phone: true },
  { Icon: Drumstick, x: 2, y: 40, size: 50, red: true, depth: -0.9, speed: -0.35, dur: 7.4, delay: -2.5, rot: 7 },
  { Icon: Salad, x: 11, y: 54, size: 36, red: false, depth: 0.45, speed: -0.12, dur: 6, delay: -1.5, rot: 5 },
  { Icon: Soup, x: 5, y: 68, size: 44, red: false, depth: -0.5, speed: -0.28, dur: 8, delay: -3.5, rot: 4 },
  { Icon: Carrot, x: 17, y: 80, size: 30, red: true, depth: 0.7, speed: -0.4, dur: 5.5, delay: -2, rot: 12 },
  { Icon: Fish, x: 91, y: 40, size: 48, red: true, depth: 0.9, speed: -0.3, dur: 7.2, delay: -1, rot: 6 },
  { Icon: Donut, x: 84, y: 54, size: 36, red: false, depth: -0.45, speed: -0.18, dur: 0, delay: 0, rot: 0, spin: 16 },
  { Icon: Sandwich, x: 93, y: 68, size: 44, red: false, depth: 0.5, speed: -0.26, dur: 6.8, delay: -4.5, rot: 5 },
  { Icon: Citrus, x: 80, y: 81, size: 30, red: true, depth: -0.7, speed: -0.38, dur: 0, delay: 0, rot: 0, spin: 22 },
  { Icon: EggFried, x: 25, y: 91, size: 42, red: true, depth: 0.6, speed: -0.22, dur: 6.4, delay: -2.2, rot: 8, phone: true },
  { Icon: Wheat, x: 33, y: 96, size: 30, red: false, depth: -0.3, speed: -0.1, dur: 5.6, delay: -1.2, rot: 10 },
  { Icon: CookingPot, x: 67, y: 93, size: 40, red: false, depth: 0.4, speed: -0.16, dur: 7.6, delay: -3, rot: 4, phone: true },
  { Icon: Shrimp, x: 75, y: 89, size: 36, red: true, depth: -0.8, speed: -0.34, dur: 5.9, delay: -0.8, rot: 9 },
  { Icon: Pizza, x: 44, y: 99, size: 34, red: false, depth: 0.55, speed: -0.2, dur: 0, delay: 0, rot: 0, spin: 26 },
];

const COMPACT_ICONS = [
  { Icon: Pizza, x: 2, y: 6, size: 40, red: true, depth: -0.6, speed: -0.3, dur: 6.4, delay: -1, rot: 8, phone: true },
  { Icon: Hamburger, x: 12, y: 46, size: 34, red: false, depth: 0.5, speed: -0.2, dur: 7, delay: -2.5, rot: 6 },
  { Icon: Flame, x: 4, y: 80, size: 30, red: true, depth: -0.4, speed: -0.35, dur: 5.4, delay: -3, rot: 10 },
  { Icon: ChefHat, x: 20, y: 12, size: 28, red: false, depth: 0.7, speed: -0.15, dur: 6.8, delay: -0.5, rot: 5 },
  { Icon: CakeSlice, x: 93, y: 8, size: 38, red: false, depth: 0.6, speed: -0.28, dur: 6, delay: -2, rot: 9, phone: true },
  { Icon: Shrimp, x: 84, y: 44, size: 34, red: true, depth: -0.5, speed: -0.22, dur: 7.2, delay: -4, rot: 7 },
  { Icon: Donut, x: 95, y: 78, size: 32, red: false, depth: 0.45, speed: -0.32, dur: 0, delay: 0, rot: 0, spin: 18 },
  { Icon: Cherry, x: 77, y: 12, size: 28, red: true, depth: -0.7, speed: -0.18, dur: 5.6, delay: -1.6, rot: 11 },
];

export default function FoodIconField({ variant = 'hero' }) {
  const icons = variant === 'hero' ? HERO_ICONS : COMPACT_ICONS;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {icons.map(({ Icon, x, y, size, red, depth, speed, dur, delay, rot, spin, phone }, i) => (
        <div
          key={i}
          data-parallax={speed}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${phone ? '' : 'hidden md:block'}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div data-depth={depth} data-food-icon>
            <div
              className={spin ? 'animate-spin-slow' : 'animate-float'}
              style={
                spin
                  ? { '--float-dur': `${spin}s` }
                  : { '--float-dur': `${dur}s`, '--float-delay': `${delay}s`, '--float-r': `${rot}deg` }
              }
            >
              <Icon
                strokeWidth={1.5}
                style={{ width: size, height: size }}
                className={red ? 'text-gold' : 'text-blush-highlight opacity-70'}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
