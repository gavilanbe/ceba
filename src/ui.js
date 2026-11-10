// ui.js — HUD, diálogos, avisos, rótulos de zona, transiciones y la ventana de objeto nuevo.
import { THREE, W, H, makeSky, U } from './gfx.js';
import { Tex, T, BAYER, clamp, lerp, ease, textW, up } from './px.js';
import { G, flag, wait } from './state.js';
import { input, KEYNAME } from './input.js';
import { audio } from './audio.js';
import { TXT, ITEMS } from './text.js';
import { SKINS } from './art/hero.js';

export const ui = new Tex(W, H);

// ───────── iconos ─────────
export const ICON = {
  hoja: ['.........77', '........7b7', '.......7bb.', '......7bb3.', '.....7bb3..', '....7bb3...', '...abb3....', '..4ab3.....', '.4f4a......', '4f4........', '.4.........'],
  mondador: ['......666..', '.....6..66.', '....6...6..', '....6..6...', '....666....', '...88......', '..8e2......', '.8e2.......', '8e2........', '82.........', '...........'],
  llave: ['..aaaa.....', '.a9..9a....', '.a....a....', '.a9..9a....', '..aaaa.....', '....aa.....', '.....aa....', '......aaa..', '.......aa9.', '......a.a..', '...........'],
  capa: ['...aaaaa...', '..a77aaa9..', '.aa.....a9.', '.a.......a9', '.a.......a9', '.a.......a9', '.aa.....a9.', '..aaaaaa9..', '...99999...', '...........', '...........'],
  lagrima: ['...c...', '...c...', '..ccc..', '..c7c..', '.c7ccc.', '.ccccc.', '.ccc1c.', '..ccc..'],
  lagrimon: ['...e...', '...e...', '..eee..', '..e7e..', '.e7eee.', '.eeeee.', '.eee2e.', '..eee..'],
  candela: ['.6...6.', '.66.66.', '..111..', '.11111.', '..aaa..', '.aa7aa.', '..aaa..'],
  rodar: ['..999..', '.9ff99.', '9f99994', '9999994', '9999944', '.99944.', '..444..'],
};

// ───────── piezas de papel de cebolla ─────────
// panel con borde y vetas. tono: 'papel' (claro) u 'oscuro'
export function panel(t, x, y, w, h, tone = 'papel') {
  const P = tone === 'papel' ? { bg: 15, vein: 9, edge: 4, hi: 7, out: 0 } : tone === 'rosa' ? { bg: 14, vein: 8, edge: 2, hi: 15, out: 0 } : { bg: 1, vein: 2, edge: 13, hi: 13, out: 0 };
  t.rrect(x - 1, y - 1, w + 2, h + 2, P.out, 2); t.rrect(x, y, w, h, P.edge, 2); t.rrect(x + 1, y + 1, w - 2, h - 2, P.bg, 1);
  // vetas curvas
  t.setClip(x + 1, y + 1, w - 2, h - 2);
  for (let k = 0; k < 4; k++) { const cx = x + w * (0.1 + k * 0.3), r = h * (1.6 + k * 0.25); t.ring(cx, y + h + r * 0.72, r, P.vein, 1); }
  t.setClip(null);
  t.rect(x + 2, y + 1, w - 4, 1, P.hi);
  return P;
}
export function header(t, x, y, w, label, c = 8) {
  t.rect(x, y, w, 9, c); t.rect(x, y + 8, w, 1, 2);
  t.rect(x + 3, y + 2, 5, 1, 7); t.rect(x + 3, y + 4, 5, 1, 7); t.rect(x + 3, y + 6, 5, 1, 7);
  t.text(label, x + 12, y + 2, 7);
}
export function button(t, cx, cy, r, c, dark, label, key, pressed) {
  if (pressed) cy += 1;
  t.disc(cx, cy + 1, r, 0); t.disc(cx, cy, r, dark); t.disc(cx, cy - 1, r - 1, c);
  t.px(cx - r + 2, cy - 2, 7); t.px(cx - r + 3, cy - 3, 7);
  if (label) t.text(label, cx - 1, cy - 3, 7);
}
// cebolla en corte: anillos = capas. cx, cy centro; n capas vivas; max total
export function onionGauge(t, cx, cy, n, max, o = {}) {
  const core = o.core ?? 3, th = o.th ?? (max <= 4 ? 3 : 2), R = core + max * th + 1;
  t.disc(cx, cy + 1, R + 1, 0); t.disc(cx, cy, R + 1, 0);
  t.disc(cx, cy, R, 1);
  for (let i = max; i >= 1; i--) {
    const r1 = core + i * th, sk = SKINS[Math.min(3, i)];
    if (i <= n) { let c = sk.base; if (o.flash && i === n && Math.floor(G.t * 14) % 2) c = 7; t.disc(cx, cy, r1, c); t.ring(cx, cy, r1, sk.vein, 1); }
    else { for (let a = 0; a < 16; a++) { const an = a / 16 * 6.283 + G.t * 0.4; t.px(Math.round(cx + Math.cos(an) * (r1 - 0.5)), Math.round(cy + Math.sin(an) * (r1 - 0.5)), a % 2 ? 13 : 5); } }
  }
  if (n >= 1) { t.disc(cx, cy, core - 1, 7); t.px(cx, cy, 11); t.px(cx, cy - 1, 11); t.px(cx - 1, cy - 1, 7); }
  else { t.px(cx, cy, 5); }
  if (o.crack && n >= 1) { const r = core + n * th; t.line(cx + 1, cy - r, cx + 3, cy - r + 3, 0); t.line(cx + 3, cy - r + 3, cx + 1, cy - r + 5, 0); t.line(cx + 1, cy - r + 5, cx + 4, cy - r + 8, 0); }
  // brillo
  if (n >= 1) { t.px(cx - R + 3, cy - 3, 7); t.px(cx - R + 4, cy - 4, 7); }
  return R;
}

// ───────── texto con marcas: *rojo* _azul_ ~onda~ ^verde^ ─────────
function parse(s) { const out = []; let c = null, wave = false; for (const ch of s) { if (ch === '*') { c = c === 8 ? null : 8; continue; } if (ch === '_') { c = c === 12 ? null : 12; continue; } if (ch === '^') { c = c === 3 ? null : 3; continue; } if (ch === '~') { wave = !wave; continue; } out.push({ ch, c, wave }); } return out; }
const plain = s => s.replace(/[*_~^]/g, '');
export function wrap(s, max) {
  const lines = []; for (const para of s.split('\n')) { let cur = ''; for (const w of para.split(' ')) { if (plain(cur + (cur ? ' ' : '') + w).length > max) { lines.push(cur); cur = w; } else cur += (cur ? ' ' : '') + w; } lines.push(cur); } return lines;
}
function drawRich(t, line, x, y, base, n = 1e9, time = 0) {
  const P = parse(line); let X = x;
  for (let i = 0; i < P.length && i < n; i++) { const g = P[i]; t.text(g.ch, X, y + (g.wave ? Math.round(Math.sin(time * 9 + i * 0.9) * 1.4) : 0), g.c ?? base); X += 4; }
  return P.length;
}

// ───────── estado de la interfaz ─────────
const S = {
  dlg: null, toasts: [], hint: null, title: null, fade: 0, fadeC: 0, iris: null, hud: 1, tearShown: 0, tearBump: 0, layerFx: [], crackT: 0, healT: 0, hurtT: 0,
  bars: 0, itemWin: null, view: null, boss: null, bossShown: 0, prompt: 0, credits: null, card: null, aPulse: 0, lastAction: null,
};
export const UI = {
  S,
  onCrack() { S.crackT = 0.6; S.hurtT = 0.35; },
  onLayer(from, to) { S.layerFx.push({ t: 0, i: from }); },
  onHurt() { S.hurtT = 0.5; },
  onHeal() { S.healT = 0.5; },
  onTears() { S.tearBump = 0.25; },
  view: null,
};
G.ui = UI;

// aviso de Candela (no bloquea)
G.hint = (key, dur = 5.5) => { let txt = TXT[key] || key; if (Array.isArray(txt)) txt = txt.join(' '); txt = txt.replace(/@[^|]*\|/g, ''); S.hint = { lines: wrap(txt, 40), t: 0, dur }; if (G.candela) G.candela.call(); };
G.hintOnce = (id, key) => { if (flag('h_' + id)) return; flag('h_' + id, 1); G.hint(key); };
G.toast = (text, icon) => { S.toasts.push({ text, icon, t: 0 }); audio.sfx('select'); };
G.areaTitle = (title, sub) => { S.title = { title, sub, t: 0 }; };

// diálogo (generador). who: nombre o null; key: clave de TXT, texto o lista de páginas
G.say = function* (who, key, o = {}) {
  let src = TXT[key] ?? key; if (typeof src === 'function') src = src();
  const pages = Array.isArray(src) ? src : String(src).split('\n\n');
  const sp = G.speaker; const voice = o.voice ?? (sp ? sp.voice : 1.2);
  G.lock++; S.dlg = { name: who ?? (sp ? sp.name : null), lines: [], n: 0, t: 0, open: 0, done: false, tone: o.tone || 'papel' };
  const d = S.dlg;
  yield* wait(0.12);
  for (let pg of pages) {
    if (pg[0] === '@') { const i = pg.indexOf('|'); d.name = pg.slice(1, i); pg = pg.slice(i + 1); }
    const all = wrap(pg, 56);
    for (let i = 0; i < all.length; i += 3) {
      d.lines = all.slice(i, i + 3); d.n = 0; d.done = false; d.t = 0;
      const total = d.lines.reduce((a, l) => a + plain(l).length, 0); let acc = 0, last = 0;
      while (d.n < total) {
        const dt = yield; G.talking = true;
        acc += dt * (input.down.b ? 110 : 46); d.n = Math.min(total, Math.floor(acc));
        if (d.n > last) { const flat = d.lines.map(plain).join(''); const ch = flat[d.n - 1]; if (ch && ch !== ' ' && (d.n % 2 === 0)) audio.sfx('blip', { pitch: voice * (0.92 + Math.random() * 0.16) }); if ('.,!?…'.includes(ch)) acc -= ch === ',' ? 5 : 10; last = d.n; }
        if (input.hit('a')) { d.n = total; acc = total; }
      }
      G.talking = false; d.done = true; input.pressed.a = input.pressed.b = false;
      let hold = 0; while (!(input.hit('a') || input.hit('b') || (o.auto && hold > o.auto))) hold += yield;
      audio.sfx('talk');
    }
  }
  S.dlg = null; G.lock--; yield;
};
// elegir entre opciones (generador que devuelve el índice)
G.choose = function* (prompt, opts) {
  G.lock++; S.dlg = { name: G.speaker ? G.speaker.name : null, lines: wrap(TXT[prompt] ?? prompt, 56), n: 1e9, t: 0, open: 0, done: false, choice: { opts, i: 0 }, tone: 'papel' };
  const c = S.dlg.choice; input.pressed = {};
  for (;;) { yield; if (input.hit('up') || input.hit('left')) { c.i = (c.i + opts.length - 1) % opts.length; audio.sfx('menuMove'); } if (input.hit('down') || input.hit('right')) { c.i = (c.i + 1) % opts.length; audio.sfx('menuMove'); } if (input.hit('a')) break; }
  audio.sfx('select'); S.dlg = null; G.lock--; return c.i;
};

// fundidos y cortinilla de anillos
G.fade = function* (to, t = 0.4, c = 0) { const from = S.fade; S.fadeC = c; let e = 0; while (e < t) { e += yield; S.fade = lerp(from, to, clamp(e / t)); } S.fade = to; };
G.iris = function* (close, t = 0.7, cx = W / 2, cy = H / 2) { S.iris = { k: close ? 0 : 1, cx, cy }; let e = 0; while (e < t) { e += yield; const f = ease.io(clamp(e / t)); S.iris.k = close ? f : 1 - f; } if (!close) S.iris = null; else S.iris.k = 1; };

// ───────── ventana de objeto nuevo (un picoCAD de bolsillo) ─────────
const viewScene = new THREE.Scene(), viewSky = makeSky(), viewCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
viewScene.add(viewSky); let viewObj = null, viewSpin = new THREE.Group(); viewScene.add(viewSpin);
export function setView(make, o = {}) {
  if (viewObj) viewSpin.remove(viewObj); viewObj = null; if (!make) { UI.view = null; return null; }
  const M = make(); viewObj = M.root || M.g || M; viewSpin.add(viewObj); viewSpin.rotation.set(0, 0, 0);
  viewObj.position.set(0, 0, 0); viewObj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(viewObj), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()).length();
  viewObj.position.sub(c);
  viewSky.material.uniforms.uC.value = o.sky || [12, 12, 12, 12];
  UI.view = { scene: viewScene, cam: viewCam, spin: viewSpin, dist: s * (o.zoom || 1.0) * 1.6, x: 0, y: 0, w: 10, h: 10, M, tilt: o.tilt ?? 0.35 };
  return M;
}
G.giveItem = function* (id, o = {}) {
  const it = ITEMS[id]; const p = G.player;
  if (it.tears) { // premio en lágrimas: sin ventana grande
    audio.jingle('item'); G.addTears(0); G.save.tears = Math.min(999, G.save.tears + it.tears);
    yield* G.say(null, it.text); return;
  }
  G.lock++; p.pose = { L: [-0.42, 1.05, 0.2], R: [0.42, 1.05, 0.2] }; p.faceOv = 'happy';
  const dur = audio.jingle(it.big ? 'itemBig' : 'item');
  const w = { id, it, t: 0, out: 0 }; S.itemWin = w; setView(it.make, { zoom: it.zoom });
  if (it.give) it.give();
  G.save.items[id] = (G.save.items[id] || 0) + 1;
  if (it.c && !G.save.c.includes(id)) { const i = G.save.c.indexOf(null); if (i >= 0) G.save.c[i] = id; }
  yield* wait(Math.min(dur, 2.4));
  yield* G.say(null, it.text);
  w.out = 0.001; yield* wait(0.3); S.itemWin = null; setView(null);
  p.pose = null; p.faceOv = null; G.lock--;
};

// ───────── dibujar ─────────
const pr = { x: 0, y: 0, z: 0 };
export function drawUI(dt) {
  const t = ui; t.clear(); const p = G.player, sv = G.save, play = G.mode === 'play';
  if (UI.under) UI.under(t, dt);
  S.bars = lerp(S.bars, G.cam ? G.cam.barsT : 0, 0.3);
  const hudWant = play && !G.cine && !S.itemWin ? 1 : 0; S.hud = lerp(S.hud, hudWant, 1 - Math.exp(-12 * dt));
  const hy = Math.round((1 - S.hud) * -40);

  if (play && G.cam) {
    // retículo de objetivo
    const tg = G.target;
    if (tg) {
      G.cam.project(tg.pos.x, tg.pos.y + (tg.hh || 0.5), tg.pos.z, pr);
      if (pr.z < 1) { const s = 9 + Math.round(Math.sin(G.t * 10) * 1.5), x = Math.round(pr.x), y = Math.round(pr.y), c = tg.enemy ? 10 : 11; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { t.rect(x + sx * s - (sx > 0 ? 3 : 0), y + sy * s, 4, 1, c); t.rect(x + sx * s, y + sy * s - (sy > 0 ? 3 : 0), 1, 4, c); t.px(x + sx * s, y + sy * s, 7); }
        const ay = y - s - 9 + Math.round(Math.sin(G.t * 8) * 2); t.spr(['0000000', '0aaaaa0', '.0aaa0.', '..0a0..', '...0...'], x - 3, ay, { map: { 10: c } }); }
    }
    // burbuja A sobre lo que se puede usar
    const ae = G.actionEnt;
    if (ae && G.lock <= 0 && S.hud > 0.8) {
      G.cam.project(ae.pos.x, ae.pos.y + (ae.hh || 0.5) * 2 + 0.55, ae.pos.z, pr);
      if (pr.z < 1) { const x = Math.round(pr.x), y = Math.round(pr.y + Math.sin(G.t * 6) * 2); t.disc(x, y + 1, 5, 0); t.disc(x, y, 5, 1); t.disc(x, y - 1, 4, 12); t.text('A', x - 1, y - 3, 7); t.px(x, y + 6, 0); t.px(x, y + 5, 1); }
    }
  }

  // barras de cine
  const bh = Math.round(S.bars * 14);
  if (bh > 0) { t.rect(0, 0, W, bh, 0); t.rect(0, H - bh, W, bh, 0); }

  if (S.hud > 0.02 && sv) {
    // ── capas: la cebolla en corte ──
    const gx = 20, gy = 19 + hy;
    const R = onionGauge(t, gx, gy, p.layers, p.maxLayers, { crack: p.crack, flash: S.healT > 0 || (p.layers === 1 && Math.floor(G.t * 3) % 2 === 0 && p.maxLayers > 1) });
    S.crackT = Math.max(0, S.crackT - dt); S.healT = Math.max(0, S.healT - dt);
    if (S.healT > 0) t.ring(gx, gy, R + 2 + (0.5 - S.healT) * 12, 11, 1);
    // capa que sale volando
    for (const f of S.layerFx) { f.t += dt; const k = f.t / 0.7, sk = SKINS[Math.min(3, f.i)]; const x = gx + k * 26, y = gy - Math.sin(k * 3.14) * 16 + k * k * 26; t.arc(x, y, 6, 9, k * 9, k * 9 + 3.6, sk.base); t.arc(x, y, 9, 9, k * 9, k * 9 + 3.6, sk.vein); }
    S.layerFx = S.layerFx.filter(f => f.t < 0.7);
    // ── lágrimas ──
    if (S.tearShown !== sv.tears) { const d = sv.tears - S.tearShown; S.tearShown += Math.sign(d) * Math.max(1, Math.floor(Math.abs(d) * 0.2)); }
    S.tearBump = Math.max(0, S.tearBump - dt);
    const tx = gx + R + 7, ty = gy - 4 + hy * 0 - Math.round(S.tearBump * 12);
    t.spr(ICON.lagrima, tx, ty - 2); t.spr(ICON.lagrima, tx, ty - 2);
    const num = String(S.tearShown).padStart(3, '0'); t.textO(num, tx + 9, ty, S.tearBump > 0 ? 10 : 7, 0);
    // ── botones ──
    const pressed = b => input.down[b] && G.lock <= 0;
    const bx = 226, by = 15 + hy;
    // B: la Hoja
    button(t, bx, by + 2, 9, 11, 3, null, null, pressed('b'));
    if (sv.items.hoja) t.spr(ICON.hoja, bx - 5, by - 3 + (pressed('b') ? 1 : 0)); else t.text('B', bx - 1, by - 1, 3);
    t.textO(KEYNAME.b, bx - 1, by + 13, 6, 0);
    // A: lo que toque
    const act = G.action || '';
    if (act !== S.lastAction) { S.lastAction = act; S.aPulse = 0.2; } S.aPulse = Math.max(0, S.aPulse - dt);
    const ax = bx + 23, ay = by + 9 - Math.round(S.aPulse * 14);
    button(t, ax, ay, 10, 12, 1, null, null, pressed('a'));
    t.text('A', ax - 1, ay - 3, act ? 7 : 1);
    if (act) { const lw = textW(act) + 6, lx = ax - (lw >> 1), ly = ay + 12; t.rrect(lx - 1, ly - 1, lw + 2, 9, 0, 2); t.rrect(lx, ly, lw, 7, 12, 1); t.text(act, lx + 3, ly + 1, 7); }
    else t.textO(KEYNAME.a, ax - 5, ay + 13, 6, 0);
    // C: objetos
    const CX = [bx + 46, bx + 59, bx + 72], CY = [by - 2, by + 8, by - 2];
    for (let i = 0; i < 3; i++) {
      const id = sv.c[i], pd = pressed('c' + (i + 1));
      button(t, CX[i], CY[i], 7, 10, 9, null, null, pd);
      if (id && ICON[id]) t.spr(ICON[id], CX[i] - 5, CY[i] - 6 + (pd ? 1 : 0), { map: p.layers <= 1 && id === 'mondador' ? { 8: 5, 14: 5, 6: 5, 2: 5 } : null });
      t.textO(KEYNAME['c' + (i + 1)], CX[i] - 1, CY[i] + 9, 6, 0);
    }
    // llave mayor
    if (sv.items.llave && G.level && G.level.name === 'cisterna') t.spr(ICON.llave, 6, 38 + hy);
  }

  // ── jefe ──
  if (G.boss && G.boss.shown) {
    S.bossShown = lerp(S.bossShown, 1, 0.1); const b = G.boss, w = 150, x = (W - w) >> 1, y = H - 16 + Math.round((1 - S.bossShown) * 20) - bh;
    t.textO(b.name, x, y - 8, 14, 0); t.rrect(x - 2, y - 1, w + 4, 8, 0, 2); t.rect(x, y + 1, w, 4, 2);
    const k = clamp(b.hp / b.maxHp); b.lag = lerp(b.lag ?? 1, k, 0.06); t.rect(x, y + 1, Math.round(w * b.lag), 4, 7); t.rect(x, y + 1, Math.round(w * k), 4, 8); t.rect(x, y + 1, Math.round(w * k), 1, 14);
    for (let i = 1; i < 3; i++) t.rect(x + Math.round(w * i / 3), y + 1, 1, 4, 0);
  } else S.bossShown = 0;

  // ── rótulo de zona ──
  if (S.title) {
    const a = S.title; a.t += dt; const D = 3.6;
    if (a.t > D) S.title = null; else {
      const cy = 118, n = a.title.length, wd = textW(a.title, 2), x0 = (W - wd) >> 1, out = clamp((a.t - (D - 0.5)) / 0.5);
      // anillos de adorno
      const rk = ease.out3(clamp(a.t / 0.6)) * (1 - out);
      if (rk > 0.02) { t.setClip(0, cy - 26, W, 60); for (let i = 0; i < 3; i++) t.arc(W / 2, cy + 64, 96 - i * 6, 97 - i * 6, -1.05 * rk, 1.05 * rk, [9, 14, 7][i]); t.setClip(null); }
      for (let i = 0; i < n; i++) { const k = clamp((a.t - i * 0.05) / 0.3); if (k <= 0) continue; const dy = Math.round((1 - ease.bounce(k)) * -18 - out * out * 30 * (i % 2 ? 1 : -1)); if (out < 1) t.textO(a.title[i], x0 + i * 8, cy + dy, 7, 0, 2); }
      if (a.t > 0.7 && out < 0.5) { const sw = textW(a.sub); t.rect((W - sw) / 2 - 4, cy + 16, sw + 8, 9, 8); t.rect((W - sw) / 2 - 4, cy + 24, sw + 8, 1, 2); t.text(a.sub, (W - sw) >> 1, cy + 18, 7); }
    }
  }

  // ── aviso de Candela ──
  if (S.hint) {
    const h = S.hint; h.t += dt; if (h.t > h.dur || (S.dlg && h.t > 0.1)) S.hint = null; else {
      const k = ease.back(clamp(h.t / 0.3)) * (1 - clamp((h.t - (h.dur - 0.3)) / 0.3)), hh = h.lines.length * 8 + 8, wd = Math.max(...h.lines.map(l => plain(l).length)) * 4 + 26;
      const x = 6, y = H - 10 - hh + Math.round((1 - k) * 50) - bh;
      t.rrect(x - 1, y - 1, wd + 2, hh + 2, 0, 2); t.rrect(x, y, wd, hh, 1, 2); t.rect(x + 2, y + 1, wd - 4, 1, 13);
      t.disc(x + 9, y + (hh >> 1), 6, 0); t.disc(x + 9, y + (hh >> 1), 5, Math.floor(G.t * 6) % 2 ? 10 : 9); t.spr(ICON.candela, x + 6, y + (hh >> 1) - 4);
      h.lines.forEach((l, i) => drawRich(t, l, x + 20, y + 5 + i * 8, 7, Math.floor(h.t * 60) - i * 40, G.t));
    }
  }
  // ── avisos ──
  for (const a of S.toasts) {
    a.t += dt; const k = ease.back(clamp(a.t / 0.3)) * (1 - clamp((a.t - 2.2) / 0.3)), wd = textW(a.text) + 22, x = (W - wd) >> 1, y = Math.round(-14 + k * 22);
    t.rrect(x - 1, y - 1, wd + 2, 13, 0, 2); t.rrect(x, y, wd, 11, 3, 2); t.rect(x + 2, y + 1, wd - 4, 1, 11); t.text(a.text, x + 16, y + 3, 7);
    t.rect(x + 6, y + 6, 5, 2, 4); t.rect(x + 8, y + 2, 1, 4, 11); t.px(x + 7, y + 3, 11); t.px(x + 9, y + 2, 11);
  }
  S.toasts = S.toasts.filter(a => a.t < 2.5);

  // ── ventana de objeto nuevo ──
  if (S.itemWin) {
    const w = S.itemWin; w.t += dt; if (w.out) w.out += dt;
    const k = w.out ? 1 - ease.in(clamp(w.out / 0.25)) : ease.back(clamp(w.t / 0.35));
    const ww = 132, wh = 104, x = (W - ww) >> 1, y = Math.round(lerp(-wh - 10, 8, k));
    t.rect(x - 2, y - 2, ww + 4, wh + 4, 0);
    header(t, x, y, ww, '¡OBJETO NUEVO!'); t.rect(x + ww - 9, y + 2, 5, 5, 7); t.rect(x + ww - 8, y + 3, 3, 3, 8);
    // el visor 3D queda transparente; debajo, su hoja de textura como en picoCAD
    const vh = 62; t.erase(x, y + 9, ww, vh);
    t.rect(x, y + 9 + vh, ww, 24, 0);
    const sheet = UI.view && UI.view.M && (UI.view.M.t || (UI.view.M.tex && UI.view.M.tex.userData.src));
    if (sheet && w.it.rect) { const r = w.it.rect, sc = Math.min(1, 22 / r[3], (ww - 8) / r[2]); const dw = Math.floor(r[2] * sc), dh = Math.floor(r[3] * sc); for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) { const c = sheet.get(r[0] + Math.floor(i / sc), r[1] + Math.floor(j / sc)); if (c !== T) t.px(x + ((ww - dw) >> 1) + i, y + 10 + vh + ((22 - dh) >> 1) + j, c); } t.px(x + ww - 6, y + 12 + vh, 6); t.px(x + ww - 6, y + 15 + vh, 13); t.px(x + ww - 6, y + 18 + vh, 5); }
    t.rect(x, y + wh - 9, ww, 9, 8); t.text('+', x + 4, y + wh - 7, 7); t.text(w.it.name, x + 12, y + wh - 7, 7);
    // destellos
    for (let i = 0; i < 6; i++) { const a = G.t * 1.5 + i * 1.047, rr = 50 + Math.sin(G.t * 3 + i) * 6; const sx = x + ww / 2 + Math.cos(a) * rr * 1.4, sy = y + 40 + Math.sin(a) * rr * 0.5; if (sx < x - 3 || sx > x + ww + 3) t.spr(['.a.', 'a7a', '.a.'], Math.round(sx), Math.round(sy)); }
    if (UI.view) { UI.view.x = x; UI.view.y = y + 9; UI.view.w = ww; UI.view.h = vh; UI.view.spin.rotation.y += dt * 2.2; }
  }

  // ── diálogo ──
  if (S.dlg) {
    const d = S.dlg; d.open = Math.min(1, d.open + dt * 7); d.t += dt;
    const bw = 248, bh2 = 40, x = (W - bw) >> 1, y = H - bh2 - 8 + Math.round((1 - ease.back(d.open)) * 30) - Math.round(S.bars * 4);
    const P = panel(t, x, y, bw, bh2, d.tone);
    // borde superior rasgado
    for (let i = 4; i < bw - 4; i += 5) t.px(x + i + ((i * 7) % 3), y - 1, P.edge);
    if (d.name) { const nw = textW(d.name) + 10; t.rrect(x + 7, y - 8, nw + 2, 12, 0, 2); t.rrect(x + 8, y - 7, nw, 10, 8, 1); t.rect(x + 9, y - 6, nw - 2, 1, 14); t.text(d.name, x + 13, y - 4, 7); }
    let n = d.n; const tc = d.tone === 'oscuro' ? 7 : 1;
    d.lines.forEach((l, i) => { const used = drawRich(t, l, x + 10, y + 8 + i * 10, tc, n, G.t); n -= used; });
    if (d.choice) { const c = d.choice; let cx = x + 14; const cy = y + 8 + d.lines.length * 10; c.opts.forEach((o, i) => { const sel = i === c.i, ow = textW(o) + 8; if (sel) { t.rrect(cx - 4, cy - 2, ow, 9, 8, 1); t.text('▶', cx - 9 + Math.round(Math.sin(G.t * 10)), cy, 8); } t.text(o, cx, cy, sel ? 7 : 4); cx += ow + 14; }); }
    else if (d.done) { const by2 = y + bh2 - 9 + Math.round(Math.abs(Math.sin(G.t * 5)) * 3); t.spr(ICON.lagrima, x + bw - 14, by2 - 3); }
  }

  // ── daño: viñeta ──
  if (S.hurtT > 0) { S.hurtT -= dt; const k = S.hurtT / 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = Math.abs(x - W / 2) / (W / 2), dy = Math.abs(y - H / 2) / (H / 2), e = Math.max(dx, dy); if (e > 0.88 && (e - 0.88) * 8.0 * k > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) t.d[y * W + x] = 8; } }

  if (UI.over) UI.over(t, dt);

  // ── destello y fundidos ──
  if (S.flashK > 0) { /* reservado */ }
  if (S.iris) {
    const k = S.iris.k, maxR = Math.hypot(W, H) * 0.56, R = (1 - k) * maxR, cx = S.iris.cx, cy = S.iris.cy;
    if (k > 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R) { const band = Math.floor((d - R) / 7); t.d[y * W + x] = band === 0 ? 9 : band === 1 ? 14 : band === 2 ? 7 : band === 3 ? 2 : 0; }
    }
  }
  if (S.fade > 0.01) { const lv = S.fade * 17; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < lv - 0.5) t.d[y * W + x] = S.fadeC; }
  if (UI.top) UI.top(t, dt);
}
export { plain, drawRich, viewScene };
