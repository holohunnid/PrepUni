// Interactive figures for the optimization course. Same conventions as the other
// courses: vanilla SVG drawing, colors read from CSS variables so theme switches
// (course.js dispatches 'themechange') repaint correctly.
const NS = 'http://www.w3.org/2000/svg';
function cv(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function hexv(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hexv(h); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t) { const a = hexv(h1), b = hexv(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor) { const t = el('text', { x, y, fill, 'font-size': 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { if (!isFinite(x)) return '∞'; return (+x).toFixed(d); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function bgOfFig(svg) { let n = svg.parentElement; while (n && n.tagName !== 'FIGURE') n = n.parentElement; return n ? getComputedStyle(n).backgroundColor : cv('--bg'); }

function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { document.getElementById(id + '_v').textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { const s = document.getElementById(id); if (!s) continue; s.value = v; document.getElementById(id + '_v').textContent = fmt(v, dec); } }
function val(id) { const s = document.getElementById(id); return s ? parseFloat(s.value) : 0; }
function read(id, html) { const r = document.getElementById(id); if (r) r.innerHTML = html; }
function put(id, html) { const r = document.getElementById(id); if (r) r.innerHTML = html; }

function polyPath(pts) {
  let d = '', pen = false;
  for (const p of pts) {
    if (!p || !isFinite(p[1]) || !isFinite(p[0])) { pen = false; continue; }
    d += (pen ? ' L' : ' M') + ` ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    pen = true;
  }
  return d;
}
function bandScale(vals, top, bottom, pad = 0.12) {
  const fin = vals.filter((v) => isFinite(v));
  let lo = Math.min(...fin), hi = Math.max(...fin);
  if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const m = (hi - lo) * pad; lo -= m; hi += m;
  const f = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  f.lo = lo; f.hi = hi;
  return f;
}
// dense scan for sign changes of d, refined by bisection
function roots(d, lo, hi, n = 900) {
  const out = [], h = (hi - lo) / n;
  let prev = d(lo);
  for (let i = 1; i <= n; i++) {
    const x = lo + i * h, cur = d(x);
    if (isFinite(prev) && isFinite(cur) && prev * cur < 0) {
      let a = x - h, b = x;
      for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (d(a) * d(m) <= 0) b = m; else a = m; }
      out.push((a + b) / 2);
    }
    prev = cur;
  }
  return out;
}
function arrow(svg, x1, y1, x2, y2, col, w = 2.4) {
  el('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': w }, svg);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  el('path', { d: `M ${x2} ${y2} L ${x2 - 9 * Math.cos(ang - 0.4)} ${y2 - 9 * Math.sin(ang - 0.4)} L ${x2 - 9 * Math.cos(ang + 0.4)} ${y2 - 9 * Math.sin(ang + 0.4)} Z`, fill: col }, svg);
}
// ---- marching squares contours ----
const MSQ = { 0: [], 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 2], [0, 1]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[2, 0]], 10: [[2, 1], [0, 3]], 11: [[2, 1]], 12: [[1, 3]], 13: [[1, 0]], 14: [[0, 3]], 15: [] };
function contourPath(f, level, xlo, xhi, ylo, yhi, n, X, Y) {
  const sx = (xhi - xlo) / n, sy = (yhi - ylo) / n;
  let d = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const xa = xlo + i * sx, xb = xa + sx, ya = ylo + j * sy, yb = ya + sy;
    const v00 = f(xa, ya), v10 = f(xb, ya), v11 = f(xb, yb), v01 = f(xa, yb);
    if (![v00, v10, v11, v01].every(isFinite)) continue;
    const idx = (v00 > level ? 1 : 0) | (v10 > level ? 2 : 0) | (v11 > level ? 4 : 0) | (v01 > level ? 8 : 0);
    const segs = MSQ[idx];
    if (!segs.length) continue;
    const t = (p, q) => (level - p) / (q - p);
    const pt = (e) => {
      if (e === 0) return [xa + sx * t(v00, v10), ya];
      if (e === 1) return [xb, ya + sy * t(v10, v11)];
      if (e === 2) return [xa + sx * t(v01, v11), yb];
      return [xa, ya + sy * t(v00, v01)];
    };
    for (const [e1, e2] of segs) {
      const p1 = pt(e1), p2 = pt(e2);
      d += `M ${X(p1[0]).toFixed(1)} ${Y(p1[1]).toFixed(1)} L ${X(p2[0]).toFixed(1)} ${Y(p2[1]).toFixed(1)} `;
    }
  }
  return d;
}
function drawContours(svg, f, xlo, xhi, ylo, yhi, X, Y, levels = 11, grid = 46) {
  const vals = [];
  for (let i = 0; i <= 28; i++) for (let j = 0; j <= 28; j++) {
    const v = f(xlo + (xhi - xlo) * i / 28, ylo + (yhi - ylo) * j / 28);
    if (isFinite(v)) vals.push(v);
  }
  if (!vals.length) return;
  const lo = Math.min(...vals), hi = Math.max(...vals);
  for (let k = 1; k < levels; k++) {
    const t = k / levels, level = lo + (hi - lo) * t;
    const d = contourPath(f, level, xlo, xhi, ylo, yhi, grid, X, Y);
    if (d) el('path', { d, fill: 'none', stroke: mix(cv('--blue'), cv('--amber'), t), 'stroke-width': 1.2, opacity: 0.85 }, svg);
  }
}

/* ============================================================
   01 · local vs global on an interval
   ============================================================ */
const OSf = (x) => -x * x * x * x + 4 * x * x + x;
const OSd = (x) => -4 * x * x * x + 8 * x + 1;
let osClosed = true;
function osDraw() {
  const svg = document.getElementById('ossvg'); if (!svg) return;
  svg.innerHTML = '';
  let a = val('os_a'), b = val('os_b');
  if (a > b - 0.3) { a = Math.min(a, b - 0.3); }
  const lo = -3.2, hi = 3.4;
  const X = (x) => 34 + (x - lo) * (410 / (hi - lo));
  const pts = [];
  for (let i = 0; i <= 400; i++) { const x = lo + (hi - lo) * i / 400; pts.push(OSf(x)); }
  const Y = bandScale(pts, 24, 220);
  el('rect', { x: 28, y: 18, width: 420, height: 208, fill: 'none', stroke: cv('--border') }, svg);
  if (Y(0) > 18 && Y(0) < 226) el('line', { x1: 28, y1: Y(0), x2: 448, y2: Y(0), stroke: cv('--border2') }, svg);
  // feasible band
  el('rect', { x: X(a), y: 18, width: X(b) - X(a), height: 208, fill: rgba(cv('--green'), 0.09) }, svg);
  [a, b].forEach((v) => el('line', { x1: X(v), y1: 18, x2: X(v), y2: 226, stroke: cv('--green'), 'stroke-width': 1.2, 'stroke-dasharray': osClosed ? '' : '4 3' }, svg));
  // curve: faded outside, solid inside
  el('path', { d: polyPath(pts.map((v, i) => [X(lo + (hi - lo) * i / 400), Y(v)])), fill: 'none', stroke: cv('--dim'), 'stroke-width': 1.4 }, svg);
  const inPts = [];
  for (let i = 0; i <= 300; i++) { const x = a + (b - a) * i / 300; inPts.push([X(x), Y(OSf(x))]); }
  el('path', { d: polyPath(inPts), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.4 }, svg);
  // candidates
  const crit = roots(OSd, lo, hi).filter((x) => x > a + 1e-6 && x < b - 1e-6);
  crit.forEach((x) => el('circle', { cx: X(x), cy: Y(OSf(x)), r: 3.6, fill: cv('--amber') }, svg));
  const cand = crit.map((x) => ({ x, v: OSf(x), end: false }));
  cand.push({ x: a, v: OSf(a), end: true }, { x: b, v: OSf(b), end: true });
  cand.forEach((c) => { if (c.end) el('circle', { cx: X(c.x), cy: Y(c.v), r: 3.6, fill: osClosed ? cv('--muted') : bgOfFig(svg), stroke: cv('--muted'), 'stroke-width': 1.4 }, svg); });
  const usable = osClosed ? cand : cand.filter((c) => !c.end);
  let best = null, worst = null;
  usable.forEach((c) => { if (!best || c.v > best.v) best = c; if (!worst || c.v < worst.v) worst = c; });
  const supC = cand.reduce((p, c) => (c.v > p.v ? c : p), cand[0]);
  const infC = cand.reduce((p, c) => (c.v < p.v ? c : p), cand[0]);
  if (best) el('circle', { cx: X(best.x), cy: Y(best.v), r: 7, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
  if (worst) el('circle', { cx: X(worst.x), cy: Y(worst.v), r: 7, fill: 'none', stroke: cv('--red'), 'stroke-width': 2.4 }, svg);
  txt(X(a) - 3, 240, 'a', cv('--green'), svg); txt(X(b) - 3, 240, 'b', cv('--green'), svg);
  txt(34, 254, osClosed ? 'feasible set  [a, b]  — closed' : 'feasible set  (a, b)  — open', cv('--muted'), svg);
  const noMax = !osClosed && supC.end;
  const noMin = !osClosed && infC.end;
  read('osread',
    `<span>${osClosed ? '[a,b]' : '(a,b)'} = ${osClosed ? '[' : '('}${fmt(a)}, ${fmt(b)}${osClosed ? ']' : ')'}</span>` +
    `<span>critical points inside: <b>${crit.length ? crit.map((x) => fmt(x)).join(', ') : 'none'}</b></span>` +
    (noMax ? `<span class="r">no maximum — sup = ${fmt(supC.v, 3)}, not attained</span>`
      : `<span>max = <b>${fmt(best.v, 3)}</b> at x = <b>${fmt(best.x)}</b> ${best.end ? '<span class="a">(endpoint — a corner solution)</span>' : '(interior)'}</span>`) +
    (noMin ? `<span class="r">no minimum — inf = ${fmt(infC.v, 3)}</span>`
      : `<span>min = <b>${fmt(worst.v, 3)}</b> at x = <b>${fmt(worst.x)}</b></span>`));
}
window.osOpen = () => { osClosed = !osClosed; osDraw(); };
window.osSet = (a, b) => { setS([['os_a', a, 2], ['os_b', b, 2]]); osClosed = true; osDraw(); };

/* ============================================================
   02 · closed-interval method, with a candidate table
   ============================================================ */
const CIf = (x) => x * x * x - 3 * x * x - 9 * x + 5;
function ciDraw() {
  const svg = document.getElementById('cisvg'); if (!svg) return;
  svg.innerHTML = '';
  let a = val('ci_a'), b = val('ci_b');
  if (b < a + 0.5) b = a + 0.5;
  const lo = -4.2, hi = 6.2;
  const X = (x) => 34 + (x - lo) * (412 / (hi - lo));
  const all = [];
  for (let i = 0; i <= 400; i++) all.push(CIf(lo + (hi - lo) * i / 400));
  const Y = bandScale(all, 24, 224);
  el('rect', { x: 28, y: 18, width: 422, height: 212, fill: 'none', stroke: cv('--border') }, svg);
  if (Y(0) > 18 && Y(0) < 230) el('line', { x1: 28, y1: Y(0), x2: 450, y2: Y(0), stroke: cv('--border2') }, svg);
  for (let g = -4; g <= 6; g += 2) txt(X(g) - 4, 244, g, cv('--dim'), svg);
  el('rect', { x: X(a), y: 18, width: X(b) - X(a), height: 212, fill: rgba(cv('--green'), 0.09) }, svg);
  el('path', { d: polyPath(all.map((v, i) => [X(lo + (hi - lo) * i / 400), Y(v)])), fill: 'none', stroke: cv('--dim'), 'stroke-width': 1.3 }, svg);
  const inPts = [];
  for (let i = 0; i <= 300; i++) { const x = a + (b - a) * i / 300; inPts.push([X(x), Y(CIf(x))]); }
  el('path', { d: polyPath(inPts), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.4 }, svg);
  const cand = [];
  [-1, 3].forEach((x) => { if (x > a + 1e-9 && x < b - 1e-9) cand.push({ x, v: CIf(x), kind: 'critical' }); });
  cand.push({ x: a, v: CIf(a), kind: 'endpoint' }, { x: b, v: CIf(b), kind: 'endpoint' });
  cand.sort((p, q) => p.x - q.x);
  const best = cand.reduce((p, c) => (c.v > p.v ? c : p), cand[0]);
  const worst = cand.reduce((p, c) => (c.v < p.v ? c : p), cand[0]);
  cand.forEach((c) => el('circle', { cx: X(c.x), cy: Y(c.v), r: 4, fill: c.kind === 'critical' ? cv('--amber') : cv('--muted') }, svg));
  el('circle', { cx: X(best.x), cy: Y(best.v), r: 7.5, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
  el('circle', { cx: X(worst.x), cy: Y(worst.v), r: 7.5, fill: 'none', stroke: cv('--red'), 'stroke-width': 2.4 }, svg);
  txt(34, 258, "f(x) = x³ − 3x² − 9x + 5     f ′(x) = 3(x−3)(x+1)", cv('--muted'), svg);
  read('ciread', `<span>interval [<b>${fmt(a, 1)}</b>, <b>${fmt(b, 1)}</b>]</span><span>max = <b>${fmt(best.v, 2)}</b> at x = ${fmt(best.x, 2)}</span><span>min = <b>${fmt(worst.v, 2)}</b> at x = ${fmt(worst.x, 2)}</span>`);
  let rows = '<table class="formula-table"><tr><th>candidate</th><th>type</th><th>f</th></tr>';
  cand.forEach((c) => {
    const tag = c === best ? ' class="g"' : c === worst ? ' class="r"' : '';
    rows += `<tr><td>x = ${fmt(c.x, 2)}</td><td>${c.kind}</td><td${tag}>${fmt(c.v, 2)}${c === best ? ' ← max' : c === worst ? ' ← min' : ''}</td></tr>`;
  });
  put('citable', rows + '</table>');
}
window.ciSet = (a, b) => { setS([['ci_a', a, 1], ['ci_b', b, 1]]); ciDraw(); };

/* ============================================================
   03 · chord test for concavity / convexity
   ============================================================ */
const CXS = {
  sq: { n: 'x²', f: (x) => x * x, lo: -2.7, hi: 2.7, cls: 'convex' },
  ln: { n: 'ln x', f: (x) => (x <= 0.12 ? NaN : Math.log(x)), lo: 0.12, hi: 2.7, cls: 'concave' },
  exp: { n: '0.5·eˣ', f: (x) => 0.5 * Math.exp(x), lo: -2.7, hi: 2.2, cls: 'convex' },
  sqrt: { n: '√x', f: (x) => (x < 0 ? NaN : Math.sqrt(x)), lo: 0, hi: 2.7, cls: 'concave' },
  cub: { n: 'x³/3', f: (x) => x * x * x / 3, lo: -2.7, hi: 2.7, cls: 'neither' },
  wave: { n: 'sin 2x + 0.15x', f: (x) => Math.sin(2 * x) + 0.15 * x, lo: -2.7, hi: 2.7, cls: 'neither' },
  abs: { n: '−|x|', f: (x) => -Math.abs(x), lo: -2.7, hi: 2.7, cls: 'concave' },
};
let cxKey = 'sq';
function cxDraw() {
  const svg = document.getElementById('cxsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = CXS[cxKey];
  let x1 = clamp(val('cx_1'), m.lo + 0.02, m.hi - 0.02);
  let x2 = clamp(val('cx_2'), m.lo + 0.02, m.hi - 0.02);
  if (Math.abs(x2 - x1) < 0.15) x2 = clamp(x1 + 0.4, m.lo + 0.02, m.hi - 0.02);
  const showT = document.getElementById('cx_t')?.checked;
  const X = (x) => 34 + (x - m.lo) * (412 / (m.hi - m.lo));
  const N = 360, vals = [];
  for (let i = 0; i <= N; i++) vals.push(m.f(m.lo + (m.hi - m.lo) * i / N));
  const chordAt = (x) => m.f(x1) + (m.f(x2) - m.f(x1)) * (x - x1) / (x2 - x1);
  const Y = bandScale(vals.concat([m.f(x1), m.f(x2)]), 26, 232);
  el('rect', { x: 28, y: 20, width: 422, height: 218, fill: 'none', stroke: cv('--border') }, svg);
  if (Y(0) > 20 && Y(0) < 238) el('line', { x1: 28, y1: Y(0), x2: 450, y2: Y(0), stroke: cv('--border2') }, svg);
  el('path', { d: polyPath(vals.map((v, i) => [X(m.lo + (m.hi - m.lo) * i / N), Y(v)])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.4 }, svg);
  // tangent at x1 (numeric derivative)
  if (showT) {
    const h = 0.004, d1 = (m.f(x1 + h) - m.f(x1 - h)) / (2 * h);
    if (isFinite(d1)) {
      // keep the tangent inside the plotted band: cap its rise as well as its run
      const span = Math.min((m.hi - m.lo) * 0.42, Math.abs(d1) > 1e-6 ? (Y.hi - Y.lo) * 0.42 / Math.abs(d1) : Infinity);
      el('line', { x1: X(x1 - span), y1: Y(m.f(x1) - d1 * span), x2: X(x1 + span), y2: Y(m.f(x1) + d1 * span), stroke: cv('--green'), 'stroke-width': 1.6, 'stroke-dasharray': '5 3' }, svg);
    }
  }
  // chord
  el('line', { x1: X(x1), y1: Y(m.f(x1)), x2: X(x2), y2: Y(m.f(x2)), stroke: cv('--amber'), 'stroke-width': 2.2 }, svg);
  el('circle', { cx: X(x1), cy: Y(m.f(x1)), r: 4.5, fill: cv('--amber') }, svg);
  el('circle', { cx: X(x2), cy: Y(m.f(x2)), r: 4.5, fill: cv('--amber') }, svg);
  // midpoint gap
  const xm = (x1 + x2) / 2, fv = m.f(xm), cvv = chordAt(xm);
  el('line', { x1: X(xm), y1: Y(fv), x2: X(xm), y2: Y(cvv), stroke: fv >= cvv ? cv('--green') : cv('--red'), 'stroke-width': 3 }, svg);
  el('circle', { cx: X(xm), cy: Y(fv), r: 3.5, fill: cv('--blue') }, svg);
  txt(34, 254, 'f(x) = ' + m.n, cv('--blue'), svg);
  // global verdict by sampling many pairs
  let anyAbove = false, anyBelow = false;
  for (let i = 0; i < 24; i++) for (let j = i + 2; j < 26; j++) {
    const p = m.lo + (m.hi - m.lo) * i / 25, q = m.lo + (m.hi - m.lo) * j / 25, r = (p + q) / 2;
    const fr = m.f(r), cr = m.f(p) + (m.f(q) - m.f(p)) * (r - p) / (q - p);
    if (!isFinite(fr) || !isFinite(cr)) continue;
    if (fr > cr + 1e-9) anyAbove = true;
    if (fr < cr - 1e-9) anyBelow = true;
  }
  const verdict = anyAbove && anyBelow ? '<span class="r">neither — some chords above, some below</span>'
    : anyAbove ? '<span class="g">concave on this domain</span>'
      : anyBelow ? '<span class="b">convex on this domain</span>'
        : '<span>affine — both concave and convex</span>';
  const rel = fv > cvv + 1e-9 ? '<span class="g">curve above chord</span>' : fv < cvv - 1e-9 ? '<span class="r">curve below chord</span>' : '<span>equal</span>';
  read('cxread', `<span>at the midpoint x = ${fmt(xm)}</span><span>f = <b>${fmt(fv, 3)}</b></span><span>chord = <b>${fmt(cvv, 3)}</b></span>${rel}${verdict}`);
}
window.cxPick = (k) => { cxKey = k; cxDraw(); };

/* ============================================================
   04 · FOC: contour plus the two axis slices
   ============================================================ */
const FOS = {
  bowl: { n: 'x² + y²', f: (x, y) => x * x + y * y, g: (x, y) => [2 * x, 2 * y], s: [0, 0], w: 'minimum' },
  dome: { n: '−x² − y²', f: (x, y) => -x * x - y * y, g: (x, y) => [-2 * x, -2 * y], s: [0, 0], w: 'maximum' },
  saddle: { n: 'x² − y²', f: (x, y) => x * x - y * y, g: (x, y) => [2 * x, -2 * y], s: [0, 0], w: 'saddle' },
  tilt: { n: '−x² − y² + xy + 2x', f: (x, y) => -x * x - y * y + x * y + 2 * x, g: (x, y) => [-2 * x + y + 2, -2 * y + x], s: [4 / 3, 2 / 3], w: 'maximum' },
};
let foKey = 'bowl';
function foDraw() {
  const svg = document.getElementById('fosvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = FOS[foKey], px = val('fo_x'), py = val('fo_y');
  const lo = -2.8, hi = 2.8;
  const X = (x) => 20 + (x - lo) * (180 / (hi - lo));
  const Y = (y) => 200 - (y - lo) * (180 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 180, height: 180, fill: 'none', stroke: cv('--border') }, svg);
  drawContours(svg, m.f, lo, hi, lo, hi, X, Y, 10, 42);
  el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  el('rect', { x: X(lo) + 2, y: Y(hi) + 2, width: 8.1 * m.n.length + 6, height: 16, fill: bgOfFig(svg), opacity: 0.85 }, svg);
  txt(X(lo) + 6, Y(hi) + 14, m.n, cv('--text'), svg);
  // slice guides
  el('line', { x1: X(lo), y1: Y(py), x2: X(hi), y2: Y(py), stroke: cv('--blue'), 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, svg);
  el('line', { x1: X(px), y1: Y(lo), x2: X(px), y2: Y(hi), stroke: cv('--amber'), 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, svg);
  const [gx, gy] = m.g(px, py), nrm = Math.hypot(gx, gy);
  if (nrm > 1e-4) {
    const L = clamp(nrm * 13, 20, 58);
    arrow(svg, X(px), Y(py), X(px) + (gx / nrm) * L, Y(py) - (gy / nrm) * L, cv('--green'), 2.4);
  }
  el('circle', { cx: X(px), cy: Y(py), r: 4.5, fill: cv('--red') }, svg);
  txt(20, 224, 'contours of f', cv('--muted'), svg);
  // slices
  const N = 200;
  const sxv = [], syv = [];
  for (let i = 0; i <= N; i++) { const t = lo + (hi - lo) * i / N; sxv.push(m.f(t, py)); syv.push(m.f(px, t)); }
  const XR = (t) => 244 + (t - lo) * (200 / (hi - lo));
  const panel = (vals, top, bot, col, label) => {
    const Yp = bandScale(vals, top + 16, bot - 8);
    el('rect', { x: 240, y: top, width: 208, height: bot - top, fill: 'none', stroke: cv('--border') }, svg);
    txt(246, top + 13, label, col, svg);
    if (Yp(0) > top && Yp(0) < bot) el('line', { x1: 240, y1: Yp(0), x2: 448, y2: Yp(0), stroke: cv('--border2') }, svg);
    el('path', { d: polyPath(vals.map((v, i) => [XR(lo + (hi - lo) * i / N), Yp(v)])), fill: 'none', stroke: col, 'stroke-width': 2.2 }, svg);
    return Yp;
  };
  const Y1 = panel(sxv, 20, 148, cv('--blue'), 'slice  f(x, y₀)   — vary x');
  const Y2 = panel(syv, 160, 288, cv('--amber'), 'slice  f(x₀, y)   — vary y');
  // tangents on the slices
  const h = 0.004;
  const d1 = (m.f(px + h, py) - m.f(px - h, py)) / (2 * h);
  const d2 = (m.f(px, py + h) - m.f(px, py - h)) / (2 * h);
  const sp = 0.95;
  el('line', { x1: XR(px - sp), y1: Y1(m.f(px, py) - d1 * sp), x2: XR(px + sp), y2: Y1(m.f(px, py) + d1 * sp), stroke: cv('--red'), 'stroke-width': 1.8 }, svg);
  el('circle', { cx: XR(px), cy: Y1(m.f(px, py)), r: 4, fill: cv('--red') }, svg);
  el('line', { x1: XR(py - sp), y1: Y2(m.f(px, py) - d2 * sp), x2: XR(py + sp), y2: Y2(m.f(px, py) + d2 * sp), stroke: cv('--red'), 'stroke-width': 1.8 }, svg);
  el('circle', { cx: XR(py), cy: Y2(m.f(px, py)), r: 4, fill: cv('--red') }, svg);
  const flat = Math.abs(gx) < 0.02 && Math.abs(gy) < 0.02;
  read('foread', `<span>f = <b>${fmt(m.f(px, py), 3)}</b></span><span>f<sub>x</sub> = <b>${fmt(gx, 3)}</b></span><span>f<sub>y</sub> = <b>${fmt(gy, 3)}</b></span>${flat ? `<span class="g">∇f = 0 — stationary point (${m.w})</span>` : '<span class="a">∇f ≠ 0 — the arrow points uphill, so this is not an optimum</span>'}`);
}
window.foPick = (k) => { foKey = k; foDraw(); };
window.foSolve = () => { const m = FOS[foKey]; setS([['fo_x', m.s[0], 2], ['fo_y', m.s[1], 2]]); foDraw(); };

/* ============================================================
   05 · quadratic form: contours + value in every direction
   ============================================================ */
function hsDraw() {
  const svg = document.getElementById('hssvg'); if (!svg) return;
  svg.innerHTML = '';
  const a = val('hs_a'), b = val('hs_b'), c = val('hs_c');
  const Q = (x, y) => a * x * x + 2 * b * x * y + c * y * y;
  const lo = -2.5, hi = 2.5;
  const X = (x) => 20 + (x - lo) * (180 / (hi - lo));
  const Y = (y) => 220 - (y - lo) * (180 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 180, height: 180, fill: 'none', stroke: cv('--border') }, svg);
  drawContours(svg, Q, lo, hi, lo, hi, X, Y, 12, 44);
  el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  // eigen-decomposition
  const tr = a + c, det = a * c - b * b;
  const disc = Math.sqrt(Math.max(0, (a - c) * (a - c) + 4 * b * b));
  const l1 = (tr + disc) / 2, l2 = (tr - disc) / 2;
  const evec = (l) => { let v = [b, l - a]; if (Math.hypot(v[0], v[1]) < 1e-8) v = [l - c, b]; if (Math.hypot(v[0], v[1]) < 1e-8) v = [1, 0]; const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; };
  [l1, l2].forEach((l) => {
    const [ux, uy] = evec(l);
    el('line', { x1: X(-2.3 * ux), y1: Y(-2.3 * uy), x2: X(2.3 * ux), y2: Y(2.3 * uy), stroke: cv('--green'), 'stroke-width': 1.4, 'stroke-dasharray': '5 3', opacity: 0.9 }, svg);
  });
  el('circle', { cx: X(0), cy: Y(0), r: 4, fill: cv('--red') }, svg);
  txt(20, 240, 'contours of hᵀH h', cv('--muted'), svg);
  // right panel: Q on the unit circle
  const M = 240, qs = [];
  for (let i = 0; i <= M; i++) { const th = 2 * Math.PI * i / M; qs.push(Q(Math.cos(th), Math.sin(th))); }
  const XR = (i) => 244 + (i / M) * 202;
  const YR = bandScale(qs.concat([0]), 46, 230);
  el('rect', { x: 240, y: 30, width: 210, height: 210, fill: 'none', stroke: cv('--border') }, svg);
  txt(246, 44, 'hᵀH h  in direction h', cv('--muted'), svg);
  el('line', { x1: 240, y1: YR(0), x2: 450, y2: YR(0), stroke: cv('--border2'), 'stroke-width': 1.4 }, svg);
  txt(246, YR(0) - 5, '0', cv('--muted'), svg);
  // shade above / below zero
  let dp = '', dn = '';
  for (let i = 0; i < M; i++) {
    const seg = `M ${XR(i)} ${YR(0)} L ${XR(i)} ${YR(qs[i])} L ${XR(i + 1)} ${YR(qs[i + 1])} L ${XR(i + 1)} ${YR(0)} Z `;
    if (qs[i] >= 0 && qs[i + 1] >= 0) dp += seg; else if (qs[i] <= 0 && qs[i + 1] <= 0) dn += seg;
  }
  if (dp) el('path', { d: dp, fill: rgba(cv('--green'), 0.17) }, svg);
  if (dn) el('path', { d: dn, fill: rgba(cv('--red'), 0.17) }, svg);
  el('path', { d: polyPath(qs.map((v, i) => [XR(i), YR(v)])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.3 }, svg);
  [l1, l2].forEach((l) => { el('line', { x1: 240, y1: YR(l), x2: 450, y2: YR(l), stroke: cv('--amber'), 'stroke-dasharray': '3 3', opacity: 0.8 }, svg); });
  txt(442, YR(l1) - 5, 'λmax', cv('--amber'), svg, 'end');
  txt(442, YR(l2) + 13, 'λmin', cv('--amber'), svg, 'end');
  // classification
  let cls, note;
  const eps = 1e-9;
  if (det > eps && a > 0) { cls = 'positive definite'; note = '<span class="b">⇒ local <b>minimum</b></span>'; }
  else if (det > eps && a < 0) { cls = 'negative definite'; note = '<span class="g">⇒ local <b>maximum</b></span>'; }
  else if (det < -eps) { cls = 'indefinite'; note = '<span class="a">⇒ <b>saddle point</b></span>'; }
  else { cls = (l1 > eps || l2 > eps) ? 'positive semidefinite' : (l1 < -eps || l2 < -eps) ? 'negative semidefinite' : 'zero'; note = '<span class="r">⇒ <b>inconclusive</b> — the form vanishes in one direction</span>'; }
  read('hsread', `<span>H = [[${fmt(a, 1)}, ${fmt(b, 1)}], [${fmt(b, 1)}, ${fmt(c, 1)}]]</span><span><b>${cls}</b></span>${note}`);
  put('hstable', `<table class="formula-table">
    <tr><td>D₁ = a</td><td>${fmt(a, 2)} ${a > 0 ? '&gt; 0' : a < 0 ? '&lt; 0' : '= 0'}</td></tr>
    <tr><td>D₂ = det H</td><td>${fmt(det, 3)} ${det > 0 ? '&gt; 0' : det < 0 ? '&lt; 0' : '= 0'}</td></tr>
    <tr><td>trace</td><td>${fmt(tr, 2)}</td></tr>
    <tr><td>eigenvalues</td><td>${fmt(l2, 3)} , ${fmt(l1, 3)}</td></tr>
    <tr><td>range of hᵀH h</td><td>[${fmt(Math.min(...qs), 2)} , ${fmt(Math.max(...qs), 2)}]</td></tr>
  </table>`);
}
window.hsSet = (a, b, c) => { setS([['hs_a', a, 1], ['hs_b', b, 1], ['hs_c', c, 1]]); hsDraw(); };

/* ============================================================
   06 · gradient ascent, concave vs multimodal
   ============================================================ */
const GAS = {
  conc: { n: 'concave', f: (x) => -0.3 * x * x + 0.5 * x + 3, d: (x) => -0.6 * x + 0.5 },
  two: { n: 'two humps', f: (x) => -0.05 * x ** 4 + 0.5 * x * x + 0.3 * x + 2, d: (x) => -0.2 * x ** 3 + x + 0.3 },
  wave: { n: 'many local maxima', f: (x) => 1.4 * Math.sin(2 * x) - 0.1 * x * x, d: (x) => 2.8 * Math.cos(2 * x) - 0.2 * x },
};
let gaKey = 'conc';
function gaDraw() {
  const svg = document.getElementById('gasvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = GAS[gaKey], x0 = val('ga_x'), al = val('ga_s');
  const lo = -4.2, hi = 4.2;
  const X = (x) => 32 + (x - lo) * (414 / (hi - lo));
  const N = 400, vals = [];
  for (let i = 0; i <= N; i++) vals.push(m.f(lo + (hi - lo) * i / N));
  const Y = bandScale(vals, 24, 214);
  el('rect', { x: 26, y: 18, width: 424, height: 202, fill: 'none', stroke: cv('--border') }, svg);
  el('path', { d: polyPath(vals.map((v, i) => [X(lo + (hi - lo) * i / N), Y(v)])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.4 }, svg);
  // true global max by dense scan
  let gx = lo, gv = -Infinity;
  for (let i = 0; i <= 2000; i++) { const x = lo + (hi - lo) * i / 2000, v = m.f(x); if (v > gv) { gv = v; gx = x; } }
  // iterate
  let x = x0; const path = [x];
  for (let k = 0; k < 60; k++) {
    const nx = clamp(x + al * m.d(x), lo, hi);
    if (!isFinite(nx)) break;
    path.push(nx);
    if (Math.abs(nx - x) < 1e-7) { x = nx; break; }
    x = nx;
  }
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i], q = path[i + 1];
    el('line', { x1: X(p), y1: Y(m.f(p)), x2: X(q), y2: Y(m.f(q)), stroke: rgba(cv('--amber'), 0.55), 'stroke-width': 1.2 }, svg);
  }
  path.forEach((p, i) => el('circle', { cx: X(p), cy: Y(m.f(p)), r: i === 0 ? 4.5 : 2.6, fill: i === 0 ? cv('--muted') : cv('--amber') }, svg));
  el('circle', { cx: X(gx), cy: Y(gv), r: 8, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
  el('circle', { cx: X(x), cy: Y(m.f(x)), r: 6, fill: 'none', stroke: cv('--red'), 'stroke-width': 2.2 }, svg);
  txt(32, 236, 'start ●   iterates ●   global max ○(green)   converged ○(red)', cv('--muted'), svg);
  const found = m.f(x), gap = gv - found;
  const ok = gap < 1e-3;
  read('garead', `<span>${m.n}</span><span>start x₀ = <b>${fmt(x0)}</b></span><span>converged to x = <b>${fmt(x, 3)}</b>, f = <b>${fmt(found, 3)}</b></span><span>true global max f = <b>${fmt(gv, 3)}</b> at x = ${fmt(gx, 3)}</span>${ok ? '<span class="g">found the global maximum</span>' : `<span class="r">stuck in a local maximum — short by ${fmt(gap, 3)}</span>`}`);
}
window.gaPick = (k) => { gaKey = k; gaDraw(); };

/* ============================================================
   07 · Lagrange tangency
   ============================================================ */
const LGS = {
  prod: {
    n: 'max xy  s.t.  x + y = 4', lo: -0.3, hi: 4.4, kind: 'max',
    f: (x, y) => x * y, gf: (x, y) => [y, x],
    g: (x, y) => x + y, gg: () => [1, 1],
    P: (t) => { const x = 0.25 + t * 3.5; return [x, 4 - x]; }, tOpt: (2 - 0.25) / 3.5,
  },
  sum: {
    n: 'max x + y  s.t.  x² + y² = 4', lo: -2.7, hi: 2.7, kind: 'max',
    f: (x, y) => x + y, gf: () => [1, 1],
    g: (x, y) => x * x + y * y, gg: (x, y) => [2 * x, 2 * y],
    P: (t) => { const th = t * 2 * Math.PI; return [2 * Math.cos(th), 2 * Math.sin(th)]; }, tOpt: 0.125,
  },
  dist: {
    n: 'min x² + y²  s.t.  x + 2y = 5', lo: -1.2, hi: 4.6, kind: 'min',
    f: (x, y) => -(x * x + y * y), gf: (x, y) => [-2 * x, -2 * y],
    g: (x, y) => x + 2 * y, gg: () => [1, 2],
    P: (t) => { const x = -0.8 + t * 4.6; return [x, (5 - x) / 2]; }, tOpt: (1 + 0.8) / 4.6,
  },
};
let lgKey = 'prod';
function lgDraw() {
  const svg = document.getElementById('lgsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = LGS[lgKey], t = val('lg_t');
  const lo = m.lo, hi = m.hi;
  const X = (x) => 20 + (x - lo) * (190 / (hi - lo));
  const Y = (y) => 215 - (y - lo) * (190 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 190, height: 190, fill: 'none', stroke: cv('--border') }, svg);
  drawContours(svg, m.f, lo, hi, lo, hi, X, Y, 11, 44);
  if (lo < 0 && hi > 0) {
    el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
    el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  }
  // constraint curve
  const cpts = [];
  for (let i = 0; i <= 300; i++) { const [x, y] = m.P(i / 300); cpts.push([X(x), Y(y)]); }
  el('path', { d: polyPath(cpts), fill: 'none', stroke: cv('--amber'), 'stroke-width': 2.6 }, svg);
  const [px, py] = m.P(t);
  const [fx, fy] = m.gf(px, py), [gx, gy] = m.gg(px, py);
  const nf = Math.hypot(fx, fy), ng = Math.hypot(gx, gy);
  if (nf > 1e-6) arrow(svg, X(px), Y(py), X(px) + (fx / nf) * 44, Y(py) - (fy / nf) * 44, cv('--green'), 2.4);
  if (ng > 1e-6) arrow(svg, X(px), Y(py), X(px) + (gx / ng) * 34, Y(py) - (gy / ng) * 34, cv('--red'), 2.2);
  el('circle', { cx: X(px), cy: Y(py), r: 4.5, fill: cv('--text') }, svg);
  el('rect', { x: X(lo) + 2, y: Y(hi) + 2, width: 6.6 * m.n.length + 6, height: 16, fill: bgOfFig(svg), opacity: 0.85 }, svg);
  txt(X(lo) + 6, Y(hi) + 14, m.n, cv('--text'), svg, undefined);
  txt(20, 238, '∇f green    ∇g red', cv('--muted'), svg);
  // right panel: f along the constraint
  const M = 260, fs = [];
  for (let i = 0; i <= M; i++) { const [x, y] = m.P(i / M); fs.push(m.f(x, y)); }
  const XR = (u) => 244 + u * 202;
  const YR = bandScale(fs, 46, 222);
  el('rect', { x: 240, y: 30, width: 210, height: 200, fill: 'none', stroke: cv('--border') }, svg);
  txt(246, 44, m.kind === 'min' ? 'f along the constraint (plotted as −distance²)' : 'f along the constraint', cv('--muted'), svg);
  el('path', { d: polyPath(fs.map((v, i) => [XR(i / M), YR(v)])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.3 }, svg);
  // best point along the constraint
  let bi = 0; for (let i = 0; i <= M; i++) if (fs[i] > fs[bi]) bi = i;
  el('line', { x1: XR(bi / M), y1: 30, x2: XR(bi / M), y2: 230, stroke: cv('--green'), 'stroke-dasharray': '3 3' }, svg);
  el('circle', { cx: XR(bi / M), cy: YR(fs[bi]), r: 5, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.2 }, svg);
  el('circle', { cx: XR(t), cy: YR(m.f(px, py)), r: 4.5, fill: cv('--amber') }, svg);
  txt(246, 246, 'position along the constraint →', cv('--muted'), svg);
  // readout
  const dot = fx * gx + fy * gy;
  const cosang = nf > 1e-9 && ng > 1e-9 ? clamp(dot / (nf * ng), -1, 1) : 1;
  const ang = Math.acos(cosang) * 180 / Math.PI;
  const lam = ng > 1e-9 ? dot / (ng * ng) : NaN;
  const par = ang < 1.2 || ang > 178.8;
  read('lgread', `<span>point ( <b>${fmt(px)}</b>, <b>${fmt(py)}</b> )</span><span>f = <b>${fmt(m.kind === 'min' ? -m.f(px, py) : m.f(px, py), 3)}</b>${m.kind === 'min' ? ' (the quantity being minimised)' : ''}</span><span>∇f = (${fmt(fx)}, ${fmt(fy)})</span><span>∇g = (${fmt(gx)}, ${fmt(gy)})</span><span>angle between them = <b>${fmt(ang, 1)}°</b></span>${par ? `<span class="g">parallel ⇒ Lagrange condition holds, λ = <b>${fmt(lam, 3)}</b></span>` : '<span class="a">not parallel ⇒ you can still improve by moving along the constraint</span>'}`);
}
window.lgPick = (k) => { lgKey = k; setS([['lg_t', 0.18, 3]]); lgDraw(); };
window.lgSolve = () => { setS([['lg_t', LGS[lgKey].tOpt, 3]]); lgDraw(); };

/* ============================================================
   08 · feasible vs infeasible direction (constrained SOC)
   ============================================================ */
function bhDraw() {
  const svg = document.getElementById('bhsvg'); if (!svg) return;
  svg.innerHTML = '';
  const t = val('bh_t');
  const f = (x, y) => x * y;
  const lo = -0.3, hi = 4.4;
  const X = (x) => 20 + (x - lo) * (190 / (hi - lo));
  const Y = (y) => 215 - (y - lo) * (190 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 190, height: 190, fill: 'none', stroke: cv('--border') }, svg);
  drawContours(svg, f, lo, hi, lo, hi, X, Y, 11, 44);
  // constraint x + y = 4
  el('line', { x1: X(0.05), y1: Y(3.95), x2: X(3.95), y2: Y(0.05), stroke: cv('--amber'), 'stroke-width': 2.6 }, svg);
  const px = t, py = 4 - t;
  const s2 = Math.SQRT1_2;
  // feasible direction (1,-1)/√2 ; perpendicular (1,1)/√2
  el('line', { x1: X(px - 1.1 * s2), y1: Y(py + 1.1 * s2), x2: X(px + 1.1 * s2), y2: Y(py - 1.1 * s2), stroke: cv('--green'), 'stroke-width': 2 }, svg);
  el('line', { x1: X(px - 1.1 * s2), y1: Y(py - 1.1 * s2), x2: X(px + 1.1 * s2), y2: Y(py + 1.1 * s2), stroke: cv('--red'), 'stroke-width': 2, 'stroke-dasharray': '5 3' }, svg);
  arrow(svg, X(px), Y(py), X(px) + (py / Math.hypot(px, py)) * 40, Y(py) - (px / Math.hypot(px, py)) * 40, cv('--blue'), 2);
  el('circle', { cx: X(px), cy: Y(py), r: 4.5, fill: cv('--text') }, svg);
  txt(20, 236, 'contours of xy', cv('--muted'), svg);
  txt(20, 250, 'green = feasible', cv('--green'), svg);
  // profiles
  const M = 160, sr = 1.4;
  const p1 = [], p2 = [];
  for (let i = 0; i <= M; i++) {
    const s = -sr + 2 * sr * i / M;
    p1.push(f(px + s * s2, py - s * s2));
    p2.push(f(px + s * s2, py + s * s2));
  }
  const XR = (i) => 244 + (i / M) * 202;
  const mk = (vals, top, bot, col, label) => {
    const Yp = bandScale(vals, top + 18, bot - 10);
    el('rect', { x: 240, y: top, width: 210, height: bot - top, fill: 'none', stroke: cv('--border') }, svg);
    txt(246, top + 14, label, col, svg);
    el('path', { d: polyPath(vals.map((v, i) => [XR(i), Yp(v)])), fill: 'none', stroke: col, 'stroke-width': 2.3 }, svg);
    el('line', { x1: XR(M / 2), y1: top + 2, x2: XR(M / 2), y2: bot - 2, stroke: cv('--muted'), 'stroke-dasharray': '2 4' }, svg);
    el('circle', { cx: XR(M / 2), cy: Yp(vals[M / 2]), r: 4.5, fill: cv('--text') }, svg);
    return Yp;
  };
  mk(p1, 26, 152, cv('--green'), 'along the constraint  (feasible)');
  mk(p2, 164, 290, cv('--red'), 'perpendicular  (infeasible)');
  const slopeF = py * s2 + px * (-s2);          // ∇f · d1
  const slopeP = py * s2 + px * s2;             // ∇f · d2
  const curvF = 2 * s2 * (-s2);                 // d1ᵀ H d1  = -1
  const atOpt = Math.abs(px - 2) < 0.02;
  read('bhread', `<span>point (<b>${fmt(px)}</b>, <b>${fmt(py)}</b>)</span><span>∇f = (${fmt(py)}, ${fmt(px)}) ≠ 0</span><span>slope along the constraint = <b>${fmt(slopeF, 3)}</b></span><span>slope perpendicular = <b>${fmt(slopeP, 3)}</b></span><span>curvature along the constraint = <b>${fmt(curvF, 2)}</b> &lt; 0</span>${atOpt ? '<span class="g">constrained optimum: flat and curving down along the constraint</span>' : '<span class="a">not yet optimal — the constraint profile still slopes</span>'}<span class="r">unconstrained det H = −1 &lt; 0 ⇒ the ordinary test says "saddle"</span>`);
}
window.bhSolve = () => { setS([['bh_t', 2, 2]]); bhDraw(); };

/* ============================================================
   09 · shadow price: the value function and its slope
   ============================================================ */
const SPS = {
  prod: {
    n: 'max xy  s.t.  x + y = c', lo: -0.4, hi: 8.6,
    f: (x, y) => x * y, sol: (c) => [c / 2, c / 2], V: (c) => c * c / 4, lam: (c) => c / 2,
    con: (c, t) => { const x = 0.02 + t * (c - 0.04); return [x, c - x]; },
  },
  cobb: {
    n: 'max √(xy)  s.t.  x + y = c', lo: -0.4, hi: 8.6,
    f: (x, y) => (x > 0 && y > 0 ? Math.sqrt(x * y) : NaN), sol: (c) => [c / 2, c / 2], V: (c) => c / 2, lam: () => 0.5,
    con: (c, t) => { const x = 0.02 + t * (c - 0.04); return [x, c - x]; },
  },
  circ: {
    n: 'max x + y  s.t.  x² + y² = c', lo: -3.1, hi: 3.1,
    f: (x, y) => x + y, sol: (c) => [Math.sqrt(c / 2), Math.sqrt(c / 2)], V: (c) => Math.sqrt(2 * c), lam: (c) => 1 / Math.sqrt(2 * c),
    con: (c, t) => { const th = t * 2 * Math.PI, r = Math.sqrt(c); return [r * Math.cos(th), r * Math.sin(th)]; },
  },
};
let spKey = 'prod';
function spDraw() {
  const svg = document.getElementById('spsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = SPS[spKey], c = val('sp_c');
  const lo = m.lo, hi = m.hi;
  const X = (x) => 20 + (x - lo) * (190 / (hi - lo));
  const Y = (y) => 215 - (y - lo) * (190 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 190, height: 190, fill: 'none', stroke: cv('--border') }, svg);
  drawContours(svg, m.f, lo, hi, lo, hi, X, Y, 11, 44);
  if (lo < 0) {
    el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
    el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  }
  // path traced by the optimum as c varies
  const pathPts = [];
  for (let i = 0; i <= 100; i++) { const cc = 1 + 7 * i / 100; const [x, y] = m.sol(cc); pathPts.push([X(x), Y(y)]); }
  el('path', { d: polyPath(pathPts), fill: 'none', stroke: cv('--green'), 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, svg);
  // constraint at level c
  const cp = [];
  for (let i = 0; i <= 240; i++) { const [x, y] = m.con(c, i / 240); cp.push([X(x), Y(y)]); }
  el('path', { d: polyPath(cp), fill: 'none', stroke: cv('--amber'), 'stroke-width': 2.6 }, svg);
  const [sx, sy] = m.sol(c);
  el('circle', { cx: X(sx), cy: Y(sy), r: 5, fill: cv('--text') }, svg);
  el('rect', { x: X(lo) + 2, y: Y(hi) + 2, width: 6.6 * m.n.length + 6, height: 16, fill: bgOfFig(svg), opacity: 0.85 }, svg);
  txt(X(lo) + 6, Y(hi) + 14, m.n, cv('--text'), svg);
  // right: V(c)
  const cs = [], vs = [];
  for (let i = 0; i <= 200; i++) { const cc = 1 + 7 * i / 200; cs.push(cc); vs.push(m.V(cc)); }
  const XR = (cc) => 244 + ((cc - 1) / 7) * 202;
  const YR = bandScale(vs, 48, 224);
  el('rect', { x: 240, y: 30, width: 210, height: 200, fill: 'none', stroke: cv('--border') }, svg);
  txt(246, 44, 'value function  V(c)', cv('--green'), svg);
  el('path', { d: polyPath(vs.map((v, i) => [XR(cs[i]), YR(v)])), fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
  const lam = m.lam(c), Vc = m.V(c);
  const dc = 1.6;
  el('line', { x1: XR(Math.max(1, c - dc)), y1: YR(Vc + lam * (Math.max(1, c - dc) - c)), x2: XR(Math.min(8, c + dc)), y2: YR(Vc + lam * (Math.min(8, c + dc) - c)), stroke: cv('--amber'), 'stroke-width': 2 }, svg);
  el('circle', { cx: XR(c), cy: YR(Vc), r: 4.5, fill: cv('--amber') }, svg);
  el('line', { x1: XR(c), y1: 30, x2: XR(c), y2: 230, stroke: cv('--muted'), 'stroke-dasharray': '2 4' }, svg);
  txt(246, 246, 'constraint level c →', cv('--muted'), svg);
  // numeric slope check
  const h = 0.01, num = (m.V(c + h) - m.V(c - h)) / (2 * h);
  const shape = spKey === 'prod' ? 'V is convex — λ rises with c' : spKey === 'cobb' ? 'V is linear — λ is constant' : 'V is concave — λ falls as c rises';
  read('spread', `<span>c = <b>${fmt(c)}</b></span><span>optimum ( ${fmt(sx, 3)} , ${fmt(sy, 3)} )</span><span>V(c) = <b>${fmt(Vc, 4)}</b></span><span>λ from the FOC = <b>${fmt(lam, 4)}</b></span><span>slope of V measured numerically = <b>${fmt(num, 4)}</b></span><span class="g">${shape}</span>`);
}
window.spPick = (k) => { spKey = k; spDraw(); };

/* ============================================================
   10 · KKT: binding vs slack on a triangle
   ============================================================ */
function projSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const t = clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy), 0, 1);
  return [a[0] + t * vx, a[1] + t * vy];
}
function kkDraw() {
  const svg = document.getElementById('kksvg'); if (!svg) return;
  svg.innerHTML = '';
  const a = val('kk_a'), b = val('kk_b');
  const lo = -1.1, hi = 3.4;
  const X = (x) => 40 + (x - lo) * (200 / (hi - lo));
  const Y = (y) => 240 - (y - lo) * (200 / (hi - lo));
  el('rect', { x: X(lo), y: Y(hi), width: 200, height: 200, fill: 'none', stroke: cv('--border') }, svg);
  el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2') }, svg);
  el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2') }, svg);
  // feasible triangle
  el('path', { d: `M ${X(0)} ${Y(0)} L ${X(2)} ${Y(0)} L ${X(0)} ${Y(2)} Z`, fill: rgba(cv('--green'), 0.16), stroke: cv('--green'), 'stroke-width': 1.6 }, svg);
  // solution: projection onto the triangle
  const feas = (p) => p[0] >= -1e-9 && p[1] >= -1e-9 && p[0] + p[1] <= 2 + 1e-9;
  let sol;
  if (feas([a, b])) sol = [a, b];
  else {
    const cands = [projSeg([a, b], [0, 0], [2, 0]), projSeg([a, b], [0, 0], [0, 2]), projSeg([a, b], [2, 0], [0, 2])];
    sol = cands.reduce((best, p) => ((p[0] - a) ** 2 + (p[1] - b) ** 2 < (best[0] - a) ** 2 + (best[1] - b) ** 2 ? p : best), cands[0]);
  }
  const [sx, sy] = sol;
  const tol = 1e-6;
  const act = { budget: Math.abs(sx + sy - 2) < 1e-5, xpos: Math.abs(sx) < 1e-5, ypos: Math.abs(sy) < 1e-5 };
  // multipliers: ∇f = Σ λ_j ∇g_j  with g1=x+y-2, g2=-x, g3=-y
  const gf = [-2 * (sx - a), -2 * (sy - b)];
  const G = [];
  if (act.budget) G.push({ k: 'budget', v: [1, 1] });
  if (act.xpos) G.push({ k: 'xpos', v: [-1, 0] });
  if (act.ypos) G.push({ k: 'ypos', v: [0, -1] });
  const lam = { budget: 0, xpos: 0, ypos: 0 };
  if (G.length === 1) {
    const g = G[0].v, d = g[0] * g[0] + g[1] * g[1];
    lam[G[0].k] = (gf[0] * g[0] + gf[1] * g[1]) / d;
  } else if (G.length === 2) {
    const [p, q] = G, det = p.v[0] * q.v[1] - p.v[1] * q.v[0];
    if (Math.abs(det) > 1e-9) {
      lam[p.k] = (gf[0] * q.v[1] - gf[1] * q.v[0]) / det;
      lam[q.k] = (p.v[0] * gf[1] - p.v[1] * gf[0]) / det;
    }
  }
  // highlight binding edges
  if (act.budget) el('line', { x1: X(2), y1: Y(0), x2: X(0), y2: Y(2), stroke: cv('--amber'), 'stroke-width': 4 }, svg);
  if (act.xpos) el('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(2), stroke: cv('--amber'), 'stroke-width': 4 }, svg);
  if (act.ypos) el('line', { x1: X(0), y1: Y(0), x2: X(2), y2: Y(0), stroke: cv('--amber'), 'stroke-width': 4 }, svg);
  // level circle through the solution
  const r = Math.hypot(sx - a, sy - b);
  if (r > 0.01) el('circle', { cx: X(a), cy: Y(b), r: r * (200 / (hi - lo)), fill: 'none', stroke: cv('--blue'), 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, svg);
  el('line', { x1: X(a), y1: Y(b), x2: X(sx), y2: Y(sy), stroke: cv('--muted'), 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
  el('circle', { cx: X(a), cy: Y(b), r: 4.5, fill: cv('--red') }, svg);
  el('circle', { cx: X(sx), cy: Y(sy), r: 5, fill: cv('--amber') }, svg);
  txt(X(2) - 4, Y(0) + 14, '2', cv('--dim'), svg);
  txt(X(0) - 12, Y(2) + 4, '2', cv('--dim'), svg);
  txt(40, 262, 'target ● (red)    solution ● (amber)    binding edges thick', cv('--muted'), svg);
  const nBind = Object.values(act).filter(Boolean).length;
  read('kkread', `<span>target ( ${fmt(a)} , ${fmt(b)} )</span><span>solution ( <b>${fmt(sx, 3)}</b> , <b>${fmt(sy, 3)}</b> )</span><span>f* = <b>${fmt(-r * r, 3)}</b></span><span>${nBind === 0 ? '<span class="g">no constraint binds — the unconstrained optimum is feasible</span>' : nBind + ' constraint' + (nBind > 1 ? 's' : '') + ' binding'}</span>`);
  const row = (name, expr, active, l) =>
    `<tr><td>${name}</td><td>${expr}</td><td class="${active ? 'a' : 'muted'}">${active ? 'binding' : 'slack'}</td><td class="${active ? 'g' : 'muted'}">λ = ${fmt(l, 3)}</td></tr>`;
  put('kktable', `<table class="formula-table"><tr><th>constraint</th><th>value</th><th>status</th><th>multiplier</th></tr>
    ${row('x + y ≤ 2', fmt(sx + sy, 3), act.budget, lam.budget)}
    ${row('x ≥ 0', fmt(sx, 3), act.xpos, lam.xpos)}
    ${row('y ≥ 0', fmt(sy, 3), act.ypos, lam.ypos)}
  </table><p class="muted" style="font-size:11.5px;margin-top:4px">Complementary slackness at work: every slack constraint has λ = 0.</p>`);
}
window.kkSet = (a, b) => { setS([['kk_a', a, 2], ['kk_b', b, 2]]); kkDraw(); };

/* ============================================================
   11 · two-asset efficient frontier
   ============================================================ */
const PF = { muA: 0.06, sdA: 0.15, muB: 0.10, sdB: 0.25 };
function pfSig(w, rho) {
  const { sdA, sdB } = PF, cov = rho * sdA * sdB;
  return Math.sqrt(Math.max(0, w * w * sdA * sdA + (1 - w) * (1 - w) * sdB * sdB + 2 * w * (1 - w) * cov));
}
function pfMu(w) { return w * PF.muA + (1 - w) * PF.muB; }
function pfWstar(rho) {
  const { sdA, sdB } = PF, cov = rho * sdA * sdB;
  const den = sdA * sdA + sdB * sdB - 2 * cov;
  return Math.abs(den) < 1e-9 ? 0.5 : (sdB * sdB - cov) / den;
}
function pfDraw() {
  const svg = document.getElementById('pfsvg'); if (!svg) return;
  svg.innerHTML = '';
  const rho = val('pf_r'), w = val('pf_w');
  const ws = [];
  for (let i = 0; i <= 220; i++) ws.push(-0.4 + 1.8 * i / 220);
  const sds = ws.map((v) => pfSig(v, rho));
  const smax = Math.max(0.33, Math.max(...sds) * 1.04);
  const X = (s) => 46 + (s / smax) * 390;
  const mlo = 0.035, mhi = 0.125;
  const Y = (m) => 236 - ((m - mlo) / (mhi - mlo)) * 200;
  el('rect', { x: 40, y: 30, width: 404, height: 212, fill: 'none', stroke: cv('--border') }, svg);
  for (let s = 0; s <= smax; s += 0.05) { el('line', { x1: X(s), y1: 30, x2: X(s), y2: 242, stroke: cv('--border'), opacity: 0.4, 'stroke-width': 0.5 }, svg); txt(X(s) - 8, 256, (s * 100).toFixed(0) + '%', cv('--dim'), svg); }
  for (let mm = 0.04; mm <= 0.121; mm += 0.02) { el('line', { x1: 40, y1: Y(mm), x2: 444, y2: Y(mm), stroke: cv('--border'), opacity: 0.4, 'stroke-width': 0.5 }, svg); txt(14, Y(mm) + 4, (mm * 100).toFixed(0) + '%', cv('--dim'), svg); }
  txt(240, 272, 'risk  σ', cv('--muted'), svg, 'middle');
  txt(16, 24, 'return  μ', cv('--muted'), svg);
  // rho = 1 reference line
  const ref = ws.map((v) => [X(pfSig(v, 1)), Y(pfMu(v))]);
  el('path', { d: polyPath(ref), fill: 'none', stroke: cv('--dim'), 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, svg);
  const wS = pfWstar(rho);
  const lower = [], upper = [];
  ws.forEach((v, i) => { const p = [X(sds[i]), Y(pfMu(v))]; if (v <= wS) upper.push(p); else lower.push(p); });
  el('path', { d: polyPath(lower), fill: 'none', stroke: cv('--dim'), 'stroke-width': 2 }, svg);
  el('path', { d: polyPath(upper), fill: 'none', stroke: cv('--green'), 'stroke-width': 2.6 }, svg);
  // assets and min-variance
  el('circle', { cx: X(PF.sdA), cy: Y(PF.muA), r: 4, fill: cv('--blue') }, svg);
  txt(X(PF.sdA) + 7, Y(PF.muA) + 4, 'A', cv('--blue'), svg);
  el('circle', { cx: X(PF.sdB), cy: Y(PF.muB), r: 4, fill: cv('--blue') }, svg);
  txt(X(PF.sdB) + 7, Y(PF.muB) + 4, 'B', cv('--blue'), svg);
  const sMin = pfSig(wS, rho);
  el('circle', { cx: X(sMin), cy: Y(pfMu(wS)), r: 7.5, fill: 'none', stroke: cv('--green'), 'stroke-width': 2.4 }, svg);
  el('circle', { cx: X(pfSig(w, rho)), cy: Y(pfMu(w)), r: 5, fill: cv('--amber') }, svg);
  const benefit = PF.sdA - sMin;
  read('pfread', `<span>ρ = <b>${fmt(rho)}</b></span><span>current w = <b>${fmt(w)}</b> in A</span><span>μ<sub>p</sub> = <b>${(pfMu(w) * 100).toFixed(2)}%</b>, σ<sub>p</sub> = <b>${(pfSig(w, rho) * 100).toFixed(2)}%</b></span><span>min-variance w* = <b>${fmt(wS, 3)}</b></span><span>σ at w* = <b>${(sMin * 100).toFixed(2)}%</b></span>${benefit > 0.0005 ? `<span class="g">beats holding A alone by ${(benefit * 100).toFixed(2)} pp of risk</span>` : '<span class="a">no diversification benefit at this correlation</span>'}${w <= wS ? '<span class="g">on the efficient branch</span>' : '<span class="r">dominated — same risk is available with more return</span>'}`);
}
window.pfSet = (r) => { setS([['pf_r', r, 2]]); pfDraw(); };
window.pfMin = () => { setS([['pf_w', pfWstar(val('pf_r')), 2]]); pfDraw(); };

/* ---------- wiring ---------- */
bindS('os_a', 2, osDraw); bindS('os_b', 2, osDraw);
bindS('ci_a', 1, ciDraw); bindS('ci_b', 1, ciDraw);
bindS('cx_1', 2, cxDraw); bindS('cx_2', 2, cxDraw);
document.getElementById('cx_t')?.addEventListener('change', cxDraw);
bindS('fo_x', 2, foDraw); bindS('fo_y', 2, foDraw);
bindS('hs_a', 1, hsDraw); bindS('hs_b', 1, hsDraw); bindS('hs_c', 1, hsDraw);
bindS('ga_x', 2, gaDraw); bindS('ga_s', 2, gaDraw);
bindS('lg_t', 3, lgDraw);
bindS('bh_t', 2, bhDraw);
bindS('sp_c', 2, spDraw);
bindS('kk_a', 2, kkDraw); bindS('kk_b', 2, kkDraw);
bindS('pf_r', 2, pfDraw); bindS('pf_w', 2, pfDraw);

function drawAll() {
  osDraw(); ciDraw(); cxDraw(); foDraw(); hsDraw(); gaDraw();
  lgDraw(); bhDraw(); spDraw(); kkDraw(); pfDraw();
}
drawAll();
window.addEventListener('themechange', drawAll);
