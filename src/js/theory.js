/* Theory and fretboard math. Pure functions with no DOM access, shared by every lesson and by the build script. */
var LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
var NAT = [0, 2, 4, 5, 7, 9, 11];
var STRNAME = ['low E', 'A', 'D', 'G', 'B', 'high e'];
var STRLET = ['E', 'A', 'D', 'G', 'B', 'e'];
var OPEN = [4, 9, 2, 7, 11, 4];
var MIDI = [40, 45, 50, 55, 59, 64];
var FALLBACK = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
var PRETTY = { Fb: 'E', Cb: 'B', 'E#': 'F', 'B#': 'C' };
var ROOTS = [
  { n: 'C', li: 0, pc: 0 }, { n: 'Db', li: 1, pc: 1 }, { n: 'D', li: 1, pc: 2 }, { n: 'Eb', li: 2, pc: 3 },
  { n: 'E', li: 2, pc: 4 }, { n: 'F', li: 3, pc: 5 }, { n: 'F#', li: 3, pc: 6 }, { n: 'G', li: 4, pc: 7 },
  { n: 'Ab', li: 5, pc: 8 }, { n: 'A', li: 5, pc: 9 }, { n: 'Bb', li: 6, pc: 10 }, { n: 'B', li: 6, pc: 11 }
];
var DEFAULT = 'C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7';
var PRESETS = [
  { name: '12-bar blues in C', text: DEFAULT },
  { name: 'Minor blues in A', text: 'Am7 Am7 Am7 Am7 Dm7 Dm7 Am7 Am7 F7 E7 Am7 E7' },
  { name: 'I V vi IV in G', text: 'G D Em C' },
  { name: 'I bVII IV vamp in G', text: 'G F C G' },
  { name: 'Dorian vamp in E', text: 'Em7 A7 Em7 A7' },
  { name: 'ii V I in C', text: 'Dm7 G7 Cmaj7 Cmaj7' },
  { name: 'Andalusian cadence in A', text: 'Am G F E' },
  { name: 'Major to minor, same root', text: 'C Cm F Fm' }
];

function mod(n, m) { return ((n % m) + m) % m; }
function spell(li, pc) {
  li = mod(li, 7);
  var d = mod(pc - NAT[li], 12);
  if (d > 6) d -= 12;
  var acc = { 0: '', 1: '#', 2: '##', '-1': 'b', '-2': 'bb' }[d];
  var name = acc === undefined ? FALLBACK[pc] : LETTERS[li] + acc;
  return PRETTY[name] || name;
}

/* tone specs: [label, semitones, letter offset, class] */
var TONES = {
  maj: [['R', 0, 0, 'R'], ['3', 4, 2, '3M'], ['5', 7, 4, '5']],
  maj7: [['R', 0, 0, 'R'], ['3', 4, 2, '3M'], ['5', 7, 4, '5'], ['7', 11, 6, '7']],
  dom7: [['R', 0, 0, 'R'], ['3', 4, 2, '3M'], ['5', 7, 4, '5'], ['b7', 10, 6, '7']],
  min: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['5', 7, 4, '5']],
  min7: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['5', 7, 4, '5'], ['b7', 10, 6, '7']],
  minmaj7: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['5', 7, 4, '5'], ['7', 11, 6, '7']],
  m7b5: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['b5', 6, 4, '5'], ['b7', 10, 6, '7']],
  dim: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['b5', 6, 4, '5']],
  dim7: [['R', 0, 0, 'R'], ['b3', 3, 2, '3m'], ['b5', 6, 4, '5'], ['bb7', 9, 6, '7']],
  aug: [['R', 0, 0, 'R'], ['3', 4, 2, '3M'], ['#5', 8, 4, '5']],
  sus: [['R', 0, 0, 'R'], ['5', 7, 4, '5']],
  power: [['R', 0, 0, 'R'], ['5', 7, 4, '5']]
};
var SCALES = {
  maj: { n: 'major (Ionian)', s: [0, 2, 4, 5, 7, 9, 11] },
  maj7: { n: 'major (Ionian)', s: [0, 2, 4, 5, 7, 9, 11] },
  dom7: { n: 'Mixolydian', s: [0, 2, 4, 5, 7, 9, 10] },
  min: { n: 'Dorian', s: [0, 2, 3, 5, 7, 9, 10] },
  min7: { n: 'Dorian', s: [0, 2, 3, 5, 7, 9, 10] },
  minmaj7: { n: 'melodic minor', s: [0, 2, 3, 5, 7, 9, 11] },
  m7b5: { n: 'Locrian', s: [0, 1, 3, 5, 6, 8, 10] }
};

/* ---------- chord parsing ---------- */
var KINDS = [
  [/^(|maj|M|6|69|6\/9|add9|add11|2|add2)$/, 'maj'],
  [/^(maj|M|Δ|△)(7|9|11|13)(#11)?$/, 'maj7'],
  [/^(m|min|-)(maj|M|Δ|△)(7|9)$/, 'minmaj7'],
  [/^(m7b5|min7b5|-7b5|ø|ø7|m7♭5)$/, 'm7b5'],
  [/^(m|min|-)(7|9|11|13)$/, 'min7'],
  [/^(m|min|-)(6|69|add9|add11|b6|2)?$/, 'min'],
  [/^(dim7|°7|o7)$/, 'dim7'],
  [/^(dim|°|o)$/, 'dim'],
  [/^(aug|\+)(7)?$/, 'aug'],
  [/^(7|9|11|13)((#|b)(5|9|11|13)|alt)*$/, 'dom7'],
  [/^(sus2|sus4|sus|7sus4|7sus|9sus4|9sus)$/, 'sus'],
  [/^5$/, 'power']
];

function parseChord(tok) {
  var t = tok.replace(/\/[A-Ga-g][#b]?$/, '');
  var m = /^([A-Ga-g])([#b♯♭]*)(.*)$/.exec(t);
  if (!m) return { err: 'Start each chord with a note letter from A to G.' };
  var li = LETTERS.indexOf(m[1].toUpperCase());
  var acc = 0;
  for (var i = 0; i < m[2].length; i++) acc += (m[2][i] === '#' || m[2][i] === '♯') ? 1 : -1;
  var pc = mod(NAT[li] + acc, 12);
  var q = m[3], kind = null;
  for (var k = 0; k < KINDS.length; k++) if (KINDS[k][0].test(q)) { kind = KINDS[k][1]; break; }
  if (!kind) return { err: 'Unknown chord "' + tok + '".' };
  var tones = TONES[kind].map(function (sp) {
    var tpc = mod(pc + sp[1], 12);
    return { label: sp[0], pc: tpc, name: spell(li + sp[2], tpc), cls: sp[3] };
  });
  var third = null, seventh = null;
  tones.forEach(function (x) {
    if (x.cls === '3M' || x.cls === '3m') third = x;
    if (x.cls === '7') seventh = x;
  });
  return {
    chord: {
      sym: m[1].toUpperCase() + m[2] + q, root: spell(li, pc), li: li, pc: pc, kind: kind,
      tones: tones, third: third, seventh: seventh,
      thirdQ: third ? (third.cls === '3M' ? 'major' : 'minor') : null
    }
  };
}

function parseProgression(text) {
  var toks = text.split(/[\s,|]+/).filter(Boolean);
  var bars = [], changes = [], prev = null;
  toks.forEach(function (tok, i) {
    var r = parseChord(tok);
    var bar = { tok: tok, idx: i };
    if (r.err) { bar.err = r.err; bars.push(bar); return; }
    bar.chord = r.chord;
    if (!prev || prev.sym !== r.chord.sym) {
      changes.push({ bar: i, chord: r.chord });
      bar.isChange = true;
    }
    bar.cidx = changes.length - 1;
    prev = r.chord;
    bars.push(bar);
  });
  return { bars: bars, changes: changes };
}

/* ---------- fretboard helpers ---------- */
function positions(pc, lo, hi) {
  var out = [];
  for (var s = 0; s < 6; s++) for (var f = lo; f <= hi; f++) if ((OPEN[s] + f) % 12 === pc) out.push({ s: s, f: f });
  return out;
}
function pitch(p) { return MIDI[p.s] + p.f; }
function dist(p, q) { return Math.abs(p.f - q.f) + 1.25 * Math.abs(p.s - q.s); }
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function spotText(p) { return STRNAME[p.s] + ' string, fret ' + p.f; }
function signed(d) { d = mod(d, 12); return d > 6 ? d - 12 : d; }

function computeRoute(changes, lo, hi) {
  var cands = changes.map(function (c) { return c.chord.third ? positions(c.chord.third.pc, lo, hi) : null; });
  var idxs = [];
  cands.forEach(function (c, i) { if (c) idxs.push(i); });
  var route = changes.map(function () { return null; });
  if (!idxs.length) return route;
  var mid = (lo + hi) / 2;
  var own = function (p) { return 0.1 * Math.abs(p.f - mid); };
  var cost = cands[idxs[0]].map(own), back = [], k, j, i;
  for (k = 1; k < idxs.length; k++) {
    var A = cands[idxs[k - 1]], B = cands[idxs[k]], nc = [], bk = [];
    for (j = 0; j < B.length; j++) {
      var best = Infinity, bi = 0;
      for (i = 0; i < A.length; i++) {
        var c = cost[i] + dist(A[i], B[j]) + own(B[j]);
        if (c < best) { best = c; bi = i; }
      }
      nc.push(best); bk.push(bi);
    }
    back.push(bk); cost = nc;
  }
  var bj = 0;
  for (j = 1; j < cost.length; j++) if (cost[j] < cost[bj]) bj = j;
  for (k = idxs.length - 1; k >= 0; k--) {
    route[idxs[k]] = cands[idxs[k]][bj];
    if (k > 0) bj = back[k - 1][bj];
  }
  return route;
}

function moveText(p, q) {
  if (!p) return 'Start here';
  var ds = q.s - p.s, df = q.f - p.f;
  if (!ds && !df) return 'Hold the same spot';
  var a = ds ? plural(Math.abs(ds), 'string') + (ds > 0 ? ' higher' : ' lower') : 'same string';
  var b = df ? plural(Math.abs(df), 'fret') + (df > 0 ? ' up' : ' down') : 'same fret';
  return a + ', ' + b;
}

var MOTION = ['stays on the same root', 'up a half step', 'up a whole step', 'up a minor 3rd', 'up a major 3rd', 'up a 4th', 'a tritone away',
  'up a 5th', 'down a major 3rd', 'down a minor 3rd', 'down a whole step', 'down a half step'];
var LABELW = { R: 'root', '3': '3rd', b3: 'b3', '5': '5th', b5: 'b5', '#5': '#5', '7': 'major 7th', b7: 'b7', bb7: 'bb7' };
function lw(l) { return LABELW[l] || l; }
function stepWord(n) { return n === 1 ? 'a half step' : n === 2 ? 'a whole step' : plural(n, 'half step'); }

function cellFrom(chord, p0, L, H) {
  var sc = SCALES[chord.kind];
  if (!sc) return null;
  var degs = [2, 1, 0, 6, 5, 4], out = [p0], prev = p0;
  for (var k = 1; k < degs.length; k++) {
    var pc = mod(chord.pc + sc.s[degs[k]], 12);
    var cand = positions(pc, L, H).filter(function (p) { return pitch(p) < pitch(prev); });
    if (!cand.length) return { notes: out, complete: false };
    cand.sort(function (a, b) { return (pitch(prev) - pitch(a)) - (pitch(prev) - pitch(b)) || Math.abs(a.s - prev.s) - Math.abs(b.s - prev.s); });
    prev = cand[0];
    out.push(prev);
  }
  return { notes: out, complete: true };
}
function neighborPitch(p0, delta, L, H) {
  var target = pitch(p0) + delta, best = null;
  for (var s = 0; s < 6; s++) {
    var f = target - MIDI[s];
    if (f >= L && f <= H && (!best || Math.abs(s - p0.s) < Math.abs(best.s - p0.s))) best = { s: s, f: f };
  }
  return best;
}

/* Marks for the root and the major and minor 3rds of a root. R is an entry of ROOTS. */
function thirdsMarks(R, lo, hi, hide) {
  var marks = [];
  var majPc = mod(R.pc + 4, 12), minPc = mod(R.pc + 3, 12);
  var majName = spell(R.li + 2, majPc), minName = spell(R.li + 2, minPc);
  positions(R.pc, lo, hi).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: 'R', label: R.n }); });
  if (!hide) {
    positions(minPc, lo, hi).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: '3m', label: minName }); });
    positions(majPc, lo, hi).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: '3M', label: majName }); });
  }
  return { marks: marks, majName: majName, minName: minName };
}

/* ---------- tension map ----------
   Levels, from most settled to most tense:
   home    root, 3rd and 5th of the chord (release)
   color   the chord's 7th and any scale note that does not sit a half step above a home tone
   tense   a scale note a half step above a home tone (the classic avoid note, such as F over C7)
   outside a note that is not in the chord's parent scale */
var IVLABEL = [['R', 0], ['b2', 1], ['2', 1], ['b3', 2], ['3', 2], ['4', 3], ['b5', 4], ['5', 4], ['b6', 5], ['6', 5], ['b7', 6], ['7', 6]];
var IVWORD = { R: 'root', b2: 'b2', '2': '2nd', b3: 'b3', '3': '3rd', '4': '4th', b5: 'b5', '5': '5th', b6: 'b6', '6': '6th', b7: 'b7', '7': '7th' };
var LEVEL_NAME = { home: 'Release', color: 'Color', tense: 'Tension', outside: 'Outside' };
var LEVEL_CLS = { color: '7', tense: 'T', outside: 'X' };

function tensionMap(chord) {
  var homePcs = {}, chordPcs = {}, homeTone = {};
  chord.tones.forEach(function (t) {
    chordPcs[t.pc] = 1;
    if (t.cls === 'R' || t.cls === '3M' || t.cls === '3m' || t.cls === '5') { homePcs[t.pc] = 1; homeTone[t.pc] = t; }
  });
  var sc = SCALES[chord.kind] || (chord.kind === 'sus' || chord.kind === 'power' ? SCALES.dom7 : null);
  var scalePcs = {};
  if (sc) sc.s.forEach(function (x) { scalePcs[mod(chord.pc + x, 12)] = 1; });
  var items = [], byPc = {}, d;
  for (d = 0; d < 12; d++) {
    var pc = mod(chord.pc + d, 12), iv = IVLABEL[d], level;
    if (homePcs[pc]) level = 'home';
    else if (chordPcs[pc]) level = 'color';
    else if (!sc || scalePcs[pc]) level = homePcs[mod(pc - 1, 12)] ? 'tense' : 'color';
    else level = 'outside';
    var blue = null, bluesKind = chord.kind === 'maj' || chord.kind === 'dom7';
    if (level !== 'home' && bluesKind && d === 3) blue = 'Blue note. Bend or slide it up into the 3rd.';
    if (level !== 'home' && (bluesKind || chord.kind === 'min' || chord.kind === 'min7') && d === 6) blue = 'Blue note. Lean it up to the 5th.';
    var it = { pc: pc, d: d, label: iv[0], word: IVWORD[iv[0]], name: spell(chord.li + iv[1], pc), level: level, blue: blue, resolves: [],
      cls: level === 'home' ? homeTone[pc].cls : LEVEL_CLS[level] };
    items.push(it); byPc[pc] = it;
  }
  var homes = items.filter(function (x) { return x.level === 'home'; });
  items.forEach(function (it) {
    if (it.level === 'home') return;
    var best = Infinity, out = [];
    homes.forEach(function (h) {
      var sd = signed(h.pc - it.pc), ad = Math.abs(sd);
      if (ad < best) { best = ad; out = [{ pc: h.pc, name: h.name, d: sd }]; } else if (ad === best) out.push({ pc: h.pc, name: h.name, d: sd });
    });
    it.resolves = out;
  });
  return { items: items, byPc: byPc, scaleName: sc ? sc.n : null };
}

/* Fretboard marks for a tension map. Options: labels ('name' or 'interval') and onlyHome. */
function tensionMarks(map, lo, hi, o) {
  o = o || {};
  var marks = [];
  map.items.forEach(function (it) {
    if (o.onlyHome && it.level !== 'home') return;
    positions(it.pc, lo, hi).forEach(function (p) {
      marks.push({ s: p.s, f: p.f, cls: it.cls, label: o.labels === 'interval' ? it.label : it.name });
    });
  });
  return marks;
}

export {
  LETTERS, NAT, STRNAME, STRLET, OPEN, MIDI, ROOTS, DEFAULT, PRESETS, TONES, SCALES, MOTION,
  mod, spell, parseChord, parseProgression, positions, pitch, dist, esc, plural, spotText, signed,
  computeRoute, moveText, lw, stepWord, cellFrom, neighborPitch, thirdsMarks,
  tensionMap, tensionMarks, IVWORD, LEVEL_NAME
};
