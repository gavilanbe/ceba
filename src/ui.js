// ui.js — HUD, diálogos, avisos, rótulos de zona, transiciones y la ventana de objeto nuevo.
import { THREE, W, H, makeSky, U, MB, mat } from './gfx.js';
import { Tex, T, BAYER, clamp, lerp, ease, textW, textW3, glyph2, LINE } from './px.js';
import { G, flag, wait } from './state.js';
import { input, KEYNAME } from './input.js';
import { audio } from './audio.js';
import { TXT, ITEMS } from './text.js';
import { SKINS } from './art/hero.js';
import { fx, P } from './fx.js';

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
  llaveRaiz: ['..bbbb.....', '.b3..3b....', '.b....b....', '.b3..3b....', '..bbbb.....', '....44.....', '.....44....', '......444..', '.......443.', '......4.4..', '...........'],
  capa1: ['.....b.....', '....bb3....', '...99994...', '..9a999944.', '.9a99999944', '.9a99999944', '.9999999944', '.9999999444', '..99999444.', '...994444..', '....6.6....'],
  ajo: ['.....f.....', '....ff.....', '....f4.....', '...7777....', '..777776...', '.77767766..', '.77677676..', '.77677676d.', '..7767666d.', '...6666dd..', '....4.4....'],
  cerbatana: ['.........b3', '........b3.', '.......b3..', '......b3...', '.....b3....', '....b3.....', '...ab3.....', '..4a3......', '.b3........', 'b3.........', '3..........'],
  zarcillo: ['....bbb.b3.', '..bb...bba.', '.b..bbb..b.', '.b.b...b.b.', 'b..b.b.b.b.', 'b..b.bb..b.', 'b..b....b..', '.b..bbbb...', '.3b........', '..3bb......', '....33.....'],
  pepita: ['...aaa...', '..a77aa..', '.a7aaaa9.', '.aaaaaa9.', '.aaaaa99.', '..aaa99..', '...999...'],
  rodar: ['..999..', '.9ff99.', '9f99994', '9999994', '9999944', '.99944.', '..444..'],
};

// ───────── piezas de papel de cebolla ─────────
const TONE = {
  papel: { bg: 15, edge: 4, hi: 7, lo: 9, out: 0, ink: 1, a: 8, b: 2, c: 3 },
  rosa: { bg: 14, edge: 2, hi: 15, lo: 8, out: 0, ink: 1, a: 7, b: 1, c: 3 },
  oscuro: { bg: 1, edge: 13, hi: 13, lo: 0, out: 0, ink: 7, a: 14, b: 12, c: 11 },
};
// panel limpio: borde, luz arriba, sombra abajo. o.orn = esquina con anillos de cebolla (fuera de la zona de texto)
export function panel(t, x, y, w, h, tone = 'papel', o = {}) {
  const P = TONE[tone] || TONE.papel;
  t.rrect(x - 1, y - 1, w + 2, h + 3, P.out, 2); t.rrect(x, y, w, h, P.edge, 2); t.rrect(x + 1, y + 1, w - 2, h - 2, P.bg, 1);
  t.rect(x + 2, y + 1, w - 4, 1, P.hi); t.rect(x + 2, y + h - 2, w - 4, 1, P.lo);
  if (o.orn) { const k = t.clip; t.setClip(x + 1, y + 2, o.orn, h - 4); for (let i = 0; i < 4; i++) t.ring(x + 1, y + h - 2, 6 + i * 6, P.lo, 1); t.clip = k; t.rect(x + 1 + o.orn, y + 4, 1, h - 8, P.lo); }
  return P;
}
export function header(t, x, y, w, label, c = 8) {
  t.rect(x, y, w, 11, c); t.rect(x, y + 10, w, 1, 2);
  t.rect(x + 4, y + 3, 5, 1, 7); t.rect(x + 4, y + 5, 5, 1, 7); t.rect(x + 4, y + 7, 5, 1, 7);
  t.text(label, x + 14, y + 2, 7);
}
// etiqueta: pastilla con texto centrado en cx
export function tag(t, cx, y, label, bg = 8, fg = 7, sh = 2) {
  const w = textW(label) + 10, x = Math.round(cx - w / 2);
  t.rrect(x - 1, y - 1, w + 2, 12, 0, 2); t.rrect(x, y, w, 10, bg, 1); t.rect(x + 1, y + 9, w - 2, 1, sh); t.text(label, x + 5, y + 2, fg);
  return w;
}
export function button(t, cx, cy, r, c, dark, label, key, pressed) {
  if (pressed) cy += 1;
  t.disc(cx, cy + 1, r + 1, 0); t.disc(cx, cy, r + 1, 0); t.disc(cx, cy + 1, r, dark); t.disc(cx, cy - (pressed ? 0 : 1), r, c);
  t.px(cx - r + 2, cy - 3, 7); t.px(cx - r + 3, cy - 4, 7); t.px(cx - r + 2, cy - 2, 7);
  if (label) t.text3(label, cx - 1, cy - 3, 7);
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
  if (n >= 1) { t.px(cx - R + 3, cy - 3, 7); t.px(cx - R + 4, cy - 4, 7); }
  return R;
}

// fila de capas: una cebollita por capa. Entera, agrietada (aguanta un golpe más) o perdida
const DARKMAP = { 9: 0, 10: 0, 4: 0, 11: 0, 3: 0, 6: 0 }, GONE = { 9: 1, 10: 1, 4: 1, 11: 5, 3: 5, 6: 5 }, DULL = { 9: 4, 10: 9, 4: 2 }, HOT = { 9: 8, 10: 14, 4: 2 }, WHITE = { 9: 7, 10: 7, 4: 6, 11: 7, 3: 7 };
export function layerRow(t, x, y, n, max, crack, o = {}) {
  const sp = o.sp || 13, I = ICON.capa1;
  for (let i = 0; i < max; i++) {
    const X = x + i * sp, last = i === n - 1; let Y = y;
    if (o.bump && last) Y -= Math.round(o.bump * 5);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 2]]) t.spr(I, X + dx, Y + dy, { map: DARKMAP });
    if (i >= n) { t.spr(I, X, Y, { map: GONE }); continue; }
    const warn = n === 1 && max > 1 && Math.floor(G.t * 4) % 2 === 0;
    t.spr(I, X, Y, { map: o.white && last ? WHITE : warn ? HOT : null });
    if (last && crack) {
      // la mitad derecha, apagada, y la grieta por el medio
      const k = t.clip; t.setClip(X + 6, Y, 6, 12); t.spr(I, X, Y, { map: DULL }); t.clip = k;
      for (const [cx, cy] of [[5, 2], [6, 3], [5, 4], [4, 5], [5, 6], [6, 7], [5, 8], [5, 9]]) t.px(X + cx, Y + cy, 0);
      if (o.shake) t.px(X + 6, Y + 5, 7);
    }
  }
  return max * sp;
}

// ───────── texto con marcas: *destacado* _término_ ^verde^ ~onda~ ─────────
function parse(s) { const out = []; let c = null, wave = false; for (const ch of s) { if (ch === '*') { c = c === 'a' ? null : 'a'; continue; } if (ch === '_') { c = c === 'b' ? null : 'b'; continue; } if (ch === '^') { c = c === 'c' ? null : 'c'; continue; } if (ch === '~') { wave = !wave; continue; } out.push({ ch, c, wave }); } return out; }
const plain = s => s.replace(/[*_~^]/g, '');
// parte un texto en líneas que quepan en maxW píxeles
export function wrap(s, maxW) {
  const lines = [];
  for (const para of String(s).split('\n')) { let cur = ''; for (const w of para.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (cur && textW(plain(nx)) > maxW) { lines.push(cur); cur = w; } else cur = nx; } lines.push(cur); }
  // las marcas abiertas en una línea siguen en la siguiente
  let open = ''; return lines.map(l => { const full = open + l; for (const m of ['*', '_', '^', '~']) { const n = (full.match(new RegExp('\\' + m, 'g')) || []).length; open = open.replace(m, ''); if (n % 2) open += m; } return full; });
}
function drawRich(t, line, x, y, tone = 'papel', n = 1e9, time = 0) {
  const P = parse(line), T_ = typeof tone === 'string' ? (TONE[tone] || TONE.papel) : tone; let X = x;
  for (let i = 0; i < P.length && i < n; i++) { const g = P[i]; t.text(g.ch, X, y + (g.wave ? Math.round(Math.sin(time * 9 + i * 0.9) * 1.4) : 0), g.c ? T_[g.c] : T_.ink); X += glyph2(g.ch).w + 1; }
  return P.length;
}

// ───────── estado de la interfaz ─────────
const S = {
  dlg: null, toasts: [], hint: null, title: null, fade: 0, fadeC: 0, iris: null, hud: 1, tearShown: 0, tearBump: 0, layerFx: [], crackT: 0, healT: 0, hurtT: 0,
  bars: 0, itemWin: null, view: null, boss: null, bossShown: 0, prompt: 0, credits: null, card: null, aPulse: 0, lastAction: null,
};
export const UI = {
  S,
  onCrack() { S.crackT = 0.6; S.hurtT = 0.35; S.pop = { text: 'Capa agrietada', t: 0, c: 9 }; G.hintOnce('grieta', 'H_GRIETA'); },
  onLayer(from, to, voluntary) { S.layerFx.push({ t: 0, i: from }); if (to > 0) { S.pop = { text: '-1 capa', t: 0, c: 8 }; S.sizeT = 3.2; if (!voluntary) G.hintOnce('capa', 'H_CAPA'); } },
  onHurt() { S.hurtT = 0.5; },
  onHeal(up) { S.healT = 0.5; if (up) { S.pop = { text: '+1 capa', t: 0, c: 3 }; S.sizeT = 2.4; } },
  onTears() { S.tearBump = 0.25; },
  onAmmo() { S.ammoBump = 0.25; },
  view: null,
};
G.ui = UI;

// aviso de Candela (no bloquea)
G.hint = (key, dur = 5.5) => { let txt = TXT[key] || key; if (Array.isArray(txt)) txt = txt.join(' '); txt = txt.replace(/@[^|]*\|/g, ''); S.hint = { lines: wrap(txt, 196), t: 0, dur }; if (G.candela) G.candela.call(); };
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
    const all = wrap(pg, 250);
    for (let i = 0; i < all.length; i += 3) {
      d.lines = all.slice(i, i + 3); d.n = 0; d.done = false; d.t = 0;
      const total = d.lines.reduce((a, l) => a + plain(l).length, 0), flat = d.lines.map(plain).join('');
      // las letras solo avanzan: la pausa tras un signo es una espera, nunca un paso atrás
      let acc = 0, pause = 0;
      while (d.n < total) {
        const dt = yield; G.talking = pause <= 0;
        if (input.hit('a')) { d.n = total; break; }
        if (pause > 0) { pause -= dt * (input.down.b ? 3 : 1); continue; }
        acc += dt * (input.down.b ? 110 : 46);
        while (acc >= 1 && d.n < total) {
          acc -= 1; d.n++;
          const ch = flat[d.n - 1];
          if (ch !== ' ' && d.n % 2 === 0) audio.sfx('blip', { pitch: voice * (0.92 + Math.random() * 0.16) });
          const nx = flat[d.n];
          if (d.n < total && nx !== '.' && nx !== '!' && nx !== '?') { if (ch === ',' || ch === ';' || ch === ':') { pause = 0.11; acc = 0; break; } if (ch === '.' || ch === '!' || ch === '?' || ch === '…') { pause = 0.22; acc = 0; break; } }
        }
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
  G.lock++; S.dlg = { name: G.speaker ? G.speaker.name : null, lines: wrap(TXT[prompt] ?? prompt, 250), n: 1e9, t: 0, open: 0, done: false, choice: { opts, i: 0 }, tone: 'papel' };
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
// duración del redoble antes de enseñar el objeto (va con la partitura de audio.js)
const ROLL = { big: 16 * 60 / 138 / 4, small: 8 * 60 / 144 / 4 };
// abanico de rayos que gira detrás del objeto, en el propio mundo
let rayMesh = null;
function rays() {
  if (rayMesh) return rayMesh;
  const b = new MB(), n = 12, u = [84, 12];
  for (let i = 0; i < n; i++) { const a0 = i / n * 6.283, a1 = a0 + 6.283 / n * 0.5; b.tri([0, 0, 0], [Math.cos(a0), Math.sin(a0), 0], [Math.cos(a1), Math.sin(a1), 0], u, u, u); }
  rayMesh = b.mesh(mat(fx.tex, { unlit: true, double: true, noFog: true, depthWrite: false })); rayMesh.renderOrder = 4; rayMesh.frustumCulled = false;
  return rayMesh;
}
// Ceba consigue algo: lo levanta sobre la cabeza, en vivo, con la cámara encima
G.giveItem = function* (id, o = {}) {
  const it = ITEMS[id]; const p = G.player, L = G.level;
  if (it.tears) { // premio en lágrimas: sin ceremonia
    audio.jingle('item'); yield* wait(ROLL.small); fx.flash(7, 0.08); G.save.tears = Math.min(999, G.save.tears + it.tears); UI.onTears(); p.sqV = 8;
    yield* G.say(null, it.text); return;
  }
  G.lock++; const wasCine = G.cine; G.cine = true;
  const big = !!it.big, tA = big ? ROLL.big : ROLL.small;
  const dur = audio.jingle(big ? 'itemBig' : 'item');
  // Ceba se vuelve hacia la cámara y la cámara se le acerca durante el redoble
  const c = G.cam.cam.position; let dx = c.x - p.pos.x, dz = c.z - p.pos.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  p.yaw = Math.atan2(dx, dz); p.vel.set(0, 0, 0);
  const hy = p.pos.y + 1.0 * p.sc, top = hy + 0.8;
  const push = G.cam.to(p.pos.x + dx * 5.2, p.pos.y + 1.8, p.pos.z + dz * 5.2, p.pos.x, hy + 0.3, p.pos.z, tA + 0.25, 36);
  p.faceOv = 'effort'; p.pose = { L: [-0.3, 0.5, 0.5], R: [0.3, 0.5, 0.5] };
  let e = 0; while (e < tA) { const dt = yield; e += dt; push.next(dt); p.sqY = lerp(p.sqY, 0.8, 0.12); p.sqV = 0; if (Math.random() < 0.6) { const a = Math.random() * 6.283, r = 2.2; fx.one(P.star, p.pos.x + Math.cos(a) * r, p.pos.y + 0.6 + Math.random(), p.pos.z + Math.sin(a) * r, { vx: -Math.cos(a) * 4, vz: -Math.sin(a) * 4, drag: 1.5, life: 0.45, size: 0.3 }); } }
  // ¡tachán! el objeto aparece sobre su cabeza
  if (it.give) it.give();
  G.save.items[id] = (G.save.items[id] || 0) + 1;
  if (it.c && !G.save.c.includes(id)) { const i = G.save.c.indexOf(null); if (i >= 0) G.save.c[i] = id; }
  let obj = null, spin = null, size = 1;
  if (!it.inHand) {
    const M = it.make(); obj = M.root || M.g || M; spin = new THREE.Group(); spin.add(obj);
    const bb = new THREE.Box3().setFromObject(obj), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()); obj.position.sub(ctr); size = 1.1 / Math.max(sz.x, sz.y, sz.z);
    spin.position.set(p.pos.x, top, p.pos.z); spin.scale.setScalar(0.001); G.scene.add(spin);
  }
  const ry = rays(); ry.position.set(p.pos.x - dx * 0.5, it.inHand ? top + 0.5 : top, p.pos.z - dz * 0.5); ry.rotation.set(0, Math.atan2(dx, dz), 0); ry.scale.setScalar(0.001); ry.material.uniforms.uHide.value = 0.62; G.scene.add(ry);
  const glow = { x: p.pos.x + dx * 0.6, y: top, z: p.pos.z + dz * 0.6, r: 0, base: 7, flick: 0.6, ph: 0 }; L.lights.push(glow);
  fx.flash(7, 0.14); fx.shake(0.14, 0.25); p.sqV = 11; p.faceOv = 'happy';
  if (it.inHand) { p.drawn = 99; p.m.draw(true); p.pose = { R: [0.5, 1.12, 0.2], L: [-0.6, 0.5, 0.1] }; } else p.pose = { L: [-0.36, 1.12, 0.12], R: [0.36, 1.12, 0.12] };
  fx.burst(P.star, p.pos.x, top, p.pos.z, 18, { speed: 3.5, up: 3, g: 5, life: 0.9, size: 0.42 }); fx.ring(p.pos.x, p.groundY, p.pos.z, { r1: 3.2, t: 0.6, c: 10, th: 0.3 });
  S.itemTag = { name: it.name, t: 0 };
  let t = 0, done = false, leaving = 0;
  const live = function* () {
    for (;;) {
      const dt = yield; t += dt; push.next(dt);
      const k = ease.back(clamp(t / 0.35)), out = leaving ? 1 - ease.in(clamp(leaving / 0.3)) : 1; if (leaving) leaving += dt;
      if (spin) { spin.scale.setScalar(Math.max(0.001, size * k * out)); spin.rotation.y += dt * (2.2 + 14 * Math.max(0, 1 - t / 0.9)); spin.position.y = lerp(p.pos.y + 0.6, top + Math.sin(t * 2.4) * 0.05, out * clamp(k)); }
      ry.scale.setScalar(Math.max(0.001, (2.1 + Math.sin(t * 3) * 0.15) * ease.out3(clamp(t / 0.5)) * out)); ry.rotateZ(dt * 0.9);
      glow.base = 7 * clamp(t / 0.3) * out;
      if (Math.random() < 0.35) fx.one(Math.random() < 0.5 ? P.sqY : P.star, p.pos.x + (Math.random() - 0.5) * 1.6, top + (Math.random() - 0.5) * 1.2, p.pos.z + (Math.random() - 0.5) * 1.6, { vy: 0.8 + Math.random(), g: -0.4, life: 0.6, size: 0.2 });
      if (done && leaving > 0.3) return;
    }
  };
  const lv = live(); lv.next();
  const talk = (function* () { yield* wait(Math.max(1.6, dur - tA - (big ? 2.4 : 1.2))); yield* G.say(null, it.text); })();
  for (;;) { const dt = yield; lv.next(dt); if (talk.next(dt).done) break; }
  // lo guarda: el objeto baja hacia ella y desaparece
  done = true; leaving = 0.001; audio.sfx('select', { pitch: 1.4 }); S.itemTag.out = 0.001; p.sqV = 6;
  for (;;) { const dt = yield; if (lv.next(dt).done) break; }
  if (spin) G.scene.remove(spin); G.scene.remove(ry); const gi = L.lights.indexOf(glow); if (gi >= 0) L.lights.splice(gi, 1);
  S.itemTag = null; if (it.inHand) { p.drawn = 0; p.m.draw(false); }
  p.pose = null; p.faceOv = null; G.cine = wasCine; G.lock--;
};

// ───────── dibujar ─────────
const pr = { x: 0, y: 0, z: 0 };
export function drawUI(dt) {
  const t = ui; t.clear(); const p = G.player, sv = G.save, play = G.mode === 'play';
  if (UI.under) UI.under(t, dt);
  S.bars = lerp(S.bars, G.cam ? G.cam.barsT : 0, 0.3);
  const hudWant = play && !G.cine ? 1 : 0; S.hud = lerp(S.hud, hudWant, 1 - Math.exp(-12 * dt));
  const hy = Math.round((1 - S.hud) * -46);

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
      if (pr.z < 1 && pr.y > 44) { const x = Math.round(pr.x), y = Math.round(pr.y + Math.sin(G.t * 6) * 2); t.disc(x, y + 1, 5, 0); t.disc(x, y, 5, 1); t.disc(x, y - 1, 4, 12); t.text3('A', x - 1, y - 3, 7); t.px(x, y + 6, 0); t.px(x, y + 5, 1); }
    }
  }

  // rótulo sobre Ceba: qué le acaba de pasar a sus capas
  if (S.pop) {
    const o = S.pop; o.t += dt; if (o.t > 1.3 || !play) S.pop = null; else if (G.cam) {
      G.cam.project(p.pos.x, p.pos.y + p.h + 0.55, p.pos.z, pr);
      const k = ease.back(clamp(o.t / 0.18)), y = Math.round(pr.y - o.t * 14 - k * 4);
      if (pr.z < 1 && (o.t < 1 || Math.floor(o.t * 16) % 2)) tag(t, clamp(Math.round(pr.x), 40, W - 40), clamp(y, 34, H - 30), o.text, o.c, 7, 0);
    }
  }
  // barras de cine
  const bh = Math.round(S.bars * 14);
  if (bh > 0) { t.rect(0, 0, W, bh, 0); t.rect(0, H - bh, W, bh, 0); }

  if (S.hud > 0.02 && sv) {
    // ── capas: una cebollita por capa, y debajo las lágrimas ──
    const gx = 7, gy = 6 + hy;
    S.crackT = Math.max(0, S.crackT - dt); S.healT = Math.max(0, S.healT - dt);
    const rw = p.maxLayers * 13 + 3;
    t.rrect(gx - 4, gy - 3, rw + 5, 18, 0, 3); t.rrect(gx - 3, gy - 2, rw + 3, 16, 1, 2); t.rect(gx - 1, gy - 1, rw - 1, 1, 13);
    layerRow(t, gx, gy, p.layers, p.maxLayers, p.crack, { bump: S.healT * 2, white: S.healT > 0.25 || S.crackT > 0.45, shake: S.crackT > 0 });
    for (const f of S.layerFx) { f.t += dt; const k = f.t / 0.7, x = gx + (f.i - 1) * 13 + k * 22, y = gy + 2 - Math.sin(k * 3.14) * 14 + k * k * 30; t.spr(ICON.capa1, Math.round(x), Math.round(y), { map: Math.floor(f.t * 20) % 2 ? WHITE : DULL }); }
    S.layerFx = S.layerFx.filter(f => f.t < 0.7);
    // ── lágrimas ──
    if (S.tearShown !== sv.tears) { const d = sv.tears - S.tearShown; S.tearShown += Math.sign(d) * Math.max(1, Math.floor(Math.abs(d) * 0.2)); }
    S.tearBump = Math.max(0, S.tearBump - dt);
    const num = String(S.tearShown).padStart(3, '0'), tx = gx - 3, ty = gy + 19 - Math.round(S.tearBump * 10), tw = textW(num) + 17;
    t.rrect(tx - 1, ty - 1, tw + 2, 13, 0, 2); t.rrect(tx, ty, tw, 11, 1, 2); t.rect(tx + 2, ty + 1, tw - 4, 1, 13);
    t.spr(ICON.lagrima, tx + 2, ty + 1); t.text(num, tx + 12, ty + 3, S.tearBump > 0 ? 10 : 7);
    // pepitas de oro, cuando ya se ha encontrado alguna
    let ex = tx + tw + 4;
    if (sv.pepitas > 0 || flag('pepita')) { const s2 = String(sv.pepitas || 0), w2 = textW(s2) + 16; t.rrect(ex - 1, ty - 1, w2 + 2, 13, 0, 2); t.rrect(ex, ty, w2, 11, 1, 2); t.rect(ex + 2, ty + 1, w2 - 4, 1, 13); t.spr(ICON.pepita, ex + 2, ty + 2); t.text(s2, ex + 13, ty + 3, 10); ex += w2 + 4; }
    // tamaño: qué puede hacer Ceba con las capas que lleva
    if (S.sizeT > 0) { S.sizeT -= dt; const lb = p.layers <= 1 ? 'Pequeña: cabes por las ratoneras' : p.layers >= 3 ? 'Entera: mueves bloques' : 'Mediana'; const k = clamp(S.sizeT / 0.25) * clamp((3.2 - S.sizeT) / 0.15 + 0.2); if (k > 0.3) { const w3 = textW(lb) + 10; t.rrect(tx - 1, ty + 14, w3 + 2, 12, 0, 2); t.rrect(tx, ty + 15, w3, 10, p.layers <= 1 ? 2 : 4, 1); t.text(lb, tx + 5, ty + 17, 7); } }
    // ── botones: B, A y los tres C, cada uno con su tecla debajo ──
    const pressed = b => input.down[b] && G.lock <= 0;
    const bx = 226, by = 18 + hy;
    button(t, bx, by, 9, 11, 3, null, null, pressed('b'));
    if (sv.items.hoja) t.spr(ICON.hoja, bx - 5, by - 6 + (pressed('b') ? 1 : 0)); else t.text3('B', bx - 1, by - 3, 3);
    t.text3O(KEYNAME.b, bx - 1, by + 12, 7, 0);
    const act = G.action || '';
    if (act !== S.lastAction) { S.lastAction = act; S.aPulse = 0.2; } S.aPulse = Math.max(0, S.aPulse - dt);
    const ax = bx + 23, ay = by + 7 - Math.round(S.aPulse * 14);
    button(t, ax, ay, 10, 12, 1, null, null, pressed('a'));
    t.text3('A', ax - 1, ay - 3 + (pressed('a') ? 1 : 0), 7);
    if (act) tag(t, ax, ay + 13, act, 12, 7, 1); else t.text3O(KEYNAME.a, ax - 5, ay + 13, 7, 0);
    const CX = [bx + 47, bx + 64, bx + 81], CY = [by - 2, by - 2, by - 2];
    for (let i = 0; i < 3; i++) {
      const id = sv.c[i], pd = pressed('c' + (i + 1));
      button(t, CX[i], CY[i], 7, 10, 9, null, null, pd);
      if (id && ICON[id]) t.spr(ICON[id], CX[i] - 5, CY[i] - 6 + (pd ? 1 : 0), { map: p.layers <= 1 && id === 'mondador' ? { 8: 5, 14: 5, 6: 5, 2: 5 } : id === 'ajo' && !sv.ajos ? { 7: 5, 6: 5, 15: 5, 13: 5, 4: 5 } : null });
      if (id === 'ajo') { const n = String(sv.ajos || 0); t.rrect(CX[i] + 2, CY[i] - 12, textW3(n) + 4, 8, 0, 1); t.text3(n, CX[i] + 4, CY[i] - 11, sv.ajos ? 10 : 8); }
      t.text3O(KEYNAME['c' + (i + 1)], CX[i] - 1, CY[i] + 10, 7, 0);
    }
    if (sv.items.llave && G.level && G.level.name === 'cisterna' && !flag('jefe')) { t.rrect(W - 21, 40 + hy, 15, 15, 0, 2); t.rrect(W - 20, 41 + hy, 13, 13, 1, 2); t.spr(ICON.llave, W - 19, 42 + hy); }
  }

  // ── jefe ──
  if (G.boss && G.boss.shown) {
    S.bossShown = lerp(S.bossShown, S.title ? 0 : 1, 0.1); const b = G.boss, w = 160, x = (W - w) >> 1, y = H - 14 + Math.round((1 - S.bossShown) * 24) - bh;
    t.textO(b.name, x, y - 10, 14, 0); t.rrect(x - 2, y - 2, w + 4, 9, 0, 2); t.rect(x, y, w, 5, 2);
    const k = clamp(b.hp / b.maxHp); b.lag = lerp(b.lag ?? 1, k, 0.06); t.rect(x, y, Math.round(w * b.lag), 5, 7); t.rect(x, y, Math.round(w * k), 5, 8); t.rect(x, y, Math.round(w * k), 1, 14);
    for (let i = 1; i < 3; i++) t.rect(x + Math.round(w * i / 3), y, 1, 5, 0);
  } else S.bossShown = 0;

  // ── rótulo de zona ──
  if (S.title) {
    const a = S.title; a.t += dt; const D = 3.8;
    if (a.t > D) S.title = null; else {
      const cy = 112, wd = textW(a.title, 2), out = clamp((a.t - (D - 0.5)) / 0.5);
      const rk = ease.out3(clamp(a.t / 0.6)) * (1 - out);
      if (rk > 0.02) { t.setClip(0, cy - 30, W, 28); for (let i = 0; i < 3; i++) t.arc(W / 2, cy + 74, 100 - i * 5, 101 - i * 5, -0.8 * rk, 0.8 * rk, [9, 14, 7][i]); t.setClip(null); }
      let X = (W - wd) >> 1, i = 0;
      for (const ch of a.title) { const k = clamp((a.t - i * 0.05) / 0.3); if (k > 0 && out < 1) { const dy = Math.round((1 - ease.bounce(k)) * -18 - out * out * 30 * (i % 2 ? 1 : -1)); t.text(ch, X + 1, cy + dy + 3, 0, 2); t.textO(ch, X, cy + dy, 7, 0, 2); } X += (glyph2(ch).w + 1) * 2; i++; }
      if (a.t > 0.7 && out < 0.5) tag(t, W / 2, cy + 20, a.sub, 8, 7, 2);
    }
  }

  // ── aviso de Candela ──
  if (S.hint) {
    const h = S.hint; h.t += dt; if (h.t > h.dur || (S.dlg && h.t > 0.1)) S.hint = null; else {
      const k = ease.back(clamp(h.t / 0.3)) * (1 - clamp((h.t - (h.dur - 0.3)) / 0.3)), hh = h.lines.length * LINE + 9, wd = Math.max(...h.lines.map(l => textW(plain(l)))) + 32;
      const x = 6, y = H - 8 - hh + Math.round((1 - k) * 60) - bh;
      panel(t, x, y, wd, hh, 'oscuro');
      const iy = y + (hh >> 1); t.disc(x + 11, iy, 7, 0); t.disc(x + 11, iy, 6, Math.floor(G.t * 6) % 2 ? 10 : 9); t.spr(ICON.candela, x + 8, iy - 4);
      let n = Math.floor(h.t * 70); h.lines.forEach((l, i) => { n -= drawRich(t, l, x + 24, y + 6 + i * LINE, 'oscuro', n, G.t); });
    }
  }
  // ── avisos ──
  for (const a of S.toasts) {
    a.t += dt; const k = ease.back(clamp(a.t / 0.3)) * (1 - clamp((a.t - 2.2) / 0.3)), wd = textW(a.text) + 26, x = (W - wd) >> 1, y = Math.round(-16 + k * 22);
    t.rrect(x - 1, y - 1, wd + 2, 15, 0, 2); t.rrect(x, y, wd, 13, 3, 2); t.rect(x + 2, y + 1, wd - 4, 1, 11); t.text(a.text, x + 19, y + 3, 7);
    t.rect(x + 6, y + 8, 7, 2, 4); t.rect(x + 9, y + 3, 1, 5, 11); t.px(x + 8, y + 4, 11); t.px(x + 10, y + 3, 11);
  }
  S.toasts = S.toasts.filter(a => a.t < 2.5);

  // ── objeto nuevo: solo el nombre, arriba; el objeto está en el mundo ──
  if (S.itemTag) {
    const g = S.itemTag; g.t += dt; if (g.out) g.out += dt;
    const out = g.out ? clamp(g.out / 0.25) : 0, y = 22 - Math.round(out * 40);
    const k0 = ease.back(clamp(g.t / 0.3)); if (k0 > 0.05 && out < 1) { const lb = 'Objeto nuevo', lw = Math.round((textW(lb) + 12) * clamp(k0)); t.rect((W - lw) >> 1, y - 1, lw, 12, 0); t.rect(((W - lw) >> 1) + 1, y, lw - 2, 10, 8); t.setClip((W - lw) >> 1, y, lw, 10); t.textC(lb, W / 2, y + 2, 7); t.setClip(null); }
    const nw = textW(g.name, 2); let X = (W - nw) >> 1, i = 0;
    for (const ch of g.name) { const k = clamp((g.t - 0.2 - i * 0.045) / 0.22); if (k > 0 && out < 1) { const dy = Math.round((1 - ease.back(k)) * 10); t.text(ch, X + 1, y + 17 + dy, 0, 2); t.textO(ch, X, y + 14 + dy, 7, 0, 2); } X += (glyph2(ch).w + 1) * 2; i++; }
  }

  // ── diálogo ──
  if (S.dlg) {
    const d = S.dlg; d.open = Math.min(1, d.open + dt * 7); d.t += dt;
    const bw = 284, bh2 = 46, x = (W - bw) >> 1, y = H - bh2 - 7 + Math.round((1 - ease.back(d.open)) * 34) - Math.round(S.bars * 3);
    const P_ = panel(t, x, y, bw, bh2, d.tone, { orn: 13 });
    if (d.name) { const nw = textW(d.name) + 12; t.rrect(x + 9, y - 9, nw + 2, 14, 0, 2); t.rrect(x + 10, y - 8, nw, 12, 8, 2); t.rect(x + 12, y - 7, nw - 4, 1, 14); t.rect(x + 11, y + 2, nw - 2, 1, 2); t.text(d.name, x + 16, y - 5, 7); }
    let n = d.n; const tx = x + 21;
    d.lines.forEach((l, i) => { const used = drawRich(t, l, tx, y + 8 + i * 11, P_, n, G.t); n -= used; });
    if (d.choice) {
      const c = d.choice; let cx2 = tx + 10; const cy2 = y + 8 + Math.max(1, d.lines.length) * 11 + 3;
      c.opts.forEach((o, i) => { const sel = i === c.i, ow = textW(o) + 12; if (sel) { t.rrect(cx2 - 1, cy2 - 3, ow + 2, 13, 0, 2); t.rrect(cx2, cy2 - 2, ow, 11, 8, 2); t.rect(cx2 + 1, cy2 + 8, ow - 2, 1, 2); t.text('▶', cx2 - 8 + Math.round(Math.abs(Math.sin(G.t * 7)) * 2), cy2, 8); } else { t.rrect(cx2, cy2 - 2, ow, 11, 9, 2); t.rrect(cx2 + 1, cy2 - 1, ow - 2, 9, 15, 1); } t.text(o, cx2 + 6, cy2, sel ? 7 : 4); cx2 += ow + 14; });
    } else if (d.done) { const by2 = y + bh2 - 13 + Math.round(Math.abs(Math.sin(G.t * 5)) * 3); t.spr(ICON.lagrima, x + bw - 15, by2); }
  }

  // ── daño: viñeta ──
  if (S.hurtT > 0) { S.hurtT -= dt; const k = S.hurtT / 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = Math.abs(x - W / 2) / (W / 2), dy = Math.abs(y - H / 2) / (H / 2), e = Math.max(dx, dy); if (e > 0.88 && (e - 0.88) * 8.0 * k > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) t.d[y * W + x] = 8; } }

  if (UI.over) UI.over(t, dt);

  // ── cortinilla de anillos y fundidos ──
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
