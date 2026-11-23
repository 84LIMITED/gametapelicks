/* Lesson 1: Hunting for 3rds. Interactive page logic. Theory lives in /assets/js/theory.js and diagrams in /assets/js/fretboard.js. */
import {
  ROOTS, DEFAULT, PRESETS, OPEN, MIDI, STRNAME, STRLET, SCALES, MOTION, mod, spell, parseChord, parseProgression,
  positions, dist, esc, plural, spotText, signed, computeRoute, moveText, lw, stepWord, cellFrom, neighborPitch, thirdsMarks
} from '/assets/js/theory.js';
import { board, tab } from '/assets/js/fretboard.js';

/* ---------- state ---------- */
var KEY = 'gtl-hunt-1';
var state = { text: DEFAULT, start: 8, root: 0, hide: false, title: '', sel: 0 };
try {
  var saved = JSON.parse(localStorage.getItem(KEY));
  if (saved && typeof saved.text === 'string') {
    state.text = saved.text.slice(0, 400);
    if (saved.start >= 1 && saved.start <= 12) state.start = saved.start | 0;
    if (saved.root >= 0 && saved.root < 12) state.root = saved.root | 0;
    state.title = String(saved.title || '').slice(0, 60);
  }
} catch (e) { /* storage unavailable */ }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ text: state.text, start: state.start, root: state.root, title: state.title })); } catch (e) { /* ignore */ }
}

var P = null, ROUTE = null;
function $(id) { return document.getElementById(id); }
function lo() { return state.start; }
function hi() { return state.start + 10; }
function qLabel(c) { return c.thirdQ === 'major' ? 'major 3rd' : 'minor 3rd'; }
function emptyMsg() { return '<p class="note">Add at least one valid chord above to see this section.</p>'; }
function legend(items) {
  return '<div class="legend">' + items.map(function (it) { return '<span><i class="' + it[0] + '"></i>' + it[1] + '</span>'; }).join('') + '</div>';
}

/* ---------- renderers ---------- */
function renderShowcase() {
  var R = ROOTS[state.root], L = lo(), H = hi();
  var tm = thirdsMarks(R, L, H, state.hide), marks = tm.marks, majName = tm.majName, minName = tm.minName;
  $('showBoard').innerHTML = board(marks, { lo: L, hi: H, aria: 'Roots, major 3rds and minor 3rds of ' + R.n + ' from fret ' + L + ' to ' + H });
  $('showCaption').textContent = 'Root ' + R.n + ': the major 3rd is ' + majName + ' and the minor 3rd is ' + minName + '. Frets ' + L + ' to ' + H + '.' +
    (state.hide ? ' 3rds are hidden. Find them, then clear the box.' : '');
}

function renderNeighbors() {
  var h = '<thead><tr><th>Root on the</th><th>Same string</th><th>One string higher</th></tr></thead><tbody>';
  function rel(d) { return d === 0 ? 'same fret' : d > 0 ? plural(d, 'fret') + ' higher' : plural(-d, 'fret') + ' lower'; }
  for (var s = 5; s >= 0; s--) {
    var gap = s < 5 ? mod(OPEN[s + 1] - OPEN[s], 12) : null;
    var up = gap === null ? 'No string above' : 'Major: ' + rel(4 - gap) + '<br>Minor: ' + rel(3 - gap);
    h += '<tr><td><strong>' + STRNAME[s] + ' string</strong></td><td>Major: 4 frets higher<br>Minor: 3 frets higher</td><td>' + up + '</td></tr>';
  }
  $('nbrTable').innerHTML = h + '</tbody>';
}

function renderBars() {
  var h = '';
  P.bars.forEach(function (b) {
    if (!b.chord) {
      h += '<div class="bar bad"><small>' + (b.idx + 1) + '</small><strong>' + esc(b.tok) + '</strong><span class="err">Check spelling</span></div>';
      return;
    }
    var c = b.chord, cls = 'bar' + (b.isChange ? ' change' : ' hold') + (b.cidx === state.sel ? ' sel' : '');
    var third = c.third ? '<span>' + esc(c.third.name) + '</span><small>' + (c.thirdQ === 'major' ? 'major 3rd' : 'minor 3rd') + '</small>' : '<span class="none">no 3rd</span>';
    h += '<button type="button" class="' + cls + '" data-c="' + b.cidx + '" aria-pressed="' + (b.cidx === state.sel) + '"><small>' + (b.idx + 1) + '</small><strong>' + esc(c.sym) + '</strong>' + third + '</button>';
  });
  $('barGrid').innerHTML = h;
  var maj = 0, min = 0, none = 0;
  P.changes.forEach(function (c) { if (!c.chord.third) none++; else if (c.chord.thirdQ === 'major') maj++; else min++; });
  var bad = P.bars.filter(function (b) { return !b.chord; }).length;
  $('chordErr').textContent = bad ? P.bars.filter(function (b) { return b.err; })[0].err : '';
  $('progSummary').textContent = P.changes.length ?
    plural(P.bars.length - bad, 'bar') + ', ' + plural(P.changes.length, 'chord change') + ': ' + plural(maj, 'major 3rd') + ', ' + plural(min, 'minor 3rd') + (none ? ', ' + plural(none, 'chord') + ' without a 3rd' : '') + '. Blue edges mark the changes.' : '';
}

function renderMap() {
  if (!P.changes.length) { $('mapBlock').innerHTML = emptyMsg(); return; }
  var L = lo(), H = hi(), seen = {}, marks = [], rows = '', seenSym = {};
  P.changes.forEach(function (c) {
    var t = c.chord.third;
    if (!t) return;
    var key = t.pc + t.cls;
    if (!seen[key]) {
      seen[key] = 1;
      if (!state.hide) positions(t.pc, L, H).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: t.cls, label: t.name }); });
    }
  });
  P.changes.forEach(function (c) {
    if (seenSym[c.chord.sym]) return;
    seenSym[c.chord.sym] = 1;
    var t = c.chord.third;
    rows += '<tr><td><strong>' + esc(c.chord.sym) + '</strong></td>' +
      (t ? '<td class="k3">' + esc(t.name) + '</td><td>' + qLabel(c.chord) + '</td><td>' + (state.hide ? 'Hidden' : positions(t.pc, L, H).sort(function (a, b) { return a.s - b.s || a.f - b.f; }).map(function (p) { return STRLET[p.s] + ' ' + p.f; }).join(', ')) + '</td>'
        : '<td>none</td><td>Sus or power chord</td><td>Hold the last 3rd</td>') + '</tr>';
  });
  $('mapBlock').innerHTML = '<div class="panel"><figure>' + board(marks, { lo: L, hi: H, aria: 'Every 3rd of the progression from fret ' + L + ' to ' + H }) +
    '<figcaption>Every 3rd in your progression, frets ' + L + ' to ' + H + '. Low E string at the bottom.</figcaption></figure></div>' +
    legend([['l-3', 'Major 3rd (filled)'], ['l-3m', 'Minor 3rd (ring)']]) +
    '<div class="tablewrap"><table><thead><tr><th>Chord</th><th>3rd</th><th>Quality</th><th>Spots (string and fret)</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function renderRoute() {
  if (!P.changes.length) { $('routeBlock').innerHTML = emptyMsg(); return; }
  var L = lo(), H = hi(), marks = [], path = [], rows = '', used = {}, last = null;
  P.changes.forEach(function (c, i) {
    var p = ROUTE[i], t = c.chord.third;
    if (!p) {
      rows += '<tr><td>' + (i + 1) + '</td><td>' + (c.bar + 1) + '</td><td><strong>' + esc(c.chord.sym) + '</strong></td><td>none</td><td colspan="2">No 3rd in this chord. Hold the last 3rd.</td></tr>';
      return;
    }
    path.push(p);
    var key = p.s + '_' + p.f;
    if (!used[key]) { used[key] = 1; marks.push({ s: p.s, f: p.f, cls: t.cls, label: String(i + 1) }); }
    rows += '<tr><td>' + (i + 1) + '</td><td>' + (c.bar + 1) + '</td><td><strong>' + esc(c.chord.sym) + '</strong></td><td><span class="k3">' + esc(t.name) + '</span> ' + (c.chord.thirdQ === 'major' ? 'major' : 'minor') +
      '</td><td>' + spotText(p) + '</td><td>' + moveText(last, p) + '</td></tr>';
    last = p;
  });
  var frets = {}, travel = 0, sw = 0;
  path.forEach(function (p, i) { frets[p.f] = 1; if (i) { travel += Math.abs(p.f - path[i - 1].f); sw += Math.abs(p.s - path[i - 1].s); } });
  var fk = Object.keys(frets);
  var insight = path.length < 2 ? '' : fk.length === 1 ?
    '<p class="callout">Every 3rd on this route sits on fret ' + fk[0] + '. Each change is a move across the strings at one fret, so the whole progression fits under one hand position.</p>' :
    '<p class="note">Total movement along this route: ' + plural(travel, 'fret') + ' and ' + plural(sw, 'string') + '.</p>';
  $('routeBlock').innerHTML = '<div class="panel"><figure>' + board(marks, { lo: L, hi: H, path: path, aria: 'Route of 3rds through the progression' }) +
    '<figcaption>The numbers are the changes in order. A filled circle is a major 3rd and a ring is a minor 3rd.</figcaption></figure></div>' +
    '<div class="tablewrap"><table><thead><tr><th>#</th><th>Bar</th><th>Chord</th><th>3rd</th><th>Play at</th><th>Move from the last 3rd</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + insight;
}

function prevOf(k) {
  var n = P.changes.length;
  return n > 1 ? P.changes[mod(k - 1, n)] : null;
}

function renderChips() {
  $('chips').innerHTML = P.changes.map(function (c, i) {
    return '<button type="button" class="chip" data-c="' + i + '" aria-pressed="' + (i === state.sel) + '">Bar ' + (c.bar + 1) + ' · ' + esc(c.chord.sym) + '</button>';
  }).join('');
}

function renderInspector() {
  if (!P.changes.length) { $('inspBlock').innerHTML = emptyMsg(); return; }
  var k = state.sel, cur = P.changes[k], pv = prevOf(k), L = lo(), H = hi(), marks = [], items = [], c = cur.chord;
  var route = ROUTE[k];
  if (pv) {
    pv.chord.tones.forEach(function (t) {
      positions(t.pc, L, H).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: '7', label: t.name }); });
    });
  } else {
    c.tones.filter(function (t) { return t.cls === 'R'; }).forEach(function (t) {
      positions(t.pc, L, H).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: 'R', label: t.name }); });
    });
  }
  if (c.third) {
    positions(c.third.pc, L, H).forEach(function (p) {
      var isRoute = route && route.s === p.s && route.f === p.f;
      marks.push({ s: p.s, f: p.f, cls: c.third.cls, label: c.third.name, ring: isRoute });
    });
  }
  var title = pv ? esc(pv.chord.sym) + ' to ' + esc(c.sym) : esc(c.sym);
  if (pv) {
    var pr = pv.chord, rm = mod(c.pc - pr.pc, 12);
    items.push('The root moves ' + MOTION[rm] + (pr.root === c.root ? '.' : ' (' + pr.root + ' to ' + c.root + ').'));
    if (pr.third && c.third) {
      var d3 = signed(c.third.pc - pr.third.pc);
      if (pr.pc === c.pc && pr.thirdQ !== c.thirdQ) {
        items.push('Same root, so only the 3rd changes. ' + (c.thirdQ === 'minor' ? 'Major to minor lowers the 3rd one fret' : 'Minor to major raises the 3rd one fret') + ': ' + pr.third.name + ' to ' + c.third.name + '.');
      } else if (d3 === 0) {
        items.push('The 3rd stays on ' + c.third.name + '. Hold it across the bar line.');
      } else {
        items.push('The 3rd moves from ' + pr.third.name + ' (' + pr.thirdQ + ') to ' + c.third.name + ' (' + c.thirdQ + '), ' + stepWord(Math.abs(d3)) + ' ' + (d3 > 0 ? 'up' : 'down') + '.');
      }
      if (pr.thirdQ === c.thirdQ && pr.pc !== c.pc) {
        items.push('Both chords have a ' + c.thirdQ + ' 3rd, so the 3rd moves by the same amount as the root.');
      }
    }
    if (c.third) {
      var ap = [];
      pr.tones.forEach(function (t) {
        var d = signed(c.third.pc - t.pc);
        if (d === 0) ap.push(t.name + ' (the ' + lw(t.label) + ' of ' + pr.sym + ') is also the new 3rd. Hold it across the change.');
        else if (Math.abs(d) <= 2) ap.push(t.name + ' (the ' + lw(t.label) + ' of ' + pr.sym + ') ' + (d > 0 ? 'rises ' : 'falls ') + stepWord(Math.abs(d)) + ' to the new 3rd, ' + plural(Math.abs(d), 'fret') + ' ' + (d > 0 ? 'below' : 'above') + ' it on the same string.');
      });
      if (ap.length) items.push('<strong>Approach tones from the old chord:</strong><ul class="plain">' + ap.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>');
      else items.push('No tone of ' + pr.sym + ' sits within a whole step of the new 3rd. Use the enclosure in the drills.');
    }
    var common = pr.tones.filter(function (t) { return c.tones.some(function (u) { return u.pc === t.pc; }); }).map(function (t) { return t.name; });
    items.push(common.length ? 'Tones the two chords share: ' + common.join(', ') + '.' : 'The two chords share no tones.');
  } else {
    items.push('One chord. Add another to see the approach tones.');
  }
  if (c.third) {
    items.push('<strong>Play it at:</strong> ' + spotText(route) + '. ' + (c.thirdQ === 'major' ? 'This is a major 3rd.' : 'This is a minor 3rd.'));
  } else {
    items.push('<strong>No 3rd in ' + esc(c.sym) + '.</strong> Hold the last 3rd you played, or wait for the chord to resolve and land on the 3rd there.');
  }
  $('inspBlock').innerHTML = '<h3>' + title + '</h3><div class="panel"><figure>' +
    board(marks, { lo: L, hi: H, aria: 'Old chord tones and the new 3rd for ' + (pv ? pv.chord.sym + ' to ' : '') + c.sym }) + '</figure></div>' +
    legend([['l-7', 'Tone of the old chord'], ['l-3', 'New major 3rd'], ['l-3m', 'New minor 3rd'], ['l-ring', 'Spot on the route']]) +
    '<ul class="plain insp">' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
}


function renderDrill() {
  if (!P.changes.length) { $('drillBlock').innerHTML = emptyMsg(); return; }
  var k = state.sel, cur = P.changes[k], c = cur.chord, pv = prevOf(k), L = lo(), H = hi(), p0 = ROUTE[k], h = '';
  if (!c.third || !p0) {
    $('drillBlock').innerHTML = '<p>' + esc(c.sym) + ' has no 3rd, so there is no 3rd to hunt here. Select a chord with a 3rd in the inspector.</p>';
    return;
  }
  h += '<h3>Drill 1 · The descending cell over ' + esc(c.sym) + '</h3>';
  var sc = SCALES[c.kind];
  if (sc) {
    var tries = [p0].concat(positions(c.third.pc, L, H).filter(function (p) { return !(p.s === p0.s && p.f === p0.f); }).sort(function (a, b) { return dist(a, p0) - dist(b, p0); }));
    var res = null, start = null;
    for (var i = 0; i < tries.length; i++) {
      var r = cellFrom(c, tries[i], L, H);
      if (r && r.complete) { res = r; start = tries[i]; break; }
      if (!res) { res = r; start = tries[i]; }
    }
    var degIdx = [2, 1, 0, 6, 5, 4];
    var names = res.notes.map(function (p, j) { return spell(c.li + degIdx[j], (OPEN[p.s] + p.f) % 12); });
    var notes = res.notes.map(function (p, j) { return { slot: j, p: p, third: j === 0 }; });
    h += '<p>Start on the 3rd at beat 1, then walk down the ' + esc(c.root) + ' ' + sc.n + ' scale: <strong>' + names.join(' ') + '</strong>. Repeat the same degrees on every chord and let the frets change.</p>';
    if (start.s !== p0.s || start.f !== p0.f) h += '<p class="note">This line starts at the ' + esc(spotText(start)) + ' because it needs room below the route spot.</p>';
    if (!res.complete) h += '<p class="note">The window ends before the line finishes. Slide the window down a few frets to play the whole cell.</p>';
    h += '<div class="panel">' + tab([{ chord: c.sym, notes: notes }]) + '</div>';
  } else {
    h += '<p>' + esc(c.sym) + ' is a ' + (c.kind === 'aug' ? 'augmented' : 'diminished') + ' chord with no standard parent scale in this lesson. Use the enclosure below to land on its 3rd.</p>';
  }
  h += '<h3>Drill 2 · The enclosure into the 3rd</h3>';
  var up = neighborPitch(p0, 1, L, H), dn = neighborPitch(p0, -1, L, H);
  if (up && dn) {
    var lead = pv ? pv.chord.sym : c.sym;
    h += '<p>On beat 4 play the note a half step above the 3rd. On the "and" of 4 play the note a half step below it. Land on the 3rd at beat 1 of ' + esc(c.sym) + ' and hold it with vibrato.</p>';
    h += '<div class="panel">' + tab([
      { chord: lead, notes: [{ slot: 6, p: up }, { slot: 7, p: dn }] },
      { chord: c.sym, notes: [{ slot: 0, p: p0, third: true, suffix: '~' }] }
    ]) + '</div>';
  } else {
    h += '<p class="note">The window has no room for both neighbor notes around this 3rd. Move the window and try again.</p>';
  }
  h += '<h3>Drill 3 · The bend into the 3rd</h3>';
  var bd = c.thirdQ === 'major' ? 2 : 1;
  var bp = positions(c.third.pc, L, H).filter(function (p) { return p.f - bd >= L; }).sort(function (a, b) { return dist(a, p0) - dist(b, p0); })[0];
  if (bp) {
    h += '<p>Fret the 2nd of the chord, ' + (c.thirdQ === 'major' ? 'a whole step (2 frets)' : 'a half step (1 fret)') + ' below the 3rd, on the ' + esc(STRNAME[bp.s]) + ' string at fret ' + (bp.f - bd) +
      ' (' + esc(spell(c.li + 1, mod(c.third.pc - bd, 12))) + '). Bend up to the pitch of fret ' + bp.f + ' (' + esc(c.third.name) + ') and hold it on beat 1. ' +
      (c.thirdQ === 'minor' ? 'For the bluesy sound, bend one more half step so the minor 3rd leans toward the major 3rd (' + esc(spell(c.li + 2, mod(c.third.pc + 1, 12))) + ').' : 'Release the bend slowly and let the note settle back on the 2nd.') + '</p>';
  } else {
    h += '<p class="note">Move the window up a few frets to leave room below the 3rd for the bend.</p>';
  }
  $('drillBlock').innerHTML = h;
}

function renderPrintLine() {
  var wide = 'Frets ' + lo() + ' to ' + hi();
  $('printLine').textContent = (state.title ? state.title + ' · ' : '') + 'Progression: ' + P.bars.map(function (b) { return b.chord ? b.chord.sym : b.tok; }).join(' ') + ' · ' + wide;
}

function render() {
  P = parseProgression(state.text);
  if (state.sel >= P.changes.length) state.sel = 0;
  ROUTE = computeRoute(P.changes, lo(), hi());
  renderShowcase();
  renderBars();
  renderMap();
  renderRoute();
  renderChips();
  renderInspector();
  renderDrill();
  renderPrintLine();
  var idx = PRESETS.findIndex(function (p) { return p.text === state.text.trim().replace(/\s+/g, ' '); });
  $('presetSel').value = idx >= 0 ? String(idx) : 'custom';
}

function select(i) { state.sel = i; renderBars(); renderChips(); renderInspector(); renderDrill(); }

/* ---------- init ---------- */
function init() {
  var rs = $('rootSel'), ws = $('winSel'), ps = $('presetSel'), i;
  ROOTS.forEach(function (r, j) { rs.add(new Option(r.n, String(j))); });
  for (i = 1; i <= 12; i++) ws.add(new Option('Frets ' + i + ' to ' + (i + 10), String(i)));
  PRESETS.forEach(function (p, j) { ps.add(new Option(p.name, String(j))); });
  ps.add(new Option('Custom', 'custom'));
  rs.value = String(state.root); ws.value = String(state.start);
  $('chordsIn').value = state.text; $('titleIn').value = state.title; $('hideChk').checked = state.hide;
  renderNeighbors();

  rs.addEventListener('change', function () { state.root = +rs.value; save(); renderShowcase(); });
  ws.addEventListener('change', function () { state.start = +ws.value; save(); render(); });
  $('hideChk').addEventListener('change', function (e) { state.hide = e.target.checked; renderShowcase(); renderMap(); });
  ps.addEventListener('change', function () {
    if (ps.value === 'custom') return;
    state.text = PRESETS[+ps.value].text; state.sel = 0; $('chordsIn').value = state.text; save(); render();
  });
  $('chordsIn').addEventListener('input', function (e) { state.text = e.target.value.slice(0, 400); save(); render(); });
  $('titleIn').addEventListener('input', function (e) { state.title = e.target.value; save(); renderPrintLine(); });
  $('barGrid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-c]');
    if (b) select(+b.getAttribute('data-c'));
  });
  $('chips').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-c]');
    if (b) select(+b.getAttribute('data-c'));
  });
  $('printBtn').addEventListener('click', function () { window.print(); });
  render();
}

window.GTL = { parseChord: parseChord, parseProgression: parseProgression, positions: positions, computeRoute: computeRoute, cellFrom: cellFrom, spell: spell, OPEN: OPEN, MIDI: MIDI, state: state, render: render };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
