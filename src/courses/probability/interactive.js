// Interactive figures for the probability course. Same conventions as the
// linear-algebra course: vanilla SVG drawing, colors read from CSS variables so
// theme switches (course.js dispatches 'themechange') repaint correctly.
const NS = 'http://www.w3.org/2000/svg';
function cv(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function rgba(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor) { const t = el('text', { x, y, fill, 'font-size': 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { return (+x).toFixed(d); }
// figure background (used to "erase" regions); falls back to the page bg
function bgOf(svg) { let n = svg.parentElement; while (n && n.tagName !== 'FIGURE') n = n.parentElement; return n ? getComputedStyle(n).backgroundColor : cv('--bg'); }

// per-slider decimal places so integers show as integers and probabilities as 0.05
function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { document.getElementById(id + '_v').textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { document.getElementById(id).value = v; document.getElementById(id + '_v').textContent = fmt(v, dec); } }
function val(id) { return parseFloat(document.getElementById(id).value); }

// standard normal pdf / cdf (Abramowitz–Stegun 7.1.26 for erf)
function ndpdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }
function ndcdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = ndpdf(Math.abs(x));
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}
// log-gamma (Lanczos) for the t density
function gammaln(z) {
  const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaln(1 - z);
  z -= 1; let x = 0.99999999999980993;
  for (let i = 0; i < 8; i++) x += g[i] / (z + i + 1);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
// deterministic RNG so redraws are stable and print matches screen
function mulberry32(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { const u = Math.max(rng(), 1e-12), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ---------- 01 · Venn ----------
const VENN = { R: { x: 8, y: 8, w: 304, h: 184 }, A: { cx: 125, cy: 100, r: 62 }, B: { cx: 195, cy: 100, r: 62 } };
let vennMode = 'AuB';
function circlePath(c) { return `M ${c.cx - c.r} ${c.cy} a ${c.r} ${c.r} 0 1 0 ${2 * c.r} 0 a ${c.r} ${c.r} 0 1 0 ${-2 * c.r} 0`; }
function vennDraw() {
  const svg = document.getElementById('vennsvg'); if (!svg) return;
  svg.innerHTML = '';
  const { R, A, B } = VENN, hi = rgba(cv('--green'), 0.4), bg = bgOf(svg);
  const defs = el('defs', {}, svg);
  const clipA = el('clipPath', { id: 'vclipA' }, defs); el('circle', { cx: A.cx, cy: A.cy, r: A.r }, clipA);
  const clipB = el('clipPath', { id: 'vclipB' }, defs); el('circle', { cx: B.cx, cy: B.cy, r: B.r }, clipB);
  const rect = () => el('rect', { x: R.x, y: R.y, width: R.w, height: R.h, fill: hi }, svg);
  const circ = (c, fill, clip) => el('circle', { cx: c.cx, cy: c.cy, r: c.r, fill, ...(clip ? { 'clip-path': `url(#${clip})` } : {}) }, svg);
  const m = vennMode;
  if (m === 'A') circ(A, hi);
  else if (m === 'B') circ(B, hi);
  else if (m === 'AuB') { circ(A, hi); circ(B, hi); }
  else if (m === 'AnB') circ(A, hi, 'vclipB');
  else if (m === 'Ac') { rect(); circ(A, bg); }
  else if (m === 'AmB') { circ(A, hi); circ(B, bg, 'vclipA'); }
  else if (m === 'sym') { circ(A, hi); circ(B, hi); circ(A, bg, 'vclipB'); }
  else if (m === 'none') { rect(); circ(A, bg); circ(B, bg); }
  // outlines on top
  el('rect', { x: R.x, y: R.y, width: R.w, height: R.h, fill: 'none', stroke: cv('--border2') }, svg);
  el('path', { d: circlePath(A), fill: 'none', stroke: cv('--blue'), 'stroke-width': 1.5 }, svg);
  el('path', { d: circlePath(B), fill: 'none', stroke: cv('--amber'), 'stroke-width': 1.5 }, svg);
  txt(72, 52, 'A', cv('--blue'), svg); txt(242, 52, 'B', cv('--amber'), svg); txt(288, 24, 'Ω', cv('--muted'), svg);
  const info = {
    A: ['A', 'P(A) — the whole blue circle, overlap included'],
    B: ['B', 'P(B) — the whole amber circle, overlap included'],
    AuB: ['A ∪ B', 'P(A) + P(B) − P(A∩B) — the overlap must not be counted twice'],
    AnB: ['A ∩ B', 'both events happen — the lens in the middle'],
    Ac: ['Aᶜ', '1 − P(A) — everything outside A (part of B included!)'],
    AmB: ['A \\ B', 'A but not B = P(A) − P(A∩B)'],
    sym: ['exactly one', 'P(A) + P(B) − 2·P(A∩B) — the union minus the overlap'],
    none: ['(A ∪ B)ᶜ', 'neither happens = 1 − P(A∪B); De Morgan: = Aᶜ ∩ Bᶜ'],
  }[m];
  const read = document.getElementById('vennread');
  if (read) read.innerHTML = `<span>region: <b>${info[0]}</b></span><span>${info[1]}</span>`;
}
window.vennShow = (m) => { vennMode = m; vennDraw(); };

// ---------- 02 · Bayes tree ----------
function byDraw() {
  const svg = document.getElementById('bysvg'); if (!svg) return;
  const p = val('by_p'), s = val('by_s'), f = val('by_f');
  svg.innerHTML = '';
  const G = cv('--green'), Rd = cv('--red'), M = cv('--muted'), D = cv('--dim');
  const root = [24, 115], nD = [130, 55], nH = [130, 175], lDF = [235, 25], lDN = [235, 85], lHF = [235, 145], lHN = [235, 205];
  const branch = (a, b, col, w) => el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, 'stroke-width': w }, svg);
  branch(root, nD, Rd, 1.5 + 3 * p); branch(root, nH, G, 1.5 + 3 * (1 - p));
  branch(nD, lDF, Rd, 1.2); branch(nD, lDN, D, 1.2); branch(nH, lHF, Rd, 1.2); branch(nH, lHN, D, 1.2);
  [[root, cv('--text')], [nD, Rd], [nH, G]].forEach(([c, col]) => el('circle', { cx: c[0], cy: c[1], r: 4, fill: col }, svg));
  txt(58, 76, `P(D)=${fmt(p)}`, Rd, svg); txt(52, 158, `P(Dᶜ)=${fmt(1 - p)}`, G, svg);
  txt(160, 30, fmt(s), M, svg); txt(160, 80, fmt(1 - s), M, svg);
  txt(160, 150, fmt(f), M, svg); txt(160, 200, fmt(1 - f), M, svg);
  const paths = [
    [lDF, 'D ∩ flag', p * s, Rd, true],
    [lDN, 'D ∩ no flag', p * (1 - s), D, false],
    [lHF, 'Dᶜ ∩ flag', (1 - p) * f, Rd, true],
    [lHN, 'Dᶜ ∩ no flag', (1 - p) * (1 - f), D, false],
  ];
  paths.forEach(([c, label, pr, col, flagged]) => {
    el('circle', { cx: c[0], cy: c[1], r: 3.5, fill: col }, svg);
    txt(c[0] + 10, c[1] - 2, label, flagged ? cv('--text') : M, svg);
    txt(c[0] + 10, c[1] + 11, fmt(pr, 4), flagged ? Rd : D, svg);
  });
  const pF = p * s + (1 - p) * f, post = (p * s) / pF;
  const read = document.getElementById('byread');
  if (read) read.innerHTML = `<span>P(flag) = ${fmt(p * s, 4)} + ${fmt((1 - p) * f, 4)} = <b>${fmt(pF, 4)}</b></span><span>posterior P(D | flag) = ${fmt(p * s, 4)} / ${fmt(pF, 4)} = <b>${fmt(post, 3)}</b></span><span>prior was ${fmt(p)} → evidence multiplied the odds by ${fmt(s / f, 1)}</span>`;
}
window.bySet = (p, s, f) => { setS([['by_p', p, 2], ['by_s', s, 2], ['by_f', f, 2]]); byDraw(); };

// ---------- 03 · exponential PDF <-> CDF ----------
function pcDraw() {
  const svg = document.getElementById('pcsvg'); if (!svg) return;
  const x0 = val('pc_x'), lam = val('pc_l');
  svg.innerHTML = '';
  const L = { x: 30, w: 270 }, Rt = { x: 350, w: 270 }, yb = 190, h = 155, xmax = 5, vmax = 2.6;
  const lx = (x) => L.x + (x / xmax) * L.w, rx = (x) => Rt.x + (x / xmax) * Rt.w;
  const lyv = (v) => yb - (v / vmax) * h, ryv = (v) => yb - v * (h - 10);
  const f = (x) => lam * Math.exp(-lam * x), F = (x) => 1 - Math.exp(-lam * x);
  // axes
  [[L.x, lx(xmax)], [Rt.x, rx(xmax)]].forEach(([a, b]) => el('line', { x1: a, y1: yb, x2: b, y2: yb, stroke: cv('--border2') }, svg));
  el('line', { x1: L.x, y1: yb, x2: L.x, y2: 20, stroke: cv('--border2') }, svg);
  el('line', { x1: Rt.x, y1: yb, x2: Rt.x, y2: 20, stroke: cv('--border2') }, svg);
  // shaded area under pdf up to x0
  let area = `M ${lx(0)} ${yb}`;
  for (let x = 0; x <= x0 + 1e-9; x += 0.05) area += ` L ${lx(x)} ${lyv(f(x))}`;
  area += ` L ${lx(x0)} ${yb} Z`;
  el('path', { d: area, fill: rgba(cv('--green'), 0.3) }, svg);
  // pdf curve
  let d = '';
  for (let x = 0; x <= xmax; x += 0.05) d += (d ? ' L' : 'M') + ` ${lx(x)} ${lyv(f(x))}`;
  el('path', { d, fill: 'none', stroke: cv('--green'), 'stroke-width': 2 }, svg);
  el('line', { x1: lx(x0), y1: yb, x2: lx(x0), y2: lyv(f(x0)), stroke: cv('--text'), 'stroke-dasharray': '3 3' }, svg);
  txt(lx(x0) - 4, yb + 14, 'x', cv('--text'), svg); txt(L.x + 4, 30, 'f(x) — PDF', cv('--green'), svg);
  // cdf curve
  el('line', { x1: Rt.x, y1: ryv(1), x2: rx(xmax), y2: ryv(1), stroke: cv('--border'), 'stroke-dasharray': '3 3' }, svg);
  txt(rx(xmax) + 4, ryv(1) + 4, '1', cv('--muted'), svg);
  d = '';
  for (let x = 0; x <= xmax; x += 0.05) d += (d ? ' L' : 'M') + ` ${rx(x)} ${ryv(F(x))}`;
  el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 2 }, svg);
  el('line', { x1: rx(x0), y1: yb, x2: rx(x0), y2: ryv(F(x0)), stroke: cv('--text'), 'stroke-dasharray': '3 3' }, svg);
  el('line', { x1: Rt.x, y1: ryv(F(x0)), x2: rx(x0), y2: ryv(F(x0)), stroke: cv('--green'), 'stroke-dasharray': '3 3' }, svg);
  el('circle', { cx: rx(x0), cy: ryv(F(x0)), r: 4, fill: cv('--blue') }, svg);
  txt(rx(x0) - 4, yb + 14, 'x', cv('--text'), svg); txt(Rt.x + 4, 30, 'F(x) — CDF', cv('--blue'), svg);
  const read = document.getElementById('pcread');
  if (read) read.innerHTML = `<span>f(${fmt(x0, 1)}) = <b>${fmt(f(x0), 3)}</b> (a density — can exceed 1)</span><span>shaded area = F(${fmt(x0, 1)}) = P(X ≤ ${fmt(x0, 1)}) = <b>${fmt(F(x0), 3)}</b></span><span>P(X &gt; ${fmt(x0, 1)}) = 1 − F = <b>${fmt(1 - F(x0), 3)}</b></span><span>E[X] = 1/λ = <b>${fmt(1 / lam, 2)}</b></span>`;
}

// ---------- 05 · binomial PMF + normal overlay ----------
function biDraw() {
  const svg = document.getElementById('bisvg'); if (!svg) return;
  const n = Math.round(val('bi_n')), p = val('bi_p');
  svg.innerHTML = '';
  const yb = 190, h = 160, x0 = 26, w = 306;
  // pmf via multiplicative recurrence, numerically stable enough for n<=80
  const pmf = [Math.pow(1 - p, n)];
  for (let k = 0; k < n; k++) pmf.push(pmf[k] * ((n - k) / (k + 1)) * (p / (1 - p)));
  const mx = Math.max(...pmf);
  const bw = w / (n + 1);
  const X = (k) => x0 + (k + 0.5) * bw;
  el('line', { x1: x0, y1: yb, x2: x0 + w, y2: yb, stroke: cv('--border2') }, svg);
  pmf.forEach((q, k) => el('rect', { x: X(k) - bw * 0.4, y: yb - (q / mx) * h, width: bw * 0.8, height: (q / mx) * h, fill: rgba(cv('--green'), 0.55), stroke: cv('--green2'), 'stroke-width': 0.5 }, svg));
  // normal overlay with same mean/variance (skip for tiny variance)
  const mu = n * p, s2 = n * p * (1 - p);
  if (s2 > 0.2) {
    const s = Math.sqrt(s2); let d = '';
    for (let t = 0; t <= 1; t += 0.004) {
      const xk = -0.5 + t * (n + 1), v = ndpdf((xk - mu) / s) / s; // density per unit k
      d += (d ? ' L' : 'M') + ` ${x0 + t * w} ${yb - (v / mx) * h}`;
    }
    el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 1.8 }, svg);
  }
  // x labels: 0, mode region, n
  txt(X(0) - 3, yb + 14, '0', cv('--muted'), svg); txt(X(n) - 6, yb + 14, String(n), cv('--muted'), svg);
  const read = document.getElementById('biread');
  const mode = Math.min(n, Math.floor((n + 1) * p));
  if (read) read.innerHTML = `<span>E[X] = np = <b>${fmt(mu, 1)}</b></span><span>σ = √(np(1−p)) = <b>${fmt(Math.sqrt(s2), 2)}</b></span><span>mode ≈ <b>${mode}</b>, P(X=${mode}) = ${fmt(pmf[mode], 3)}</span><span>${s2 >= 10 ? 'np(1−p) ≥ 10: normal approx. good' : 'np(1−p) < 10: normal approx. rough'}</span>`;
}
window.biSet = (n, p) => { setS([['bi_n', n, 0], ['bi_p', p, 2]]); biDraw(); };

// ---------- 06 · normal explorer ----------
function nrDraw() {
  const svg = document.getElementById('nrsvg'); if (!svg) return;
  const m = val('nr_m'), s = val('nr_s'), x0 = val('nr_x');
  svg.innerHTML = '';
  const yb = 172, h = 150, X = (x) => 170 + x * (150 / 6), vmax = 1.05; // pdf max at sigma=0.4 is ~1
  const f = (x) => ndpdf((x - m) / s) / s;
  el('line', { x1: X(-6), y1: yb, x2: X(6), y2: yb, stroke: cv('--border2') }, svg);
  // shade area up to x0
  let a = `M ${X(-6)} ${yb}`;
  for (let x = -6; x <= x0 + 1e-9; x += 0.06) a += ` L ${X(x)} ${yb - (f(x) / vmax) * h}`;
  a += ` L ${X(Math.min(x0, 6))} ${yb} Z`;
  el('path', { d: a, fill: rgba(cv('--green'), 0.3) }, svg);
  let d = '';
  for (let x = -6; x <= 6; x += 0.06) d += (d ? ' L' : 'M') + ` ${X(x)} ${yb - (f(x) / vmax) * h}`;
  el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 2 }, svg);
  el('line', { x1: X(m), y1: yb, x2: X(m), y2: yb - (f(m) / vmax) * h, stroke: cv('--dim'), 'stroke-dasharray': '3 3' }, svg);
  el('line', { x1: X(x0), y1: yb, x2: X(x0), y2: Math.min(yb - (f(x0) / vmax) * h, yb - 30), stroke: cv('--text'), 'stroke-width': 1.5 }, svg);
  txt(X(m) - 3, yb + 14, 'μ', cv('--muted'), svg); txt(X(x0) - 3, yb - 34 < 20 ? 18 : yb - 34, 'x', cv('--text'), svg);
  [-4, -2, 0, 2, 4].forEach((t) => txt(X(t) - 4, yb + 14, String(t), cv('--dim'), svg));
  const z = (x0 - m) / s, Phi = ndcdf(z);
  const read = document.getElementById('nrread');
  if (read) read.innerHTML = `<span>z = (x−μ)/σ = <b>${fmt(z, 2)}</b></span><span>P(X ≤ x) = Φ(z) = <b>${fmt(Phi, 4)}</b></span><span>P(X &gt; x) = <b>${fmt(1 - Phi, 4)}</b></span><span>${Math.abs(z) > 3 ? '<span class="r">beyond 3σ — rare</span>' : Math.abs(z) > 2 ? 'outside the 95% band' : 'inside the 95% band'}</span>`;
}
window.nrSet = (m, s, x) => { setS([['nr_m', m, 1], ['nr_s', s, 1], ['nr_x', x, 1]]); nrDraw(); };

// ---------- 06 · t vs normal ----------
function tvDraw() {
  const svg = document.getElementById('tvsvg'); if (!svg) return;
  const df = Math.round(val('tv_n'));
  svg.innerHTML = '';
  const yb = 148, h = 120, X = (x) => 170 + x * (155 / 4), vmax = 0.42;
  const c = Math.exp(gammaln((df + 1) / 2) - gammaln(df / 2)) / Math.sqrt(df * Math.PI);
  const ft = (x) => c * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
  el('line', { x1: X(-4), y1: yb, x2: X(4), y2: yb, stroke: cv('--border2') }, svg);
  let d = '';
  for (let x = -4; x <= 4; x += 0.05) d += (d ? ' L' : 'M') + ` ${X(x)} ${yb - (ndpdf(x) / vmax) * h}`;
  el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 1.8 }, svg);
  d = '';
  for (let x = -4; x <= 4; x += 0.05) d += (d ? ' L' : 'M') + ` ${X(x)} ${yb - (ft(x) / vmax) * h}`;
  el('path', { d, fill: 'none', stroke: cv('--red'), 'stroke-width': 1.8 }, svg);
  [-3, -2, -1, 0, 1, 2, 3].forEach((t) => txt(X(t) - 3, yb + 13, String(t), cv('--dim'), svg));
  txt(X(-3.9), 24, `t(${df})`, cv('--red'), svg); txt(X(-3.9), 38, 'N(0,1)', cv('--blue'), svg);
  // tail probability beyond 3 (numeric integration of t density)
  let tail = 0; for (let x = 3; x < 12; x += 0.01) tail += ft(x) * 0.01;
  txt(X(2.05), 30, `P(|X|>3): t ${(200 * tail).toFixed(1)}%`, cv('--red'), svg);
  txt(X(2.05), 44, `normal ${(200 * (1 - ndcdf(3))).toFixed(1)}%`, cv('--blue'), svg);
}

// ---------- 07 · correlation scatter ----------
function coDraw() {
  const svg = document.getElementById('cosvg'); if (!svg) return;
  const r = val('co_r');
  svg.innerHTML = '';
  const C = 120, X = (x) => 160 + x * 44, Y = (y) => 120 - y * 34;
  el('line', { x1: X(-3), y1: Y(0), x2: X(3), y2: Y(0), stroke: cv('--border') }, svg);
  el('line', { x1: X(0), y1: Y(-3), x2: X(0), y2: Y(3), stroke: cv('--border') }, svg);
  const rng = mulberry32(20260820);
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < C; i++) {
    const z1 = gauss(rng), z2 = gauss(rng);
    const y = r * z1 + Math.sqrt(Math.max(0, 1 - r * r)) * z2;
    el('circle', { cx: X(z1), cy: Y(y), r: 2.4, fill: rgba(cv('--green'), 0.75) }, svg);
    sx += z1; sy += y; sxy += z1 * y; sx2 += z1 * z1; sy2 += y * y;
  }
  const n = C, cov = sxy / n - (sx / n) * (sy / n), vx = sx2 / n - (sx / n) ** 2, vy = sy2 / n - (sy / n) ** 2;
  const rhat = cov / Math.sqrt(vx * vy);
  // regression line for the chosen rho (slope = rho since both std normal)
  el('line', { x1: X(-3), y1: Y(-3 * r), x2: X(3), y2: Y(3 * r), stroke: cv('--amber'), 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
  txt(14, 20, `ρ = ${fmt(r)} · sample r ≈ ${fmt(rhat)}`, cv('--text'), svg);
  txt(14, 36, 'dashed: E[Y|X=x] = ρx', cv('--amber'), svg);
}
window.coSet = (r) => { setS([['co_r', r, 2]]); coDraw(); };

// ---------- 09 · LLN running average ----------
let llnSeed = 1, llnN = 500;
function llnDraw() {
  const svg = document.getElementById('llnsvg'); if (!svg) return;
  svg.innerHTML = '';
  const x0 = 34, w = 296, yb = 176, h = 150;
  const X = (i) => x0 + (i / llnN) * w, Y = (p) => yb - p * h;
  el('line', { x1: x0, y1: yb, x2: x0 + w, y2: yb, stroke: cv('--border2') }, svg);
  el('line', { x1: x0, y1: yb, x2: x0, y2: yb - h, stroke: cv('--border2') }, svg);
  el('line', { x1: x0, y1: Y(0.5), x2: x0 + w, y2: Y(0.5), stroke: cv('--amber'), 'stroke-dasharray': '5 4' }, svg);
  txt(x0 - 22, Y(0.5) + 4, '0.5', cv('--amber'), svg); txt(x0 - 22, Y(1) + 4, '1', cv('--muted'), svg);
  txt(x0 + w - 30, yb + 14, String(llnN), cv('--muted'), svg); txt(x0, yb + 14, '0', cv('--muted'), svg);
  const rng = mulberry32(0xC01 + llnSeed * 7919);
  let heads = 0, d = '', last = 0.5;
  for (let i = 1; i <= llnN; i++) {
    if (rng() < 0.5) heads++;
    last = heads / i;
    d += (d ? ' L' : 'M') + ` ${X(i)} ${Y(last)}`;
  }
  el('path', { d, fill: 'none', stroke: cv('--green'), 'stroke-width': 1.5 }, svg);
  const read = document.getElementById('llnread');
  if (read) read.innerHTML = `<span>flips: <b>${llnN}</b></span><span>proportion of heads: <b>${fmt(last, 4)}</b></span><span>|deviation from 0.5| = ${fmt(Math.abs(last - 0.5), 4)} — typical size ≈ 0.5/√n = ${fmt(0.5 / Math.sqrt(llnN), 4)}</span>`;
}
window.llnNew = () => { llnSeed++; llnDraw(); };
window.llnMore = () => { llnN = llnN === 2000 ? 500 : 2000; llnDraw(); };

// ---------- 09 · CLT histogram ----------
function clDraw() {
  const svg = document.getElementById('clsvg'); if (!svg) return;
  const n = Math.round(val('cl_n'));
  svg.innerHTML = '';
  const REPS = 4000, BINS = 48, lo = 0, hiX = 3;
  const x0 = 26, w = 306, yb = 190, h = 165;
  const rng = mulberry32(0xCE17 + n);
  const bins = new Array(BINS).fill(0);
  let m1 = 0, m2 = 0, m3 = 0;
  const means = [];
  for (let r = 0; r < REPS; r++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += -Math.log(Math.max(1e-12, 1 - rng())); // Exp(1) draws
    const xb = s / n; means.push(xb); m1 += xb;
  }
  m1 /= REPS;
  for (const xb of means) { const d = xb - m1; m2 += d * d; m3 += d * d * d; }
  m2 /= REPS; m3 /= REPS;
  const skew = m3 / Math.pow(m2, 1.5);
  const binw = (hiX - lo) / BINS;
  for (const xb of means) { const k = Math.min(BINS - 1, Math.max(0, Math.floor((xb - lo) / binw))); bins[k]++; }
  const dens = bins.map((c) => c / (REPS * binw));
  const s = Math.sqrt(1 / n), peak = ndpdf(0) / s;
  const vmax = Math.max(...dens, peak) * 1.05;
  el('line', { x1: x0, y1: yb, x2: x0 + w, y2: yb, stroke: cv('--border2') }, svg);
  dens.forEach((v, k) => { if (v > 0) el('rect', { x: x0 + (k / BINS) * w, y: yb - (v / vmax) * h, width: w / BINS - 0.6, height: (v / vmax) * h, fill: rgba(cv('--green'), 0.5) }, svg); });
  let d = '';
  for (let t = 0; t <= 1; t += 0.004) { const x = lo + t * (hiX - lo); const v = ndpdf((x - 1) / s) / s; d += (d ? ' L' : 'M') + ` ${x0 + t * w} ${yb - (v / vmax) * h}`; }
  el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 1.8 }, svg);
  [0, 1, 2, 3].forEach((t) => txt(x0 + ((t - lo) / (hiX - lo)) * w - 3, yb + 14, String(t), cv('--dim'), svg));
  const read = document.getElementById('clread');
  if (read) read.innerHTML = `<span>n per average: <b>${n}</b></span><span>SD of the means ≈ ${fmt(Math.sqrt(m2), 3)} (theory: 1/√n = ${fmt(s, 3)})</span><span>skewness ≈ <b>${fmt(skew, 2)}</b> ${Math.abs(skew) < 0.3 ? '— bell-shaped' : '— still skewed'} (source: 2.0)</span>`;
}
window.clSet = (n) => { setS([['cl_n', n, 0]]); clDraw(); };

// ---------- 10 · diversification ----------
function dvDraw() {
  const svg = document.getElementById('dvsvg'); if (!svg) return;
  const rho = val('dv_r');
  svg.innerHTML = '';
  const sA = 0.2, sB = 0.3;
  const x0 = 40, w = 280, yb = 185, h = 160, vmax = 0.32;
  const X = (wt) => x0 + wt * w, Y = (s) => yb - (s / vmax) * h;
  const sig = (wt, r) => Math.sqrt(Math.max(0, wt * wt * sA * sA + (1 - wt) * (1 - wt) * sB * sB + 2 * wt * (1 - wt) * r * sA * sB));
  el('line', { x1: x0, y1: yb, x2: x0 + w, y2: yb, stroke: cv('--border2') }, svg);
  el('line', { x1: x0, y1: yb, x2: x0, y2: yb - h, stroke: cv('--border2') }, svg);
  [0.1, 0.2, 0.3].forEach((s) => { el('line', { x1: x0, y1: Y(s), x2: x0 + w, y2: Y(s), stroke: cv('--border'), 'stroke-dasharray': '2 4' }, svg); txt(x0 - 30, Y(s) + 4, (s * 100) + '%', cv('--dim'), svg); });
  txt(x0 - 4, yb + 14, 'w=0 (all B)', cv('--dim'), svg); txt(x0 + w - 55, yb + 14, 'w=1 (all A)', cv('--dim'), svg);
  const curve = (r, col, wd) => { let d = ''; for (let t = 0; t <= 1.001; t += 0.02) d += (d ? ' L' : 'M') + ` ${X(t)} ${Y(sig(t, r))}`; el('path', { d, fill: 'none', stroke: col, 'stroke-width': wd }, svg); };
  [-1, -0.5, 0, 0.5, 1].forEach((r) => { if (Math.abs(r - rho) > 0.024) curve(r, cv('--dim'), 0.8); });
  curve(rho, cv('--green'), 2.2);
  const wStar = Math.min(1, Math.max(0, (sB * sB - rho * sA * sB) / (sA * sA + sB * sB - 2 * rho * sA * sB)));
  const sStar = sig(wStar, rho);
  el('circle', { cx: X(wStar), cy: Y(sStar), r: 4, fill: cv('--amber') }, svg);
  const read = document.getElementById('dvread');
  if (read) read.innerHTML = `<span>ρ = <b>${fmt(rho)}</b></span><span>min-variance weight on A: w* = <b>${fmt(wStar, 3)}</b></span><span>σ at w*: <b>${fmt(sStar * 100, 1)}%</b> vs 20% (all A), 30% (all B)</span>${rho <= -0.999 ? '<span class="g">perfect hedge: risk fully cancels</span>' : ''}`;
}
window.dvSet = (r) => { setS([['dv_r', r, 2]]); dvDraw(); };

// ---------- 10 · VaR tail (static, redrawn on theme change) ----------
function vrDraw() {
  const svg = document.getElementById('vrsvg'); if (!svg) return;
  svg.innerHTML = '';
  const yb = 128, h = 105, X = (z) => 170 + z * 38, vmax = 0.42, zq = -1.645;
  el('line', { x1: X(-4), y1: yb, x2: X(4), y2: yb, stroke: cv('--border2') }, svg);
  let a = `M ${X(-4)} ${yb}`;
  for (let z = -4; z <= zq; z += 0.05) a += ` L ${X(z)} ${yb - (ndpdf(z) / vmax) * h}`;
  a += ` L ${X(zq)} ${yb} Z`;
  el('path', { d: a, fill: rgba(cv('--red'), 0.45) }, svg);
  let d = '';
  for (let z = -4; z <= 4; z += 0.05) d += (d ? ' L' : 'M') + ` ${X(z)} ${yb - (ndpdf(z) / vmax) * h}`;
  el('path', { d, fill: 'none', stroke: cv('--blue'), 'stroke-width': 2 }, svg);
  el('line', { x1: X(zq), y1: yb, x2: X(zq), y2: yb - 78, stroke: cv('--red'), 'stroke-width': 1.5 }, svg);
  txt(X(zq) - 52, 32, 'VaR: z = −1.645', cv('--red'), svg);
  txt(X(-3.6), yb - 8, '5%', cv('--red'), svg);
  txt(X(0.4), 40, 'return density', cv('--blue'), svg);
  txt(X(-1.55) - 8, yb + 13, 'μ − 1.645σ', cv('--muted'), svg);
}

// ---------- wiring ----------
bindS('by_p', 2, byDraw); bindS('by_s', 2, byDraw); bindS('by_f', 2, byDraw);
bindS('pc_x', 1, pcDraw); bindS('pc_l', 1, pcDraw);
bindS('bi_n', 0, biDraw); bindS('bi_p', 2, biDraw);
bindS('nr_m', 1, nrDraw); bindS('nr_s', 1, nrDraw); bindS('nr_x', 1, nrDraw);
bindS('tv_n', 0, tvDraw);
bindS('co_r', 2, coDraw);
bindS('cl_n', 0, clDraw);
bindS('dv_r', 2, dvDraw);

function drawAll() { vennDraw(); byDraw(); pcDraw(); biDraw(); nrDraw(); tvDraw(); coDraw(); llnDraw(); clDraw(); dvDraw(); vrDraw(); }
drawAll();
window.addEventListener('themechange', drawAll);
