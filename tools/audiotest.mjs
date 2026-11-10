// Prueba del sonido: renderiza cada efecto, tema y jingle con OfflineAudioContext
// y comprueba que suenan (RMS > 0), sin NaN ni saturación, y que el motor en vivo
// (planificador, cambio de tema, jingle, duck, mute) no da errores.
//   node tools/audiotest.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = http.createServer(async (req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/blank') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><title>t</title>'); }
  try {
    const buf = await readFile(path.join(root, u));
    res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(buf);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${port}/blank`);

const res = await page.evaluate(async () => {
  const { audio } = await import('/src/audio.js');
  const out = { sfx: {}, tracks: {}, jingles: {}, noop: null, live: null };

  // sin init: todo no-op
  audio.sfx('hit'); audio.music('title'); audio.duck(true); audio.setVolume(0.5, 0.5); audio.music(null);
  out.noop = { jingleDur: audio.jingle('item'), ready: audio.ready };
  audio.setVolume(0.7, 0.8);

  const info = audio._info();
  out.info = info;
  const SR = 22050;
  const measure = (buf, win) => {
    let peak = 0, sum = 0, nan = 0, n = 0;
    const chs = []; for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));
    const L = buf.length, wins = [];
    let ws = 0, wn = 0;
    for (let i = 0; i < L; i++) {
      for (const d of chs) { const v = d[i]; if (v !== v) nan++; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; ws += v * v; n++; wn++; }
      if (win && (i + 1) % win === 0) { wins.push(Math.sqrt(ws / wn)); ws = 0; wn = 0; }
    }
    return { rms: Math.sqrt(sum / n), peak, nan, wins };
  };
  const render = async (secs, fn) => {
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * secs), SR);
    audio.music(null);
    audio.init({ ctx });
    fn();
    return ctx.startRendering();
  };

  for (const name of info.sfx) {
    const buf = await render(4, () => audio.sfx(name));
    const m = measure(buf);
    // duración audible
    const d = buf.getChannelData(0); let last = 0;
    for (let i = d.length - 1; i >= 0; i--) if (Math.abs(d[i]) > 0.003) { last = i; break; }
    out.sfx[name] = { rms: m.rms, peak: m.peak, nan: m.nan, dur: last / SR };
  }
  // opciones y nombre desconocido
  {
    const buf = await render(1, () => { audio.sfx('noExiste'); audio.sfx('tear', { pitch: 1.5, vol: 0.5, pan: -0.7 }); });
    out.opts = measure(buf);
  }
  for (const name in info.tracks) {
    const dur = info.tracks[name].dur;
    const buf = await render(dur + 4, () => { audio.music(name, { fade: 0 }); audio._pump(dur + 4); });
    const m = measure(buf, SR * 4);
    out.tracks[name] = { dur, rms: m.rms, peak: m.peak, nan: m.nan, minWin: Math.min(...m.wins), wins: m.wins.length };
  }
  for (const name in info.jingles) {
    let ret = 0;
    const buf = await render(10, () => { ret = audio.jingle(name); audio._pump(10); });
    const m = measure(buf);
    out.jingles[name] = { ret, rms: m.rms, peak: m.peak, nan: m.nan };
  }

  // en vivo: planificador real
  audio.music(null);
  const ok = audio.init({ ctx: new AudioContext() });   // contexto real, pero marcado «offline»: no hay temporizador
  out.liveForced = ok;
  return out;
});

// motor en vivo en una página limpia (init() normal)
await page.goto(`http://localhost:${port}/blank?x=1`);
const live = await page.evaluate(async () => {
  const { audio } = await import('/src/audio.js');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ok = audio.init(); audio.init();
  const ctx = audio._ctx();
  const an = ctx.createAnalyser(); an.fftSize = 2048; audio._out().connect(an);
  const buf = new Float32Array(an.fftSize);
  const level = async ms => { let pk = 0; const t = performance.now(); while (performance.now() - t < ms) { an.getFloatTimeDomainData(buf); for (const v of buf) pk = Math.max(pk, Math.abs(v)); await wait(30); } return pk; };
  const r = { ok, state: ctx.state, muted0: audio.muted };
  audio.music('village'); audio.music('village');
  r.village = await level(1500);
  audio.duck(true); r.ducked = await level(700); audio.duck(false);
  audio.music('boss', { fade: 0.3 }); r.boss = await level(1200);
  r.jingleDur = audio.jingle('item'); r.jingle = await level(800);
  audio.sfx('swing1'); audio.sfx('cry', { pitch: 1.3 }); audio.sfx('step', { pitch: 0.9, pan: 0.5 });
  r.sfx = await level(300);
  audio.muted = true; await wait(250); r.mutedLevel = await level(300); audio.muted = false;
  audio.music(null, { fade: 0.2 }); await wait(4200); r.silence = await level(400);
  r.current = audio.current;
  return r;
});

// arranque mudo con ?mute
await page.goto(`http://localhost:${port}/blank?a=1&mute`);
const mute = await page.evaluate(async () => { const { audio } = await import('/src/audio.js'); return audio.muted; });

await browser.close(); server.close();

let fail = 0;
const bad = (msg) => { fail++; console.log('  ✗ ' + msg); };
const f = (x, n = 3) => x.toFixed(n);

console.log('EFECTOS');
for (const [n, m] of Object.entries(res.sfx)) {
  console.log(`  ${n.padEnd(11)} rms ${f(m.rms, 4)}  pico ${f(m.peak)}  ${f(m.dur, 2)} s`);
  if (!(m.rms > 0.0005)) bad(`${n}: no suena`);
  if (m.nan) bad(`${n}: NaN`);
  if (m.peak > 1.0) bad(`${n}: satura (${f(m.peak)})`);
}
if (!(res.opts.rms > 0)) bad('sfx con opciones no suena');
console.log('TEMAS');
for (const [n, m] of Object.entries(res.tracks)) {
  console.log(`  ${n.padEnd(9)} ${f(m.dur, 1).padStart(5)} s  rms ${f(m.rms)}  pico ${f(m.peak)}  ventana mínima ${f(m.minWin, 4)}`);
  if (!(m.rms > 0.01)) bad(`${n}: no suena`);
  if (m.nan) bad(`${n}: NaN`);
  if (m.peak > 1.0) bad(`${n}: satura`);
  if (!(m.minWin > 0.002)) bad(`${n}: hueco de silencio de 4 s`);
  if (m.dur < 40 || m.dur > 90) bad(`${n}: bucle de ${f(m.dur, 1)} s fuera de 40–90`);
}
console.log('JINGLES');
for (const [n, m] of Object.entries(res.jingles)) {
  console.log(`  ${n.padEnd(9)} ${f(m.ret, 2)} s  rms ${f(m.rms)}  pico ${f(m.peak)}`);
  if (!(m.rms > 0.005)) bad(`${n}: no suena`);
  if (m.nan) bad(`${n}: NaN`);
  if (m.peak > 1.0) bad(`${n}: satura`);
}
console.log('SIN INIT', res.noop);
if (res.noop.ready) bad('ready sin init');
if (!(res.noop.jingleDur > 0)) bad('jingle sin init no devuelve duración');
console.log('EN VIVO', live, 'mute por URL:', mute);
if (!live.ok) bad('init() en vivo falla');
if (live.muted0) bad('arranca mudo sin ?mute');
if (!mute) bad('no arranca mudo con &mute');
if (!(live.village > 0.01)) bad('village no suena en vivo');
if (!(live.boss > 0.01)) bad('boss no suena en vivo');
if (!(live.jingle > 0.01)) bad('jingle no suena en vivo');
if (!(live.mutedLevel < 0.001)) bad('muted no calla');
if (!(live.silence < 0.002)) bad('music(null) no calla');
if (res.info.issues.length) for (const i of res.info.issues) bad('partitura: ' + i);
if (errors.length) for (const e of errors) bad('consola: ' + e);
console.log(fail ? `\n${fail} fallos` : '\nTodo bien');
process.exit(fail ? 1 : 0);
