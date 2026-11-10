// tiles.js — hoja de baldosas del mundo (128×128, celdas de 16). Planas y rotundas:
// el tramado lo pone el sombreador, no la textura.
import { Tex, T, rng } from '../px.js';
import { texFrom, mat } from '../gfx.js';

export const TI = {
  hierba: 0, hierbaLado: 1, tierra: 2, camino: 3, estrato: 4, adobe: 5, madera: 6, agua: 7,
  bancal: 8, piedra: 9, canal: 10, estratoTop: 11, flores: 12, seto: 13, teja: 14, caminoB: 15,
  losa: 16, ladrillo: 17, zocalo: 18, cornisa: 19, canalD: 20, losaLagrima: 21, reja: 22, placa: 23,
  puerta: 24, bloque: 25, corcho: 26, moho: 27, losaOsc: 28, aguaOsc: 29, baba: 30, negro: 31,
  ladrilloV: 32, pilar: 33, bloqueTop: 34, placaOn: 35, puertaJefe: 36, arco: 37, rejilla: 38, luz: 39,
  pielSeca: 40, tablon: 41, cuerda: 42, tejaB: 43, pizarra: 44, losaRota: 45, charco: 46, estratoB: 47,
};
export const cell = i => [(i % 8) * 16, (i >> 3) * 16, 16, 16];

export function paintTiles() {
  const t = new Tex(128, 128, 0), r = rng(77);
  const at = (i, f) => { const [x, y] = cell(i); t.ox = x; t.oy = y; t.setClip(0, 0, 128, 128); t.clip = [x, y, x + 16, y + 16]; f(); t.ox = t.oy = 0; t.clip = null; };
  const sp = (c, n) => { for (let k = 0; k < n; k++) t.px(Math.floor(r() * 16), Math.floor(r() * 16), c); };
  const R = n => Math.floor(r() * n);

  at(TI.hierba, () => { t.rect(0, 0, 16, 16, 11); for (const [x, y] of [[2, 3], [10, 1], [6, 9], [13, 11]]) { t.rect(x, y, 1, 3, 3); t.px(x + 1, y + 1, 3); } t.px(8, 5, 10); t.px(3, 13, 10); });
  at(TI.flores, () => { t.rect(0, 0, 16, 16, 11); for (const [x, y] of [[8, 2], [1, 8]]) { t.rect(x, y, 1, 3, 3); } for (const [x, y, c] of [[3, 3, 14], [11, 6, 7], [6, 11, 14], [13, 13, 10]]) { t.rect(x - 1, y, 3, 1, c); t.rect(x, y - 1, 1, 3, c); t.px(x, y, 10); } });
  at(TI.seto, () => { t.rect(0, 0, 16, 16, 3); for (let k = 0; k < 9; k++) { const x = R(15), y = R(14); t.rect(x, y, 2, 1, 11); t.px(x, y + 1, 11); } sp(1, 6); });
  at(TI.hierbaLado, () => { t.rect(0, 0, 16, 16, 4); t.rect(0, 0, 16, 4, 11); for (let x = 0; x < 16; x++) { const h = [1, 2, 1, 0, 2, 3, 1, 0, 1, 2, 0, 1, 3, 2, 1, 0][x]; t.rect(x, 4, 1, h, 11); t.px(x, 4 + h, 3); } t.rect(0, 0, 16, 1, 10); for (const [x, y] of [[3, 9], [10, 12], [13, 8], [6, 14]]) { t.rect(x, y, 2, 1, 2); } t.rect(8, 10, 2, 2, 15); t.px(2, 13, 15); });
  at(TI.tierra, () => { t.rect(0, 0, 16, 16, 4); for (const [x, y] of [[2, 3], [9, 2], [12, 9], [5, 11], [14, 14], [1, 14]]) t.rect(x, y, 2, 1, 2); sp(9, 4); t.rect(6, 6, 2, 2, 15); t.px(7, 7, 9); });
  at(TI.camino, () => { t.rect(0, 0, 16, 16, 15); t.line(0, 4, 5, 2, 9); t.line(5, 2, 11, 5, 9); t.line(11, 5, 15, 4, 9); t.line(0, 12, 6, 13, 9); t.line(6, 13, 15, 10, 9); sp(7, 6); t.px(8, 8, 9); t.px(3, 8, 9); });
  at(TI.caminoB, () => { t.rect(0, 0, 16, 16, 15); t.rect(0, 0, 16, 2, 9); t.rect(0, 14, 16, 2, 9); t.line(0, 7, 15, 8, 9); sp(7, 5); });
  const estrato = (rows) => { let y = 0; for (const [h, c] of rows) { t.rect(0, y, 16, h, c); y += h; } };
  at(TI.estrato, () => { estrato([[4, 9], [2, 4], [2, 15], [4, 9], [2, 4], [2, 2]]); for (let x = 0; x < 16; x += 3) { t.px(x, 4, 9); t.px(x + 1, 8, 15); t.px(x + 2, 12, 9); } t.rect(5, 1, 3, 1, 10); t.rect(11, 9, 2, 1, 10); t.rect(2, 14, 4, 1, 4); });
  at(TI.estratoB, () => { estrato([[3, 4], [3, 2], [4, 4], [2, 9], [4, 2]]); for (let x = 1; x < 16; x += 4) { t.px(x, 3, 2); t.px(x + 2, 10, 4); } t.rect(9, 7, 3, 1, 9); });
  at(TI.estratoTop, () => { estrato([[2, 10], [3, 9], [2, 4], [2, 15], [4, 9], [3, 4]]); for (let x = 0; x < 16; x += 2) t.px(x, 2, 10); t.rect(3, 9, 3, 1, 10); });
  at(TI.pielSeca, () => { t.rect(0, 0, 16, 16, 9); t.line(0, 3, 15, 5, 4); t.line(0, 10, 15, 12, 4); t.line(4, 0, 6, 15, 10); t.line(12, 0, 11, 15, 10); sp(15, 4); });
  at(TI.adobe, () => { t.rect(0, 0, 16, 16, 15); for (let j = 0; j < 4; j++) { t.rect(0, j * 4 + 3, 16, 1, 9); for (let x = (j % 2) * 4; x < 16; x += 8) t.rect(x, j * 4, 1, 3, 9); } t.rect(2, 1, 3, 1, 7); t.rect(10, 9, 3, 1, 7); });
  at(TI.madera, () => { t.rect(0, 0, 16, 16, 4); for (let x = 3; x < 16; x += 4) t.rect(x, 0, 1, 16, 2); t.rect(1, 2, 1, 5, 9); t.rect(9, 8, 1, 6, 9); t.px(5, 12, 2); t.px(13, 3, 2); });
  at(TI.tablon, () => { t.rect(0, 0, 16, 16, 4); for (let y = 3; y < 16; y += 4) t.rect(0, y, 16, 1, 2); t.rect(2, 1, 5, 1, 9); t.rect(9, 9, 5, 1, 9); t.px(1, 5, 15); t.px(14, 13, 15); });
  at(TI.cuerda, () => { t.rect(0, 0, 16, 16, 15); for (let k = -16; k < 32; k += 4) t.line(k, 0, k + 8, 15, 9); for (let k = -16; k < 32; k += 8) t.line(k + 1, 0, k + 9, 15, 4); });
  at(TI.agua, () => { t.rect(0, 0, 16, 16, 12); t.rect(1, 3, 5, 1, 7); t.rect(9, 7, 6, 1, 7); t.rect(3, 12, 4, 1, 7); t.rect(11, 14, 3, 1, 6); t.rect(6, 4, 2, 1, 6); t.rect(12, 1, 2, 1, 6); });
  at(TI.aguaOsc, () => { t.rect(0, 0, 16, 16, 1); t.rect(1, 3, 5, 1, 12); t.rect(9, 8, 6, 1, 13); t.rect(3, 13, 4, 1, 12); t.rect(12, 1, 2, 1, 13); });
  at(TI.charco, () => { t.rect(0, 0, 16, 16, 12); t.rect(2, 5, 4, 1, 7); t.rect(9, 10, 5, 1, 7); });
  at(TI.bancal, () => { t.rect(0, 0, 16, 16, 2); for (let y = 1; y < 16; y += 4) { t.rect(0, y, 16, 2, 4); t.rect(0, y, 16, 1, 9); } for (const [x, y] of [[3, 3], [11, 7], [6, 11], [14, 15]]) t.px(x, y, 15); });
  at(TI.piedra, () => { t.rect(0, 0, 16, 16, 6); t.rect(0, 15, 16, 1, 13); t.rect(15, 0, 1, 16, 13); t.rect(0, 0, 16, 1, 7); t.rect(0, 0, 1, 16, 7); t.rect(4, 5, 3, 1, 7); t.rect(9, 10, 2, 1, 13); });
  at(TI.canal, () => { t.rect(0, 0, 16, 16, 5); t.line(2, 0, 5, 6, 0); t.line(5, 6, 3, 11, 0); t.line(11, 4, 13, 9, 0); t.line(13, 9, 10, 15, 0); sp(13, 5); });
  at(TI.teja, () => { t.rect(0, 0, 16, 16, 8); for (let j = 0; j < 4; j++) { t.rect(0, j * 4 + 3, 16, 1, 2); for (let x = (j % 2) * 4; x < 16; x += 8) t.rect(x, j * 4, 1, 3, 2); } t.rect(2, 0, 3, 1, 14); t.rect(10, 8, 3, 1, 14); });
  at(TI.tejaB, () => { t.rect(0, 0, 16, 16, 9); for (let j = 0; j < 4; j++) { t.rect(0, j * 4 + 3, 16, 1, 4); for (let x = (j % 2) * 4; x < 16; x += 8) t.rect(x, j * 4, 1, 3, 4); } t.rect(2, 0, 3, 1, 10); t.rect(10, 8, 3, 1, 10); });
  at(TI.pizarra, () => { t.rect(0, 0, 16, 16, 1); t.box(0, 0, 16, 16, 4); t.box(1, 1, 14, 14, 2); });

  // ── la Túnica: cisterna morada ──
  at(TI.losa, () => { t.rect(0, 0, 16, 16, 13); t.rect(0, 15, 16, 1, 5); t.rect(15, 0, 1, 16, 5); t.rect(0, 7, 16, 1, 5); t.rect(7, 0, 1, 7, 5); t.rect(3, 8, 1, 7, 5); t.rect(11, 8, 1, 7, 5); t.rect(1, 1, 2, 1, 6); t.rect(9, 1, 2, 1, 6); t.rect(5, 9, 2, 1, 6); t.px(13, 12, 5); t.px(2, 4, 5); });
  at(TI.losaOsc, () => { t.rect(0, 0, 16, 16, 5); t.rect(0, 15, 16, 1, 1); t.rect(15, 0, 1, 16, 1); t.rect(0, 7, 16, 1, 1); t.rect(7, 0, 1, 7, 1); t.rect(3, 8, 1, 7, 1); t.rect(11, 8, 1, 7, 1); t.px(2, 2, 13); t.px(10, 10, 13); });
  at(TI.losaRota, () => { t.rect(0, 0, 16, 16, 13); t.rect(0, 15, 16, 1, 5); t.rect(15, 0, 1, 16, 5); t.line(2, 1, 7, 6, 5); t.line(7, 6, 5, 12, 5); t.line(7, 6, 13, 9, 5); t.rect(9, 2, 2, 1, 6); t.rect(2, 13, 3, 1, 2); });
  at(TI.losaLagrima, () => { t.rect(0, 0, 16, 16, 13); t.box(0, 0, 16, 16, 5); t.box(2, 2, 12, 12, 2); t.rect(7, 4, 2, 2, 12); t.rect(6, 6, 4, 4, 12); t.rect(7, 10, 2, 1, 12); t.px(7, 7, 7); });
  at(TI.ladrillo, () => { t.rect(0, 0, 16, 16, 2); for (let j = 0; j < 4; j++) { t.rect(0, j * 4 + 3, 16, 1, 1); for (let x = (j % 2) * 4 + 1; x < 16; x += 8) t.rect(x, j * 4, 1, 3, 1); } t.rect(3, 0, 3, 1, 8); t.rect(11, 8, 2, 1, 8); t.px(6, 5, 14); t.px(13, 13, 1); });
  at(TI.ladrilloV, () => { t.rect(0, 0, 16, 16, 2); for (let j = 0; j < 4; j++) { t.rect(0, j * 4 + 3, 16, 1, 1); for (let x = (j % 2) * 4 + 1; x < 16; x += 8) t.rect(x, j * 4, 1, 3, 1); } t.line(6, 0, 4, 5, 14); t.line(4, 5, 8, 10, 14); t.line(8, 10, 7, 15, 14); t.line(8, 10, 12, 12, 8); t.px(4, 5, 7); });
  at(TI.zocalo, () => { t.rect(0, 0, 16, 16, 1); t.rect(0, 0, 16, 2, 13); t.rect(0, 2, 16, 1, 5); for (let x = 2; x < 16; x += 6) { t.rect(x, 6, 3, 3, 2); t.px(x, 6, 13); } t.rect(0, 13, 16, 3, 0); });
  at(TI.cornisa, () => { t.rect(0, 0, 16, 16, 2); t.rect(0, 3, 16, 5, 14); t.rect(0, 3, 16, 1, 7); t.rect(0, 8, 16, 1, 8); for (let x = 0; x < 16; x += 4) { t.rect(x, 9, 2, 3, 8); t.rect(x + 1, 5, 2, 2, 15); } t.rect(0, 0, 16, 2, 1); t.rect(0, 13, 16, 1, 1); });
  at(TI.pilar, () => { t.rect(0, 0, 16, 16, 13); t.rect(0, 0, 3, 16, 5); t.rect(13, 0, 3, 16, 5); t.rect(4, 0, 2, 16, 6); t.rect(9, 0, 1, 16, 5); t.rect(0, 0, 16, 1, 1); });
  at(TI.arco, () => { t.rect(0, 0, 16, 16, 5); t.rect(0, 0, 16, 2, 13); t.rect(0, 14, 16, 2, 1); for (let x = 1; x < 16; x += 5) { t.rect(x, 4, 3, 8, 1); t.rect(x, 4, 3, 1, 13); } });
  at(TI.canalD, () => { t.rect(0, 0, 16, 16, 1); t.rect(2, 3, 4, 1, 5); t.rect(9, 9, 5, 1, 5); t.rect(4, 13, 3, 1, 5); t.px(12, 3, 13); });
  at(TI.reja, () => { t.erase(0, 0, 16, 16); for (let x = 1; x < 16; x += 5) { t.rect(x, 0, 2, 16, 6); t.rect(x + 1, 0, 1, 16, 5); } t.rect(0, 2, 16, 2, 5); t.rect(0, 12, 16, 2, 5); t.rect(0, 2, 16, 1, 6); t.rect(0, 12, 16, 1, 6); });
  at(TI.rejilla, () => { t.rect(0, 0, 16, 16, 0); for (let x = 1; x < 16; x += 4) t.rect(x, 0, 2, 16, 5); for (let y = 1; y < 16; y += 4) t.rect(0, y, 16, 2, 5); for (let x = 1; x < 16; x += 4) for (let y = 1; y < 16; y += 4) t.px(x, y, 13); });
  at(TI.placa, () => { t.rect(0, 0, 16, 16, 9); t.box(0, 0, 16, 16, 4); t.rect(1, 1, 14, 1, 10); t.rect(1, 1, 1, 14, 10); t.ring(8, 8, 5, 4, 1); t.ring(8, 8, 3, 4, 1); t.px(8, 8, 4); t.px(7, 8, 4); t.px(8, 7, 4); t.px(7, 7, 4); });
  at(TI.placaOn, () => { t.rect(0, 0, 16, 16, 11); t.box(0, 0, 16, 16, 3); t.rect(1, 1, 14, 1, 10); t.rect(1, 1, 1, 14, 10); t.ring(8, 8, 5, 7, 1); t.ring(8, 8, 3, 7, 1); t.rect(7, 7, 2, 2, 7); });
  at(TI.puerta, () => { t.rect(0, 0, 16, 16, 5); t.box(0, 0, 16, 16, 1); t.rect(1, 1, 14, 1, 13); t.rect(1, 1, 1, 14, 13); t.rect(4, 4, 8, 8, 1); t.rect(5, 5, 6, 6, 13); t.rect(7, 6, 2, 1, 12); t.rect(6, 7, 4, 3, 12); t.px(7, 8, 7); });
  at(TI.puertaJefe, () => { t.rect(0, 0, 16, 16, 2); t.box(0, 0, 16, 16, 1); t.rect(1, 1, 14, 1, 8); t.rect(1, 1, 1, 14, 8); t.ring(8, 8, 6, 10, 1); t.ring(8, 8, 4, 9, 1); t.rect(6, 6, 4, 4, 0); t.rect(7, 7, 2, 4, 10); t.rect(7, 6, 2, 1, 10); });
  at(TI.bloque, () => { t.rect(0, 0, 16, 16, 15); t.box(0, 0, 16, 16, 4); t.rect(1, 1, 14, 1, 7); t.rect(1, 1, 1, 14, 7); t.rect(1, 14, 14, 1, 9); t.rect(14, 1, 1, 14, 9); t.ring(8, 8, 5, 9, 1); t.ring(8, 8, 3, 9, 1); t.px(8, 8, 4); t.px(7, 7, 4); t.px(7, 8, 4); t.px(8, 7, 4); });
  at(TI.bloqueTop, () => { t.rect(0, 0, 16, 16, 15); t.box(0, 0, 16, 16, 4); t.rect(1, 1, 14, 1, 7); t.rect(1, 1, 1, 14, 7); t.rect(4, 4, 8, 8, 9); t.rect(5, 5, 6, 6, 15); });
  at(TI.corcho, () => { t.rect(0, 0, 16, 16, 15); t.box(0, 0, 16, 16, 9); for (const [x, y] of [[3, 3], [10, 4], [6, 9], [12, 11], [3, 12], [8, 6]]) { t.rect(x, y, 2, 1, 4); } sp(9, 8); t.rect(1, 1, 14, 1, 7); });
  at(TI.moho, () => { t.rect(0, 0, 16, 16, 3); for (const [x, y] of [[2, 2], [9, 3], [5, 8], [12, 10], [3, 13], [14, 14]]) { t.rect(x, y, 2, 2, 11); t.px(x, y, 10); } sp(1, 6); });
  at(TI.baba, () => { t.erase(0, 0, 16, 16); t.oval(8, 8, 7, 6, 11); t.oval(5, 6, 2, 1, 10); t.px(10, 10, 3); t.px(11, 5, 7); t.rect(3, 10, 2, 1, 3); });
  at(TI.negro, () => { t.rect(0, 0, 16, 16, 0); });
  at(TI.luz, () => { t.rect(0, 0, 16, 16, 7); });
  return t;
}

let _tex = null, _m = {};
export function tilesTex() { return _tex || (_tex = texFrom(paintTiles())); }
// materiales del terreno: 'solid', 'cut' (con recorte), 'water'
export function tileMat(kind = 'solid') {
  if (_m[kind]) return _m[kind];
  const o = { tiled: true, cut: kind === 'solid' || kind === 'cut' };
  if (kind === 'water') { o.wave = 0.03; o.unlit = false; }
  if (kind === 'waterGlow') { o.wave = 0.03; o.unlit = true; }
  if (kind === 'cut') o.double = true;
  if (kind === 'decal') { o.offset = 2; o.depthWrite = false; }
  return (_m[kind] = mat(tilesTex(), o));
}
