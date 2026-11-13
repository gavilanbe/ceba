// hifi-sfx.js — efectos propios, sintetizados muestra a muestra con los mismos materiales que la música: hoja, caña, madera y barro.
import { Mix, sweepNoise, tone, marimba, pluck, block, pot, frame, shaker, rng } from './hifi.js';

const E = Math.exp;
export function renderSfx(sr) {
  const out = {}, make = (name, dur, f, rv) => { const m = new Mix(sr, dur, { mono: true, loop: false }); f(m); if (rv) m.reverb({ room: 0.7, damp: 0.45, wet: rv }); const p = m.peak() || 1; m.scale(0.9 / p); out[name] = m.L; };
  // la Hoja se carga: dos silbos de caña que suben y un brillo al llegar arriba
  make('spinReady', 0.6, m => {
    m.add(tone(sr, 0.22, k => 520 * Math.pow(3, k), (k) => Math.sin(Math.PI * k) * 0.5, [1, 0.3]), 0, 0.6, 0, 0.5);
    m.add(tone(sr, 0.22, k => 780 * Math.pow(3, k), (k) => Math.sin(Math.PI * k) * 0.3, [1]), 0.02, 0.5, 0, 0.5);
    m.add(marimba(sr, 1976, 0.2, 0.8), 0.2, 0.5, 0, 0.6); m.add(marimba(sr, 2637, 0.2, 0.6), 0.25, 0.4, 0, 0.6);
  }, 0.8);
  // remolino: el aire dando la vuelta entera (dos pasadas) y el filo de la hoja cantando
  make('spin', 0.8, m => {
    m.add(sweepNoise(sr, 0.42, { curve: k => 500 + 2600 * Math.abs(Math.sin(Math.PI * 2 * k)), q: 1.6, env: k => Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.abs(Math.sin(Math.PI * 2 * k))) }), 0, 1, 0, 0.3);
    m.add(sweepNoise(sr, 0.4, { f0: 3000, f1: 7000, q: 0.8, mode: 'hp', env: k => Math.sin(Math.PI * k) * 0.25, seed: 5 }), 0.02, 0.5, 0, 0.3);
    m.add(tone(sr, 0.5, k => 1480 - 260 * k, (k, t) => E(-t * 7) * Math.min(1, t / 0.01) * 0.22, [1, 0, 0.4, 0, 0.2]), 0.05, 0.6, 0, 0.6);
    m.add(tone(sr, 0.35, k => 190 - 70 * k, (k, t) => E(-t * 9) * 0.5, [1, 0.3]), 0.04, 0.5, 0, 0.1);
  }, 0.7);
  // picado: el silbo de la caída
  make('plunge', 0.4, m => {
    m.add(tone(sr, 0.3, k => 1500 * Math.pow(0.36, k), k => Math.sin(Math.PI * Math.sqrt(k)) * 0.5, [1, 0.25]), 0, 0.6, 0, 0.3);
    m.add(sweepNoise(sr, 0.3, { f0: 2500, f1: 700, q: 2, env: k => k * (1 - k) * 3 }), 0, 0.6, 0, 0.3);
  }, 0.5);
  // el golpe en el suelo: pandero grande, tierra que salta y un eco de barro
  make('slam', 1.1, m => {
    m.add(tone(sr, 0.5, (k, t) => 48 + 95 * E(-t * 30), (k, t) => E(-t * 8) * Math.min(1, t / 0.002), [1, 0.4, 0.15]), 0, 1.2, 0, 0.15);
    m.add(sweepNoise(sr, 0.16, { f0: 3500, f1: 250, q: 0.7, mode: 'lp', env: (k, t) => E(-t * 26) }), 0, 1, 0, 0.3);
    const r = rng(77); for (let i = 0; i < 9; i++) m.add(sweepNoise(sr, 0.03 + r() * 0.03, { f0: 600 + r() * 2200, f1: 400 + r() * 800, q: 2.5, seed: i + 3, env: k => 1 - k }), 0.06 + r() * 0.35, 0.3 + r() * 0.3, 0, 0.4);
    m.add(pot(sr, 0.7, 95), 0.03, 0.6, 0, 0.4);
  }, 1.0);
  // zarcillo: el látigo sale (chasquido de aire) con el crujido verde del tallo al estirarse
  make('whipOut', 0.35, m => {
    m.add(sweepNoise(sr, 0.13, { f0: 700, f1: 6500, q: 2.2, env: k => Math.pow(k, 1.5) * (k < 0.92 ? 1 : (1 - k) / 0.08) }), 0, 1, 0, 0.25);
    m.add(sweepNoise(sr, 0.02, { f0: 5000, f1: 9000, q: 0.7, mode: 'hp', env: k => 1 - k, seed: 8 }), 0.125, 0.8, 0, 0.4);
    m.add(tone(sr, 0.16, (k, t) => 150 + 240 * k + 25 * Math.sin(t * 190), k => Math.sin(Math.PI * k) * 0.3, [1, 0.5, 0.33, 0.25]), 0, 0.45, 0, 0.2);
  }, 0.5);
  // se enrosca en la argolla: caña contra madera y el anillo que suena
  make('whipLatch', 0.7, m => {
    m.add(block(sr, 0.9, 1250), 0, 0.9, 0, 0.4); m.add(block(sr, 0.6, 760), 0.012, 0.6, 0, 0.4);
    m.add(tone(sr, 0.55, () => 2093, (k, t) => E(-t * 9) * 0.3, [1]), 0.01, 0.5, 0, 0.7); m.add(tone(sr, 0.4, () => 3140, (k, t) => E(-t * 14) * 0.2, [1]), 0.01, 0.4, 0, 0.7);
    m.add(sweepNoise(sr, 0.09, { f0: 900, f1: 2400, q: 3, env: k => (1 - k) * 0.6, seed: 12 }), 0.04, 0.4, 0, 0.3);
  }, 0.8);
  // el tirón: el tallo se recoge zumbando y Ceba sale volando
  make('whipPull', 0.55, m => {
    m.add(tone(sr, 0.4, k => 260 * Math.pow(3.4, k), k => Math.sin(Math.PI * Math.pow(k, 0.7)) * 0.4, [1, 0.5, 0.2]), 0, 0.55, 0, 0.3);
    m.add(sweepNoise(sr, 0.42, { f0: 500, f1: 4200, q: 1.5, env: k => Math.sin(Math.PI * k) }), 0, 0.8, 0, 0.3);
    m.add(pluck(sr, 196, 0.25, 0.9, { t60: 0.6 }), 0, 0.5, 0, 0.3);
  }, 0.5);
  // tirón a una plaga o botín que llega: golpe seco de tallo
  make('whipHit', 0.3, m => {
    m.add(sweepNoise(sr, 0.05, { f0: 4000, f1: 1200, q: 1.2, env: k => 1 - k }), 0, 1, 0, 0.3);
    m.add(block(sr, 0.8, 540), 0.004, 0.7, 0, 0.3); m.add(pluck(sr, 147, 0.2, 1, { t60: 0.4, bright: 0.7 }), 0, 0.6, 0, 0.3);
  }, 0.5);
  return out;
}
