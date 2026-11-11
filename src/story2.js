// story2.js — capítulo II: el sello de moho, la caída a la Pulpa, la gente del Raigal, la Raicera, Cavador y Don Mildiu.
import { THREE } from './gfx.js';
import { G, flag, run, wait, tween, writeSave, seen } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent, Chest } from './ents.js';
import { Breakable, Pepita } from './ents2.js';
import { NPC } from './creatures.js';
import { UI } from './ui.js';
import { TXT } from './text.js';
import * as A from './art/props.js';
import { TI } from './art/tiles.js';
import { clamp, lerp, ease } from './px.js';
import { W, H } from './gfx.js';

const cineOn = p => { G.lock++; G.cine = true; p.vel.set(0, 0, 0); p.set('cine'); p.m.draw(false); G.target = null; };
const cineOff = (p, t = 0.7) => { G.cam.release(t); p.set('free'); p.faceOv = null; p.pose = null; G.lock--; G.cine = false; };
function* walkTo(p, x, z, max = 3) { p.auto = { x, z, speed: 0.75 }; let e = 0; while (p.auto && e < max) e += yield; p.auto = null; p.vel.x = p.vel.z = 0; }

// algo con lo que se interactúa y lanza una escena
export class Paso extends Ent {
  constructor(x, y, z, label, fn, o = {}) { super(x, y, z); this.label = label; this.fn = fn; this.ir = o.ir || 1.5; this.noFace = true; this.hh = o.hh || 0.6; this.o = o; }
  update(dt) { if (this.o.sparks && rnd() < 0.3) fx.one(P.sqY, this.pos.x + (rnd() - 0.5) * 1.6, this.pos.y + 0.1, this.pos.z + (rnd() - 0.5) * 1.6, { vy: 2 + rnd() * 2, g: -1, life: 1.2, size: 0.14 }); }
  interact(p) { run(this.fn(p, this)); }
}

// ───────── Villa Ristra, después de la capa I ─────────
export function* consejoAjo(n, p) {
  G.cine = true;
  G.cam.cut(n.pos.x + 2.6, n.pos.y + 1.5, n.pos.z + 4.6, n.pos.x - 0.2, n.pos.y + 1.0, n.pos.z, 34);
  yield* G.say(null, 'CONSEJO_6');
  G.cam.release(0.5); G.cine = false;
  yield* G.giveItem('ajo');
  yield* G.say(null, 'CONSEJO_7'); writeSave();
}
export function* yayaTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'YAYA_AY'); return; }
  const sv = G.save;
  if (!flag('yaya')) { yield* G.say(null, 'YAYA_1'); flag('yaya', 1); }
  if ((sv.pepitas || 0) >= 4) {
    yield* G.say(null, 'YAYA_TRATO');
    const i = yield* G.choose('YAYA_Q', ['SÍ', 'NO']);
    if (i === 0) { sv.pepitas -= 4; flag('anillosYaya', (flag('anillosYaya') || 0) + 1); yield* G.say(null, 'YAYA_SI'); yield* G.giveItem('capa'); writeSave(); }
    else yield* G.say(null, 'YAYA_NO');
  } else yield* G.say(null, flag('pepita') ? TXT.YAYA_FALTAN(4 - (sv.pepitas || 0)) : 'YAYA_2');
}

// ───────── la Cisterna: el sello de moho y la bajada ─────────
export function sello(L) {
  if (flag('selloRoto')) { hoyo(L); return; }
  L.add(new Breakable(0, 0, -66, 1.9, 0.16, 1.9, { key: 'selloRoto', onBreak: () => run(selloRoto(L)) }));
}
function hoyo(L) {
  const m = A.tileBox(1.7, 0.03, 1.7, { all: TI.negro }).mesh(A.tileModelMat()); m.position.set(0, 0.01, -66); L.group.add(m);
  L.add(new Paso(0, 0, -66, 'BAJAR', bajarAPulpa, { ir: 1.5, hh: 0.3 }));
}
function* selloRoto(L) {
  const p = G.player; yield* wait(0.5);
  G.lock++; G.cine = true; G.target = null;
  yield* G.cam.to(2.6, 3.2, -61.6, 0, 0, -66, 0.8, 36);
  hoyo(L); audio.sfx('secret'); audio.jingle('secret');
  let e = 0; while (e < 1.6) { const dt = yield; e += dt; if (rnd() < 0.6) fx.one(P.drop, (rnd() - 0.5) * 1.4, 0.4 + rnd(), -66 + (rnd() - 0.5) * 1.4, { vy: -2, g: 9, life: 0.5, size: 0.24 }); if (rnd() < 0.2) fx.ring(0, 0.03, -66, { r0: 1.2, r1: 0.2, t: 0.5, c: 12, th: 0.15 }); }
  yield* G.say('CANDELA', 'SELLO_ROTO', { voice: 2.1 });
  G.cam.release(0.7); G.lock--; G.cine = false; writeSave();
}
function* bajarAPulpa(p) {
  cineOn(p); yield* walkTo(p, 0, -64.4, 1.5); p.yaw = Math.PI;
  G.cam.cut(3.4, 2.6, -61.5, 0, 0.4, -66, 36); p.faceOv = 'brave';
  audio.sfx('jump'); yield* tween(0.45, k => { p.pos.set(0, Math.sin(k * 3.14) * 1.3, lerp(-64.4, -66, k)); p.vel.set(0, 0, 0); });
  p.frozen = true; audio.music(null, { fade: 0.8 }); audio.sfx('waterRise', { pitch: 1.4, vol: 0.5 });
  const it = G.iris(true, 1.0); let e = 0;
  while (e < 1.2) { const dt = yield; e += dt; p.pos.y -= dt * (2 + e * 9); p.yaw += dt * 9; p.vel.set(0, 0, 0); it.next(dt); }
  p.frozen = false; G.lock--; G.cine = false; p.faceOv = null;
  yield* G.goto('pulpa', 'caida', { from: 'cisterna', irisDone: true });
}

// ───────── el Raigal ─────────
export function* pulpaEnter(L, from, o = {}) {
  const p = G.player;
  if (from === 'raicera' && flag('jefe2') && !flag('fin2')) { yield* ending2(L); return; }
  if (from === 'cisterna') {
    cineOn(p); p.frozen = true; p.yaw = Math.PI; p.pos.set(0, 20, 37); p.faceOv = 'wow';
    G.cam.cut(7.5, 2.4, 27.5, 0, 2.2, 37, 42);
    let e = 0; while (e < 1.15) { const dt = yield; e += dt; p.pos.set(0, lerp(20, -0.9, ease.in(clamp(e / 1.15))), 37); p.yaw += dt * 9; p.vel.set(0, 0, 0); if (rnd() < 0.5) fx.one(P.drop, (rnd() - 0.5), p.pos.y + 1, 37 + (rnd() - 0.5), { vy: 1, g: 4, life: 0.4, size: 0.24 }); }
    audio.sfx('splash'); fx.burst(P.drop, 0, -0.3, 37, 26, { speed: 3.6, up: 6, life: 0.9, size: 0.34 }); fx.ring(0, -0.33, 37, { r0: 0.4, r1: 3.6, t: 0.7, c: 7, th: 0.2 }); fx.shake(0.12, 0.2);
    yield* wait(0.7); p.yaw = Math.PI; p.faceOv = null; audio.sfx('jump');
    yield* tween(0.55, k => { p.pos.set(0, lerp(-0.9, 0, k) + Math.sin(k * 3.14) * 1.5, lerp(37, 31, k)); p.vel.set(0, 0, 0); });
    p.frozen = false; p.sqV = -6; audio.sfx('land');
    if (!flag('pulpa')) {
      flag('pulpa', 1); seen('lombriz');
      yield* G.cam.to(0, 9, 34, 0, 4, -10, 2.2, 46); yield* wait(0.5);
      yield* G.say('CANDELA', 'PUL_LLEGADA', { voice: 2.1 });
      G.save.spawn = { level: 'pulpa', at: 'pul0' }; writeSave();
    }
    G.cam.yaw = 0; cineOff(p, 0.9);
  }
  G.areaTitle(L.title, flag('raiz') ? 'LA RAÍZ MADRE VUELVE A BEBER' : L.sub);
}
export function* subirACisterna(p, e) {
  cineOn(p); yield* walkTo(p, e.pos.x + 1.1, e.pos.z, 1.5); p.yaw = -Math.PI / 2;
  audio.sfx('jump'); p.pose = { L: [-0.3, 1.0, 0.3], R: [0.3, 1.0, 0.3] }; p.frozen = true; audio.music(null, { fade: 1 });
  const it = G.iris(true, 1.2); let t = 0;
  while (t < 1.6) { const dt = yield; t += dt; p.pos.set(lerp(p.pos.x, e.pos.x + 0.35, 0.2), p.pos.y + dt * (1.5 + t * 4), e.pos.z); p.vel.set(0, 0, 0); if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) audio.sfx('bucket', { pitch: 1.2, vol: 0.5 }); if (t > 0.5) it.next(dt); }
  p.frozen = false; p.pose = null; G.lock--; G.cine = false;
  yield* G.goto('cisterna', 'desague', { from: 'pulpa', irisDone: true });
}
export function entrarRaicera(p) {
  if (G.lock > 0 || p.state === 'cine') return;
  run(function* () { G.lock++; audio.sfx('door'); yield* G.iris(true, 0.5); G.lock--; yield* G.goto('raicera', 'entrada', { from: 'pulpa', irisDone: true }); });
}
export function* salirRaicera(p) { G.lock++; audio.sfx('door'); yield* G.iris(true, 0.5); G.lock--; yield* G.goto('pulpa', 'raicera', { from: 'raicera', irisDone: true }); }

export function* anelidaTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'ANELIDA_AY'); return; }
  if (flag('fin2')) yield* G.say(null, 'ANELIDA_4');
  else if (flag('cofreCerbatana')) yield* G.say(null, 'ANELIDA_3');
  else if (flag('anelida')) yield* G.say(null, 'ANELIDA_2');
  else {
    G.cine = true; G.cam.cut(n.pos.x - 3.4, 1.9, n.pos.z + 5, n.pos.x - 1.4, 3.4, n.pos.z - 4, 44);
    yield* G.say(null, 'ANELIDA_1'); flag('anelida', 1); writeSave(); G.cam.release(0.7); G.cine = false;
  }
}
export function* limoTalk(n, p) { if (n.cryT > 0) { yield* G.say(null, 'LIMO_AY'); return; } n.k = (n.k || 0) + 1; yield* G.say(null, flag('fin2') ? 'LIMO_3' : n.k % 2 ? 'LIMO_1' : 'LIMO_2'); seen('mildiu'); }
export function* tuboTalk(n, p) { yield* G.say(null, flag('lloro_tubo') ? 'TUBO_2' : 'TUBO_1'); }
export function* fideoTalk(n, p) { yield* G.say(null, flag('pp_pul1') ? 'FIDEO_2' : 'FIDEO_1'); }
export function* lombrizTalk(n, p) { yield* G.say(null, flag('fin2') ? 'LOMBRIZ_2' : 'LOMBRIZ_1'); }
export function* pasoTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'PASO_AY'); return; }
  seen('caracol'); yield* G.say(null, 'PASO_1');
  const i = yield* G.choose('PASO_Q', ['5 AJOS · 12', 'RIEGO · 10', 'NADA']);
  if (i === 2) { yield* G.say(null, 'PASO_NO'); return; }
  yield* buy(i === 0 ? 'ajos' : 'riego', p, 'PASO');
}
// compras comunes a Chalota y a Don Paso
export function* buy(what, p, who) {
  const sv = G.save;
  if (what === 'riego') {
    if (p.layers >= p.maxLayers && !p.crack) { yield* G.say(null, who + '_LLENA'); return; }
    if (sv.tears < 10) { yield* G.say(null, who + '_POBRE'); return; }
    sv.tears -= 10; yield* G.say(null, who + '_SI');
    audio.sfx('splash'); fx.burst(P.drop, p.pos.x, p.pos.y + 1.6, p.pos.z, 22, { speed: 1.4, up: 1, g: 10, life: 0.8, size: 0.3, floor: p.pos.y });
    while (p.layers < p.maxLayers || p.crack) { p.heal(1); yield* wait(0.3); }
  } else {
    if ((sv.ajos || 0) >= 15) { yield* G.say(null, 'AJOS_LLENA'); return; }
    if (sv.tears < 12) { yield* G.say(null, who + '_POBRE'); return; }
    sv.tears -= 12; sv.ajos = Math.min(15, (sv.ajos || 0) + 5); audio.sfx('ammo'); UI.onAmmo(); p.sqV = 6; yield* G.say(null, who + '_SI');
  }
}

// ───────── la Raicera ─────────
export function* raiceraEnter(L, from) {
  if (!flag('raicera')) { flag('raicera', 1); G.lock++; yield* wait(0.5); yield* G.say('CANDELA', 'RAI_LLEGADA', { voice: 2.1 }); G.lock--; G.save.spawn = { level: 'raicera', at: 'rai0' }; writeSave(); }
  G.areaTitle(L.title, L.sub);
}
export function subeSavia(y) {
  const L = G.level;
  run(function* () {
    const p = G.player; yield* wait(0.4); G.lock++; G.cine = true; G.target = null;
    yield* G.cam.to(15.5, 6.5, -31, 23, -2, -31, 0.9, 46);
    audio.jingle('secret'); audio.sfx('secret'); yield* wait(0.6);
    audio.sfx('waterRise'); L.savia.on = true; L.savia.mesh.visible = true;
    for (const e of L.ents) if (e.enemy && !e.dead && e.pos.y < -1.5) e.die({});
    yield* tween(4.2, k => { L.savia.y = lerp(-3.05, -0.32, ease.io(k)); L.savia.mesh.position.y = L.savia.y; fx.shake(0.03, 0.1); if (rnd() < 0.7) fx.one(P.bubble, 18.5 + rnd() * 7.5, L.savia.y, -40 + rnd() * 18, { vy: 0.8, g: 0, life: 0.5, size: 0.3 }); });
    yield* wait(0.3); yield* G.say('CANDELA', 'RAI_SAVIA', { voice: 2.1 });
    G.cam.release(0.8); G.lock--; G.cine = false; writeSave();
  });
}
export function boss2Start(p) {
  const L = G.level, b = L.cavador; if (!b) return;
  run(function* () {
    cineOn(p); L.arenaBars.set(false); audio.music(null, { fade: 0.5 });
    yield* G.cam.to(0, 2.6, -50.5, 0, 1.2, -60, 1.2, 42);
    let e = 0; while (e < 1.5) { const dt = yield; e += dt; fx.shake(0.05 + e * 0.05, 0.1); if (rnd() < 0.6) fx.burst(P.stone, (rnd() - 0.5) * 3, 0.2, -60 + (rnd() - 0.5) * 3, 1, { speed: 2, up: 4, g: 12, life: 0.6, size: 0.3, floor: 0.04 }); if (Math.floor(e * 3) !== Math.floor((e - dt) * 3)) audio.sfx('burrow'); }
    b.depth = 0.9; b.rise(); yield* wait(1.3);
    yield* G.say('CANDELA', 'JEFE2_1', { voice: 2.1 });
    b.roar(); yield* wait(0.9);
    G.areaTitle('CAVADOR', 'ALACRÁN CEBOLLERO'); seen('cavador');
    G.boss = b; b.shown = true; b.start(); audio.music('boss2', { fade: 0.2 });
    cineOff(p, 0.9);
  });
}
export function afterBoss2Props(L, fresh = false) {
  const ch = L.add(new Chest(0, 0, -50.5, 0, 'capa', { big: true, key: 'cofreCapa2', hidden: fresh })); L.capaChest = ch;
  const beam = A.makeBeam(12, 1.0); beam.position.set(0, 0, -64.5); beam.material.uniforms.uHide.value = 0.5; L.group.add(beam); L.light(0, 2, -64.5, 6);
  L.add(new Paso(0, 0, -64.5, 'SUBIR', salidaRaicera, { sparks: true }));
}
function* salidaRaicera(p) {
  cineOn(p); audio.sfx('sprout'); audio.music(null, { fade: 1 }); p.faceOv = 'happy';
  const it = G.iris(true, 1.2); let e = 0;
  while (e < 1.6) { const dt = yield; e += dt; p.pos.y += dt * (1 + e * 3); p.vel.set(0, 0, 0); p.frozen = true; p.rollA = 0; p.yaw += dt * 8; if (e > 0.5) it.next(dt); }
  p.frozen = false; G.lock--; G.cine = false; p.faceOv = null;
  yield* G.goto('pulpa', 'raicera', { from: 'raicera', irisDone: true });
}
export function boss2End(L, b) {
  run(function* () {
    const p = G.player; flag('jefe2', 1); G.boss = null;
    yield* wait(1.2);
    cineOn(p); const dur = audio.jingle('victory'); p.faceOv = 'happy'; p.pose = { L: [-0.5, 1.05, 0.1], R: [0.5, 1.05, 0.1] };
    yield* G.cam.to(p.pos.x + Math.sin(p.yaw) * 3.4, p.pos.y + 1.2, p.pos.z + Math.cos(p.yaw) * 3.4, p.pos.x, p.pos.y + 0.7, p.pos.z, 0.6, 34);
    yield* wait(Math.min(3.2, dur - 0.6)); p.pose = null; p.faceOv = null;
    yield* G.say('CANDELA', 'JEFE2_FIN', { voice: 2.1 });
    afterBoss2Props(L, true);
    yield* G.cam.to(2.6, 2.6, -46.4, 0, 0.6, -50.5, 0.8, 38);
    L.capaChest.appear(); yield* wait(1.0);
    L.arenaBars.set(true);
    cineOff(p, 0.8); audio.music('calm', { fade: 1 }); writeSave();
  });
}

// ───────── final de la capa III: la Raíz Madre bebe y aparece Don Mildiu ─────────
function* ending2(L) {
  const p = G.player, c = G.candela;
  cineOn(p); p.yaw = 0; p.pos.set(-7.2, 0, -20); audio.music(null, { fade: 0.5 });
  G.cam.cut(-3.2, 2.4, 3.4, -6.6, 1.2, -12, 40);
  yield* wait(0.4); yield* walkTo(p, -7.2, -2.5, 6); yield* walkTo(p, 0, -1.6, 3); p.yaw = Math.PI;
  const npcs = L.ents.filter(e => e.talk);
  yield* G.cam.to(7, 4.2, 5, 0, 4, -10, 1.4, 46);
  // el moho de la raíz se deshace
  audio.sfx('moldDie'); let e = 0;
  while (e < 1.6) { const dt = yield; e += dt; const k = clamp(e / 1.6); for (const m of [L.rootMold, L.rootMold2]) if (m) { m.scale.set(1 - k * 0.3, Math.max(0.02, 1 - k), 1 - k * 0.3); } if (rnd() < 0.8) fx.burst(P.sqG, (rnd() - 0.5) * 5, rnd() * 4, -10 + (rnd() - 0.5) * 5, 2, { speed: 2, up: 2, g: 2, life: 0.9, size: 0.22 }); fx.shake(0.03, 0.1); }
  for (const m of [L.rootMold, L.rootMold2]) if (m) L.group.remove(m);
  // y el agua baja por ella hasta la poza
  audio.sfx('waterRise'); audio.music('calm', { fade: 1.5 }); L.poza.on = true; L.poza.mesh.visible = true; flag('raiz', 1);
  yield* tween(3.6, k => { L.poza.y = lerp(0.02, 0.34, ease.io(k)); L.poza.mesh.position.y = L.poza.y; for (let i = 0; i < 3; i++) { const a = rnd() * 6.28; fx.one(P.drop, Math.cos(a) * 1.9, 3 + rnd() * 9, -10 + Math.sin(a) * 1.9, { vy: -6, g: 10, life: 1, size: 0.26, floor: L.poza.y }); } if (rnd() < 0.3) fx.ring((rnd() - 0.5) * 8, L.poza.y, -10 + (rnd() - 0.5) * 8, { r0: 0.2, r1: 1.2, t: 0.6, c: 7, th: 0.1 }); if (rnd() < 0.06) for (const n of npcs) if (rnd() < 0.4) n.sqV = 7; });
  for (const n of npcs) { n.sqV = 9; n.cryT = 2.6; audio.sfx('worm', { pitch: n.voice }); }
  p.faceOv = 'happy'; yield* wait(1.2);
  G.cam.cut(L.anelida.pos.x - 3.2, 1.8, L.anelida.pos.z + 4.6, L.anelida.pos.x - 0.6, 1.3, L.anelida.pos.z, 36);
  G.speaker = L.anelida; yield* G.say(null, 'PUL_FIN_1'); G.speaker = null; p.faceOv = null;
  // ...y entonces, Don Mildiu
  audio.music(null, { fade: 0.4 }); yield* wait(0.6);
  const mx = 0, mz = 12; let dk = 0;
  const md = L.add(new NPC(mx, -3.6, mz, Math.PI, 'mildiu', null, { turns: false })); md.canInteract = false; md.targetable = false;
  G.cam.cut(4.2, 2.2, 3.6, mx, 1.6, mz, 40); audio.sfx('mildiu'); audio.music('mildiu', { fade: 0.3 });
  const dark0 = L.dark;
  yield* tween(1.6, k => { md.pos.y = lerp(-3.6, 0, ease.out(k)); md.sync(); L.dark = lerp(dark0, 0.75, k); G.applyEnv(L); fx.shake(0.04, 0.1); for (let i = 0; i < 2; i++) { const a = rnd() * 6.28; fx.one(rnd() < 0.5 ? P.sqG : P.dustD, mx + Math.cos(a) * 1.4, 0.1, mz + Math.sin(a) * 1.4, { vy: 1 + rnd() * 2, g: -0.4, life: 1, size: 0.3 }); } });
  seen('mildiu'); for (const n of npcs) { n.sqV = -8; n.cryT = 0; }
  p.yaw = 0; p.faceOv = 'wow'; c.goal = { x: 0.6, y: 1.6, z: 0 };
  G.speaker = md; yield* G.say(null, 'MILDIU_1');
  G.cam.cut(-2.4, 1.3, -4.6, 0, 0.8, -1.6, 34); p.faceOv = 'sad'; G.speaker = null;
  yield* G.say('CANDELA', 'MILDIU_C1', { voice: 2.1 });
  G.cam.cut(2.4, 1.6, 6.6, mx - 0.2, 1.9, mz, 30); G.speaker = md; md.sqV = 7; audio.sfx('mildiu', { pitch: 1.2 });
  yield* G.say(null, 'MILDIU_2');
  G.cam.cut(-1.6, 1.0, -3.6, 0, 0.7, -1.6, 30); p.faceOv = 'brave'; p.sqV = 8; G.speaker = null;
  yield* G.say('CANDELA', 'MILDIU_C2', { voice: 2.1 });
  // una nube: todos lloran, hasta él
  p.pose = { L: [-0.5, 0.9, 0.2], R: [0.5, 0.9, 0.2] }; yield* wait(0.3); audio.sfx('peel'); audio.sfx('gas'); G.gas(p.pos.x, p.pos.y + 0.3, p.pos.z, 15); fx.flash(7, 0.1); fx.shake(0.2, 0.3); p.pose = null;
  G.cam.cut(2.0, 1.9, 7.4, mx, 2.0, mz, 26); yield* wait(1.3); md.cryT = 4;
  G.speaker = md; yield* G.say(null, 'MILDIU_3');
  audio.sfx('mildiu', { pitch: 0.8 });
  yield* tween(1.3, k => { md.pos.y = lerp(0, -3.8, ease.in(k)); md.sync(); L.dark = lerp(0.75, dark0, k); G.applyEnv(L); for (let i = 0; i < 2; i++) { const a = rnd() * 6.28; fx.one(P.sqG, mx + Math.cos(a) * 1.3, 0.1, mz + Math.sin(a) * 1.3, { vy: 1 + rnd() * 2, g: -0.4, life: 1, size: 0.26 }); } });
  G.speaker = null; md.kill(); audio.music('calm', { fade: 1.2 }); c.goal = null;
  G.cam.cut(-2.6, 1.4, -5, 0, 0.9, -1.6, 34); p.faceOv = null;
  yield* G.say('CANDELA', 'PUL_FIN_2', { voice: 2.1 });
  // tarjeta final
  yield* G.cam.to(0, 14, 30, 0, 5, -10, 3.5, 44);
  yield* G.fade(1, 1.2, 0);
  let t0 = 0; UI.top = (t, dt) => { t0 += dt; t.textC(TXT.FIN2[0], W / 2, 52, 6); if (t0 > 0.8) t.textC(TXT.FIN2[1], W / 2, 68, 15, 3); if (t0 > 1.8) { t.textC(TXT.FIN2[2], W / 2, 102, 13); for (let i = 0; i < 3; i++) t.arc(W / 2, 200, 100 - i * 6, 101 - i * 6, -0.9, 0.9, [15, 14, 7][i]); } if (t0 > 3 && Math.floor(t0 * 2) % 2) t.textC('Pulsa Espacio', W / 2, 150, 6); };
  audio.jingle('capa3'); yield* wait(3);
  for (;;) { yield; if (G.input.hit('a') || G.input.hit('start')) break; }
  UI.top = null; flag('fin2', 1); G.save.spawn = { level: 'pulpa', at: 'pul0' }; writeSave();
  G.cam.yaw = Math.PI; cineOff(p, 0.01); p.faceOv = null;
  yield* G.fade(0, 0.8, 0);
  G.areaTitle(L.title, 'LA RAÍZ MADRE VUELVE A BEBER');
}
