// pulpa.js — capítulo II: gente del Raigal (lombrices, el caracol), plagas del moho, Cavador, Don Mildiu y los objetos nuevos.
import { Tex, T } from '../px.js';
import { MB, mat, texFrom, THREE, blob } from '../gfx.js';
import { tilesTex, TI, cell } from './tiles.js';

const eye = (t, x, y, k = 'o') => {
  if (k === 'o') { t.rect(x, y, 3, 4, 0); t.px(x, y, 7); }
  else if (k === '^') { t.px(x, y + 2, 0); t.px(x + 1, y + 1, 0); t.px(x + 2, y + 2, 0); }
  else if (k === 'L') { t.rect(x, y + 1, 3, 3, 0); t.px(x, y, 0); t.px(x + 1, y + 1, 7); }
  else if (k === 'R') { t.rect(x, y + 1, 3, 3, 0); t.px(x + 2, y, 0); t.px(x + 1, y + 1, 7); }
  else if (k === 'O') { t.rect(x - 1, y - 1, 5, 6, 7); t.rect(x, y, 3, 4, 0); t.px(x, y, 7); }
};

let _E = null, _F = null;
// ── hoja E: gente y plagas ──
export function sheetE() {
  if (_E) return _E;
  const t = new Tex(128, 128);
  // lombriz [0,0,64,40]: 8 franjas de 8; cara en 3–4 (x 24..39); anillos; el clitelo es la faja clara
  t.rect(0, 0, 64, 40, 14); t.rect(0, 0, 64, 3, 8); t.rect(0, 36, 64, 4, 8); t.rect(0, 38, 64, 2, 2);
  for (let y = 5; y < 36; y += 5) t.rect(0, y, 64, 1, 8);
  t.rect(0, 20, 64, 5, 15); t.rect(0, 20, 64, 1, 7); t.rect(0, 25, 64, 1, 8);
  for (let k = 0; k < 8; k++) { t.px(k * 8 + 2, 7, 15); t.px(k * 8 + 5, 28, 15); t.px(k * 8 + 6, 12, 15); }
  eye(t, 31, 8, 'o'); eye(t, 38, 8, 'o'); t.rect(33, 15, 6, 1, 0); t.px(32, 14, 0); t.px(39, 14, 0); t.rect(28, 13, 2, 1, 8); t.rect(42, 13, 2, 1, 8);
  // gorro de hoja seca [64,0,16,16] y bufanda [80,0,32,8]
  t.rect(64, 0, 16, 16, 9); t.rect(64, 0, 16, 2, 10); t.rect(64, 13, 16, 3, 4); for (let x = 65; x < 80; x += 4) t.line(x, 2, x + 2, 12, 4);
  t.rect(80, 0, 32, 8, 12); t.rect(80, 0, 32, 1, 7); t.rect(80, 6, 32, 2, 1); for (let x = 81; x < 112; x += 4) t.px(x, 3, 7);
  // caracol: concha en espiral [64,16,32,32], canto [96,16,32,8], cuerpo [0,40,64,20] (8×8, cara en 3–5), cuerno [112,0,8,16] y ojo [120,0,8,8]
  t.rect(64, 16, 32, 32, 4); t.disc(79.5, 31.5, 15, 9); t.ring(79.5, 31.5, 15, 4, 1);
  for (let a = 0; a < 15; a += 0.05) { const r = 1.5 + a * 0.9; if (r > 14) break; t.px(Math.round(79.5 + Math.cos(a) * r), Math.round(31.5 + Math.sin(a) * r), 4); }
  t.rect(71, 22, 4, 1, 10); t.rect(70, 23, 1, 3, 10); t.disc(79.5, 31.5, 1.5, 2);
  t.rect(96, 16, 32, 8, 9); t.rect(96, 16, 32, 1, 10); t.rect(96, 22, 32, 2, 4); for (let x = 96; x < 128; x += 4) t.rect(x, 17, 1, 5, 4);
  t.rect(0, 40, 64, 20, 11); t.rect(0, 40, 64, 3, 10); t.rect(0, 54, 64, 6, 7); t.rect(0, 58, 64, 2, 6); t.rect(0, 53, 64, 1, 3);
  for (let k = 0; k < 8; k++) { t.px(k * 8 + 2, 45 + (k % 3), 3); t.px(k * 8 + 6, 49, 10); }
  t.rect(27, 48, 10, 1, 0); t.px(26, 47, 0); t.px(37, 47, 0); t.rect(29, 49, 6, 1, 8);
  t.rect(112, 0, 8, 16, 11); t.rect(112, 0, 2, 16, 10); t.rect(118, 0, 2, 16, 3);
  t.rect(120, 0, 8, 8, 7); t.rect(122, 2, 4, 4, 0); t.px(122, 2, 7); t.rect(120, 0, 8, 1, 6);
  // monóculo/gafas del caracol [120,8,8,8]
  t.erase(120, 8, 8, 8); t.ring(123.5, 11.5, 3, 10, 1); t.px(127, 14, 10);
  // mohín [0,60,48,24]: 8×6, pelusa gris verdosa con ceño; cara en 3–5 (x 18..35)
  t.rect(0, 60, 48, 24, 5); t.rect(0, 60, 48, 4, 3); t.rect(0, 80, 48, 4, 1);
  for (let k = 0; k < 8; k++) { const x = k * 6; t.rect(x + 1, 64 + (k * 3 % 4), 2, 2, 3); t.px(x + 4, 70 + (k * 5 % 6), 11); t.px(x + 2, 76, 3); t.px(x + 5, 66, 6); }
  t.rect(22, 68, 4, 4, 7); t.rect(29, 68, 4, 4, 7); t.rect(24, 69, 2, 3, 0); t.rect(29, 69, 2, 3, 0); t.line(21, 66, 25, 67, 0); t.line(33, 66, 29, 67, 0);
  t.rect(24, 76, 7, 2, 0); t.px(25, 76, 7); t.px(28, 76, 7);
  // espora suelta [48,60,8,8]
  t.erase(48, 60, 8, 8); t.disc(51.5, 63.5, 3, 3); t.disc(51.5, 63.5, 2, 11); t.px(51, 63, 7);
  // gorgojo: coraza [0,84,64,20] (8×8), panza [64,48,32,12], trompa [96,24,16,24], pata [112,24,8,16]
  t.rect(0, 84, 64, 20, 1); t.rect(0, 84, 64, 3, 13); t.rect(0, 100, 64, 4, 0);
  for (let k = 0; k < 8; k++) { const x = k * 8; t.rect(x, 87, 1, 13, 0); t.rect(x + 3, 88, 2, 11, 13); t.px(x + 3, 88, 6); t.px(x + 6, 93, 12); }
  t.rect(64, 48, 32, 12, 15); t.rect(64, 48, 32, 2, 9); for (let x = 66; x < 96; x += 5) t.rect(x, 51, 1, 8, 9);
  t.rect(96, 24, 16, 24, 1); t.rect(96, 24, 2, 24, 13); t.rect(110, 24, 2, 24, 0); t.rect(100, 27, 3, 4, 7); t.rect(106, 27, 3, 4, 7); t.rect(101, 28, 2, 3, 8); t.rect(107, 28, 2, 3, 8); t.rect(102, 40, 5, 8, 5); t.rect(103, 45, 3, 3, 0);
  t.rect(112, 24, 8, 16, 0); t.rect(112, 24, 2, 16, 13);
  // ── Cavador [0,104,128,24]: 8×16; placas pardas; cara en 3–5 (x 48..95) ──
  t.rect(0, 104, 128, 24, 4); t.rect(0, 104, 128, 3, 2); t.rect(0, 122, 128, 6, 15); t.rect(0, 121, 128, 1, 2); t.rect(0, 126, 128, 2, 9);
  for (let k = 0; k < 8; k++) { const x = k * 16; t.rect(x, 107, 1, 14, 2); t.rect(x + 3, 109, 10, 1, 9); t.rect(x + 2, 114, 12, 1, 2); t.rect(x + 5, 117, 6, 1, 9); t.px(x + 8, 111, 10); }
  t.rect(54, 114, 36, 7, 0); t.rect(54, 114, 36, 1, 2); for (let x = 56; x < 88; x += 5) { t.rect(x, 115, 2, 3, 7); t.rect(x + 2, 118, 2, 3, 7); }
  // ojo de Cavador abierto [48,84 → no: 64,60,16,16] y cerrado [80,60,16,16]; pinza [96,48,32,24→ recortada a 24]; antena [120,24,8,24]
  t.rect(64, 60, 16, 16, 10); t.rect(64, 60, 16, 2, 7); t.rect(68, 64, 8, 9, 0); t.rect(69, 65, 3, 3, 7); t.rect(64, 74, 16, 2, 9);
  t.rect(80, 60, 16, 16, 8); t.rect(80, 60, 16, 2, 14); t.line(83, 64, 92, 72, 0); t.line(92, 64, 83, 72, 0); t.line(84, 64, 93, 72, 0);
  t.rect(96, 48, 32, 28, 9); t.rect(96, 48, 32, 3, 10); t.rect(96, 72, 32, 4, 4); for (let x = 97; x < 128; x += 6) { t.rect(x, 51, 1, 21, 4); t.rect(x + 3, 54, 1, 6, 15); } t.rect(96, 66, 32, 2, 7); for (let x = 96; x < 128; x += 4) t.rect(x, 68, 2, 4, 7);
  t.rect(120, 24, 8, 24, 4); t.rect(120, 24, 2, 24, 9);
  // terrón [64,76,16,8] y escombro
  t.rect(64, 76, 16, 8, 4); t.rect(64, 76, 16, 2, 9); t.px(67, 80, 2); t.px(74, 79, 2); t.px(71, 82, 15);
  return (_E = { t, tex: texFrom(t) });
}
const mE = o => mat(sheetE().tex, o);

// ── hoja F: objetos, brotes, Don Mildiu ──
export function sheetF() {
  if (_F) return _F;
  const t = new Tex(128, 128);
  // ajo bravo [0,0,48,24]: 8×6, blanco con vetas moradas; penacho [48,0,8,16]; mecha encendida [56,0,8,8]
  t.rect(0, 0, 48, 24, 7); t.rect(0, 0, 48, 3, 15); t.rect(0, 20, 48, 4, 6); t.rect(0, 22, 48, 2, 13);
  for (let k = 0; k < 8; k++) { const x = k * 6; t.rect(x, 3, 1, 17, 6); t.rect(x + 3, 5 + (k % 3), 1, 6, 14); t.px(x + 4, 14, 2); }
  t.rect(23, 9, 2, 4, 0); t.rect(29, 9, 2, 4, 0); t.px(22, 8, 0); t.px(31, 8, 0); t.px(23, 9, 7); t.px(29, 9, 7); t.rect(24, 16, 6, 1, 0); t.px(23, 15, 0); t.px(30, 15, 0);
  t.erase(48, 0, 8, 16); for (const [dx, h] of [[1, 12], [3, 16], [5, 10]]) { t.rect(48 + dx, 16 - h, 2, h, 15); t.rect(49 + dx, 16 - h, 1, h, 9); }
  t.rect(56, 0, 8, 8, 10); t.rect(58, 2, 4, 4, 7);
  // cerbatana [64,0,16,32]: caña de cebollino hueca, 4 caras; boca [80,0,8,8]
  t.rect(64, 0, 16, 32, 11); for (let k = 0; k < 4; k++) t.rect(64 + k * 4, 0, 1, 32, 3); t.rect(64, 0, 16, 3, 10); t.rect(64, 12, 16, 2, 4); t.rect(64, 22, 16, 2, 4); t.rect(64, 28, 16, 4, 9); t.rect(64, 30, 16, 2, 4); t.rect(66, 5, 1, 6, 10);
  t.rect(80, 0, 8, 8, 3); t.rect(82, 2, 4, 4, 0);
  // pepita de oro [88,0,16,16] (4 caras) y semilla de tiro [104,0,8,8]
  t.rect(88, 0, 16, 16, 10); t.rect(88, 0, 4, 16, 7); t.rect(96, 0, 4, 16, 9); t.rect(88, 12, 16, 4, 9); t.rect(89, 3, 2, 3, 10); t.rect(93, 5, 1, 5, 7);
  t.rect(104, 0, 8, 8, 0); t.rect(105, 1, 6, 6, 4); t.rect(106, 2, 2, 2, 15);
  // llave de raíz [112,0,16,40]
  t.erase(112, 0, 16, 40); t.ring(119.5, 6.5, 6, 11, 2); t.ring(119.5, 6.5, 6, 3, 1); t.disc(119.5, 6.5, 1.5, 10);
  t.rect(118, 13, 3, 24, 4); t.rect(120, 13, 1, 24, 2); t.rect(118, 13, 1, 24, 9); t.rect(121, 27, 4, 2, 4); t.rect(121, 32, 3, 2, 4); t.rect(115, 18, 3, 1, 11); t.rect(121, 21, 3, 1, 11);
  // brote-diana (yema) cerrado [0,24,48,16] (8×6); pétalo [48,16,16,24]; corazón [64,32,16,16]
  t.rect(0, 24, 48, 16, 3); t.rect(0, 24, 48, 3, 11); t.rect(0, 37, 48, 3, 1); for (let k = 0; k < 8; k++) { t.rect(k * 6, 27, 1, 10, 1); t.rect(k * 6 + 3, 28, 1, 7, 11); }
  t.erase(48, 16, 16, 24); t.spr(['.....ee.....', '....eeee....', '...eeffee...', '..eeffffee..', '..eeffffe2..', '..eeffffe2..', '...eeffe2...', '...eeffe2...', '....eee2....', '....ee22....', '.....e2.....', '.....32.....', '.....3......'], 50, 20);
  t.rect(64, 32, 16, 16, 10); t.disc(71.5, 39.5, 5, 7); t.disc(71.5, 39.5, 2, 9);
  // tallo [80,8,8,24] y hoja ancha [88,16,24,24]
  t.rect(80, 8, 8, 24, 3); t.rect(80, 8, 2, 24, 11); t.rect(86, 8, 2, 24, 1);
  t.erase(88, 16, 24, 24); for (let y = 0; y < 22; y++) { const w = Math.round(Math.sin((y + 1) / 23 * 3.14) * 10); t.rect(100 - w, 17 + y, w * 2, 1, 11); t.px(100 - w, 17 + y, 3); t.px(99 + w, 17 + y, 3); } t.rect(99, 18, 1, 20, 3); for (let y = 21; y < 36; y += 4) { t.line(99, y, 94, y - 3, 3); t.line(100, y, 105, y - 3, 3); }
  // ── Don Mildiu [0,40,96,48]: 8×12; pelusa gris verdosa, sonrisa de dientes y monóculo; cara en 3–5 (x 36..71) ──
  t.rect(0, 40, 96, 48, 5); t.rect(0, 40, 96, 6, 1); t.rect(0, 80, 96, 8, 1); t.rect(0, 84, 96, 4, 0);
  for (let k = 0; k < 8; k++) { const x = k * 12; t.rect(x, 46, 1, 34, 1); t.disc(x + 4, 52 + (k * 5 % 9), 2, 3); t.px(x + 4, 51 + (k * 5 % 9), 11); t.disc(x + 9, 66 + (k * 7 % 8), 1.5, 3); t.px(x + 6, 74, 6); t.px(x + 2, 60, 6); }
  t.rect(40, 54, 9, 9, 7); t.rect(43, 57, 4, 5, 0); t.px(43, 57, 10);             // ojo izq.
  t.disc(62.5, 58.5, 6, 10); t.disc(62.5, 58.5, 5, 7); t.rect(61, 57, 4, 5, 0); t.px(61, 57, 10); t.line(67, 63, 70, 78, 10); // monóculo con su cadena
  t.line(39, 51, 49, 54, 0); t.line(69, 51, 58, 53, 0);
  t.rect(41, 68, 28, 7, 0); for (let x = 42; x < 68; x += 4) { t.rect(x, 68, 3, 3, 7); t.rect(x + 1, 72, 3, 3, 7); } t.px(40, 67, 0); t.px(69, 67, 0); t.rect(38, 66, 2, 1, 0); t.rect(70, 66, 2, 1, 0);
  // chistera: lado [0,88,64,16] con cinta, tapa [64,88,16,16], ala [80,88,32,32]
  t.rect(0, 88, 64, 16, 0); t.rect(0, 88, 64, 2, 5); t.rect(0, 98, 64, 4, 2); t.rect(0, 98, 64, 1, 8); for (let x = 0; x < 64; x += 8) t.rect(x + 3, 90, 1, 7, 1);
  t.rect(64, 88, 16, 16, 0); t.disc(71.5, 95.5, 6, 1); t.px(69, 93, 5);
  t.rect(80, 88, 32, 32, 0); t.disc(95.5, 103.5, 15, 1); t.ring(95.5, 103.5, 15, 5, 1); t.disc(95.5, 103.5, 8, 0);
  // bastón [112,40,8,48] y mano de guante [120,40,8,8]
  t.rect(112, 40, 8, 48, 0); t.rect(112, 40, 2, 48, 5); t.rect(112, 40, 8, 6, 10); t.rect(112, 40, 8, 2, 7); t.rect(112, 84, 8, 4, 6);
  t.rect(120, 40, 8, 8, 7); t.rect(120, 46, 8, 2, 6);
  // corteza de raíz [0,104,64,24] (8×8) para columnas
  t.rect(0, 104, 64, 24, 15); for (let x = 0; x < 64; x += 4) { t.rect(x, 104, 1, 24, 9); if (x % 8 === 0) t.rect(x + 1, 104, 1, 24, 7); } for (const [x, y] of [[5, 108], [19, 115], [34, 106], [47, 119], [58, 111], [27, 123]]) { t.rect(x, y, 1, 4, 4); t.px(x + 1, y + 1, 4); }
  // seta de luz [64,104,32,24]: sombrero 8×4 azul verdoso; pie [96,120,16,8]
  t.rect(64, 104, 32, 24, 12); t.rect(64, 104, 32, 3, 7); t.rect(64, 122, 32, 6, 1); for (let x = 65; x < 96; x += 4) { t.px(x, 110 + (x % 5), 7); t.rect(x + 2, 116, 1, 5, 1); }
  t.rect(96, 120, 16, 8, 6); t.rect(96, 120, 16, 1, 7); t.rect(96, 126, 16, 2, 13);
  // zarcillo: tallo [96,40,8,16], punta [104,40,8,8], argolla de gancho [96,56,16,16], rollo (objeto) [96,72,16,16]
  t.rect(96, 40, 8, 16, 11); t.rect(96, 40, 2, 16, 3); t.rect(102, 40, 2, 16, 10); for (let y = 43; y < 56; y += 5) t.rect(96, y, 8, 1, 3);
  t.rect(104, 40, 8, 8, 10); t.rect(104, 40, 8, 2, 7); t.rect(104, 46, 8, 2, 9);
  t.erase(96, 56, 16, 16); t.ring(103.5, 63.5, 7, 9, 3); t.ring(103.5, 63.5, 7, 10, 2); t.px(99, 59, 7); t.px(100, 58, 7); t.rect(102, 69, 3, 2, 4);
  t.erase(96, 72, 16, 16); t.ring(103.5, 80.5, 6.5, 3, 2); t.ring(103.5, 80.5, 6.5, 11, 1); t.ring(103.5, 80.5, 3.5, 11, 1); t.rect(108, 73, 3, 3, 10); t.px(109, 74, 7); t.line(104, 80, 109, 75, 11); t.rect(97, 85, 3, 2, 11); t.px(96, 87, 3);
  return (_F = { t, tex: texFrom(t) });
}
const mF = o => mat(sheetF().tex, o);

const base = (g, sq, extra = {}) => { const sh = blob(extra.shadow || 1.2, 0.55); sh.position.y = 0.02; g.add(sh); return { g, sq, t: sheetE().t, ...extra }; };

// lombriz: tubo anillado que se mece. o.swap = [de, a] para variar; o.hat, o.scarf, o.s (tamaño), o.len
export function makeLombriz(o = {}) {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mE(), s = o.s || 1, H = (o.len || 1.5) * s, R = 0.3 * s;
  if (o.swap) { m.uniforms.uSwapA.value = o.swap[0]; m.uniforms.uSwapB.value = o.swap[1]; }
  sq.add(new MB().lathe([[R * 0.7, 0], [R * 1.1, 0.06 * s], [R, H * 0.35], [R * 0.92, H * 0.75], [R * 0.72, H * 0.93], [R * 0.25, H]], 8, [0, 0, 64, 40]).mesh(m));
  if (o.hat) sq.add(new MB().push().move(0, H * 0.97, 0).lathe([[R * 1.15, 0], [R * 0.7, 0.16 * s], [0.001, 0.3 * s]], 6, [64, 0, 16, 16]).pop().mesh(mE()));
  if (o.scarf) sq.add(new MB().push().move(0, H * 0.5, 0).lathe([[R * 1.12, 0], [R * 1.14, 0.14 * s]], 8, [80, 0, 32, 8]).pop().mesh(mE()));
  return base(g, sq, { shadow: 0.9 * s, mats: [m], h: H, r: 0.38 * s });
}
// caracol tendero: la concha es el puesto
export function makeCaracol() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mE(), md = mE({ double: true });
  // cuerpo alargado
  const body = new MB().lathe([[0.2, 0], [0.5, 0.04], [0.52, 0.22], [0.36, 0.4], [0.001, 0.46]], 8, [0, 40, 64, 20], { sx: 0.8, sz: 1.7 }).mesh(m); sq.add(body);
  // cuello y cabeza hacia delante
  const neck = new THREE.Group(); neck.position.set(0, 0.2, 0.62); sq.add(neck);
  neck.add(new MB().lathe([[0.26, 0], [0.3, 0.3], [0.26, 0.62], [0.001, 0.74]], 8, [0, 40, 64, 20]).mesh(m));
  const stalks = [];
  for (const sx of [-0.13, 0.13]) { const st = new THREE.Group(); st.position.set(sx, 0.66, 0.04); st.add(new MB().box(0.06, 0.34, 0.06, [112, 0, 8, 16]).mesh(m)); st.add(new MB().push().move(0, 0.32, 0).box(0.15, 0.15, 0.15, [120, 0, 8, 8]).pop().mesh(mE({ unlit: true }))); st.rotation.x = 0.25; neck.add(st); stalks.push(st); }
  neck.add(new MB().push().move(0.13, 0.99, 0.13).card(0.24, 0.24, [120, 8, 8, 8], { y: -0.12 }).pop().mesh(md));
  // concha: disco gordo de canto
  const shell = new THREE.Group(); shell.position.set(0, 0.92, -0.18); sq.add(shell);
  const sb = new MB(); sb.push().rotZ(Math.PI / 2).move(0, -0.28, 0).lathe([[0.88, 0], [0.92, 0.28], [0.88, 0.56]], 10, [96, 16, 32, 8], { capT: [64, 16, 32, 32], capB: [64, 16, 32, 32] }).pop();
  shell.add(sb.mesh(m));
  return base(g, sq, { shadow: 2.2, mats: [m], neck, shell, stalks, h: 1.6, r: 0.8 });
}
// mohín: bola de pelusa. s = tamaño
export function makeMohin(s = 1) {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mE(), md = mE({ double: true, unlit: true });
  sq.add(new MB().lathe([[0.14 * s, 0.02], [0.4 * s, 0.1 * s], [0.47 * s, 0.38 * s], [0.34 * s, 0.66 * s], [0.12 * s, 0.78 * s], [0.001, 0.8 * s]], 8, [0, 60, 48, 24]).mesh(m));
  const b = new MB(); for (let i = 0; i < 4; i++) b.push().rotY(i * 1.57 + 0.4).move(0, 0.62 * s, 0.26 * s).rotX(0.5).card(0.2 * s, 0.2 * s, [48, 60, 8, 8]).pop();
  const puffs = b.mesh(md); sq.add(puffs);
  const sh = blob(1.1 * s, 0.55); sh.position.y = 0.02; g.add(sh);
  return { g, sq, sh, puffs, mats: [m, md], t: sheetE().t };
}
export function makeSpore() { return new MB().card(0.3, 0.3, [48, 60, 8, 8], { y: -0.15 }).mesh(mE({ double: true, unlit: true })); }
// gorgojo: coraza dura y trompa
export function makeGorgojo() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mE(), flip = new THREE.Group(); sq.add(flip);
  flip.add(new MB().lathe([[0.3, 0.1], [0.5, 0.14], [0.56, 0.36], [0.44, 0.6], [0.2, 0.72], [0.001, 0.74]], 8, [0, 84, 64, 20], { sx: 0.82, sz: 1.2, capB: [64, 48, 32, 12] }).mesh(m));
  const head = new THREE.Group(); head.position.set(0, 0.34, 0.6); flip.add(head);
  head.add(new MB().push().rotX(1.1).lathe([[0.2, 0], [0.16, 0.2], [0.07, 0.6], [0.05, 0.66]], 4, [96, 24, 16, 24], { phase: 0.5 }).pop().mesh(m));
  const legs = [];
  for (const sx of [-1, 1]) for (const z of [-0.3, 0.05, 0.4]) { const l = new THREE.Group(); l.position.set(0.36 * sx, 0.2, z); l.add(new MB().push().rotZ(-0.9 * sx).box(0.06, 0.34, 0.06, [112, 24, 8, 16], { y: -0.34 }).pop().mesh(m)); flip.add(l); legs.push(l); }
  const sh = blob(1.4, 0.55); sh.position.y = 0.02; sh.scale.set(1.1, 1, 1.6); g.add(sh);
  return { g, sq, flip, head, legs, mats: [m], t: sheetE().t };
}
// Cavador, el alacrán cebollero
export function makeCavador() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mE(), mu = mE({ unlit: true }), S = 2.6;
  const body = new MB().lathe([[0.2, 0], [0.5, 0.05], [0.58, 0.3], [0.46, 0.56], [0.2, 0.7], [0.001, 0.72]], 8, [0, 104, 128, 24], { sx: 0.9 * S, sz: 1.7 * S }).build().scale(1, S, 1);
  sq.add(new THREE.Mesh(body, m));
  // pinzas de pala
  const claws = [];
  for (const sx of [-1, 1]) { const c = new THREE.Group(); c.position.set(1.15 * sx, 0.7, 2.1); c.add(new MB().push().rotY(0.35 * sx).box(1.1, 1.5, 0.5, { f: [96, 48, 32, 28], b: [96, 48, 32, 28], l: [96, 48, 8, 28], r: [96, 48, 8, 28], t: [96, 48, 32, 3], d: [96, 72, 32, 4] }, { y: -0.4, top: [0.7, 0.8] }).pop().mesh(m)); sq.add(c); claws.push(c); }
  // ojos en la frente
  const eyes = [];
  for (const sx of [-1, 1]) { const e = new THREE.Group(); e.position.set(0.62 * sx, 1.55, 2.5); const a = new MB().box(0.62, 0.62, 0.62, [64, 60, 16, 16], { y: -0.31 }).mesh(mu), b = new MB().box(0.62, 0.62, 0.62, [80, 60, 16, 16], { y: -0.31 }).mesh(mu); b.visible = false; e.add(a, b); sq.add(e); eyes.push({ g: e, a, b }); }
  // antenas
  const ants = [];
  for (const sx of [-1, 1]) { const a = new THREE.Group(); a.position.set(0.3 * sx, 1.7, 2.9); a.add(new MB().push().rotX(0.9).rotZ(-0.3 * sx).box(0.08, 1.5, 0.08, [120, 24, 8, 24]).pop().mesh(m)); sq.add(a); ants.push(a); }
  const sh = blob(5, 0.6); sh.position.y = 0.03; sh.scale.set(4.6, 1, 8.4); g.add(sh);
  return { g, sq, claws, eyes, ants, mats: [m, mu], t: sheetE().t, S, sh };
}
export function makeClod() { return new MB().lathe([[0.001, -0.3], [0.3, -0.12], [0.3, 0.1], [0.001, 0.3]], 5, [64, 76, 16, 8]).mesh(mE()); }
// montículo que deja Cavador al ir bajo tierra
export function makeMound() { return new MB().lathe([[1.2, 0], [0.9, 0.3], [0.4, 0.5], [0.001, 0.55]], 7, cell(TI.tierraOsc)).mesh(mat(tilesTex())); }

// ── objetos ──
export function makeAjoBomba() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mF(), md = mF({ double: true }), mu = mF({ unlit: true });
  sq.add(new MB().lathe([[0.1, 0], [0.3, 0.06], [0.36, 0.26], [0.24, 0.46], [0.08, 0.56]], 8, [0, 0, 48, 24]).mesh(m));
  const b = new MB(); for (let i = 0; i < 2; i++) b.push().move(0, 0.52, 0).rotY(i * 1.57).card(0.2, 0.32, [48, 0, 8, 16]).pop(); sq.add(b.mesh(md));
  const spark = new MB().push().move(0, 0.86, 0).box(0.12, 0.12, 0.12, [56, 0, 8, 8], { y: -0.06 }).pop().mesh(mu); sq.add(spark);
  const sh = blob(0.8, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, sq, spark, sh, mats: [m, md], t: sheetF().t };
}
export function makeCerbatana() {
  const g = new THREE.Group(), m = mF({ double: true });
  const me = new MB().lathe([[0.06, 0], [0.06, 1.1]], 4, [64, 0, 16, 32], { phase: 0.5, capT: [80, 0, 8, 8], capB: [80, 0, 8, 8] }).mesh(m);
  me.position.y = -0.55; const p = new THREE.Group(); p.add(me); p.rotation.z = -0.9; g.add(p);
  return { g, t: sheetF().t };
}
// la caña en la boca de Ceba, apuntando hacia delante (+z)
export function makeTube() { const me = new MB().push().rotX(Math.PI / 2).lathe([[0.045, 0], [0.045, 0.8]], 4, [64, 0, 16, 32], { phase: 0.5, capT: [80, 0, 8, 8] }).pop().mesh(mF({ double: true })); me.visible = false; return me; }
export function makeSeed() { return new MB().lathe([[0.001, -0.1], [0.07, 0], [0.001, 0.14]], 4, [104, 0, 8, 8]).mesh(mF({ unlit: true })); }
export function makePepita() {
  const m = mF({ unlit: true }), g = new THREE.Group();
  const me = new MB().lathe([[0.001, 0], [0.2, 0.16], [0.17, 0.34], [0.001, 0.56]], 4, [88, 0, 16, 16]).mesh(m); g.add(me);
  const sh = blob(0.5, 0.5); g.add(sh);
  return { g, me, sh, t: sheetF().t };
}
export function makeLlaveRaiz() {
  const m = mF({ double: true }), g = new THREE.Group(), b = new MB();
  b.push().move(0, -0.5, 0.02).card(0.4, 1.0, [112, 0, 16, 40]).pop(); b.push().move(0, -0.5, -0.02).card(0.4, 1.0, [112, 0, 16, 40]).pop();
  g.add(b.mesh(m)); return { g, t: sheetF().t };
}
// brote-diana: cerrado es un capullo; abierto, flor con corazón de luz
export function makeYema() {
  const g = new THREE.Group(), m = mF(), md = mF({ double: true, unlit: true }), mu = mF({ unlit: true });
  const stem = new MB().box(0.12, 0.5, 0.12, [80, 8, 8, 24]).mesh(m); g.add(stem);
  const head = new THREE.Group(); head.position.y = 0.5; g.add(head);
  const bud = new MB().lathe([[0.12, 0], [0.3, 0.14], [0.26, 0.4], [0.001, 0.62]], 8, [0, 24, 48, 16]).mesh(m); head.add(bud);
  const flower = new THREE.Group(); flower.visible = false; head.add(flower);
  const pb = new MB(); for (let i = 0; i < 6; i++) pb.push().rotY(i * 1.047).rotX(1.0).card(0.34, 0.6, [48, 16, 16, 24]).pop(); flower.add(pb.mesh(md));
  flower.add(new MB().lathe([[0.001, 0], [0.17, 0.08], [0.001, 0.22]], 6, [64, 32, 16, 16]).mesh(mu));
  return { g, head, bud, flower, t: sheetF().t };
}
// Don Mildiu: un señor de moho con chistera, monóculo y bastón
export function makeMildiu() {
  const g = new THREE.Group(), sq = new THREE.Group(); g.add(sq);
  const m = mF(), md = mF({ double: true });
  sq.add(new MB().lathe([[0.5, 0], [0.95, 0.12], [1.05, 0.7], [0.9, 1.5], [0.7, 2.1], [0.5, 2.5], [0.42, 2.62]], 8, [0, 40, 96, 48]).mesh(m));
  const hat = new THREE.Group(); hat.position.y = 2.58; hat.rotation.z = 0.12; sq.add(hat);
  hat.add(new MB().lathe([[0.001, 0], [0.85, 0]], 8, [80, 88, 32, 32]).mesh(md));
  hat.add(new MB().lathe([[0.45, 0], [0.5, 0.75]], 8, [0, 88, 64, 16], { capT: [64, 88, 16, 16] }).mesh(m));
  const arm = new THREE.Group(); arm.position.set(1.2, 0, 0.5); g.add(arm);
  arm.add(new MB().box(0.1, 2.0, 0.1, [112, 40, 8, 48]).mesh(m));
  arm.add(new MB().push().move(0, 1.7, 0).box(0.3, 0.26, 0.3, [120, 40, 8, 8]).pop().mesh(m));
  const sh = blob(2.6, 0.6); sh.position.y = 0.02; g.add(sh);
  return { g, sq, hat, arm, mats: [m, md], t: sheetF().t, h: 3.3, r: 1.1 };
}
// columna de raíz que baja del techo, y raicilla colgante
export function makeRootColumn(h = 14, r = 1.2) {
  const m = mF();
  return new MB().lathe([[r * 1.5, 0], [r * 1.05, 0.9], [r * 0.85, h * 0.45], [r * 1.0, h * 0.8], [r * 1.9, h]], 8, [0, 104, 64, 24]).mesh(m);
}
// seta de luz (decorado con farol propio)
export function makeLightShroom(s = 1) {
  const g = new THREE.Group(), m = mF({ unlit: true }), ms = mF();
  g.add(new MB().lathe([[0.1 * s, 0], [0.08 * s, 0.7 * s]], 5, [96, 120, 16, 8]).mesh(ms));
  g.add(new MB().push().move(0, 0.62 * s, 0).lathe([[0.42 * s, 0], [0.36 * s, 0.14 * s], [0.14 * s, 0.3 * s], [0.001, 0.32 * s]], 8, [64, 104, 32, 24], { capB: [96, 120, 16, 8] }).pop().mesh(m));
  return { g, t: sheetF().t };
}
// seta trampolín: sombrero ancho de lunares
export function makeSeta(s = 1) {
  const g = new THREE.Group(), cap = new THREE.Group(), m = mat(tilesTex());
  g.add(new MB().lathe([[0.34 * s, 0], [0.26 * s, 0.6 * s]], 6, cell(TI.setaPie)).mesh(m));
  cap.add(new MB().lathe([[0.95 * s, 0], [1.0 * s, 0.1 * s], [0.6 * s, 0.34 * s], [0.001, 0.4 * s]], 8, cell(TI.seta), { capB: cell(TI.setaPie) }).mesh(m));
  cap.position.y = 0.6 * s; g.add(cap);
  const sh = blob(2.2 * s, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, cap };
}

// ── el zarcillo: látigo-gancho. Objeto (rollo), el tallo que se estira (1 m hacia +y, se escala) y el gancho donde se agarra ──
export function makeZarcillo() {
  const g = new THREE.Group(), m = mF({ double: true }), b = new MB();
  b.push().move(0, -0.45, 0.02).card(0.9, 0.9, [96, 72, 16, 16]).pop(); b.push().move(0, -0.45, -0.02).rotY(Math.PI).card(0.9, 0.9, [96, 72, 16, 16]).pop();
  g.add(b.mesh(m)); return { g, t: sheetF().t };
}
export function makeTendril() {
  const g = new THREE.Group(), m = mF({ unlit: true });
  const stem = new MB().lathe([[0.045, 0], [0.045, 1]], 4, [96, 40, 8, 16]).mesh(m); g.add(stem);
  const tip = new MB().lathe([[0.001, -0.12], [0.11, 0], [0.001, 0.2]], 4, [104, 40, 8, 8]).mesh(m); g.add(tip);
  return { g, stem, tip };
}
export function makeGancho() {
  const g = new THREE.Group(), m = mF(), md = mF({ double: true, unlit: true });
  g.add(new MB().lathe([[0.2, 0], [0.13, 0.25], [0.1, 1.15], [0.14, 1.3]], 6, [0, 104, 32, 24]).mesh(m));
  const ring = new THREE.Group(); ring.position.y = 1.3; g.add(ring);
  const b = new MB(); for (let i = 0; i < 2; i++) b.push().rotY(i * 1.5708).card(0.62, 0.62, [96, 56, 16, 16]).pop(); ring.add(b.mesh(md));
  const sh = blob(0.7, 0.5); sh.position.y = 0.02; g.add(sh);
  return { g, ring, mats: [m, md], t: sheetF().t };
}
