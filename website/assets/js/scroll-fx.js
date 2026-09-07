/* ------------------------------------------------------------
   Page-wide scroll effects.

   Two jobs, both on the ScrollTrigger already vendored for the
   parallax section:

   1. ATMOSPHERE. The page's own hero photograph, blurred hard and
      held behind everything, drifting and brightening across the
      whole document. This is what makes the background match the
      picture rather than merely being sampled from it — it IS the
      picture — and it is the one effect that runs from the first
      pixel to the last on every page.

   2. CONTENT. Everything below the fold used to arrive with a single
      fade and then sit still. These add scrubbed motion that keeps
      going the whole way down.

   Chosen targets are deliberately disjoint from what main.js already
   drives. That file transforms `.media-inner`, `.word`, `.shot`,
   `.card` (tilt), `.ctn` (magnetic) and the scrub group containers;
   writing transforms to any of those from here would mean two
   engines fighting over one matrix. The elements below are free.
   ------------------------------------------------------------ */

import gsap from './vendor/gsap.esm.js'
import { ScrollTrigger } from './vendor/ScrollTrigger.esm.js'

export function initScrollFx() {
    gsap.registerPlugin(ScrollTrigger)

    const doc = document.documentElement

    /* ---- 1. atmosphere ----
       Driven as custom properties rather than by transforming the
       pseudo-element directly: ::before cannot be targeted by GSAP,
       and the property write is one line of style on <html> per
       frame either way. */
    gsap.to(doc, {
        // unitless: the stylesheet composes the unit in calc(), so a
        // value carrying 'vh' here produces calc(... -14vh * 1vh)
        '--atmos-y': -14,
        '--atmos-scale': 1.24,
        '--atmos-opacity': 0.2,
        ease: 'none',
        scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6
        }
    })

    /* ---- 2. content ---- */

    // Section headings rise as they enter and keep drifting after —
    // scrubbed rather than one-shot, so the page still moves when you
    // scroll back up.
    gsap.utils.toArray('.card-body, .quote figcaption, .food-item figcaption').forEach(el => {
        gsap.fromTo(el,
            { y: 26 },
            {
                y: -14,
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
            }
        )
    })

    // Photo bands: the background photograph drifts against the copy
    // sitting on it. Background position, not transform, because the
    // section itself is a scrub-group container main.js owns.
    gsap.utils.toArray('.band-photo').forEach(el => {
        gsap.fromTo(el,
            { backgroundPositionY: '42%' },
            {
                backgroundPositionY: '58%',
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
            }
        )
    })

    // The caption plate over each card photo lifts into view.
    gsap.utils.toArray('.card-media .caption').forEach(el => {
        gsap.fromTo(el,
            { yPercent: 40, opacity: 0 },
            {
                yPercent: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 58%', scrub: 0.5 }
            }
        )
    })

    // Prices and stat tiles count in with a little overshoot.
    gsap.utils.toArray('.price, .stat').forEach(el => {
        gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'back.out(1.6)',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
        })
    })

    // The footer rises out from under the last section.
    const footer = document.querySelector('.footer')
    if (footer) {
        gsap.fromTo(footer.querySelector('.footer-grid') || footer,
            { y: 60, opacity: 0.4 },
            {
                y: 0,
                opacity: 1,
                ease: 'none',
                scrollTrigger: { trigger: footer, start: 'top bottom', end: 'top 60%', scrub: 0.7 }
            }
        )
    }

    /* ---- 3. section seams ----
       Every boundary between top-level sections gets a graded join
       and a hairline that draws itself across as the boundary
       crosses the viewport.

       Appended here rather than written into six pages of markup:
       it is decoration with no meaning, so it belongs to the script
       that animates it and not to the document. aria-hidden and
       pointer-events:none keep it out of the way of everything
       else.

       The first section is skipped — its "boundary" is the top of
       the page, where there is nothing to transition from. */
    const joins = Array.from(document.querySelectorAll('main > section, main > header'))
    if (footer) joins.push(footer)

    joins.forEach((section, idx) => {
        if (idx === 0) return
        // a section that already opens on a full-bleed photograph has
        // its own edge treatment; doubling up muddies it
        if (section.classList.contains('scroll-hero')) return

        const seam = document.createElement('span')
        seam.className = 'sect-seam'
        seam.setAttribute('aria-hidden', 'true')
        section.prepend(seam)

        gsap.fromTo(seam,
            { '--seam-w': '0%', '--seam-glow': 0 },
            {
                '--seam-w': '86%',
                '--seam-glow': 1,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 96%',
                    end: 'top 62%',
                    scrub: 0.5
                }
            }
        )

        // and the section's own contents rise into the join, so the
        // boundary is something that happens rather than a line that
        // is merely present
        const inner = section.querySelector('.wrap, .title, .hero-grid, .footer-grid')
        if (inner) {
            gsap.fromTo(inner,
                { y: 42 },
                {
                    y: 0,
                    ease: 'none',
                    scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 55%', scrub: 0.7 }
                }
            )
        }
    })

    // Anything added or resized after boot (images landing, fonts
    // swapping) moves every trigger's start/end.
    window.addEventListener('load', () => ScrollTrigger.refresh())
}
