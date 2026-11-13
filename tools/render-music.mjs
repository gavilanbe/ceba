// node tools/render-music.mjs  → tools/out/musica/*.wav y un informe con medidas (pico, RMS, bandas, costura del bucle, afinación)
import fs from 'node:fs';
import { villa, SECONDS, BPM } from '../src/score/villa.js';
import { renderSfx } from '../src/hifi-sfx.js';
import { pluck, flute, marimba, bass, strings, hz } from '../src/hifi.js';
const SR = 44100, dir = 'tools/out/musica'; fs.mkdirSync(dir, { recursive: true });
const wav = (file, chans, sr = SR) => { const n = chans[0].length, c = chans.length, b = Buffer.alloc(44 + n * c * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * c * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(c, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * c * 2, 28); b.writeUInt16LE(c * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * c * 2, 40); for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[k][i])) * 32767), 44 + (i * c + k) * 2); fs.writeFileSync(file, b); };
const db = x => (20 * Math.log10(x || 1e-9)).toFixed(1);
const rms = b => { let s = 0; for (const v of b) s += v * v; return Math.sqrt(s / b.length); };
const band = (b, lo, hi) => { let l1 = 0, l2 = 0, s = 0; const a = 1 - Math.exp(-2 * Math.PI * hi / SR), c = 1 - Math.exp(-2 * Math.PI * lo / SR); for (const v of b) { l1 += (v - l1) * a; l2 += (l1 - l2) * c; const y = l1 - l2; s += y * y; } return Math.sqrt(s / b.length); };
// afinación: periodo por autocorrelación en el tramo sostenido
const pitch = (b, f) => { const from = Math.round(SR * 0.05), N = Math.min(b.length - from, Math.round(SR * 0.6)); let best = 0, bf = f; for (let c = -25; c <= 25; c += 0.25) { const q = f * Math.pow(2, c / 1200), w = 2 * Math.PI * q / SR; let re = 0, im = 0; for (let i = 0; i < N; i++) { const h = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N), x = b[from + i] * h; re += x * Math.cos(w * i); im += x * Math.sin(w * i); } const m = re * re + im * im; if (m > best) { best = m; bf = c; } } return bf; };

const t0 = Date.now(), v = villa(SR), ms = Date.now() - t0;
const pk = v.body.peak(), g = 0.8 / pk; v.body.scale(g); v.perc.scale(g);
const full = [new Float32Array(v.body.n), new Float32Array(v.body.n)]; for (let i = 0; i < v.body.n; i++) { full[0][i] = v.body.L[i] + v.perc.L[i]; full[1][i] = v.body.R[i] + v.perc.L[i]; }
// para escuchar suelto: dos vueltas seguidas, así se oye la costura del bucle
const twice = full.map(c => { const o = new Float32Array(c.length * 2); o.set(c); o.set(c, c.length); return o; });
wav(`${dir}/villa-ristra.wav`, twice); wav(`${dir}/villa-ristra-sin-percusion.wav`, [v.body.L, v.body.R]); wav(`${dir}/villa-ristra-percusion.wav`, [v.perc.L]);
let fp = 0; for (const c of full) for (const x of c) fp = Math.max(fp, Math.abs(x));
const mono = full[0].map((x, i) => (x + full[1][i]) / 2);
console.log(`Villa Ristra: ${SECONDS} s a ${BPM} bpm, sintetizada en ${ms} ms`);
console.log(`pico cuerpo ${db(0.8)} dB · pico con percusión ${db(fp)} dB · RMS ${db(rms(mono))} dB · percusión sola RMS ${db(rms(v.perc.L))} dB`);
console.log('bandas (RMS dB): <150 ' + db(band(mono, 20, 150)) + ' · 150–600 ' + db(band(mono, 150, 600)) + ' · 600–2,5k ' + db(band(mono, 600, 2500)) + ' · 2,5k–8k ' + db(band(mono, 2500, 8000)) + ' · >8k ' + db(band(mono, 8000, 20000)));
let corr = 0, a2 = 0, b2 = 0; for (let i = 0; i < v.body.n; i++) { corr += v.body.L[i] * v.body.R[i]; a2 += v.body.L[i] ** 2; b2 += v.body.R[i] ** 2; } console.log('correlación izq–der ' + (corr / Math.sqrt(a2 * b2)).toFixed(2) + ' (1 = mono, 0 = muy abierto)');
const n = v.body.n, seam = Math.abs(full[0][0] - full[0][n - 1]); console.log('costura del bucle: salto de ' + seam.toFixed(4) + ' entre la última muestra y la primera');
// por secciones
const secs = [['interludio', 0, 4], ['A', 4, 12], ["A'", 12, 20], ['B', 20, 28], ["A''", 28, 36], ['puente', 36, 40]]; console.log('dinámica por sección (RMS dB): ' + secs.map(([nm, a, b]) => nm + ' ' + db(rms(mono.subarray(Math.round(a * 2.5 * SR), Math.round(b * 2.5 * SR))))).join(' · '));
console.log('afinación (cents de error): ' + [['cuerda', pluck, 'a3'], ['cuerda', pluck, 'g4'], ['flauta', (s, f, d, v) => flute(s, f, d, v, { vib: 0 }), 'd5'], ['marimba', marimba, 'g5'], ['bajo', bass, 'g2'], ['cuerdas', strings, 'b3']].map(([nm, fn, p]) => `${nm} ${p} ${pitch(fn(SR, hz(p), 0.8, 0.8), hz(p)).toFixed(2)}`).join(' · '));
const sfx = renderSfx(SR); for (const k in sfx) wav(`${dir}/sfx-${k}.wav`, [sfx[k]]); console.log('efectos: ' + Object.entries(sfx).map(([k, b]) => `${k} ${(b.length / SR).toFixed(2)} s`).join(' · '));
