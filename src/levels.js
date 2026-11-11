// levels.js — Villa Ristra (capa I, la Piel) y la Cisterna (capa II, la Túnica).
import { THREE, MB, mat } from './gfx.js';
import { Level } from './world.js';
import { TI, cell, tilesTex } from './art/tiles.js';
import * as A from './art/props.js';
import { G, flag } from './state.js';
import { Ent, Chive, Pot, Sign, Chest, Bars, Slab, Plate, Block, Bancal, Statue, Lantern } from './ents.js';
import { NPC, Bicho, Pulgon, Babosa, Trips } from './creatures.js';
import { Tapona } from './boss.js';
import * as S from './story.js';
import * as S2 from './story2.js';
import { Breakable, Yema, Pepita, Seta } from './ents2.js';
import { pulpa, raicera } from './levels2.js';
import { rng } from './px.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';

// atrezo fijo con colisión
class Prop extends Ent {
  constructor(obj, x, y, z, w, h, d, o = {}) { super(x, y, z); this.obj = obj; this.w = w; this.h = h; this.d = d; this.o = o; if (o.yaw) obj.rotation.y = o.yaw; this.sync(); }
  onAdd(L) { if (this.w) L.addSolid({ x0: this.pos.x - this.w / 2, x1: this.pos.x + this.w / 2, z0: this.pos.z - this.d / 2, z1: this.pos.z + this.d / 2, y0: this.pos.y, y1: this.pos.y + this.h, ent: this, noClimb: !this.o.climb, mat: 'stone', noCam: this.o.noCam }); }
  update(dt) { if (this.o.tick) this.o.tick(this, dt); }
  onBonk() { if (this.o.bonk) this.o.bonk(this); }
}

// ══════════════════════════ VILLA RISTRA ══════════════════════════
export function villa() {
  const L = new Level('villa'); const r = rng(2024);
  L.title = 'VILLA RISTRA'; L.sub = 'CAPA I · LA PIEL'; L.music = 'village';
  L.sky = [15, 12, 12, 12]; L.fog = [52, 120, 15]; L.dark = 0; L.amb = 0.5; L.skyOff = 0.12;
  const done = !!flag('jefe');
  const g = { top: TI.hierba, side: TI.estrato, sideTop: TI.hierbaLado, mat: 'grass' };
  // suelo con el hueco del estanque
  L.block(-34, -4, -30, 34, 0, 16, g); L.block(-34, -4, 16, -5, 0, 30, g); L.block(5, -4, 16, 34, 0, 30, g); L.block(-5, -4, 24, 5, 0, 30, g);
  L.block(-5, -4, 16, 5, -1.3, 24, { top: TI.canal, side: TI.estratoB, mat: 'stone' });
  // borde del mundo: estratos de piel
  const cl = { top: TI.pielSeca, side: TI.estrato, sideTop: TI.estratoTop };
  L.block(-38, 0, -34, 38, 6, -30, cl); L.block(-38, 0, 30, 38, 4, 34, cl); L.block(-38, 0, -30, -34, 5, 30, cl); L.block(34, 0, -30, 38, 7, 30, cl);
  L.block(-34, 0, -30, -26, 2.4, -24, cl); L.block(22, 0, 22, 34, 2, 30, cl); L.block(-34, 0, 24, -28, 1.2, 30, { ...cl, top: TI.hierba, mat: 'grass' });
  // plaza y caminos
  L.decal(-7, -7, 7, 7, 0, TI.piedra); L.decal(-8, -8, 8, -7, 0, TI.caminoB); L.decal(-8, 7, 8, 8, 0, TI.caminoB);
  L.decal(-1.5, -9, 1.5, -7, 0, TI.camino); L.decal(7, -1.5, 18, 1.5, 0, TI.camino); L.decal(-16, 8.5, -7, 11.5, 0, TI.camino); L.decal(-9, 2, -7, 8.5, 0, TI.camino);
  // lagrimal: del pozo al estanque
  L.decal(-1, 1.6, 1, 16, 0, done ? TI.charco : TI.canal, { lift: 0.004 });
  L.pond = L.water(-5, 16, 5, 24, -0.35, { on: done });
  // estrado del Consejo
  L.block(-3.5, 0, -13.5, 3.5, 0.7, -9.5, { top: TI.piedra, side: TI.adobe }); L.ramp(-1.5, -9.5, 1.5, -8, 0, 0.7, 'n', { top: TI.piedra, side: TI.adobe });
  L.add(new NPC(0, 0.7, -11.6, 0, 'ajo', S.consejoTalk));
  for (const x of [-2.8, 2.8]) L.add(new Lantern(x, 0.7, -10.2, { r: 4 }));
  // el Pozo del Llanto
  const well = A.makeWell(); L.well = well;
  L.add(new Prop(well.g, 0, 0, 0, 2.3, 0.8, 2.3, { climb: true, noCam: true }));
  L.cubo = L.add(new S.Cubo(0, 0.75, 0, well));
  L.statue = L.add(new Statue(-4.2, 0, -4.2, 0.785, { s: 1.35, fixed: done }));
  L.add(new Sign(2.6, 0, -2.2, 0.4, 'C_POZO'));
  L.puerro = L.add(new NPC(-2.3, 0, 1.4, 0.6, 'puerro', S.puerroTalk));
  // casas-maceta
  const houses = [[-12, -7, 1.1, 0.9, 0], [11.5, -9, 1.2, -0.8, 8], [-14.5, 3.5, 1.0, 1.4, 14], [17.5, 11, 1.15, -1.9, 15], [-21, 7, 0.95, 1.2, 0], [-6, 17, 1.0, 2.6, 4], [10, 20, 1.1, -2.6, 14], [-21, -13, 1.2, 0.6, 8], [20, -22, 1.05, -0.4, 15], [-8, -20, 1.0, 0.2, 14]];
  for (const [x, z, s, yaw, sw] of houses) { const h = A.makeHouse({ s, swap: sw || null }); L.add(new Prop(h.g, x, 0, z, h.r * 1.62, h.h, h.r * 1.62, { yaw })); }
  // el bancal de Ceba
  L.decal(-17.3, 8.7, -14.7, 11.3, 0, TI.bancal); L.block(-17.5, 0, 8.5, -14.5, 0.12, 8.7, { top: TI.adobe, noCol: true }); L.block(-17.5, 0, 11.3, -14.5, 0.12, 11.5, { top: TI.adobe, noCol: true });
  L.spawn.cama = [-16, 0, 10, 0.4]; L.add(new Bancal(-16, 0, 10, 'cama')); L.add(new Sign(-13.8, 0, 8.2, 0.5, 'C_CASA'));
  L.spawn.pozo = [0, 0, 2.6, 0]; L.spawn.plaza = [0, 0, 5, Math.PI];
  // Chalota y su puesto
  L.block(11.2, 0, 3.4, 13.8, 0.8, 4.4, { top: TI.tablon, side: TI.madera }); L.add(new NPC(12.5, 0, 5.4, Math.PI * 0.9, 'chalota', S.chalotaTalk)); L.add(new Sign(10.2, 0, 5.2, -0.4, 'C_TIENDA'));
  for (const [x, z] of [[14.5, 4], [15.2, 5.1], [14.2, 5.4]]) L.add(new Pot(x, 0, z, { loot: { tears: 3, ring: 0.3 } }));
  // cebolletas y Croqueta
  L.add(new NPC(-6.5, 0, 9.5, 2.4, 'pipo', S.pipoTalk, { hop: true })); L.add(new NPC(6.2, 0, 11.2, -2.2, 'nita', S.nitaTalk)); L.add(new Bicho(7.8, 0, 12.6)); L.add(new Bicho(-24, 0, 16));
  L.add(new Sign(4.6, 0, 7.6, Math.PI, 'C_PLAZA'));
  // faroles, tinajas, flores
  for (const [x, z] of [[-7.5, -7.5], [7.5, -7.5], [-7.5, 7.5], [7.5, 7.5], [18, 2.6], [-12, 12.5]]) L.add(new Lantern(x, 0, z, { r: 3.5 }));
  for (const [x, z] of [[-10.3, -4.6], [-9.6, -5.5], [9.6, -6.6], [-12.4, 5.6], [-19, 8.6], [-4.2, 18.6], [-19.5, -10.4], [18.4, -20.2], [8.1, 21.5], [-25, 20], [-26.2, 20.9]]) L.add(new Pot(x, 0, z));
  for (let i = 0; i < 26; i++) { const x = -32 + r() * 64, z = -28 + r() * 56; if (Math.abs(x) < 9 && Math.abs(z) < 9) continue; if (x > 17 && z < 9) continue; if (Math.abs(x) < 6 && z > 15 && z < 25) continue; L.decal(x, z, x + 1, z + 1, 0, TI.flores); }
  // cebollinos por el pueblo
  for (let i = 0; i < 46; i++) { const x = -32 + r() * 48, z = -28 + r() * 56; if (Math.abs(x) < 9.5 && Math.abs(z) < 9.5) continue; if (Math.abs(x) < 6.5 && z > 14 && z < 26) continue; if (Math.abs(x) < 4.5 && z < -8 && z > -15) continue; if (houses.some(h => Math.hypot(h[0] - x, h[1] - z) < 2.6)) continue; if (Math.hypot(x + 16, z - 10) < 2.6) continue; L.add(new Chive(x, 0, z)); }
  // cofres escondidos
  L.block(-34, 0, -8, -27, 1.2, 0, { top: TI.hierba, side: TI.estrato, sideTop: TI.hierbaLado, mat: 'grass' });
  L.add(new Chest(-31, 1.2, -4, Math.PI / 2, 'l20')); L.add(new Chest(-31, 1.2, 27, Math.PI / 2, 'l20'));
  for (let i = 0; i < 5; i++) L.add(new Chive(-32.5 + r() * 4.5, 1.2, -7 + r() * 6, { rich: true }));

  // ── la Loma del Bancal Viejo (este) ──
  const t1 = { top: TI.hierba, side: TI.estrato, sideTop: TI.hierbaLado, mat: 'grass' };
  L.block(20, 0, -18, 34, 1, 9, t1); L.ramp(18, -1.6, 20, 1.6, 0, 1, 'e', { top: TI.camino, side: TI.estrato });
  L.decal(20, -1.5, 27, 1.5, 1, TI.camino); L.decal(25.5, -3, 28.5, 1.5, 1, TI.camino);
  L.block(24, 1, -18, 34, 2, -5, t1); L.ramp(25.5, -5, 28.5, -3, 1, 2, 'n', { top: TI.camino, side: TI.estrato });
  L.decal(25.5, -9, 28.5, -5, 2, TI.camino);
  L.block(26.5, 2, -18, 34, 3.2, -9, { ...t1, top: TI.hierba });
  L.add(new Sign(20.8, 1, 2.6, -0.3, 'C_LOMA')); L.add(new Sign(27.6, 3.2, -10, 0.3, 'C_BANCAL'));
  L.decal(29, -15, 32, -12, 3.2, TI.bancal);
  for (const [x, z] of [[28.6, -15.4], [32.4, -15.4], [28.6, -11.6], [32.4, -11.6]]) L.block(x - 0.25, 3.2, z - 0.25, x + 0.25, 3.55, z + 0.25, { top: TI.piedra, side: TI.piedra, noCol: true });
  L.bancalViejo = L.add(new Bancal(30.5, 3.2, -13.5, 'viejo', { onRoot: S.bancalViejo }));
  L.spawn.viejo = [30.5, 3.2, -11.4, Math.PI];
  // rayo de sol sobre el bancal
  const beam = A.makeBeam(9, 0.75); beam.position.set(30.5, 3.2, -13.5); beam.material.uniforms.uHide.value = 0.9; beam.visible = false; L.group.add(beam); L.beam = beam;
  for (let i = 0; i < 34; i++) { const x = 20.6 + r() * 13, z = -17.5 + r() * 26; const y = (x > 26.5 && z < -9) ? 3.2 : (x > 24 && z < -5) ? 2 : 1; if (Math.abs(z) < 2 && x < 27.5) continue; if (x > 25 && x < 29 && z < 2 && z > -9.5) continue; if (Math.hypot(x - 30.5, z + 13.5) < 2.6) continue; L.add(new Chive(x, y, z, { flower: r() < 0.45 })); }
  if (!done) for (const [x, y, z] of [[23, 1, 5], [22, 1, -9], [30, 2, -7], [32, 1, 4]]) L.add(new Pulgon(x, y, z, { aggro: 6 }));
  L.zone(20, -3, 23, 3, () => { if (!flag('hoja')) G.hintOnce('pulgones', 'H_PULGONES'); });
  L.zone(8, -3, 14, 3, () => G.hintOnce('rodar', 'H_RODAR'));

  // ── la Yaya Morada, junto al estanque, y las pepitas de oro del pueblo ──
  L.add(new NPC(-9.6, 0, 22.6, 2.2, 'yaya', S2.yayaTalk)); L.add(new Sign(-7.6, 0, 24.6, 2.8, 'C_YAYA'));
  if (done) { L.add(new Seta(-24.6, 0, -26.2)); L.add(new Seta(8.2, 0, 26.4, { s: 0.7, power: 9 })); }
  if (!flag('pp_villa1')) L.add(new Pepita(-30, 2.7, -27, 'pp_villa1'));
  if (!flag('rocaVilla')) { const pp = flag('pp_villa2') ? null : L.add(new Pepita(31.5, 1.3, 5.5, 'pp_villa2', { hidden: true })); L.add(new Breakable(31.5, 1, 5.5, 2, 1.9, 2, { kind: 'grieta', key: 'rocaVilla', onBreak: () => pp && pp.appear() })); }
  else if (!flag('pp_villa2')) L.add(new Pepita(31.5, 1.3, 5.5, 'pp_villa2'));
  { const pp = flag('pp_villa3') ? null : L.add(new Pepita(0, 0.4, -27.4, 'pp_villa3', { hidden: !flag('yemaVilla') })); L.add(new Yema(0, 3.6, -29.95, 0, { wall: true, key: 'yemaVilla', s: 1.5, onOn: () => pp && pp.appear(0, 3, -28.6) })); }
  // cielo: sol y la tira de piel que alguien está pelando
  const sun = A.makeSkyCard([0, 40, 32, 32], 26, 26); sun.position.set(70, 62, -120); sun.lookAt(0, 10, 0); L.group.add(sun);
  const strip = A.makeSkyCard([32, 40, 64, 24], 90, 30); strip.position.set(-80, 70, -140); strip.rotation.set(0.2, 0.5, -0.5); L.group.add(strip); L.strip = strip;
  L.tick = (dt) => { strip.rotation.z = -0.5 + Math.sin(G.t * 0.3) * 0.05; if (rnd() < 0.08) { const p = G.player.pos; fx.one(P.flake, p.x + (rnd() - 0.5) * 30, p.y + 8 + rnd() * 4, p.z + (rnd() - 0.5) * 30, { vy: -0.7, vx: 0.6, g: 0, life: 9, size: 0.22, wob: 0.8 }); } };
  L.resumeMusic = () => audio.music(done ? 'calm' : (G.player.pos.x > 19 ? 'hill' : 'village'), { fade: 0.8 });
  L.zone(19, -19, 34, 10, () => { if (!flag('jefe')) audio.music('hill', { fade: 1.2 }); }, { once: false, onExit: () => { if (!flag('jefe')) audio.music('village', { fade: 1.2 }); } });
  L.onEnter = S.villaEnter;
  return L.finish();
}

// ══════════════════════════ LA CISTERNA ══════════════════════════
export function cisterna() {
  const L = new Level('cisterna'); const r = rng(4242);
  L.title = 'LA CISTERNA'; L.sub = 'CAPA II · LA TÚNICA'; L.music = 'cistern';
  L.sky = [0, 0, 1, 1]; L.fog = [15, 34, 0]; L.dark = 1.0; L.amb = 0.45; L.stars = 0; L.killY = -14; L.camFree = true; L.camBase = { dist: 7.8, pitch: 0.56 };
  const filled = !!flag('agua');
  const fl = (x0, z0, x1, z1, y = 0, tile = TI.losa) => L.block(x0, y - 2, z0, x1, y, z1, { top: tile, side: TI.losaOsc, mat: 'stone' });
  const WH = 4.2;
  // muro con zócalo y cornisa
  const wall = (x0, z0, x1, z1, y = 0, h = WH, o = {}) => {
    L.block(x0, y, z0, x1, y + 1, z1, { side: TI.zocalo, top: TI.negro, faces: 'nsew' });
    L.block(x0, y + 1, z0, x1, y + h, z1, { side: o.vein ? TI.ladrilloV : TI.ladrillo, sideTop: TI.cornisa, top: TI.losaOsc });
  };
  const room = (id, name, x0, z0, x1, z1) => { L.rooms.push({ id, name, x0, z0, x1, z1 }); L.zone(x0, z0, x1, z1, () => { G.save.rooms[id] = 1; }, { once: true }); };

  // ── R0: el Brocal ──
  fl(-4, -4, 4, 4); L.decal(-1, -1, 1, 1, 0, TI.losaLagrima); L.decal(-1, -4, 1, -1, 0, TI.canalD);
  wall(-5, 4, 5, 5); wall(-5, -4, -4, 4, 0, WH, { vein: true }); wall(4, -4, 5, 4); wall(-5, -5, -1.2, -4); wall(1.2, -5, 5, -4);
  room('r0', 'EL BROCAL', -4, -4, 4, 4);
  L.spawn.entrada = [0, 0, 1.2, Math.PI]; L.spawn.cis0 = [-2.6, 0, 1.4, Math.PI];
  L.decal(-3.4, 1.6, -1.8, 3.2, 0, TI.bancal); L.add(new Bancal(-2.6, 0, 2.4, 'cis0'));
  L.add(new Sign(2.4, 0, -2.8, -0.3, 'C_CISTERNA')); L.add(new Pot(3.2, 0, 3.2)); L.add(new Pot(2.4, 0, 3.4)); L.add(new Lantern(-3.2, 0, -3.2, { r: 5 }));
  const beam = A.makeBeam(12, 0.9); beam.position.set(0, 0, 0); beam.material.uniforms.uHide.value = 0.8; L.group.add(beam);
  L.light(0, 2, 0, 5);
  L.ropeEnt = L.add(new S.Cuerda(0, 0, 0));
  // pasillo 0→1
  fl(-1.2, -8, 1.2, -4, 0, TI.canalD); wall(-2.2, -8, -1.2, -5); wall(1.2, -8, 2.2, -5);

  // ── R1: sala de los pulgones ──
  fl(-6, -20, 6, -8); L.decal(-1, -20, 1, -8, 0, TI.canalD); for (const [x, z] of [[-4, -11], [3, -17], [-2, -15]]) L.decal(x, z, x + 1, z + 1, 0, TI.losaRota);
  wall(-7, -8, -1.2, -7); wall(1.2, -8, 7, -7); wall(-7, -20, -6, -8); wall(6, -20, 7, -15.2, 0, WH, { vein: true }); wall(6, -11.8, 7, -8, 0, WH, { vein: true }); wall(-7, -21, -1.2, -20);
  // nicho tras la pared agrietada del este
  fl(6, -15.2, 9.6, -11.8, 0, TI.losaLagrima); wall(7, -16.2, 10.6, -15.2); wall(7, -11.8, 10.6, -10.8); wall(9.6, -15.2, 10.6, -11.8);
  if (!flag('grietaCis')) L.add(new Breakable(6.5, 0, -13.5, 1, WH, 3.4, { kind: 'grieta', key: 'grietaCis', cut: true }));
  if (!flag('pp_cis1')) L.add(new Pepita(8.4, 0.3, -13.5, 'pp_cis1')); wall(1.2, -21, 7, -20);
  room('r1', 'SALA DE LOS PULGONES', -6, -20, 6, -8);
  for (const [x, z] of [[-4.6, -9.6], [4.6, -9.6], [-4.6, -18.4], [4.6, -18.4]]) L.add(new Lantern(x, 0, z, { r: 4.5 }));
  for (let i = 0; i < 9; i++) L.add(new Chive(-5 + r() * 10, 0, -19 + r() * 10));
  L.add(new Pot(-5.2, 0, -14)); L.add(new Pot(5.2, 0, -13)); L.add(new Pot(5.2, 0, -14.2));
  const r1in = L.add(new Bars(0, 0, -8.2, 2.4, 2.4, 'x', { open: true })), r1out = L.add(new Bars(0, 0, -20.2, 2.4, 2.4, 'x', { open: !!flag('r1') }));
  if (!flag('r1')) {
    const pack = [[-3, -13], [3, -14], [0, -17], [-3.5, -17.5], [3.5, -10.5]].map(([x, z]) => L.add(new Pulgon(x, 0, z, { aggro: 10 })));
    L.zone(-6, -19, 6, -9.4, () => { r1in.set(false); audio.music('boss', { fade: 0.3 }); G.hintOnce('fijar', 'H_FIJAR'); }, { once: true });
    L.onKill = e => { if (pack.includes(e) && pack.every(q => q.dead)) { flag('r1', 1); r1in.set(true); r1out.set(true); audio.sfx('secret'); audio.music('cistern', { fade: 1 }); G.drop(0, 0, -14, { tears: 5, big: true }); } };
  }
  // pasillo 1→2
  fl(-1.2, -24, 1.2, -20, 0, TI.canalD); wall(-2.2, -24, -1.2, -21); wall(1.2, -24, 2.2, -21);

  // ── R2: las Plañideras (balcón + alberca) ──
  fl(-9, -28, 9, -24); fl(-9, -44, 9, -41);                       // balcón sur y repisa norte
  L.block(-9, -5, -41, 9, -3, -28, { top: TI.losaOsc, side: TI.losaOsc });                // fondo de la alberca
  for (let i = 0; i < 6; i++) L.decal(-8 + i * 3, -40 + (i % 3) * 4, -7 + i * 3, -39 + (i % 3) * 4, -3, TI.losaLagrima);
  L.block(-9, -3, -28.01, 9, 0, -28, { side: TI.ladrillo, noCol: true, faces: 'n' }); L.block(-9, -3, -41, 9, 0, -40.99, { side: TI.ladrillo, noCol: true, faces: 's' });
  L.ramp(-9, -35, -6.6, -28, -3, 0, 's', { top: TI.losa, side: TI.losaOsc });
  wall(-10, -24, -1.2, -23); wall(1.2, -24, 10, -23);
  wall(-10, -45, -9, -37.2, -3, WH + 3); wall(-10, -34.8, -9, -24, -3, WH + 3); L.block(-10, -0.6, -37.2, -9, WH, -34.8, { side: TI.ladrillo, sideTop: TI.cornisa });
  wall(9, -45, 10, -27.1, -3, WH + 3); wall(9, -24.9, 10, -24, -3, WH + 3); L.block(9, 0.95, -27.1, 10, WH, -24.9, { side: TI.ladrillo, sideTop: TI.cornisa }); L.block(9, -3, -27.1, 10, 0, -24.9, { side: TI.ladrillo });
  wall(-10, -45, -1.6, -44); wall(1.6, -45, 10, -44);
  room('r2', 'LAS PLAÑIDERAS', -9, -44, 9, -24);
  for (const [x, z] of [[-8, -25], [8, -25], [-8, -43], [8, -43]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.add(new Sign(3, 0, -26.6, 0, 'C_PLANIDERAS')); L.add(new Sign(7.4, 0, -27.3, -0.5, 'C_RATONERA'));
  L.pool = L.water(-9, -41, 9, -28, filled ? -0.32 : -3.05, { tile: TI.aguaOsc, on: filled, kind: 'waterGlow' });
  L.stA = L.add(new Statue(-5.5, -3, -37, Math.PI / 2, { s: 1.2, onCry: S.planidera })); L.stB = L.add(new Statue(5.5, -3, -33, -Math.PI / 2, { s: 1.2, onCry: S.planidera }));
  if (filled) { L.stA.setCry(true, true); L.stB.setCry(true, true); L.light(-5.5, 0.5, -37, 7); L.light(5.5, 0.5, -33, 7); }
  L.zone(-9, -41, 9, -30, () => G.hintOnce('planidera', 'H_PLANIDERA'), { y1: -1, once: true });
  // la ratonera (este): solo pasa una cebolla de una capa
  L.addSolid({ x0: 9, x1: 10.01, z0: -27.1, z1: -24.9, y0: 0, y1: 0.95, gap: true, noClimb: true, mat: 'stone', noCam: true });
  L.decal(9, -27.1, 10, -24.9, 0, TI.canalD);
  L.zone(6, -28, 9, -24, () => { if (!G.player.small) G.hintOnce('ratonera', 'H_RATONERA'); }, { once: false });
  // bancal de la repisa norte y compuerta del desagüe
  L.decal(-7.4, -43.4, -5.4, -41.6, 0, TI.bancal); L.add(new Bancal(-6.4, 0, -42.5, 'cis5')); L.spawn.cis5 = [-4.6, 0, -42.5, 1.57];
  L.bossDoor = L.add(new Slab(0, 0, -44.4, 3.2, 3.4, 'x', { boss: true, needs: 'llave', key: 'puertaJefe' }));
  { const pp = flag('pp_cis2') ? null : L.add(new Pepita(5.4, 0.4, -42.4, 'pp_cis2', { hidden: !flag('yemaCis') })); L.add(new Yema(5.4, 3, -43.95, 0, { wall: true, key: 'yemaCis', s: 1.2, onOn: () => pp && pp.appear(5.4, 2.6, -43) })); L.light(5.4, 3, -42.8, 2.6); }
  L.spawn.desague = [0, 0, -61.5, 0];

  // ── R3: sala del peso (oeste, al nivel del fondo) ──
  fl(-24, -41, -10, -31, -3); L.decal(-11, -37, -10, -35, -3, TI.canalD);
  fl(-10, -37.2, -9, -34.8, -3, TI.canalD);
  wall(-25, -42, -10, -41, -3, WH + 1); wall(-25, -31, -10, -30, -3, WH + 1); wall(-25, -41, -24, -31, -3, WH + 1, { vein: true });
  room('r3', 'SALA DEL PESO', -24, -41, -10, -31);
  for (const [x, z] of [[-11.5, -39.5], [-22.5, -32.5], [-22.5, -39.5]]) L.add(new Lantern(x, -3, z, { r: 5 }));
  L.block(-23.5, -3, -38, -20.5, -2.5, -34, { top: TI.losaLagrima, side: TI.zocalo }); L.ramp(-20.5, -37, -19.5, -35, -3, -2.5, 'w', { top: TI.losa, side: TI.zocalo });
  L.add(new Chest(-22.4, -2.5, -36, Math.PI / 2, 'mondador', { key: 'cofreMondador' }));
  L.decal(-23.6, -33.6, -21.6, -31.8, -3, TI.bancal); L.add(new Bancal(-22.6, -3, -32.7, 'cis3')); L.spawn.cis3 = [-20.8, -3, -32.7, 1.57];
  L.add(new Sign(-12.4, -3, -33, 0.3, 'C_PESO'));
  const r3bars = L.add(new Bars(-9.5, -3, -36, 2.4, 2.4, 'z', { open: true }));
  const plate = L.add(new Plate(-13.2, -3, -36, { onDown: () => r3bars.set(true), onUp: () => { if (flag('r3in')) r3bars.set(false); } }));
  L.zone(-23, -40, -12, -32, () => { flag('r3in', 1); if (!plate.down) r3bars.set(false); if (!flag('mondador')) audio.sfx('error', { pitch: 0.6 }); }, { once: true, y1: -1 });
  if (!flag('cofreMondador')) { L.add(new Babosa(-17, -3, -37.5)); L.add(new Pulgon(-16, -3, -33, { aggro: 7 })); L.add(new Pulgon(-19, -3, -39, { aggro: 7 })); }
  L.add(new Pot(-11, -3, -32)); L.add(new Pot(-11, -3, -40)); L.add(new Pot(-12.1, -3, -40));
  L.r3bars = r3bars;

  // ── R4: sala del aforo (este, tras la ratonera) ──
  fl(10, -34, 24, -19); wall(10, -19, 25, -18); wall(10, -35, 25, -34); wall(24, -34, 25, -19, 0, WH, { vein: true }); wall(10, -24.9, 11, -19); wall(10, -34, 11, -27.1);
  L.block(10, 0.95, -27.1, 11, WH, -24.9, { side: TI.ladrillo, sideTop: TI.cornisa }); L.addSolid({ x0: 10, x1: 11, z0: -27.1, z1: -24.9, y0: 0, y1: 0.95, gap: true, noClimb: true, noCam: true }); L.decal(10, -27.1, 11, -24.9, 0, TI.canalD);
  room('r4', 'SALA DEL AFORO', 11, -34, 24, -19);
  for (const [x, z] of [[12.5, -20.5], [22.5, -20.5], [12.5, -32.5]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.decal(12.2, -22.6, 14.2, -20.8, 0, TI.bancal); L.add(new Bancal(13.2, 0, -21.7, 'cis4')); L.spawn.cis4 = [15, 0, -21.7, -1.57];
  L.block(19.6, 0, -34, 24, 2.3, -29.6, { top: TI.losaLagrima, side: TI.ladrillo, sideTop: TI.cornisa });
  L.add(new Chest(22, 2.3, -32, 0, 'llave', { big: true, key: 'cofreLlave' }));
  L.add(new Block(15, 0, -31.8, { limit: [13.2, -33.4, 19, -20.6] })); L.add(new Sign(13, 0, -29.4, 0.5, 'C_BLOQUE'));
  L.decal(18.4, -32.4, 19.6, -31.2, 0, TI.losaLagrima);
  if (!flag('cofreLlave')) { L.add(new Trips(18, 1.4, -24)); L.add(new Trips(21, 1.4, -27)); }
  L.add(new Pot(23.2, 0, -20)); L.add(new Pot(23.2, 0, -21.2)); L.add(new Pot(22, 0, -19.9));

  // ── pasillo al desagüe y arena de Tapona ──
  fl(-1.6, -50, 1.6, -44, 0, TI.canalD); wall(-2.6, -50, -1.6, -45); wall(1.6, -50, 2.6, -45);
  fl(-11, -72, 11, -50, 0, TI.losa); L.decal(-3, -66, 3, -60, 0, TI.rejilla); L.decal(-1, -60, 1, -50, 0, TI.canalD);
  for (let i = 0; i < 10; i++) { const x = -10 + r() * 19, z = -71 + r() * 20; L.decal(x, z, x + 1, z + 1, 0, r() < 0.5 ? TI.losaRota : TI.moho); }
  wall(-12, -50, -1.6, -49); wall(1.6, -50, 12, -49); wall(-12, -73, 12, -72, 0, WH + 2, { vein: true }); wall(-12, -72, -11, -50, 0, WH + 2); wall(11, -72, 12, -50, 0, WH + 2);
  for (const [x, z] of [[-11, -72], [8, -72], [-11, -53], [8, -53]]) L.block(x, 0, z, x + 3, WH + 2, z + 3, { side: TI.ladrillo, sideTop: TI.cornisa, top: TI.losaOsc });
  room('r5', 'EL DESAGÜE', -11, -72, 11, -50);
  for (const [x, z] of [[-7.5, -51], [7.5, -51], [-10.2, -62], [10.2, -62], [-7.5, -71], [7.5, -71]]) L.add(new Lantern(x, 0, z, { r: 6 }));
  L.decal(-10.2, -58.9, -8.4, -57.1, 0, TI.bancal); L.add(new Bancal(-9.3, 0, -58, 'cisJ1', { noSave: true })); L.decal(8.4, -58.9, 10.2, -57.1, 0, TI.bancal); L.add(new Bancal(9.3, 0, -58, 'cisJ2', { noSave: true }));
  L.arenaBars = L.add(new Bars(0, 0, -50.2, 3.2, 2.6, 'x', { open: true }));
  L.camZone = p => (p.z < -50 && (G.boss || !flag('jefe'))) ? { dist: 8.4, pitch: 0.5 } : null;
  if (!flag('jefe')) { L.tapona = L.add(new Tapona(0, 0, -65)); L.zone(-11, -72, 11, -52.5, S.bossStart, { once: true }); }
  else S.afterBossProps(L);

  L.resumeMusic = () => audio.music(G.boss ? 'boss' : flag('jefe') ? 'calm' : 'cistern', { fade: 0.8 });
  L.onEnter = S.cisternaEnter;
  L.tick = dt => { if (L.pool.on) L.pool.mesh.material.uniforms.uScroll.value.set(G.t * 0.03, G.t * 0.02); };
  return L.finish();
}
export const LEVELS = { villa, cisterna, pulpa, raicera };
