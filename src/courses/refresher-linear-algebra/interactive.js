// Interactive figures for the Refresher Course · Linear Algebra part.
// Same conventions as the other courses: vanilla SVG drawing, colors read from
// CSS variables so the theme switch (course.js dispatches 'themechange')
// repaints correctly.
const NS = 'http://www.w3.org/2000/svg';
function cv(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function rgba(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor, size) { const t = el('text', { x, y, fill, 'font-size': size || 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { const v = (+x).toFixed(d); return v === '-' + (0).toFixed(d) ? (0).toFixed(d) : v; }
function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { document.getElementById(id + '_v').textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { const s = document.getElementById(id); if (!s) continue; s.value = v; document.getElementById(id + '_v').textContent = fmt(v, dec); } }
function val(id) { const e = document.getElementById(id); return e ? parseFloat(e.value) : 0; }

// arrowhead marker, one per svg (markers cannot be shared across inline svgs reliably)
function defArrow(svg, id) {
  const defs = el('defs', {}, svg);
  const m = el('marker', { id, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: 'auto' }, defs);
  el('path', { d: 'M0,0 L6,3 L0,6 z', fill: 'context-stroke' }, m);
}
// axes through the origin of a data window
function axes(svg, X, Y, xlim, ylim) {
  el('line', { x1: X(-xlim), y1: Y(0), x2: X(xlim), y2: Y(0), stroke: cv('--border2') }, svg);
  el('line', { x1: X(0), y1: Y(-ylim), x2: X(0), y2: Y(ylim), stroke: cv('--border2') }, svg);
}
function arrow(svg, X, Y, x, y, color, mk, w) {
  return el('line', { x1: X(0), y1: Y(0), x2: X(x), y2: Y(y), stroke: color, 'stroke-width': w || 2.2, 'marker-end': `url(#${mk})` }, svg);
}

// ---------- 03 · Ax as a linear combination of the columns of A ----------
// A = [[2,-1],[1,2]] : columns a1 = (2,1), a2 = (-1,2)
const LC_A1 = [2, 1], LC_A2 = [-1, 2];
function lcDraw() {
  const svg = document.getElementById('lcsvg');
  if (!svg) return;
  svg.innerHTML = '';
  defArrow(svg, 'lcar');
  const S = 20, ox = 170, oy = 130;
  const X = (x) => ox + x * S, Y = (y) => oy - y * S;
  const x1 = val('lc_x1'), x2 = val('lc_x2');

  // grid
  for (let g = -8; g <= 8; g++) el('line', { x1: X(g), y1: Y(-6), x2: X(g), y2: Y(6), stroke: cv('--border'), opacity: 0.35 }, svg);
  for (let g = -6; g <= 6; g++) el('line', { x1: X(-8), y1: Y(g), x2: X(8), y2: Y(g), stroke: cv('--border'), opacity: 0.35 }, svg);
  axes(svg, X, Y, 8, 6);

  const s1 = [x1 * LC_A1[0], x1 * LC_A1[1]];
  const s2 = [x2 * LC_A2[0], x2 * LC_A2[1]];
  const sum = [s1[0] + s2[0], s1[1] + s2[1]];

  // the two columns themselves
  arrow(svg, X, Y, LC_A1[0], LC_A1[1], cv('--blue'), 'lcar', 2.4);
  arrow(svg, X, Y, LC_A2[0], LC_A2[1], cv('--blue'), 'lcar', 2.4);
  txt(X(LC_A1[0]) + 6, Y(LC_A1[1]) + 4, 'a·1', cv('--blue'), svg, 'start', 10.5);
  txt(X(LC_A2[0]) - 6, Y(LC_A2[1]) - 4, 'a·2', cv('--blue'), svg, 'end', 10.5);

  // scaled copies, and the tip-to-tail path to the sum
  el('line', { x1: X(0), y1: Y(0), x2: X(s1[0]), y2: Y(s1[1]), stroke: cv('--amber'), 'stroke-width': 1.8, 'stroke-dasharray': '4 3' }, svg);
  el('line', { x1: X(s1[0]), y1: Y(s1[1]), x2: X(sum[0]), y2: Y(sum[1]), stroke: cv('--amber'), 'stroke-width': 1.8, 'stroke-dasharray': '4 3' }, svg);
  txt(X(s1[0]) + 5, Y(s1[1]) - 5, 'x₁a·1', cv('--amber'), svg, 'start', 10);

  arrow(svg, X, Y, sum[0], sum[1], cv('--green'), 'lcar', 2.6);
  txt(X(sum[0]) + 7, Y(sum[1]) - 6, 'Ax', cv('--green'), svg, 'start', 11.5);
  el('circle', { cx: X(sum[0]), cy: Y(sum[1]), r: 3, fill: cv('--green') }, svg);

  const r = document.getElementById('lcread');
  if (r) {
    r.innerHTML =
      `<span>x₁ <b>${fmt(x1, 1)}</b></span>` +
      `<span>x₂ <b>${fmt(x2, 1)}</b></span>` +
      `<span>Ax <b>(${fmt(sum[0], 2)}, ${fmt(sum[1], 2)})</b></span>` +
      `<span class="muted">= ${fmt(x1, 1)}·(2,1) + ${fmt(x2, 1)}·(−1,2)</span>`;
  }
}
function lcSet(a, b) { setS([['lc_x1', a, 1], ['lc_x2', b, 1]]); lcDraw(); }
window.lcSet = lcSet;

// ---------- 04 · dot product, angle and projection ----------
const DP_U = [2, 0];
function dpDraw() {
  const svg = document.getElementById('dpsvg');
  if (!svg) return;
  svg.innerHTML = '';
  defArrow(svg, 'dpar');
  const S = 52, ox = 160, oy = 140;
  const X = (x) => ox + x * S, Y = (y) => oy - y * S;
  const th = (val('dp_th') * Math.PI) / 180, r = val('dp_r');
  const v = [r * Math.cos(th), r * Math.sin(th)];

  axes(svg, X, Y, 3, 2.05);   // 2.05 keeps the vertical axis inside the 250-high viewBox
  // unit circle for scale reference
  el('circle', { cx: X(0), cy: Y(0), r: S, fill: 'none', stroke: cv('--border'), 'stroke-dasharray': '3 4' }, svg);

  const dot = DP_U[0] * v[0] + DP_U[1] * v[1];
  const nu = Math.hypot(DP_U[0], DP_U[1]), nv = Math.hypot(v[0], v[1]);
  const cos = nu * nv > 0 ? dot / (nu * nv) : 0;
  const projLen = nv * cos;   // signed length of the shadow along u

  // the shadow of v on the direction of u (u lies on the positive x-axis)
  el('line', { x1: X(0), y1: Y(0) + 0, x2: X(projLen), y2: Y(0), stroke: cv('--amber'), 'stroke-width': 5, opacity: 0.85 }, svg);
  el('line', { x1: X(v[0]), y1: Y(v[1]), x2: X(projLen), y2: Y(0), stroke: cv('--dim'), 'stroke-dasharray': '3 3' }, svg);

  arrow(svg, X, Y, DP_U[0], DP_U[1], cv('--blue'), 'dpar', 2.4);
  txt(X(DP_U[0]) + 6, Y(0) + 16, 'u = (2,0)', cv('--blue'), svg, 'end', 10.5);
  arrow(svg, X, Y, v[0], v[1], cv('--red'), 'dpar', 2.4);
  txt(X(v[0]) + 8 * Math.sign(v[0] || 1), Y(v[1]) - 8, 'v', cv('--red'), svg, v[0] < 0 ? 'end' : 'start', 11.5);

  // angle arc
  const R = 34, a0 = 0, a1 = -th;
  const large = Math.abs(th) > Math.PI ? 1 : 0;
  const sweep = th > 0 ? 0 : 1;
  el('path', { d: `M ${X(0) + R} ${Y(0)} A ${R} ${R} 0 ${large} ${sweep} ${X(0) + R * Math.cos(th)} ${Y(0) - R * Math.sin(th)}`, fill: 'none', stroke: cv('--green'), 'stroke-width': 1.4 }, svg);
  txt(X(0) + 44, Y(0) - 14, 'θ', cv('--green'), svg, 'start', 11.5);

  const sign = dot > 1e-9 ? 'positive — broadly aligned' : dot < -1e-9 ? 'negative — broadly opposed' : 'zero — orthogonal';
  const col = dot > 1e-9 ? cv('--green') : dot < -1e-9 ? cv('--red') : cv('--amber');
  txt(14, 20, 'u · v = ' + fmt(dot, 2) + '  (' + sign + ')', col, svg, 'start', 11);

  const rd = document.getElementById('dpread');
  if (rd) {
    rd.innerHTML =
      `<span>u·v <b>${fmt(dot, 2)}</b></span>` +
      `<span>cos θ <b>${fmt(cos, 3)}</b></span>` +
      `<span>‖u‖‖v‖ <b>${fmt(nu * nv, 2)}</b></span>` +
      `<span class="muted">‖u‖‖v‖cos θ = ${fmt(nu * nv * cos, 2)} ✓</span>`;
  }
}
function dpSet(t, r) { setS([['dp_th', t, 0], ['dp_r', r, 2]]); dpDraw(); }
window.dpSet = dpSet;

// ---------- 07 · independence: when does the span collapse to a line? ----------
const LI_U = [2, 1];
function liDraw() {
  const svg = document.getElementById('lisvg');
  if (!svg) return;
  svg.innerHTML = '';
  defArrow(svg, 'liar');
  const S = 30, ox = 170, oy = 130;
  const X = (x) => ox + x * S, Y = (y) => oy - y * S;
  const v = [val('li_v1'), val('li_v2')];
  const det = LI_U[0] * v[1] - LI_U[1] * v[0];
  const dep = Math.abs(det) < 0.06;

  // span: the whole window when independent, just the line through u when not
  if (!dep) {
    el('rect', { x: 6, y: 6, width: 328, height: 248, fill: rgba(cv('--green').startsWith('#') ? cv('--green') : '#3fb950', 0.1) }, svg);
    txt(326, 22, 'span = the whole plane  (dim 2)', cv('--green'), svg, 'end', 11);
  } else {
    const t = 9;
    el('line', { x1: X(-t * LI_U[0]), y1: Y(-t * LI_U[1]), x2: X(t * LI_U[0]), y2: Y(t * LI_U[1]), stroke: cv('--red'), 'stroke-width': 5, opacity: 0.3 }, svg);
    txt(326, 22, 'span collapsed to a line  (dim 1)', cv('--red'), svg, 'end', 11);
  }
  axes(svg, X, Y, 5.6, 4.3);

  // parallelogram spanned by u and v: its area is |det|
  el('path', {
    d: `M ${X(0)} ${Y(0)} L ${X(LI_U[0])} ${Y(LI_U[1])} L ${X(LI_U[0] + v[0])} ${Y(LI_U[1] + v[1])} L ${X(v[0])} ${Y(v[1])} Z`,
    fill: rgba(cv('--amber').startsWith('#') ? cv('--amber') : '#d29922', 0.22), stroke: cv('--amber'), 'stroke-width': 1.2,
  }, svg);

  arrow(svg, X, Y, LI_U[0], LI_U[1], cv('--blue'), 'liar', 2.6);
  txt(X(LI_U[0]) + 7, Y(LI_U[1]) + 4, 'u = (2,1)', cv('--blue'), svg, 'start', 10.5);
  arrow(svg, X, Y, v[0], v[1], cv('--red'), 'liar', 2.6);
  txt(X(v[0]) + (v[0] < 0 ? -7 : 7), Y(v[1]) - 7, 'v', cv('--red'), svg, v[0] < 0 ? 'end' : 'start', 11.5);

  const r = document.getElementById('liread');
  if (r) {
    r.innerHTML =
      `<span>u₁v₂ − u₂v₁ <b>${fmt(det, 2)}</b></span>` +
      `<span>rank <b>${dep ? 1 : 2}</b></span>` +
      `<span>${dep ? '<b style="color:var(--red)">dependent</b>' : '<b>independent</b>'}</span>` +
      `<span class="muted">amber area = |det| = ${fmt(Math.abs(det), 2)}</span>`;
  }
}
function liSet(a, b) { setS([['li_v1', a, 1], ['li_v2', b, 1]]); liDraw(); }
window.liSet = liSet;

// ---------- 12 · two lines: unique / none / infinitely many ----------
// row 1 is fixed:  x1 - x2 = 1 ;  row 2 is  a21 x1 + a22 x2 = b2
function clipLine(a, b, c, xlim, ylim) {
  // returns the two endpoints of {a x + b y = c} clipped to the window, or null
  const pts = [];
  const push = (x, y) => { if (x >= -xlim - 1e-9 && x <= xlim + 1e-9 && y >= -ylim - 1e-9 && y <= ylim + 1e-9) pts.push([x, y]); };
  if (Math.abs(b) > 1e-9) { push(-xlim, (c + a * xlim) / b); push(xlim, (c - a * xlim) / b); }
  if (Math.abs(a) > 1e-9) { push((c + b * ylim) / a, -ylim); push((c - b * ylim) / a, ylim); }
  if (pts.length < 2) return null;
  // keep the two most distant candidates
  let best = [pts[0], pts[1]], bd = -1;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    if (d > bd) { bd = d; best = [pts[i], pts[j]]; }
  }
  return best;
}
function syDraw() {
  const svg = document.getElementById('sysvg');
  if (!svg) return;
  svg.innerHTML = '';
  const S = 26, ox = 170, oy = 130, XL = 6.2, YL = 4.8;
  const X = (x) => ox + x * S, Y = (y) => oy - y * S;
  const a21 = val('sy_c'), a22 = val('sy_d'), b2 = val('sy_b2');
  const det = 1 * a22 - (-1) * a21;   // = a22 + a21

  for (let g = -6; g <= 6; g++) el('line', { x1: X(g), y1: Y(-YL), x2: X(g), y2: Y(YL), stroke: cv('--border'), opacity: 0.35 }, svg);
  for (let g = -4; g <= 4; g++) el('line', { x1: X(-XL), y1: Y(g), x2: X(XL), y2: Y(g), stroke: cv('--border'), opacity: 0.35 }, svg);
  axes(svg, X, Y, XL, YL);

  const draw = (a, b, c, color, w) => {
    const p = clipLine(a, b, c, XL, YL);
    if (p) el('line', { x1: X(p[0][0]), y1: Y(p[0][1]), x2: X(p[1][0]), y2: Y(p[1][1]), stroke: color, 'stroke-width': w || 2.2 }, svg);
  };
  draw(1, -1, 1, cv('--blue'), 2.2);
  draw(a21, a22, b2, cv('--red'), 2.2);

  let status, col;
  if (Math.abs(det) > 1e-6) {
    const x1 = (1 * a22 + b2) / det, x2 = (b2 - a21) / det;
    status = 'one solution: (' + fmt(x1, 2) + ', ' + fmt(x2, 2) + ')';
    col = cv('--green');
    if (Math.abs(x1) <= XL && Math.abs(x2) <= YL) {
      el('circle', { cx: X(x1), cy: Y(x2), r: 5, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
      el('circle', { cx: X(x1), cy: Y(x2), r: 2, fill: cv('--green') }, svg);
    } else {
      txt(170, 246, 'the intersection lies outside the window', cv('--dim'), svg, 'middle', 10);
    }
  } else {
    // parallel: coincident iff (a21,a22,b2) is proportional to (1,-1,1)
    const k = Math.abs(a21) > 1e-9 ? a21 : (Math.abs(a22) > 1e-9 ? -a22 : 0);
    const same = Math.abs(a21) < 1e-9 && Math.abs(a22) < 1e-9 ? Math.abs(b2) < 1e-9 : Math.abs(b2 - k) < 1e-6;
    if (same) { status = 'infinitely many solutions: the two lines coincide'; col = cv('--amber'); }
    else { status = 'no solution: the lines are parallel and distinct'; col = cv('--red'); }
  }
  txt(14, 20, 'det A = ' + fmt(det, 2), cv('--text'), svg, 'start', 11);
  txt(14, 36, status, col, svg, 'start', 11);

  const r = document.getElementById('syread');
  if (r) {
    r.innerHTML =
      `<span>det A <b>${fmt(det, 2)}</b></span>` +
      `<span>rank A <b>${Math.abs(det) > 1e-6 ? 2 : 1}</b></span>` +
      `<span class="muted">${status}</span>`;
  }
}
function sySet(c, d, b) { setS([['sy_c', c, 1], ['sy_d', d, 1], ['sy_b2', b, 1]]); syDraw(); }
window.sySet = sySet;

// ---------- wiring ----------
bindS('lc_x1', 1, lcDraw); bindS('lc_x2', 1, lcDraw);
bindS('dp_th', 0, dpDraw); bindS('dp_r', 2, dpDraw);
bindS('li_v1', 1, liDraw); bindS('li_v2', 1, liDraw);
bindS('sy_c', 1, syDraw); bindS('sy_d', 1, syDraw); bindS('sy_b2', 1, syDraw);

function drawAll() { lcDraw(); dpDraw(); liDraw(); syDraw(); }
drawAll();
window.addEventListener('themechange', drawAll);
