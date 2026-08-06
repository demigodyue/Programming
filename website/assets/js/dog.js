/* ------------------------------------------------------------
   The trail dog — a low-poly Himalayan companion that watches
   the cursor.

   Built from primitives rather than loaded from a glTF, for two
   reasons: the page's CSP is `default-src 'self'` so nothing can
   be pulled off a CDN, and a procedural dog costs a few kilobytes
   instead of a few megabytes of mesh.

   Tracking is deliberately NOT `Object3D.lookAt`. lookAt would let
   the neck swivel a full turn and snap through the body the moment
   the pointer crosses behind the dog. Instead the aim direction is
   resolved into yaw/pitch in the neck's own space, clamped to a
   range a real neck has, then eased — so the head leads, the chest
   follows late, and it never breaks.

   Loaded on demand by main.js when the stage scrolls into view, so
   visitors who never reach it pay nothing for three.js.
   ------------------------------------------------------------ */

import * as THREE from './vendor/three.module.min.js'

/* palette — pulled from the site's own terracotta/gold/cream */
const COAT = 0xb4632c
const COAT_DARK = 0x8d4a1f
const CREAM = 0xf3e2c4
const NOSE = 0x2c1c14
const GOLD = 0xe2ba62

/* neck limits, radians. Yaw is generous, pitch is not — dogs turn
   their heads far more easily than they crane them up and down. */
const YAW_LIMIT = 1.05
const PITCH_LIMIT = 0.52
const HEAD_EASE = 0.1
const BODY_EASE = 0.045

export function initDog(stage) {
    if (!stage) return

    // A WebGL context can be refused outright — old hardware, a
    // blocklisted driver, too many live contexts on the page. Bail to
    // the CSS fallback the markup already carries instead of throwing.
    let renderer
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch (err) {
        stage.classList.add('dog-failed')
        return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-hidden', 'true')
    stage.appendChild(renderer.domElement)
    stage.classList.add('dog-ready')

    const scene = new THREE.Scene()

    /* A three-quarter view, not a head-on one. Straight down the axis
       the body foreshortens to a blob and the curled tail hides behind
       the head; from off to one side the length of the dog and the tail
       both read, and the head still turns to face you. */
    const CAM = new THREE.Vector3(2.35, 1.72, 5.35)
    const LOOK = new THREE.Vector3(0, 1.08, 0)

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.copy(CAM)
    camera.lookAt(LOOK)

    /* ---- lighting: cool sky fill, warm key, gold rim from behind ---- */
    scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b4a33, 1.5))

    const key = new THREE.DirectionalLight(0xfff0d8, 2.5)
    key.position.set(3.5, 6, 4.5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.radius = 4
    key.shadow.bias = -0.0022
    // a tight ortho frustum around the dog keeps the 1k map sharp
    const c = key.shadow.camera
    c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.near = 0.5; c.far = 20
    scene.add(key)

    const rim = new THREE.DirectionalLight(GOLD, 1.5)
    rim.position.set(-4, 2.5, -3.5)
    scene.add(rim)

    /* ---- materials ---- */
    const coat = new THREE.MeshStandardMaterial({ color: COAT, roughness: 0.82, metalness: 0 })
    const coatDark = new THREE.MeshStandardMaterial({ color: COAT_DARK, roughness: 0.85, metalness: 0 })
    const cream = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.78, metalness: 0 })
    const dark = new THREE.MeshStandardMaterial({ color: NOSE, roughness: 0.4, metalness: 0 })
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x160f0a, roughness: 0.15, metalness: 0.1 })

    const mesh = (geo, mat, x, y, z) => {
        const m = new THREE.Mesh(geo, mat)
        m.position.set(x, y, z)
        m.castShadow = true
        m.receiveShadow = true
        return m
    }

    /* ---- the dog ---- */
    const dog = new THREE.Group()
    scene.add(dog)

    // Barrel. A rotated capsule so the long axis runs front-to-back;
    // it is kept deliberately longer than it is wide, because a capsule
    // sized much rounder than this stops reading as a dog and starts
    // reading as a bear cub.
    const body = mesh(new THREE.CapsuleGeometry(0.47, 1.34, 6, 18), coat, 0, 1.18, -0.16)
    body.rotation.x = Math.PI / 2
    dog.add(body)

    // pale underside, inset so it only shows along the belly line
    const belly = mesh(new THREE.CapsuleGeometry(0.34, 1.1, 5, 14), cream, 0, 0.98, -0.14)
    belly.rotation.x = Math.PI / 2
    dog.add(belly)

    // chest and haunches, which give the barrel its taper
    const chest = mesh(new THREE.SphereGeometry(0.48, 18, 14), coat, 0, 1.2, 0.44)
    chest.scale.set(1, 1, 0.85)
    dog.add(chest)
    const rump = mesh(new THREE.SphereGeometry(0.5, 18, 14), coat, 0, 1.2, -0.86)
    dog.add(rump)

    /* legs — front pair under the chest, rear under the haunches */
    const legGeo = new THREE.CapsuleGeometry(0.135, 0.66, 4, 10)
    const pawGeo = new THREE.SphereGeometry(0.17, 12, 10)
    const legs = []
    ;[[-0.3, 0.42], [0.3, 0.42], [-0.33, -0.82], [0.33, -0.82]].forEach(([x, z], i) => {
        const leg = new THREE.Group()
        leg.position.set(x, 0.62, z)
        leg.add(mesh(legGeo, i < 2 ? coat : coatDark, 0, 0, 0))
        const paw = mesh(pawGeo, cream, 0, -0.42, 0.05)
        paw.scale.set(1, 0.7, 1.25)
        leg.add(paw)
        dog.add(leg)
        legs.push(leg)
    })

    /* Tail — a curl arcing up over the back, swept along a spline so it
       reads from the front too. A straight capsule sticking out behind
       is invisible from this camera, which is why the first pass had
       what looked like no tail at all. */
    const tailPivot = new THREE.Group()
    tailPivot.position.set(0, 1.42, -1.12)
    dog.add(tailPivot)

    const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.06, 0.42, -0.16),
        new THREE.Vector3(0.04, 0.78, 0.14),
        new THREE.Vector3(-0.06, 0.84, 0.54),
    ])
    const tail = mesh(new THREE.TubeGeometry(tailCurve, 22, 0.12, 8, false), coat, 0, 0, 0)
    tailPivot.add(tail)
    const tailTip = mesh(new THREE.SphereGeometry(0.13, 12, 10), cream, -0.06, 0.84, 0.54)
    tailPivot.add(tailTip)

    /* ---- head: everything below hangs off the neck pivot ---- */
    const neck = new THREE.Group()
    neck.position.set(0, 1.62, 0.6)
    dog.add(neck)

    // the throat column, so the head doesn't float free of the chest
    const throat = mesh(new THREE.CapsuleGeometry(0.26, 0.22, 4, 12), coat, 0, -0.12, -0.12)
    throat.rotation.x = 0.5
    neck.add(throat)

    const head = new THREE.Group()
    neck.add(head)

    const skull = mesh(new THREE.SphereGeometry(0.47, 20, 16), coat, 0, 0.26, 0)
    skull.scale.set(1, 0.96, 1.06)
    head.add(skull)

    // muzzle — longer than it is wide, which is most of what separates
    // a dog's profile from a cat's
    const muzzle = mesh(new THREE.CapsuleGeometry(0.19, 0.3, 4, 12), cream, 0, 0.15, 0.42)
    muzzle.rotation.x = Math.PI / 2
    head.add(muzzle)
    head.add(mesh(new THREE.SphereGeometry(0.1, 12, 10), dark, 0, 0.19, 0.63))

    // brow patches — the thing that makes it read as a face at a glance
    ;[-1, 1].forEach(s => {
        const brow = mesh(new THREE.SphereGeometry(0.15, 12, 10), cream, s * 0.2, 0.38, 0.32)
        brow.scale.set(1, 0.6, 0.42)
        head.add(brow)
    })

    // eyes, kept as their own refs so they can blink
    const eyes = [-1, 1].map(s => {
        const eye = mesh(new THREE.SphereGeometry(0.085, 14, 12), eyeMat, s * 0.19, 0.32, 0.4)
        head.add(eye)
        const glint = mesh(new THREE.SphereGeometry(0.027, 8, 8), cream, s * 0.19 + 0.03, 0.35, 0.465)
        glint.castShadow = false
        head.add(glint)
        return eye
    })

    // ears, on pivots so they can twitch independently
    const ears = [-1, 1].map(s => {
        const pivot = new THREE.Group()
        pivot.position.set(s * 0.27, 0.52, -0.06)
        pivot.rotation.z = s * 0.26
        pivot.rotation.x = -0.14
        const ear = mesh(new THREE.ConeGeometry(0.185, 0.36, 6), coatDark, 0, 0.16, 0)
        pivot.add(ear)
        const inner = mesh(new THREE.ConeGeometry(0.1, 0.23, 6), cream, 0, 0.15, 0.055)
        inner.castShadow = false
        pivot.add(inner)
        head.add(pivot)
        return pivot
    })

    // collar, in the site's gold. Sits on the neck group so it turns
    // with the head instead of shearing through the throat.
    const collar = mesh(new THREE.TorusGeometry(0.29, 0.06, 8, 22), new THREE.MeshStandardMaterial({
        color: GOLD, roughness: 0.35, metalness: 0.55
    }), 0, -0.1, -0.06)
    collar.rotation.x = 1.2
    neck.add(collar)

    /* ---- ground: invisible except for the shadow it catches ---- */
    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 40),
        new THREE.ShadowMaterial({ opacity: 0.24 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0.02
    floor.receiveShadow = true
    scene.add(floor)

    /* ============================================================
       Pointer tracking

       Listens on the window, not the canvas: the dog is supposed to
       watch you wherever you are on the page, not only when the
       cursor happens to be over its box.
       ============================================================ */
    const aim = { x: 0, y: 0 }        // -1..1, where the pointer is
    let hasPointer = false
    let lastMove = 0

    window.addEventListener('pointermove', (e) => {
        aim.x = (e.clientX / window.innerWidth) * 2 - 1
        aim.y = -((e.clientY / window.innerHeight) * 2 - 1)
        hasPointer = true
        lastMove = performance.now()
    }, { passive: true })

    // touch: no hover, so let a drag steer the head and otherwise idle
    window.addEventListener('touchmove', (e) => {
        const t = e.touches[0]
        if (!t) return
        aim.x = (t.clientX / window.innerWidth) * 2 - 1
        aim.y = -((t.clientY / window.innerHeight) * 2 - 1)
        hasPointer = true
        lastMove = performance.now()
    }, { passive: true })

    /* the point in world space the dog is trying to look at */
    const target = new THREE.Vector3()
    const local = new THREE.Vector3()
    const headWorld = new THREE.Vector3()

    let headYaw = 0, headPitch = 0
    let bodyYaw = 0
    let blink = 0, nextBlink = 2 + Math.random() * 3

    /* ---- sizing ---- */
    function resize() {
        const w = stage.clientWidth
        const h = stage.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        // pull back on narrow screens, where a fixed FOV would otherwise
        // crop the dog's legs off. Only the horizontal offset scales —
        // raising the camera as well would tip it into a top-down view.
        const d = w < 620 ? 1.3 : 1
        camera.position.set(CAM.x * d, CAM.y, CAM.z * d)
        camera.lookAt(LOOK)
        camera.updateProjectionMatrix()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(stage)

    /* ---- loop ---- */
    let running = false
    let looping = false
    const clock = new THREE.Clock()

    function tick() {
        if (!running) { looping = false; return }
        const dt = Math.min(clock.getDelta(), 0.05)
        const t = clock.elapsedTime

        // Idle sweep when nothing has moved for a while, so the dog
        // still feels alive on touch and on an untouched desktop.
        const idle = !hasPointer || performance.now() - lastMove > 2600
        const ax = idle ? Math.sin(t * 0.42) * 0.55 : aim.x
        const ay = idle ? Math.sin(t * 0.31) * 0.22 + 0.08 : aim.y

        // Turn the pointer into a world point by casting a ray through it
        // from the camera. Projecting through the camera (rather than
        // dropping the cursor onto a fixed plane) is what keeps the aim
        // honest with the camera off to one side.
        //
        // The reach is a fraction of the camera-to-head distance, so the
        // point always lands BETWEEN the viewer and the dog. Pushing it
        // further than the dog puts the aim point behind the animal: the
        // head then swings to its yaw limit and sits there staring off
        // into the middle distance no matter where the cursor is.
        // Deriving it per frame also keeps it correct after a resize
        // moves the camera.
        neck.getWorldPosition(headWorld)
        const reach = camera.position.distanceTo(headWorld) * 0.62

        target.set(ax, ay, 0.5).unproject(camera)
        target.sub(camera.position).normalize()
        target.multiplyScalar(reach).add(camera.position)

        // Resolve into the neck's parent space, then to yaw/pitch. Doing
        // the trig by hand (rather than lookAt) is what allows clamping.
        local.copy(target)
        dog.worldToLocal(local)
        local.sub(neck.position)

        const flat = Math.hypot(local.x, local.z)
        const wantYaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -YAW_LIMIT, YAW_LIMIT)
        const wantPitch = THREE.MathUtils.clamp(-Math.atan2(local.y, flat), -PITCH_LIMIT, PITCH_LIMIT)

        headYaw += (wantYaw - headYaw) * HEAD_EASE
        headPitch += (wantPitch - headPitch) * HEAD_EASE

        neck.rotation.y = headYaw
        neck.rotation.x = headPitch
        // a little counter-roll — the head tips into the turn
        neck.rotation.z = -headYaw * 0.13

        // chest follows the head late and only partway, which is what
        // sells it as one animal instead of a head on a stick
        bodyYaw += (headYaw * 0.32 - bodyYaw) * BODY_EASE
        dog.rotation.y = bodyYaw

        // breathing
        const breath = 1 + Math.sin(t * 1.7) * 0.016
        body.scale.set(breath, 1, breath)
        dog.position.y = Math.sin(t * 1.7) * 0.012

        // tail wags harder the more the dog is paying attention
        const interest = idle ? 0.35 : 1
        tailPivot.rotation.y = Math.sin(t * (5.5 * interest + 1.5)) * 0.5 * interest
        tailPivot.rotation.x = Math.sin(t * 2.2) * 0.1

        // ears twitch, offset from each other so they aren't a pair of wipers
        ears.forEach((ear, i) => {
            ear.rotation.x = Math.sin(t * 2.1 + i * 1.9) * 0.09 - Math.abs(headPitch) * 0.25
        })

        // legs shift weight very slightly — standing, not walking
        legs.forEach((leg, i) => {
            leg.position.y = 0.62 + Math.sin(t * 1.7 + i * 0.8) * 0.008
        })

        // blink: a fast squash on the eye meshes, then back
        blink -= dt
        if (blink < -0.12) {
            nextBlink -= dt
            if (nextBlink <= 0) {
                blink = 0.12
                nextBlink = 2.5 + Math.random() * 4
            }
        }
        const lid = blink > 0 ? 0.12 : 1
        eyes.forEach(e => e.scale.set(1, lid, 1))

        renderer.render(scene, camera)
        requestAnimationFrame(tick)
    }

    // one loop, ever — same discipline as the hero motes
    function start() {
        if (looping) return
        looping = true
        clock.getDelta()
        requestAnimationFrame(tick)
    }

    new IntersectionObserver(([entry]) => {
        running = entry.isIntersecting
        if (running) start()
    }, { threshold: 0 }).observe(stage)

    // a backgrounded tab keeps firing rAF in some browsers; stop outright
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false
        } else {
            const r = stage.getBoundingClientRect()
            running = r.bottom > 0 && r.top < window.innerHeight
            if (running) start()
        }
    })
}
