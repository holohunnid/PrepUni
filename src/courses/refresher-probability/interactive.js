// Interactive figures for the Refresher Course · Probability part.
// Same conventions as the other courses: vanilla SVG drawing, colors read from
// CSS variables so the theme switch (course.js dispatches 'themechange')
// repaints correctly.
const NS = 'http://www.w3.org/2000/svg';
function cv_(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function rgba(hex, a) { hex = (hex || '#888888').replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); if (isNaN(n)) return `rgba(136,136,136,${a})`; return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor, size) { const t = el('text', { x, y, fill, 'font-size': size || 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { const v = (+x).toFixed(d); return v === '-' + (0).toFixed(d) ? (0).toFixed(d) : v; }
function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { const l = document.getElementById(id + '_v'); if (l) l.textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { const s = document.getElementById(id); if (!s) continue; s.value = v; const l = document.getElementById(id + '_v'); if (l) l.textContent = fmt(v, dec); } }
function val(id) { const e = document.getElementById(id); return e ? parseFloat(e.value) : 0; }
// 'any' keeps range inputs continuous, so a preset value is never snapped to a
// step grid — quantisation there silently shifts the exercise numbers
function setRange(id, min, max) { const s = document.getElementById(id); if (!s) return; s.min = min; s.max = max; s.step = 'any'; }

// ---------- shared maths ----------
function normPdf(x, mu, sd) { const z = (x - mu) / sd; return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI)); }
// Zelen & Severo rational approximation, |error| < 7.5e-8
function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function choose(n, k) { return fact(n) / (fact(k) * fact(n - k)); }

// axis helper for the bar charts: returns the plotting frame
function barFrame(svg, W, H, pad) {
  const x0 = pad.l, x1 = W - pad.r, yb = H - pad.b, yt = pad.t;
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt, x2: x0, y2: yb, stroke: cv_('--border2') }, svg);
  return { x0, x1, yb, yt };
}

// ---------- 04 · two-event Venn diagram with proportional areas ----------
// circle areas are proportional to P(A) and P(B); the lens area is solved for
// numerically so that it is proportional to P(A and B)
function lensArea(d, r1, r2) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a1 = Math.acos(Math.min(1, Math.max(-1, (d * d + r1 * r1 - r2 * r2) / (2 * d * r1))));
  const a2 = Math.acos(Math.min(1, Math.max(-1, (d * d + r2 * r2 - r1 * r1) / (2 * d * r2))));
  const tri = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
  return r1 * r1 * a1 + r2 * r2 * a2 - tri;
}
function solveDistance(target, r1, r2) {
  let lo = Math.abs(r1 - r2), hi = r1 + r2;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (lensArea(m, r1, r2) > target) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function vnDraw() {
  const svg = document.getElementById('vnsvg');
  if (!svg) return;
  svg.innerHTML = '';
  let pa = val('vn_a'), pb = val('vn_b'), pi = val('vn_i');
  const lo = Math.max(0, pa + pb - 1), hi = Math.min(pa, pb);
  if (pi > hi) pi = hi;
  if (pi < lo) pi = lo;
  const uni = pa + pb - pi, aOnly = pa - pi, bOnly = pb - pi, neither = 1 - uni;

  el('rect', { x: 12, y: 26, width: 336, height: 186, fill: 'none', stroke: cv_('--border2') }, svg);
  txt(20, 20, 'Ω   (total probability 1)', cv_('--muted'), svg, 'start', 10.5);

  const K = 62 / Math.sqrt(0.95);          // radius scale: p = 0.95 → r = 62 px
  const r1 = K * Math.sqrt(pa), r2 = K * Math.sqrt(pb);
  const target = pi * Math.PI * K * K;      // lens area, on the same scale
  const d = solveDistance(target, r1, r2);
  const cx = 180, cy = 119;
  const c1 = cx - d / 2, c2 = cx + d / 2;

  const bg = el('g', {}, svg);
  el('circle', { cx: c1, cy, r: r1, fill: rgba(cv_('--blue'), 0.28), stroke: cv_('--blue'), 'stroke-width': 1.6 }, bg);
  el('circle', { cx: c2, cy, r: r2, fill: rgba(cv_('--green'), 0.28), stroke: cv_('--green'), 'stroke-width': 1.6 }, bg);
  // the lens, drawn by clipping one circle to the other
  const cp = el('clipPath', { id: 'vnclip' }, svg);
  el('circle', { cx: c2, cy, r: r2 }, cp);
  el('circle', { cx: c1, cy, r: r1, fill: rgba(cv_('--amber'), 0.75), 'clip-path': 'url(#vnclip)' }, svg);

  txt(c1 - r1 * 0.55, cy - r1 * 0.5, 'A', cv_('--blue'), svg, 'middle', 12);
  txt(c2 + r2 * 0.55, cy - r2 * 0.5, 'B', cv_('--green'), svg, 'middle', 12);
  if (pi > 0.015) txt(cx, cy + 4, fmt(pi, 2), cv_('--text'), svg, 'middle', 11);
  if (aOnly > 0.02) txt(c1 - r1 * 0.5, cy + 4, fmt(aOnly, 2), cv_('--text'), svg, 'middle', 10.5);
  if (bOnly > 0.02) txt(c2 + r2 * 0.5, cy + 4, fmt(bOnly, 2), cv_('--text'), svg, 'middle', 10.5);
  txt(340, 206, 'neither: ' + fmt(neither, 2), cv_('--dim'), svg, 'end', 10.5);

  const r = document.getElementById('vnread');
  if (r) {
    r.innerHTML =
      `<span>P(A∪B) <b>${fmt(uni, 2)}</b></span>` +
      `<span>A only <b>${fmt(aOnly, 2)}</b></span>` +
      `<span>B only <b>${fmt(bOnly, 2)}</b></span>` +
      `<span>neither <b>${fmt(neither, 2)}</b></span>` +
      `<span class="muted">exactly one: ${fmt(aOnly + bOnly, 2)} · four regions sum to ${fmt(aOnly + pi + bOnly + neither, 2)}</span>`;
  }
}
function vnSet(a, b, i) { setS([['vn_a', a, 2], ['vn_b', b, 2], ['vn_i', i, 2]]); vnDraw(); }
window.vnSet = vnSet;

// ---------- 08 · binomial pmf with the CDF shaded ----------
function bnDraw() {
  const svg = document.getElementById('bnsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const n = Math.round(val('bn_n')), p = val('bn_p');
  let k = Math.round(val('bn_k'));
  const ks = document.getElementById('bn_k');
  if (ks) { ks.max = n; if (k > n) { k = n; setS([['bn_k', k, 0]]); } }

  const P = [];
  for (let x = 0; x <= n; x++) P.push(choose(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x));
  const pmax = Math.max(...P, 1e-9);
  const F = P.slice(0, k + 1).reduce((a, b) => a + b, 0);
  const mu = n * p, vr = n * p * (1 - p);

  const f = barFrame(svg, 360, 230, { l: 34, r: 12, t: 24, b: 40 });
  const W = (f.x1 - f.x0) / (n + 1);
  const Y = (v) => f.yb - (v / pmax) * (f.yb - f.yt);
  txt(f.x0 - 6, f.yt + 4, fmt(pmax, 2), cv_('--dim'), svg, 'end', 9.5);
  txt(f.x0 - 6, f.yb + 4, '0', cv_('--dim'), svg, 'end', 9.5);

  for (let x = 0; x <= n; x++) {
    const bx = f.x0 + x * W + W * 0.18, bw = W * 0.64, h = f.yb - Y(P[x]);
    const inTail = x <= k;
    el('rect', {
      x: bx, y: Y(P[x]), width: Math.max(1, bw), height: Math.max(0.5, h),
      fill: inTail ? rgba(cv_('--green'), 0.45) : rgba(cv_('--blue'), 0.3),
      stroke: inTail ? cv_('--green') : cv_('--blue'),
    }, svg);
    if (n <= 20 && (n <= 12 || x % 2 === 0)) txt(bx + bw / 2, f.yb + 14, String(x), cv_('--dim'), svg, 'middle', 9.5);
  }
  // mean marker
  const mx = f.x0 + (mu + 0.5) * W;
  el('path', { d: `M ${mx - 6} ${f.yb + 1} L ${mx + 6} ${f.yb + 1} L ${mx} ${f.yb - 9} Z`, fill: cv_('--green') }, svg);
  txt(f.x0, 16, `Bin(n = ${n}, p = ${fmt(p, 2)})   E[X] = np = ${fmt(mu, 2)}`, cv_('--text'), svg, 'start', 11);
  txt(180, 224, 'x  (number of successes)', cv_('--dim'), svg, 'middle', 10);

  const r = document.getElementById('bnread');
  if (r) {
    r.innerHTML =
      `<span>P(X = ${k}) <b>${fmt(P[k] ?? 0, 4)}</b></span>` +
      `<span>F(${k}) = P(X ≤ ${k}) <b>${fmt(F, 4)}</b></span>` +
      `<span>P(X > ${k}) <b>${fmt(1 - F, 4)}</b></span>` +
      `<span class="muted">E[X] = ${fmt(mu, 2)} · V[X] = np(1−p) = ${fmt(vr, 3)} · σ = ${fmt(Math.sqrt(vr), 3)}</span>`;
  }
}
function bnSet(n, p, k) { const ks = document.getElementById('bn_k'); if (ks) ks.max = n; setS([['bn_n', n, 0], ['bn_p', p, 2], ['bn_k', k, 0]]); bnDraw(); }
window.bnSet = bnSet;

// ---------- 09 · Poisson pmf with the CDF shaded ----------
function poDraw() {
  const svg = document.getElementById('posvg');
  if (!svg) return;
  svg.innerHTML = '';
  const lam = val('po_l'), k = Math.round(val('po_k'));
  const N = Math.max(8, Math.min(24, Math.ceil(lam + 4 * Math.sqrt(lam) + 3)));

  const P = [];
  for (let x = 0; x <= N; x++) P.push(Math.exp(-lam) * Math.pow(lam, x) / fact(x));
  const pmax = Math.max(...P, 1e-9);
  const F = P.slice(0, Math.min(k, N) + 1).reduce((a, b) => a + b, 0);

  const f = barFrame(svg, 360, 220, { l: 34, r: 12, t: 24, b: 38 });
  const W = (f.x1 - f.x0) / (N + 1);
  const Y = (v) => f.yb - (v / pmax) * (f.yb - f.yt);
  txt(f.x0 - 6, f.yt + 4, fmt(pmax, 2), cv_('--dim'), svg, 'end', 9.5);
  txt(f.x0 - 6, f.yb + 4, '0', cv_('--dim'), svg, 'end', 9.5);

  for (let x = 0; x <= N; x++) {
    const bx = f.x0 + x * W + W * 0.18, bw = W * 0.64;
    const inTail = x <= k;
    el('rect', {
      x: bx, y: Y(P[x]), width: Math.max(1, bw), height: Math.max(0.5, f.yb - Y(P[x])),
      fill: inTail ? rgba(cv_('--green'), 0.45) : rgba(cv_('--blue'), 0.3),
      stroke: inTail ? cv_('--green') : cv_('--blue'),
    }, svg);
    if (N <= 12 || x % 2 === 0) txt(bx + bw / 2, f.yb + 14, String(x), cv_('--dim'), svg, 'middle', 9.5);
  }
  const mx = f.x0 + (lam + 0.5) * W;
  el('path', { d: `M ${mx - 6} ${f.yb + 1} L ${mx + 6} ${f.yb + 1} L ${mx} ${f.yb - 9} Z`, fill: cv_('--green') }, svg);
  txt(f.x0, 16, `Po(λ = ${fmt(lam, 2)})   E[X] = V[X] = λ`, cv_('--text'), svg, 'start', 11);
  txt(180, 214, 'x  (number of events per unit of time)', cv_('--dim'), svg, 'middle', 10);

  const r = document.getElementById('poread');
  if (r) {
    r.innerHTML =
      `<span>P(X = ${k}) <b>${fmt(P[k] ?? 0, 4)}</b></span>` +
      `<span>P(X ≤ ${k}) <b>${fmt(F, 4)}</b></span>` +
      `<span>P(X > ${k}) <b>${fmt(1 - F, 4)}</b></span>` +
      `<span class="muted">P(X = 0) = e^(−λ) = ${fmt(Math.exp(-lam), 4)} · σ = √λ = ${fmt(Math.sqrt(lam), 3)}</span>`;
  }
}
function poSet(l, k) { setS([['po_l', l, 1], ['po_k', k, 0]]); poDraw(); }
window.poSet = poSet;

// ---------- 13 · continuous densities: normal / exponential / uniform ----------
const CN = {
  norm: {
    pdf: (x, m, s) => normPdf(x, m, s),
    cdf: (x, m, s) => normCdf((x - m) / s),
    win: (m, s) => [m - 4 * s, m + 4 * s],
    mean: (m) => m, sd: (m, s) => s,
    label: (m, s) => `N(μ = ${fmt(m, 2)}, σ = ${fmt(s, 2)})`,
  },
  exp: {
    pdf: (x, l) => (x < 0 ? 0 : l * Math.exp(-l * x)),
    cdf: (x, l) => (x <= 0 ? 0 : 1 - Math.exp(-l * x)),
    win: (l) => [-0.4 / l, 5 / l],
    mean: (l) => 1 / l, sd: (l) => 1 / l,
    label: (l) => `Exp(λ = ${fmt(l, 3)})`,
  },
  unif: {
    pdf: (x, a, b) => (x < a || x > b ? 0 : 1 / (b - a)),
    cdf: (x, a, b) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)),
    win: (a, b) => [a - 0.2 * (b - a), b + 0.2 * (b - a)],
    mean: (a, b) => (a + b) / 2, sd: (a, b) => (b - a) / Math.sqrt(12),
    label: (a, b) => `U(${fmt(a, 1)}, ${fmt(b, 1)})`,
  },
};
function cnKind() { const s = document.getElementById('cn_kind'); return s ? s.value : 'norm'; }
function cnDraw() {
  const svg = document.getElementById('cnsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const kind = cnKind(), D = CN[kind];
  let p1 = val('cn_p1'), p2 = val('cn_p2'), b = val('cn_b');
  if (kind === 'unif' && p2 <= p1) p2 = p1 + 0.5;

  const [lo, hi] = kind === 'exp' ? D.win(p1) : D.win(p1, p2);
  const f = barFrame(svg, 360, 220, { l: 34, r: 12, t: 24, b: 36 });
  const N = 240;
  const xs = [], ys = [];
  for (let i = 0; i <= N; i++) { const x = lo + (hi - lo) * i / N; xs.push(x); ys.push(kind === 'exp' ? D.pdf(x, p1) : D.pdf(x, p1, p2)); }
  const ymax = Math.max(...ys, 1e-9) * 1.12;
  const X = (x) => f.x0 + ((x - lo) / (hi - lo)) * (f.x1 - f.x0);
  const Y = (y) => f.yb - (y / ymax) * (f.yb - f.yt);

  // shaded area up to the cut
  let dArea = `M ${X(lo)} ${f.yb}`;
  for (let i = 0; i <= N; i++) { if (xs[i] > b) break; dArea += ` L ${X(xs[i])} ${Y(ys[i])}`; }
  dArea += ` L ${X(Math.min(b, hi))} ${f.yb} Z`;
  el('path', { d: dArea, fill: rgba(cv_('--green'), 0.32), stroke: 'none' }, svg);

  let dLine = '';
  for (let i = 0; i <= N; i++) dLine += (i ? ' L ' : 'M ') + X(xs[i]) + ' ' + Y(ys[i]);
  el('path', { d: dLine, fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2.2 }, svg);

  if (b > lo && b < hi) {
    el('line', { x1: X(b), y1: f.yb, x2: X(b), y2: f.yt + 4, stroke: cv_('--green'), 'stroke-dasharray': '4 3' }, svg);
    txt(X(b), f.yb + 14, 'b = ' + fmt(b, 2), cv_('--green'), svg, 'middle', 10);
  }
  const mu = kind === 'exp' ? D.mean(p1) : D.mean(p1, p2);
  const sd = kind === 'exp' ? D.sd(p1) : D.sd(p1, p2);
  if (mu > lo && mu < hi) {
    el('path', { d: `M ${X(mu) - 6} ${f.yb + 1} L ${X(mu) + 6} ${f.yb + 1} L ${X(mu)} ${f.yb - 9} Z`, fill: cv_('--amber') }, svg);
  }
  txt(f.x0, 16, (kind === 'exp' ? D.label(p1) : D.label(p1, p2)), cv_('--text'), svg, 'start', 11);
  txt(f.x0 - 6, f.yb + 4, '0', cv_('--dim'), svg, 'end', 9.5);

  const F = kind === 'exp' ? D.cdf(b, p1) : D.cdf(b, p1, p2);
  const r = document.getElementById('cnread');
  if (r) {
    const med = kind === 'norm' ? mu : kind === 'exp' ? Math.log(2) / p1 : (p1 + p2) / 2;
    r.innerHTML =
      `<span>F(b) = P(X ≤ b) <b>${fmt(F, 4)}</b></span>` +
      `<span>P(X > b) <b>${fmt(1 - F, 4)}</b></span>` +
      `<span>E[X] <b>${fmt(mu, 3)}</b></span>` +
      `<span>σ <b>${fmt(sd, 3)}</b></span>` +
      `<span class="muted">median = ${fmt(med, 3)}</span>`;
  }
}
function cnSet(kind, p1, p2, b) {
  const s = document.getElementById('cn_kind');
  if (s) s.value = kind;
  if (kind === 'norm') {
    const span = Math.max(6, 8 * p2);
    setRange('cn_p1', +(p1 - span / 2).toFixed(2), +(p1 + span / 2).toFixed(2));
    setRange('cn_p2', +(p2 / 4).toFixed(3), +(p2 * 3).toFixed(3));
    setRange('cn_b', +(p1 - 4 * p2).toFixed(2), +(p1 + 4 * p2).toFixed(2));
  } else if (kind === 'exp') {
    setRange('cn_p1', +(p1 / 5).toFixed(4), +(p1 * 5).toFixed(4));
    setRange('cn_p2', 0.3, 4);
    setRange('cn_b', 0, +(5 / p1).toFixed(2));
  } else {
    setRange('cn_p1', +(p1 - (p2 - p1)).toFixed(2), +(p2 - 0.1).toFixed(2));
    setRange('cn_p2', +(p1 + 0.1).toFixed(2), +(p2 + (p2 - p1)).toFixed(2));
    setRange('cn_b', +(p1 - 0.2 * (p2 - p1)).toFixed(2), +(p2 + 0.2 * (p2 - p1)).toFixed(2));
  }
  const d = kind === 'exp' ? 3 : Math.abs(p1) > 20 ? 1 : 2;
  setS([['cn_p1', p1, d], ['cn_p2', p2, d], ['cn_b', b, d]]);
  cnDraw();
}
window.cnSet = cnSet;

// ---------- 15 · two assets and the portfolio that mixes them ----------
const CV_M1 = 0.01, CV_S1 = 0.10, CV_M2 = 0.04, CV_S2 = 0.40;
function cvDraw() {
  const svg = document.getElementById('cvsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const rho = val('cv_r'), w1 = val('cv_w'), w2 = 1 - w1;
  const cov = rho * CV_S1 * CV_S2;
  const muY = w1 * CV_M1 + w2 * CV_M2;
  const varY = w1 * w1 * CV_S1 * CV_S1 + w2 * w2 * CV_S2 * CV_S2 + 2 * w1 * w2 * cov;
  const sdY = Math.sqrt(Math.max(varY, 1e-12));

  const lo = -0.85, hi = 0.9;
  const f = barFrame(svg, 360, 220, { l: 34, r: 12, t: 26, b: 36 });
  const X = (x) => f.x0 + ((x - lo) / (hi - lo)) * (f.x1 - f.x0);
  const ymax = normPdf(CV_M1, CV_M1, CV_S1) * 1.08;
  const Y = (y) => f.yb - Math.min(1, y / ymax) * (f.yb - f.yt);

  const curve = (m, s, col, w) => {
    let d = '';
    for (let i = 0; i <= 220; i++) { const x = lo + (hi - lo) * i / 220; d += (i ? ' L ' : 'M ') + X(x) + ' ' + Y(normPdf(x, m, s)); }
    el('path', { d, fill: 'none', stroke: col, 'stroke-width': w }, svg);
  };
  curve(CV_M2, CV_S2, cv_('--dim'), 1.8);
  curve(CV_M1, CV_S1, cv_('--blue'), 1.8);
  curve(muY, sdY, cv_('--red'), 2.4);

  el('line', { x1: X(0), y1: f.yb, x2: X(0), y2: f.yt, stroke: cv_('--border'), 'stroke-dasharray': '3 3' }, svg);
  txt(X(0), f.yb + 14, '0', cv_('--dim'), svg, 'middle', 9.5);
  txt(f.x0, 14, `ρ = ${fmt(rho, 2)}   portfolio  Y = ${fmt(w1, 2)}·X₁ + ${fmt(w2, 2)}·X₂`, cv_('--text'), svg, 'start', 11);
  txt(f.x1, 32, 'X₁ blue · X₂ grey · Y red', cv_('--dim'), svg, 'end', 10);
  txt(180, 214, 'annual return', cv_('--dim'), svg, 'middle', 10);

  const wavg = w1 * CV_S1 + w2 * CV_S2;
  const r = document.getElementById('cvread');
  if (r) {
    r.innerHTML =
      `<span>E[Y] <b>${fmt(muY, 4)}</b></span>` +
      `<span>V[Y] <b>${fmt(varY, 5)}</b></span>` +
      `<span>σ(Y) <b>${fmt(sdY, 4)}</b></span>` +
      `<span>Cov <b>${fmt(cov, 4)}</b></span>` +
      `<span class="muted">weighted average of the two σ = ${fmt(wavg, 4)} — the gap is the diversification benefit</span>`;
  }
}
function cvSet(r, w) { setS([['cv_r', r, 2], ['cv_w', w, 2]]); cvDraw(); }
window.cvSet = cvSet;

// ---------- wiring ----------
bindS('vn_a', 2, vnDraw); bindS('vn_b', 2, vnDraw); bindS('vn_i', 2, vnDraw);
bindS('bn_n', 0, bnDraw); bindS('bn_p', 2, bnDraw); bindS('bn_k', 0, bnDraw);
bindS('po_l', 1, poDraw); bindS('po_k', 0, poDraw);
bindS('cn_p1', 2, cnDraw); bindS('cn_p2', 2, cnDraw); bindS('cn_b', 2, cnDraw);
bindS('cv_r', 2, cvDraw); bindS('cv_w', 2, cvDraw);
document.getElementById('cn_kind')?.addEventListener('change', () => {
  const k = cnKind();
  if (k === 'norm') cnSet('norm', 0, 1, 1);
  else if (k === 'exp') cnSet('exp', 1, 1, 1);
  else cnSet('unif', 0, 1, 0.5);
});

function drawAll() { vnDraw(); bnDraw(); poDraw(); cnDraw(); cvDraw(); }
if (document.getElementById('cn_kind')) cnSet('norm', 0, 1, 1);
drawAll();
window.addEventListener('themechange', drawAll);
