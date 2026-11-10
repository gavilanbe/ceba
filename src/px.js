// px.js — paleta PICO-8, lienzo de índices y fuente de 3×5.
// Todo lo que se pinta en CEBA (texturas de 128×128 e interfaz de 320×180)
// pasa por la clase Tex: un búfer de índices de paleta, sin colores intermedios.

export const PAL = [
  '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
];
export const RGB = PAL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
// a qué color cae cada uno al oscurecerse (rampa de sombra con tramado)
export const DARK = [0, 0, 1, 1, 2, 1, 13, 6, 2, 4, 9, 3, 13, 5, 2, 9];
// y hacia cuál sube al aclararse (destellos, fundidos a blanco)
export const LITE = [1, 13, 8, 11, 9, 13, 7, 7, 14, 10, 7, 10, 7, 6, 15, 7];
export const T = 255; // transparente

export const C = {
  negro: 0, marino: 1, morado: 2, verdeo: 3, marron: 4, griso: 5, gris: 6, blanco: 7,
  rojo: 8, naranja: 9, amarillo: 10, verde: 11, azul: 12, lavanda: 13, rosa: 14, carne: 15,
};

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ───────────────────────── fuente 3×5 ─────────────────────────
const G = {};
const def = (ch, rows) => { G[ch] = rows.split(',').map(r => [...r].map(c => c === '1')); };
def('A', '111,101,111,101,101'); def('B', '111,101,110,101,111'); def('C', '011,100,100,100,011');
def('D', '110,101,101,101,111'); def('E', '111,100,110,100,111'); def('F', '111,100,110,100,100');
def('G', '011,100,100,101,111'); def('H', '101,101,111,101,101'); def('I', '111,010,010,010,111');
def('J', '111,010,010,010,110'); def('K', '101,101,110,101,101'); def('L', '100,100,100,100,111');
def('M', '111,111,101,101,101'); def('N', '110,101,101,101,101'); def('O', '011,101,101,101,110');
def('P', '111,101,111,100,100'); def('Q', '010,101,101,110,011'); def('R', '111,101,110,101,101');
def('S', '011,100,111,001,110'); def('T', '111,010,010,010,010'); def('U', '101,101,101,101,011');
def('V', '101,101,101,111,010'); def('W', '101,101,101,111,111'); def('X', '101,101,010,101,101');
def('Y', '101,101,111,001,111'); def('Z', '111,001,010,100,111');
def('0', '111,101,101,101,111'); def('1', '110,010,010,010,111'); def('2', '111,001,111,100,111');
def('3', '111,001,011,001,111'); def('4', '101,101,111,001,001'); def('5', '111,100,111,001,111');
def('6', '100,100,111,101,111'); def('7', '111,001,001,001,001'); def('8', '111,101,111,101,111');
def('9', '111,101,111,001,001');
def('.', '000,000,000,000,010'); def(',', '000,000,000,010,100'); def('!', '010,010,010,000,010');
def('¡', '010,000,010,010,010'); def('?', '111,001,011,000,010'); def('¿', '010,000,110,100,111');
def(':', '000,010,000,010,000'); def(';', '000,010,000,010,100'); def('-', '000,000,111,000,000');
def("'", '010,100,000,000,000'); def('"', '101,101,000,000,000'); def('(', '010,100,100,100,010');
def(')', '010,001,001,001,010'); def('/', '001,010,010,010,100'); def('+', '000,010,111,010,000');
def('*', '101,010,111,010,101'); def('…', '000,000,000,000,101'); def('«', '000,011,110,011,000');
def('»', '000,110,011,110,000'); def('%', '101,001,010,100,101'); def('=', '000,111,000,111,000');
def('_', '000,000,000,000,111'); def('<', '001,010,100,010,001'); def('>', '100,010,001,010,100');
def('·', '000,000,010,000,000'); def('#', '101,111,101,111,101'); def('°', '111,101,111,000,000');
def('—', '000,000,111,000,000'); def('×', '000,101,010,101,000'); def('♥', '101,111,111,111,010');
def('●', '010,111,111,111,010'); def('○', '010,101,101,101,010'); def('▶', '100,110,111,110,100');
def('◀', '001,011,111,011,001'); def('▲', '000,010,111,111,000'); def('▼', '000,111,111,010,000');
def('◆', '010,111,111,111,010'); def('~', '000,100,111,001,000'); def('|', '010,010,010,010,010');
def(' ', '000,000,000,000,000');
// acentos: [letra base, fila superior]
const ACC = { 'Á': ['A', '010'], 'É': ['E', '010'], 'Í': ['I', '010'], 'Ó': ['O', '010'], 'Ú': ['U', '010'], 'Ñ': ['N', '111'], 'Ü': ['U', '101'] };

export const FONT_H = 5;
export function glyph(ch) {
  if (G[ch]) return { rows: G[ch], top: null };
  const a = ACC[ch];
  if (a) return { rows: G[a[0]], top: [...a[1]].map(c => c === '1') };
  return { rows: G['?'], top: null };
}
export const up = s => String(s).toUpperCase();

// ───────────────────────── fuente de lectura ─────────────────────────
// Proporcional, con minúsculas y tildes. Mayúsculas de 6 px, minúsculas de 4, 1 px entre letras.
// Cada letra: fila en la que empieza (0 = fila de las tildes de mayúscula, 1 = tope de mayúscula) y sus filas.
const F = {};
const g2 = (ch, top, rows) => { const r = rows.split('|'); F[ch] = { top, w: r[0].length, rows: r.map(x => [...x].map(c => c === '#')) }; };
g2('A', 1, '.##.|#..#|#..#|####|#..#|#..#'); g2('B', 1, '###.|#..#|###.|#..#|#..#|###.'); g2('C', 1, '.###|#...|#...|#...|#...|.###');
g2('D', 1, '###.|#..#|#..#|#..#|#..#|###.'); g2('E', 1, '####|#...|###.|#...|#...|####'); g2('F', 1, '####|#...|###.|#...|#...|#...');
g2('G', 1, '.###|#...|#...|#.##|#..#|.###'); g2('H', 1, '#..#|#..#|####|#..#|#..#|#..#'); g2('I', 1, '###|.#.|.#.|.#.|.#.|###');
g2('J', 1, '..##|...#|...#|...#|#..#|.##.'); g2('K', 1, '#..#|#.#.|##..|#.#.|#..#|#..#'); g2('L', 1, '#...|#...|#...|#...|#...|####');
g2('M', 1, '#...#|##.##|#.#.#|#...#|#...#|#...#'); g2('N', 1, '#..#|##.#|##.#|#.##|#.##|#..#'); g2('O', 1, '.##.|#..#|#..#|#..#|#..#|.##.');
g2('P', 1, '###.|#..#|#..#|###.|#...|#...'); g2('Q', 1, '.##.|#..#|#..#|#..#|#.#.|.#.#'); g2('R', 1, '###.|#..#|#..#|###.|#.#.|#..#');
g2('S', 1, '.###|#...|.##.|...#|...#|###.'); g2('T', 1, '#####|..#..|..#..|..#..|..#..|..#..'); g2('U', 1, '#..#|#..#|#..#|#..#|#..#|.##.');
g2('V', 1, '#...#|#...#|#...#|.#.#.|.#.#.|..#..'); g2('W', 1, '#...#|#...#|#...#|#.#.#|#.#.#|.#.#.'); g2('X', 1, '#..#|#..#|.##.|.##.|#..#|#..#');
g2('Y', 1, '#...#|#...#|.#.#.|..#..|..#..|..#..'); g2('Z', 1, '####|...#|..#.|.#..|#...|####');
g2('a', 3, '.###|#..#|#..#|.###'); g2('b', 1, '#...|#...|###.|#..#|#..#|###.'); g2('c', 3, '.##|#..|#..|.##');
g2('d', 1, '...#|...#|.###|#..#|#..#|.###'); g2('e', 3, '.##.|####|#...|.###'); g2('f', 1, '.##|#..|###|#..|#..|#..');
g2('g', 3, '.###|#..#|#..#|.###|...#|.##.'); g2('h', 1, '#...|#...|###.|#..#|#..#|#..#'); g2('i', 1, '#|.|#|#|#|#');
g2('j', 1, '.#|..|.#|.#|.#|.#|.#|#.'); g2('k', 1, '#...|#...|#..#|###.|#.#.|#..#'); g2('l', 1, '#.|#.|#.|#.|#.|.#');
g2('m', 3, '##.#.|#.#.#|#.#.#|#.#.#'); g2('n', 3, '###.|#..#|#..#|#..#'); g2('o', 3, '.##.|#..#|#..#|.##.');
g2('p', 3, '###.|#..#|#..#|###.|#...|#...'); g2('q', 3, '.###|#..#|#..#|.###|...#|...#'); g2('r', 3, '#.#|##.|#..|#..');
g2('s', 3, '.###|##..|..##|###.'); g2('t', 2, '.#.|###|.#.|.#.|..#'); g2('u', 3, '#..#|#..#|#..#|.###');
g2('v', 3, '#.#|#.#|#.#|.#.'); g2('w', 3, '#...#|#.#.#|#.#.#|.#.#.'); g2('x', 3, '#.#|.#.|.#.|#.#');
g2('y', 3, '#..#|#..#|#..#|.###|...#|.##.'); g2('z', 3, '####|..#.|.#..|####');
g2('0', 1, '.##.|#..#|#.##|##.#|#..#|.##.'); g2('1', 1, '.#.|##.|.#.|.#.|.#.|###'); g2('2', 1, '.##.|#..#|...#|..#.|.#..|####');
g2('3', 1, '###.|...#|.##.|...#|...#|###.'); g2('4', 1, '#..#|#..#|####|...#|...#|...#'); g2('5', 1, '####|#...|###.|...#|...#|###.');
g2('6', 1, '.##.|#...|###.|#..#|#..#|.##.'); g2('7', 1, '####|...#|..#.|..#.|.#..|.#..'); g2('8', 1, '.##.|#..#|.##.|#..#|#..#|.##.');
g2('9', 1, '.##.|#..#|#..#|.###|...#|.##.');
g2('.', 6, '#'); g2(',', 6, '.#|#.'); g2('!', 1, '#|#|#|#|.|#'); g2('¡', 3, '#|.|#|#|#|#'); g2('?', 1, '.##.|#..#|...#|..#.|....|..#.');
g2('¿', 3, '.#..|....|.#..|#...|#..#|.##.'); g2(':', 3, '#|.|.|#'); g2(';', 3, '.#|..|..|.#|#.'); g2('-', 4, '###'); g2('—', 4, '#####');
g2('…', 6, '#.#.#'); g2("'", 1, '#|#'); g2('"', 1, '#.#|#.#'); g2('(', 1, '.#|#.|#.|#.|#.|.#'); g2(')', 1, '#.|.#|.#|.#|.#|#.');
g2('/', 1, '..#|..#|.#.|.#.|#..|#..'); g2('+', 3, '.#.|###|.#.'); g2('×', 3, '#.#|.#.|#.#'); g2('·', 4, '#'); g2('«', 3, '.#.#|#.#.|.#.#');
g2('»', 3, '#.#.|.#.#|#.#.'); g2('%', 2, '##..#|##.#.|..#..|.#.##|#..##'); g2('=', 3, '###|...|###'); g2('*', 2, '#.#|.#.|#.#');
g2('▶', 2, '#...|##..|###.|##..|#...'); g2('◀', 2, '...#|..##|.###|..##|...#'); g2('→', 2, '..#..|...#.|#####|...#.|..#..');
g2('▲', 2, '..#..|.###.|#####'); g2('▼', 3, '#####|.###.|..#..'); g2(' ', 6, '...'); g2('_', 6, '####');
// tildes: [base, fila superior, ancho forzado]
const ACC2 = { 'á': ['a', '..#.'], 'é': ['e', '..#.'], 'í': ['i', '.#', 2], 'ó': ['o', '..#.'], 'ú': ['u', '..#.'], 'ñ': ['n', '####'], 'ü': ['u', '#..#'],
  'Á': ['A', '..#.'], 'É': ['E', '..#.'], 'Í': ['I', '.#.'], 'Ó': ['O', '..#.'], 'Ú': ['U', '..#.'], 'Ñ': ['N', '.##.'], 'Ü': ['U', '#..#'] };
for (const k in ACC2) {
  const [b, acc, fw] = ACC2[k], B = F[b], low = B.top >= 2 || b === 'i';
  const w = fw || B.w, rows = [];
  // minúsculas: tilde en la fila 1; mayúsculas: en la fila 0
  if (b === 'i') { rows.push([...acc].map(c => c === '#'), [false, false]); for (let j = 2; j < B.rows.length; j++) rows.push([B.rows[j][0], false]); F[k] = { top: 1, w, rows }; continue; }
  rows.push([...acc].map(c => c === '#')); if (low) rows.push(new Array(w).fill(false));
  for (const r of B.rows) rows.push(r);
  F[k] = { top: low ? 1 : 0, w, rows };
}
export const LINE = 10;
export const glyph2 = ch => F[ch] || F['?'];
export const textW = (s, sc = 1) => { let w = 0; for (const ch of String(s)) w += (glyph2(ch).w + 1) * sc; return Math.max(0, w - sc); };
// ancho con la fuente diminuta de 3×5
export const textW3 = s => Math.max(0, String(s).length * 4 - 1);

// ───────────────────────── lienzo de índices ─────────────────────────
export class Tex {
  constructor(w, h, fill = T) {
    this.w = w; this.h = h;
    this.d = new Uint8Array(w * h).fill(fill);
    this.clip = null;
    this.ox = 0; this.oy = 0;
  }
  clear(c = T) { this.d.fill(c); return this; }
  setClip(x, y, w, h) { this.clip = x == null ? null : [x, y, x + w, y + h]; return this; }
  px(x, y, c) {
    x = (x + this.ox) | 0; y = (y + this.oy) | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === T || c == null) return;
    const k = this.clip; if (k && (x < k[0] || y < k[1] || x >= k[2] || y >= k[3])) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) { x |= 0; y |= 0; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? T : this.d[y * this.w + x]; }
  rect(x, y, w, h, c) {
    x |= 0; y |= 0; w |= 0; h |= 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  erase(x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = (x + i + this.ox) | 0, Y = (y + j + this.oy) | 0;
      if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = T;
    }
    return this;
  }
  box(x, y, w, h, c) { // contorno
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c); return this;
  }
  // rectángulo con esquinas comidas (r = 1..3)
  rrect(x, y, w, h, c, r = 1) {
    for (let j = 0; j < h; j++) {
      const e = Math.max(0, r - Math.min(j, h - 1 - j));
      const cut = e > 0 ? (r === 1 ? 1 : (e === r ? r : e === r - 1 ? 1 : 0)) : 0;
      this.rect(x + cut, y + j, w - cut * 2, 1, c);
    }
    return this;
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }
  disc(cx, cy, r, c) {
    const r2 = (r + 0.35) * (r + 0.35);
    for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) for (let i = -Math.ceil(r); i <= Math.ceil(r); i++)
      if (i * i + j * j <= r2) this.px(cx + i, cy + j, c);
    return this;
  }
  ring(cx, cy, r, c, th = 1) {
    const o = (r + 0.35) * (r + 0.35), n = Math.max(0, r - th + 0.35); const n2 = n * n;
    for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) {
      const q = i * i + j * j; if (q <= o && q > n2) this.px(cx + i, cy + j, c);
    }
    return this;
  }
  // elipse rellena
  oval(cx, cy, rx, ry, c) {
    for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) for (let i = -Math.ceil(rx); i <= Math.ceil(rx); i++) {
      const a = i / (rx + 0.35), b = j / (ry + 0.35);
      if (a * a + b * b <= 1) this.px(cx + i, cy + j, c);
    }
    return this;
  }
  // arco de anillo entre dos ángulos (radianes, 0 = arriba, sentido horario)
  arc(cx, cy, r0, r1, a0, a1, c) {
    const R = Math.ceil(r1) + 1;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const q = Math.sqrt(i * i + j * j);
      if (q < r0 - 0.35 || q > r1 + 0.35) continue;
      let a = Math.atan2(i, -j); if (a < 0) a += Math.PI * 2;
      let lo = a0, hi = a1;
      const inside = (a >= lo && a <= hi) || (a + Math.PI * 2 >= lo && a + Math.PI * 2 <= hi) || (a - Math.PI * 2 >= lo && a - Math.PI * 2 <= hi);
      if (inside) this.px(cx + i, cy + j, c);
    }
    return this;
  }
  // tramado entre dos colores: nivel 0..16 de c2 sobre c1
  dith(x, y, w, h, c1, c2, lvl = 8) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = x + i, Y = y + j;
      this.px(X, Y, BAYER[((Y + this.oy) & 3) * 4 + ((X + this.ox) & 3)] < lvl ? c2 : c1);
    }
    return this;
  }
  // degradado vertical tramado por una lista de colores
  grad(x, y, w, h, cols) {
    const n = cols.length - 1;
    for (let j = 0; j < h; j++) {
      const f = n * j / Math.max(1, h - 1), k = Math.min(n - 1, Math.floor(f)), fr = f - k;
      for (let i = 0; i < w; i++) {
        const X = x + i, Y = y + j;
        this.px(X, Y, (BAYER[(Y & 3) * 4 + (X & 3)] + 0.5) / 16 < fr ? cols[k + 1] : cols[k]);
      }
    }
    return this;
  }
  // motas al azar
  specks(x, y, w, h, c, n, rnd) {
    for (let k = 0; k < n; k++) this.px(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), c);
    return this;
  }
  // sustituye un color por otro dentro de un rectángulo
  swap(x, y, w, h, from, to) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.get(x + i, y + j) === from) this.px(x + i, y + j, to);
    return this;
  }
  // contorno de 1 px alrededor de lo pintado (dentro del rectángulo), sobre transparente
  outline(x, y, w, h, c) {
    const src = this.d.slice();
    const g = (i, j) => (i < 0 || j < 0 || i >= this.w || j >= this.h) ? T : src[j * this.w + i];
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (g(i, j) !== T) continue;
      if (g(i - 1, j) !== T || g(i + 1, j) !== T || g(i, j - 1) !== T || g(i, j + 1) !== T) this.px(i - this.ox, j - this.oy, c);
    }
    return this;
  }
  // fuente de lectura. y = tope de las mayúsculas (las tildes de mayúscula suben 1 px; las colas bajan 2)
  text(s, x, y, c = 7, sc = 1) {
    let X = x | 0; y |= 0;
    for (const ch of String(s)) {
      if (ch === '\n') { X = x | 0; y += LINE * sc; continue; }
      const g = glyph2(ch), y0 = y + (g.top - 1) * sc;
      for (let j = 0; j < g.rows.length; j++) { const r = g.rows[j]; for (let i = 0; i < r.length; i++) if (r[i]) { if (sc === 1) this.px(X + i, y0 + j, c); else this.rect(X + i * sc, y0 + j * sc, sc, sc, c); } }
      X += (g.w + 1) * sc;
    }
    return this;
  }
  // fuente diminuta de 3×5, solo mayúsculas (teclas y sellos)
  text3(s, x, y, c = 7, sc = 1) {
    s = up(s); let X = x | 0; y |= 0;
    for (const ch of s) {
      if (ch === '\n') { X = x | 0; y += 8 * sc; continue; }
      const g = glyph(ch);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g.rows[j][i]) {
        if (sc === 1) this.px(X + i, y + j, c); else this.rect(X + i * sc, y + j * sc, sc, sc, c);
      }
      if (g.top) for (let i = 0; i < 3; i++) if (g.top[i]) {
        if (sc === 1) this.px(X + i, y - 2, c); else this.rect(X + i * sc, y - 2 * sc, sc, sc, c);
      }
      X += 4 * sc;
    }
    return this;
  }
  // texto con sombra dura
  textS(s, x, y, c = 7, sh = 0, sc = 1) { this.text(s, x + sc, y + sc, sh, sc); return this.text(s, x, y, c, sc); }
  // texto con borde completo
  textO(s, x, y, c = 7, o = 0, sc = 1) {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) this.text(s, x + i, y + j, o, sc);
    return this.text(s, x, y, c, sc);
  }
  text3O(s, x, y, c = 7, o = 0) {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) this.text3(s, x + i, y + j, o);
    return this.text3(s, x, y, c);
  }
  textR(s, xr, y, c = 7, sc = 1) { return this.text(s, xr - textW(s, sc), y, c, sc); }
  textC(s, cx, y, c = 7, sc = 1) { return this.text(s, Math.round(cx - textW(s, sc) / 2), y, c, sc); }
  // copia desde otro lienzo (índice T no pinta); remap opcional {de: a}
  blit(src, sx, sy, sw, sh, dx, dy, opt = {}) {
    const { flipX = false, flipY = false, map = null, scale = 1, solid = null } = opt;
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
      let c = src.get(sx + (flipX ? sw - 1 - i : i), sy + (flipY ? sh - 1 - j : j));
      if (c === T) continue;
      if (solid != null) c = solid; else if (map && map[c] != null) c = map[c];
      if (scale === 1) this.px(dx + i, dy + j, c); else this.rect(dx + i * scale, dy + j * scale, scale, scale, c);
    }
    return this;
  }
  // dibuja con una función (x, y) => color|T
  fn(x, y, w, h, f) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = f(i, j, x + i, y + j); if (c != null && c !== T) this.px(x + i, y + j, c); }
    return this;
  }
  // sprite desde filas de texto: cada carácter es un dígito hex de paleta, '.' transparente
  spr(rows, x, y, opt = {}) {
    const { flipX = false, map = null, scale = 1 } = opt;
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[flipX ? r.length - 1 - i : i]; if (ch === '.' || ch === ' ') continue;
        let c = parseInt(ch, 16); if (map && map[c] != null) c = map[c];
        if (scale === 1) this.px(x + i, y + j, c); else this.rect(x + i * scale, y + j * scale, scale, scale, c);
      }
    }
    return this;
  }
  rgba(out) {
    const n = this.w * this.h; out = out || new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      const c = this.d[i], o = i * 4;
      if (c === T) { out[o + 3] = 0; continue; }
      const p = RGB[c]; out[o] = p[0]; out[o + 1] = p[1]; out[o + 2] = p[2]; out[o + 3] = 255;
    }
    return out;
  }
  // para verlo fuera del juego
  toCanvas(scale = 1) {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const x = c.getContext('2d'); x.putImageData(new ImageData(this.rgba(), this.w, this.h), 0, 0);
    if (scale === 1) return c;
    const b = document.createElement('canvas'); b.width = this.w * scale; b.height = this.h * scale;
    const y = b.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(c, 0, 0, b.width, b.height);
    return b;
  }
}

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  out: t => 1 - (1 - t) * (1 - t),
  out3: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t,
  io: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
  bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
};
