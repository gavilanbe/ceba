// hero.js — Ceba, la cebolla dulce. Una hoja de textura de 128×128 y un bulbo de 8 lados.
import { Tex, T, rng } from '../px.js';
import { MB, mat, texFrom, texUpdate, THREE, blob } from '../gfx.js';

// piel según capas que le quedan: 3 = piel dorada, 2 = túnica morada, 1 = pulpa tierna
export const SKINS = [null,
  { base: 7, vein: 6, lite: 7, shade: 15, neck: 11, cheek: 14, root: 6 },
  { base: 14, vein: 2, lite: 15, shade: 8, neck: 2, cheek: 8, root: 2 },
  { base: 9, vein: 4, lite: 10, shade: 4, neck: 4, cheek: 8, root: 4 },
];
const SW = 96, SH = 40, SL = 12; // hoja de piel: 8 franjas de 12 px

function paintSkin(t, y0, sk, seed) {
  const r = rng(seed);
  t.rect(0, y0, SW, SH, sk.base);
  // cuello seco arriba, con borde en picos
  t.rect(0, y0, SW, 4, sk.neck);
  for (let x = 0; x < SW; x += 4) { t.px(x + 1, y0 + 4, sk.neck); t.px(x + 2, y0 + 4, sk.neck); t.px(x + 2, y0 + 5, sk.neck); }
  // base abajo
  t.rect(0, y0 + 34, SW, 6, sk.shade);
  for (let x = 0; x < SW; x += 6) t.rect(x + 2, y0 + 33, 2, 1, sk.shade);
  t.rect(0, y0 + 38, SW, 2, sk.root);
  for (let k = 0; k < 8; k++) {
    const x = k * SL;
    // nervios: uno marcado en la arista y trazos sueltos dentro
    for (let j = 3; j < 38; j++) t.px(x, y0 + j, sk.vein);
    t.rect(x + 4, y0 + 8 + (k * 5 % 7), 1, 7, sk.shade);
    t.rect(x + 8, y0 + 17 + (k * 3 % 6), 1, 9, sk.shade);
  }
  // brillo pintado, delante a la izquierda
  t.oval(38, y0 + 11, 2, 4, sk.lite); t.rect(37, y0 + 8, 2, 3, 7);
  t.rect(41, y0 + 17, 1, 2, sk.lite);
}

const EYES = {
  open: ['.000.', '07700', '07700', '00000', '00000', '00010', '00000', '.000.'],
  half: ['.....', '.....', '00000', '07700', '00000', '00010', '00000', '.000.'],
  shut: ['.....', '.....', '.....', '.....', '0...0', '00000', '.....', '.....'],
  happy: ['.....', '.....', '.000.', '00.00', '0...0', '.....', '.....', '.....'],
  hurtL: ['.....', '00...', '.000.', '...00', '.000.', '00...', '.....', '.....'],
  wide: ['.000.', '00000', '07700', '07700', '00000', '00000', '00000', '.000.'],
  sad: ['.....', '...00', '.0000', '07700', '07700', '00010', '00000', '.000.'],
  mad: ['.....', '00...', '0000.', '07700', '07700', '00010', '00000', '.000.'],
};
const MOUTHS = {
  smile: ['0....0', '.0000.'],
  flat: ['......', '.0000.'],
  o: ['.00.', '0880', '0880', '.00.'],
  big: ['000000', '088880', '0ee880', '.0000.'],
  grit: ['000000', '070700', '000000'],
  sad: ['.0000.', '0....0'],
  tiny: ['.00.'],
};
const FACES = {
  normal: ['open', 'open', 'smile'], blink: ['shut', 'shut', 'smile'], half: ['half', 'half', 'smile'],
  happy: ['happy', 'happy', 'big'], hurt: ['hurtL', 'hurtL', 'grit'], wow: ['wide', 'wide', 'o'],
  effort: ['shut', 'shut', 'grit'], sad: ['sad', 'sad', 'sad'], mad: ['mad', 'mad', 'flat'],
  sleep: ['shut', 'shut', 'tiny'], talk: ['open', 'open', 'o'], brave: ['mad', 'mad', 'smile'],
};

export function paintHero() {
  const t = new Tex(128, 128);
  paintSkin(t, 0, SKINS[3], 11); paintSkin(t, 40, SKINS[2], 12); paintSkin(t, 80, SKINS[1], 13);
  // ── columna derecha: botas, manos, hojas ──
  // bota: tapa [96,0,10,12], lado [106,0,12,7], frente [118,0,10,7], suela [106,7,10,5]
  t.rect(96, 0, 32, 12, 4);
  t.rect(96, 0, 10, 12, 4); t.rect(97, 1, 8, 4, 15); t.rect(97, 1, 8, 1, 7); t.rect(96, 9, 10, 3, 2);
  t.rect(106, 0, 12, 7, 4); t.rect(106, 5, 12, 2, 2); t.rect(107, 1, 4, 1, 15); t.px(116, 2, 9); t.px(114, 3, 9);
  t.rect(118, 0, 10, 7, 4); t.rect(118, 5, 10, 2, 2); t.rect(120, 1, 6, 2, 15); t.rect(120, 1, 6, 1, 7);
  t.rect(106, 7, 22, 5, 2);
  // mano: guante crema [96,12,10,10] con sombra y pulgar
  t.rect(96, 12, 12, 10, 15); t.rect(96, 12, 12, 1, 7); t.rect(96, 20, 12, 2, 9); t.rect(106, 12, 2, 10, 9); t.px(98, 14, 7); t.px(99, 14, 7);
  t.rect(108, 12, 6, 10, 4); t.rect(108, 12, 6, 2, 9); // puño / pulsera
  // hoja de brote [96,24,10,44]: verde con nervio
  const leaf = (x, y, w, h, hi) => {
    t.rect(x, y, w, h, 11); t.rect(x, y, 1, h, 3); t.rect(x + w - 1, y, 1, h, 3);
    t.rect(x + (w >> 1), y + 2, 1, h - 2, 3);
    t.rect(x, y + h - 8, w, 8, 3);
    t.rect(x + 1, y, w - 2, 4, 10);
    for (let j = 6; j < h - 10; j += 5) { t.px(x + 2, y + j, hi); t.px(x + w - 3, y + j + 2, 3); }
  };
  leaf(96, 24, 10, 44, 10);
  // la Hoja (espada) [108,24,20,60]: 4 caras de 5 px. filo claro, nervio, empuñadura de rafia
  t.rect(108, 24, 20, 60, 11);
  for (let k = 0; k < 4; k++) {
    const x = 108 + k * 5, lit = k === 1 || k === 2;
    t.rect(x, 24, 5, 48, lit ? 11 : 3);
    t.rect(x + (k % 2 ? 0 : 4), 24, 1, 48, 7);            // filo
    t.rect(x + (k % 2 ? 4 : 0), 26, 1, 46, lit ? 3 : 1);  // nervio central
    if (lit) for (let j = 28; j < 70; j += 6) t.px(x + 2, j, 10);
    t.rect(x, 24, 5, 5, 10); t.rect(x, 24, 5, 2, 7);
    // empuñadura
    t.rect(x, 72, 5, 2, 10); t.rect(x, 74, 5, 10, 4);
    for (let j = 75; j < 84; j += 2) t.rect(x, j, 5, 1, 15);
    t.rect(x, 82, 5, 2, 9);
  }
  // cuello y tapa de abajo [96,68,12,12] / [96,80,12,12]
  t.rect(96, 68, 12, 12, 4); t.disc(102, 74, 4, 9); t.disc(102, 74, 2, 3); t.px(102, 74, 11);
  t.rect(96, 80, 12, 12, 4); t.disc(102, 86, 5, 15); t.disc(102, 86, 3, 4);
  for (let a = 0; a < 6; a++) t.px(102 + Math.round(Math.cos(a) * 4), 86 + Math.round(Math.sin(a) * 4), 7);
  // raicillas (flecos) [96,92,12,8]
  t.rect(96, 92, 12, 8, T); for (let i = 0; i < 12; i += 2) t.rect(96 + i, 92, 1, 3 + (i * 7 % 5), 15);
  return t;
}

// pinta la cara en las tres pieles (franjas 3–5, x 36..71)
export function paintFace(t, clean, name = 'normal') {
  const f = FACES[name] || FACES.normal;
  for (let k = 0; k < 3; k++) {
    const y0 = k * 40, sk = SKINS[3 - k];
    // restaurar zona
    for (let j = 9; j < 30; j++) for (let i = 41; i < 68; i++) t.d[(y0 + j) * 128 + i] = clean.d[(y0 + j) * 128 + i];
    t.spr(EYES[f[0]], 45, y0 + 12);
    t.spr(EYES[f[1]], 58, y0 + 12, { flipX: true });
    // colorete
    t.rect(42, y0 + 21, 3, 2, sk.cheek); t.rect(63, y0 + 21, 3, 2, sk.cheek);
    const m = MOUTHS[f[2]];
    t.spr(m, 54 - (m[0].length >> 1), y0 + 22);
  }
}

export const BULB = [[0.10, 0], [0.33, 0.03], [0.49, 0.2], [0.53, 0.42], [0.44, 0.66], [0.24, 0.83], [0.11, 0.92], [0.08, 1.0]];

export function makeCeba() {
  const clean = paintHero(), t = new Tex(128, 128); t.d.set(clean.d);
  paintFace(t, clean, 'normal');
  const tex = texFrom(t);
  const mBody = mat(tex), mLimb = mat(tex), mLeaf = mat(tex, { double: true, bias: -0.5 }), mHoja = mat(tex, { double: true, bias: -0.5 });

  const root = new THREE.Group();       // posición en el mundo
  const tilt = new THREE.Group();       // giro al rodar / inclinarse
  const sq = new THREE.Group();         // estirar y aplastar
  root.add(tilt); tilt.add(sq);

  const body = new MB().lathe(BULB, 8, [0, 0, SW, SH], { capB: [96, 80, 12, 12] }).mesh(mBody);
  sq.add(body);

  // brotes en la coronilla
  const crown = new THREE.Group(); crown.position.y = 0.97; sq.add(crown);
  const leafGeo = (len, w) => {
    const b = new MB(); const r = [96, 24, 10, 44], h = r[3] / 3;
    const P = [[w, 0, 0], [w * 1.25, len * 0.4, 0.03], [w * 0.9, len * 0.75, 0.1], [w * 0.1, len, 0.22]];
    for (let i = 0; i < 3; i++) {
      const a = P[i], c = P[i + 1];
      b.quad([-c[0], c[1], c[2]], [-a[0], a[1], a[2]], [a[0], a[1], a[2]], [c[0], c[1], c[2]], [r[0], r[1] + r[3] - h * (i + 1), r[2], h]);
    }
    return b.build();
  };
  const leaves = [];
  const mkLeaf = (len, w, yaw, lean) => {
    const g = new THREE.Group(); g.rotation.y = yaw;
    const p = new THREE.Group(); p.rotation.x = lean; g.add(p);
    p.add(new THREE.Mesh(leafGeo(len, w), mLeaf));
    crown.add(g); leaves.push({ g, p, lean, v: 0, a: 0, len });
    return g;
  };
  // brotecito de siempre (antes de la ceremonia)
  const nub = mkLeaf(0.2, 0.05, 0.3, 0.25);
  // tres hojas de después: la del medio es la Hoja envainada
  const l1 = mkLeaf(0.5, 0.075, 2.3, 0.5), l2 = mkLeaf(0.42, 0.07, -2.0, 0.55);
  // la Hoja: prisma fino de 4 caras
  const hojaGeo = new MB().lathe([[0.45, 0], [0.5, 0.16], [0.55, 0.19], [1, 0.24], [1, 0.72], [0.62, 0.9], [0.05, 1.0]], 4, [108, 24, 20, 60], { sx: 0.085, sz: 0.028, phase: 0.5 }).build();
  hojaGeo.scale(1, 1.05, 1);
  const hojaBack = new THREE.Group(); hojaBack.rotation.set(0.12, 0, 0); crown.add(hojaBack);
  const hojaBackMesh = new THREE.Mesh(hojaGeo, mHoja); hojaBackMesh.position.y = -0.2; hojaBackMesh.scale.setScalar(0.8); hojaBack.add(hojaBackMesh);

  // manos flotantes
  const handGeo = new MB().box(0.2, 0.17, 0.2, { f: [96, 12, 10, 10], b: [96, 12, 10, 10], l: [96, 12, 10, 10], r: [96, 12, 10, 10], t: [96, 12, 10, 4], d: [108, 12, 6, 10] }, { top: [0.8, 0.8], y: -0.085 }).build();
  const handL = new THREE.Group(), handR = new THREE.Group();
  handL.add(new THREE.Mesh(handGeo, mLimb)); handR.add(new THREE.Mesh(handGeo, mLimb));
  sq.add(handL, handR);
  // la Hoja en la mano
  const hoja = new THREE.Group(); const hojaMesh = new THREE.Mesh(hojaGeo, mHoja); hojaMesh.position.y = -0.12; hoja.add(hojaMesh); handR.add(hoja);
  hoja.visible = false;

  // botas
  const footGeo = new MB().box(0.21, 0.13, 0.3, { t: [96, 0, 10, 12], l: [106, 0, 12, 7], r: [106, 0, 12, 7], f: [118, 0, 10, 7], b: [118, 0, 10, 7], d: [106, 7, 10, 5] }, { top: [0.85, 0.8] }).build();
  footGeo.translate(0, 0, 0.04);
  const footL = new THREE.Mesh(footGeo, mLimb), footR = new THREE.Mesh(footGeo, mLimb);
  root.add(footL, footR);

  const shadow = blob(0.95, 0.62); root.add(shadow);

  const C = {
    root, tilt, sq, body, crown, leaves, nub, hoja, hojaBack, handL, handR, footL, footR, shadow, tex, t, clean,
    mats: [mBody, mLimb, mLeaf, mHoja], face: 'normal', layers: 3, hasHoja: false,
    setFace(n) { if (n === C.face) return; C.face = n; paintFace(t, clean, n); texUpdate(tex); },
    setLayers(n) { C.layers = n; mBody.uniforms.uScroll.value.y = (3 - Math.max(1, Math.min(3, n))) * 40 / 128; },
    setHoja(has) { C.hasHoja = has; nub.visible = !has; l1.visible = l2.visible = has; hojaBack.visible = has && !hoja.visible; },
    draw(on) { hoja.visible = on && C.hasHoja; hojaBack.visible = C.hasHoja && !on; },
    flash(v, c = 7) { for (const m of C.mats) { m.uniforms.uFlash.value = v; m.uniforms.uFlashC.value = c; } },
    hide(v) { for (const m of C.mats) m.uniforms.uHide.value = v; },
  };
  C.setHoja(false);
  return C;
}

// la muda: cáscara vacía que deja al pelarse (misma textura, bulbo abierto por delante)
export function makePeel(tex, layerFrom) {
  const m = mat(tex, { double: true });
  m.uniforms.uScroll.value.y = (3 - layerFrom) * 40 / 128;
  const g = new THREE.Group();
  const prof = BULB.slice(1, 6);
  const a = new MB().lathe(prof, 8, [0, 0, SW, SH], { from: 0, to: 3 }).mesh(m);
  const b = new MB().lathe(prof, 8, [0, 0, SW, SH], { from: 5, to: 8 }).mesh(m);
  const c = new MB().lathe(prof, 8, [0, 0, SW, SH], { from: 3, to: 5 }).mesh(m);
  g.add(a, b, c);
  return { g, a, b, c, m };
}

// la Hoja suelta, para la ventana de objeto y el menú
let _heroSheet = null;
export function makeHojaItem() {
  if (!_heroSheet) { const t = paintHero(); _heroSheet = { t, tex: texFrom(t) }; }
  const m = mat(_heroSheet.tex, { double: true, bias: -0.5 });
  const geo = new MB().lathe([[0.45, 0], [0.5, 0.16], [0.55, 0.19], [1, 0.24], [1, 0.72], [0.62, 0.9], [0.05, 1.0]], 4, [108, 24, 20, 60], { sx: 0.085, sz: 0.028, phase: 0.5 }).build();
  const g = new THREE.Group(), me = new THREE.Mesh(geo, m); me.position.y = -0.5; const p = new THREE.Group(); p.add(me); p.rotation.z = -0.45; g.add(p);
  return { g, t: _heroSheet.t };
}
