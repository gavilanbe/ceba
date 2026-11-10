// gfx.js — render al estilo picoCAD: malla low poly, textura de índices de 128×128,
// luz plana por cara y sombra por tramado hacia el tono oscuro de la paleta PICO-8.
import * as THREE from '../vendor/three.module.js';
import { RGB, DARK, T, Tex } from './px.js';

export { THREE };
export const W = 320, H = 180;

// uniformes compartidos por todos los materiales (misma referencia)
export const U = {
  pal: { value: RGB.map(c => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255)) },
  uL: { value: new THREE.Vector3(0.35, 0.8, 0.5).normalize() },
  uAmb: { value: 0.5 },
  uK: { value: 1.3 },          // cuántos escalones de sombra entre luz y contraluz
  uFog: { value: 1 },
  uFogR: { value: new THREE.Vector2(30, 60) },
  uPL: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, -999, 0, 0)) },
  uTime: { value: 0 },
  uDark: { value: 0 },          // oscuridad global añadida (mazmorra)
};

const VERT = /* glsl */`
#ifdef TILED
in vec4 uvr;
flat out vec4 vR;
#endif
in float shade;
flat out vec3 vN;
flat out float vSh;
out vec3 vW;
out vec2 vUv;
out float vZ;
uniform vec2 uScroll;
uniform float uWave;
uniform float uTime;
void main() {
  vec3 p = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  if (uWave > 0.0) w.y += sin(w.x * 1.7 + uTime * 2.0) * cos(w.z * 1.3 + uTime * 1.4) * uWave;
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv + uScroll;
  vSh = shade;
#ifdef TILED
  vR = uvr;
#endif
  vec4 v = viewMatrix * w;
  vZ = -v.z;
  gl_Position = projectionMatrix * v;
}`;

const FRAG = /* glsl */`
precision highp float;
out vec4 oC;
uniform sampler2D map;
uniform vec3 pal[16];
uniform vec3 uL;
uniform float uAmb, uK, uDark;
uniform int uFog;
uniform vec2 uFogR;
uniform vec4 uPL[6];
uniform float uFlash; uniform int uFlashC;
uniform float uBias, uUnlit, uHide, uNoFog;
uniform int uSwapA, uSwapB;
#ifdef TILED
flat in vec4 vR;
#endif
flat in vec3 vN;
flat in float vSh;
in vec3 vW;
in vec2 vUv;
in float vZ;
const int DK[16] = int[16](${DARK.join(',')});
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float bayer(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); return (BY[y * 4 + x] + 0.5) / 16.0; }
void main() {
  vec2 uv = vUv;
#ifdef TILED
  uv = vR.xy + fract(vUv) * vR.zw;
#endif
  int c = int(texture(map, uv).r * 255.0 + 0.5);
  if (c > 15) discard;
  float th = bayer(gl_FragCoord.xy);
  if (uHide > th) discard;
  if (c == uSwapA) c = uSwapB;
  if (uUnlit < 0.5) {
    vec3 n = gl_FrontFacing ? vN : -vN;
    float s = max(0.0, (uAmb - dot(n, uL)) * uK) + vSh + uBias + uDark;
    for (int i = 0; i < 6; i++) {
      if (uPL[i].w <= 0.0) continue;
      float d = distance(vW, uPL[i].xyz) / uPL[i].w;
      float f = max(0.0, 1.0 - d);
      s -= f * f * 3.4;
    }
    s = clamp(s, 0.0, 3.0);
    s = floor(s * 4.0 + 0.5) / 4.0;
    int lv = int(floor(s));
    if (s - float(lv) > th) lv++;
    for (int i = 0; i < 3; i++) { if (i < lv) c = DK[c]; }
  }
  if (uNoFog < 0.5) {
    float f = clamp((vZ - uFogR.x) / (uFogR.y - uFogR.x), 0.0, 1.0);
    f = floor(f * 8.0 + 0.5) / 8.0;
    if (f > th) c = uFog;
  }
  if (uFlash > th) c = uFlashC;
  oC = vec4(pal[c], 1.0);
}`;

// textura de índices a partir de un Tex
export function texFrom(t) {
  const d = new Uint8Array(t.w * t.h * 4);
  for (let i = 0; i < t.w * t.h; i++) { d[i * 4] = t.d[i]; d[i * 4 + 3] = 255; }
  const tx = new THREE.DataTexture(d, t.w, t.h, THREE.RGBAFormat);
  tx.magFilter = tx.minFilter = THREE.NearestFilter;
  tx.generateMipmaps = false; tx.flipY = false; tx.needsUpdate = true;
  tx.userData.src = t;
  return tx;
}
export function texUpdate(tx) {
  const t = tx.userData.src, d = tx.image.data;
  for (let i = 0; i < t.w * t.h; i++) d[i * 4] = t.d[i];
  tx.needsUpdate = true;
}

export function mat(tex, o = {}) {
  const m = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT, fragmentShader: FRAG,
    defines: o.tiled ? { TILED: 1 } : {},
    uniforms: {
      pal: U.pal, uL: U.uL, uAmb: U.uAmb, uK: U.uK, uFog: U.uFog, uFogR: U.uFogR, uPL: U.uPL, uTime: U.uTime,
      uDark: o.noDark ? { value: 0 } : U.uDark,
      map: { value: tex },
      uFlash: { value: 0 }, uFlashC: { value: 7 },
      uBias: { value: o.bias || 0 }, uUnlit: { value: o.unlit ? 1 : 0 }, uHide: { value: 0 }, uNoFog: { value: o.noFog ? 1 : 0 },
      uScroll: { value: new THREE.Vector2() }, uWave: { value: o.wave || 0 },
      uSwapA: { value: -1 }, uSwapB: { value: 0 },
    },
    side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: o.depthWrite !== false, depthTest: o.depthTest !== false,
  });
  if (o.offset) { m.polygonOffset = true; m.polygonOffsetFactor = -o.offset; m.polygonOffsetUnits = -o.offset; }
  m.userData.tex = tex; m.userData.o = o;
  return m;
}
// copia con uniformes propios (para destellos por entidad)
export const matClone = m => mat(m.userData.tex, m.userData.o);

// sombra de contacto: disco tramado negro
const SH_FRAG = /* glsl */`
precision highp float;
out vec4 oC;
in vec2 vUv; uniform float uA; uniform vec3 uC;
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main() {
  vec2 d = vUv - 0.5; float r = length(d) * 2.0;
  if (r > 1.0) discard;
  int x = int(mod(gl_FragCoord.x, 4.0)), y = int(mod(gl_FragCoord.y, 4.0));
  float th = (BY[y * 4 + x] + 0.5) / 16.0;
  float a = uA * (r < 0.6 ? 1.0 : 0.55);
  if (a < th) discard;
  oC = vec4(uC, 1.0);
}`;
const shGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export function blob(size = 1, a = 0.6) {
  const m = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: `out vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: SH_FRAG, uniforms: { uA: { value: a }, uC: { value: new THREE.Vector3(RGB[1][0] / 255, RGB[1][1] / 255, RGB[1][2] / 255) } },
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const me = new THREE.Mesh(shGeo, m); me.scale.set(size, 1, size); me.renderOrder = 1;
  return me;
}

// cielo: degradado vertical tramado entre colores de paleta, a pantalla completa
const SKY_FRAG = /* glsl */`
precision highp float;
out vec4 oC;
uniform vec3 pal[16]; uniform int uC[4]; uniform float uOff; uniform float uStars; uniform float uTime;
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  int x = int(mod(gl_FragCoord.x, 4.0)), y = int(mod(gl_FragCoord.y, 4.0));
  float th = (BY[y * 4 + x] + 0.5) / 16.0;
  float v = clamp(gl_FragCoord.y / ${H}.0 + uOff, 0.0, 0.999) * 3.0;
  int k = int(floor(v)); float f = v - float(k);
  f = floor(f * 6.0 + 0.5) / 6.0;
  int c = f > th ? uC[k + 1] : uC[k];
  if (uStars > 0.0) {
    vec2 g = floor(gl_FragCoord.xy);
    float r = h(g);
    if (r > 0.9955) { float tw = h(g + 7.0) * 6.28 + uTime * (1.0 + h(g + 3.0) * 2.0); c = sin(tw) > -0.3 ? (r > 0.9985 ? 7 : 6) : 13; }
  }
  oC = vec4(pal[c], 1.0);
}`;
export function makeSky() {
  const m = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: SKY_FRAG, depthTest: false, depthWrite: false,
    uniforms: { pal: U.pal, uC: { value: [12, 12, 12, 12] }, uOff: { value: 0 }, uStars: { value: 0 }, uTime: U.uTime },
  });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
  me.frustumCulled = false; me.renderOrder = -100;
  return me;
}

// ───────────────────────── constructor de mallas ─────────────────────────
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
export class MB {
  constructor(size = 128) {
    this.p = []; this.n = []; this.uv = []; this.sh = []; this.uvr = [];
    this.m = new THREE.Matrix4(); this.stack = []; this.shade = 0; this.S = size; this.tiled = false;
    this.flip = false;
  }
  push() { this.stack.push(this.m.clone()); return this; }
  pop() { this.m = this.stack.pop(); return this; }
  move(x, y, z) { this.m.multiply(new THREE.Matrix4().makeTranslation(x, y, z)); return this; }
  rotY(a) { this.m.multiply(new THREE.Matrix4().makeRotationY(a)); return this; }
  rotX(a) { this.m.multiply(new THREE.Matrix4().makeRotationX(a)); return this; }
  rotZ(a) { this.m.multiply(new THREE.Matrix4().makeRotationZ(a)); return this; }
  scale(x, y = x, z = x) { this.m.multiply(new THREE.Matrix4().makeScale(x, y, z)); return this; }
  at(x, y, z, f) { this.push().move(x, y, z); f(this); return this.pop(); }
  _tri(a, b, c, ua, ub, uc, rect) {
    _a.fromArray(a).applyMatrix4(this.m); _b.fromArray(b).applyMatrix4(this.m); _c.fromArray(c).applyMatrix4(this.m);
    _v.subVectors(_b, _a).cross(_c.clone().sub(_a));
    if (_v.lengthSq() < 1e-12) return;
    _v.normalize();
    const P = this.flip ? [_a, _c, _b] : [_a, _b, _c], UV = this.flip ? [ua, uc, ub] : [ua, ub, uc];
    if (this.flip) _v.negate();
    for (let i = 0; i < 3; i++) {
      this.p.push(P[i].x, P[i].y, P[i].z); this.n.push(_v.x, _v.y, _v.z);
      this.uv.push(UV[i][0], UV[i][1]); this.sh.push(this.shade);
      if (rect) this.uvr.push(rect[0], rect[1], rect[2], rect[3]);
    }
  }
  // triángulo con uv en píxeles de atlas
  tri(a, b, c, ua, ub, uc) {
    const S = this.S; this._tri(a, b, c, [ua[0] / S, ua[1] / S], [ub[0] / S, ub[1] / S], [uc[0] / S, uc[1] / S]); return this;
  }
  // cuadrilátero visto de frente: a arriba-izq, b abajo-izq, c abajo-der, d arriba-der. rect = [x,y,w,h] en px
  quad(a, b, c, d, rect, o = {}) {
    const S = this.S, e = 0.02;
    let x0 = (rect[0] + e) / S, y0 = (rect[1] + e) / S, x1 = (rect[0] + rect[2] - e) / S, y1 = (rect[1] + rect[3] - e) / S;
    if (o.flipX) [x0, x1] = [x1, x0];
    if (o.flipY) [y0, y1] = [y1, y0];
    let u = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];
    for (let r = 0; r < (o.rot || 0); r++) u = [u[1], u[2], u[3], u[0]];
    this._tri(a, b, c, u[0], u[1], u[2]); this._tri(a, c, d, u[0], u[2], u[3]);
    return this;
  }
  // cuadrilátero con baldosa repetida: cell = [x,y,w,h] px; ru, rv = repeticiones
  quadT(a, b, c, d, cell, ru = 1, rv = 1) {
    const S = this.S, r = [cell[0] / S, cell[1] / S, cell[2] / S, cell[3] / S];
    this.tiled = true;
    this._tri(a, b, c, [0, 0], [0, rv], [ru, rv], r); this._tri(a, c, d, [0, 0], [ru, rv], [ru, 0], r);
    return this;
  }
  // caja con base en y=0 centrada en xz. rects: {f,b,l,r,t,d} o uno para todo. o.top = [escalaX, escalaZ] de la tapa
  box(w, h, d, rects, o = {}) {
    const R = Array.isArray(rects) ? { f: rects, b: rects, l: rects, r: rects, t: rects, d: rects } : rects;
    const x = w / 2, z = d / 2, tx = x * (o.top ? o.top[0] : 1), tz = z * (o.top ? o.top[1] : 1), y0 = o.y || 0, y1 = y0 + h;
    const q = (a, b, c, e, r, oo) => r && this.quad(a, b, c, e, r, oo);
    q([-tx, y1, tz], [-x, y0, z], [x, y0, z], [tx, y1, tz], R.f, o.of);
    q([tx, y1, -tz], [x, y0, -z], [-x, y0, -z], [-tx, y1, -tz], R.b, o.ob);
    q([tx, y1, tz], [x, y0, z], [x, y0, -z], [tx, y1, -tz], R.r, o.or);
    q([-tx, y1, -tz], [-x, y0, -z], [-x, y0, z], [-tx, y1, tz], R.l, o.ol);
    q([-tx, y1, -tz], [-tx, y1, tz], [tx, y1, tz], [tx, y1, -tz], R.t, o.ot);
    q([-x, y0, z], [-x, y0, -z], [x, y0, -z], [x, y0, z], R.d, o.od);
    return this;
  }
  // cuerpo de revolución. prof = [[r, y], ...] de abajo arriba; n lados; rect se reparte en n franjas.
  // la franja n/2 mira al frente (+z). o.capT / o.capB = rect para tapas; o.sx, o.sz = achatado
  lathe(prof, n, rect, o = {}) {
    const step = Math.PI * 2 / n, a0 = -Math.PI - step / 2 + (o.phase || 0) * step;
    const sx = o.sx || 1, sz = o.sz || 1;
    let len = 0; const L = [0];
    for (let i = 1; i < prof.length; i++) { len += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); L.push(len); }
    const pt = (r, y, a) => [Math.sin(a) * r * sx, y, Math.cos(a) * r * sz];
    const from = o.from || 0, to = o.to == null ? n : o.to;
    for (let i = from; i < to; i++) {
      const A = a0 + i * step, B = A + step;
      const ux = rect[0] + rect[2] * i / n, uw = rect[2] / n;
      for (let k = 0; k < prof.length - 1; k++) {
        const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
        const v1 = rect[1] + rect[3] * (1 - L[k] / len), v0 = rect[1] + rect[3] * (1 - L[k + 1] / len);
        this.quad(pt(r1, y1, A), pt(r0, y0, A), pt(r0, y0, B), pt(r1, y1, B), [ux, v0, uw, v1 - v0]);
      }
    }
    const cap = (r, y, rc, upw) => {
      const S = this.S, cx = rc[0] + rc[2] / 2, cy = rc[1] + rc[3] / 2, ru = rc[2] / 2 - 0.05, rv = rc[3] / 2 - 0.05;
      for (let i = 0; i < n; i++) {
        const A = a0 + i * step, B = A + step;
        const uA = [(cx + Math.sin(A) * ru) / S, (cy + Math.cos(A) * rv) / S];
        const uB = [(cx + Math.sin(B) * ru) / S, (cy + Math.cos(B) * rv) / S];
        const uC = [cx / S, cy / S];
        if (upw) this._tri([0, y, 0], pt(r, y, A), pt(r, y, B), uC, uA, uB);
        else this._tri([0, y, 0], pt(r, y, B), pt(r, y, A), uC, uB, uA);
      }
    };
    if (o.capT) cap(prof[prof.length - 1][0], prof[prof.length - 1][1], o.capT, true);
    if (o.capB) cap(prof[0][0], prof[0][1], o.capB, false);
    return this;
  }
  // plano vertical de doble cara centrado (para hojas, carteles): w×h con base en y=0
  card(w, h, rect, o = {}) {
    const x = w / 2, y0 = o.y || 0;
    return this.quad([-x, y0 + h, 0], [-x, y0, 0], [x, y0, 0], [x, y0 + h, 0], rect, o);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('shade', new THREE.Float32BufferAttribute(this.sh, 1));
    if (this.tiled) g.setAttribute('uvr', new THREE.Float32BufferAttribute(this.uvr, 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  mesh(material) { return new THREE.Mesh(this.build(), material); }
}

// ───────────────────────── renderizador ─────────────────────────
export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = THREE.LinearSRGBColorSpace;
  r.autoClear = false;
  return r;
}

// luces puntuales: lista de {x,y,z,r}; se quedan las 6 más cercanas a un punto
export function setLights(list, cx, cy, cz) {
  const s = list.filter(l => l.r > 0).sort((a, b) => ((a.x - cx) ** 2 + (a.y - cy) ** 2 + (a.z - cz) ** 2) / (a.r * a.r + 1) - ((b.x - cx) ** 2 + (b.y - cy) ** 2 + (b.z - cz) ** 2) / (b.r * b.r + 1));
  for (let i = 0; i < 6; i++) {
    const l = s[i];
    if (l) U.uPL.value[i].set(l.x, l.y, l.z, l.r); else U.uPL.value[i].set(0, -999, 0, 0);
  }
}

export { Tex, T };
