// Interactive figures for the prep exam review. Same conventions as the other
// courses: vanilla SVG drawing, colors read from CSS variables so theme switches
// (course.js dispatches 'themechange') repaint correctly.
const NS = 'http://www.w3.org/2000/svg';
function cv(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }
function rgba(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function txt(x, y, s, fill, parent, anchor, size) { const t = el('text', { x, y, fill, 'font-size': size || 11, ...(anchor ? { 'text-anchor': anchor } : {}) }, parent); t.textContent = s; return t; }
function fmt(x, d = 2) { return (+x).toFixed(d); }
function bindS(id, dec, fn) {
  const s = document.getElementById(id);
  if (!s) return;
  s.addEventListener('input', () => { document.getElementById(id + '_v').textContent = fmt(s.value, dec); fn(); });
}
function setS(pairs) { for (const [id, v, dec] of pairs) { const s = document.getElementById(id); if (!s) continue; s.value = v; document.getElementById(id + '_v').textContent = fmt(v, dec); } }
function val(id) { return parseFloat(document.getElementById(id).value); }

// ---------- 03 · pmf explorer: mean as balance point, variance as spread ----------
// Values are 10, 20 and x3; the two outer probabilities are the sliders and the
// middle one is whatever keeps the axiom sum(P) = 1 satisfied.
function pmDraw() {
  const svg = document.getElementById('pmsvg');
  if (!svg) return;
  svg.innerHTML = '';
  let p1 = val('pm_p1'), p3 = val('pm_p3');
  if (p1 + p3 > 1) { const s = 1 / (p1 + p3); p1 *= s; p3 *= s; }   // never let the middle weight go negative
  const p2 = Math.max(0, 1 - p1 - p3);
  const x3 = val('pm_x3');
  const xs = [10, 20, x3], ps = [p1, p2, p3];
  const mu = xs.reduce((a, x, i) => a + x * ps[i], 0);
  const m2 = xs.reduce((a, x, i) => a + x * x * ps[i], 0);
  const v = Math.max(0, m2 - mu * mu), sd = Math.sqrt(v);

  const X = (x) => 24 + (x / 70) * 282, yb = 162, H = 118;
  const pmax = Math.max(0.5, ...ps);
  const Y = (p) => yb - (p / pmax) * H;

  // axis + ticks
  el('line', { x1: 16, y1: yb, x2: 312, y2: yb, stroke: cv('--border2') }, svg);
  for (let t = 0; t <= 70; t += 10) {
    el('line', { x1: X(t), y1: yb, x2: X(t), y2: yb + 4, stroke: cv('--border2') }, svg);
    txt(X(t), yb + 15, String(t), cv('--dim'), svg, 'middle', 9.5);
  }
  // one-sigma span, drawn under the bars
  if (sd > 0) {
    el('line', { x1: X(Math.max(0, mu - sd)), y1: yb + 26, x2: X(Math.min(70, mu + sd)), y2: yb + 26, stroke: cv('--amber'), 'stroke-width': 3 }, svg);
    txt(X(mu), yb + 40, 'μ ± σ', cv('--amber'), svg, 'middle');
  }
  // bars
  const cols = [cv('--blue'), cv('--blue'), cv('--blue')];
  xs.forEach((x, i) => {
    const w = 20, h = yb - Y(ps[i]);
    if (h > 0.5) {
      el('rect', { x: X(x) - w / 2, y: Y(ps[i]), width: w, height: h, fill: rgba(cols[i], 0.35), stroke: cols[i] }, svg);
    }
    txt(X(x), Y(ps[i]) - 5, fmt(ps[i], 2), ps[i] > 0.005 ? cv('--text') : cv('--dim'), svg, 'middle', 10);
  });
  // mean marker
  el('path', { d: `M ${X(mu) - 7} ${yb + 1} L ${X(mu) + 7} ${yb + 1} L ${X(mu)} ${yb - 11} Z`, fill: cv('--green') }, svg);
  txt(X(mu), 18, 'E[X] = ' + fmt(mu, 2), cv('--green'), svg, 'middle');
  el('line', { x1: X(mu), y1: 24, x2: X(mu), y2: yb - 12, stroke: cv('--green'), 'stroke-dasharray': '3 3' }, svg);

  const r = document.getElementById('pmread');
  if (r) {
    r.innerHTML =
      `<span>E[X] <b>${fmt(mu, 2)}</b></span>` +
      `<span>E[X²] <b>${fmt(m2, 1)}</b></span>` +
      `<span>V[X] <b>${fmt(v, 2)}</b></span>` +
      `<span>σ <b>${fmt(sd, 2)}</b></span>` +
      `<span class="muted">P(X=20) = ${fmt(p2, 2)}</span>`;
  }
}
function pmSet(p1, p3, x3) { setS([['pm_p1', p1, 2], ['pm_p3', p3, 2], ['pm_x3', x3, 0]]); pmDraw(); }
window.pmSet = pmSet;

// ---------- 06 · V[X ± Y] as a function of rho ----------
function vsDraw() {
  const svg = document.getElementById('vssvg');
  if (!svg) return;
  svg.innerHTML = '';
  // sliders carry the variances directly so the drill table reproduces exactly
  const vx = val('vs_vx'), vy = val('vs_vy'), rho = val('vs_r');
  const cov = rho * Math.sqrt(vx * vy);
  const vsum = vx + vy + 2 * cov, vdif = vx + vy - 2 * cov;

  const yb = 168, H = 128, top = Math.max(vsum, vdif, vx + vy, 1e-6);
  const Y = (v) => yb - (v / top) * H;
  const bars = [
    { x: 30, w: 40, v: vx, c: cv('--muted'), l: 'V[X]' },
    { x: 82, w: 40, v: vy, c: cv('--muted'), l: 'V[Y]' },
    { x: 158, w: 52, v: vsum, c: cv('--green'), l: 'V[X+Y]' },
    { x: 232, w: 52, v: vdif, c: cv('--red'), l: 'V[X−Y]' },
  ];
  el('line', { x1: 16, y1: yb, x2: 306, y2: yb, stroke: cv('--border2') }, svg);
  el('line', { x1: 140, y1: 26, x2: 140, y2: yb, stroke: cv('--border'), 'stroke-dasharray': '2 4' }, svg);
  // the no-covariance reference level
  el('line', { x1: 146, y1: Y(vx + vy), x2: 300, y2: Y(vx + vy), stroke: cv('--amber'), 'stroke-dasharray': '5 3' }, svg);
  txt(300, Y(vx + vy) - 5, 'V[X] + V[Y]', cv('--amber'), svg, 'end', 10);

  bars.forEach((b) => {
    const h = yb - Y(b.v);
    if (h > 0.5) el('rect', { x: b.x, y: Y(b.v), width: b.w, height: h, fill: rgba(b.c.startsWith('#') ? b.c : '#888888', 0.35), stroke: b.c }, svg);
    else el('line', { x1: b.x, y1: yb, x2: b.x + b.w, y2: yb, stroke: b.c, 'stroke-width': 2 }, svg);
    txt(b.x + b.w / 2, Y(b.v) - 6, fmt(b.v, 1), b.c, svg, 'middle', 10);
    txt(b.x + b.w / 2, yb + 14, b.l, cv('--muted'), svg, 'middle', 10);
  });
  txt(16, 20, 'ρ = ' + fmt(rho, 2) + '   Cov = ' + fmt(cov, 2), cv('--text'), svg, 'start');

  const r = document.getElementById('vsread');
  if (r) {
    r.innerHTML =
      `<span>Cov[X,Y] <b>${fmt(cov, 2)}</b></span>` +
      `<span>V[X+Y] <b>${fmt(vsum, 2)}</b></span>` +
      `<span>V[X−Y] <b>${fmt(vdif, 2)}</b></span>` +
      `<span class="muted">sum of the two = ${fmt(vsum + vdif, 2)} = 2(V[X]+V[Y])</span>`;
  }
}
function vsSet(vx, vy, r) { setS([['vs_vx', vx, 1], ['vs_vy', vy, 1], ['vs_r', r, 2]]); vsDraw(); }
window.vsSet = vsSet;

// ---------- wiring ----------
bindS('pm_p1', 2, pmDraw); bindS('pm_p3', 2, pmDraw); bindS('pm_x3', 0, pmDraw);
bindS('vs_vx', 1, vsDraw); bindS('vs_vy', 1, vsDraw); bindS('vs_r', 2, vsDraw);

function drawAll() { pmDraw(); vsDraw(); }
drawAll();
window.addEventListener('themechange', drawAll);
