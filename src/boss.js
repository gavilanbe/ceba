// boss.js — Tapona, babosa de cisterna: lleva el tapón del desagüe de sombrero.
import { THREE } from './gfx.js';
import { G, run, wait, flag } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { Ent, Slime } from './ents.js';
import { Pulgon } from './creatures.js';
import * as F from './art/folk.js';
import { clamp, lerp, ease } from './px.js';
import { angDiff } from './player.js';
import { bossEnd } from './story.js';

class Glob extends Ent {
  constructor(x, y, z, tx, tz) {
    super(x, y, z); this.obj = F.makeSlimeBall(); this.obj.scale.setScalar(1.6); const T_ = 1.05;
    this.vel = new THREE.Vector3((tx - x) / T_, 9, (tz - z) / T_); this.g = (2 * (y + 9 * T_)) / (T_ * T_); this.tx = tx; this.tz = tz; this.sync();
    this.mark = fx.ring(tx, 0.02, tz, { r0: 1.3, r1: 1.3, t: T_, c: 8, th: 0.12, a: 1 });
  }
  update(dt) {
    this.vel.y -= this.g * dt; this.pos.addScaledVector(this.vel, dt); this.obj.rotation.x += dt * 9; this.sync();
    if (this.pos.y <= 0.05) {
      audio.sfx('slime'); fx.burst(P.slime, this.pos.x, 0.1, this.pos.z, 10, { speed: 3, up: 3.5, g: 10, life: 0.5, size: 0.34 });
      this.level.add(new Slime(this.pos.x, 0, this.pos.z, 1.35, 6));
      const p = G.player; if (Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < 1.2 && p.pos.y < 1) p.hurt(1, this.pos.x, this.pos.z);
      this.kill();
    }
  }
}

export class Tapona extends Ent {
  constructor(x, y, z) {
    super(x, y, z); this.m = F.makeTapona(); this.obj = this.m.g; this.name = 'TAPONA'; this.maxHp = 12; this.hp = 12; this.shown = false;
    this.yaw = 0; this.st = 'sleep'; this.stT = 0; this.r = 2.3; this.hh = 1.1; this.enemy = true; this.targetable = false; this.camPitch = 0.12;
    this.vel = new THREE.Vector3(); this.fl = 0; this.sqV = 0; this.sqY = 1; this.phase = 1; this.cool = 2; this.eye = 0; this.trail = 0; this.hitCd = 0; this.plan = 0; this.sync();
    this.m.sq.scale.set(1.15, 0.7, 1.05);
  }
  onAdd(L) { this.sol = L.addSolid({ x0: 0, x1: 0, z0: 0, z1: 0, y0: 0, y1: 2.0, ent: this, noClimb: true, noCam: true }); this.fit(); }
  fit() { const s = this.sol, c = Math.abs(Math.cos(this.yaw)), n = Math.abs(Math.sin(this.yaw)), hx = 1.25 * c + 2.0 * n, hz = 2.0 * c + 1.25 * n; s.x0 = this.pos.x - hx; s.x1 = this.pos.x + hx; s.z0 = this.pos.z - hz; s.z1 = this.pos.z + hz; }
  set(s, t = 0) { this.st = s; this.stT = t; this.e = 0; }
  wake() { this.set('wake', 1.2); audio.sfx('slime'); this.sqV = 6; }
  roar() { audio.sfx('bossRoar'); fx.shake(0.3, 0.7); this.sqV = 10; this.mouth = 0.8; fx.ring(this.pos.x, 0.05, this.pos.z, { r0: 1, r1: 9, t: 0.8, c: 14, th: 0.4 }); }
  start() { this.set('idle', 2.4); this.targetable = true; }
  hit(o) {
    if (this.st === 'dead' || this.st === 'sleep' || this.st === 'wake') return false;
    if (this.st !== 'cry') { this.sqV = -4; G.hintOnce('goma', 'H_GOMA'); return 'bounce'; }
    if (this.hitCd > 0) return false;
    this.hitCd = 0.16; this.hp -= o.dmg; this.fl = 1; this.sqV = -9; audio.sfx('bossHit'); fx.shake(0.16, 0.2);
    fx.sparks(this.pos.x + Math.sin(this.yaw) * 2, 1.2, this.pos.z + Math.cos(this.yaw) * 2, 8, { size: 0.5 });
    fx.burst(P.drop, this.pos.x + Math.sin(this.yaw) * 2, 1.4, this.pos.z + Math.cos(this.yaw) * 2, 6, { speed: 3, up: 4, life: 0.6, size: 0.3 });
    if (rnd() < 0.5) G.drop(this.pos.x + Math.sin(this.yaw) * 3, 0.5, this.pos.z + Math.cos(this.yaw) * 3, { tears: 1 });
    if (this.hp <= 0) { this.die(); return true; }
    const ph = this.hp <= 4 ? 3 : this.hp <= 8 ? 2 : 1;
    if (ph !== this.phase) { this.phase = ph; this.set('rage', 1.3); this.roar(); G.drop(this.pos.x, 1, this.pos.z + 3, { ring: 1 }); }
    return true;
  }
  onGas() {
    if (['dead', 'sleep', 'wake', 'cry', 'rage'].includes(this.st)) return;
    this.set('cry', 5.2 - this.phase * 0.5); audio.sfx('cry', { pitch: 0.4 }); audio.sfx('bossRoar', { pitch: 1.5, vol: 0.6 }); this.sqV = 9; this.vel.set(0, 0, 0); fx.shake(0.12, 0.3);
  }
  die() {
    this.set('dead', 3.2); this.targetable = false; G.target = null; audio.sfx('bossDie'); audio.music(null, { fade: 0.2 }); fx.stop(0.25); fx.shake(0.4, 1.2); fx.flash(7, 0.2);
    for (const e of this.level.ents) if (e !== this && e.enemy && !e.dead && e.die) e.die({});
  }
  update(dt) {
    const p = G.player, L = this.level; this.t += dt; this.stT -= dt; this.e = (this.e || 0) + dt; this.hitCd -= dt;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
    let eyeT = 0, stretch = 1 + Math.sin(this.t * 2.2) * 0.04, rear = 0;
    const cine = G.lock > 0 && this.st !== 'wake' && this.st !== 'dead' && this.st !== 'sleep';
    if (!cine) switch (this.st) {
      case 'sleep': eyeT = 1.25; break;
      case 'wake': eyeT = lerp(1.25, 0, ease.out(clamp(this.e / 1.0))); this.m.sq.scale.y = lerp(0.7, 1, clamp(this.e)); if (this.stT <= 0) this.set('pose', 99); break;
      case 'pose': break;
      case 'idle': {
        this.yaw += angDiff(this.yaw, want) * Math.min(1, (1.3 + this.phase * 0.4) * dt);
        const s = 0.9 + this.phase * 0.25 + Math.max(0, Math.sin(this.t * 3)) * 0.7;
        this.vel.x = Math.sin(this.yaw) * s; this.vel.z = Math.cos(this.yaw) * s;
        if (this.stT <= 0) {
          this.plan++;
          if (this.phase >= 3 && this.plan % 4 === 0 && L.ents.filter(e => e instanceof Pulgon && !e.dead).length < 3) this.set('summon', 1.2);
          else if (this.phase >= 2 && this.plan % 2 === 0) this.set('spit', 1.6);
          else this.set('rear', 0.85 - this.phase * 0.08);
          if (this.st === 'rear') audio.sfx('bossRoar', { pitch: 1.2, vol: 0.5 });
        }
        break;
      }
      case 'rear': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; this.yaw += angDiff(this.yaw, want) * Math.min(1, 5 * dt); rear = ease.out(clamp(this.e / 0.5)); this.fl = 0.25 + Math.sin(this.t * 40) * 0.2;
        if (this.stT <= 0) { this.set('charge', 0.95 + this.phase * 0.1); this.cy = this.yaw; audio.sfx('swing3', { pitch: 0.5 }); this.hitWall = false; }
        break;
      }
      case 'charge': {
        const s = 11 + this.phase * 1.5; this.vel.x = Math.sin(this.cy) * s; this.vel.z = Math.cos(this.cy) * s; stretch = 1.25;
        if (rnd() < 0.7) fx.dust(this.pos.x - Math.sin(this.cy) * 2, 0, this.pos.z - Math.cos(this.cy) * 2, 1, { dark: true, size: 0.6 });
        if (this.hitWall || this.stT <= 0) {
          if (this.hitWall) { audio.sfx('land', { pitch: 0.5 }); audio.sfx('bounce', { pitch: 0.5 }); fx.shake(0.3, 0.4); fx.burst(P.stone, this.pos.x + Math.sin(this.cy) * 2, 1, this.pos.z + Math.cos(this.cy) * 2, 12, { speed: 4, up: 5, g: 14, life: 0.8, size: 0.4, floor: 0.05, bounce: 0.3 }); this.sqV = -12; }
          this.set('stun', this.hitWall ? 1.5 : 0.6);
        }
        break;
      }
      case 'stun': this.vel.x *= 0.85; this.vel.z *= 0.85; eyeT = 0.5 + Math.sin(this.t * 9) * 0.25; if (rnd() < 0.2) fx.one(P.star, this.pos.x + (rnd() - 0.5) * 2, 3 + rnd(), this.pos.z + (rnd() - 0.5) * 2, { vy: 0.5, life: 0.5, size: 0.4 }); if (this.stT <= 0) this.set('idle', 1.6 - this.phase * 0.3); break;
      case 'spit': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; this.yaw += angDiff(this.yaw, want) * Math.min(1, 3 * dt); rear = 0.5;
        const n = this.phase >= 3 ? 4 : 3, k = Math.floor(this.e / 0.42);
        if (k !== this.lastK && k < n) { this.lastK = k; this.mouth = 0.3; audio.sfx('slime', { pitch: 1.4 }); this.sqV = 6; const a = rnd() * 6.28, rr = k === 0 ? 0 : 1.5 + rnd() * 2.5; L.add(new Glob(this.pos.x + Math.sin(this.yaw) * 2, 2, this.pos.z + Math.cos(this.yaw) * 2, clamp(p.pos.x + Math.cos(a) * rr, -10, 10), clamp(p.pos.z + Math.sin(a) * rr, -71, -51))); }
        if (this.stT <= 0) { this.lastK = -1; this.set('idle', 1.5); }
        break;
      }
      case 'summon': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; rear = 0.8;
        if (!this.sum && this.e > 0.5) { this.sum = true; this.roar(); for (let i = 0; i < 3; i++) { const a = rnd() * 6.28; const q = L.add(new Pulgon(clamp(p.pos.x + Math.cos(a) * 4, -9.5, 9.5), 7 + i, clamp(p.pos.z + Math.sin(a) * 4, -70, -52), { aggro: 30, loot: { tears: 1, ring: 0.5 } })); } }
        if (this.stT <= 0) { this.sum = false; this.set('idle', 2); }
        break;
      }
      case 'rage': this.vel.x *= 0.8; this.vel.z *= 0.8; rear = 1; if (this.stT <= 0) this.set('idle', 0.8); break;
      case 'cry': {
        this.vel.x *= 0.8; this.vel.z *= 0.8; eyeT = 1.42;
        if (Math.floor(this.t * 14) !== Math.floor((this.t - dt) * 14)) for (const s of [-1, 1]) fx.one(P.drop, this.pos.x + Math.sin(this.yaw) * 3 + Math.cos(this.yaw) * 0.6 * s, 1.0, this.pos.z + Math.cos(this.yaw) * 3 - Math.sin(this.yaw) * 0.6 * s, { vx: Math.cos(this.yaw) * s * 2.5, vz: -Math.sin(this.yaw) * s * 2.5, vy: 3 + rnd() * 2, g: 11, life: 0.7, size: 0.34, floor: 0.03 });
        stretch = 1 + Math.sin(this.t * 30) * 0.03;
        if (this.stT <= 0) { this.set('idle', 1.0); audio.sfx('bossRoar', { vol: 0.6 }); this.sqV = 7; }
        break;
      }
      case 'dead': {
        this.vel.set(0, 0, 0); eyeT = 1.3; const k = clamp(this.e / 3.2);
        this.fl = Math.floor(this.t * 20) % 2 ? 0.8 : 0;
        if (rnd() < 0.5) { const a = rnd() * 6.28; fx.burst(rnd() < 0.5 ? P.dust : P.slime, this.pos.x + Math.cos(a) * 2, 0.5 + rnd() * 2, this.pos.z + Math.sin(a) * 2, 2, { speed: 3, up: 3, life: 0.6, size: 0.6 }); }
        if (Math.floor(this.e * 5) !== Math.floor((this.e - dt) * 5)) { audio.sfx('hitHard', { pitch: 0.6 + k }); fx.shake(0.15, 0.2); }
        this.m.sq.scale.set(1 + k * 0.4, Math.max(0.05, 1 - k * 0.95), 1 + k * 0.3);
        if (!this.popped && k > 0.45) { this.popped = true; audio.sfx('sprout', { pitch: 0.6 }); this.m.cork.visible = false; for (let i = 0; i < 16; i++) fx.burst(P.cork, this.pos.x, 2.2, this.pos.z, 1, { speed: 4, up: 8, g: 12, life: 1.2, size: 0.5, floor: 0.05, bounce: 0.4 }); fx.ring(this.pos.x, 0.05, this.pos.z, { r1: 8, t: 0.7, c: 7, th: 0.5 }); }
        if (this.stT <= 0) {
          fx.flash(7, 0.25); fx.burst(P.dust, this.pos.x, 0.6, this.pos.z, 30, { speed: 5, up: 4, g: -1, life: 1, size: 0.9 }); fx.burst(P.star, this.pos.x, 1, this.pos.z, 20, { speed: 6, up: 6, g: 6, life: 0.9, size: 0.5 });
          G.drop(this.pos.x, 0.5, this.pos.z, { tears: 14, big: true }); const L_ = this.level; this.kill(); run(bossEnd(L_, this)); return;
        }
        break;
      }
    }
    else { this.vel.x *= 0.8; this.vel.z *= 0.8; }
    // movimiento y muros
    if (this.st !== 'dead' && this.st !== 'sleep') {
      const ox = this.pos.x, oz = this.pos.z;
      this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
      const cx = clamp(this.pos.x, -8.4, 8.4), cz = clamp(this.pos.z, -69.4, -54.6);
      if ((cx !== this.pos.x || cz !== this.pos.z) && this.st === 'charge') this.hitWall = true;
      this.pos.x = cx; this.pos.z = cz;
      const sp = Math.hypot(this.vel.x, this.vel.z);
      this.trail -= dt * sp; if (this.trail <= 0 && sp > 0.5) { this.trail = 2.2; L.add(new Slime(this.pos.x - Math.sin(this.yaw) * 2.4, 0, this.pos.z - Math.cos(this.yaw) * 2.4, 1.3, 5 + this.phase)); }
      this.fit();
      // contacto
      if (this.st !== 'cry' && this.st !== 'stun' && G.lock <= 0) {
        const lx = dx * Math.cos(this.yaw) - dz * Math.sin(this.yaw), lz = dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw);
        if (Math.abs(lx) < 1.35 + p.r && Math.abs(lz) < 2.3 + p.r && p.pos.y < 2) p.hurt(1, this.pos.x, this.pos.z, { heavy: this.st === 'charge', knock: this.st === 'charge' ? 11 : 7 });
      }
    }
    // animación
    this.fl = Math.max(0, this.fl - dt * 4); for (const m of this.m.mats) m.uniforms.uFlash.value = this.fl;
    this.sqV += (1 - this.sqY) * 120 * dt; this.sqV *= Math.max(0, 1 - 7 * dt); this.sqY = clamp(this.sqY + this.sqV * dt * 0.1, 0.6, 1.4);
    if (this.st !== 'dead' && this.st !== 'wake' && this.st !== 'sleep') { const sy = this.sqY, sx = 1 / Math.sqrt(sy); this.m.sq.scale.set(sx, sy, sx * stretch); }
    this.rear = lerp(this.rear || 0, rear, 0.2); this.m.sq.rotation.x = -this.rear * 0.28;
    this.eye = lerp(this.eye, eyeT, 1 - Math.exp(-8 * dt));
    for (const s of this.m.stalks) { s.st.rotation.x = 0.3 + this.eye + Math.sin(this.t * 2 + s.st.position.x * 3) * 0.08; s.st.rotation.z = Math.sin(this.t * 1.6 + s.st.position.x) * 0.08; s.e.visible = this.st !== 'cry' && this.st !== 'dead'; s.ec.visible = !s.e.visible; }
    this.sync(); this.obj.rotation.y = this.yaw;
  }
}
