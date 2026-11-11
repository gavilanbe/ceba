// levels2.js — capítulo II: el Raigal (capa III, la Pulpa) y su mazmorra, la Raicera.
import { THREE, MB, mat } from './gfx.js';
import { Level } from './world.js';
import { TI, cell, tilesTex } from './art/tiles.js';
import * as A from './art/props.js';
import * as Q from './art/pulpa.js';
import { G, flag } from './state.js';
import { Ent, Chive, Pot, Sign, Chest, Bars, Slab, Plate, Bancal, Lantern } from './ents.js';
import { Breakable, Yema, Pepita, Seta, Deco } from './ents2.js';
import { NPC, Bicho, Trips, Mohin, Gorgojo } from './creatures.js';
import { Cavador } from './boss2.js';
import * as S from './story2.js';
import { rng } from './px.js';
import { fx, P, rnd } from './fx.js';
import { audio } from './audio.js';

// ══════════════════════════ EL RAIGAL ══════════════════════════
export function pulpa() {
  const L = new Level('pulpa'); const r = rng(909);
  L.title = 'EL RAIGAL'; L.sub = 'CAPA III · LA PULPA'; L.music = 'pulp';
  L.sky = [2, 2, 1, 0]; L.fog = [26, 70, 1]; L.dark = 1.45; L.amb = 0.5; L.stars = 1; L.skyOff = 0.0;
  const done = !!flag('raiz');
  const g = { top: TI.pulpa, side: TI.pulpaLado, mat: 'grass' };
  // suelo, con el hueco de la Charca del Goteo
  L.block(-42, -4, -50, 42, 0, 33, g); L.block(-42, -4, 33, -5, 0, 48, g); L.block(5, -4, 33, 42, 0, 48, g); L.block(-5, -4, 41, 5, 0, 48, g);
  L.block(-5, -4, 33, 5, -1.3, 41, { top: TI.canal, side: TI.pulpaLado, mat: 'stone' });
  L.charca = L.water(-5, 33, 5, 41, -0.35);
  // paredes de pulpa: el mundo se curva hacia arriba
  const cl = { top: TI.pulpaLado, side: TI.pulpaLado, sideTop: TI.pulpaLado };
  L.block(-48, 0, -50, -38, 9, 48, cl); L.block(38, 0, -50, 48, 9, 48, cl); L.block(-38, 0, 44, 38, 8, 50, cl);
  L.block(-38, 0, -50, -4, 10, -34, cl); L.block(4, 0, -50, 38, 10, -34, cl); L.block(-4, 0, -52, 4, 10, -48, cl);
  L.block(-38, 0, 38, -30, 3, 44, { ...cl, top: TI.pulpa }); L.block(30, 0, 40, 38, 2.2, 44, { ...cl, top: TI.pulpa });
  // caminos
  L.decal(-1.5, 4, 1.5, 33, 0, TI.pulpaCamino); L.decal(-8, -3, 8, 4, 0, TI.pulpaCamino); L.decal(-8, -24, -6.4, -3, 0, TI.pulpaCamino); L.decal(-8, -25.6, 1.5, -24, 0, TI.pulpaCamino); L.decal(-1.5, -47, 1.5, -25.6, 0, TI.pulpaCamino);
  L.decal(-24, 1.5, -8, 4, 0, TI.pulpaCamino); L.decal(8, 0, 18, 2.5, 0, TI.pulpaCamino);
  // ── la Charca del Goteo: aquí cae lo que se cuela del desagüe ──
  L.spawn.caida = [0, 0, 31, Math.PI]; L.spawn.pul0 = [8, 0, 34.2, Math.PI];
  L.decal(7, 35, 9, 37, 0, TI.bancal); L.add(new Bancal(8, 0, 36, 'pul0'));
  L.add(new Sign(3.4, 0, 31.4, 0.3, 'C_RAIGAL')); L.add(new Lantern(-3.4, 0, 31.6, { r: 6 })); L.add(new Lantern(6.2, 0, 32.2, { r: 5 }));
  const beam = A.makeBeam(22, 1.6); beam.position.set(0, -0.3, 37); beam.material.uniforms.uHide.value = 0.82; L.group.add(beam); L.light(0, 2, 37, 7);
  L.add(new S.Paso(-6.4, 0, 37, 'SUBIR', S.subirACisterna, { ir: 1.7 }));
  const liana = new MB().box(0.14, 22, 0.14, [104, 32, 8, 32]).mesh(mat(A.sheetA().tex)); liana.position.set(-6.4, 0, 37); L.group.add(liana);
  // ── Lombriguera: la plaza de las lombrices ──
  const houses = [[-9.5, 14.5, 1.1, 0.9, 7], [10, 15.5, 1.2, -0.9, 14], [-14, 5.5, 1.0, 1.5, 15], [13.5, 6.5, 1.05, -1.6, 7], [-12, 22, 0.95, 0.6, 14], [12, 24, 1.0, -0.5, 15], [17, -4, 1.1, -1.2, 7]];
  for (const [x, z, s, yaw, sw] of houses) { const h = A.makeHouse({ s, swap: sw }); L.add(new Deco(h.g, x, 0, z, h.r * 1.62, h.h, { yaw })); }
  L.anelida = L.add(new NPC(4.6, 0, -1.6, -0.6, 'anelida', S.anelidaTalk));
  L.add(new NPC(-6.6, 0, -1, 0.7, 'limo', S.limoTalk));
  L.add(new NPC(-4.2, 0, 10, 2.4, 'tubo', S.tuboTalk, { hop: true })); L.add(new NPC(5, 0, 11.5, -2.3, 'fideo', S.fideoTalk, { hop: true }));
  L.add(new NPC(15.5, 0, 12, -1.8, 'lombriz', S.lombrizTalk));
  L.block(-17.4, 0, 9.6, -14.6, 0.8, 10.6, { top: TI.tablon, side: TI.madera });
  L.add(new NPC(-16, 0, 12.4, 0.2, 'caracol', S.pasoTalk)); L.add(new Sign(-13.6, 0, 11.4, 0.5, 'C_PASO'));
  for (const [x, z] of [[-18.4, 10.4], [-18.9, 11.6], [-13.4, 9.6]]) L.add(new Pot(x, 0, z, { loot: { tears: 2, ajo: 0.7 } }));
  for (const [x, z] of [[-7.5, 4.5], [7.5, 4.5], [-2.6, 20], [2.6, 20], [-7.4, -17], [7.4, -17]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.add(new Sign(2.6, 0, 5.4, Math.PI, 'C_LOMBRIGUERA')); L.add(new Bicho(-3, 0, 16)); L.add(new Bicho(9, 0, 20));
  // ── la Raíz Madre y su poza ──
  for (const [x0, z0, x1, z1] of [[-6, -16, 6, -15], [-6, -5, 6, -4], [-6, -15, -5, -5], [5, -15, 6, -5]]) L.block(x0, 0, z0, x1, 0.5, z1, { top: TI.piedra, side: TI.piedra });
  L.decal(-5, -15, 5, -5, 0, done ? TI.charco : TI.canal);
  L.poza = L.water(-5, -15, 5, -5, done ? 0.34 : 0.02, { on: done });
  L.add(new Deco(Q.makeRootColumn(22, 1.5), 0, 0, -10, 3.4, 22));
  if (!done) { const m = A.tileBox(5.2, 1.5, 5.2, { all: TI.mohoMuro }).mesh(A.tileModelMatNew()); m.position.set(0, 0, -10); L.group.add(m); L.rootMold = m; const m2 = A.tileBox(3.6, 2.6, 3.6, { all: TI.mohoMuro }).mesh(m.material); m2.position.set(0, 1.5, -10); L.group.add(m2); L.rootMold2 = m2; }
  L.add(new Sign(7.4, 0, -3.4, -0.5, 'C_RAIZ'));
  // ── el Setal (oeste): terrazas a las que solo se sube botando ──
  const t1 = { top: TI.pulpa, side: TI.pulpaLado, mat: 'grass' };
  L.block(-38, 0, -8, -25, 2.4, 14, t1); L.block(-38, 0, -22, -30, 5, -8, t1);
  L.add(new Seta(-23, 0, 3)); L.add(new Seta(-34, 2.4, -6.3)); L.add(new Seta(-27.6, 0, -15.5, { s: 0.8, power: 11 }));
  L.add(new Sign(-21, 0, 5.2, -0.6, 'C_SETAL'));
  L.add(new Chest(-34.5, 5, -18.5, 0, 'l50')); if (!flag('pp_pul1')) L.add(new Pepita(-32, 5.3, -11.5, 'pp_pul1'));
  L.add(new Mohin(-31, 2.4, 6, { aggro: 7 })); L.add(new Mohin(-33, 2.4, 10.5, { aggro: 7 }));
  for (const [x, y, z, s] of [[-29, 2.4, 1, 1.5], [-36, 5, -14, 1.3], [-20, 0, -4, 1.2], [-26, 0, 17, 1.6], [-19, 0, 24, 1.1]]) L.add(new Deco(Q.makeLightShroom(s).g, x, y, z, 0.3, 1, { light: 6.5, ly: s, noCam: true }));
  for (let i = 0; i < 12; i++) { const x = -37 + r() * 11, z = -7 + r() * 20; L.add(new Chive(x, 2.4, z, { flower: r() < 0.5 })); }
  // ── los Raicillares (este): raicillas que segar, gorgojos y una roca con grieta ──
  for (let i = 0; i < 40; i++) { const x = 19 + r() * 18, z = -30 + r() * 62; if (Math.hypot(x - 17, z + 4) < 3 || Math.hypot(x - 31, z + 10) < 2.4 || Math.hypot(x - 24, z - 22) < 2.4) continue; L.add(new Chive(x, 0, z, { flower: r() < 0.25, rich: r() < 0.15 })); }
  L.add(new Gorgojo(26, 0, 2)); L.add(new Gorgojo(31, 0, 18)); L.add(new Sign(19, 0, 3.6, -0.4, 'C_RAICILLAR'));
  if (!flag('rocaRaigal')) { const pp = flag('pp_pul2') ? null : L.add(new Pepita(31, 0.3, -10, 'pp_pul2', { hidden: true })); L.add(new Breakable(31, 0, -10, 2.2, 2, 2.2, { kind: 'grieta', key: 'rocaRaigal', onBreak: () => pp && pp.appear() })); }
  else if (!flag('pp_pul2')) L.add(new Pepita(31, 0.3, -10, 'pp_pul2'));
  L.add(new Deco(Q.makeRootColumn(20, 1.0), 24, 0, 22, 2.2, 20));
  { const pp = flag('pp_pul3') ? null : L.add(new Pepita(24, 0.4, 18.6, 'pp_pul3', { hidden: !flag('yemaRaigal') })); L.add(new Yema(24, 4.4, 20.8, Math.PI, { wall: true, key: 'yemaRaigal', s: 1.3, onOn: () => pp && pp.appear(24, 3.6, 19.6) })); L.light(24, 4.4, 19.4, 3.2); }
  for (const [x, z, s] of [[34, 30, 1.6], [21, -20, 1.2], [35, -4, 1.4], [28, 9, 1.1]]) L.add(new Deco(Q.makeLightShroom(s).g, x, 0, z, 0.3, 1, { light: 6.5, ly: s, noCam: true }));
  // columnas de raíz que sujetan el techo
  for (const [x, z, s] of [[-20, -27, 1.1], [18, -27, 1.2], [-27, 28, 1.3], [29, 34, 1.0], [-17, -11, 0.8], [-10, 34, 0.9]]) L.add(new Deco(Q.makeRootColumn(22, s), x, 0, z, s * 2.3, 22));
  // ── el paso a la Raicera (norte): moho cerrando el desfiladero ──
  L.add(new Sign(3, 0, -30.6, 0.2, 'C_DESFILADERO'));
  if (!flag('mohoRaigal')) { L.add(new Breakable(0, 0, -36, 8, 4.6, 1.5, { key: 'mohoRaigal' })); L.add(new Mohin(-2.5, 0, -30, { aggro: 8 })); L.add(new Mohin(2.6, 0, -28.5, { aggro: 8 })); }
  L.block(-1.7, 0, -48.02, 1.7, 3.6, -48, { side: TI.puertaRaiz, faces: 's', noCol: true }); L.light(0, 2, -45, 5);
  L.spawn.raicera = [0, 0, -44, 0];
  L.zone(-4, -48, 4, -46.4, S.entrarRaicera, { once: false });
  for (const [x, z] of [[-3.2, -40], [3.2, -43]]) L.add(new Deco(Q.makeLightShroom(1.2).g, x, 0, z, 0.3, 1, { light: 6, ly: 1.2, noCam: true }));
  for (let i = 0; i < 30; i++) { const x = -36 + r() * 72, z = -32 + r() * 74; if (Math.abs(x) < 9 && z > -18 && z < 6) continue; L.decal(x, z, x + 1, z + 1, 0, TI.musgoLuz); }

  L.map = { x0: -38, z0: -48, x1: 38, z1: 44, rects: [[-38, -8, -25, 14, 14], [-38, -22, -30, -8, 14], [-5, 33, 5, 41, 12], [-5, -15, 5, -5, done ? 12 : 5], [-4, -48, 4, -34, 4], [-8, -3, 8, 22, 7]], marks: [[0, -10, 9], [8, 36, 4], [-16, 12, 11], [0, -47, 8]] };
  L.tick = dt => {
    const p = G.player.pos;
    if (rnd() < 0.2) fx.one(rnd() < 0.5 ? P.sqW : P.sqP, p.x + (rnd() - 0.5) * 28, p.y + rnd() * 5, p.z + (rnd() - 0.5) * 28, { vy: 0.3 + rnd() * 0.3, vx: (rnd() - 0.5) * 0.4, g: 0, life: 4, size: 0.1, wob: 0.8 });
    if (rnd() < 0.1) fx.one(P.drop, (rnd() - 0.5) * 6, 12, 37 + (rnd() - 0.5) * 5, { vy: -6, g: 12, life: 1.3, size: 0.26, floor: -0.3 });
    if (L.poza.on && rnd() < 0.5) fx.one(P.drop, Math.cos(G.t * 7 + rnd() * 6) * 1.8, 6 + rnd() * 6, -10 + Math.sin(G.t * 5 + rnd() * 6) * 1.8, { vy: -5, g: 10, life: 1.2, size: 0.24, floor: 0.34 });
  };
  L.resumeMusic = () => audio.music(done ? 'calm' : 'pulp', { fade: 0.8 });
  L.onEnter = S.pulpaEnter;
  return L.finish();
}

// ══════════════════════════ LA RAICERA ══════════════════════════
export function raicera() {
  const L = new Level('raicera'); const r = rng(5150);
  L.title = 'LA RAICERA'; L.sub = 'BAJO LA RAÍZ MADRE'; L.music = 'roots';
  L.sky = [0, 0, 2, 2]; L.fog = [15, 34, 0]; L.dark = 1.0; L.amb = 0.45; L.killY = -14; L.camFree = true; L.camBase = { dist: 7.8, pitch: 0.56 };
  const WH = 4.2;
  const fl = (x0, z0, x1, z1, y = 0, tile = TI.raizLosa, deep = 2) => L.block(x0, y - deep, z0, x1, y, z1, { top: tile, side: TI.tierraOsc, mat: 'stone' });
  const wall = (x0, z0, x1, z1, y = 0, h = WH) => { L.block(x0, y, z0, x1, y + 1, z1, { side: TI.raizZocalo, top: TI.negro, faces: 'nsew' }); L.block(x0, y + 1, z0, x1, y + h, z1, { side: TI.raizMuro, sideTop: TI.raizCornisa, top: TI.tierraOsc }); };
  const room = (id, name, x0, z0, x1, z1) => { L.rooms.push({ id, name, x0, z0, x1, z1 }); L.zone(x0, z0, x1, z1, () => { G.save.rooms[id] = 1; }, { once: true }); };
  const moss = (n, x0, z0, x1, z1, y = 0) => { for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0 - 1), z = z0 + r() * (z1 - z0 - 1); L.decal(x, z, x + 1, z + 1, y, r() < 0.5 ? TI.musgoLuz : TI.tierraOsc); } };

  // ── R0: el Vestíbulo ──
  fl(-4, -4, 4, 5.5); wall(-5, 5.5, 5, 6.5); wall(-5, -4, -4, 5.5); wall(4, -4, 5, 5.5); wall(-5, -5, -1.2, -4); wall(1.2, -5, 5, -4);
  L.block(-1.7, 0, 5.48, 1.7, 3.4, 5.5, { side: TI.puertaRaiz, faces: 'n', noCol: true });
  room('r0', 'EL VESTÍBULO', -4, -4, 4, 5.5);
  L.spawn.entrada = [0, 0, 3.2, Math.PI]; L.spawn.rai0 = [-2.6, 0, 0.4, Math.PI];
  L.decal(-3.4, 0.8, -1.8, 2.4, 0, TI.bancal); L.add(new Bancal(-2.6, 0, 1.6, 'rai0'));
  L.add(new Sign(2.4, 0, -2.6, -0.3, 'C_RAICERA')); L.add(new Lantern(3.2, 0, 2.4, { r: 5 })); L.add(new Lantern(-3.2, 0, -3.2, { r: 5 }));
  L.add(new Pot(3.3, 0, 4.4, { loot: { tears: 1, ajo: 1, ajoN: 2 } })); L.add(new Pot(2.3, 0, 4.6));
  L.add(new S.Paso(0, 0, 5.2, 'SALIR', S.salirRaicera, { ir: 1.5 }));
  fl(-1.2, -8, 1.2, -4); wall(-2.2, -8, -1.2, -5); wall(1.2, -8, 2.2, -5);

  // ── R1: la Sala del Moho ──
  fl(-6, -20, 6, -8); moss(8, -6, -20, 6, -8);
  wall(-7, -8, -1.2, -7); wall(1.2, -8, 7, -7); wall(-7, -20, -6, -8); wall(6, -20, 7, -8); wall(-7, -21, -1.2, -20); wall(1.2, -21, 7, -20);
  room('r1', 'SALA DEL MOHO', -6, -20, 6, -8);
  for (const [x, z] of [[-4.6, -9.6], [4.6, -9.6], [-4.6, -18.4], [4.6, -18.4]]) L.add(new Lantern(x, 0, z, { r: 4.5 }));
  L.add(new Sign(3.6, 0, -9.4, 0.2, 'C_MOHO')); L.add(new Pot(-5.2, 0, -14, { loot: { tears: 1, ajo: 0.8 } })); L.add(new Pot(5.2, 0, -13)); L.add(new Pot(5.2, 0, -14.2, { loot: { tears: 1, ajo: 0.8 } }));
  const r1in = L.add(new Bars(0, 0, -8.2, 2.4, 2.4, 'x', { open: true })), r1out = L.add(new Bars(0, 0, -20.2, 2.4, 2.4, 'x', { open: !!flag('rai1') }));
  if (!flag('rai1')) {
    for (const [x, z] of [[-3, -13], [3, -15], [0, -17.5]]) L.add(new Mohin(x, 0, z, { aggro: 12 }));
    L.zone(-6, -19, 6, -9.4, () => { r1in.set(false); audio.music('boss', { fade: 0.3 }); G.hintOnce('mohin0', 'H_MOHIN0'); }, { once: true });
    L.onKill = e => { if (e instanceof Mohin && !flag('rai1') && !L.ents.some(q => q instanceof Mohin && !q.dead && q.pos.z > -21)) { flag('rai1', 1); r1in.set(true); r1out.set(true); audio.sfx('secret'); audio.music('roots', { fade: 1 }); G.drop(0, 0, -14, { tears: 6, big: true, ajo: 1, ajoN: 3 }); } };
  }
  fl(-1.2, -24, 1.2, -20); wall(-2.2, -24, -1.2, -21); wall(1.2, -24, 2.2, -21);

  // ── R2: el Cruce ──
  fl(-8, -40, 8, -24); L.decal(-1, -40, 1, -24, 0, TI.canalD); L.decal(-8, -32, 8, -30, 0, TI.canalD); L.decal(-2, -33, 2, -29, 0, TI.losaLagrima); moss(8, -8, -40, 8, -24);
  wall(-9, -24, -1.2, -23); wall(1.2, -24, 9, -23); wall(-9, -41, -1.6, -40); wall(1.6, -41, 9, -40);
  wall(-9, -40, -8, -32.2); wall(-9, -29.8, -8, -24); wall(8, -40, 9, -32.2); wall(8, -29.8, 9, -24);
  room('r2', 'EL CRUCE', -8, -40, 8, -24);
  for (const [x, z] of [[-6.6, -25.4], [6.6, -25.4], [-6.6, -38.6], [6.6, -38.6]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.decal(-6.6, -27.6, -5, -25.8, 0, TI.bancal); L.add(new Bancal(-5.8, 0, -26.7, 'rai2')); L.spawn.rai2 = [-4, 0, -26.7, -1.57];
  L.add(new Sign(3.4, 0, -25.4, 0.2, 'C_CRUCE')); L.add(new Pot(6.8, 0, -36.6, { loot: { tears: 1, ajo: 0.8 } })); L.add(new Pot(-6.8, 0, -36.6)); L.add(new Pot(-6.8, 0, -35.4));
  // puerta este: dos yemas, una a cada lado
  const eDoor = L.add(new Slab(8.5, 0, -31, 2.4, 3.4, 'z', { key: 'puertaSavia', tile: TI.puertaRaiz }));
  const eY = [];
  const eCheck = () => { if (eY.every(y => y.on) && !eDoor.isOpen) { eDoor.set(true); flag('puertaSavia', 1); audio.sfx('secret'); } };
  for (const [z, k] of [[-35, 'yE1'], [-27, 'yE2']]) { eY.push(L.add(new Yema(7.95, 2.6, z, -Math.PI / 2, { wall: true, key: k, onOn: eCheck }))); L.light(7, 2.6, z, 2.6); }
  L.bossDoor = L.add(new Slab(0, 0, -40.4, 3.2, 3.4, 'x', { boss: true, needs: 'llaveRaiz', key: 'puertaJefe2', lockText: 'PUERTA_JEFE2', tile: TI.puertaRaiz }));

  // ── R3: la Sala de la Cerbatana (oeste) ──
  fl(-14, -32.2, -8, -29.8); wall(-14, -33.2, -9, -32.2); wall(-14, -29.8, -9, -28.8);
  fl(-30, -40, -14, -22); moss(10, -30, -40, -14, -22);
  wall(-31, -41, -14, -40); wall(-31, -22, -14, -21); wall(-31, -40, -30, -22); wall(-15, -40, -14, -33.2); wall(-15, -28.8, -14, -22);
  room('r3', 'SALA DE LA CERBATANA', -30, -40, -14, -22);
  for (const [x, z] of [[-16.4, -38.4], [-16.4, -23.6], [-28.4, -38.4], [-28.4, -23.6]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.block(-29.4, 0, -33, -26, 0.4, -29, { top: TI.losaLagrima, side: TI.raizZocalo });
  L.add(new Chest(-27.8, 0.4, -31, Math.PI / 2, 'cerbatana', { big: true, key: 'cofreCerbatana' }));
  if (!flag('cofreCerbatana')) { L.add(new Gorgojo(-21, 0, -27, { aggro: 10 })); L.add(new Gorgojo(-23, 0, -36, { aggro: 10 })); }
  L.add(new Sign(-16.4, 0, -29, -0.4, 'C_GORGOJO')); L.add(new Pot(-29, 0, -38.8, { loot: { tears: 2, ring: 1 } })); L.add(new Pot(-29, 0, -23.2));
  const r3bars = L.add(new Bars(-14.5, 0, -31, 2.4, 2.4, 'z', { open: true }));
  const r3Y = []; let r3closed = false;
  const r3Check = () => { if (r3Y.every(y => y.on) && !flag('r3yemas')) { flag('r3yemas', 1); r3bars.set(true); audio.sfx('secret'); audio.jingle('secret'); G.drop(-22, 0, -31, { tears: 6, big: true, ring: 1 }); } };
  for (const [x, y, z, yaw] of [[-22, 2.7, -39.95, 0], [-22, 2.7, -22.05, Math.PI], [-15.05, 3.5, -36.5, -Math.PI / 2]]) { const ye = L.add(new Yema(x, y, z, yaw, { wall: true, onOn: r3Check })); if (flag('r3yemas')) ye.set(true, true); r3Y.push(ye); L.light(x + Math.sin(yaw), y, z + Math.cos(yaw), 2.6); }

  // ── R4: la Sala de la Savia (este) ──
  fl(8, -32.2, 14, -29.8); wall(9, -33.2, 14, -32.2); wall(9, -29.8, 14, -28.8);
  const filled = !!flag('savia');
  L.block(14, -5, -41, 18, 0, -21, { top: TI.raizLosa, side: TI.raizMuro });                    // balcón
  L.block(18, -5, -41, 26.5, -3, -21, { top: TI.tierraOsc, side: TI.tierraOsc });               // fondo de la alberca
  L.block(26.5, -5, -41, 31, 0, -21, { top: TI.raizLosa, side: TI.raizMuro });                  // repisa del otro lado
  L.ramp(18, -27.4, 20.2, -21, -3, 0, 's', { top: TI.raizLosa, side: TI.tierraOsc });
  wall(13, -42, 27.6, -41, -3, WH + 3); wall(29.9, -42, 32, -41, -3, WH + 3); wall(13, -21, 32, -20, -3, WH + 3); wall(31, -41, 32, -21, -3, WH + 3); wall(13, -41, 14, -32.2); wall(13, -29.8, 14, -21);
  L.block(26.5, 0, -41, 27, 3.4, -31.6, { side: TI.raizMuro, sideTop: TI.raizCornisa, top: TI.tierraOsc });   // pretil: a la parte norte solo se entra por el moho
  room('r4', 'SALA DE LA SAVIA', 14, -41, 31, -21);
  for (const [x, z] of [[15, -40], [15, -22], [30, -22.2], [30, -39.8]]) L.add(new Lantern(x, 0, z, { r: 5 }));
  L.savia = L.water(18, -41, 26.5, -21, filled ? -0.32 : -3.05, { tile: TI.savia, on: filled, kind: 'savia' });
  L.decal(14.6, -23.6, 16.4, -21.8, 0, TI.bancal); L.add(new Bancal(15.5, 0, -22.7, 'rai4')); L.spawn.rai4 = [15.5, 0, -24.6, Math.PI];
  L.add(new Sign(16.6, 0, -33.4, 0.5, 'C_SAVIA'));
  L.light(30, 2.4, -25.5, 3.4);
  L.add(new Yema(30.95, 2.4, -25.5, -Math.PI / 2, { wall: true, key: 'savia', s: 1.3, onOn: S.subeSavia }));
  if (!filled) { L.add(new Mohin(22, -3, -34, { aggro: 6 })); L.add(new Mohin(23, -3, -27, { aggro: 6, small: true })); }
  L.add(new Pot(30.2, 0, -27.6, { loot: { tears: 1, ajo: 1, ajoN: 2 } })); L.add(new Pot(30.2, 0, -28.8, { loot: { tears: 1, ajo: 1, ajoN: 2 } })); L.add(new Pot(27.4, 0, -22)); 
  if (!flag('mohoSavia')) L.add(new Breakable(29, 0, -31, 4, 3.6, 1.2, { key: 'mohoSavia', cut: true }));
  // la placa y el nicho de la llave
  fl(26.5, -47, 31, -42); wall(25.5, -48, 32, -47); wall(25.5, -47, 26.5, -42); wall(31, -47, 32, -42);
  fl(27.6, -42, 29.9, -41);
  const nb = L.add(new Bars(28.75, 0, -41.5, 2.3, 2.4, 'x', { open: !!flag('cofreLlaveRaiz') }));
  L.add(new Plate(28.9, 0, -35.5, { onDown: () => nb.set(true), onUp: () => { if (!flag('cofreLlaveRaiz')) nb.set(false); } }));
  L.add(new Sign(30.3, 0, -33, -0.4, 'C_PLACA')); L.add(new Lantern(27.6, 0, -39.6, { r: 4.5 })); L.light(28.75, 2, -45, 4);
  L.add(new Chest(28.75, 0, -45.2, 0, 'llaveRaiz', { big: true, key: 'cofreLlaveRaiz' }));

  // ── la Madriguera: Cavador ──
  fl(-1.6, -46, 1.6, -40); wall(-2.6, -46, -1.6, -41); wall(1.6, -46, 2.6, -41);
  L.block(-11, -2, -68, 11, 0, -46, { top: TI.raizLosa, side: TI.tierraOsc, mat: 'dirt' }); L.decal(-5, -62, 5, -52, 0, TI.tierraOsc); moss(16, -11, -68, 11, -46);
  wall(-12, -46, -1.6, -45); wall(1.6, -46, 12, -45); wall(-12, -69, 12, -68, 0, WH + 2); wall(-12, -68, -11, -46, 0, WH + 2); wall(11, -68, 12, -46, 0, WH + 2);
  room('r5', 'LA MADRIGUERA', -11, -68, 11, -46);
  for (const [x, z] of [[-10.2, -47], [10.2, -47], [-10.2, -57], [10.2, -57], [-10.2, -67], [10.2, -67]]) L.add(new Lantern(x, 0, z, { r: 6 }));
  L.decal(-10.4, -51.9, -8.6, -50.1, 0, TI.bancal); L.add(new Bancal(-9.5, 0, -51, 'raiJ1', { noSave: true })); L.decal(8.6, -51.9, 10.4, -50.1, 0, TI.bancal); L.add(new Bancal(9.5, 0, -51, 'raiJ2', { noSave: true }));
  for (const [x, z] of [[-10, -65], [10, -65], [-10, -62.6], [10, -62.6]]) L.add(new Pot(x, 0, z, { loot: { tears: 1, ajo: 1, ajoN: 2 } }));
  L.arenaBars = L.add(new Bars(0, 0, -46.2, 3.2, 2.6, 'x', { open: true }));
  L.camZone = p => (p.z < -46 && (G.boss || !flag('jefe2'))) ? { dist: 9, pitch: 0.52 } : null;
  if (!flag('jefe2')) { L.cavador = L.add(new Cavador(0, 0, -60, { cx: 0, cz: -57, hw: 11, hd: 11, onDead: (L_, b) => S.boss2End(L_, b) })); L.zone(-11, -68, 11, -48.4, S.boss2Start, { once: true }); }
  else S.afterBoss2Props(L);

  L.resumeMusic = () => audio.music(G.boss ? 'boss2' : flag('jefe2') ? 'calm' : 'roots', { fade: 0.8 });
  L.onEnter = S.raiceraEnter;
  L.tick = dt => {
    if (L.savia.on) L.savia.mesh.material.uniforms.uScroll.value.set(G.t * 0.02, G.t * 0.03);
    const p = G.player.pos;
    if (!r3closed && flag('cofreCerbatana') && !flag('r3yemas') && G.lock <= 0 && p.x < -15.5 && p.x > -30 && p.z > -40 && p.z < -22) { r3closed = true; r3bars.set(false); G.hint('H_CERBATANA', 7); }
  };
  return L.finish();
}
