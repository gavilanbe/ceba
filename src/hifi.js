// hifi.js — instrumentos sintetizados muestra a muestra (sin WebAudio: sirve igual en el navegador, en un worker y en node).
// Cada instrumento devuelve un Float32Array mono con una nota; la Mezcla los coloca en estéreo y les pone sala.

const TAU = Math.PI * 2;
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// 'g4', 'f#5', 'bb3' → Hz
export const hz = name => {
  const m = /^([a-g])([#b]?)(-?\d)$/.exec(name); if (!m) throw new Error('nota: ' + name);
  const midi = 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
};
export const rng = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;

// ───────── la mezcla: pista en bucle (lo que se sale por el final entra por el principio) ─────────
export class Mix {
  constructor(sr, seconds, o = {}) {
    this.sr = sr; this.n = Math.round(sr * seconds); this.mono = !!o.mono; this.loop = o.loop !== false;
    this.L = new Float32Array(this.n); this.R = this.mono ? this.L : new Float32Array(this.n); this.S = new Float32Array(this.n);
  }
  add(buf, t, gain = 1, pan = 0, send = 0.2) {
    const n = this.n, L = this.L, R = this.R, S = this.S; let i = Math.round(t * this.sr);
    const a = (clamp(pan, -1, 1) + 1) * Math.PI / 4, gl = this.mono ? gain : gain * Math.cos(a) * 1.414, gr = gain * Math.sin(a) * 1.414, gs = gain * send;
    if (this.loop) { i = ((i % n) + n) % n; for (let k = 0; k < buf.length; k++) { const v = buf[k]; L[i] += v * gl; if (!this.mono) R[i] += v * gr; S[i] += v * gs; if (++i >= n) i = 0; } }
    else for (let k = 0; k < buf.length && i < n; k++, i++) { if (i < 0) continue; const v = buf[k]; L[i] += v * gl; if (!this.mono) R[i] += v * gr; S[i] += v * gs; }
    return this;
  }
  // sala tipo Freeverb; en bucle se pasa dos veces para que la cola del final suene al principio
  reverb(o = {}) {
    const sr = this.sr, n = this.n, k = sr / 44100, room = o.room ?? 0.84, damp = o.damp ?? 0.3, wet = o.wet ?? 1, pre = Math.round((o.pre ?? 0.018) * sr);
    const CT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], AT = [556, 441, 341, 225];
    const chans = this.mono ? [[this.L, 0]] : [[this.L, 0], [this.R, 23]];
    // el envío pierde graves para no embarrar
    const send = new Float32Array(n); { let lp = 0; const c = 1 - Math.exp(-TAU * 160 / sr); for (let p = 0; p < (this.loop ? 2 : 1); p++) for (let i = 0; i < n; i++) { lp += (this.S[i] - lp) * c; send[i] = this.S[i] - lp; } }
    for (const [out, spread] of chans) {
      const cb = CT.map(t => new Float32Array(Math.round((t + spread) * k))), ci = CT.map(() => 0), cs = CT.map(() => 0);
      const ab = AT.map(t => new Float32Array(Math.round((t + spread) * k))), ai = AT.map(() => 0);
      const passes = this.loop ? 2 : 1;
      for (let p = 0; p < passes; p++) {
        const write = p === passes - 1;
        for (let i = 0; i < n; i++) {
          let j = i - pre; if (j < 0) { if (!this.loop && p === 0) j = -1; else j += n; }
          const x = j < 0 ? 0 : send[j] * 0.03; let y = 0;
          for (let c = 0; c < 8; c++) { const b = cb[c], q = ci[c], v = b[q]; cs[c] = v * (1 - damp) + cs[c] * damp; b[q] = x + cs[c] * room; ci[c] = q + 1 >= b.length ? 0 : q + 1; y += v; }
          for (let c = 0; c < 4; c++) { const b = ab[c], q = ai[c], v = b[q]; b[q] = y + v * 0.5; y = v - y; ai[c] = q + 1 >= b.length ? 0 : q + 1; }
          if (write) out[i] += y * wet;
        }
      }
    }
    return this;
  }
  peak() { let m = 0; for (let i = 0; i < this.n; i++) { const a = Math.abs(this.L[i]), b = Math.abs(this.R[i]); if (a > m) m = a; if (b > m) m = b; } return m; }
  scale(g) { for (let i = 0; i < this.n; i++) this.L[i] *= g; if (!this.mono) for (let i = 0; i < this.n; i++) this.R[i] *= g; return this; }
}

// ───────── instrumentos ─────────
const fadeOut = (b, sr, ms = 30) => { const k = Math.min(b.length, Math.round(sr * ms / 1000)); for (let i = 0; i < k; i++) b[b.length - 1 - i] *= i / k; return b; };

// cuerda pulsada (Karplus-Strong afinado con pasa-todo): guitarra de tripa / arpa pequeña
export function pluck(sr, f, dur, vel = 0.8, o = {}) {
  const ring = o.ring ?? 1.6, n = Math.round(sr * Math.max(dur, Math.min(ring, dur + 1.2))), out = new Float32Array(n);
  const period = sr / f, N = Math.floor(period - 0.5), fr = period - 0.5 - N, C = (1 - fr) / (1 + fr);
  const buf = new Float32Array(N), r = rng(Math.round(f * 31 + vel * 977) + 7);
  // el ataque: ruido tanto más brillante cuanto más fuerte se pulsa
  let lp = 0; const b = clamp(0.18 + 0.62 * vel * (o.bright ?? 1), 0.05, 0.95);
  for (let i = 0; i < N; i++) { lp += ((r() * 2 - 1) - lp) * b; buf[i] = lp; }
  // se pulsa a un quinto de la cuerda: quita los armónicos de esa posición
  { const d = Math.max(1, Math.round(N / 5)); const c = buf.slice(); for (let i = 0; i < N; i++) buf[i] = c[i] - c[(i + d) % N] * 0.6; }
  let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, Math.abs(buf[i])); for (let i = 0; i < N; i++) buf[i] /= mx || 1;
  const g = Math.pow(10, -3 / (f * (o.t60 ?? 3.2))), stop = Math.round(sr * dur), gDamp = Math.pow(10, -3 / (f * 0.09));
  let q = 0, prev = 0, x1 = 0, y1 = 0, tone = 0, dc = 0, dcx = 0; const tc = 1 - Math.exp(-TAU * (o.cut ?? 4200) / sr);
  for (let i = 0; i < n; i++) {
    const v = buf[q], avg = 0.5 * (v + prev) * (o.hold || i < stop ? g : gDamp); prev = v;
    const ap = C * avg + x1 - C * y1; x1 = avg; y1 = ap; buf[q] = ap; if (++q >= N) q = 0;
    tone += (v - tone) * tc; dc = tone - dcx + 0.995 * dc; dcx = tone; out[i] = dc * vel;
  }
  return fadeOut(out, sr, 40);
}

// flauta de caña: seno con pocos armónicos, soplo, vibrato que entra tarde y la nota que «sube» al atacar
export function flute(sr, f, dur, vel = 0.7, o = {}) {
  const rel = 0.11, n = Math.round(sr * (dur + rel)), out = new Float32Array(n), r = rng(Math.round(f * 13) + 3);
  let ph = 0, nz = 0, nz2 = 0; const att = o.att ?? 0.05, vd = o.vib ?? 0.0045, bc = 1 - Math.exp(-TAU * Math.min(sr * 0.4, f * 3) / sr);
  const h2 = 0.26 + 0.2 * vel, h3 = 0.07 + 0.1 * vel, h4 = 0.03 * vel;
  for (let i = 0; i < n; i++) {
    const t = i / sr, vib = Math.sin(TAU * 5.1 * t + 0.6) * vd * clamp((t - 0.22) / 0.3), scoop = o.legato ? 0 : -0.012 * Math.exp(-t / 0.03);
    ph += TAU * f * (1 + vib + scoop) / sr;
    let env = t < att ? t / att : 1; env = env * env * (3 - 2 * env); if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
    env *= 1 - 0.1 * clamp((t - 0.3) / 1.5) + Math.sin(TAU * 5.1 * t) * 0.05 * clamp((t - 0.22) / 0.3);
    const w = r() * 2 - 1; nz += (w - nz) * bc; nz2 += (nz - nz2) * bc; const breath = (nz - nz2) * (0.55 * Math.exp(-t / 0.045) + 0.1);
    out[i] = (Math.sin(ph) + h2 * Math.sin(2 * ph + 0.4) + h3 * Math.sin(3 * ph) + h4 * Math.sin(4 * ph) + breath * 3) * env * vel * 0.62;
  }
  return out;
}

// marimba de madera: fundamental que se apaga pronto, parcial a la doble octava y el golpe de la baqueta
export function marimba(sr, f, dur, vel = 0.7) {
  const n = Math.round(sr * Math.min(2.2, Math.max(dur, 0.25) + 0.9)), out = new Float32Array(n), d1 = 3.2 + f / 260, r = rng(Math.round(f) + 11);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, ph = TAU * f * t, a = t < 0.003 ? t / 0.003 : 1;
    lp += ((r() * 2 - 1) - lp) * 0.3;
    out[i] = (Math.sin(ph) * Math.exp(-t * d1) + 0.3 * vel * Math.sin(ph * 4) * Math.exp(-t * (d1 * 4.5)) + 0.1 * vel * Math.sin(ph * 9.2) * Math.exp(-t * (d1 * 9)) + lp * 0.35 * vel * Math.exp(-t * 320)) * a * vel * 0.8;
  }
  return fadeOut(out, sr, 60);
}

// contrabajo en pizzicato: redondo, con un golpe de dedo y poca cola
export function bass(sr, f, dur, vel = 0.8) {
  const rel = 0.09, n = Math.round(sr * (dur + rel)), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr, ph = TAU * f * t * (1 + 0.006 * Math.exp(-t / 0.02)), a = t < 0.006 ? t / 0.006 : 1;
    let env = Math.exp(-t * 1.9) * a; if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
    out[i] = (Math.sin(ph) + 0.42 * Math.sin(2 * ph) * Math.exp(-t * 5) + 0.2 * Math.sin(3 * ph) * Math.exp(-t * 9) + 0.08 * Math.sin(5 * ph) * Math.exp(-t * 16)) * env * vel * 0.9;
  }
  return out;
}

// cuerdas en colchón: tabla de onda rica leída por tres voces algo desafinadas, con ataque lento
let _tab = null;
const strTab = () => { if (_tab) return _tab; const N = 2048; _tab = new Float32Array(N + 1); for (let k = 1; k <= 9; k++) { const a = 1 / Math.pow(k, 1.25) * (k === 2 ? 0.8 : 1); for (let i = 0; i <= N; i++) _tab[i] += a * Math.sin(TAU * k * i / N + k * 0.7); } let m = 0; for (const v of _tab) m = Math.max(m, Math.abs(v)); for (let i = 0; i <= N; i++) _tab[i] /= m; return _tab; };
export function strings(sr, f, dur, vel = 0.5, o = {}) {
  const att = o.att ?? 0.32, rel = o.rel ?? 0.55, n = Math.round(sr * (dur + rel)), out = new Float32Array(n), T = strTab(), N = 2048;
  const det = [1, 1.0042, 0.9961], ph = [0, 0.33, 0.71]; let lp = 0; const lc = 1 - Math.exp(-TAU * Math.min(7000, 1400 + f * 4 + vel * 2400) / sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr, vib = 1 + Math.sin(TAU * 4.7 * t + f) * 0.003 * clamp(t / 0.6); let s = 0;
    for (let v = 0; v < 3; v++) { ph[v] += f * det[v] * vib / sr; if (ph[v] >= 1) ph[v] -= 1; const x = ph[v] * N, j = x | 0; s += T[j] + (T[j + 1] - T[j]) * (x - j); }
    let env = t < att ? t / att : 1; env *= env; if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
    env *= 1 + (o.swell || 0) * Math.sin(Math.PI * clamp(t / dur));
    lp += (s / 3 - lp) * lc; out[i] = lp * env * vel * 0.9;
  }
  return out;
}

// ───────── percusión de huerta ─────────
// sonajero de semillas
export function shaker(sr, vel = 0.5, long = false) {
  const n = Math.round(sr * (long ? 0.16 : 0.09)), out = new Float32Array(n), r = rng(Math.round(vel * 1000) + 5); let p = 0, lp = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, w = r() * 2 - 1, hp = w - p; p = w; lp += (hp - lp) * 0.55; const a = t < 0.008 ? t / 0.008 : Math.exp(-(t - 0.008) * (long ? 26 : 55)); out[i] = lp * a * vel * 0.5; }
  return out;
}
// pandero: golpe grave y blando
export function frame(sr, vel = 0.8) {
  const n = Math.round(sr * 0.5), out = new Float32Array(n), r = rng(17); let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f = 62 + 58 * Math.exp(-t * 38); ph += TAU * f / sr; lp += ((r() * 2 - 1) - lp) * 0.12; out[i] = (Math.sin(ph) * Math.exp(-t * 10) + lp * 0.9 * Math.exp(-t * 60)) * Math.min(1, t / 0.002) * vel; }
  return fadeOut(out, sr, 30);
}
// caña hueca
export function block(sr, vel = 0.5, f = 920) {
  const n = Math.round(sr * 0.14), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / sr; out[i] = (Math.sin(TAU * f * t) * Math.exp(-t * 48) + 0.5 * Math.sin(TAU * f * 1.51 * t) * Math.exp(-t * 70)) * Math.min(1, t / 0.001) * vel * 0.7; }
  return out;
}
// tinaja de barro (udu): un «blup» que sube
export function pot(sr, vel = 0.6, f = 150) {
  const n = Math.round(sr * 0.32), out = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr; ph += TAU * f * (1 + 0.75 * (1 - Math.exp(-t * 22))) / sr; out[i] = (Math.sin(ph) + 0.18 * Math.sin(2 * ph)) * Math.exp(-t * 15) * Math.min(1, t / 0.003) * vel; }
  return fadeOut(out, sr, 30);
}

// ───────── útiles para efectos: ruido filtrado con barrido (filtro de variable de estado) ─────────
export function sweepNoise(sr, dur, o = {}) {
  const n = Math.round(sr * dur), out = new Float32Array(n), r = rng(o.seed || 99), f0 = o.f0 ?? 500, f1 = o.f1 ?? 3000, q = o.q ?? 1.2, mode = o.mode || 'bp';
  let lo = 0, bd = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n, f = o.curve ? o.curve(k) : f0 * Math.pow(f1 / f0, k), fc = 2 * Math.sin(Math.PI * Math.min(f, sr * 0.22) / sr), x = r() * 2 - 1;
    lo += fc * bd; const hi = x - lo - bd / q; bd += fc * hi;
    const env = o.env ? o.env(k, i / sr) : Math.sin(Math.PI * k);
    out[i] = (mode === 'lp' ? lo : mode === 'hp' ? hi : bd) * env;
  }
  return out;
}
export function tone(sr, dur, fOf, env, harm = [1]) {
  const n = Math.round(sr * dur), out = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const k = i / n, t = i / sr; ph += TAU * fOf(k, t) / sr; let s = 0; for (let h = 0; h < harm.length; h++) if (harm[h]) s += harm[h] * Math.sin(ph * (h + 1)); out[i] = s * env(k, t); }
  return out;
}
