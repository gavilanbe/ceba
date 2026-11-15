// title.js — la pantalla de inicio: Bulbo partido por la mitad, con sus siete capas a la vista,
// Ceba sentada en el borde del corte y el rótulo. También las tarjetas de la leyenda.
import { THREE, MB, mat, texFrom, makeSky, U, W, H } from './gfx.js';
import { Tex, T, clamp, lerp, ease, textW, rng } from './px.js';
import { G, run, wait, tween, all, flag, loadSave } from './state.js';
import { input, PADS } from './input.js';
import { audio } from './audio.js';
import { UI, ICON, wrap, drawRich, plain, panel, header } from './ui.js';
import { TXT } from './text.js';
import * as A from './art/props.js';
import * as F from './art/folk.js';
import { makeCeba } from './art/hero.js';
import { drawLogo, drawSprout, grow, anchors, LW } from './logo.js';

// ───────── Bulbo: perfil del mundo y sus capas ─────────
// perfil [radio, altura] de abajo arriba, con el centro del mundo en (0, 0)
const PROF = [[0.4, -2.2], [1.6, -2.0], [2.7, -1.35], [3.2, -0.4], [3.15, 0.5], [2.6, 1.3], [1.7, 1.85], [0.85, 2.2], [0.42, 2.7], [0.3, 3.3]];
const POLY = [[0, -2.2], ...PROF, [0, 3.3]];
// distancia del centro a la piel en una dirección (th = 0 abajo, π arriba)
function rho(th) {
  const dx = Math.sin(th), dy = -Math.cos(th);
  for (let k = 0; k < POLY.length - 1; k++) {
    const [ax, ay] = POLY[k], ex = POLY[k + 1][0] - ax, ey = POLY[k + 1][1] - ay, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (ax * ey - ay * ex) / den, u = (ax * dy - ay * dx) / den;
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) return t;
  }
  return 3;
}
// altura de la piel (mitad de arriba) a un radio dado, y su normal en el plano (radio, altura)
function yUp(r) { for (let k = 3; k < PROF.length - 1; k++) { const [r0, y0] = PROF[k], [r1, y1] = PROF[k + 1]; if (r <= r0 && r >= r1) return lerp(y0, y1, (r0 - r) / (r0 - r1 || 1)); } return r > 3.2 ? -0.4 : 3.3; }
// las siete capas, de fuera adentro: hasta dónde llega (fracción del radio), color, borde, luz y detalle
const LAY = [
  { to: 0.875, c: 9, e: 4, h: 10, d: 4 },    // la Piel
  { to: 0.735, c: 14, e: 2, h: 15, d: 8 },   // la Túnica
  { to: 0.585, c: 15, e: 9, h: 7, d: 9 },    // la Pulpa
  { to: 0.445, c: 12, e: 1, h: 7, d: 7 },    // el Jugo
  { to: 0.315, c: 13, e: 2, h: 6, d: 6 },    // el Velo
  { to: 0.185, c: 10, e: 9, h: 7, d: 9 },    // la Yema
  { to: 0, c: 11, e: 3, h: 10, d: 10 },      // el Germen
];
const SC = 0.054, WELL_X = 2.32, SEAT_X = -1.78;
const fx_ = x => 64 + x / SC, fy_ = y => 12 + (3.3 - y) / SC;

function paintFace() {
  const t = new Tex(128, 128), r = rng(7);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
    const x = (i + 0.5 - 64) * SC, y = 3.3 - (j + 0.5 - 12) * SC, d = Math.hypot(x, y), R = rho(Math.atan2(Math.abs(x), -y)), s = d / R;
    if (s > 1.05) continue;
    let k = 0, out = 1; while (k < 6 && s < LAY[k].to) { out = LAY[k].to; k++; }
    const L = LAY[k], e = (out - s) * R / SC;
    t.px(i, j, e < 1.05 ? L.e : e < 2.1 ? L.h : L.c);
    if (k === 6 && s < 0.1) t.px(i, j, 10);
  }
  const pt = (s, th) => { const R = rho(Math.abs(th)) * s; return [Math.round(fx_(Math.sin(th) * R) - 0.5), Math.round(fy_(-Math.cos(th) * R) - 0.5)]; };
  // vetas a media capa, a trazos
  LAY.forEach((L, k) => { if (k === 2 || k === 4 || k === 6) return; const sm = ((k ? LAY[k - 1].to : 1) + L.to) / 2 - 0.012; for (let a = -3.05; a < 3.05; a += 0.012) { const q = Math.floor((a + 3.2) / 0.012); if (q % 17 < 7 + k * 2) { const [x, y] = pt(sm, a); t.px(x, y, L.d); } } });
  // el pozo de la villa baja por la Piel hasta la Cisterna, en la Túnica
  const thW = Math.atan2(WELL_X, -yUp(WELL_X));
  for (let s = 1.0; s > 0.8; s -= 0.008) { const [x, y] = pt(s, thW); t.px(x, y, 1); t.px(x + 1, y, 1); }
  { const [x, y] = pt(0.795, thW + 0.03); t.oval(x, y, 5, 2.4, 1); t.oval(x, y + 1, 4, 1.4, 12); t.px(x - 2, y, 7); t.px(x + 3, y - 2, 13); t.px(x - 3, y - 2, 13); }
  // raíces que cuelgan en la Pulpa y setas de luz
  for (const a of [-2.5, -1.9, -1.35, -0.7, -0.2, 0.45, 1.0, 1.5, 2.6]) {
    let w = 0; for (let s = 0.735; s > 0.735 - 0.06 - r() * 0.07; s -= 0.006) { w += (r() - 0.5) * 0.012; const [x, y] = pt(s, a + w); t.px(x, y, 4); }
    const [x, y] = pt(0.6, a + 0.17); t.px(x, y, 8); t.px(x + 1, y, 8); t.px(x, y + (y > 64 ? -1 : 1), 7);
  }
  // burbujas en el Jugo, chispas en el Velo
  for (let n = 0; n < 26; n++) { const [x, y] = pt(0.47 + r() * 0.09, (r() - 0.5) * 6); t.px(x, y, n % 3 ? 7 : 1); }
  for (let n = 0; n < 14; n++) { const [x, y] = pt(0.34 + r() * 0.08, (r() - 0.5) * 6); t.px(x, y, n % 2 ? 7 : 6); }
  // rincones libres: el Germen en relieve [0,0,24,12] y raicillas [96,0,8,16]
  t.rect(0, 0, 24, 12, 11); t.rect(0, 0, 24, 3, 3); t.rect(0, 6, 24, 3, 10); t.rect(0, 9, 24, 3, 7); for (let x = 0; x < 24; x += 4) t.px(x + 1, 4, 10);
  t.rect(96, 0, 8, 16, 15); t.rect(96, 0, 2, 16, 9); t.rect(102, 0, 2, 16, 4);
  return t;
}
function paintSkin() {
  const t = new Tex(128, 128), r = rng(5);
  // piel del mundo [0,0,128,64]: 12 gajos
  t.rect(0, 0, 128, 64, 9); t.rect(0, 0, 128, 9, 4); t.rect(0, 9, 128, 1, 2); t.rect(0, 55, 128, 9, 4);
  for (let x = 0; x < 128; x += 4) { t.px(x + 1, 10, 4); t.px(x + 2, 10, 4); t.px(x + 2, 11, 4); t.rect(x, 54, 2, 1, 4); }
  for (let k = 0; k < 12; k++) { const x = Math.round(k * 128 / 12); t.rect(x, 10, 1, 45, 4); t.rect(x + 4, 16 + (k * 5 % 9), 1, 11, 10); t.rect(x + 7, 32 + (k * 7 % 8), 1, 8, 4); }
  for (let n = 0; n < 14; n++) { const x = Math.floor(r() * 120), y = 14 + Math.floor(r() * 20), w = 4 + Math.floor(r() * 6); t.oval(x + w / 2, y + 2, w / 2, 2, 11); t.px(x + 1, y + 2, 3); t.px(x + w - 2, y + 1, 10); }
  // hoja del brote [0,64,12,48]
  t.rect(0, 64, 12, 48, 11); t.rect(0, 64, 1, 48, 3); t.rect(11, 64, 1, 48, 3); t.rect(5, 66, 1, 46, 3); t.rect(0, 102, 12, 10, 3); t.rect(1, 64, 10, 5, 10);
  for (let j = 72; j < 100; j += 6) { t.px(2, j, 10); t.px(8, j + 3, 3); }
  return t;
}

// cielo de la portada: el resplandor de Bulbo en anillos tramados que se abren, y estrellas
const SKY = /* glsl */`
precision highp float;
out vec4 oC;
uniform vec3 pal[16]; uniform vec2 uCen; uniform float uTime, uGlow;
const float BY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  int x = int(mod(gl_FragCoord.x, 4.0)), y = int(mod(gl_FragCoord.y, 4.0));
  float th = (BY[y * 4 + x] + 0.5) / 16.0;
  float r = length((gl_FragCoord.xy - uCen) * vec2(1.0, 1.12)) / 360.0;
  float v = clamp(r * 1.55 - 0.32 - uGlow, 0.0, 0.999) * 2.0;
  int k = int(floor(v)); float f = floor(fract(v) * 6.0 + 0.5) / 6.0;
  int c = k == 0 ? (f > th ? 1 : 2) : (f > th ? 0 : 1);
  // anillos que se alejan despacio, como capas
  float w = fract(r * 4.2 - uTime * 0.045);
  if (w < 0.045 && r > 0.3 && th < 0.56) c = c == 0 ? 1 : c == 1 ? 2 : 2;
  vec2 g = floor(gl_FragCoord.xy / 2.0); float q = h(g);
  if (q > 0.9952 && r > 0.33) { float tw = h(g + 7.0) * 6.28 + uTime * (1.0 + h(g + 3.0) * 2.0); c = sin(tw) > -0.3 ? (q > 0.9985 ? 7 : 6) : 13; }
  oC = vec4(pal[c], 1.0);
}`;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 200);
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 1.0, 1.0); }', fragmentShader: SKY, depthTest: false, depthWrite: false, uniforms: { pal: U.pal, uCen: { value: new THREE.Vector2(470, 160) }, uTime: U.uTime, uGlow: { value: 0 } } }));
sky.frustumCulled = false; sky.renderOrder = -100;
const _v = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
let world, germ, mFace, leaves = [], tears = [], ceba, candela, lantern, built = false;
const seat0 = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
// coloca algo en el borde del corte: x a lo largo del borde, back = cuánto se mete hacia atrás
function seat(obj, x, back, sc = 1, yaw = 0, lean = 1) {
  const r = Math.hypot(x, back), y = yUp(r), sl = (yUp(r + 0.06) - yUp(r - 0.06)) / 0.12, n = new THREE.Vector3(-sl * x / r * lean, 1, -sl * -back / r * lean).normalize();
  obj.position.set(x, y - 0.03, -back); obj.quaternion.setFromUnitVectors(UP, n); obj.rotateY(yaw); obj.scale.setScalar(sc); world.add(obj);
  return obj;
}
function build() {
  if (built) return; built = true;
  scene.add(sky);
  const ft = texFrom(paintFace()), st = texFrom(paintSkin());
  mFace = mat(ft, { double: true, bias: 0.8, maxLod: 0 }); const mSkin = mat(st), mLeaf = mat(st, { double: true, bias: -0.4 }), mGerm = mat(ft, { unlit: true }), mRoot = mat(ft, { double: true, bias: 0.3 });
  world = new THREE.Group(); scene.add(world);
  // la media cebolla de atrás
  world.add(new MB().lathe(PROF, 12, [0, 0, 128, 64], { phase: 0.5, from: 0, to: 3 }).lathe(PROF, 12, [0, 0, 128, 64], { phase: 0.5, from: 9, to: 12 }).mesh(mSkin));
  // la cara del corte: abanico desde el centro
  const ring = [...POLY, ...POLY.slice(1, -1).reverse().map(p => [-p[0], p[1]])], fb = new MB();
  for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; fb.tri([0, 0, 0], [a[0], a[1], 0], [b[0], b[1], 0], [fx_(0), fy_(0)], [fx_(a[0]), fy_(a[1])], [fx_(b[0]), fy_(b[1])]); }
  world.add(fb.mesh(mFace));
  // el Germen, en relieve y con luz propia
  germ = new MB().lathe([[0.001, 0], [0.3, 0.06], [0.4, 0.22], [0.3, 0.4], [0.001, 0.5]], 6, [0, 0, 24, 12]).mesh(mGerm); germ.rotation.x = Math.PI / 2; germ.position.z = -0.06; world.add(germ);
  // brote del mundo
  const leafGeo = (len, w) => { const b = new MB(), P = [[w, 0, 0], [w * 1.3, len * 0.4, 0.06], [w * 0.95, len * 0.75, 0.22], [w * 0.1, len, 0.5]]; for (let i = 0; i < 3; i++) { const a = P[i], c = P[i + 1]; b.quad([-c[0], c[1], c[2]], [-a[0], a[1], a[2]], [a[0], a[1], a[2]], [c[0], c[1], c[2]], [0, 64 + 48 - 16 * (i + 1), 12, 16]); } return b.build(); };
  for (const [len, w, yaw, lean] of [[1.7, 0.2, 0.2, 0.12], [1.35, 0.17, 2.2, 0.5], [1.2, 0.16, -2.0, 0.55], [0.9, 0.13, 3.6, 0.75]]) {
    const g = new THREE.Group(), p = new THREE.Group(); g.position.y = 3.25; g.rotation.y = yaw; p.rotation.x = lean; p.add(new THREE.Mesh(leafGeo(len, w), mLeaf)); g.add(p); world.add(g); leaves.push({ p, lean });
  }
  // raicillas
  const rb = new MB(); for (let i = 0; i < 7; i++) { const x = -0.36 + i * 0.12, l = 0.35 + (i * 37 % 5) * 0.09, z = -0.02 - (i % 3) * 0.12; rb.tri([x - 0.035, -2.2, z], [x + (i - 3) * 0.03, -2.2 - l, z], [x + 0.035, -2.2, z], [96, 0], [100, 16], [104, 0]); } world.add(rb.mesh(mRoot));
  // la villa, asomada al borde
  seat(A.makeHouse().g, 1.5, 0.62, 0.3, -0.35);
  seat(A.makeHouse({ swap: 14 }).g, -2.78, 0.5, 0.25, 0.5);
  seat(A.makeHouse({ swap: 15 }).g, 0.95, 1.5, 0.24, 0.2);
  seat(A.makeWell().g, WELL_X, 0.28, 0.21, -0.2);
  seat(A.makeStatue().g, 0.72, 0.5, 0.26, 0.2);
  lantern = seat(A.makeLantern().g, 2.85, 0.3, 0.42);
  seat(A.makeFlag().g, 2.0, 0.25, 0.5, 0.4);
  for (const [x, b, s, f] of [[-2.5, 0.2, 0.34, 1], [-0.9, 0.3, 0.26, 0], [1.1, 0.25, 0.28, 1], [1.95, 1.0, 0.32, 0], [2.62, 0.75, 0.3, 1], [-3.02, 0.25, 0.26, 0]]) seat(A.makeChive(!!f).g, x, b, s, x * 3);
  // Ceba, sentada en el borde con los pies colgando
  ceba = makeCeba(); ceba.shadow.visible = false; seat(ceba.root, SEAT_X, 0.5, 1, 0.25, 0.3); ceba.root.position.y += 0.1; seat0.p.copy(ceba.root.position); seat0.q.copy(ceba.root.quaternion);
  candela = F.makeCandela(); candela.g.scale.setScalar(1.25); scene.add(candela.g);
  // lágrimas a la deriva
  for (let i = 0; i < 8; i++) { const tr = A.makeTear(false); tr.sh.visible = false; tr.g.scale.setScalar(1.3 + (i % 3) * 0.35); scene.add(tr.g); tears.push({ g: tr.g, a: i * 0.83 + 0.4, r: 4.5 + (i * 5 % 4) * 0.75, y: -2.2 + i * 0.75, s: 0.1 + (i % 4) * 0.035 }); }
}

const LVNAME = { villa: 'Villa Ristra', cisterna: 'La Cisterna', pulpa: 'El Raigal', raicera: 'La Raicera' };
const CX = 92, LX = 8, LY = -7, RIB_Y = 80, MENU_Y = 103;
const S = { kp: 0, t: 0, sel: 0, opts: [], phase: 'in', card: null, zoom: 0, out: 0, mt: 0, hits: [], sub: null, st: 0, yes: 0, save: null, blink: 0, drip: 0, lastK: -1 };
const T_READY = 1.85;
const KEYS = [['WASD', 'Mover'], ['Espacio', 'Acción · rodar'], ['J', 'La Hoja'], ['Mayús', 'Fijar objetivo'], ['U · I · O', 'Objetos'], ['Flechas o ratón', 'Cámara'], ['R · C', 'Zoom · a la espalda'], ['Intro', 'Pausa']];
const KEYS_T = [['Palanca izquierda', 'Mover'], ['A', 'Acción · rodar'], ['B', 'La Hoja'], ['Z', 'Fijar objetivo'], ['U · I · O', 'Objetos'], ['Arrastrar a la derecha', 'Cámara'], ['Lupa', 'Zoom'], ['Dos toques', 'A la espalda']];
const fmtTime = s => { const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${String(m).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`; };

export const Title = {
  scene, cam, S,
  enter() {
    build(); const sv = loadSave(); S.save = sv;
    S.t = 0; S.phase = 'in'; S.out = 0; S.mt = 0; S.sub = null; S.zoom = 0; S.card = null; S.lastK = -1; S.drip = 0; S.dive = 0; S.flashT = 0; S.flashK = 0; S.pulse = 0;
    ceba.root.visible = true; ceba.root.position.copy(seat0.p); ceba.root.quaternion.copy(seat0.q); ceba.root.scale.setScalar(1); ceba.tilt.rotation.set(0, 0, 0);
    S.opts = sv ? ['Continuar', 'Partida nueva', 'Controles'] : ['Partida nueva', 'Controles']; S.sel = 0;
    // Ceba sale como va en la partida guardada
    ceba.setHoja(!!(sv && sv.flags && sv.flags.hoja)); ceba.setLayers(sv ? clamp(sv.layers || 3, 1, 3) : 3); ceba.setFace('normal');
    U.uDark.value = 0; U.uFogR.value.set(900, 999); U.uAmb.value = 0.56; U.uPL.value.forEach(p => { p.w = 0; });
    audio.music('title', { fade: 0.5 });
    UI.over = (t, dt) => Title.draw(t, dt);
  },
  leave() { UI.over = null; U.uPL.value.forEach(p => { p.w = 0; }); },
  update(dt) {
    S.t += dt; const t = S.t;
    // el mundo flota y se mece
    world.position.y = Math.sin(t * 0.7) * 0.07; world.rotation.z = Math.sin(t * 0.45) * 0.018; world.rotation.y = Math.sin(t * 0.3) * 0.07;
    leaves.forEach((l, i) => { l.p.rotation.x = l.lean + Math.sin(t * 1.3 + i * 1.7) * 0.07; });
    const gp = 1 + Math.sin(t * 2.2) * 0.07 + (S.pulse || 0) * 0.9; germ.scale.set(gp, gp, gp);
    for (const q of tears) { q.a += dt * q.s; q.g.position.set(Math.sin(q.a) * q.r, q.y + Math.sin(t * 0.8 + q.a * 3) * 0.3, Math.cos(q.a) * q.r); q.g.rotation.y = t * 1.5 + q.a; }
    // Ceba: respira, mece los pies, parpadea y mira arriba
    const c = ceba, sw = Math.sin(t * 2.3);
    c.sq.scale.set(1 - Math.sin(t * 2) * 0.012, 1 + Math.sin(t * 2) * 0.02, 1 - Math.sin(t * 2) * 0.012);
    c.tilt.rotation.x = -0.14 + Math.sin(t * 0.5) * 0.05; c.tilt.rotation.z = Math.sin(t * 0.37) * 0.04;
    if (S.dive > 0) {
      // al empezar, Ceba salta del borde y baja capa a capa hasta el Germen
      const d = S.dive, a = clamp(d / 0.24), v = clamp((d - 0.24) / 0.76), e = v * v;
      c.sq.scale.set(1 + Math.sin(a * Math.PI) * 0.16, 1 - Math.sin(a * Math.PI) * 0.22, 1 + Math.sin(a * Math.PI) * 0.16);
      c.root.position.set(lerp(seat0.p.x, 0, e), lerp(seat0.p.y, 0.05, e) + Math.sin(Math.min(1, v * 1.5) * Math.PI) * 0.95 * (1 - v), lerp(seat0.p.z, 0.5, clamp(v * 3.2)));
      c.root.scale.setScalar(lerp(1, 0.14, e)); c.tilt.rotation.z = -v * v * 13; c.tilt.rotation.x = 0;
      if (v > 0) { const p = c.root.position, sN = Math.hypot(p.x, p.y) / rho(Math.atan2(Math.abs(p.x), -p.y)); let k = 0; while (k < 6 && sN < LAY[k].to) k++; if (v > 0.3 && k !== S.flashK) { S.flashK = k; S.flashT = 0.1; audio.sfx('blip', { pitch: 0.6 + k * 0.17, vol: 0.9 }); } }
      if (d >= 1 && c.root.visible) { c.root.visible = false; S.pulse = 1; audio.sfx('sprout', { vol: 0.8 }); }
    }
    S.flashT -= dt; mFace.uniforms.uSwapA.value = S.flashT > 0 ? LAY[S.flashK].c : -1; mFace.uniforms.uSwapB.value = S.flashT > 0 ? LAY[S.flashK].h : 0;
    S.pulse = Math.max(0, S.pulse - dt * 1.6); candela.g.visible = c.root.visible;
    c.footL.position.set(-0.2, -0.2 + sw * 0.04, 0.5); c.footL.rotation.x = 0.55 + sw * 0.32;
    c.footR.position.set(0.2, -0.2 - sw * 0.04, 0.5); c.footR.rotation.x = 0.55 - sw * 0.32;
    c.handL.position.set(-0.58, 0.1, 0.12); c.handR.position.set(0.58, 0.1, 0.12);
    c.leaves.forEach((l, i) => { l.p.rotation.x = l.lean + Math.sin(t * 1.6 + i) * 0.1; });
    S.blink -= dt; if (S.blink < -3.2) S.blink = 0.13; c.setFace(S.blink > 0 ? 'blink' : S.phase === 'go' ? 'brave' : 'normal');
    // Candela revolotea a su alrededor
    c.root.getWorldPosition(_v); const ca = t * 1.25, px = candela.g.position.x, pz = candela.g.position.z;
    candela.g.position.set(_v.x + Math.sin(ca) * 0.95, _v.y + 1.25 + Math.sin(t * 2.6) * 0.16, _v.z + 0.15 + Math.cos(ca) * 0.6);
    candela.g.rotation.y = Math.atan2(candela.g.position.x - px, candela.g.position.z - pz);
    const fl = Math.sin(t * 55) * 0.9; candela.wl.rotation.z = fl; candela.wr.rotation.z = -fl;
    // luces: el Germen late desde el centro, Candela, y el farol
    const L = U.uPL.value; germ.getWorldPosition(_v); L[0].set(_v.x, _v.y, _v.z + 0.7, 5.5 + Math.sin(t * 2.2) * 0.45 + S.pulse * 3);
    L[1].set(candela.g.position.x, candela.g.position.y, candela.g.position.z, 2.3 + Math.sin(t * 5) * 0.2);
    lantern.getWorldPosition(_v); L[2].set(_v.x, _v.y + 0.6, _v.z + 0.2, 1.5);
    // cámara: algo a la izquierda del corte y por encima; el mundo queda a la derecha de la pantalla
    const z = ease.io(S.zoom), cy = lerp(-0.42, -0.16, z) + Math.sin(t * 0.21) * 0.035, ce = lerp(0.2, 0.08, z), D = lerp(13.1, 9.4, z) - (S.dive > 0.24 ? ease.io(clamp((S.dive - 0.24) / 0.76)) * 1.3 : 0), sh = lerp(3.5, 0, z), ty = lerp(1.05, -0.3, z);
    const op = 1 - ease.out3(clamp(t / 2.8));
    const rx = Math.cos(cy), rz = -Math.sin(cy), tx = -rx * sh, tz = -rz * sh;
    cam.position.set(tx + Math.sin(cy) * Math.cos(ce) * (D - op * 2.2), ty + Math.sin(ce) * (D - op * 2.2), tz + Math.cos(cy) * Math.cos(ce) * (D - op * 2.2)); cam.lookAt(tx, ty, tz);
    cam.updateMatrixWorld(); _v.set(0, 0.2, 0).project(cam); sky.material.uniforms.uCen.value.set((_v.x * 0.5 + 0.5) * W * 2, (_v.y * 0.5 + 0.5) * H * 2); sky.material.uniforms.uGlow.value = Math.sin(t * 2.2) * 0.012 + S.pulse * 0.16;
    if (G.lock > 0 || S.phase === 'go' || S.phase === 'cards') return;
    const ok = () => input.hit('a') || input.hit('start'), back = () => input.hit('b') || input.hit('back');
    if (S.phase === 'in') { if (t > T_READY) S.phase = 'press'; else if (t > 0.3 && ok()) { S.t = T_READY; S.phase = 'press'; } return; }
    if (S.phase === 'press') { if (ok()) { audio.init(); audio.sfx('select'); S.phase = 'menu'; S.mt = 0; } return; }
    S.mt += dt;
    if (S.sub) {
      S.st += dt;
      if (S.sub === 'keys') {
        const d = (input.hit('right') ? 1 : 0) - (input.hit('left') ? 1 : 0); if (d && !input.touch) { S.kp = (S.kp + d + 2) % 2; S.st = 0.12; audio.sfx('menuMove'); }
        if (ok() || back()) { audio.sfx('cancel'); S.sub = null; }
      }
      else {
        if (input.hit('left') || input.hit('right') || input.hit('up') || input.hit('down')) { S.yes ^= 1; audio.sfx('menuMove'); }
        if (back()) { audio.sfx('cancel'); S.sub = null; }
        else if (ok()) { if (S.yes) Title.start(false); else { audio.sfx('cancel'); S.sub = null; } }
      }
      return;
    }
    if (input.hit('up')) { S.sel = (S.sel + S.opts.length - 1) % S.opts.length; audio.sfx('menuMove'); }
    if (input.hit('down')) { S.sel = (S.sel + 1) % S.opts.length; audio.sfx('menuMove'); }
    if (back()) { audio.sfx('cancel'); S.phase = 'press'; }
    else if (ok()) Title.pick();
  },
  pick() {
    const o = S.opts[S.sel]; audio.init();
    if (o === 'Controles') { audio.sfx('select'); S.sub = 'keys'; S.st = 0; S.kp = input.usedPad ? 1 : 0; }
    else if (o === 'Continuar') Title.start(true);
    else if (S.save) { audio.sfx('select'); S.sub = 'new'; S.st = 0; S.yes = 0; }
    else Title.start(false);
  },
  start(cont) { audio.init(); audio.sfx('select'); audio.sfx('peel', { vol: 0.7 }); S.sub = null; S.phase = 'go'; S.out = 0;
    run(function* () { audio.sfx('jump'); yield* tween(1.2, k => { S.dive = Math.max(0.001, k); }); yield* wait(0.25); yield* (cont ? G.startContinue() : G.startNew()); });
  },
  // toque en la pantalla (touch.js): devuelve true si hay que dar además el botón A
  tap(x, y) {
    if (S.phase === 'in' || S.phase === 'press') return true;
    if (S.phase !== 'menu' || G.lock > 0) return false;
    if (S.sub === 'keys') return true;
    for (const h of S.hits) if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { if (S.sub === 'new') S.yes = h.i; else S.sel = h.i; return true; }
    return false;
  },
  render(r) { r.render(scene, cam); },
  draw(t, dt) {
    if (S.phase === 'cards') { Title.drawCard(t, dt); return; }
    const go = S.phase === 'go'; if (go) S.out = Math.min(1, S.out + dt / 0.55);
    const T0 = S.t, out = S.out;
    if (T0 < 0.7) t.dith(0, 0, W, H, T, 0, Math.round(16 * (1 - T0 / 0.7)));
    // ── el rótulo: cada letra crece capa a capa; al empezar, se pela ──
    const g = [0, 0, 0, 0], bob = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      const k = (T0 - 0.2 - i * 0.17) / 0.5; g[i] = grow(k) * (1 - ease.in(clamp(out * 1.7 - i * 0.14)));
      bob[i] = T0 > T_READY ? Math.round(Math.sin(T0 * 1.7 - i * 0.8) * 1.3) : 0;
      if (k > 0 && S.lastK < i) { S.lastK = i; audio.sfx('blip', { pitch: 0.75 + i * 0.16, vol: 0.8 }); }
    }
    const sh = (T0 - 1.25) % 6; drawLogo(t, LX, LY, g, bob, T0 > 1.25 && sh < 0.8 ? sh / 0.8 * (LW + 70) - 40 : null);
    drawSprout(t, LX, LY, ease.back(clamp((T0 - 1.0) / 0.5)) * (1 - clamp(out * 3)), T0, bob[0]);
    // ── la cinta del subtítulo ──
    const rk = ease.out3(clamp((T0 - 1.25) / 0.45)) * (1 - ease.in(clamp(out * 2.2 - 0.5)));
    if (rk > 0) {
      const sub = 'El mundo de siete capas', fw = textW(sub) + 22, w = Math.round(fw * rk), x = CX - (w >> 1), y = RIB_Y;
      if (w > 12) {
        // colas en cola de golondrina, por detrás y un poco más abajo
        for (const sd of [-1, 1]) for (let j = -1; j <= 11; j++) { const n = j < 0 || j > 10 ? 9 : 9 - Math.max(0, 4 - Math.abs(j - 5)), x0 = sd < 0 ? x - 8 + (9 - n) : x + w - 1; t.rect(x0 - (sd < 0 ? 1 : 0), y + 3 + j, n + 1, 1, 0); if (j >= 0 && j <= 10) t.rect(x0 + (sd < 0 ? 0 : 0), y + 3 + j, n - (sd < 0 ? 0 : 0), 1, j > 8 ? 0 : 2); }
        t.rect(x - 1, y - 1, w + 2, 15, 0); t.rect(x, y, w, 13, 8); t.rect(x, y, w, 1, 14); t.rect(x, y + 11, w, 2, 2);
        t.setClip(x + 2, y, w - 4, 13); t.text(sub, CX - (textW(sub) >> 1), y + 3, 7); t.setClip(null);
      }
    }
    // ── la lágrima de la A: se forma, cae y salpica en la cinta ──
    if (T0 > 3 && !go) {
      const u = (T0 - 3) % 6.4, ax = LX + Math.round(anchors.tear[0]), ay = LY + Math.round(anchors.tear[1]) + bob[3], fall = RIB_Y - ay - 2;
      if (u < 1.5) { const n = u < 0.5 ? 1 : u < 1.0 ? 2 : 3; t.rect(ax - (n > 2 ? 1 : 0), ay, n > 2 ? 3 : 1, n, 12); if (n > 1) t.px(ax, ay + n - 1, 12); if (n > 2) { t.px(ax, ay + 3, 12); t.px(ax - 1, ay + 1, 7); } S.drip = 0; }
      else { const y = 220 * (u - 1.5) * (u - 1.5); if (y < fall) { t.rect(ax, ay + Math.round(y), 1, 3, 12); t.px(ax, ay + Math.round(y) + 3, 7); } else { const q = u - 1.5 - Math.sqrt(fall / 220); if (!S.drip) { S.drip = 1; audio.sfx('tear', { vol: 0.25 }); } if (q < 0.3) for (const s of [-1, 1]) for (const m of [1, 2]) t.px(ax + s * Math.round(q * 22 * m), RIB_Y - 1 - Math.round(Math.sin(q / 0.3 * 3.14) * 3 * m), m > 1 ? 7 : 12); } }
    }
    S.hits = [];
    // ── «pulsa para empezar» ──
    if (S.phase === 'press' || (S.phase === 'in' && T0 > 1.7)) {
      const msg = input.touch ? 'Toca para empezar' : input.usedPad ? `Pulsa ${input.pad.a}` : 'Pulsa Espacio', y = 122 + Math.round(Math.sin(T0 * 2.4) * 1.5), w = textW(msg);
      if (Math.floor(T0 * 1.5) % 4 !== 3) { t.textO(msg, CX - (w >> 1), y, 7, 0); t.spr(ICON.lagrima, CX - (w >> 1) - 13, y - 1); t.spr(ICON.lagrima, CX + (w >> 1) + 6, y - 1); }
    }
    // ── el menú ──
    if (S.phase === 'menu' || (go && S.mt > 0)) {
      S.opts.forEach((o, i) => {
        const k = ease.back(clamp((S.mt - i * 0.06) / 0.3)) * (1 - ease.in(clamp(out * 2.5 - i * 0.2)));
        const sel = i === S.sel, w = 104, h = 14, x = CX - (w >> 1) - Math.round((1 - k) * 200), y = MENU_Y + i * 17;
        t.rrect(x - 1, y - 1, w + 2, h + 3, 0, 2); t.rrect(x, y + 1, w, h, sel ? 4 : 0, 2); t.rrect(x, y, w, h - 1, sel ? 9 : 1, 2); t.rect(x + 2, y + 1, w - 4, 1, sel ? 10 : 13);
        t.text(o, x + ((w - textW(o)) >> 1), y + 4, sel ? 0 : 6);
        if (sel && !go) { const b = Math.round(Math.sin(T0 * 6) * 1.5); t.spr(ICON.lagrima, x - 11 + b, y + 2); t.spr(ICON.lagrima, x + w + 4 - b, y + 2); }
        if (!S.sub) S.hits.push({ x: x - 12, y: y - 2, w: w + 24, h: 17, i });
      });
      // qué hay en la partida guardada
      if (S.save && S.opts[S.sel] === 'Continuar' && !go && S.mt > 0.4) {
        const sv = S.save, info = `${LVNAME[sv.spawn && sv.spawn.level] || 'Bulbo'} · ${fmtTime(sv.time || 0)}`, y = MENU_Y + S.opts.length * 17 + 3;
        t.textO(info, CX - (textW(info) >> 1), y, 15, 0);
      }
    }
    // ── pie ──
    if (T0 > 2 && !go && S.phase !== 'menu') { const f = 'Capítulos I y II'; t.textS(f, 8, H - 12, 13, 0); }
    if (S.sub === 'keys') Title.drawKeys(t); else if (S.sub === 'new') Title.drawConfirm(t);
  },
  drawKeys(t) {
    // tres hojas: táctil (sola), teclado y mando; con ◀ ▶ se pasa de una a otra
    const pg = input.touch ? 2 : S.kp, P = input.hasPad ? input.pad : PADS.otro;
    const rows = pg === 2 ? KEYS_T : pg === 0 ? KEYS : [['Palanca izquierda o cruceta', 'Mover'], [P.a, 'Acción · rodar'], [P.b, 'La Hoja'], [P.z, 'Fijar objetivo'], [`${P.c1} · ${P.c2} · ${P.c3}`, 'Objetos'], ['Palanca derecha', 'Cámara'], [`${P.l} · ${P.r}`, 'Girar la cámara'], ['Pulsar las palancas', 'Zoom · a la espalda'], [P.start, 'Pausa']];
    const w = 232, h = 34 + rows.length * 12 + (pg === 1 ? 10 : 0), x = (W - w) >> 1, y = Math.round((H - h) / 2 + (1 - ease.back(clamp(S.st / 0.25))) * 14), mid = x + (pg === 0 ? 100 : 136);
    panel(t, x, y, w, h, 'papel'); header(t, x + 1, y + 1, w - 2, 'Controles');
    if (pg < 2) { const lb = pg ? (input.hasPad ? P.name : 'Mando') : 'Teclado y ratón', lw = textW(lb), rx = x + w - 12; t.text('▶', rx - 4, y + 3, 10); t.text(lb, rx - 9 - lw, y + 3, 7); t.text('◀', rx - 16 - lw, y + 3, 10); }
    rows.forEach(([k, a], i) => { const yy = y + 19 + i * 12; if (i % 2) t.rect(x + 3, yy - 3, w - 6, 12, 7); t.textR(k, mid - 6, yy, 8); t.rect(mid, yy + 2, 2, 2, 9); t.text(a, mid + 8, yy, 1); });
    if (pg === 1) t.textC(input.hasPad ? 'Listo: se usa el último mando que toques.' : 'Conecta un mando y pulsa un botón.', W / 2, y + h - 24, input.hasPad ? 3 : 2);
    t.textC(input.touch ? 'Toca para volver' : input.usedPad ? `${P.a}: volver` : 'Espacio: volver', W / 2, y + h - 12, 4);
  },
  drawConfirm(t) {
    const w = 196, h = 62, x = (W - w) >> 1, y = Math.round((H - h) / 2 + (1 - ease.back(clamp(S.st / 0.25))) * 14);
    panel(t, x, y, w, h, 'papel'); header(t, x + 1, y + 1, w - 2, '¿Empezar de cero?');
    t.textC('La partida guardada se perderá.', W / 2, y + 19, 1);
    S.hits = [];
    ['No, volver', 'Sí, empezar'].forEach((o, i) => { const bw = 80, bx = x + 12 + i * (bw + 12), by = y + 36, sel = S.yes === i; t.rrect(bx - 1, by - 1, bw + 2, 17, 0, 2); t.rrect(bx, by + 1, bw, 14, sel ? 2 : 4, 2); t.rrect(bx, by, bw, 13, sel ? 8 : 15, 2); t.textC(o, bx + bw / 2, by + 4, sel ? 7 : 4); S.hits.push({ x: bx, y: by, w: bw, h: 15, i }); });
  },
  // ── la leyenda ──
  drawCard(t, dt) {
    t.rect(0, 0, W, 16, 0); t.rect(0, H - 46, W, 46, 0); t.rect(0, H - 47, W, 1, 2); t.rect(0, 16, W, 1, 2);
    const c = S.card; if (!c) return; c.t += dt;
    let n = Math.floor(c.t * 26);
    c.lines.forEach((l, i) => { const w = textW(plain(l)); const used = drawRich(t, l, (W - w) >> 1, H - 38 + i * 12 + (3 - c.lines.length) * 6, 'oscuro', n, G.t); n -= used; });
    c.done = n >= 0;
  },
  *card(text, hold = 2.3) {
    S.card = { lines: text.split('\n'), t: 0, done: false };
    let e = 0, after = 0, last = -1;
    for (;;) { const dt = yield; e += dt; const k = Math.floor(e * 26); if (!S.card.done && k !== last && k % 2 === 0) audio.sfx('blip', { pitch: 0.7, vol: 0.5 }); last = k; if (S.card.done) after += dt; if (after > hold) break; if (input.hit('a')) { if (S.card.done) break; S.card.t = 99; } }
    S.card = null;
  },
  *intro() {
    G.lock++;
    yield* G.fade(1, 0.6, 0); S.phase = 'cards'; audio.music('intro', { fade: 0.8 });
    yield* all(G.fade(0, 0.8, 0), tween(7, k => { S.zoom = k; }), Title.card(TXT.INTRO[0]));
    yield* G.fade(1, 0.6, 0);
    // el resto, sobre Villa Ristra
    const p = G.player; Title.leave(); G.mode = 'play'; G.cine = true;
    const L = G.load('villa', 'cama'); L.resumeMusic = L.resumeMusic; audio.music('intro');
    p.sink = 0.86; p.faceOv = 'sleep'; p.set('cine'); G.candela.show(false);
    UI.over = (t, dt) => Title.drawCard(t, dt);
    const shot = function* (text, a, b, good) {
      L.statue.setCry(good, true); L.pond.on = good; L.pond.mesh.visible = good;
      G.cam.cut(a[0], a[1], a[2], a[3], a[4], a[5], 38);
      yield* all(G.fade(0, 0.6, 0), G.cam.to(b[0], b[1], b[2], b[3], b[4], b[5], 7, 36, x => x), Title.card(text));
      yield* G.fade(1, 0.5, 0);
    };
    yield* shot(TXT.INTRO[1], [-1.0, 1.6, -0.2, -4.2, 2.2, -4.2], [-1.7, 2.1, -1.1, -4.2, 2.3, -4.2], true);
    yield* shot(TXT.INTRO[2], [-11, 5.5, 14, 0, 0.8, -4], [-8, 4.4, 11, 0, 0.8, -4], true);
    yield* shot(TXT.INTRO[3], [-13.8, 0.9, 12.2, -16, 0.35, 10], [-14.4, 0.8, 11.6, -16, 0.35, 10], true);
    yield* shot(TXT.INTRO[4], [5, 3.4, 27, 0, -0.8, 18], [3, 2.4, 25, 0, -0.9, 16], false);
    UI.over = null; G.cine = false; G.lock--;
    L.resumeMusic();
    yield* all(G.fade(0, 0.8, 0), L.onEnter(L, null, {}));
  },
};
