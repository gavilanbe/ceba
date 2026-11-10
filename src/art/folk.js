// folk.js — vecinos de Villa Ristra y plagas de Bulbo.
import { Tex, T } from '../px.js';
import { MB, mat, texFrom, THREE, blob } from '../gfx.js';

const eye = (t, x, y, k = 'o') => {
  if (k === 'o') { t.rect(x, y, 3, 4, 0); t.px(x, y, 7); }
  else if (k === '-') { t.rect(x, y + 2, 3, 1, 0); }
  else if (k === '^') { t.px(x, y + 2, 0); t.px(x + 1, y + 1, 0); t.px(x + 2, y + 2, 0); }
  else if (k === 'L') { t.rect(x, y + 1, 3, 3, 0); t.px(x, y, 0); t.px(x + 1, y + 1, 7); }       // ceño (izq)
  else if (k === 'R') { t.rect(x, y + 1, 3, 3, 0); t.px(x + 2, y, 0); t.px(x + 1, y + 1, 7); }   // ceño (der)
  else if (k === 'O') { t.rect(x - 1, y - 1, 5, 6, 7); t.rect(x, y, 3, 4, 0); t.px(x, y, 7); }
};

let _C = null;
export function sheetC() {
  if (_C) return _C;
  const t = new Tex(128, 128);
  // ── el Consejo: cabeza de ajo [0,0,96,40], un diente por franja, tres con cara ──
  t.rect(0, 0, 96, 40, 7);
  t.rect(0, 0, 96, 4, 15); t.rect(0, 4, 96, 1, 9);
  t.rect(0, 35, 96, 5, 15); t.rect(0, 38, 96, 2, 4);
  for (let k = 0; k < 8; k++) {
    const x = k * 12;
    t.rect(x, 5, 1, 30, 13); t.rect(x + 11, 5, 1, 30, 6);
    t.rect(x + 3, 6, 1, 8, 2); t.rect(x + 7, 5, 1, 5, 2); t.rect(x + 5, 8, 1, 4, 13);
    t.rect(x + 2, 30, 8, 1, 6); t.px(x + 2, 6, 7);
    for (let i = 2; i < 11; i += 3) t.rect(x + i, 38, 1, 2, 9);
  }
  // caras: diente 3 dormilón, 4 serio con bigote, 5 risueño
  eye(t, 38, 17, '-'); eye(t, 43, 17, '-'); t.rect(40, 24, 3, 1, 0); t.px(45, 13, 12); t.px(46, 12, 12);
  eye(t, 50, 16, 'L'); eye(t, 55, 16, 'R'); t.rect(49, 22, 10, 2, 6); t.rect(49, 22, 10, 1, 13); t.rect(53, 25, 2, 1, 0); t.rect(49, 14, 4, 1, 13); t.rect(55, 14, 4, 1, 13);
  eye(t, 62, 17, '^'); eye(t, 67, 17, '^'); t.rect(63, 23, 6, 1, 0); t.rect(64, 24, 4, 1, 8); t.rect(61, 21, 2, 1, 14); t.rect(69, 21, 2, 1, 14);
  // penacho seco [96,0,16,24]
  t.erase(96, 0, 16, 24); for (const [dx, h] of [[1, 20], [4, 24], [7, 17], [10, 22], [13, 15]]) { t.rect(96 + dx, 24 - h, 2, h, 15); t.rect(97 + dx, 24 - h, 1, h, 9); }
  // ── Sargento Puerro [0,40,72,44]: 6 franjas de 12; cara en la 3 (x 36..47) ──
  t.rect(0, 40, 72, 44, 7); t.rect(0, 40, 72, 16, 11); t.rect(0, 40, 72, 3, 3);
  for (let x = 0; x < 72; x += 4) { t.rect(x + 1, 56, 2, 2 + (x % 3), 11); }
  for (let k = 0; k < 6; k++) { const x = k * 12; t.rect(x, 43, 1, 41, 6); t.rect(x + 6, 41, 1, 14, 3); t.rect(x + 3, 62, 1, 12, 6); }
  t.rect(0, 80, 72, 4, 15); for (let x = 1; x < 72; x += 3) t.rect(x, 81, 1, 3, 4);
  eye(t, 38, 62, 'L'); eye(t, 43, 62, 'R'); t.rect(37, 60, 4, 1, 3); t.rect(43, 60, 4, 1, 3);
  t.rect(37, 68, 10, 2, 4); t.rect(36, 69, 2, 2, 4); t.rect(46, 69, 2, 2, 4); t.rect(41, 71, 2, 1, 0);
  // casco de cáscara de nuez [72,40,24,12] y penacho de hojas [96,24,16,40]
  t.rect(72, 40, 24, 12, 4); t.rect(72, 40, 24, 2, 9); t.rect(72, 50, 24, 2, 2); for (let x = 72; x < 96; x += 5) t.line(x, 42, x + 2, 49, 2); t.rect(82, 43, 4, 4, 10); t.rect(83, 44, 2, 2, 8);
  t.erase(96, 24, 16, 40); for (const [dx, h, c] of [[1, 34, 3], [5, 40, 11], [9, 36, 3], [12, 28, 11]]) { t.rect(96 + dx, 64 - h, 3, h, c); t.rect(97 + dx, 64 - h + 2, 1, h - 2, c === 11 ? 3 : 1); t.px(96 + dx, 64 - h, 10); }
  // lanza-palillo [112,0,8,40] y punta
  t.rect(112, 0, 8, 40, 15); t.rect(112, 0, 1, 40, 9); t.rect(119, 0, 1, 40, 9); t.rect(112, 0, 8, 5, 6); t.rect(112, 0, 8, 2, 7); t.rect(112, 5, 8, 1, 8);
  // ── Chalota [72,52,56,32]: 8×7; cara en 3–5 (x 93..113) ──
  t.rect(72, 52, 56, 32, 14); t.rect(72, 52, 56, 4, 4); t.rect(72, 56, 56, 1, 2); t.rect(72, 79, 56, 5, 2); t.rect(72, 82, 56, 2, 4);
  for (let k = 0; k < 8; k++) { const x = 72 + k * 7; t.rect(x, 57, 1, 22, 2); t.rect(x + 3, 60 + (k * 3 % 5), 1, 6, 15); }
  eye(t, 96, 64, 'o'); eye(t, 104, 64, 'o'); t.rect(99, 71, 5, 1, 0); t.px(98, 70, 0); t.px(104, 70, 0); t.rect(93, 69, 2, 1, 8); t.rect(108, 69, 2, 1, 8);
  // pañuelo: banda azul bajo la cara
  t.rect(72, 74, 56, 3, 12); t.rect(72, 74, 56, 1, 7); for (let x = 73; x < 128; x += 4) t.px(x, 75, 1);
  // ── cebolleta [0,84,64,28]: 8×8; cara en 3–5 (x 24..47) ──
  t.rect(0, 84, 64, 28, 7); t.rect(0, 84, 64, 7, 11); t.rect(0, 84, 64, 2, 3); for (let x = 0; x < 64; x += 3) t.rect(x, 91, 2, 1 + (x % 2), 11);
  t.rect(0, 107, 64, 5, 6); t.rect(0, 110, 64, 2, 15);
  for (let k = 0; k < 8; k++) { t.rect(k * 8, 92, 1, 16, 6); }
  eye(t, 27, 96, 'o'); eye(t, 35, 96, 'o'); t.rect(30, 103, 4, 1, 0); t.px(29, 102, 0); t.px(34, 102, 0); t.rect(24, 101, 2, 1, 14); t.rect(39, 101, 2, 1, 14); t.px(28, 94, 4); t.px(31, 93, 4); t.px(36, 94, 4);
  // tallos de cebolleta [64,84,8,28]
  t.rect(64, 84, 8, 28, 11); t.rect(64, 84, 1, 28, 3); t.rect(71, 84, 1, 28, 3); t.rect(67, 86, 1, 26, 3); t.rect(64, 84, 8, 2, 10);
  // ── Candela: cuerpo [0,112,16,8], farol [16,112,8,8], ala [24,112,8,8] ──
  t.rect(0, 112, 16, 8, 1); t.rect(0, 112, 16, 2, 8); t.rect(0, 114, 16, 1, 0); t.px(3, 116, 7); t.px(11, 116, 7); t.rect(2, 115, 3, 3, 0); t.rect(10, 115, 3, 3, 0); t.px(2, 115, 7); t.px(10, 115, 7);
  t.rect(16, 112, 8, 8, 10); t.rect(18, 114, 4, 4, 7);
  t.erase(24, 112, 8, 8); t.spr(['.777777.', '77666677', '7666667.', '.77777..'], 24, 114);
  // ── bicho bola [32,112,48,16] (8×6) ──
  t.rect(32, 112, 48, 16, 5); for (let y = 112; y < 128; y += 4) { t.rect(32, y, 48, 1, 6); t.rect(32, y + 3, 48, 1, 1); } t.rect(32, 112, 48, 2, 13);
  t.rect(53, 121, 2, 2, 0); t.rect(59, 121, 2, 2, 0); t.px(53, 121, 7); t.px(59, 121, 7);
  // mano genérica crema [80,112,10,10]
  t.rect(80, 112, 12, 10, 15); t.rect(80, 112, 12, 1, 7); t.rect(80, 120, 12, 2, 9);
  return (_C = { t, tex: texFrom(t) });
}
const mC = o => mat(sheetC().tex, o);

function npcBase(g, sq, extra = {}) {
  const sh = blob(extra.shadow || 1.2, 0.55); sh.position.y = 0.02; g.add(sh);
  return { g, sq, t: sheetC().t, ...extra };
}
export function makeAjo() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mC();
  sq.add(new MB().lathe([[0.25, 0], [0.8, 0.1], [1.02, 0.5], [0.92, 0.98], [0.5, 1.32], [0.18, 1.55], [0.12, 1.75]], 8, [0, 0, 96, 40], { capB: [0, 36, 8, 4] }).mesh(m));
  const b = new MB(); for (let i = 0; i < 3; i++) b.push().move(0, 1.7, 0).rotY(i * 1.05).card(0.5, 0.6, [96, 0, 16, 24]).pop();
  sq.add(b.mesh(mC({ double: true, bias: -0.3 })));
  return npcBase(g, sq, { shadow: 2.4, mats: [m], h: 1.9, r: 1.05 });
}
export function makePuerro() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mC(), md = mC({ double: true, bias: -0.3 });
  sq.add(new MB().lathe([[0.3, 0], [0.4, 0.12], [0.34, 0.4], [0.33, 1.75], [0.4, 1.95]], 6, [0, 40, 72, 44]).mesh(m));
  // casco
  sq.add(new MB().push().move(0, 1.93, 0).lathe([[0.46, 0], [0.4, 0.22], [0.2, 0.36], [0.001, 0.4]], 6, [72, 40, 24, 12]).pop().mesh(m));
  const b = new MB(); for (let i = 0; i < 3; i++) b.push().move(0, 2.2, 0).rotY(i * 1.05 + 0.5).rotX(0.1).card(0.5, 0.85, [96, 24, 16, 40]).pop();
  const crest = b.mesh(md); sq.add(crest);
  // lanza y mano
  const arm = new THREE.Group(); arm.position.set(0.62, 0, 0.1);
  arm.add(new MB().box(0.07, 2.7, 0.07, [112, 0, 8, 40]).mesh(m));
  arm.add(new MB().push().move(0, 1.05, 0).box(0.2, 0.17, 0.2, [80, 112, 10, 10]).pop().mesh(m));
  g.add(arm);
  return npcBase(g, sq, { shadow: 1.2, mats: [m], arm, crest, h: 2.4, r: 0.45 });
}
export function makeChalota() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mC();
  sq.add(new MB().lathe([[0.12, 0], [0.4, 0.08], [0.47, 0.42], [0.34, 0.8], [0.12, 1.05], [0.06, 1.18]], 8, [72, 52, 56, 32]).mesh(m));
  const b = new MB(); b.push().move(0, 1.1, 0).rotY(0.4).card(0.3, 0.4, [96, 0, 16, 24]).pop(); sq.add(b.mesh(mC({ double: true, bias: -0.3 })));
  return npcBase(g, sq, { shadow: 1.0, mats: [m], h: 1.2, r: 0.48 });
}
export function makeCebolleta(swap = null) {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mC(), md = mC({ double: true, bias: -0.3 });
  if (swap) { md.uniforms.uSwapA.value = 11; md.uniforms.uSwapB.value = swap; }
  sq.add(new MB().lathe([[0.1, 0], [0.3, 0.05], [0.35, 0.26], [0.22, 0.5], [0.15, 0.62]], 8, [0, 84, 64, 28]).mesh(m));
  const hair = new THREE.Group(); hair.position.y = 0.58; sq.add(hair);
  const b = new MB(); for (let i = 0; i < 3; i++) b.push().rotY(i * 2.1).rotX(0.35).card(0.15, 0.62, [64, 84, 8, 28]).pop();
  hair.add(b.mesh(md));
  return npcBase(g, sq, { shadow: 0.75, mats: [m], hair, h: 1.0, r: 0.36 });
}
export function makeCandela() {
  const g = new THREE.Group();
  const m = mC({ unlit: true, noFog: true }), mw = mC({ unlit: true, double: true, noFog: true });
  const body = new MB().push().rotX(Math.PI / 2).move(0, -0.09, 0).lathe([[0.001, 0], [0.07, 0.04], [0.075, 0.14], [0.05, 0.18]], 4, [0, 112, 16, 8], { phase: 0.5 }).pop().mesh(m);
  const tail = new MB().push().rotX(Math.PI / 2).move(0, -0.2, 0).lathe([[0.001, 0], [0.09, 0.06], [0.07, 0.12]], 4, [16, 112, 8, 8], { phase: 0.5 }).pop().mesh(m);
  const wl = new THREE.Group(), wr = new THREE.Group();
  wl.add(new MB().push().rotX(-Math.PI / 2).move(-0.11, 0, 0).card(0.22, 0.12, [24, 112, 8, 8], { y: -0.06 }).pop().mesh(mw));
  wr.add(new MB().push().rotX(-Math.PI / 2).move(0.11, 0, 0).card(0.22, 0.12, [24, 112, 8, 8], { y: -0.06, flipX: true }).pop().mesh(mw));
  wl.position.y = wr.position.y = 0.07;
  g.add(body, tail, wl, wr);
  return { g, wl, wr, tail, t: sheetC().t, mTail: m };
}
export function makeBicho() {
  const g = new THREE.Group(), m = mC();
  const walk = new MB().lathe([[0.3, 0], [0.3, 0.1], [0.18, 0.24], [0.001, 0.28]], 8, [32, 112, 48, 16], { sx: 0.8, sz: 1.25 }).mesh(m);
  const ball = new MB().lathe([[0.001, 0], [0.2, 0.06], [0.28, 0.25], [0.2, 0.44], [0.001, 0.5]], 8, [32, 112, 48, 16]).mesh(m);
  ball.geometry.translate(0, -0.25, 0); ball.position.y = 0.25; ball.visible = false;
  g.add(walk, ball);
  const sh = blob(0.7, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, walk, ball, t: sheetC().t };
}

// ───────────────────────── plagas ─────────────────────────
let _D = null;
export function sheetD() {
  if (_D) return _D;
  const t = new Tex(128, 128);
  // pulgón [0,0,48,24]: 8×6; cara en 3–5 (x 18..35)
  t.rect(0, 0, 48, 24, 11); t.rect(0, 0, 48, 3, 3); t.rect(0, 19, 48, 5, 3); t.rect(0, 22, 48, 2, 1);
  for (let k = 0; k < 8; k++) { t.rect(k * 6, 3, 1, 16, 3); t.px(k * 6 + 3, 6 + (k % 3) * 2, 10); }
  t.rect(19, 7, 5, 6, 7); t.rect(26, 7, 5, 6, 7); t.rect(21, 9, 2, 3, 0); t.rect(27, 9, 2, 3, 0); t.rect(19, 6, 5, 1, 8); t.rect(26, 6, 5, 1, 8); t.px(23, 7, 8); t.px(26, 7, 8);
  t.rect(22, 15, 6, 2, 0); t.px(23, 15, 7); t.px(26, 15, 7);
  // antena [48,0,8,16]
  t.erase(48, 0, 8, 16); t.line(51, 15, 53, 4, 3); t.rect(52, 2, 3, 3, 10); t.px(53, 2, 7);
  // babosa [0,24,64,24]: 8×8
  t.rect(0, 24, 64, 24, 15); t.rect(0, 24, 64, 4, 14); t.rect(0, 42, 64, 6, 7); t.rect(0, 46, 64, 2, 6); t.rect(0, 41, 64, 1, 14);
  for (let k = 0; k < 8; k++) { const x = k * 8; t.rect(x + 2, 29 + (k * 3 % 4), 2, 2, 14); t.rect(x + 5, 34 + (k * 5 % 5), 2, 2, 8); t.px(x + 1, 37, 7); }
  t.rect(26, 38, 12, 2, 2); t.rect(28, 40, 8, 1, 8);
  // tentáculo [64,24,8,16] y ojo [72,24,8,8]; ojo llorando [80,24,8,8]
  t.rect(64, 24, 8, 16, 14); t.rect(64, 24, 2, 16, 15); t.rect(70, 24, 2, 16, 8);
  t.rect(72, 24, 8, 8, 10); t.rect(74, 26, 4, 4, 0); t.px(74, 26, 7); t.rect(72, 24, 8, 1, 7);
  t.rect(80, 24, 8, 8, 12); t.rect(80, 27, 8, 2, 0); t.rect(82, 29, 1, 3, 7); t.rect(85, 29, 1, 3, 7);
  // trips [0,48,32,16] (4×8) y ala [32,48,16,16]
  t.rect(0, 48, 32, 16, 0); for (let y = 50; y < 64; y += 4) t.rect(0, y, 32, 2, 10); t.rect(0, 48, 32, 3, 8); t.px(3, 49, 7); t.px(11, 49, 7);
  t.erase(32, 48, 16, 16); for (let i = 0; i < 6; i++) { t.line(33, 56, 46, 50 + i * 2, i % 2 ? 6 : 7); } t.rect(33, 55, 6, 2, 7);
  // baba en proyectil [48,48,16,16]
  t.rect(48, 48, 16, 16, 11); t.rect(48, 48, 16, 4, 10); t.rect(48, 60, 16, 4, 3); t.rect(50, 52, 3, 3, 7);
  // ── Tapona [0,64,128,48]: 8×16 ──
  t.rect(0, 64, 128, 48, 8); t.rect(0, 64, 128, 6, 2); t.rect(0, 70, 128, 1, 14);
  t.rect(0, 100, 128, 12, 15); t.rect(0, 99, 128, 1, 2); t.rect(0, 108, 128, 4, 14);
  for (let k = 0; k < 8; k++) {
    const x = k * 16;
    t.rect(x, 71, 1, 28, 2);
    t.disc(x + 5, 78 + (k * 5 % 7), 2, 10); t.px(x + 4, 77 + (k * 5 % 7), 7);
    t.disc(x + 11, 88 + (k * 3 % 6), 1.5, 10);
    t.rect(x + 8, 74, 3, 1, 14); t.rect(x + 3, 93, 4, 1, 2);
  }
  // boca en las franjas 3–5 (x 48..95)
  t.rect(52, 84, 40, 14, 0); t.rect(54, 82, 36, 2, 0); t.rect(52, 84, 40, 1, 2);
  for (let x = 54; x < 90; x += 6) { t.rect(x, 84, 3, 4, 7); t.rect(x + 3, 94, 3, 4, 7); }
  t.rect(60, 90, 24, 4, 2); t.rect(64, 91, 16, 2, 14);
  // corona-tapón de corcho [0,112,32,16] y ojo grande [32,112,16,16], llorando [48,112,16,16], tentáculo [64,112,8,16]
  t.rect(0, 112, 32, 16, 15); t.rect(0, 112, 32, 2, 7); t.rect(0, 124, 32, 4, 9); for (const [x, y] of [[3, 116], [10, 119], [18, 115], [25, 120], [14, 122]]) t.rect(x, y, 2, 1, 4);
  t.rect(32, 112, 16, 16, 10); t.rect(32, 112, 16, 2, 7); t.rect(36, 116, 8, 9, 0); t.rect(37, 117, 3, 3, 7); t.rect(32, 126, 16, 2, 9);
  t.rect(48, 112, 16, 16, 12); t.rect(48, 112, 16, 2, 7); t.rect(50, 119, 12, 3, 0); t.rect(52, 122, 2, 6, 7); t.rect(58, 122, 2, 6, 7);
  t.rect(64, 112, 8, 16, 8); t.rect(64, 112, 2, 16, 14); t.rect(70, 112, 2, 16, 2);
  return (_D = { t, tex: texFrom(t) });
}
const mD = o => mat(sheetD().tex, o);

export function makePulgon() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mD(), md = mD({ double: true });
  sq.add(new MB().lathe([[0.12, 0.02], [0.32, 0.08], [0.37, 0.3], [0.25, 0.52], [0.08, 0.6]], 8, [0, 0, 48, 24]).mesh(m));
  const b = new MB(); b.push().move(-0.12, 0.5, 0.1).rotZ(0.3).card(0.2, 0.4, [48, 0, 8, 16]).pop(); b.push().move(0.12, 0.5, 0.1).rotZ(-0.3).card(0.2, 0.4, [48, 0, 8, 16], { flipX: true }).pop();
  const ant = b.mesh(md); sq.add(ant);
  const sh = blob(0.8, 0.55); sh.position.y = 0.02; g.add(sh);
  return { g, sq, sh, mats: [m, md], t: sheetD().t };
}
function slugBody(rect, s) {
  return new MB().lathe([[0.2, 0], [0.5, 0.04], [0.55, 0.26], [0.42, 0.5], [0.16, 0.62], [0.001, 0.64]], 8, rect, { sx: 0.78 * s, sz: 1.5 * s }).build().scale(1, s, 1);
}
export function makeBabosa() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mD(), mu = mD({ unlit: true });
  sq.add(new THREE.Mesh(slugBody([0, 24, 64, 24], 1), m));
  const stalks = [];
  for (const sx of [-0.16, 0.16]) {
    const st = new THREE.Group(); st.position.set(sx, 0.5, 0.5);
    st.add(new MB().box(0.07, 0.42, 0.07, [64, 24, 8, 16]).mesh(m));
    const e = new MB().push().move(0, 0.4, 0).box(0.16, 0.16, 0.16, [72, 24, 8, 8]).pop().mesh(mu); st.add(e);
    const ec = new MB().push().move(0, 0.4, 0).box(0.16, 0.16, 0.16, [80, 24, 8, 8]).pop().mesh(mu); ec.visible = false; st.add(ec);
    st.rotation.x = 0.35; sq.add(st); stalks.push({ st, e, ec });
  }
  const sh = blob(1.5, 0.55); sh.position.y = 0.02; sh.scale.set(1.1, 1, 1.9); g.add(sh);
  return { g, sq, stalks, mats: [m, mu], t: sheetD().t };
}
export function makeTrips() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mD(), md = mD({ double: true, unlit: true });
  sq.add(new MB().push().rotX(Math.PI / 2).move(0, -0.35, 0).lathe([[0.001, 0], [0.09, 0.1], [0.11, 0.4], [0.07, 0.6], [0.001, 0.72]], 4, [0, 48, 32, 16], { phase: 0.5 }).pop().mesh(m));
  const wl = new THREE.Group(), wr = new THREE.Group();
  wl.add(new MB().push().rotX(-Math.PI / 2).move(-0.26, 0, 0).card(0.5, 0.4, [32, 48, 16, 16], { y: -0.2, flipX: true }).pop().mesh(md));
  wr.add(new MB().push().rotX(-Math.PI / 2).move(0.26, 0, 0).card(0.5, 0.4, [32, 48, 16, 16], { y: -0.2 }).pop().mesh(md));
  wl.position.y = wr.position.y = 0.08; sq.add(wl, wr);
  const sh = blob(0.6, 0.45); g.add(sh);
  return { g, sq, wl, wr, sh, mats: [m, md], t: sheetD().t };
}
export function makeSlimeBall() {
  const m = mD({ unlit: true });
  return new MB().lathe([[0.001, -0.2], [0.18, -0.1], [0.2, 0.05], [0.001, 0.22]], 6, [48, 48, 16, 16]).mesh(m);
}
export function makeTapona() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mD(), mu = mD({ unlit: true });
  const S = 3.1;
  const body = new THREE.Mesh(slugBody([0, 64, 128, 48], S), m); sq.add(body);
  // corona de corcho: es el tapón del desagüe
  const cork = new MB().push().move(0, 0.6 * S, -0.1 * S).lathe([[0.26 * S, 0], [0.22 * S, 0.22 * S]], 8, [0, 112, 32, 16], { capT: [0, 112, 16, 12] }).pop().mesh(m);
  sq.add(cork);
  const stalks = [];
  for (const sx of [-0.5, 0.5]) {
    const st = new THREE.Group(); st.position.set(sx, 1.5, 1.35);
    st.add(new MB().box(0.2, 1.5, 0.2, [64, 112, 8, 16]).mesh(m));
    const e = new MB().push().move(0, 1.45, 0).box(0.56, 0.56, 0.56, [32, 112, 16, 16]).pop().mesh(mu); st.add(e);
    const ec = new MB().push().move(0, 1.45, 0).box(0.56, 0.56, 0.56, [48, 112, 16, 16]).pop().mesh(mu); ec.visible = false; st.add(ec);
    st.rotation.x = 0.3; sq.add(st); stalks.push({ st, e, ec });
  }
  const sh = blob(4.5, 0.6); sh.position.y = 0.03; sh.scale.set(3.4, 1, 5.6); g.add(sh);
  return { g, sq, body, cork, stalks, mats: [m, mu], t: sheetD().t, S };
}
