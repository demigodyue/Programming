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
   Snowfall over the hero — canvas, sized to its container
   ============================================================ */
function initSnow() {
    const hero = document.querySelector('header')
    if (!hero || isTouch) return

    const canvas = document.createElement('canvas')
    canvas.className = 'snow'
    canvas.setAttribute('aria-hidden', 'true')
    hero.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    let flakes = []
    let running = false
    let looping = false

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = hero.offsetWidth * dpr
        canvas.height = hero.offsetHeight * dpr
        canvas.style.width = hero.offsetWidth + 'px'
        canvas.style.height = hero.offsetHeight + 'px'
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const count = Math.round(hero.offsetWidth / 14)
        flakes = Array.from({ length: count }, () => ({
            x: Math.random() * hero.offsetWidth,
            y: Math.random() * hero.offsetHeight,
            r: Math.random() * 2.2 + 0.6,
            speed: Math.random() * 0.5 + 0.22,
            drift: Math.random() * 0.5 - 0.25,
            alpha: Math.random() * 0.5 + 0.25
        }))
    }

    function draw() {
        if (!running) { looping = false; return }
        const w = hero.offsetWidth
        const h = hero.offsetHeight
        ctx.clearRect(0, 0, w, h)

        flakes.forEach(f => {
            f.y += f.speed
            f.x += f.drift
            if (f.y > h) { f.y = -6; f.x = Math.random() * w }
            if (f.x > w) f.x = 0
            if (f.x < 0) f.x = w

            ctx.beginPath()
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${f.alpha})`
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
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
document.body.appendChild(toTop)

const ringBar = toTop.querySelector('.bar')

/* ============================================================
   Scroll handling: navbar state, progress bar, back-to-top ring,
   hero drift, and media parallax — all in one rAF-throttled pass.
   ============================================================ */
const navbar = document.querySelector('.navbar')
const progressBar = document.querySelector('.progress-bar')
const hero = document.querySelector('header')

let ticking = false
let lastY = window.scrollY
let velocity = 0

/* ============================================================
   Media parallax — replaces the old scroll-skew.

   Each photo is wrapped in an oversized .media-inner that drifts
   vertically as its frame crosses the viewport. It's tied to
   position rather than scroll speed, so it glides instead of
   jolting, and it can never expose an edge.
   ============================================================ */
const parallaxFrames = []

function initMediaParallax() {
    document.querySelectorAll('.card-media, .split-media, .food-item').forEach(frame => {
        const img = frame.querySelector('img')
        if (!img || frame.dataset.parallaxDone) return
        frame.dataset.parallaxDone = 'true'

        const inner = document.createElement('div')
        inner.className = 'media-inner'
        img.parentNode.insertBefore(inner, img)
        inner.appendChild(img)

        parallaxFrames.push({ frame, inner })
    })
}

function updateMediaParallax() {
    const vh = window.innerHeight

    parallaxFrames.forEach(({ frame, inner }) => {
        const r = frame.getBoundingClientRect()
        if (r.bottom < -100 || r.top > vh + 100) return

        // -1 (entering from below) .. 0 (centred) .. 1 (leaving at top)
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)
        const shift = Math.max(-1, Math.min(1, progress)) * (r.height * 0.07)
        inner.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`
    })
}

function onScroll() {
    if (ticking) return
    ticking = true

    requestAnimationFrame(() => {
        const y = window.scrollY
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const pct = scrollable > 0 ? y / scrollable : 0

        if (navbar) navbar.classList.toggle('scrolled', y > 40)
        if (progressBar) progressBar.style.width = (pct * 100) + '%'

        toTop.classList.toggle('show', y > 600)
        ringBar.style.strokeDashoffset = String(RING_C * (1 - pct))

        // hero copy drifts up and fades out as it leaves
        if (hero) {
            const content = hero.querySelector('.header-content')
            const cue = hero.querySelector('.scroll-cue')
            const h = hero.offsetHeight
            if (content && y < h) {
                const p = y / h
                content.style.transform = `translateY(${(y * 0.34).toFixed(1)}px)`
                content.style.opacity = String(Math.max(0, 1 - p * 1.6))
                if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 4))
            }
        }

        velocity = y - lastY
        lastY = y

        updateMediaParallax()

        ticking = false
    })
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)

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
initCurtain()
initSnow()
splitHeadlines()
splitHeadings()
initMediaParallax()
initRail()
initNavPill()
initMarquee()
initTilt()
initMagneticButtons()
initReveals()
onScroll()
updateMediaParallax()

/* ============================================================
   Shared form helpers (used by contact.html and login.html)
   ============================================================ */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function report(el, ok, text) {
    el.className = 'form-msg show ' + (ok ? 'ok' : 'err')
    el.textContent = text
}
