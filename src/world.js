// world.js — niveles hechos de bloques con baldosas, y la física que los pisa.
import { THREE, MB } from './gfx.js';
import { TI, cell, tileMat } from './art/tiles.js';

export const STEP = 0.36;

export class Level {
  constructor(name) {
    this.name = name;
    this.group = new THREE.Group();
    this.solids = [];
    this.waters = [];
    this.ents = [];
    this.lights = [];
    this.zones = [];
    this.mb = { solid: new MB(), cut: new MB(), decal: new MB() };
    this.sky = [12, 12, 12, 12]; this.fog = [40, 80, 12]; this.dark = 0; this.amb = 0.5;
    this.music = null; this.title = ''; this.sub = '';
    this.spawn = {}; this.killY = -12;
    this.rooms = [];
  }
  // bloque macizo. o: top, side, sideTop (fila alta del lado), bot, faces ('tnsewb'), noCol, shade, mat, tag
  block(x0, y0, z0, x1, y1, z1, o = {}) {
    const b = this.mb[o.layer || 'solid']; b.shade = o.shade || 0;
    const top = o.top ?? o.side ?? TI.piedra, side = o.side ?? top, f = o.faces || 'tnsew';
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const sideQ = (a, bq, c, e, len) => {
      // a,b,c,d = arriba-izq, abajo-izq, abajo-der, arriba-der
      if (o.sideTop != null && h > 1.001) {
        const k = 1 / h, m = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
        const ma = m(a, bq), me = m(e, c);
        b.quadT(a, ma, me, e, cell(o.sideTop), len, 1);
        b.quadT(ma, bq, c, me, cell(side), len, h - 1);
      } else b.quadT(a, bq, c, e, cell(o.sideTop ?? side), len, h);
    };
    if (f.includes('t')) b.quadT([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], cell(top), w, d);
    if (f.includes('s')) sideQ([x0, y1, z1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], w);
    if (f.includes('n')) sideQ([x1, y1, z0], [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], w);
    if (f.includes('e')) sideQ([x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], d);
    if (f.includes('w')) sideQ([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], d);
    if (f.includes('b')) b.quadT([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], cell(o.bot ?? side), w, d);
    b.shade = 0;
    if (o.noCol) return null;
    const s = { x0, y0, z0, x1, y1, z1, mat: o.mat || 'stone', tag: o.tag };
    this.solids.push(s); return s;
  }
  // rampa: sube de y0 a y1 hacia dir ('n' = -z, 's' = +z, 'e' = +x, 'w' = -x)
  ramp(x0, z0, x1, z1, y0, y1, dir, o = {}) {
    const b = this.mb.solid, top = o.top ?? TI.piedra, side = o.side ?? top;
    const yA = { n: [y1, y0, y0, y1], s: [y0, y1, y1, y0], e: [y0, y0, y1, y1], w: [y1, y1, y0, y0] }[dir]; // esquinas: (x0,z0),(x0,z1),(x1,z1),(x1,z0)
    const P = [[x0, yA[0], z0], [x0, yA[1], z1], [x1, yA[2], z1], [x1, yA[3], z0]];
    const len = (dir === 'n' || dir === 's') ? z1 - z0 : x1 - x0, slope = Math.hypot(len, y1 - y0);
    if (dir === 'n' || dir === 's') b.quadT(P[0], P[1], P[2], P[3], cell(top), x1 - x0, slope);
    else b.quadT(P[0], P[1], P[2], P[3], cell(top), slope, z1 - z0);
    const base = o.base ?? Math.min(y0, y1);
    // costados (triángulos como cuadriláteros degenerados)
    const sq = (a, bb, c, e, lw, lh) => b.quadT(a, bb, c, e, cell(side), lw, lh);
    sq(P[1], [x0, base, z1], [x1, base, z1], P[2], x1 - x0, Math.max(yA[1], yA[2]) - base);
    sq(P[3], [x1, base, z0], [x0, base, z0], P[0], x1 - x0, Math.max(yA[0], yA[3]) - base);
    sq(P[2], [x1, base, z1], [x1, base, z0], P[3], z1 - z0, Math.max(yA[2], yA[3]) - base);
    sq(P[0], [x0, base, z0], [x0, base, z1], P[1], z1 - z0, Math.max(yA[0], yA[1]) - base);
    const s = { x0, y0: base, z0, x1, y1: Math.max(y0, y1), z1, ramp: { dir, lo: y0, hi: y1 }, mat: o.mat || 'stone' };
    this.solids.push(s); return s;
  }
  // calcomanía plana sobre el suelo
  decal(x0, z0, x1, z1, y, tile, o = {}) {
    const b = this.mb.decal; y += 0.012 + (o.lift || 0);
    b.quadT([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], cell(tile), (x1 - x0) / (o.scale || 1), (z1 - z0) / (o.scale || 1));
    return this;
  }
  // lámina de agua con nivel que puede subir
  water(x0, z0, x1, z1, y, o = {}) {
    const b = new MB();
    b.quadT([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], cell(o.tile ?? TI.agua), x1 - x0, z1 - z0);
    const m = tileMat(o.kind || 'water');
    const mesh = b.mesh(m); mesh.position.y = y; this.group.add(mesh);
    const w = { x0, z0, x1, z1, y, mesh, on: o.on !== false, bottom: o.bottom ?? -99 };
    mesh.visible = w.on;
    this.waters.push(w); return w;
  }
  light(x, y, z, r, o = {}) { const l = { x, y, z, r, base: r, flick: o.flick || 0, ph: Math.random() * 9 }; this.lights.push(l); return l; }
  add(e) { this.ents.push(e); e.level = this; if (e.obj) this.group.add(e.obj); if (e.onAdd) e.onAdd(this); return e; }
  remove(e) { e.dead = true; if (e.obj) this.group.remove(e.obj); if (e.solid) this.dropSolid(e.solid); }
  addSolid(s) { this.solids.push(s); return s; }
  dropSolid(s) { const i = this.solids.indexOf(s); if (i >= 0) this.solids.splice(i, 1); }
  zone(x0, z0, x1, z1, fn, o = {}) { const z = { x0, z0, x1, z1, fn, once: o.once !== false, y0: o.y0 ?? -99, y1: o.y1 ?? 99, done: false, inside: false, onExit: o.onExit }; this.zones.push(z); return z; }
  finish() {
    for (const k of ['solid', 'cut', 'decal']) {
      const b = this.mb[k]; if (!b.p.length) continue;
      const me = b.mesh(tileMat(k)); if (k === 'decal') me.renderOrder = 1;
      this.group.add(me); this.mesh = this.mesh || me;
    }
    return this;
  }

  // ───────── física ─────────
  topOf(s, x, z) {
    if (!s.ramp) return s.y1;
    const r = s.ramp; let t;
    if (r.dir === 'n') t = (s.z1 - z) / (s.z1 - s.z0); else if (r.dir === 's') t = (z - s.z0) / (s.z1 - s.z0);
    else if (r.dir === 'e') t = (x - s.x0) / (s.x1 - s.x0); else t = (s.x1 - x) / (s.x1 - s.x0);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return r.lo + (r.hi - r.lo) * t;
  }
  // suelo más alto bajo los pies (hasta STEP por encima). Devuelve {y, s}
  ground(x, z, feet, r = 0.25, ignore = null, small = false) {
    let best = -Infinity, bs = null;
    for (const s of this.solids) {
      if (s.off || s === ignore || s.noStand) continue;
      if (s.gap && small) continue;
      if (x + r <= s.x0 || x - r >= s.x1 || z + r <= s.z0 || z - r >= s.z1) continue;
      const top = this.topOf(s, x, z);
      if (top <= feet + STEP && top > best) { best = top; bs = s; }
    }
    return { y: best, s: bs };
  }
  // empuja un cilindro fuera de los sólidos. Devuelve lista de choques [{s, nx, nz}]
  collide(p, r, h, ignore = null, small = false) {
    const hits = [];
    for (let it = 0; it < 2; it++) for (const s of this.solids) {
      if (s.off || s === ignore) continue;
      if (s.gap && small) continue;
      if (s.y0 >= p.y + h || s.y1 <= p.y + STEP) continue;
      if (s.ramp && this.topOf(s, p.x, p.z) <= p.y + STEP) continue;
      const cx = p.x < s.x0 ? s.x0 : p.x > s.x1 ? s.x1 : p.x, cz = p.z < s.z0 ? s.z0 : p.z > s.z1 ? s.z1 : p.z;
      let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2); dx /= d; dz /= d;
        p.x = cx + dx * r; p.z = cz + dz * r;
        if (it === 0) hits.push({ s, nx: dx, nz: dz });
      } else {
        // dentro: sacar por la cara más cercana
        const l = p.x - s.x0, rr = s.x1 - p.x, n = p.z - s.z0, f = s.z1 - p.z, m = Math.min(l, rr, n, f);
        if (m === l) { p.x = s.x0 - r; dx = -1; dz = 0; } else if (m === rr) { p.x = s.x1 + r; dx = 1; dz = 0; }
        else if (m === n) { p.z = s.z0 - r; dx = 0; dz = -1; } else { p.z = s.z1 + r; dx = 0; dz = 1; }
        if (it === 0) hits.push({ s, nx: dx, nz: dz });
      }
    }
    return hits;
  }
  // ¿cabe un cilindro aquí?
  free(x, y, z, r, h, ignore = null) {
    for (const s of this.solids) {
      if (s.off || s === ignore) continue;
      if (s.y0 >= y + h || s.y1 <= y + 0.05) continue;
      if (s.ramp && this.topOf(s, x, z) <= y + 0.05) continue;
      if (x + r > s.x0 && x - r < s.x1 && z + r > s.z0 && z - r < s.z1) return false;
    }
    return true;
  }
  inSolid(x, y, z) {
    for (const s of this.solids) {
      if (s.off || s.noCam) continue;
      if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y > s.y0 && y < this.topOf(s, x, z)) return true;
    }
    return false;
  }
  // fracción libre (0..1) del segmento a→b para la cámara
  ray(ax, ay, az, bx, by, bz) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / 0.22);
    for (let i = 1; i <= n; i++) { const t = i / n; if (this.inSolid(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t)) return (i - 1) / n; }
    return 1;
  }
  waterAt(x, z) {
    let w = null;
    for (const a of this.waters) if (a.on && x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1 && (!w || a.y > w.y)) w = a;
    return w;
  }
}
