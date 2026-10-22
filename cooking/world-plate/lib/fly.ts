/**
 * Flies an element on an arc from one place on screen to another (WAAPI), then removes it and gives the target a
 * little squash-and-stretch bump. Used for ticked ingredients dropping into the pot and saved recipes' hearts flying
 * to the Favorites link. Does nothing with reduced motion or when the target is off-screen.
 */
export function flightKeyframes(dx: number, dy: number, spin = -28) {
  const lift = 70 + Math.abs(dx) * 0.25;
  return Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const x = dx * t;
    const y = dy * t - lift * 4 * t * (1 - t);
    return {
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(spin * t).toFixed(1)}deg) scale(${(1 - 0.65 * t).toFixed(3)})`,
      opacity: t > 0.9 ? (1 - t) * 10 : 1,
    };
  });
}

const onScreen = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;

export function fly({
  node,
  from,
  to,
  aim = 0.5,
  spin,
  duration = 650,
  onLand,
}: {
  /** The thing that flies; positioned fixed at `from` and removed on landing. */
  node: HTMLElement;
  from: DOMRect;
  to: Element;
  /** Where on the target to land, as a fraction of its height (0.5 = centre). */
  aim?: number;
  spin?: number;
  duration?: number;
  onLand?: () => void;
}) {
  const target = to.getBoundingClientRect();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !onScreen(target)) return false;
  node.style.position = "fixed";
  node.style.left = `${from.left}px`;
  node.style.top = `${from.top}px`;
  node.style.pointerEvents = "none";
  node.style.zIndex = "60";
  document.body.append(node);
  const dx = target.left + target.width / 2 - (from.left + node.offsetWidth / 2);
  const dy = target.top + target.height * aim - (from.top + node.offsetHeight / 2);
  const flight = node.animate(flightKeyframes(dx, dy, spin), { duration, easing: "cubic-bezier(0.45, 0, 0.55, 1)" });
  flight.onfinish = () => {
    node.remove();
    to.animate(
      [{ transform: "scale(1, 1)" }, { transform: "scale(1.12, 0.88)" }, { transform: "scale(0.95, 1.06)" }, { transform: "scale(1, 1)" }],
      { duration: 450, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    );
    onLand?.();
  };
  return true;
}
