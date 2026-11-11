// CEBA — sonido. Sintetizador chiptune de 4 canales (2 pulsos, triángulo, ruido)
// con WebAudio, sin archivos externos. Todo es no-op hasta llamar a audio.init().
//
// Notación de las partituras (unidad = semicorchea):
//   c d e f g a b   nota (+ # o - para alterar, ' sube octava, , la baja, número = duración)
//   _c              la nota entra resbalando desde la anterior (portamento)
//   r4  ~4          silencio / ligadura (alarga la nota anterior)
//   o4 l2 v10       octava, duración por defecto, volumen 0-15
//   w0|1|2          ancho de pulso 12,5 / 25 / 50 %
//   @0|1|2|3        envolvente: punteo / sostenida / crece / picada
//   y0|1            vibrato
//   [ ... ]4        repetir
//   canal de ruido: k bombo, s caja, h charles, o charles abierto, t timbal, c tic

const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

function expand(s) {
  let prev;
  do { prev = s; s = s.replace(/\[([^\[\]]*)\](\d+)/g, (m, a, n) => (a + ' ').repeat(+n)); } while (s !== prev);
  return s;
}

function parseMel(str) {
  const src = expand(str);
  const re = /\s*(?:(\|)|(_?)([a-g])([#+\-]?)([',]*)(\d*)|r(\d*)|~(\d*)|o(\d)|l(\d+)|v(\d+)|w(\d)|@(\d)|y(\d)|([<>]))/y;
  let o = 4, l = 4, v = 10, w = 2, env = 1, vib = 0, step = 0, i = 0;
  const ev = [];
  while (true) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m || m[0].length === 0) throw new Error('partitura: no entiendo «' + src.slice(i, i + 12) + '»');
    i = re.lastIndex;
    if (m[1]) continue;
    if (m[3]) {
      const acc = m[4] === '#' || m[4] === '+' ? 1 : m[4] === '-' ? -1 : 0;
      let oct = o;
      for (const ch of m[5]) oct += ch === "'" ? 1 : -1;
      const midi = 12 * (oct + 1) + SEMI[m[3]] + acc;
      const len = m[6] ? +m[6] : l;
      ev.push({ step, len, f: 440 * Math.pow(2, (midi - 69) / 12), v, w, env, vib, slide: !!m[2] });
      step += len;
    } else if (m[7] !== undefined) step += m[7] ? +m[7] : l;
    else if (m[8] !== undefined) { const n = m[8] ? +m[8] : l; if (ev.length) ev[ev.length - 1].len += n; step += n; }
    else if (m[9] !== undefined) o = +m[9];
    else if (m[10] !== undefined) l = +m[10];
    else if (m[11] !== undefined) v = +m[11];
    else if (m[12] !== undefined) w = +m[12];
    else if (m[13] !== undefined) env = +m[13];
    else if (m[14] !== undefined) vib = +m[14];
    else if (m[15]) o += m[15] === '>' ? 1 : -1;
  }
  return { ev, len: step };
}

function parseDrum(str) {
  const src = expand(str);
  const re = /\s*(?:(\|)|([kshotc])(\d*)|r(\d*)|l(\d+)|v(\d+))/y;
  let l = 4, v = 8, step = 0, i = 0;
  const ev = [];
  while (true) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m || m[0].length === 0) throw new Error('percusión: no entiendo «' + src.slice(i, i + 12) + '»');
    i = re.lastIndex;
    if (m[1]) continue;
    if (m[2]) { const len = m[3] ? +m[3] : l; ev.push({ step, len, d: m[2], v }); step += len; }
    else if (m[4] !== undefined) step += m[4] ? +m[4] : l;
    else if (m[5] !== undefined) l = +m[5];
    else if (m[6] !== undefined) v = +m[6];
  }
  return { ev, len: step };
}

// ───────────────────────── partituras ─────────────────────────
// Leitmotiv de Ceba: la–re–mi–fa#, y la «lágrima»: baja a un do natural
// (séptima menor) antes de volver a re.  a d' e' f#' · e' d' c' · d'

const TITLE_A = {
  p1: `o4 | a2 d'2 e'2 f#'6 e'2 d'2 | c'4 d'8 r2 a2 | b2 d'2 e'2 g'6 f#'2 e'2 | d'4 e'8 r4
       | a2 d'2 e'2 f#'4 a'4 g'2 | f#'2 e'2 d'4 c'4 b2 a2 | b-2 d'2 f'4 e'4 c'4 | d'12 r4`,
  p2: `o4 | f#8 a8 | g8 e4 f#4 | g8 b8 | a4 g4 e8 | a8 f#8 | b8 g4 e4 | f8 g8 | f#4 a4 f#8`,
  tri: `o3 | d8 f#4 a4 | c8 g,4 b,4 | b,8 d4 g4 | a,8 c#4 e4 | f#8 d4 f#4 | g8 e4 c4 | b-,8 c8 | d4 a,4 d,8`,
};
const TITLE_A2 = {
  ...TITLE_A,
  p2: `o4 @0 | r2 f#2 a2 d'2 a4 f#4 | e2 g2 c'4 b4 a4 | g4 b2 d'2 b4 g4 | a4 e4 g4 a4
       | r2 a2 d'2 a2 f#4 d4 | d4 b4 g4 e4 | d4 f4 e4 g4 | f#4 a4 f#8`,
  nz: `v5 [k4 h2 h2 s4 h2 h2]7 k4 h2 h2 s2 s2 s4`,
};
const TITLE_B = {
  p1: `o4 | f#'4 d'2 b2 c#'2 d'2 e'4 | d'6 b2 g4 b4 | e'4 b2 g2 a2 b2 c'4 | b6 a2 e8
       | a2 c'2 f'4 e'2 c'2 a4 | g2 c'2 e'4 d'2 c'2 g4 | f4 b-4 d'4 e'4 | e'8 c#'4 r4`,
  p2: `o4 | d8 b,8 | b,8 d8 | g8 e8 | e8 c#8 | c8 f8 | e8 c8 | d8 d8 | c#8 e8`,
  tri: `o3 | b,8 f#4 d4 | g,8 d4 b,4 | e8 b,4 g,4 | a,8 e4 c#4 | f8 c4 a,4 | c8 g,4 e4 | b-,8 a,8 | a,4 e4 a8`,
  nz: `v4 [k4 h4 s4 h4]8`,
};

const VILLAGE_A = {
  p1: `o4 | d2 g2 a2 b4 d'2 b2 a2 | g4 e2 g2 a4 r2 g2 | a2 c'2 e'2 d'4 c'2 a2 c'2 | b4 a2 f#2 d4 r4
       | d2 g2 a2 b4 d'2 e'2 g'2 | g'4 e-'2 b-2 g2 b-2 e-'4 | c'2 f'2 a'4 f#'2 d'2 c'4 | b2 g6 r8`,
  p2: `o4 @3 | r2 b,2 r2 d2 r4 b,2 r2 | r2 c2 r2 e2 r4 c2 r2 | r2 c2 r2 e2 r4 g2 r2 | r2 c2 r2 f#2 r4 c2 r2
       | r2 b,2 r2 d2 r4 f2 r2 | r2 b-,2 r2 e-2 r4 g2 r2 | r2 a,2 r2 c2 r4 c2 r2 | r2 b,2 r2 d2 r8`,
  tri: `o3 @3 | g,4 b,4 d4 e4 | c4 e4 g4 e4 | a,4 c4 e4 g4 | d4 f#4 a4 d4
       | g,4 b,4 d4 g4 | e-4 g4 b-4 g4 | f4 a4 d4 f#4 | g4 d4 @1 g,8`,
  nz: `v5 [k4 h2 h2 s4 h2 k2]7 k4 h2 h2 s2 s2 s2 s2`,
};
const VILLAGE_B = {
  p1: `o4 | e'4 b2 g2 b4 e'4 | d#'4 b2 f#2 a4 r4 | e'2 g'2 e'2 c'2 e'4 c'4 | d'6 a2 f#4 r4
       | g'8 e'8 | r2 c#'2 e'2 g'2 f#'4 e'4 | e'4 c'4 e-'4 c'4 | d'8 c'4 a4`,
  p2: `o4 @3 | r2 g2 r2 g2 r4 g2 r2 | r2 a2 r2 a2 r2 b2 d#'2 f#'2 | r2 g2 r2 g2 r4 g2 r2 | r2 f#2 r2 a2 r2 d2 f#2 a2
       | @1 v8 b,2 e2 g4 f#2 e2 b,4 | @3 v7 r2 g2 r2 g2 r4 g2 r2 | r2 g2 r2 g2 r2 g2 r2 a2 | r2 a2 r2 a2 r2 f#2 r4`,
  tri: `o3 @3 | e4 g4 b4 g4 | b,4 d#4 f#4 a4 | c4 e4 g4 e4 | d4 f#4 a4 c'4
       | e4 b,4 e4 g4 | a,4 c#4 e4 g4 | a,4 c4 c4 e-4 | d4 a,4 d4 f#4`,
  nz: `v5 [k4 h2 h2 s4 h2 k2]7 k2 k2 h2 h2 s2 s2 s2 s2`,
};

const HILL_A = {
  p1: `o4 | b4 e'6 f#'2 | g#'6 f#'2 e'4 | a#4 c#'4 f#'4 | e'8 b4 | c#'4 e'6 g#'2 | a'6 g#'2 e'4 | f#'4 d'4 a4 | b8 f#4`,
  p2: `o4 | g#8 a4 | b8 g#4 | f#12 | g#8 f#4 | e8 g#4 | e8 c#4 | a8 d4 | d#8 f#4`,
  tri: `o3 | e8 g#4 | b8 g#4 | f#8 a#4 | e8 d#4 | c#8 e4 | a,8 c#4 | d8 f#4 | b,8 d#4`,
  nz: `v3 [k4 h4 h2 h2]8`,
};
const HILL_B = {
  p1: `o4 | g#'4 e'4 c#'4 | d#'6 b2 g#4 | c#'4 e'4 a'4 | f#'8 d#'4 | e'4 g'4 c''4 | a'4 f#'4 d'4 | e'8 f#'4 | d#'8 b4`,
  p2: `o4 | e8 g#4 | b,8 d#4 | e8 c#4 | d#8 b,4 | g8 e4 | f#8 a4 | e8 e4 | d#8 f#4`,
  tri: `o3 | c#8 g#,4 | g#,8 b,4 | a,8 c#4 | b,8 f#4 | c8 g4 | d8 a4 | b,8 e4 | b,8 a,4`,
  nz: `v3 [k4 h4 h2 h2]7 k4 s2 s2 s4`,
};

const BOSS_RIFF = `o2 | e4 e2 _f2 e2 r2 _g#2 _f2 | e4 e2 _f2 e2 r2 _g#2 _f2 | e4 e2 _f2 e2 r2 _b-2 _a2 | d4 d2 _e-2 d2 r2 _f2 _d2`;
const BOSS_A = {
  p1: `o4 | r2 e'2 e'2 f'2 g#'6 f'2 | e'4 d'2 e'6 r4 | r2 e'2 e'2 f'2 g#'4 b'4 | a'6 g#'2 f'2 g#'2 e'4`,
  p2: `o4 @3 | r4 b2 b2 r4 c'4 | r4 b2 b2 r4 a4 | r4 b2 b2 r4 d'4 | @1 c'6 b2 a2 b2 g#4`,
  tri: BOSS_RIFF,
  nz: `v8 [k4 h2 k2 s4 h2 k2]4`,
};
const BOSS_B = {
  p1: `o4 | a'4 c''4 b'2 a'2 g#'4 | a'6 e'2 c'4 e'4 | f'4 a'4 c''2 b'2 a'4 | b'8 a'4 f#'4`,
  p2: `o4 | c'8 d'8 | c'8 a8 | a8 c'8 | d#'8 d#'4 c'4`,
  tri: `o3 | a,4 a,2 _b-,2 a,2 r2 _c2 _b-,2 | a,4 a,2 _b-,2 a,2 r2 _c2 _b-,2 | f,4 f,2 _g-,2 f,2 r2 _a,2 _g-,2 | b,4 b,2 _c2 b,2 d#2 f#2 a2`,
  nz: `v8 [k4 h2 k2 s4 h2 k2]3 k2 k2 s2 k2 s2 s2 s2 s2`,
};
const BOSS_C = {
  p2: `o4 v8 w2 | e'8 _e-'8 | _d'8 _d-'8 | _c'8 _b8 | _b-8 b4 d#'4`,
  tri: BOSS_RIFF,
  nz: `v8 [k8 s8]3 k4 k4 s2 s2 s2 s2`,
};

const CALM_A = {
  p1: `o4 | a2 d'2 e'2 f#'6 | e'2 d'2 c'2 d'6 | b2 d'2 e'2 g'6 | f#'2 e'2 c#'2 e'6
       | d'4 f#'2 b'6 | a'4 g'2 d'6 | e'4 g'2 f#'4 e'2 | d'12`,
  tri: `o3 | d12 | c12 | b,12 | a,12 | b,6 f#6 | g,6 d6 | e6 a,6 | d6 a,6`,
};
const CALM_A2 = {
  ...CALM_A,
  p2: `o4 | f#6 a6 | g6 e6 | g6 b6 | a6 g6 | f#6 d6 | d6 b,6 | b,6 c#6 | a4 g2 f#6`,
};
const CALM_B = {
  p1: `o4 | d'4 f'2 b-'6 | c''4 g'2 e'6 | f#'2 a'2 d''2 a'6 | f#'12
       | b2 d'2 g'2 b'6 | b-2 d'2 g'2 b-'6 | a'4 f#'2 d'6 | e'6 c#'6`,
  p2: `o4 | f6 d6 | e6 g6 | a6 f#6 | a2 d'2 a2 f#6 | d6 g6 | d6 g6 | f#6 a6 | g6 e6`,
  tri: `o3 | b-,12 | c12 | d6 f#6 | d12 | g,12 | g,12 | a,12 | a,6 a,6`,
  nz: `v2 [r4 h2 r4 h2]8`,
};

// ── Capítulo II · La Pulpa ──
// Motivo de la Pulpa: re–la–si–la–fa–mi (quinta que sube, bordadura en la sexta dórica y caída).
// En `pulp` suena en dórico y en 6/8; en la sección B se invierte (do–fa–mi–fa–la–si, lidio).
// En `roots` es el mismo motivo en menor (si bemol), a trozos, y en B aumentado e invertido en p2.
const PULP_A = {
  p1: `o4 | d2 a2 b2 a4 f2 | e6 r2 g2 e2 | f2 b-2 d'2 c'4 a2 | g4 e2 c#6
       | d2 a2 b2 a4 d'2 | f'6 e'2 d'2 b2 | b-2 g2 e-2 g4 b-2 | a8 r4`,
  p2: `o4 | r6 f2 e2 d2 | g2 a2 b2 c'4 b2 | d6 f4 e2 | c#4 e2 g2 f2 e2
       | f4 a2 g4 f2 | b4 d'2 c'2 b2 g2 | g6 e-4 d2 | e2 c#2 e2 g2 f2 e2`,
  tri: `o3 | d8 a,2 d2 | c8 g,2 c2 | b-,8 f2 d2 | a,8 e2 a,2
        | d8 a,2 f2 | b,8 d2 g2 | e-8 b-,2 e-2 | a,6 e2 c#2 a,2`,
};
const PULP_A2 = {
  ...PULP_A,
  p1: `o4 | d2 a2 b2 a4 f2 | e6 r2 g2 e2 | f2 b-2 d'2 c'4 a2 | g4 e2 c#4 e2
       | d'2 a'2 b'2 a'4 f'2 | f'6 e'2 d'2 b2 | b-2 g2 e-2 g4 b-2 | a4 c#'2 d'6`,
  nz: `v3 [k6 h4 h2 | r6 c2 h2 h2]4`,
};
const PULP_B = {
  p1: `o4 | c'2 f2 e2 f4 a2 | b8 a2 g2 | b2 e2 d2 e4 g2 | a6 c#'4 e'2
       | f'6 d'2 c'2 b-2 | d-'6 b-2 a-2 b-2 | a2 c'2 f'2 e'4 c'2 | b-4 a2 g2 e2 c#2`,
  p2: `o3 | a6 c'4 a2 | b4 d'2 g2 a2 b2 | g6 b4 a2 | g2 e2 c#2 e4 g2
       | b-2 c'2 d'2 f4 d2 | f2 g-2 a-2 f4 d-2 | a6 g4 e2 | g4 e2 c#2 e2 a2`,
  tri: `o3 | f8 c2 f2 | f8 b,2 d2 | e8 b,2 e2 | a,8 e2 g2
        | b-,8 f2 d2 | b-,8 d-2 f2 | c8 f2 a2 | a,6 c#2 e2 g2`,
  nz: `v3 [k6 c2 h2 h2 | t4 h2 c4 h2]4`,
};

const ROOTS_A = {
  p1: `o5 | r8 d2 a2 b-4 | a6 f2 e4 r4 | r8 e2 b-2 c'4 | b-6 g#2 a4 r4
       | r4 d2 a2 b-2 a2 f2 e2 | e-6 d2 c#4 r4 | r4 f2 c'2 d-'2 c'2 a-2 g2 | b-4 g#4 a4 r4`,
  p2: `o4 | [d2 e-2 r2 d2 c#2 r2 d2 r2]2 | e2 f2 r2 e2 d#2 r2 e2 r2 | a2 b-2 r2 a2 g#2 r2 a2 r2
       | [d2 c#2 r2 d2 e-2 r2 d2 r2]2 | f2 g-2 r2 f2 e2 r2 f2 r2 | a2 r2 g#2 a2 r2 b-2 a2 r2`,
  tri: `o3 | d4 c4 b-,4 a,4 | g,4 a,4 b-,4 b,4 | c4 b-,4 g,4 g#,4 | a,4 g,4 f,4 e,4
        | d4 e4 f4 d4 | g,4 g#,4 a,4 c#4 | f4 e-4 d-4 c4 | b-,4 g#,4 a,4 a,2 c#2`,
  nz: `v4 [k4 r4 c2 r2 r4 | r8 t4 c2 c2]4`,
};
const ROOTS_B = {
  p1: `o5 w0 | r4 b-2 a2 r4 g2 f#2 | r4 c'2 b-2 r2 a2 g4 | r2 d'2 c#'2 d'2 r2 f'4 e'2 | r4 e-'2 d'2 c'2 a2 f#4
       | r4 f'2 e-'2 r4 d'2 b-2 | r4 a2 b-2 r2 c'2 d'4 | r2 f'2 e'2 f'2 r2 a-'4 g'2 | r2 g'2 e'2 c#'2 b-2 a2 g2 e2`,
  p2: `o4 @1 v7 | g8 d'8 | e-'8 d'8 | b-8 a4 g4 | f#12 r4
       | d'8 g8 | f#8 g8 | b-8 c'4 d-'4 | ~8 r8`,
  tri: `o3 | g,4 a,4 b-,4 c4 | d4 c4 b-,4 a,4 | e-4 d4 c4 b-,4 | a,4 f#,4 d4 c4
        | b-,4 a,4 g,4 b-,4 | a,4 d4 g,4 f,4 | e-4 e4 f4 g-4 | a,4 r4 a,4 a,2 c#2`,
  nz: `v5 [k4 c2 c2 r4 t4 | k4 r2 k2 r2 c2 t4]4`,
};

// Cavador: 7/8 (2+2+3). El riff muerde la segunda rebajada y salta al tritono.
const BOSS2_RIFF = `b,2 b,2 _c2 b,2 r2 _f2 _d2`;
const BOSS2_A = {
  p1: `o4 | r2 b2 d'2 f'4 e'2 d'2 | c'4 b6 r4 | r2 b2 d'2 f'4 g'2 a-'2 | g'6 e-'4 c'4
       | r2 b2 d'2 f'2 a-'2 b'4 | a'4 f#'4 d'2 c'2 b2 | b-'6 a'2 g'2 d'4 | c#'4 e'4 a#'6`,
  p2: `o4 @3 | r4 f#2 r2 f#2 r2 g2 | r4 f#2 r2 f#2 a2 g2 | r4 f#2 r2 f#2 r2 g2 | r4 e2 r2 e2 r2 g2
       | @1 d6 f4 e4 | f#6 e4 d4 | d6 g4 b-4 | e6 c#4 a#,4`,
  tri: `o3 | [${BOSS2_RIFF}]3 | a,2 a,2 _b-,2 a,2 r2 _e-2 _c2
        | [${BOSS2_RIFF}]2 | g,2 g,2 _a-,2 g,2 r2 _d2 _b-,2 | f#,2 f#,2 _g,2 f#,2 a#,2 c#2 e2`,
  nz: `v8 [k2 h2 k2 s2 h2 k2 s2]7 k2 k2 s2 s2 s2 s1 s1 s2`,
};
const BOSS2_B = {
  p1: `o4 | a8 g#2 a4 | d'6 c'4 b-4 | c'8 b2 c'4 | f'6 e-'4 d-'4
       | e-'8 d'2 e-'4 | a-'6 g-'4 f'4 | f#'4 e'2 c#'2 a#2 c#'2 e'2 | f#'6 g'4 a#'4`,
  p2: `o4 | r4 f2 e2 d2 f4 | f6 a4 g4 | r4 a-2 g2 f2 a-4 | a-6 c'4 b-4
       | r4 c'2 b-2 a-2 c'4 | c'6 e-'4 d-'4 | @3 a#4 r2 a#2 r2 c#'2 r2 | @1 c#'6 e'4 e'4`,
  tri: `o3 | [d2 d2 _e-2 d2 r2 _a-2 _f2]2 | [f2 f2 _g-2 f2 r2 _b2 _a-2]2
        | [a-2 a-2 _a2 a-2 r2 _d'2 _b2]2 | f#2 f#2 _g2 f#2 r2 _c'2 _a2 | f#2 f#2 f#2 a#2 c#'2 e'2 f#'2`,
  nz: `v8 [k4 s2 k2 k2 s4]6 [k2 s2]3 s2 | [s1]8 k2 s2 s2`,
};
const BOSS2_C = {
  p2: `o4 v7 w0 l1 | [b c']7 | [d' e-']7 | [f' g-']7 | l2 w1 a# r a# r a# c#' e'`,
  tri: `o3 | [${BOSS2_RIFF}]3 | f#,2 f#,2 _g,2 f#,2 a#,2 c#2 e2`,
  nz: `v8 [k4 r4 t2 t2 r2]3 k2 k2 s2 s2 s1 s1 s1 s1 s2`,
};

// Don Mildiu: vals torcido. Fa–si (tritono)–do, y una baba cromática que resbala hasta la dominante.
const MILDIU_A = {
  p1: `o4 | f4 b4 c'4 | a-'8 g'4 | f'4 e'2 e-'2 d'2 d-'2 | c'8 r4
       | f4 b4 c'4 | b-'8 a-'4 | g-'4 d-'4 b-4 | e4 b-4 d-'4
       | c'8 a-4 | f8 d4 | b4 d-'4 f'4 | e'8 r4`,
  p2: `o3 | r4 a-4 g4 | f4 c'2 d-'2 c'2 b-2 | a-8 b4 | b-2 a-2 g2 e2 g4
       | r4 a-4 g4 | f4 d-'2 e-'2 d-'2 b-2 | b-8 g-4 | g4 r4 b-4
       | a-2 g2 f2 e-2 f4 | a-8 c'4 | g4 f4 d-4 | b-4 g2 a-2 b-4`,
  tri: `o3 | f,8 c4 | f,8 a-,4 | d-8 a-,4 | c8 b-,4
        | f,8 c4 | b-,8 f4 | g-,8 d-4 | c8 e,4
        | f,8 e-,4 | d8 a-,4 | g,8 d-4 | c6 b-,2 a-,2 g,2`,
};
const MILDIU_A2 = { ...MILDIU_A, p1: 'w0 ' + MILDIU_A.p1, nz: `v3 [r4 c4 c4]12` };

const TRACKS = {
  title: {
    bpm: 92, form: 'A A2 B A2',
    pre: { p1: 'v10 w2 @1 y1', p2: 'v6 w1 @1', tri: 'v12' },
    sections: { A: TITLE_A, A2: TITLE_A2, B: TITLE_B },
  },
  intro: {
    bpm: 60, form: 'A', echo: 0.4,
    pre: { p1: 'v8 w0 @2 y1', p2: 'v5 w1 @2', tri: 'v9' },
    sections: { A: {
      // canon a la octava: la segunda voz repite el motivo (en menor) un compás después
      p1: `o4 | a4 d'4 e'4 f'4 | ~4 e'4 d'4 c'4 | d'12 r4 | r8 a4 c'4 | b-4 d'4 f'4 g'4 | ~4 f'4 e'4 c'4
           | e'8 d'4 b4 | c#'12 r4 | a4 d'4 e'4 f'4 | a'8 g'4 e'4 | f'4 e'4 d'4 c'4 | d'16`,
      p2: `o4 | r16 | a,4 d4 e4 f4 | ~4 e4 d4 c4 | d16 | r16 | b-,4 d4 f4 g4 | ~4 f4 e4 d4 | e16
           | r16 | a,4 d4 e4 f4 | a8 g4 e4 | f#16`,
      tri: `o3 | d16 | d16 | b-,16 | g,8 a,8 | b-,16 | c16 | g,16 | a,16 | d16 | f8 c8 | b-,8 g,8 | d16`,
    } },
  },
  village: {
    bpm: 108, swing: 0.64, form: 'A A B A',
    pre: { p1: 'v10 w1 @1 y1', p2: 'v7 w2 @3', tri: 'v12', nz: 'v5' },
    sections: { A: VILLAGE_A, B: VILLAGE_B },
  },
  hill: {
    bpm: 126, form: 'A A B A', echo: 0.3,
    pre: { p1: 'v9 w2 @1 y1', p2: 'v5 w0 @2', tri: 'v11' },
    sections: { A: HILL_A, B: HILL_B },
  },
  cistern: {
    bpm: 76, form: 'A', echo: 0.55,
    pre: { p1: 'v6 w0 @0', p2: 'v5 w2 @2 y1', tri: 'v10 @0' },
    sections: { A: {
      p1: `o5 | r6 g#2 r8 | r10 c#'2 r4 | r2 d2 r12 | r12 g2 r2 | r6 b2 r4 e2 r2 | r16 | r4 d#'2 r10 | r10 d2 a2 r2
           | r6 g#2 r8 | r2 c#'2 r12 | r8 a2 r6 | r12 e2 g2 | r16 | r6 f2 r8 | r10 c2 r4 | r4 g#2 c#'2 r8`,
      p2: `o4 | r16 | r8 g#8 | a8 g#4 e4 | g12 r4 | r8 b8 | b-8 g4 e4 | f#8 d#8 | d12 r4
           | r4 g#4 c#'8 | d'8 c#'4 a4 | a8 g#4 f4 | e12 r4 | r8 e8 | f8 e4 d4 | e-8 c8 | c#16`,
      tri: `o3 | c#6 r2 g,4 r4 | c#6 r2 g,4 r4 | d6 r2 g#,4 r4 | c#6 r2 g,4 r4
            | e6 r2 b-,4 r4 | e6 r2 b-,4 r4 | d#6 r2 a,4 r4 | d6 r2 g#,4 c4
            | c#6 r2 g,4 r4 | c#6 r2 g,4 r4 | d6 r2 g#,4 r4 | c#6 r2 g,4 r4
            | a,6 r2 e4 r4 | b-,6 r2 e4 r4 | c6 r2 f#,4 r4 | c#12 r4`,
      nz: `v4 [r12 c4 | r8 t4 r4 | r16 | r6 c2 r4 t4]4`,
    } },
  },
  boss: {
    bpm: 138, form: 'A A B A C A B A', echo: 0.12,
    pre: { p1: 'v10 w2 @1 y1', p2: 'v7 w1 @1', tri: 'v14 @1', nz: 'v8' },
    sections: { A: BOSS_A, B: BOSS_B, C: BOSS_C },
  },
  calm: {
    bpm: 84, form: 'A A2 B', echo: 0.4,
    pre: { p1: 'v8 w1 @1 y1', p2: 'v5 w0 @2', tri: 'v10' },
    sections: { A: CALM_A, A2: CALM_A2, B: CALM_B },
  },
  pulp: {
    bpm: 105, form: 'A A2 B A2', echo: 0.4,
    pre: { p1: 'v9 w1 @1 y1', p2: 'v6 w0 @2', tri: 'v11' },
    sections: { A: PULP_A, A2: PULP_A2, B: PULP_B },
  },
  roots: {
    bpm: 88, form: 'A B', echo: 0.38,
    pre: { p1: 'v8 w1 @1 y1', p2: 'v6 w2 @3', tri: 'v11 @3' },
    sections: { A: ROOTS_A, B: ROOTS_B },
  },
  boss2: {
    bpm: 152, form: 'A B A C A B', echo: 0.1,
    pre: { p1: 'v10 w2 @1 y1', p2: 'v7 w1 @1', tri: 'v14 @1', nz: 'v8' },
    sections: { A: BOSS2_A, B: BOSS2_B, C: BOSS2_C },
  },
  mildiu: {
    bpm: 96, form: 'A A2', echo: 0.45,
    pre: { p1: 'v9 w1 @1 y1', p2: 'v6 w2 @2', tri: 'v11' },
    sections: { A: MILDIU_A, A2: MILDIU_A2 },
  },
};

const JINGLES = {
  // Objeto nuevo. Tres tiempos: redoble que sube por terceras (A), el motivo de Ceba a dos voces
  // con su «lágrima» en do natural (B) y el remate en re mayor con una cascada de destellos (D).
  // El juego enseña el objeto justo al acabar A: si cambias su longitud, cambia ROLL en ui.js.
  item: {
    bpm: 144, form: 'A B D', echo: 0.3, pre: { p1: 'v11 w2 @1 y1', p2: 'v8 w1 @1', tri: 'v13', nz: 'v7' },
    sections: {
      A: {
        p1: `@3 w1 y0 o4 l1 v6 a c#' v7 b d' v9 c#' e' v11 d' f#'`,
        p2: `@3 w0 o4 l1 v4 e a v5 f# b v6 g# c#' v7 a d'`,
        tri: `o2 a8`,
        nz: `l1 v4 t t v5 t t v6 t t v8 s s`,
      },
      B: {
        p1: `o4 a2 d'2 e'2 f#'2 | g'2 e'2 c''4`,
        p2: `o4 f#2 a2 c#'2 d'2 | e'2 c'2 g'4`,
        tri: `o3 d2 d2 a,2 d2 | c2 c2 g,2 c2`,
        nz: `k2 h2 s2 h2 | k2 k2 s2 s2`,
      },
      D: {
        p1: `o5 f#2 a2 d'12`,
        p2: `@0 w0 o5 l1 v8 [d f# a d']2 v6 d f# a d' v4 d f# a d'`,
        tri: `o3 d4 a,4 d8`,
        nz: `o4 k2 k2 o8`,
      },
    },
  },
  itemBig: {
    bpm: 138, form: 'A B C D', echo: 0.32, pre: { p1: 'v11 w2 @1 y1', p2: 'v8 w1 @1', tri: 'v13', nz: 'v7' },
    sections: {
      A: {
        p1: `@3 w1 y0 o4 l1 v5 [a c#']2 v6 [b d']2 v8 [c#' e']2 v10 d' f#' v12 e' g'`,
        p2: `@3 w0 o4 l1 v3 [e a]2 v4 [f# b]2 v5 [g# c#']2 v6 a d' v7 b e'`,
        tri: `o2 a8 a4 a2 a1 a1`,
        nz: `l1 v3 [t]4 v4 [t]4 v6 [t]4 v8 t t s s`,
      },
      B: {
        p1: `o4 a2 d'2 e'2 f#'6 a'4`,
        p2: `o4 f#2 a2 c#'2 d'6 f#'2 e'2`,
        tri: `o3 d4 a,4 d4 f#4`,
        nz: `k2 h2 s2 h2 k2 h1 h1 s4`,
      },
      C: {
        p1: `o4 b-2 d'2 f'4 | c'2 e'2 g'4`,
        p2: `o4 f2 b-2 d'4 | g2 c'2 e'2 d'2`,
        tri: `o2 b-4 b-2 f2 | o3 c4 c2 g,2`,
        nz: `k4 s2 k2 | k2 k2 s1 s1 s1 s1`,
      },
      D: {
        p1: `o5 f#4 a4 d'12 r4`,
        p2: `@0 w0 o5 l1 v8 [d f# a d']3 v6 [d f# a d']2 v4 d f# a d'`,
        tri: `o3 d8 a,4 d12`,
        nz: `o8 k2 k2 s4 o8`,
      },
    },
  },
  sprout: {
    bpm: 120, form: 'A', pre: { p1: 'v10 w1 @1 y1', p2: 'v7 w0 @1', tri: 'v12' },
    sections: { A: {
      p1: `o4 d2 e2 f#2 g#2 a2 b2 c#'2 d'2 | e'2 f#'2 g#'2 a'2 b'8 | d''16`,
      p2: `o3 r4 b2 c#'2 d'2 e'2 f#'2 g#'2 | a'2 c#''2 d''2 e''2 f#''2 e''2 d''4 | o5 f#16`,
      tri: `o2 d16 | o3 d8 a8 | d'16`,
      nz: `v3 r16 | r8 h2 h2 h1 h1 h1 h1 | o16`,
    } },
  },
  victory: {
    bpm: 140, form: 'A', pre: { p1: 'v11 w2 @1 y1', p2: 'v8 w1 @1', tri: 'v13', nz: 'v7' },
    sections: { A: {
      p1: `o4 a2 d'2 e'2 f#'4 a'2 f#'2 a'2 | b-'4 b-'2 b-'2 c''4 c''4 | d''16 | ~8 r8`,
      p2: `o4 f#2 a2 c#'2 d'4 f#'2 d'2 f#'2 | f'4 f'2 f'2 g'4 g'4 | a'16 | ~8 r8`,
      tri: `o3 d8 d8 | b-,8 c8 | d4 a,4 d4 a,4 | d8 r8`,
      nz: `k4 h2 h2 s4 h2 h2 | k4 k2 k2 s4 s2 s2 | o16 | r16`,
    } },
  },
  gameover: {
    bpm: 120, form: 'A', pre: { p1: 'v10 w0 @1 y1', p2: 'v7 w1 @2', tri: 'v11' },
    sections: { A: {
      p1: `o4 f#'4 e'2 d'2 c'4 a4 | b-8 a8`,
      p2: `o4 d'4 c'2 b-2 a4 f4 | f8 e8`,
      tri: `o3 d8 f8 | g,8 a,8`,
    } },
  },
  capa: {
    bpm: 120, form: 'A', pre: { p1: 'v10 w1 @0', p2: 'v7 w2 @2', tri: 'v12' },
    sections: { A: {
      p1: `o5 d2 f#2 a2 d'2 | c'2 e'2 g'2 c''2 | @1 y1 d''16`,
      p2: `o4 f#8 | g8 | a16`,
      tri: `o3 d8 | c8 | d16`,
    } },
  },
  // Pepita de Oro: arpegio de mi mayor que se abre por la sensible (re#–fa#) hasta un si agudo.
  seed: {
    bpm: 150, form: 'A', echo: 0.3, pre: { p1: 'v10 w0 @0', p2: 'v6 w1 @0', tri: 'v11' },
    sections: { A: {
      p1: `o5 l1 e g# b e' | d#'2 f#'2 | @1 y1 b'8`,
      p2: `o4 l2 g# b | f#' a' | @1 e''8`,
      tri: `o3 e4 b,4 e8`,
    } },
  },
  // Fin del capítulo II: la escalera de `capa` (re, do) baja un peldaño más (si bemol) y vuelve
  // a re mayor con el motivo de la Pulpa, ahora con tercera mayor.
  capa3: {
    bpm: 112, form: 'A', echo: 0.35, pre: { p1: 'v10 w1 @0', p2: 'v7 w2 @2', tri: 'v12', nz: 'v5' },
    sections: { A: {
      p1: `o5 d2 f#2 a2 d'2 | c2 e2 g2 c'2 | o4 b-2 d'2 f'2 b-'2 | @1 y1 o5 d2 a2 b2 a2 | f#'2 e'2 d'16`,
      p2: `o4 f#8 | g8 | f8 | @1 f#4 a4 | a2 g2 f#16`,
      tri: `o3 d8 | c8 | b-,8 | a,8 | d4 a,4 d12`,
      nz: `r8 | r8 | r6 h1 h1 | t2 t2 s2 s2 | o4 k4 o12`,
    } },
  },
};

const CH = ['p1', 'p2', 'tri', 'nz'];
const compiled = {};
const issues = [];

function compile(name, def) {
  if (compiled[name]) return compiled[name];
  const secs = {};
  for (const [sn, sec] of Object.entries(def.sections)) {
    const out = {}; let len = 0;
    for (const ch of CH) {
      if (!sec[ch]) continue;
      const src = ((def.pre && def.pre[ch]) || '') + ' ' + sec[ch];
      out[ch] = ch === 'nz' ? parseDrum(src) : parseMel(src);
      if (len && out[ch].len !== len) issues.push(`${name}/${sn}/${ch}: ${out[ch].len} pasos, esperaba ${len}`);
      len = Math.max(len, out[ch].len);
    }
    secs[sn] = { ch: out, len };
  }
  const chans = { p1: [], p2: [], tri: [], nz: [] };
  let off = 0;
  for (const sn of def.form.split(/\s+/)) {
    const s = secs[sn];
    for (const ch of CH) if (s.ch[ch]) for (const e of s.ch[ch].ev) chans[ch].push({ ...e, step: e.step + off });
    off += s.len;
  }
  const stepDur = 60 / def.bpm / 4;
  return (compiled[name] = { name, chans, len: off, stepDur, swing: def.swing || 0.5, echo: def.echo ?? 0.22, dur: off * stepDur });
}

// ───────────────────────── motor ─────────────────────────
let ctx = null, master, comp, musicIn, duckLP, musicGain, jingleDuck, sfxBus, jingleBus, delay, echoSend;
let waves = [], noiseBuf = null, timer = null, offline = false;
let volMusic = 0.7, volSfx = 0.8, _muted = false;
let cur = null;        // tema en bucle
let wanted = null;     // nombre pedido (aunque aún no haya init)
const players = [];    // todo lo que se está planificando
let jingleUntil = 0;

try { if (typeof location !== 'undefined' && /[?&]mute\b/.test(location.search)) _muted = true; } catch (e) { /* sin location */ }

function pulseWave(duty) {
  const N = 32, re = new Float32Array(N + 1), im = new Float32Array(N + 1);
  for (let n = 1; n <= N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return ctx.createPeriodicWave(re, im);
}

function build(c) {
  ctx = c;
  master = ctx.createGain(); master.gain.value = _muted ? 0 : 1;
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
  master.connect(comp); comp.connect(ctx.destination);

  musicIn = ctx.createGain();
  duckLP = ctx.createBiquadFilter(); duckLP.type = 'lowpass'; duckLP.frequency.value = 18000; duckLP.Q.value = 0.5;
  jingleDuck = ctx.createGain();
  musicGain = ctx.createGain(); musicGain.gain.value = volMusic;
  musicIn.connect(duckLP); duckLP.connect(jingleDuck); jingleDuck.connect(musicGain); musicGain.connect(master);

  // eco corto, solo para la música
  echoSend = ctx.createGain(); echoSend.gain.value = 1;
  delay = ctx.createDelay(1); delay.delayTime.value = 0.21;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  echoSend.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(duckLP);

  jingleBus = ctx.createGain(); jingleBus.gain.value = volMusic; jingleBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = volSfx * 1.4; sfxBus.connect(master);

  waves = [pulseWave(0.125), pulseWave(0.25), pulseWave(0.5)];
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let seed = 22222;
  for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 1073741823.5) - 1; }
  players.length = 0; cur = null; jingleUntil = 0;
}

function setWave(osc, w) {
  if (w === 'tri') osc.type = 'triangle';
  else if (w === 'sin') osc.type = 'sine';
  else if (w === 'saw') osc.type = 'sawtooth';
  else if (w === 'sq' || w === 2) osc.setPeriodicWave(waves[2]);
  else if (w === 'p25' || w === 1) osc.setPeriodicWave(waves[1]);
  else osc.setPeriodicWave(waves[0]);
}

function noiseSrc(t, dur) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf; s.loop = true;
  s.start(t, (t * 7.13) % 1.7); s.stop(t + dur + 0.05);
  return s;
}

function playNote(dest, kind, e, t, dur, prevF) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  setWave(osc, kind === 'tri' ? 'tri' : e.w);
  if (e.slide && prevF) {
    osc.frequency.setValueAtTime(prevF, t);
    osc.frequency.exponentialRampToValueAtTime(e.f, t + Math.min(0.11, dur * 0.6));
  } else osc.frequency.setValueAtTime(e.f, t);
  const peak = (e.v / 15) * (kind === 'tri' ? 0.34 : e.w === 2 ? 0.13 : e.w === 1 ? 0.15 : 0.17);
  const G = g.gain; G.setValueAtTime(0, t);
  let end = t + dur;
  if (e.env === 0) {            // punteo
    G.linearRampToValueAtTime(peak, t + 0.004);
    G.exponentialRampToValueAtTime(peak * 0.12, t + Math.max(0.05, dur));
    G.linearRampToValueAtTime(0, t + Math.max(0.05, dur) + 0.04); end += 0.05;
  } else if (e.env === 2) {     // crece
    G.linearRampToValueAtTime(peak, t + dur * 0.45);
    G.setValueAtTime(peak, t + dur * 0.8);
    G.linearRampToValueAtTime(0, t + dur + 0.06); end += 0.07;
  } else if (e.env === 3) {     // picada
    const gate = Math.max(0.04, dur * 0.5);
    G.linearRampToValueAtTime(peak, t + 0.004);
    G.linearRampToValueAtTime(peak * 0.55, t + gate * 0.7);
    G.linearRampToValueAtTime(0, t + gate); end = t + gate + 0.01;
  } else {                      // sostenida
    const a = Math.min(0.008, dur * 0.2), dec = Math.min(0.09, dur * 0.4), rel = t + Math.max(dur * 0.92, dur - 0.04);
    G.linearRampToValueAtTime(peak, t + a);
    G.linearRampToValueAtTime(peak * (kind === 'tri' ? 1 : 0.72), t + a + dec);
    G.setValueAtTime(peak * (kind === 'tri' ? 1 : 0.72), Math.max(rel, t + a + dec));
    G.linearRampToValueAtTime(0, Math.max(rel, t + a + dec) + 0.03); end += 0.04;
  }
  if (e.vib && dur > 0.34) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t);
    lg.gain.setValueAtTime(0, t + 0.16); lg.gain.linearRampToValueAtTime(e.f * 0.007, t + 0.3);
    lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(end + 0.05);
  }
  osc.connect(g); g.connect(dest);
  osc.start(t); osc.stop(end + 0.05);
}

function playDrum(dest, e, t) {
  const v = e.v / 15;
  const tone = (f0, f1, dur, vol, type) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  };
  const nz = (dur, vol, type, f, q) => {
    const s = noiseSrc(t, dur), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.8;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
  };
  switch (e.d) {
    case 'k': tone(160, 42, 0.13, v * 0.9, 'sine'); nz(0.02, v * 0.2, 'lowpass', 1200); break;
    case 's': nz(0.13, v * 0.5, 'bandpass', 1900, 0.7); tone(210, 150, 0.06, v * 0.3, 'triangle'); break;
    case 'h': nz(0.035, v * 0.3, 'highpass', 7000); break;
    case 'o': nz(0.3, v * 0.3, 'highpass', 6000); break;
    case 't': tone(120, 62, 0.25, v * 0.8, 'sine'); break;
    case 'c': tone(2100, 1900, 0.025, v * 0.35, 'triangle'); nz(0.012, v * 0.2, 'highpass', 5000); break;
  }
}

function tAt(tr, step) {
  if (tr.swing === 0.5) return step * tr.stepDur;
  const beat = Math.floor(step / 4), x = step - beat * 4, r = tr.swing * 4;
  const w = x < 2 ? x * r / 2 : r + (x - 2) * (4 - r) / 2;
  return (beat * 4 + w) * tr.stepDur;
}

function startPlayer(tr, dest, loop, t0) {
  const g = ctx.createGain(); g.gain.value = 1;
  const e = ctx.createGain(); e.gain.value = tr.echo;
  g.connect(dest);
  if (dest === musicIn) { g.connect(e); e.connect(echoSend); }
  const p = { tr, g, loop, t0, idx: { p1: 0, p2: 0, tri: 0, nz: 0 }, lap: { p1: 0, p2: 0, tri: 0, nz: 0 }, prevF: {}, dead: false, stopAt: Infinity };
  players.push(p);
  return p;
}

function pump(until) {
  for (let k = players.length - 1; k >= 0; k--) {
    const p = players[k];
    if (p.dead) { if (ctx.currentTime > p.stopAt + 0.5) { try { p.g.disconnect(); } catch (e) { /* ya suelto */ } players.splice(k, 1); } continue; }
    const tr = p.tr;
    let alive = false;
    for (const ch of CH) {
      const evs = tr.chans[ch];
      if (!evs.length) continue;
      let guard = 0;
      while (guard++ < 4000) {
        if (p.idx[ch] >= evs.length) { if (!p.loop) break; p.idx[ch] = 0; p.lap[ch]++; }
        const e = evs[p.idx[ch]];
        const base = p.t0 + p.lap[ch] * tr.dur;
        const t = base + tAt(tr, e.step);
        if (t >= until) { alive = true; break; }
        if (t >= ctx.currentTime - 0.05) {
          const tt = Math.max(t, ctx.currentTime);
          if (ch === 'nz') playDrum(p.g, e, tt);
          else playNote(p.g, ch, e, tt, tAt(tr, e.step + e.len) - tAt(tr, e.step), p.prevF[ch]);
        }
        if (ch !== 'nz') p.prevF[ch] = e.f;
        p.idx[ch]++;
      }
      if (p.loop) alive = true;
    }
    if (!alive && !p.loop) { p.dead = true; p.stopAt = p.t0 + tr.dur + 1.5; }
  }
}

function tick() {
  if (!ctx || offline) return;
  pump(ctx.currentTime + 0.45);
}

function startMusic(name, fade) {
  const now = ctx.currentTime;
  if (cur) {
    const old = cur; old.dead = true; old.stopAt = now + fade;
    old.g.gain.cancelScheduledValues(now);
    old.g.gain.setValueAtTime(old.g.gain.value, now);
    old.g.gain.linearRampToValueAtTime(0, now + fade);
    cur = null;
  }
  if (!name || !TRACKS[name]) return;
  const tr = compile(name, TRACKS[name]);
  cur = startPlayer(tr, musicIn, true, now + Math.min(fade * 0.5, 0.4) + 0.06);
  cur.name = name;
  cur.g.gain.setValueAtTime(0, now);
  cur.g.gain.linearRampToValueAtTime(1, now + Math.max(0.05, fade * 0.6));
}

// ───────────────────────── efectos ─────────────────────────
// Cada efecto recibe un pincel `s`: s.o (oscilador con barrido), s.c (curva de
// frecuencias), s.n (ruido filtrado con barrido). Tiempos relativos al disparo.
function brush(dest, t0, pitch) {
  const env = (g, t, dur, vol, a) => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0008, vol * 0.01), t + Math.max(dur, a + 0.01));
    g.gain.linearRampToValueAtTime(0, t + Math.max(dur, a + 0.01) + 0.02);
  };
  const s = {
    o(wave, f0, f1, dur, vol, opt = {}) {
      const t = t0 + (opt.t || 0), o = ctx.createOscillator(), g = ctx.createGain();
      setWave(o, wave);
      o.frequency.setValueAtTime(f0 * pitch, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * pitch), t + dur);
      env(g, t, dur, vol, opt.a ?? 0.003);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.06);
      return s;
    },
    c(wave, fs, dur, vol, opt = {}) {
      const t = t0 + (opt.t || 0), o = ctx.createOscillator(), g = ctx.createGain();
      setWave(o, wave);
      o.frequency.setValueCurveAtTime(Float32Array.from(fs, f => f * pitch), t, dur);
      env(g, t, dur, vol, opt.a ?? 0.006);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.06);
      return s;
    },
    n(dur, vol, opt = {}) {
      const t = t0 + (opt.t || 0), src = noiseSrc(t, dur), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      fl.type = opt.type || 'bandpass'; fl.Q.value = opt.q ?? 1;
      const f0 = (opt.f0 || 1000) * (opt.fix ? 1 : Math.sqrt(pitch)), f1 = (opt.f1 || opt.f0 || 1000) * (opt.fix ? 1 : Math.sqrt(pitch));
      fl.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, dur, vol, opt.a ?? 0.003);
      src.connect(fl); fl.connect(g); g.connect(dest);
      return s;
    },
    seq(wave, fs, gap, dur, vol, opt = {}) {
      fs.forEach((f, i) => s.o(wave, f, f, i === fs.length - 1 ? (opt.last || dur) : dur, vol, { t: (opt.t || 0) + i * gap }));
      return s;
    },
  };
  return s;
}

const R = () => Math.random();
// ajuste de mezcla por efecto (los de ruido filtrado salen flojos; los graves largos, fuertes)
const TRIM = { step: 2.2, stepStone: 2.2, stepWater: 2, jump: 1.6, roll: 1.6, swing1: 3, swing2: 3, swing3: 1.6, hit: 1.5,
  grass: 1.8, menuMove: 2.2, blip: 2.4, talk: 2, target: 1.3, untarget: 1.3, land: 1.4, hurt: 1.4, pot: 1.3, buzz: 1.4,
  door: 0.6, bossRoar: 0.7, bossDie: 0.6, bars: 0.75, waterRise: 0.8,
  fuse: 1.6, blow: 1.8, seedHit: 1.6, spore: 1.8, worm: 1.5, ammo: 1.5, boom: 0.8, burrow: 0.9 };

const SFX = {
  step: s => s.n(0.05, 0.3, { type: 'lowpass', f0: 900, f1: 300 }).o('sin', 180, 90, 0.04, 0.22),
  stepStone: s => s.n(0.04, 0.3, { f0: 2200, f1: 1200, q: 2 }).o('tri', 300, 200, 0.025, 0.2),
  stepWater: s => s.n(0.13, 0.32, { f0: 900, f1: 2600, q: 3 }).o('sin', 500, 900, 0.05, 0.12, { t: 0.02 }),
  jump: s => s.o('p25', 260, 640, 0.14, 0.3),
  land: s => s.n(0.08, 0.4, { type: 'lowpass', f0: 600, f1: 150 }).o('sin', 140, 60, 0.09, 0.4),
  roll: s => s.n(0.24, 0.3, { f0: 400, f1: 1300, q: 1.5, a: 0.03 }).o('tri', 120, 210, 0.2, 0.22),
  swing1: s => s.n(0.11, 0.5, { f0: 900, f1: 3500, q: 2.5 }).o('p12', 500, 900, 0.06, 0.08),
  swing2: s => s.n(0.11, 0.5, { f0: 1100, f1: 4200, q: 2.5 }).o('p12', 600, 1080, 0.06, 0.08),
  swing3: s => s.n(0.17, 0.55, { f0: 700, f1: 5600, q: 2.2 }).o('p12', 750, 1500, 0.1, 0.1).n(0.08, 0.2, { t: 0.1, type: 'highpass', f0: 5000 }),
  hit: s => s.n(0.07, 0.6, { type: 'lowpass', f0: 3000, f1: 400 }).o('sq', 220, 80, 0.08, 0.35),
  hitHard: s => s.n(0.14, 0.8, { type: 'lowpass', f0: 4000, f1: 200 }).o('sq', 160, 40, 0.18, 0.5).o('sin', 90, 40, 0.22, 0.6),
  bounce: s => s.o('sin', 180, 540, 0.07, 0.5).o('sin', 540, 280, 0.16, 0.4, { t: 0.07 }).o('tri', 270, 140, 0.12, 0.2, { t: 0.07 }),
  hurt: s => s.o('p25', 540, 170, 0.22, 0.45).n(0.1, 0.35, { type: 'lowpass', f0: 2500, f1: 500 }),
  peel: s => {
    for (let i = 0; i < 9; i++) s.n(0.022 + R() * 0.02, 0.5, { t: i * 0.028 + R() * 0.012, type: 'highpass', f0: 2200 + R() * 2500 });
    s.n(0.3, 0.25, { f0: 1200, f1: 4200, q: 1.2, a: 0.02 }).n(0.45, 0.22, { t: 0.2, type: 'highpass', f0: 5000, f1: 8000, a: 0.1 });
  },
  gas: s => s.n(0.75, 0.42, { f0: 600, f1: 5200, q: 0.8, a: 0.08 }).n(0.5, 0.15, { t: 0.25, type: 'highpass', f0: 7000, a: 0.15 }),
  cry: s => s.c('p25', [470, 570, 440, 480, 390, 420, 330], 0.5, 0.35).c('tri', [940, 1140, 880, 960, 780, 840, 660], 0.5, 0.12),
  tear: s => s.o('sin', 1568, 1568, 0.09, 0.35).o('sin', 2349, 2349, 0.22, 0.3, { t: 0.06 }).o('tri', 3136, 3136, 0.12, 0.08, { t: 0.06 }),
  ring: s => s.seq('sin', [784, 988, 1175, 1568], 0.07, 0.12, 0.32, { last: 0.45 }).seq('tri', [1568, 1976, 2349, 3136], 0.07, 0.1, 0.1, { last: 0.4 }),
  grass: s => s.n(0.09, 0.45, { type: 'highpass', f0: 3000, f1: 6000 }).n(0.05, 0.3, { t: 0.03, f0: 1500, q: 1.5 }),
  pot: s => {
    s.n(0.18, 0.7, { f0: 2600, f1: 800, q: 1 }).o('sq', 180, 90, 0.06, 0.3);
    for (let i = 0; i < 5; i++) s.o('tri', 1500 + R() * 1800, 1200 + R() * 900, 0.05, 0.2, { t: 0.02 + R() * 0.16 });
  },
  chestOpen: s => {
    s.c('saw', [90, 112, 100, 140, 128, 185], 0.5, 0.2).n(0.4, 0.15, { type: 'lowpass', f0: 500, f1: 900, a: 0.05 });
    [220, 247, 277, 311, 349, 392, 440, 494, 554, 622, 698, 784].forEach((f, i) => s.o('p25', f, f, 0.1, 0.12 + i * 0.012, { t: 0.18 + i * 0.085 }));
  },
  door: s => s.n(1.0, 0.5, { type: 'lowpass', f0: 320, f1: 170, a: 0.1 }).o('sin', 56, 44, 1.0, 0.4, { a: 0.08 })
    .n(0.09, 0.7, { t: 0.98, type: 'lowpass', f0: 1800, f1: 200 }).o('sin', 110, 45, 0.14, 0.6, { t: 0.98 }),
  bars: s => {
    for (let i = 0; i < 6; i++) s.o('sq', 760 + (i % 3) * 190, 740 + (i % 3) * 190, 0.05, 0.16, { t: i * 0.045 });
    s.o('sq', 311, 300, 0.4, 0.28, { t: 0.28 }).o('sq', 467, 458, 0.35, 0.18, { t: 0.28 }).n(0.08, 0.5, { t: 0.28, type: 'lowpass', f0: 2500, f1: 300 });
  },
  plateOn: s => s.o('sq', 196, 196, 0.06, 0.35).o('sq', 294, 294, 0.12, 0.35, { t: 0.06 }).n(0.05, 0.3, { type: 'lowpass', f0: 500 }),
  plateOff: s => s.o('sq', 294, 294, 0.06, 0.35).o('sq', 196, 196, 0.12, 0.35, { t: 0.06 }),
  push: s => s.n(0.26, 0.5, { type: 'lowpass', f0: 520, f1: 240, a: 0.03 }).o('sin', 72, 58, 0.26, 0.3, { a: 0.03 }),
  splash: s => s.n(0.36, 0.6, { f0: 500, f1: 3200, q: 0.7 }).n(0.26, 0.3, { t: 0.1, type: 'highpass', f0: 4000 }).o('sin', 300, 120, 0.12, 0.3),
  waterRise: s => {
    s.n(3.0, 0.34, { f0: 300, f1: 1500, q: 0.6, a: 0.5 }).n(3.0, 0.12, { type: 'highpass', f0: 4500, a: 0.8 }).o('sin', 60, 130, 3.0, 0.25, { a: 0.6 });
    for (let i = 0; i < 16; i++) { const f = 350 + R() * 700 + i * 30; s.o('sin', f, f * 1.9, 0.06, 0.16, { t: 0.2 + R() * 2.6 }); }
  },
  root: s => s.n(0.42, 0.5, { type: 'lowpass', f0: 750, f1: 150, a: 0.05 }).o('sin', 165, 50, 0.4, 0.5).n(0.05, 0.3, { t: 0.3, f0: 1200, q: 2 }),
  sprout: s => s.o('sin', 300, 1250, 0.07, 0.5).o('tri', 1250, 1560, 0.14, 0.3, { t: 0.07 }).n(0.03, 0.3, { t: 0.06, type: 'highpass', f0: 4000 }),
  menuOpen: s => s.seq('p25', [440, 659, 880], 0.055, 0.07, 0.26, { last: 0.14 }),
  menuClose: s => s.seq('p25', [880, 659, 440], 0.055, 0.07, 0.26, { last: 0.14 }),
  menuMove: s => s.o('p12', 880, 880, 0.035, 0.24),
  menuPeel: s => s.n(0.2, 0.4, { type: 'highpass', f0: 1500, f1: 6500, a: 0.01 }).o('p25', 330, 660, 0.13, 0.18).n(0.03, 0.4, { t: 0.02, type: 'highpass', f0: 3000 }),
  select: s => s.o('p25', 660, 660, 0.05, 0.3).o('p25', 990, 990, 0.11, 0.3, { t: 0.05 }),
  cancel: s => s.o('p25', 440, 440, 0.05, 0.3).o('p25', 294, 294, 0.11, 0.3, { t: 0.05 }),
  blip: s => s.o('p25', 440, 440, 0.032, 0.2),
  talk: s => s.o('tri', 700, 920, 0.05, 0.3),
  target: s => s.o('p12', 1175, 1175, 0.04, 0.3).o('p12', 1760, 1760, 0.09, 0.3, { t: 0.04 }),
  untarget: s => s.o('p12', 1175, 1175, 0.04, 0.26).o('p12', 784, 784, 0.09, 0.26, { t: 0.04 }),
  secret: s => s.seq('p25', [988, 1245, 932, 1319, 1109, 1661], 0.095, 0.11, 0.28, { last: 0.5 }).seq('tri', [494, 622, 466, 659, 554, 831], 0.095, 0.11, 0.22, { last: 0.5 }),
  error: s => s.o('sq', 150, 150, 0.1, 0.32).o('sq', 110, 110, 0.17, 0.32, { t: 0.11 }),
  die: s => s.c('p25', [660, 500, 520, 380, 400, 260, 180, 90], 1.0, 0.4).n(0.5, 0.3, { t: 0.5, type: 'lowpass', f0: 1500, f1: 150 }),
  bossRoar: s => s.c('saw', [70, 112, 92, 62, 46], 1.1, 0.5, { a: 0.08 }).c('sq', [52, 60, 50, 40, 34], 1.1, 0.4, { a: 0.08 }).n(1.1, 0.45, { type: 'lowpass', f0: 250, f1: 1100, a: 0.15, q: 3 }),
  bossHit: s => s.n(0.14, 0.8, { type: 'lowpass', f0: 4000, f1: 200 }).o('sq', 160, 40, 0.18, 0.5).c('saw', [320, 200, 240, 95], 0.3, 0.35),
  bossDie: s => {
    s.c('saw', [220, 150, 190, 110, 140, 70, 90, 35], 2.0, 0.5).c('sq', [110, 75, 95, 55, 70, 35, 45, 25], 2.0, 0.4);
    for (let i = 0; i < 7; i++) s.n(0.16, 0.6, { t: i * 0.27, type: 'lowpass', f0: 3000 - i * 300, f1: 200 });
    s.n(0.9, 0.5, { t: 1.9, type: 'lowpass', f0: 2500, f1: 100 }).o('sin', 90, 30, 0.9, 0.6, { t: 1.9 });
  },
  slime: s => s.c('sin', [200, 330, 180, 300, 150], 0.3, 0.4).n(0.2, 0.2, { f0: 700, q: 4 }),
  buzz: s => s.c('saw', [220, 242, 214, 238, 222], 0.35, 0.18, { a: 0.03 }).c('sq', [227, 236, 221, 245, 229], 0.35, 0.12, { a: 0.03 }),
  curl: s => { for (let i = 0; i < 7; i++) s.o('sq', 300 + i * 130, 300 + i * 130, 0.022, 0.25, { t: i * 0.026 }); s.n(0.05, 0.3, { t: 0.18, f0: 1800, q: 2 }); },
  bucket: s => s.c('saw', [400, 525, 430, 560, 450], 0.32, 0.12, { a: 0.02 }).n(0.3, 0.2, { f0: 900, f1: 1400, q: 3, a: 0.03 }).o('sq', 130, 110, 0.08, 0.25, { t: 0.32 }),
  keyGet: s => s.seq('p12', [1319, 1661, 1976], 0.07, 0.08, 0.28, { last: 0.28 }).o('tri', 988, 988, 0.3, 0.12, { t: 0.14 }),
  firefly: s => s.o('sin', 1760, 1760, 0.08, 0.3).o('sin', 2349, 2349, 0.18, 0.3, { t: 0.1 }).o('tri', 3520, 3520, 0.06, 0.06, { t: 0.1 }),
  // — capítulo II —
  fuse: s => {
    s.n(0.25, 0.14, { type: 'highpass', f0: 5200, f1: 7500, a: 0.02 });
    for (let i = 0; i < 6; i++) s.n(0.012 + R() * 0.014, 0.4, { t: i * 0.04 + R() * 0.02, f0: 2600 + R() * 3800, q: 3 });
  },
  boom: s => s.o('sin', 150, 32, 0.55, 0.9).o('sq', 90, 28, 0.3, 0.4).n(0.12, 0.9, { type: 'lowpass', f0: 5000, f1: 300 })
    .n(0.9, 0.5, { t: 0.05, type: 'lowpass', f0: 1400, f1: 120, a: 0.02 }),
  blow: s => s.n(0.09, 0.6, { f0: 700, f1: 2600, q: 1.4, a: 0.004 }).o('sin', 320, 150, 0.06, 0.3).n(0.05, 0.2, { t: 0.05, type: 'highpass', f0: 4000 }),
  seedHit: s => s.o('tri', 2900, 2300, 0.035, 0.4).o('sin', 4200, 3900, 0.05, 0.2).n(0.012, 0.3, { type: 'highpass', f0: 6000 }),
  budOn: s => s.o('sin', 1319, 1319, 0.1, 0.32).o('tri', 2637, 2637, 0.06, 0.08)
    .o('sin', 1976, 1976, 0.3, 0.32, { t: 0.09 }).o('tri', 3951, 3951, 0.16, 0.07, { t: 0.09 }),
  burrow: s => {
    s.n(0.5, 0.6, { type: 'lowpass', f0: 180, f1: 320, a: 0.08, q: 2 }).c('sin', [48, 62, 44, 66, 50, 58, 42], 0.5, 0.5, { a: 0.06 });
    for (let i = 0; i < 5; i++) s.n(0.05, 0.35, { t: i * 0.09 + R() * 0.03, type: 'lowpass', f0: 420 + R() * 200 });
  },
  emerge: s => {
    s.o('sin', 120, 40, 0.2, 0.8).n(0.08, 0.8, { type: 'lowpass', f0: 2500, f1: 300 })
      .n(0.5, 0.5, { t: 0.03, f0: 300, f1: 4200, q: 0.8, a: 0.05 }).c('saw', [70, 120, 180], 0.35, 0.25, { t: 0.03 });
    for (let i = 0; i < 5; i++) s.n(0.03, 0.3, { t: 0.2 + R() * 0.3, f0: 900 + R() * 1800, q: 2 });
  },
  spore: s => s.n(0.4, 0.4, { f0: 1400, f1: 600, q: 0.7, a: 0.03 }).n(0.3, 0.12, { t: 0.05, type: 'highpass', f0: 5000, a: 0.08 }).o('sin', 260, 180, 0.12, 0.12),
  shell: s => s.o('sq', 830, 810, 0.07, 0.3).o('sq', 1247, 1230, 0.05, 0.22).o('tri', 2210, 2180, 0.09, 0.15)
    .n(0.03, 0.6, { f0: 3200, q: 2 }).o('sin', 190, 120, 0.05, 0.3),
  moldDie: s => {
    for (let i = 0; i < 8; i++) { const f = 700 - i * 65 + R() * 60; s.o('sin', f, f * 1.6, 0.05, 0.3, { t: i * 0.06 + R() * 0.02 }); }
    s.n(0.5, 0.25, { type: 'lowpass', f0: 1500, f1: 250, a: 0.03 }).c('tri', [420, 300, 330, 200, 220, 110], 0.5, 0.2);
  },
  mildiu: s => {
    for (let i = 0; i < 5; i++) {
      const f = 150 - i * 12, t = i * 0.15;
      s.c('saw', [f * 1.25, f, f * 0.85], 0.11, 0.3, { t }).o('sq', f * 0.5, f * 0.45, 0.11, 0.25, { t });
      const b = 300 + R() * 200; s.o('sin', b, b * 1.7, 0.04, 0.12, { t: t + 0.07 });
    }
    s.n(0.75, 0.15, { type: 'lowpass', f0: 500, f1: 300, q: 4, a: 0.05 });
  },
  worm: s => s.c('sin', [520, 760, 640, 700, 480], 0.16, 0.35).c('tri', [1040, 1520, 1280, 1400, 960], 0.16, 0.08),
  crumble: s => {
    s.n(0.7, 0.55, { type: 'lowpass', f0: 1800, f1: 250, a: 0.02 }).o('sin', 95, 45, 0.5, 0.4);
    for (let i = 0; i < 10; i++) s.n(0.03 + R() * 0.03, 0.45, { t: R() * 0.6, f0: 500 + R() * 1800, q: 2 });
    for (let i = 0; i < 4; i++) s.o('tri', 300 + R() * 300, 150, 0.05, 0.2, { t: 0.05 + R() * 0.5 });
  },
  ammo: s => s.o('sq', 1400, 1400, 0.022, 0.3).n(0.012, 0.3, { type: 'highpass', f0: 4000 })
    .o('sq', 2100, 2100, 0.04, 0.3, { t: 0.07 }).n(0.012, 0.3, { t: 0.07, type: 'highpass', f0: 4000 }),
};

// ───────────────────────── API ─────────────────────────
export const audio = {
  init(opts) {
    if (ctx && !(opts && opts.ctx)) { if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {}); return true; }
    try {
      let c = opts && opts.ctx;
      offline = !!c;
      if (!c) {
        const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return false;
        c = new AC({ latencyHint: 'interactive' });
      }
      build(c);
      if (!offline) {
        if (c.state === 'suspended' && c.resume) c.resume().catch(() => {});
        if (timer) clearInterval(timer);
        timer = setInterval(tick, 60);
      }
      if (wanted) { const w = wanted; startMusic(w, 0.05); }
      return true;
    } catch (e) { ctx = null; return false; }
  },

  sfx(name, opts) {
    const fn = SFX[name];
    if (!ctx || !fn) return;
    try {
      const o = opts || {}, t = ctx.currentTime + 0.004;
      const g = ctx.createGain(); g.gain.value = (o.vol ?? 1) * (TRIM[name] || 1);
      let out = g;
      if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); out = p; }
      out.connect(sfxBus);
      fn(brush(g, t, o.pitch || 1));
    } catch (e) { /* un efecto nunca tumba el juego */ }
  },

  music(name, opts) {
    name = name || null;
    if (name && !TRACKS[name]) return;
    if (name === wanted && (!ctx || (cur && cur.name === name))) return;
    wanted = name;
    if (!ctx) return;
    try { startMusic(name, (opts && opts.fade) ?? 0.8); } catch (e) { /* idem */ }
  },

  jingle(name) {
    const def = JINGLES[name];
    if (!def) return 0;
    let tr;
    try { tr = compile('j:' + name, def); } catch (e) { return 0; }
    const dur = tr.dur + 0.5;
    if (!ctx) return dur;
    try {
      const now = ctx.currentTime;
      startPlayer(tr, jingleBus, false, now + 0.08);
      const G = jingleDuck.gain;
      G.cancelScheduledValues(now); G.setValueAtTime(G.value, now);
      G.linearRampToValueAtTime(0, now + 0.1);
      G.setValueAtTime(0, now + dur - 0.1);
      G.linearRampToValueAtTime(1, now + dur + 0.9);
      jingleUntil = now + dur;
      if (!offline) tick();
    } catch (e) { /* idem */ }
    return dur;
  },

  duck(on) {
    if (!ctx) return;
    const now = ctx.currentTime;
    duckLP.frequency.cancelScheduledValues(now);
    duckLP.frequency.setTargetAtTime(on ? 650 : 18000, now, on ? 0.06 : 0.12);
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setTargetAtTime(volMusic * (on ? 0.45 : 1), now, 0.08);
    this._ducked = !!on;
  },

  setVolume(m, s) {
    if (m != null) volMusic = Math.max(0, Math.min(1, m));
    if (s != null) volSfx = Math.max(0, Math.min(1, s));
    if (!ctx) return;
    const now = ctx.currentTime;
    musicGain.gain.setTargetAtTime(volMusic * (this._ducked ? 0.45 : 1), now, 0.03);
    jingleBus.gain.setTargetAtTime(volMusic, now, 0.03);
    sfxBus.gain.setTargetAtTime(volSfx * 1.4, now, 0.03);
  },

  get muted() { return _muted; },
  set muted(v) {
    _muted = !!v;
    if (ctx) master.gain.setTargetAtTime(_muted ? 0 : 1, ctx.currentTime, 0.02);
  },

  get current() { return wanted; },
  get ready() { return !!ctx; },

  // — para pruebas —
  _pump(sec) { if (ctx) pump(ctx.currentTime + sec); },
  _ctx() { return ctx; },
  _out() { return comp; },
  _info() {
    const out = { tracks: {}, jingles: {}, sfx: Object.keys(SFX), issues };
    for (const n in TRACKS) { const t = compile(n, TRACKS[n]); out.tracks[n] = { dur: t.dur, steps: t.len }; }
    for (const n in JINGLES) { const t = compile('j:' + n, JINGLES[n]); out.jingles[n] = { dur: t.dur, steps: t.len }; }
    return out;
  },
};
