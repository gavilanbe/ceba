// state.js — estado global de la partida y guardado.
export const G = {
  t: 0, dt: 0, mode: 'boot', level: null, levels: {}, player: null, cam: null, scene: null, candela: null,
  lock: 0, target: null, action: null, actionEnt: null, hint: null, boss: null,
  scripts: [], ui: null, manual: false, debug: false,
  save: null,
};
export const newSave = () => ({
  v: 1, flags: {}, tears: 0, maxLayers: 3, layers: 3, crack: false,
  items: {}, c: [null, null, null], ajos: 0, pepitas: 0, spawn: { level: 'villa', at: 'cama' }, seen: {}, rooms: {}, time: 0, deaths: 0,
});
const KEY = 'ceba.save.1';
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) { s.ajos = s.ajos || 0; s.pepitas = s.pepitas || 0; return s; } } catch (e) { } return null; }
export function writeSave() { try { localStorage.setItem(KEY, JSON.stringify(G.save)); } catch (e) { } }
export function wipeSave() { try { localStorage.removeItem(KEY); } catch (e) { } }
export const flag = (k, v) => { if (v !== undefined) G.save.flags[k] = v; return G.save.flags[k]; };
export const seen = k => { if (!G.save.seen[k]) { G.save.seen[k] = 1; return true; } return false; };

// corrutinas: guiones como generadores que reciben dt
export function run(gen) { const it = typeof gen === 'function' ? gen() : gen; const s = { it, done: false }; G.scripts.push(s); return s; }
export function tickScripts(dt) {
  for (const s of G.scripts.slice()) {
    if (s.done) continue;
    try { if (s.it.next(dt).done) s.done = true; } catch (e) { s.done = true; console.error('guion:', e); }
  }
  G.scripts = G.scripts.filter(s => !s.done);
}
export function* wait(t) { let e = 0; while (e < t) e += yield; }
export function* until(f) { while (!f()) yield; }
export function* tween(t, f, ease = x => x) { let e = 0; while (e < t) { e += yield; f(ease(Math.min(1, e / t))); } f(1); }
export function* all(...gens) { let live = gens.map(g => ({ g, d: false })); let dt = 0; for (;;) { let any = false; for (const l of live) { if (l.d) continue; if (l.g.next(dt).done) l.d = true; else any = true; } if (!any) return; dt = yield; } }

// opciones del jugador (no van con la partida)
const OKEY = 'ceba.opt.1';
G.opt = { camAuto: true, invY: false, sens: 1 };
try { Object.assign(G.opt, JSON.parse(localStorage.getItem(OKEY)) || {}); } catch (e) { }
export function saveOpt() { try { localStorage.setItem(OKEY, JSON.stringify(G.opt)); } catch (e) { } }
