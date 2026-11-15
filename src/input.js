// input.js — teclado y mando con los botones de una N64 imaginaria: A, B, Z, tres C y START.
// Mando: vale cualquiera que el navegador reconozca (Xbox, PlayStation, Switch, genéricos). Se usa el último que
// se haya tocado, los rótulos de pantalla cambian a los de su marca y vuelven a los del teclado al pulsar una tecla.
const MAP = {
  up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
  // las flechas mueven la cámara (y también sirven para los menús)
  cu: ['ArrowUp'], cd: ['ArrowDown'], cl: ['ArrowLeft'], cr: ['ArrowRight'], zoom: ['KeyR'], cen: ['KeyC'],
  a: ['Space', 'KeyK'], b: ['KeyJ'], z: ['ShiftLeft', 'ShiftRight', 'KeyL'],
  c1: ['KeyU'], c2: ['KeyI'], c3: ['KeyO'], start: ['Enter', 'Escape'], l: ['KeyQ'], r: ['KeyE'],
};
const ALT = { up: 'cu', down: 'cd', left: 'cl', right: 'cr' };
const KEYS_NAME = { a: 'ESP', b: 'J', z: 'MAY', c1: 'U', c2: 'I', c3: 'O', start: 'INTRO', l: 'Q', r: 'E' };
// rótulos de los botones tal como se ven ahora mismo en el HUD (teclado o mando): se reescribe al cambiar de aparato
export const KEYNAME = { ...KEYS_NAME };
// por marca: nombre, rótulo de cada botón y cuál de los cuatro botones de la derecha es A (ia) y cuál C2 y «atrás» (ic).
// Los índices son los del mando «standard» del navegador, que van por posición: 0 abajo, 1 derecha, 2 izquierda, 3 arriba.
// En los de Nintendo la A está a la derecha, así que ahí se intercambian.
export const PADS = {
  xbox: { name: 'Mando de Xbox', a: 'A', b: 'X', c1: 'Y', c2: 'B', c3: 'RT', z: 'LT', l: 'LB', r: 'RB', start: 'START', ia: 0, ic: 1 },
  ps: { name: 'Mando de PlayStation', a: '×', b: '□', c1: '△', c2: '○', c3: 'R2', z: 'L2', l: 'L1', r: 'R1', start: 'OPTIONS', ia: 0, ic: 1 },
  switch: { name: 'Mando de Switch', a: 'A', b: 'Y', c1: 'X', c2: 'B', c3: 'ZR', z: 'ZL', l: 'L', r: 'R', start: '+', ia: 1, ic: 0 },
  otro: { name: 'Mando', a: 'A', b: 'X', c1: 'Y', c2: 'B', c3: 'RT', z: 'LT', l: 'LB', r: 'RB', start: 'START', ia: 0, ic: 1 },
};
export const padBrand = id => /xbox|xinput|microsoft|045e/i.test(id) ? 'xbox' : /playstation|dualshock|dualsense|sony|054c|ps[345] /i.test(id) ? 'ps' : /nintendo|switch|joy-?con|pro controller|057e/i.test(id) ? 'switch' : 'otro';
// lectura de un mando: botones por índice, palancas y cruceta. Los que no son «standard» se leen a ojo:
// hasta que no se pulsa un botón no se sabe qué ejes descansan en el centro (palancas) y cuáles en un extremo (gatillos).
const calib = {};
function readPad(gp) {
  const bt = i => { const b = gp.buttons[i]; return !!b && (b.pressed || b.value > 0.5); }, ax = gp.axes;
  const o = { bt, lx: ax[0] || 0, ly: ax[1] || 0, rx: 0, ry: 0, du: bt(12), dd: bt(13), dl: bt(14), dr: bt(15), any: false };
  for (let i = 0; i < gp.buttons.length && i < 17; i++) if (bt(i)) { o.any = true; break; }
  if (gp.mapping === 'standard') { o.rx = ax[2] || 0; o.ry = ax[3] || 0; return o; }
  o.du = o.dd = o.dl = o.dr = false;
  if (o.any && !calib[gp.index]) calib[gp.index] = [...ax].map(v => Math.abs(v) < 0.3);
  const c = calib[gp.index]; if (!c) return o;
  const st = []; for (let i = 2; i < ax.length && st.length < 2; i++) if (c[i] && !(ax.length >= 10 && i === 9)) st.push(i);
  if (st.length === 2) { o.rx = ax[st[0]]; o.ry = ax[st[1]]; }
  if (ax.length >= 10 && ax[9] <= 1.05) { const n = Math.round((ax[9] + 1) * 3.5); o.du = n === 7 || n <= 1; o.dr = n >= 1 && n <= 3; o.dd = n >= 3 && n <= 5; o.dl = n >= 5 && n <= 7; }
  else if (ax.length >= 8 && !c[9]) { o.dl = ax[6] < -0.5; o.dr = ax[6] > 0.5; o.du = ax[7] < -0.5; o.dd = ax[7] > 0.5; }
  return o;
}
const dead = (x, y, dz = 0.2) => { const m = Math.hypot(x, y); if (m < dz) return [0, 0]; const k = Math.min(1, (m - dz) / (1 - dz)) / m; return [x * k, y * k]; };
let padIdx = -1, padHad = false; const nav = { up: 0, down: 0, left: 0, right: 0 };
const codes = {}; for (const k in MAP) for (const c of MAP[k]) codes[c] = k;
const held = {}, pad = {};
export const input = {
  down: {}, pressed: {}, ax: 0, ay: 0, any: false, usedPad: false, onFirst: null,
  // mando en uso: marca y rótulos (PADS). onPad(conectado, nombre) y padWake() los ponen main.js y touch.js
  brand: 'otro', pad: PADS.otro, hasPad: false, onPad: null, padWake: null, noRumble: false,
  device(pad) { if (pad === this.usedPad) return; this.usedPad = pad; Object.assign(KEYNAME, pad ? this.pad : KEYS_NAME); if (pad && this.padWake) this.padWake(); },
  rumble(strong = 0.5, weak = 0.5, ms = 120) {
    if (!this.usedPad || this.noRumble || typeof navigator === 'undefined' || !navigator.getGamepads) return;
    try { const g = [...navigator.getGamepads()].find(q => q && q.index === padIdx), v = g && g.vibrationActuator; if (v && v.playEffect) { const r = v.playEffect('dual-rumble', { startDelay: 0, duration: ms, weakMagnitude: weak, strongMagnitude: strong }); if (r && r.catch) r.catch(() => { }); } else if (v && v.pulse) v.pulse(Math.max(strong, weak), ms); } catch (e) { }
  },
  // cámara: giro pedido este fotograma (ratón en píxeles; palanca derecha y flechas en -1..1) y rueda
  mdx: 0, mdy: 0, cx: 0, cy: 0, wheel: 0, locked: false,
  // mando táctil (touch.js): palanca analógica en tx, ty
  touch: false, tOn: false, tx: 0, ty: 0,
  set(btn, on) { if (on && !this.down[btn]) { this.pressed[btn] = true; this.any = true; } this.down[btn] = on; },
  key(code, on) { const b = codes[code]; if (!b) return; held[code] = on; this.set(b, MAP[b].some(c => held[c]) || !!pad[b]); },
  poll() {
    let x = (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0), y = (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0);
    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
    // manda el último mando que se haya tocado
    let gp = null, R = null;
    for (const g of pads) { const r = readPad(g); if (r.any || Math.hypot(r.lx, r.ly) > 0.6) { if (padIdx !== g.index || !this.usedPad) { padIdx = g.index; this.brand = padBrand(g.id); this.pad = PADS[this.brand]; this.usedPad = false; this.device(true); } } if (g.index === padIdx) { gp = g; R = r; } }
    if (!gp && pads.length) { gp = pads[0]; padIdx = gp.index; R = readPad(gp); this.brand = padBrand(gp.id); this.pad = PADS[this.brand]; if (this.usedPad) Object.assign(KEYNAME, this.pad); }
    this.hasPad = !!gp; this.cx = 0; this.cy = 0;
    if (gp) {
      padHad = true; const P = this.pad;
      const B = { a: [P.ia], c2: [P.ic], b: [2], c1: [3], z: [6], c3: [7], l: [4], r: [5], start: [9, 8], zoom: [10], cen: [11] };
      for (const k in B) { const on = B[k].some(R.bt); if (on !== !!pad[k]) { pad[k] = on; this.set(k, on || MAP[k].some(c => held[c])); if (on && k === 'c2') this.pressed.back = true; } }
      const [lx, ly] = dead(R.lx, R.ly), [rx, ry] = dead(R.rx, R.ry, 0.22);
      const gx = lx + (R.dr ? 1 : 0) - (R.dl ? 1 : 0), gy = ly + (R.dd ? 1 : 0) - (R.du ? 1 : 0);
      if (gx || gy) { x = gx; y = gy; }
      this.cx = rx; this.cy = ry;
      // la palanca y la cruceta también mueven el cursor de los menús, con repetición
      const now = performance.now() / 1000, want = { left: R.dl || R.lx < -0.6, right: R.dr || R.lx > 0.6, up: R.du || R.ly < -0.6, down: R.dd || R.ly > 0.6 };
      for (const d in want) { if (!want[d]) nav[d] = 0; else if (!nav[d]) { nav[d] = now + 0.36; this.pressed[d] = true; this.any = true; } else if (now >= nav[d]) { nav[d] = now + 0.12; this.pressed[d] = true; } }
    } else if (padHad) {
      // se ha desconectado: se sueltan sus botones y se vuelve al teclado
      padHad = false; padIdx = -1; for (const k in pad) if (pad[k]) { pad[k] = false; this.set(k, MAP[k].some(c => held[c])); } this.device(false);
    }
    if (this.tOn) { x = this.tx; y = this.ty; }
    this.cx += (this.down.cr ? 1 : 0) - (this.down.cl ? 1 : 0); this.cy += (this.down.cd ? 1 : 0) - (this.down.cu ? 1 : 0);
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    this.ax = x; this.ay = y;
  },
  flush() { this.pressed = {}; this.any = false; this.mdx = 0; this.mdy = 0; this.wheel = 0; },
  clear() { for (const k in this.down) this.down[k] = false; for (const k in held) held[k] = false; this.pressed = {}; },
  hit(b) { const a = ALT[b]; if (a && this.pressed[a]) { this.pressed[a] = false; return true; } if (this.pressed[b]) { this.pressed[b] = false; return true; } return false; },
};
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => { if (e.isTrusted && !e.repeat) input.device(false); if (codes[e.code]) { e.preventDefault(); if (!e.repeat) input.key(e.code, true); } if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
  window.addEventListener('keyup', e => { if (codes[e.code]) { e.preventDefault(); input.key(e.code, false); } });
  window.addEventListener('blur', () => input.clear());
  // ratón: un clic captura el puntero y desde entonces mueve la cámara; la rueda acerca y aleja
  const cv = () => document.getElementById('ui') || document.body;
  window.addEventListener('mousedown', e => { if (input.touch) return; if (!input.locked && cv().requestPointerLock && !input.noLock) { try { const r = cv().requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { } } else if (input.locked) { if (e.button === 0) input.set('b', true); if (e.button === 2) input.set('z', true); } });
  window.addEventListener('mouseup', e => { if (e.button === 0 && !MAP.b.some(c => held[c]) && !pad.b) input.set('b', false); if (e.button === 2 && !MAP.z.some(c => held[c]) && !pad.z) input.set('z', false); });
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerlockchange', () => { input.locked = !!document.pointerLockElement; });
  window.addEventListener('mousemove', e => { if (input.locked) { input.mdx += e.movementX || 0; input.mdy += e.movementY || 0; } });
  window.addEventListener('wheel', e => { input.wheel += Math.sign(e.deltaY); }, { passive: true });
  window.addEventListener('pointerdown', () => { if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
}
if (typeof window !== 'undefined') {
  window.addEventListener('gamepadconnected', e => { if (input.onPad) input.onPad(true, PADS[padBrand(e.gamepad.id)].name); });
  window.addEventListener('gamepaddisconnected', e => { delete calib[e.gamepad.index]; if (input.onPad) input.onPad(false, PADS[padBrand(e.gamepad.id)].name, e.gamepad.index === padIdx); });
}
