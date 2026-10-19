"use client";

import { useEffect } from "react";

/**
 * Slush's ScrollTrigger behaviour, for the whole site from one place:
 *
 * - `[data-reveal]` elements get `data-in` once their top crosses 80% of the viewport ("top 80%", once).
 *   `data-reveal-at="50"` moves the line (e.g. "top center"). Elements already scrolled past reveal at once.
 *   What actually moves is CSS (see "Scroll reveals" in globals.css).
 * - `[data-parallax]` elements drift with the scroll (Slush's initGlobalParallax, scrub: true):
 *   `data-parallax-start` / `-end` are yPercent values (default 20 → -20), `data-parallax-scroll-start` /
 *   `-scroll-end` are ScrollTrigger positions (default "top bottom" → "bottom top"), and
 *   `data-parallax-trigger` names an ancestor (closest selector) to measure instead of the element itself.
 *   Skipped for reduced motion.
 *
 * - `[data-scrub="words"]` (ScrubWords) fill word by word as you scroll — Hungry Tiger's text scrub: each `.word`
 *   goes 0.2 → 1 opacity, 0.2 long, 0.4 apart, power1.out, scrubbed from "top 90%" to "top center"
 *   (`data-scrub-start` / `-end` override). Skipped for reduced motion.
 *
 * Content added later (client navigations, filtered lists) is picked up by a MutationObserver.
 */
export function ScrollMotion() {
  useEffect(() => {
    const observers = new Map<string, IntersectionObserver>();
    const reveal = (el: Element) => el.setAttribute("data-in", "");

    const observe = (el: Element) => {
      if (el.hasAttribute("data-in") || el.hasAttribute("data-observed")) return;
      el.setAttribute("data-observed", "");
      const at = Math.min(100, Math.max(0, Number(el.getAttribute("data-reveal-at") ?? 80)));
      const key = String(at);
      let io = observers.get(key);
      if (!io) {
        io = new IntersectionObserver(
          (entries, obs) => {
            for (const entry of entries) {
              if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                reveal(entry.target);
                obs.unobserve(entry.target);
              }
            }
          },
          { rootMargin: `0px 0px -${100 - at}% 0px` },
        );
        observers.set(key, io);
      }
      io.observe(el);
    };

    // ---- Parallax ----
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    type Item = { el: HTMLElement; trigger: HTMLElement; from: number; to: number; start: string; end: string; s0: number; s1: number };
    const items: Item[] = [];

    const position = (spec: string, trigger: HTMLElement) => {
      // "<trigger edge> <viewport position>[-=N%|+=N%]", e.g. "top bottom" or "bottom top-=20%".
      const [edge = "top", view = "bottom"] = spec.split(/\s+/);
      const rect = trigger.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const h = rect.height;
      const vh = window.innerHeight;
      const edgeY = edge === "center" ? top + h / 2 : edge === "bottom" ? top + h : top;
      // ScrollTrigger also takes a viewport percentage, e.g. "top 90%".
      const pct = /^(\d+(?:\.\d+)?)%$/.exec(view);
      if (pct) return edgeY - (Number(pct[1]) / 100) * vh;
      const m = /^(top|center|bottom)(?:([+-])=(\d+(?:\.\d+)?)%)?$/.exec(view);
      const base = m?.[1] === "center" ? vh / 2 : m?.[1] === "top" ? 0 : vh;
      const offset = m?.[3] ? (Number(m[3]) / 100) * vh * (m[2] === "-" ? -1 : 1) : 0;
      return edgeY - (base + offset);
    };

    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (const item of items) {
        const keep = item.el.style.translate;
        if (item.trigger === item.el) item.el.style.translate = "";
        item.s0 = Math.max(0, position(item.start, item.trigger));
        item.s1 = Math.min(max, position(item.end, item.trigger));
        item.el.style.translate = keep;
      }
    };

    // ---- Word scrub (Hungry Tiger) ----
    type Scrub = { el: HTMLElement; words: HTMLElement[]; s0: number; s1: number };
    const scrubs: Scrub[] = [];
    const addScrub = (el: HTMLElement) => {
      if (reduce.matches || scrubs.some((s) => s.el === el)) return;
      scrubs.push({ el, words: Array.from(el.querySelectorAll<HTMLElement>(".word")), s0: 0, s1: 0 });
    };
    const measureScrubs = () => {
      for (const s of scrubs) {
        s.s0 = position(s.el.dataset.scrubStart ?? "top 90%", s.el);
        s.s1 = position(s.el.dataset.scrubEnd ?? "top center", s.el);
      }
    };
    const renderScrubs = (y: number) => {
      for (let i = scrubs.length - 1; i >= 0; i--) {
        const s = scrubs[i];
        if (!s.el.isConnected) {
          scrubs.splice(i, 1);
          continue;
        }
        const span = s.s1 - s.s0;
        const p = span > 0 ? Math.min(1, Math.max(0, (y - s.s0) / span)) : y >= s.s1 ? 1 : 0;
        const t = p * ((s.words.length - 1) * 0.4 + 0.2);
        s.words.forEach((w, k) => {
          const local = Math.min(1, Math.max(0, (t - k * 0.4) / 0.2));
          const eased = 1 - (1 - local) * (1 - local); // power1.out
          w.style.opacity = (0.2 + 0.8 * eased).toFixed(3);
        });
      }
    };

    let frame = 0;
    const render = () => {
      frame = 0;
      const y = window.scrollY;
      renderScrubs(y);
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!item.el.isConnected) {
          items.splice(i, 1);
          continue;
        }
        const span = item.s1 - item.s0;
        const p = span > 0 ? Math.min(1, Math.max(0, (y - item.s0) / span)) : y >= item.s1 ? 1 : 0;
        item.el.style.translate = `0 ${(item.from + (item.to - item.from) * p).toFixed(3)}%`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const addParallax = (el: HTMLElement) => {
      if (reduce.matches || items.some((i) => i.el === el)) return;
      const sel = el.dataset.parallaxTrigger;
      const trigger = (sel && el.parentElement?.closest<HTMLElement>(sel)) || el;
      const num = (v: string | undefined, d: number) => (v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : d);
      items.push({
        el,
        trigger,
        from: num(el.dataset.parallaxStart, 20),
        to: num(el.dataset.parallaxEnd, -20),
        start: el.dataset.parallaxScrollStart ?? "top bottom",
        end: el.dataset.parallaxScrollEnd ?? "bottom top",
        s0: 0,
        s1: 0,
      });
    };

    const scan = (node: ParentNode) => {
      node.querySelectorAll("[data-reveal]").forEach(observe);
      node.querySelectorAll<HTMLElement>("[data-parallax]").forEach(addParallax);
      node.querySelectorAll<HTMLElement>('[data-scrub="words"]').forEach(addScrub);
    };
    const refresh = () => {
      measure();
      measureScrubs();
      render();
    };

    scan(document);
    refresh();

    const mo = new MutationObserver((records) => {
      let added = false;
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches("[data-reveal]")) observe(node);
          if (node.matches("[data-parallax]")) addParallax(node);
          if (node.matches('[data-scrub="words"]')) addScrub(node);
          scan(node);
          added = true;
        });
      }
      if (added) requestAnimationFrame(refresh);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const ro = new ResizeObserver(() => requestAnimationFrame(refresh));
    ro.observe(document.body);
    const onReduce = () => {
      if (!reduce.matches) return;
      items.forEach((item) => (item.el.style.translate = ""));
      items.length = 0;
      scrubs.forEach((s) => s.words.forEach((w) => (w.style.opacity = "")));
      scrubs.length = 0;
    };

    window.addEventListener("scroll", schedule, { passive: true });
    reduce.addEventListener("change", onReduce);
    return () => {
      observers.forEach((io) => io.disconnect());
      // Let a re-run (React Strict Mode in dev runs effects twice) observe these elements again.
      document.querySelectorAll("[data-observed]:not([data-in])").forEach((el) => el.removeAttribute("data-observed"));
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      reduce.removeEventListener("change", onReduce);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
