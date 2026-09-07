/* ------------------------------------------------------------
   Layered parallax — Osmo's GSAP/ScrollTrigger component, kept as
   written.

   The timeline, the ScrollTrigger configuration and the four
   yPercent values below are the original's, unchanged. Three things
   about the surroundings are worth knowing:

   1. GSAP, ScrollTrigger and Lenis are vendored into ./vendor/
      rather than installed. The page's CSP is `default-src 'self'`,
      so nothing can be pulled off a CDN at runtime — the same reason
      three.js was vendored. They are the stock ESM builds; see
      vendor/LICENSES.md, and note GSAP ships under GreenSock's own
      licence rather than MIT.

   2. Lenis replaces the site's own momentum engine, which used to
      live in main.js. It was not additive: that engine preventDefault
      -ed wheel and wrote window.scrollTo every frame, and so does
      Lenis. Two of them fight. Only one can own the scroll.

   3. `initParallax` is called once per page rather than mounted per
      component, so the cleanup the React version does on unmount has
      nowhere to run — the page teardown is the cleanup. It is still
      written out below, exposed on the returned handle, because a
      page that ever swaps sections at runtime will need it.
   ------------------------------------------------------------ */

import gsap from './vendor/gsap.esm.js'
import { ScrollTrigger } from './vendor/ScrollTrigger.esm.js'
import Lenis from './vendor/lenis.esm.js'

export function initParallax() {
    gsap.registerPlugin(ScrollTrigger)

    const triggerElement = document.querySelector('[data-parallax-layers]')

    if (triggerElement) {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 0%',
                end: '100% 0%',
                scrub: 0
            }
        })

        const layers = [
            { layer: '1', yPercent: 70 },
            { layer: '2', yPercent: 55 },
            { layer: '3', yPercent: 40 },
            { layer: '4', yPercent: 10 }
        ]

        layers.forEach((layerObj, idx) => {
            tl.to(
                triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
                {
                    yPercent: layerObj.yPercent,
                    ease: 'none'
                },
                idx === 0 ? undefined : '<'
            )
        })
    }

    /* ---- the morph ----
       The hero's photograph opens from a small rounded window into a
       full-bleed frame. This is the page's second photograph, and it
       now arrives the same way.

       Done with clip-path rather than by animating width/height for
       two reasons. The layer already carries a GSAP transform from
       the timeline above — writing size onto the same element would
       mean two tweens fighting over one box — and clip-path is a
       separate property that composes with the translate instead of
       replacing it. The `round` term carries the corner radius, so
       the window's shape and its size morph as one value.

       Its own trigger, not the timeline's: the opening should happen
       as the section rises into view, whereas the parallax scrub runs
       later, while the section leaves past the top. */
    document.querySelectorAll('.parallax__layer-img').forEach(img => {
        const frame = img.closest('.parallax__visuals')
        if (!frame) return

        gsap.fromTo(img,
            { clipPath: 'inset(24% 30% 24% 30% round 26px)' },
            {
                clipPath: 'inset(0% 0% 0% 0% round 0px)',
                ease: 'none',
                scrollTrigger: {
                    trigger: frame,
                    start: 'top bottom',
                    end: 'top 18%',
                    scrub: 0.6
                }
            }
        )
    })

    /* Lenis is started whether or not this page has a parallax
       section. In the original it is the component's business, but
       here it is the page's only scroll engine — gating it on the
       section would leave any page without one scrolling natively
       while every other page eased, which reads as a bug. */
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)

    /* main.js routes the back-to-top button and every in-page anchor
       through this, so nothing bypasses the easing and jumps. */
    window.lenis = lenis

    return {
        destroy() {
            ScrollTrigger.getAll().forEach(st => st.kill())
            gsap.killTweensOf(triggerElement)
            lenis.destroy()
            delete window.lenis
        }
    }
}
