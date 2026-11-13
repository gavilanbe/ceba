// hifi-worker.js — compone y sintetiza fuera del hilo del juego; devuelve los búferes ya hechos.
import { villa, SECONDS } from './score/villa.js';
import { renderSfx } from './hifi-sfx.js';
onmessage = e => {
  const { sr, msr } = e.data;
  try {
    const sfx = renderSfx(sr); postMessage({ type: 'sfx', sr, sfx }, Object.values(sfx).map(b => b.buffer));
    const v = villa(msr), pk = Math.max(v.body.peak(), 1e-6), g = 0.8 / pk; v.body.scale(g); v.perc.scale(g);
    postMessage({ type: 'track', name: 'village', sr: msr, seconds: SECONDS, body: [v.body.L, v.body.R], perc: v.perc.L }, [v.body.L.buffer, v.body.R.buffer, v.perc.L.buffer]);
  } catch (err) { postMessage({ type: 'error', msg: String(err && err.stack || err) }); }
};
