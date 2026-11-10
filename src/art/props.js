// props.js — atrezo: casas-maceta, pozo, cofre, tinaja, cartel, la Plañidera, cebollinos, lágrimas, objetos.
import { Tex, T, rng } from '../px.js';
import { MB, mat, texFrom, texUpdate, THREE, blob } from '../gfx.js';
import { tilesTex, TI, cell } from './tiles.js';

let _A = null, _B = null;
export function sheetA() {
  if (_A) return _A;
  const t = new Tex(128, 128);
  // ── casa-maceta [0,0,96,40]: 8 franjas de 12; puerta en la 4, ventanas en 2 y 6 ──
  t.rect(0, 0, 96, 40, 9);
  t.rect(0, 0, 96, 3, 4); t.rect(0, 3, 96, 1, 2);                 // culo de la maceta (tejado)
  t.rect(0, 30, 96, 2, 4); t.rect(0, 32, 96, 8, 15); t.rect(0, 32, 96, 1, 7); t.rect(0, 38, 96, 2, 9); // reborde
  for (let k = 0; k < 8; k++) { const x = k * 12; t.rect(x, 4, 1, 26, 4); t.rect(x + 5, 8 + (k * 3 % 5), 1, 5, 10); t.rect(x + 9, 17 + (k * 5 % 6), 1, 4, 4); }
  // puerta
  t.rect(50, 14, 9, 18, 2); t.rect(51, 15, 7, 17, 4); t.rect(51, 15, 7, 1, 15); t.rect(54, 16, 1, 16, 2); t.px(56, 23, 10); t.rect(49, 13, 11, 1, 15); t.rect(49, 13, 1, 19, 15); t.rect(59, 13, 1, 19, 15);
  // ventanas redondas
  for (const x of [29, 77]) { t.disc(x, 16, 4, 15); t.disc(x, 16, 3, 1); t.rect(x - 3, 16, 7, 1, 15); t.rect(x, 13, 1, 7, 15); t.px(x - 2, 14, 12); t.px(x - 1, 14, 12); t.px(x + 2, 18, 12); }
  // jardinera bajo ventana
  for (const x of [25, 73]) { t.rect(x, 22, 9, 2, 4); t.px(x + 1, 21, 11); t.px(x + 4, 20, 11); t.px(x + 4, 21, 3); t.px(x + 7, 21, 11); t.px(x + 4, 19, 14); }
  // tapa/tejado [96,0,32,32]
  t.rect(96, 0, 32, 32, 4); t.disc(111.5, 15.5, 14, 9); t.ring(111.5, 15.5, 14, 4, 1); t.ring(111.5, 15.5, 9, 4, 1); t.disc(111.5, 15.5, 3, 2); t.disc(111.5, 15.5, 1.5, 0);
  t.rect(104, 6, 4, 1, 10); t.rect(103, 7, 1, 3, 10);
  // ── poste de madera [96,32,8,32] y cuerda [104,32,8,32] ──
  t.rect(96, 32, 8, 32, 4); t.rect(96, 32, 1, 32, 2); t.rect(103, 32, 1, 32, 2); t.rect(98, 34, 1, 10, 9); t.rect(100, 48, 1, 9, 9); t.px(101, 40, 2); t.px(98, 58, 2);
  t.rect(104, 32, 8, 32, 15); for (let y = 32; y < 64; y += 3) { t.line(104, y + 2, 111, y, 9); }
  // ── cubo [112,32,16,16] lado, [112,48,16,16] boca ──
  t.rect(112, 32, 16, 16, 4); t.rect(112, 34, 16, 2, 5); t.rect(112, 42, 16, 2, 5); for (let x = 113; x < 128; x += 4) t.rect(x, 32, 1, 16, 2); t.rect(112, 32, 16, 1, 9);
  t.rect(112, 48, 16, 16, 4); t.disc(119.5, 55.5, 6, 2); t.disc(119.5, 55.5, 5, 1);
  // ── brocal del pozo [0,40,64,16] y tejadillo [64,40,32,16] ──
  t.rect(0, 40, 64, 16, 6); t.rect(0, 40, 64, 2, 7); t.rect(0, 47, 64, 1, 13); t.rect(0, 55, 64, 1, 5);
  for (let x = 0; x < 64; x += 8) { t.rect(x + 3, 42, 1, 5, 13); t.rect(x + 7, 48, 1, 7, 13); t.rect(x, 48, 2, 1, 7); }
  t.rect(4, 50, 3, 3, 3); t.px(5, 50, 11); t.rect(37, 44, 2, 2, 3);
  t.rect(64, 40, 32, 16, 8); for (let j = 0; j < 4; j++) { t.rect(64, 43 + j * 4, 32, 1, 2); for (let x = (j % 2) * 4; x < 32; x += 8) t.rect(64 + x, 40 + j * 4, 1, 3, 2); } t.rect(66, 40, 4, 1, 14); t.rect(80, 44, 4, 1, 14);
  // ── cofre: frente [0,56,24,14], lado [24,56,14,14], tapa arriba [0,70,24,14], frente tapa [38,56,24,6], lado tapa [38,62,14,6], dentro [38,68,10,10] ──
  const wood = (x, y, w, h) => { t.rect(x, y, w, h, 4); for (let j = y + 3; j < y + h; j += 4) t.rect(x, j, w, 1, 2); t.box(x, y, w, h, 9); t.rect(x + 1, y + 1, w - 2, 1, 10); };
  wood(0, 56, 24, 14); t.rect(3, 56, 2, 14, 9); t.rect(19, 56, 2, 14, 9); t.rect(10, 56, 4, 6, 10); t.rect(11, 58, 2, 3, 0); t.px(11, 57, 7);
  wood(24, 56, 14, 14); t.rect(30, 56, 2, 14, 9);
  wood(0, 70, 24, 14); t.rect(3, 70, 2, 14, 9); t.rect(19, 70, 2, 14, 9); t.rect(10, 74, 4, 6, 10); t.rect(11, 75, 2, 2, 12); t.rect(11, 77, 2, 2, 12); t.px(11, 76, 7);
  wood(38, 56, 24, 6); t.rect(41, 56, 2, 6, 9); t.rect(57, 56, 2, 6, 9); t.rect(48, 59, 4, 3, 10);
  wood(38, 62, 14, 6);
  t.rect(38, 68, 10, 10, 1); t.box(38, 68, 10, 10, 2); t.rect(41, 71, 4, 4, 0);
  // ── cartel [64,56,32,24] ──
  t.rect(64, 56, 32, 24, 4); t.box(64, 56, 32, 24, 2); t.rect(65, 57, 30, 1, 9); t.rect(66, 59, 28, 18, 15);
  for (const [y, w] of [[62, 22], [65, 18], [68, 24], [71, 14]]) t.rect(68, y, w, 1, 4); t.px(92, 74, 8); t.px(91, 73, 8); t.px(93, 73, 8);
  t.rect(96, 64, 16, 16, 4); for (let y = 67; y < 80; y += 4) t.rect(96, y, 16, 1, 2);
  // ── tinaja [64,80,48,24] (8×6) y boca [112,64,16,16] ──
  t.rect(64, 80, 48, 24, 15); t.rect(64, 80, 48, 3, 9); t.rect(64, 83, 48, 1, 4); t.rect(64, 100, 48, 4, 9); t.rect(64, 102, 48, 2, 4);
  t.rect(64, 88, 48, 5, 12); t.rect(64, 88, 48, 1, 1); t.rect(64, 92, 48, 1, 1);
  for (let x = 64; x < 112; x += 6) { t.px(x + 1, 90, 7); t.px(x + 3, 89, 7); t.px(x + 3, 91, 7); t.px(x + 5, 90, 1); t.px(x + 2, 96, 9); }
  t.rect(66, 85, 2, 2, 7);
  t.rect(112, 64, 16, 16, 9); t.disc(119.5, 71.5, 6, 4); t.disc(119.5, 71.5, 4.5, 0);
  // ── la Plañidera [0,88,64,40]: 8 franjas de 8; cara en 3–4 (x 24..39) ──
  t.rect(0, 88, 64, 40, 6); t.rect(0, 88, 64, 3, 13); t.rect(0, 120, 64, 8, 13); t.rect(0, 120, 64, 1, 5); t.rect(0, 126, 64, 2, 5);
  for (let k = 0; k < 8; k++) { const x = k * 8; t.rect(x, 91, 1, 29, 13); t.rect(x + 4, 96 + (k * 3 % 5), 1, 9, 7); }
  // capucha
  t.rect(18, 92, 28, 1, 13); t.rect(18, 92, 1, 16, 13); t.rect(45, 92, 1, 16, 13); t.rect(20, 94, 24, 14, 5); t.rect(20, 94, 24, 1, 1);
  // ojos cerrados y surcos de lágrima (se pintan de azul cuando llora)
  t.rect(24, 100, 5, 1, 0); t.rect(35, 100, 5, 1, 0); t.px(24, 99, 0); t.px(39, 99, 0); t.rect(30, 104, 4, 1, 0); t.px(29, 105, 0); t.px(34, 105, 0);
  t.rect(26, 101, 1, 12, 1); t.rect(37, 101, 1, 12, 1);
  // manos juntas
  t.rect(26, 110, 12, 5, 7); t.rect(26, 114, 12, 1, 13); t.rect(31, 110, 1, 5, 13); t.rect(22, 113, 4, 2, 13); t.rect(38, 113, 4, 2, 13);
  // musgo
  t.rect(3, 118, 4, 2, 3); t.px(4, 117, 11); t.rect(52, 119, 3, 1, 3); t.rect(57, 96, 2, 2, 3);
  // ── cebollino [64,104,16,24] y con flor [80,104,16,24] ──
  const chive = (x, fl) => {
    for (const [dx, h, c] of [[2, 20, 11], [5, 23, 11], [8, 18, 3], [11, 22, 11], [13, 15, 3]]) { t.rect(x + dx, 128 - h, 2, h, c); t.rect(x + dx + 1, 128 - h, 1, h, c === 11 ? 3 : 1); t.px(x + dx, 128 - h, 10); }
    if (fl) { t.disc(x + 6, 107, 3, 14); t.px(x + 5, 105, 7); t.px(x + 7, 108, 2); t.px(x + 4, 108, 2); t.disc(x + 12, 110, 2, 13); t.px(x + 12, 109, 7); }
  };
  chive(64, false); chive(80, true);
  // ── lágrima [96,104,16,16] (4 caras de 4) y anillo [112,104,16,16] ──
  t.rect(96, 104, 16, 16, 12); t.rect(96, 104, 4, 16, 7); t.rect(100, 104, 4, 16, 12); t.rect(104, 104, 4, 16, 1); t.rect(108, 104, 4, 16, 12); t.rect(97, 106, 2, 3, 12); t.rect(101, 107, 1, 4, 7);
  t.rect(112, 104, 16, 16, 11); t.rect(112, 104, 16, 4, 10); t.rect(112, 116, 16, 4, 3); for (let x = 112; x < 128; x += 4) t.px(x + 1, 110, 7);
  // ── farol [112,80,16,24] ──
  t.rect(112, 80, 16, 24, 10); t.rect(112, 80, 16, 3, 5); t.rect(112, 100, 16, 4, 5); t.rect(112, 80, 1, 24, 5); t.rect(120, 83, 1, 17, 5); t.rect(116, 88, 2, 3, 7); t.rect(123, 93, 2, 2, 7); t.px(117, 95, 9); t.px(124, 87, 9);
  // sobras: estaca [96,120,8,8], tela bandera [104,120,12,8]
  t.rect(96, 120, 8, 8, 15); t.rect(96, 120, 1, 8, 9);
  t.rect(104, 120, 12, 8, 11); t.rect(104, 120, 12, 1, 10); t.rect(108, 122, 1, 4, 7); t.rect(107, 123, 3, 1, 7); t.px(106, 122, 3); t.px(110, 122, 3);
  return (_A = { t, tex: texFrom(t) });
}
let _mA = null, _mAd = null;
const mA = () => _mA || (_mA = mat(sheetA().tex));
const mAd = () => _mAd || (_mAd = mat(sheetA().tex, { double: true, bias: -0.3 }));
let _mCh = null; const mCh = () => _mCh || (_mCh = mat(sheetA().tex, { double: true, bias: -1.1 }));
let _mT = null; export const tileModelMat = () => _mT || (_mT = mat(tilesTex()));
export const tileModelMatNew = (o) => mat(tilesTex(), o);

// casa-maceta: una maceta boca abajo con puerta. swap = [de, a] para variar el barro
export function makeHouse(o = {}) {
  const s = o.s || 1, m = o.swap ? mat(sheetA().tex) : mA();
  if (o.swap) { m.uniforms.uSwapA.value = 9; m.uniforms.uSwapB.value = o.swap; }
  const g = new THREE.Group();
  const prof = [[1.62, 0], [1.66, 0.42], [1.5, 0.5], [1.18, 2.3], [1.1, 2.45]];
  g.add(new MB().lathe(prof.map(p => [p[0] * s, p[1] * s]), 8, [0, 0, 96, 40], { capT: [96, 0, 32, 32] }).mesh(m));
  // brote-chimenea
  const b = new MB(); b.shade = 0;
  b.push().move(0.3 * s, 2.45 * s, 0.1 * s).rotY(0.6).card(0.34 * s, 0.9 * s, [64, 104, 16, 24]).rotY(1.57).card(0.34 * s, 0.9 * s, [64, 104, 16, 24]).pop();
  g.add(b.mesh(mAd()));
  return { g, t: sheetA().t, r: 1.66 * s, h: 2.45 * s };
}
export function makeWell() {
  const g = new THREE.Group(), b = new MB();
  // brocal: anillo exterior + interior oscuro + canto
  b.lathe([[1.15, 0], [1.2, 0.2], [1.1, 0.75]], 8, [0, 40, 64, 16]);
  b.flip = true; b.lathe([[0.8, -1.5], [0.8, 0.75]], 8, [0, 40, 64, 16]); b.flip = false;
  const n = 8, st = Math.PI * 2 / n, a0 = -Math.PI - st / 2;
  for (let i = 0; i < n; i++) { const A = a0 + i * st, B = A + st; const p = (r, a) => [Math.sin(a) * r, 0.75, Math.cos(a) * r]; b.quad(p(0.8, A), p(1.1, A), p(1.1, B), p(0.8, B), [i * 8, 40, 8, 3]); }
  // postes y travesaño
  for (const x of [-1.0, 1.0]) b.push().move(x, 0.6, 0).box(0.16, 1.7, 0.16, [96, 32, 8, 32]).pop();
  b.push().move(0, 2.2, 0).rotZ(Math.PI / 2).move(0, -1.15, 0).box(0.12, 2.3, 0.12, [96, 32, 8, 32]).pop();
  // tejadillo a dos aguas
  b.quad([-1.3, 2.9, 0], [-1.3, 2.25, 0.75], [1.3, 2.25, 0.75], [1.3, 2.9, 0], [64, 40, 32, 16]);
  b.quad([1.3, 2.9, 0], [1.3, 2.25, -0.75], [-1.3, 2.25, -0.75], [-1.3, 2.9, 0], [64, 40, 32, 16]);
  b.tri([-1.3, 2.9, 0], [-1.3, 2.25, -0.75], [-1.3, 2.25, 0.75], [96, 32], [96, 40], [104, 40]);
  b.tri([1.3, 2.9, 0], [1.3, 2.25, 0.75], [1.3, 2.25, -0.75], [96, 32], [96, 40], [104, 40]);
  g.add(b.mesh(mAd()));
  // cuerda y cubo (se mueven)
  const rope = new MB().push().move(0, 0, 0).box(0.05, 1, 0.05, [104, 32, 8, 32]).pop().mesh(mA());
  const bucket = new THREE.Group();
  bucket.add(new MB().lathe([[0.3, 0], [0.38, 0.5]], 8, [112, 32, 16, 16], { capB: [112, 48, 16, 16] }).mesh(mAd()));
  bucket.add(new MB().push().move(0, 0.42, 0).lathe([[0.001, 0], [0.34, 0]], 8, [112, 48, 16, 16]).pop().mesh(mAd()));
  g.add(rope, bucket);
  const W = { g, rope, bucket, t: sheetA().t, setBucket(y) { bucket.position.y = y; rope.position.y = y + 0.5; rope.scale.y = Math.max(0.01, 2.2 - (y + 0.5)); } };
  W.setBucket(1.1);
  return W;
}
export function makeChest(o = {}) {
  const big = !!o.big, s = big ? 1.3 : 1, m = big ? mat(sheetA().tex) : mA();
  if (big) { m.uniforms.uSwapA.value = 4; m.uniforms.uSwapB.value = 8; }
  const g = new THREE.Group();
  g.add(new MB().box(0.95 * s, 0.5 * s, 0.6 * s, { f: [0, 56, 24, 14], b: [0, 56, 24, 14], l: [24, 56, 14, 14], r: [24, 56, 14, 14], t: [38, 68, 10, 10] }).mesh(m));
  const lid = new THREE.Group(); lid.position.set(0, 0.5 * s, -0.3 * s);
  const lm = new MB(); lm.push().move(0, 0, 0.3 * s).box(0.95 * s, 0.26 * s, 0.6 * s, { f: [38, 56, 24, 6], b: [38, 56, 24, 6], l: [38, 62, 14, 6], r: [38, 62, 14, 6], t: [0, 70, 24, 14], d: [38, 68, 10, 10] }, { top: [0.9, 0.7] }).pop();
  lid.add(lm.mesh(m)); g.add(lid);
  const sh = blob(1.3 * s, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, lid, t: sheetA().t, m };
}
export function makePot() {
  const g = new THREE.Group();
  g.add(new MB().lathe([[0.2, 0], [0.36, 0.12], [0.4, 0.42], [0.3, 0.62], [0.22, 0.68], [0.28, 0.76]], 8, [64, 80, 48, 24], { capB: [112, 64, 16, 16] }).mesh(mAd()));
  g.add(new MB().push().move(0, 0.7, 0).lathe([[0.001, 0], [0.24, 0]], 8, [112, 64, 16, 16]).pop().mesh(mAd()));
  const sh = blob(0.9, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, t: sheetA().t };
}
export function makeSign() {
  const g = new THREE.Group(), b = new MB();
  b.push().move(0, 0, 0).box(0.12, 0.75, 0.12, [96, 32, 8, 32]).pop();
  b.push().move(0, 0.62, 0).box(1.0, 0.72, 0.1, { f: [64, 56, 32, 24], b: [96, 64, 16, 16], l: [96, 64, 4, 16], r: [96, 64, 4, 16], t: [96, 64, 16, 4], d: [96, 64, 16, 4] }).pop();
  g.add(b.mesh(mA()));
  const sh = blob(0.9, 0.45); sh.position.y = 0.02; g.add(sh);
  return { g, t: sheetA().t };
}
// la Plañidera: estatua encapuchada que llora cuando huele cebolla
export function makeStatue() {
  const t0 = sheetA().t, t = new Tex(128, 128); t.d.set(t0.d);
  const tex = texFrom(t), m = mat(tex);
  const g = new THREE.Group();
  g.add(new MB().lathe([[0.62, 0], [0.66, 0.22], [0.5, 0.3], [0.56, 1.0], [0.5, 1.5], [0.34, 1.85], [0.12, 2.02], [0.001, 2.06]], 8, [0, 88, 64, 40]).mesh(m));
  const sh = blob(1.5, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, t, tex, m, cry(on) { const c = on ? 12 : 1; t.rect(26, 101, 1, 12, c); t.rect(37, 101, 1, 12, c); if (on) { t.px(26, 103, 7); t.px(37, 106, 7); t.rect(24, 100, 5, 1, 12); t.rect(35, 100, 5, 1, 12); } else { t.rect(24, 100, 5, 1, 0); t.rect(35, 100, 5, 1, 0); } texUpdate(tex); } };
}
export function makeChive(flower = false) {
  const g = new THREE.Group(), r = flower ? [80, 104, 16, 24] : [64, 104, 16, 24];
  const b = new MB();
  for (let i = 0; i < 3; i++) b.push().rotY(i * 1.05 + 0.3).card(0.8, 1.0, r).pop();
  const me = b.mesh(mCh()); g.add(me);
  return { g, mesh: me, t: sheetA().t };
}
export function makeTear(big = false) {
  const m = mat(sheetA().tex, { unlit: true });
  if (big) { m.uniforms.uSwapA.value = 12; m.uniforms.uSwapB.value = 14; }
  const g = new THREE.Group();
  const me = new MB().lathe([[0.001, 0], [0.16, 0.14], [0.13, 0.26], [0.001, 0.52]], 4, [96, 104, 16, 16]).mesh(m);
  me.scale.setScalar(big ? 1.3 : 0.9); g.add(me);
  const sh = blob(0.4, 0.5); g.add(sh);
  return { g, me, sh, t: sheetA().t };
}
export function makeRing() {
  const m = mat(sheetA().tex, { unlit: true, double: true });
  const g = new THREE.Group(), b = new MB();
  b.lathe([[0.2, -0.05], [0.3, 0], [0.2, 0.05]], 8, [112, 104, 16, 16]);
  b.flip = true; b.lathe([[0.2, -0.05], [0.14, 0], [0.2, 0.05]], 8, [112, 104, 16, 16]); b.flip = false;
  const me = b.mesh(m); me.rotation.x = Math.PI / 2; me.position.y = 0.4; const sp = new THREE.Group(); sp.add(me); g.add(sp);
  const sh = blob(0.45, 0.5); g.add(sh);
  return { g, me: sp, sh, t: sheetA().t };
}
export function makeLantern() {
  const g = new THREE.Group(), b = new MB();
  b.push().box(0.1, 1.5, 0.1, [96, 32, 8, 32]).pop();
  g.add(b.mesh(mA()));
  const jar = new MB().push().move(0, 1.5, 0).box(0.34, 0.46, 0.34, { f: [112, 80, 16, 24], b: [112, 80, 16, 24], l: [112, 80, 16, 24], r: [112, 80, 16, 24], t: [112, 80, 16, 3], d: [112, 80, 16, 3] }, { top: [0.75, 0.75] }).pop().mesh(mat(sheetA().tex, { unlit: true }));
  g.add(jar);
  return { g, t: sheetA().t };
}
export function makeFlag() {
  const g = new THREE.Group(), b = new MB();
  b.box(0.07, 1.25, 0.07, [96, 120, 8, 8]);
  b.push().move(0.26, 0.85, 0).card(0.5, 0.36, [104, 120, 12, 8]).pop();
  g.add(b.mesh(mAd()));
  return { g, t: sheetA().t };
}

// piezas de mazmorra hechas con la hoja de baldosas
export function tileBox(w, h, d, tiles, o = {}) {
  const c = k => cell(tiles[k] ?? tiles.all);
  return new MB().box(w, h, d, { f: c('f'), b: c('b'), l: c('l'), r: c('r'), t: c('t'), d: c('d') }, o);
}

// ── hoja B: objetos de la aventura ──
export function sheetB() {
  if (_B) return _B;
  const t = new Tex(128, 128);
  // mondador: mango [0,0,16,32] (4 caras de 4), hoja de acero [16,0,16,32]
  t.rect(0, 0, 16, 32, 8); for (let k = 0; k < 4; k++) { t.rect(k * 4, 0, 1, 32, 2); } t.rect(0, 0, 16, 3, 10); t.rect(0, 28, 16, 4, 10); t.rect(0, 30, 16, 2, 9); t.rect(1, 6, 1, 14, 14); t.rect(9, 10, 1, 12, 14);
  t.rect(16, 0, 16, 32, 6); t.rect(16, 0, 16, 2, 7); t.rect(16, 0, 2, 32, 7); t.rect(30, 0, 2, 32, 13); t.erase(21, 6, 6, 20); t.box(20, 5, 8, 22, 13); t.rect(20, 5, 1, 22, 7); t.rect(21, 15, 6, 1, 5);
  // llave mayor [32,0,24,40]
  t.rect(32, 0, 24, 40, T); t.erase(32, 0, 24, 40);
  t.ring(43.5, 9.5, 8, 10, 3); t.ring(43.5, 9.5, 8, 9, 1); t.ring(43.5, 9.5, 5, 9, 1); t.disc(43.5, 9.5, 2, 8); t.px(43, 9, 14);
  t.rect(42, 17, 4, 20, 10); t.rect(45, 17, 1, 20, 9); t.rect(42, 17, 1, 20, 7); t.rect(46, 28, 5, 3, 10); t.rect(46, 33, 4, 3, 10); t.rect(46, 30, 5, 1, 9); t.rect(46, 35, 4, 1, 9); t.px(39, 4, 7); t.px(40, 3, 7);
  // anillo de capa [56,0,32,16] (8×4) y canto [56,16,32,8]
  t.rect(56, 0, 32, 16, 10); t.rect(56, 0, 32, 3, 7); t.rect(56, 12, 32, 4, 9); for (let x = 56; x < 88; x += 4) { t.px(x + 1, 6, 7); t.rect(x + 3, 3, 1, 9, 9); }
  t.rect(56, 16, 32, 8, 9); t.rect(56, 16, 32, 2, 4);
  // cubo de luz / rayo [88,0,16,32]
  t.rect(88, 0, 16, 32, 10); t.rect(92, 0, 8, 32, 7);
  // sol [0,40,32,32] y tira de piel en el cielo [32,40,64,24]
  t.erase(0, 40, 32, 32); t.disc(15.5, 55.5, 11, 10); t.disc(15.5, 55.5, 8, 7); for (let a = 0; a < 8; a++) { const x = 15.5 + Math.cos(a * 0.785) * 14, y = 55.5 + Math.sin(a * 0.785) * 14; t.rect(x - 0.5, y - 0.5, 2, 2, 10); }
  t.rect(32, 40, 64, 24, 15); t.rect(32, 40, 64, 3, 9); t.rect(32, 61, 64, 3, 4); for (let x = 32; x < 96; x += 7) t.line(x, 43, x + 3, 60, 9); t.rect(40, 48, 9, 1, 7); t.rect(70, 54, 12, 1, 7);
  // gota grande para la fuente [96,40,16,24]
  t.erase(96, 40, 32, 24); t.spr(['....cc....', '....cc....', '...cccc...', '...c7cc...', '..c77ccc..', '..c7cccc..', '.ccccccc1.', '.cccccc11.', '.ccccc111.', '..ccc111..', '...1111...'], 99, 44);
  return (_B = { t, tex: texFrom(t) });
}
export function makeMondador() {
  const m = mat(sheetB().tex, { double: true }), g = new THREE.Group(), b = new MB();
  b.lathe([[0.07, 0], [0.09, 0.08], [0.075, 0.5], [0.09, 0.56]], 4, [0, 0, 16, 32], { phase: 0.5, capB: [0, 28, 4, 4], capT: [0, 0, 4, 3] });
  b.push().move(0, 0.56, 0).card(0.24, 0.62, [16, 0, 16, 32]).pop();
  const me = b.mesh(m); me.position.y = -0.55; const p = new THREE.Group(); p.add(me); p.rotation.z = -0.5; g.add(p);
  return { g, t: sheetB().t };
}
export function makeKey() {
  const m = mat(sheetB().tex, { double: true }), g = new THREE.Group(), b = new MB();
  b.push().move(0, -0.5, 0.02).card(0.6, 1.0, [32, 0, 24, 40]).pop(); b.push().move(0, -0.5, -0.02).card(0.6, 1.0, [32, 0, 24, 40]).pop();
  g.add(b.mesh(m)); return { g, t: sheetB().t };
}
export function makeCapa() {
  const m = mat(sheetB().tex, { double: true }), g = new THREE.Group(), b = new MB();
  b.lathe([[0.42, -0.1], [0.5, 0], [0.42, 0.1]], 8, [56, 0, 32, 16]);
  b.flip = true; b.lathe([[0.42, -0.1], [0.34, 0], [0.42, 0.1]], 8, [56, 16, 32, 8]); b.flip = false;
  const me = b.mesh(m); me.rotation.x = 1.2; g.add(me); return { g, t: sheetB().t };
}
// sol y tira de piel del cielo (carteles lejanos, sin luz ni niebla)
export function makeSkyCard(rect, w, h) {
  const m = mat(sheetB().tex, { unlit: true, noFog: true, double: true, depthWrite: false });
  const me = new MB().card(w, h, rect, { y: -h / 2 }).mesh(m); me.renderOrder = -50; return me;
}
export function makeBeam(h = 6, r = 0.6) {
  const m = mat(sheetB().tex, { unlit: true, depthWrite: false, noFog: true });
  const me = new MB().lathe([[r, 0], [r * 0.7, h]], 8, [88, 0, 16, 32]).mesh(m); me.renderOrder = 6; return me;
}
