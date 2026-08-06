/* ------------------------------------------------------------
   NEPAL — shared behaviour + animation engine.

   Animation is always on by design, per the site owner's request.
   There is no motion toggle and prefers-reduced-motion is not
   consulted, so visitors who need reduced motion will still get
   the full set of effects.

   Note: this file omits semicolons. Never begin a statement with
   `(` or `[` on a fresh line — ASI will weld it onto the previous
   line and the whole script dies.
   ------------------------------------------------------------ */

const isTouch = window.matchMedia('(hover: none)').matches

/* ============================================================
   Page-transition curtain: fades in on arrival, drops before
   navigating away, so pages cross-dissolve instead of flashing.
   ============================================================ */
function initCurtain() {
    const curtain = document.createElement('div')
    curtain.className = 'curtain'
    document.body.appendChild(curtain)

    // pageshow also fires when returning via the back button, where the
    // page comes out of bfcache with the curtain still down
    window.addEventListener('pageshow', () => curtain.classList.remove('dropping'))

    document.addEventListener('click', (e) => {
        // let the browser handle anything it already claimed, plus
        // modified clicks (new tab / download / save-as)
        if (e.defaultPrevented || e.button !== 0) return
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

        const link = e.target.closest('a')
        if (!link || link.target === '_blank' || link.hasAttribute('download')) return
        if (!link.getAttribute('href')) return

        // Resolve against the document and vet the result, rather than
        // trusting the raw attribute. `new URL` normalises tricks like
        // "\/\/evil.com" and "JaVaScRiPt:", and anything unparseable is
        // handed back to the browser instead of being navigated to.
        let url
        try {
            url = new URL(link.href, window.location.href)
        } catch (err) {
            return
        }

        // only ever navigate to http(s) on this same origin
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return
        if (url.origin !== window.location.origin) return

        // same page, different anchor — no transition needed
        if (url.pathname === window.location.pathname && url.hash) return

        e.preventDefault()
        curtain.classList.add('dropping')
        setTimeout(() => { window.location.assign(url.href) }, 420)
    })
}

/* ============================================================
   Ambient motes over the home hero — warm drifting flecks of
   light, bounded to the hero only, nudged away from the pointer
   and settling back once it moves on.
   ============================================================ */
function initMotes() {
    const hero = document.querySelector('header')
    if (!hero || isTouch) return

    const canvas = document.createElement('canvas')
    canvas.className = 'motes'
    canvas.setAttribute('aria-hidden', 'true')
    hero.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    const POINTER_RADIUS = 120
    let motes = []
    let running = false
    let looping = false
    let t = 0
    const pointer = { x: -9999, y: -9999 }

    function spawnMote(w, h, anywhere) {
        return {
            x: Math.random() * w,
            y: anywhere ? Math.random() * h : h + Math.random() * 30,
            r: Math.random() * 2 + 0.8,
            rise: Math.random() * 0.34 + 0.1,
            swaySpeed: Math.random() * 0.6 + 0.2,
            seed: Math.random() * Math.PI * 2,
            alpha: Math.random() * 0.42 + 0.18,
            vx: 0,
            vy: 0
        }
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = hero.offsetWidth * dpr
        canvas.height = hero.offsetHeight * dpr
        canvas.style.width = hero.offsetWidth + 'px'
        canvas.style.height = hero.offsetHeight + 'px'
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const count = Math.min(70, Math.round(hero.offsetWidth / 18))
        motes = Array.from({ length: count }, () => spawnMote(hero.offsetWidth, hero.offsetHeight, true))
    }

    function draw() {
        if (!running) { looping = false; return }
        const w = hero.offsetWidth
        const h = hero.offsetHeight
        ctx.clearRect(0, 0, w, h)
        t += 0.016

        motes.forEach(m => {
            const sway = Math.sin(t * m.swaySpeed + m.seed) * 0.4

            // pointer disturbance — a gentle push away, decaying back to
            // the mote's own drift once the cursor moves off
            const dx = m.x - pointer.x
            const dy = m.y - pointer.y
            const dist = Math.hypot(dx, dy)
            if (dist < POINTER_RADIUS && dist > 0.01) {
                const force = (1 - dist / POINTER_RADIUS) * 1.3
                m.vx += (dx / dist) * force
                m.vy += (dy / dist) * force
            }
            m.vx *= 0.92
            m.vy *= 0.92

            m.x += sway + m.vx
            m.y += m.vy - m.rise

            if (m.y < -10) Object.assign(m, spawnMote(w, h, false))
            if (m.x > w + 10) m.x = -10
            if (m.x < -10) m.x = w + 10

            // a soft gold halo behind a small terracotta core reads clearly
            // against the light hero background, unlike a flat dot would
            ctx.beginPath()
            ctx.arc(m.x, m.y, m.r * 2.4, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(226, 186, 98, ${m.alpha * 0.3})`
            ctx.fill()

            ctx.beginPath()
            ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(147, 68, 31, ${m.alpha * 0.6})`
            ctx.fill()
        })

        requestAnimationFrame(draw)
    }

    // single entry point — guarantees exactly one rAF loop is ever alive
    function startLoop() {
        if (looping) return
        looping = true
        requestAnimationFrame(draw)
    }

    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect()
        pointer.x = e.clientX - r.left
        pointer.y = e.clientY - r.top
    })
    hero.addEventListener('pointerleave', () => {
        pointer.x = -9999
        pointer.y = -9999
    })

    resize()
    window.addEventListener('resize', resize)

    // only animate while the hero is actually on screen
    new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting
        if (running) startLoop()
    }, { threshold: 0 }).observe(hero)
}

/* ============================================================
   Mobile menu
   ============================================================ */
const menuBtn = document.querySelector('.menu-btn')
const navlinks = document.querySelector('.nav-link')

if (menuBtn && navlinks) {
    const setMenu = (open) => {
        navlinks.classList.toggle('mobile-menu', open)
        menuBtn.classList.toggle('open', open)
        menuBtn.setAttribute('aria-expanded', String(open))
    }

    menuBtn.addEventListener('click', () => setMenu(!navlinks.classList.contains('mobile-menu')))
    navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)))

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navlinks.classList.contains('mobile-menu')) {
            setMenu(false)
            menuBtn.focus()
        }
    })
}

/* ============================================================
   Back-to-top with a scroll-progress ring
   ============================================================ */
const RING_R = 24
const RING_C = 2 * Math.PI * RING_R

const toTop = document.createElement('button')
toTop.type = 'button'
toTop.className = 'to-top'
toTop.setAttribute('aria-label', 'Back to top')
toTop.innerHTML =
    '<svg class="ring" viewBox="0 0 54 54" aria-hidden="true">' +
    '<circle class="track" cx="27" cy="27" r="' + RING_R + '"/>' +
    '<circle class="bar" cx="27" cy="27" r="' + RING_R + '" stroke-dasharray="' + RING_C + '" stroke-dashoffset="' + RING_C + '"/>' +
    '</svg>' +
    '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
toTop.addEventListener('click', () => scrollToY(0))
document.body.appendChild(toTop)

const ringBar = toTop.querySelector('.bar')

/* ============================================================
   Scroll engine.

   Everything scroll-linked runs from a single rAF pipeline: the
   momentum easing advances the page first, then every visual is
   recomputed against the position that produced. Sharing one frame
   is what keeps the parallax and the scrubs locked to the eased
   position instead of trailing a frame behind it.
   ============================================================ */
const navbar = document.querySelector('.navbar')
const progressBar = document.querySelector('.progress-bar')
const hero = document.querySelector('header')

let lastY = window.scrollY
let velocity = 0

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

/* ============================================================
   Momentum scrolling.

   The page still scrolls natively — all this does is ease the rate
   at which it reaches a position it was already heading to, which
   is what gives the whole site its weight.

   Pointer devices only. Phones already have far better native
   inertia than this could fake, and they'd pay for the permanent
   rAF loop in battery. Note that the test is the input device and
   not the window width — a mouse driving a half-width desktop
   window still wants the easing.
   ============================================================ */
const SMOOTH_EASE = 0.105
const smooth = { on: false, target: 0, current: 0, animating: false }

function initSmoothScroll() {
    if (isTouch) return

    // CSS `scroll-behavior: smooth` would re-animate every single
    // frame this writes, so taking that off is the engine's first act.
    // The class is added here and nowhere else, so the CSS behaviour
    // survives untouched whenever the script doesn't run.
    document.documentElement.classList.add('has-smooth-scroll')
    smooth.on = true
    smooth.target = smooth.current = window.scrollY

    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) return // pinch-zoom

        // A field that has overflowed its own box still owns the wheel;
        // swallowing it here would scroll the page out from under
        // someone part-way through a long message.
        const own = e.target.closest('textarea, [data-native-scroll]')
        if (own && own.scrollHeight > own.clientHeight) return

        e.preventDefault()

        // deltaMode 1 counts lines and 2 counts pages — normalise both
        const step = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? window.innerHeight : 1
        smooth.target = clamp(smooth.target + e.deltaY * step, 0, maxScroll())
    }, { passive: false })

    // With scroll-behavior off, keys would land instantly and feel
    // unrelated to the wheel, so they route through the easing too.
    window.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return

        const t = e.target
        if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return

        const page = window.innerHeight * 0.86
        let to = null

        if (e.key === 'ArrowDown') to = smooth.target + 110
        else if (e.key === 'ArrowUp') to = smooth.target - 110
        else if (e.key === 'PageDown') to = smooth.target + page
        else if (e.key === 'PageUp') to = smooth.target - page
        else if (e.key === 'Home') to = 0
        else if (e.key === 'End') to = maxScroll()
        else if (e.key === ' ' && t === document.body) to = smooth.target + (e.shiftKey ? -page : page)

        if (to === null) return
        e.preventDefault()
        smooth.target = clamp(to, 0, maxScroll())
    })

    // Anything that moves the page without asking us — a scrollbar
    // drag, find-in-page, a focus jump — is adopted rather than
    // fought. Mid-glide our own writes land within a pixel of
    // `current`, so only a genuine outside jump resyncs.
    window.addEventListener('scroll', () => {
        if (smooth.animating && Math.abs(window.scrollY - smooth.current) < 2) return
        smooth.current = smooth.target = window.scrollY
    }, { passive: true })
}

function advanceSmoothScroll() {
    if (!smooth.on) return

    smooth.target = clamp(smooth.target, 0, maxScroll())
    const diff = smooth.target - smooth.current

    // Once settled it stops writing entirely, which hands the page
    // back to the scrollbar and the browser's own UI until the next
    // wheel arrives.
    if (Math.abs(diff) < 0.1) {
        smooth.current = smooth.target
        smooth.animating = false
        return
    }

    smooth.current += diff * SMOOTH_EASE
    smooth.animating = true
    window.scrollTo(0, smooth.current)
}

/* Glide to an absolute offset through the engine — used by the
   back-to-top button and every in-page anchor, so nothing bypasses
   the easing and jumps. */
function scrollToY(y) {
    const to = clamp(y, 0, maxScroll())
    if (smooth.on) smooth.target = to
    else window.scrollTo({ top: to, behavior: 'smooth' })
}

function initAnchorScroll() {
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0) return
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

        const link = e.target.closest('a[href*="#"]')
        if (!link) return

        let url
        try {
            url = new URL(link.href, window.location.href)
        } catch (err) {
            return
        }

        if (url.origin !== window.location.origin) return
        if (url.pathname !== window.location.pathname) return
        if (!url.hash || url.hash === '#') return

        const goal = document.getElementById(decodeURIComponent(url.hash.slice(1)))
        if (!goal) return

        e.preventDefault()
        // the offset matches scroll-padding-top, so the fixed navbar
        // never sits on top of the heading being jumped to
        scrollToY(goal.getBoundingClientRect().top + window.scrollY - 96)
        history.pushState(null, '', url.hash)

        // preventDefault also cancels the focus move, which is the
        // entire point of the skip link — so hand focus over by hand
        if (!goal.hasAttribute('tabindex')) goal.setAttribute('tabindex', '-1')
        goal.focus({ preventScroll: true })
    })
}

/* ============================================================
   Scrubs.

   A reveal fires once and is finished. A scrub instead recomputes a
   0..1 progress from where the element currently sits in the
   viewport and rewrites its transform every frame, so the motion is
   bound to the wheel and runs backwards when you scroll back up.
   That reversibility is the whole character of the effect.

   Scrubs are for pointer devices only — on touch, the discrete
   reveals carry the page on their own exactly as they did before.
   ============================================================ */
let scrubOn = false

const mediaFrames = []
const contentGroups = []
const wordBlocks = []

/* -1 entering from below .. 0 centred .. 1 leaving past the top */
function crossProgress(r, vh) {
    return clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1)
}

/* 0 as the top edge touches the bottom of the viewport, 1 once it
   has climbed to `settle`, given as a fraction of viewport height */
function enterProgress(r, vh, settle) {
    return clamp((vh - r.top) / (vh - vh * settle), 0, 1)
}

/* how far a block has receded off the top: 0 until its bottom edge
   climbs into the top `zone` of the screen, 1 once it has gone */
function leaveProgress(r, vh, zone) {
    return clamp(1 - r.bottom / (vh * zone), 0, 1)
}

/* ---- media: parallax drift plus a scrubbed settle from oversized ---- */
function initMediaParallax() {
    document.querySelectorAll('.card-media, .split-media, .food-item').forEach(frame => {
        const img = frame.querySelector('img')
        if (!img || frame.dataset.parallaxDone) return
        frame.dataset.parallaxDone = 'true'

        const inner = document.createElement('div')
        inner.className = 'media-inner'
        img.parentNode.insertBefore(inner, img)
        inner.appendChild(img)

        mediaFrames.push({ frame, inner })
    })
}

function updateMedia(vh) {
    mediaFrames.forEach(({ frame, inner }) => {
        const r = frame.getBoundingClientRect()
        if (r.bottom < -140 || r.top > vh + 140) return

        // drift is tied to position rather than scroll speed, so it
        // glides instead of jolting and can never expose an edge
        const shift = crossProgress(r, vh) * (r.height * 0.07)

        // the photo arrives oversized and settles to its true scale by
        // the time the frame reaches the middle of the screen
        const zoom = scrubOn ? 1 + (1 - enterProgress(r, vh, 0.45)) * 0.14 : 1

        inner.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${zoom.toFixed(4)})`
    })
}

/* ---- content groups recede as they climb off the top ---- */
function initContentScrub() {
    if (!scrubOn) return

    document.querySelectorAll('.grid, .quotes, .stats, .food-gallery').forEach(el => {
        // .reveal drives its own transform through a CSS transition,
        // and a second writer on that property would only fight it
        if (el.classList.contains('reveal')) return
        contentGroups.push(el)
    })
}

function updateContentGroups(vh) {
    contentGroups.forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.bottom < -240 || r.top > vh + 240) return

        const leave = leaveProgress(r, vh, 0.55)

        // nothing to say while the block is still fully on screen —
        // and clearing the transform lets .card hover tilt own it again
        if (leave <= 0) {
            if (el.style.transform) {
                el.style.transform = ''
                el.style.opacity = ''
            }
            return
        }

        // sinking back as it leaves makes whatever arrives underneath
        // read as passing in front of it rather than shoving it away
        el.style.transform = `translate3d(0, ${(-leave * 44).toFixed(1)}px, 0) scale(${(1 - leave * 0.06).toFixed(4)})`
        el.style.opacity = (1 - leave * 0.72).toFixed(3)
    })
}

/* ---- lead paragraphs light up word by word as they cross ---- */
function initWordScrub() {
    if (!scrubOn) return

    document.querySelectorAll('.title > p, .band .wrap > p, .split-text > p').forEach(el => {
        if (el.dataset.wordsDone) return
        el.dataset.wordsDone = 'true'

        let n = 0
        const frag = document.createDocumentFragment()

        // Plain inline spans, with no display or transform of their
        // own, so line wrapping and the accessible text both come out
        // exactly as they went in — no aria patching needed.
        const walk = (node, out) => {
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.textContent.split(/(\s+)/).forEach(chunk => {
                        if (!chunk) return
                        if (/^\s+$/.test(chunk)) return out.appendChild(document.createTextNode(chunk))
                        const w = document.createElement('span')
                        w.className = 'w'
                        w.style.setProperty('--i', n++)
                        w.textContent = chunk
                        out.appendChild(w)
                    })
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const clone = child.cloneNode(false)
                    walk(child, clone)
                    out.appendChild(clone)
                } else {
                    out.appendChild(child.cloneNode(true))
                }
            })
        }

        walk(el, frag)
        if (!n) return

        el.textContent = ''
        el.appendChild(frag)
        el.classList.add('scrub-words')
        el.style.setProperty('--n', n)

        // CSS falls back to a fully lit paragraph when no script runs,
        // so the starting value has to be set here rather than there
        el.style.setProperty('--p', '0')
        wordBlocks.push(el)
    })
}

function updateWords(vh) {
    // deliberately not culled by viewport: a paragraph scrolled past
    // during a reload would otherwise stay stuck at its initial 0
    wordBlocks.forEach(el => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--p', enterProgress(r, vh, 0.34).toFixed(3))
    })
}

/* ============================================================
   Horizontal photo gallery.

   The section's own height is the scroll budget. As it travels
   through that budget the strip inside is panned sideways by the
   exact amount needed to bring its far edge flush with the right
   of the screen — so the last photo always lands, at any width,
   without hard-coding a distance.

   Runs off `render()` rather than its own listener so it shares the
   eased scroll position with the parallax and the word scrubs.
   ============================================================ */
let gallery = null

function initGallery() {
    const section = document.querySelector('.gallery-section')
    if (!section) return

    const sticky = section.querySelector('.gallery-sticky')
    const track = section.querySelector('.gallery-track')
    if (!sticky || !track) return

    const shots = [...track.querySelectorAll('.shot')]

    // The scroll budget has to cover the overflow, so the height is
    // derived from the strip's actual width rather than guessed. It is
    // recomputed on resize because the shots are sized in vw/vh.
    function measure() {
        const overflow = Math.max(0, track.scrollWidth - window.innerWidth)
        section.style.height = (window.innerHeight + overflow) + 'px'
        return overflow
    }

    let overflow = measure()
    window.addEventListener('resize', () => { overflow = measure() })

    gallery = { section, track, shots, get overflow() { return overflow } }
}

function updateGallery(vh) {
    if (!gallery) return

    const { section, track, shots, overflow } = gallery
    const r = section.getBoundingClientRect()
    if (r.bottom < 0 || r.top > vh) return

    // 0 as the section's top hits the top of the screen, 1 once it has
    // been scrolled by its whole overflow
    const p = overflow > 0 ? clamp(-r.top / overflow, 0, 1) : 0
    track.style.setProperty('--pan', (-p * overflow).toFixed(1) + 'px')

    // per-shot proximity to the middle of the screen, which drives the
    // colour, scale and caption lift entirely from CSS
    const mid = window.innerWidth / 2
    shots.forEach(shot => {
        const sr = shot.getBoundingClientRect()
        const d = Math.abs(sr.left + sr.width / 2 - mid)
        const near = clamp(1 - d / (window.innerWidth * 0.55), 0, 1)
        shot.style.setProperty('--near', near.toFixed(3))
    })
}

/* ============================================================
   Per-frame render
   ============================================================ */
function render(y) {
    const scrollable = maxScroll()
    const pct = scrollable > 0 ? y / scrollable : 0
    const vh = window.innerHeight

    if (navbar) navbar.classList.toggle('scrolled', y > 40)
    if (progressBar) progressBar.style.width = (pct * 100) + '%'

    toTop.classList.toggle('show', y > 600)
    ringBar.style.strokeDashoffset = String(RING_C * (1 - pct))

    // hero copy drifts up, shrinks and fades out as it leaves
    if (hero) {
        const content = hero.querySelector('.header-content')
        const cue = hero.querySelector('.scroll-cue')
        const h = hero.offsetHeight
        if (content && y < h) {
            const p = y / h
            content.style.transform = `translateY(${(y * 0.34).toFixed(1)}px) scale(${(1 - p * 0.08).toFixed(4)})`
            content.style.opacity = String(Math.max(0, 1 - p * 1.6))
            if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 4))
        }
    }

    updateMedia(vh)
    updateGallery(vh)

    if (scrubOn) {
        updateContentGroups(vh)
        updateWords(vh)
    }
}

let lastRenderY = -1
let needsRender = true

function frame() {
    advanceSmoothScroll()

    const y = window.scrollY

    // recomputed every frame rather than per scroll event, so it
    // actually falls back to zero when the page comes to rest
    velocity = y - lastY
    lastY = y

    if (needsRender || y !== lastRenderY) {
        render(y)
        lastRenderY = y
        needsRender = false
    }

    requestAnimationFrame(frame)
}

window.addEventListener('resize', () => { needsRender = true })

/* ============================================================
   Headline word split
   ============================================================ */
function splitHeadlines() {
    document.querySelectorAll('[data-split]').forEach(el => {
        if (el.dataset.splitDone) return
        el.dataset.splitDone = 'true'

        const walk = (node, out) => {
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.textContent.split(/(\s+)/).forEach(chunk => {
                        if (!chunk) return
                        if (/^\s+$/.test(chunk)) return out.appendChild(document.createTextNode(chunk))
                        const w = document.createElement('span')
                        w.className = 'word'
                        w.textContent = chunk
                        out.appendChild(w)
                    })
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const clone = child.cloneNode(false)
                    walk(child, clone)
                    out.appendChild(clone)
                } else {
                    out.appendChild(child.cloneNode(true))
                }
            })
        }

        // Keep the original wording as the accessible name and hide the
        // per-word spans, or assistive tech announces it word-by-word.
        const original = el.textContent.replace(/\s+/g, ' ').trim()

        const shell = document.createElement('span')
        shell.setAttribute('aria-hidden', 'true')
        walk(el, shell)

        el.textContent = ''
        el.setAttribute('aria-label', original)
        el.appendChild(shell)
        el.querySelectorAll('.word').forEach((w, i) => w.style.setProperty('--w', i))
    })
}

/* ============================================================
   Character-level heading reveal — headings split into letters
   that rise and untilt in sequence when the block scrolls in.
   ============================================================ */
function splitHeadings() {
    document.querySelectorAll('.title h2, .split-text h2, .band h2').forEach(el => {
        if (el.dataset.charsDone) return
        el.dataset.charsDone = 'true'

        const text = el.textContent
        el.textContent = ''
        let i = 0

        // per-character spans are decorative; the heading keeps its real
        // text as an aria-label so it isn't spelled out letter by letter
        const shell = document.createElement('span')
        shell.setAttribute('aria-hidden', 'true')

        text.split('').forEach(ch => {
            if (ch === ' ') return shell.appendChild(document.createTextNode(' '))
            const span = document.createElement('span')
            span.className = 'char'
            span.textContent = ch
            span.style.setProperty('--c', i++)
            shell.appendChild(span)
        })

        el.setAttribute('aria-label', text.trim())
        el.appendChild(shell)
    })
}

/* ============================================================
   Chapter rail — one dot per section, tracking the active one
   ============================================================ */
function initRail() {
    // every top-level block that carries a heading, whether or not the
    // markup gave it an id — missing ids are generated so the dots link
    const sections = [...document.querySelectorAll('main > section, main > header')]
        .filter(sec => sec.tagName === 'HEADER' || sec.querySelector('h1, h2'))

    if (sections.length < 3) return

    const rail = document.createElement('nav')
    rail.className = 'rail'
    rail.setAttribute('aria-label', 'Section navigation')

    const dots = sections.map((sec, n) => {
        const heading = sec.querySelector('h1, h2')
        const label = sec.tagName === 'HEADER'
            ? 'Top'
            : (heading ? heading.textContent : '').trim().slice(0, 24) || ('Section ' + (n + 1))

        if (!sec.id) sec.id = 'section-' + n

        const dot = document.createElement('a')
        dot.href = '#' + sec.id
        dot.dataset.label = label
        dot.setAttribute('aria-label', label)
        rail.appendChild(dot)
        return dot
    })

    document.body.appendChild(rail)

    const railObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            const i = sections.indexOf(entry.target)
            dots.forEach((d, n) => d.classList.toggle('current', n === i))
        })
    }, { threshold: 0.4 })

    sections.forEach(sec => railObserver.observe(sec))

    window.addEventListener('scroll', () => {
        rail.classList.toggle('show', window.scrollY > 300)
    }, { passive: true })
}

/* ============================================================
   Sliding nav pill that tracks the hovered link
   ============================================================ */
function initNavPill() {
    const list = document.querySelector('.nav-link')
    if (!list || isTouch) return

    const pill = document.createElement('span')
    pill.className = 'nav-pill'
    list.appendChild(pill)

    list.querySelectorAll('li:not(.ctn-li) a').forEach(link => {
        link.addEventListener('pointerenter', () => {
            const r = link.getBoundingClientRect()
            const base = list.getBoundingClientRect()
            pill.style.width = (r.width + 26) + 'px'
            pill.style.transform = `translate(${r.left - base.left - 13}px, -50%)`
        })
    })
}

/* ============================================================
   Marquee — JS-driven so it can lean into scroll direction
   ============================================================ */
function initMarquee() {
    const track = document.querySelector('.marquee-track')
    if (!track) return

    let offset = 0
    let paused = false

    // cached — reading scrollWidth per frame forces a layout every frame
    let half = track.scrollWidth / 2
    window.addEventListener('resize', () => { half = track.scrollWidth / 2 })

    track.parentElement.addEventListener('pointerenter', () => { paused = true })
    track.parentElement.addEventListener('pointerleave', () => { paused = false })

    const step = () => {
        // base crawl, plus a nudge proportional to how fast you're scrolling
        const boost = Math.max(-6, Math.min(6, velocity * 0.28))
        if (!paused) offset -= 0.6 + boost * 0.5

        if (half > 0) {
            if (offset <= -half) offset += half
            if (offset > 0) offset -= half
        }

        track.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0)`
        requestAnimationFrame(step)
    }

    step()
}

/* ============================================================
   Counters
   ============================================================ */
function countUp(el) {
    if (el.dataset.counted) return
    el.dataset.counted = 'true'

    const raw = el.textContent.trim()
    const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/s)
    if (!match) return

    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr.replace(/,/g, ''))
    if (!isFinite(target)) return

    const grouped = numStr.includes(',')
    const decimals = (numStr.split('.')[1] || '').length
    const duration = 1600
    const start = performance.now()

    const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        const value = target * eased
        el.textContent = prefix + (grouped ? Math.round(value).toLocaleString('en-US') : value.toFixed(decimals)) + suffix
        if (p < 1) requestAnimationFrame(tick)
        else el.textContent = raw
    }

    el.textContent = prefix + (grouped ? '0' : (0).toFixed(decimals)) + suffix
    requestAnimationFrame(tick)
}

/* ============================================================
   Pointer effects: card tilt + magnetic buttons
   ============================================================ */
function initTilt() {
    if (isTouch) return

    document.querySelectorAll('.card').forEach(card => {
        if (card.dataset.tiltDone) return
        card.dataset.tiltDone = 'true'
        card.classList.add('tilt')

        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect()
            const px = (e.clientX - r.left) / r.width
            const py = (e.clientY - r.top) / r.height
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%')
            card.classList.add('tilting')
            card.style.transform =
                `perspective(900px) rotateX(${((0.5 - py) * 8).toFixed(2)}deg) rotateY(${((px - 0.5) * 10).toFixed(2)}deg) translateY(-12px)`
        })

        card.addEventListener('pointerleave', () => {
            card.classList.remove('tilting')
            card.style.transform = ''
        })
    })
}

function initMagneticButtons() {
    if (isTouch) return

    document.querySelectorAll('.ctn').forEach(btn => {
        if (btn.dataset.magnetDone) return
        btn.dataset.magnetDone = 'true'

        btn.addEventListener('pointermove', (e) => {
            const r = btn.getBoundingClientRect()
            const dx = (e.clientX - (r.left + r.width / 2)) * 0.24
            const dy = (e.clientY - (r.top + r.height / 2)) * 0.34
            btn.style.transform = `translate(${dx.toFixed(1)}px, ${(dy - 4).toFixed(1)}px)`
        })

        btn.addEventListener('pointerleave', () => { btn.style.transform = '' })
    })
}

/* click ripple */
document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.ctn')
    if (!btn) return

    const r = btn.getBoundingClientRect()
    const size = Math.max(r.width, r.height)
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.cssText =
        `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 700)
})

/* ============================================================
   Custom cursor — a ring that trails the pointer with a touch of
   lag and expands over anything clickable. Desktop only: the
   .has-custom-cursor class (which is what hides the native cursor)
   is only added here, so a script failure never leaves a visitor
   without any cursor at all.
   ============================================================ */
function initCursor() {
    if (isTouch) return

    document.documentElement.classList.add('has-custom-cursor')

    const dot = document.createElement('div')
    dot.className = 'cursor-dot'
    const ring = document.createElement('div')
    ring.className = 'cursor-ring'
    document.body.appendChild(dot)
    document.body.appendChild(ring)

    let targetX = 0
    let targetY = 0
    let ringX = 0
    let ringY = 0
    let shown = false

    window.addEventListener('pointermove', (e) => {
        targetX = e.clientX
        targetY = e.clientY
        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`

        if (!shown) {
            shown = true
            dot.classList.add('show')
            ring.classList.add('show')
        }
    })

    // mouseout with no relatedTarget means the pointer left the window
    document.addEventListener('mouseout', (e) => {
        if (e.relatedTarget) return
        shown = false
        dot.classList.remove('show')
        ring.classList.remove('show')
    })

    document.addEventListener('pointerover', (e) => {
        const hoverable = e.target.closest('a, button, .card, input, textarea, select')
        ring.classList.toggle('hover', !!hoverable)
        dot.classList.toggle('hover', !!hoverable)
    })

    // the ring trails the dot with a little lag instead of snapping to it
    function loop() {
        ringX += (targetX - ringX) * 0.18
        ringY += (targetY - ringY) * 0.18
        ring.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0) translate(-50%, -50%)`
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
}

/* ============================================================
   Hero photo cluster — tilts gently toward the pointer. Lives on
   .hero-visual itself rather than the individual cards, since those
   already carry their own entrance/float animations on `transform`
   and a second writer of the same property would just fight them.
   ============================================================ */
function initHeroTilt() {
    const hero = document.querySelector('header')
    const visual = document.querySelector('.hero-visual')
    if (!hero || !visual || isTouch) return

    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        visual.style.transform = `perspective(1200px) rotateY(${(px * 8).toFixed(2)}deg) rotateX(${(-py * 8).toFixed(2)}deg)`
    })

    hero.addEventListener('pointerleave', () => {
        visual.style.transform = ''
    })
}

/* ============================================================
   The trail dog.

   three.js is ~750 kB unminified-equivalent, which is far too much
   to spend on every visit for one ornament near the bottom of the
   page. So the module is only fetched once the stage is within a
   screen of the viewport, and a failed fetch leaves the CSS
   fallback in place rather than throwing.
   ============================================================ */
function initDogStage() {
    const stage = document.querySelector('.dog-stage')
    if (!stage) return

    const loader = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        loader.disconnect()

        import('./dog.js')
            .then(({ initDog }) => initDog(stage))
            .catch(() => { stage.classList.add('dog-failed') })
    }, { rootMargin: '100% 0px' })

    loader.observe(stage)
}

/* ============================================================
   Scroll reveals
   ============================================================ */
function initReveals() {
    document.querySelectorAll('.stagger').forEach(group => {
        Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i))
    })

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('visible')
            entry.target.querySelectorAll('.stat strong, [data-count]').forEach(countUp)
            observer.unobserve(entry.target)
        })
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // stat tiles outside a .reveal wrapper still need counting
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            countUp(entry.target)
            statObserver.unobserve(entry.target)
        })
    }, { threshold: 0.4 })

    document.querySelectorAll('.stat strong').forEach(el => statObserver.observe(el))
}

/* ============================================================
   Go
   ============================================================ */
scrubOn = !isTouch

initCurtain()
initMotes()
initCursor()
initHeroTilt()
splitHeadlines()
splitHeadings()
initSmoothScroll()
initAnchorScroll()
initMediaParallax()
initContentScrub()
initWordScrub()
initRail()
initNavPill()
initMarquee()
initTilt()
initMagneticButtons()
initGallery()
initDogStage()
initReveals()
frame()

/* ============================================================
   Shared form helpers (used by contact.html and login.html)
   ============================================================ */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function report(el, ok, text) {
    el.className = 'form-msg show ' + (ok ? 'ok' : 'err')
    el.textContent = text
}
