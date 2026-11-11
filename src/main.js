// main.js — arranque, bucle, cambio de nivel, acción contextual, muerte y herramientas de prueba.
import { THREE, makeRenderer, makeSky, U, W, H, RS, setLights } from './gfx.js';
import { G, newSave, loadSave, writeSave, wipeSave, flag, run, tickScripts, wait, all } from './state.js';
import { input } from './input.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Player, angDiff } from './player.js';
import { Cam } from './camera.js';
import { Candela } from './creatures.js';
import { LEVELS } from './levels.js';
import { ui, drawUI, UI, onionGauge, layerRow } from './ui.js';
import { Menu } from './menu.js';
import { Title } from './title.js';
import { TXT } from './text.js';
import { clamp, lerp, ease } from './px.js';
import './ents.js';
import './ents2.js';

const q = new URLSearchParams(location.search);
G.manual = q.has('manual'); G.debug = q.has('debug');
const renderer = makeRenderer(document.getElementById('gl'));
const uic = document.getElementById('ui'), ctx = uic.getContext('2d'), img = ctx.createImageData(W, H);
const scene = new THREE.Scene(), sky = makeSky(); scene.add(sky); G.scene = scene; G.sky = sky;
fx.init(); fx.attach(scene);
const player = new Player(); G.player = player; scene.add(player.obj);
const cam = new Cam(); G.cam = cam;
const candela = new Candela(); G.candela = candela; scene.add(candela.obj);
G.input = input; G.renderer = renderer;

function applyEnv(L) {
  sky.material.uniforms.uC.value = L.sky; sky.material.uniforms.uStars.value = L.stars || 0;
  U.uFog.value = L.fog[2]; U.uFogR.value.set(L.fog[0], L.fog[1]); U.uDark.value = L.dark; U.uAmb.value = L.amb; U.uQ.value = L.dark > 0.5 ? 2 : 4;
}
G.applyEnv = applyEnv;
G.load = (name, at) => {
  if (G.level) scene.remove(G.level.group);
  fx.clear(); G.slimes.length = 0; G.peels.length = 0; G.target = null; G.boss = null; G.actionEnt = null; G.speaker = null;
  const L = LEVELS[name](); G.level = L; scene.add(L.group); applyEnv(L);
  const s = L.spawn[at] || Object.values(L.spawn)[0];
  player.maxLayers = G.save.maxLayers; player.m.setHoja(!!G.save.items.hoja);
  player.place(s[0], s[1], s[2], s[3] || 0); player.hidden = false; player.frozen = false; player.inv = 0; player.faceOv = null; player.pose = null;
  cam.reset((s[3] || 0) + Math.PI);
  candela.show(!!flag('intro'), s[0], s[1] + 1.5, s[2]); candela.goal = null;
  candela.lr = L.candela || (L.dark > 0.5 ? 5.2 : 2.5);
  return L;
};
G.goto = function* (name, at, o = {}) {
  G.lock++;
  if (!o.irisDone) yield* G.iris(true, 0.55);
  const from = o.from ?? (G.level ? G.level.name : null);
  const L = G.load(name, at); G.mode = 'play'; yield;
  L.resumeMusic();
  G.lock--;
  yield* all(G.iris(false, 0.7), L.onEnter ? L.onEnter(L, from, o) : (function* () { G.areaTitle(L.title, L.sub); })());
};

// ───────── acción contextual del botón A ─────────
function detectAction() {
  const p = player; let best = null, bs = 1e9;
  if (p.state === 'free' && G.lock <= 0 && (p.onGround || p.swim)) {
    for (const e of G.level.ents) {
      if (e.dead || !e.interact || e.canInteract === false) continue;
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d > (e.ir || 1.4) + p.r * 0.5 || Math.abs(e.pos.y - p.pos.y) > 1.8) continue;
      if (!e.noFace && d > 0.6 && Math.abs(angDiff(p.yaw, Math.atan2(dx, dz))) > 1.25) continue;
      if (d < bs) { bs = d; best = e; }
    }
  }
  G.actionEnt = best;
  if (G.lock > 0) G.action = '';
  else if (best) G.action = best.label || 'USAR';
  else if (p.state === 'root') G.action = 'SALIR';
  else if (p.state === 'free' && p.onGround && Math.hypot(p.vel.x, p.vel.z) > 1.2) G.action = 'RODAR';
  else G.action = '';
}

// ───────── muerte: «te has quedado en nada» ─────────
G.onDeath = () => run(function* () {
  yield* wait(1.3); G.lock++;
  yield* G.fade(1, 0.9, 0); G.save.deaths++;
  let t0 = 0, fill = 0; const max = G.save.maxLayers;
  UI.top = (t, dt) => {
    t0 += dt; onionGauge(t, W / 2, 58, Math.floor(fill), max, { core: 5, th: max > 4 ? 4 : 5 }); layerRow(t, Math.round(W / 2 - max * 6.5), 92, Math.floor(fill), max, false);
    t.textC(TXT.MUERTE, W / 2, 114, 7); if (t0 > 1.4 && fill === 0) { t.textC('Te quedaste sin capas. Vuelves al último bancal.', W / 2, 128, 6); if (Math.floor(t0 * 2) % 2) t.textC('Espacio: volver a brotar', W / 2, 144, 13); }
  };
  audio.jingle('gameover'); yield* wait(1.4);
  for (;;) { yield; if (input.hit('a') || input.hit('start')) break; }
  for (let i = 1; i <= max; i++) { fill = i; audio.sfx('ring', { pitch: 0.8 + i * 0.15 }); yield* wait(0.28); }
  yield* wait(0.3);
  player.crack = false; player.setLayers(max, true); player.inv = 0; player.rollA = 0; player.set('free'); player.faceHold = 0;
  G.save.layers = max; G.save.crack = false;
  G.load(G.save.spawn.level, G.save.spawn.at); G.level.resumeMusic();
  UI.top = null; G.lock--; yield* G.fade(0, 0.7, 0); G.areaTitle(G.level.title, G.level.sub);
});

// ───────── bucle ─────────
let acc = 0;
function update(dt) {
  G.dt = dt; input.poll();
  if (G.mode === 'title') Title.update(dt);
  else if (G.mode === 'menu') Menu.update(dt);
  else if (G.mode === 'play') {
    if (input.pressed.start && G.lock <= 0 && player.state !== 'dead' && !G.cine) { input.pressed.start = false; Menu.open(); }
  }
  tickScripts(dt);
  if (G.mode === 'play' && G.level) {
    let w = dt; if (fx.stopT > 0) { fx.stopT -= dt; w = 0; }
    G.t += dt; U.uTime.value = G.t; G.save.time += dt;
    const L = G.level;
    if (w > 0) {
      if (player.frozen) player.sync(w); else player.update(w);
      const es = L.ents; for (let i = 0; i < es.length; i++) { const e = es[i]; if (!e.dead) e.update(w); }
      if (es.some(e => e.dead)) L.ents = es.filter(e => !e.dead);
      if (L.tick) L.tick(w);
      candela.update(w);
      detectAction();
    }
    cam.update(dt);
    fx.update(w, cam.cam);
    const ls = []; for (const l of L.lights) { l.r = l.base * (1 + Math.sin(G.t * 9 + l.ph) * 0.05 * l.flick); ls.push(l); }
    if (candela.on) ls.push(candela.light);
    setLights(ls, player.pos.x, player.pos.y, player.pos.z);
  } else if (G.mode !== 'play') { G.t += dt; U.uTime.value = G.t; }
}
const _d = new THREE.Vector3(), _p = new THREE.Vector3();
function render(dt) {
  renderer.setViewport(0, 0, W * RS, H * RS); renderer.setScissorTest(false); renderer.clear();
  if (G.mode === 'title') Title.render(renderer);
  else if (G.level) {
    cam.cam.getWorldDirection(_d); sky.material.uniforms.uOff.value = (G.level.skyOff || 0) + _d.y * 0.6;
    // ventana para ver a Ceba si hay un muro delante
    _p.set(player.pos.x, player.pos.y + 0.5 * player.sc, player.pos.z); const vz = -_p.clone().applyMatrix4(cam.cam.matrixWorldInverse).z; _p.project(cam.cam);
    U.uCutXY.value.set((_p.x * 0.5 + 0.5) * W * RS, (_p.y * 0.5 + 0.5) * H * RS); U.uCutZ.value = vz;
    if (G.level.camFree) {
      U.uCutR.value = 0; const c = cam.cam.position, f = cam.shot ? cam.look : player.pos; let nx = c.x - f.x, nz = c.z - f.z; const n = Math.hypot(nx, nz) || 1; nx /= n; nz /= n;
      const fy = cam.shot ? cam.look.y - 0.4 : Math.min(player.pos.y, player.groundY > -50 ? player.groundY : player.pos.y);
      U.uCutP.value.set(nx, nz, f.x * nx + f.z * nz + (cam.shot ? Math.min(2.5, n * 0.5) : 1.5), fy + 0.3);
    } else { U.uCutP.value.w = -999; U.uCutR.value = G.cine ? 0 : 34 * RS * clamp(7 / Math.max(2, vz), 0.6, 1.6); }
    renderer.render(scene, cam.cam);
  }
  drawUI(dt);
  const v = UI.view;
  if (v && v.w > 4) {
    const keep = [U.uDark.value, U.uFogR.value.x, U.uFogR.value.y, U.uAmb.value]; const pl = U.uPL.value.map(p => p.w);
    U.uDark.value = 0; U.uFogR.value.set(900, 999); U.uAmb.value = 0.5; U.uPL.value.forEach(p => { p.w = 0; }); U.uCutR.value = 0; U.uCutP.value.w = -999;
    renderer.setViewport(v.x * RS, (H - v.y - v.h) * RS, v.w * RS, v.h * RS); renderer.setScissor(v.x * RS, (H - v.y - v.h) * RS, v.w * RS, v.h * RS); renderer.setScissorTest(true);
    renderer.clearDepth(); v.cam.aspect = v.w / v.h; v.cam.updateProjectionMatrix();
    v.cam.position.set(0, v.dist * v.tilt, v.dist); v.cam.lookAt(0, 0, 0);
    renderer.render(v.scene, v.cam); renderer.setScissorTest(false);
    U.uDark.value = keep[0]; U.uFogR.value.set(keep[1], keep[2]); U.uAmb.value = keep[3]; U.uPL.value.forEach((p, i) => { p.w = pl[i]; });
  }
  ui.rgba(img.data); ctx.putImageData(img, 0, 0);
  input.flush();
}
function frame(dt) { update(dt); render(dt); }

// ───────── arranque ─────────
G.startNew = function* () {
  G.save = newSave(); player.maxLayers = 3; player.crack = false; player.setLayers(3, true); player.m.setHoja(false);
  yield* Title.intro();
};
G.startContinue = function* () {
  const s = loadSave(); G.save = s; if (!LEVELS[s.spawn.level]) s.spawn = { level: 'villa', at: 'cama' }; player.maxLayers = s.maxLayers; player.crack = !!s.crack; player.setLayers(clamp(s.layers || s.maxLayers, 1, s.maxLayers), true);
  yield* G.fade(1, 0.5, 0); Title.leave(); G.fade_ = 0;
  UI.S.fade = 0; UI.S.iris = { k: 1, cx: W / 2, cy: H / 2 };
  yield* G.goto(s.spawn.level, s.spawn.at, { irisDone: true, from: null });
};
G.hasSave = () => !!loadSave();
G.wipe = wipeSave;

G.save = newSave();
G.mode = 'title'; Title.enter();
input.onFirst = () => audio.init();

if (!G.manual) {
  let last = performance.now();
  const loop = now => { let dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else frame(1 / 60);

// herramientas de prueba (tools/shot.mjs)
window.game = {
  G, input, fx, audio, player, cam,
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); },
  key(code, on = true) { input.key(code, on); },
  tap(code, n = 2) { input.key(code, true); this.step(n); input.key(code, false); this.step(1); },
  tp(x, y, z, yaw) { player.place(x, y, z, yaw ?? player.yaw); cam.reset((yaw ?? player.yaw) + Math.PI); },
  // salta el título: partida nueva directa en un nivel
  boot(level = 'villa', at, flags = {}, items = {}) {
    G.scripts.length = 0; G.lock = 0; G.cine = false; UI.over = null; UI.top = null; UI.S.iris = null; UI.S.fade = 0; UI.under = null;
    G.save = newSave(); Object.assign(G.save.flags, { intro: 1, ...flags }); Object.assign(G.save.items, items);
    if (items.mondador) G.save.c[0] = 'mondador'; if (items.ajo) { G.save.c[1] = 'ajo'; G.save.ajos = 10; G.save.flags.ajo = 1; } if (items.cerbatana) { G.save.c[2] = 'cerbatana'; G.save.flags.cerbatana = 1; } if (items.capa) G.save.maxLayers = 3 + items.capa;
    player.maxLayers = G.save.maxLayers; player.crack = false; player.setLayers(G.save.maxLayers, true);
    Title.leave(); G.mode = 'play'; const L = G.load(level, at); this.step(2); return Object.keys(L.spawn);
  },
  say(k) { run(function* () { yield* G.say(null, k); }); },
  // avanza hasta que se cumpla la condición (o se agoten los fotogramas); devuelve cuántos ha dado
  until(f, max = 3000) { let n = 0; while (n < max && !f()) { this.step(1); n++; } return n; },
  // va pulsando A para pasar diálogos hasta que se cumpla la condición
  adv(f, max = 4000) { let n = 0; while (n < max && !f()) { if (n % 14 === 0) input.key('Space', true); if (n % 14 === 2) input.key('Space', false); this.step(1); n++; } input.key('Space', false); return n; },
  // empuja en una dirección del mundo durante n fotogramas
  dir(dx, dz, n = 60) { for (let i = 0; i < n; i++) { const cy = cam.yaw, ax = Math.cos(cy) * dx - Math.sin(cy) * dz, ay = Math.sin(cy) * dx + Math.cos(cy) * dz; input.down.right = ax > 0.3; input.down.left = ax < -0.3; input.down.down = ay > 0.3; input.down.up = ay < -0.3; this.step(1); } input.down.right = input.down.left = input.down.up = input.down.down = false; this.step(1); },
  // pelea sola: va hacia la plaga más cercana y da tajos
  bot(max = 600, f = () => false) {
    let n = 0;
    while (n < max && !f()) {
      let best = null, bd = 1e9; for (const e of G.level.ents) { if (e.dead || !e.enemy) continue; const d = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z); if (d < bd) { bd = d; best = e; } }
      input.down.right = input.down.left = input.down.up = input.down.down = false;
      if (best) { const dx = best.pos.x - player.pos.x, dz = best.pos.z - player.pos.z, d = bd || 1, cy = cam.yaw, ax = Math.cos(cy) * dx / d - Math.sin(cy) * dz / d, ay = Math.sin(cy) * dx / d + Math.cos(cy) * dz / d; if (d > 1.1) { input.down.right = ax > 0.3; input.down.left = ax < -0.3; input.down.down = ay > 0.3; input.down.up = ay < -0.3; } if (d < 1.9 && n % 9 === 0) input.pressed.b = true; }
      this.step(1); n++;
    }
    input.down.right = input.down.left = input.down.up = input.down.down = false; return n;
  },
  // camina hacia un punto con la cámara actual
  walk(x, z, max = 600) { let n = 0; while (n < max) { const dx = x - player.pos.x, dz = z - player.pos.z, d = Math.hypot(dx, dz); if (d < 0.35) break; const cy = cam.yaw, ax = Math.cos(cy) * dx / d - Math.sin(cy) * dz / d, ay = Math.sin(cy) * dx / d + Math.cos(cy) * dz / d; input.down.right = ax > 0.3; input.down.left = ax < -0.3; input.down.down = ay > 0.3; input.down.up = ay < -0.3; this.step(1); n++; } input.down.right = input.down.left = input.down.up = input.down.down = false; this.step(2); return n; },
  state() { return { mode: G.mode, lock: G.lock, pos: player.pos.toArray().map(v => +v.toFixed(2)), st: player.state, layers: player.layers, crack: player.crack, tears: G.save.tears, flags: G.save.flags, action: G.action, scripts: G.scripts.length, ents: G.level ? G.level.ents.length : 0 }; },
};
window.ready = true;
