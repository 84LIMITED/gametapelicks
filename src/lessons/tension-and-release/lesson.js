/* Lesson 2: Tension and Release. Interactive page logic. Theory lives in /assets/js/theory.js and diagrams in /assets/js/fretboard.js. */
import {
  DEFAULT, PRESETS, mod, spell, parseChord, parseProgression, positions, pitch, dist, esc, plural, spotText,
  computeRoute, moveText, stepWord, neighborPitch, tensionMap, tensionMarks, LEVEL_NAME
} from '/assets/js/theory.js';
import { board, tab } from '/assets/js/fretboard.js';

/* ---------- state ---------- */
var KEY = 'gtl-tension-2';
var state = { text: DEFAULT, start: 8, hide: false, labels: 'name', title: '', sel: 0, ten: null };
try {
  var saved = JSON.parse(localStorage.getItem(KEY));
  if (saved && typeof saved.text === 'string') {
    state.text = saved.text.slice(0, 400);
    if (saved.start >= 1 && saved.start <= 12) state.start = saved.start | 0;
    if (saved.labels === 'interval') state.labels = 'interval';
    state.title = String(saved.title || '').slice(0, 60);
  }
} catch (e) { /* storage unavailable */ }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ text: state.text, start: state.start, labels: state.labels, title: state.title })); } catch (e) { /* ignore */ }
}

var P = null, ROUTE = null;
function $(id) { return document.getElementById(id); }
function lo() { return state.start; }
function hi() { return state.start + 10; }
function emptyMsg() { return '<p class="note">Add at least one valid chord above to see this section.</p>'; }
function legend(items) {
  return '<div class="legend">' + items.map(function (it) { return '<span><i class="' + it[0] + '"></i>' + it[1] + '</span>'; }).join('') + '</div>';
}
var MAP_LEGEND = [['l-R', 'Root'], ['l-3', 'Major 3rd'], ['l-3m', 'Minor 3rd'], ['l-5', '5th'], ['l-7', 'Color'], ['l-T', 'Tension'], ['l-X', 'Outside']];
function dirWord(d) { return (d > 0 ? 'up ' : 'down ') + stepWord(Math.abs(d)); }
function resolveText(it) {
  return it.resolves.map(function (r) { return dirWord(r.d) + ' to ' + r.name; }).join(' or ');
}
function selChord() { return P.changes[state.sel].chord; }
function homeNames(m) { return m.items.filter(function (i) { return i.level === 'home'; }); }
function thirdItem(m) { return m.items.filter(function (i) { return i.level === 'home' && (i.cls === '3M' || i.cls === '3m'); })[0] || null; }

/* ---------- renderers ---------- */
function renderBars() {
  var h = '';
  P.bars.forEach(function (b) {
    if (!b.chord) {
      h += '<div class="bar bad"><small>' + (b.idx + 1) + '</small><strong>' + esc(b.tok) + '</strong><span class="err">Check spelling</span></div>';
      return;
    }
    var c = b.chord, cls = 'bar' + (b.isChange ? ' change' : ' hold') + (b.cidx === state.sel ? ' sel' : '');
    var names = homeNames(tensionMap(c)).map(function (i) { return i.name; }).join(' ');
    h += '<button type="button" class="' + cls + '" data-c="' + b.cidx + '" aria-pressed="' + (b.cidx === state.sel) + '"><small>' + (b.idx + 1) + '</small><strong>' + esc(c.sym) + '</strong><span>' + esc(names) + '</span><small>release notes</small></button>';
  });
  $('barGrid').innerHTML = h;
  var bad = P.bars.filter(function (b) { return !b.chord; }).length;
  $('chordErr').textContent = bad ? P.bars.filter(function (b) { return b.err; })[0].err : '';
  $('progSummary').textContent = P.changes.length ? plural(P.bars.length - bad, 'bar') + ', ' + plural(P.changes.length, 'chord change') + '. Blue edges mark the changes. The selected chord drives the sections below.' : '';
}

function renderChips() {
  $('chips').innerHTML = P.changes.map(function (c, i) {
    return '<button type="button" class="chip" data-c="' + i + '" aria-pressed="' + (i === state.sel) + '">Bar ' + (c.bar + 1) + ' · ' + esc(c.chord.sym) + '</button>';
  }).join('');
}

function renderMap() {
  if (!P.changes.length) { $('mapBlock').innerHTML = emptyMsg(); return; }
  var c = selChord(), m = tensionMap(c), L = lo(), H = hi();
  var marks = tensionMarks(m, L, H, { labels: state.labels, onlyHome: state.hide });
  var rel = homeNames(m).map(function (i) { return i.name; }).join(', ');
  var rows = m.items.map(function (it) {
    var go = it.level === 'home' ? 'At rest. Land here.' : 'Moves ' + resolveText(it) + '.' + (it.blue ? ' ' + it.blue : '');
    return '<tr class="lv-' + it.level + '"><td><strong>' + esc(it.name) + '</strong></td><td>' + esc(it.word) + '</td><td>' + LEVEL_NAME[it.level] + '</td><td>' + esc(go) + '</td></tr>';
  }).join('');
  $('mapBlock').innerHTML = '<h3>' + esc(c.sym) + (m.scaleName ? ' · ' + esc(m.scaleName) : '') + '</h3><div class="panel"><figure>' +
    board(marks, { lo: L, hi: H, aria: 'Tension map for ' + c.sym + ' from fret ' + L + ' to ' + H }) +
    '<figcaption>' + esc(c.sym) + ' on frets ' + L + ' to ' + H + '. Release notes: ' + esc(rel) + '.' + (state.hide ? ' Only the release notes are showing.' : '') + '</figcaption></figure></div>' +
    legend(MAP_LEGEND) +
    '<div class="tablewrap"><table><thead><tr><th>Note</th><th>Interval</th><th>Level</th><th>Where it wants to go</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* Best spot pair for a tension note and one of its resolutions: the pitch step matches, the hand moves little. */
function bestPair(it, target, L, H) {
  var qs = positions(it.pc, L, H), ps = positions(target.pc, L, H), best = null, bc = Infinity, mid = (L + H) / 2;
  qs.forEach(function (q) {
    ps.forEach(function (p) {
      var pen = (pitch(p) - pitch(q) === target.d ? 0 : 100) + dist(p, q) + 0.08 * Math.abs(q.f - mid);
      if (pen < bc) { bc = pen; best = { q: q, p: p }; }
    });
  });
  return best;
}

function renderPull() {
  if (!P.changes.length) { $('tenSel').innerHTML = ''; $('pullBlock').innerHTML = emptyMsg(); return; }
  var c = selChord(), m = tensionMap(c), L = lo(), H = hi();
  var cands = m.items.filter(function (i) { return i.level !== 'home'; });
  if (!cands.some(function (i) { return i.pc === state.ten; })) {
    var pref = cands.filter(function (i) { return i.level === 'tense'; })[0] || cands.filter(function (i) { return i.level === 'outside'; })[0] || cands[0];
    state.ten = pref ? pref.pc : null;
  }
  $('tenSel').innerHTML = cands.map(function (i) {
    return '<option value="' + i.pc + '"' + (i.pc === state.ten ? ' selected' : '') + '>' + esc(i.name) + ' · ' + esc(i.word) + ' · ' + LEVEL_NAME[i.level].toLowerCase() + '</option>';
  }).join('');
  var it = m.byPc[state.ten];
  if (!it) { $('pullBlock').innerHTML = ''; return; }
  var pairs = it.resolves.map(function (r) { return { r: r, pr: bestPair(it, r, L, H) }; });
  var marks = [];
  homeNames(m).forEach(function (h) { positions(h.pc, L, H).forEach(function (p) { marks.push({ s: p.s, f: p.f, cls: h.cls, label: h.name }); }); });
  var first = pairs[0].pr;
  positions(it.pc, L, H).forEach(function (p) {
    marks.push({ s: p.s, f: p.f, cls: it.cls, label: it.name, ring: !!first && first.q.s === p.s && first.q.f === p.f });
  });
  var items = pairs.map(function (x) {
    var q = x.pr.q, p = x.pr.p;
    return '<li><strong>' + esc(it.name) + ' to ' + esc(x.r.name) + ':</strong> ' + dirWord(x.r.d) + '. Play ' + esc(spotText(q)) + ', then ' + esc(spotText(p)) + ' (' + esc(moveText(q, p)) + ').</li>';
  });
  var tb = first ? '<div class="panel">' + tab([
    { chord: c.sym, notes: [{ slot: 6, p: first.q }] },
    { chord: c.sym, notes: [{ slot: 0, p: first.p, third: true, suffix: '~' }] }
  ]) + '</div>' : '';
  $('pullBlock').innerHTML = '<h3>' + esc(it.name) + ' over ' + esc(c.sym) + ': ' + LEVEL_NAME[it.level].toLowerCase() + '</h3><div class="panel"><figure>' +
    board(marks, { lo: L, hi: H, path: first ? [first.q, first.p] : null, aria: esc(it.name) + ' and its release notes over ' + c.sym }) +
    '<figcaption>The ringed note is the starting spot. The dashed line runs to the nearest release note.</figcaption></figure></div>' +
    legend(MAP_LEGEND) + (it.blue ? '<p class="callout">' + esc(it.blue) + '</p>' : '') +
    '<ul class="plain insp">' + items.join('') + '</ul>' +
    '<p>Play the tension note on beat 4, hold it, then land on beat 1 of the next bar and add vibrato:</p>' + tb;
}

var PH = {
  setup: ['Set up', 'Chord tones and long notes. Leave space.'],
  build: ['Build', 'Add color notes. Repeat a short motif and start to climb.'],
  peak: ['Peak', 'Lean on the tension notes. Shorter notes, bends, higher up.'],
  release: ['Release', 'Land on beat 1, hold the note and leave space.']
};
function phases(m) {
  if (m === 1) return ['release'];
  if (m === 2) return ['build', 'release'];
  if (m === 3) return ['setup', 'build', 'release'];
  var seq = ['setup'];
  for (var i = 0; i < m - 3; i++) seq.push('build');
  return seq.concat(['peak', 'release']);
}
function names(list, n) { return list.slice(0, n).map(function (i) { return i.name; }).join(', '); }

function renderPlan() {
  var bars = P.bars.filter(function (b) { return b.chord; });
  if (!bars.length) { $('planBlock').innerHTML = emptyMsg(); return; }
  var L = lo(), H = hi(), rows = '', g, i;
  for (g = 0; g < bars.length; g += 4) {
    var grp = bars.slice(g, g + 4), seq = phases(grp.length);
    for (i = 0; i < grp.length; i++) {
      var b = grp[i], ph = seq[i], c = b.chord, m = tensionMap(c), lean = '';
      var root = m.items[0], th = thirdItem(m);
      if (ph === 'setup') lean = 'Chord tones: ' + names(homeNames(m), 3);
      else if (ph === 'build') {
        var col = m.items.filter(function (x) { return x.level === 'color'; });
        lean = col.length ? 'Color: ' + names(col, 4) : 'Chord tones and passing notes';
      } else if (ph === 'peak') {
        var tn = m.items.filter(function (x) { return x.level === 'tense' || (x.level === 'outside' && x.blue); });
        if (!tn.length) tn = m.items.filter(function (x) { return x.level === 'outside'; });
        lean = tn.length ? 'Tension: ' + names(tn, 3) : 'Color notes, played harder and higher';
      } else {
        var rt = ROUTE[b.cidx];
        lean = th ? 'Land on the 3rd, ' + th.name + (rt ? ' (' + spotText(rt) + ')' : '') + ', or the root ' + root.name : 'Land on the root ' + root.name + ' or the 5th';
      }
      rows += '<tr class="ph-' + ph + '"><td>' + (b.idx + 1) + '</td><td><strong>' + esc(c.sym) + '</strong></td><td>' + PH[ph][0] + '</td><td>' + PH[ph][1] + '</td><td>' + esc(lean) + '</td></tr>';
    }
  }
  $('planBlock').innerHTML = '<div class="tablewrap"><table><thead><tr><th>Bar</th><th>Chord</th><th>Phase</th><th>What to play</th><th>Lean on</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="note">Each group of four bars is one arc. Shorter groups skip the early phases. Shift the release to the bar where the song resolves.</p>';
}

function levelRank(it) { return it ? { home: 0, color: 1, outside: 2, tense: 3 }[it.level] : -1; }

function renderDrill() {
  if (!P.changes.length) { $('drillBlock').innerHTML = emptyMsg(); return; }
  var k = state.sel, c = selChord(), m = tensionMap(c), L = lo(), H = hi(), h = '';
  var tgt = thirdItem(m) || m.items[0], isThird = tgt.d !== 0;
  var p0 = isThird ? ROUTE[k] : null;
  if (!p0) {
    var tp = positions(tgt.pc, L, H).sort(function (a, b) { return Math.abs(a.f - (L + H) / 2) - Math.abs(b.f - (L + H) / 2); });
    p0 = tp[0];
  }
  var up = neighborPitch(p0, 1, L, H), dn = neighborPitch(p0, -1, L, H);
  var cu = up ? m.byPc[(pitch(up) % 12 + 12) % 12] : null, cd = dn ? m.byPc[(pitch(dn) % 12 + 12) % 12] : null;
  var q = null, qi = null;
  if (cu && levelRank(cu) >= levelRank(cd)) { q = up; qi = cu; } else if (cd) { q = dn; qi = cd; }
  if (!q || !qi || qi.level === 'home') {
    $('drillBlock').innerHTML = '<p class="note">The window has no room around the ' + esc(tgt.name) + ' of ' + esc(c.sym) + '. Move the window and try again.</p>';
    return;
  }
  var qdir = pitch(q) > pitch(p0) ? 'above' : 'below';
  h += '<p>Target: <strong>' + esc(tgt.name) + '</strong>, the ' + (isThird ? '3rd' : 'root') + ' of ' + esc(c.sym) + ', at ' + esc(spotText(p0)) + '. Tension note: <strong>' + esc(qi.name) + '</strong>, a half step ' + qdir + ' it (' + LEVEL_NAME[qi.level].toLowerCase() + ').</p>';
  h += '<h3>Drill 1 · Set up, push, land</h3>';
  h += '<p>Beat 1: the target. The "and" of 2, beat 3 and beat 4: the tension note. Next bar, beat 1: back to the target with vibrato.</p>';
  h += '<div class="panel">' + tab([
    { chord: c.sym, notes: [{ slot: 0, p: p0, third: true }, { slot: 3, p: q }, { slot: 4, p: q }, { slot: 6, p: q }] },
    { chord: c.sym, notes: [{ slot: 0, p: p0, third: true, suffix: '~' }] }
  ]) + '</div>';
  h += '<h3>Drill 2 · Squeeze the rhythm</h3>';
  h += '<p>Play the tension note on beats 1, 2 and 3, then two eighth notes on beat 4. The notes come faster and the pull grows. Release on beat 1 of the next bar.</p>';
  h += '<div class="panel">' + tab([
    { chord: c.sym, notes: [{ slot: 0, p: q }, { slot: 2, p: q }, { slot: 4, p: q }, { slot: 6, p: q }, { slot: 7, p: q }] },
    { chord: c.sym, notes: [{ slot: 0, p: p0, third: true, suffix: '~' }] }
  ]) + '</div>';
  h += '<h3>Drill 3 · Slide into the release</h3>';
  var pair = null;
  positions(qi.pc, L, H).forEach(function (a) {
    positions(tgt.pc, L, H).forEach(function (b) {
      if (a.s === b.s && Math.abs(a.f - b.f) === 1 && (!pair || dist(b, p0) < dist(pair.p, p0))) pair = { q: a, p: b };
    });
  });
  if (pair) {
    var upSlide = pair.p.f > pair.q.f;
    h += '<p>On the ' + esc(pair.q.s === 0 ? 'low E' : spotText(pair.q).split(' string')[0]) + ' string, play fret ' + pair.q.f + ' (' + esc(qi.name) + ') on the "and" of 4 and slide ' + (upSlide ? 'up' : 'down') + ' one fret to fret ' + pair.p.f + ' (' + esc(tgt.name) + '). Land on beat 1 and hold it.</p>';
    h += '<div class="panel">' + tab([
      { chord: c.sym, notes: [{ slot: 7, p: pair.q, suffix: upSlide ? '/' : '\\' }] },
      { chord: c.sym, notes: [{ slot: 0, p: pair.p, third: true, suffix: '~' }] }
    ]) + '</div>';
  } else {
    h += '<p class="note">No pair of these two notes sits on the same string inside the window. Try a different window.</p>';
  }
  $('drillBlock').innerHTML = h;
}

function renderPrintLine() {
  $('printLine').textContent = (state.title ? state.title + ' · ' : '') + 'Progression: ' + P.bars.map(function (b) { return b.chord ? b.chord.sym : b.tok; }).join(' ') + ' · Frets ' + lo() + ' to ' + hi();
}

function render() {
  P = parseProgression(state.text);
  if (state.sel >= P.changes.length) state.sel = 0;
  ROUTE = computeRoute(P.changes, lo(), hi());
  renderBars(); renderChips(); renderMap(); renderPull(); renderPlan(); renderDrill(); renderPrintLine();
  var idx = PRESETS.findIndex(function (p) { return p.text === state.text.trim().replace(/\s+/g, ' '); });
  $('presetSel').value = idx >= 0 ? String(idx) : 'custom';
}

function select(i) { state.sel = i; state.ten = null; renderBars(); renderChips(); renderMap(); renderPull(); renderDrill(); }

/* ---------- init ---------- */
function init() {
  var ws = $('winSel'), ps = $('presetSel'), i;
  for (i = 1; i <= 12; i++) ws.add(new Option('Frets ' + i + ' to ' + (i + 10), String(i)));
  PRESETS.forEach(function (p, j) { ps.add(new Option(p.name, String(j))); });
  ps.add(new Option('Custom', 'custom'));
  ws.value = String(state.start);
  $('labSel').value = state.labels;
  $('chordsIn').value = state.text; $('titleIn').value = state.title; $('hideChk').checked = state.hide;

  ws.addEventListener('change', function () { state.start = +ws.value; save(); render(); });
  $('labSel').addEventListener('change', function (e) { state.labels = e.target.value; save(); renderMap(); });
  $('hideChk').addEventListener('change', function (e) { state.hide = e.target.checked; renderMap(); });
  $('tenSel').addEventListener('change', function (e) { state.ten = +e.target.value; renderPull(); });
  ps.addEventListener('change', function () {
    if (ps.value === 'custom') return;
    state.text = PRESETS[+ps.value].text; state.sel = 0; state.ten = null; $('chordsIn').value = state.text; save(); render();
  });
  $('chordsIn').addEventListener('input', function (e) { state.text = e.target.value.slice(0, 400); state.ten = null; save(); render(); });
  $('titleIn').addEventListener('input', function (e) { state.title = e.target.value; save(); renderPrintLine(); });
  ['barGrid', 'chips'].forEach(function (id) {
    $(id).addEventListener('click', function (e) {
      var b = e.target.closest('button[data-c]');
      if (b) select(+b.getAttribute('data-c'));
    });
  });
  var pb = $('printBtn');
  if (pb) pb.addEventListener('click', function () { window.print(); });
  render();
}

window.GTL = { parseChord: parseChord, parseProgression: parseProgression, tensionMap: tensionMap, spell: spell, mod: mod, state: state, render: render };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
