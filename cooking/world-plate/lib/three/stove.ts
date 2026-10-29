/**
 * The closing panel's stove in real time 3D: a black glass hob with a brushed-steel front and chrome knobs, a gas
 * burner under a seasoned cast-iron skillet (long handle with a hanging hole, helper handle, a film of oil), full of
 * cherry tomatoes, pepper strips, red onion, corn and basil. `getLit()` (0 → 1, from the panel's scroll) turns the
 * front knob and grows the flame; once it's lit the skillet tosses its food in a loop, steam rises and oil spits.
 */
import * as THREE from "three";
import { castIron, disposeScene, lerp, lightScene, loop, makeFlames, makeGrate, makeRenderer, makeSteam, shadowFloor, smooth, steel } from "./kit";

const PAN_Y = 0.02; // skillet base, on the grate
const FLOOR = 0.055; // cooking surface inside the pan

function skillet() {
  const g = new THREE.Group();
  const iron = castIron();
  iron.roughness = 0.48;
  iron.clearcoat = 0.45;
  iron.clearcoatRoughness = 0.35;
  const profile = [
    [0, 0],
    [0.86, 0],
    [0.98, 0.035],
    [1.05, 0.15],
    [1.09, 0.26],
    [1.075, 0.29],
    [1.035, 0.275],
    [0.99, 0.15],
    [0.93, 0.07],
    [0.84, FLOOR],
    [0, FLOOR],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), iron);
  body.material.side = THREE.DoubleSide;
  g.add(body);

  // A thin film of oil on the cooking surface.
  const oil = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x4a2f0c, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.45 }),
  );
  oil.rotation.x = -Math.PI / 2;
  oil.position.y = FLOOR + 0.003;
  g.add(oil);

  // The long handle: a tapered bar with a rounded end and a hanging hole, rising slightly.
  const s = new THREE.Shape();
  s.moveTo(0, -0.13);
  s.lineTo(1.15, -0.085);
  s.absarc(1.15, 0, 0.085, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(0, 0.13);
  s.lineTo(0, -0.13);
  const hole = new THREE.Path();
  hole.absarc(1.13, 0, 0.04, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const hg = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 3, curveSegments: 24 });
  hg.rotateX(-Math.PI / 2);
  const handle = new THREE.Mesh(hg, iron);
  handle.position.set(1.0, 0.2, 0);
  handle.rotation.z = 0.12;
  g.add(handle);
  // Helper handle opposite.
  const helper = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 12, 24, Math.PI), iron);
  helper.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  helper.position.set(-1.08, 0.25, 0);
  g.add(helper);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== oil) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

type Bit = { m: THREE.Object3D; base: THREE.Vector3; rot: THREE.Euler; h: number; d: number; spin: THREE.Vector3 };

function food() {
  const group = new THREE.Group();
  const glossy = (color: number, roughness = 0.25) => new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const tomato = glossy(0xc4210f, 0.2);
  const calyx = new THREE.MeshStandardMaterial({ color: 0x3e6b1c, roughness: 0.6 });
  const peppers = [glossy(0xd0200f), glossy(0xf0b40e), glossy(0x3d8a1f)];
  const onion = glossy(0xa04a8a, 0.35);
  const corn = glossy(0xf5c33b, 0.35);
  const basil = new THREE.MeshPhysicalMaterial({ color: 0x2f7a22, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide });
  const bits: Bit[] = [];
  const place = (m: THREE.Object3D, r: number, a: number, lift: number) => {
    m.position.set(Math.cos(a) * r, FLOOR + lift, Math.sin(a) * r);
    m.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
    m.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    group.add(m);
    bits.push({
      m,
      base: m.position.clone(),
      rot: m.rotation.clone(),
      h: 0.35 + Math.random() * 0.5,
      d: Math.random() * 0.12,
      spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 9),
    });
  };
  for (let i = 0; i < 7; i++) {
    const t = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 28, 18), tomato);
    ball.scale.y = 0.9;
    t.add(ball);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.03, 5), calyx);
    c.position.y = 0.1;
    t.add(c);
    place(t, 0.25 + Math.random() * 0.55, Math.random() * Math.PI * 2, 0.1);
  }
  for (let i = 0; i < 12; i++) {
    const strip = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.26, 4, 10), peppers[i % 3]);
    strip.rotation.z = Math.PI / 2;
    const w = new THREE.Group();
    w.add(strip);
    w.scale.set(1, 0.7, 1.5);
    place(w, Math.random() * 0.8, Math.random() * Math.PI * 2, 0.03);
  }
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08 + Math.random() * 0.03, 0.016, 8, 24), onion);
    ring.rotation.x = Math.PI / 2;
    const w = new THREE.Group();
    w.add(ring);
    place(w, Math.random() * 0.8, Math.random() * Math.PI * 2, 0.02);
  }
  for (let i = 0; i < 16; i++) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), corn);
    k.scale.set(1, 0.75, 0.85);
    place(k, Math.random() * 0.82, Math.random() * Math.PI * 2, 0.025);
  }
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), basil);
    leaf.scale.set(1, 0.12, 0.55);
    place(leaf, 0.2 + Math.random() * 0.6, Math.random() * Math.PI * 2, 0.04);
  }
  return { group, bits };
}

export function startStove(canvas: HTMLCanvasElement, getLit: () => number, still: boolean) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  lightScene(renderer, scene, 6);

  // Hob: black glass with a brushed-steel front strip and two chrome knobs (the left one is the live burner).
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x070808, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.45 });
  const hob = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.09, 2.6), glass);
  hob.position.set(0.35, -0.3, 0);
  hob.receiveShadow = true;
  scene.add(hob);
  const front = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.34, 0.06), steel(0xc4c7c6, 0.32));
  front.position.set(0.35, -0.47, 1.32);
  front.receiveShadow = true;
  scene.add(front);
  const knobs: THREE.Group[] = [];
  for (const x of [-0.95, -0.4, 1.1, 1.65]) {
    const k = new THREE.Group();
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.05, 40), steel(0xd8dbda, 0.18));
    skirt.rotation.x = Math.PI / 2;
    k.add(skirt);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.13, 40), steel(0xe9ebea, 0.14));
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.08;
    k.add(cap);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.06), steel(0xf2f3f2, 0.12));
    grip.position.z = 0.16;
    k.add(grip);
    k.position.set(x, -0.47, 1.36);
    k.traverse((o) => o instanceof THREE.Mesh && (o.castShadow = true));
    scene.add(k);
    knobs.push(k);
  }
  scene.add(shadowFloor(-0.66, 14, 0.14));

  const grate = makeGrate(0.85, -0.02);
  scene.add(grate);
  const flames = makeFlames(0.31, -0.18, 30, 0.2);
  scene.add(flames.group);

  const pan = new THREE.Group();
  pan.position.y = PAN_Y;
  pan.add(skillet());
  const { group: foodGroup, bits } = food();
  pan.add(foodGroup);
  scene.add(pan);

  const steam = makeSteam(36, (p) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.7;
    p.set(Math.cos(a) * r, PAN_Y + 0.25, Math.sin(a) * r);
    return 0.45 + Math.random() * 0.3;
  }, { size: 0.45, grow: 2.4, life: 2.6 });
  scene.add(steam.group);

  // Oil spits: tiny hot sparks that jump out of the pan.
  const sparkMat = new THREE.SpriteMaterial({ color: 0xffb547, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sparks = Array.from({ length: 14 }, () => {
    const s = new THREE.Sprite(sparkMat.clone());
    s.scale.setScalar(0.035);
    s.userData = { t: Math.random(), v: new THREE.Vector3(), o: new THREE.Vector3() };
    scene.add(s);
    return s;
  });

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  const resize = () => {
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the hob's width (with a margin) whatever the aspect.
    const fov = (camera.fov * Math.PI) / 180;
    const fitW = 4.7 / (2 * Math.tan(fov / 2) * camera.aspect);
    const fitH = 3.0 / (2 * Math.tan(fov / 2));
    const d = Math.max(fitW, fitH);
    camera.position.set(0.75, d * 0.6, d * 0.8);
    camera.lookAt(0.35, -0.22, 0.12);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const frame = (dt: number, t: number) => {
    const lit = still ? 1 : getLit();
    knobs[0].rotation.z = lerp(0, -Math.PI * 0.75, lit);
    flames.set(lit, t);
    const cook = still ? 0 : smooth(0.7, 1, lit);

    // The toss, every 1.8s: the pan slides back, jerks forward and up, the food flies and lands.
    const u = (t % 1.8) / 1.8;
    const jerk = smooth(0.3, 0.42, u) - smooth(0.42, 0.7, u);
    pan.rotation.z = -jerk * 0.16 * cook;
    pan.position.x = (-0.1 * smooth(0.05, 0.3, u) * (1 - smooth(0.3, 0.42, u)) + jerk * 0.18) * cook;
    for (const b of bits) {
      const s = (u - 0.38 - b.d) / 0.42;
      const k = s > 0 && s < 1 ? Math.sin(Math.PI * s) : 0;
      b.m.position.set(b.base.x - k * 0.25 * cook, b.base.y + k * b.h * cook, b.base.z);
      if (k > 0 && cook > 0) {
        b.m.rotation.x = b.rot.x + b.spin.x * s * cook;
        b.m.rotation.z = b.rot.z + b.spin.z * s * cook;
      } else {
        b.m.rotation.copy(b.rot);
      }
    }
    steam.update(dt, 7 * cook + 1.5 * lit, 0.32 * Math.max(cook, lit * 0.4));
    for (const s of sparks) {
      const d = s.userData;
      d.t += dt * 1.4;
      if (d.t > 1) {
        d.t = 0;
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.8;
        d.o.set(Math.cos(a) * r, PAN_Y + 0.1, Math.sin(a) * r);
        d.v.set((Math.random() - 0.5) * 1.2, 1.2 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2);
      }
      s.position.set(d.o.x + d.v.x * d.t * 0.4, d.o.y + (d.v.y * d.t - 2.2 * d.t * d.t) * 0.4, d.o.z + d.v.z * d.t * 0.4);
      s.material.opacity = cook * (1 - d.t) * 0.9;
    }
    renderer.render(scene, camera);
  };

  const stop = still ? (frame(0.016, 1), () => {}) : loop(canvas, frame);
  return () => {
    stop();
    ro.disconnect();
    disposeScene(scene, renderer);
  };
}
