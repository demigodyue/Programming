/* ------------------------------------------------------------
   Scroll-expansion hero.

   A port of the React `ScrollExpandMedia` component to the plain ES
   modules this site is built from, in its image mode: a small
   photograph at the centre of a second, blurred-back photograph,
   which grows to fill the screen as you scroll while the headline
   splits and flies apart and the backdrop fades away beneath it.

   One deliberate difference from the original: NO WHEEL HIJACKING.
   The original captures `wheel` and `touchmove`, calls
   preventDefault, and pins the window at scrollY 0 until its own
   progress counter reaches 1. That traps keyboard users, breaks
   End/PageDown, and silently defeats every in-page anchor — of
   which this site has many, plus a skip-link on every page.
   Progress here is derived from the real scroll position inside a
   tall section with a sticky viewport, so every normal way of
   moving down a page still works and lands in the right place.

   Everything that moves is written as a CSS custom property, and
   only inside a rAF. Scroll handlers that write layout properties
   synchronously force a reflow per event, which on a page this long
   is the difference between smooth and unusable.

   The section markup this drives:

     <section class="scroll-hero">
       <div class="scroll-hero-track">          <- the scroll budget
         <div class="scroll-hero-layer">        <- sticky viewport
           <div class="scroll-hero-bg">...</div>
           <figure class="scroll-hero-media">...</figure>
           <div class="scroll-hero-fore">...</div>
         </div>
       </div>
       <div class="scroll-hero-body">...</div>  <- fades in at the end
     </section>
   ------------------------------------------------------------ */

/* Where in the sticky travel the expansion completes. The rest of
   the track is dwell: the photograph holds at full size for a beat
   before the page moves on, without which the expansion never lands
   and the whole thing reads as one continuous slide. */
const EXPAND_END = 0.68

/* The closed and open sizes of the media window. The original's
   numbers (300x400 growing by 1250x400, capped at 95vw/85vh) are
   kept because they are well judged — a portrait slot that opens
   into a cinematic one. The cap lives in CSS as max-width /
   max-height, exactly as it does in the original, so a narrow
   screen reaches full size early rather than growing more slowly. */
const CLOSED_W = 300
const CLOSED_H = 400
const GROW_W_DESKTOP = 1250
const GROW_W_MOBILE = 650
const GROW_H_DESKTOP = 400
const GROW_H_MOBILE = 200

/* How far the split headline travels, in vw. The original uses 150
   (180 on mobile), which carries both halves clean off screen. */
const TEXT_TRAVEL_DESKTOP = 150
const TEXT_TRAVEL_MOBILE = 180

/* The dark wash over the photograph, lifting as it opens. Straight
   from the original, where the image overlay animates from 0.7 to
   0.4 of a 50% black — the headline has to stay readable over the
   closed thumbnail, and the open photograph has to be able to
   breathe. */
const VEIL_CLOSED = 0.55
const VEIL_OPEN = 0.24

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v
const lerp = (a, b, t) => a + (b - a) * t

/* Progress mapped through a range and clamped — the shape every
   phase below is cut from. */
const phase = (p, from, to) => clamp01((p - from) / (to - from))

export function initScrollHero() {
    const section = document.querySelector('.scroll-hero')
    if (!section) return

    // The track is the scroll budget; the section also contains the
    // closing copy, and measuring that would stretch the timeline by
    // however long the copy happens to be.
    const track = section.querySelector('.scroll-hero-track')

    /* ---- split the headline ----
       First word one side, the rest the other, exactly as the
       original does. Done here rather than in the markup so the page
       source stays a plain readable heading for anything that does
       not run scripts. */
    const titleEl = section.querySelector('.scroll-hero-title')
    if (titleEl) {
        const words = (titleEl.textContent || '').trim().split(/\s+/)
        const first = words.shift() || ''
        const rest = words.join(' ')
        titleEl.textContent = ''

        const a = document.createElement('span')
        a.className = 'sh-word sh-word-a'
        a.textContent = first
        const b = document.createElement('span')
        b.className = 'sh-word sh-word-b'
        b.textContent = rest

        titleEl.append(a, b)
    }

    let vw = 0
    let vh = 0
    let mobile = false

    function measure() {
        vw = window.innerWidth
        vh = window.innerHeight
        mobile = vw < 768
    }

    measure()

    /* ============================================================
       The frame

       `progress` is 0 at the top of the hero and 1 when the sticky
       viewport has travelled its whole budget. Past the hero it
       stays pinned at 1, so the photograph is left at full size as
       the section scrolls away.
       ============================================================ */
    let queued = false

    function apply() {
        queued = false

        let progress = 1
        if (track) {
            const rect = track.getBoundingClientRect()
            // travel is the track's height minus the one viewport its
            // sticky layer occupies; guard the divide because a track
            // exactly one viewport tall has zero travel
            const travel = rect.height - vh
            progress = travel > 0 ? clamp01(-rect.top / travel) : (rect.top <= 0 ? 1 : 0)
        }

        const expand = phase(progress, 0, EXPAND_END)

        // media window geometry — CSS caps these at 95vw / 85vh
        const w = CLOSED_W + expand * (mobile ? GROW_W_MOBILE : GROW_W_DESKTOP)
        const h = CLOSED_H + expand * (mobile ? GROW_H_MOBILE : GROW_H_DESKTOP)

        section.style.setProperty('--sh-media-w', w + 'px')
        section.style.setProperty('--sh-media-h', h + 'px')
        section.style.setProperty('--sh-media-veil', String(lerp(VEIL_CLOSED, VEIL_OPEN, expand)))

        // backdrop fades out as the window opens, exactly as the
        // original, landing on the near-black the section sits on
        section.style.setProperty('--sh-bg-opacity', String(1 - expand))

        const travelVw = expand * (mobile ? TEXT_TRAVEL_MOBILE : TEXT_TRAVEL_DESKTOP)
        section.style.setProperty('--sh-text-x', travelVw + 'vw')

        // the closing copy arrives once the window is essentially
        // open — 0.75 of the expand phase, as in the original
        section.style.setProperty('--sh-body-opacity', String(phase(expand, 0.75, 1)))

        // the scroll cue is only true while there is still something
        // to scroll for
        section.style.setProperty('--sh-cue-opacity', String(1 - phase(expand, 0, 0.35)))
    }

    function schedule() {
        if (queued) return
        queued = true
        requestAnimationFrame(apply)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', () => {
        measure()
        schedule()
    }, { passive: true })

    apply()
}
