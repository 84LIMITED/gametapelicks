import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOTS, OPEN, mod, positions } from '../src/js/theory.js';
import { MIN, MAJ, notes, boxPairs, viewRange, marksFor, oneFretMoves, examples, bluesRows } from '../src/js/pentatonic.js';

const pcs = (R, def) => new Set(notes(R, def).map((n) => n.pc));

test('every box window holds each scale note exactly twice per string, in every key', () => {
  for (const R of ROOTS) {
    for (const p of boxPairs(R)) {
      for (const [win, def] of [[p.min, MIN], [p.maj, MAJ]]) {
        const set = pcs(R, def);
        let count = 0;
        for (let s = 0; s < 6; s++) {
          let per = 0;
          for (let f = win.lo; f <= win.hi; f++) if (set.has((OPEN[s] + f) % 12)) per++;
          assert.equal(per, 2, `${R.n} box ${p.k} string ${s}`);
          count += per;
        }
        assert.equal(count, 12);
      }
    }
  }
});

test('each key keeps at least three box pairs on the neck and the major box sits within two frets of the minor box', () => {
  for (const R of ROOTS) {
    const pairs = boxPairs(R);
    assert.ok(pairs.length >= 3, `${R.n} has ${pairs.length} pairs`);
    pairs.forEach((p) => {
      assert.ok(p.maj.lo >= 0 && p.min.hi <= 22, R.n);
      assert.ok(Math.abs((p.min.lo + p.min.hi) / 2 - (p.maj.lo + p.maj.hi) / 2) <= 1.5, `${R.n} box ${p.k}`);
    });
  }
});

test('A minor and A major pentatonic notes, and the relative minor link', () => {
  const A = ROOTS.find((r) => r.n === 'A');
  assert.deepEqual(notes(A, MIN).map((n) => n.name), ['A', 'C', 'D', 'E', 'G']);
  assert.deepEqual(notes(A, MAJ).map((n) => n.name), ['A', 'B', 'C#', 'E', 'F#']);
  const Fs = ROOTS.find((r) => r.n === 'F#');
  assert.deepEqual([...pcs(A, MAJ)].sort((a, b) => a - b), [...pcs(Fs, MIN)].sort((a, b) => a - b));
  const pair = boxPairs(A)[0];
  assert.deepEqual([pair.min, pair.maj], [{ lo: 5, hi: 8 }, { lo: 4, hi: 7 }]);
});

test('one-fret moves are all one fret: b3 to 3 up, 4 to 3 down, b7 to 6 down', () => {
  for (const R of ROOTS) {
    const m = oneFretMoves(R);
    assert.deepEqual(m.map((x) => x.dir), ['up', 'down', 'down']);
    m.forEach((x) => assert.equal(Math.min(mod(x.to.pc - x.from.pc, 12), mod(x.from.pc - x.to.pc, 12)), 1, R.n));
  }
  const A = ROOTS.find((r) => r.n === 'A');
  assert.deepEqual(oneFretMoves(A).map((x) => x.from.name + x.to.name), ['CC#', 'DC#', 'GF#']);
});

test('marks stay inside the box windows and view filters work', () => {
  for (const R of ROOTS) {
    const p = boxPairs(R)[0];
    const both = marksFor(R, p, 'both', 'name'), min = marksFor(R, p, 'minor', 'name'), maj = marksFor(R, p, 'major', 'interval');
    assert.ok(both.length >= min.length && both.length >= maj.length);
    min.forEach((k) => assert.ok(k.f >= p.min.lo && k.f <= p.min.hi));
    maj.forEach((k) => assert.ok(k.f >= p.maj.lo && k.f <= p.maj.hi));
    assert.ok(maj.some((k) => k.label === '3') && min.some((k) => k.label !== '3'));
    const r = viewRange(p, 'both');
    both.forEach((k) => assert.ok(k.f >= r.lo && k.f <= r.hi));
  }
});

test('tab examples use only notes from the right scale in every key, and stay on the neck', () => {
  for (const R of ROOTS) {
    const mn = pcs(R, MIN), mj = pcs(R, MAJ), both = new Set([...mn, ...mj]);
    examples(R).forEach((ex) => {
      assert.equal(ex.bars.length, 2);
      ex.bars.forEach((b, i) => {
        const allowed = { min: mn, maj: mj, both }[ex.scales[i]];
        b.notes.forEach((n) => {
          assert.ok(n.p.f >= 0 && n.p.f <= 22, `${R.n} ${ex.title} fret ${n.p.f}`);
          assert.ok(allowed.has((OPEN[n.p.s] + n.p.f) % 12), `${R.n} ${ex.title} note on string ${n.p.s} fret ${n.p.f}`);
          assert.ok(n.slot >= 0 && n.slot <= 7);
        });
      });
    });
  }
});

test('flagged 3rd notes in the examples are major 3rds, or the b3 that bends into one', () => {
  for (const R of ROOTS) {
    const maj3 = mod(R.pc + 4, 12), min3 = mod(R.pc + 3, 12);
    examples(R).forEach((ex) => ex.bars.forEach((b) => b.notes.filter((n) => n.third).forEach((n) => {
      const pc = (OPEN[n.p.s] + n.p.f) % 12;
      assert.ok(pc === maj3 || (pc === min3 && n.suffix === 'b'), `${R.n} ${ex.title}`);
    })));
  }
});

test('blues rows: A7 has its 3rd in A major pentatonic, E7 does not', () => {
  const A = ROOTS.find((r) => r.n === 'A');
  const rows = bluesRows(A);
  assert.deepEqual(rows.map((r) => [r.chord, r.third, r.inMin, r.inMaj]), [['A7', 'C#', false, true], ['D7', 'F#', false, true], ['E7', 'G#', false, false]]);
  assert.equal(rows[0].minBelow, 'C');
  assert.equal(rows[2].minBelow, 'G');
});
