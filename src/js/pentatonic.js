/* Pentatonic helpers for lesson 3. Pure functions with no DOM access, shared by the lesson page and the tests. */
import { mod, spell, positions } from './theory.js';

/* [semitones from root, interval label, marker class, letter offset] */
var MIN = [[0, 'R', 'R', 0], [3, 'b3', '3m', 2], [5, '4', '7', 3], [7, '5', '5', 4], [10, 'b7', '7', 6]];
var MAJ = [[0, 'R', 'R', 0], [2, '2', 'T', 1], [4, '3', '3M', 2], [7, '5', '5', 4], [9, '6', 'T', 5]];
/* The five minor pentatonic boxes, as fret offsets from the root on the low E string. */
var OFF_LO = [0, 2, 4, 7, 9], OFF_HI = [3, 5, 8, 10, 12];
var MAX_FRET = 22;

function notes(R, def) {
  return def.map(function (d) {
    var pc = mod(R.pc + d[0], 12);
    return { pc: pc, semi: d[0], label: d[1], cls: d[2], name: spell(R.li + d[3], pc) };
  });
}

/* Fret of the root on the low E string, lifted so the major box one fret below it stays on the neck. */
function baseFret(R) { var r = mod(R.pc - 4, 12); return r < 2 ? r + 12 : r; }

/* Pairs each minor box with the major box that sits next to it. The major scale uses the shapes of its
   relative minor, three frets lower, so major box k+1 lands beside minor box k. */
function boxPairs(R) {
  var r = baseFret(R), rr = r - 3, out = [];
  for (var k = 0; k < 5; k++) {
    var j = (k + 1) % 5, wrap = k === 4 ? 12 : 0;
    var min = { lo: r + OFF_LO[k], hi: r + OFF_HI[k] };
    var maj = { lo: rr + OFF_LO[j] + wrap, hi: rr + OFF_HI[j] + wrap };
    if (min.lo >= 0 && maj.lo >= 0 && min.hi <= MAX_FRET && maj.hi <= MAX_FRET) out.push({ k: k, min: min, maj: maj });
  }
  return out;
}

/* Fretboard window for a pair and a view ('minor', 'major' or 'both'), with one fret of padding. */
function viewRange(pair, view) {
  var lo = view === 'major' ? pair.maj.lo : view === 'minor' ? pair.min.lo : Math.min(pair.min.lo, pair.maj.lo);
  var hi = view === 'major' ? pair.maj.hi : view === 'minor' ? pair.min.hi : Math.max(pair.min.hi, pair.maj.hi);
  return { lo: Math.max(0, lo - 1), hi: hi + 1 };
}

function marksFor(R, pair, view, labels) {
  var seen = {}, out = [];
  function add(def, win) {
    notes(R, def).forEach(function (n) {
      positions(n.pc, win.lo, win.hi).forEach(function (p) {
        var key = p.s + '_' + p.f;
        if (seen[key]) return;
        seen[key] = 1;
        out.push({ s: p.s, f: p.f, cls: n.cls, label: labels === 'interval' ? n.label : n.name });
      });
    });
  }
  if (view !== 'major') add(MIN, pair.min);
  if (view !== 'minor') add(MAJ, pair.maj);
  return out;
}

/* The three one-fret moves that turn the minor scale into the major scale. */
function oneFretMoves(R) {
  var mn = notes(R, MIN), mj = notes(R, MAJ);
  var by = function (list, label) { return list.filter(function (n) { return n.label === label; })[0]; };
  return [['b3', '3'], ['4', '3'], ['b7', '6']].map(function (p) {
    var a = by(mn, p[0]), b = by(mj, p[1]);
    var d = mod(b.pc - a.pc, 12);
    return { from: a, to: b, dir: d === 1 ? 'up' : 'down' };
  });
}

/* Tab examples, written in the key of A. Each note is [slot, string (0 = low E), fret, suffix, mark as 3rd]. */
var EX_A = [
  { title: 'Move 1 · Minor home base', scale: ['min', 'min'],
    text: 'A descending run through the minor box, then a held root. This is the grit. Play it until it feels like home.',
    bars: [[[0, 5, 8], [1, 5, 5], [2, 4, 8], [3, 4, 5], [4, 3, 7], [5, 3, 5], [6, 2, 7], [7, 2, 5]], [[0, 0, 5, '~']]] },
  { title: 'Move 2 · Bend the b3 toward the 3rd', scale: ['min', 'min'],
    text: 'Bend the b3 up a half step. The bent note is the major 3rd of the chord, so the minor box now leans into the major sound. Release into the root.',
    bars: [[[0, 4, 8], [1, 4, 5], [2, 3, 5, 'b', true]], [[0, 0, 5, '~']]] },
  { title: 'Move 3 · Slide from b3 to 3', scale: ['both', 'both'],
    text: 'Slide the b3 up one fret and you land in the major box. The slide crosses the line between the two scales in one move.',
    bars: [[[0, 5, 8], [1, 5, 5], [2, 4, 5], [4, 3, 5, '/'], [5, 3, 6, '', true], [6, 4, 5], [7, 4, 7]], [[0, 5, 5, '~']]] },
  { title: 'Move 4 · Major box lick', scale: ['maj', 'maj'],
    text: 'The same descending shape, one fret lower, in the major box. Same fingers, brighter sound.',
    bars: [[[0, 5, 7], [1, 5, 5], [2, 4, 7], [3, 4, 5], [4, 3, 6], [5, 3, 4], [6, 2, 7], [7, 2, 4]], [[0, 0, 5, '~']]] },
  { title: 'Move 5 · The full switch', scale: ['both', 'maj'],
    text: 'Bar 1 plays minor and slides the b3 into the 3rd. Bar 2 stays in the major box and walks home to the root. Gritty first, sweet second.',
    bars: [[[0, 5, 8], [1, 5, 5], [2, 4, 8], [3, 4, 5], [4, 3, 5, '/'], [5, 3, 6, '', true]], [[0, 5, 7], [1, 5, 5], [2, 4, 7], [3, 4, 5], [4, 3, 6], [5, 3, 4], [6, 2, 7, '~']]] }
];

function exampleShift(R) {
  var minFret = 99;
  EX_A.forEach(function (ex) { ex.bars.forEach(function (b) { b.forEach(function (n) { if (n[2] < minFret) minFret = n[2]; }); }); });
  var sh = mod(R.pc - 9, 12);
  return minFret + sh - 12 >= 1 ? sh - 12 : sh;
}

/* The five examples moved to key R. Returns tab bars in the format fretboard.js tab() expects, plus the scale each bar uses. */
function examples(R) {
  var sh = exampleShift(R), chord = R.n + '7';
  return EX_A.map(function (ex) {
    return {
      title: ex.title, text: ex.text, scales: ex.scale,
      bars: ex.bars.map(function (b) {
        return { chord: chord, notes: b.map(function (n) { return { slot: n[0], p: { s: n[1], f: n[2] + sh }, suffix: n[3] || '', third: !!n[4] }; }) };
      })
    };
  });
}

/* For I7, IV7 and V7 of the key: the chord's 3rd and where each scale does or does not supply it. */
function bluesRows(R) {
  var minSet = {}, majSet = {};
  notes(R, MIN).forEach(function (n) { minSet[n.pc] = n; });
  notes(R, MAJ).forEach(function (n) { majSet[n.pc] = n; });
  return [[0, 0, 'I'], [5, 3, 'IV'], [7, 4, 'V']].map(function (c) {
    var pc = mod(R.pc + c[0], 12), t = mod(pc + 4, 12);
    var below = function (set) { var n = set[mod(t - 1, 12)]; return n ? n.name : null; };
    return {
      numeral: c[2], chord: spell(R.li + c[1], pc) + '7', third: spell(R.li + c[1] + 2, t),
      inMin: !!minSet[t], inMaj: !!majSet[t], minBelow: below(minSet), majBelow: below(majSet)
    };
  });
}

export { MIN, MAJ, notes, baseFret, boxPairs, viewRange, marksFor, oneFretMoves, EX_A, exampleShift, examples, bluesRows };
