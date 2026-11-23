/* Lesson 3: Minor to Major Pentatonic. Interactive page logic. Pentatonic math lives in /assets/js/pentatonic.js. */
import { ROOTS, esc } from '/assets/js/theory.js';
import { notes, MIN, MAJ, boxPairs, viewRange, marksFor, oneFretMoves, examples, bluesRows } from '/assets/js/pentatonic.js';
import { board, tab } from '/assets/js/fretboard.js';

var KEY = 'gtl-pent-3';
var state = { root: 9, view: 'both', pos: 0, labels: 'name' };
try {
  var saved = JSON.parse(localStorage.getItem(KEY));
  if (saved) {
    if (saved.root >= 0 && saved.root < 12) state.root = saved.root | 0;
    if (['both', 'minor', 'major'].indexOf(saved.view) > -1) state.view = saved.view;
    if (saved.labels === 'interval') state.labels = 'interval';
  }
} catch (e) { /* storage unavailable */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ root: state.root, view: state.view, labels: state.labels })); } catch (e) { /* ignore */ } }

function $(id) { return document.getElementById(id); }
function R() { return ROOTS[state.root]; }
function legend(items) {
  return '<div class="legend">' + items.map(function (it) { return '<span><i class="' + it[0] + '"></i>' + it[1] + '</span>'; }).join('') + '</div>';
}
var LEGEND = [['l-R', 'Root'], ['l-3m', 'Minor 3rd (b3)'], ['l-3', 'Major 3rd'], ['l-5', '5th'], ['l-7', 'Minor scale only: 4 and b7'], ['l-T', 'Major scale only: 2 and 6']];
function names(def) { return notes(R(), def).map(function (n) { return n.name; }).join(' '); }

function buildPositions() {
  var pairs = boxPairs(R()), sel = $('posSel');
  if (state.pos >= pairs.length) state.pos = 0;
  sel.innerHTML = pairs.map(function (p, i) {
    return '<option value="' + i + '">Box ' + (p.k + 1) + ' · minor frets ' + p.min.lo + ' to ' + p.min.hi + ', major frets ' + p.maj.lo + ' to ' + p.maj.hi + '</option>';
  }).join('');
  sel.value = String(state.pos);
  return pairs;
}

function renderMap() {
  var r = R(), pairs = buildPositions(), p = pairs[state.pos], rg = viewRange(p, state.view);
  var marks = marksFor(r, p, state.view, state.labels);
  var cap = r.n + ' minor box ' + (p.k + 1) + ' at frets ' + p.min.lo + ' to ' + p.min.hi + '. The ' + r.n + ' major box beside it sits at frets ' + p.maj.lo + ' to ' + p.maj.hi + '.';
  var moves = oneFretMoves(r).map(function (m) {
    return '<tr><td><strong>' + esc(m.from.name) + '</strong> (' + m.from.label + ')</td><td><strong>' + esc(m.to.name) + '</strong> (' + m.to.label + ')</td><td>One fret ' + m.dir + '</td></tr>';
  }).join('');
  $('mapBlock').innerHTML = '<div class="panel"><figure>' +
    board(marks, { lo: rg.lo, hi: rg.hi, aria: r.n + ' minor and major pentatonic, box ' + (p.k + 1) + ', frets ' + rg.lo + ' to ' + rg.hi }) +
    '<figcaption>' + esc(cap) + '</figcaption></figure></div>' + legend(LEGEND) +
    '<div class="tablewrap"><table><thead><tr><th>Scale</th><th>Notes</th><th>Formula</th></tr></thead><tbody>' +
    '<tr><td><strong>' + esc(r.n) + ' minor pentatonic</strong></td><td>' + esc(names(MIN)) + '</td><td>R b3 4 5 b7</td></tr>' +
    '<tr><td><strong>' + esc(r.n) + ' major pentatonic</strong></td><td>' + esc(names(MAJ)) + '</td><td>R 2 3 5 6</td></tr>' +
    '<tr><td><strong>Shared</strong></td><td>' + esc(r.n + ' ' + notes(r, MIN)[3].name) + '</td><td>R 5</td></tr></tbody></table></div>' +
    '<h3>The one-fret swaps in ' + esc(r.n) + '</h3><div class="tablewrap"><table><thead><tr><th>Minor note</th><th>Major note</th><th>Move</th></tr></thead><tbody>' + moves + '</tbody></table></div>';
  $('printLine').textContent = 'Key of ' + r.n + ' · box ' + (p.k + 1);
}

function renderMoves() {
  var r = R();
  $('movesBlock').innerHTML = examples(r).map(function (ex) {
    return '<h3>' + esc(ex.title) + '</h3><p>' + esc(ex.text) + '</p><div class="panel">' + tab(ex.bars) + '</div>';
  }).join('');
}

function renderBlues() {
  var r = R();
  var rows = bluesRows(r).map(function (x) {
    function cell(has, below) { return has ? 'Yes' : below ? 'No. ' + esc(below) + ' sits a fret below it' : 'No'; }
    return '<tr><td><strong>' + x.numeral + '</strong> · ' + esc(x.chord) + '</td><td class="k3">' + esc(x.third) + '</td><td>' + cell(x.inMin, x.minBelow) + '</td><td>' + cell(x.inMaj, x.majBelow) + '</td></tr>';
  }).join('');
  $('bluesBlock').innerHTML = '<div class="tablewrap"><table><thead><tr><th>Chord</th><th>Its 3rd</th><th>In ' + esc(r.n) + ' minor pentatonic?</th><th>In ' + esc(r.n) + ' major pentatonic?</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function render() { renderMap(); renderMoves(); renderBlues(); }

function init() {
  var rs = $('rootSel');
  ROOTS.forEach(function (x, j) { rs.add(new Option(x.n, String(j))); });
  rs.value = String(state.root); $('viewSel').value = state.view; $('labSel').value = state.labels;
  rs.addEventListener('change', function () { state.root = +rs.value; state.pos = 0; save(); render(); });
  $('viewSel').addEventListener('change', function (e) { state.view = e.target.value; save(); renderMap(); });
  $('labSel').addEventListener('change', function (e) { state.labels = e.target.value; save(); renderMap(); });
  $('posSel').addEventListener('change', function (e) { state.pos = +e.target.value; renderMap(); });
  var pb = $('printBtn');
  if (pb) pb.addEventListener('click', function () { window.print(); });
  render();
}

window.GTL = { state: state, render: render, examples: examples, boxPairs: boxPairs };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
