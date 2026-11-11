// boss2.js — Cavador, el alacrán cebollero: va bajo tierra y sale donde estás. Tiene la coraza dura:
// hay que cegarlo a pepitazos cuando asoma, o reventar un ajo encima de su montículo.
import { THREE } from './gfx.js';
import { G, run, wait, flag, seen } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent } from './ents.js';
import { Mohin } from './creatures.js';
import * as Q from './art/pulpa.js';
import { clamp, lerp, ease } from './px.js';
import { angDiff } from './player.js';

// terrón que cae en un sitio marcado
class Clod extends Ent {
  constructor(x, y, z, tx, tz, T_ = 1.0, up = 9) {
    super(x, y, z); this.obj = Q.makeClod(); this.obj.scale.setScalar(1.5);
    this.vel = new THREE.Vector3((tx - x) / T_, up, (tz - z) / T_); this.g = (2 * (y + up * T_)) / (T_ * T_); this.sync();
    fx.ring(tx, 0.02, tz, { r0: 1.2, r1: 1.2, t: T_, c: 8, th: 0.12, a: 1 }); fx.ring(tx, 0.02, tz, { r0: 0.1, r1: 1.2, t: T_, c: 9, th: 0.1, a: 1 });
  }
  update(dt) {
    this.vel.y -= this.g * dt; this.pos.addScaledVector(this.vel, dt); this.obj.rotation.x += dt * 8; this.obj.rotation.z += dt * 5; this.sync();
    if (this.pos.y <= 0.1) {
      audio.sfx('land', { pitch: 0.6 }); audio.sfx('crumble', { vol: 0.5, pitch: 1.4 }); fx.shake(0.1, 0.15);
      fx.burst(P.stone, this.pos.x, 0.15, this.pos.z, 9, { speed: 3.4, up: 4, g: 14, life: 0.7, size: 0.4, floor: 0.05, bounce: 0.3 }); fx.dust(this.pos.x, 0.1, this.pos.z, 5, { dark: true, size: 0.6 });
      const p = G.player; if (Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < 1.25 && p.pos.y < 1.2) p.hurt(1, this.pos.x, this.pos.z);
      this.kill();
    }
  }
}

export class Cavador extends Ent {
  // A = { cx, cz, hw, hd, onDead }
  constructor(x, y, z, A) {
    super(x, y, z); this.A = A; this.m = Q.makeCavador(); this.obj = this.m.g; this.name = 'CAVADOR'; this.maxHp = 24; this.hp = 24; this.shown = false;
    this.yaw = 0; this.st = 'hidden'; this.stT = 0; this.e = 0; this.r = 2.4; this.hh = 1.0; this.br = 3.2; this.enemy = true; this.targetable = false; this.camPitch = 0.1;
    this.vel = new THREE.Vector3(); this.fl = 0; this.sqV = 0; this.sqY = 1; this.phase = 1; this.depth = 1; this.blind = 0; this.plan = 0; this.hitCd = 0; this.burT = 0;
    this.mound = Q.makeMound(); this.mound.visible = false; this.sync();
  }
  onAdd(L) { L.group.add(this.mound); this.sol = L.addSolid({ x0: 0, x1: 0, z0: 0, z1: 0, y0: 0, y1: 2.2, ent: this, noClimb: true, noCam: true, off: true }); }
  fit() { const s = this.sol, c = Math.abs(Math.cos(this.yaw)), n = Math.abs(Math.sin(this.yaw)), hx = 1.2 * c + 2.3 * n, hz = 2.3 * c + 1.2 * n; s.x0 = this.pos.x - hx; s.x1 = this.pos.x + hx; s.z0 = this.pos.z - hz; s.z1 = this.pos.z + hz; }
  get up() { return ['up', 'swipe', 'throw'].includes(this.st); }
  get aim() { return [this.pos.x + Math.sin(this.yaw) * 2.4, this.pos.y + 1.5, this.pos.z + Math.cos(this.yaw) * 2.4]; }
  set(s, t = 0) { this.st = s; this.stT = t; this.e = 0; }
  // escena: sale de la tierra por primera vez
  rise() { this.set('rise', 1.1); this.burst(false); }
  roar() { audio.sfx('bossRoar', { pitch: 0.75 }); fx.shake(0.32, 0.7); this.sqV = 10; fx.ring(this.pos.x, 0.05, this.pos.z, { r0: 1, r1: 10, t: 0.8, c: 9, th: 0.4 }); }
  start() { this.set('up', 2.2); this.targetable = true; }
  burst(hurt = true) {
    const p = G.player; audio.sfx('emerge'); fx.shake(0.35, 0.5); fx.stop(0.05);
    fx.burst(P.stone, this.pos.x, 0.2, this.pos.z, 22, { speed: 6, up: 8, g: 15, life: 1, size: 0.46, floor: 0.05, bounce: 0.3, spread: 1.6 }); fx.burst(P.dustD, this.pos.x, 0.3, this.pos.z, 16, { speed: 4, up: 2, g: -0.6, life: 0.9, size: 0.9, spread: 1.5 });
    fx.ring(this.pos.x, 0.05, this.pos.z, { r0: 0.6, r1: 4.2, t: 0.4, c: 7, th: 0.4 });
    if (hurt && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < 2.9 && p.pos.y < 2) p.hurt(1, this.pos.x, this.pos.z, { heavy: true, knock: 10 });
    this.mound.visible = false; this.sol.off = false; this.blind = 0; this.eyes(); this.sqV = 12; this.targetable = true;
    if (hurt && this.phase >= 2 && this.level.ents.filter(e => e instanceof Mohin && !e.dead).length < 3) for (const s of [-1, 1]) { const q = this.level.add(new Mohin(this.pos.x + Math.cos(this.yaw) * 2.6 * s, 1, this.pos.z - Math.sin(this.yaw) * 2.6 * s, { small: true, aggro: 40 })); q.vel.set(Math.cos(this.yaw) * 4 * s, 6, -Math.sin(this.yaw) * 4 * s); }
    if (hurt && this.phase >= 3) this.rain(4);
  }
  rain(n) { const p = G.player, A = this.A; for (let i = 0; i < n; i++) { const a = rnd() * 6.28, rr = i === 0 ? 0 : 1.6 + rnd() * 3.4, tx = clamp(p.pos.x + Math.cos(a) * rr, A.cx - A.hw + 1, A.cx + A.hw - 1), tz = clamp(p.pos.z + Math.sin(a) * rr, A.cz - A.hd + 1, A.cz + A.hd - 1); run((function* (L) { yield* wait(i * 0.22); if (G.boss) L.add(new Clod(tx, 12, tz, tx, tz, 1.0, 0)); })(this.level)); } }
  eyes() { this.m.eyes.forEach((e, i) => { const shut = this.st === 'daze' || this.st === 'dead' || i < this.blind; e.a.visible = !shut; e.b.visible = shut; }); }
  daze(t) {
    this.set('daze', t); this.vel.set(0, 0, 0); this.sqV = -10; this.blind = 2; this.eyes(); audio.sfx('bossRoar', { pitch: 1.5, vol: 0.7 }); audio.sfx('cry', { pitch: 0.45 }); fx.shake(0.2, 0.3);
    fx.burst(P.star, this.pos.x, 2.6, this.pos.z, 12, { speed: 3, up: 3, g: 5, life: 0.8, size: 0.5 }); G.hint('JEFE2_AHORA', 3);
  }
  hit(o) {
    if (['dead', 'hidden', 'rise', 'under', 'warn', 'dive'].includes(this.st)) return false;
    if (this.st === 'daze') {
      if (this.hitCd > 0) return false;
      this.hitCd = 0.14; this.hp -= o.dmg; this.fl = 1; this.sqV = -9; audio.sfx('bossHit'); fx.shake(0.16, 0.2); fx.sparks(o.x ?? this.pos.x, 1.2, o.z ?? this.pos.z, 8, { size: 0.5 });
      if (rnd() < 0.4) G.drop(this.pos.x + Math.sin(this.yaw) * 3.4, 0.5, this.pos.z + Math.cos(this.yaw) * 3.4, { tears: 1 });
      if (this.hp <= 0) { this.die(); return true; }
      const ph = this.hp <= 8 ? 3 : this.hp <= 16 ? 2 : 1;
      if (ph !== this.phase) { this.phase = ph; this.set('rage', 1.3); this.blind = 0; this.eyes(); this.roar(); G.drop(this.pos.x, 1, this.pos.z + 3.4, { ring: 1, ajo: 1, ajoN: 3 }); }
      return true;
    }
    if (o.seed && this.up) {
      // ¿ha dado en la cara?
      const fx_ = Math.sin(this.yaw), fz_ = Math.cos(this.yaw), front = (o.x - this.pos.x) * fx_ + (o.z - this.pos.z) * fz_;
      if (front > 0.6 && -(o.dx * fx_ + o.dz * fz_) > 0.2) {
        this.blind++; this.eyes(); this.fl = 0.8; this.sqV = -7; audio.sfx('bossHit', { pitch: 1.5 }); fx.burst(P.drop, this.aim[0], 1.7, this.aim[2], 6, { speed: 3, up: 3, life: 0.5, size: 0.3 });
        if (this.blind >= 2) this.daze(4.0 - this.phase * 0.3); else { this.stT = Math.max(this.stT, 1.2); G.hintOnce('cavOjo', 'JEFE2_OJO'); }
        return true;
      }
    }
    if (o.blast) { this.daze(4.0 - this.phase * 0.3); return true; }
    this.sqV = -4; audio.sfx('shell', { pitch: 0.6 }); G.hintOnce('cavador', 'H_CAVADOR'); return 'bounce';
  }
  // un ajo que revienta encima del montículo lo saca aturdido
  onBlast(b) {
    if (this.st === 'under' || this.st === 'warn') { if (Math.hypot(b.x - this.pos.x, b.z - this.pos.z) < 3.6) { this.depth = 0; this.burst(false); this.daze(5.2 - this.phase * 0.4); } return; }
    if (Math.hypot(b.x - this.pos.x, b.z - this.pos.z) < 4.6) this.hit({ dmg: 3, blast: true, dx: 0, dz: 0, x: b.x, z: b.z });
  }
  onGas() { if (this.up) this.daze(4.2); }
  die() {
    this.set('dead', 3.2); this.targetable = false; G.target = null; this.eyes(); audio.sfx('bossDie'); audio.music(null, { fade: 0.2 }); fx.stop(0.25); fx.shake(0.4, 1.2); fx.flash(7, 0.2);
    for (const e of this.level.ents) if (e !== this && e.enemy && !e.dead && e.die) e.die({});
  }
  update(dt) {
    const p = G.player, L = this.level, A = this.A; this.t += dt; this.stT -= dt; this.e += dt; this.hitCd -= dt;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
    let depthT = 0, clawT = 0.25 + Math.sin(this.t * 2) * 0.08, rear = 0;
    const cine = G.lock > 0 && !['rise', 'dead', 'hidden'].includes(this.st);
    if (!cine) switch (this.st) {
      case 'hidden': depthT = 1; break;
      case 'rise': depthT = 0; rear = 0.6; if (this.stT <= 0) this.set('pose', 99); break;
      case 'pose': rear = 0.3; break;
      case 'up': {
        this.yaw += angDiff(this.yaw, want) * Math.min(1, (1.6 + this.phase * 0.5) * dt);
        const s = 1.1 + this.phase * 0.3; this.vel.x = Math.sin(this.yaw) * s; this.vel.z = Math.cos(this.yaw) * s;
        if (this.e > 0.9 && !this.acted) { this.acted = true; if (d < 5.2) this.set('swipe', 1.0); else this.set('throw', 1.5); break; }
        if (this.stT <= 0) { this.set('dive', 0.7); audio.sfx('burrow'); this.targetable = false; if (G.target === this) G.target = null; }
        break;
      }
      case 'swipe': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; const f = this.e;
        if (f < 0.5) { clawT = 1.4; rear = 0.7; this.yaw += angDiff(this.yaw, want) * Math.min(1, 4 * dt); this.fl = 0.2 + Math.sin(this.t * 40) * 0.15; }
        else { clawT = -0.5; rear = -0.2; if (!this.swung) { this.swung = true; audio.sfx('swing3', { pitch: 0.45 }); audio.sfx('land', { pitch: 0.5 }); fx.shake(0.22, 0.25); const hx = this.pos.x + Math.sin(this.yaw) * 3.6, hz = this.pos.z + Math.cos(this.yaw) * 3.6; fx.ring(hx, 0.05, hz, { r0: 0.5, r1: 3, t: 0.3, c: 7, th: 0.4 }); fx.burst(P.stone, hx, 0.2, hz, 10, { speed: 4, up: 5, g: 14, life: 0.7, size: 0.4, floor: 0.05, bounce: 0.3 }); if (Math.hypot(p.pos.x - hx, p.pos.z - hz) < 2.7 && p.pos.y < 1.6) p.hurt(1, this.pos.x, this.pos.z, { heavy: true, knock: 10 }); } }
        if (this.stT <= 0) { this.swung = false; this.set('up', 1.6 - this.phase * 0.2); this.acted = true; }
        break;
      }
      case 'throw': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; this.yaw += angDiff(this.yaw, want) * Math.min(1, 3 * dt); rear = 0.5;
        const n = 2 + this.phase, k = Math.floor(this.e / 0.36);
        clawT = 0.3 + Math.abs(Math.sin(this.e / 0.36 * 3.14)) * 1.1;
        if (k !== this.lastK && k < n) { this.lastK = k; audio.sfx('swing2', { pitch: 0.6 }); this.sqV = 6; const a = rnd() * 6.28, rr = k === 0 ? 0 : 1.4 + rnd() * 2.4; L.add(new Clod(this.pos.x + Math.sin(this.yaw) * 2.6, 2.2, this.pos.z + Math.cos(this.yaw) * 2.6, clamp(p.pos.x + Math.cos(a) * rr, A.cx - A.hw + 1, A.cx + A.hw - 1), clamp(p.pos.z + Math.sin(a) * rr, A.cz - A.hd + 1, A.cz + A.hd - 1))); }
        if (this.stT <= 0) { this.lastK = -1; this.set('up', 1.5 - this.phase * 0.2); this.acted = true; }
        break;
      }
      case 'dive': depthT = 1; this.vel.x *= 0.7; this.vel.z *= 0.7; if (rnd() < 0.8) fx.dust(this.pos.x + (rnd() - 0.5) * 3, 0, this.pos.z + (rnd() - 0.5) * 4, 1, { dark: true, size: 0.7 }); if (this.stT <= 0) { this.set('under', 2.6 - this.phase * 0.35); this.sol.off = true; this.mound.visible = true; this.acted = false; } break;
      case 'under': {
        depthT = 1; const s = 4.6 + this.phase * 0.9, a = Math.atan2(dx, dz); this.yaw = a;
        if (d > 0.6) { this.vel.x = Math.sin(a) * s; this.vel.z = Math.cos(a) * s; } else { this.vel.x = this.vel.z = 0; }
        this.burT -= dt; if (this.burT <= 0) { this.burT = 0.42; audio.sfx('burrow', { vol: 0.7 }); fx.shake(0.04, 0.2); }
        if (rnd() < 0.8) fx.burst(P.stone, this.pos.x + (rnd() - 0.5) * 1.6, 0.3, this.pos.z + (rnd() - 0.5) * 1.6, 1, { speed: 2, up: 3.5, g: 12, life: 0.5, size: 0.3, floor: 0.04 });
        if (rnd() < 0.5) fx.dust(this.pos.x, 0.1, this.pos.z, 1, { dark: true, size: 0.6, spread: 0.9 });
        if (this.stT <= 0) { this.set('warn', 0.8 - this.phase * 0.08); this.vel.set(0, 0, 0); fx.ring(this.pos.x, 0.03, this.pos.z, { r0: 2.9, r1: 2.9, t: this.stT, c: 8, th: 0.14, a: 1 }); fx.ring(this.pos.x, 0.03, this.pos.z, { r0: 0.2, r1: 2.9, t: this.stT, c: 9, th: 0.12, a: 1 }); audio.sfx('burrow', { pitch: 1.5 }); }
        break;
      }
      case 'warn': depthT = 1; this.vel.set(0, 0, 0); fx.shake(0.06, 0.1); this.mound.scale.setScalar(1 + this.e * 0.6); if (this.stT <= 0) { this.depth = 0.25; this.yaw = want; this.burst(true); this.set('up', 3.4 - this.phase * 0.35); this.acted = false; } break;
      case 'rage': this.vel.x *= 0.8; this.vel.z *= 0.8; rear = 1; clawT = 1.5; if (this.stT <= 0) { this.set('dive', 0.7); audio.sfx('burrow'); this.targetable = false; if (G.target === this) G.target = null; } break;
      case 'daze': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; clawT = -0.7; rear = -0.35;
        if (rnd() < 0.25) fx.one(P.star, this.pos.x + (rnd() - 0.5) * 2.4, 2.8 + rnd() * 0.6, this.pos.z + (rnd() - 0.5) * 2.4, { vy: 0.5, life: 0.5, size: 0.42 });
        if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) for (const s of [-1, 1]) fx.one(P.drop, this.aim[0] + Math.cos(this.yaw) * 0.7 * s, 1.4, this.aim[2] - Math.sin(this.yaw) * 0.7 * s, { vx: Math.cos(this.yaw) * s * 2, vz: -Math.sin(this.yaw) * s * 2, vy: 2.5 + rnd() * 2, g: 11, life: 0.6, size: 0.3, floor: 0.03 });
        if (this.stT <= 0) { this.blind = 0; this.set('dive', 0.7); this.eyes(); audio.sfx('burrow'); this.targetable = false; if (G.target === this) G.target = null; }
        break;
      }
      case 'dead': {
        this.vel.set(0, 0, 0); const k = clamp(this.e / 3.2); clawT = Math.sin(this.t * 30) * 0.8; rear = Math.sin(this.t * 22) * 0.3;
        this.fl = Math.floor(this.t * 20) % 2 ? 0.8 : 0;
        if (rnd() < 0.5) { const a = rnd() * 6.28; fx.burst(rnd() < 0.5 ? P.dust : P.stone, this.pos.x + Math.cos(a) * 2, 0.5 + rnd() * 2, this.pos.z + Math.sin(a) * 2, 2, { speed: 3, up: 3, life: 0.6, size: 0.6 }); }
        if (Math.floor(this.e * 5) !== Math.floor((this.e - dt) * 5)) { audio.sfx('hitHard', { pitch: 0.6 + k }); fx.shake(0.15, 0.2); }
        this.m.sq.scale.set(1 + k * 0.3, Math.max(0.08, 1 - k * 0.9), 1 + k * 0.2);
        if (this.stT <= 0) {
          fx.flash(7, 0.25); fx.burst(P.dust, this.pos.x, 0.6, this.pos.z, 30, { speed: 5, up: 4, g: -1, life: 1, size: 0.9 }); fx.burst(P.star, this.pos.x, 1, this.pos.z, 20, { speed: 6, up: 6, g: 6, life: 0.9, size: 0.5 });
          G.drop(this.pos.x, 0.5, this.pos.z, { tears: 18, big: true }); const L_ = this.level; L_.group.remove(this.mound); this.kill(); if (A.onDead) A.onDead(L_, this); return;
        }
        break;
      }
    }
    else { this.vel.x *= 0.8; this.vel.z *= 0.8; depthT = this.depth > 0.5 ? 1 : 0; }
    // movimiento dentro de la arena
    if (this.st !== 'dead' && this.st !== 'hidden') {
      this.pos.x = clamp(this.pos.x + this.vel.x * dt, A.cx - A.hw + 2.4, A.cx + A.hw - 2.4); this.pos.z = clamp(this.pos.z + this.vel.z * dt, A.cz - A.hd + 2.4, A.cz + A.hd - 2.4);
      this.fit();
      if (this.up && G.lock <= 0) { const lx = dx * Math.cos(this.yaw) - dz * Math.sin(this.yaw), lz = dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw); if (Math.abs(lx) < 1.3 + p.r && Math.abs(lz) < 2.5 + p.r && p.pos.y < 2) p.hurt(1, this.pos.x, this.pos.z, { knock: 7 }); }
    }
    // animación
    this.depth = lerp(this.depth, depthT, 1 - Math.exp(-(depthT ? 7 : 16) * dt));
    this.fl = Math.max(0, this.fl - dt * 4); for (const m of this.m.mats) m.uniforms.uFlash.value = this.fl;
    this.sqV += (1 - this.sqY) * 120 * dt; this.sqV *= Math.max(0, 1 - 7 * dt); this.sqY = clamp(this.sqY + this.sqV * dt * 0.1, 0.6, 1.4);
    if (this.st !== 'dead') { const sy = this.sqY * (1 + Math.sin(this.t * 2.4) * 0.03), sx = 1 / Math.sqrt(sy); this.m.sq.scale.set(sx, sy, sx); }
    this.rear = lerp(this.rear || 0, rear, 0.2); this.m.sq.rotation.x = -this.rear * 0.3 + (this.st === 'daze' ? Math.sin(this.t * 9) * 0.03 : 0); this.m.sq.rotation.z = this.st === 'daze' ? 0.16 : 0;
    this.claw = lerp(this.claw ?? 0.25, clawT, 1 - Math.exp(-(this.st === 'swipe' && this.e >= 0.5 ? 30 : 9) * dt));
    this.m.claws.forEach((c, i) => { c.rotation.x = -this.claw + Math.sin(this.t * 3 + i * 2) * 0.05; c.rotation.z = (i ? -1 : 1) * Math.max(0, this.claw) * 0.25; });
    this.m.ants.forEach((a, i) => { a.rotation.z = Math.sin(this.t * 4 + i * 2) * 0.18; a.rotation.x = Math.sin(this.t * 2.6 + i) * 0.12; });
    this.obj.position.set(this.pos.x, this.pos.y - this.depth * 3.6, this.pos.z); this.obj.rotation.y = this.yaw; this.obj.visible = this.depth < 0.97; this.m.sh.visible = this.depth < 0.4;
    this.mound.position.set(this.pos.x, this.pos.y, this.pos.z); if (this.st !== 'warn') this.mound.scale.setScalar(1 + Math.sin(this.t * 22) * 0.05); this.mound.rotation.y = this.t * 2;
  }
}
