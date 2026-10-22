/**
 * Switches something page-wide (language, theme) with a circle that grows out of the button that was pressed:
 * a view transition whose new state is revealed through an expanding clip-path circle, the page and the header
 * together (globals.css, "Circle reveal"). `update` must change the DOM synchronously. Falls back to a plain switch
 * without the View Transitions API, with reduced motion, or while another transition (a page swing) is running.
 */
let busy = false;

export function circleReveal(from: Element | null, update: () => void) {
  const root = document.documentElement;
  if (
    busy ||
    !from ||
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    root.dataset.swing !== undefined
  ) {
    update();
    return;
  }
  const b = from.getBoundingClientRect();
  const x = b.left + b.width / 2;
  const y = b.top + b.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  busy = true;
  root.dataset.vt = "reveal";
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(update);
  } catch {
    busy = false;
    delete root.dataset.vt;
    update();
    return;
  }
  const animations: Animation[] = [];
  transition.ready
    .then(() => {
      const header = document.querySelector<HTMLElement>(".nav-bar")?.getBoundingClientRect();
      const options = { duration: 650, easing: "cubic-bezier(0.65, 0.05, 0, 1)", fill: "both" } as const;
      const grow = (cx: number, cy: number) => [
        { clipPath: `circle(0px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${radius}px at ${cx}px ${cy}px)` },
      ];
      animations.push(root.animate(grow(x, y), { ...options, pseudoElement: "::view-transition-new(root)" }));
      if (header) animations.push(root.animate(grow(x - header.left, y - header.top), { ...options, pseudoElement: "::view-transition-new(site-header)" }));
    })
    .catch(() => {});
  transition.finished.finally(() => {
    // Don't leave the end state behind for the next view transition's pseudo-elements.
    animations.forEach((a) => a.cancel());
    busy = false;
    delete root.dataset.vt;
  });
}
