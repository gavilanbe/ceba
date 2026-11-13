// ents2.js — capítulo II: el ajo bravo (bomba), la cerbatana, muros de moho y de grieta, brotes-diana, setas trampolín y pepitas de oro.
import { THREE, MB, mat } from './gfx.js';
import { G, flag, run, wait, writeSave } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent } from './ents.js';
import * as A from './art/props.js';
import * as Q from './art/pulpa.js';
import { TI, cell, tilesTex } from './art/tiles.js';
import { clamp, lerp, ease } from './px.js';

// ───────── la explosión: el ajo espanta al moho, revienta grietas y hace daño a todo lo que pilla ─────────
G.blast = (x, y, z, r = 2.7) => {
  const L = G.level, p = G.player;
  audio.sfx('boom'); fx.shake(0.32, 0.45); fx.stop(0.07); fx.flash(7, 0.1);
  fx.ring(x, y + 0.05, z, { r0: 0.4, r1: r * 1.25, t: 0.4, c: 7, th: 0.6 }); fx.ring(x, y + 0.05, z, { r0: 0.2, r1: r, t: 0.55, c: 10, th: 0.3 });
  fx.burst(P.dust, x, y + 0.3, z, 16, { speed: 4.5, up: 2.5, g: -0.6, drag: 2.4, life: 0.7, size: 0.8 });
  fx.burst(P.flake1, x, y + 0.4, z, 14, { speed: 5, up: 6, g: 12, life: 0.9, size: 0.34, floor: y + 0.04, bounce: 0.3 });
  fx.burst(P.spark, x, y + 0.5, z, 10, { speed: 6, up: 4, g: 8, life: 0.4, size: 0.5 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; fx.one(P.gas, x, y + 0.4, z, { vx: Math.cos(a) * 3.4, vz: Math.sin(a) * 3.4, vy: 1 + rnd(), drag: 2.4, g: -0.5, life: 0.7 + rnd() * 0.4, size: 0.7, grow: 0.5 }); }
  const light = L.light(x, y + 0.8, z, 9); run(function* () { let e = 0; while (e < 0.4) { e += yield; light.base = 9 * (1 - e / 0.4); } const i = L.lights.indexOf(light); if (i >= 0) L.lights.splice(i, 1); });
  for (const e of L.ents.slice()) {
    if (e.dead) continue;
    const dx = e.pos.x - x, dz = e.pos.z - z, d = Math.hypot(dx, dz);
    if (d > r + (e.br ?? e.r ?? 0.4) || Math.abs(e.pos.y - y) > 3.2 + (e.bh || 0)) continue;
    if (e.onBlast) e.onBlast({ x, y, z, d });
    else if (e.enemy && e.hit) e.hit({ dmg: 3, dx: dx / (d || 1), dz: dz / (d || 1), heavy: true, blast: true });
    else if (e.fragile && e.smash) e.smash();
    else if (e.cut) e.cut();
    else if (e.hit && e.targetable) e.hit({ dmg: 1, dx: dx / (d || 1), dz: dz / (d || 1), blast: true });
  }
  const pd = Math.hypot(p.pos.x - x, p.pos.z - z);
  if (pd < r * 0.8 && Math.abs(p.pos.y - y) < 2) p.hurt(1, x, z, { knock: 9 });
};

export class Bomb extends Ent {
  constructor(x, y, z) {
    super(x, y, z); this.m = Q.makeAjoBomba(); this.obj = this.m.g; this.vel = new THREE.Vector3(); this.fuse = 2.5; this.r = 0.34; this.hh = 0.3; this.onG = false; this.e = 0; this.spin = 0; this.fz = 0; this.sync();
    this.obj.scale.setScalar(0.01);
  }
  // un tajo de la Hoja la manda volando
  hit(o) { this.vel.set(o.dx * 9.5, 6, o.dz * 9.5); this.onG = false; audio.sfx('hit', { pitch: 1.5 }); fx.sparks(this.pos.x, this.pos.y + 0.3, this.pos.z, 3); this.fuse = Math.max(this.fuse, 0.9); return true; }
  onBlast() { if (this.fuse > 0.12) this.fuse = 0.12; }
  update(dt) {
    const L = this.level, p = G.player; this.e += dt; this.fuse -= dt;
    // rodar contra ella la patea
    const dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.6 + p.r && Math.abs(p.pos.y - this.pos.y) < 0.9 && this.e > 0.25 && (p.state === 'roll' || Math.hypot(p.vel.x, p.vel.z) > 3)) { const k = p.state === 'roll' ? 9 : 4.5; this.vel.x = dx / (d || 1) * k; this.vel.z = dz / (d || 1) * k; if (this.onG) this.vel.y = 3; }
    this.vel.y -= 22 * dt; this.pos.addScaledVector(this.vel, dt);
    const hits = L.collide(this.pos, this.r, 0.5);
    for (const h of hits) { const dot = this.vel.x * h.nx + this.vel.z * h.nz; if (dot < 0) { this.vel.x -= 1.6 * dot * h.nx; this.vel.z -= 1.6 * dot * h.nz; } }
    const g = L.ground(this.pos.x, this.pos.z, this.pos.y, 0.2);
    if (this.pos.y <= g.y) { this.pos.y = g.y; if (this.vel.y < -4) { this.vel.y *= -0.35; audio.sfx('land', { pitch: 1.6, vol: 0.4 }); } else this.vel.y = 0; this.onG = true; this.vel.x *= 1 - Math.min(1, 5 * dt); this.vel.z *= 1 - Math.min(1, 5 * dt); } else this.onG = false;
    const sp = Math.hypot(this.vel.x, this.vel.z); this.spin += sp * dt * 3; this.m.sq.rotation.x = this.onG ? Math.sin(this.spin) * 0.3 : this.spin;
    // la mecha: chispas, pitidos cada vez más seguidos y destellos
    const k = clamp(1 - this.fuse / 2.5), rate = 3 + k * 12; this.fz += dt * rate;
    if (this.fz >= 1) { this.fz = 0; audio.sfx('fuse', { pitch: 0.9 + k * 0.8, vol: 0.7 }); }
    const blink = Math.sin(this.fz * 6.283) > 0.2 ? 1 : 0; for (const m of this.m.mats) { m.uniforms.uFlash.value = blink * (0.25 + k * 0.6); m.uniforms.uFlashC.value = k > 0.7 ? 8 : 7; }
    if (rnd() < 0.6) fx.one(P.spark, this.pos.x, this.pos.y + 0.55, this.pos.z, { vx: (rnd() - 0.5) * 2, vz: (rnd() - 0.5) * 2, vy: 1.5 + rnd() * 2, g: 6, life: 0.25, size: 0.22 });
    const s = Math.min(1, this.e / 0.15) * (1 + Math.sin(this.fz * 6.283) * 0.06 * (1 + k * 2)); this.obj.scale.setScalar(Math.max(0.01, s * (1 + k * 0.25)));
    this.sync();
    if (this.pos.y < L.killY) { this.kill(); return; }
    if (this.fuse <= 0) { G.blast(this.pos.x, this.pos.y, this.pos.z); this.kill(); }
  }
}
G.spawnBomb = (x, y, z) => G.level.add(new Bomb(x, y, z));

// ───────── muro que solo cae con ajo: de moho (vivo, palpita) o de piedra agrietada ─────────
export class Breakable extends Ent {
  constructor(x, y, z, w, h, d, o = {}) {
    super(x, y, z); this.w = w; this.h = h; this.d = d; this.o = o; this.kind = o.kind || 'moho'; this.key = o.key; this.br = Math.max(w, d) / 2; this.bh = h;
    const ti = this.kind === 'moho' ? TI.mohoMuro : TI.grieta, b = new MB(), c = cell(ti);
    const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
    b.quadT([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], c, w, d);
    b.quadT([x0, h, z1], [x0, 0, z1], [x1, 0, z1], [x1, h, z1], c, w, h); b.quadT([x1, h, z0], [x1, 0, z0], [x0, 0, z0], [x0, h, z0], c, w, h);
    b.quadT([x1, h, z1], [x1, 0, z1], [x1, 0, z0], [x1, h, z0], c, d, h); b.quadT([x0, h, z0], [x0, 0, z0], [x0, 0, z1], [x0, h, z1], c, d, h);
    this.m = mat(tilesTex(), { tiled: true, cut: !!o.cut }); this.obj = b.mesh(this.m); this.sync(); this.hh = Math.min(1, h / 2); this.gone = 0;
  }
  onAdd(L) { this.solid = L.addSolid({ x0: this.pos.x - this.w / 2, x1: this.pos.x + this.w / 2, z0: this.pos.z - this.d / 2, z1: this.pos.z + this.d / 2, y0: this.pos.y, y1: this.pos.y + this.h, ent: this, noClimb: this.h > 0.4, mat: 'stone', noCam: this.o.noCam }); }
  hit() {
    if (this.gone) return false; this.wob = 0.3;
    if (this.kind === 'moho') { audio.sfx('spore'); fx.burst(P.sqG, this.pos.x, this.pos.y + Math.min(1.2, this.h * 0.5), this.pos.z, 6, { speed: 1.6, up: 1.5, g: 1, life: 0.6, size: 0.18, spread: this.br * 0.6 }); G.hintOnce('moho', 'H_MOHO'); }
    else { audio.sfx('bounce', { pitch: 0.7 }); G.hintOnce('grietaMuro', 'H_GRIETAMURO'); }
    return 'bounce';
  }
  onBlast() {
    if (this.gone) return; this.gone = 0.001; this.solid.off = true; if (this.key) { flag(this.key, 1); writeSave(); }
    const p = this.pos, n = Math.round(10 + this.w * this.h * 1.5);
    if (this.kind === 'moho') { audio.sfx('moldDie'); fx.burst(P.sqG, p.x, p.y + this.h * 0.5, p.z, n, { speed: 3, up: 3, g: 3, life: 1, size: 0.26, spread: this.br, h: this.h * 0.5 }); fx.burst(P.dustD, p.x, p.y + this.h * 0.4, p.z, n, { speed: 2.4, up: 1.5, g: -1, life: 0.9, size: 0.7, spread: this.br * 0.8, h: this.h * 0.5 }); }
    else { audio.sfx('crumble'); fx.burst(P.stone, p.x, p.y + this.h * 0.5, p.z, n, { speed: 4, up: 5, g: 14, life: 1, size: 0.44, spread: this.br * 0.7, h: this.h * 0.5, floor: p.y + 0.04, bounce: 0.3 }); fx.burst(P.dust, p.x, p.y + this.h * 0.4, p.z, n, { speed: 2.4, up: 1.2, g: -1, life: 0.9, size: 0.8, spread: this.br * 0.8 }); }
    if (this.o.onBreak) this.o.onBreak(this);
  }
  update(dt) {
    this.t += dt;
    if (this.gone) { this.gone += dt; this.m.uniforms.uHide.value = clamp(this.gone / 0.5); this.obj.scale.y = Math.max(0.05, 1 - this.gone * 1.4); if (this.gone > 0.55) this.kill(); return; }
    if (this.kind === 'moho') { const k = 1 + Math.sin(this.t * 2.2) * 0.012; this.obj.scale.set(k, 1 + Math.sin(this.t * 2.2 + 1) * 0.015, k); if (this.near(12) && rnd() < 0.05) fx.one(P.sqG, this.pos.x + (rnd() - 0.5) * this.w, this.pos.y + rnd() * this.h, this.pos.z + (rnd() - 0.5) * this.d, { vy: 0.4, g: -0.2, life: 1.2, size: 0.12, wob: 0.5 }); }
    if (this.wob > 0) { this.wob -= dt; this.obj.position.x = this.pos.x + Math.sin(this.wob * 60) * this.wob * 0.12; }
  }
}

// ───────── brote-diana: se abre de un pepitazo ─────────
export class Yema extends Ent {
  constructor(x, y, z, yaw = 0, o = {}) {
    super(x, y, z); this.m = Q.makeYema(); this.o = o; this.yaw = yaw; this.on = false; this.targetable = true; this.shootable = true; this.wallM = !!o.wall; this.sph = 0.62;
    const g = new THREE.Group(); g.add(this.m.g); this.obj = g; this.s = o.s || 1; this.m.g.scale.setScalar(this.s);
    if (this.wallM) { g.rotation.order = 'YXZ'; g.rotation.y = yaw; this.m.g.rotation.x = Math.PI / 2 - 0.35; this.aimY = 0.2 * this.s; this.ax = Math.sin(yaw) * 0.6 * this.s; this.az = Math.cos(yaw) * 0.6 * this.s; this.hh = 0.1; }
    else { this.aimY = 0.8 * this.s; this.ax = this.az = 0; this.hh = 0.5 * this.s; }
    this.sync(); this.k = 0; this.timer = 0;
    if (o.key && flag(o.key)) this.set(true, true);
  }
  get aim() { return [this.pos.x + this.ax, this.pos.y + this.aimY, this.pos.z + this.az]; }
  onAdd(L) { if (!this.wallM) L.addSolid({ x0: this.pos.x - 0.15, x1: this.pos.x + 0.15, z0: this.pos.z - 0.15, z1: this.pos.z + 0.15, y0: this.pos.y, y1: this.pos.y + 0.6, ent: this, noClimb: true, noCam: true }); }
  set(on, quiet) {
    if (on === this.on) return; this.on = on; this.m.bud.visible = !on; this.m.flower.visible = on; this.targetable = !on;
    const [ax, ay, az] = this.aim;
    if (on) { if (!this.light && this.level) this.light = this.level.light(ax, ay, az, 5, { flick: 0.3 }); if (this.o.key) flag(this.o.key, 1); if (this.o.timed) this.timer = this.o.timed; }
    else if (this.light) { const i = this.level.lights.indexOf(this.light); if (i >= 0) this.level.lights.splice(i, 1); this.light = null; }
    if (!quiet) {
      this.k = 0; audio.sfx(on ? 'budOn' : 'plateOff'); if (G.target === this) G.target = null;
      if (on) { fx.burst(P.sqP, ax, ay, az, 10, { speed: 2.4, up: 2, g: 3, life: 0.7, size: 0.2 }); fx.burst(P.star, ax, ay, az, 5, { speed: 2, up: 2, g: 3, life: 0.5, size: 0.4 }); fx.ring(ax, ay, az, { r0: 0.2, r1: 1.6, t: 0.4, c: 14, th: 0.25, vert: this.wallM }); }
      if (on && this.o.onOn) this.o.onOn(this); if (!on && this.o.onOff) this.o.onOff(this);
    }
  }
  shot() { if (this.on) return false; this.set(true); return true; }
  hit() { if (this.on) return false; this.set(true); return true; }
  update(dt) {
    this.t += dt; if (!this.light && this.on && this.level) { const [ax, ay, az] = this.aim; this.light = this.level.light(ax, ay, az, 5, { flick: 0.3 }); }
    this.k = Math.min(1, this.k + dt * 3); const e = ease.elastic(this.k);
    if (this.on) { this.m.flower.scale.setScalar(Math.max(0.01, e)); this.m.flower.rotation.y += dt * 0.6; }
    else { const b = 1 + Math.sin(this.t * 3) * 0.05; this.m.bud.scale.set(b, 2 - b, b); }
    if (this.on && this.timer > 0) { this.timer -= dt; const tk = this.timer < 2.5 ? 6 : 2; if (Math.floor(this.timer * tk) !== Math.floor((this.timer + dt) * tk)) audio.sfx('blip', { pitch: this.timer < 2.5 ? 1.6 : 1.1, vol: 0.6 }); if (this.timer <= 0) this.set(false); }
  }
}

// ───────── pepitazo de la cerbatana ─────────
const _d = new THREE.Vector3();
export class SeedShot extends Ent {
  constructor(x, y, z, dir) { super(x, y, z); this.obj = Q.makeSeed(); this.vel = dir.clone().multiplyScalar(26); this.life = 1.1; this.sync(); this.obj.scale.setScalar(1.5); }
  update(dt) {
    const L = this.level; this.life -= dt; this.vel.y -= 2.5 * dt;
    for (let it = 0; it < 3; it++) {
      this.pos.addScaledVector(this.vel, dt / 3);
      const x = this.pos.x, y = this.pos.y, z = this.pos.z;
      for (const e of L.ents) {
        if (e.dead || e === this) continue;
        if (e.shootable) { const a = e.aim || [e.pos.x, e.pos.y + (e.hh || 0.5), e.pos.z]; if (Math.hypot(a[0] - x, a[1] - y, a[2] - z) < (e.sph || 0.6)) { const r = e.shot(this); this.pop(r !== false); return; } }
        else if (e.enemy && e.hit) { const hy = e.pos.y + (e.hh || 0.4); if (Math.hypot(e.pos.x - x, e.pos.z - z) < (e.r || 0.4) + 0.2 && Math.abs(hy - y) < (e.hh || 0.4) + 0.5) { const s = Math.hypot(this.vel.x, this.vel.z) || 1; const r = e.hit({ dmg: 1, dx: this.vel.x / s, dz: this.vel.z / s, seed: true, x, y, z }); this.pop(r && r !== 'bounce', r === 'bounce'); return; } }
        else if (e.fragile && Math.hypot(e.pos.x - x, e.pos.z - z) < 0.45 && y > e.pos.y && y < e.pos.y + 0.9) { e.smash(); this.pop(true); return; }
      }
      for (const s of L.solids) { if (s.off || s.seeThru) continue; if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < L.topOf(s, x, z)) { if (s.ent && s.ent.onSeed) s.ent.onSeed(this); this.pop(false, true); return; } }
    }
    if (rnd() < 0.7) fx.one(P.sqW, this.pos.x, this.pos.y, this.pos.z, { life: 0.16, size: 0.12 });
    this.sync(); _d.copy(this.vel).normalize(); this.obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _d);
    if (this.life <= 0 || this.pos.y < L.killY) this.kill();
  }
  pop(good, clink) {
    const p = this.pos; if (clink || !good) { audio.sfx('seedHit', { pitch: 0.9 + rnd() * 0.3 }); fx.sparks(p.x, p.y, p.z, 3, { size: 0.26 }); } else fx.burst(P.star, p.x, p.y, p.z, 4, { speed: 2, up: 2, g: 4, life: 0.3, size: 0.34 });
    this.kill();
  }
}
// dispara desde la boca de Ceba hacia donde apunte: el objetivo fijado, lo que haya delante o recto
G.shootSeed = (p) => {
  const L = G.level, ox = p.pos.x + Math.sin(p.yaw) * 0.5, oy = p.pos.y + p.h * 0.62, oz = p.pos.z + Math.cos(p.yaw) * 0.5;
  let best = null, bs = 1e9;
  const cand = e => { if (e.dead || !(e.shootable ? e.targetable : e.enemy)) return; const a = e.aim || [e.pos.x, e.pos.y + (e.hh || 0.4), e.pos.z]; const dx = a[0] - ox, dz = a[2] - oz, d = Math.hypot(dx, dz); if (d > 20 || d < 0.3) return; let da = Math.atan2(dx, dz) - p.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > 0.5) return; const s = Math.abs(da) * 12 + d * 0.12 - (e.shootable ? 3 : 0); if (s < bs) { bs = s; best = a; } };
  if (G.target && !G.target.dead) { const e = G.target; best = e.aim || [e.pos.x, e.pos.y + (e.hh || 0.4), e.pos.z]; } else for (const e of L.ents) cand(e);
  const dir = new THREE.Vector3(Math.sin(p.yaw), 0.02, Math.cos(p.yaw));
  if (best) { const d = Math.hypot(best[0] - ox, best[2] - oz); dir.set(best[0] - ox, best[1] - oy + d * d * 0.0019, best[2] - oz).normalize(); p.yaw = Math.atan2(dir.x, dir.z); }
  L.add(new SeedShot(ox, oy, oz, dir)); audio.sfx('blow');
  fx.burst(P.dust, ox, oy, oz, 3, { speed: 0.8, up: 0.3, g: -0.4, life: 0.25, size: 0.22 });
};

// ───────── pepita de oro: coleccionable ─────────
export class Pepita extends Ent {
  constructor(x, y, z, key, o = {}) { super(x, y, z); this.m = Q.makePepita(); this.obj = this.m.g; this.key = key; this.hiddenT = !!o.hidden; this.obj.visible = !this.hiddenT; this.vel = null; this.base = y; this.sync(); this.r = 0.4; }
  appear(x, y, z) { if (!this.hiddenT) return; this.hiddenT = false; this.obj.visible = true; if (x != null) this.pos.set(x, y, z); this.vel = new THREE.Vector3((rnd() - 0.5) * 2, 6, (rnd() - 0.5) * 2); audio.sfx('secret'); fx.burst(P.star, this.pos.x, this.pos.y, this.pos.z, 8, { speed: 2.5, up: 3, g: 4, life: 0.6, size: 0.4 }); }
  onAdd(L) { this.light = L.light(this.pos.x, this.pos.y + 0.5, this.pos.z, this.hiddenT ? 0 : 3.2, { flick: 0.4 }); }
  update(dt) {
    if (this.hiddenT) return; this.t += dt; const p = G.player;
    if (this.vel) { this.vel.y -= 16 * dt; this.pos.addScaledVector(this.vel, dt); const g = this.level.ground(this.pos.x, this.pos.z, this.pos.y + 0.3, 0.1); if (this.pos.y <= g.y + 0.3) { this.pos.y = g.y + 0.3; this.base = this.pos.y; this.vel = null; } }
    this.light.x = this.pos.x; this.light.y = this.pos.y + 0.5; this.light.z = this.pos.z; this.light.base = 3.2;
    this.obj.position.set(this.pos.x, this.pos.y + (this.vel ? 0 : 0.15 + Math.sin(this.t * 3) * 0.1), this.pos.z); this.m.me.rotation.y = this.t * 3; this.m.sh.position.y = -0.4;
    if (rnd() < 0.12) fx.one(P.sqY, this.pos.x + (rnd() - 0.5) * 0.6, this.pos.y + rnd() * 0.6, this.pos.z + (rnd() - 0.5) * 0.6, { vy: 0.7, g: -0.3, life: 0.6, size: 0.12 });
    if (!this.vel && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < 0.75 + p.r && Math.abs(p.pos.y + 0.4 - this.pos.y) < 1.3 && G.lock <= 0) {
      flag(this.key, 1); flag('pepita', 1); G.save.pepitas = (G.save.pepitas || 0) + 1; writeSave(); audio.jingle('seed'); p.sqV = 8; p.face('happy', 1);
      fx.burst(P.star, this.pos.x, this.pos.y + 0.3, this.pos.z, 14, { speed: 3, up: 3.5, g: 5, life: 0.7, size: 0.42 }); fx.ring(p.pos.x, p.groundY, p.pos.z, { r1: 2.4, t: 0.5, c: 10, th: 0.25 }); fx.flash(10, 0.06);
      G.toast(`Pepita de oro · ${G.save.pepitas}`, 'pepita'); G.hintOnce('pepita', 'H_PEPITA');
      const i = this.level.lights.indexOf(this.light); if (i >= 0) this.level.lights.splice(i, 1); this.kill();
    }
  }
}

// ───────── seta trampolín ─────────
export class Seta extends Ent {
  constructor(x, y, z, o = {}) { super(x, y, z); this.s = o.s || 1; this.m = Q.makeSeta(this.s); this.obj = this.m.g; this.power = o.power || 13.6; this.sq = 0; this.sqV = 0; this.sync(); this.hh = 0.5; this.cd = 0; }
  onAdd(L) { const w = 1.5 * this.s; L.addSolid({ x0: this.pos.x - w / 2, x1: this.pos.x + w / 2, z0: this.pos.z - w / 2, z1: this.pos.z + w / 2, y0: this.pos.y, y1: this.pos.y + 1.0 * this.s, ent: this, mat: 'grass', noCam: true }); L.light(this.pos.x, this.pos.y + 1.6 * this.s, this.pos.z, 4.2 * this.s); }
  onStand(p) {
    if (this.cd > 0 || p.state === 'dead' || p.state === 'cine') return; this.cd = 0.25;
    p.vel.y = this.power * (p.state === 'roll' ? 1.08 : 1); p.onGround = false; p.sqV = 10; p.airT = 0; if (p.state === 'roll') p.set('free');
    this.sqV = -14; audio.sfx('jump', { pitch: 0.6 }); audio.sfx('bounce', { pitch: 0.8, vol: 0.7 }); fx.ring(this.pos.x, this.pos.y + this.s, this.pos.z, { r0: 0.4, r1: 1.8, t: 0.3, c: 7, th: 0.2 }); fx.dust(this.pos.x, this.pos.y + this.s, this.pos.z, 5, { speed: 1.6 });
    G.hintOnce('seta', 'H_SETA');
  }
  hit() { this.sqV = -6; audio.sfx('bounce', { pitch: 0.9, vol: 0.5 }); return 'bounce'; }
  update(dt) { this.cd -= dt; this.sqV += (0 - this.sq) * 260 * dt; this.sqV *= Math.max(0, 1 - 9 * dt); this.sq = clamp(this.sq + this.sqV * dt * 0.1, -0.5, 0.4); const sy = 1 + this.sq; this.m.cap.scale.set(1 - this.sq * 0.4, sy, 1 - this.sq * 0.4); this.m.cap.position.y = 0.6 * this.s * (1 + this.sq * 0.5); }
}

// decorado con colisión cilíndrica aproximada (columnas de raíz, setas de luz)
export class Deco extends Ent {
  constructor(obj, x, y, z, w = 0, h = 2, o = {}) { super(x, y, z); this.obj = obj; this.w = w; this.h = h; this.o = o; if (o.yaw) obj.rotation.y = o.yaw; this.sync(); }
  onAdd(L) { if (this.w) L.addSolid({ x0: this.pos.x - this.w / 2, x1: this.pos.x + this.w / 2, z0: this.pos.z - this.w / 2, z1: this.pos.z + this.w / 2, y0: this.pos.y, y1: this.pos.y + this.h, ent: this, noClimb: true, mat: 'stone', noCam: this.o.noCam }); if (this.o.light) L.light(this.pos.x, this.pos.y + (this.o.ly || 1), this.pos.z, this.o.light, { flick: 0.25 }); }
  update(dt) { if (this.o.tick) this.o.tick(this, dt); }
}

// ───────── el zarcillo: látigo que se agarra a los ganchos y tira de Ceba; trae botín, tumba gorgojos y da un tirón a las plagas ─────────
export class Gancho extends Ent {
  constructor(x, y, z, o = {}) { super(x, y, z); this.m = Q.makeGancho(); this.obj = this.m.g; this.hook = true; this.o = o; this.hh = 1.3; this.k = 0; this.sync(); }
  get aim() { return [this.pos.x, this.pos.y + 1.3, this.pos.z]; }
  onAdd(L) { L.addSolid({ x0: this.pos.x - 0.14, x1: this.pos.x + 0.14, z0: this.pos.z - 0.14, z1: this.pos.z + 0.14, y0: this.pos.y, y1: this.pos.y + 1.2, ent: this, noClimb: true, noCam: true, seeThru: true }); L.light(this.pos.x, this.pos.y + 1.5, this.pos.z, 2.6, { flick: 0.2 }); }
  update(dt) {
    this.t += dt; const has = G.save.items.zarcillo, p = G.player;
    // si Ceba lo tiene a tiro, la argolla se anima para que se vea que se puede
    const inR = has && this.dist() < 12 && !p.busy && G.whipTarget(p, true) === this;
    this.k = lerp(this.k, inR ? 1 : 0, Math.min(1, 8 * dt));
    this.m.ring.rotation.y = this.t * (0.8 + this.k * 4); this.m.ring.scale.setScalar(1 + this.k * (0.25 + Math.sin(this.t * 10) * 0.08));
    this.m.mats[1].uniforms.uFlash.value = this.k * (0.35 + Math.sin(this.t * 10) * 0.2); this.m.mats[1].uniforms.uFlashC.value = 7;
    if (inR && rnd() < 0.25) fx.one(P.sqY, this.pos.x + (rnd() - 0.5) * 0.5, this.pos.y + 1.3 + (rnd() - 0.5) * 0.5, this.pos.z + (rnd() - 0.5) * 0.5, { vy: 0.6, g: -0.2, life: 0.4, size: 0.12 });
    if (!has && this.near(3.2)) G.hintOnce('gancho', 'H_GANCHO');
  }
}
const WHIP_HOOK = 10.5, WHIP_HIT = 6;
const whipOrigin = p => [p.pos.x + Math.sin(p.yaw) * 0.45, p.pos.y + p.h * 0.6, p.pos.z + Math.cos(p.yaw) * 0.45];
// ¿hay algo macizo entre a y b? (se salta lo que deja ver)
const blocked = (L, a, b, skip, tail = 0) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.ceil(len / 0.3), m = Math.floor(n * Math.max(0.3, 1 - tail / (len || 1)));
  for (let i = 1; i < m; i++) { const k = i / n, x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k), z = lerp(a[2], b[2], k); for (const s of L.solids) { if (s.off || s.seeThru || s.ent === skip) continue; if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < L.topOf(s, x, z)) return [x, y, z]; } }
  return null;
};
// a qué se agarraría el zarcillo ahora mismo: gancho, plaga, botín o tinaja
G.whipTarget = (p, hooksOnly) => {
  const L = G.level, o = whipOrigin(p); let best = null, bs = 1e9;
  for (const e of L.ents) {
    if (e.dead) continue;
    const kind = e.hook ? 'hook' : hooksOnly ? null : (e.enemy && e.hit) ? 'foe' : (e.take && e.wants) ? 'pick' : e.fragile ? 'pot' : null;
    if (!kind) continue;
    const a = e.aim || [e.pos.x, e.pos.y + (e.hh || 0.3), e.pos.z], dx = a[0] - o[0], dz = a[2] - o[2], d = Math.hypot(dx, dz), dy = a[1] - o[1];
    if (d < 0.5 || d > (kind === 'hook' ? WHIP_HOOK : WHIP_HIT) || dy > 7.5 || dy < -4) continue;
    let da = Math.atan2(dx, dz) - p.yaw; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    const locked = G.target === e;
    if (!locked && da > (kind === 'hook' ? 0.75 : 0.6)) continue;
    if (blocked(L, o, a, e, kind === 'hook' ? 2.2 : 0)) continue;
    const s = da * 8 + d * 0.15 - (kind === 'hook' ? 4 : kind === 'foe' ? 1.5 : 0) - (locked ? 20 : 0);
    if (s < bs) { bs = s; best = e; best._wk = kind; }
  }
  return best;
};
const _up = new THREE.Vector3(0, 1, 0), _w = new THREE.Vector3();
export class Whip extends Ent {
  constructor(p) {
    super(p.pos.x, p.pos.y, p.pos.z); this.p = p; this.m = Q.makeTendril(); this.obj = this.m.g; this.ph = 'out'; this.k = 0;
    const L = G.level, o = whipOrigin(p), e = G.whipTarget(p); this.e = e; this.kind = e ? e._wk : 'miss';
    if (e) { this.end = (e.aim || [e.pos.x, e.pos.y + (e.hh || 0.3), e.pos.z]).slice(); p.yaw = Math.atan2(this.end[0] - o[0], this.end[2] - o[2]); }
    else { const far = [o[0] + Math.sin(p.yaw) * 5, o[1] + 0.1, o[2] + Math.cos(p.yaw) * 5], hit = blocked(L, o, far); this.end = hit || far; this.wall = !!hit; }
    this.len = Math.hypot(this.end[0] - o[0], this.end[1] - o[1], this.end[2] - o[2]); this.tip = o.slice(); this.draw();
  }
  draw() {
    const o = whipOrigin(this.p), t = this.tip; _w.set(t[0] - o[0], t[1] - o[1], t[2] - o[2]); const l = _w.length() || 0.01;
    this.obj.position.set(o[0], o[1], o[2]); this.obj.quaternion.setFromUnitVectors(_up, _w.multiplyScalar(1 / l));
    this.m.stem.scale.set(1, l, 1); this.m.tip.position.y = l; this.m.tip.rotation.y += 0.5;
  }
  done() { if (this.p.state === 'whip') this.p.set('free'); this.p.whipCd = 0.18; this.kill(); }
  update(dt) {
    const p = this.p, L = this.level, o = whipOrigin(p), e = this.e;
    if (p.state !== 'whip' && p.state !== 'hook') { this.kill(); return; }
    if (this.ph === 'out') {
      this.k = Math.min(1, this.k + dt * 34 / Math.max(2, this.len)); const q = ease.out3 ? ease.out3(this.k) : this.k;
      for (let i = 0; i < 3; i++) this.tip[i] = lerp(o[i], this.end[i], q);
      // serpentea un poco mientras sale
      this.tip[1] += Math.sin(this.k * 9) * 0.18 * (1 - this.k);
      if (this.k >= 1) this.arrive();
    } else if (this.ph === 'hold') {
      this.k -= dt; for (let i = 0; i < 3; i++) this.tip[i] = this.end[i]; if (this.k <= 0) { if (this.kind === 'hook') this.startPull(); else { this.ph = 'back'; this.k = 1; } }
    } else if (this.ph === 'pull') {
      // Ceba vuela hacia el gancho: sube deprisa y entra por encima del borde
      const f = this.f; f.t += dt / f.T; const k = clamp(f.t), ek = k * k * (3 - 2 * k);
      p.pos.x = lerp(f.x0, f.x1, ek); p.pos.z = lerp(f.z0, f.z1, ek); p.pos.y = lerp(f.y0, f.y1 + 0.6, Math.min(1, ek * 1.6)) - (ek > 0.8 ? (ek - 0.8) / 0.2 * 0.45 : 0);
      p.vel.set(0, 0, 0); p.rollA += dt * 14; for (let i = 0; i < 3; i++) this.tip[i] = this.end[i];
      if (rnd() < 0.6) fx.one(P.sqG, p.pos.x, p.pos.y + 0.4, p.pos.z, { life: 0.3, size: 0.16 });
      if (k >= 1) { p.set('free'); p.vel.set(Math.sin(p.yaw) * 1.5, 2.5, Math.cos(p.yaw) * 1.5); p.onGround = false; p.sqV = 6; p.inv = Math.max(p.inv, 0.2); p.whipCd = 0.2; audio.sfx('land', { pitch: 1.3, vol: 0.6 }); this.kill(); return; }
    } else {
      this.k -= dt * 5.5; const q = Math.max(0, this.k);
      for (let i = 0; i < 3; i++) this.tip[i] = lerp(o[i], this.end[i], q);
      if (this.carry && !this.carry.dead) { this.carry.pos.set(this.tip[0], this.tip[1] - 0.2, this.tip[2]); this.carry.rest = true; this.carry.hover = this.carry.pos.y; this.carry.grace = 0; if (this.carry.life < 6) this.carry.life = 6; }
      if (this.k <= 0) { this.done(); return; }
    }
    this.draw();
  }
  arrive() {
    const e = this.e, p = this.p, [x, y, z] = this.end;
    if (this.kind === 'hook') { this.ph = 'hold'; this.k = 0.09; audio.sfx('keyGet', { pitch: 1.5, vol: 0.7 }); audio.sfx('seedHit', { pitch: 0.7 }); fx.sparks(x, y, z, 5); fx.ring(x, y, z, { r0: 0.1, r1: 0.9, t: 0.25, c: 10, th: 0.2, vert: true }); fx.stop(0.04); return; }
    this.ph = 'hold'; this.k = 0.05;
    if (this.kind === 'foe' && e && !e.dead) {
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
      const r = e.hit({ dmg: 1, dx: -dx / d, dz: -dz / d, whip: true, from: p });
      if (r === 'bounce') { audio.sfx('bounce'); fx.sparks(x, y, z, 4); } else { fx.stop(0.05); fx.shake(0.08, 0.15); fx.burst(P.star, x, y, z, 4, { speed: 2, up: 2, g: 4, life: 0.3, size: 0.34 }); if (e.vel && !e.dead && (e.r || 0.4) < 1.2) { e.vel.x = -dx / d * Math.min(9, d * 2.4); e.vel.z = -dz / d * Math.min(9, d * 2.4); e.vel.y = Math.max(e.vel.y || 0, 4); e.onGround = false; } }
    } else if (this.kind === 'pick' && e && !e.dead) { this.carry = e; audio.sfx('blip', { pitch: 1.5, vol: 0.6 }); }
    else if (this.kind === 'pot' && e && !e.dead) { e.smash(); }
    else { if (this.wall) { fx.sparks(x, y, z, 3); audio.sfx('bounce', { vol: 0.5, pitch: 1.5 }); } // el latigazo siega lo que pille en la punta
      for (const c of this.level.ents) if (c.cut && !c.dead && Math.hypot(c.pos.x - x, c.pos.z - z) < 0.9 && Math.abs(c.pos.y - y) < 1.5) c.cut(p); }
  }
  startPull() {
    const p = this.p, e = this.e; let dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const back = Math.min(0.9, d * 0.5), x1 = e.pos.x + dx * back, z1 = e.pos.z + dz * back;
    this.f = { x0: p.pos.x, y0: p.pos.y, z0: p.pos.z, x1, y1: e.pos.y, z1, t: 0, T: clamp(Math.hypot(d, e.pos.y - p.pos.y) / 17, 0.22, 0.7) };
    this.ph = 'pull'; p.set('hook'); p.yaw = Math.atan2(-dx, -dz); p.face('wow', 0.8); audio.sfx('swing3', { pitch: 1.3 }); audio.sfx('jump', { pitch: 1.2 }); G.hintOnce('zarcilloOk', 'H_ZARCILLO_OK');
  }
}
G.whip = p => { const w = new Whip(p); G.level.add(w); audio.sfx('swing2', { pitch: 1.7 }); audio.sfx('grass', { pitch: 1.5, vol: 0.5 }); return w; };
