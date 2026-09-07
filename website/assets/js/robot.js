/* ------------------------------------------------------------
   The trail robot — a gloss-black humanoid that stands in the
   scroll hero, watches the cursor, and shrinks into the corner of
   the page once you scroll past.

   Built from primitives rather than loaded from a glTF or a hosted
   scene, for two reasons: the page's CSP is `default-src 'self'` so
   nothing can be pulled off a CDN, and a procedural robot costs a
   few kilobytes instead of a few megabytes of mesh.

   The gloss is the whole look, and gloss is reflections — a black
   metal material with no environment to reflect renders as a flat
   black silhouette, which is exactly what this must not be. So the
   scene carries a small procedurally-painted environment map (see
   `buildEnvironment`): a studio softbox above, a bright horizon
   band, dark floor. That is what draws the long highlight down the
   dome of the head and the hard rim along the shoulders.

   Tracking is deliberately NOT `Object3D.lookAt`. lookAt would let
   the neck swivel a full turn and snap through the chassis the
   moment the pointer crosses behind the robot. Instead the aim
   direction is resolved into yaw/pitch in the neck's own space,
   clamped to a range the joint actually has, then eased — so the
   head leads, the chassis follows late, and it never breaks.

   Sizing is fixed, not fluid. The stage this lives in is resized
   every scroll frame by scroll-hero.js, and reallocating the WebGL
   drawing buffer at 60fps would tank the page. The canvas is
   therefore rendered once at RENDER_PX and scaled by CSS transform
   (`--robot-scale`), which costs nothing.

   Loaded on idle by main.js, never on the critical path: three.js
   is far too much to spend before first paint.
   ------------------------------------------------------------ */

import * as THREE from './vendor/three.module.min.js'

/* palette — the reference is near-monochrome: wet black shell,
   graphite panels, cold chrome joints, white-blue lamps */
const SHELL = 0x0b0c0e        // wet gloss black
const PANEL = 0x15171b        // graphite shoulder/thigh pads
/* The joints are dark gunmetal, not bright chrome. A true chrome
   value against this environment mirrors the softbox back at full
   strength, and every knee and hip turns into a white block that
   reads as a hole in the robot rather than a machined part. Dark
   metal still catches the same highlight — just at a level the
   black shell can live next to. */
const CHROME = 0x5c636c
const VISOR = 0x050506        // face glass, darker than the shell
const LED = 0xdfefff          // cold white eye dots

/* The canvas is rendered once at this CSS size and then scaled.
   Square, because the stage changes aspect wildly between the wide
   expanded hero box and the tall corner dock — a square buffer is
   the only one that never runs out of pixels on either axis. */
const RENDER_PX = 760

/* Joint limits, radians. Yaw is generous — a servo turns further
   than a neck — but pitch stays tight so the head never folds back
   into its own collar. */
const YAW_LIMIT = 1.15
const PITCH_LIMIT = 0.46
const HEAD_EASE = 0.11
const BODY_EASE = 0.05

/* ------------------------------------------------------------
   The environment map.

   An equirectangular strip painted in a 2D canvas, then run through
   PMREMGenerator so roughness values above 0 blur it correctly.
   Cheap (one 256x128 canvas), self-hosted, and enough to make
   metal read as metal.

   Painted rather than photographed because the reference lighting
   is a studio: one big soft source high and slightly front, a
   bright horizon to catch the shoulder edges, and near-black below
   so the underside of every limb stays dark and the silhouette
   holds.
   ------------------------------------------------------------ */
function buildEnvironment(renderer) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    // vertical falloff: bright sky, hot horizon, black ground
    const sky = ctx.createLinearGradient(0, 0, 0, 128)
    sky.addColorStop(0, '#3c4350')
    sky.addColorStop(0.42, '#8e9aab')
    sky.addColorStop(0.52, '#ffffff')
    sky.addColorStop(0.6, '#2b3038')
    sky.addColorStop(1, '#050506')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 256, 128)

    // the key softbox — an overhead blob, front-left of the robot.
    // This is the highlight that runs down the head and the chest.
    const key = ctx.createRadialGradient(96, 26, 2, 96, 26, 46)
    key.addColorStop(0, '#ffffff')
    key.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, 256, 128)

    // a weaker kicker behind and to the right, so the far shoulder
    // gets an edge instead of dissolving into the background
    const kick = ctx.createRadialGradient(212, 44, 2, 212, 44, 34)
    kick.addColorStop(0, 'rgba(255,255,255,0.75)')
    kick.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = kick
    ctx.fillRect(0, 0, 256, 128)

    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace

    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromEquirectangular(texture).texture

    // the source canvas texture and the generator are both dead
    // weight once the cube map exists
    texture.dispose()
    pmrem.dispose()

    return env
}

/* ------------------------------------------------------------
   The eye plates.

   The reference has dot-matrix eyes — a grid of small lit cells,
   not two glowing beads. Painted as a texture rather than built
   from ~30 tiny meshes: at the size these render, geometry that
   fine is invisible cost, and an emissive map lets the whole grid
   dim and blink by changing one number.
   ------------------------------------------------------------ */
function buildEyeTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 128, 64)

    // 7x3 cells with a gap, inset so the grid never touches the edge
    // of the plate and read as a screen rather than a painted panel
    const cols = 7
    const rows = 3
    const cw = 13
    const ch = 13
    const gapX = (128 - cols * cw) / (cols + 1)
    const gapY = (64 - rows * ch) / (rows + 1)

    ctx.fillStyle = '#ffffff'
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = gapX + c * (cw + gapX)
            const y = gapY + r * (ch + gapY)
            // the outer cells sit dimmer, which gives the grid a
            // soft edge instead of a hard rectangular cut
            const edge = c === 0 || c === cols - 1 || r === 0 || r === rows - 1
            ctx.globalAlpha = edge ? 0.45 : 1
            ctx.fillRect(x, y, cw, ch)
        }
    }
    ctx.globalAlpha = 1

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
}

export function initRobot(stage) {
    if (!stage) return

    // A WebGL context can be refused outright — old hardware, a
    // blocklisted driver, too many live contexts on the page. The
    // robot is decorative, so bail silently and leave the hero's
    // glow standing on its own rather than throwing.
    let renderer
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch (err) {
        return
    }

    /* ACES + a slightly lifted exposure is what keeps the white
       highlights from clipping to flat paper-white on a shell this
       dark; linear tone mapping blows the dome out completely. */
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(RENDER_PX, RENDER_PX, false)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    // CSS places and scales this; see .robot-stage canvas in style.css
    stage.style.setProperty('--robot-px', RENDER_PX + 'px')
    stage.appendChild(canvas)
    stage.classList.add('robot-ready')

    const scene = new THREE.Scene()
    scene.environment = buildEnvironment(renderer)

    /* A near-frontal three-quarter view, matching the reference.
       Straight on, the raised arms flatten into the torso; a few
       degrees round gives the shoulders depth while the face is
       still square enough to the viewer to be watched by it.

       The distance is set to fit the whole figure — crown at ~3.4,
       feet at 0 — inside the square canvas with headroom. The stage
       crops this canvas hard at both the closed size and the corner
       dock, so anything framed tight here loses its feet the moment
       the window is not square. */
    const CAM = new THREE.Vector3(0.82, 1.98, 7.6)
    const LOOK = new THREE.Vector3(0, 1.72, 0)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.copy(CAM)
    camera.lookAt(LOOK)

    /* ---- lighting ----
       The environment map does the shaping. These are for the
       things it cannot do: cast a shadow, and put a hard white rim
       down the outside of both arms. */
    const key = new THREE.DirectionalLight(0xffffff, 2.1)
    key.position.set(2.6, 6.2, 4.6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.radius = 4
    key.shadow.bias = -0.0022
    const shadowCam = key.shadow.camera
    shadowCam.left = -3.4; shadowCam.right = 3.4
    shadowCam.top = 5; shadowCam.bottom = -1
    shadowCam.near = 0.5; shadowCam.far = 18
    scene.add(key)

    // the backlight — this is the halo behind the robot in the
    // reference, and the reason the silhouette separates from black
    const rim = new THREE.DirectionalLight(0xeaf2ff, 3.4)
    rim.position.set(-2.4, 3.4, -4.8)
    scene.add(rim)

    const rimB = new THREE.DirectionalLight(0xeaf2ff, 2.2)
    rimB.position.set(3.2, 2.4, -4.2)
    scene.add(rimB)

    // just enough bounce that the underside of the jaw and the
    // inner arms are not pure void
    scene.add(new THREE.HemisphereLight(0x9fb4cc, 0x0a0a0c, 0.55))

    /* ---- materials ---- */
    const gloss = new THREE.MeshPhysicalMaterial({
        color: SHELL,
        roughness: 0.14,
        metalness: 0.52,
        // clearcoat is the wet look: a second specular layer over
        // the base, which is what separates lacquered black from
        // merely dark grey plastic
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5
    })

    /* The same lacquer, turned down.

       A vertical capsule mirrors the environment's bright horizon
       band down its entire length, so at the full envMap intensity
       the legs came out a pale silver while the torso — curved, and
       catching the softbox as one moving highlight — stayed black.
       Same paint, different geometry, wildly different result. The
       fix is to give the parts that run vertically less environment
       to reflect rather than to change their colour. */
    const glossDeep = new THREE.MeshPhysicalMaterial({
        color: SHELL,
        roughness: 0.2,
        metalness: 0.45,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.55
    })

    const panel = new THREE.MeshPhysicalMaterial({
        color: PANEL,
        roughness: 0.42,
        metalness: 0.72,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.1
    })

    const chrome = new THREE.MeshStandardMaterial({
        color: CHROME,
        roughness: 0.28,
        metalness: 1,
        envMapIntensity: 0.85
    })

    const visorMat = new THREE.MeshPhysicalMaterial({
        color: VISOR,
        roughness: 0.06,
        metalness: 0.4,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.8
    })

    const eyeTexture = buildEyeTexture()
    // Emissive with an alpha map: the black cells of the grid are
    // punched out entirely, so the dark visor shows through between
    // the lit dots instead of a grey card floating on the face.
    const eyeMat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: LED,
        emissiveMap: eyeTexture,
        emissiveIntensity: 2.6,
        alphaMap: eyeTexture,
        transparent: true,
        roughness: 0.4
    })

    const mesh = (geo, mat, x, y, z) => {
        const m = new THREE.Mesh(geo, mat)
        m.position.set(x, y, z)
        m.castShadow = true
        m.receiveShadow = true
        return m
    }

    /* A capsule spanning two points.

       Limbs are the one place where composing rotations by hand is a
       false economy: the raised-arm pose wants the forearm going up
       and out at an angle nobody can hold in their head as an Euler
       triple, but everybody can hold as "elbow here, wrist there".
       Stating the endpoints and deriving the rotation means the pose
       can be adjusted by moving a point. */
    const UP = new THREE.Vector3(0, 1, 0)

    const limb = (from, to, radius, mat) => {
        const span = new THREE.Vector3().subVectors(to, from)
        const len = span.length()
        // CapsuleGeometry's length excludes the two hemispherical
        // caps, so subtracting the diameter is what makes the capsule
        // actually reach from one point to the other
        const body = Math.max(len - radius * 2, 0.01)
        const m = mesh(new THREE.CapsuleGeometry(radius, body, 6, 14), mat, 0, 0, 0)
        m.position.copy(from).addScaledVector(span, 0.5)
        m.quaternion.setFromUnitVectors(UP, span.normalize())
        return m
    }

    /* ============================================================
       The robot

       Proportions are set with the feet at y = 0 and the crown at
       roughly y = 3.35, so the camera numbers above stay meaningful
       if a limb is retuned later.
       ============================================================ */
    const robot = new THREE.Group()
    scene.add(robot)

    // Everything above the ankles rides this group, so the idle
    // reads as one machine breathing rather than parts drifting.
    const body = new THREE.Group()
    robot.add(body)

    /* ---- legs ---- */
    const legs = [-1, 1].map(s => {
        const leg = new THREE.Group()
        leg.position.set(s * 0.26, 0, 0)

        // shin, then a knee, then the thigh — built bottom up so the
        // joints land on round numbers. The joint spheres are inset
        // rather than proud: a metal ball wider than the limb it
        // joins reads as a bright ring around the leg, which is the
        // one thing the reference silhouette does not have.
        leg.add(mesh(new THREE.CapsuleGeometry(0.145, 0.6, 6, 14), glossDeep, 0, 0.46, 0))
        leg.add(mesh(new THREE.SphereGeometry(0.13, 16, 12), chrome, 0, 0.86, 0))
        leg.add(mesh(new THREE.CapsuleGeometry(0.175, 0.52, 6, 14), glossDeep, 0, 1.24, 0))

        // hip ball, the pivot the thigh would swing on
        leg.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), chrome, 0, 1.58, 0))

        // foot — small, dark, mostly there to stop the shin ending
        // in mid-air at the bottom of the frame
        const foot = mesh(new THREE.BoxGeometry(0.26, 0.11, 0.4), glossDeep, 0, 0.06, 0.06)
        leg.add(foot)

        body.add(leg)
        return leg
    })

    /* ---- pelvis and waist ----
       Both in the gloss black, not the metal. A flat-topped metal
       block here sits directly under the softbox and catches it
       across its whole upper face, which lit the hips up like a
       lamp and cut the figure in half. */
    // A tapered drum, not a box. The flat front face of a box sat
    // square to the key light and came back as a pale grey slab
    // across the hips — the one thing on the whole figure that read
    // brighter than the chest.
    const pelvis = mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.3, 18), glossDeep, 0, 1.72, 0)
    pelvis.scale.set(1.06, 1, 0.82)
    body.add(pelvis)
    // the waist column is deliberately narrow: the whole read of the
    // reference silhouette is broad shoulders over a pinched middle
    body.add(mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.26, 16), glossDeep, 0, 1.96, 0))

    /* ---- torso ----
       A lathe rather than a cylinder. The chest has to swell out of
       the waist and then tuck back under the collar, and a profile
       curve is the only honest way to get that in one surface. */
    const torsoProfile = [
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.26, 0.02),
        new THREE.Vector2(0.36, 0.14),
        new THREE.Vector2(0.46, 0.34),
        new THREE.Vector2(0.5, 0.52),
        new THREE.Vector2(0.47, 0.68),
        new THREE.Vector2(0.36, 0.78),
        new THREE.Vector2(0.22, 0.83),
        new THREE.Vector2(0.001, 0.85)
    ]
    const torso = mesh(new THREE.LatheGeometry(torsoProfile, 28), gloss, 0, 2.06, 0)
    // squashed front-to-back: a round chest reads as a barrel, and
    // the reference is a flattened, panelled slab
    torso.scale.set(1.28, 1, 0.86)
    body.add(torso)

    // chest seam — a thin line down the sternum, one of the few
    // places the eye can catch scale on an all-black shell. Sunk
    // almost flush; proud of the chest it caught the key light along
    // its whole length and became a strip light.
    const seam = mesh(new THREE.BoxGeometry(0.028, 0.44, 0.02), panel, 0, 2.4, 0.39)
    body.add(seam)

    /* ---- collar and neck ---- */
    body.add(mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.1, 18), panel, 0, 2.9, 0))
    body.add(mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.2, 14), chrome, 0, 2.99, 0))

    /* ---- arms ----
       Raised and bent, as in the reference: upper arm down and out
       from the shoulder, elbow low and wide, forearm climbing back
       up so the open hand ends level with the chin.

       Stated as joint positions rather than a stack of Euler
       rotations. The previous version folded the elbow forward on X
       and the hands ended up tucked against the sternum, which is a
       shrug, not a greeting — and no amount of guessing at the angle
       fixed it, because the axis itself was wrong.

       The groups still exist on top of the endpoints, because the
       idle needs something to rotate. */
    const ORIGIN = new THREE.Vector3()

    const arms = [-1, 1].map(s => {
        const shoulder = new THREE.Group()
        shoulder.position.set(s * 0.58, 2.6, 0)

        /* The shoulder pad. Small and flattened against the body —
           at the old radius it stood clear of the torso as a sphere
           on a stick, which from the front read as a pair of ears. */
        const pad = mesh(new THREE.SphereGeometry(0.23, 18, 14), panel, s * 0.03, 0.02, 0)
        pad.scale.set(1.05, 0.86, 1)
        shoulder.add(pad)

        // down and out to the elbow, then up and further out to the
        // wrist — both local to the shoulder / elbow respectively
        const elbowAt = new THREE.Vector3(s * 0.5, -0.62, 0.04)
        const wristAt = new THREE.Vector3(s * 0.28, 0.72, 0.1)

        // Thicker than they look like they need to be. At the radius
        // a human arm would scale to, these read as wire against a
        // torso this broad — the reference's limbs are padded and
        // close to the width of the shoulder pad they hang from.
        shoulder.add(limb(ORIGIN, elbowAt, 0.165, gloss))

        const elbow = new THREE.Group()
        elbow.position.copy(elbowAt)
        elbow.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), chrome, 0, 0, 0))
        elbow.add(limb(ORIGIN, wristAt, 0.145, gloss))
        shoulder.add(elbow)

        const wrist = new THREE.Group()
        wrist.position.copy(wristAt)
        // point the hand along the forearm, so the fingers carry on
        // in the direction the arm was already going
        wrist.quaternion.setFromUnitVectors(UP, wristAt.clone().normalize())
        elbow.add(wrist)

        wrist.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), chrome, 0, 0, 0))

        /* palm, then splayed fingers — the open hand is a big part of
           why the reference reads as a greeting rather than a machine
           at rest, so the fingers are worth the extra meshes */
        const palm = mesh(new THREE.BoxGeometry(0.17, 0.2, 0.075), gloss, 0, 0.13, 0)
        wrist.add(palm)

        for (let f = 0; f < 4; f++) {
            const finger = new THREE.Group()
            finger.position.set(-0.06 + f * 0.04, 0.23, 0)
            finger.rotation.z = (f - 1.5) * 0.16
            const len = f === 0 || f === 3 ? 0.11 : 0.15
            finger.add(mesh(new THREE.CapsuleGeometry(0.019, len, 4, 8), gloss, 0, len * 0.5, 0))
            wrist.add(finger)
        }

        // thumb, out to the side of the palm
        const thumb = new THREE.Group()
        thumb.position.set(s * -0.08, 0.14, 0.02)
        thumb.rotation.z = s * 0.85
        thumb.add(mesh(new THREE.CapsuleGeometry(0.022, 0.1, 4, 8), gloss, 0, 0.06, 0))
        wrist.add(thumb)

        body.add(shoulder)
        return { shoulder, elbow, wrist, side: s }
    })

    /* ---- head: everything below hangs off the neck pivot ---- */
    const neck = new THREE.Group()
    neck.position.set(0, 3.06, 0)
    body.add(neck)

    const head = new THREE.Group()
    neck.add(head)

    /* Skull: a tall ovoid, taller than it is wide and narrower at
       the jaw — the elongated dome is the single most recognisable
       thing about the reference and a sphere loses it immediately. */
    const skull = mesh(new THREE.SphereGeometry(0.3, 22, 18), gloss, 0, 0.24, 0)
    skull.scale.set(1, 1.34, 1.06)
    head.add(skull)

    // jaw, tucked under and back so the profile tapers to a point
    const jaw = mesh(new THREE.SphereGeometry(0.24, 20, 14), gloss, 0, 0.02, -0.02)
    jaw.scale.set(0.92, 0.78, 0.94)
    head.add(jaw)

    /* Visor — a curved band, not a flat plate. A box across the face
       catches the key light as one hard rectangle and kills the
       roundness the skull just bought.

       three.js sweeps phi from -X, so a band centred on the face
       wants phiStart + phiLength/2 === PI/2. That is what the
       numbers below do; rotating the mesh afterwards would swing it
       round to the ear. Theta is parked either side of PI/2 to keep
       it at eye level. */
    const visor = mesh(
        new THREE.SphereGeometry(0.306, 24, 16, Math.PI * 0.26, Math.PI * 0.48, Math.PI * 0.3, Math.PI * 0.34),
        visorMat, 0, 0.24, 0
    )
    visor.scale.set(1, 1.34, 1.06)
    head.add(visor)

    /* Eye plates. Set proud of the visor's outer surface rather than
       the skull's — sunk to the skull they sit *behind* the dark
       band and never show at all. */
    const eyes = [-1, 1].map(s => {
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.08), eyeMat)
        plate.position.set(s * 0.115, 0.28, 0.302)
        // splayed outward a few degrees to sit flush on the curve
        plate.rotation.y = s * -0.24
        head.add(plate)
        return plate
    })

    // side servos, on pivots so they can twitch independently
    const servos = [-1, 1].map(s => {
        const pivot = new THREE.Group()
        pivot.position.set(s * 0.28, 0.26, -0.03)
        const cyl = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 14), chrome, 0, 0, 0)
        cyl.rotation.z = Math.PI / 2
        pivot.add(cyl)
        head.add(pivot)
        return pivot
    })

    /* ---- no ground plane ----
       There was a ShadowMaterial disc here to catch a contact
       shadow. It earned nothing and cost something: in the hero the
       shadow falls on near-black and is invisible, and once the
       robot docks it is standing on the cream page, where the same
       shadow becomes a grey smear across the corner with no floor
       under it to explain itself.

       Shadow mapping stays on, because the robot still shadows
       *itself* — the arms across the chest, the jaw over the collar
       — and that is what the modelling actually needed. */

    /* ============================================================
       Pointer tracking

       Listens on the window, not the canvas: the robot is supposed
       to watch you wherever you are on the page, not only when the
       cursor happens to be over it — and once it has docked into
       the corner the canvas would be a tiny target anyway.
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

    /* the point in world space the robot is trying to look at */
    const target = new THREE.Vector3()
    const local = new THREE.Vector3()
    const headWorld = new THREE.Vector3()

    let headYaw = 0, headPitch = 0
    let bodyYaw = 0
    let blink = 0, nextBlink = 2 + Math.random() * 3

    /* ---- sizing ----
       Only the device pixel ratio can change under us; the CSS size
       is fixed and the stage's own dimensions are scroll-hero's
       business, not ours. Rebuilding the buffer on every stage
       resize is precisely what this design exists to avoid. */
    let lastDpr = renderer.getPixelRatio()

    window.addEventListener('resize', () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        if (dpr === lastDpr) return
        lastDpr = dpr
        renderer.setPixelRatio(dpr)
        renderer.setSize(RENDER_PX, RENDER_PX, false)
    }, { passive: true })

    /* ---- loop ---- */
    let running = true
    let looping = false
    const clock = new THREE.Clock()

    function tick() {
        if (!running) { looping = false; return }
        const dt = Math.min(clock.getDelta(), 0.05)
        const t = clock.elapsedTime

        // Idle sweep when nothing has moved for a while, so the robot
        // still feels alive on touch and on an untouched desktop.
        const idle = !hasPointer || performance.now() - lastMove > 2600
        const ax = idle ? Math.sin(t * 0.42) * 0.55 : aim.x
        const ay = idle ? Math.sin(t * 0.31) * 0.22 + 0.08 : aim.y

        // Turn the pointer into a world point by casting a ray through
        // it from the camera. Projecting through the camera (rather
        // than dropping the cursor onto a fixed plane) is what keeps
        // the aim honest with the camera off to one side.
        //
        // The reach is a fraction of the camera-to-head distance, so
        // the point always lands BETWEEN the viewer and the robot.
        // Pushing it further than the robot puts the aim point behind
        // the machine: the head then swings to its yaw limit and sits
        // there staring off into the middle distance no matter where
        // the cursor is. Deriving it per frame also keeps it correct
        // after a resize.
        neck.getWorldPosition(headWorld)
        const reach = camera.position.distanceTo(headWorld) * 0.62

        target.set(ax, ay, 0.5).unproject(camera)
        target.sub(camera.position).normalize()
        target.multiplyScalar(reach).add(camera.position)

        // Resolve into the neck's parent space, then to yaw/pitch.
        // Doing the trig by hand (rather than lookAt) is what allows
        // the clamping.
        local.copy(target)
        body.worldToLocal(local)
        local.sub(neck.position)

        const flat = Math.hypot(local.x, local.z)
        const wantYaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -YAW_LIMIT, YAW_LIMIT)
        const wantPitch = THREE.MathUtils.clamp(-Math.atan2(local.y, flat), -PITCH_LIMIT, PITCH_LIMIT)

        headYaw += (wantYaw - headYaw) * HEAD_EASE
        headPitch += (wantPitch - headPitch) * HEAD_EASE

        neck.rotation.y = headYaw
        neck.rotation.x = headPitch
        // a little counter-roll — the head tips into the turn
        neck.rotation.z = -headYaw * 0.12

        // chassis follows the head late and only partway, which is
        // what sells it as one machine instead of a head on a stick
        bodyYaw += (headYaw * 0.3 - bodyYaw) * BODY_EASE
        robot.rotation.y = bodyYaw

        /* Breathing, not hovering. This one stands on the floor and
           casts a contact shadow, so lifting it off the ground would
           break both. The chest rises, the whole mass shifts its
           weight, and the shadow stays put. */
        body.position.y = Math.sin(t * 1.1) * 0.012
        body.rotation.z = Math.sin(t * 0.62) * 0.014
        torso.scale.y = 1 + Math.sin(t * 1.1) * 0.012

        /* Arms drift on their own phase and open a little wider as
           the body turns — counterweight, the way hands lead a
           pivot. These are deltas around zero, not absolute angles:
           the rest pose lives in the joint positions now, so adding
           an offset here would swing the whole arm out of it. */
        arms.forEach((arm, i) => {
            const s = arm.side
            arm.shoulder.rotation.z = s * -Math.abs(bodyYaw) * 0.12 + Math.sin(t * 0.85 + i * 2.1) * 0.045
            arm.elbow.rotation.x = Math.sin(t * 0.95 + i * 1.4) * 0.06
            arm.wrist.rotation.z = Math.sin(t * 1.25 + i * 2.6) * 0.11
        })

        // servos twitch, offset from each other so they aren't a pair
        // of wipers, and brace against the head's pitch
        servos.forEach((servo, i) => {
            servo.rotation.x = Math.sin(t * 2.1 + i * 1.9) * 0.1 - Math.abs(headPitch) * 0.2
        })

        // the eye grid breathes slowly, like an idling display
        eyeMat.emissiveIntensity = 2.4 + Math.sin(t * 2.2) * 0.5

        // blink: a fast squash on the eye plates, then back
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

    /* The stage is `position: fixed`, so it is on screen for the whole
       visit — there is no IntersectionObserver gate to run here the
       way a scrolling stage would have. Tab visibility is the only
       thing that should ever stop the loop, and a backgrounded tab
       keeps firing rAF in some browsers, so stop outright rather than
       trusting it. */
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden
        if (running) start()
    })

    start()
}
