// input.js — teclado y mando con los botones de una N64 imaginaria: A, B, Z, tres C y START.
const MAP = {
  up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
  // las flechas mueven la cámara (y también sirven para los menús)
  cu: ['ArrowUp'], cd: ['ArrowDown'], cl: ['ArrowLeft'], cr: ['ArrowRight'], zoom: ['KeyR'], cen: ['KeyC'],
  a: ['Space', 'KeyK'], b: ['KeyJ'], z: ['ShiftLeft', 'ShiftRight', 'KeyL'],
  c1: ['KeyU'], c2: ['KeyI'], c3: ['KeyO'], start: ['Enter', 'Escape'], l: ['KeyQ'], r: ['KeyE'],
};
const ALT = { up: 'cu', down: 'cd', left: 'cl', right: 'cr' };
export const KEYNAME = { a: 'ESP', b: 'J', z: 'MAY', c1: 'U', c2: 'I', c3: 'O', start: 'INTRO', l: 'Q', r: 'E' };
const codes = {}; for (const k in MAP) for (const c of MAP[k]) codes[c] = k;
const held = {}, pad = {};
export const input = {
  down: {}, pressed: {}, ax: 0, ay: 0, any: false, usedPad: false, onFirst: null,
  // cámara: giro pedido este fotograma (ratón en píxeles; palanca derecha y flechas en -1..1) y rueda
  mdx: 0, mdy: 0, cx: 0, cy: 0, wheel: 0, locked: false,
  set(btn, on) { if (on && !this.down[btn]) { this.pressed[btn] = true; this.any = true; } this.down[btn] = on; },
  key(code, on) { const b = codes[code]; if (!b) return; held[code] = on; this.set(b, MAP[b].some(c => held[c]) || !!pad[b]); },
  poll() {
    let x = (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0), y = (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0);
    const gp = (typeof navigator !== 'undefined' && navigator.getGamepads) ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
    if (gp) {
      const B = { a: [0], b: [2], z: [6, 4], c1: [3], c2: [1], c3: [7, 5], start: [9], l: [14], r: [15] };
      for (const k in B) { const on = B[k].some(i => gp.buttons[i] && gp.buttons[i].pressed); if (on !== !!pad[k]) { pad[k] = on; this.set(k, on || MAP[k].some(c => held[c])); if (on) this.usedPad = true; } }
      const dz = v => Math.abs(v) < 0.22 ? 0 : v;
      const gx = dz(gp.axes[0]) + ((gp.buttons[15] && gp.buttons[15].pressed) ? 1 : 0) - ((gp.buttons[14] && gp.buttons[14].pressed) ? 1 : 0);
      const gy = dz(gp.axes[1]) + ((gp.buttons[13] && gp.buttons[13].pressed) ? 1 : 0) - ((gp.buttons[12] && gp.buttons[12].pressed) ? 1 : 0);
      if (gx || gy) { x = gx; y = gy; }
      this.cx = dz(gp.axes[2] || 0); this.cy = dz(gp.axes[3] || 0);
    } else { this.cx = 0; this.cy = 0; }
    this.cx += (this.down.cr ? 1 : 0) - (this.down.cl ? 1 : 0); this.cy += (this.down.cd ? 1 : 0) - (this.down.cu ? 1 : 0);
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    this.ax = x; this.ay = y;
  },
  flush() { this.pressed = {}; this.any = false; this.mdx = 0; this.mdy = 0; this.wheel = 0; },
  clear() { for (const k in this.down) this.down[k] = false; for (const k in held) held[k] = false; this.pressed = {}; },
  hit(b) { const a = ALT[b]; if (a && this.pressed[a]) { this.pressed[a] = false; return true; } if (this.pressed[b]) { this.pressed[b] = false; return true; } return false; },
};
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => { if (codes[e.code]) { e.preventDefault(); if (!e.repeat) input.key(e.code, true); } if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
  window.addEventListener('keyup', e => { if (codes[e.code]) { e.preventDefault(); input.key(e.code, false); } });
  window.addEventListener('blur', () => input.clear());
  // ratón: un clic captura el puntero y desde entonces mueve la cámara; la rueda acerca y aleja
  const cv = () => document.getElementById('ui') || document.body;
  window.addEventListener('mousedown', e => { if (!input.locked && cv().requestPointerLock && !input.noLock) { try { const r = cv().requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { } } else if (input.locked) { if (e.button === 0) input.set('b', true); if (e.button === 2) input.set('z', true); } });
  window.addEventListener('mouseup', e => { if (e.button === 0 && !MAP.b.some(c => held[c]) && !pad.b) input.set('b', false); if (e.button === 2 && !MAP.z.some(c => held[c]) && !pad.z) input.set('z', false); });
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerlockchange', () => { input.locked = !!document.pointerLockElement; });
  window.addEventListener('mousemove', e => { if (input.locked) { input.mdx += e.movementX || 0; input.mdy += e.movementY || 0; } });
  window.addEventListener('wheel', e => { input.wheel += Math.sign(e.deltaY); }, { passive: true });
  window.addEventListener('pointerdown', () => { if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
}
