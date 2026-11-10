// fx.js — el «juice»: partículas de píxel, ondas, estelas, temblor y parada de golpe.
import { THREE, mat, texFrom, U } from './gfx.js';
import { Tex, T, RGB, rng } from './px.js';

// hoja de partículas: celdas de 8×8
export const P = {
  dust: [0, 1, 2, 3], spark: [4, 5, 6, 7], tear: [8], tearS: [9], flake3: [10], flake2: [11], flake1: [12],
  leaf: [13, 14], gas: [15, 16, 17], slime: [18], drop: [19], note: [20], zz: [21], bang: [22], ask: [23],
  heart: [24], sqW: [25], sqY: [26], ember: [27], glow: [28], stone: [29], clay: [30], bubble: [31],
  star: [32, 33], sqG: [34], sqP: [35], sqB: [36], sweat: [37], ring: [38], dustD: [39, 40, 41], flake: [42], seed: [43],
  cork: [44], moth: [45, 46], sqR: [47],
};
function paintFx() {
  const t = new Tex(128, 128);
  const at = (i, f) => { t.ox = (i % 16) * 8; t.oy = (i >> 4) * 8; f(); t.ox = t.oy = 0; };
  at(0, () => { t.disc(3.5, 3.5, 3, 7); t.px(2, 5, 6); t.px(5, 6, 6); });
  at(1, () => { t.disc(3.5, 3.5, 2.6, 7); t.px(1, 1, 7); t.px(6, 5, 7); });
  at(2, () => { t.disc(3, 3, 1.6, 7); t.px(6, 2, 7); t.px(5, 6, 7); t.px(1, 6, 7); });
  at(3, () => { t.px(2, 2, 7); t.px(5, 3, 7); t.px(3, 5, 7); });
  at(4, () => { t.rect(3, 0, 2, 8, 10); t.rect(0, 3, 8, 2, 10); t.rect(2, 2, 4, 4, 7); });
  at(5, () => { t.rect(3, 1, 2, 6, 10); t.rect(1, 3, 6, 2, 10); t.rect(3, 3, 2, 2, 7); });
  at(6, () => { t.rect(3, 2, 2, 4, 9); t.rect(2, 3, 4, 2, 9); t.px(3, 3, 10); });
  at(7, () => { t.rect(3, 3, 2, 2, 9); });
  at(8, () => { t.spr(['...c....', '...c....', '..ccc...', '.c7ccc..', '.c7cccc.', '.cccccc.', '..cccc..', '........'], 0, 0); });
  at(9, () => { t.spr(['........', '...c....', '..c7c...', '..ccc...', '...c....'], 0, 1); });
  at(10, () => { t.spr(['..99....', '.9999...', '99f994..', '.99944..', '..944...'], 0, 1); });
  at(11, () => { t.spr(['..ee....', '.eeee...', 'eefee2..', '.eee22..', '..e22...'], 0, 1); });
  at(12, () => { t.spr(['..77....', '.7777...', '777776..', '.77766..', '..766...'], 0, 1); });
  at(13, () => { t.spr(['....bb..', '..bbb3..', '.bbb3...', 'bb33....', 'b3......'], 0, 1); });
  at(14, () => { t.spr(['.b......', '.bb.....', '.bb3....', '..b3....', '..33....'], 2, 1); });
  at(15, () => { t.disc(3.5, 3.5, 3.4, 10); t.disc(3, 3, 2, 7); t.px(5, 6, 11); t.px(6, 4, 11); });
  at(16, () => { t.disc(3.5, 3.5, 3, 10); t.disc(2.5, 2.5, 1, 7); t.px(1, 5, 11); t.px(6, 2, 11); t.px(4, 6, 11); });
  at(17, () => { t.px(2, 2, 10); t.px(5, 1, 10); t.px(4, 4, 11); t.px(1, 5, 10); t.px(6, 5, 11); t.px(3, 6, 10); });
  at(18, () => { t.spr(['...b....', '..bbb...', '.babbb..', '.bbbb3..', '..b33...'], 0, 1); });
  at(19, () => { t.spr(['...c....', '..c7c...', '..ccc...'], 0, 2); });
  at(20, () => { t.spr(['...777..', '...7.7..', '...7.7..', '.777.7..', '.7777777', '.77..777'], 0, 1); });
  at(21, () => { t.spr(['.77777..', '....7...', '...7....', '..7.....', '.77777..'], 0, 1); });
  at(22, () => { t.spr(['..0000..', '..0aa0..', '..0aa0..', '..0aa0..', '..0000..', '..0aa0..', '..0000..'], 0, 0); });
  at(23, () => { t.spr(['.00000..', '.0aaa0..', '.000a0..', '..0aa0..', '..0000..', '..0a0...', '..000...'], 0, 0); });
  at(24, () => { t.spr(['.88.88..', '8e88888.', '8888888.', '.88888..', '..888...', '...8....'], 0, 1); });
  at(25, () => { t.rect(2, 2, 4, 4, 7); });
  at(26, () => { t.rect(2, 2, 4, 4, 10); });
  at(27, () => { t.rect(3, 2, 2, 4, 9); t.rect(2, 3, 4, 2, 9); t.px(3, 3, 10); t.px(4, 3, 10); });
  at(28, () => { t.disc(3.5, 3.5, 3.4, 10); t.disc(3.5, 3.5, 2, 7); });
  at(29, () => { t.spr(['..dd....', '.d6dd...', 'dddd5...', '.dd55...'], 1, 2); });
  at(30, () => { t.spr(['..99....', '.9f99...', '99994...', '.9944...'], 1, 2); });
  at(31, () => { t.ring(3.5, 3.5, 3, 12, 1); t.px(2, 2, 7); });
  at(32, () => { t.spr(['...7....', '...7....', '.77a77..', '...7....', '...7....'], 0, 1); });
  at(33, () => { t.spr(['........', '...a....', '..a7a...', '...a....'], 0, 1); });
  at(34, () => { t.rect(2, 2, 4, 4, 11); });
  at(35, () => { t.rect(2, 2, 4, 4, 14); });
  at(36, () => { t.rect(2, 2, 4, 4, 12); });
  at(37, () => { t.spr(['....c...', '...c7...', '...cc...'], 0, 2); });
  at(38, () => { t.ring(3.5, 3.5, 3.4, 7, 1); });
  at(39, () => { t.disc(3.5, 3.5, 3, 13); t.px(2, 2, 6); });
  at(40, () => { t.disc(3.5, 3.5, 2.2, 13); t.px(6, 6, 13); });
  at(41, () => { t.px(2, 2, 13); t.px(5, 3, 13); t.px(3, 5, 13); });
  at(42, () => { t.spr(['.ff.....', 'ffff....', '.ff9....'], 2, 2); });
  at(43, () => { t.spr(['.00.', '0770', '.00.'], 2, 2); });
  at(44, () => { t.spr(['.ff9....', 'ffff9...', 'f9ff4...', '.ff4....'], 1, 2); });
  at(45, () => { t.spr(['7....7..', '77..77..', '.7777...', '..77....'], 1, 2); });
  at(46, () => { t.spr(['........', '.7..7...', '.7777...', '..77....'], 1, 2); });
  at(47, () => { t.rect(2, 2, 4, 4, 8); });
  return t;
}

const N = 512;
const part = Array.from({ length: N }, () => ({ on: false }));
let geo, mesh, posA, uvA, nxt = 0;
const _r = new THREE.Vector3(), _u = new THREE.Vector3();
const rnd = Math.random;

// ondas en el suelo y discos de luz: forma procedural con tramado de pantalla
const RING_FRAG = /* glsl */`
precision highp float;
out vec4 oC;
in vec2 vUv; uniform float uA, uIn; uniform vec3 uC;
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main() {
  float r = length(vUv - 0.5) * 2.0;
  if (r > 1.0 || r < uIn) discard;
  int x = int(mod(gl_FragCoord.x, 4.0)), y = int(mod(gl_FragCoord.y, 4.0));
  float th = (BY[y * 4 + x] + 0.5) / 16.0;
  float e = (r - uIn) / max(0.001, 1.0 - uIn);
  if (uA * (0.35 + 0.65 * e) < th) discard;
  oC = vec4(uC, 1.0);
}`;
const ringGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const rings = [];
const trails = [];

export const fx = {
  scene: null, shakeT: 0, shakeA: 0, shakeD: 0.3, stopT: 0, tex: null, sheet: null, flashT: 0, flashC: 7, flashD: 0.1,
  init() {
    this.sheet = paintFx(); this.tex = texFrom(this.sheet);
    geo = new THREE.BufferGeometry();
    posA = new Float32Array(N * 18); uvA = new Float32Array(N * 12);
    geo.setAttribute('position', new THREE.BufferAttribute(posA, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvA, 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N * 18).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3));
    geo.setAttribute('shade', new THREE.BufferAttribute(new Float32Array(N * 6), 1));
    mesh = new THREE.Mesh(geo, mat(this.tex, { unlit: true, double: true, noFog: true }));
    mesh.frustumCulled = false; mesh.renderOrder = 5;
  },
  attach(scene) { this.scene = scene; scene.add(mesh); for (const r of rings) scene.add(r.m); for (const t of trails) scene.add(t.mesh); },
  clear() { for (const p of part) p.on = false; for (const r of rings) { r.on = false; r.m.visible = false; } },
  // una partícula
  one(seq, x, y, z, o = {}) {
    const p = part[nxt]; nxt = (nxt + 1) % N;
    p.on = true; p.seq = seq; p.x = x; p.y = y; p.z = z;
    p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.g = o.g ?? 0; p.drag = o.drag ?? 0; p.life = p.max = o.life ?? 0.5; p.size = o.size ?? 0.3; p.grow = o.grow ?? 0;
    p.floor = o.floor ?? -1e9; p.bounce = o.bounce ?? 0; p.loop = o.loop || 0; p.delay = o.delay || 0; p.spin = o.spin || 0; p.wob = o.wob || 0; p.t = rnd() * 6;
    return p;
  },
  // estallido radial
  burst(seq, x, y, z, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, s = (o.speed ?? 2) * (0.5 + rnd() * 0.8), up = (o.up ?? 2) * (0.4 + rnd() * 0.9);
      const sp = o.spread ?? 0.1;
      this.one(seq, x + Math.cos(a) * sp, y + rnd() * (o.h ?? 0.2), z + Math.sin(a) * sp, {
        vx: Math.cos(a) * s + (o.vx || 0), vz: Math.sin(a) * s + (o.vz || 0), vy: up, g: o.g ?? 9, drag: o.drag ?? 1.5,
        life: (o.life ?? 0.5) * (0.7 + rnd() * 0.6), size: (o.size ?? 0.3) * (0.8 + rnd() * 0.4), grow: o.grow, floor: o.floor, bounce: o.bounce, loop: o.loop, wob: o.wob,
      });
    }
  },
  dust(x, y, z, n = 3, o = {}) { this.burst(o.dark ? P.dustD : P.dust, x, y + 0.05, z, n, { speed: o.speed ?? 0.9, up: o.up ?? 0.6, g: -0.5, drag: 3, life: o.life ?? 0.45, size: o.size ?? 0.34, spread: o.spread ?? 0.15, h: 0.05 }); },
  sparks(x, y, z, n = 6, o = {}) { this.burst(P.spark, x, y, z, n, { speed: o.speed ?? 3.5, up: 2.5, g: 7, drag: 2, life: 0.35, size: o.size ?? 0.36 }); },
  // onda en el suelo
  ring(x, y, z, o = {}) {
    let r = rings.find(q => !q.on);
    if (!r) {
      if (rings.length > 24) return;
      const m = new THREE.Mesh(ringGeo, new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, fragmentShader: RING_FRAG,
        vertexShader: `out vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        uniforms: { uA: { value: 1 }, uIn: { value: 0.7 }, uC: { value: new THREE.Vector3() } },
        depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      }));
      m.renderOrder = 3; r = { m, on: false }; rings.push(r); if (this.scene) this.scene.add(m);
    }
    r.on = true; r.t = 0; r.dur = o.t ?? 0.5; r.r0 = o.r0 ?? 0.2; r.r1 = o.r1 ?? 3; r.th = o.th ?? 0.3; r.a = o.a ?? 1; r.hold = o.hold || 0;
    const c = RGB[o.c ?? 7]; r.m.material.uniforms.uC.value.set(c[0] / 255, c[1] / 255, c[2] / 255);
    r.m.position.set(x, y + 0.04, z); r.m.visible = true; r.vert = !!o.vert;
    r.m.rotation.set(o.vert ? Math.PI / 2 : 0, 0, 0); r.face = o.face || null;
    return r;
  },
  shake(a = 0.2, d = 0.3) { if (a >= this.shakeA * (this.shakeT / this.shakeD || 0)) { this.shakeA = a; this.shakeT = d; this.shakeD = d; } },
  stop(t = 0.06) { this.stopT = Math.max(this.stopT, t); },
  flash(c = 7, d = 0.12) { this.flashT = d; this.flashD = d; this.flashC = c; },
  update(dt, cam) {
    this.shakeT = Math.max(0, this.shakeT - dt); this.flashT = Math.max(0, this.flashT - dt);
    _r.setFromMatrixColumn(cam.matrixWorld, 0); _u.setFromMatrixColumn(cam.matrixWorld, 1);
    let k = 0;
    for (const p of part) {
      if (!p.on) continue;
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
      p.t += dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vz *= d; p.vy -= p.g * dt; if (p.g <= 0) p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.wob) { p.x += Math.sin(p.t * 5) * p.wob * dt; p.z += Math.cos(p.t * 4.3) * p.wob * dt; }
      if (p.y < p.floor) { p.y = p.floor; if (p.bounce > 0) { p.vy = -p.vy * p.bounce; p.vx *= 0.6; p.vz *= 0.6; if (Math.abs(p.vy) < 0.4) p.vy = 0; } else { p.vy = 0; p.vx = p.vz = 0; } }
      const f = 1 - p.life / p.max, n = p.seq.length;
      const idx = p.seq[p.loop ? Math.floor(p.t * p.loop) % n : Math.min(n - 1, Math.floor(f * n))];
      const s = Math.max(0.02, p.size + p.grow * f) / 2;
      const o = k * 18, rx = _r.x * s, ry = _r.y * s, rz = _r.z * s, ux = _u.x * s, uy = _u.y * s, uz = _u.z * s;
      const A = [p.x - rx + ux, p.y - ry + uy, p.z - rz + uz], B = [p.x - rx - ux, p.y - ry - uy, p.z - rz - uz], C = [p.x + rx - ux, p.y + ry - uy, p.z + rz - uz], D = [p.x + rx + ux, p.y + ry + uy, p.z + rz + uz];
      posA.set(A, o); posA.set(B, o + 3); posA.set(C, o + 6); posA.set(A, o + 9); posA.set(C, o + 12); posA.set(D, o + 15);
      const u0 = ((idx % 16) * 8 + 0.02) / 128, v0 = ((idx >> 4) * 8 + 0.02) / 128, u1 = u0 + 7.96 / 128, v1 = v0 + 7.96 / 128, q = k * 12;
      uvA.set([u0, v0, u0, v1, u1, v1, u0, v0, u1, v1, u1, v0], q);
      k++;
    }
    geo.setDrawRange(0, k * 6); geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
    for (const r of rings) {
      if (!r.on) continue;
      r.t += dt; const f = Math.min(1, r.t / r.dur);
      if (r.t >= r.dur + r.hold) { r.on = false; r.m.visible = false; continue; }
      const e = 1 - (1 - f) * (1 - f), R = r.r0 + (r.r1 - r.r0) * e;
      r.m.scale.set(R * 2, 1, R * 2);
      r.m.material.uniforms.uIn.value = Math.max(0, 1 - r.th / Math.max(0.01, R) - (1 - f) * 0.0);
      r.m.material.uniforms.uA.value = r.a * (1 - f * f);
      if (r.vert && r.face) r.m.lookAt(r.face.x, r.m.position.y, r.face.z), r.m.rotateX(Math.PI / 2);
    }
    for (const t of trails) t.update(dt);
  },
  // desplazamiento de cámara por temblor
  shakeOff(out) {
    if (this.shakeT <= 0) { out.set(0, 0, 0); return out; }
    const a = this.shakeA * (this.shakeT / this.shakeD);
    out.set((rnd() - 0.5) * 2 * a, (rnd() - 0.5) * 2 * a, (rnd() - 0.5) * 2 * a); return out;
  },
};

// estela de la Hoja: abanico entre la base y la punta en los últimos fotogramas
const TR_FRAG = /* glsl */`
precision highp float;
out vec4 oC;
in float vA; uniform vec3 uC1, uC2;
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main() {
  int x = int(mod(gl_FragCoord.x, 4.0)), y = int(mod(gl_FragCoord.y, 4.0));
  float th = (BY[y * 4 + x] + 0.5) / 16.0;
  if (vA > th + 0.05) discard;
  oC = vec4(vA < 0.3 ? uC1 : uC2, 1.0);
}`;
export class Trail {
  constructor(len = 9, c1 = 7, c2 = 11) {
    this.len = len; this.pts = [];
    this.pos = new Float32Array((len - 1) * 18); this.age = new Float32Array((len - 1) * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('a', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    const v = c => new THREE.Vector3(RGB[c][0] / 255, RGB[c][1] / 255, RGB[c][2] / 255);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, fragmentShader: TR_FRAG, side: THREE.DoubleSide, depthWrite: false,
      vertexShader: `in float a; out float vA; void main(){ vA = a; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      uniforms: { uC1: { value: v(c1) }, uC2: { value: v(c2) } },
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 4; this.live = 0.16;
    trails.push(this); if (fx.scene) fx.scene.add(this.mesh);
  }
  push(a, b) { this.pts.unshift({ a: a.clone(), b: b.clone(), t: 0 }); if (this.pts.length > this.len) this.pts.pop(); }
  reset() { this.pts.length = 0; }
  update(dt) {
    for (const p of this.pts) p.t += dt;
    while (this.pts.length && this.pts[this.pts.length - 1].t > this.live) this.pts.pop();
    let k = 0;
    for (let i = 0; i < this.pts.length - 1; i++) {
      const p = this.pts[i], q = this.pts[i + 1], o = k * 18, ap = p.t / this.live, aq = q.t / this.live;
      const V = [p.a, p.b, q.b, p.a, q.b, q.a], A = [ap, ap, aq, ap, aq, aq];
      for (let j = 0; j < 6; j++) { this.pos[o + j * 3] = V[j].x; this.pos[o + j * 3 + 1] = V[j].y; this.pos[o + j * 3 + 2] = V[j].z; this.age[k * 6 + j] = A[j]; }
      k++;
    }
    const g = this.mesh.geometry; g.setDrawRange(0, k * 6); g.attributes.position.needsUpdate = true; g.attributes.a.needsUpdate = true;
  }
}
export { rnd };
