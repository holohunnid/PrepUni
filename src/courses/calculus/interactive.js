// Interactive figures for the calculus course. Same conventions as the
// linear-algebra and probability courses: vanilla SVG drawing, colors read from
// CSS variables so theme switches (course.js dispatches 'themechange') repaint.
const NS = 'http://www.w3.org/2000/svg';
function cv(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t) { const a = hex(h1), b = hex(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor) { const t = el('text', { x, y, fill, 'font-size': 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { if (!isFinite(x)) return '∞'; return (+x).toFixed(d); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { document.getElementById(id + '_v').textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { const s = document.getElementById(id); if (!s) continue; s.value = v; document.getElementById(id + '_v').textContent = fmt(v, dec); } }
function val(id) { const s = document.getElementById(id); return s ? parseFloat(s.value) : 0; }
function read(id, html) { const r = document.getElementById(id); if (r) r.innerHTML = html; }

// build a "M..L..L.." path from sampled points, breaking on undefined values
function polyPath(pts) {
  let d = '', pen = false;
  for (const p of pts) {
    if (!p || !isFinite(p[1])) { pen = false; continue; }
    d += (pen ? ' L' : ' M') + ` ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    pen = true;
  }
  return d;
}
// map a set of values into a pixel band [top, bottom], with padding
function bandScale(vals, top, bottom, pad = 0.12) {
  const fin = vals.filter((v) => isFinite(v));
  let lo = Math.min(...fin), hi = Math.max(...fin);
  if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const m = (hi - lo) * pad; lo -= m; hi += m;
  const f = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  f.lo = lo; f.hi = hi;
  return f;
}
function axes(svg, x0, x1, y0, y1, Xz, Yz) {
  if (Yz >= y0 && Yz <= y1) el('line', { x1: x0, y1: Yz, x2: x1, y2: Yz, stroke: cv('--border2') }, svg);
  if (Xz >= x0 && Xz <= x1) el('line', { x1: Xz, y1: y0, x2: Xz, y2: y1, stroke: cv('--border2') }, svg);
}

/* ============================================================
   01 · function transformer  g(x) = a f(b(x-c)) + d
   ============================================================ */
const FNS = {
  quad: { n: 'x²', f: (x) => x * x },
  cube: { n: 'x³', f: (x) => x * x * x },
  sqrt: { n: '√x', f: (x) => (x < 0 ? NaN : Math.sqrt(x)) },
  recip: { n: '1/x', f: (x) => (Math.abs(x) < 0.06 ? NaN : 1 / x) },
  exp: { n: 'eˣ', f: (x) => Math.exp(x) },
  ln: { n: 'ln x', f: (x) => (x <= 0.02 ? NaN : Math.log(x)) },
  sin: { n: 'sin x', f: (x) => Math.sin(x) },
  abs: { n: '|x|', f: (x) => Math.abs(x) },
};
let fnKey = 'quad';
function fnDraw() {
  const svg = document.getElementById('fnsvg'); if (!svg) return;
  svg.innerHTML = '';
  const a = val('fn_a'), b = val('fn_b'), c = val('fn_c'), d = val('fn_d');
  const base = FNS[fnKey];
  const X = (x) => 30 + (x + 5) * 40, Y = (y) => 150 - y * 26;
  const inBox = (y) => (y > 5.4 || y < -5.4 ? NaN : y);
  // grid
  for (let g = -5; g <= 5; g++) {
    el('line', { x1: X(g), y1: 20, x2: X(g), y2: 280, stroke: cv('--border'), 'stroke-width': g === 0 ? 0 : 0.5, opacity: 0.5 }, svg);
    el('line', { x1: 30, y1: Y(g), x2: 430, y2: Y(g), stroke: cv('--border'), 'stroke-width': g === 0 ? 0 : 0.5, opacity: 0.5 }, svg);
  }
  axes(svg, 30, 430, 20, 280, X(0), Y(0));
  txt(434, Y(0) + 4, 'x', cv('--muted'), svg);
  txt(X(0) + 5, 18, 'y', cv('--muted'), svg);
  const basePts = [], newPts = [];
  for (let i = 0; i <= 500; i++) {
    const x = -5 + i * 0.02;
    basePts.push([X(x), Y(inBox(base.f(x)))]);
    const inner = b * (x - c);
    const v = a * base.f(inner) + d;
    newPts.push([X(x), Y(inBox(v))]);
  }
  el('path', { d: polyPath(basePts), fill: 'none', stroke: cv('--dim'), 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, svg);
  el('path', { d: polyPath(newPts), fill: 'none', stroke: cv('--green'), 'stroke-width': 2.2 }, svg);
  const sgn = (v) => (v < 0 ? '− ' + fmt(Math.abs(v), 1) : fmt(v, 1));
  read('fnread', `<span>base: <b>${base.n}</b></span><span>g(x) = ${fmt(a, 1)}·f( ${fmt(b, 1)}(x ${c < 0 ? '+ ' + fmt(-c, 1) : '− ' + fmt(c, 1)}) ) ${d < 0 ? '−' : '+'} ${fmt(Math.abs(d), 1)}</span><span>g(0) = <b>${isFinite(a * base.f(b * (0 - c)) + d) ? fmt(a * base.f(b * -c) + d) : 'undefined'}</b></span>`);
}
window.fnBase = (k) => { fnKey = k; fnDraw(); };
window.fnReset = () => { setS([['fn_a', 1, 1], ['fn_b', 1, 1], ['fn_c', 0, 1], ['fn_d', 0, 1]]); fnDraw(); };

/* ============================================================
   02 · limits: four fates at a = 2
   ============================================================ */
const LIMS = {
  hole: { n: 'removable hole', f: (x) => (Math.abs(x - 2) < 1e-9 ? NaN : x + 2), L: 4, def: false },
  jump: { n: 'jump', f: (x) => (x < 2 ? x + 1 : x + 3.5), L: null, def: true },
  inf: { n: 'blow-up', f: (x) => Math.min(0.4 / ((x - 2) * (x - 2)), 7.4), L: null, def: false },
  ok: { n: 'continuous', f: (x) => x * x / 2 + 1, L: 3, def: true },
};
let lmKey = 'hole';
function lmDraw() {
  const svg = document.getElementById('lmsvg'); if (!svg) return;
  svg.innerHTML = '';
  const dd = val('lm_d'), m = LIMS[lmKey], a = 2;
  const X = (x) => 30 + x * 100, Y = (y) => 220 - (y + 1) * 25;
  axes(svg, 30, 430, 15, 235, X(0), Y(0));
  for (let g = 0; g <= 4; g++) { el('line', { x1: X(g), y1: 15, x2: X(g), y2: 235, stroke: cv('--border'), opacity: 0.5, 'stroke-width': 0.5 }, svg); txt(X(g) - 3, 248, g, cv('--dim'), svg); }
  // delta band
  el('rect', { x: X(a - dd), y: 15, width: X(a + dd) - X(a - dd), height: 220, fill: rgba(cv('--amber'), 0.07) }, svg);
  [a - dd, a + dd].forEach((v) => el('line', { x1: X(v), y1: 15, x2: X(v), y2: 235, stroke: cv('--amber'), 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, svg));
  el('line', { x1: X(a), y1: 15, x2: X(a), y2: 235, stroke: cv('--muted'), 'stroke-width': 1, 'stroke-dasharray': '2 4' }, svg);
  txt(X(a) - 3, 248, 'a', cv('--muted'), svg);
  // limit line
  if (m.L !== null) {
    el('line', { x1: 30, y1: Y(m.L), x2: 430, y2: Y(m.L), stroke: cv('--green'), 'stroke-dasharray': '4 3' }, svg);
    txt(434, Y(m.L) + 4, 'L', cv('--green'), svg);
  }
  // curve, split at a for the jump case
  const seg = (lo, hi) => {
    const p = [];
    for (let i = 0; i <= 240; i++) { const x = lo + (hi - lo) * i / 240; const y = m.f(x); p.push([X(x), y > 7.5 || y < -1.2 ? NaN : Y(y)]); }
    return p;
  };
  el('path', { d: polyPath(seg(0.02, 1.999)), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2 }, svg);
  el('path', { d: polyPath(seg(2.001, 3.98)), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2 }, svg);
  const lv = m.f(a - 1e-7), rv = m.f(a + 1e-7);
  if (lmKey === 'hole') el('circle', { cx: X(a), cy: Y(4), r: 4, fill: bgOfFig(svg), stroke: cv('--blue'), 'stroke-width': 1.5 }, svg);
  if (lmKey === 'jump') { el('circle', { cx: X(a), cy: Y(rv), r: 4, fill: cv('--blue') }, svg); el('circle', { cx: X(a), cy: Y(lv), r: 4, fill: bgOfFig(svg), stroke: cv('--blue'), 'stroke-width': 1.5 }, svg); }
  if (lmKey === 'ok') el('circle', { cx: X(a), cy: Y(3), r: 4, fill: cv('--blue') }, svg);
  // sample points at a ± delta
  [[a - dd, cv('--amber')], [a + dd, cv('--amber')]].forEach(([x, col]) => {
    const y = m.f(x); if (isFinite(y) && y < 7.5) el('circle', { cx: X(x), cy: Y(y), r: 3.5, fill: col }, svg);
  });
  const fl = m.f(a - dd), fr = m.f(a + dd);
  const verdict = m.L !== null
    ? `<span class="g">limit exists = <b>${m.L}</b></span>`
    : (lmKey === 'inf' ? '<span class="r">both sides → +∞: limit does not exist</span>' : '<span class="r">sides disagree: limit does not exist</span>');
  read('lmread', `<span>${m.n}</span><span>f(a−δ) = <b>${fmt(fl, 3)}</b></span><span>f(a+δ) = <b>${fmt(fr, 3)}</b></span><span>f(a) ${m.def ? '= ' + fmt(m.f(a), 2) : '<span class="r">undefined</span>'}</span>${verdict}`);
}
function bgOfFig(svg) { let n = svg.parentElement; while (n && n.tagName !== 'FIGURE') n = n.parentElement; return n ? getComputedStyle(n).backgroundColor : cv('--bg'); }
window.lmPick = (k) => { lmKey = k; lmDraw(); };

/* ============================================================
   03 · continuity: choose k so the pieces meet
   ============================================================ */
function ctDraw() {
  const svg = document.getElementById('ctsvg'); if (!svg) return;
  svg.innerHTML = '';
  const k = val('ct_k');
  const X = (x) => 40 + (x + 1) * 84, Y = (y) => 210 - (y + 1) * 25.7;
  axes(svg, 40, 420, 15, 232, X(0), Y(0));
  for (let g = -1; g <= 3; g++) { el('line', { x1: X(g), y1: 15, x2: X(g), y2: 232, stroke: cv('--border'), opacity: 0.5, 'stroke-width': 0.5 }, svg); txt(X(g) - 3, 245, g, cv('--dim'), svg); }
  const clip = (y) => (y > 6.2 || y < -1.2 ? NaN : Y(y));
  const left = [], right = [];
  for (let i = 0; i <= 200; i++) { const x = -1 + 2 * i / 200; left.push([X(x), clip(x * x + 1)]); }
  for (let i = 0; i <= 200; i++) { const x = 1 + 2.4 * i / 200; right.push([X(x), clip(k * x + 3)]); }
  el('path', { d: polyPath(left), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  el('path', { d: polyPath(right), fill: 'none', stroke: cv('--amber'), 'stroke-width': 2.2 }, svg);
  const rl = k + 3, gap = rl - 2;
  el('line', { x1: X(1), y1: 15, x2: X(1), y2: 232, stroke: cv('--muted'), 'stroke-dasharray': '2 4' }, svg);
  if (Math.abs(gap) > 0.03 && rl < 6.2 && rl > -1.2) {
    el('line', { x1: X(1), y1: Y(2), x2: X(1), y2: Y(rl), stroke: cv('--red'), 'stroke-width': 3 }, svg);
    txt(X(1) + 8, (Y(2) + Y(rl)) / 2 + 4, 'gap ' + fmt(Math.abs(gap)), cv('--red'), svg);
  }
  el('circle', { cx: X(1), cy: Y(2), r: 4, fill: cv('--blue') }, svg);
  if (rl < 6.2 && rl > -1.2) el('circle', { cx: X(1), cy: Y(rl), r: 4, fill: bgOfFig(svg), stroke: cv('--amber'), 'stroke-width': 1.5 }, svg);
  txt(X(-0.6), Y(1.6) - 8, 'x²+1', cv('--blue'), svg);
  txt(X(2.5), Y(k * 2.5 + 3) - 8, 'kx+3', cv('--amber'), svg);
  read('ctread', `<span>left limit = f(1) = <b>2</b></span><span>right limit = k+3 = <b>${fmt(rl)}</b></span><span>gap = <b>${fmt(gap)}</b></span>${Math.abs(gap) < 0.03 ? '<span class="g">continuous ✓ (k = −1)</span>' : '<span class="r">jump discontinuity</span>'}`);
}
window.ctSet = (k) => { setS([['ct_k', k, 2]]); ctDraw(); };

/* ============================================================
   04 · secant → tangent
   ============================================================ */
const SCf = (x) => 0.2 * x * x * x - 0.6 * x + 1.5;
const SCd = (x) => 0.6 * x * x - 0.6;
function scDraw() {
  const svg = document.getElementById('scsvg'); if (!svg) return;
  svg.innerHTML = '';
  const a = val('sc_x');
  let h = val('sc_h');
  h = clamp(h, -3 - a, 3 - a);
  if (Math.abs(h) < 0.02) h = h < 0 ? -0.02 : 0.02;
  const X = (x) => 30 + (x + 3) * 68.3, Y = (y) => 250 - (y + 2.5) * 28.75;
  axes(svg, 30, 440, 15, 262, X(0), Y(0));
  for (let g = -3; g <= 3; g++) { el('line', { x1: X(g), y1: 15, x2: X(g), y2: 262, stroke: cv('--border'), opacity: 0.45, 'stroke-width': 0.5 }, svg); txt(X(g) - 3, 274, g, cv('--dim'), svg); }
  const pts = [];
  for (let i = 0; i <= 300; i++) { const x = -3 + 6 * i / 300; pts.push([X(x), Y(SCf(x))]); }
  el('path', { d: polyPath(pts), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  const fa = SCf(a), fb = SCf(a + h);
  const mSec = (fb - fa) / h, mTan = SCd(a);
  // rise / run triangle
  el('path', { d: `M ${X(a)} ${Y(fa)} L ${X(a + h)} ${Y(fa)} L ${X(a + h)} ${Y(fb)}`, fill: rgba(cv('--muted'), 0.13), stroke: cv('--dim'), 'stroke-dasharray': '3 2' }, svg);
  txt((X(a) + X(a + h)) / 2 - 6, Y(fa) + 14, 'h', cv('--muted'), svg);
  txt(X(a + h) + 5, (Y(fa) + Y(fb)) / 2, 'Δf', cv('--muted'), svg);
  // lines across the plot
  const line = (m, col, w, dash) => {
    const y1 = fa + m * (-3 - a), y2 = fa + m * (3 - a);
    el('line', { x1: X(-3), y1: Y(y1), x2: X(3), y2: Y(y2), stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, svg);
  };
  line(mTan, cv('--green'), 1.6, '5 3');
  line(mSec, cv('--amber'), 2);
  el('circle', { cx: X(a), cy: Y(fa), r: 4.5, fill: cv('--red') }, svg);
  el('circle', { cx: X(a + h), cy: Y(fb), r: 4, fill: cv('--amber') }, svg);
  txt(X(a) - 4, Y(fa) - 10, 'a', cv('--red'), svg);
  txt(X(a + h) - 12, Y(fb) - 10, 'a+h', cv('--amber'), svg);
  read('scread', `<span>h used = <b>${fmt(h, 3)}</b></span><span>secant slope = <b>${fmt(mSec, 4)}</b></span><span>f′(a) = <b>${fmt(mTan, 4)}</b></span><span>error = <b>${fmt(Math.abs(mSec - mTan), 4)}</b></span>`);
}
window.scH = (h) => { setS([['sc_h', h, 2]]); scDraw(); };

/* ============================================================
   05 · f and f' side by side
   ============================================================ */
const DRS = {
  cubic: { n: 'x³ − 3x', f: (x) => x ** 3 - 3 * x, d: (x) => 3 * x * x - 3, lo: -2.6, hi: 2.6 },
  sin: { n: 'sin x', f: Math.sin, d: Math.cos, lo: -2.8, hi: 2.8 },
  exp: { n: 'e^(−x²)', f: (x) => Math.exp(-x * x), d: (x) => -2 * x * Math.exp(-x * x), lo: -2.8, hi: 2.8 },
  ln: { n: 'ln x', f: (x) => (x <= 0.12 ? NaN : Math.log(x)), d: (x) => (x <= 0.12 ? NaN : 1 / x), lo: 0.12, hi: 2.8 },
  quad: { n: 'x²', f: (x) => x * x, d: (x) => 2 * x, lo: -2.8, hi: 2.8 },
};
let drKey = 'cubic';
function drDraw() {
  const svg = document.getElementById('drsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = DRS[drKey];
  const x0 = clamp(val('dr_x'), m.lo + 0.02, m.hi - 0.02);
  const X = (x) => 35 + (x + 3) * 68.33;
  const N = 300, fv = [], dv = [], xs = [];
  for (let i = 0; i <= N; i++) { const x = m.lo + (m.hi - m.lo) * i / N; xs.push(x); fv.push(m.f(x)); dv.push(m.d(x)); }
  const Yf = bandScale(fv, 24, 150), Yd = bandScale(dv, 186, 300);
  // frames
  el('rect', { x: 30, y: 16, width: 415, height: 142, fill: 'none', stroke: cv('--border') }, svg);
  el('rect', { x: 30, y: 176, width: 415, height: 134, fill: 'none', stroke: cv('--border') }, svg);
  txt(36, 30, 'f(x) = ' + m.n, cv('--blue'), svg);
  txt(36, 190, "f ′(x)", cv('--amber'), svg);
  if (Yf(0) > 24 && Yf(0) < 150) el('line', { x1: 30, y1: Yf(0), x2: 445, y2: Yf(0), stroke: cv('--border2') }, svg);
  if (Yd(0) > 186 && Yd(0) < 300) el('line', { x1: 30, y1: Yd(0), x2: 445, y2: Yd(0), stroke: cv('--border2') }, svg);
  // zeros of f' -> vertical guides in both panels
  for (let i = 1; i <= N; i++) {
    if (isFinite(dv[i - 1]) && isFinite(dv[i]) && dv[i - 1] * dv[i] < 0) {
      const xz = xs[i - 1] + (xs[i] - xs[i - 1]) * Math.abs(dv[i - 1]) / (Math.abs(dv[i - 1]) + Math.abs(dv[i]));
      el('line', { x1: X(xz), y1: 16, x2: X(xz), y2: 310, stroke: cv('--green'), 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.85 }, svg);
    }
  }
  el('path', { d: polyPath(xs.map((x, i) => [X(x), isFinite(fv[i]) ? Yf(fv[i]) : NaN])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  el('path', { d: polyPath(xs.map((x, i) => [X(x), isFinite(dv[i]) ? Yd(dv[i]) : NaN])), fill: 'none', stroke: cv('--amber'), 'stroke-width': 2.2 }, svg);
  // tangent in the top panel
  const f0 = m.f(x0), d0 = m.d(x0);
  if (isFinite(f0) && isFinite(d0)) {
    const dx = 0.9;
    el('line', { x1: X(x0 - dx), y1: Yf(f0 - d0 * dx), x2: X(x0 + dx), y2: Yf(f0 + d0 * dx), stroke: cv('--red'), 'stroke-width': 1.8 }, svg);
    el('circle', { cx: X(x0), cy: Yf(f0), r: 4.5, fill: cv('--red') }, svg);
    el('circle', { cx: X(x0), cy: Yd(d0), r: 4.5, fill: cv('--red') }, svg);
    el('line', { x1: X(x0), y1: Yd(0), x2: X(x0), y2: Yd(d0), stroke: cv('--red'), 'stroke-width': 1.4 }, svg);
  }
  const trend = d0 > 0.02 ? '<span class="g">f increasing</span>' : d0 < -0.02 ? '<span class="r">f decreasing</span>' : '<span class="a">f flat — critical point</span>';
  read('drread', `<span>x = <b>${fmt(x0)}</b></span><span>f(x) = <b>${fmt(f0, 3)}</b></span><span>f′(x) = <b>${fmt(d0, 3)}</b></span>${trend}`);
}
window.drPick = (k) => { drKey = k; drDraw(); };

/* ============================================================
   06 · curve sketching: f = x³ + bx² + cx
   ============================================================ */
function csDraw() {
  const svg = document.getElementById('cssvg'); if (!svg) return;
  svg.innerHTML = '';
  const b = val('cs_b'), c = val('cs_c');
  const f = (x) => x ** 3 + b * x * x + c * x, d1 = (x) => 3 * x * x + 2 * b * x + c, d2 = (x) => 6 * x + 2 * b;
  const lo = -3.2, hi = 3.2, X = (x) => 35 + (x - lo) * (400 / (hi - lo));
  const N = 320, xs = [], fv = [];
  for (let i = 0; i <= N; i++) { const x = lo + (hi - lo) * i / N; xs.push(x); fv.push(f(x)); }
  const Y = bandScale(fv, 22, 226);
  el('rect', { x: 30, y: 16, width: 412, height: 216, fill: 'none', stroke: cv('--border') }, svg);
  if (Y(0) > 22 && Y(0) < 226) el('line', { x1: 30, y1: Y(0), x2: 442, y2: Y(0), stroke: cv('--border2') }, svg);
  el('line', { x1: X(0), y1: 16, x2: X(0), y2: 232, stroke: cv('--border2') }, svg);
  el('path', { d: polyPath(xs.map((x, i) => [X(x), Y(fv[i])])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.3 }, svg);
  // critical points from the quadratic formula
  const disc = 4 * b * b - 12 * c;
  let crits = [];
  if (disc > 0) { const r = Math.sqrt(disc); crits = [(-2 * b - r) / 6, (-2 * b + r) / 6]; }
  else if (Math.abs(disc) < 1e-9) crits = [-b / 3];
  crits.filter((x) => x > lo && x < hi).forEach((x) => {
    el('circle', { cx: X(x), cy: Y(f(x)), r: 4.5, fill: cv('--green') }, svg);
    txt(X(x) - 8, Y(f(x)) - 10, d2(x) > 0.001 ? 'min' : d2(x) < -0.001 ? 'max' : 'saddle', cv('--green'), svg);
  });
  const xi = -b / 3;
  if (xi > lo && xi < hi) { el('circle', { cx: X(xi), cy: Y(f(xi)), r: 4, fill: cv('--amber') }, svg); txt(X(xi), Y(f(xi)) + 18, 'infl', cv('--amber'), svg, 'middle'); }
  // sign bars
  const bar = (yTop, fn, label) => {
    txt(30, yTop - 4, label, cv('--muted'), svg);
    const M = 200;
    for (let i = 0; i < M; i++) {
      const xa = lo + (hi - lo) * i / M, xb = lo + (hi - lo) * (i + 1) / M;
      const s = fn((xa + xb) / 2);
      el('rect', { x: X(xa), y: yTop, width: X(xb) - X(xa) + 0.6, height: 15, fill: s >= 0 ? rgba(cv('--green'), 0.55) : rgba(cv('--red'), 0.55) }, svg);
    }
    el('rect', { x: X(lo), y: yTop, width: X(hi) - X(lo), height: 15, fill: 'none', stroke: cv('--border') }, svg);
  };
  bar(252, d1, "sign of f ′  (green = increasing)");
  bar(292, d2, "sign of f ″  (green = convex ∪)");
  const shape = disc > 0.0001 ? `two critical points at x = ${fmt(crits[0])} and ${fmt(crits[1])}` : Math.abs(disc) < 0.0001 ? 'one saddle (double root of f′)' : 'no critical points — strictly increasing';
  read('csread', `<span>f′ discriminant = <b>${fmt(disc)}</b></span><span>${shape}</span><span>inflection at x = <b>${fmt(xi)}</b></span>`);
}
window.csSet = (b, c) => { setS([['cs_b', b, 2], ['cs_c', c, 2]]); csDraw(); };

/* ============================================================
   07a · Riemann sums
   ============================================================ */
const RIf = (x) => 0.35 * x * x + 0.4;
const RIexact = 4.35;
let riM = 'left';
function riDraw() {
  const svg = document.getElementById('risvg'); if (!svg) return;
  svg.innerHTML = '';
  const n = Math.round(val('ri_n')), a = 0, b = 3, dx = (b - a) / n;
  const X = (x) => 40 + x * 130, Y = (y) => 215 - y * 45;
  let sum = 0;
  const g = el('g', {}, svg);
  for (let i = 0; i < n; i++) {
    const xl = a + i * dx, xr = xl + dx;
    if (riM === 'trap') {
      const yl = RIf(xl), yr = RIf(xr);
      sum += dx * (yl + yr) / 2;
      el('path', { d: `M ${X(xl)} ${Y(0)} L ${X(xl)} ${Y(yl)} L ${X(xr)} ${Y(yr)} L ${X(xr)} ${Y(0)} Z`, fill: rgba(cv('--green'), 0.28), stroke: cv('--green2') || cv('--green'), 'stroke-width': 0.7 }, g);
    } else {
      const xs = riM === 'left' ? xl : riM === 'right' ? xr : (xl + xr) / 2;
      const h = RIf(xs);
      sum += dx * h;
      el('rect', { x: X(xl), y: Y(h), width: X(xr) - X(xl), height: Y(0) - Y(h), fill: rgba(cv('--green'), 0.28), stroke: cv('--green2') || cv('--green'), 'stroke-width': 0.7 }, g);
    }
  }
  const pts = [];
  for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; pts.push([X(x), Y(RIf(x))]); }
  el('path', { d: polyPath(pts), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.4 }, svg);
  el('line', { x1: 30, y1: Y(0), x2: 445, y2: Y(0), stroke: cv('--border2') }, svg);
  el('line', { x1: X(0), y1: 20, x2: X(0), y2: 228, stroke: cv('--border2') }, svg);
  for (let t = 0; t <= 3; t++) txt(X(t) - 3, 230, t, cv('--dim'), svg);
  txt(X(0.12), 38, 'f(x) = 0.35x² + 0.4', cv('--blue'), svg);
  const err = sum - RIexact;
  read('riread', `<span>rule: <b>${riM}</b></span><span>n = <b>${n}</b>, Δx = ${fmt(3 / n, 3)}</span><span>sum = <b>${fmt(sum, 4)}</b></span><span>exact = 4.35</span><span>error = <b>${err >= 0 ? '+' : ''}${fmt(err, 4)}</b></span>`);
}
window.riMode = (m) => { riM = m; riDraw(); };

/* ============================================================
   07b · accumulation function A(x) = ∫₀ˣ f
   ============================================================ */
const ACS = {
  sin: { n: 'sin t', f: Math.sin, A: (x) => 1 - Math.cos(x) },
  lin: { n: 't − 2', f: (t) => t - 2, A: (x) => x * x / 2 - 2 * x },
  pos: { n: 'e^(−t/3)', f: (t) => Math.exp(-t / 3), A: (x) => 3 * (1 - Math.exp(-x / 3)) },
};
let acKey = 'sin';
function acDraw() {
  const svg = document.getElementById('acsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = ACS[acKey], x0 = val('ac_x'), T = 6.3;
  const XL = (t) => 30 + t * 30.2, XR = (t) => 250 + t * 30.2;
  const N = 260, fv = [], Av = [], ts = [];
  for (let i = 0; i <= N; i++) { const t = T * i / N; ts.push(t); fv.push(m.f(t)); Av.push(m.A(t)); }
  const Yf = bandScale(fv, 30, 210), Ya = bandScale(Av, 30, 210);
  el('rect', { x: 26, y: 22, width: 198, height: 196, fill: 'none', stroke: cv('--border') }, svg);
  el('rect', { x: 246, y: 22, width: 198, height: 196, fill: 'none', stroke: cv('--border') }, svg);
  txt(32, 36, 'f(t) = ' + m.n, cv('--blue'), svg);
  txt(252, 36, 'A(x) = ∫₀ˣ f', cv('--green'), svg);
  // shaded area up to x0, split by sign
  const step = 0.02;
  let dPos = '', dNeg = '';
  for (let t = 0; t < x0; t += step) {
    const y = m.f(t), y2 = m.f(Math.min(t + step, x0));
    const seg = `M ${XL(t)} ${Yf(0)} L ${XL(t)} ${Yf(y)} L ${XL(Math.min(t + step, x0))} ${Yf(y2)} L ${XL(Math.min(t + step, x0))} ${Yf(0)} Z `;
    if (y >= 0) dPos += seg; else dNeg += seg;
  }
  if (dPos) el('path', { d: dPos, fill: rgba(cv('--green'), 0.32), stroke: 'none' }, svg);
  if (dNeg) el('path', { d: dNeg, fill: rgba(cv('--red'), 0.32), stroke: 'none' }, svg);
  el('line', { x1: 26, y1: Yf(0), x2: 224, y2: Yf(0), stroke: cv('--border2') }, svg);
  el('line', { x1: 246, y1: Ya(0), x2: 444, y2: Ya(0), stroke: cv('--border2') }, svg);
  el('path', { d: polyPath(ts.map((t, i) => [XL(t), Yf(fv[i])])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  el('path', { d: polyPath(ts.map((t, i) => [XR(t), Ya(Av[i])])), fill: 'none', stroke: cv('--green'), 'stroke-width': 2.2 }, svg);
  el('line', { x1: XL(x0), y1: 22, x2: XL(x0), y2: 218, stroke: cv('--amber'), 'stroke-dasharray': '3 3' }, svg);
  el('line', { x1: XR(x0), y1: 22, x2: XR(x0), y2: 218, stroke: cv('--amber'), 'stroke-dasharray': '3 3' }, svg);
  el('circle', { cx: XL(x0), cy: Yf(m.f(x0)), r: 4, fill: cv('--amber') }, svg);
  el('circle', { cx: XR(x0), cy: Ya(m.A(x0)), r: 4.5, fill: cv('--amber') }, svg);
  const slope = m.f(x0) > 0.02 ? '<span class="g">f &gt; 0 ⇒ A rising</span>' : m.f(x0) < -0.02 ? '<span class="r">f &lt; 0 ⇒ A falling</span>' : '<span class="a">f = 0 ⇒ A stationary</span>';
  read('acread', `<span>x = <b>${fmt(x0)}</b></span><span>f(x) = <b>${fmt(m.f(x0), 3)}</b></span><span>A(x) = <b>${fmt(m.A(x0), 3)}</b></span>${slope}`);
}
window.acPick = (k) => { acKey = k; acDraw(); };

/* ============================================================
   08 · improper integral ∫₁^b x^(−p)
   ============================================================ */
function imF(p, t) { return p === 1 ? Math.log(t) : (Math.pow(t, 1 - p) - 1) / (1 - p); }
function imDraw() {
  const svg = document.getElementById('imsvg'); if (!svg) return;
  svg.innerHTML = '';
  const p = val('im_p'), b = val('im_b');
  const XL = (x) => 30 + (x - 1) * (190 / (b - 1)), YL = (y) => 215 - y * 165;
  el('rect', { x: 26, y: 22, width: 198, height: 198, fill: 'none', stroke: cv('--border') }, svg);
  el('rect', { x: 246, y: 22, width: 198, height: 198, fill: 'none', stroke: cv('--border') }, svg);
  txt(32, 36, 'x^(−p) on [1, b]', cv('--blue'), svg);
  txt(252, 36, 'running total ∫₁ᵗ', cv('--green'), svg);
  // shaded area
  let d = `M ${XL(1)} ${YL(0)}`;
  for (let i = 0; i <= 200; i++) { const x = 1 + (b - 1) * i / 200; d += ` L ${XL(x)} ${YL(Math.pow(x, -p))}`; }
  d += ` L ${XL(b)} ${YL(0)} Z`;
  el('path', { d, fill: rgba(cv('--green'), 0.3) }, svg);
  const pts = [];
  for (let i = 0; i <= 200; i++) { const x = 1 + (b - 1) * i / 200; pts.push([XL(x), YL(Math.pow(x, -p))]); }
  el('path', { d: polyPath(pts), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  el('line', { x1: 26, y1: YL(0), x2: 224, y2: YL(0), stroke: cv('--border2') }, svg);
  txt(28, 230, '1', cv('--dim'), svg); txt(212, 230, 'b=' + fmt(b, 1), cv('--dim'), svg);
  // running total, t from 1 to 40
  const lim = p > 1 ? 1 / (p - 1) : Infinity;
  const tot = [];
  for (let i = 0; i <= 240; i++) { const t = 1 + 39 * i / 240; tot.push(imF(p, t)); }
  const top = Math.max(imF(p, 40), isFinite(lim) ? lim : 0) * 1.08 || 1;
  const XR = (t) => 250 + (t - 1) * (190 / 39), YR = (v) => 215 - (v / top) * 170;
  el('line', { x1: 246, y1: YR(0), x2: 444, y2: YR(0), stroke: cv('--border2') }, svg);
  if (isFinite(lim)) {
    el('line', { x1: 246, y1: YR(lim), x2: 444, y2: YR(lim), stroke: cv('--amber'), 'stroke-dasharray': '4 3' }, svg);
    txt(440, YR(lim) - 6, 'limit 1/(p−1) = ' + fmt(lim, 3), cv('--amber'), svg, 'end');
  }
  el('path', { d: polyPath(tot.map((v, i) => [XR(1 + 39 * i / 240), YR(v)])), fill: 'none', stroke: cv('--green'), 'stroke-width': 2.2 }, svg);
  el('circle', { cx: XR(b), cy: YR(imF(p, b)), r: 4.5, fill: cv('--amber') }, svg);
  el('line', { x1: XR(b), y1: 22, x2: XR(b), y2: 220, stroke: cv('--amber'), 'stroke-dasharray': '2 4' }, svg);
  const verdict = p > 1 ? `<span class="g">converges to ${fmt(lim, 4)}</span>` : p === 1 ? '<span class="r">diverges (logarithmically)</span>' : '<span class="r">diverges</span>';
  read('imread', `<span>p = <b>${fmt(p)}</b></span><span>∫₁^b = <b>${fmt(imF(p, b), 4)}</b></span><span>at b = 40: <b>${fmt(imF(p, 40), 4)}</b></span>${verdict}`);
}
window.imSet = (p) => { setS([['im_p', p, 2]]); imDraw(); };

/* ============================================================
   09 · contour map + gradient  (marching squares)
   ============================================================ */
const MS = { 0: [], 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 2], [0, 1]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[2, 0]], 10: [[2, 1], [0, 3]], 11: [[2, 1]], 12: [[1, 3]], 13: [[1, 0]], 14: [[0, 3]], 15: [] };
function contourPath(f, level, lo, hi, n, X, Y) {
  const step = (hi - lo) / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const xa = lo + i * step, xb = xa + step, ya = lo + j * step, yb = ya + step;
      const v00 = f(xa, ya), v10 = f(xb, ya), v11 = f(xb, yb), v01 = f(xa, yb);
      if (![v00, v10, v11, v01].every(isFinite)) continue;
      const idx = (v00 > level ? 1 : 0) | (v10 > level ? 2 : 0) | (v11 > level ? 4 : 0) | (v01 > level ? 8 : 0);
      const segs = MS[idx];
      if (!segs.length) continue;
      const t = (p, q) => (level - p) / (q - p);
      const pt = (e) => {
        if (e === 0) return [xa + step * t(v00, v10), ya];
        if (e === 1) return [xb, ya + step * t(v10, v11)];
        if (e === 2) return [xa + step * t(v01, v11), yb];
        return [xa, ya + step * t(v00, v01)];
      };
      for (const [e1, e2] of segs) {
        const p1 = pt(e1), p2 = pt(e2);
        d += `M ${X(p1[0]).toFixed(1)} ${Y(p1[1]).toFixed(1)} L ${X(p2[0]).toFixed(1)} ${Y(p2[1]).toFixed(1)} `;
      }
    }
  }
  return d;
}
const GRS = {
  bowl: { n: 'x² + y²', f: (x, y) => x * x + y * y, g: (x, y) => [2 * x, 2 * y] },
  saddle: { n: 'x² − y²', f: (x, y) => x * x - y * y, g: (x, y) => [2 * x, -2 * y] },
  cobb: { n: '√(xy)  (x, y > 0)', f: (x, y) => (x > 0.05 && y > 0.05 ? Math.sqrt(x * y) : NaN), g: (x, y) => (x > 0.05 && y > 0.05 ? [0.5 * Math.sqrt(y / x), 0.5 * Math.sqrt(x / y)] : [NaN, NaN]) },
  plane: { n: '2x + y', f: (x, y) => 2 * x + y, g: () => [2, 1] },
  ridge: { n: 'sin x + y²/4', f: (x, y) => Math.sin(x) + y * y / 4, g: (x, y) => [Math.cos(x), y / 2] },
};
let grKey = 'bowl';
function grDraw() {
  const svg = document.getElementById('grsvg'); if (!svg) return;
  svg.innerHTML = '';
  const m = GRS[grKey], px = val('gr_x'), py = val('gr_y');
  const lo = -3, hi = 3, X = (x) => 215 + x * 45, Y = (y) => 150 - y * 45;
  el('rect', { x: X(lo), y: Y(hi), width: 270, height: 270, fill: 'none', stroke: cv('--border') }, svg);
  // sample to find the value range
  const vals = [];
  for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const v = m.f(lo + 6 * i / 30, lo + 6 * j / 30); if (isFinite(v)) vals.push(v); }
  const vlo = Math.min(...vals), vhi = Math.max(...vals);
  const L = 11;
  for (let k = 1; k < L; k++) {
    const t = k / L, level = vlo + (vhi - vlo) * t;
    const d = contourPath(m.f, level, lo, hi, 46, X, Y);
    if (d) el('path', { d, fill: 'none', stroke: mix(cv('--blue'), cv('--amber'), t), 'stroke-width': 1.3, opacity: 0.9 }, svg);
  }
  el('line', { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  el('line', { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: cv('--border2'), 'stroke-dasharray': '2 3' }, svg);
  el('rect', { x: X(lo) + 3, y: Y(hi) + 3, width: 8.2 * m.n.length + 8, height: 17, fill: bgOfFig(svg), opacity: 0.85 }, svg);
  txt(X(lo) + 8, Y(hi) + 16, m.n, cv('--text'), svg);
  const [gx, gy] = m.g(px, py), fv = m.f(px, py);
  if (isFinite(gx) && isFinite(gy) && isFinite(fv)) {
    const nrm = Math.hypot(gx, gy);
    const L2 = nrm < 1e-6 ? 0 : clamp(16 * nrm, 22, 70);
    const ux = nrm < 1e-6 ? 0 : gx / nrm, uy = nrm < 1e-6 ? 0 : gy / nrm;
    // contour tangent (perpendicular to the gradient)
    el('line', { x1: X(px) - uy * 42, y1: Y(py) - ux * 42, x2: X(px) + uy * 42, y2: Y(py) + ux * 42, stroke: cv('--dim'), 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, svg);
    if (L2 > 0) {
      const ex = X(px) + ux * L2, ey = Y(py) - uy * L2;
      el('line', { x1: X(px), y1: Y(py), x2: ex, y2: ey, stroke: cv('--green'), 'stroke-width': 2.6 }, svg);
      const ang = Math.atan2(-uy, ux);
      el('path', { d: `M ${ex} ${ey} L ${ex - 9 * Math.cos(ang - 0.4)} ${ey - 9 * Math.sin(ang - 0.4)} L ${ex - 9 * Math.cos(ang + 0.4)} ${ey - 9 * Math.sin(ang + 0.4)} Z`, fill: cv('--green') }, svg);
    }
    el('circle', { cx: X(px), cy: Y(py), r: 4.5, fill: cv('--red') }, svg);
    read('grread', `<span>f(${fmt(px, 1)}, ${fmt(py, 1)}) = <b>${fmt(fv, 3)}</b></span><span>∇f = ( <b>${fmt(gx, 2)}</b>, <b>${fmt(gy, 2)}</b> )</span><span>‖∇f‖ = <b>${fmt(nrm, 3)}</b></span>${nrm < 1e-6 ? '<span class="a">∇f = 0 — a critical point</span>' : ''}`);
  } else {
    el('circle', { cx: X(px), cy: Y(py), r: 4.5, fill: 'none', stroke: cv('--red'), 'stroke-dasharray': '2 2' }, svg);
    read('grread', '<span class="r">the point is outside the domain of this function</span><span>move the sliders so that x, y &gt; 0</span>');
  }
}
window.grPick = (k) => { grKey = k; grDraw(); };

/* ============================================================
   10 · double integral: one region, two slab directions
   ============================================================ */
let dbM = 'I';
function dbDraw() {
  const svg = document.getElementById('dbsvg'); if (!svg) return;
  svg.innerHTML = '';
  const n = Math.round(val('db_n'));
  const X = (x) => 50 + x * 152, Y = (y) => 250 - y * 50;
  el('line', { x1: 40, y1: Y(0), x2: 435, y2: Y(0), stroke: cv('--border2') }, svg);
  el('line', { x1: X(0), y1: 20, x2: X(0), y2: 262, stroke: cv('--border2') }, svg);
  for (let t = 0; t <= 2; t++) txt(X(t) - 3, 264, t, cv('--dim'), svg);
  for (let t = 1; t <= 4; t++) txt(X(0) - 14, Y(t) + 4, t, cv('--dim'), svg);
  // region fill
  let d = '';
  for (let i = 0; i <= 100; i++) { const x = 2 * i / 100; d += (i ? ' L' : 'M') + ` ${X(x)} ${Y(x * x)}`; }
  for (let i = 100; i >= 0; i--) { const x = 2 * i / 100; d += ` L ${X(x)} ${Y(2 * x)}`; }
  d += ' Z';
  el('path', { d, fill: rgba(cv('--green'), 0.13) }, svg);
  // slabs
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    let x1, y1, x2, y2;
    if (dbM === 'I') {
      const x = 2 * (i + 0.5) / n;
      x1 = X(x); x2 = X(x); y1 = Y(x * x); y2 = Y(2 * x);
    } else {
      const y = 4 * (i + 0.5) / n;
      y1 = Y(y); y2 = Y(y); x1 = X(y / 2); x2 = X(Math.sqrt(y));
    }
    const hot = i === mid;
    el('line', { x1, y1, x2, y2, stroke: hot ? cv('--red') : cv('--green'), 'stroke-width': hot ? 3 : 1.6, opacity: hot ? 1 : 0.65 }, svg);
  }
  // boundary curves
  const c1 = [], c2 = [];
  for (let i = 0; i <= 120; i++) { const x = 2.4 * i / 120; c1.push([X(x), Y(x * x)]); c2.push([X(x), Y(2 * x)]); }
  el('path', { d: polyPath(c1.filter((p) => p[1] > 18)), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.2 }, svg);
  el('path', { d: polyPath(c2.filter((p) => p[1] > 18)), fill: 'none', stroke: cv('--amber'), 'stroke-width': 2.2 }, svg);
  txt(X(2.05), Y(3.15), 'y = x²', cv('--blue'), svg);
  txt(X(0.42), Y(2.05), 'y = 2x', cv('--amber'), svg);
  el('circle', { cx: X(2), cy: Y(4), r: 4, fill: cv('--text') }, svg);
  txt(X(2) + 6, Y(4) + 4, '(2, 4)', cv('--muted'), svg);
  el('circle', { cx: X(0), cy: Y(0), r: 4, fill: cv('--text') }, svg);
  read('dbread', dbM === 'I'
    ? '<span>Type I · <b>vertical</b> slabs</span><span>outer: <b>0 ≤ x ≤ 2</b></span><span>inner: <b>x² ≤ y ≤ 2x</b></span><span>order: dy then dx</span>'
    : '<span>Type II · <b>horizontal</b> slabs</span><span>outer: <b>0 ≤ y ≤ 4</b></span><span>inner: <b>y/2 ≤ x ≤ √y</b></span><span>order: dx then dy</span>');
}
window.dbMode = (m) => { dbM = m; dbDraw(); };

/* ============================================================
   11 · bond price, duration and convexity
   ============================================================ */
const BDC = 5, BDF = 100;
function bdP(y, T) {
  let p = 0;
  for (let t = 1; t <= T; t++) p += BDC * Math.exp(-y * t);
  return p + BDF * Math.exp(-y * T);
}
function bdD1(y, T) {
  let p = 0;
  for (let t = 1; t <= T; t++) p += -t * BDC * Math.exp(-y * t);
  return p - T * BDF * Math.exp(-y * T);
}
function bdD2(y, T) {
  let p = 0;
  for (let t = 1; t <= T; t++) p += t * t * BDC * Math.exp(-y * t);
  return p + T * T * BDF * Math.exp(-y * T);
}
function bdDraw() {
  const svg = document.getElementById('bdsvg'); if (!svg) return;
  svg.innerHTML = '';
  const y0 = val('bd_y'), T = Math.round(val('bd_T')), dy = val('bd_d');
  const ylo = 0.005, yhi = 0.16;
  const X = (y) => 45 + (y - ylo) * (395 / (yhi - ylo));
  const N = 240, ys = [], ps = [];
  for (let i = 0; i <= N; i++) { const y = ylo + (yhi - ylo) * i / N; ys.push(y); ps.push(bdP(y, T)); }
  const p0 = bdP(y0, T), d1 = bdD1(y0, T), d2 = bdD2(y0, T);
  const y1 = clamp(y0 + dy, ylo, yhi), pExact = bdP(y1, T);
  const pDur = p0 + d1 * (y1 - y0), pCon = pDur + 0.5 * d2 * (y1 - y0) * (y1 - y0);
  const Y = bandScale(ps.concat([pDur, pCon, pExact]), 25, 235);
  el('rect', { x: 40, y: 18, width: 405, height: 224, fill: 'none', stroke: cv('--border') }, svg);
  for (let t = 0.02; t <= 0.16; t += 0.02) { el('line', { x1: X(t), y1: 18, x2: X(t), y2: 242, stroke: cv('--border'), opacity: 0.4, 'stroke-width': 0.5 }, svg); txt(X(t) - 10, 256, (t * 100).toFixed(0) + '%', cv('--dim'), svg); }
  txt(240, 272, 'yield y', cv('--muted'), svg, 'middle');
  // approximations across the plot
  const lin = [], quad = [];
  for (let i = 0; i <= N; i++) { const y = ys[i], u = y - y0; lin.push([X(y), Y(p0 + d1 * u)]); quad.push([X(y), Y(p0 + d1 * u + 0.5 * d2 * u * u)]); }
  el('path', { d: polyPath(lin.filter((p) => p[1] > 20 && p[1] < 244)), fill: 'none', stroke: cv('--red'), 'stroke-width': 1.8 }, svg);
  el('path', { d: polyPath(quad.filter((p) => p[1] > 20 && p[1] < 244)), fill: 'none', stroke: cv('--green'), 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }, svg);
  el('path', { d: polyPath(ys.map((y, i) => [X(y), Y(ps[i])])), fill: 'none', stroke: cv('--blue'), 'stroke-width': 2.6 }, svg);
  el('line', { x1: X(y0), y1: 18, x2: X(y0), y2: 242, stroke: cv('--muted'), 'stroke-dasharray': '2 4' }, svg);
  el('line', { x1: X(y1), y1: 18, x2: X(y1), y2: 242, stroke: cv('--amber'), 'stroke-dasharray': '2 4' }, svg);
  el('circle', { cx: X(y0), cy: Y(p0), r: 4.5, fill: cv('--text') }, svg);
  el('circle', { cx: X(y1), cy: Y(pExact), r: 4.5, fill: cv('--amber') }, svg);
  txt(X(y0) + 5, Y(p0) - 8, 'y₀', cv('--muted'), svg);
  const D = -d1 / p0, C = d2 / p0;
  read('bdread', `<span>T = <b>${T}</b>y, P(y₀) = <b>${fmt(p0, 3)}</b></span><span>duration D = <b>${fmt(D, 3)}</b></span><span>convexity C = <b>${fmt(C, 1)}</b></span><span>Δy = <b>${(dy * 100).toFixed(1)}%</b></span><span>exact ΔP = <b>${fmt(pExact - p0, 3)}</b></span><span class="r">duration only: ${fmt(pDur - p0, 3)} (err ${fmt(Math.abs(pDur - pExact), 3)})</span><span class="g">+ convexity: ${fmt(pCon - p0, 3)} (err ${fmt(Math.abs(pCon - pExact), 3)})</span>`);
}
window.bdSet = (y, T, d) => { setS([['bd_y', y, 3], ['bd_T', T, 0], ['bd_d', d, 3]]); bdDraw(); };

/* ---------- wiring ---------- */
bindS('fn_a', 1, fnDraw); bindS('fn_b', 1, fnDraw); bindS('fn_c', 1, fnDraw); bindS('fn_d', 1, fnDraw);
bindS('lm_d', 2, lmDraw);
bindS('ct_k', 2, ctDraw);
bindS('sc_x', 2, scDraw); bindS('sc_h', 2, scDraw);
bindS('dr_x', 2, drDraw);
bindS('cs_b', 2, csDraw); bindS('cs_c', 2, csDraw);
bindS('ri_n', 0, riDraw);
bindS('ac_x', 2, acDraw);
bindS('im_p', 2, imDraw); bindS('im_b', 1, imDraw);
bindS('gr_x', 2, grDraw); bindS('gr_y', 2, grDraw);
bindS('db_n', 0, dbDraw);
bindS('bd_y', 3, bdDraw); bindS('bd_T', 0, bdDraw); bindS('bd_d', 3, bdDraw);

function drawAll() {
  fnDraw(); lmDraw(); ctDraw(); scDraw(); drDraw(); csDraw();
  riDraw(); acDraw(); imDraw(); grDraw(); dbDraw(); bdDraw();
}
drawAll();
window.addEventListener('themechange', drawAll);
