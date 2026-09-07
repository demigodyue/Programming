/* ------------------------------------------------------------
   Card fan — the photographs dealt out like a hand of cards.

   A vanilla port of the React/GSAP fan carousel. Seven cards are on
   the table at once; with more photographs than that, the arrows
   rotate the hand and cards fly in from the side the travel came from.

   GSAP owns the whole `transform` matrix on .fan-card, which is why
   nothing in the markup carries .card, .shot or .reveal — main.js
   drives transforms on all three, and two engines writing one matrix
   is a fight neither wins. Centring is done with `inset: 0; margin:
   auto` in the stylesheet for the same reason: a centring translate
   would be wiped by the first tween.

   Same no-semicolon style as the rest of assets/js. Never begin a
   statement with `(` or `[` on a fresh line.
   ------------------------------------------------------------ */

import gsap from './vendor/gsap.esm.js'

const MAX_VISIBLE = 7
const HALF = 3

/* rot in degrees, x and y in rem, applied outward from the middle */
const FAN_POSITIONS = [
    { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
    { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
    { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
    { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
    { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
    { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
    { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
]

/* The x offsets above are tuned for a full-width desktop fan. Narrower
   viewports get the same shape scaled down, so the outermost card stays
   on screen instead of hanging off the side. */
function spreadMultiplier(width) {
    if (width < 480) return 0.28
    if (width < 640) return 0.38
    if (width < 768) return 0.5
    if (width < 1024) return 0.75
    return 1.0
}

/* The y offsets assume the layout got its ideal height. On a short
   viewport the stylesheet gives it less, so the vertical spread is
   scaled by the same fraction and the fan stays inside its box. */
function heightMultiplier(width) {
    let ideal
    if (width < 480) ideal = 22 * 16
    else if (width < 640) ideal = 26 * 16
    else if (width < 768) ideal = 28 * 16
    else if (width < 1024) ideal = 34 * 16
    else ideal = 38 * 16

    const available = window.innerHeight * 0.7
    return available >= ideal ? 1 : available / ideal
}

/* With fewer photographs than slots the seven fixed positions would
   leave a lopsided hand, so the curve is interpolated across whatever
   count there is instead. */
function slotConfig(total, slot) {
    if (total >= MAX_VISIBLE) return FAN_POSITIONS[slot]

    const centre = total >> 1
    const distance = total > 1 ? (slot - centre) / centre : 0
    const away = Math.abs(distance)
    return {
        rot: distance * 21,
        scale: 1.0 - 0.2244 * away * away,
        x: distance * 30,
        y: away * away * 7.3,
        zIndex: 10 - Math.abs(slot - centre),
    }
}

function arrow(direction, label) {
    const points = direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'fan-arrow'
    btn.setAttribute('aria-label', label)
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" '
        + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<polyline points="' + points + '"/></svg>'
    return btn
}

export function initCardFan() {
    const layout = document.querySelector('.fan-layout')
    if (!layout) return

    const cards = Array.from(layout.querySelectorAll('.fan-card'))
    const total = cards.length
    if (!total) return

    const paginated = total > MAX_VISIBLE
    const slots = paginated ? MAX_VISIBLE : total
    const canHover = window.matchMedia('(hover: hover)').matches

    let centreIndex = paginated ? HALF : total >> 1
    let animating = false
    let onTable = new Set()
    let releaseHover = null
    let release = null

    /* Hands the stylesheet over to the absolutely-positioned fan. Until
       this runs the cards are a plain scrollable strip, which is what a
       visitor sees if this module never loads. */
    layout.classList.add('fan-ready')

    /* photograph index -> slot on the table */
    function visibleSlots(centre) {
        const map = new Map()
        if (!paginated) {
            cards.forEach((_, i) => map.set(i, i))
            return map
        }
        for (let slot = 0; slot < MAX_VISIBLE; slot++) {
            map.set(((centre + slot - HALF) % total + total) % total, slot)
        }
        return map
    }

    /* ---- controls ---- */
    let dots = []
    if (paginated) {
        const controls = document.createElement('div')
        controls.className = 'fan-controls'

        const prev = arrow('left', 'Previous photograph')
        const next = arrow('right', 'Next photograph')

        const dotWrap = document.createElement('div')
        dotWrap.className = 'fan-dots'
        dots = cards.map(() => {
            const dot = document.createElement('span')
            dot.className = 'fan-dot'
            dotWrap.appendChild(dot)
            return dot
        })

        controls.appendChild(prev)
        controls.appendChild(dotWrap)
        controls.appendChild(next)
        layout.insertAdjacentElement('afterend', controls)

        prev.addEventListener('click', () => cycle('left'))
        next.addEventListener('click', () => cycle('right'))
    }

    function cycle(direction) {
        if (animating || !paginated) return
        centreIndex = direction === 'right'
            ? (centreIndex + 1) % total
            : (centreIndex - 1 + total) % total
        deal(direction, false)
    }

    /* ---- the deal ---- */
    function deal(direction, firstRun) {
        const map = visibleSlots(centreIndex)
        const before = onTable
        const spread = spreadMultiplier(window.innerWidth)
        const lift = heightMultiplier(window.innerWidth)

        /* The lock is released on a timer rather than by counting
           onComplete callbacks. Hover tweens carry overwrite: 'auto'
           and will happily kill a deal that is still in the air — the
           callback then never fires, and a counter would leave the fan
           locked for good. A clock cannot be overwritten. */
        animating = true
        if (release) release.kill()
        const lockFor = firstRun
            ? 0.2 + (map.size - 1) * 0.06 + 1.2
            : 0.6
        release = gsap.delayedCall(lockFor, () => {
            animating = false
            release = null
        })

        cards.forEach((card, i) => {
            const slot = map.get(i)
            const wasOnTable = before.has(i)

            if (slot === undefined) {
                if (wasOnTable) {
                    // swept off the table, against the way the hand moved
                    const exitX = direction === 'right' ? -40 : 40
                    gsap.to(card, {
                        x: exitX + 'rem',
                        opacity: 0,
                        scale: 0.5,
                        rotation: direction === 'right' ? -30 : 30,
                        duration: 0.4,
                        ease: 'power2.in',
                        zIndex: 0,
                    })
                } else if (firstRun) {
                    gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 })
                }
                return
            }

            const seat = slotConfig(slots, slot)
            const to = {
                x: seat.x * spread + 'rem',
                y: seat.y * lift + 'rem',
                rotation: seat.rot,
                scale: seat.scale,
                opacity: 1,
                zIndex: seat.zIndex,
            }

            if (firstRun) {
                gsap.set(card, { x: 0, y: 12 * lift + 'rem', rotation: 0, scale: 0.5, opacity: 0 })
                gsap.to(card, Object.assign({}, to, {
                    duration: 1.2,
                    ease: 'elastic.out(1.05,.78)',
                    delay: 0.2 + slot * 0.06,
                }))
            } else if (!wasOnTable) {
                const enterX = direction === 'right' ? 40 : -40
                gsap.set(card, {
                    x: enterX + 'rem',
                    y: seat.y * lift + 'rem',
                    rotation: direction === 'right' ? 30 : -30,
                    scale: 0.5,
                    opacity: 0,
                })
                gsap.to(card, Object.assign({}, to, { duration: 0.6, ease: 'power2.out' }))
            } else {
                gsap.to(card, Object.assign({}, to, { duration: 0.5, ease: 'power2.out' }))
            }
        })

        onTable = new Set(map.keys())
        dots.forEach((dot, i) => dot.classList.toggle('is-current', i === centreIndex))
        bindHover(map)
    }

    /* ---- hover: the pointed-at card rises, its neighbours part ---- */
    function bindHover(map) {
        if (releaseHover) releaseHover()
        if (!canHover) return

        const seated = []
        cards.forEach((el, i) => {
            const slot = map.get(i)
            if (slot !== undefined) seated.push({ el: el, slot: slot })
        })
        seated.sort((a, b) => a.slot - b.slot)

        const middle = seated.length >> 1
        let active = null
        let leaveTimer = null

        const settle = (hovered) => {
            const spread = spreadMultiplier(window.innerWidth)
            const lift = heightMultiplier(window.innerWidth)

            seated.forEach(({ el, slot }) => {
                const seat = slotConfig(slots, slot)
                let x = seat.x * spread
                let y = seat.y * lift
                let rot = seat.rot
                let scale = seat.scale
                let delay = 0

                if (hovered === null) {
                    delay = Math.abs(slot - middle) * 0.02
                } else {
                    const distance = Math.abs(slot - hovered)
                    delay = distance * 0.02

                    if (slot === hovered) {
                        y -= 2.5 * lift
                        scale *= 1.08
                    } else {
                        // cards nearer the middle have the most room to give
                        const norm = middle > 0 ? (slot - middle) / middle : 0
                        const push = 8 * (1 - Math.abs(norm)) * (1 + 0.2 * Math.max(0, 3 - distance))

                        if (slot < hovered) {
                            x -= push * spread
                            rot -= 3 / (distance + 1)
                        } else {
                            x += push * spread
                            rot += 3 / (distance + 1)
                        }

                        // the far card lifts a little so the parting reads
                        if (slot === seated.length - 1 && hovered < middle) y -= lift
                        if (slot === 0 && hovered > middle) y -= lift
                    }
                }

                gsap.to(el, {
                    x: x + 'rem',
                    y: y + 'rem',
                    rotation: rot,
                    scale: scale,
                    duration: 0.5,
                    delay: delay,
                    ease: 'elastic.out(1,.75)',
                    overwrite: 'auto',
                })
                gsap.set(el, { zIndex: seat.zIndex })
            })
        }

        const entered = seated.map(({ el, slot }) => {
            const handler = () => {
                if (animating) return
                if (leaveTimer) {
                    clearTimeout(leaveTimer)
                    leaveTimer = null
                }
                if (active !== slot) {
                    active = slot
                    settle(slot)
                }
            }
            el.addEventListener('mouseenter', handler)
            return { el: el, handler: handler }
        })

        /* A short delay before collapsing: sliding between two cards
           crosses a sliver of bare container, and without it the fan
           snaps shut and reopens on every crossing. */
        const onLeave = () => {
            if (animating) return
            if (leaveTimer) clearTimeout(leaveTimer)
            leaveTimer = setTimeout(() => {
                leaveTimer = null
                // re-checked here, not just on the way in: an arrow click
                // can land inside the 50ms and this would overwrite it
                if (animating) return
                active = null
                settle(null)
            }, 50)
        }
        layout.addEventListener('mouseleave', onLeave)

        const onResize = () => {
            if (!animating) settle(active)
        }
        window.addEventListener('resize', onResize)

        releaseHover = () => {
            entered.forEach(({ el, handler }) => el.removeEventListener('mouseenter', handler))
            layout.removeEventListener('mouseleave', onLeave)
            window.removeEventListener('resize', onResize)
            if (leaveTimer) clearTimeout(leaveTimer)
            releaseHover = null
        }
    }

    /* Hold the entrance until the fan is actually on screen — dealt
       behind the fold it would be over before anyone scrolled to it. */
    const watcher = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return
        watcher.disconnect()
        deal(null, true)
    }, { threshold: 0.25 })
    watcher.observe(layout)
}
