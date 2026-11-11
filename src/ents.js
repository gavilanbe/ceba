// ents.js — cosas con las que se juega: mudas, lágrimas, cebollinos, tinajas, cofres, rejas, placas, bloques, bancales, estatuas.
import { THREE, MB, mat } from './gfx.js';
import { G, flag, run, wait, writeSave } from './state.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';
import { makePeel } from './art/hero.js';
import * as A from './art/props.js';
import { makeAjoBomba } from './art/pulpa.js';
import { TI, cell, tilesTex } from './art/tiles.js';
import { clamp, lerp, ease } from './px.js';

export class Ent {
  constructor(x = 0, y = 0, z = 0) { this.pos = new THREE.Vector3(x, y, z); this.obj = null; this.r = 0.4; this.dead = false; this.t = rnd() * 10; }
  update(dt) { }
  sync() { if (this.obj) this.obj.position.copy(this.pos); }
  near(d) { const p = G.player.pos; return Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < d && Math.abs(p.y - this.pos.y) < 2; }
  dist() { const p = G.player.pos; return Math.hypot(p.x - this.pos.x, p.z - this.pos.z); }
  kill() { if (this.level) this.level.remove(this); else this.dead = true; }
}
const boxSolid = (e, w, h, d, o = {}) => { const s = { x0: e.pos.x - w / 2, x1: e.pos.x + w / 2, z0: e.pos.z - d / 2, z1: e.pos.z + d / 2, y0: e.pos.y, y1: e.pos.y + h, ent: e, mat: 'stone', noCam: true, ...o }; e.solid = s; return s; };

// ───────── la nube de la cebolla: todo lo que la huele, llora ─────────
G.gas = (x, y, z, r) => {
  fx.ring(x, G.player.groundY, z, { r0: 0.4, r1: r, t: 0.55, c: 10, th: 0.5 });
  fx.ring(x, G.player.groundY, z, { r0: 0.2, r1: r * 0.8, t: 0.7, c: 11, th: 0.25 });
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, s = 3 + rnd() * 3; fx.one(P.gas, x, y + 0.2 + rnd() * 0.5, z, { vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: 0.6 + rnd(), drag: 2.6, g: -0.4, life: 0.8 + rnd() * 0.5, size: 0.5, grow: 0.3 }); }
  let n = 0;
  for (const e of G.level.ents) {
    if (e.dead || !e.onGas) continue;
    const d = Math.hypot(e.pos.x - x, e.pos.z - z);
    if (d < r + (e.r || 0) && Math.abs(e.pos.y - y) < 3.5) { run(function* () { yield* wait(d * 0.09); if (!e.dead) e.onGas(); }); n++; }
  }
  if (n && !flag('picas')) { flag('picas', 1); G.hintOnce('picas', 'PICAS'); }
  return n;
};
G.peels = [];
G.spawnPeel = (x, y, z, yaw, from, voluntary, scale) => {
  const e = new Peel(x, y, z, yaw, from, voluntary, scale); G.level.add(e);
  if (voluntary) { G.peels.push(e); while (G.peels.length > 2) { const o = G.peels.shift(); o.life = Math.min(o.life, 0.6); } }
  return e;
};
G.drop = (x, y, z, o = {}) => {
  const n = o.tears || 0;
  for (let i = 0; i < n; i++) G.level.add(new Tear(x, y + 0.3, z, { big: o.big && i === 0, pop: true }));
  if (o.ring && rnd() < o.ring) G.level.add(new RingPick(x, y + 0.3, z, { pop: true }));
  // ajos: solo cuando ya se llevan, y más a menudo si no queda ninguno
  if (o.ajo && flag('ajo') && (G.save.ajos || 0) < 15 && rnd() < (G.save.ajos ? o.ajo : Math.min(1, o.ajo * 2.5))) G.level.add(new AjoPick(x, y + 0.3, z, { pop: true, n: o.ajoN || 1 }));
};
let chain = 0, chainT = 0;
G.addTears = n => {
  G.save.tears = Math.min(999, G.save.tears + n);
  if (G.t - chainT > 0.9) chain = 0; chainT = G.t; chain = Math.min(12, chain + 1);
  audio.sfx('tear', { pitch: 1 + chain * 0.06 }); if (G.ui) G.ui.onTears(n);
};

// la muda: cáscara que deja Ceba. Pesa: sirve para las placas.
export class Peel extends Ent {
  constructor(x, y, z, yaw, from, voluntary, scale) {
    super(x, y, z); this.m = makePeel(G.player.m.tex, from); this.obj = this.m.g; this.obj.rotation.y = yaw; this.obj.scale.setScalar(scale);
    this.weight = true; this.r = 0.5 * scale; this.life = voluntary ? 1e9 : 9; this.e = 0; this.voluntary = voluntary; this.sync();
  }
  update(dt) {
    this.e += dt; this.life -= dt;
    const k = ease.bounce(clamp(this.e / 0.6));
    this.m.a.rotation.z = -1.25 * k; this.m.b.rotation.z = 1.25 * k; this.m.c.rotation.x = 1.35 * k;
    this.m.a.position.x = 0.12 * k; this.m.b.position.x = -0.12 * k; this.m.c.position.z = 0.1 * k;
    if (this.life < 0.6) this.m.m.uniforms.uHide.value = 1 - this.life / 0.6;
    if (this.life <= 0) { const i = G.peels.indexOf(this); if (i >= 0) G.peels.splice(i, 1); this.kill(); }
  }
}

export class Pick extends Ent {
  constructor(x, y, z, o = {}) {
    super(x, y, z); this.vel = new THREE.Vector3(); this.life = o.keep ? 1e9 : 14; this.grace = o.pop ? 0.35 : 0; this.rest = !o.pop; this.r = 0.3; this.hover = y;
    if (o.pop) { const a = rnd() * 6.283, s = 1.2 + rnd() * 1.8; this.vel.set(Math.cos(a) * s, 4.5 + rnd() * 2, Math.sin(a) * s); }
  }
  update(dt) {
    this.t += dt; this.life -= dt; this.grace -= dt;
    const p = G.player, d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z), dy = (p.pos.y + 0.4) - this.pos.y;
    if (!this.rest) {
      this.vel.y -= 16 * dt; this.pos.addScaledVector(this.vel, dt);
      const g = this.level.ground(this.pos.x, this.pos.z, this.pos.y + 0.3, 0.1);
      if (this.pos.y <= g.y + 0.02) { this.pos.y = g.y + 0.02; if (Math.abs(this.vel.y) > 1.5) { this.vel.y *= -0.45; this.vel.x *= 0.5; this.vel.z *= 0.5; } else { this.rest = true; this.hover = this.pos.y; } }
      const hits = this.level.collide(this.pos, 0.15, 0.3); if (hits.length) { this.vel.x *= -0.4; this.vel.z *= -0.4; }
      if (this.pos.y < this.level.killY) this.kill();
    }
    if (this.grace <= 0 && d < 1.9 && Math.abs(dy) < 1.6 && this.wants(p)) {
      this.rest = true; const k = 1 - Math.exp(-(9 - d * 3) * dt);
      this.pos.x += (p.pos.x - this.pos.x) * k; this.pos.z += (p.pos.z - this.pos.z) * k; this.pos.y += dy * k; this.hover = this.pos.y;
      if (d < 0.55 * (0.6 + p.scale * 0.4) + 0.15) { this.take(p); this.kill(); return; }
    }
    this.obj.position.set(this.pos.x, this.pos.y + (this.rest ? 0.12 + Math.sin(this.t * 4) * 0.06 : 0), this.pos.z);
    this.m.me.rotation.y = this.t * 4;
    this.m.sh.position.y = this.rest ? -0.1 - Math.sin(this.t * 4) * 0.06 : -99;
    this.obj.visible = this.life > 3 || Math.floor(this.t * 12) % 2 === 0;
    if (this.life <= 0) this.kill();
  }
  wants() { return true; }
}
export class Tear extends Pick {
  constructor(x, y, z, o = {}) { super(x, y, z, o); this.big = !!o.big; this.m = A.makeTear(this.big); this.obj = this.m.g; this.sync(); }
  take(p) { G.addTears(this.big ? 5 : 1); fx.burst(P.star, this.pos.x, this.pos.y + 0.3, this.pos.z, 3, { speed: 1.2, up: 1.5, g: 3, life: 0.35, size: 0.3 }); }
}
export class RingPick extends Pick {
  constructor(x, y, z, o = {}) { super(x, y, z, o); this.m = A.makeRing(); this.obj = this.m.g; this.sync(); }
  wants(p) { return p.layers < p.maxLayers || p.crack; }
  take(p) { p.heal(1); }
}

export class AjoPick extends Pick {
  constructor(x, y, z, o = {}) { super(x, y, z, o); const b = makeAjoBomba(); b.spark.visible = false; b.g.scale.setScalar(0.62); const sp = new THREE.Group(); sp.add(b.g); this.obj = sp; this.m = { me: b.g, sh: b.sh }; this.n = o.n || 1; this.sync(); }
  wants() { return (G.save.ajos || 0) < 15; }
  take(p) { G.save.ajos = Math.min(15, (G.save.ajos || 0) + this.n); audio.sfx('ammo'); if (G.ui) G.ui.onAmmo(); fx.burst(P.star, this.pos.x, this.pos.y + 0.3, this.pos.z, 3, { speed: 1.2, up: 1.5, g: 3, life: 0.35, size: 0.3 }); }
}

// cebollino: se siega con la Hoja, se aparta al pasar y vuelve a crecer
export class Chive extends Ent {
  constructor(x, y, z, o = {}) {
    super(x, y, z); this.m = A.makeChive(o.flower ?? rnd() < 0.3); this.obj = this.m.g; this.obj.rotation.y = rnd() * 3; this.s = 0.75 + rnd() * 0.5; this.h = 1; this.cutT = 0; this.bx = 0; this.bz = 0; this.r = 0.35;
    this.obj.scale.setScalar(this.s); this.sync(); this.rich = o.rich;
  }
  cut(p) {
    if (this.cutT > 0) return;
    this.cutT = 9 + rnd() * 6; audio.sfx('grass', { pitch: 0.9 + rnd() * 0.3 });
    fx.burst(P.leaf, this.pos.x, this.pos.y + 0.4, this.pos.z, 7, { speed: 2.2, up: 3.2, g: 7, life: 0.7, size: 0.32, floor: this.pos.y + 0.03 });
    const q = rnd(); if (this.rich || q < 0.3) G.drop(this.pos.x, this.pos.y, this.pos.z, { tears: 1 }); else if (q < 0.37) G.drop(this.pos.x, this.pos.y, this.pos.z, { ring: 1 });
  }
  update(dt) {
    const p = G.player.pos, dx = this.pos.x - p.x, dz = this.pos.z - p.z, d = Math.hypot(dx, dz);
    let tx = 0, tz = 0;
    if (d < 0.9 && Math.abs(p.y - this.pos.y) < 1) { const k = (0.9 - d) * 0.9; tx = dz / (d || 1) * k; tz = -dx / (d || 1) * k; if (G.player.state === 'roll' && this.cutT <= 0 && d < 0.6) this.cut(); }
    this.bx += (tx - this.bx) * Math.min(1, 12 * dt); this.bz += (tz - this.bz) * Math.min(1, 12 * dt);
    this.t += dt;
    const w = Math.sin(this.t * 1.8 + this.pos.x) * 0.05;
    this.obj.rotation.x = this.bx + w; this.obj.rotation.z = this.bz + w * 0.6;
    if (this.cutT > 0) { this.cutT -= dt; this.h = lerp(this.h, 0.16, 0.5); if (this.cutT <= 0) { this.gr = 0; } }
    else if (this.h < 1) { this.gr = (this.gr || 0) + dt; this.h = lerp(0.16, 1, ease.elastic(clamp(this.gr / 0.7))); if (this.gr >= 0.7) this.h = 1; }
    this.obj.scale.set(this.s, this.s * this.h, this.s);
  }
}

// tinaja: se rompe con la Hoja o rodando
export class Pot extends Ent {
  constructor(x, y, z, o = {}) { super(x, y, z); this.m = A.makePot(); this.obj = this.m.g; this.sync(); this.fragile = true; this.loot = o.loot || { tears: 1 + Math.floor(rnd() * 2), ring: 0.12, ajo: 0.3 }; this.r = 0.4; this.hh = 0.4; }
  onAdd(L) { L.addSolid(boxSolid(this, 0.62, 0.78, 0.62)); }
  hit() { this.smash(); return true; }
  smash() {
    if (this.dead) return; audio.sfx('pot');
    fx.burst(P.clay, this.pos.x, this.pos.y + 0.4, this.pos.z, 12, { speed: 3, up: 4, g: 12, life: 0.8, size: 0.34, floor: this.pos.y + 0.04, bounce: 0.4 });
    fx.dust(this.pos.x, this.pos.y + 0.2, this.pos.z, 4); fx.shake(0.05, 0.1);
    G.drop(this.pos.x, this.pos.y, this.pos.z, this.loot); this.kill();
  }
  update(dt) { if (this.wob > 0) { this.wob -= dt; this.obj.rotation.z = Math.sin(this.wob * 30) * this.wob * 0.4; } }
  onBonkNear() { this.wob = 0.4; }
}

export class Sign extends Ent {
  constructor(x, y, z, yaw, text) { super(x, y, z); this.m = A.makeSign(); this.obj = this.m.g; this.obj.rotation.y = yaw; this.text = text; this.sync(); this.label = 'LEER'; this.ir = 1.5; this.hh = 0.9; }
  onAdd(L) { L.addSolid(boxSolid(this, 0.3, 1.3, 0.3)); }
  interact() { const s = this; run(function* () { yield* G.say(null, s.text); }); }
  hit() { this.wob = 0.5; audio.sfx('bounce', { pitch: 1.3, vol: 0.5 }); return true; }
  update(dt) { if (this.wob > 0) { this.wob -= dt; this.obj.rotation.z = Math.sin(this.wob * 28) * this.wob * 0.5; } }
}

export class Chest extends Ent {
  constructor(x, y, z, yaw, item, o = {}) {
    super(x, y, z); this.big = !!o.big; this.m = A.makeChest({ big: this.big }); this.obj = this.m.g; this.obj.rotation.y = yaw; this.yaw = yaw; this.item = item; this.key = o.key || ('cofre_' + item + '_' + Math.round(x) + '_' + Math.round(z));
    this.open = !!flag(this.key); this.label = 'ABRIR'; this.ir = 1.5; this.sync(); this.hh = 0.5; this.amount = o.amount;
    if (this.open) this.m.lid.rotation.x = -1.9;
    this.hiddenT = !!o.hidden; if (this.hiddenT) { this.obj.visible = false; }
  }
  onAdd(L) { const s = this.big ? 1.3 : 1; this.sol = L.addSolid(boxSolid(this, 1.0 * s, 0.78 * s, 0.7 * s, { noClimb: true })); if (this.hiddenT) this.sol.off = true; }
  get canInteract() { return !this.open && !this.hiddenT; }
  // aparece con humo (enigma resuelto)
  appear() {
    if (!this.hiddenT) return; this.hiddenT = false; this.obj.visible = true; this.sol.off = false; audio.sfx('secret');
    fx.burst(P.dust, this.pos.x, this.pos.y + 0.4, this.pos.z, 16, { speed: 2.5, up: 2, g: -1, life: 0.8, size: 0.6 }); fx.ring(this.pos.x, this.pos.y, this.pos.z, { r1: 2.2, c: 10 });
    this.pop = 0;
  }
  interact(p) {
    const c = this; this.open = true; flag(this.key, 1);
    run(function* () {
      G.lock++; G.cine = true; p.vel.set(0, 0, 0);
      const fx_ = c.pos.x + Math.sin(c.yaw) * 1.25, fz_ = c.pos.z + Math.cos(c.yaw) * 1.25;
      p.auto = { x: fx_, z: fz_, speed: 0.6 }; let w = 0; while (p.auto && w < 1.2) w += yield;
      p.auto = null; p.yaw = c.yaw + Math.PI; p.set('cine');
      const cy = c.yaw + 1.15;
      yield* G.cam.to(c.pos.x + Math.sin(cy) * 3.9, c.pos.y + 2.0, c.pos.z + Math.cos(cy) * 3.9, c.pos.x + Math.sin(c.yaw) * 0.6, c.pos.y + 0.7, c.pos.z + Math.cos(c.yaw) * 0.6, 0.5, 36);
      audio.music(null, { fade: 0.3 }); audio.sfx('chestOpen');
      p.faceOv = 'wow'; p.pose = { L: [-0.45, 0.55, 0.45], R: [0.45, 0.55, 0.45] };
      let e = 0; while (e < (c.big ? 1.5 : 1.0)) { e += yield; c.m.lid.rotation.x = -1.9 * ease.back(clamp(e / (c.big ? 1.3 : 0.8))); c.obj.position.y = c.pos.y + Math.sin(e * 40) * 0.015 * (1 - clamp(e)); if (rnd() < 0.5) fx.one(P.star, c.pos.x + (rnd() - 0.5) * 0.7, c.pos.y + 0.6, c.pos.z + (rnd() - 0.5) * 0.4, { vy: 2 + rnd() * 2, g: -1, life: 0.6, size: 0.36 }); }
      c.obj.position.y = c.pos.y;
      fx.ring(c.pos.x, c.pos.y + 0.5, c.pos.z, { r1: 1.6, t: 0.4, c: 10 }); fx.flash(7, 0.1);
      p.pose = null; p.faceOv = null;
      yield* G.giveItem(c.item, { from: c, amount: c.amount });
      if (c.item === 'mondador') G.hint('H_MUDA', 8);
      G.cam.release(0.6); p.set('free'); G.lock--; G.cine = false; G.level.resumeMusic();
    });
  }
  update(dt) { if (this.pop != null && this.pop < 0.5) { this.pop += dt; const k = ease.elastic(clamp(this.pop / 0.5)); this.obj.scale.setScalar(k); } }
}

// reja que baja y sube
export class Bars extends Ent {
  constructor(x, y, z, w, h, axis = 'x', o = {}) {
    super(x, y, z); this.w = w; this.h = h; this.axis = axis; this.isOpen = !!o.open; this.k = this.isOpen ? 1 : 0;
    const b = new MB(); const hw = w / 2;
    const A_ = axis === 'x' ? [[-hw, h, 0], [-hw, 0, 0], [hw, 0, 0], [hw, h, 0]] : [[0, h, hw], [0, 0, hw], [0, 0, -hw], [0, h, -hw]];
    b.quadT(A_[0], A_[1], A_[2], A_[3], cell(TI.reja), w, h);
    this.obj = b.mesh(mat(tilesTex(), { tiled: true, double: true, cut: true })); this.sync();
  }
  onAdd(L) { const t = 0.3; this.sol = L.addSolid(boxSolid(this, this.axis === 'x' ? this.w : t, this.h, this.axis === 'x' ? t : this.w, { noClimb: true, noCam: true, seeThru: true })); this.sol.off = this.isOpen; this.obj.position.y = this.pos.y - this.k * (this.h - 0.12); }
  set(open, quiet) {
    if (open === this.isOpen) return; this.isOpen = open; this.sol.off = open;
    if (!quiet) { audio.sfx('bars'); fx.dust(this.pos.x, this.pos.y, this.pos.z, 5, { dark: true, spread: this.w / 3 }); fx.shake(0.06, 0.15); }
  }
  update(dt) { const t = this.isOpen ? 1 : 0; if (this.k !== t) { this.k = clamp(this.k + (t - this.k > 0 ? 1 : -1) * dt * 3.2); this.obj.position.y = this.pos.y - ease.io(this.k) * (this.h - 0.12); } }
}

// puerta de losa que sube
export class Slab extends Ent {
  constructor(x, y, z, w, h, axis = 'x', o = {}) {
    super(x, y, z); this.w = w; this.h = h; this.axis = axis; this.boss = !!o.boss; this.isOpen = !!o.open; this.k = this.isOpen ? 1 : 0; this.needs = o.needs; this.key = o.key; this.lockText = o.lockText;
    const ti = o.tile ?? (this.boss ? TI.puertaJefe : TI.puerta), t = 0.4;
    const b = new MB(), c = cell(ti), cs = cell(TI.losaOsc);
    const W_ = axis === 'x' ? w : t, D_ = axis === 'x' ? t : w;
    b.box(W_, h, D_, axis === 'x' ? { f: c, b: c, l: cs, r: cs, t: cs } : { l: c, r: c, f: cs, b: cs, t: cs });
    this.m = mat(tilesTex(), { cut: true }); this.obj = b.mesh(this.m); this.sync();
    if (this.needs) { this.label = 'ABRIR'; this.ir = 1.8; this.hh = 1; }
    if (this.key && flag(this.key)) { this.isOpen = true; this.k = 1; }
  }
  get canInteract() { return !this.isOpen && !!this.needs; }
  onAdd(L) { const t = 0.4; this.sol = L.addSolid(boxSolid(this, this.axis === 'x' ? this.w : t, this.h, this.axis === 'x' ? t : this.w, { noClimb: true })); this.sol.off = this.isOpen; this.obj.position.y = this.pos.y + this.k * (this.h - 0.1); }
  interact(p) {
    const d = this;
    if (!G.save.items[this.needs]) { run(function* () { audio.sfx('error'); yield* G.say(null, d.lockText || 'PUERTA_JEFE'); }); return; }
    run(function* () { G.lock++; audio.sfx('keyGet'); fx.sparks(d.pos.x, d.pos.y + 1, d.pos.z, 8); yield* wait(0.4); d.set(true); if (d.key) flag(d.key, 1); yield* wait(0.9); G.lock--; });
  }
  set(open) { if (open === this.isOpen) return; this.isOpen = open; this.sol.off = open; audio.sfx('door'); fx.shake(0.08, 0.6); }
  update(dt) {
    const t = this.isOpen ? 1 : 0;
    if (this.k !== t) { this.k = clamp(this.k + (t - this.k > 0 ? 1 : -1) * dt * 1.1); this.obj.position.y = this.pos.y + ease.io(this.k) * (this.h - 0.1); if (rnd() < 0.4) fx.dust(this.pos.x + (rnd() - 0.5) * this.w * (this.axis === 'x' ? 1 : 0), this.pos.y, this.pos.z + (rnd() - 0.5) * this.w * (this.axis === 'x' ? 0 : 1), 1, { dark: true }); }
  }
}

// placa de presión: la pisa Ceba, una muda o un bloque
export class Plate extends Ent {
  constructor(x, y, z, o = {}) {
    super(x, y, z); this.size = o.size || 1.3; this.down = false; this.onDown = o.onDown; this.onUp = o.onUp; this.k = 0; this.sticky = o.sticky;
    const s = this.size, g = new THREE.Group();
    this.a = A.tileBox(s, 0.12, s, { all: TI.placa }).mesh(A.tileModelMat()); this.b = A.tileBox(s, 0.12, s, { all: TI.placaOn }).mesh(A.tileModelMat()); this.b.visible = false;
    g.add(this.a, this.b); this.obj = g; this.sync();
  }
  update(dt) {
    const p = G.player, h = this.size / 2 + 0.1;
    let on = p.onGround && Math.abs(p.pos.x - this.pos.x) < h && Math.abs(p.pos.z - this.pos.z) < h && Math.abs(p.pos.y - this.pos.y) < 0.5;
    if (!on) for (const e of this.level.ents) { if (e.dead || !e.weight) continue; if (Math.abs(e.pos.x - this.pos.x) < h + 0.1 && Math.abs(e.pos.z - this.pos.z) < h + 0.1 && Math.abs(e.pos.y - this.pos.y) < 0.6) { on = true; break; } }
    if (this.sticky && this.down) on = true;
    if (on !== this.down) {
      this.down = on; audio.sfx(on ? 'plateOn' : 'plateOff'); this.a.visible = !on; this.b.visible = on;
      if (on) { fx.ring(this.pos.x, this.pos.y + 0.1, this.pos.z, { r0: 0.3, r1: 1.3, t: 0.3, c: 11, th: 0.15 }); if (this.onDown) this.onDown(this); } else if (this.onUp) this.onUp(this);
    }
    this.k = lerp(this.k, on ? 1 : 0, 0.3); this.obj.position.y = this.pos.y - this.k * 0.08;
  }
}

// bloque que solo mueve una cebolla entera
export class Block extends Ent {
  constructor(x, y, z, o = {}) {
    super(x, y, z); this.size = o.size || 1.2; this.pushable = true; this.weight = true; this.mv = null; this.r = this.size / 2;
    this.obj = A.tileBox(this.size, this.size, this.size, { all: TI.bloque, t: TI.bloqueTop }).mesh(A.tileModelMat()); this.sync(); this.limit = o.limit;
  }
  onAdd(L) { L.addSolid(boxSolid(this, this.size, this.size, this.size)); }
  tryPush(dx, dz, p) {
    if (this.mv) return;
    if (!p.big) { p.strainT = 0.5; audio.sfx('error', { pitch: 0.7 }); fx.one(P.sweat, p.pos.x, p.pos.y + p.h + 0.2, p.pos.z, { vy: 2, vx: (rnd() - 0.5) * 2, g: 8, life: 0.5, size: 0.3 }); G.hintOnce('pesa', 'PESA'); return; }
    const nx = this.pos.x + dx, nz = this.pos.z + dz, L = this.level, h = this.size / 2 - 0.06;
    // si no puede avanzar más, deja que Ceba se suba encima
    if (!L.free(nx, this.pos.y + 0.1, nz, h, this.size - 0.2, this.solid)) { this.stuckT = 1.2; return; }
    if (this.limit && (nx < this.limit[0] || nx > this.limit[2] || nz < this.limit[1] || nz > this.limit[3])) { this.stuckT = 1.2; return; }
    const g = L.ground(nx, nz, this.pos.y + 0.1, 0.3, this.solid); if (g.y < this.pos.y - 0.2) { this.stuckT = 1.2; return; }
    this.mv = { x0: this.pos.x, z0: this.pos.z, x1: nx, z1: nz, t: 0 }; audio.sfx('push'); p.strainT = 0.45;
  }
  update(dt) {
    if (this.stuckT > 0) this.stuckT -= dt;
    if (!this.mv) return; const m = this.mv; m.t += dt / 0.42; const k = ease.io(clamp(m.t));
    this.pos.x = lerp(m.x0, m.x1, k); this.pos.z = lerp(m.z0, m.z1, k);
    const s = this.solid, h = this.size / 2; s.x0 = this.pos.x - h; s.x1 = this.pos.x + h; s.z0 = this.pos.z - h; s.z1 = this.pos.z + h;
    if (rnd() < 0.5) fx.dust(this.pos.x + (rnd() - 0.5), this.pos.y, this.pos.z + (rnd() - 0.5), 1, { dark: true });
    // arrastra a Ceba detrás
    const p = G.player; p.pos.x += (m.x1 - m.x0) * dt / 0.42 * 0.9; p.pos.z += (m.z1 - m.z0) * dt / 0.42 * 0.9;
    this.sync();
    if (m.t >= 1) { this.mv = null; fx.shake(0.05, 0.1); audio.sfx('land', { pitch: 0.6 }); if (this.onMoved) this.onMoved(this); }
  }
}

// bancal: plantarse aquí recupera capas y guarda la partida
export class Bancal extends Ent {
  constructor(x, y, z, id, o = {}) {
    super(x, y, z); this.id = id; this.label = 'PLANTARSE'; this.ir = 1.3; this.hh = 0.2; this.noFace = true; this.o = o;
    const g = new THREE.Group(); const f = A.makeFlag(); f.g.position.set(0.85, 0, -0.75); g.add(f.g); this.flag = f.g; this.obj = g; this.sync();
  }
  get canInteract() { return !this.o.locked || this.o.locked() === false; }
  interact(p) { if (this.o.onRoot && this.o.onRoot(this, p) === false) return; p.startRoot(this); }
  onLeave(p, full) {
    if (this.o.noSave) return;
    G.save.spawn = { level: this.level.name, at: this.id }; G.save.layers = p.layers; G.save.crack = p.crack; writeSave(); G.toast('Partida guardada', 'bancal');
  }
  update(dt) {
    this.t += dt; this.flag.rotation.y = Math.sin(this.t * 2) * 0.25;
    if (this.near(4) && (G.player.layers < G.player.maxLayers || G.player.crack) && !this.o.onRoot) G.hintOnce('bancal', 'H_BANCAL');
    if (this.near(5) && rnd() < 0.06) fx.one(P.sqG, this.pos.x + (rnd() - 0.5) * 1.4, this.pos.y + 0.05, this.pos.z + (rnd() - 0.5) * 1.4, { vy: 0.8 + rnd() * 0.6, g: -0.3, life: 1, size: 0.12 });
  }
}

// la Plañidera: llora si huele cebolla
export class Statue extends Ent {
  constructor(x, y, z, yaw, o = {}) { super(x, y, z); this.m = A.makeStatue(); this.obj = this.m.g; this.obj.rotation.y = yaw; this.yaw = yaw; this.crying = false; this.onCry = o.onCry; this.r = 0.7; this.sync(); this.s = o.s || 1; this.obj.scale.setScalar(this.s); this.fixed = o.fixed; }
  onAdd(L) { L.addSolid(boxSolid(this, 1.1 * this.s, 2 * this.s, 1.1 * this.s, { noClimb: true })); if (this.fixed != null) this.setCry(this.fixed, true); }
  onGas() { if (this.fixed !== undefined && this.fixed !== null && !this.reactive) return; if (this.crying) return; this.setCry(true); }
  setCry(on, quiet) {
    this.crying = on; this.m.cry(on);
    if (on && !quiet) { audio.sfx('cry', { pitch: 0.55 }); this.wob = 0.6; fx.ring(this.pos.x, this.pos.y + 0.05, this.pos.z, { r1: 1.6, c: 12, t: 0.5 }); if (this.onCry) this.onCry(this); }
  }
  update(dt) {
    if (this.wob > 0) { this.wob -= dt; this.obj.rotation.z = Math.sin(this.wob * 26) * this.wob * 0.12; }
    if (this.crying && this.near(16)) {
      this.t += dt; if (this.t > 0.07) {
        this.t = 0; const s = rnd() < 0.5 ? -1 : 1, fx_ = Math.sin(this.yaw), fz_ = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
        fx.one(P.drop, this.pos.x + (fx_ * 0.5 + rx * 0.14 * s) * this.s, this.pos.y + 1.6 * this.s, this.pos.z + (fz_ * 0.5 + rz * 0.14 * s) * this.s, { vx: fx_ * 0.5, vz: fz_ * 0.5, vy: 0.3, g: 9, life: 0.7, size: 0.22, floor: this.pos.y + 0.02 });
      }
    }
  }
}

export class Lantern extends Ent {
  constructor(x, y, z, o = {}) { super(x, y, z); this.m = A.makeLantern(); this.obj = this.m.g; this.sync(); this.lr = o.r || 5; }
  onAdd(L) { this.light = L.light(this.pos.x, this.pos.y + 1.7, this.pos.z, this.lr, { flick: 0.5 }); L.addSolid(boxSolid(this, 0.25, 2, 0.25, { noClimb: true, noCam: true })); }
  update(dt) { if (this.near(14) && rnd() < 0.05) fx.one(P.ember, this.pos.x + (rnd() - 0.5) * 0.3, this.pos.y + 1.8, this.pos.z + (rnd() - 0.5) * 0.3, { vy: 0.5 + rnd() * 0.5, g: -0.4, life: 0.9, size: 0.18, wob: 0.6 }); }
}

// mancha de baba: frena
G.slimes = [];
export class Slime extends Ent {
  constructor(x, y, z, r = 0.8, life = 7) {
    super(x, y, z); this.r = r; this.life = life; this.max = life;
    const b = new MB(); b.quad([-1, 0, -1], [-1, 0, 1], [1, 0, 1], [1, 0, -1], cell(TI.baba));
    this.m = mat(tilesTex(), { offset: 3, depthWrite: false }); this.obj = b.mesh(this.m); this.obj.renderOrder = 2; this.obj.rotation.y = rnd() * 6; this.pos.y += 0.02; this.sync(); this.obj.scale.setScalar(0.01); G.slimes.push(this);
  }
  update(dt) {
    this.life -= dt; const k = Math.min(1, (this.max - this.life) * 5); this.obj.scale.set(this.r * k, 1, this.r * k);
    if (this.life < 1) this.m.uniforms.uHide.value = 1 - this.life;
    const p = G.player; if (p.onGround && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < this.r && Math.abs(p.pos.y - this.pos.y) < 0.4) { if (p.slimeT <= 0) audio.sfx('slime', { vol: 0.6 }); p.slimeT = 0.25; }
    if (this.life <= 0) { G.slimes.splice(G.slimes.indexOf(this), 1); this.kill(); }
  }
}
