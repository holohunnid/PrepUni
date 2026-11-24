// Interactive figures and quick tests for Financial Econometrics (L. Mancini).
// Same conventions as the other courses: vanilla SVG, colours read from CSS
// variables so the theme switch ('themechange') repaints correctly, and every
// figure silently does nothing when its markup is absent.
//   DRAW  – functions that repaint a figure (all are run once and on themechange)
//   ACT   – actions for <button data-do="name">
// All "market" data here are simulated; numbers quoted from the slides are in the text.
const NS = 'http://www.w3.org/2000/svg';
const DRAW = [], ACT = {};
const $ = (id) => document.getElementById(id);
const css = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
const C = (n) => css('--' + n);
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(p, x, y, s, fill, anchor = 'start', size = 10) { const t = el('text', { x, y, fill: fill || C('muted'), 'font-size': size, 'text-anchor': anchor }, p); t.textContent = s; return t; }
function fmt(x, d = 2) { if (!isFinite(x)) return '—'; const v = (+x).toFixed(d); return v === '-' + (0).toFixed(d) ? (0).toFixed(d) : v.replace('-', '−'); }
const val = (id) => { const e = $(id); return e ? parseFloat(e.value) : 0; };
const chk = (id) => !!$(id)?.checked;
const sel = (id) => $(id)?.value;
const DEC = {};
function label(id) { const l = $(id + '_v'); if (l) l.textContent = fmt(val(id), DEC[id] ?? 2); }
function setS(id, v) { const s = $(id); if (!s) return; s.step = 'any'; s.value = v; label(id); }
function read(id, parts) { const r = $(id); if (r) r.innerHTML = parts.map((p) => `<span>${p}</span>`).join(''); }
const B = (s) => `<b>${s}</b>`;
// listen to several controls at once
function on(ids, fn) {
  for (const id of ids) {
    const s = $(id); if (!s) continue;
    if (s.type === 'range') { const st = s.getAttribute('step') || '1'; DEC[id] = (st.split('.')[1] || '').length; label(id); }
    s.addEventListener(s.type === 'range' ? 'input' : 'change', () => { label(id); fn(id); });
  }
}
// register a figure: draw now, on control changes, on theme change
function fig(svgId, ids, draw, init) {
  if (!$(svgId)) return false;
  on(ids, draw); if (init) init(); DRAW.push(draw); return true;
}

// ---------- numbers ----------
function randn() { let u = 0; while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
const randns = (n) => Array.from({ length: n }, randn);
const randExp = () => -Math.log(1 - Math.random());
function randt(v) { let c = 0; for (let i = 0; i < v; i++) { const z = randn(); c += z * z; } return randn() / Math.sqrt(c / v); }
const sum = (a) => a.reduce((s, v) => s + v, 0);
const mean = (a) => sum(a) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / a.length); };
function ols1(x, y) { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; } const b2 = sxy / sxx; return { b1: my - b2 * mx, b2, sxx }; }
const normPdf = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
function normCdf(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const p = 0.3989422804014327 * Math.exp(-z * z / 2) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z > 0 ? 1 - p : p; }
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) { if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x); x -= 1; let a = LG[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += LG[i] / (x + i); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function gammaP(a, x) {
  if (x <= 0) return 0;
  const pre = Math.exp(-x + a * Math.log(x) - lgamma(a));
  if (x < a + 1) { let ap = a, s = 1 / a, d = s; for (let n = 0; n < 1000; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-15) break; } return s * pre; }
  const tiny = 1e-300; let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < tiny) d = tiny; c = b + an / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; const q = d * c; h *= q; if (Math.abs(q - 1) < 1e-15) break; }
  return 1 - pre * h;
}
function betacf(a, b, x) {
  const tiny = 1e-300, qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - (qab * x) / qap; if (Math.abs(d) < tiny) d = tiny; d = 1 / d; let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; const q = d * c; h *= q; if (Math.abs(q - 1) < 1e-15) break;
  }
  return h;
}
function betaI(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const chi2Pdf = (x, k) => (x <= 0 ? (k < 2 ? 1e9 : k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)));
const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2));
const tPdf = (x, v) => (v > 1e6 ? normPdf(x) : Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2) - 0.5 * Math.log(v * Math.PI) - ((v + 1) / 2) * Math.log(1 + x * x / v)));
const tCdf = (x, v) => { if (v > 1e6) return normCdf(x); const t = 0.5 * betaI(v / 2, 0.5, v / (v + x * x)); return x > 0 ? 1 - t : t; };
const fPdf = (x, a, b) => (x <= 0 ? (a < 2 ? 1e9 : a === 2 ? 1 : 0) : Math.exp(lgamma((a + b) / 2) - lgamma(a / 2) - lgamma(b / 2) + (a / 2) * Math.log(a / b) + (a / 2 - 1) * Math.log(x) - ((a + b) / 2) * Math.log(1 + a * x / b)));
const fCdf = (x, a, b) => (x <= 0 ? 0 : betaI(a / 2, b / 2, a * x / (a * x + b)));
function inv(F, p, lo, hi) { for (let i = 0; i < 120; i++) { const m = (lo + hi) / 2; if (F(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const zq = (p) => inv(normCdf, p, -12, 12);
const tq = (p, v) => inv((x) => tCdf(x, v), p, -400, 400);

// ---------- plotting ----------
function ticks(lo, hi, n = 6) { const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw)); const st = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => (hi - lo) / s <= n) || 10 * mag; const o = []; for (let t = Math.ceil(lo / st - 1e-9) * st; t <= hi + 1e-9; t += st) o.push(+t.toFixed(10)); return o; }
const tl = (t) => String(+t.toFixed(4)).replace('-', '−');
let clipN = 0;
function plot(id, o) {
  const svg = $(id); if (!svg) return null;
  const vb = svg.viewBox.baseVal, W = vb.width, H = o.h1 ?? vb.height;
  if (!o.keep) svg.innerHTML = '';
  const pad = { l: 40, r: 10, t: 12, b: 26, ...(o.pad || {}) };
  const [xa, xb] = o.x, [ya, yb_] = o.y, top = (o.h0 ?? 0) + pad.t, bot = H - pad.b, x0 = pad.l, x1 = W - pad.r;
  const X = (v) => x0 + (v - xa) / (xb - xa) * (x1 - x0), Y = (v) => bot - (v - ya) / (yb_ - ya) * (bot - top);
  if (!o.noy) for (const t of ticks(ya, yb_, o.ny ?? 5)) { el('line', { x1: x0, x2: x1, y1: Y(t), y2: Y(t), stroke: C('border'), 'stroke-width': 0.6 }, svg); txt(svg, x0 - 5, Y(t) + 3, tl(t), C('dim'), 'end', 8.5); }
  el('line', { x1: x0, x2: x1, y1: bot, y2: bot, stroke: C('border2') }, svg);
  if (!o.nox) for (const t of ticks(xa, xb, o.nx ?? 7)) { el('line', { x1: X(t), x2: X(t), y1: bot, y2: bot + 3, stroke: C('border2') }, svg); txt(svg, X(t), bot + 12, tl(t), C('dim'), 'middle', 8.5); }
  if (o.xl) txt(svg, x1, bot + 23, o.xl, C('dim'), 'end', 9.5);
  if (o.yl) txt(svg, x0 + 4, top + 2, o.yl, C('dim'), 'start', 9.5);
  const cid = 'fe' + (++clipN), cp = el('clipPath', { id: cid }, el('defs', {}, svg));
  el('rect', { x: x0, y: top - 2, width: x1 - x0, height: bot - top + 4 }, cp);
  const g = el('g', { 'clip-path': `url(#${cid})` }, svg);
  const P = {
    svg, g, X, Y, x0, x1, top, bot,
    line: (a, b, c, d, col, w = 1.6, dash) => el('line', { x1: X(a), y1: Y(b), x2: X(c), y2: Y(d), stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, g),
    v: (x, col, w = 1.4, dash = '4 3') => el('line', { x1: X(x), x2: X(x), y1: top, y2: bot, stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, g),
    h: (y, col, w = 1.2, dash = '4 3') => el('line', { x1: x0, x2: x1, y1: Y(y), y2: Y(y), stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, g),
    dot: (x, y, col, r = 3) => el('circle', { cx: X(x), cy: Y(y), r, fill: col }, g),
    path: (pts, col, w = 1.8, dash) => el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' '), fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }, g),
    fn: (f, a, b, col, w = 2, dash, n = 240) => P.path(Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, Math.max(ya - (yb_ - ya), Math.min(f(x), yb_ + (yb_ - ya)))]; }), col, w, dash),
    area: (f, a, b, col, op = 0.45, n = 120) => { if (!(b > a)) return; let d = `M${X(a)} ${bot}`; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; d += `L${X(x).toFixed(1)} ${Y(Math.min(f(x), yb_ * 2)).toFixed(1)}`; } el('path', { d: d + `L${X(b)} ${bot}Z`, fill: col, opacity: op }, g); },
    bar: (a, b, y, col, op = 1) => el('rect', { x: X(a) + 0.4, y: Math.min(Y(y), Y(Math.max(0, ya))), width: Math.max(0.5, X(b) - X(a) - 0.8), height: Math.abs(Y(y) - Y(Math.max(0, ya))), fill: col, opacity: op }, g),
    t: (x, y, s, col, anchor, size) => txt(svg, X(x) + (s[0] === ' ' ? 5 : s.at(-1) === ' ' ? -5 : 0), Y(y), s.trim(), col, anchor, size),
  };
  return P;
}
function histo(data, lo, hi, n = 40) { const w = (hi - lo) / n, c = Array(n).fill(0); for (const v of data) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < n) c[k]++; } return { w, d: c.map((q) => q / (data.length * w)), lo }; }
function drawHist(P, h, col, op = 0.6) { h.d.forEach((q, i) => q > 0 && P.bar(h.lo + i * h.w, h.lo + (i + 1) * h.w, q, col, op)); }
function arrow(svg, x1, y1, x2, y2, col, w = 2) { el('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': w }, svg); const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1); if (L < 4) return; const s = 7; el('path', { d: `M${x2} ${y2}L${x2 - s * Math.cos(a - 0.4)} ${y2 - s * Math.sin(a - 0.4)}L${x2 - s * Math.cos(a + 0.4)} ${y2 - s * Math.sin(a + 0.4)}Z`, fill: col }, svg); }

// =====================================================================
// 02 · linear combinations
// =====================================================================
const VC = { set: [[2, 3], [-1, 2]], orth: [[2, 1], [-1, 2]], dep: [[2, 3], [1, 1.5]] };
function vcDraw() {
  const [a, b] = VC[sel('vc_k')], b1 = val('vc_1'), b2 = val('vc_2');
  const P = plot('vcsvg', { x: [-6, 6], y: [-5, 5], pad: { l: 26, b: 20 } });
  P.line(-6, 0, 6, 0, C('border2'), 1); P.line(0, -5, 0, 5, C('border2'), 1);
  const A = (p, q, col, w) => arrow(P.g, P.X(p[0]), P.Y(p[1]), P.X(q[0]), P.Y(q[1]), col, w);
  const m = [a[0] * b1, a[1] * b1], r = [m[0] + b[0] * b2, m[1] + b[1] * b2];
  P.line(0, 0, m[0], m[1], C('green'), 1.4, '4 3'); P.line(m[0], m[1], r[0], r[1], C('blue'), 1.4, '4 3');
  A([0, 0], a, C('green'), 2); A([0, 0], b, C('blue'), 2); A([0, 0], r, C('amber'), 2.4);
  P.t(a[0] + 0.15, a[1] + 0.2, 'x₁', C('green')); P.t(b[0] - 0.5, b[1] + 0.2, 'x₂', C('blue'));
  for (const s of [1, -1]) P.line(1 - 0.18, -3 - 0.18 * s, 1 + 0.18, -3 + 0.18 * s, C('red'), 2.2);
  P.t(1.3, -3, 'ŷ = (1, −3)′', C('red'));
  const det = a[0] * b[1] - a[1] * b[0], d = Math.hypot(r[0] - 1, r[1] + 3);
  read('vcread', [`x₁b₁ + x₂b₂ = ${B(`(${fmt(r[0])}, ${fmt(r[1])})′`)}`, `distance to ŷ = ${B(fmt(d, 3))}${d < 0.02 ? ' ✓ reached' : ''}`, `det[x₁ x₂] = ${B(fmt(det, 2))} ${Math.abs(det) < 1e-9 ? '→ dependent' : '→ independent'}`, `x₁′x₂ = ${B(fmt(a[0] * b[0] + a[1] * b[1], 2))} ${Math.abs(a[0] * b[0] + a[1] * b[1]) < 1e-9 ? '→ orthogonal' : ''}`]);
}
fig('vcsvg', ['vc_1', 'vc_2', 'vc_k'], vcDraw);
ACT.vcSolve = () => {
  const [a, b] = VC[sel('vc_k')], det = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(det) < 1e-9) { const k = (a[0] * 1 + a[1] * -3) / (a[0] ** 2 + a[1] ** 2); setS('vc_1', k); setS('vc_2', 0); vcDraw(); $('vcread').innerHTML += '<span class="r">no exact solution: this is the closest reachable point (a projection!)</span>'; return; }
  setS('vc_1', (b[1] * 1 - b[0] * -3) / det); setS('vc_2', (a[0] * -3 - a[1] * 1) / det); vcDraw();
};
ACT.vcReset = () => { setS('vc_1', 1); setS('vc_2', 0.5); vcDraw(); };

// =====================================================================
// 04 · quadratic form and gradient
// =====================================================================
const QF = { xx: [[2, 0.8], [0.8, 1]], hw: [[2, 1], [3, 2]], ind: [[1, 0.5], [0.5, -1]] };
function qfDraw() {
  const A = QF[sel('qf_k')], x = val('qf_1'), y = val('qf_2');
  const P = plot('qfsvg', { x: [-2.2, 2.2], y: [-2.2, 2.2], pad: { l: 28, b: 22 } });
  const f = (u, v) => A[0][0] * u * u + (A[0][1] + A[1][0]) * u * v + A[1][1] * v * v;
  const N = 44, lo = -2.2, w = 4.4 / N, lev = 1.1;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const z = f(lo + (i + 0.5) * w, lo + (j + 0.5) * w), k = Math.floor(z / lev);
    el('rect', { x: P.X(lo + i * w), y: P.Y(lo + (j + 1) * w), width: P.X(w) - P.X(0), height: P.Y(0) - P.Y(w), 'shape-rendering': 'crispEdges', fill: z >= 0 ? C('green') : C('red'), opacity: Math.min(0.75, 0.04 + Math.abs(k + (z < 0 ? 1 : 0)) * 0.05) }, P.g);
  }
  const g = [2 * A[0][0] * x + (A[0][1] + A[1][0]) * y, (A[0][1] + A[1][0]) * x + 2 * A[1][1] * y];
  arrow(P.g, P.X(x), P.Y(y), P.X(x + g[0] * 0.13), P.Y(y + g[1] * 0.13), C('amber'), 2.4);
  P.dot(x, y, C('text'), 4);
  txt(P.svg, P.x1, P.bot + 20, 'b₁', C('dim'), 'end'); txt(P.svg, P.x0 - 4, P.top + 4, 'b₂', C('dim'), 'end');
  const det = 4 * A[0][0] * A[1][1] - (A[0][1] + A[1][0]) ** 2;
  read('qfread', [`f(b) = b′Ab = ${B(fmt(f(x, y), 3))}`, `gradient (A+A′)b = ${B(`(${fmt(g[0])}, ${fmt(g[1])})′`)}`, `det(A+A′) = ${B(fmt(det, 2))}: ${det > 1e-9 ? 'positive definite, unique minimum' : det < -1e-9 ? 'indefinite, saddle at 0' : 'singular, a whole line of minima'}`]);
}
fig('qfsvg', ['qf_1', 'qf_2', 'qf_k'], qfDraw);

// =====================================================================
// 06 · DGP, sample, fitted line
// =====================================================================
let dg = null;
function dgNew() { dg = { x: Array.from({ length: 120 }, () => 0.3 + 5.4 * Math.random()), z: randns(120) }; }
function dgDraw() {
  const n = Math.round(val('dg_n')), b1 = val('dg_b1'), b2 = val('dg_b2'), s = val('dg_s');
  const x = dg.x.slice(0, n), y = x.map((v, i) => b1 + b2 * v + s * dg.z[i]);
  const all = [...y, b1, b1 + 6 * b2], lo = Math.min(...all), hi = Math.max(...all), m = (hi - lo) * 0.1 + 0.3;
  const P = plot('dgsvg', { x: [0, 6], y: [lo - m, hi + m], xl: 'xᵢ₂', yl: 'yᵢ' });
  const o = ols1(x, y);
  if (chk('dg_er')) x.forEach((v, i) => P.line(v - 0.02, y[i], v - 0.02, b1 + b2 * v, C('red'), 1.2, '3 2'));
  if (chk('dg_re')) x.forEach((v, i) => P.line(v + 0.02, y[i], v + 0.02, o.b1 + o.b2 * v, C('blue'), 1.2, '3 2'));
  if (chk('dg_tr')) P.line(0, b1, 6, b1 + 6 * b2, C('red'), 2);
  if (chk('dg_ol')) P.line(0, o.b1, 6, o.b1 + 6 * o.b2, C('blue'), 2);
  x.forEach((v, i) => P.dot(v, y[i], C('text'), 2.8));
  const e = x.map((v, i) => y[i] - o.b1 - o.b2 * v);
  read('dgread', [`<span class="r">true</span> β₁ = ${B(fmt(b1))}, β₂ = ${B(fmt(b2))}`, `<span class="b">OLS</span> b₁ = ${B(fmt(o.b1))}, b₂ = ${B(fmt(o.b2))}`, `Σeᵢ = ${B(fmt(sum(e), 3))}`, `Σεᵢ = ${B(fmt(sum(x.map((v, i) => s * dg.z[i])), 2))}`]);
}
fig('dgsvg', ['dg_b1', 'dg_b2', 'dg_s', 'dg_n', 'dg_tr', 'dg_ol', 'dg_er', 'dg_re'], dgDraw, dgNew);
ACT.dgNew = () => { dgNew(); dgDraw(); };
ACT.dgFive = () => { dgNew(); dg.x.splice(0, 5, 0.8, 1.1, 2.4, 3.3, 5.0); dg.z.splice(0, 5, -0.6, 0.55, -0.5, 1.2, -0.45); setS('dg_n', 5); setS('dg_b1', 1); setS('dg_b2', 0.7); setS('dg_s', 1); dgDraw(); };

// =====================================================================
// 07 · assumption violations
// =====================================================================
let exD = null;
function exRun() {
  const n = Math.round(val('ex_n')), r = val('ex_r'), k = sel('ex_k'); const out = [], form = [];
  for (let s = 0; s < 500; s++) {
    const x = randns(n), y = []; let x3 = null;
    if (k === 'col') x3 = x.map((v) => r * v + Math.sqrt(1 - r * r) * randn());
    for (let i = 0; i < n; i++) { let e = randn(); if (k === 'endog') e = r * x[i] + Math.sqrt(1 - r * r) * e; if (k === 'het') e *= Math.sqrt((1 - r) + r * x[i] * x[i]); y.push(x[i] + (x3 ? x3[i] : 0) + e); }
    if (x3) {
      const mx = mean(x), m3 = mean(x3), my = mean(y); let a = 0, b = 0, c = 0, p = 0, q = 0;
      for (let i = 0; i < n; i++) { const u = x[i] - mx, w = x3[i] - m3, v = y[i] - my; a += u * u; b += u * w; c += w * w; p += u * v; q += w * v; }
      const D = a * c - b * b; out.push((c * p - b * q) / D); form.push(c / D);
    } else { const o = ols1(x, y); out.push(o.b2); const e2 = sum(x.map((v, i) => (y[i] - o.b1 - o.b2 * v) ** 2)) / (n - 2); form.push(e2 / o.sxx); }
  }
  exD = { out, form: Math.sqrt(mean(form)), k };
}
function exDraw() {
  const { out } = exD, m = mean(out), s = sd(out), lo = Math.min(0, m - 4 * s), hi = Math.max(2, m + 4 * s);
  const h = histo(out, lo, hi, 45), P = plot('exsvg', { x: [lo, hi], y: [0, Math.max(...h.d) * 1.15], xl: 'b₂', noy: true, pad: { l: 14 } });
  drawHist(P, h, C('blue')); P.v(1, C('red'), 2); P.v(m, C('amber'), 2, '');
  P.t(1, Math.max(...h.d) * 1.08, ' β₂ = 1', C('red'));
  read('exread', [`mean of b₂ = ${B(fmt(m, 3))} (amber), truth 1`, `sd across samples = ${B(fmt(s, 3))}`, `what the formula s²(X′X)⁻¹ reports: sd = ${B(fmt(exD.form, 3))}`, exD.k === 'endog' ? '<span class="r">biased</span>' : exD.k === 'het' ? 'unbiased; reported sd wrong' : exD.k === 'col' ? 'unbiased; large sd' : 'unbiased; reported sd right']);
}
const exGo = () => { exRun(); exDraw(); };
fig('exsvg', [], exDraw, exRun); if ($('exsvg')) on(['ex_k', 'ex_r', 'ex_n'], exGo); ACT.exRun = exGo;

// =====================================================================
// 08 · SSE and its contours (running example)
// =====================================================================
const RX = [1, 2, 3, 4, 5], RY = [2, 3, 5, 4, 6];
function olDraw() {
  const b1 = val('ol_1'), b2 = val('ol_2');
  const P = plot('olsvg', { x: [0, 8], y: [-1, 8], xl: 'xᵢ₂', yl: 'yᵢ' });
  let s = 0;
  RX.forEach((x, i) => {
    const f = b1 + b2 * x, e = RY[i] - f; s += e * e;
    if (chk('ol_sq')) { const a = Math.abs(P.Y(RY[i]) - P.Y(f)); el('rect', { x: P.X(x), y: Math.min(P.Y(RY[i]), P.Y(f)), width: a, height: a, fill: C('red'), opacity: 0.16, stroke: C('red'), 'stroke-opacity': 0.5 }, P.g); }
    P.line(x, RY[i], x, f, C('red'), 1.4, '3 2');
  });
  P.line(0, b1, 8, b1 + 8 * b2, C('blue'), 2); RX.forEach((x, i) => P.dot(x, RY[i], C('text'), 4));
  const Q = plot('ctsvg', { x: [-2, 5], y: [-1, 2.5], xl: 'b₁', yl: 'b₂' });
  // ellipses d'X'Xd = level, X'X = [5 15; 15 55]: parametrise with the Cholesky factor
  const l11 = Math.sqrt(5), l21 = 15 / l11, l22 = Math.sqrt(55 - l21 * l21);
  for (const L of [0.5, 1.5, 3, 6, 12, 25, 50, 100, 200]) { const pts = []; for (let k = 0; k <= 120; k++) { const t = 2 * Math.PI * k / 120, r = Math.sqrt(L), d2 = r * Math.sin(t) / l22, d1 = (r * Math.cos(t) - l21 * d2) / l11; pts.push([1.3 + d1, 0.9 + d2]); } Q.path(pts, C('muted'), 0.9); }
  Q.dot(1.3, 0.9, C('green'), 4.5); Q.dot(b1, b2, C('amber'), 5);
  const g1 = -2 * 20 + 2 * (5 * b1 + 15 * b2), g2 = -2 * 69 + 2 * (15 * b1 + 55 * b2);
  read('olread', [`SSE = ${B(fmt(s, 3))} (minimum 1.90)`, `F.O.C.: ∂SSE/∂b = ${B(`(${fmt(g1)}, ${fmt(g2)})′`)}`, `SSE − 1.90 = (b−b̂)′X′X(b−b̂) = ${B(fmt(s - 1.9, 3))}`]);
}
fig('olsvg', ['ol_1', 'ol_2', 'ol_sq'], olDraw);
ACT.olSnap = () => { setS('ol_1', 1.3); setS('ol_2', 0.9); olDraw(); };
ACT.olReset = () => { setS('ol_1', 3); setS('ol_2', 0.2); olDraw(); };
ACT.olStep = () => { const b1 = val('ol_1'), b2 = val('ol_2'), k = 0.006; setS('ol_1', b1 - k * (-40 + 10 * b1 + 30 * b2)); setS('ol_2', b2 - k * (-138 + 30 * b1 + 110 * b2)); olDraw(); };

// =====================================================================
// 10 · outlier, missing intercept
// =====================================================================
function roDraw() {
  const y = [...RY]; y[4] = val('ro_y'); const nc = chk('ro_nc');
  const P = plot('rosvg', { x: [0, 6], y: [-6, 9], xl: 'xᵢ₂', yl: 'yᵢ' });
  P.line(0, 1.3, 6, 1.3 + 5.4, C('muted'), 1.4, '5 4');
  const o = ols1(RX, y); if (nc) { o.b1 = 0; o.b2 = sum(RX.map((x, i) => x * y[i])) / 55; }
  if (Math.abs(y[4] - 6) > 0.05) { arrow(P.g, P.X(5), P.Y(6), P.X(5), P.Y(y[4]), C('red'), 1.2); el('circle', { cx: P.X(5), cy: P.Y(6), r: 4, fill: 'none', stroke: C('red') }, P.g); }
  P.line(0, o.b1, 6, o.b1 + 6 * o.b2, C('blue'), 2.2);
  RX.forEach((x, i) => P.dot(x, y[i], C('text'), 4)); if (nc) P.dot(0, 0, C('blue'), 4);
  const e = RX.map((x, i) => y[i] - o.b1 - o.b2 * x);
  read('roread', [`b₁ = ${B(fmt(o.b1))}, b₂ = ${B(fmt(o.b2))} (originally 1.30, 0.90)`, `Σeᵢ = ${B(fmt(sum(e), 2))}`, `SSE = ${B(fmt(sum(e.map((v) => v * v)), 2))}`]);
}
fig('rosvg', ['ro_y', 'ro_nc'], roDraw);
ACT.roOut = () => { setS('ro_y', 0); $('ro_nc').checked = false; roDraw(); };
ACT.roNo = () => { setS('ro_y', 6); $('ro_nc').checked = true; roDraw(); };
ACT.roReset = () => { setS('ro_y', 6); $('ro_nc').checked = false; roDraw(); };

// =====================================================================
// 11 · CAPM and the hedge
// =====================================================================
let cp = null;
function cpNew() { cp = { m: randns(250).map((z) => 0.03 + z), z: randns(250) }; }
function cpDraw() {
  const a = val('cp_a'), b = val('cp_b'), s = val('cp_s'), h = val('cp_h');
  const r = cp.m.map((m, i) => a + b * m + s * cp.z[i]), o = ols1(cp.m, r);
  const mx = Math.max(3, ...cp.m.map(Math.abs)) * 1.05, my = Math.max(3, ...r.map(Math.abs)) * 1.05;
  const P = plot('cpsvg', { x: [-mx, mx], y: [-my, my], xl: 'market excess return (%)', yl: 'stock' });
  cp.m.forEach((m, i) => el('circle', { cx: P.X(m), cy: P.Y(r[i]), r: 2, fill: C('muted'), opacity: 0.7 }, P.g));
  P.line(-mx, a - b * mx, mx, a + b * mx, C('red'), 1.8, '5 3'); P.line(-mx, o.b1 - o.b2 * mx, mx, o.b1 + o.b2 * mx, C('blue'), 2);
  const W = (f) => { let v = 100; return [[0, 100], ...cp.m.map((m, i) => { v *= 1 + f(m, i) / 100; return [i + 1, v]; })]; };
  const w1 = W((m) => m), w2 = W((m, i) => r[i]), w3 = W((m, i) => r[i] - h * m), all = [...w1, ...w2, ...w3].map((p) => p[1]);
  const Q = plot('cpwsvg', { x: [0, 250], y: [Math.min(...all) * 0.97, Math.max(...all) * 1.03], xl: 'day' });
  Q.path(w1, C('muted'), 1.4); Q.path(w2, C('blue'), 1.6); Q.path(w3, C('green'), 2.2);
  txt(Q.svg, Q.x0 + 6, Q.top + 8, '— market', C('muted')); txt(Q.svg, Q.x0 + 70, Q.top + 8, '— stock', C('blue')); txt(Q.svg, Q.x0 + 126, Q.top + 8, '— stock − h·market', C('green'));
  const hr = r.map((v, i) => v - h * cp.m[i]); const e2 = sum(r.map((v, i) => (v - o.b1 - o.b2 * cp.m[i]) ** 2)) / 248;
  read('cpread', [`OLS: α̂ = ${B(fmt(o.b1, 3))} (se ${fmt(Math.sqrt(e2 * (1 / 250 + mean(cp.m) ** 2 / o.sxx)), 3)}), β̂ = ${B(fmt(o.b2, 3))} (se ${fmt(Math.sqrt(e2 / o.sxx), 3)})`, `daily sd: stock ${B(fmt(sd(r)))}%, hedged ${B(fmt(sd(hr)))}%`, `corr. with market: stock ${B(fmt(corr(r, cp.m)))}, hedged ${B(fmt(corr(hr, cp.m)))}`]);
}
function corr(a, b) { const x = mean(a), y = mean(b); let p = 0, q = 0, r = 0; a.forEach((v, i) => { p += (v - x) * (b[i] - y); q += (v - x) ** 2; r += (b[i] - y) ** 2; }); return p / Math.sqrt(q * r); }
fig('cpsvg', ['cp_a', 'cp_b', 'cp_s', 'cp_h'], cpDraw, cpNew);
ACT.cpNew = () => { cpNew(); cpDraw(); };
ACT.cpCrash = () => { [120, 121, 123, 126].forEach((d, i) => (cp.m[d] = [-6, -4, -5, -3][i])); cpDraw(); };
ACT.cpOls = () => { const r = cp.m.map((m, i) => val('cp_a') + val('cp_b') * m + val('cp_s') * cp.z[i]); setS('cp_h', ols1(cp.m, r).b2); cpDraw(); };

// =====================================================================
// 13 · projection in 3D
// =====================================================================
const P1 = [1, 0.15], P2 = [0.25, 1]; let pY = [1.15, 0.95];
function prDraw() {
  const svg = $('prsvg'); svg.innerHTML = '';
  const b1 = val('pr_1'), b2 = val('pr_2'), h = val('pr_h'), th = val('pr_r') * Math.PI / 180, S = 112, cx = 190, cy = 190;
  const pj = ([x, y, z]) => { const u = x - 0.5, v = y - 0.45, a = u * Math.cos(th) - v * Math.sin(th), d = u * Math.sin(th) + v * Math.cos(th); return [cx + S * a, cy + S * (0.42 * d) - S * 0.92 * z]; };
  const L = (p, q, col, w, dash) => { const a = pj(p), b = pj(q); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }, svg); };
  const A = (p, q, col, w) => { const a = pj(p), b = pj(q); arrow(svg, a[0], a[1], b[0], b[1], col, w); };
  const T = (p, s, col, dx = 6, dy = -4) => { const a = pj(p); txt(svg, a[0] + dx, a[1] + dy, s, col); };
  const cor = [[-0.6, -0.65, 0], [1.6, -0.65, 0], [1.6, 1.55, 0], [-0.6, 1.55, 0]].map(pj);
  el('path', { d: 'M' + cor.map((c) => c.join(' ')).join('L') + 'Z', fill: C('bluebg'), stroke: C('blue'), 'stroke-opacity': 0.5 }, svg);
  const y = [pY[0], pY[1], h], f = [P1[0] * b1 + P2[0] * b2, P1[1] * b1 + P2[1] * b2, 0], O = [0, 0, 0];
  A(O, [...P1, 0], C('green'), 1.8); A(O, [...P2, 0], C('green'), 1.8); T([...P1, 0], 'X₁', C('green')); T([...P2, 0], 'X₂', C('green'));
  L([pY[0], pY[1], 0], y, C('dim'), 1, '2 3');
  A(O, f, C('blue'), 2.4); A(O, y, C('red'), 2.4); A(f, y, C('amber'), 2.2);
  T(y, 'y', C('red')); T(f, 'Xb', C('blue'), 4, 12); T([(f[0] + y[0]) / 2, (f[1] + y[1]) / 2, h / 2], 'e', C('amber'), 8, 0);
  const e = [y[0] - f[0], y[1] - f[1], h], dt = (p, q) => p[0] * q[0] + p[1] * q[1], x1e = dt(P1, e), x2e = dt(P2, e), yy = dt(y, y) + h * h, ee = dt(e, e) + h * h, perp = Math.abs(x1e) + Math.abs(x2e) < 0.03;
  read('prread', [`‖e‖² = ${B(fmt(ee, 3))} (minimum ${fmt(h * h, 3)})`, `X′e = ${B(`(${fmt(x1e)}, ${fmt(x2e)})′`)} ${perp ? '<span class="g">✓ perpendicular: this is OLS</span>' : ''}`, `‖y‖² = ${B(fmt(yy, 3))}`, perp ? `1 − ‖e‖²/‖y‖² = ${B(fmt(1 - ee / yy, 3))} (R² if de-meaned)` : 'not a projection yet']);
}
fig('prsvg', ['pr_1', 'pr_2', 'pr_h', 'pr_r'], prDraw);
const prSolve = () => { const d = P1[0] * P2[1] - P1[1] * P2[0]; setS('pr_1', (pY[0] * P2[1] - pY[1] * P2[0]) / d); setS('pr_2', (P1[0] * pY[1] - P1[1] * pY[0]) / d); };
ACT.prSnap = () => { prSolve(); prDraw(); };
ACT.prExact = () => { pY = [1.15, 0.95]; setS('pr_h', 0); prSolve(); prDraw(); };
ACT.prWorst = () => { pY = [0, 0]; setS('pr_h', 1.5); prSolve(); prDraw(); };
ACT.prReset = () => { pY = [1.15, 0.95]; setS('pr_1', 0.3); setS('pr_2', 0.3); setS('pr_h', 1.2); setS('pr_r', 35); prDraw(); };

// =====================================================================
// 14 · R² and useless regressors
// =====================================================================
let r2 = null;
function r2New() { r2 = { x: randns(100), z: randns(100), J: Array.from({ length: 98 }, () => randns(100)) }; }
function r2Draw() {
  const n = Math.round(val('r2_n')), R = val('r2_t'), y = r2.x.slice(0, n).map((v, i) => Math.sqrt(R) * v + Math.sqrt(1 - R) * r2.z[i]);
  const dm = (a) => { const m = mean(a); return a.map((v) => v - m); }, dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  let e = dm(y); const sst = dot(e, e), basis = [], pts = [], adj = [];
  for (let k = 2; k <= n; k++) {
    let c = dm((k === 2 ? r2.x : r2.J[k - 3]).slice(0, n)); for (let pass = 0; pass < 2; pass++) for (const q of basis) { const d = dot(c, q); c = c.map((v, i) => v - d * q[i]); }
    const nn = Math.sqrt(dot(c, c)); if (nn > 1e-9) { c = c.map((v) => v / nn); basis.push(c); const d = dot(e, c); e = e.map((v, i) => v - d * c[i]); }
    const ee = dot(e, e); pts.push([k, 1 - ee / sst]); if (n - k > 0) adj.push([k, 1 - (ee / (n - k)) / (sst / (n - 1))]);
  }
  const P = plot('r2svg', { x: [1, n + 1], y: [-0.5, 1.05], xl: 'K = number of regressors (incl. constant)' });
  P.h(0, C('border2'), 1, ''); P.path(adj, C('amber'), 1.8); P.path(pts, C('blue'), 2.4); P.dot(2, pts[0][1], C('green'), 4);
  txt(P.svg, P.x0 + 8, P.top + 10, '— R²', C('blue')); txt(P.svg, P.x0 + 50, P.top + 10, '— adjusted R²', C('amber'));
  const mid = Math.min(pts.length - 1, Math.floor(n / 2) - 2);
  read('r2read', [`K = 2 (real regressor): R² = ${B(fmt(pts[0][1], 3))}`, `K = ${pts[mid][0]}: R² = ${B(fmt(pts[mid][1], 3))}`, `K = n = ${n}: R² = ${B(fmt(pts.at(-1)[1], 3))}`]);
}
fig('r2svg', ['r2_n', 'r2_t'], r2Draw, r2New);
ACT.r2New = () => { r2New(); r2Draw(); }; ACT.r2Noise = () => { r2New(); setS('r2_n', 10); setS('r2_t', 0); r2Draw(); };

// =====================================================================
// 15 · sampling distribution of b₂
// =====================================================================
let sb = [];
const ERR = { norm: randn, unif: () => (Math.random() - 0.5) * Math.sqrt(12), exp: () => randExp() - 1, t3: () => randt(3) / Math.sqrt(3) };
const grid = (n, s) => { const a = Array.from({ length: n }, (_, i) => i - (n - 1) / 2), k = sd(a); return a.map((v) => v / k * s); };
function sbAdd(m) { const n = Math.round(val('sb_n')), s = val('sb_s'), x = grid(n, val('sb_x')), f = ERR[sel('sb_d')]; for (let k = 0; k < m; k++) sb.push(ols1(x, x.map((v) => v + s * f())).b2); }
function sbDraw() {
  const n = Math.round(val('sb_n')), th = val('sb_s') / Math.sqrt(n) / val('sb_x'), r = Math.max(4.2 * th, 0.02);
  const h = histo(sb, 1 - r, 1 + r, 41), f = (x) => normPdf((x - 1) / th) / th, mx = Math.max(f(1), sb.length > 60 ? Math.max(...h.d) : 0) * 1.12;
  const P = plot('sbsvg', { x: [1 - r, 1 + r], y: [0, mx], noy: true, pad: { l: 14 }, xl: 'b₂' });
  if (sb.length > 60) drawHist(P, h, C('blue'), 0.5); else sb.forEach((v) => P.line(v, 0, v, mx * 0.12, C('blue'), 1.4));
  P.fn(f, 1 - r, 1 + r, C('text'), 1.6); P.v(1, C('red'), 1.8); P.t(1, mx * 0.96, ' β₂ = 1', C('red'));
  read('sbread', [`${B(sb.length)} samples`, `mean of b₂ = ${B(sb.length ? fmt(mean(sb), 4) : '—')}`, `sd of b₂ = ${B(sb.length > 1 ? fmt(sd(sb), 4) : '—')}`, `theory σ/√Σ(xᵢ−x̄)² = ${B(fmt(th, 4))}`]);
}
const sbReset = () => { sb = []; sbAdd(1000); sbDraw(); };
fig('sbsvg', [], sbDraw, () => sbAdd(1000)); if ($('sbsvg')) on(['sb_n', 'sb_s', 'sb_x', 'sb_d'], sbReset);
ACT.sbOne = () => { if (sb.length > 60) sb = []; sbAdd(1); sbDraw(); }; ACT.sbMany = () => { sbAdd(1000); sbDraw(); }; ACT.sbClear = () => { sb = []; sbDraw(); };

// =====================================================================
// 16 · Gauss–Markov race
// =====================================================================
let gm = null;
const RIV = {
  ends: (x, y) => (y.at(-1) - y[0]) / (x.at(-1) - x[0]),
  half: (x, y) => { const m = Math.floor(x.length / 2); return (mean(y.slice(-m)) - mean(y.slice(0, m))) / (mean(x.slice(-m)) - mean(x.slice(0, m))); },
  skip: (x, y) => ols1(x.filter((_, i) => i % 2 === 0), y.filter((_, i) => i % 2 === 0)).b2,
  zero: () => 0.9,
};
function gmRun() { const n = Math.round(val('gm_n')), s = val('gm_s'), x = Array.from({ length: n }, (_, i) => (i / (n - 1)) * 4), f = RIV[sel('gm_k')]; gm = { o: [], r: [] }; for (let k = 0; k < 2000; k++) { const y = x.map((v) => v + s * randn()); gm.o.push(ols1(x, y).b2); gm.r.push(f(x, y)); } }
function gmDraw() {
  const so = sd(gm.o), sr = sd(gm.r), r = 4 * Math.max(so, sr), h1 = histo(gm.o, 1 - r, 1 + r, 50), h2 = histo(gm.r, 1 - r, 1 + r, 50), mx = Math.max(...h1.d) * 1.15;
  const P = plot('gmsvg', { x: [1 - r, 1 + r], y: [0, mx], noy: true, pad: { l: 14 }, xl: 'slope estimate' });
  if (sr < 1e-9) P.v(0.9, C('amber'), 3, ''); else drawHist(P, h2, C('amber'), 0.5);
  drawHist(P, h1, C('blue'), 0.45); P.v(1, C('red'), 1.8);
  txt(P.svg, P.x0 + 8, P.top + 10, '■ OLS', C('blue')); txt(P.svg, P.x0 + 52, P.top + 10, '■ rival', C('amber'));
  const mse = (a) => mean(a.map((v) => (v - 1) ** 2));
  read('gmread', [`OLS: mean ${B(fmt(mean(gm.o), 3))}, variance ${B(fmt(so * so, 4))}, MSE ${B(fmt(mse(gm.o), 4))}`, `rival: mean ${B(fmt(mean(gm.r), 3))}, variance ${B(fmt(sr * sr, 4))}, MSE ${B(fmt(mse(gm.r), 4))}`, sr < 1e-9 ? '<span class="r">biased: outside the class of the theorem</span>' : `variance ratio rival/OLS = ${B(fmt(sr * sr / so / so, 2))}`]);
}
const gmGo = () => { gmRun(); gmDraw(); };
fig('gmsvg', [], gmDraw, gmRun); if ($('gmsvg')) on(['gm_n', 'gm_s', 'gm_k'], gmGo); ACT.gmRun = gmGo;

// =====================================================================
// 17 · e'e/n versus s²
// =====================================================================
let s2 = null;
function s2Run() { const n = Math.round(val('s2_n')), K = Math.min(Math.round(val('s2_k')), n - 1); const a = []; for (let k = 0; k < 3000; k++) { let c = 0; for (let i = 0; i < n - K; i++) { const z = randn(); c += z * z; } a.push(c); } s2 = { n, K, a }; }
function s2Draw() {
  const { n, K, a } = s2, A = a.map((v) => v / n), Bb = a.map((v) => v / (n - K)), hi = Math.max(2.2, 1 + 3.2 * sd(Bb));
  const h1 = histo(A, 0, hi, 45), h2 = histo(Bb, 0, hi, 45), mx = Math.max(...h1.d.slice(1), ...h2.d, 0.5) * 1.12;
  const P = plot('s2svg', { x: [0, hi], y: [0, mx], noy: true, pad: { l: 14 }, xl: 'estimate of σ²' });
  drawHist(P, h1, C('amber'), 0.5); drawHist(P, h2, C('blue'), 0.45); P.v(1, C('red'), 1.8);
  const D = (x, col) => el('path', { d: `M${P.X(x)} ${P.bot - 12}l6 6l-6 6l-6 -6Z`, fill: col, stroke: C('bg') }, P.g); D(mean(A), C('amber')); D(mean(Bb), C('blue'));
  txt(P.svg, P.x1 - 6, P.top + 10, '■ e′e/n', C('amber'), 'end'); txt(P.svg, P.x1 - 60, P.top + 10, '■ s²', C('blue'), 'end');
  read('s2read', [`n = ${B(n)}, K = ${B(K)}`, `average e′e/n = ${B(fmt(mean(A), 3))} (theory (n−K)/n = ${fmt((n - K) / n, 3)})`, `average s² = ${B(fmt(mean(Bb), 3))} (theory 1)`, `sd of s² = ${B(fmt(sd(Bb), 3))} (theory √(2/(n−K)) = ${fmt(Math.sqrt(2 / (n - K)), 3)})`]);
}
const s2Go = () => { s2Run(); s2Draw(); };
fig('s2svg', [], s2Draw, s2Run); if ($('s2svg')) on(['s2_n', 's2_k'], s2Go); ACT.s2Run = s2Go;

// =====================================================================
// 18 · R and q trainer
// =====================================================================
const RQ = [
  { K: 4, t: 'Model with K = 4. H₀: β₁ = 0 (the fund has zero alpha).', R: [[1, 0, 0, 0]], q: [0] },
  { K: 4, t: 'Model with K = 4. H₀: β₂ = 0 and β₃ + β₄ = 1.', R: [[0, 1, 0, 0], [0, 0, 1, 1]], q: [0, 1] },
  { K: 4, t: 'Model with K = 4. H₀: β₂ = β₃ = β₄ = 0.', R: [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], q: [0, 0, 0] },
  { K: 3, t: 'Cobb–Douglas, β = (log c, γ, θ)′. H₀: constant returns to scale, γ + θ = 1.', R: [[0, 1, 1]], q: [1] },
  { K: 4, t: 'Investment, β = (β₁, β₂, β₃, β₄)′. H₀: only the real rate matters, β₃ = −β₂.', R: [[0, 1, 1, 0]], q: [0] },
  { K: 3, t: 'W8: β = (γ₀, γ₁, γ₂)′. H₀: γ₀ = 0 and γ₁ = γ₂.', R: [[1, 0, 0], [0, 1, -1]], q: [0, 0] },
  { K: 4, t: 'Model with K = 4. H₀: β₂ = β₃ = β₄.', R: [[0, 1, -1, 0], [0, 0, 1, -1]], q: [0, 0] },
  { K: 5, t: 'Model with K = 5. H₀: 2β₂ − β₅ = 3 and β₃ = 4β₄.', R: [[0, 2, 0, 0, -1], [0, 0, 1, -4, 0]], q: [3, 0] },
];
function rqBuild() {
  const p = RQ[+sel('rq_k')], b = $('rqbox'); const cell = (id) => `<input id="${id}" inputmode="decimal" aria-label="${id}" style="width:44px;text-align:center;background:var(--panel2);border:1px solid var(--border);color:var(--text);font-family:var(--mono);font-size:12.5px;padding:3px 2px">`;
  b.innerHTML = `<p><b>${p.t}</b></p><p class="muted">R is ${p.R.length} × ${p.K}, q is ${p.R.length} × 1. Empty cells count as 0.</p><table style="width:auto"><tr>${Array.from({ length: p.K }, (_, k) => `<th class="c">col ${k + 1}</th>`).join('')}<th></th><th class="c">q</th></tr>${p.R.map((_, j) => `<tr>${Array.from({ length: p.K }, (_, k) => `<td class="c">${cell(`rq_${j}_${k}`)}</td>`).join('')}<td class="c">=</td><td class="c">${cell(`rq_${j}_q`)}</td></tr>`).join('')}</table>`;
  read('rqread', ['fill in the cells, then press check']);
}
function rref(M) { M = M.map((r) => [...r]); let r = 0; const C_ = M[0].length; for (let c = 0; c < C_ && r < M.length; c++) { let p = r; for (let i = r; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i; if (Math.abs(M[p][c]) < 1e-9) continue; [M[r], M[p]] = [M[p], M[r]]; const d = M[r][c]; M[r] = M[r].map((v) => v / d); for (let i = 0; i < M.length; i++) if (i !== r) { const f = M[i][c]; M[i] = M[i].map((v, k) => v - f * M[r][k]); } r++; } return M; }
ACT.rqCheck = () => {
  const p = RQ[+sel('rq_k')], num = (id) => { const v = ($(id).value || '0').replace('−', '-').replace(',', '.'); const f = v.split('/'); return f.length === 2 ? +f[0] / +f[1] : +v; };
  const M = p.R.map((_, j) => [...Array.from({ length: p.K }, (_, k) => num(`rq_${j}_${k}`)), num(`rq_${j}_q`)]);
  if (M.flat().some((v) => !isFinite(v))) return read('rqread', ['<span class="r">one cell is not a number</span>']);
  const a = rref(M), b = rref(p.R.map((r, j) => [...r, p.q[j]])), ok = a.every((r, i) => r.every((v, k) => Math.abs(v - b[i][k]) < 1e-6));
  read('rqread', [ok ? '<span class="g">✓ correct: your rows say exactly the same restrictions</span>' : '<span class="r">✗ not the same restrictions: rewrite each one as “combination = number” and read off the coefficients</span>']);
};
ACT.rqShow = () => { const p = RQ[+sel('rq_k')]; p.R.forEach((r, j) => { r.forEach((v, k) => ($(`rq_${j}_${k}`).value = v)); $(`rq_${j}_q`).value = p.q[j]; }); read('rqread', [`one correct answer, J = ${B(p.R.length)}`]); };
ACT.rqNext = () => { const s = $('rq_k'); s.value = (+s.value + 1) % RQ.length; rqBuild(); };
if ($('rqbox')) { on(['rq_k'], rqBuild); rqBuild(); }

// =====================================================================
// 19 · discrepancy vector: distance in standard-deviation units
// =====================================================================
let dvZ = null, dvS = 1;
function dvDraw() {
  const v = val('dv_v'), w = val('dv_w'), r = val('dv_r'), m = [val('dv_1'), val('dv_2')], c = r * Math.sqrt(v * w), l11 = Math.sqrt(v), l21 = c / l11, l22 = Math.sqrt(w - l21 * l21);
  const P = plot('dvsvg', { x: [-4.6, 4.6], y: [-4.1, 4.1], xl: 'm₁', yl: 'm₂', pad: { l: 30 } });
  dvZ.forEach(([a, b]) => el('circle', { cx: P.X(l11 * a), cy: P.Y(l21 * a + l22 * b), r: 1.4, fill: C('muted'), opacity: 0.6 }, P.g));
  const k = Math.sqrt(5.991); P.path(Array.from({ length: 121 }, (_, i) => { const t = 2 * Math.PI * i / 120; return [k * l11 * Math.cos(t), k * (l21 * Math.cos(t) + l22 * Math.sin(t))]; }), C('blue'), 2);
  arrow(P.g, P.X(0), P.Y(0), P.X(m[0]), P.Y(m[1]), C('amber'), 2.4); P.dot(m[0], m[1], C('amber'), 4);
  const D = v * w - c * c, q = (w * m[0] ** 2 - 2 * c * m[0] * m[1] + v * m[1] ** 2) / D;
  read('dvread', [`m′m = ${B(fmt(m[0] ** 2 + m[1] ** 2, 2))} (plain length ${fmt(Math.hypot(...m))})`, `m′V⁻¹m = ${B(fmt(q, 2))}`, `χ²₂ critical value 5.99 → ${q > 5.991 ? '<span class="r">reject H₀</span>' : '<span class="g">do not reject H₀</span>'}`, `p-value ${B(fmt(1 - chi2Cdf(q, 2), 4))}`]);
}
fig('dvsvg', ['dv_1', 'dv_2', 'dv_v', 'dv_w', 'dv_r'], dvDraw, () => { dvZ = Array.from({ length: 350 }, () => [randn(), randn()]); });
ACT.dvFlip = () => { dvS = -dvS; setS('dv_1', 1); setS('dv_2', dvS); dvDraw(); };

// =====================================================================
// 20 · accept or reject
// =====================================================================
function nullPlot(id, pdf, cdf, quant, a, side, obs, R = 5) {
  const P = plot(id, { x: [-R, R], y: [0, pdf(0) * 1.12], noy: true, pad: { l: 14 }, xl: 'test statistic under H₀' });
  const c = side === 'two' ? quant(1 - a / 2) : quant(1 - a);
  if (side !== 'left') P.area(pdf, c, R, C('red')); if (side === 'two') P.area(pdf, -R, -c, C('red')); if (side === 'left') P.area(pdf, -R, -c, C('red'));
  P.fn(pdf, -R, R, C('text'), 2);
  if (side !== 'left') { P.v(c, C('red'), 1); P.t(c, pdf(0) * 1.04, fmt(c), C('red'), 'middle', 9.5); } if (side !== 'right') { P.v(-c, C('red'), 1); P.t(-c, pdf(0) * 1.04, fmt(-c), C('red'), 'middle', 9.5); }
  const o = Math.max(-R + 0.05, Math.min(R - 0.05, obs)); P.v(o, C('amber'), 2.6, '');
  const p = side === 'two' ? 2 * (1 - cdf(Math.abs(obs))) : side === 'right' ? 1 - cdf(obs) : cdf(obs), rej = side === 'two' ? Math.abs(obs) > c : side === 'right' ? obs > c : obs < -c;
  return { c, p, rej };
}
const verdict = (r) => (r ? '<span class="r">reject H₀</span>' : '<span class="g">do not reject H₀</span>');
const pv = (p) => (p < 0.0001 ? '< 0.0001' : fmt(p, 4));
function ztDraw() {
  const z = val('zt_z'), a = val('zt_a') / 100, v = +sel('zt_d'), h = sel('zt_h');
  const o = nullPlot('ztsvg', (x) => tPdf(x, v), (x) => tCdf(x, v), (p) => tq(p, v), a, h, z);
  read('ztread', [`critical value ${B((h === 'two' ? '±' : h === 'left' ? '−' : '') + fmt(o.c, 3))}`, `p-value ${B(pv(o.p))}`, `at ${fmt(a * 100, 1)}%: ${verdict(o.rej)}`]);
}
fig('ztsvg', ['zt_z', 'zt_a', 'zt_h', 'zt_d'], ztDraw);
ACT.ztSet = () => { setS('zt_z', 4); ztDraw(); }; ACT.ztSet2 = () => { setS('zt_z', 0.1); ztDraw(); }; ACT.ztSet3 = () => { setS('zt_z', 1.9); ztDraw(); };

// =====================================================================
// 21 · size and power
// =====================================================================
function pwDraw() {
  const a = val('pw_a') / 100, b = val('pw_b'), n = val('pw_n'), s = val('pw_s'), two = sel('pw_h') === 'two', k = Math.sqrt(n) / s, d = b * k, c = two ? zq(1 - a / 2) : zq(1 - a);
  const hi = Math.max(5, Math.min(d + 4, 14)), P = plot('pwsvg', { x: [-4.5, hi], y: [0, 0.46], noy: true, pad: { l: 14 }, xl: 'z = b₂ / sd(b₂)' });
  const f0 = normPdf, f1 = (x) => normPdf(x - d);
  P.area(f1, two ? -c : -4.5, Math.min(c, hi), C('amber'), 0.35); P.area(f0, c, hi, C('red'), 0.6); if (two) P.area(f0, -4.5, -c, C('red'), 0.6);
  P.fn(f0, -4.5, hi, C('muted'), 2); P.fn(f1, -4.5, hi, C('blue'), 2); P.v(c, C('red'), 1.2); if (two) P.v(-c, C('red'), 1.2);
  P.t(0, 0.425, 'H₀ true', C('muted'), 'middle'); if (d > 1.3) P.t(Math.min(d, hi - 0.8), 0.425, 'β₂ = ' + fmt(b), C('blue'), 'middle');
  const pow = (dd) => (two ? 1 - normCdf(c - dd) + normCdf(-c - dd) : 1 - normCdf(c - dd));
  read('pwread', [`size = P(Type I) = ${B(fmt(a * 100, 1) + '%')}`, `critical value ${B(fmt(c, 3))}`, b > 0 ? `P(Type II) = ${B(fmt((1 - pow(d)) * 100, 1) + '%')}` : 'H₀ is true: no Type II error possible', b > 0 ? `power = ${B(fmt(pow(d) * 100, 1) + '%')}` : '', `z is centred at β₂√n/σ = ${B(fmt(d, 2))}`].filter(Boolean));
  const Q = plot('pcsvg', { x: [two ? -1.5 : -0.5, 1.5], y: [0, 1.05], xl: 'true β₂', yl: 'power' });
  Q.fn((x) => pow(x * k), two ? -1.5 : -0.5, 1.5, C('blue'), 2); Q.h(a, C('red'), 1); Q.dot(b, pow(d), C('amber'), 4);
}
fig('pwsvg', ['pw_a', 'pw_b', 'pw_n', 'pw_s', 'pw_h'], pwDraw);

// =====================================================================
// 22 · chi-square; zero covariance
// =====================================================================
function chDraw() {
  const k = Math.round(val('ch_k')), av = chk('ch_av'), hi = av ? 4 : Math.max(16, k + 4 * Math.sqrt(2 * k)), pdf = (q) => (x) => (av ? q * chi2Pdf(x * q, q) : chi2Pdf(x, q));
  const pk = k <= 2 ? 0.6 : pdf(k)(av ? (k - 2) / k : k - 2) * 1.2, ym = Math.max(pk, av ? 0.9 : 0.12), P = plot('chsvg', { x: [0, hi], y: [0, Math.min(ym, av ? 4 : 0.6)], noy: true, pad: { l: 14 }, xl: av ? 'χ²/k' : 'χ²' });
  for (const q of [1, 2, 5, 10]) P.fn(pdf(q), 0.001, hi, C('border2'), 1.2);
  const c = inv((x) => chi2Cdf(x, k), 0.95, 0, 400) / (av ? k : 1); P.area(pdf(k), c, hi, C('red'), 0.6); P.fn(pdf(k), 0.001, hi, C('blue'), 2.4); P.v(c, C('red'), 1); P.v(av ? 1 : k, C('amber'), 1.2);
  read('chread', [`mean ${B(av ? '1' : k)} (amber)`, `variance ${B(av ? fmt(2 / k, 3) : 2 * k)}`, `95% quantile ${B(fmt(c, 3))}`]);
}
fig('chsvg', ['ch_k', 'ch_av'], chDraw);
let zc = null;
function zcDraw() {
  const n = Math.round(val('zc_n')), svg = $('zcsvg'); svg.innerHTML = '';
  const F = [(u, i) => zc.e[i], (u) => u * u, (u) => -u * u, (u) => Math.cos(2.4 * u)], nm = ['independent', 'Y₂ = Y₁²', 'Y₂ = −Y₁²', 'Y₂ = cos(2.4·Y₁)'], rg = [[-3.5, 3.5], [-0.5, 9], [-9, 0.5], [-1.3, 1.3]], cs = [];
  F.forEach((f, k) => {
    const x0 = 14 + k * 178, w = 164, X = (v) => x0 + (v + 3.2) / 6.4 * w, Y = (v) => 168 - (v - rg[k][0]) / (rg[k][1] - rg[k][0]) * 140;
    el('rect', { x: x0, y: 24, width: w, height: 148, fill: 'none', stroke: C('border2') }, svg);
    const a = zc.u.slice(0, n), b = a.map((u, i) => f(u, i));
    a.forEach((u, i) => { if (Math.abs(u) < 3.2 && b[i] > rg[k][0] && b[i] < rg[k][1]) el('circle', { cx: X(u), cy: Y(b[i]), r: 1.5, fill: k ? C('blue') : C('green') }, svg); });
    txt(svg, x0 + w / 2, 16, nm[k], C('text'), 'middle'); cs.push(corr(a, b)); txt(svg, x0 + w / 2, 188, 'sample corr. ' + fmt(cs[k]), C('muted'), 'middle', 9.5);
  });
  read('zcread', ['all four theoretical covariances are 0', 'the sample correlations differ from 0 only by sampling noise']);
}
fig('zcsvg', ['zc_n'], zcDraw, () => { zc = { u: randns(800), e: randns(800) }; });
ACT.zcNew = () => { zc = { u: randns(800), e: randns(800) }; zcDraw(); };

// =====================================================================
// 23 · t vs normal   24 · F   25 · calculator
// =====================================================================
function ttDraw() {
  const v = Math.round(val('tt_d')), a = val('tt_a') / 100, c = tq(1 - a / 2, v), P = plot('ttsvg', { x: [-5, 5], y: [0, 0.44], noy: true, pad: { l: 14 }, xl: 't' });
  const f = (x) => tPdf(x, v); P.area(f, c, 5, C('red')); P.area(f, -5, -c, C('red')); P.fn(normPdf, -5, 5, C('muted'), 1.6, '5 3'); P.fn(f, -5, 5, C('blue'), 2.2); P.v(c, C('red'), 1); P.v(-c, C('red'), 1);
  txt(P.svg, P.x0 + 8, P.top + 10, '— t', C('blue')); txt(P.svg, P.x0 + 34, P.top + 10, '-- N(0,1)', C('muted'));
  read('ttread', [`t critical value ±${B(fmt(c, 3))}`, `N(0,1) critical value ±${B(fmt(zq(1 - a / 2), 3))}`, `P(|t| > 1.96) = ${B(fmt(2 * (1 - tCdf(1.96, v)) * 100, 1) + '%')} instead of 5%`]);
}
fig('ttsvg', ['tt_d', 'tt_a'], ttDraw); ACT.ttSet3 = () => { setS('tt_d', 3); ttDraw(); }; ACT.ttSet50 = () => { setS('tt_d', 50); ttDraw(); };
function ftDraw() {
  const J = Math.round(val('ft_j')), d = Math.round(val('ft_d')), a = val('ft_a') / 100, F = val('ft_f'), c = inv((x) => fCdf(x, J, d), 1 - a, 0, 5000), hi = Math.max(6, Math.min(c * 1.35, 14), F + 1), f = (x) => fPdf(x, J, d);
  const ym = J <= 2 ? 1.1 : Math.max(...Array.from({ length: 80 }, (_, i) => f(0.05 + i * 0.04))) * 1.15, P = plot('ftsvg', { x: [0, hi], y: [0, ym], noy: true, pad: { l: 14 }, xl: 'F-statistic under H₀' });
  P.area(f, Math.min(c, hi), hi, C('red'), 0.6); P.fn(f, 0.001, hi, C('text'), 2); P.v(c, C('red'), 1.2); P.t(Math.min(c, hi), ym * 0.94, ' F̄ = ' + fmt(c), C('red')); P.v(F, C('amber'), 2.6, '');
  read('ftread', [`critical value F̄ = ${B(fmt(c, 3))}`, `p-value ${B(pv(1 - fCdf(F, J, d)))}`, `${verdict(F > c)}`, `J·F̄ = ${B(fmt(J * c, 2))} vs χ² critical ${fmt(inv((x) => chi2Cdf(x, J), 1 - a, 0, 400), 2)}`, J === 1 ? `√F̄ = ${B(fmt(Math.sqrt(c), 3))} = t critical value` : '']);
}
fig('ftsvg', ['ft_j', 'ft_d', 'ft_a', 'ft_f'], ftDraw);
function tcDraw() {
  const b = val('tc_b'), q = val('tc_q'), v = val('tc_v'), s = val('tc_s'), d = sel('tc_k') === 'kn' ? 1e9 : Math.round(val('tc_d')), se = Math.sqrt(s * v), t = (b - q) / se;
  const o = nullPlot('tcsvg', (x) => tPdf(x, d), (x) => tCdf(x, d), (p) => tq(p, d), 0.05, 'two', t);
  read('tcread', [`Rb − q = ${B(fmt(b - q, 3))}`, `denominator √(${sel('tc_k') === 'kn' ? 'σ²' : 's²'}·R(X′X)⁻¹R′) = ${B(fmt(se, 4))}`, `statistic = ${B(fmt(t, 3))}`, `distribution ${B(d > 1e6 ? 'N(0,1)' : 't with ' + d + ' d.f.')}`, `critical ±${B(fmt(o.c, 3))}`, `p-value ${B(pv(o.p))}`, verdict(o.rej)]);
}
fig('tcsvg', ['tc_b', 'tc_q', 'tc_v', 'tc_s', 'tc_d', 'tc_k'], tcDraw);
const tcSet = (b, q, v, s, d, k) => { setS('tc_b', b); setS('tc_q', q); setS('tc_v', v); setS('tc_s', s); setS('tc_d', d); $('tc_k').value = k; tcDraw(); };
ACT.tcEs = () => tcSet(1.3, 1, 110 / 3900, 20, 26, 'un'); ACT.tcW10 = () => tcSet(0.5, 3, 0.3, 2, 98, 'kn'); ACT.tcW20 = () => tcSet(0.5, 3, 0.3, 20, 98, 'kn'); ACT.tcRun = () => tcSet(0.9, 0, 0.1, 1.9 / 3, 3, 'un');

// =====================================================================
// 26 · mutual funds
// =====================================================================
let mf = null;
function mfNew() { mf = { z: randns(2000), u: Array.from({ length: 2000 }, Math.random), z2: null }; }
function mfDraw() {
  const n = Math.round(val('mf_n')), p = val('mf_p') / 100, d = val('mf_a'), k = sel('mf_c'), cut = k === 'bonf' ? zq(1 - 0.05 / n) : tq(+k, 498);
  const sk = mf.u.slice(0, n).map((u) => u < p), t = mf.z.slice(0, n).map((z, i) => z + (sk[i] ? d : 0)), win = t.map((v) => v > cut);
  const hi = Math.max(5, p > 0 ? d + 4 : 5), h = histo(t, -5, hi, Math.round((hi + 5) * 5)), P = plot('mfsvg', { x: [-5, hi], y: [0, Math.max(0.45, ...h.d) * 1.1], noy: true, pad: { l: 14 }, xl: 't-statistic of α̂ᵢ' });
  h.d.forEach((q, i) => { const a = h.lo + i * h.w; if (q > 0) P.bar(a, a + h.w, q, a + h.w / 2 > cut ? C('red') : C('muted'), 0.7); });
  P.fn((x) => tPdf(x, 498), -5, hi, C('text'), 2); P.v(cut, C('red'), 1.4); P.t(cut, 0.43, ' ' + fmt(cut), C('red'));
  const nw = win.filter(Boolean).length, lucky = win.filter((w, i) => w && !sk[i]).length, lo = t.filter((v) => v < tq(0.05, 498)).length, a = 1 - normCdf(cut);
  const R = [`pass the rule: ${B(nw)}`, `of which lucky (true α = 0): ${B(lucky)}`, `expected by luck alone if nobody is skilled: ${B(fmt(n * a, 1))}`, `t < 0.05 quantile: ${B(lo)} (expected ${fmt(n * 0.05, 0)})`];
  if (p > 0) R.push(`skilled funds found: ${B(nw - lucky)} of ${sk.filter(Boolean).length}`);
  if (mf.z2) { const nx = t.map((_, i) => mf.z2[i] + (sk[i] ? d : 0)).filter((_, i) => win[i]); R.push(nx.length ? `<span class="a">next period, the winners' average t = ${B(fmt(mean(nx)))}; still passing: ${B(nx.filter((v) => v > cut).length)} of ${nx.length}</span>` : 'no winners to follow'); }
  read('mfread', R);
}
fig('mfsvg', ['mf_n', 'mf_p', 'mf_a', 'mf_c'], mfDraw, mfNew);
ACT.mfNew = () => { mfNew(); mfDraw(); }; ACT.mfNext = () => { mf.z2 = randns(2000); mfDraw(); };

// =====================================================================
// 27–30 · AR(1)
// =====================================================================
let arZ = null;
function arDraw() {
  const p = val('ar_1'), c = val('ar_0'), s = val('ar_s'), T = Math.round(val('ar_t')), st = Math.abs(p) < 0.9999, mu = c / (1 - p), v = s * s / (1 - p * p);
  let y = st ? mu : 0; const pts = [[0, y]]; for (let t = 1; t <= T; t++) { y = c + p * y + s * arZ[t]; pts.push([t, y]); }
  const ys = pts.map((q) => q[1]), b = st ? 2.2 * Math.sqrt(v) : 0, lo = Math.min(...ys, st ? mu - b : 0), hi = Math.max(...ys, st ? mu + b : 0), m = (hi - lo) * 0.05 + 0.1;
  const P = plot('arsvg', { x: [0, T], y: [lo - m, hi + m], xl: 't', yl: 'Yₜ', nx: 10 });
  if (st) { el('rect', { x: P.x0, width: P.x1 - P.x0, y: P.Y(mu + 2 * Math.sqrt(v)), height: P.Y(mu - 2 * Math.sqrt(v)) - P.Y(mu + 2 * Math.sqrt(v)), fill: C('red'), opacity: 0.07 }, P.g); P.h(mu, C('red'), 1.4); }
  P.path(pts, C('blue'), 1.5);
  read('arread', [st ? `unconditional mean φ₀/(1−φ₁) = ${B(fmt(mu))}` : `<span class="r">${Math.abs(p) > 1.0001 ? 'explosive' : 'unit root'}: no unconditional mean or variance</span>`, st ? `variance σ²/(1−φ₁²) = ${B(fmt(v))}, sd ${fmt(Math.sqrt(v))}` : '', `this path: mean ${B(fmt(mean(ys)))}, variance ${B(fmt(sd(ys) ** 2))}`, p > 0 && p < 1 ? `half-life of a shock ${B(fmt(Math.log(0.5) / Math.log(p), 1))} periods` : '']);
}
fig('arsvg', ['ar_1', 'ar_0', 'ar_s', 'ar_t'], arDraw, () => { arZ = randns(402); });
ACT.arNew = () => { arZ = randns(402); arDraw(); };
for (const [n, v] of [['arSet0', 0], ['arSet5', 0.5], ['arSetM', -0.5], ['arSet1', 1]]) ACT[n] = () => { setS('ar_1', v); setS('ar_0', 0); arDraw(); };
function woDraw() {
  const p = val('wo_1'), P = plot('wosvg', { x: [-0.5, 30.5], y: [p < 0 ? -1.05 : 0, 1.08], xl: 'lag j', nx: 12 });
  for (let j = 0; j <= 30; j++) { const w = p ** j; P.line(j, 0, j, w, C('blue'), 5); } P.h(0, C('border2'), 1, '');
  read('woread', [`φ₁⁵ = ${B(fmt(p ** 5, 3))}`, `φ₁²⁰ = ${B(fmt(p ** 20, 3))}`, Math.abs(p) < 1 ? `sum of weights ${B(fmt(1 / (1 - p), 2))}, sum of squares ${B(fmt(1 / (1 - p * p), 2))}` : '<span class="r">weights never fade: the sums diverge</span>']);
}
fig('wosvg', ['wo_1'], woDraw);

let fo = null; const FO_PAST = [0, 1.05, 0.1, 0.15, 0, -1.8, -1.3, 0.55, -0.2, 1.2, 0.2, 1.2, 0.8, -0.45, 0.9, -0.25, -1.3, -0.5, 0.9, 1.5, 2.3, 3.05, 2.8, 2.4];
function foDraw() {
  const p = val('fo_1'), c = val('fo_0'), y0 = val('fo_y'), st = Math.abs(p) < 0.9999, mu = c / (1 - p), H = 25;
  const f = [], s = []; let v = 0, m = y0; for (let h = 1; h <= H; h++) { m = c + p * m; v = 1 + p * p * v; f.push(m); s.push(1.96 * Math.sqrt(v)); }
  const all = [...FO_PAST, y0, ...f.map((q, i) => q + s[i]), ...f.map((q, i) => q - s[i])], lo = Math.min(...all) - 0.3, hi = Math.max(...all) + 0.3;
  const P = plot('fosvg', { x: [0, 25 + H], y: [lo, hi], xl: 't', nx: 10 });
  let d = `M${P.X(25)} ${P.Y(y0)}`; f.forEach((q, i) => (d += `L${P.X(26 + i)} ${P.Y(q + s[i])}`)); for (let i = H - 1; i >= 0; i--) d += `L${P.X(26 + i)} ${P.Y(f[i] - s[i])}`; el('path', { d: d + 'Z', fill: C('red'), opacity: 0.12 }, P.g);
  for (const z of fo) { let y = y0; P.path([[25, y0], ...z.map((q, i) => [26 + i, (y = c + p * y + q)])], C('dim'), 0.8); }
  if (st) P.h(mu, C('green'), 1.2); P.v(25, C('muted'), 1);
  P.path([...FO_PAST.map((q, i) => [i + 1, q]), [25, y0]], C('blue'), 1.8); P.dot(25, y0, C('blue'), 4); f.forEach((q, i) => P.dot(26 + i, q, C('red'), 2.4));
  read('foread', [1, 2, 3, 10].map((h) => `h = ${h}: ${B(fmt(f[h - 1], 3))} ± ${fmt(s[h - 1])}`).concat(st ? [`limit φ₀/(1−φ₁) = ${B(fmt(mu))} ± ${fmt(1.96 / Math.sqrt(1 - p * p))}`] : ['<span class="r">random walk: no limit, the band grows like √h</span>']));
}
fig('fosvg', ['fo_1', 'fo_0', 'fo_y'], foDraw, () => { fo = Array.from({ length: 3 }, () => randns(25)); });
ACT.foNew = () => { fo = Array.from({ length: 3 }, () => randns(25)); foDraw(); }; ACT.foSlide = () => { setS('fo_1', 0.5); setS('fo_0', 0); setS('fo_y', 1.7); foDraw(); };

function acf(y, L) { const m = mean(y), v = sum(y.map((q) => (q - m) ** 2)), o = []; for (let l = 1; l <= L; l++) { let s = 0; for (let t = l; t < y.length; t++) s += (y[t] - m) * (y[t - l] - m); o.push(s / v); } return o; }
let acZ = null;
function acDraw() {
  const p = val('ac_1'), T = Math.round(val('ac_t')); let y = acZ[0] / Math.sqrt(1 - p * p); const s = []; for (let t = 1; t <= T; t++) { s.push(y); y = p * y + acZ[t]; }
  const a = acf(s, 25), b = 1.96 / Math.sqrt(T), P = plot('acsvg', { x: [0, 26], y: [p < 0 ? -1.05 : -0.45, 1.05], xl: 'lag h', nx: 13 });
  P.h(0, C('border2'), 1, ''); P.h(b, C('muted'), 1); P.h(-b, C('muted'), 1); a.forEach((q, i) => { P.line(i + 1, 0, i + 1, q, C('blue'), 5); P.dot(i + 1, p ** (i + 1), C('red'), 2.6); });
  read('acread', [1, 2, 5].map((h) => `ρ(${h}) = φ₁^${h}: theory ${B(fmt(p ** h, 3))}, sample ${B(fmt(a[h - 1], 3))}`).concat([`bars outside the band: ${B(a.filter((q) => Math.abs(q) > b).length)} of 25`]));
}
fig('acsvg', ['ac_1', 'ac_t'], acDraw, () => { acZ = randns(2002); }); ACT.acNew = () => { acZ = randns(2002); acDraw(); };
let rw = null;
function rwDraw() {
  const p = val('rw_1'), c = val('rw_d'), T = 150, P0 = []; let mx = 1; const S = []; let v = 0, m = 0; for (let t = 1; t <= T; t++) { v = 1 + p * p * v; m = c + p * m; S.push([t, m, 1.96 * Math.sqrt(v)]); mx = Math.max(mx, Math.abs(m) + 1.96 * Math.sqrt(v)); }
  for (const z of rw) { let y = 0; P0.push([[0, 0], ...z.map((q, i) => [i + 1, (y = c + p * y + q)])]); }
  const P = plot('rwsvg', { x: [0, T], y: [-mx * 1.15, mx * 1.15], xl: 't' }); P0.forEach((q) => P.path(q, C('blue'), 0.6)); P.path([[0, 0], ...S.map((q) => [q[0], q[1] + q[2]])], C('red'), 2); P.path([[0, 0], ...S.map((q) => [q[0], q[1] - q[2]])], C('red'), 2);
  const g = (t) => { const a = P0.map((q) => q[t][1]); return fmt(sd(a) ** 2, 1); };
  read('rwread', [`variance across paths: t = 25: ${B(g(25))}, t = 50: ${B(g(50))}, t = 150: ${B(g(150))}`, `theory: ${[25, 50, 150].map((t) => fmt((S[t - 1][2] / 1.96) ** 2, 1)).join(', ')}`, p > 0.9999 ? '<span class="r">V[Yₜ] = t·σ²: depends on t, not stationary</span>' : `converges to ${B(fmt(1 / (1 - p * p), 1))}: stationary`]);
}
fig('rwsvg', ['rw_1', 'rw_d'], rwDraw, () => { rw = Array.from({ length: 50 }, () => randns(150)); });
ACT.rwNew = () => { rw = Array.from({ length: 50 }, () => randns(150)); rwDraw(); }; ACT.rwSet9 = () => { setS('rw_1', 0.9); setS('rw_d', 0); rwDraw(); }; ACT.rwSet1 = () => { setS('rw_1', 1); setS('rw_d', 0); rwDraw(); };
let ph = null;
function phRun() { const p = val('ph_1'), T = Math.round(val('ph_t')); ph = []; for (let k = 0; k < 1500; k++) { let y = p < 0.999 ? randn() / Math.sqrt(1 - p * p) : 0; const x = [], d = []; for (let t = 0; t < T; t++) { x.push(y); y = p * y + randn(); d.push(y); } ph.push(ols1(x, d).b2); } }
function phDraw() {
  const p = val('ph_1'), lo = Math.min(...ph) - 0.02, hi = Math.max(...ph, p + 0.05) + 0.02, h = histo(ph, lo, hi, 45), mx = Math.max(...h.d) * 1.15, P = plot('phsvg', { x: [lo, hi], y: [0, mx], noy: true, pad: { l: 14 }, xl: 'φ̂₁' });
  drawHist(P, h, C('blue')); P.v(p, C('red'), 2); const m = mean(ph); el('path', { d: `M${P.X(m)} ${P.bot - 12}l6 6l-6 6l-6 -6Z`, fill: C('amber'), stroke: C('bg') }, P.g);
  read('phread', [`true φ₁ = ${B(fmt(p))}`, `average φ̂₁ = ${B(fmt(m, 3))}`, `bias = ${B(fmt(m - p, 3))}`, `sd = ${B(fmt(sd(ph), 3))}`, p < 0.999 ? `large-sample theory √((1−φ₁²)/T) = ${fmt(Math.sqrt((1 - p * p) / val('ph_t')), 3)}` : '']);
}
const phGo = () => { phRun(); phDraw(); };
fig('phsvg', [], phDraw, phRun); if ($('phsvg')) on(['ph_1', 'ph_t'], phGo); ACT.phRun = phGo;

// =====================================================================
// 31–35 · returns, GARCH, VaR, ES
// =====================================================================
function garch(z, b0, b1, b2, crash) { let v = b0 / Math.max(1e-6, 1 - b1 - b2); const r = [], s = []; z.forEach((q, t) => { s.push(Math.sqrt(v)); let x = Math.sqrt(v) * q; if (crash && t === crash) x = -8; r.push(x); v = b0 + b1 * v + b2 * x * x; }); return { r, s }; }
const t5u = () => randt(5) * Math.sqrt(3 / 5);
let sf = null;
function sfRun() { const k = sel('sf_k'), z = Array.from({ length: 2000 }, k === 'garcht' ? t5u : randn); sf = k === 'iid' ? z : garch(z, 0.015, 0.89, 0.095).r; }
function acfPanel(id, a1, a2, T, n1, n2) {
  const b = 1.96 / Math.sqrt(T); $(id).innerHTML = '';
  [[a1, 0, 110, n1], [a2, 110, 220, n2]].forEach(([a, h0, h1, nm]) => { const P = plot(id, { x: [0, 41], y: [-0.12, 0.42], keep: true, h0, h1, pad: { t: 14, b: 20, l: 30 }, ny: 3 }); P.h(0, C('border2'), 1, ''); P.h(b, C('muted'), 1); P.h(-b, C('muted'), 1); a.forEach((q, i) => P.line(i + 1, 0, i + 1, q, C('blue'), 3)); txt(P.svg, P.x1, h0 + 12, nm, C('text'), 'end'); });
}
function sfDraw() {
  const mx = Math.max(...sf.map(Math.abs)) * 1.05, P = plot('sfsvg', { x: [0, 2000], y: [-mx, mx], xl: 'day', nx: 10 }); P.path(sf.map((q, i) => [i, q]), C('blue'), 0.8);
  const a1 = acf(sf, 40), a2 = acf(sf.map((q) => q * q), 40); acfPanel('sfacf', a1, a2, 2000, 'ACF rₜ', 'ACF rₜ²');
  const m = mean(sf), s = sd(sf), z = sf.map((q) => (q - m) / s), h = histo(z, -5, 5, 60), Q = plot('sfhis', { x: [-5, 5], y: [0, Math.max(0.42, ...h.d) * 1.08], noy: true, pad: { l: 14 }, xl: 'standardized return' }); drawHist(Q, h, C('blue'), 0.55); Q.fn(normPdf, -5, 5, C('green'), 2);
  read('sfread', [`kurtosis ${B(fmt(mean(z.map((q) => q ** 4)), 2))} (normal: 3)`, `days beyond ±4 sd: ${B(z.filter((q) => Math.abs(q) > 4).length)} (normal: expected ${fmt(2000 * 2 * (1 - normCdf(4)), 2)})`, `largest move ${B(fmt(Math.max(...z.map(Math.abs)), 1))} sd`, `ACF(1): returns ${B(fmt(a1[0]))}, squares ${B(fmt(a2[0]))}`]);
}
const sfGo = () => { sfRun(); sfDraw(); };
fig('sfsvg', [], sfDraw, sfRun); if ($('sfsvg')) on(['sf_k'], sfGo); ACT.sfNew = sfGo;

let gaZ = null, gaC = 0;
function gaDraw() {
  let b1 = val('ga_1'), b2 = val('ga_2'); const lv = val('ga_v'), per = b1 + b2, ok = per < 0.9995, b0 = lv * lv * Math.max(0.0005, 1 - per), svg = $('gasvg'); svg.innerHTML = '';
  const { r, s } = garch(gaZ, b0, b1, b2, gaC), mx = Math.min(40, Math.max(...r.map(Math.abs)) * 1.05), sm = Math.min(40, Math.max(...s) * 1.1);
  const P = plot('gasvg', { x: [0, 800], y: [-mx, mx], keep: true, h0: 0, h1: 160, nx: 10, nox: true, ny: 4 }); P.path(r.map((q, i) => [i, q]), C('blue'), 0.9); txt(svg, P.x1, 12, 'return rₜ (%)', C('text'), 'end');
  const Q = plot('gasvg', { x: [0, 800], y: [0, sm], keep: true, h0: 150, h1: 280, nx: 10, ny: 3, xl: 'day' }); Q.path(s.map((q, i) => [i, q]), C('red'), 1.5); if (ok) Q.h(lv, C('green'), 1.2); txt(svg, Q.x1, 160, 'conditional volatility σₜ (%)', C('text'), 'end');
  read('garead', [`β₀ = ${B(fmt(b0, 4))}`, `persistence β₁+β₂ = ${B(fmt(per, 2))}${ok ? '' : ' <span class="r">≥ 1: no long-run variance</span>'}`, per > 0 && ok ? `half-life ${B(fmt(Math.log(0.5) / Math.log(per), 1))} days` : '', `ACF(1): rₜ ${B(fmt(acf(r, 1)[0]))}, rₜ² ${B(fmt(acf(r.map((q) => q * q), 1)[0]))}`, `kurtosis ${B(fmt(mean(r.map((q) => ((q - mean(r)) / sd(r)) ** 4)), 1))}`]);
}
fig('gasvg', ['ga_1', 'ga_2', 'ga_v'], gaDraw, () => { gaZ = randns(800); });
const gaSet = (a, b, c = 0) => { setS('ga_1', a); setS('ga_2', b); gaC = c; gaDraw(); };
ACT.gaNew = () => { gaZ = randns(800); gaDraw(); }; ACT.gaArch = () => gaSet(0, 0.5); ACT.gaTyp = () => gaSet(0.9, 0.08); ACT.gaIid = () => gaSet(0, 0); ACT.gaCrash = () => { gaC = gaC ? 0 : 300; gaDraw(); };

let ll = null; const LLT = [0.90, 0.08, 1];
function llNew() { ll = garch(randns(1000), 0.02, LLT[0], LLT[1]); }
function llk(b1, b2, lv) { const b0 = lv * lv * Math.max(1e-4, 1 - b1 - b2); let v = lv * lv, L = 0; const s = []; for (const r of ll.r) { s.push(Math.sqrt(v)); L -= 0.5 * (Math.log(2 * Math.PI) + Math.log(v) + r * r / v); v = b0 + b1 * v + b2 * r * r; } return { L: b1 + b2 < 0.9999 ? L : -1e9, s }; }
let llBest = null;
function llDraw() {
  const b1 = val('ll_1'), b2 = val('ll_2'), lv = val('ll_v'), o = llk(b1, b2, lv), mx = Math.max(...ll.r.map(Math.abs)) * 1.02, P = plot('llsvg', { x: [0, 1000], y: [0, mx], xl: 'day', nx: 10 });
  ll.r.forEach((q, i) => P.line(i, 0, i, Math.abs(q), C('border2'), 0.8)); P.path(o.s.map((q, i) => [i, q]), C('blue'), 1.8);
  read('llread', [o.L > -1e8 ? `log L = ${B(fmt(o.L, 2))}` : '<span class="r">β₁ + β₂ ≥ 1: not stationary</span>', `log L at the true parameters = ${B(fmt(llk(...LLT).L, 2))}`, llBest ? `best found: log L = ${B(fmt(llBest.L, 2))} at β₁ = ${fmt(llBest.p[0], 3)}, β₂ = ${fmt(llBest.p[1], 3)}, vol ${fmt(llBest.p[2], 2)}` : '', `variance of ẑ = ${B(fmt(mean(ll.r.map((r, i) => (r / o.s[i]) ** 2)), 2))} (should be 1)`]);
}
fig('llsvg', ['ll_1', 'll_2', 'll_v'], llDraw, llNew);
ACT.llNew = () => { llNew(); llBest = null; llDraw(); }; ACT.llTrue = () => { setS('ll_1', LLT[0]); setS('ll_2', LLT[1]); setS('ll_v', LLT[2]); llDraw(); };
ACT.llFit = () => {
  let best = { L: -1e12, p: null }; for (const a of [0.3, 0.6, 0.8, 0.9]) for (const b of [0.03, 0.08, 0.15]) for (const c of [0.8, 1, 1.3]) { const L = llk(a, b, c).L; if (L > best.L) best = { L, p: [a, b, c] }; }
  let st = [0.05, 0.03, 0.1]; for (let it = 0; it < 60; it++) { let imp = false; for (let k = 0; k < 3; k++) for (const sg of [1, -1]) { const p = [...best.p]; p[k] += sg * st[k]; if (p[0] < 0 || p[1] < 0 || p[2] < 0.2) continue; const L = llk(...p).L; if (L > best.L + 1e-7) { best = { L, p }; imp = true; } } if (!imp) st = st.map((q) => q / 2); }
  llBest = best; setS('ll_1', best.p[0]); setS('ll_2', best.p[1]); setS('ll_v', best.p[2]); llDraw();
};

const VD = { norm: { f: normPdf, q: zq, es: (a) => -normPdf(zq(a)) / a } };
for (const v of [4, 5]) { const k = Math.sqrt((v - 2) / v); VD['t' + v] = { f: (x) => tPdf(x / k, v) / k, q: (p) => tq(p, v) * k, es: (a) => { const q = tq(a, v); return -k * tPdf(q, v) / a * (v + q * q) / (v - 1); } }; }
function vaDraw() {
  const s = val('va_s'), a = val('va_a') / 100, D = VD[sel('va_d')], z = D.q(a), es = D.es(a), V = -s * z, E = -s * es, pos = val('va_v') * 1000, f = (x) => D.f(x / s) / s;
  const R = 5 * s, P = plot('vasvg', { x: [-R, R], y: [0, f(0) * 1.15], noy: true, pad: { l: 14 }, xl: 'tomorrow’s return rₜ₊₁ (%)' });
  P.area(f, -R, -V, C('red'), 0.7); P.fn(f, -R, R, C('text'), 2); P.v(-V, C('red'), 1.8, ''); P.v(-E, C('amber'), 1.8); P.t(-V, f(0) * 1.05, ' −VaR', C('red')); P.t(-E, f(0) * 0.93, '−ES ', C('amber'), 'end');
  const cur = (x) => Math.round(x / 100 * pos).toLocaleString('en-US');
  read('varead', [`quantile z = ${B(fmt(z, 3))}`, `VaR = −σz = ${B(fmt(V, 2) + '%')} = ${B(cur(V))}`, `E[z | z < z_α] = ${B(fmt(es, 3))}`, `ES = ${B(fmt(E, 2) + '%')} = ${B(cur(E))}`, `ES/VaR = ${B(fmt(E / V, 2))}`]);
}
fig('vasvg', ['va_s', 'va_a', 'va_d', 'va_v'], vaDraw); ACT.vaSlide = () => { setS('va_s', 2.15); setS('va_a', 1); $('va_d').value = 'norm'; vaDraw(); };

let bt = null;
function btNew() { const z = Array.from({ length: 1500 }, sel('bt_d') === 't5' ? t5u : randn); bt = garch(z, 0.02, 0.89, 0.09); }
function btDraw() {
  const q = val('bt_z'), { r, s } = bt, S = sd(r), mx = Math.max(...r.map(Math.abs), q * Math.max(...s)) * 1.03, P = plot('btsvg', { x: [0, 1500], y: [-mx, mx * 0.75], xl: 'day', nx: 10 });
  P.path(r.map((v, i) => [i, v]), C('dim'), 0.8); P.path(s.map((v, i) => [i, -q * v]), C('blue'), 1.5); P.h(-q * S, C('amber'), 1.6, '');
  let a = 0, b = 0, cl = 0, last = -99; r.forEach((v, i) => { if (v < -q * s[i]) { a++; el('circle', { cx: P.X(i), cy: P.Y(v), r: 3.4, fill: 'none', stroke: C('red'), 'stroke-width': 1.6 }, P.g); } if (v < -q * S) { b++; if (i - last <= 10) cl++; last = i; el('line', { x1: P.X(i), x2: P.X(i), y1: P.bot - 7, y2: P.bot, stroke: C('amber'), 'stroke-width': 1.6 }, P.g); } });
  const zt = (k) => (k - 15) / Math.sqrt(1500 * 0.01 * 0.99);
  read('btread', [`expected at 1%: ${B('15')} ± 3.9`, `GARCH VaR violations: ${B(a)} (${fmt(a / 15, 2)}%), z = ${B(fmt(zt(a)))}`, `constant VaR violations: ${B(b)}, z = ${B(fmt(zt(b)))}, of which ${B(cl)} within 10 days of the previous one`]);
}
fig('btsvg', ['bt_z'], btDraw, btNew); if ($('btsvg')) on(['bt_d'], () => { btNew(); btDraw(); }); ACT.btNew = () => { btNew(); btDraw(); };

function niDraw() {
  const b1 = val('ni_1'), b2 = val('ni_2'), b3 = val('ni_3'), x = val('ni_r'), f = (r) => 0.02 + b1 + (b2 + (r < 0 ? b3 : 0)) * r * r, mx = Math.max(f(-6), f(6), 1.5) * 1.05;
  const P = plot('nisvg', { x: [-6, 6], y: [0, mx], xl: 'yesterday’s return rₜ₋₁ (%)', yl: 'σₜ²' }); P.fn((r) => f(-r), -6, 6, C('dim'), 1.2, '4 3'); P.fn(f, -6, 6, C('blue'), 2.4); P.v(0, C('border2'), 1); P.dot(x, f(x), C('amber'), 5);
  const lr = 1 - b1 - b2 - b3 / 2;
  read('niread', [`σₜ² after rₜ₋₁ = ${fmt(x, 1)}: ${B(fmt(f(x), 3))}`, `after the opposite sign: ${B(fmt(f(-x), 3))}`, lr > 0 ? `long-run variance ${B(fmt(0.02 / lr, 2))}` : '<span class="r">persistence ≥ 1</span>', `1% normal VaR: ${B(fmt(2.326 * Math.sqrt(f(x)), 2) + '%')}`]);
}
fig('nisvg', ['ni_1', 'ni_2', 'ni_3', 'ni_r'], niDraw); ACT.niSym = () => { setS('ni_3', 0); setS('ni_2', 0.08); niDraw(); }; ACT.niGjr = () => { setS('ni_1', 0.9); setS('ni_2', 0.02); setS('ni_3', 0.12); setS('ni_r', -2); niDraw(); };

// =====================================================================
// quick tests: first click counts; answers are remembered in this browser
// =====================================================================
const QK = 'prepusi-fe-quiz';
let QS = {}; try { QS = JSON.parse(localStorage.getItem(QK) || '{}'); } catch { /* private mode: scores last for this page only */ }
const qSave = () => { try { localStorage.setItem(QK, JSON.stringify(QS)); } catch { /* ignore */ } };
function quizInit() {
  document.querySelectorAll('.quiz').forEach((box) => {
    const key = box.dataset.quiz, qs = [...box.querySelectorAll('.mcq')], st = (QS[key] = { total: qs.length, a: (QS[key]?.a || []).slice(0, qs.length) });
    const score = () => { const d = st.a.filter((v) => v != null).length; st.ok = qs.filter((q, i) => st.a[i] === +q.dataset.ans).length; const r = box.querySelector('.qscore'); if (r) r.innerHTML = `<span>answered <b>${d}/${qs.length}</b></span><span>right at first try <b>${st.ok}</b></span><span class="btns"><button type="button" class="qagain">try again</button></span>`; r?.querySelector('.qagain')?.addEventListener('click', () => { st.a = []; qs.forEach((q) => { q.classList.remove('done'); q.querySelectorAll('.opts button').forEach((b) => b.classList.remove('ok', 'no')); }); score(); qSave(); dash(); }); };
    const mark = (q, i, k) => { const bs = [...q.querySelectorAll('.opts button')], ans = +q.dataset.ans; if (k !== ans) bs[k]?.classList.add('no'); bs[ans]?.classList.add('ok'); q.classList.add('done'); };
    qs.forEach((q, i) => { if (st.a[i] != null) mark(q, i, st.a[i]); [...q.querySelectorAll('.opts button')].forEach((b, k) => b.addEventListener('click', () => { if (st.a[i] == null) st.a[i] = k; mark(q, i, k); score(); qSave(); dash(); })); });
    score();
  });
}
function dash() {
  const d = $('qdash'); if (!d) return; const rows = []; let ok = 0, done = 0, tot = 0;
  document.querySelectorAll('.side a').forEach((a) => {
    const n = a.querySelector('.n')?.textContent; if (!n) return; const k = 's' + parseInt(n, 10), s = QS[k]; if (['s36', 's37', 's38', 's40'].includes(k)) return;
    const dn = s ? s.a.filter((v) => v != null).length : 0; if (s) { ok += s.ok || 0; done += dn; tot += s.total; }
    const pct = dn ? Math.round(100 * (s.ok || 0) / dn) : null;
    rows.push(`<a href="${a.getAttribute('href')}" style="display:flex;gap:8px;align-items:center;padding:2px 6px;border:1px solid var(--border);background:var(--panel2);color:var(--text)"><span class="tn" style="margin:0">${n}</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.textContent.slice(n.length)}</span><b class="${pct == null ? 'muted' : pct >= 80 ? 'g' : pct >= 50 ? 'a' : 'r'}">${s && dn ? `${s.ok || 0}/${s.total}` : '—'}</b></a>`);
  });
  d.innerHTML = `<div class="readout"><span>answered so far <b>${done}</b></span><span>right at first try <b>${ok}</b>${done ? ` (${Math.round(100 * ok / done)}%)` : ''}</span><span class="muted">green ≥ 80% · amber ≥ 50% · red below</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:4px;margin:8px 0;font-size:12px">${rows.join('')}</div>`;
}
ACT.quizReset = () => { if (!confirm('Delete all saved quick-test scores for this course?')) return; QS = {}; qSave(); location.reload(); };

// ---------- wiring ----------
document.addEventListener('click', (e) => { const b = e.target.closest?.('[data-do]'); if (b) ACT[b.dataset.do]?.(); });
document.querySelectorAll('figure svg[viewBox]').forEach((s) => { const w = s.viewBox.baseVal?.width; if (w) { s.style.maxWidth = Math.round(w * 1.45) + 'px'; s.style.marginLeft = 'auto'; s.style.marginRight = 'auto'; } });
quizInit(); dash();
const drawAll = () => DRAW.forEach((f) => f());
drawAll();
window.addEventListener('themechange', drawAll);
