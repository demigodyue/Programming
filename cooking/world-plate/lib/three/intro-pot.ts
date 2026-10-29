/**
 * The home page intro in real time 3D: an enamelled cast-iron pot (forest-green enamel darkening toward the base,
 * a black iron rim, cream interior, steel knob) of golden broth simmering on a gas burner, steam escaping round the
 * rattling lid. The intro's scroll value q (0 → 1, --q on .wp-intro) drives it:
 *   0    – 0.3   the lid lifts, tips and flies off up and to the right; the steam bursts out;
 *   0.12 – 0.86  the camera rises over the pot and looks straight down into the broth, coming in close;
 *   0.72 – 1     (CSS) the page opens out of the middle of the broth (a growing circular mask).
 * The pot starts below the wordmark (a view offset), and is centred by the time the camera is over it.
 */
import * as THREE from "three";
import { disposeScene, lerp, lightScene, loop, makeFlames, makeGrate, makeRenderer, makeSteam, shadowFloor, smooth, steel } from "./kit";

const RIM = 0.95; // top of the pot wall
const BROTH = 0.78; // broth surface height
const R_IN = 0.93; // inside radius at the broth line

function lathe(points: [number, number][], segments = 96) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

/** Enamel that shades from deep forest at the base to a brighter green higher up (vertex colours), with a clear glaze. */
function enamelBody() {
  const outer: [number, number][] = [
    [0, 0.0],
    [0.8, 0.0],
    [0.94, 0.02],
    [0.995, 0.09],
    [1.0, 0.2],
    [1.0, 0.86],
    [1.005, 0.92],
    [0.995, RIM],
  ];
  const geo = lathe(outer);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const low = new THREE.Color(0x011f10);
  const high = new THREE.Color(0x0a6238);
  for (let i = 0; i < pos.count; i++) {
    const c = new THREE.Color().lerpColors(low, high, smooth(0.02, 0.9, pos.getY(i)));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.07, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function buildPot() {
  const pot = new THREE.Group();
  pot.add(enamelBody());

  // Cream enamel inside.
  const inside = new THREE.Mesh(
    lathe([
      [0.955, RIM],
      [0.945, 0.9],
      [0.94, 0.16],
      [0.88, 0.08],
      [0, 0.07],
    ]),
    new THREE.MeshPhysicalMaterial({ color: 0xd9c8a6, roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide }),
  );
  pot.add(inside);

  // The exposed black iron rim.
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.975, 0.024, 12, 96),
    new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.55, metalness: 0.4 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = RIM;
  pot.add(rim);

  // Loop handles cast into the sides.
  const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x0a5f37, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 16, 32, Math.PI), handleMat);
    h.position.set(side * 1.0, 0.78, 0);
    h.rotation.set(Math.PI / 2, 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    pot.add(h);
  }

  // The broth: a surface that rolls gently, with bubbles and a few herbs, carrot coins and spring onion rings.
  const brothGeo = new THREE.RingGeometry(0.0001, R_IN, 72, 18);
  brothGeo.rotateX(-Math.PI / 2);
  const broth = new THREE.Mesh(
    brothGeo,
    new THREE.MeshPhysicalMaterial({ color: 0xa8600f, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 }),
  );
  broth.position.y = BROTH;
  broth.receiveShadow = true;
  pot.add(broth);
  const base = Float32Array.from(brothGeo.attributes.position.array as Float32Array);

  const bits = new THREE.Group();
  bits.position.y = BROTH;
  const herb = new THREE.MeshStandardMaterial({ color: 0x2f6b1e, roughness: 0.5 });
  const carrot = new THREE.MeshPhysicalMaterial({ color: 0xe0661c, roughness: 0.3, clearcoat: 0.5 });
  const onion = new THREE.MeshStandardMaterial({ color: 0x8fbf4a, roughness: 0.4 });
  const floaters: { m: THREE.Mesh; r: number; a: number; w: number }[] = [];
  const add = (m: THREE.Mesh, r: number) => {
    const a = Math.random() * Math.PI * 2;
    floaters.push({ m, r, a, w: (Math.random() - 0.5) * 0.25 });
    bits.add(m);
  };
  for (let i = 0; i < 26; i++) {
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.035 + Math.random() * 0.03, 10), herb);
    leaf.rotation.x = -Math.PI / 2;
    leaf.scale.set(1, 0.55, 1);
    add(leaf, 0.12 + Math.random() * 0.72);
  }
  for (let i = 0; i < 7; i++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.022, 24), carrot);
    add(coin, 0.15 + Math.random() * 0.62);
  }
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 8, 18), onion);
    ring.rotation.x = Math.PI / 2;
    add(ring, 0.1 + Math.random() * 0.7);
  }
  pot.add(bits);

  const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xfff1d2, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.7 });
  const bubbles = Array.from({ length: 22 }, () => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), bubbleMat);
    b.userData = { age: Math.random() * 1.2, life: 0.6 + Math.random() * 0.8, r: 0, a: 0, size: 0 };
    b.position.y = BROTH;
    pot.add(b);
    return b;
  });

  // The lid: a glazed dome with a flange, black iron edge and a steel knob on a collar. Pivots at the rim.
  const lid = new THREE.Group();
  lid.position.y = RIM;
  const dome = new THREE.Mesh(
    lathe([
      [0, 0.25],
      [0.32, 0.235],
      [0.62, 0.18],
      [0.88, 0.085],
      [1.02, 0.025],
      [1.035, 0.0],
      [0.97, -0.005],
    ]),
    new THREE.MeshPhysicalMaterial({ color: 0x0a6238, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.07, side: THREE.DoubleSide }),
  );
  lid.add(dome);
  const lidEdge = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.018, 10, 96), new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.4 }));
  lidEdge.rotation.x = Math.PI / 2;
  lid.add(lidEdge);
  const knobMat = steel(0xe4e5e3, 0.16);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 40), knobMat);
  collar.position.y = 0.265;
  lid.add(collar);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.07, 32), knobMat);
  stem.position.y = 0.315;
  lid.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 40, 20), knobMat);
  knob.scale.set(1, 0.42, 1);
  knob.position.y = 0.37;
  lid.add(knob);
  pot.add(lid);

  pot.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material !== bubbleMat) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    pot,
    lid,
    update(t: number, dt: number, boil: number) {
      // Rolling surface: a few travelling ripples, stronger when the lid is off.
      const p = brothGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        const z = base[i * 3 + 2];
        const r = Math.hypot(x, z);
        const edge = 1 - smooth(0.8, R_IN, r);
        const y =
          (Math.sin(r * 14 - t * 3.2) * 0.006 + Math.sin(x * 9 + t * 2.1) * Math.cos(z * 8 - t * 1.7) * 0.008) * (0.6 + boil) * edge;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      brothGeo.computeVertexNormals();
      for (const f of floaters) {
        f.a += f.w * dt * (0.4 + boil);
        f.m.position.set(Math.cos(f.a) * f.r, 0.008 + Math.sin(t * 2 + f.r * 9) * 0.006, Math.sin(f.a) * f.r);
        f.m.rotation.z += f.w * dt;
      }
      for (const b of bubbles) {
        const u = b.userData;
        u.age += dt * (0.6 + boil);
        if (u.age > u.life) {
          u.age = 0;
          u.life = 0.5 + Math.random() * 0.9;
          u.r = Math.sqrt(Math.random()) * (R_IN - 0.08);
          u.a = Math.random() * Math.PI * 2;
          u.size = 0.018 + Math.random() * 0.035;
        }
        const k = u.age / u.life;
        const s = u.size * Math.sin(Math.PI * Math.min(1, k * 1.1)) + 0.0001;
        b.scale.set(s, s * 0.8, s);
        b.position.set(Math.cos(u.a) * u.r, BROTH, Math.sin(u.a) * u.r);
      }
    },
  };
}

export function startIntroPot(canvas: HTMLCanvasElement, getQ: () => number) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const { key } = lightScene(renderer, scene, 5);
  key.position.set(-3, 7, 4.5);

  const { pot, lid, update } = buildPot();
  scene.add(pot);
  const grate = makeGrate(0.78, -0.02);
  scene.add(grate);
  const flames = makeFlames(0.28, -0.16, 30, 0.16);
  scene.add(flames.group);
  // A black glass hob under the burner, with a brushed-steel trim, so the pot reads as standing on a stove.
  const hob = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.07, 2.6),
    new THREE.MeshPhysicalMaterial({ color: 0x070808, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.45 }),
  );
  hob.position.y = -0.305;
  hob.receiveShadow = true;
  scene.add(hob);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.05, 2.64), steel(0xb9bcbb, 0.35));
  trim.position.y = -0.355;
  scene.add(trim);
  scene.add(shadowFloor(-0.38, 12, 0.18));

  // Steam: wisps round the lid edge and vent while it's on; a thick column off the broth once it's off.
  let lidOff = 0;
  const steam = makeSteam(70, (p) => {
    if (lidOff < 0.3) {
      const a = Math.random() * Math.PI * 2;
      p.set(Math.cos(a) * 1.0, RIM + 0.05, Math.sin(a) * 1.0);
      return 0.35 + Math.random() * 0.2;
    }
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.75;
    p.set(Math.cos(a) * r, BROTH + 0.05, Math.sin(a) * r);
    return 0.5 + Math.random() * 0.35;
  }, { size: 0.42, grow: 2.6, life: 2.4 });
  scene.add(steam.group);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  const target = new THREE.Vector3();
  let W = 1;
  let H = 1;
  const resize = () => {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
  };
  resize();
  window.addEventListener("resize", resize);

  let born = 0;
  let qSmooth = 0;
  const stop = loop(canvas, (dt, t) => {
    born += dt;
    const q = getQ();
    qSmooth += (q - qSmooth) * Math.min(1, dt * 14);
    const Q = qSmooth;

    // Lid: rattles while it simmers, then blows off.
    lidOff = smooth(0, 0.3, Q);
    const rattle = (1 - lidOff) * (Math.sin(t * 19) > 0.55 ? 1 : 0);
    lid.position.set(lidOff * 2.2, RIM + rattle * 0.018 + lidOff * 3.2 + lidOff * lidOff * 2, lidOff * 0.6);
    lid.rotation.set(rattle * 0.02 * Math.sin(t * 40) + lidOff * -0.5, lidOff * 1.4, rattle * 0.015 + lidOff * -1.1);

    update(t, dt, lidOff);
    flames.set(1, t);
    steam.update(dt, lidOff < 0.3 ? 9 : 22 + lidOff * 10, (lidOff < 0.3 ? 0.24 : 0.34) * (1 - 0.65 * smooth(0.2, 0.7, Q)));

    // Entrance: the pot settles in once the scene is ready.
    const enter = smooth(0, 0.9, born);
    pot.position.y = (1 - enter) * -0.35;

    // Camera: front three-quarter, low → straight down over the broth, close in. Sized so the pot is about as wide
    // as the old drawing at first (min of 28vw / 36vh, at least 170px).
    const k = smooth(0.12, 0.86, Q);
    const k2 = smooth(0.6, 1, Q);
    const potPx = Math.max(170, Math.min(W * 0.3, H * 0.38, 360));
    const fov = (camera.fov * Math.PI) / 180;
    const start = ((2.7 * H) / potPx) / (2 * Math.tan(fov / 2)); // ~2.7 units (pot + handles + steam) fill potPx
    // Close: the broth disc (radius R_IN) a bit wider than the screen's diagonal.
    const diag = Math.hypot(W, H);
    const close = ((2 * R_IN * H) / (diag * 1.15)) / (2 * Math.tan(fov / 2));
    const dist = lerp(start, close, k * 0.85 + k2 * 0.15);
    const elev = lerp(0.3, Math.PI / 2 - 0.001, k);
    const azim = lerp(0.18, 0, k);
    target.set(0, lerp(0.5, BROTH, k) + pot.position.y, 0);
    camera.position.set(
      target.x + Math.cos(elev) * Math.sin(azim) * dist,
      target.y + Math.sin(elev) * dist,
      target.z + Math.cos(elev) * Math.cos(azim) * dist,
    );
    camera.lookAt(target);
    // At rest the pot sits low (below the wordmark): shift the picture down by 21% of the screen, easing to centre.
    const shift = (1 - smooth(0.05, 0.55, Q)) * 0.21 * H;
    camera.setViewOffset(W, H, 0, -shift, W, H);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  });

  return () => {
    stop();
    window.removeEventListener("resize", resize);
    disposeScene(scene, renderer);
  };
}
