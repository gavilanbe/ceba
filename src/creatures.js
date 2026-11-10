// creatures.js — vecinos, Candela, bichos bola y plagas.
import { THREE } from './gfx.js';
import { G, flag, run, wait, seen } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent, Slime } from './ents.js';
import * as F from './art/folk.js';
import { clamp, lerp, ease } from './px.js';
import { angDiff } from './player.js';

const tearsFrom = (e, h, w = 0.3) => { for (const s of [-1, 1]) fx.one(P.drop, e.pos.x + Math.cos(e.yaw || 0) * w * s, e.pos.y + h, e.pos.z - Math.sin(e.yaw || 0) * w * s, { vx: Math.cos(e.yaw || 0) * s * (1.5 + rnd()), vz: -Math.sin(e.yaw || 0) * s * (1.5 + rnd()), vy: 2.5 + rnd() * 1.5, g: 11, life: 0.6, size: 0.24, floor: e.pos.y + 0.02 }); };

// ───────── vecinos ─────────
const KIND = {
  ajo: { make: F.makeAjo, voice: 0.55, name: 'EL CONSEJO' },
  puerro: { make: F.makePuerro, voice: 0.75, name: 'SARGENTO PUERRO' },
  chalota: { make: F.makeChalota, voice: 1.25, name: 'CHALOTA' },
  pipo: { make: () => F.makeCebolleta(), voice: 1.7, name: 'PIPO' },
  nita: { make: () => F.makeCebolleta(14), voice: 1.95, name: 'NITA' },
};
export class NPC extends Ent {
  constructor(x, y, z, yaw, kind, talk, o = {}) {
    super(x, y, z); const K = KIND[kind]; this.kind = kind; this.m = K.make(); this.obj = this.m.g; this.yaw = this.yaw0 = yaw; this.voice = K.voice; this.name = K.name;
    this.talk = talk; this.label = 'HABLAR'; this.ir = (this.m.r || 0.5) + 1.15; this.r = this.m.r || 0.5; this.hh = this.m.h * 0.8; this.targetable = true;
    this.cryT = 0; this.cryCd = 0; this.sqV = 0; this.sqY = 1; this.turns = o.turns !== false; this.hopT = 0; this.o = o; this.sync();
  }
  onAdd(L) { const w = this.r * 1.5; L.addSolid({ x0: this.pos.x - w / 2, x1: this.pos.x + w / 2, z0: this.pos.z - w / 2, z1: this.pos.z + w / 2, y0: this.pos.y, y1: this.pos.y + this.m.h, ent: this, noClimb: true, noCam: true }); }
  interact(p) { const n = this; if (!this.talk) return; run(function* () { G.lock++; G.speaker = n; n.sqV = 5; yield* n.talk(n, p); G.speaker = null; G.lock--; }); }
  onGas() {
    this.cryT = 3.2; this.sqV = 8; audio.sfx('cry', { pitch: this.voice });
    fx.one(P.bang, this.pos.x, this.pos.y + this.m.h + 0.5, this.pos.z, { vy: 1.2, life: 0.7, size: 0.5 });
    if (this.cryCd <= 0) { this.cryCd = 20; G.drop(this.pos.x + Math.sin(this.yaw) * 0.8, this.pos.y + this.m.h * 0.6, this.pos.z + Math.cos(this.yaw) * 0.8, { tears: this.kind === 'ajo' ? 5 : 2 }); }
    flag('lloro_' + this.kind, (flag('lloro_' + this.kind) || 0) + 1);
  }
  hit() { this.sqV = -7; audio.sfx('bounce', { pitch: this.voice }); fx.one(P.bang, this.pos.x, this.pos.y + this.m.h + 0.4, this.pos.z, { vy: 1, life: 0.5, size: 0.45 }); return 'bounce'; }
  update(dt) {
    this.t += dt; this.cryCd -= dt;
    const p = G.player, d = this.dist();
    if (this.turns) { const ty = d < 5 ? Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z) : this.yaw0; this.yaw += angDiff(this.yaw, ty) * Math.min(1, 5 * dt); }
    this.obj.rotation.y = this.yaw;
    this.sqV += (1 - this.sqY) * 160 * dt; this.sqV *= Math.max(0, 1 - 9 * dt); this.sqY = clamp(this.sqY + this.sqV * dt * 0.1, 0.6, 1.4);
    let sy = this.sqY * (1 + Math.sin(this.t * 2.2) * 0.02);
    if (G.speaker === this && G.talking) sy *= 1 + Math.sin(this.t * 22) * 0.035;
    if (this.cryT > 0) { this.cryT -= dt; sy *= 1 + Math.sin(this.t * 30) * 0.04; if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) tearsFrom(this, this.m.h * 0.62, this.r * 0.6); }
    const sx = 1 / Math.sqrt(sy); this.m.sq.scale.set(sx, sy, sx);
    if (this.m.arm) this.m.arm.rotation.z = Math.sin(this.t * 1.5) * 0.02;
    if (this.m.hair) this.m.hair.rotation.x = Math.sin(this.t * 3) * 0.12;
    if (this.o.hop) { this.hopT -= dt; if (this.hopT <= 0) { this.hopT = 0.6 + rnd() * 1.6; this.sqV = 6; } }
  }
}

// ───────── Candela, la luciérnaga ─────────
export class Candela {
  constructor() { this.m = F.makeCandela(); this.obj = this.m.g; this.pos = new THREE.Vector3(); this.t = 0; this.light = { x: 0, y: 0, z: 0, r: 4.6 }; this.goal = null; this.blink = 0; this.on = false; this.obj.visible = false; this.lr = 4.6; }
  show(on, x, y, z) { this.on = on; this.obj.visible = on; if (x != null) this.pos.set(x, y, z); }
  update(dt) {
    if (!this.on) { this.light.r = 0; return; }
    this.t += dt; const p = G.player, c = G.cam;
    let tx, ty, tz;
    const tg = G.target;
    if (this.goal) { tx = this.goal.x; ty = this.goal.y; tz = this.goal.z; }
    else if (tg) { tx = tg.pos.x + Math.cos(this.t * 4) * 0.5; tz = tg.pos.z + Math.sin(this.t * 4) * 0.5; ty = tg.pos.y + (tg.hh || 0.5) * 2 + 0.55; }
    else {
      const a = c.yaw + Math.PI / 2;
      tx = p.pos.x + Math.sin(a) * 0.85 + Math.sin(this.t * 1.3) * 0.25; tz = p.pos.z + Math.cos(a) * 0.85 + Math.cos(this.t * 1.7) * 0.25;
      ty = p.pos.y + 1.25 * p.sc + 0.25 + Math.sin(this.t * 2.6) * 0.14;
    }
    const k = 1 - Math.exp(-(tg || this.goal ? 7 : 4) * dt), ox = this.pos.x, oz = this.pos.z;
    this.pos.x += (tx - this.pos.x) * k; this.pos.y += (ty - this.pos.y) * k; this.pos.z += (tz - this.pos.z) * k;
    this.obj.position.copy(this.pos);
    const vx = this.pos.x - ox, vz = this.pos.z - oz; if (Math.hypot(vx, vz) > 0.002) this.obj.rotation.y = Math.atan2(vx, vz);
    const f = Math.sin(this.t * 55) * 0.9; this.m.wl.rotation.z = f; this.m.wr.rotation.z = -f;
    this.blink = Math.max(0, this.blink - dt);
    const pulse = 0.85 + Math.sin(this.t * 5) * 0.15 + (this.blink > 0 ? Math.sin(this.t * 40) * 0.4 : 0);
    this.light.x = this.pos.x; this.light.y = this.pos.y; this.light.z = this.pos.z; this.light.r = this.lr * pulse;
    this.m.tail.scale.setScalar(0.9 + pulse * 0.3);
    if (rnd() < 0.2) fx.one(P.sqY, this.pos.x, this.pos.y - 0.05, this.pos.z, { vy: -0.3, life: 0.4, size: 0.1 });
  }
  call() { this.blink = 1.2; audio.sfx('firefly'); }
}

// ───────── bicho bola: juguete del pueblo ─────────
export class Bicho extends Ent {
  constructor(x, y, z) { super(x, y, z); this.m = F.makeBicho(); this.obj = this.m.g; this.home = this.pos.clone(); this.vel = new THREE.Vector3(); this.yaw = rnd() * 6; this.ball = false; this.wt = 1; this.r = 0.32; this.bt = 0; this.spin = 0; this.targetable = true; this.hh = 0.2; this.sync(); }
  curl(dx, dz, s = 7) { if (!this.ball) audio.sfx('curl'); this.ball = true; this.bt = 2.6; this.vel.x = dx * s; this.vel.z = dz * s; this.vel.y = 3; this.m.walk.visible = false; this.m.ball.visible = true; flag('bichoRodado', 1); }
  hit(o) { this.curl(o.dx, o.dz, 8.5); fx.sparks(this.pos.x, this.pos.y + 0.3, this.pos.z, 3); audio.sfx('hit', { pitch: 1.4 }); return true; }
  onGas() { this.curl(0, 0, 0); audio.sfx('cry', { pitch: 2.2 }); this.bt = 3.5; }
  update(dt) {
    this.t += dt; const p = G.player, L = this.level;
    const dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.5 + p.r && Math.abs(p.pos.y - this.pos.y) < 0.8) { const sp = Math.hypot(p.vel.x, p.vel.z); if (p.state === 'roll' || sp > 2 || this.ball) this.curl(dx / (d || 1), dz / (d || 1), p.state === 'roll' ? 10 : 4 + sp * 0.6); }
    if (this.ball) {
      this.bt -= dt; const sp = Math.hypot(this.vel.x, this.vel.z);
      this.vel.x *= 1 - 0.9 * dt; this.vel.z *= 1 - 0.9 * dt; this.spin += sp * dt * 4; this.m.ball.rotation.x = this.spin; if (sp > 0.2) this.yaw = Math.atan2(this.vel.x, this.vel.z);
      if (this.bt <= 0 && sp < 0.6) { this.ball = false; this.m.walk.visible = true; this.m.ball.visible = false; this.vel.set(0, 3, 0); audio.sfx('sprout', { pitch: 1.6, vol: 0.5 }); }
    } else {
      this.wt -= dt;
      if (this.wt <= 0) { this.wt = 1 + rnd() * 3; if (rnd() < 0.7) { const a = Math.atan2(this.home.x - this.pos.x, this.home.z - this.pos.z) + (rnd() - 0.5) * 3; this.yaw = a; this.walk = 0.6 + rnd() * 1.2; } }
      if (this.walk > 0) { this.walk -= dt; this.vel.x = Math.sin(this.yaw) * 0.8; this.vel.z = Math.cos(this.yaw) * 0.8; } else { this.vel.x = this.vel.z = 0; }
    }
    this.vel.y -= 20 * dt; this.pos.addScaledVector(this.vel, dt);
    const hits = L.collide(this.pos, this.r, 0.4);
    for (const h of hits) { const dot = this.vel.x * h.nx + this.vel.z * h.nz; if (dot < 0) { this.vel.x -= 1.8 * dot * h.nx; this.vel.z -= 1.8 * dot * h.nz; if (this.ball && Math.abs(dot) > 2) { audio.sfx('bounce', { pitch: 1.5, vol: 0.5 }); fx.dust(this.pos.x, this.pos.y + 0.2, this.pos.z, 2); if (h.s.ent && h.s.ent.fragile) h.s.ent.smash(); } } }
    const g = L.ground(this.pos.x, this.pos.z, this.pos.y, 0.15);
    if (this.pos.y <= g.y) { this.pos.y = g.y; if (this.vel.y < -3 && this.ball) this.vel.y *= -0.4; else this.vel.y = 0; }
    if (this.pos.y < L.killY) { this.pos.copy(this.home); this.vel.set(0, 0, 0); }
    this.sync(); this.obj.rotation.y = this.yaw;
    if (!this.ball) this.m.walk.scale.z = 1 + Math.sin(this.t * 10) * 0.05 * (this.walk > 0 ? 1 : 0);
  }
}

// ───────── plagas ─────────
export class Enemy extends Ent {
  setup(m, hp, o = {}) {
    this.m = m; this.obj = m.g; this.hp = hp; this.enemy = true; this.targetable = true; this.vel = new THREE.Vector3(); this.cryT = 0; this.hurtT = 0; this.fl = 0; this.home = this.pos.clone();
    this.yaw = rnd() * 6; this.sqV = 0; this.sqY = 1; this.onGround = false; this.dmg = 1; this.loot = o.loot || { tears: 1, ring: 0.15 }; this.aggro = o.aggro || 8; this.kind = o.kind; this.cryPitch = o.cry || 1.5; this.sync();
  }
  hit(o) {
    if (this.hurtT > 0) return false;
    const d = o.dmg * (this.cryT > 0 ? 2 : 1); this.hp -= d; this.hurtT = 0.22; this.fl = 1; this.sqV = -9;
    this.vel.x = o.dx * 7; this.vel.z = o.dz * 7; this.vel.y = 3.5; this.onGround = false;
    audio.sfx(this.hp <= 0 ? 'hitHard' : 'hit'); fx.sparks(this.pos.x, this.pos.y + (this.hh || 0.4), this.pos.z, 5);
    if (this.hp <= 0) this.die(o);
    return true;
  }
  die(o) {
    const p = this.pos;
    fx.burst(P.dust, p.x, p.y + 0.3, p.z, 10, { speed: 2.4, up: 1.6, g: -1, life: 0.6, size: 0.5 }); fx.burst(P.star, p.x, p.y + 0.4, p.z, 6, { speed: 3, up: 3, g: 5, life: 0.5, size: 0.4 });
    fx.ring(p.x, p.y + 0.05, p.z, { r1: 1.5, t: 0.3, c: 7, th: 0.2 });
    G.drop(p.x, p.y, p.z, this.loot); if (this.kind) seen(this.kind);
    const L = this.level; this.kill(); if (L.onKill) L.onKill(this);
  }
  onGas() {
    if (this.kind) seen(this.kind);
    this.cryT = 3.8; this.sqV = 7; audio.sfx('cry', { pitch: this.cryPitch }); this.vel.x = this.vel.z = 0;
    if (!this.gasDrop) { this.gasDrop = true; G.drop(this.pos.x, this.pos.y + 0.2, this.pos.z, { tears: 1 }); }
    if (this.onCry) this.onCry();
  }
  physics(dt, fly = false) {
    const L = this.level;
    if (!fly) this.vel.y -= 22 * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.hits = L.collide(this.pos, this.r, 0.5);
    if (!fly) {
      const g = L.ground(this.pos.x, this.pos.z, this.pos.y, this.r * 0.5); const was = this.onGround;
      if (this.pos.y <= g.y) { this.pos.y = g.y; if (!was && this.vel.y < -2) { this.sqV = -5; this.landed = true; } this.vel.y = 0; this.onGround = true; } else this.onGround = false;
      if (this.pos.y < L.killY) this.kill();
    }
  }
  common(dt) {
    this.t += dt; this.hurtT -= dt; if (this.cryT > 0) { this.cryT -= dt; if (Math.floor(this.t * 11) !== Math.floor((this.t - dt) * 11)) tearsFrom(this, (this.hh || 0.4) * 1.2, this.r * 0.5); }
    this.fl = Math.max(0, this.fl - dt * 5); for (const m of this.m.mats) m.uniforms.uFlash.value = this.fl;
    this.sqV += (1 - this.sqY) * 180 * dt; this.sqV *= Math.max(0, 1 - 10 * dt); this.sqY = clamp(this.sqY + this.sqV * dt * 0.1, 0.5, 1.5);
    let sy = this.sqY; if (this.cryT > 0) sy *= 1 + Math.sin(this.t * 32) * 0.05;
    const sx = 1 / Math.sqrt(sy); this.m.sq.scale.set(sx, sy, sx);
    this.sync(); this.obj.rotation.y = this.yaw;
  }
  touch() {
    if (this.cryT > 0 || this.hurtT > 0) return;
    const p = G.player, d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    if (d < this.r + p.r * 0.9 && p.pos.y < this.pos.y + (this.hh || 0.4) * 2 && p.pos.y + p.h > this.pos.y) {
      if (p.state === 'roll' && this.light) { this.vel.x = Math.sin(p.yaw) * 6; this.vel.z = Math.cos(p.yaw) * 6; this.vel.y = 4; this.sqV = -8; audio.sfx('bounce', { pitch: 1.3 }); this.hurtT = 0.4; return; }
      p.hurt(this.dmg, this.pos.x, this.pos.z, { heavy: this.heavy });
    }
  }
  toPlayer() {
    const p = G.player, q = { dx: p.pos.x - this.pos.x, dz: p.pos.z - this.pos.z, d: Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z), dy: p.pos.y - this.pos.y };
    // en la mazmorra solo persiguen dentro de su sala
    if (this.room === undefined) this.room = (this.level.rooms || []).find(r => this.home.x >= r.x0 && this.home.x <= r.x1 && this.home.z >= r.z0 && this.home.z <= r.z1) || null;
    if (this.room && (p.pos.x < this.room.x0 || p.pos.x > this.room.x1 || p.pos.z < this.room.z0 || p.pos.z > this.room.z1)) q.d = 999;
    return q;
  }
}

// pulgón: salta en manada
export class Pulgon extends Enemy {
  constructor(x, y, z, o = {}) { super(x, y, z); this.setup(F.makePulgon(), 1, { kind: 'pulgon', cry: 1.9, ...o }); this.r = 0.36; this.hh = 0.3; this.hop = rnd(); this.light = true; this.s = o.s || 1; this.obj.scale.setScalar(this.s); }
  update(dt) {
    if (G.lock > 0 && !G.boss) { this.common(dt); return; }
    const q = this.toPlayer();
    if (this.cryT <= 0 && this.onGround) {
      this.vel.x *= 0.7; this.vel.z *= 0.7; this.hop -= dt;
      if (this.hop <= 0) {
        const chase = q.d < this.aggro && Math.abs(q.dy) < 3;
        let a = chase ? Math.atan2(q.dx, q.dz) + (rnd() - 0.5) * 0.7 : Math.atan2(this.home.x - this.pos.x, this.home.z - this.pos.z) + (rnd() - 0.5) * 4;
        this.yaw = a; const s = chase ? 3.6 : 1.6;
        this.vel.x = Math.sin(a) * s; this.vel.z = Math.cos(a) * s; this.vel.y = chase ? 5.5 : 3.6; this.onGround = false; this.sqV = 6;
        this.hop = chase ? 0.55 + rnd() * 0.4 : 1 + rnd() * 2; if (chase && q.d < 9) audio.sfx('jump', { pitch: 1.8, vol: 0.3 });
      }
    }
    this.physics(dt); if (this.landed) { this.landed = false; fx.dust(this.pos.x, this.pos.y, this.pos.z, 1, { dark: true, size: 0.2 }); }
    this.touch(); this.common(dt);
  }
}

// babosa: lenta, dura, deja baba que frena
export class Babosa extends Enemy {
  constructor(x, y, z, o = {}) { super(x, y, z); this.setup(F.makeBabosa(), 3, { kind: 'babosa', cry: 0.8, loot: { tears: 3, ring: 0.5 }, ...o }); this.r = 0.6; this.hh = 0.35; this.trail = 0; this.retract = 0; }
  hit(o) { const r = super.hit(o); if (r) this.retract = 0.6; return r; }
  update(dt) {
    if (G.lock > 0) { this.common(dt); return; }
    const q = this.toPlayer();
    if (this.cryT <= 0 && this.onGround && this.hurtT <= 0) {
      if (q.d < this.aggro && Math.abs(q.dy) < 2.5) {
        this.yaw += angDiff(this.yaw, Math.atan2(q.dx, q.dz)) * Math.min(1, 2.2 * dt);
        const s = 0.75 + Math.max(0, Math.sin(this.t * 4)) * 0.9; this.vel.x = Math.sin(this.yaw) * s; this.vel.z = Math.cos(this.yaw) * s;
        this.trail -= dt; if (this.trail <= 0) { this.trail = 0.7; this.level.add(new Slime(this.pos.x - Math.sin(this.yaw) * 0.6, this.pos.y, this.pos.z - Math.cos(this.yaw) * 0.6, 0.75, 5)); }
      } else { this.vel.x *= 0.8; this.vel.z *= 0.8; }
    } else if (this.onGround) { this.vel.x *= 0.85; this.vel.z *= 0.85; }
    this.physics(dt); this.touch(); this.common(dt);
    const st = 1 + Math.sin(this.t * 4) * 0.08; this.m.sq.scale.z *= st;
    this.retract = Math.max(0, this.retract - dt);
    for (const s of this.m.stalks) { s.st.scale.y = lerp(s.st.scale.y, this.retract > 0 ? 0.25 : this.cryT > 0 ? 0.7 : 1, 0.25); s.st.rotation.x = 0.35 + (this.cryT > 0 ? 0.7 : Math.sin(this.t * 2 + s.st.position.x * 9) * 0.12); s.e.visible = this.cryT <= 0; s.ec.visible = this.cryT > 0; }
  }
}

// trips: vuela en círculos y se lanza como un dardo
export class Trips extends Enemy {
  constructor(x, y, z, o = {}) { super(x, y, z); this.setup(F.makeTrips(), 1, { kind: 'trips', cry: 2.4, loot: { tears: 2, ring: 0.2 }, ...o }); this.r = 0.34; this.hh = 0.2; this.st = 'orbit'; this.stT = 1.5 + rnd() * 2; this.alt = 1.5; this.ang = rnd() * 6; this.baseY = y; this.light = true; this.aggro = o.aggro || 9; this.dir = new THREE.Vector3(); }
  onCry() { this.st = 'down'; }
  update(dt) {
    if (G.lock > 0) { this.common(dt); return; }
    const p = G.player, q = this.toPlayer();
    this.stT -= dt;
    const f = Math.sin(this.t * 70) * 0.8; this.m.wl.rotation.z = f; this.m.wr.rotation.z = -f;
    if (this.cryT > 0 || this.st === 'down') {
      this.vel.x *= 0.9; this.vel.z *= 0.9; this.physics(dt); this.m.wl.rotation.z = 0.2; this.m.wr.rotation.z = -0.2;
      if (this.cryT <= 0) { this.st = 'orbit'; this.stT = 1.5; this.vel.y = 5; }
    } else if (this.st === 'orbit') {
      const active = q.d < this.aggro;
      const cx = active ? p.pos.x : this.home.x, cz = active ? p.pos.z : this.home.z, R = active ? 3.6 : 1.5;
      this.ang += dt * 1.5; const tx = cx + Math.cos(this.ang) * R, tz = cz + Math.sin(this.ang) * R, ty = (active ? p.pos.y : this.baseY) + this.alt + Math.sin(this.t * 3) * 0.25;
      this.vel.set((tx - this.pos.x) * 3, (ty - this.pos.y) * 3, (tz - this.pos.z) * 3); this.vel.clampLength(0, 6);
      this.yaw += angDiff(this.yaw, Math.atan2(this.vel.x, this.vel.z)) * Math.min(1, 8 * dt);
      this.physics(dt, true);
      if (active && this.stT <= 0) { this.st = 'aim'; this.stT = 0.5; audio.sfx('buzz'); }
    } else if (this.st === 'aim') {
      this.vel.set(0, 0, 0); this.yaw += angDiff(this.yaw, Math.atan2(q.dx, q.dz)) * Math.min(1, 14 * dt);
      this.obj.position.x += (rnd() - 0.5) * 0.05; this.fl = 0.5;
      if (this.stT <= 0) { this.st = 'dart'; this.stT = 0.6; this.dir.set(q.dx, (p.pos.y + 0.4) - this.pos.y, q.dz).normalize(); audio.sfx('swing3', { pitch: 1.5, vol: 0.6 }); }
      this.common(dt); this.obj.rotation.x = 0; return;
    } else if (this.st === 'dart') {
      this.vel.copy(this.dir).multiplyScalar(11.5); this.physics(dt, true);
      if (rnd() < 0.6) fx.one(P.sqW, this.pos.x, this.pos.y, this.pos.z, { life: 0.2, size: 0.14 });
      const g = this.level.ground(this.pos.x, this.pos.z, this.pos.y + 0.3, 0.1);
      if (this.stT <= 0 || this.hits.length || this.pos.y < g.y + 0.15) { this.st = 'rest'; this.stT = 1.1; if (this.hits.length) { fx.sparks(this.pos.x, this.pos.y, this.pos.z, 3); audio.sfx('bounce', { pitch: 1.6, vol: 0.5 }); } }
    } else if (this.st === 'rest') {
      this.vel.x *= 0.85; this.vel.z *= 0.85; this.vel.y = (this.level.ground(this.pos.x, this.pos.z, this.pos.y + 0.5, 0.1).y + 0.45 - this.pos.y) * 4; this.physics(dt, true);
      if (this.stT <= 0) { this.st = 'orbit'; this.stT = 2 + rnd() * 1.5; }
    }
    this.touch(); this.common(dt);
    this.obj.rotation.x = this.st === 'dart' ? -Math.asin(clamp(this.dir.y, -1, 1)) : 0;
    const g = this.level.ground(this.pos.x, this.pos.z, this.pos.y + 0.2, 0.1); this.m.sh.position.y = g.y - this.pos.y + 0.03; this.m.sh.visible = g.y > -50;
  }
}
