// logo.js — el rótulo de CEBA: cuatro letras gordas cortadas como una cebolla.
// Cada letra es un trazo (su «corazón») y un campo de distancias a ese trazo; el color sale de la distancia:
// corazón crema, anillo de túnica, veta, piel dorada y contorno. Por eso la letra puede crecer capa a capa
// al entrar y pelarse capa a capa al salir: basta con mover el grosor.
import { clamp, ease } from './px.js';

const R = 8.2;              // medio grosor del trazo
const TOP = 9, BOT = 49, MID = 29;
export const LW = 178, LH = 84, OY = 20;   // lienzo del rótulo; OY = margen de arriba (para el brote)

const arc = (cx, cy, rx, ry, a0, a1, n = 20) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
// trazos de cada letra en su caja (x desde 0); w = ancho de la caja
const GLYPHS = [
  { w: 39, rot: -0.07, dy: 1, lines: [arc(R + 14.5, MID, 14.5, 20, 0.86, Math.PI * 2 - 0.86, 30)] },
  { w: 33, rot: 0.045, dy: -2, lines: [[[R, TOP], [R, BOT]], [[R, TOP], [R + 16.5, TOP]], [[R, MID], [R + 13, MID]], [[R, BOT], [R + 16.5, BOT]]] },
  { w: 37, rot: -0.04, dy: 1, lines: [[[R, TOP], [R, BOT]], [[R, TOP], [R + 9, TOP], ...arc(R + 9, TOP + 10, 10, 10, -Math.PI / 2, Math.PI / 2, 12), [R, MID]], [[R, MID], [R + 11, MID], ...arc(R + 11, MID + 10, 10.5, 10, -Math.PI / 2, Math.PI / 2, 12), [R, BOT]]] },
  { w: 41, rot: 0.06, dy: -1, lines: [[[R, BOT], [R + 1.5, TOP + 13], ...arc(R + 12.5, TOP + 12, 11, 12, Math.PI, Math.PI * 2, 16), [R + 25, BOT]], [[R + 1, MID + 9], [R + 24, MID + 9]]] },
];
const GAP = 3;

// ── campo de distancias ──
const D = new Float32Array(LW * LH).fill(99), LI = new Uint8Array(LW * LH), NL = new Float32Array(LW * LH);
export const anchors = {};
{
  let x0 = 5;
  GLYPHS.forEach((g, i) => {
    const gx = x0, cx = gx + g.w / 2, cy = OY + MID + g.dy, c = Math.cos(g.rot), s = Math.sin(g.rot);
    const tf = (x, y) => { const X = gx + x - cx, Y = OY + y + g.dy - cy; return [cx + X * c - Y * s, cy + X * s + Y * c]; };
    g.tf = tf; g.cx = cx; g.cy = cy;
    const segs = [];
    for (const l of g.lines) { const q = l.map(p => tf(p[0], p[1])); for (let k = 0; k < q.length - 1; k++) segs.push([q[k][0], q[k][1], q[k + 1][0], q[k + 1][1]]); }
    const xa = Math.max(0, Math.floor(x0 - 6)), xb = Math.min(LW, Math.ceil(x0 + g.w + 8));
    for (let y = 0; y < LH; y++) for (let x = xa; x < xb; x++) {
      let best = 1e9, bx = 0, by = 0; const px = x + 0.5, py = y + 0.5;
      for (const [ax, ay, ex, ey] of segs) {
        const dx = ex - ax, dy = ey - ay, l2 = dx * dx + dy * dy || 1; const u = clamp(((px - ax) * dx + (py - ay) * dy) / l2);
        const qx = ax + dx * u, qy = ay + dy * u, d = (px - qx) * (px - qx) + (py - qy) * (py - qy);
        if (d < best) { best = d; bx = qx; by = qy; }
      }
      const d = Math.sqrt(best), o = y * LW + x;
      if (d < D[o]) { D[o] = d; LI[o] = i; NL[o] = d > 0.01 ? ((px - bx) * -0.55 + (py - by) * -0.83) / d : 0; }
    }
    x0 += g.w + GAP;
  });
  const [C, , , A] = GLYPHS;
  anchors.sprout = C.tf(R + 17, TOP - R + 1.5);       // coronilla de la C
  anchors.tear = A.tf(R + 12.5, MID + 9 + R - 1);     // bajo el travesaño de la A
  anchors.w = x0 - GAP + 5; anchors.base = OY + BOT + R;
}

// g[i] = cuánto ha crecido cada letra (0..1 y algo más con el rebote); bob[i] = desplazamiento vertical en píxeles;
// shine = posición del destello que la recorre (o null)
const _g = [1, 1, 1, 1], _b = [0, 0, 0, 0];
export function drawLogo(t, lx, ly, g = _g, bob = _b, shine = null) {
  const r = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) r[i] = R * g[i];
  // 1) contorno del volumen, 2) el volumen (hacia abajo a la derecha), 3) la letra
  for (let pass = 0; pass < 3; pass++) for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const o = y * LW + x, i = LI[o], d = D[o], rr = r[i]; if (d >= rr || rr < 0.6) continue;
    const X = lx + x, Y = ly + y + bob[i];
    if (pass === 0) { for (let k = 0; k <= 3; k++) { t.px(X + k + 1, Y + k, 0); t.px(X + k - 1, Y + k, 0); t.px(X + k, Y + k + 1, 0); t.px(X + k, Y + k - 1, 0); } continue; }
    if (pass === 1) { t.px(X + 1, Y + 1, 2); t.px(X + 2, Y + 2, 2); t.px(X + 3, Y + 3, 2); continue; }
    const e = rr - d, n = NL[o]; let c;
    if (e < 1.15) c = 0;
    else if (d < 1.0) c = 7;                                  // el corazón
    else if (d < 2.45) c = n > 0.5 ? 15 : 14;                  // la túnica
    else if (d < 3.4) c = 2;                                 // la veta entre capas
    else c = n > 0.42 ? 10 : n < -0.58 ? 4 : 9;               // la piel, con su luz y su sombra
    if (shine != null && c !== 0) { const q = x + (y - OY) * 0.6 - shine; if (q > 0 && q < 5) c = c === 9 || c === 4 ? 10 : 7; else if (q >= 7 && q < 9 && c === 9) c = 10; }
    else if (c === 10 && e < 3.1 && e > 1.9 && n > 0.86) c = 7;   // brillo fijo en los hombros
    t.px(X, Y, c);
  }
}

// brote de la coronilla de la C: tres hojas que crecen (k = 0..1) y se mecen
export function drawSprout(t, lx, ly, k, time, bob = 0) {
  if (k <= 0) return;
  const [ax, ay] = anchors.sprout, X = lx + ax, Y = ly + ay + bob;
  const leaf = (dx, len, bend, w, ph) => {
    const n = Math.max(2, Math.round(len * k * 1.6)), sw = Math.sin(time * 1.7 + ph) * 1.2, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, L = len * k * u; pts.push([X + dx + (bend + sw) * u * u * k, Y - L, Math.max(0.5, w * (u < 0.35 ? 0.75 + u * 0.7 : 1 - (u - 0.35) * 1.25))]); }
    for (const [x, y, rr] of pts) t.disc(Math.round(x), Math.round(y), rr + 1, 0);
    pts.forEach(([x, y, rr], i) => t.disc(Math.round(x), Math.round(y), rr, i > n * 0.8 ? 10 : 11));
    pts.forEach(([x, y, rr], i) => { if (i > 0 && i < n * 0.75 && rr >= 1.2) t.px(Math.round(x + rr * 0.6), Math.round(y), 3); });
  };
  leaf(-3, 12, -10, 1.9, 0); leaf(3, 13, 11, 2.0, 1.3); leaf(0, 19, 3, 2.5, 2.4);
  t.rect(Math.round(X) - 3, Math.round(Y) - 1, 7, 2, 4); t.rect(Math.round(X) - 2, Math.round(Y) - 2, 5, 1, 4);
}

// crecimiento de una letra con rebote
export const grow = k => k <= 0 ? 0 : ease.back(clamp(k));
