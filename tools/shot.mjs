// node tools/shot.mjs salida.png "código a evaluar" [--page taller.html?x] [--scale 3] [--wait ms]
// Abre el juego en modo manual (sin reloj), evalúa el código y guarda la pantalla ampliada.
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); if (i < 0) return d; const v = a[i + 1]; a.splice(i, 2); return v; };
const page_ = opt('page', 'index.html?manual&mute'), scale = +opt('scale', 3), wait = +opt('wait', 0), port = 8300 + Math.floor(Math.random() * 500);
const [out = 'tools/out/shot.png', code = ''] = a;
const srv = await serve(port);
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 320 * scale, height: 180 * scale }, deviceScaleFactor: 1 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); else if (process.env.LOG) console.log('·', m.text()); });
pg.on('pageerror', e => errs.push(String(e.stack || e)));
await pg.goto(`http://127.0.0.1:${port}/${page_}`);
await pg.waitForFunction('window.ready === true', null, { timeout: 15000 }).catch(() => errs.push('no llegó a ready'));
if (code) { try { const r = await pg.evaluate(`(async()=>{ ${code} })()`); if (r !== undefined) console.log(JSON.stringify(r)); } catch (e) { errs.push('eval: ' + e.message); } }
if (wait) await pg.waitForTimeout(wait);
await pg.screenshot({ path: out });
if (errs.filter(e => !/GPU stall/.test(e)).length) console.log('ERRORES:\n' + [...new Set(errs)].filter(e => !/GPU stall/.test(e)).slice(0, 6).map(e => e.slice(0, 700)).join('\n'));
await br.close(); srv.close();
