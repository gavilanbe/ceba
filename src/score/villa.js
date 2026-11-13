// score/villa.js — «Villa Ristra»: el tema del pueblo, sobre el motivo de Ceba (1-3-5-6-5-3).
// Sol mayor, 96 negras por minuto, 40 compases de 4/4 = 100 s justos, en bucle.
//   interludio (4) · A (8) · A' (8) · B (8) · A'' (8) · puente (4)
// En el puente la marimba toca el motivo en menor: es el mismo que luego llevará Don Mildiu.
import { Mix, hz, rng, pluck, flute, marimba, bass, strings, shaker, frame, block, pot } from '../hifi.js';

export const BPM = 96, BARS = 40, SECONDS = BARS * 4 * 60 / BPM;
const CH = {
  'G': ['g2', 'g3', 'b3', 'd4', 'g4'], 'Em7': ['e2', 'g3', 'b3', 'd4', 'e4'], 'Cmaj7': ['c3', 'g3', 'b3', 'c4', 'e4'], 'D': ['d3', 'f#3', 'a3', 'd4', 'f#4'],
  'G/B': ['b2', 'g3', 'b3', 'd4', 'g4'], 'Em': ['e2', 'g3', 'b3', 'e4', 'g4'], 'Am7': ['a2', 'g3', 'a3', 'c4', 'e4'], 'D7': ['d3', 'f#3', 'a3', 'c4', 'd4'],
  'C': ['c3', 'g3', 'c4', 'e4', 'g4'], 'Am': ['a2', 'a3', 'c4', 'e4', 'a4'], 'Bm': ['b2', 'f#3', 'b3', 'd4', 'f#4'], 'Dsus': ['d3', 'g3', 'a3', 'd4', 'g4'], 'C/G': ['g2', 'g3', 'c4', 'e4', 'g4'],
};
const A = ['G', 'Em7', 'Cmaj7', 'D', 'G/B', 'Em', 'Am7 D7', 'G'];
const HARM = ['G', 'C/G', 'G', 'C/G Dsus', ...A, ...A, 'C', 'G/B', 'Am', 'D', 'C', 'Bm', 'Am7', 'Dsus D', ...A, 'Em', 'C', 'Am', 'D'];
// melodías: nota/duración en negras; r = silencio; ! acento, ? suave
const MEL_A = ['g4/.5 b4/.5 d5/1 e5/1.5! d5/.5', 'b4/2 r/.5 g4/.5? a4/.5 b4/.5', 'c5/1 e5/1 g5/1.5! e5/.5', 'd5/1.5 c5/.5 b4/.5 a4/.5 d5/1',
  'g4/.5 b4/.5 d5/1 e5/1.5! g5/.5', 'f#5/1 e5/.5 d5/.5 b4/2', 'c5/.5 b4/.5 a4/1 d5/.5 c5/.5 a4/.5 f#4/.5', 'g4/3 r/1'];
const MEL_A2 = [...MEL_A.slice(0, 7), 'g4/2 r/1 d5/.5? e5/.5'];
const MEL_B = ['e5/1.5! g5/.5 e5/1 c5/1', 'd5/1.5 g5/.5 d5/1 b4/1', 'c5/1 e5/.5 c5/.5 a4/1 c5/1', 'b4/.5 a4/.5 f#4/1 a4/2',
  'e5/1.5! g5/.5 e5/1 c5/1', 'd5/1 f#5/1 b5/1.5! a5/.5', 'g5/1 e5/1 c5/1 e5/1', 'd5/2.5 r/.5 d4/.5? f#4/.5?'];
const MEL_A3 = [...MEL_A.slice(0, 7), 'g4/2.5 r/1.5'];
// segunda flauta de A'': terceras y sextas por debajo en los compases del motivo
const HAR_A3 = ['e4/.5 g4/.5 b4/1 c5/1.5 b4/.5', 'g4/2 r/2', 'a4/1 c5/1 e5/1.5 c5/.5', 'a4/1.5 a4/.5 g4/.5 f#4/.5 a4/1', 'e4/.5 g4/.5 b4/1 c5/1.5 e5/.5', 'd5/1 c5/.5 b4/.5 g4/2', 'r/4', 'r/4'];
// el puente: el motivo en menor (1-b3-5-b6-5) y su respuesta
const MEL_BR = ['e5/.5 g5/.5 b5/1 c6/1.5! b5/.5', 'g5/2 e5/2', 'a4/.5 c5/.5 e5/1 f#5/1.5 e5/.5', 'd5/2 r/2'];

const parse = s => s.split(/\s+/).filter(Boolean).map(tk => { const m = /^([a-gr][#b]?-?\d?)\/([\d.]+)([!?]?)$/.exec(tk); if (!m) throw new Error('melodía: ' + tk); return { p: m[1], d: +m[2], acc: m[3] }; });

// devuelve { body: Mix estéreo, perc: Mix mono } con el mismo largo
export function villa(sr) {
  const B = 60 / BPM, body = new Mix(sr, SECONDS), perc = new Mix(sr, SECONDS, { mono: true }), R = rng(4242);
  const hum = (ms = 7) => (R() - 0.5) * ms / 500, hv = (v, k = 0.12) => v * (1 + (R() - 0.5) * k);
  const at = (bar, beat) => (bar * 4 + beat) * B;
  const sec = bar => bar < 4 ? 'i' : bar < 12 ? 'a' : bar < 20 ? 'a2' : bar < 28 ? 'b' : bar < 36 ? 'a3' : 'br';
  const cache = new Map(), memo = (k, f) => { let b = cache.get(k); if (!b) cache.set(k, b = f()); return b; };

  for (let bar = 0; bar < BARS; bar++) {
    const s = sec(bar), ch = HARM[bar].split(' '), half = ch.length === 2;
    const chordAt = beat => CH[half && beat >= 2 ? ch[1] : ch[0]];
    // ── cuerda pulsada: arpegio en corcheas; en B y el puente, acordes rasgueados con aire ──
    const dynP = { i: 0.72, a: 0.62, a2: 0.68, b: 0.7, a3: 0.76, br: 0.66 }[s], PO = { cut: 6800, bright: 1.15 };
    if (s === 'b') {
      for (const [beat, v] of [[0, 1], [1.5, 0.7], [2.5, 0.8], [3.5, 0.6]]) { const c = chordAt(beat); for (let k = 1; k <= 4; k++) { const f = hz(c[k]), vel = hv(dynP * v * (0.8 + k * 0.05)); body.add(pluck(sr, f, B * 1.4, vel, PO), at(bar, beat) + (k - 1) * 0.022 + hum(4), 0.5, -0.7 + k * 0.08, 0.24); } }
    } else if (s === 'br' || s === 'i') {
      const pat = s === 'i' ? [[0, 1], [0.5, 3], [1, 2], [1.5, 4], [2, 3], [3, 2], [3.5, 4]] : [[0, 1], [1, 3], [1.5, 2], [2.5, 4], [3, 3]];
      for (const [beat, k] of pat) { const c = chordAt(beat); body.add(pluck(sr, hz(c[k]), B * 1.8, hv(dynP * (beat === 0 ? 1 : 0.75)), PO), at(bar, beat) + hum(), 0.8, -0.5 + k * 0.12, 0.34); }
      if (s === 'i') body.add(pluck(sr, hz(chordAt(0)[0]) * 2, B * 3.5, 0.6, { bright: 0.7 }), at(bar, 0), 0.6, 0.1, 0.25);
    } else {
      const order = [1, 3, 2, 4, 3, 2, 4, 3];
      for (let e = 0; e < 8; e++) { const beat = e / 2, c = chordAt(beat), k = order[e], acc = e === 0 ? 1 : e === 4 ? 0.85 : e % 2 ? 0.6 : 0.72; body.add(pluck(sr, hz(c[k]), B * 1.3, hv(dynP * acc), PO), at(bar, beat) + hum(), 0.5, -0.6, 0.22);
      // segunda guitarra, a la derecha y más aguda, en las secciones llenas
      if (s !== 'a') for (const [beat, k] of [[0.5, 4], [2, 3], [3, 4]]) body.add(pluck(sr, hz(chordAt(beat)[k]) * 2, B * 1.2, hv(dynP * 0.6), PO), at(bar, beat) + hum(), 0.3, 0.7, 0.3); }
    }
    // ── contrabajo ──
    if (s !== 'i') {
      const dynB = { a: 0.7, a2: 0.78, b: 0.8, a3: 0.86, br: 0.6 }[s], r1 = hz(ch[0] && CH[ch[0]][0]);
      if (s === 'br') body.add(bass(sr, r1, B * 3.6, dynB), at(bar, 0), 0.43, 0.02, 0.08);
      else if (half) { const r2 = hz(CH[ch[1]][0]); body.add(bass(sr, r1, B * 1.4, dynB), at(bar, 0) + hum(4), 0.43, 0.02, 0.08); body.add(bass(sr, r1, B * 0.45, dynB * 0.7), at(bar, 1.5) + hum(4), 0.43, 0.02, 0.08); body.add(bass(sr, r2, B * 1.4, dynB), at(bar, 2) + hum(4), 0.43, 0.02, 0.08); body.add(bass(sr, r2, B * 0.45, dynB * 0.7), at(bar, 3.5) + hum(4), 0.43, 0.02, 0.08); }
      else {
        const fifth = r1 * 1.5 > 190 ? r1 * 0.75 : r1 * 1.5;
        body.add(bass(sr, r1, B * 1.4, dynB), at(bar, 0) + hum(4), 0.43, 0.02, 0.08); body.add(bass(sr, r1, B * 0.45, dynB * 0.65), at(bar, 1.5) + hum(4), 0.43, 0.02, 0.08);
        body.add(bass(sr, fifth, B * 0.95, dynB * 0.85), at(bar, 2) + hum(4), 0.43, 0.02, 0.08); body.add(bass(sr, s === 'b' ? fifth : r1, B * 0.9, dynB * 0.75), at(bar, 3) + hum(4), 0.43, 0.02, 0.08);
      }
    }
    // ── cuerdas: entran en A', crecen en B y arropan A'' ──
    const dynS = { i: 0.34, a: bar >= 8 ? 0.24 : 0.14, a2: 0.36, b: 0.48, a3: 0.52, br: 0.42 }[s];
    if (dynS) for (let hb = 0; hb < (half ? 2 : 1); hb++) { const c = CH[ch[hb]], len = (half ? 2 : 4) * B; for (let k = 2; k <= 4; k++) body.add(strings(sr, hz(c[k]), len - 0.05, dynS, { swell: s === 'b' ? 0.25 : 0.1 }), at(bar, hb * 2), 0.19, [0, -0.75, 0.2, 0.75][k - 1], 0.5); if (s === 'a3' || s === 'b') body.add(strings(sr, hz(c[4]) * 2, len - 0.05, dynS * 0.5), at(bar, hb * 2), 0.1, 0.4, 0.6); }
    // ── marimba: contratiempos en A' y A'' ──
    if (s === 'a2' || s === 'a3') for (const [beat, k, o] of [[0.5, 3, 2], [1.5, 4, 2], [2.5, 3, 2], [3.5, 2, 4]]) { const c = chordAt(beat); body.add(marimba(sr, hz(c[k]) * o, B * 0.5, hv(s === 'a3' ? 0.5 : 0.42)), at(bar, beat) + hum(), 0.3, 0.62, 0.3); }
    // ── la melodía ──
    const line = s === 'a' ? MEL_A[bar - 4] : s === 'a2' ? MEL_A2[bar - 12] : s === 'b' ? MEL_B[bar - 20] : s === 'a3' ? MEL_A3[bar - 28] : s === 'br' ? MEL_BR[bar - 36] : null;
    const lead = (str, inst, gain, pan, dyn, send) => { let beat = 0; for (const nt of parse(str)) { if (nt.p !== 'r') { const v = hv(dyn * (nt.acc === '!' ? 1.15 : nt.acc === '?' ? 0.75 : 1), 0.08), d = nt.d * B; body.add(inst === 'fl' ? flute(sr, hz(nt.p), d * (nt.d >= 1 ? 0.94 : 0.86), Math.min(1, v)) : marimba(sr, hz(nt.p), d, Math.min(1, v)), at(bar, beat) + hum(5), gain, pan, send); } beat += nt.d; } };
    if (line) {
      if (s === 'br') lead(line, 'ma', 0.6, 0.25, 0.7, 0.45);
      else lead(line, 'fl', 0.4, 0.12, { a: 0.62, a2: 0.7, b: 0.8, a3: 0.84 }[s], 0.34);
      if (s === 'a3') { lead(HAR_A3[bar - 28], 'fl', 0.22, -0.5, 0.55, 0.4); if (bar === 28 || bar === 32) lead(line.replace(/([a-g]#?)(\d)/g, (m, a, o) => a + (+o + 1)), 'ma', 0.2, 0.5, 0.5, 0.4); }
    }
    // ── percusión (pista aparte: el juego la sube y la baja) ──
    if (s !== 'i') {
      const full = s === 'a2' || s === 'b' || s === 'a3', dyn = { a: 0.5, a2: 0.8, b: 0.9, a3: 1, br: 0.45 }[s];
      const sv = [0.5, 0.25, 0.75, 0.25, 0.5, 0.3, 0.75, 0.35];
      for (let e = 0; e < 8; e++) perc.add(shaker(sr, hv(sv[e] * dyn, 0.25), e === 6 && bar % 4 === 3), at(bar, e / 2) + hum(6) + (e % 2 ? 0.008 : 0), 0.5, 0, 0.12);
      if (full) {
        const b_ = s === 'b';
        for (const [beat, v] of b_ ? [[0, 0.8], [2, 0.7], [3.5, 0.4]] : [[0, 0.8], [1.5, 0.35], [2.5, 0.6]]) perc.add(memo('f' + v, () => frame(sr, v)), at(bar, beat) + hum(4), 0.55 * dyn, 0, 0.18);
        for (const [beat, v] of b_ ? [[1.5, 0.45], [3, 0.4]] : [[1, 0.45], [3, 0.5]]) perc.add(memo('b' + v, () => block(sr, v)), at(bar, beat) + hum(4), 0.4 * dyn, 0, 0.3);
        perc.add(memo('p', () => pot(sr, 0.6)), at(bar, 3.5) + hum(4), 0.4 * dyn, 0, 0.25); if (bar % 2) perc.add(memo('p2', () => pot(sr, 0.5, 190)), at(bar, 1.75) + hum(4), 0.3 * dyn, 0, 0.25);
        // redoble de semillas al final de B
        if (bar === 27) for (let q = 0; q < 8; q++) perc.add(shaker(sr, 0.3 + q * 0.07), at(bar, 2 + q / 4), 0.5, 0, 0.12);
      }
    }
  }
  body.reverb({ room: 0.83, damp: 0.32, wet: 1 }); perc.reverb({ room: 0.78, damp: 0.4, wet: 0.8 });
  return { body, perc };
}
