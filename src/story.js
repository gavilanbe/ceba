// story.js — las escenas: despertar, el Consejo, brotar, bajar al pozo, las Plañideras, Tapona y el final de la capa I.
import { THREE } from './gfx.js';
import { G, flag, run, wait, tween, writeSave, seen } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent, Chest } from './ents.js';
import { UI } from './ui.js';
import { TXT } from './text.js';
import * as A from './art/props.js';
import { TI } from './art/tiles.js';
import { clamp, lerp, ease, textW } from './px.js';
import { W, H } from './gfx.js';

const cineOn = p => { G.lock++; G.cine = true; p.vel.set(0, 0, 0); p.set('cine'); p.m.draw(false); G.target = null; };
const cineOff = (p, t = 0.7) => { G.cam.release(t); p.set('free'); p.faceOv = null; p.pose = null; G.lock--; G.cine = false; };
function* walkTo(p, x, z, max = 3) { p.auto = { x, z, speed: 0.75 }; let e = 0; while (p.auto && e < max) e += yield; p.auto = null; p.vel.x = p.vel.z = 0; }

// ───────── Villa Ristra ─────────
export function* villaEnter(L, from, o = {}) {
  const p = G.player;
  if (!flag('intro')) { yield* wakeUp(L); return; }
  if (from === 'cisterna' && flag('jefe') && !flag('fin')) { yield* ending(L); return; }
  if (from === 'cisterna') yield* bucketUp(L);
  G.areaTitle(L.title, L.sub);
}
function* wakeUp(L) {
  const p = G.player, c = G.candela;
  cineOn(p); p.sink = 0.86; p.faceOv = 'sleep'; p.yaw = 0.5;
  c.show(true, -6, 4, 2); c.goal = { x: -6, y: 4, z: 2 };
  G.cam.cut(-13.2, 1.5, 13.6, -16, 0.45, 10, 30);
  yield* wait(0.3);
  let e = 0; while (e < 1.8) { e += yield; if (Math.floor(e * 1.6) !== Math.floor((e - 0.017) * 1.6)) fx.one(P.zz, -15.8, 0.8, 10, { vy: 0.7, vx: 0.3, g: 0, life: 1.2, size: 0.4, grow: 0.3 }); }
  c.goal = { x: -15.5, y: 1.25, z: 10.8 }; audio.sfx('firefly');
  yield* wait(1.0);
  yield* G.say('CANDELA', TXT.DESPIERTA.slice(0, 1), { voice: 2.1 });
  for (let i = 0; i < 3; i++) { p.sqV = 6; audio.sfx('root', { pitch: 1.3 + i * 0.2 }); fx.dust(p.pos.x, 0.05, p.pos.z, 3, { dark: true }); yield* wait(0.28); }
  p.sink = 0; p.vel.y = 7.2; p.onGround = false; p.sqV = 9; p.faceOv = 'wow'; audio.sfx('sprout');
  fx.burst(P.dustD, p.pos.x, 0.1, p.pos.z, 12, { speed: 2.6, up: 3, g: 8, life: 0.6, size: 0.34 }); fx.shake(0.08, 0.15);
  yield* G.cam.to(-12.4, 1.9, 14.2, -16, 0.8, 10, 0.5, 34);
  yield* wait(0.3); p.faceOv = null;
  yield* G.say('CANDELA', TXT.DESPIERTA.slice(1), { voice: 2.1 });
  c.goal = null; flag('intro', 1);
  G.cam.yaw = 0.9; cineOff(p, 0.9);
  G.areaTitle(L.title, L.sub); writeSave();
}
export function* consejoTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'CONSEJO_AY'); return; }
  if (flag('fin')) yield* G.say(null, 'CONSEJO_5');
  else if (flag('hoja')) { yield* G.say(null, 'CONSEJO_3'); G.hintOnce('cubo', 'H_CUBO'); }
  else if (flag('consejo')) yield* G.say(null, 'CONSEJO_2');
  else {
    G.cine = true; const cy = G.cam.yaw;
    G.cam.cut(n.pos.x + 2.6, n.pos.y + 1.5, n.pos.z + 4.6, n.pos.x - 0.2, n.pos.y + 1.0, n.pos.z, 34);
    yield* G.say(null, 'CONSEJO_1'); flag('consejo', 1); writeSave();
    G.cam.release(0.7); G.cine = false;
  }
}
export function* puerroTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'PUERRO_AY'); return; }
  if (flag('jefe')) yield* G.say(null, 'PUERRO_3');
  else if (flag('hoja')) { yield* G.say(null, 'PUERRO_2'); G.hintOnce('cubo', 'H_CUBO'); }
  else yield* G.say(null, 'PUERRO_1');
}
export function* chalotaTalk(n, p) {
  if (n.cryT > 0) { yield* G.say(null, 'CHALOTA_AY'); return; }
  yield* G.say(null, 'CHALOTA_1');
  const i = yield* G.choose('CHALOTA_Q', ['SÍ', 'NO']);
  if (i === 1) { yield* G.say(null, 'CHALOTA_NO'); return; }
  if (p.layers >= p.maxLayers && !p.crack) { yield* G.say(null, 'CHALOTA_LLENA'); return; }
  if (G.save.tears < 10) { yield* G.say(null, 'CHALOTA_POBRE'); return; }
  G.save.tears -= 10; yield* G.say(null, 'CHALOTA_SI');
  audio.sfx('splash'); fx.burst(P.drop, p.pos.x, p.pos.y + 1.6, p.pos.z, 22, { speed: 1.4, up: 1, g: 10, life: 0.8, size: 0.3, floor: p.pos.y });
  while (p.layers < p.maxLayers || p.crack) { p.heal(1); yield* wait(0.3); }
}
export function* pipoTalk(n, p) { yield* G.say(null, flag('lloro_pipo') ? 'PIPO_2' : 'PIPO_1'); }
export function* nitaTalk(n, p) { n.k = (n.k || 0) + 1; yield* G.say(null, flag('bichoRodado') ? (n.k % 2 ? 'NITA_2' : 'NITA_3') : 'NITA_1'); }

// el cubo del pozo: bajar a la cisterna
export class Cubo extends Ent {
  constructor(x, y, z, well) { super(x, y, z); this.well = well; this.label = 'BAJAR'; this.ir = 2.5; this.noFace = true; this.hh = 0.4; }
  interact(p) {
    const me = this, L = this.level;
    run(function* () {
      if (!flag('hoja')) { G.lock++; G.speaker = L.puerro; L.puerro.sqV = 7; yield* G.say(null, 'PUERRO_1'); G.speaker = null; G.lock--; return; }
      cineOn(p);
      yield* walkTo(p, 0, 2.3); p.yaw = Math.PI;
      G.cam.cut(4.6, 2.6, 5.4, 0, 1.2, 0, 36);
      audio.sfx('jump'); p.faceOv = 'brave';
      yield* tween(0.45, k => { p.pos.set(0, lerp(0, 1.15, k) + Math.sin(k * 3.14) * 1.3, lerp(2.3, 0, k)); p.onGround = false; p.vel.set(0, 0, 0); });
      p.sqV = -8; audio.sfx('land'); audio.sfx('bucket'); L.puerro.sqV = 6;
      p.set('cine'); p.frozen = true;
      audio.music(null, { fade: 1 });
      const it = G.iris(true, 1.3, W / 2, H / 2); let e = 0, irisOn = false;
      while (e < 2.1) { const dt = yield; e += dt; const y = 1.15 - ease.in(clamp(e / 2.1)) * 3.2; me.well.setBucket(y - 0.05); p.pos.set(0, y, 0); p.vel.set(0, 0, 0); if (e > 0.8) { irisOn = true; it.next(dt); } if (Math.floor(e * 3) !== Math.floor((e - dt) * 3)) audio.sfx('bucket', { pitch: 0.9 + rnd() * 0.2, vol: 0.6 }); }
      p.frozen = false; G.lock--; G.cine = false; p.faceOv = null;
      yield* G.goto('cisterna', 'entrada', { from: 'villa', irisDone: true });
    });
  }
}
// la cuerda en el brocal de la cisterna: volver arriba
export class Cuerda extends Ent {
  constructor(x, y, z) {
    super(x, y, z); const w = A.makeWell(); w.g.children[0].visible = false; this.w = w; this.obj = w.g; this.label = 'SUBIR'; this.ir = 1.6; this.noFace = true; this.hh = 0.5; this.sync(); this.setY(0.05);
  }
  setY(y) { this.w.bucket.position.y = y; this.w.rope.position.y = y + 0.5; this.w.rope.scale.y = 14; }
  onAdd(L) { this.sol = L.addSolid({ x0: -0.42, x1: 0.42, z0: -0.42, z1: 0.42, y0: 0, y1: 0.55, ent: this, noCam: true }); }
  interact(p) {
    const me = this;
    run(function* () {
      cineOn(p); yield* walkTo(p, 0, 1.3); p.yaw = Math.PI;
      audio.sfx('jump'); yield* tween(0.4, k => { p.pos.set(0, lerp(0, 0.45, k) + Math.sin(k * 3.14) * 1, lerp(1.3, 0, k)); p.vel.set(0, 0, 0); });
      p.frozen = true; audio.sfx('bucket'); audio.music(null, { fade: 1 });
      const it = G.iris(true, 1.2); let e = 0;
      while (e < 1.9) { const dt = yield; e += dt; const y = 0.45 + ease.in(clamp(e / 1.9)) * 7; me.setY(y - 0.4); p.pos.set(0, y, 0); p.vel.set(0, 0, 0); if (e > 0.7) it.next(dt); }
      p.frozen = false; G.lock--; G.cine = false;
      yield* G.goto('villa', 'pozo', { from: 'cisterna', irisDone: true });
    });
  }
}
function* bucketUp(L) {
  const p = G.player; cineOn(p); p.frozen = true; p.yaw = 0;
  G.cam.cut(4.6, 2.6, 5.4, 0, 1.2, 0, 36); audio.sfx('bucket');
  yield* tween(1.1, k => { const y = lerp(-2, 1.15, ease.out(k)); L.well.setBucket(y - 0.05); p.pos.set(0, y, 0); p.vel.set(0, 0, 0); });
  p.frozen = false; audio.sfx('jump');
  yield* tween(0.45, k => { p.pos.set(0, lerp(1.15, 0, k) + Math.sin(k * 3.14) * 1.1, lerp(0, 2.6, k)); p.vel.set(0, 0, 0); });
  p.sqV = -6; audio.sfx('land'); G.cam.yaw = 0; cineOff(p, 0.8);
}

// el Bancal Viejo: la primera vez, brota la Hoja
export function bancalViejo(b, p) {
  if (flag('hoja')) return true;
  run(function* () {
    const m = p.m, L = G.level;
    cineOn(p); yield* walkTo(p, b.pos.x, b.pos.z, 1.5); p.pos.x = b.pos.x; p.pos.z = b.pos.z; p.yaw = 0.5;
    audio.music(null, { fade: 0.6 });
    yield* G.cam.to(33.4, 4.3, -10.2, 30.5, 3.9, -13.5, 0.9, 36);
    audio.sfx('root'); p.faceOv = 'sleep';
    yield* tween(0.6, k => { p.sink = 0.42 * k; if (rnd() < 0.3) fx.dust(p.pos.x + (rnd() - 0.5), 3.25, p.pos.z + (rnd() - 0.5), 1, { dark: true }); });
    yield* G.say(null, 'BROTAR_1');
    const dur = audio.jingle('sprout');
    // el sol aprieta
    const camGo = G.cam.to(33.0, 4.4, -10.6, 30.5, 3.85, -13.5, dur * 0.8, 30);
    let e = 0, stage = 0;
    m.setHoja(true); const parts = [m.leaves[1].g, m.leaves[2].g, m.hojaBack]; for (const q of parts) q.scale.setScalar(0.001);
    const grow = [];
    while (e < dur) {
      const dt = yield; e += dt; camGo.next(dt);
      L.beam.material.uniforms.uHide.value = lerp(0.82, 0.6, clamp(e / (dur * 0.6)));
      if (rnd() < 0.5) fx.one(rnd() < 0.5 ? P.sqY : P.sqG, p.pos.x + (rnd() - 0.5) * 2.2, 3.3, p.pos.z + (rnd() - 0.5) * 2.2, { vy: 1.2 + rnd() * 1.5, g: -0.6, life: 1.1, size: 0.14 });
      p.sqV += Math.sin(e * 20) * 0.6 * clamp(e / dur);
      const marks = [dur * 0.42, dur * 0.55, dur * 0.68];
      if (stage < 3 && e > marks[stage]) { grow.push({ q: parts[stage], t: 0 }); audio.sfx('sprout', { pitch: 1 + stage * 0.25 }); p.sqV = 9; fx.burst(P.leaf, p.pos.x, p.pos.y + 1, p.pos.z, 5, { speed: 1.5, up: 3, g: 6, life: 0.6, size: 0.26 }); p.faceOv = stage === 2 ? 'wow' : 'effort'; stage++; }
      for (const g_ of grow) { g_.t += dt; g_.q.scale.setScalar(Math.max(0.001, ease.elastic(clamp(g_.t / 0.6)))); }
    }
    for (const q of parts) q.scale.setScalar(1);
    // ¡fuera!
    p.sink = 0; p.vel.y = 7; p.onGround = false; p.sqV = 9; audio.sfx('sprout'); fx.flash(7, 0.12); fx.shake(0.12, 0.2);
    fx.burst(P.dustD, p.pos.x, 3.3, p.pos.z, 12, { speed: 2.6, up: 3, g: 8, life: 0.6, size: 0.34 });
    yield* wait(0.55);
    m.draw(true); p.pose = { R: [0.5, 1.12, 0.2], L: [-0.6, 0.5, 0.1] }; p.faceOv = 'happy'; audio.sfx('swing3');
    fx.ring(p.pos.x, 3.25, p.pos.z, { r1: 3, t: 0.5, c: 11 }); fx.burst(P.star, p.pos.x, p.pos.y + 1.6, p.pos.z, 10, { speed: 2.5, up: 2, g: 3, life: 0.7, size: 0.4 });
    yield* wait(0.2);
    yield* G.giveItem('hoja');
    m.draw(false); L.beam.material.uniforms.uHide.value = 0.82;
    G.save.spawn = { level: 'villa', at: 'viejo' }; writeSave();
    cineOff(p, 0.9); audio.music('hill', { fade: 1 });
  });
  return false;
}

// ───────── la Cisterna ─────────
export function* cisternaEnter(L, from) {
  const p = G.player;
  if (from === 'villa') {
    cineOn(p); p.frozen = true; p.yaw = Math.PI;
    G.cam.cut(3.4, 2.2, 5.2, 0, 1.0, 0, 38); audio.sfx('bucket');
    yield* tween(1.5, k => { const y = lerp(8, 0.45, ease.out(k)); L.ropeEnt.setY(y - 0.4); p.pos.set(0, y, 0); p.vel.set(0, 0, 0); });
    L.ropeEnt.setY(0.05); p.frozen = false; audio.sfx('jump');
    yield* tween(0.4, k => { p.pos.set(0, lerp(0.45, 0, k) + Math.sin(k * 3.14) * 0.9, lerp(0, 1.5, k)); p.vel.set(0, 0, 0); });
    p.sqV = -6; audio.sfx('land');
    if (!flag('cisterna')) { flag('cisterna', 1); yield* G.say('CANDELA', 'CIS_LLEGADA', { voice: 2.1 }); G.save.spawn = { level: 'cisterna', at: 'cis0' }; writeSave(); }
    G.cam.yaw = 0; cineOff(p, 0.8);
  }
  G.areaTitle(L.title, L.sub);
}
export function planidera(st) {
  const L = G.level; seen('planidera'); L.light(st.pos.x, 0.5, st.pos.z, 7);
  if (!(L.stA.crying && L.stB.crying)) { G.hint('CIS_UNA', 3); return; }
  if (flag('agua')) return;
  flag('agua', 1);
  run(function* () {
    const p = G.player; yield* wait(0.5);
    G.lock++; G.cine = true; G.target = null;
    yield* G.cam.to(0, 6.5, -21.5, 0, -2.2, -36, 0.9, 44);
    audio.jingle('secret'); audio.sfx('secret'); yield* wait(0.7);
    audio.sfx('waterRise'); L.pool.on = true; L.pool.mesh.visible = true;
    if (flag('mondador') && p.pos.x > -9.2) L.r3bars.set(false);
    yield* tween(4.4, k => {
      L.pool.y = lerp(-3.05, -0.32, ease.io(k)); L.pool.mesh.position.y = L.pool.y;
      fx.shake(0.03, 0.1);
      if (rnd() < 0.7) fx.one(P.bubble, -8 + rnd() * 16, L.pool.y, -40 + rnd() * 11, { vy: 0.8, g: 0, life: 0.5, size: 0.3 });
      for (const s of [L.stA, L.stB]) if (rnd() < 0.5 && L.pool.y < -1.2) fx.burst(P.drop, s.pos.x + Math.sin(s.yaw) * 0.6, L.pool.y, s.pos.z + Math.cos(s.yaw) * 0.6, 1, { speed: 1, up: 2.5, life: 0.4, size: 0.24 });
    });
    yield* wait(0.4);
    yield* G.say('CANDELA', 'CIS_LLORAN', { voice: 2.1 });
    G.cam.release(0.8); G.lock--; G.cine = false; writeSave();
    G.hintOnce('flota', 'H_FLOTA');
  });
}
export function bossStart(p) {
  const L = G.level, b = L.tapona; if (!b) return;
  run(function* () {
    cineOn(p); L.arenaBars.set(false); audio.music(null, { fade: 0.5 });
    yield* G.cam.to(0, 2.4, -55.5, 0, 1.6, -65, 1.2, 40);
    yield* wait(0.5); b.wake(); yield* wait(1.3);
    yield* G.say('CANDELA', 'JEFE_1', { voice: 2.1 });
    b.roar(); yield* wait(0.9);
    G.areaTitle('TAPONA', 'BABOSA DE CISTERNA'); seen('tapona');
    G.boss = b; b.shown = true; b.start(); audio.music('boss', { fade: 0.2 });
    cineOff(p, 0.9);
  });
}
// atrezo del desagüe ya vencido
export function afterBossProps(L, fresh = false) {
  L.block(-0.9, 0, -66.9, 0.9, 0.08, -65.1, { top: TI.moho, noCol: true });
  const ch = L.add(new Chest(0, 0, -56.5, 0, 'capa', { big: true, key: 'cofreCapa', hidden: fresh })); L.capaChest = ch;
  const beam = A.makeBeam(12, 1.0); beam.position.set(0, 0, -69.5); beam.material.uniforms.uHide.value = 0.5; L.group.add(beam); L.light(0, 2, -69.5, 6);
  L.add(new Salida(0, 0, -69.5)); if (fresh) L.finishExtra && L.finishExtra();
}
class Salida extends Ent {
  constructor(x, y, z) { super(x, y, z); this.label = 'SUBIR'; this.ir = 1.5; this.noFace = true; this.hh = 0.6; }
  update(dt) { if (rnd() < 0.3) fx.one(P.sqY, this.pos.x + (rnd() - 0.5) * 1.6, this.pos.y + 0.1, this.pos.z + (rnd() - 0.5) * 1.6, { vy: 2 + rnd() * 2, g: -1, life: 1.2, size: 0.14 }); }
  interact(p) {
    run(function* () {
      cineOn(p); audio.sfx('sprout'); audio.music(null, { fade: 1 }); p.faceOv = 'happy';
      const it = G.iris(true, 1.2); let e = 0;
      while (e < 1.6) { const dt = yield; e += dt; p.pos.y += dt * (1 + e * 3); p.vel.set(0, 0, 0); p.frozen = true; p.rollA = 0; p.yaw += dt * 8; if (e > 0.5) it.next(dt); }
      p.frozen = false; G.lock--; G.cine = false; p.faceOv = null;
      yield* G.goto('villa', 'pozo', { from: 'cisterna', irisDone: true });
    });
  }
}
export function* bossEnd(L, b) {
  const p = G.player;
  flag('jefe', 1); G.boss = null;
  yield* wait(1.2);
  cineOn(p); const dur = audio.jingle('victory'); p.faceOv = 'happy'; p.pose = { L: [-0.5, 1.05, 0.1], R: [0.5, 1.05, 0.1] };
  yield* G.cam.to(p.pos.x + Math.sin(p.yaw) * 3.4, p.pos.y + 1.2, p.pos.z + Math.cos(p.yaw) * 3.4, p.pos.x, p.pos.y + 0.7, p.pos.z, 0.6, 34);
  yield* wait(Math.min(3.2, dur - 0.6)); p.pose = null; p.faceOv = null;
  // el desagüe se destapa
  yield* G.cam.to(0, 5, -57, 0, 0, -66, 1.0, 42);
  audio.sfx('waterRise'); let e = 0;
  while (e < 2.6) { const dt = yield; e += dt; fx.shake(0.04, 0.1); for (let i = 0; i < 2; i++) { const a = rnd() * 6.28, r = 3 * (1 - (e / 2.6) * 0.6) * rnd(); fx.one(P.drop, Math.cos(a + e * 3) * r, 0.1, -63 + Math.sin(a + e * 3) * r, { vy: 3 + rnd() * 3, g: 10, life: 0.6, size: 0.3 }); } if (rnd() < 0.3) fx.ring(0, 0.02, -63, { r0: 0.3, r1: 3, t: 0.6, c: 12, th: 0.2 }); }
  yield* G.say('CANDELA', TXT.JEFE_FIN.slice(0, 1), { voice: 2.1 });
  L.block; afterBossPropsLive(L);
  yield* G.cam.to(0, 1.6, -62.4, 0, 0.1, -66, 1.0, 30);
  fx.ring(0, 0.1, -66, { r1: 1.6, t: 0.8, c: 3 }); audio.sfx('slime');
  yield* wait(0.6);
  yield* G.say('CANDELA', TXT.JEFE_FIN.slice(1), { voice: 2.1 }); seen('mildiu');
  yield* G.cam.to(2.6, 2.6, -52.4, 0, 0.6, -56.5, 0.8, 38);
  L.capaChest.appear(); yield* wait(1.0);
  L.arenaBars.set(true);
  cineOff(p, 0.8); audio.music('calm', { fade: 1 }); writeSave();
}
// lo mismo que afterBossProps pero con el nivel ya montado (malla aparte para el sello)
function afterBossPropsLive(L) {
  const seal = A.tileBox(1.8, 0.08, 1.8, { all: TI.moho }).mesh(A.tileModelMat()); seal.position.set(0, 0, -66); L.group.add(seal);
  const ch = L.add(new Chest(0, 0, -56.5, 0, 'capa', { big: true, key: 'cofreCapa', hidden: true })); L.capaChest = ch;
  const beam = A.makeBeam(12, 1.0); beam.position.set(0, 0, -69.5); beam.material.uniforms.uHide.value = 0.5; L.group.add(beam); L.light(0, 2, -69.5, 6);
  L.add(new Salida(0, 0, -69.5));
}

// ───────── final de la capa I ─────────
function* ending(L) {
  const p = G.player, c = G.candela;
  cineOn(p); p.frozen = true; p.yaw = 0; p.pos.set(0, -2, 0);
  audio.music('calm', { fade: 0.5 });
  G.cam.cut(9, 6, 15, 0, 1, 2, 44);
  const npcs = L.ents.filter(e => e.talk);
  yield* wait(0.8);
  // el agua corre por el lagrimal
  let e = 0; while (e < 2.2) { const dt = yield; e += dt; for (let i = 0; i < 2; i++) fx.one(P.drop, (rnd() - 0.5) * 1.6, 0.1, 2 + rnd() * 14, { vy: 2 + rnd() * 2, g: 10, life: 0.5, size: 0.26 }); if (rnd() < 0.2) for (const n of npcs) if (rnd() < 0.3) n.sqV = 7; }
  audio.sfx('bucket');
  yield* tween(1.1, k => { const y = lerp(-2, 1.15, ease.out(k)); L.well.setBucket(y - 0.05); p.pos.set(0, y, 0); p.vel.set(0, 0, 0); });
  p.frozen = false; audio.sfx('jump');
  yield* tween(0.45, k => { p.pos.set(0, lerp(1.15, 0, k) + Math.sin(k * 3.14) * 1.1, lerp(0, 2.6, k)); p.vel.set(0, 0, 0); });
  p.sqV = -6; audio.sfx('land'); for (const n of npcs) { n.sqV = 9; audio.sfx('cry', { pitch: n.voice, vol: 0.5 }); n.cryT = 2.5; }
  p.faceOv = 'happy'; yield* wait(1.4);
  yield* walkTo(p, 0, -7.2, 4); p.yaw = Math.PI;
  const n = npcs.find(q => q.kind === 'ajo');
  G.cam.cut(n.pos.x + 3, n.pos.y + 1.7, n.pos.z + 5.6, n.pos.x - 0.3, n.pos.y + 0.9, n.pos.z + 1, 36);
  G.speaker = n; yield* G.say(null, 'CONSEJO_4'); G.speaker = null;
  // tarjeta final
  yield* G.cam.to(0, 16, 30, 0, 2, -4, 3.5, 40);
  yield* G.fade(1, 1.2, 0);
  let t0 = 0; UI.top = (t, dt) => { t0 += dt; const k = clamp(t0 / 1); t.textC(TXT.FIN[0], W / 2, 52, 6); if (t0 > 0.8) t.textC(TXT.FIN[1], W / 2, 68, 9, 3); if (t0 > 1.8) { t.textC(TXT.FIN[2], W / 2, 102, 13); for (let i = 0; i < 3; i++) t.arc(W / 2, 200, 100 - i * 6, 101 - i * 6, -0.9, 0.9, [9, 14, 7][i]); } if (t0 > 3 && Math.floor(t0 * 2) % 2) t.textC('Pulsa Espacio', W / 2, 150, 6); };
  audio.jingle('capa'); yield* wait(3);
  for (;;) { yield; if (G.input.hit('a') || G.input.hit('start')) break; }
  UI.top = null; flag('fin', 1); G.save.spawn = { level: 'villa', at: 'plaza' }; writeSave();
  G.cam.yaw = 0; cineOff(p, 0.01); p.faceOv = null;
  yield* G.fade(0, 0.8, 0);
  G.areaTitle(L.title, 'EL POZO VUELVE A LLORAR');
}
