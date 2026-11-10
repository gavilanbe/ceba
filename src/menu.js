// menu.js — la pausa es una cebolla en corte: cada anillo es una página y pasar de página es pelar una capa.
import { W, H } from './gfx.js';
import { Tex, T, BAYER, clamp, lerp, ease, textW } from './px.js';
import { G, flag, writeSave, run } from './state.js';
import { input, KEYNAME } from './input.js';
import { audio } from './audio.js';
import { UI, ICON, panel, header, wrap, onionGauge, setView, button, tag } from './ui.js';
import { ITEMS, ECO, LAYERS, objective, makeCeba } from './text.js';
import { Title } from './title.js';

const PAGES = [
  { name: 'ZURRÓN', layer: 'LA PIEL', c: 9, d: 4 },
  { name: 'MAPA', layer: 'LA TÚNICA', c: 14, d: 2 },
  { name: 'CUADERNO', layer: 'LA PULPA', c: 7, d: 13 },
  { name: 'CEBA', layer: 'EL CORAZÓN', c: 11, d: 3 },
];
const PX = 124, PY = 18, PW = 190, PH = 156;
const bufA = new Tex(W, H), bufB = new Tex(W, H);
const SLOTS = ['hoja', 'mondador', null, null, null, null, null, null, 'llave', 'capa'];
const S = { open: 0, closing: false, page: 0, prev: 0, peel: 1, dir: 1, t: 0, cur: 0, eco: 0, opt: 0, viewKey: null };

export const Menu = {
  S,
  open() { G.mode = 'menu'; S.open = 0; S.closing = false; S.t = 0; S.peel = 1; audio.sfx('menuOpen'); audio.duck(true); UI.over = (t, dt) => Menu.draw(t, dt); S.viewKey = null; input.pressed = {}; },
  close() { S.closing = true; audio.sfx('menuClose'); audio.duck(false); setView(null); S.viewKey = null; },
  turn(d) { S.prev = S.page; S.page = (S.page + d + 4) % 4; S.peel = 0; S.dir = d; audio.sfx('menuPeel'); S.viewKey = null; setView(null); },
  update(dt) {
    S.t += dt;
    if (S.closing) { S.open -= dt * 5; if (S.open <= 0) { G.mode = 'play'; UI.over = null; input.pressed = {}; } return; }
    S.open = Math.min(1, S.open + dt * 4.5); S.peel = Math.min(1, S.peel + dt * 2.8);
    if (input.hit('start') || input.hit('b')) { Menu.close(); return; }
    if (input.hit('l')) Menu.turn(-1); else if (input.hit('r')) Menu.turn(1);
    const mv = (input.hit('right') ? 1 : 0) - (input.hit('left') ? 1 : 0), mvy = (input.hit('down') ? 1 : 0) - (input.hit('up') ? 1 : 0);
    const sv = G.save;
    if (S.page === 0) {
      if (mv || mvy) { const x = (S.cur % 5 + mv + 5) % 5, y = (Math.floor(S.cur / 5) + mvy + 2) % 2; S.cur = y * 5 + x; audio.sfx('menuMove'); S.viewKey = null; }
      const id = SLOTS[S.cur];
      for (let i = 0; i < 3; i++) if (input.hit('c' + (i + 1))) {
        if (id && sv.items[id] && ITEMS[id].c) { const j = sv.c.indexOf(id); if (j >= 0) sv.c[j] = sv.c[i]; sv.c[i] = id; audio.sfx('select'); } else audio.sfx('error');
      }
      if (input.hit('a')) audio.sfx(id && sv.items[id] ? 'select' : 'error');
    } else if (S.page === 2) {
      if (mvy) { S.eco = (S.eco + mvy + ECO.length) % ECO.length; audio.sfx('menuMove'); S.viewKey = null; }
    } else if (S.page === 3) {
      if (mvy) { S.opt = (S.opt + mvy + 3) % 3; audio.sfx('menuMove'); }
      if (input.hit('a')) {
        if (S.opt === 0) { audio.muted = !audio.muted; audio.sfx('select'); }
        else if (S.opt === 1) { sv.layers = G.player.layers; sv.crack = G.player.crack; writeSave(); audio.sfx('secret'); S.saved = 1.5; }
        else { sv.layers = G.player.layers; writeSave(); audio.sfx('select'); Menu.close(); audio.music(null, { fade: 0.4 }); run(function* () { G.lock++; yield* G.fade(1, 0.5, 0); G.lock--; G.mode = 'title'; UI.S.title = null; UI.S.hint = null; Title.enter(); yield* G.fade(0, 0.5, 0); }); }
      }
    }
  },
  draw(t, dt) {
    const k = ease.out3(clamp(S.open)), sv = G.save, p = G.player;
    // velo tramado sobre el juego
    const lv = k * 13; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < lv) t.d[y * W + x] = 1;
    if (k < 0.05) return;
    // anillos de fondo
    t.setClip(0, 12, W, H - 12); for (let i = 0; i < 6; i++) { const r = 70 + i * 26 + Math.sin(S.t * 0.8 + i) * 3; t.ring(62, 84, r, i % 2 ? 2 : 13, 1); } t.setClip(null);
    // cabecera
    const hy = Math.round((1 - k) * -13);
    header(t, 0, hy, W, 'CEBA · PAUSA'); const tm = Math.floor(sv.time), ts = `${String(Math.floor(tm / 60)).padStart(2, '0')}:${String(tm % 60).padStart(2, '0')}`;
    t.textR(ts, W - 6, hy + 2, 7); const tn = String(sv.tears).padStart(3, '0'); t.textR(tn, W - 42, hy + 2, 7); t.spr(ICON.lagrima, W - 42 - textW(tn) - 10, hy + 1);
    // ── la cebolla en corte ──
    const cx = 62 - Math.round((1 - k) * 130), cy = 68, R = [46, 35, 24, 13];
    t.disc(cx, cy + 2, 48, 0); t.disc(cx, cy, 48, 0);
    for (let i = 0; i < 4; i++) {
      const sel = i === S.page, P = PAGES[i];
      t.disc(cx, cy, R[i] + (sel ? 1 : 0), sel ? P.c : P.d);
      t.ring(cx, cy, R[i] + (sel ? 1 : 0), sel ? 7 : 0, 1);
      if (sel) { for (let a = 0; a < 10; a++) { const an = a / 10 * 6.283 + S.t * 0.9, rr = R[i] - 5; t.px(Math.round(cx + Math.cos(an) * rr), Math.round(cy + Math.sin(an) * rr), i === 2 ? 15 : 7); } }
    }
    t.disc(cx, cy, 3, S.page === 3 ? 10 : 11); t.px(cx - 1, cy - 1, 7);
    for (let a = 0; a < 8; a++) { const an = a / 8 * 6.283 + 0.3; for (let r = 14; r < 46; r += 3) t.px(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), 0); }
    // etiqueta de la capa elegida, entre Q y E
    const P0 = PAGES[S.page];
    tag(t, cx, cy + 53, P0.layer, P0.c, S.page >= 2 ? 1 : 0, P0.d);
    for (const [dx, key, ar] of [[-50, 'Q', '◀'], [50, 'E', '▶']]) { button(t, cx + dx, cy + 58, 6, 13, 5, null); t.text3(key, cx + dx - 1, cy + 55, 7); }
    // misión
    const ob = wrap(objective(), 102), oy = 136 + Math.round((1 - k) * 50);
    panel(t, 6, oy, 112, 40, 'oscuro'); t.rect(7, oy + 1, 110, 9, 2); t.text('MISIÓN', 11, oy + 2, 14);
    ob.slice(0, 3).forEach((l, i) => t.text(l, 11, oy + 12 + i * 9, 7));
    // ── página ──
    const ox = Math.round((1 - k) * 220);
    const drawPage = (buf, pg) => { buf.clear(); Menu.page(buf, pg, dt); };
    if (S.peel < 1) {
      drawPage(bufA, S.page); drawPage(bufB, S.prev);
      const e = ease.io(S.peel) * (PW + PH * 0.7 + 14);
      for (let y = PY - 2; y < PY + PH + 3; y++) for (let x = PX - 2; x < PX + PW + 2; x++) {
        const s = S.dir > 0 ? (PX + PW - x) + (y - PY) * 0.7 : (x - PX) + (y - PY) * 0.7;
        let c;
        if (s < e - 9) c = bufA.d[y * W + x];
        else if (s < e) { const q = Math.floor(e - s); c = q < 2 ? 4 : q < 5 ? 15 : q < 7 ? 7 : 9; if (bufB.d[y * W + x] === T && bufA.d[y * W + x] === T) c = T; }
        else c = bufB.d[y * W + x];
        if (c !== T) { const X = x + ox; if (X >= 0 && X < W) t.d[y * W + X] = c; }
      }
    } else {
      t.ox = ox; Menu.page(t, S.page, dt); t.ox = 0;
      if (UI.view) UI.view.x += ox;
    }
    if (S.peel < 1 || k < 0.98) { if (UI.view) UI.view.w = 0; }
  },
  page(t, pg, dt) {
    const sv = G.save, p = G.player, P = PAGES[pg], live = t !== bufA && t !== bufB, ink = pg >= 2 ? 1 : 7;
    panel(t, PX, PY, PW, PH, 'papel');
    t.rrect(PX + 1, PY + 1, PW - 2, 12, P.c, 1); t.rect(PX + 1, PY + 12, PW - 2, 1, P.d);
    t.text(P.name, PX + 7, PY + 4, ink); t.textR(`Capa ${pg + 1} de 4`, PX + PW - 7, PY + 4, ink);
    const x0 = PX + 9, y0 = PY + 20, CW = PW - 18;
    const frame = (x, y, w, h) => { t.rrect(x - 2, y - 2, w + 4, h + 4, 4, 2); t.rect(x - 1, y - 1, w + 2, h + 2, 2); };
    if (pg === 0) {
      // ── zurrón ──
      for (let i = 0; i < 10; i++) {
        const sx = x0 + (i % 5) * 35, sy = y0 + Math.floor(i / 5) * 31, id = SLOTS[i], has = id && sv.items[id], sel = i === S.cur;
        t.rrect(sx, sy, 30, 27, 4, 2); t.rrect(sx + 1, sy + 1, 28, 25, has ? 7 : 9, 1); t.rect(sx + 2, sy + 24, 26, 1, has ? 6 : 4);
        if (has) {
          t.spr(ICON[id], sx + 4, sy + 3, { scale: 2 });
          const key = id === 'hoja' ? KEYNAME.b : (sv.c.indexOf(id) >= 0 ? KEYNAME['c' + (sv.c.indexOf(id) + 1)] : null);
          if (key) { t.disc(sx + 24, sy + 6, 5, 0); t.disc(sx + 24, sy + 5, 4, id === 'hoja' ? 11 : 10); t.text3(key, sx + 23, sy + 3, 0); }
        } else { t.rect(sx + 13, sy + 12, 4, 2, 4); }
        if (sel) { const b = Math.round(Math.abs(Math.sin(S.t * 6)) * 2); for (const [ax, ay, dx, dy] of [[sx - 2 - b, sy - 2 - b, 1, 1], [sx + 31 + b, sy - 2 - b, -1, 1], [sx - 2 - b, sy + 28 + b, 1, -1], [sx + 31 + b, sy + 28 + b, -1, -1]]) { t.rect(Math.min(ax, ax + dx * 5), ay, 6, 1, 8); t.rect(ax, Math.min(ay, ay + dy * 5), 1, 6, 8); } }
      }
      const id = SLOTS[S.cur], has = id && sv.items[id], it = has ? ITEMS[id] : null, dy2 = y0 + 70;
      t.rect(x0, dy2 - 6, CW, 1, 9);
      frame(x0 + 2, dy2 + 2, 52, 52);
      if (it) {
        if (live) { t.erase(x0 + 2, dy2 + 2, 52, 52); if (S.viewKey !== 'i' + id) { S.viewKey = 'i' + id; setView(it.make, { zoom: (it.zoom || 1) * 0.72, sky: [15, 15, 9, 9] }); } const v = UI.view; if (v) { v.x = x0 + 2; v.y = dy2 + 2; v.w = 52; v.h = 52; v.spin.rotation.y += dt * 1.8; } }
        else t.rect(x0 + 2, dy2 + 2, 52, 52, 15);
        t.text(it.name, x0 + 64, dy2, 8); wrap(it.desc, CW - 64).slice(0, 4).forEach((l, i) => t.text(l, x0 + 64, dy2 + 11 + i * 9, 1));
        if (it.c) t.text('U · I · O: asignar', x0 + 64, dy2 + 49, 4);
      } else { t.rect(x0 + 2, dy2 + 2, 52, 52, 9); t.rect(x0 + 22, dy2 + 27, 12, 2, 4); t.text('Hueco libre', x0 + 64, dy2, 4); t.text('Aún no hay nada aquí.', x0 + 64, dy2 + 11, 4); if (live && S.viewKey) { S.viewKey = null; setView(null); } }
    } else if (pg === 1) {
      // ── mapa: Bulbo en corte y el sitio donde estás ──
      const mx = x0 + 46, my = y0 + 62, here = G.level && G.level.name === 'cisterna' ? 1 : 0;
      const known = i => i === 0 || (i === 1 && flag('cisterna')) || (i === 6 && flag('jefe'));
      t.text('Bulbo en corte', x0, y0, 4);
      for (let i = 0; i < 7; i++) {
        const r1 = 46 - i * 6;
        t.arc(mx, my, r1 - 5, r1, -1.571, 1.571, known(i) ? [9, 14, 7, 12, 15, 10, 11][i] : (i % 2 ? 5 : 13));
        t.arc(mx, my, r1, r1, -1.571, 1.571, 0);
        if (i === here && Math.floor(S.t * 3) % 2) t.arc(mx, my, r1 - 5, r1, -0.3, 0.3, 8);
      }
      t.rect(mx - 47, my + 1, 95, 1, 0);
      for (let i = 0; i < 7; i++) { const yy = y0 + 72 + i * 9, c = i === here ? 8 : known(i) ? 1 : 9; t.textR(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i], x0 + 14, yy, i === here ? 8 : 4); t.text(known(i) ? LAYERS[i] : '· · ·', x0 + 20, yy, c); if (i === here) t.text('◀', x0 + 24 + textW(LAYERS[i]), yy - 1, 8); }
      // plano del sitio
      const bx = x0 + 100, by = y0, bw = CW - 100, bh = 132; frame(bx + 1, by + 1, bw - 2, bh - 2); t.rect(bx + 1, by + 1, bw - 2, bh - 2, 1);
      const L = G.level; if (L) {
        t.rect(bx + 1, by + 1, bw - 2, 11, 4); t.text(L.title, bx + 4, by + 3, 15);
        t.setClip(bx + 1, by + 12, bw - 2, bh - 13);
        if (L.name === 'cisterna') {
          const sc = 0.95, ox2 = bx + bw / 2, oz2 = by + 120; const X = x => Math.round(ox2 + x * sc), Z = z => Math.round(oz2 + z * sc * 1.35);
          for (const r of L.rooms) { if (!sv.rooms[r.id]) continue; const rw = Math.round((r.x1 - r.x0) * sc), rh = Math.round((r.z1 - r.z0) * sc * 1.35); t.rect(X(r.x0), Z(r.z0), rw, rh, 2); t.box(X(r.x0), Z(r.z0), rw, rh, 14); }
          if (sv.rooms.r2) t.rect(X(-9) + 1, Z(-41), Math.round(18 * sc) - 2, Math.round(13 * sc * 1.35), flag('agua') ? 12 : 0);
          if (Math.floor(S.t * 4) % 2) t.rect(X(p.pos.x) - 1, Z(p.pos.z) - 1, 3, 3, 10);
        } else {
          const X = x => Math.round(bx + bw / 2 + x * 1.08), Z = z => Math.round(by + 72 + z * 1.75);
          t.rect(X(-34), Z(-30), 73, 105, 3); t.rect(X(-7), Z(-7), 15, 25, 6); t.rect(X(20), Z(-18), 15, 47, 11); t.rect(X(24), Z(-18), 11, 23, 10); t.rect(X(-1), Z(2), 2, 25, flag('jefe') ? 12 : 5); t.rect(X(-5), Z(16), 11, 14, flag('jefe') ? 12 : 5);
          t.rect(X(0) - 1, Z(0) - 1, 3, 3, 13); t.rect(X(0) - 1, Z(-11) - 1, 3, 3, 7); t.rect(X(30) - 1, Z(-13) - 1, 3, 3, 4); t.rect(X(-16) - 1, Z(10) - 1, 3, 3, 4); t.rect(X(12) - 1, Z(5) - 1, 3, 3, 14);
          if (Math.floor(S.t * 4) % 2) t.rect(X(p.pos.x) - 1, Z(p.pos.z) - 1, 3, 3, 8);
        }
        t.setClip(null);
      }
    } else if (pg === 2) {
      // ── cuaderno: el ecosistema ──
      const know = e => sv.seen[e.id] || ['cebollino', 'bicho', 'ajo', 'candela'].includes(e.id);
      ECO.forEach((e, i) => { const sel = i === S.eco, yy = y0 + i * 11; if (sel) { t.rrect(x0 - 3, yy - 3, 72, 11, 8, 2); t.rect(x0 - 2, yy + 7, 70, 1, 2); } t.text(know(e) ? e.name : '· · ·', x0 + 2, yy - 1, sel ? 7 : know(e) ? 1 : 9); });
      const e = ECO[S.eco], kn = know(e), vx = x0 + 78, vy = y0 - 1, vw = CW - 78, vh = 52;
      frame(vx, vy, vw, vh + 11);
      if (kn && e.make && live) { t.erase(vx, vy, vw, vh); if (S.viewKey !== 'e' + e.id) { S.viewKey = 'e' + e.id; setView(e.make, { sky: [12, 12, 12, 12], zoom: 0.85 }); } const v = UI.view; if (v) { v.x = vx; v.y = vy; v.w = vw; v.h = vh; v.spin.rotation.y += dt * 1.4; } }
      else { t.rect(vx, vy, vw, vh, kn && e.make ? 12 : 1); if (!kn || !e.make) t.text('?', vx + (vw >> 1) - 6, vy + 16, 2, 3); if (live && S.viewKey) { S.viewKey = null; setView(null); } }
      t.rect(vx, vy + vh, vw, 11, 8); t.text(kn ? e.name : '· · ·', vx + 4, vy + vh + 2, 7);
      const tx_ = wrap(kn ? e.text : 'Todavía no os habéis cruzado.', vw + 2); tx_.slice(0, 7).forEach((l, i) => t.text(l, vx - 1, vy + vh + 17 + i * 9, kn ? 1 : 4));
    } else {
      // ── Ceba ──
      const vx = x0 + 2, vy = y0 + 2;
      frame(vx, vy, 68, 78);
      if (live) { t.erase(vx, vy, 68, 78); if (S.viewKey !== 'ceba') { S.viewKey = 'ceba'; setView(() => { const c = makeCeba(); c.setHoja(!!sv.items.hoja); c.setLayers(p.layers); c.handL.position.set(-0.6, 0.4, 0.1); c.handR.position.set(0.6, 0.4, 0.1); c.footL.position.set(0.2, 0, 0); c.footR.position.set(-0.2, 0, 0); c.shadow.visible = false; c.root.scale.setScalar(p.scale); return c; }, { sky: [15, 12, 12, 12], zoom: 0.8, tilt: 0.25 }); } const v = UI.view; if (v) { v.x = vx; v.y = vy; v.w = 68; v.h = 78; v.spin.rotation.y += dt * 1.2; } }
      else t.rect(vx, vy, 68, 78, 12);
      const sx = x0 + 80, sw = CW - 80; let yy = y0;
      t.text('Ceba, la dulce', sx, yy, 8); yy += 13;
      onionGauge(t, sx + 12, yy + 12, p.layers, p.maxLayers, { crack: p.crack }); t.text('Capas', sx + 30, yy + 3, 4); t.text(`${p.layers} de ${p.maxLayers}`, sx + 30, yy + 13, 1); yy += 31;
      const cried = Object.keys(sv.flags).filter(f => f.startsWith('lloro_')).reduce((a, f) => a + sv.flags[f], 0);
      for (const [a, b] of [['Lágrimas', sv.tears], ['Veces en nada', sv.deaths], ['Vecinos llorados', cried]]) { t.text(a, sx, yy, 4); t.textR(String(b), sx + sw, yy, 1); t.rect(sx, yy + 8, sw, 1, 9); yy += 12; }
      yy = y0 + 92; t.rect(x0, yy - 6, CW, 1, 9);
      const opts = [`Sonido: ${audio.muted ? 'no' : 'sí'}`, S.saved > 0 ? '¡Guardado!' : 'Guardar partida', 'Salir al título'];
      if (S.saved > 0) S.saved -= dt;
      opts.forEach((o, i) => { const sel = i === S.opt, y = yy + i * 13, ow = textW(o) + 12; if (sel) { t.rrect(x0 + 13, y - 3, ow + 2, 13, 0, 2); t.rrect(x0 + 14, y - 2, ow, 11, 8, 2); t.rect(x0 + 15, y + 8, ow - 2, 1, 2); t.spr(ICON.lagrima, x0 + 2 + Math.round(Math.sin(S.t * 6) * 1.5), y - 2); } t.text(o, x0 + 20, y, sel ? 7 : 1); });
      t.textR('Espacio: elegir', x0 + CW, yy + 27, 4);
    }
  },
};
