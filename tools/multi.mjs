// node tools/multi.mjs salida.png "código 1" "código 2" ...  → una sola página, una captura tras cada código, en rejilla
// opciones: --cols 3 --scale 2 --page index.html?manual&mute
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); if (i < 0) return d; const v = a[i + 1]; a.splice(i, 2); return v; };
const cols = +opt('cols', 3), scale = +opt('scale', 2), page_ = opt('page', 'index.html?manual&mute'), port = 8300 + Math.floor(Math.random() * 500);
const [out, ...codes] = a;
const srv = await serve(port);
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 320 * scale, height: 180 * scale }, deviceScaleFactor: 1 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
pg.on('pageerror', e => errs.push(String(e.stack || e)));
await pg.goto(`http://127.0.0.1:${port}/${page_}`);
await pg.waitForFunction('window.ready === true', null, { timeout: 15000 }).catch(() => errs.push('no llegó a ready'));
const files = [];
for (let i = 0; i < codes.length; i++) {
  try { const r = await pg.evaluate(`(async()=>{ ${codes[i]} })()`); if (r !== undefined) console.log(i, JSON.stringify(r)); } catch (e) { errs.push(`eval ${i}: ` + e.message); }
  const f = `tools/out/_m_${i}.png`; await pg.screenshot({ path: f }); files.push(f);
}
await br.close(); srv.close();
const w = 320 * scale, h = 180 * scale, c = Math.min(cols, files.length);
if (files.length === 1) fs.copyFileSync(files[0], out);
else execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % c) * w}_${Math.floor(i / c) * h}`).join('|')}:fill=black`, out]);
for (const f of files) fs.unlinkSync(f);
const E = [...new Set(errs)].filter(e => !/GPU stall/.test(e));
if (E.length) console.log('ERRORES:\n' + E.slice(0, 8).map(e => e.slice(0, 600)).join('\n'));
