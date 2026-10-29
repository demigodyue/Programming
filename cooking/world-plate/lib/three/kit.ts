/**
 * Shared pieces for the two real-time kitchen scenes (intro pot, closing stove): a transparent renderer with filmic
 * tone mapping and soft shadows, a studio environment for reflections, cast-iron burner grates, ring of gas jets,
 * and a steam system. Everything is procedural (no model or texture files), so the scenes load with the code.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** WebGL with real hardware acceleration: software renderers (no GPU) are too slow, so those keep the drawings. */
export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: true };
    return Boolean(c.getContext("webgl2", opts) || c.getContext("webgl", opts));
  } catch {
    return false;
  }
}

export function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/** Soft studio reflections (a lit room, prefiltered), a warm key light that casts shadows and a cool fill. */
export function lightScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene, shadowSize = 6) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff1dc, 3.1);
  key.position.set(-3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -shadowSize / 2;
  key.shadow.camera.right = shadowSize / 2;
  key.shadow.camera.top = shadowSize / 2;
  key.shadow.camera.bottom = -shadowSize / 2;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0006;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(4, 2, -3);
  scene.add(fill);
  return { env, key };
}

/** A transparent floor that only shows shadows, so objects sit on the page colour. */
export function shadowFloor(y: number, size = 8, opacity = 0.28) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

export const castIron = () =>
  new THREE.MeshPhysicalMaterial({ color: 0x1a1b1c, roughness: 0.62, metalness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 });
export const steel = (color = 0xdadcdc, roughness = 0.2) => new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 1 });

/** A cast-iron burner grate: an outer ring and four arms, with a brass-ringed burner cap under it. */
export function makeGrate(radius = 1, y = 0) {
  const g = new THREE.Group();
  const iron = castIron();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.045, 12, 64), iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y - 0.05;
  g.add(ring);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.62, 0.07, 0.07), iron);
    arm.position.set(Math.cos(a) * radius * 0.7, y - 0.03, Math.sin(a) * radius * 0.7);
    arm.rotation.y = -a;
    g.add(arm);
    // The little raised fingers the pan rests on.
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.07), iron);
    tip.position.set(Math.cos(a) * radius * 0.48, y - 0.02, Math.sin(a) * radius * 0.48);
    tip.rotation.y = -a;
    g.add(tip);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), iron);
    leg.position.set(Math.cos(a) * radius, y - 0.16, Math.sin(a) * radius);
    g.add(leg);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.33, radius * 0.36, 0.08, 40), castIron());
  cap.position.y = y - 0.17;
  g.add(cap);
  const brass = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.4, radius * 0.42, 0.05, 40),
    new THREE.MeshPhysicalMaterial({ color: 0xb8893e, roughness: 0.35, metalness: 1 }),
  );
  brass.position.y = y - 0.22;
  g.add(brass);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/**
 * A ring of blue gas jets: small cones, white-blue at the root fading to transparent violet at the tip (vertex
 * colours with alpha, additive). `set(lit, t)` grows and flickers them; a blue point light glows under the pan.
 */
export function makeFlames(radius: number, y: number, count = 28, length = 0.2) {
  const group = new THREE.Group();
  const geo = new THREE.ConeGeometry(0.035, 1, 10, 6, true);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i); // 0 root → 1 tip
    const c = new THREE.Color().lerpColors(new THREE.Color(0xbfe4ff), new THREE.Color(0x3a4dff), Math.min(1, h * 1.6));
    colors.set([c.r, c.g, c.b, (1 - h) ** 1.4 * 0.95], i * 4);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const jets: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    pivot.rotation.y = -a;
    const jet = new THREE.Mesh(geo, mat);
    jet.rotation.z = -0.95; // lean outward
    jet.renderOrder = 5;
    pivot.add(jet);
    group.add(pivot);
    jets.push(jet);
  }
  const glow = new THREE.PointLight(0x5a7dff, 0, 2.2, 1.6);
  glow.position.set(0, y + 0.1, 0);
  group.add(glow);
  return {
    group,
    set(lit: number, t: number) {
      jets.forEach((j, i) => {
        const f = 0.82 + 0.18 * Math.sin(t * 31 + i * 2.3) * Math.sin(t * 17 + i);
        const s = Math.max(0.0001, lit * f);
        j.scale.set(Math.max(0.2, lit), s * length, Math.max(0.2, lit));
        j.visible = lit > 0.01;
      });
      glow.intensity = lit * (2.2 + Math.sin(t * 23) * 0.3);
    },
  };
}

/** A soft round puff, drawn once to a canvas. */
function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Steam: camera-facing puffs that rise, drift, swell and fade. `emit` is called per puff to choose where it starts
 * (and how fast it rises); `update(dt, rate, strength)` spawns `rate` puffs a second at `strength` opacity.
 */
export function makeSteam(
  max: number,
  emit: (p: THREE.Vector3) => number,
  opts: { size?: number; grow?: number; life?: number; color?: number } = {},
) {
  const { size = 0.35, grow = 2.2, life = 2.6, color = 0xffffff } = opts;
  const tex = puffTexture();
  const group = new THREE.Group();
  type Puff = { s: THREE.Sprite; age: number; life: number; v: THREE.Vector3; spin: number; base: number };
  const puffs: Puff[] = [];
  for (let i = 0; i < max; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false;
    s.renderOrder = 10;
    group.add(s);
    puffs.push({ s, age: 0, life: 0, v: new THREE.Vector3(), spin: 0, base: 0 });
  }
  let carry = 0;
  return {
    group,
    update(dt: number, rate: number, strength: number) {
      carry += rate * dt;
      for (const p of puffs) {
        if (carry < 1) break;
        if (p.s.visible) continue;
        carry -= 1;
        const rise = emit(p.s.position);
        p.age = 0;
        p.life = life * (0.75 + Math.random() * 0.5);
        p.v.set((Math.random() - 0.5) * 0.12, rise, (Math.random() - 0.5) * 0.12);
        p.spin = (Math.random() - 0.5) * 0.6;
        p.base = strength * (0.6 + Math.random() * 0.4);
        p.s.visible = true;
      }
      if (carry > 1) carry = 1;
      for (const p of puffs) {
        if (!p.s.visible) continue;
        p.age += dt;
        const k = p.age / p.life;
        if (k >= 1) {
          p.s.visible = false;
          continue;
        }
        p.s.position.addScaledVector(p.v, dt);
        p.v.x += Math.sin(p.age * 2 + p.spin * 10) * 0.02 * dt;
        p.v.y *= 1 - 0.25 * dt;
        const sc = size * (1 + grow * k);
        p.s.scale.set(sc, sc, 1);
        p.s.material.rotation += p.spin * dt;
        p.s.material.opacity = p.base * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k * 0.4);
      }
    },
  };
}

export const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Runs `frame(dt, t)` on animation frames while the canvas is on screen and the tab is visible. */
export function loop(canvas: HTMLCanvasElement, frame: (dt: number, t: number) => void) {
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let onScreen = true;
  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    frame(dt, t);
    schedule();
  };
  const schedule = () => {
    if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    last = performance.now();
    schedule();
  });
  io.observe(canvas);
  const onVis = () => {
    last = performance.now();
    schedule();
  };
  document.addEventListener("visibilitychange", onVis);
  schedule();
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
      o.geometry?.dispose();
      const m = o.material as THREE.Material | THREE.Material[];
      (Array.isArray(m) ? m : [m]).forEach((x) => {
        (x as THREE.MeshBasicMaterial).map?.dispose();
        x.dispose();
      });
    }
  });
  scene.environment?.dispose();
  renderer.dispose();
}
