// touch.js — mando táctil para el móvil. Una capa de píxeles encima del juego, al mismo tamaño de píxel:
// palanca flotante a la izquierda, botones de la N64 imaginaria a la derecha, arrastrar para la cámara,
// tocar para pasar diálogos. Se enciende con el primer toque (o con ?touch) y se apaga al usar el teclado.
import { W, H } from './gfx.js';
import { Tex, T, clamp, lerp, ease, textW, textW3 } from './px.js';
import { G, flag } from './state.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { UI, ICON, button, tag } from './ui.js';
import { Title } from './title.js';

const q = new URLSearchParams(location.search);
const forced = q.has('touch');
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
input.touch = forced || coarse;

const cv = document.createElement('canvas');
cv.id = 'touch';
cv.style.cssText = 'position:fixed;z-index:5;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;';
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
document.body.appendChild(probe);

// geometría: px = tamaño en CSS de un píxel del juego; la capa se alinea con la rejilla del juego
const L = { px: 2, OW: 0, OH: 0, GX: 0, GY: 0, left: 0, top: 0, sl: 0, sr: 0, st: 0, sb: 0, btn: {}, stick: { x: 0, y: 0 } };
let O = null, img = null;
function layout() {
  const box = document.getElementById('box'); if (!box) return;
  const r = box.getBoundingClientRect(); const px = r.height / H; if (!(px > 0)) return;
  const nl = Math.ceil(r.left / px), nt = Math.ceil(r.top / px);
  const OW = nl + W + Math.ceil((innerWidth - r.right) / px), OH = nt + H + Math.ceil((innerHeight - r.bottom) / px);
  Object.assign(L, { px, OW, OH, GX: nl, GY: nt, left: r.left - nl * px, top: r.top - nt * px });
  cv.width = OW; cv.height = OH; cv.style.left = L.left + 'px'; cv.style.top = L.top + 'px'; cv.style.width = OW * px + 'px'; cv.style.height = OH * px + 'px';
  O = new Tex(OW, OH); img = ctx.createImageData(OW, OH);
  const cs = getComputedStyle(probe), ins = k => Math.ceil(parseFloat(cs['padding' + k]) / px) || 0;
  L.sl = ins('Left'); L.sr = ins('Right'); L.st = ins('Top'); L.sb = ins('Bottom');
  // botones: el racimo de la N64 bajo el pulgar derecho
  const R = OW - L.sr - 4, B = OH - L.sb - 4;
  L.btn = {
    a: { x: R - 22, y: B - 26, r: 15 },
    b: { x: R - 55, y: B - 13, r: 12 },
    c1: { x: R - 80, y: B - 47, r: 9 },
    c2: { x: R - 56, y: B - 60, r: 9 },
    c3: { x: R - 27, y: B - 66, r: 9 },
    z: { x: R - 88, y: B - 12, r: 9 },
    start: { x: R - 10, y: L.st + 13, r: 9 },
    zoom: { x: R - 32, y: L.st + 13, r: 8 },
    l: { x: L.sl + 14, y: OH >> 1, r: 10 },
    r: { x: R - 10, y: OH >> 1, r: 10 },
  };
  L.stick = { x: L.sl + 40, y: B - 34 };
}
addEventListener('resize', () => setTimeout(layout, 30));
addEventListener('orientationchange', () => setTimeout(layout, 200));

// qué botones hay en cada momento
function live() {
  if (!input.touch || L.portrait) return [];
  if (G.mode === 'menu') return ['a', 'b', 'c1', 'c2', 'c3', 'start', 'l', 'r'];
  if (G.mode !== 'play' || UI.top || !free()) return [];
  return ['a', 'b', 'c1', 'c2', 'c3', 'z', 'start', 'zoom'];
}
const free = () => G.mode === 'menu' || (G.mode === 'play' && G.lock <= 0 && !G.cine && !UI.top);

// ── dedos ──
const fingers = new Map(), held = {};
const stick = { on: false, id: null, bx: 0, by: 0, kx: 0, ky: 0, show: 0 };
let lastTap = 0;
const toO = e => [(e.clientX - L.left) / L.px, (e.clientY - L.top) / L.px];
function hold(b, on) {
  held[b] = Math.max(0, (held[b] || 0) + (on ? 1 : -1));
  input.set(b, held[b] > 0);
  if (on) { try { navigator.vibrate && navigator.vibrate(b === 'a' || b === 'b' ? 12 : 8); } catch (e) { } }
}
function tapA() { input.pressed.a = true; input.any = true; }
function skipHit(x, y) {
  const r = UI.S.skipRect; if (!G.skip || !r) return false;
  const gx = x - L.GX, gy = y - L.GY; return gx >= r.x - 4 && gx <= r.x + r.w + 4 && gy >= r.y - 4 && gy <= r.y + r.h + 6;
}
function onDown(e) {
  if (e.pointerType === 'mouse' && !forced) return;
  e.preventDefault();
  if (!input.touch) { input.touch = true; layout(); }
  wake();
  try { cv.setPointerCapture(e.pointerId); } catch (err) { }
  const [x, y] = toO(e), f = { x0: x, y0: y, x, y, t0: performance.now(), moved: false, kind: 'tap', cx: e.clientX, cy: e.clientY };
  fingers.set(e.pointerId, f);
  if (L.portrait) return;
  if (skipHit(x, y)) { f.kind = 'btn'; f.b = 'start'; hold('start', true); return; }
  let best = null, bd = 1e9;
  for (const k of live()) { const b = L.btn[k], d = Math.hypot(x - b.x, y - b.y); if (d < b.r + 7 && d < bd) { bd = d; best = k; } }
  if (best) { f.kind = 'btn'; f.b = best; hold(best, true); return; }
  const choice = UI.S.dlg && UI.S.dlg.choice;
  if (x < L.OW * 0.42 && (free() || choice) && !stick.on) {
    f.kind = 'stick'; stick.on = true; stick.id = e.pointerId;
    stick.bx = clamp(x, L.sl + 26, L.OW * 0.42); stick.by = clamp(y, L.st + 30, L.OH - L.sb - 26); stick.kx = stick.ky = 0; moveStick(x, y);
    return;
  }
  if (free() && G.mode === 'play') f.kind = 'cam';
}
function moveStick(x, y) {
  const M = 18; let dx = x - stick.bx, dy = y - stick.by; const d = Math.hypot(dx, dy);
  // si el dedo se va lejos, la base le sigue: nunca hay que volver al centro a buscarla
  if (d > M * 1.6) { const k = (d - M * 1.6) / d; stick.bx += dx * k; stick.by += dy * k; dx = x - stick.bx; dy = y - stick.by; }
  const m = Math.min(M, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx);
  stick.kx = Math.cos(a) * m; stick.ky = Math.sin(a) * m;
  let vx = stick.kx / M, vy = stick.ky / M; const mag = Math.hypot(vx, vy);
  if (mag < 0.14) { vx = vy = 0; } else { const s = (mag - 0.14) / 0.86 / mag; vx *= s; vy *= s; }
  input.tOn = true; input.tx = vx; input.ty = vy;
  // y como cruceta, para los menús y las elecciones
  const dir = (b, v) => { const on = input.down[b] ? v > 0.3 : v > 0.55; if (on !== !!input.down[b]) input.set(b, on); };
  dir('right', vx); dir('left', -vx); dir('down', vy); dir('up', -vy);
}
function endStick() { stick.on = false; stick.id = null; input.tOn = false; input.tx = input.ty = 0; for (const b of ['up', 'down', 'left', 'right']) if (input.down[b]) input.set(b, false); }
function onMove(e) {
  const f = fingers.get(e.pointerId); if (!f) return; e.preventDefault();
  const [x, y] = toO(e), dcx = e.clientX - f.cx, dcy = e.clientY - f.cy; f.cx = e.clientX; f.cy = e.clientY; f.x = x; f.y = y;
  if (Math.hypot(x - f.x0, y - f.y0) * L.px > 9) f.moved = true;
  if (f.kind === 'stick' && stick.id === e.pointerId) moveStick(x, y);
  else if (f.kind === 'cam' || (f.kind === 'tap' && f.moved && free() && G.mode === 'play')) {
    f.kind = 'cam';
    // un ancho de pantalla de arrastre ≈ media vuelta
    const k = 3.1 / (0.0034 * innerWidth); input.mdx += dcx * k; input.mdy += dcy * k * 0.8;
  }
}
function onUp(e) {
  const f = fingers.get(e.pointerId); if (!f) return; e.preventDefault(); fingers.delete(e.pointerId);
  if (f.kind === 'btn') { hold(f.b, false); return; }
  if (f.kind === 'stick') { endStick(); return; }
  const quick = !f.moved && performance.now() - f.t0 < 350;
  if (!quick || e.type === 'pointercancel') return;
  if (G.mode === 'title') return titleTap(f.x - L.GX, f.y - L.GY);
  if (G.mode === 'play' && free()) {
    // dos toques en la cámara: a la espalda de Ceba
    const now = performance.now(); if (now - lastTap < 330) { input.pressed.cen = true; lastTap = 0; } else lastTap = now;
    return;
  }
  if (G.mode !== 'menu') tapA();
}
function titleTap(gx, gy) {
  const S = Title.S; if (S.phase !== 'menu') { tapA(); return; }
  S.opts.forEach((o, i) => { const y = 106 + i * 16; if (gy >= y - 6 && gy <= y + 11 && gx >= 20 && gx <= 60 + textW(o)) { if (S.sel !== i) S.sel = i; } });
  tapA();
}
cv.addEventListener('pointerdown', onDown, { passive: false });
cv.addEventListener('pointermove', onMove, { passive: false });
cv.addEventListener('pointerup', onUp, { passive: false });
cv.addEventListener('pointercancel', onUp, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());
// iOS: el sonido solo arranca dentro de un gesto que acaba
cv.addEventListener('touchend', () => audio.init(), { passive: true });
// pantalla completa y apaisado, donde el navegador lo permita
let woke = false;
function wake() {
  audio.init();
  if (woke || forced) return; woke = true;
  const el = document.documentElement;
  try { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } setTimeout(layout, 300); }).catch(() => { }); } catch (e) { }
}
// el teclado de verdad apaga el mando táctil (tabletas con teclado)
addEventListener('keydown', e => { if (!forced && input.touch && !e.repeat && e.isTrusted) { input.touch = false; for (const f of fingers.keys()) fingers.delete(f); endStick(); } });

// ── dibujo ──
const vis = {}; let tt = 0, learnT = 0;
function ghost(t, x, y, r, c) { t.ring(x, y, r + 1, 0, 1); t.ring(x, y, r, c, 1); }
function lupa(t, x, y, c) { t.ring(x - 1, y - 1, 3, c, 1); t.line(x + 1, y + 1, x + 3, y + 3, c); t.px(x + 3, y + 4, c); }
function hamb(t, x, y, c) { for (let i = 0; i < 3; i++) t.rect(x - 3, y - 3 + i * 3, 7, 1, c); }
function arrow(t, x, y, d, c) { for (let i = 0; i < 4; i++) t.rect(x - d * i, y - i, 1, i * 2 + 1, c); }
export const touch = {
  L,
  // con el móvil en vertical el juego espera
  blocked() { return input.touch && L.portrait; },
  draw(dt) {
    if (!O || !L.OW) layout();
    const port = input.touch && !forced && innerHeight > innerWidth * 1.05;
    if (port !== L.portrait) { L.portrait = port; if (port) { for (const f of fingers.keys()) fingers.delete(f); endStick(); for (const b in held) if (held[b]) { held[b] = 0; input.set(b, false); } } }
    cv.style.display = input.touch ? 'block' : 'none';
    if (!input.touch || !O) return;
    tt += dt; O.clear();
    if (L.portrait) { drawPortrait(O); return flush(); }
    const lv = new Set(live()), on = free(), sv = G.save, p = G.player;
    for (const k in L.btn) vis[k] = clamp((vis[k] || 0) + (lv.has(k) ? dt : -dt) * 6);
    // palanca
    stick.show = clamp(stick.show + (stick.on ? dt : -dt) * 8);
    const sx = stick.on ? stick.bx : L.stick.x, sy = stick.on ? stick.by : L.stick.y;
    if (stick.on) {
      const R = 24; O.disc(sx, sy, R + 1, 0); O.ring(sx, sy, R, 9, 2); O.ring(sx, sy, R - 2, 4, 1);
      for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2; O.px(Math.round(sx + Math.cos(an) * (R - 6)), Math.round(sy + Math.sin(an) * (R - 6)), 2); }
      const kx = Math.round(sx + stick.kx), ky = Math.round(sy + stick.ky);
      O.disc(kx, ky + 1, 11, 0); O.disc(kx, ky, 11, 0); O.disc(kx, ky, 10, 4); O.disc(kx, ky - 1, 9, 9); O.ring(kx, ky - 1, 6, 10, 1); O.disc(kx, ky - 1, 3, 15); O.px(kx - 5, ky - 5, 7); O.px(kx - 4, ky - 6, 7);
    } else if (on && G.mode === 'play' && lv.size) {
      ghost(O, sx, sy, 24, 5); ghost(O, sx, sy, 10, 5);
      if (!flag('h_tactil')) O.textC('Mover', sx, sy + 28, 6);
    }
    // botones
    const pr = b => input.down[b];
    const dim = !on;
    const B = (k, c, dark, draw) => {
      const v = vis[k]; if (v <= 0) return; const b = L.btn[k], r = Math.round(b.r * ease.back(v));
      if (r < 2) return;
      if (dim && k !== 'start') { ghost(O, b.x, b.y, r, 5); return; }
      O.disc(b.x, b.y + 1, r + 2, 0); O.ring(b.x, b.y, r + 1, 7, 1);
      button(O, b.x, b.y, r, c, dark, null, null, pr(k)); if (v > 0.8 && draw) draw(b.x, b.y + (pr(k) ? 1 : 0));
    };
    const L3 = (s, x, y, c = 7) => O.text3O(s, x - (textW3(s) >> 1), y, c, 0);
    // B: la Hoja
    B('b', 11, 3, (x, y) => { if (sv.items.hoja) O.spr(ICON.hoja, x - 5, y - 6); else O.textC('B', x, y - 3, 3); });
    // A: acción, con su rótulo encima
    const act = G.action || '';
    B('a', 12, 1, (x, y) => O.textC('A', x, y - 3, 7, 1));
    if (vis.a > 0.8 && act && on && G.mode === 'play') tag(O, L.btn.a.x - 6, L.btn.a.y - L.btn.a.r - 10, act, 12, 7, 1);
    // C: los tres bolsillos
    for (let i = 0; i < 3; i++) {
      const k = 'c' + (i + 1), id = sv.c[i];
      B(k, 10, 9, (x, y) => {
        if (id && ICON[id]) O.spr(ICON[id], x - 5, y - 6, { map: p.layers <= 1 && id === 'mondador' ? { 8: 5, 14: 5, 6: 5, 2: 5 } : id === 'ajo' && !sv.ajos ? { 7: 5, 6: 5, 15: 5, 13: 5, 4: 5 } : null });
        else L3('UIO'[i], x, y - 2, 4);
        if (id === 'ajo') { const n = String(sv.ajos || 0); O.rrect(x + 3, y - 13, textW3(n) + 4, 8, 0, 1); O.text3(n, x + 5, y - 12, sv.ajos ? 10 : 8); }
      });
      if (vis[k] > 0.8 && !dim && id) L3('UIO'[i], L.btn[k].x + 8, L.btn[k].y + 5);
    }
    // Z: fijar
    B('z', 14, 2, (x, y) => O.textC('Z', x, y - 3, 7));
    // pausa y zoom, arriba
    B('start', 13, 5, (x, y) => hamb(O, x, y, 1));
    B('zoom', 13, 5, (x, y) => lupa(O, x, y, 1));
    // pasar página en el menú
    B('l', 8, 2, (x, y) => arrow(O, x - 2, y, -1, 7));
    B('r', 8, 2, (x, y) => arrow(O, x + 2, y, 1, 7));
    // primera vez: qué es cada cosa
    if (on && G.mode === 'play' && !flag('h_tactil') && G.save.flags.intro) {
      const a = L.btn.a; O.textC('Arrastra: cámara', Math.round((L.OW * 0.42 + a.x - 30) / 2), L.st + 34, 6);
      if (Math.hypot(p.vel.x, p.vel.z) > 1 && stick.on) { learnT += dt; if (learnT > 2.5) flag('h_tactil', 1); }
    }
    flush();
  },
};
function drawPortrait(t) {
  const cx = L.OW >> 1, cy = L.OH >> 1;
  t.rect(0, 0, L.OW, L.OH, 0);
  const a = ease.io(clamp((tt % 2.4) / 0.9)), w = Math.round(lerp(18, 32, a)), h = Math.round(lerp(32, 18, a));
  t.rrect(cx - (w >> 1) - 1, cy - 30 - (h >> 1) - 1, w + 2, h + 2, 9, 3); t.rrect(cx - (w >> 1) + 1, cy - 30 - (h >> 1) + 1, w - 2, h - 2, 1, 2);
  t.disc(cx, cy - 30, 3, 10);
  t.textC('Gira el móvil', cx, cy, 7, 2); t.textC('Ceba se juega en apaisado', cx, cy + 22, 13);
}
function flush() { O.rgba(img.data); ctx.putImageData(img, 0, 0); }
