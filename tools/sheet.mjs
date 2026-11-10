// node tools/sheet.mjs salida.png modelo1 modelo2 ... [--yaw 0.5]  → hoja de contactos del taller
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const a = process.argv.slice(2); let yaw = 0.5; const yi = a.indexOf('--yaw'); if (yi >= 0) { yaw = a[yi + 1]; a.splice(yi, 2); }
const [out, ...names] = a; const port = 8300 + Math.floor(Math.random() * 500);
const srv = await serve(port);
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
const files = [];
for (const n of names) {
  await pg.goto(`http://127.0.0.1:${port}/taller.html?m=${n}&yaw=${yaw}`);
  await pg.waitForFunction('window.ready === true', null, { timeout: 8000 }).catch(() => errs.push(n + ': no ready'));
  const f = `tools/out/_s_${n}.png`; await pg.screenshot({ path: f, clip: { x: 16, y: 16, width: 300, height: 212 } }); files.push(f);
}
await br.close(); srv.close();
const cols = Math.min(4, files.length), rows = Math.ceil(files.length / cols);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 300}_${Math.floor(i / cols) * 212}`).join('|')}:fill=black`, out].filter(Boolean));
for (const f of files) fs.unlinkSync(f);
if (errs.length) console.log('ERRORES:\n' + [...new Set(errs)].filter(e => !/GPU stall/.test(e)).slice(0, 8).join('\n'));
