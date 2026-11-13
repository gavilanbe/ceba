// player.js — Ceba: correr, rodar, la Hoja, trepar, flotar, pelarse y plantarse.
import { THREE } from './gfx.js';
import { makeCeba } from './art/hero.js';
import { makeTube } from './art/pulpa.js';
import { G } from './state.js';
import { input } from './input.js';
import { fx, P, Trail, rnd } from './fx.js';
import { audio } from './audio.js';
import { STEP } from './world.js';
import { clamp, lerp, ease } from './px.js';

export const SCALE = [0.5, 0.66, 0.83, 1, 1.07, 1.13, 1.18, 1.22];
const SPEED = 4.4, GRAV = 24;
export const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const turn = (a, b, max) => { const d = angDiff(a, b); return a + clamp(d, -max, max); };
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);

export class Player {
  constructor() {
    this.m = makeCeba(); this.obj = this.m.root;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0;
    this.state = 'free'; this.st = 0; this.onGround = true; this.swim = false; this.groundY = 0; this.groundMat = 'stone';
    this.layers = 3; this.maxLayers = 3; this.crack = false; this.inv = 0;
    this.sc = 1; this.scFrom = 1; this.scT = 1;
    this.phase = 0; this.sqV = 0; this.sqY = 1; this.blinkT = 2; this.faceHold = 0; this.faceOv = null;
    this.combo = 0; this.buffer = false; this.drawn = 0; this.hitDone = false; this.swingHits = new Set();
    this.pushT = 0; this.climbT = 0; this.stepT = 0; this.rollCd = 0; this.safe = new THREE.Vector3(); this.safeT = 0;
    this.auto = null; this.trail = new Trail(10, 7, 11); this.idleT = 0; this.rollA = 0; this.lean = 0; this.yawV = 0;
    this.rootAt = null; this.airT = 0; this.wasSwim = false; this.sink = 0; this.strainT = 0; this.slimeT = 0;
    this.hidden = false; this.kb = new THREE.Vector3(); this.chg = 0; this.chgOn = false; this.whipCd = 0;
  }
  get scale() { return SCALE[clamp(this.layers, 0, 7)]; }
  get r() { return 0.4 * this.scale; }
  get h() { return 0.95 * this.scale; }
  get small() { return this.layers <= 1; }
  get big() { return this.layers >= 3; }
  get busy() { return this.state !== 'free'; }
  place(x, y, z, yaw = 0) { this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.onGround = true; this.groundY = y; this.safe.copy(this.pos); this.state = 'free'; this.st = 0; this.sink = 0; this.sync(); }
  setLayers(n, instant = false) {
    this.layers = n; this.m.setLayers(n);
    if (instant) { this.sc = this.scale; this.scT = 9; } else { this.scFrom = this.sc; this.scT = 0; }
  }
  set(state) { this.state = state; this.st = 0; }
  face(n, hold = 0.6) { this.m.setFace(n); this.faceHold = hold; }

  // ───────── daño, pelado, curas ─────────
  hurt(dmg = 1, fx_ = 0, fz_ = 0, o = {}) {
    if (this.inv > 0 || this.state === 'dead' || this.state === 'peel' || this.state === 'cine' || G.lock > 0) return false;
    if (this.state === 'root') { this.rootAt = null; this.sink = 0; }
    let dx = this.pos.x - fx_, dz = this.pos.z - fz_; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const k = o.knock ?? 6;
    this.vel.x = dx * k; this.vel.z = dz * k; this.vel.y = this.swim ? 0 : 4.5; this.onGround = false;
    this.inv = 1.3; this.chgOn = false; this.set('hurt'); this.face('hurt', 0.7); this.sqV = -6;
    this.m.draw(false); this.drawn = 0; this.trail.reset();
    if (!this.crack) {
      this.crack = true; audio.sfx('hurt'); fx.shake(0.12, 0.2); fx.stop(0.05);
      fx.burst(P['flake' + clamp(this.layers, 1, 3)], this.pos.x, this.pos.y + 0.5, this.pos.z, 5, { speed: 2, up: 2.5, life: 0.6, size: 0.28 });
      if (G.ui) G.ui.onCrack();
    } else { if (G.ui) G.ui.onHurt(); this.loseLayer(false); }
    return true;
  }
  loseLayer(voluntary) {
    const from = this.layers, p = this.pos;
    this.crack = false;
    G.spawnPeel(p.x, this.swim ? p.y + 0.2 : this.groundY, p.z, this.yaw, from, voluntary, SCALE[from]);
    this.setLayers(from - 1);
    audio.sfx('peel'); audio.sfx('gas');
    fx.shake(0.22, 0.35); fx.stop(0.09); fx.flash(7, 0.08);
    fx.burst(P['flake' + clamp(from, 1, 3)], p.x, p.y + 0.5, p.z, 14, { speed: 3.2, up: 4, life: 0.9, size: 0.3, floor: this.groundY + 0.05, bounce: 0.3 });
    G.gas(p.x, p.y + 0.3, p.z, 4.4);
    this.m.flash(1);
    if (G.ui) G.ui.onLayer(from, this.layers, voluntary);
    if (this.layers <= 0) this.die();
  }
  heal(n = 1) {
    if (this.layers >= this.maxLayers && !this.crack) return false;
    this.crack = false; const up = this.layers < this.maxLayers;
    if (this.layers < this.maxLayers) {
      this.setLayers(Math.min(this.maxLayers, this.layers + n));
      fx.ring(this.pos.x, this.pos.y + 0.1, this.pos.z, { r0: 0.2, r1: 1.3, t: 0.4, c: 11, th: 0.25 });
      fx.burst(P.sqG, this.pos.x, this.pos.y + 0.4, this.pos.z, 8, { speed: 1.6, up: 3, g: 5, life: 0.6, size: 0.2 });
      this.sqV = 7;
    }
    audio.sfx('ring'); if (G.ui) G.ui.onHeal(up);
    this.face('happy', 0.6);
    return true;
  }
  die() {
    this.set('dead'); this.vel.set(0, 5, 0); this.inv = 99; this.face('hurt', 99); audio.sfx('die'); audio.music(null, { fade: 0.4 });
    G.onDeath();
  }
  // usar el Mondador: pelarse a propósito
  peel() {
    if (this.busy || !this.onGround && !this.swim) return;
    if (this.layers <= 1) { audio.sfx('error'); this.face('sad', 0.8); fx.one(P.sweat, this.pos.x + 0.3, this.pos.y + this.h, this.pos.z, { vy: 1.5, g: 6, life: 0.5, size: 0.3 }); G.hintOnce('ultima', 'ULTIMA'); return; }
    this.set('peel'); this.vel.x = this.vel.z = 0; this.face('effort', 1); audio.sfx('root', { pitch: 1.6 });
  }
  startRoot(b) {
    if (this.busy) return;
    this.set('root'); this.rootAt = b; this.vel.set(0, 0, 0); this.rootN = 0; this.rootDone = 0;
    audio.sfx('root'); this.face('sleep', 99); this.m.draw(false); this.drawn = 0;
  }
  useItem(id) { if (id === 'mondador') this.peel(); else if (id === 'ajo') this.dropBomb(); else if (id === 'cerbatana') this.startShoot(); else if (id === 'zarcillo') this.startWhip(); }
  // el zarcillo: látigo-gancho
  startWhip() {
    if (this.busy || this.swim || this.whipCd > 0) { if (this.swim) audio.sfx('error'); return; }
    this.set('whip'); this.chgOn = false; this.m.draw(false); this.drawn = 0; this.face('effort', 0.4); this.sqV = -5; G.whip(this);
  }
  // el ajo bravo: lo planta delante con la mecha encendida
  dropBomb() {
    if (this.busy || this.swim) { audio.sfx('error'); return; }
    if ((G.save.ajos || 0) <= 0) { audio.sfx('error'); this.face('sad', 0.6); fx.one(P.ask, this.pos.x, this.pos.y + this.h + 0.5, this.pos.z, { vy: 0.8, life: 0.6, size: 0.42 }); G.hintOnce('sinajos', 'SINAJOS'); return; }
    if (G.level.ents.filter(e => e.fuse > 0 && !e.dead).length >= 3) { audio.sfx('error'); return; }
    G.save.ajos--; if (G.ui) G.ui.onAmmo();
    const d = this.r + 0.45, x = this.pos.x + Math.sin(this.yaw) * d, z = this.pos.z + Math.cos(this.yaw) * d;
    const ok = G.level.free(x, this.pos.y + 0.4, z, 0.3, 0.4);
    G.spawnBomb(ok ? x : this.pos.x, this.pos.y + 0.25, ok ? z : this.pos.z);
    audio.sfx('root', { pitch: 1.4 }); this.strainT = 0.22; this.face('brave', 0.5); this.sqV = -4;
  }
  startShoot() {
    if (this.busy || this.swim || this.shotCd > 0) { if (this.swim) audio.sfx('error'); return; }
    this.set('shoot'); this.fired = false; this.m.draw(false); this.drawn = 0; this.face('effort', 0.4);
    if (!this.tube) { this.tube = makeTube(); this.m.sq.add(this.tube); }
    this.tube.visible = true;
  }

  // ───────── actualización ─────────
  update(dt) {
    const L = G.level, p = this.pos, v = this.vel, m = this.m;
    this.st += dt; this.inv = Math.max(0, this.inv - dt); this.rollCd -= dt; this.whipCd -= dt; this.shotCd = (this.shotCd || 0) - dt; if (this.tube && this.state !== 'shoot') this.tube.visible = false; this.drawn -= dt; this.faceHold -= dt;
    const ctl = G.lock <= 0 && this.state !== 'dead' && this.state !== 'cine';
    // dirección pedida en el mundo
    let mx = 0, mz = 0;
    if (this.auto) {
      const dx = this.auto.x - p.x, dz = this.auto.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { const cb = this.auto.done; this.auto = null; if (cb) cb(); }
      else { const s = Math.min(1, this.auto.speed ?? 0.7); mx = dx / d * s; mz = dz / d * s; }
    } else if (ctl) {
      const cy = G.cam.yaw, ax = input.ax, ay = input.ay;
      mx = Math.cos(cy) * ax + Math.sin(cy) * ay; mz = -Math.sin(cy) * ax + Math.cos(cy) * ay;
    }
    const mag = Math.min(1, Math.hypot(mx, mz));
    const tgt = G.target && !G.target.dead ? G.target : null;
    let speedMul = 1;
    if (this.small) speedMul *= 1.12;
    if (this.slimeT > 0) { this.slimeT -= dt; speedMul *= 0.45; }
    if (this.swim) speedMul *= 0.6;

    switch (this.state) {
      case 'free': {
        const want = SPEED * speedMul * (tgt || input.down.z && ctl ? 0.8 : 1) * (this.chgOn ? 0.55 : 1);
        const acc = (this.onGround ? 34 : 9) * dt;
        const tx = mx * want, tz = mz * want;
        const dx = tx - v.x, dz = tz - v.z, dd = Math.hypot(dx, dz);
        if (dd <= acc) { v.x = tx; v.z = tz; } else { v.x += dx / dd * acc; v.z += dz / dd * acc; }
        const oy = this.yaw;
        if (tgt) this.yaw = turn(this.yaw, Math.atan2(tgt.pos.x - p.x, tgt.pos.z - p.z), 12 * dt);
        else if (mag > 0.1 && !(ctl && input.down.z)) this.yaw = turn(this.yaw, Math.atan2(mx, mz), 13 * dt);
        this.yawV = lerp(this.yawV, angDiff(oy, this.yaw) / Math.max(dt, 1e-4), 0.2);
        if (ctl) {
          // botón A: lo que toque, o rodar
          if (input.pressed.a) {
            if (G.actionEnt && G.actionEnt.interact) { input.pressed.a = false; G.actionEnt.interact(this); }
            else if ((this.onGround) && mag > 0.3 && this.rollCd <= 0) { input.pressed.a = false; this.startRoll(mx, mz, mag); }
          }
          // remolino: se carga manteniendo el tajo y se suelta
          if (this.chgOn) {
            if (this.swim || !m.hasHoja) this.chgOn = false;
            else if (input.down.b) {
              const was = this.chg; this.chg += dt; m.draw(true); this.drawn = 1;
              if (was < 0.5 && this.chg >= 0.5) { audio.sfx('blip', { pitch: 1.9 }); audio.sfx('ring', { pitch: 1.6, vol: 0.5 }); m.flash(0.7); fx.ring(p.x, this.groundY + 0.05, p.z, { r0: 1.6, r1: 0.3, t: 0.25, c: 11, th: 0.2 }); this.sqV = 4; }
              if (rnd() < (this.chg >= 0.5 ? 0.7 : 0.25)) { const a = rnd() * 6.283, rr = this.chg >= 0.5 ? 0.5 : 1.1; fx.one(this.chg >= 0.5 ? P.star : P.sqG, p.x + Math.cos(a) * rr, p.y + 0.3 + rnd() * 0.7, p.z + Math.sin(a) * rr, { vx: -Math.cos(a) * 2, vz: -Math.sin(a) * 2, vy: 0.6, life: 0.3, size: this.chg >= 0.5 ? 0.3 : 0.14 }); }
            } else { this.chgOn = false; if (this.chg >= 0.5 && this.onGround) this.startSpin(); }
          }
          if (input.pressed.b) {
            input.pressed.b = false;
            if (this.swim) { audio.sfx('error'); }
            else if (m.hasHoja && !this.onGround && this.airT > 0.1 && p.y - this.groundY > 0.9) this.startPlunge();
            else if (m.hasHoja) this.startAttack(1);
            else { audio.sfx('error'); this.face('sad', 0.5); fx.one(P.ask, p.x, p.y + this.h + 0.5, p.z, { vy: 0.8, life: 0.6, size: 0.42 }); G.hintOnce('sinhoja', 'SINHOJA'); }
          }
          for (let i = 0; i < 3; i++) if (input.pressed['c' + (i + 1)]) { input.pressed['c' + (i + 1)] = false; const it = G.save.c[i]; if (it) this.useItem(it); else audio.sfx('error'); }
        }
        break;
      }
      case 'roll': {
        const f = this.st / 0.46;
        const s = lerp(8.6, 5.2, f) * speedMul * (this.small ? 1.05 : 1);
        v.x = Math.sin(this.yaw) * s; v.z = Math.cos(this.yaw) * s;
        if (mag > 0.2) this.yaw = turn(this.yaw, Math.atan2(mx, mz), 2.4 * dt);
        this.rollA += dt * 17;
        if (rnd() < 0.5) fx.dust(p.x, p.y, p.z, 1, { dark: L.dark > 0.3 });
        if (f >= 1) { this.set('free'); this.rollCd = 0.12; this.sqV = 3; }
        break;
      }
      case 'attack': {
        const D = [0, 0.24, 0.24, 0.42][this.combo], f = this.st / D;
        const lunge = this.combo === 3 ? 3.4 : 2.2;
        const k = f < 0.45 ? lunge : 0;
        v.x = lerp(v.x, Math.sin(this.yaw) * k, 0.4); v.z = lerp(v.z, Math.cos(this.yaw) * k, 0.4);
        if (tgt) this.yaw = turn(this.yaw, Math.atan2(tgt.pos.x - p.x, tgt.pos.z - p.z), 14 * dt);
        else if (mag > 0.3 && f < 0.3) this.yaw = turn(this.yaw, Math.atan2(mx, mz), 10 * dt);
        if (ctl && input.pressed.b) { input.pressed.b = false; this.buffer = true; }
        if (!this.hitDone && f >= 0.28) { this.hitDone = true; this.strike(); }
        if (f >= 1) {
          if (this.buffer && this.combo < 3) this.startAttack(this.combo + 1);
          else { const last = this.combo; this.set('free'); this.drawn = 2.2; this.combo = 0; this.trail.reset(); if (ctl && input.down.b && !this.buffer) { this.chgOn = true; this.chg = 0; } if (last === 3) G.hintOnce('tecnicas', 'H_TECNICAS'); }
        }
        break;
      }
      case 'spin': {
        // remolino: una vuelta entera con la Hoja tendida
        const f = this.st / 0.44;
        v.x = lerp(v.x, mx * 2.2, 0.2); v.z = lerp(v.z, mz * 2.2, 0.2);
        if (!this.hitDone && f >= 0.18) { this.hitDone = true; this.spinHit(); }
        if (f >= 1) { this.set('free'); this.drawn = 2.2; this.trail.reset(); }
        break;
      }
      case 'plunge': {
        // picado: se encoge un instante en el aire y cae de punta
        v.x *= 1 - Math.min(1, 6 * dt); v.z *= 1 - Math.min(1, 6 * dt);
        if (this.st > 0.13) v.y = Math.min(v.y, -21);
        if (this.swim || this.st > 2.5) { this.set('free'); this.trail.reset(); }
        else if (this.onGround && this.st > 0.05) this.slam();
        break;
      }
      case 'whip': { v.x *= 1 - Math.min(1, 10 * dt); v.z *= 1 - Math.min(1, 10 * dt); if (this.st > 1.6) this.set('free'); break; }
      case 'hook': { this.swim = false; this.onGround = false; this.sync(dt); if (this.st > 1.5) this.set('free'); return; }
      case 'shoot': {
        // toma aire, sopla y la caña da un latigazo
        v.x *= 1 - Math.min(1, 9 * dt); v.z *= 1 - Math.min(1, 9 * dt);
        if (tgt) this.yaw = turn(this.yaw, Math.atan2(tgt.pos.x - p.x, tgt.pos.z - p.z), 16 * dt);
        else if (mag > 0.3 && !this.fired) this.yaw = turn(this.yaw, Math.atan2(mx, mz), 9 * dt);
        if (this.st < 0.1) this.sqY = lerp(this.sqY, 1.12, 0.3);
        else if (!this.fired) { this.fired = true; G.shootSeed(this); this.sqV = -7; this.face('wow', 0.25); }
        if (this.st > 0.26) { this.set('free'); this.shotCd = 0.12; if (this.tube) this.tube.visible = false; }
        break;
      }
      case 'hurt': {
        v.x *= 1 - 3 * dt; v.z *= 1 - 3 * dt;
        if (this.st > 0.38 && (this.onGround || this.swim)) this.set('free');
        break;
      }
      case 'peel': {
        v.x = v.z = 0;
        if (this.st < 0.28) { this.sqY = lerp(this.sqY, 0.72, 0.3); if (rnd() < 0.4) fx.one(P.sweat, p.x + (rnd() - 0.5) * 0.6, p.y + this.h, p.z + (rnd() - 0.5) * 0.6, { vy: 2, g: 8, life: 0.4, size: 0.24 }); }
        else if (!this.peeled) { this.peeled = true; this.loseLayer(true); this.sqV = 9; this.vel.y = 4.2; this.onGround = false; this.face('wow', 0.5); this.inv = 0.5; }
        if (this.st > 0.62) { this.peeled = false; if (this.state === 'peel') this.set('free'); }
        break;
      }
      case 'root': {
        v.x = v.z = 0; const b = this.rootAt;
        if (b) { p.x = lerp(p.x, b.pos.x, 0.2); p.z = lerp(p.z, b.pos.z, 0.2); }
        this.sink = lerp(this.sink, 0.42, 0.14);
        if (rnd() < 0.25) fx.one(P.sqG, p.x + (rnd() - 0.5) * 0.8, p.y + 0.1, p.z + (rnd() - 0.5) * 0.8, { vy: 1 + rnd(), g: -1, life: 0.6, size: 0.14 });
        this.rootN += dt;
        if (this.rootN > 0.55 && (this.layers < this.maxLayers || this.crack)) { this.rootN = 0; this.heal(1); this.face('sleep', 99); }
        const full = this.layers >= this.maxLayers && !this.crack;
        if (full) this.rootDone += dt;
        if ((full && this.rootDone > 0.55) || (this.st > 0.5 && ctl && (input.pressed.a || input.pressed.b || mag > 0.6))) {
          input.pressed.a = input.pressed.b = false;
          this.set('free'); this.sink = 0; v.y = 5.2; this.onGround = false; this.sqV = 8; audio.sfx('sprout'); this.face('happy', 0.9);
          fx.burst(P.dustD, p.x, p.y + 0.1, p.z, 8, { speed: 2, up: 2.5, g: 8, life: 0.5, size: 0.3 });
          if (b && b.onLeave) b.onLeave(this, full);
          this.rootAt = null;
        }
        break;
      }
      case 'climb': {
        const c = this.climb, f = Math.min(1, this.st / 0.3);
        const e = ease.io(f);
        p.x = lerp(c.x0, c.x1, Math.max(0, e * 1.6 - 0.6)); p.z = lerp(c.z0, c.z1, Math.max(0, e * 1.6 - 0.6));
        p.y = lerp(c.y0, c.y1, Math.min(1, e * 1.5));
        v.set(0, 0, 0);
        if (f >= 1) { this.set('free'); this.onGround = true; this.groundY = c.y1; this.sqV = -3; fx.dust(p.x, p.y, p.z, 2); }
        this.sync(dt); return;
      }
      case 'dead': {
        v.x = v.z = 0; this.rollA += dt * 9;
        break;
      }
      case 'cine': { v.x = lerp(v.x, mx * SPEED, 0.3); v.z = lerp(v.z, mz * SPEED, 0.3); if (mag > 0.1) this.yaw = turn(this.yaw, Math.atan2(mx, mz), 10 * dt); break; }
    }
    this.move(dt, mx, mz, mag);
    this.sync(dt);
  }

  startRoll(mx, mz, mag) {
    this.set('roll'); this.yaw = Math.atan2(mx, mz); this.rollA = 0; audio.sfx('roll'); this.m.draw(false); this.drawn = 0;
    fx.dust(this.pos.x, this.pos.y, this.pos.z, 4);
  }
  startAttack(n) {
    this.combo = n; this.set('attack'); this.buffer = false; this.hitDone = false; this.swingHits.clear();
    this.m.draw(true); this.drawn = 3; audio.sfx('swing' + n); this.face('brave', 0.5); this.trail.reset();
    if (n === 3) this.sqV = 5;
  }
  startSpin() {
    this.set('spin'); this.hitDone = false; this.m.draw(true); this.drawn = 3; this.face('brave', 0.6); this.trail.reset(); this.sqV = 6;
    audio.sfx('swing3', { pitch: 0.75 }); audio.sfx('swing1', { pitch: 1.3 });
  }
  startPlunge() {
    this.set('plunge'); this.chgOn = false; this.m.draw(true); this.drawn = 3; this.face('brave', 0.8); this.trail.reset();
    this.vel.y = Math.max(this.vel.y * 0.3, 4.5); this.sqV = 6; audio.sfx('swing2', { pitch: 0.8 });
  }
  // golpe en redondo alrededor de (x, z): remolino y picado
  areaHit(x, z, r, dmg, o = {}) {
    const p = this.pos; let any = false, bounced = false;
    for (const e of G.level.ents.slice()) {
      if (e.dead || (!e.hit && !e.cut)) continue;
      const dx = e.pos.x - x, dz = e.pos.z - z, d = Math.hypot(dx, dz);
      if (d > r + (e.r || 0.4) || Math.abs(e.pos.y - p.y) > 1.7 + (e.hh || 0)) continue;
      if (e.cut) { e.cut(this); any = true; continue; }
      const res = e.hit({ dmg, from: this, dx: dx / (d || 1), dz: dz / (d || 1), heavy: true, ...o });
      if (res === 'bounce') bounced = true; else if (res) any = true;
    }
    if (bounced && !any) audio.sfx('bounce');
    return any;
  }
  spinHit() {
    const p = this.pos, r = 2.25 * (0.6 + 0.4 * this.scale), any = this.areaHit(p.x, p.z, r, 2, { spin: true });
    fx.ring(p.x, this.groundY + 0.05, p.z, { r0: 0.4, r1: r + 0.3, t: 0.3, c: 11, th: 0.45 }); fx.ring(p.x, this.groundY + 0.05, p.z, { r0: 0.3, r1: r, t: 0.38, c: 7, th: 0.2 });
    fx.dust(p.x, this.groundY, p.z, 6, { dark: G.level.dark > 0.3 }); fx.shake(any ? 0.22 : 0.1, 0.2); if (any) fx.stop(0.09);
  }
  slam() {
    const p = this.pos, r = 2.1 * (0.6 + 0.4 * this.scale), any = this.areaHit(p.x, p.z, r, 2, { slam: true });
    this.set('free'); this.drawn = 1.6; this.trail.reset(); this.sqV = -11; this.rollCd = 0.15;
    audio.sfx('land'); audio.sfx('bounce', { pitch: 0.55 }); fx.shake(0.3, 0.3); fx.stop(any ? 0.1 : 0.04);
    fx.ring(p.x, this.groundY + 0.05, p.z, { r0: 0.3, r1: r + 0.4, t: 0.32, c: 7, th: 0.5 }); fx.ring(p.x, this.groundY + 0.05, p.z, { r0: 0.2, r1: r, t: 0.45, c: 10, th: 0.22 });
    fx.dust(p.x, this.groundY, p.z, 9, { dark: G.level.dark > 0.3, speed: 2.4 }); fx.burst(P.star, p.x, p.y + 0.3, p.z, 6, { speed: 3.4, up: 3, g: 8, life: 0.4, size: 0.36 });
    for (const e of G.level.ents) if (e.onBonkNear && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 2.6) e.onBonkNear(this);
  }
  // el tajo: quién está en el arco
  strike() {
    const L = G.level, p = this.pos, big = this.combo === 3;
    const reach = (big ? 1.75 : 1.5) * (0.6 + 0.4 * this.scale), arc = big ? 1.15 : 1.35;
    let any = false, bounced = false;
    for (const e of L.ents.slice()) {
      if (e.dead || (!e.hit && !e.cut)) continue;
      const dx = e.pos.x - p.x, dz = e.pos.z - p.z, d = Math.hypot(dx, dz);
      if (d > reach + (e.r || 0.4)) continue;
      if (Math.abs(e.pos.y - p.y) > 1.6 + (e.hh || 0)) continue;
      if (d > 0.3 && Math.abs(angDiff(this.yaw, Math.atan2(dx, dz))) > arc) continue;
      if (e.cut) { e.cut(this); any = true; continue; }
      const res = e.hit({ dmg: big ? 2 : 1, from: this, dx: dx / (d || 1), dz: dz / (d || 1), heavy: big });
      if (res === 'bounce') bounced = true; else if (res) any = true;
    }
    const hx = p.x + Math.sin(this.yaw) * reach * 0.8, hz = p.z + Math.cos(this.yaw) * reach * 0.8;
    if (bounced) { audio.sfx('bounce'); fx.shake(0.1, 0.15); this.vel.x = -Math.sin(this.yaw) * 5; this.vel.z = -Math.cos(this.yaw) * 5; fx.sparks(hx, p.y + 0.6, hz, 4); }
    if (any) { fx.stop(big ? 0.1 : 0.055); fx.shake(big ? 0.2 : 0.09, 0.18); }
    if (big) { fx.ring(hx, this.groundY, hz, { r0: 0.2, r1: 1.5, t: 0.3, c: 7, th: 0.22 }); fx.dust(hx, this.groundY, hz, 5); if (!any) audio.sfx('land'); }
    // pared delante
    if (!any && !bounced && !L.free(hx, p.y + 0.5, hz, 0.1, 0.2)) { fx.sparks(hx, p.y + 0.6, hz, 3); audio.sfx('bounce', { vol: 0.5, pitch: 1.4 }); }
  }

  move(dt, mx, mz, mag) {
    const L = G.level, p = this.pos, v = this.vel, r = this.r, h = this.h, small = this.small;
    p.x += v.x * dt; p.z += v.z * dt;
    const hits = L.collide(p, r, h, null, small);
    const sp = Math.hypot(v.x, v.z);
    // choques: trepar, empujar, rebotar
    let pushing = false;
    for (const hi of hits) {
      const s = hi.s, into = this.state === 'roll' ? (Math.sin(this.yaw) * -hi.nx + Math.cos(this.yaw) * -hi.nz) : (mag > 0.3 ? (mx * -hi.nx + mz * -hi.nz) / mag : 0);
      if (this.state === 'roll' && s.ent && s.ent.fragile) { s.ent.smash(this); continue; }
      if (this.state === 'roll' && into > 0.72 && this.st > 0.05) { this.bonk(hi); return; }
      if (into < 0.6) continue;
      if (this.state !== 'free') continue;
      const top = L.topOf(s, p.x, p.z), dh = top - p.y;
      if (s.ent && s.ent.pushable && this.onGround && !(s.ent.stuckT > 0)) {
        pushing = true; this.pushT += dt; { const k = v.x * -hi.nx + v.z * -hi.nz; v.x = -hi.nx * Math.max(0, k); v.z = -hi.nz * Math.max(0, k); }
        if (this.pushT > 0.28) { this.pushT = 0; s.ent.tryPush(Math.abs(hi.nx) > Math.abs(hi.nz) ? -Math.sign(hi.nx) : 0, Math.abs(hi.nx) > Math.abs(hi.nz) ? 0 : -Math.sign(hi.nz), this); }
        continue;
      }
      if (!s.ramp && !s.noClimb && dh > STEP && dh <= 1.32 + (this.swim ? 0.2 : 0)) {
        const tx = p.x - hi.nx * (r + 0.28), tz = p.z - hi.nz * (r + 0.28);
        if (L.free(tx, top + 0.03, tz, r * 0.7, h * 0.8)) {
          pushing = true; this.climbT += dt;
          if (this.climbT > (this.onGround ? 0.13 : 0.02)) {
            this.climbT = 0; this.set('climb'); this.climb = { x0: p.x, z0: p.z, y0: p.y, x1: tx, z1: tz, y1: top };
            this.yaw = Math.atan2(-hi.nx, -hi.nz); this.face('effort', 0.4); audio.sfx('jump', { pitch: 0.8 });
            return;
          }
        }
      }
    }
    if (!pushing) { this.pushT = 0; this.climbT = 0; }
    // vertical
    const w = L.waterAt(p.x, p.z), floatY = w ? w.y - h * 0.6 : -1e9;
    const g = L.ground(p.x, p.z, p.y, r * 0.6, null, small);
    this.groundY = Math.max(g.y, -50);
    const wasGround = this.onGround, wasSwim = this.swim;
    this.swim = false;
    if (w && floatY > g.y + 0.04 && p.y <= floatY + 0.12 && this.state !== 'dead') {
      // flota: las cebollas flotan
      this.swim = true; this.onGround = false;
      if (!wasSwim) { audio.sfx('splash'); fx.burst(P.drop, p.x, w.y, p.z, 10, { speed: 2.4, up: 4, life: 0.6, size: 0.3 }); fx.ring(p.x, w.y, p.z, { r0: 0.3, r1: 1.6, t: 0.5, c: 7, th: 0.15 }); v.y *= 0.3; }
      v.y += ((floatY + Math.sin(G.t * 3) * 0.04 - p.y) * 30 - v.y * 6) * dt;
      p.y += v.y * dt;
      if (p.y < g.y) p.y = g.y;
      this.groundY = w.y - 0.01;
      this.rip = (this.rip || 0) - dt * (0.4 + sp);
      if (this.rip <= 0) { this.rip = 0.7; fx.ring(p.x, w.y, p.z, { r0: 0.35 * this.scale, r1: 1.1, t: 0.7, c: 7, th: 0.08, a: 0.8 }); if (sp > 1) audio.sfx('stepWater', { vol: 0.5 }); }
    } else {
      v.y -= GRAV * dt; p.y += v.y * dt;
      if (p.y <= g.y) {
        if (!wasGround && v.y < -3) this.land(v.y);
        p.y = g.y; v.y = 0; this.onGround = true; this.groundMat = g.s ? g.s.mat : 'stone'; this.airT = 0;
        if (g.s && g.s.ent && g.s.ent.onStand) g.s.ent.onStand(this);
      } else if (wasGround && v.y <= 0 && p.y - g.y <= STEP + 0.02) { p.y = g.y; v.y = 0; this.onGround = true; }
      else {
        if (wasGround && this.state === 'free' && sp > 2.6 && v.y <= 0 && !this.auto) { v.y = 6.4; audio.sfx('jump'); this.sqV = 6; const k = Math.max(1, 4.6 / sp); v.x *= k; v.z *= k; }
        else if (wasGround && this.state === 'roll' && v.y <= 0) { v.y = 5.2; this.sqV = 5; }
        this.onGround = false; this.airT += dt;
      }
    }
    // pasos
    if (this.onGround && sp > 0.8 && this.state === 'free') {
      this.stepT -= dt * sp;
      if (this.stepT <= 0) {
        this.stepT = 1.25 * this.scale + 0.3;
        const shallow = w && w.y > p.y;
        audio.sfx(shallow ? 'stepWater' : (this.groundMat === 'grass' || this.groundMat === 'dirt') ? 'step' : 'stepStone', { pitch: (0.9 + rnd() * 0.2) / (0.6 + 0.4 * this.scale), vol: 0.6 });
        if (shallow) fx.burst(P.drop, p.x, w.y, p.z, 3, { speed: 1.2, up: 2, life: 0.35, size: 0.22 });
        else if (sp > 3) fx.dust(p.x - Math.sin(this.yaw) * 0.2, p.y, p.z - Math.cos(this.yaw) * 0.2, 1, { dark: L.dark > 0.3, size: 0.24 });
      }
    }
    // último sitio seguro y caídas al vacío
    if (this.onGround && g.s && !g.s.ent && this.state === 'free') { this.safeT += dt; if (this.safeT > 0.4) { this.safeT = 0; this.safe.copy(p); } }
    if (p.y < L.killY && this.state !== 'dead') {
      this.place(this.safe.x, this.safe.y + 0.1, this.safe.z, this.yaw); this.inv = 0; fx.flash(0, 0.3);
      this.hurt(1, p.x, p.z, { knock: 0 });
    }
    // zonas
    for (const z of L.zones) {
      const inside = p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1 && p.y >= z.y0 && p.y <= z.y1;
      if (inside && !z.inside && !(z.once && z.done)) { z.done = true; z.fn(this, z); }
      if (!inside && z.inside && z.onExit) z.onExit(this, z);
      z.inside = inside;
    }
  }
  land(vy) {
    if (this.state === 'plunge') { this.slam(); return; }
    const p = this.pos, hard = vy < -9;
    this.sqV = hard ? -9 : -5; audio.sfx('land', { vol: hard ? 1 : 0.6 });
    fx.dust(p.x, p.y, p.z, hard ? 6 : 3, { dark: G.level.dark > 0.3 });
    if (hard) fx.shake(0.07, 0.12);
  }
  bonk(hi) {
    const p = this.pos;
    this.set('hurt'); this.vel.x = hi.nx * 3.6; this.vel.z = hi.nz * 3.6; this.vel.y = 4.6; this.onGround = false;
    audio.sfx('land'); audio.sfx('bounce', { pitch: 0.7 }); fx.shake(0.16, 0.22); fx.stop(0.04); this.face('hurt', 0.6); this.sqV = -8;
    fx.burst(P.star, p.x - hi.nx * 0.3, p.y + 0.7, p.z - hi.nz * 0.3, 6, { speed: 2.4, up: 3, g: 6, life: 0.55, size: 0.4 });
    if (hi.s.ent && hi.s.ent.onBonk) hi.s.ent.onBonk(this);
    for (const e of G.level.ents) if (e.onBonkNear && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 2.2) e.onBonkNear(this);
  }

  // ───────── animación procedural ─────────
  sync(dt = 0) {
    const m = this.m, p = this.pos, v = this.vel, sp = Math.hypot(v.x, v.z), t = G.t;
    // tamaño con rebote elástico
    this.scT += dt; this.sc = lerp(this.scFrom, this.scale, ease.elastic(clamp(this.scT / 0.55)));
    m.root.position.set(p.x, p.y - this.sink * this.sc, p.z); m.root.rotation.y = this.yaw; m.root.scale.setScalar(this.sc);
    m.root.visible = !this.hidden;
    // muelle de aplastar
    this.sqV += (1 - this.sqY) * 190 * dt; this.sqV *= Math.max(0, 1 - 11 * dt); this.sqY += this.sqV * dt * 0.1;
    this.sqY = clamp(this.sqY, 0.55, 1.5);
    let sy = this.sqY;
    if (!this.onGround && !this.swim && this.state !== 'climb') sy *= 1 + clamp(Math.abs(v.y) * 0.018, 0, 0.18);
    const sxz = 1 / Math.sqrt(sy);
    m.sq.scale.set(sxz, sy, sxz);
    const run = clamp(sp / SPEED), moving = this.onGround && sp > 0.3 && (this.state === 'free' || this.state === 'cine');
    if (moving) this.phase += dt * (5 + sp * 2.2) / (0.55 + 0.45 * this.sc);
    else this.phase = lerp(this.phase, Math.round(this.phase / Math.PI) * Math.PI, 0.2);
    const ph = this.phase, c = Math.cos(ph), s = Math.sin(ph);
    m.sq.position.y = moving ? Math.abs(s) * 0.07 * run : this.swim ? 0 : Math.sin(t * 2.4) * 0.012;
    // inclinación
    this.lean = lerp(this.lean, this.state === 'free' ? run * 0.2 : 0, 0.2);
    let tx = this.lean, tz = clamp(-this.yawV * 0.03, -0.3, 0.3);
    if (this.state === 'roll' || this.state === 'dead' || this.state === 'hook') tx = this.rollA;
    if (this.state === 'plunge') tx = 0.45;
    if (this.state === 'hurt') tx = -0.35;
    if (this.swim) { tx = Math.sin(t * 2.1) * 0.08 + run * 0.15; tz = Math.sin(t * 1.7) * 0.07; }
    if (this.strainT > 0) { this.strainT -= dt; tx = 0.3; }
    m.tilt.position.y = 0.48; m.sq.position.y -= 0.48;
    m.tilt.rotation.set(tx, 0, tz);
    // botas
    const rolling = this.state === 'roll' || this.state === 'dead' || this.state === 'hook' || this.swim || this.state === 'root';
    m.footL.visible = m.footR.visible = !rolling;
    const stride = 0.24 * run, lift = 0.15 * run;
    const air = !this.onGround && !this.swim;
    m.footL.position.set(0.2, air ? 0.06 : Math.max(0, c) * lift, air ? -0.12 : s * stride);
    m.footR.position.set(-0.2, air ? 0.1 : Math.max(0, -c) * lift, air ? 0.1 : -s * stride);
    m.footL.rotation.x = air ? 0.5 : -Math.max(0, c) * 0.6 * run; m.footR.rotation.x = air ? -0.3 : -Math.max(0, -c) * 0.6 * run;
    // manos
    const hy = 0.4 + Math.sin(t * 2.4) * 0.015;
    let L_ = [-0.6, hy, 0.06 + s * 0.24 * run], R_ = [0.6, hy, 0.06 - s * 0.24 * run];
    m.handL.rotation.set(0, 0, 0); m.handR.quaternion.identity();
    if (air) { L_ = [-0.66, 0.66, 0]; R_ = [0.66, 0.66, 0]; }
    if (this.swim) { L_ = [-0.66, 0.5 + Math.sin(t * 5) * 0.06 * (0.3 + run), 0.1 + c * 0.2 * run]; R_ = [0.66, 0.5 - Math.sin(t * 5) * 0.06 * (0.3 + run), 0.1 - c * 0.2 * run]; }
    if (this.state === 'roll') { L_ = [-0.4, 0.45, 0]; R_ = [0.4, 0.45, 0]; }
    if (this.state === 'root') { L_ = [-0.5, 0.62, 0.2]; R_ = [0.5, 0.62, 0.2]; }
    if (this.state === 'peel') { const k = Math.min(1, this.st / 0.28); L_ = [-0.42, 0.75 + k * 0.1, 0.2]; R_ = [0.42, 0.75 + k * 0.1, 0.2]; }
    if (this.state === 'climb') { L_ = [-0.4, 0.95, 0.35]; R_ = [0.4, 0.95, 0.35]; }
    if (this.strainT > 0) { L_ = [-0.3, 0.5, 0.55]; R_ = [0.3, 0.5, 0.55]; }
    if (this.state === 'shoot') { const k = this.fired ? 0.1 : 0; L_ = [-0.16, 0.5, 0.52 + k]; R_ = [0.16, 0.46, 0.74 + k]; if (this.tube) this.tube.position.set(0, 0.47, 0.42 + (this.fired ? Math.max(0, 0.12 - (this.st - 0.1) * 0.8) : -this.st * 0.4)); }
    if (this.state === 'whip') { L_ = [-0.5, 0.42, -0.1]; R_ = [0.3, 0.58, 0.6]; }
    if (this.state === 'hook') { L_ = [-0.3, 0.8, 0.4]; R_ = [0.3, 0.9, 0.5]; }
    if (this.pose) { if (this.pose.L) L_ = this.pose.L; if (this.pose.R) R_ = this.pose.R; }
    // la Hoja
    if (this.state === 'attack') {
      const D = [0, 0.24, 0.24, 0.42][this.combo], f = clamp(this.st / D), e = ease.out3(clamp(f * 1.5));
      let dir;
      if (this.combo === 1) { const a = lerp(2.2, -1.25, e); R_ = [Math.sin(a) * 0.62, 0.46 + Math.sin(e * 3.14) * 0.08, Math.cos(a) * 0.62]; dir = _v.set(Math.sin(a), 0.12, Math.cos(a)); }
      else if (this.combo === 2) { const a = lerp(-1.6, 1.5, e); R_ = [Math.sin(a) * 0.62, 0.5, Math.cos(a) * 0.62]; dir = _v.set(Math.sin(a), 0.05, Math.cos(a)); }
      else { const b = lerp(-0.7, 1.75, ease.back(clamp(f * 1.35))); R_ = [0.22, 0.5 + Math.cos(b) * 0.55, Math.sin(b) * 0.7]; dir = _v.set(0.1, Math.cos(b), Math.sin(b)); }
      m.handR.quaternion.setFromUnitVectors(UP, dir.normalize());
      L_ = [-0.55, 0.5, -0.15];
      m.tilt.rotation.y = this.combo === 1 ? lerp(0.5, -0.5, e) : this.combo === 2 ? lerp(-0.5, 0.5, e) : 0;
      if (this.combo === 3) m.tilt.rotation.x = lerp(-0.25, 0.4, e);
    } else if (this.state === 'spin') {
      const e = ease.out3(clamp(this.st / 0.44));
      m.tilt.rotation.y = -e * Math.PI * 2; R_ = [0.72, 0.5, 0.05]; L_ = [-0.6, 0.55, -0.1];
      m.handR.quaternion.setFromUnitVectors(UP, _v.set(1, 0.08, 0.15).normalize());
    } else if (this.state === 'plunge') {
      m.tilt.rotation.y = 0; R_ = [0.2, 0.42, 0.3]; L_ = [-0.2, 0.5, 0.3];
      m.handR.quaternion.setFromUnitVectors(UP, _v.set(0, -1, 0.25).normalize());
    } else {
      m.tilt.rotation.y = 0;
      if (m.hoja.visible && !this.pose) { R_ = [0.58, 0.42, 0.22]; m.handR.quaternion.setFromUnitVectors(UP, _v.set(0.25, 0.75, 0.6).normalize()); if (this.drawn <= 0) { m.draw(false); audio.sfx('swing1', { vol: 0.25, pitch: 1.6 }); } }
    }
    const hl = dt > 0 ? 0.45 : 1;
    m.handL.position.lerp(_a.set(L_[0], L_[1], L_[2]), hl); m.handR.position.lerp(_b.set(R_[0], R_[1], R_[2]), this.state === 'attack' || this.state === 'spin' || this.state === 'plunge' ? 1 : hl);
    // hojas: muelle
    const windy = Math.sin(t * 1.9) * 0.07;
    for (let i = 0; i < m.leaves.length; i++) {
      const l = m.leaves[i];
      const drive = -run * 0.5 - clamp(v.y * 0.05, -0.5, 0.5) + (this.state === 'root' ? Math.sin(t * 14 + i) * 0.12 : 0);
      l.v += ((drive - l.a) * 120 - l.v * 9) * dt; l.a += l.v * dt;
      l.p.rotation.x = l.lean + l.a * (0.6 + i * 0.2) + windy * (1 + i * 0.3);
      l.p.rotation.z = Math.sin(t * 2.3 + i * 2) * 0.05;
    }
    m.hojaBack.rotation.x = 0.12 + (m.leaves[0].a) * 0.4 + windy;
    // sombra
    const drop = Math.max(0, p.y - this.groundY);
    m.shadow.position.y = (this.groundY - (p.y - this.sink * this.sc)) / this.sc + 0.03;
    const ss = Math.max(0.35, 0.95 - drop * 0.12); m.shadow.scale.set(ss, 1, ss); m.shadow.visible = this.state !== 'root' && drop < 9;
    // destello de golpe / parpadeo de invulnerable
    const fl = m.mats[0].uniforms.uFlash.value;
    if (fl > 0) m.flash(Math.max(0, fl - dt * 5));
    m.hide(this.inv > 0 && this.state !== 'dead' && this.state !== 'peel' && Math.floor(t * 16) % 2 === 0 ? 0.55 : 0);
    // cara
    if (this.faceOv) m.setFace(this.faceOv);
    else if (this.faceHold <= 0) {
      this.blinkT -= dt;
      let f = this.state === 'roll' ? 'effort' : this.state === 'attack' || this.state === 'spin' || this.state === 'plunge' ? 'brave' : this.state === 'climb' ? 'effort' : this.crack ? 'sad' : 'normal';
      if (this.strainT > 0) f = 'effort';
      if (this.blinkT < 0.12 && (f === 'normal' || f === 'sad')) f = 'blink';
      if (this.blinkT <= 0) this.blinkT = 1.8 + rnd() * 3;
      m.setFace(f);
    }
    // estela
    if ((this.state === 'attack' || this.state === 'spin' || this.state === 'plunge') && m.hoja.visible) {
      m.root.updateMatrixWorld(true);
      const hm = m.hoja.children[0];
      this.trail.push(hm.localToWorld(_a.set(0, 0.3, 0)).clone(), hm.localToWorld(_b.set(0, 1.08, 0)).clone());
    }
  }
}
