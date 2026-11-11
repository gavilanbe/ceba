// title.js — pantalla de título (Bulbo flotando entre lágrimas) y las tarjetas de la leyenda.
import { THREE, MB, mat, texFrom, makeSky, U, W, H } from './gfx.js';
import { Tex, T, clamp, lerp, ease, textW, rng } from './px.js';
import { G, run, wait, tween, all, flag } from './state.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { UI, ICON, wrap, drawRich, plain } from './ui.js';
import { TXT } from './text.js';
import * as A from './art/props.js';
import { fx } from './fx.js';

function paintWorld() {
  const t = new Tex(128, 128), r = rng(5);
  t.rect(0, 0, 128, 64, 9); t.rect(0, 0, 128, 7, 4); t.rect(0, 7, 128, 1, 2);
  t.rect(0, 52, 128, 12, 4); t.rect(0, 58, 128, 6, 2);
  for (let k = 0; k < 8; k++) { const x = k * 16; t.rect(x, 8, 1, 44, 4); t.rect(x + 8, 12 + (k * 5 % 9), 1, 12, 10); }
  // tierras verdes, un estanque y un pueblo
  for (const [x, y, w, h] of [[4, 20, 9, 6], [20, 30, 11, 7], [36, 16, 10, 8], [50, 34, 9, 5], [100, 22, 12, 7], [116, 36, 8, 5], [8, 40, 7, 4]]) { t.oval(x + w / 2, y + h / 2, w / 2, h / 2, 11); t.px(x + 2, y + 2, 3); t.px(x + w - 3, y + h - 2, 3); }
  t.oval(42, 30, 3, 2, 12); t.px(41, 29, 7);
  for (const [x, y, c] of [[38, 18, 8], [41, 20, 15], [44, 18, 14], [40, 23, 8]]) { t.rect(x, y, 2, 2, c); t.px(x, y - 1, 4); }
  // la herida: donde alguien ha pelado, asoman las capas de dentro
  t.rect(68, 10, 26, 40, 14); t.rect(68, 10, 26, 1, 2); t.rect(68, 10, 1, 40, 2); t.rect(93, 10, 1, 40, 2); t.rect(68, 49, 26, 1, 2);
  for (let x = 72; x < 92; x += 5) t.rect(x, 12, 1, 36, 8);
  t.rect(75, 18, 12, 24, 7); t.box(75, 18, 12, 24, 2); t.rect(80, 20, 1, 20, 6); t.rect(78, 26, 6, 8, 11); t.rect(80, 28, 2, 4, 10);
  // tira de piel [0,64,64,16]
  t.rect(0, 64, 64, 16, 15); t.rect(0, 64, 64, 2, 9); t.rect(0, 78, 64, 2, 4); for (let x = 0; x < 64; x += 6) t.line(x, 66, x + 2, 77, 9);
  // brote [64,64,16,32]
  t.rect(64, 64, 16, 32, 11); t.rect(64, 64, 2, 32, 3); t.rect(78, 64, 2, 32, 3); t.rect(71, 66, 1, 30, 3); t.rect(66, 64, 12, 3, 10);
  return t;
}
function paintLogo() {
  const t = new Tex(136, 40);
  const cx = 17, cy = 19;
  t.arc(cx, cy, 12, 15, 2.25, 7.18, 9); t.arc(cx, cy, 8, 11, 2.25, 7.18, 14); t.arc(cx, cy, 4, 7, 2.25, 7.18, 7); t.disc(cx, cy, 2, 11); t.px(cx, cy - 1, 10);
  t.arc(cx, cy, 15, 15, 2.25, 7.18, 10); t.arc(cx, cy, 12, 12, 2.6, 6.8, 4);
  const L = { E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'], A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'] };
  let x = 40;
  for (const ch of 'EBA') {
    const g = L[ch];
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') {
      const X = x + i * 5, Y = 3 + j * 5; t.rect(X, Y, 5, 5, 9);
      if (j === 0 || g[j - 1][i] !== '1') t.rect(X, Y, 5, 1, 10);
      if (j === 6 || g[j + 1][i] !== '1') t.rect(X, Y + 4, 5, 1, 4);
      if (i === 0 || g[j][i - 1] !== '1') t.rect(X, Y, 1, 5, 10);
    }
    x += 32;
  }
  t.outline(0, 0, 136, 40, 0);
  return t;
}

const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 200), sky = makeSky();
let world, strip, tears = [], logo, built = false;
function build() {
  if (built) return; built = true;
  sky.material.uniforms.uC.value = [2, 1, 1, 0]; sky.material.uniforms.uStars.value = 1; scene.add(sky);
  const tx = texFrom(paintWorld()), m = mat(tx, { noDark: true }), md = mat(tx, { double: true, noDark: true, bias: -0.2 });
  world = new THREE.Group();
  world.add(new MB().lathe([[0.4, 0], [1.6, 0.15], [2.5, 1.0], [2.7, 2.1], [2.2, 3.3], [1.1, 4.1], [0.45, 4.5], [0.3, 5.0]], 8, [0, 0, 128, 64], { capB: [0, 56, 16, 8] }).mesh(m));
  const sp = new MB(); for (let i = 0; i < 3; i++) sp.push().move(0, 4.95, 0).rotY(i * 2.1).rotX(0.3 + i * 0.1).card(0.42, 1.5 - i * 0.2, [64, 64, 16, 32]).pop(); world.add(sp.mesh(md));
  // la tira pelada, rizándose
  const sb = new MB(); const pts = []; for (let i = 0; i <= 9; i++) { const a = 0.95 + i * 0.16, rr = 2.75 + i * i * 0.085, y = 2.5 - i * 0.02 + Math.sin(i * 0.7) * 0.35; pts.push([Math.sin(a) * rr, y, Math.cos(a) * rr]); }
  for (let i = 0; i < 9; i++) { const p = pts[i], q = pts[i + 1], w0 = 0.75 - i * 0.05, w1 = 0.75 - (i + 1) * 0.05; sb.quad([p[0], p[1] + w0, p[2]], [p[0], p[1] - w0, p[2]], [q[0], q[1] - w1, q[2]], [q[0], q[1] + w1, q[2]], [i * 7, 64, 7, 16]); }
  strip = sb.mesh(md); world.add(strip);
  world.position.set(2.6, -2.5, 0); scene.add(world);
  for (let i = 0; i < 7; i++) { const tr = A.makeTear(i % 3 === 0); tr.sh.visible = false; tr.g.scale.setScalar(1.6); scene.add(tr.g); tears.push({ g: tr.g, a: i * 0.9, r: 4.2 + (i % 3) * 0.9, y: -1 + i * 0.6, s: 0.25 + (i % 4) * 0.06 }); }
  logo = paintLogo();
}

const S = { t: 0, sel: 0, opts: [], phase: 'logo', card: null, zoom: 0 };
export const Title = {
  scene, cam, S,
  enter() {
    build(); S.t = 0; S.phase = 'logo'; S.sel = G.hasSave() ? 1 : 0; S.opts = G.hasSave() ? ['Partida nueva', 'Continuar'] : ['Partida nueva']; S.zoom = 0; S.card = null;
    U.uDark.value = 0; U.uFogR.value.set(900, 999); U.uAmb.value = 0.5; U.uPL.value.forEach(p => { p.w = 0; });
    audio.music('title', { fade: 0.5 });
    UI.over = (t, dt) => Title.draw(t, dt);
  },
  leave() { UI.over = null; },
  update(dt) {
    S.t += dt;
    world.rotation.y = S.t * 0.22; strip.rotation.y = Math.sin(S.t * 0.6) * 0.05;
    for (const q of tears) { q.a += dt * q.s; q.g.position.set(2.6 + Math.sin(q.a) * q.r, q.y + Math.sin(S.t + q.a) * 0.3, Math.cos(q.a) * q.r); q.g.rotation.y = S.t * 2 + q.a; }
    const z = ease.io(S.zoom);
    cam.position.set(lerp(-1.2, 1.6, z), lerp(0.6, 0.4, z), lerp(13.5, 9.5, z)); cam.lookAt(lerp(-0.2, 2.2, z), lerp(0.1, 0.0, z), 0);
    if (S.phase === 'logo' && S.t > 1.7) S.phase = 'menu';
    if (S.phase === 'menu' && G.lock <= 0) {
      if (input.hit('up') || input.hit('down')) { S.sel = (S.sel + 1) % S.opts.length; audio.sfx('menuMove'); }
      if (input.hit('a') || input.hit('start')) {
        audio.init(); audio.sfx('select'); S.phase = 'go';
        const cont = S.opts[S.sel] === 'Continuar';
        run(cont ? G.startContinue() : G.startNew());
      }
    }
  },
  render(r) { r.render(scene, cam); },
  draw(t, dt) {
    if (S.phase === 'cards') { Title.drawCard(t, dt); return; }
    const out = S.phase === 'go' ? clamp((S.goT = (S.goT || 0) + dt) / 0.4) : (S.goT = 0);
    // logo: cada trozo cae con rebote
    const lx = 18, ly = 26;
    const parts = [[0, 36], [38, 32], [70, 32], [102, 32]];
    parts.forEach(([x0, w], i) => { const k = clamp((S.t - 0.25 - i * 0.16) / 0.5); if (k <= 0) return; const dy = Math.round((1 - ease.bounce(k)) * -70 - out * 80); t.blit(logo, x0, 0, w, 40, lx + x0 + 2, ly + dy + 2, { solid: 0 }); t.blit(logo, x0, 0, w, 40, lx + x0, ly + dy); });
    if (S.t > 1.2) {
      const k = ease.out3(clamp((S.t - 1.2) / 0.4)), sub = 'El mundo de siete capas', sw = Math.round((textW(sub) + 14) * k), y = ly + 45 - Math.round(out * 80);
      t.rect(lx, y - 1, sw, 13, 0); t.rect(lx, y, sw, 11, 8); t.rect(lx, y + 10, sw, 1, 2); t.setClip(lx, y, sw, 11); t.text(sub, lx + 7, y + 2, 7); t.setClip(null);
    }
    if (S.phase === 'menu' || S.phase === 'go') {
      const k = ease.back(clamp((S.t - 1.7) / 0.35)) * (1 - out);
      S.opts.forEach((o, i) => {
        const y = 106 + i * 16, x = lx + 14 - Math.round((1 - k) * 110), sel = i === S.sel, ow = textW(o) + 14;
        t.rrect(x - 1, y - 4, ow + 2, 15, 0, 2); t.rrect(x, y - 3, ow, 13, sel ? 9 : 1, 2); t.rect(x + 2, y - 2, ow - 4, 1, sel ? 10 : 13); t.rect(x + 1, y + 8, ow - 2, 1, sel ? 4 : 0);
        if (sel) t.spr(ICON.lagrima, x - 12 + Math.round(Math.sin(S.t * 6) * 2), y - 3);
        t.text(o, x + 7, y, sel ? 0 : 6);
      });
      if (k > 0.9) {
        if (Math.floor(S.t * 1.6) % 2) t.textS('Pulsa Espacio', lx + 14, 106 + S.opts.length * 16 + 2, 7, 0);
        const c1 = 'WASD mover · Flechas o ratón: cámara · Espacio acción', c2 = 'J la Hoja · Mayús fijar · U I O objetos · R zoom · Intro pausa';
        t.rect(0, H - 25, W, 25, 0); t.rect(0, H - 25, W, 1, 2); t.textC(c1, W / 2, H - 21, 13); t.textC(c2, W / 2, H - 11, 13);
      }
    }
  },
  // ── la leyenda ──
  drawCard(t, dt) {
    t.rect(0, 0, W, 16, 0); t.rect(0, H - 46, W, 46, 0); t.rect(0, H - 47, W, 1, 2); t.rect(0, 16, W, 1, 2);
    const c = S.card; if (!c) return; c.t += dt;
    let n = Math.floor(c.t * 26);
    c.lines.forEach((l, i) => { const w = textW(plain(l)); const used = drawRich(t, l, (W - w) >> 1, H - 38 + i * 12 + (3 - c.lines.length) * 6, 'oscuro', n, G.t); n -= used; });
    c.done = n >= 0;
  },
  *card(text, hold = 2.3) {
    S.card = { lines: text.split('\n'), t: 0, done: false };
    let e = 0, after = 0, last = -1;
    for (;;) { const dt = yield; e += dt; const k = Math.floor(e * 26); if (!S.card.done && k !== last && k % 2 === 0) audio.sfx('blip', { pitch: 0.7, vol: 0.5 }); last = k; if (S.card.done) after += dt; if (after > hold) break; if (input.hit('a') || input.hit('start')) { if (S.card.done) break; S.card.t = 99; } }
    S.card = null;
  },
  *intro() {
    G.lock++;
    yield* G.fade(1, 0.6, 0); S.phase = 'cards'; audio.music('intro', { fade: 0.8 });
    yield* all(G.fade(0, 0.8, 0), tween(7, k => { S.zoom = k; }), Title.card(TXT.INTRO[0]));
    yield* G.fade(1, 0.6, 0);
    // el resto, sobre Villa Ristra
    const p = G.player; Title.leave(); G.mode = 'play'; G.cine = true;
    const L = G.load('villa', 'cama'); L.resumeMusic = L.resumeMusic; audio.music('intro');
    p.sink = 0.86; p.faceOv = 'sleep'; p.set('cine'); G.candela.show(false);
    UI.over = (t, dt) => Title.drawCard(t, dt);
    const shot = function* (text, a, b, good) {
      L.statue.setCry(good, true); L.pond.on = good; L.pond.mesh.visible = good;
      G.cam.cut(a[0], a[1], a[2], a[3], a[4], a[5], 38);
      yield* all(G.fade(0, 0.6, 0), G.cam.to(b[0], b[1], b[2], b[3], b[4], b[5], 7, 36, x => x), Title.card(text));
      yield* G.fade(1, 0.5, 0);
    };
    yield* shot(TXT.INTRO[1], [-1.0, 1.6, -0.2, -4.2, 2.2, -4.2], [-1.7, 2.1, -1.1, -4.2, 2.3, -4.2], true);
    yield* shot(TXT.INTRO[2], [-11, 5.5, 14, 0, 0.8, -4], [-8, 4.4, 11, 0, 0.8, -4], true);
    yield* shot(TXT.INTRO[3], [-13.8, 0.9, 12.2, -16, 0.35, 10], [-14.4, 0.8, 11.6, -16, 0.35, 10], true);
    yield* shot(TXT.INTRO[4], [5, 3.4, 27, 0, -0.8, 18], [3, 2.4, 25, 0, -0.9, 16], false);
    UI.over = null; G.cine = false; G.lock--;
    L.resumeMusic();
    yield* all(G.fade(0, 0.8, 0), L.onEnter(L, null, {}));
  },
};
