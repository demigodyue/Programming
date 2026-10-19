import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// Strong UI ease-out, cubic-bezier(0.23, 1, 0.32, 1) — the same curve as --ease-out in index.css
CustomEase.create('uiOut', '0.23,1,0.32,1');

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

// ==========================================
// SMOOTH SCROLL (Lenis — what impossiblefoods.com runs)
// ==========================================
let lenis = null;

export function startSmoothScroll() {
  if (lenis || !window.matchMedia(MOTION_OK).matches) return () => {};
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}

// ==========================================
// PAGE MOTION — wired by data attributes, rebuilt on every page swap
//   [data-hero]           hero intro timeline + scroll-out
//   .display-hero/-section  letter-by-letter slam on scroll (skip with data-no-split)
//   [data-eyebrow]        ◂ brackets ▸ slide in from the sides
//   [data-reveal]         rise + fade on scroll
//   [data-stagger]        children rise in batches
//   [data-zoom]           image settles inside its frame while scrolling
//   [data-clip]           clip-path opens while scrolling
//   [data-parallax="n"]   moves n × scroll distance (negative = up)
//   [data-depth="n"]      follows the mouse, n = depth
//   [data-marquee]        looping band that speeds up and flips with scroll
//   [data-progress]       page scroll progress bar
// ==========================================
export function setupPageMotion(root, { delay = 0 } = {}) {
  if (!root) return () => {};
  const mm = gsap.matchMedia(root);

  mm.add({ motion: MOTION_OK, fine: FINE_POINTER }, (context) => {
    const { motion, fine } = context.conditions;
    if (!motion) return undefined;

    const inView = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.9;
    const startDelay = (el) => (inView(el) ? delay : 0);
    const once = (el, start = 'top 88%') => ({ trigger: el, start, once: true });

    heroIntro(root, delay);

    // Display headlines: letters slam up from the baseline, slightly tilted
    root.querySelectorAll('.display-hero, .display-section').forEach((el) => {
      if (el.closest('[data-hero]') || el.hasAttribute('data-no-split')) return;
      const split = SplitText.create(el, { type: 'words,chars' });
      gsap.from(split.chars, {
        yPercent: 70,
        scaleY: 1.4,
        rotate: () => gsap.utils.random(-8, 8),
        opacity: 0,
        transformOrigin: '50% 100%',
        duration: 0.8,
        ease: 'uiOut',
        stagger: 0.025,
        delay: startDelay(el),
        scrollTrigger: once(el),
      });
    });

    root.querySelectorAll('[data-eyebrow]').forEach((el) => {
      if (el.closest('[data-hero]')) return;
      eyebrowTween(el, { delay: startDelay(el), scrollTrigger: once(el, 'top 92%') });
    });

    root.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'uiOut',
        delay: startDelay(el),
        scrollTrigger: once(el, 'top 92%'),
      });
    });

    root.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = [...group.children];
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 70, rotate: 1.5, scale: 0.96 });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            rotate: 0,
            scale: 1,
            duration: 0.9,
            ease: 'uiOut',
            stagger: 0.08,
            delay: startDelay(batch[0]),
            overwrite: true,
            clearProps: 'transform,opacity',
          }),
      });
    });

    root.querySelectorAll('[data-zoom]').forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1.22, yPercent: -6 },
        {
          scale: 1,
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'clamp(top bottom)', end: 'bottom top', scrub: true },
        }
      );
    });

    root.querySelectorAll('[data-clip]').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(12% 9% 12% 9% round 38px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 38px)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: true },
        }
      );
    });

    root.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0;
      if (!speed) return;
      const trigger = el.closest('section, header, [data-parallax-scope]') || el;
      gsap.to(el, {
        y: () => speed * (trigger.offsetHeight + window.innerHeight * 0.5),
        ease: 'none',
        scrollTrigger: { trigger, start: 'clamp(top bottom)', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });

    root.querySelectorAll('[data-marquee]').forEach(marquee);

    const bar = root.querySelector('[data-progress]');
    if (bar) {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } }
      );
    }

    // Mouse depth: every [data-depth] layer drifts with the cursor
    if (!fine) return undefined;
    const layers = [...root.querySelectorAll('[data-depth]')].map((el) => {
      const depth = parseFloat(el.dataset.depth) || 0;
      return {
        depth,
        x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }),
      };
    });
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      layers.forEach((l) => {
        l.x(nx * l.depth * 40);
        l.y(ny * l.depth * 30);
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  });

  // Anton must be loaded before split letters are measured for scroll positions
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}

function eyebrowTween(el, vars) {
  const split = SplitText.create(el, { type: 'chars' });
  const chars = split.chars;
  const first = chars[0];
  const last = chars[chars.length - 1];
  const tl = gsap.timeline({ ...vars, defaults: { ease: 'uiOut' } });
  tl.from(chars.slice(1, -1), { opacity: 0, y: 10, duration: 0.5, stagger: 0.012 }, 0);
  // Impossible Foods' appear-from-left / appear-from-right brackets
  if (first?.textContent === '◂') tl.from(first, { x: -60, opacity: 0, duration: 0.7 }, 0);
  if (last?.textContent === '▸') tl.from(last, { x: 60, opacity: 0, duration: 0.7 }, 0);
  return tl;
}

function heroIntro(root, delay) {
  const hero = root.querySelector('[data-hero]');
  if (!hero) return;
  const title = hero.querySelector('[data-hero-title]');
  const eyebrow = hero.querySelector('[data-eyebrow]');
  const stack = hero.querySelector('[data-hero-stack]');

  const tl = gsap.timeline({ delay: delay + 0.1, defaults: { ease: 'uiOut' } });
  if (eyebrow) tl.add(eyebrowTween(eyebrow, {}), 0);
  if (title) {
    const split = SplitText.create(title, { type: 'words,chars' });
    tl.from(
      split.chars,
      {
        yPercent: 90,
        scaleY: 1.6,
        rotate: () => gsap.utils.random(-12, 12),
        opacity: 0,
        transformOrigin: '50% 100%',
        duration: 0.9,
        stagger: 0.035,
      },
      0.1
    );
  }
  tl.from(hero.querySelectorAll('[data-hero-photo]'), {
    opacity: 0,
    scale: 0.8,
    rotate: -10,
    duration: 1,
    ease: 'back.out(1.7)',
    stagger: 0.12,
  }, 0.35);
  tl.from(hero.querySelectorAll('[data-food-icon]'), {
    opacity: 0,
    scale: 0.6,
    duration: 0.8,
    stagger: { each: 0.04, from: 'random' },
  }, 0.5);
  tl.from(hero.querySelectorAll('[data-hero-copy]'), { opacity: 0, y: 30, duration: 0.9, stagger: 0.1 }, 0.7);

  // Scrolling away: the headline sinks back and fades while the photos drift apart
  if (stack) {
    gsap.to(stack, {
      y: () => hero.offsetHeight * 0.22,
      scale: 0.92,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }
}

// Infinite band: speeds up with scroll velocity, flips with scroll direction, skews a little
function marquee(el) {
  const track = el.querySelector('[data-marquee-track]');
  if (!track) return;
  const reverse = el.dataset.marquee === 'reverse';
  const loop = gsap.to(track, {
    xPercent: -50,
    duration: parseFloat(el.dataset.speed) || 28,
    ease: 'none',
    repeat: -1,
  });
  // Start deep into the repeat so playing backwards never hits time 0
  loop.totalTime(loop.duration() * 1000);
  const base = reverse ? -1 : 1;
  loop.timeScale(base);
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3' });
  let settle = null;

  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const v = gsap.utils.clamp(-5, 5, self.getVelocity() / 400);
      const dir = base * self.direction;
      gsap.to(loop, {
        timeScale: dir * (1 + Math.abs(v)),
        duration: 0.15,
        overwrite: true,
        onComplete: () => gsap.to(loop, { timeScale: dir, duration: 0.9, ease: 'power1.out' }),
      });
      skew(gsap.utils.clamp(-8, 8, -v * 2));
      settle?.kill();
      settle = gsap.delayedCall(0.15, () => skew(0));
    },
  });
}

// Region tabs swap the card list in place: bring the new cards in
export function animateSwap(container) {
  if (!container || !window.matchMedia(MOTION_OK).matches) return;
  gsap.from(container.children, {
    opacity: 0,
    y: 40,
    duration: 0.6,
    ease: 'uiOut',
    stagger: 0.06,
    clearProps: 'transform,opacity',
  });
}
