// node tools/thumb.mjs dirSalida  → ceba.jpg (640×400) y s/ceba.webp (320×200) para el índice de juegos
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
import fs from 'node:fs'; import path from 'node:path';
const out = process.argv[2] || 'tools/out', port = 8300 + Math.floor(Math.random() * 500);
const srv = await serve(port);
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.goto(`http://127.0.0.1:${port}/index.html?manual&mute`); await pg.waitForFunction('window.ready === true');
const shots = await pg.evaluate(async () => {
  const grab = () => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(document.getElementById('gl'), 0, 0, 640, 360); x.drawImage(document.getElementById('ui'), 0, 0, 640, 360); return c; };
  game.step(230); const title = grab();
  // el título a 16:10: se amplía a lo alto y se recortan los lados
  const mk = (w, h, type, q) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const s = h / 324; x.drawImage(title, 24, 0, 576, 324, 0, 0, w, h); return c.toDataURL(type, q); };
  return [mk(640, 400, 'image/jpeg', 0.9), mk(320, 200, 'image/webp', 0.85)];
});
fs.mkdirSync(path.join(out, 's'), { recursive: true });
fs.writeFileSync(path.join(out, 'ceba.jpg'), Buffer.from(shots[0].split(',')[1], 'base64'));
fs.writeFileSync(path.join(out, 's', 'ceba.webp'), Buffer.from(shots[1].split(',')[1], 'base64'));
await br.close(); srv.close(); console.log('ok');
