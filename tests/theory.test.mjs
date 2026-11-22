import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChord, parseProgression, computeRoute, cellFrom, positions, OPEN, MIDI, PRESETS, thirdsMarks, ROOTS } from '../src/js/theory.js';

test('chord spelling: the 3rd of each chord', () => {
  const exp = {
    C: ['E', 'major'], Cm: ['Eb', 'minor'], C7: ['E', 'major'], Cmaj7: ['E', 'major'], Cm7: ['Eb', 'minor'], Cm7b5: ['Eb', 'minor'],
    Cdim: ['Eb', 'minor'], Caug: ['E', 'major'], Csus4: [null, null], C5: [null, null], 'F#m': ['A', 'minor'], Bb7: ['D', 'major'],
    Ebm: ['Gb', 'minor'], Abmaj7: ['C', 'major'], E7: ['G#', 'major'], Bbm: ['Db', 'minor'], 'C/E': ['E', 'major'], Cmmaj7: ['Eb', 'minor'],
    Dm7: ['F', 'minor'], G7: ['B', 'major'], Am7: ['C', 'minor'], Em: ['G', 'minor'], D: ['F#', 'major'], A7: ['C#', 'major'], B7: ['D#', 'major'],
    F7: ['A', 'major'], Gsus4: [null, null], Dmaj7: ['F#', 'major'], Fm: ['Ab', 'minor'], 'C7#9': ['E', 'major'], Cm9: ['Eb', 'minor'], C9: ['E', 'major'], Cdim7: ['Eb', 'minor']
  };
  for (const [sym, [name, q]] of Object.entries(exp)) {
    const r = parseChord(sym);
    assert.ok(r.chord, `${sym} should parse`);
    assert.deepEqual([r.chord.third ? r.chord.third.name : null, r.chord.thirdQ], [name, q], sym);
  }
});

test('invalid chords return an error', () => {
  for (const s of ['H7', 'Xyz', 'C7zz', 'Cfoo']) assert.ok(parseChord(s).err, s);
});

test('major to minor on the same root drops the 3rd one fret', () => {
  const a = parseChord('C').chord.third.pc, b = parseChord('Cm').chord.third.pc;
  assert.equal((a - b + 12) % 12, 1);
});

const SCALE = { maj: [0, 2, 4, 5, 7, 9, 11], maj7: [0, 2, 4, 5, 7, 9, 11], dom7: [0, 2, 4, 5, 7, 9, 10], min: [0, 2, 3, 5, 7, 9, 10], min7: [0, 2, 3, 5, 7, 9, 10], minmaj7: [0, 2, 3, 5, 7, 9, 11], m7b5: [0, 1, 3, 5, 6, 8, 10] };
const DEGREES = [2, 1, 0, 6, 5, 4];

test('routes and descending cells stay in the window and on the right notes for every window', () => {
  const texts = PRESETS.map((p) => p.text).concat(['Csus4 C Gm7b5 Cdim Eaug F#m B7 E', 'C', 'C C C', 'Bb7 Eb7 F7 Bb7', 'F#m7 B7 Emaj7 C#m7', 'Dbm Gb Abm B']);
  for (const t of texts) {
    for (let lo = 1; lo <= 12; lo++) {
      const hi = lo + 10, P = parseProgression(t), route = computeRoute(P.changes, lo, hi);
      P.changes.forEach((c, i) => {
        const ch = c.chord, r = route[i], where = `${t} window ${lo} ${ch.sym}`;
        if (!ch.third) { assert.equal(r, null, where); return; }
        assert.ok(r, `no route: ${where}`);
        assert.ok(r.f >= lo && r.f <= hi, `route outside window: ${where}`);
        assert.equal((OPEN[r.s] + r.f) % 12, ch.third.pc, `route pitch class: ${where}`);
        const cell = cellFrom(ch, r, lo, hi);
        if (!cell) return;
        cell.notes.forEach((p, j) => {
          assert.ok(p.f >= lo && p.f <= hi, `cell outside window: ${where}`);
          assert.equal((OPEN[p.s] + p.f) % 12, (ch.pc + SCALE[ch.kind][DEGREES[j]]) % 12, `cell pitch class: ${where} note ${j}`);
          if (j > 0) assert.ok(MIDI[p.s] + p.f < MIDI[cell.notes[j - 1].s] + cell.notes[j - 1].f, `cell not descending: ${where}`);
        });
      });
    }
  }
});

test('progression parsing marks changes only when the chord changes', () => {
  const P = parseProgression('C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7');
  assert.equal(P.bars.length, 12);
  assert.equal(P.changes.length, 7);
});

test('thirdsMarks returns the root and both 3rds', () => {
  const t = thirdsMarks(ROOTS[0], 8, 18, false);
  assert.equal(t.majName, 'E');
  assert.equal(t.minName, 'Eb');
  assert.ok(t.marks.some((m) => m.cls === 'R') && t.marks.some((m) => m.cls === '3M') && t.marks.some((m) => m.cls === '3m'));
  assert.ok(thirdsMarks(ROOTS[0], 8, 18, true).marks.every((m) => m.cls === 'R'));
  assert.ok(positions(4, 8, 18).length >= 4);
});
