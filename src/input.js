// input.js — teclado y mando con los botones de una N64 imaginaria: A, B, Z, tres C y START.
const MAP = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  a: ['Space', 'KeyK'], b: ['KeyJ'], z: ['ShiftLeft', 'ShiftRight', 'KeyL'],
  c1: ['KeyU'], c2: ['KeyI'], c3: ['KeyO'], start: ['Enter', 'Escape'], l: ['KeyQ'], r: ['KeyE'],
};
export const KEYNAME = { a: 'ESP', b: 'J', z: 'MAY', c1: 'U', c2: 'I', c3: 'O', start: 'INTRO', l: 'Q', r: 'E' };
const codes = {}; for (const k in MAP) for (const c of MAP[k]) codes[c] = k;
const held = {}, pad = {};
export const input = {
  down: {}, pressed: {}, ax: 0, ay: 0, any: false, usedPad: false, onFirst: null,
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
    }
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    this.ax = x; this.ay = y;
  },
  flush() { this.pressed = {}; this.any = false; },
  clear() { for (const k in this.down) this.down[k] = false; for (const k in held) held[k] = false; this.pressed = {}; },
  hit(b) { if (this.pressed[b]) { this.pressed[b] = false; return true; } return false; },
};
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => { if (codes[e.code]) { e.preventDefault(); if (!e.repeat) input.key(e.code, true); } if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
  window.addEventListener('keyup', e => { if (codes[e.code]) { e.preventDefault(); input.key(e.code, false); } });
  window.addEventListener('blur', () => input.clear());
  window.addEventListener('pointerdown', () => { if (input.onFirst) { const f = input.onFirst; input.onFirst = null; f(); } });
}
