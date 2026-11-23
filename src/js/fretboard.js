/* Fretboard diagram and tab renderers. They return HTML strings, so lessons and the build script can both use them. */
import { STRLET, esc } from './theory.js';

function board(marks, o) {
  var lo = o.lo, hi = o.hi, n = hi - lo + 1, CW = 34, SH = 22, LM = 26, TM = 36;
  var W = LM + CW * n + 10, H = TM + SH * 5 + 36, i, out = [];
  var X = function (f) { return LM + CW * (f - lo) + CW / 2; };
  var Y = function (s) { return TM + SH * (5 - s); };
  out.push('<svg class="board" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria) + '" xmlns="http://www.w3.org/2000/svg">');
  for (i = 0; i < n; i++) out.push('<text class="num" x="' + X(lo + i) + '" y="16">' + (lo + i) + '</text>');
  for (i = 0; i <= n; i++) out.push('<line class="wire" x1="' + (LM + CW * i) + '" y1="' + TM + '" x2="' + (LM + CW * i) + '" y2="' + (TM + SH * 5) + '"/>');
  for (i = 0; i < 6; i++) {
    var y = TM + SH * i;
    out.push('<line class="str" x1="' + LM + '" y1="' + y + '" x2="' + (LM + CW * n) + '" y2="' + y + '" stroke-width="' + (1 + i * 0.4).toFixed(1) + '"/>');
    out.push('<text class="sl" x="' + (LM - 12) + '" y="' + (y + 4) + '">' + STRLET[5 - i] + '</text>');
  }
  var cy = TM + SH * 5 + 18;
  [3, 5, 7, 9, 15, 17, 19, 21].forEach(function (fr) { if (fr >= lo && fr <= hi) out.push('<circle class="inlay" cx="' + X(fr) + '" cy="' + cy + '" r="3.2"/>'); });
  [12, 24].forEach(function (fr) { if (fr >= lo && fr <= hi) out.push('<circle class="inlay" cx="' + (X(fr) - 6) + '" cy="' + cy + '" r="3.2"/><circle class="inlay" cx="' + (X(fr) + 6) + '" cy="' + cy + '" r="3.2"/>'); });
  if (o.path && o.path.length > 1) {
    out.push('<polyline class="path" points="' + o.path.map(function (p) { return X(p.f) + ',' + Y(p.s); }).join(' ') + '"/>');
  }
  var R = { R: 10, '3M': 12, '3m': 12, '5': 10, '7': 9, T: 9, X: 9 };
  marks.forEach(function (m) {
    var cx = X(m.f), cyy = Y(m.s), r = R[m.cls] || 10;
    if (m.ring) out.push('<circle class="ring" cx="' + cx + '" cy="' + cyy + '" r="' + (r + 4.5) + '"/>');
    out.push('<g class="mk m-' + m.cls + '"><circle cx="' + cx + '" cy="' + cyy + '" r="' + r + '"/><text x="' + cx + '" y="' + (cyy + 3.8) + '">' + esc(m.label) + '</text></g>');
  });
  out.push('</svg>');
  return out.join('');
}

/* ---------- tab ---------- */
function tab(bars) {
  var SL = ['1', '&', '2', '&', '3', '&', '4', '&'];
  var chordL = '  ', countL = '  ';
  var rows = ['e|', 'B|', 'G|', 'D|', 'A|', 'E|'];
  bars.forEach(function (b) {
    var w = [1, 1, 1, 1, 1, 1, 1, 1], by = {};
    b.notes.forEach(function (n) {
      var t = String(n.p.f) + (n.suffix || '');
      w[n.slot] = Math.max(w[n.slot], t.length);
      by[n.slot + '_' + n.p.s] = { t: t, third: n.third };
    });
    for (var i = 0; i < 8; i++) w[i] += 1;
    var total = 2;
    w.forEach(function (x) { total += x; });
    var c = ' ' + b.chord;
    if (total < c.length) { w[7] += c.length - total; total = c.length; }
    chordL += c + new Array(total - c.length + 1).join(' ');
    countL += ' ';
    for (i = 0; i < 8; i++) countL += SL[i] + new Array(w[i]).join(' ');
    countL += ' ';
    for (var r = 0; r < 6; r++) {
      var s = 5 - r, line = '-';
      for (i = 0; i < 8; i++) {
        var cell = by[i + '_' + s];
        if (cell) {
          var txt = esc(cell.t);
          line += (cell.third ? '<b class="t3">' + txt + '</b>' : txt) + new Array(w[i] - cell.t.length + 1).join('-');
        } else line += new Array(w[i] + 1).join('-');
      }
      rows[r] += line + '|';
    }
  });
  return '<pre class="tab">' + esc(chordL) + '\n' + countL + '\n' + rows.join('\n') + '</pre>';
}

export { board, tab };
