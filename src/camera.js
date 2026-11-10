// camera.js — cámara de aventura: sigue perezosa por detrás, se recoloca con Z y fija objetivos.
import { THREE, W, H } from './gfx.js';
import { G } from './state.js';
import { input } from './input.js';
import { fx } from './fx.js';
import { audio } from './audio.js';
import { angDiff } from './player.js';
import { clamp, lerp, ease } from './px.js';

const _v = new THREE.Vector3(), _s = new THREE.Vector3();
export class Cam {
  constructor() {
    this.cam = new THREE.PerspectiveCamera(40, W / H, 0.15, 220);
    this.yaw = 0; this.pitch = 0.42; this.dist = 7; this.d = 7; this.at = new THREE.Vector3(); this.pos = new THREE.Vector3();
    this.shot = null; this.baseDist = 7; this.basePitch = 0.42; this.snap = 0; this.snapTo = 0; this.fov = 40; this.bars = 0; this.barsT = 0;
    this.blend = 0; this.from = { p: new THREE.Vector3(), l: new THREE.Vector3() }; this.zHeld = 0; this.look = new THREE.Vector3();
  }
  reset(yaw) { const p = G.player; if (yaw != null) this.yaw = yaw; this.at.set(p.pos.x, p.pos.y + 0.9, p.pos.z); this.d = this.dist = this.baseDist; this.pitch = this.basePitch; this.shot = null; this.blend = 0; this.place(); }
  // plano fijo de cine
  cut(px, py, pz, lx, ly, lz, fov = 40) { this.shot = { p: new THREE.Vector3(px, py, pz), l: new THREE.Vector3(lx, ly, lz), fov }; this.blend = 0; this.cam.position.set(px, py, pz); this.look.set(lx, ly, lz); this.fov = fov; }
  // generador: viaja hasta un plano
  *to(px, py, pz, lx, ly, lz, t = 1, fov = 40, ez = ease.io) {
    const p0 = this.cam.position.clone(), l0 = this.look.clone(), f0 = this.fov;
    const s = { p: p0.clone(), l: l0.clone(), fov: f0 }; this.shot = s; this.blend = 0;
    let e = 0;
    while (e < t) { e += yield; const k = ez(Math.min(1, e / t)); s.p.set(lerp(p0.x, px, k), lerp(p0.y, py, k), lerp(p0.z, pz, k)); s.l.set(lerp(l0.x, lx, k), lerp(l0.y, ly, k), lerp(l0.z, lz, k)); s.fov = lerp(f0, fov, k); }
  }
  // vuelve a la cámara de juego con fundido de posición
  release(t = 0.6) { if (!this.shot) return; this.from.p.copy(this.cam.position); this.from.l.copy(this.look); this.shot = null; this.blend = t; this.blendT = t; }
  findTarget() {
    const p = G.player, L = G.level; let best = null, bs = 1e9;
    const fx_ = -Math.sin(this.yaw), fz_ = -Math.cos(this.yaw);
    for (const e of L.ents) {
      if (e.dead || !e.targetable || e.hiddenT) continue;
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d > 11 || Math.abs(e.pos.y - p.pos.y) > 4) continue;
      const dot = (dx * fx_ + dz * fz_) / (d || 1);
      if (dot < -0.2 && d > 2.5) continue;
      const s = d * (1.6 - dot) * (e.enemy ? 0.7 : 1);
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }
  update(dt) {
    const p = G.player, L = G.level, c = this.cam;
    const want = G.lock <= 0 && G.mode === 'play';
    // fijar con Z
    if (want && input.pressed.z) {
      const t = this.findTarget();
      if (t) { G.target = t; audio.sfx('target'); if (t.onTarget) t.onTarget(); }
      else { this.snap = 0.22; this.snapTo = p.yaw + Math.PI; audio.sfx('untarget', { vol: 0.5 }); }
    }
    if (G.target && (!input.down.z || G.target.dead || !want || Math.hypot(G.target.pos.x - p.pos.x, G.target.pos.z - p.pos.z) > 14)) { G.target = null; if (want) audio.sfx('untarget'); }
    const tg = G.target;
    this.barsT = lerp(this.barsT, (tg || this.shot || G.cine) ? 1 : 0, 1 - Math.exp(-10 * dt));
    if (!this.shot) {
      const sp = Math.hypot(p.vel.x, p.vel.z);
      // foco
      const hy = 0.75 * p.sc + 0.35;
      _v.set(p.pos.x, p.pos.y + hy, p.pos.z);
      let dWant = this.baseDist * (0.72 + 0.28 * p.sc), pitch = this.basePitch;
      if (L.camBase) { dWant = L.camBase.dist; pitch = L.camBase.pitch; }
      if (L.camZone) { const z = L.camZone(p.pos); if (z) { if (z.dist) dWant = z.dist; if (z.pitch) pitch = z.pitch; } }
      if (tg) {
        const dx = tg.pos.x - p.pos.x, dz = tg.pos.z - p.pos.z, d = Math.hypot(dx, dz);
        _v.x += dx * 0.32; _v.z += dz * 0.32; _v.y += ((tg.pos.y + (tg.hh || 0.5)) - (p.pos.y + hy)) * 0.3;
        const ty = Math.atan2(-dx, -dz) + 0.42 * (this.side || 1);
        this.yaw += angDiff(this.yaw, ty) * (1 - Math.exp(-6 * dt));
        dWant = clamp(4.6 + d * 0.5, 5, 10); pitch = 0.3 + (tg.camPitch || 0);
      } else if (this.snap > 0) {
        this.snap -= dt; this.yaw += angDiff(this.yaw, this.snapTo) * (1 - Math.exp(-22 * dt));
      } else if (want) {
        // gira sola hacia la espalda al correr de lado; Q/E a mano
        const man = (input.down.r ? 1 : 0) - (input.down.l ? 1 : 0);
        if (man) this.yaw -= man * 2.4 * dt;
        else if (sp > 1 && p.state === 'free') {
          const d = angDiff(this.yaw, p.yaw + Math.PI);
          if (Math.abs(d) < 2.5) this.yaw += d * 0.85 * dt * clamp(sp / 4);
        }
        this.side = angDiff(this.yaw, p.yaw + Math.PI) > 0 ? 1 : -1;
      }
      const kx = 1 - Math.exp(-12 * dt), ky = 1 - Math.exp(-(p.onGround || p.swim ? 7 : 3) * dt);
      this.at.x += (_v.x - this.at.x) * kx; this.at.z += (_v.z - this.at.z) * kx; this.at.y += (_v.y - this.at.y) * ky;
      this.pitch += (pitch - this.pitch) * (1 - Math.exp(-4 * dt));
      this.dist += (dWant - this.dist) * (1 - Math.exp(-4 * dt));
      this.fov += (40 - this.fov) * (1 - Math.exp(-6 * dt));
      this.place(dt);
      if (this.blend > 0) {
        this.blend -= dt; const k = ease.io(clamp(this.blend / this.blendT));
        c.position.lerp(this.from.p, k); this.look.lerp(this.from.l, k);
      }
    } else {
      c.position.copy(this.shot.p); this.look.copy(this.shot.l); this.fov = this.shot.fov;
    }
    c.fov = this.fov; c.updateProjectionMatrix();
    c.position.add(fx.shakeOff(_s));
    c.lookAt(this.look);
    c.updateMatrixWorld();
  }
  place(dt = 0) {
    const L = G.level; let d = this.dist, po = 0;
    const dir = pit => { const cp = Math.cos(pit); return [Math.sin(this.yaw) * cp, Math.sin(pit), Math.cos(this.yaw) * cp]; };
    if (L && !L.camFree) {
      // si algo tapa, primero sube la cámara; solo si no basta, se acerca
      let best = 0, bf = -1;
      for (const o of [0, 0.22, 0.44, 0.66]) { const [x, y, z] = dir(Math.min(1.35, this.pitch + o)); const f = L.ray(this.at.x, this.at.y, this.at.z, this.at.x + x * d, this.at.y + y * d, this.at.z + z * d); if (f > bf + 0.02) { bf = f; best = o; } if (f >= 1) break; }
      po = best; d = bf >= 1 ? this.dist : Math.max(1.6, d * bf - 0.25);
    }
    this.po = dt > 0 ? lerp(this.po || 0, po, 1 - Math.exp(-6 * dt)) : po;
    const [ox, oy, oz] = dir(Math.min(1.35, this.pitch + this.po));
    this.d = dt > 0 ? (d < this.d ? lerp(this.d, d, 1 - Math.exp(-30 * dt)) : lerp(this.d, d, 1 - Math.exp(-5 * dt))) : d;
    this.cam.position.set(this.at.x + ox * this.d, this.at.y + oy * this.d, this.at.z + oz * this.d);
    this.look.copy(this.at);
  }
  // proyecta un punto del mundo a píxeles de pantalla
  project(x, y, z, out) {
    _v.set(x, y, z).project(this.cam);
    out.x = (_v.x * 0.5 + 0.5) * W; out.y = (-_v.y * 0.5 + 0.5) * H; out.z = _v.z; return out;
  }
}
