// Interactive figures for MSc Statistics (S. Peluso).
// Same conventions as the other courses: vanilla SVG drawing, colours read from
// CSS variables so the theme switch (course.js dispatches 'themechange')
// repaints correctly. Every figure is keyed by an id prefix and silently does
// nothing when its markup is absent.
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
function chk(id) { const e = document.getElementById(id); return !!(e && e.checked); }
// 'any' keeps range inputs continuous, so a preset value is never snapped to a
// step grid — quantisation there silently shifts the exercise numbers
function setRange(id, min, max) { const s = document.getElementById(id); if (!s) return; s.min = min; s.max = max; s.step = 'any'; }
// show a probability as a small fraction when it is one (8/13, 5/16, 4/9 ...)
function frac(x, maxDen = 64) {
  if (!isFinite(x)) return '—';
  for (let d = 1; d <= maxDen; d++) { const n = Math.round(x * d); if (Math.abs(x * d - n) < 1e-9) return d === 1 ? String(n) : `${n}/${d}`; }
  return fmt(x, 4);
}
function both(x, d = 4) { const f = frac(x); return f.includes('/') ? `${f} = ${fmt(x, d)}` : fmt(x, d); }
function thou(n) { return Math.round(n).toLocaleString('en-US'); }

// axis helper: returns the plotting frame
function frame(svg, W, H, pad) {
  const x0 = pad.l, x1 = W - pad.r, yb = H - pad.b, yt = pad.t;
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt, x2: x0, y2: yb, stroke: cv_('--border2') }, svg);
  return { x0, x1, yb, yt };
}

// =====================================================================
// 02 · set operations on one roll of a die
// =====================================================================
const SO_PAIRS = {
  lt3: { la: 'A', lb: 'B', da: 'A = even = {2,4,6}', db: 'B = less than 3 = {1,2}', A: [2, 4, 6], B: [1, 2] },
  prime: { la: 'E₁', lb: 'E₂', da: 'E₁ = even = {2,4,6}', db: 'E₂ = prime = {2,3,5}', A: [2, 4, 6], B: [2, 3, 5] },
};
const SO_OPS = {
  A: { f: (a) => a, n: (x) => x },
  union: { f: (a, b) => a || b, n: (x, y) => `${x} ∪ ${y}` },
  inter: { f: (a, b) => a && b, n: (x, y) => `${x} ∩ ${y}` },
  Ac: { f: (a) => !a, n: (x) => `${x}ᶜ` },
  AmB: { f: (a, b) => a && !b, n: (x, y) => `${x} − ${y}` },
  BmA: { f: (a, b) => b && !a, n: (x, y) => `${y} − ${x}` },
  unionC: { f: (a, b) => !(a || b), n: (x, y) => `(${x} ∪ ${y})ᶜ`, dm: 'AcBc' },
  AcBc: { f: (a, b) => !a && !b, n: (x, y) => `${x}ᶜ ∩ ${y}ᶜ`, dm: 'unionC' },
  interC: { f: (a, b) => !(a && b), n: (x, y) => `(${x} ∩ ${y})ᶜ`, dm: 'AcuBc' },
  AcuBc: { f: (a, b) => !a || !b, n: (x, y) => `${x}ᶜ ∪ ${y}ᶜ`, dm: 'interC' },
};
let soPairKey = 'lt3', soOpKey = 'union';
function soDraw() {
  const svg = document.getElementById('sosvg');
  if (!svg) return;
  svg.innerHTML = '';
  const P = SO_PAIRS[soPairKey], op = SO_OPS[soOpKey];
  const W = 360, H = 222, ax = 140, bx = 220, cy = 120, r = 64;
  const defs = el('defs', {}, svg);
  const mk = (id, circles) => {
    const m = el('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, m);
    circles.forEach((cx) => el('circle', { cx, cy, r, fill: '#000' }, m));
  };
  mk('soNotB', [bx]); mk('soNotA', [ax]); mk('soNotAB', [ax, bx]);
  const cp = el('clipPath', { id: 'soClipB' }, defs);
  el('circle', { cx: bx, cy, r }, cp);

  const on = rgba(cv_('--amber'), 0.5);
  if (op.f(true, false)) el('circle', { cx: ax, cy, r, fill: on, mask: 'url(#soNotB)' }, svg);
  if (op.f(true, true)) el('circle', { cx: ax, cy, r, fill: on, 'clip-path': 'url(#soClipB)' }, svg);
  if (op.f(false, true)) el('circle', { cx: bx, cy, r, fill: on, mask: 'url(#soNotA)' }, svg);
  if (op.f(false, false)) el('rect', { x: 12, y: 28, width: 336, height: 184, fill: on, mask: 'url(#soNotAB)' }, svg);

  el('rect', { x: 12, y: 28, width: 336, height: 184, fill: 'none', stroke: cv_('--border2') }, svg);
  txt(18, 21, 'Ω = {1, 2, 3, 4, 5, 6}', cv_('--muted'), svg, 'start', 10.5);
  el('circle', { cx: ax, cy, r, fill: 'none', stroke: cv_('--blue'), 'stroke-width': 1.8 }, svg);
  el('circle', { cx: bx, cy, r, fill: 'none', stroke: cv_('--green'), 'stroke-width': 1.8 }, svg);
  txt(ax - 52, cy - 52, P.la, cv_('--blue'), svg, 'middle', 13);
  txt(bx + 52, cy - 52, P.lb, cv_('--green'), svg, 'middle', 13);

  const slots = { 10: [[112, 106], [118, 148]], 11: [[180, 124]], '01': [[248, 106], [242, 148]], '00': [[36, 196], [324, 48], [324, 196]] };
  const used = { 10: 0, 11: 0, '01': 0, '00': 0 };
  const res = [];
  for (let w = 1; w <= 6; w++) {
    const ia = P.A.includes(w), ib = P.B.includes(w);
    const key = (ia ? '1' : '0') + (ib ? '1' : '0');
    const [x, y] = slots[key][used[key]++];
    const s = op.f(ia, ib);
    if (s) res.push(w);
    el('circle', { cx: x, cy: y - 4, r: 10.5, fill: s ? cv_('--amber') : cv_('--panel2'), stroke: s ? cv_('--amber') : cv_('--border2') }, svg);
    txt(x, y, String(w), s ? cv_('--bg') : cv_('--text'), svg, 'middle', 11.5);
  }
  const name = op.n(P.la, P.lb);
  const r0 = document.getElementById('soread');
  if (r0) {
    let dm = '';
    if (op.dm) dm = `<span class="muted">same shading as <b>${SO_OPS[op.dm].n(P.la, P.lb)}</b> — De Morgan</span>`;
    r0.innerHTML = `<span>${name} = <b>${res.length ? '{' + res.join(', ') + '}' : '∅'}</b></span>` +
      `<span>P(${name}) = <b>${frac(res.length / 6)}</b></span>` +
      `<span class="muted">${P.da} · ${P.db}</span>` + dm;
  }
  document.querySelectorAll('[data-so]').forEach((b) => { b.style.borderColor = b.dataset.so === soOpKey ? cv_('--amber') : ''; });
}
function soOp(k) { soOpKey = k; soDraw(); }
function soPair(k) { soPairKey = k; soDraw(); }
window.soOp = soOp; window.soPair = soPair;

// =====================================================================
// 03 · inclusion–exclusion, one term at a time
// =====================================================================
const IE_TERMS = [
  { s: ['A'], sign: 1, lab: '+|A|' }, { s: ['B'], sign: 1, lab: '+|B|' }, { s: ['C'], sign: 1, lab: '+|C|' },
  { s: ['A', 'B'], sign: -1, lab: '−|A∩B|' }, { s: ['B', 'C'], sign: -1, lab: '−|B∩C|' }, { s: ['A', 'C'], sign: -1, lab: '−|A∩C|' },
  { s: ['A', 'B', 'C'], sign: 1, lab: '+|A∩B∩C|' },
];
const IE_C = { A: [145, 105], B: [215, 105], C: [180, 165] };
const IE_R = 58;
const IE_REG = [
  { k: 'A', x: 114, y: 92 }, { k: 'B', x: 246, y: 92 }, { k: 'C', x: 180, y: 206 },
  { k: 'AB', x: 180, y: 80 }, { k: 'AC', x: 140, y: 152 }, { k: 'BC', x: 220, y: 152 }, { k: 'ABC', x: 180, y: 128 },
];
const IE_MSG = [
  'Start: nothing counted yet. Add the terms one by one.',
  '+|A|: every region inside A is counted once.',
  '+|B|: the two regions A and B share (A∩B) are now counted twice.',
  '+|C|: every pairwise overlap is counted twice — and the centre three times.',
  '−|A∩B|: the A∩B-only region is back to one, the centre drops to two.',
  '−|B∩C|: B∩C repaired; the centre drops to one…',
  '−|A∩C|: …and to zero. Subtracting all three overlaps removed the centre completely.',
  '+|A∩B∩C|: the centre is put back once. Every region is now counted exactly once ✓',
];
let ieK = 0;
function ieDraw() {
  const svg = document.getElementById('iesvg');
  if (!svg) return;
  svg.innerHTML = '';
  const defs = el('defs', {}, svg);
  for (const k of ['A', 'B', 'C']) { const c = el('clipPath', { id: 'ieClip' + k }, defs); el('circle', { cx: IE_C[k][0], cy: IE_C[k][1], r: IE_R }, c); }
  el('rect', { x: 20, y: 22, width: 320, height: 222, fill: 'none', stroke: cv_('--border') }, svg);

  if (ieK > 0) {
    const t = IE_TERMS[ieK - 1];
    const fill = rgba(t.sign > 0 ? cv_('--green') : cv_('--red'), 0.38);
    const first = t.s[0], rest = t.s.slice(1);
    let parent = svg;
    for (let i = rest.length - 1; i >= 1; i--) parent = el('g', { 'clip-path': `url(#ieClip${rest[i]})` }, parent);
    el('circle', { cx: IE_C[first][0], cy: IE_C[first][1], r: IE_R, fill, ...(rest.length ? { 'clip-path': `url(#ieClip${rest[0]})` } : {}) }, parent);
  }
  const col = { A: cv_('--blue'), B: cv_('--green'), C: cv_('--amber') };
  for (const k of ['A', 'B', 'C']) el('circle', { cx: IE_C[k][0], cy: IE_C[k][1], r: IE_R, fill: 'none', stroke: col[k], 'stroke-width': 1.7 }, svg);
  txt(80, 52, 'A', col.A, svg, 'middle', 13); txt(280, 52, 'B', col.B, svg, 'middle', 13); txt(252, 222, 'C', col.C, svg, 'middle', 13);

  let once = 0;
  for (const g of IE_REG) {
    let c = 0;
    for (let j = 0; j < ieK; j++) if (IE_TERMS[j].s.every((l) => g.k.includes(l))) c += IE_TERMS[j].sign;
    if (c === 1) once++;
    const f = c === 1 ? cv_('--green') : c === 0 ? cv_('--dim') : c === 2 ? cv_('--amber') : cv_('--red');
    el('circle', { cx: g.x, cy: g.y - 4, r: 10, fill: cv_('--panel'), stroke: f, 'stroke-width': 1.5 }, svg);
    txt(g.x, g.y, String(c), f, svg, 'middle', 11.5);
  }
  txt(180, 16, ieK === 0 ? 'numbers = how many times each region has been counted' : 'after ' + IE_TERMS.slice(0, ieK).map((t) => t.lab).join(' '), cv_('--text'), svg, 'middle', 10);
  const r = document.getElementById('ieread');
  if (r) r.innerHTML = `<span>terms used <b>${ieK}/7</b></span><span>regions counted exactly once <b>${once}/7</b></span><span class="muted">${IE_MSG[ieK]}</span>`;
}
function ieStep() { ieK = Math.min(7, ieK + 1); ieDraw(); }
function ieBack() { ieK = Math.max(0, ieK - 1); ieDraw(); }
function ieAll() { ieK = 7; ieDraw(); }
function ieReset() { ieK = 0; ieDraw(); }
window.ieStep = ieStep; window.ieBack = ieBack; window.ieAll = ieAll; window.ieReset = ieReset;

// =====================================================================
// 06 · a random point in (0,1): probability = length
// =====================================================================
function unDraw() {
  const svg = document.getElementById('unsvg');
  if (!svg) return;
  svg.innerHTML = '';
  let u = val('un_u'), v = val('un_v');
  if (u > v) [u, v] = [v, u];
  const x0 = 34, x1 = 326, yb = 122, yt = 50;
  const X = (t) => x0 + t * (x1 - x0);
  el('line', { x1: 14, y1: yb, x2: 346, y2: yb, stroke: cv_('--border2') }, svg);
  el('rect', { x: x0, y: yt, width: x1 - x0, height: yb - yt, fill: rgba(cv_('--blue'), 0.08), stroke: cv_('--blue'), 'stroke-dasharray': '4 3' }, svg);
  txt(x0 + 4, yt - 6, 'all points equally likely: height 1', cv_('--muted'), svg, 'start', 10);
  if (v - u > 0.0015) {
    el('rect', { x: X(u), y: yt, width: X(v) - X(u), height: yb - yt, fill: rgba(cv_('--green'), 0.42), stroke: cv_('--green'), 'stroke-width': 1.5 }, svg);
    if (v - u > 0.12) txt((X(u) + X(v)) / 2, (yt + yb) / 2 + 4, 'length ' + fmt(v - u, 3), cv_('--text'), svg, 'middle', 11);
  } else {
    el('line', { x1: X(u), y1: yt - 2, x2: X(u), y2: yb, stroke: cv_('--red'), 'stroke-width': 1.6 }, svg);
    txt(X(u), yt - 16, 'a single point: width 0 ⇒ probability 0', cv_('--red'), svg, 'middle', 10.5);
  }
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    el('line', { x1: X(t), y1: yb, x2: X(t), y2: yb + 5, stroke: cv_('--border2') }, svg);
    txt(X(t), yb + 17, String(t), cv_('--dim'), svg, 'middle', 9.5);
  }
  el('path', { d: `M ${X(u)} ${yb + 22} l -5 9 l 10 0 Z`, fill: cv_('--green') }, svg);
  el('path', { d: `M ${X(v)} ${yb + 22} l -5 9 l 10 0 Z`, fill: cv_('--green') }, svg);
  txt(X(u) - 2, yb + 44, 'u=' + fmt(u, 2), cv_('--green'), svg, 'end', 10);
  txt(X(v) + 2, yb + 44, 'v=' + fmt(v, 2), cv_('--green'), svg, 'start', 10);
  const r = document.getElementById('unread');
  if (r) r.innerHTML = `<span>P((u, v)) = v − u = <b>${fmt(v - u, 3)}</b></span><span>P(not in it) = <b>${fmt(1 - (v - u), 3)}</b></span><span class="muted">open or closed ends give the same number: each endpoint has probability 0</span>`;
}
function unSet(u, v) { setS([['un_u', u, 2], ['un_v', v, 2]]); unDraw(); }
window.unSet = unSet;

// =====================================================================
// 07 · the classroom: conditioning shrinks the world
// =====================================================================
const CL_GROUPS = [
  { k: 'C', n: 8, cols: 4, x: 20, name: 'Chinese', c: '--green' },
  { k: 'I', n: 7, cols: 4, x: 138, name: 'Italian', c: '--blue' },
  { k: 'K', n: 5, cols: 3, x: 256, name: 'Korean', c: '--amber' },
];
const CL_MODES = { none: { out: [], lab: 'no information' }, notI: { out: ['I'], lab: 'not an Italian' }, notK: { out: ['K'], lab: 'not a Korean' }, notC: { out: ['C'], lab: 'not a Chinese' } };
let clMode = 'none';
function clDraw() {
  const svg = document.getElementById('clsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const M = CL_MODES[clMode];
  let world = 0;
  for (const g of CL_GROUPS) {
    const out = M.out.includes(g.k);
    if (!out) world += g.n;
    const col = cv_(g.c);
    const w = g.cols * 27 - 5;
    el('rect', { x: g.x - 6, y: 30, width: w + 12, height: 86, fill: out ? 'none' : rgba(col, 0.07), stroke: out ? cv_('--border') : col, 'stroke-dasharray': out ? '3 3' : 'none', rx: 3 }, svg);
    for (let i = 0; i < g.n; i++) {
      const cx = g.x + 11 + (i % g.cols) * 27, cy = 54 + Math.floor(i / g.cols) * 38;
      const isE = g.k === 'C';
      el('circle', { cx, cy, r: 11, fill: out ? 'none' : rgba(col, isE ? 0.55 : 0.28), stroke: out ? cv_('--dim') : col, 'stroke-width': isE ? 1.8 : 1.2, opacity: out ? 0.45 : 1 }, svg);
      txt(cx, cy + 3.5, g.k + (i + 1), out ? cv_('--dim') : cv_('--text'), svg, 'middle', 8.5);
      if (out) el('line', { x1: cx - 9, y1: cy + 9, x2: cx + 9, y2: cy - 9, stroke: cv_('--red'), 'stroke-width': 1.2 }, svg);
    }
    txt(g.x + w / 2, 132, `${g.name} · ${g.n}`, out ? cv_('--dim') : col, svg, 'middle', 10.5);
  }
  txt(180, 18, 'Ω = 20 students · E = "book of a Chinese student"', cv_('--muted'), svg, 'middle', 10);
  // proportion bar: E's share of the (possibly shrunken) world
  const inE = M.out.includes('C') ? 0 : 8;
  const bx0 = 20, bw = 320, by = 156;
  el('rect', { x: bx0, y: by, width: bw, height: 18, fill: cv_('--panel2'), stroke: cv_('--border2') }, svg);
  if (inE > 0) el('rect', { x: bx0, y: by, width: bw * inE / world, height: 18, fill: rgba(cv_('--green'), 0.6) }, svg);
  txt(bx0, by + 32, `information: ${M.lab}`, cv_('--muted'), svg, 'start', 10);
  txt(bx0 + bw, by + 32, `P(E | info) = ${inE}/${world}`, cv_('--green'), svg, 'end', 11);
  const r = document.getElementById('clread');
  if (r) r.innerHTML = `<span>world size <b>${world}</b></span><span>Chinese owners left <b>${inE}</b></span><span>P(E | ${M.lab}) = <b>${inE}/${world} = ${fmt(inE / world, 3)}</b></span><span class="muted">unconditional: 8/20 = 0.400</span>`;
  document.querySelectorAll('[data-cl]').forEach((b) => { b.style.borderColor = b.dataset.cl === clMode ? cv_('--green') : ''; });
}
function clSet(m) { clMode = m; clDraw(); }
window.clSet = clSet;

// =====================================================================
// 07 · two-period stock price tree, with and without conditioning
// =====================================================================
function trDraw() {
  const svg = document.getElementById('trsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const p = val('tr_p'), q = 1 - p, cond = chk('tr_c');
  const N = { r: [30, 120], u: [130, 66], d: [130, 174], uu: [224, 30], ud: [224, 96], du: [224, 144], dd: [224, 210] };
  const fade = (k) => (cond && (k === 'd' || k === 'du' || k === 'dd') ? 0.22 : 1);
  const edge = (a, b, lab, hot) => {
    const [x1, y1] = N[a], [x2, y2] = N[b];
    const o = Math.min(fade(a === 'r' ? b : a), fade(b));
    el('line', { x1: x1 + 18, y1, x2: x2 - 22, y2, stroke: hot ? cv_('--amber') : cv_('--border2'), 'stroke-width': hot ? 2.6 : 1.4, opacity: o }, svg);
    const mx = (x1 + x2) / 2 - 2, my = (y1 + y2) / 2 + (y2 < y1 ? -6 : 14);
    txt(mx, my, lab, cv_('--muted'), svg, 'middle', 10).setAttribute('opacity', o);
  };
  edge('r', 'u', 'p_u', true); edge('r', 'd', 'p_d');
  edge('u', 'uu', 'p_u', true); edge('u', 'ud', 'p_d'); edge('d', 'du', 'p_u'); edge('d', 'dd', 'p_d');
  const node = (k, lab, hot) => {
    const [x, y] = N[k];
    const g = el('g', { opacity: fade(k) }, svg);
    el('rect', { x: x - 22, y: y - 11, width: 44, height: 20, rx: 3, fill: hot ? rgba(cv_('--amber'), 0.25) : cv_('--panel2'), stroke: hot ? cv_('--amber') : cv_('--border2') }, g);
    txt(x, y + 3.5, lab, cv_('--text'), g, 'middle', 10.5);
  };
  node('r', 'P₀'); node('u', 'P₀u', true); node('d', 'P₀d'); node('uu', 'P₀u²', true); node('ud', 'P₀'); node('du', 'P₀'); node('dd', 'P₀d²');
  const leaf = cond ? { uu: p, ud: q, du: 0, dd: 0 } : { uu: p * p, ud: p * q, du: q * p, dd: q * q };
  const lab = cond ? { uu: 'p_u', ud: 'p_d', du: '0', dd: '0' } : { uu: 'p_u²', ud: 'p_u·p_d', du: 'p_d·p_u', dd: 'p_d²' };
  for (const k of ['uu', 'ud', 'du', 'dd']) {
    const [x, y] = N[k];
    txt(x + 30, y + 4, `${lab[k]} = ${frac(leaf[k], 81)}`, k === 'uu' ? cv_('--amber') : cv_('--text'), svg, 'start', 10.5).setAttribute('opacity', fade(k) < 1 ? 0.4 : 1);
  }
  for (const [x, t] of [[30, 't = 0'], [130, 't = 1'], [224, 't = 2']]) txt(x, 236, t, cv_('--dim'), svg, 'middle', 10);
  if (cond) txt(130, 206, 'known: P₁ = P₀u', cv_('--red'), svg, 'middle', 10);
  const r = document.getElementById('trread');
  if (r) {
    r.innerHTML = `<span>P(P₂ = P₀u²) = p_u² = <b>${both(p * p)}</b></span>` +
      `<span>P(P₂ = P₀u² | P₁ = P₀u) = p_u = <b>${both(p)}</b></span>` +
      `<span>P(P₂ = P₀) = 2p_u p_d = <b>${both(2 * p * q)}</b></span>` +
      `<span class="muted">${cond ? 'down branch ruled out: the up branch carries all the probability' : 'four paths, probabilities multiply along a path and sum to 1'}</span>`;
  }
}
function trSet(p, c) { setS([['tr_p', p, 3]]); const e = document.getElementById('tr_c'); if (e) e.checked = c; trDraw(); }
window.trSet = trSet;

// =====================================================================
// 09 · two fair coins: pairwise versus joint independence
// =====================================================================
function coDraw() {
  const svg = document.getElementById('cosvg');
  if (!svg) return;
  svg.innerHTML = '';
  const act = ['A', 'B', 'C'].filter((k) => chk('co_' + k));
  const EV = { A: ['HH', 'HT'], B: ['HH', 'TT'], C: ['HH', 'TH'] };
  const col = { A: cv_('--blue'), B: cv_('--green'), C: cv_('--amber') };
  const gx = 110, gy = 40, cw = 100, ch = 66;
  const cell = { HH: [0, 0], HT: [0, 1], TH: [1, 0], TT: [1, 1] };
  const inAll = (o) => act.length > 0 && act.every((k) => EV[k].includes(o));
  for (const o in cell) {
    const [rr, cc] = cell[o];
    const x = gx + cc * cw, y = gy + rr * ch;
    el('rect', { x, y, width: cw, height: ch, fill: inAll(o) ? rgba(cv_('--text'), 0.14) : cv_('--panel2'), stroke: cv_('--border2') }, svg);
    txt(x + cw / 2, y + ch / 2 + 2, o, cv_('--text'), svg, 'middle', 14);
    txt(x + cw / 2, y + ch / 2 + 17, '1/4', cv_('--dim'), svg, 'middle', 9.5);
  }
  txt(gx + cw / 2, gy - 8, '2nd = H', cv_('--muted'), svg, 'middle', 10);
  txt(gx + 1.5 * cw, gy - 8, '2nd = T', cv_('--muted'), svg, 'middle', 10);
  txt(gx - 8, gy + ch / 2 + 4, '1st = H', cv_('--muted'), svg, 'end', 10);
  txt(gx - 8, gy + 1.5 * ch + 4, '1st = T', cv_('--muted'), svg, 'end', 10);
  // event outlines, inset by different amounts so they never hide each other
  if (act.includes('A')) el('rect', { x: gx + 4, y: gy + 4, width: 2 * cw - 8, height: ch - 8, fill: 'none', stroke: col.A, 'stroke-width': 2, rx: 4 }, svg);
  if (act.includes('C')) el('rect', { x: gx + 9, y: gy + 9, width: cw - 18, height: 2 * ch - 18, fill: 'none', stroke: col.C, 'stroke-width': 2, rx: 4, 'stroke-dasharray': '6 3' }, svg);
  if (act.includes('B')) {
    el('rect', { x: gx + 14, y: gy + 14, width: cw - 28, height: ch - 28, fill: 'none', stroke: col.B, 'stroke-width': 2, rx: 4, 'stroke-dasharray': '2 3' }, svg);
    el('rect', { x: gx + cw + 14, y: gy + ch + 14, width: cw - 28, height: ch - 28, fill: 'none', stroke: col.B, 'stroke-width': 2, rx: 4, 'stroke-dasharray': '2 3' }, svg);
  }
  const leg = [['A', '1st coin H'], ['B', 'both the same'], ['C', '2nd coin H']];
  leg.forEach(([k, s], i) => txt(20 + i * 118, 196, `${k}: ${s}`, act.includes(k) ? col[k] : cv_('--dim'), svg, 'start', 10.5));
  const r = document.getElementById('coread');
  if (!r) return;
  if (act.length === 0) { r.innerHTML = '<span class="muted">tick at least one event</span>'; return; }
  const n = Object.keys(cell).filter(inAll).length;
  const pI = n / 4, pP = Math.pow(0.5, act.length);
  const nm = act.join('∩');
  if (act.length === 1) { r.innerHTML = `<span>P(${nm}) = <b>1/2</b></span><span class="muted">tick a second event to test independence</span>`; return; }
  const ok = Math.abs(pI - pP) < 1e-12;
  r.innerHTML = `<span>P(${nm}) = <b>${frac(pI)}</b></span><span>${act.map((k) => 'P(' + k + ')').join('·')} = <b>${frac(pP)}</b></span>` +
    `<span style="color:${ok ? cv_('--green') : cv_('--red')}">${ok ? '✓ equal: the product rule holds' : '✗ not equal: the product rule fails'}</span>` +
    `<span class="muted">A, B, C are pairwise independent but not jointly independent</span>`;
}
function coSet(a, b, c) { for (const [k, v] of [['A', a], ['B', b], ['C', c]]) { const e = document.getElementById('co_' + k); if (e) e.checked = v; } coDraw(); }
window.coSet = coSet;

// =====================================================================
// 09 · a machine with three independent components
// =====================================================================
let maMode = 'par';
function maDraw() {
  const svg = document.getElementById('masvg');
  if (!svg) return;
  svg.innerHTML = '';
  const q = [val('ma_1'), val('ma_2'), val('ma_3')];
  const wire = cv_('--border2');
  const box = (x, y, i) => {
    el('rect', { x: x - 34, y: y - 17, width: 68, height: 34, rx: 3, fill: rgba(cv_('--red'), 0.1 + 0.9 * q[i]), stroke: cv_('--red') }, svg);
    txt(x, y - 2, 'K' + (i + 1), cv_('--text'), svg, 'middle', 11);
    txt(x, y + 11, 'fails ' + fmt(q[i], 2), cv_('--muted'), svg, 'middle', 9);
  };
  el('circle', { cx: 24, cy: 100, r: 5, fill: cv_('--green') }, svg);
  el('circle', { cx: 336, cy: 100, r: 5, fill: cv_('--green') }, svg);
  txt(24, 124, 'in', cv_('--dim'), svg, 'middle', 9.5); txt(336, 124, 'out', cv_('--dim'), svg, 'middle', 9.5);
  if (maMode === 'par') {
    const ys = [40, 100, 160];
    el('line', { x1: 24, y1: 100, x2: 80, y2: 100, stroke: wire, 'stroke-width': 1.6 }, svg);
    el('line', { x1: 280, y1: 100, x2: 336, y2: 100, stroke: wire, 'stroke-width': 1.6 }, svg);
    el('line', { x1: 80, y1: 40, x2: 80, y2: 160, stroke: wire, 'stroke-width': 1.6 }, svg);
    el('line', { x1: 280, y1: 40, x2: 280, y2: 160, stroke: wire, 'stroke-width': 1.6 }, svg);
    ys.forEach((y, i) => { el('line', { x1: 80, y1: y, x2: 280, y2: y, stroke: wire, 'stroke-width': 1.6 }, svg); box(180, y, i); });
    txt(180, 192, 'parallel: current gets through if ANY component works', cv_('--muted'), svg, 'middle', 10);
  } else {
    el('line', { x1: 24, y1: 100, x2: 336, y2: 100, stroke: wire, 'stroke-width': 1.6 }, svg);
    [90, 180, 270].forEach((x, i) => box(x, 100, i));
    txt(180, 192, 'series: current gets through only if ALL components work', cv_('--muted'), svg, 'middle', 10);
  }
  const allFail = q[0] * q[1] * q[2];
  const allWork = (1 - q[0]) * (1 - q[1]) * (1 - q[2]);
  const r = document.getElementById('maread');
  if (!r) return;
  if (maMode === 'par') {
    const t1 = 1 - q[0], t2 = q[0] * (1 - q[1]), t3 = q[0] * q[1] * (1 - q[2]);
    r.innerHTML = `<span>P(machine fails) = q₁q₂q₃ = <b>${fmt(allFail, 4)}</b> (${fmt(100 * allFail, 2)}%)</span>` +
      `<span>P(works) = <b>${fmt(1 - allFail, 4)}</b></span>` +
      `<span class="muted">tree route: ${fmt(t1, 3)} + ${fmt(t2, 3)} + ${fmt(t3, 4)} = ${fmt(t1 + t2 + t3, 4)}</span>`;
  } else {
    r.innerHTML = `<span>P(works) = (1−q₁)(1−q₂)(1−q₃) = <b>${fmt(allWork, 4)}</b></span><span>P(fails) = <b>${fmt(1 - allWork, 4)}</b></span>` +
      `<span class="muted">same three components, far less reliable: series multiplies the survival probabilities</span>`;
  }
  document.querySelectorAll('[data-ma]').forEach((b) => { b.style.borderColor = b.dataset.ma === maMode ? cv_('--green') : ''; });
}
function maSet(mode, a, b, c) { maMode = mode; if (a !== undefined) setS([['ma_1', a, 2], ['ma_2', b, 2], ['ma_3', c, 2]]); maDraw(); }
window.maSet = maSet;

// =====================================================================
// 10 · rare disease: Bayes as a frequency tree
// =====================================================================
function dzP() { return Math.pow(10, val('dz_p')); }
function dzLabel() { const l = document.getElementById('dz_p_v'); if (l) { const p = dzP(); l.textContent = p < 0.01 ? fmt(p, 4) : fmt(p, 3); } }
function dzDraw() {
  const svg = document.getElementById('dzsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const p = dzP(), s = val('dz_s'), f = val('dz_f');
  const N = 100000, D = N * p, H = N - D, TP = D * s, FN = D - TP, FP = H * f, TN = H - FP;
  const post = TP / (TP + FP);
  const bx = (x, y, w, l1, l2, col, strong) => {
    el('rect', { x: x - w / 2, y: y - 15, width: w, height: 32, rx: 3, fill: strong ? rgba(col, 0.25) : cv_('--panel2'), stroke: col, 'stroke-width': strong ? 1.8 : 1 }, svg);
    txt(x, y - 1, l1, cv_('--text'), svg, 'middle', 10.5);
    txt(x, y + 12, l2, cv_('--muted'), svg, 'middle', 9);
  };
  const ln = (x1, y1, x2, y2, lab, lx, ly, anchor) => {
    el('line', { x1, y1, x2, y2, stroke: cv_('--border2'), 'stroke-width': 1.3 }, svg);
    txt(lx, ly, lab, cv_('--dim'), svg, anchor || 'middle', 9);
  };
  ln(180, 40, 90, 88, fmt(p, 4), 122, 60, 'end');
  ln(180, 40, 270, 88, fmt(1 - p, 4), 238, 60, 'start');
  ln(90, 118, 48, 158, fmt(s, 2), 58, 138, 'end');
  ln(90, 118, 132, 158, fmt(1 - s, 2), 122, 138, 'start');
  ln(270, 118, 228, 158, fmt(f, 3), 238, 138, 'end');
  ln(270, 118, 312, 158, fmt(1 - f, 3), 302, 138, 'start');
  bx(180, 26, 116, '100,000 people', 'screened', cv_('--border2'));
  bx(90, 104, 96, thou(D), 'have D', cv_('--amber'));
  bx(270, 104, 96, thou(H), 'healthy (Dᶜ)', cv_('--blue'));
  bx(48, 174, 74, thou(TP), 'D and +', cv_('--green'), true);
  bx(132, 174, 74, thou(FN), 'D and −', cv_('--border2'));
  bx(228, 174, 74, thou(FP), 'Dᶜ and +', cv_('--red'), true);
  bx(312, 174, 74, thou(TN), 'Dᶜ and −', cv_('--border2'));
  // all positives, side by side
  const x0 = 20, w = 320, y = 212;
  const wt = Math.max(2, w * post);
  el('rect', { x: x0, y, width: w, height: 16, fill: rgba(cv_('--red'), 0.45), stroke: cv_('--red') }, svg);
  el('rect', { x: x0, y, width: wt, height: 16, fill: cv_('--green') }, svg);
  txt(x0, y - 5, `everyone who tests positive: ${thou(TP + FP)}`, cv_('--muted'), svg, 'start', 9.5);
  txt(x0 + w, y + 30, `P(D | +) = ${thou(TP)} / ${thou(TP + FP)} = ${fmt(post, 4)}`, cv_('--green'), svg, 'end', 11);
  txt(x0, y + 46, 'green: truly ill · red: false alarms', cv_('--dim'), svg, 'start', 9.5);
  const r = document.getElementById('dzread');
  if (r) {
    const pPos = p * s + (1 - p) * f;
    r.innerHTML = `<span>P(+) = <b>${fmt(pPos, 5)}</b></span><span>P(D | +) = <b>${fmt(post, 4)}</b></span>` +
      `<span>P(D | −) = <b>${fmt(FN / (FN + TN), 6)}</b></span><span class="muted">prior ${fmt(p, 4)} → posterior ${fmt(post, 4)}: the test multiplied the odds by ${fmt(s / f, 1)}</span>`;
  }
}
function dzSet(p, s, f) { const e = document.getElementById('dz_p'); if (e) e.value = Math.log10(p); dzLabel(); setS([['dz_s', s, 3], ['dz_f', f, 3]]); dzDraw(); }
function dzRetest() {
  const p = dzP(), s = val('dz_s'), f = val('dz_f');
  const post = (p * s) / (p * s + (1 - p) * f);
  dzSet(Math.min(post, 0.999), s, f);
}
window.dzSet = dzSet; window.dzRetest = dzRetest;

// =====================================================================
// 10 · Bayes for three hypotheses: posterior = share of the shaded area
// =====================================================================
let byNames = ['F₁', 'F₂', 'F₃'];
function byDraw() {
  const svg = document.getElementById('bysvg');
  if (!svg) return;
  svg.innerHTML = '';
  let p1 = val('by_p1'), p2 = val('by_p2');
  if (p1 + p2 > 1) { p2 = 1 - p1; setS([['by_p2', p2, 3]]); }
  const pr = [p1, p2, Math.max(0, 1 - p1 - p2)];
  const L = [val('by_l1'), val('by_l2'), val('by_l3')];
  const J = pr.map((p, i) => p * L[i]);
  const tot = J.reduce((a, b) => a + b, 0);
  const post = J.map((j) => (tot > 0 ? j / tot : 0));
  const cols = [cv_('--blue'), cv_('--green'), cv_('--amber')];
  const x0 = 30, W = 300, yb = 150, yt = 36;
  const Lmax = Math.max(...L, 1e-9) * 1.12;
  el('line', { x1: x0, y1: yb, x2: x0 + W, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt, x2: x0, y2: yb, stroke: cv_('--border2') }, svg);
  txt(x0 - 4, yt + 4, fmt(Lmax, 3), cv_('--dim'), svg, 'end', 9);
  txt(x0 - 4, yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  txt(x0, 16, 'width = prior · height = likelihood · area = product', cv_('--muted'), svg, 'start', 9.5);
  let x = x0;
  pr.forEach((p, i) => {
    const w = W * p;
    if (w > 0.2) {
      el('rect', { x, y: yt, width: w, height: yb - yt, fill: 'none', stroke: rgba(cols[i], 0.6), 'stroke-dasharray': '3 3' }, svg);
      const h = (L[i] / Lmax) * (yb - yt);
      el('rect', { x, y: yb - h, width: w, height: h, fill: rgba(cols[i], 0.55), stroke: cols[i] }, svg);
      if (w > 26) {
        txt(x + w / 2, yb - h - 5, fmt(L[i], 3), cols[i], svg, 'middle', 9.5);
        txt(x + w / 2, yb + 13, byNames[i], cols[i], svg, 'middle', 10);
      }
    }
    x += w;
  });
  const bar = (y, vals, lab) => {
    txt(x0, y - 5, lab, cv_('--muted'), svg, 'start', 9.5);
    let xx = x0;
    vals.forEach((v, i) => {
      const w = W * v;
      if (w <= 0) return;
      el('rect', { x: xx, y, width: w, height: 17, fill: rgba(cols[i], 0.55), stroke: cols[i] }, svg);
      if (w > 34) txt(xx + w / 2, y + 12.5, frac(v, 48), cv_('--text'), svg, 'middle', 9.5);
      xx += w;
    });
  };
  bar(190, pr, 'prior  P(H)');
  bar(238, post, 'posterior  P(H | data) = shaded area ÷ total shaded area');
  const r = document.getElementById('byread');
  if (r) {
    r.innerHTML = `<span>P(data) = Σ P(data|H)P(H) = <b>${fmt(tot, 4)}</b></span>` +
      post.map((v, i) => `<span>P(${byNames[i]} | data) = <b>${both(v)}</b></span>`).join('') +
      `<span class="muted">∝: only the shaded areas matter; dividing by P(data) just rescales them to sum to 1</span>`;
  }
}
function bySet(names, p1, p2, l1, l2, l3) { byNames = names; setS([['by_p1', p1, 3], ['by_p2', p2, 3], ['by_l1', l1, 3], ['by_l2', l2, 3], ['by_l3', l3, 3]]); byDraw(); }
window.bySetFactories = () => bySet(['F₁', 'F₂', 'F₃'], 0.5, 0.4, 0.01, 0.02, 0.03);
window.bySetMonty = () => bySet(['car 1', 'car 2', 'car 3'], 1 / 3, 1 / 3, 0.5, 0, 1);
window.bySetFlat = () => bySet(['H₁', 'H₂', 'H₃'], 1 / 3, 1 / 3, 0.2, 0.2, 0.2);

// =====================================================================
// 11 · Monty Hall: play it, then simulate it
// =====================================================================
let mh = null;
const mhT = { stay: [0, 0], sw: [0, 0] };
let mhRun = { stay: [], sw: [], ws: 0, wsw: 0 };
function mhNew() { mh = { car: Math.floor(Math.random() * 3), pick: -1, open: -1, fin: -1, stage: 'pick' }; mhDraw(); }
function mhPick(i) {
  if (!mh || mh.stage !== 'pick') return;
  mh.pick = i;
  const goats = [0, 1, 2].filter((d) => d !== i && d !== mh.car);
  mh.open = goats[Math.floor(Math.random() * goats.length)];
  mh.stage = 'decide';
  mhDraw();
}
function mhDecide(sw) {
  if (!mh || mh.stage !== 'decide') return;
  mh.fin = sw ? [0, 1, 2].find((d) => d !== mh.pick && d !== mh.open) : mh.pick;
  mh.stage = 'done';
  const k = sw ? 'sw' : 'stay';
  mhT[k][1]++;
  if (mh.fin === mh.car) mhT[k][0]++;
  mhDraw();
}
function mhDraw() {
  const svg = document.getElementById('mhsvg');
  if (!svg || !mh) return;
  svg.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const x = 34 + i * 106, y = 34, w = 80, h = 104;
    const g = el('g', { style: mh.stage === 'pick' ? 'cursor:pointer' : '' }, svg);
    const opened = mh.stage === 'done' || i === mh.open;
    const car = i === mh.car;
    let fill = cv_('--panel2'), stroke = cv_('--border2');
    if (opened) { fill = car ? rgba(cv_('--green'), 0.35) : rgba(cv_('--dim'), 0.18); stroke = car ? cv_('--green') : cv_('--dim'); }
    if (i === mh.pick) stroke = cv_('--blue');
    if (mh.stage === 'done' && i === mh.fin) stroke = mh.fin === mh.car ? cv_('--green') : cv_('--red');
    el('rect', { x, y, width: w, height: h, rx: 3, fill, stroke, 'stroke-width': i === mh.pick || (mh.stage === 'done' && i === mh.fin) ? 2.4 : 1.2 }, g);
    txt(x + w / 2, y - 8, 'door ' + (i + 1), cv_('--muted'), g, 'middle', 10);
    if (opened) txt(x + w / 2, y + h / 2 + 5, car ? 'CAR' : 'goat', car ? cv_('--green') : cv_('--dim'), g, 'middle', car ? 15 : 12);
    else { el('circle', { cx: x + w - 14, cy: y + h / 2, r: 3, fill: cv_('--dim') }, g); txt(x + w / 2, y + h / 2 + 5, '?', cv_('--text'), g, 'middle', 18); }
    if (i === mh.pick) txt(x + w / 2, y + h + 15, 'your pick', cv_('--blue'), g, 'middle', 10);
    if (i === mh.open && mh.stage !== 'done') txt(x + w / 2, y + h + 15, 'host opens', cv_('--amber'), g, 'middle', 10);
    g.addEventListener('click', () => mhPick(i));
  }
  const msg = mh.stage === 'pick' ? 'Click a door to pick it.'
    : mh.stage === 'decide' ? `The host opened door ${mh.open + 1}: a goat. Stay with door ${mh.pick + 1}, or switch?`
    : (mh.fin === mh.car ? `You win the car (door ${mh.car + 1}).` : `Goat. The car was behind door ${mh.car + 1}.`) + ' Press "new game".';
  txt(180, 176, msg, cv_('--text'), svg, 'middle', 10.5);
  const r = document.getElementById('mhread');
  if (r) {
    const pc = (a) => (a[1] ? ` (${fmt((100 * a[0]) / a[1], 0)}%)` : '');
    r.innerHTML = `<span>you, staying: <b>${mhT.stay[0]}/${mhT.stay[1]}</b>${pc(mhT.stay)}</span><span>you, switching: <b>${mhT.sw[0]}/${mhT.sw[1]}</b>${pc(mhT.sw)}</span><span class="muted">theory: stay wins 1/3, switch wins 2/3</span>`;
  }
  const b1 = document.getElementById('mh_stay'), b2 = document.getElementById('mh_sw');
  if (b1) b1.disabled = mh.stage !== 'decide';
  if (b2) b2.disabled = mh.stage !== 'decide';
}
function mhSim(n) {
  for (let i = 0; i < n && mhRun.stay.length < 5000; i++) {
    const car = Math.floor(Math.random() * 3), pick = Math.floor(Math.random() * 3);
    if (pick === car) mhRun.ws++; else mhRun.wsw++;   // switching wins exactly when the first pick was wrong
    const k = mhRun.stay.length + 1;
    mhRun.stay.push(mhRun.ws / k); mhRun.sw.push(mhRun.wsw / k);
  }
  mhSimDraw();
}
function mhSimReset() { mhRun = { stay: [], sw: [], ws: 0, wsw: 0 }; mhSimDraw(); }
function mhSimDraw() {
  const svg = document.getElementById('mhsim');
  if (!svg) return;
  svg.innerHTML = '';
  const f = frame(svg, 360, 190, { l: 34, r: 14, t: 22, b: 30 });
  const n = mhRun.stay.length, N = Math.max(n, 10);
  const X = (k) => f.x0 + ((k - 1) / Math.max(1, N - 1)) * (f.x1 - f.x0);
  const Y = (v) => f.yb - v * (f.yb - f.yt);
  for (const [v, lab] of [[1 / 3, '1/3'], [2 / 3, '2/3'], [1, '1']]) {
    el('line', { x1: f.x0, y1: Y(v), x2: f.x1, y2: Y(v), stroke: cv_('--border'), 'stroke-dasharray': '3 3' }, svg);
    txt(f.x0 - 4, Y(v) + 3, lab, cv_('--dim'), svg, 'end', 9);
  }
  txt(f.x0 - 4, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  const path = (arr, col) => {
    if (!arr.length) return;
    const step = Math.max(1, Math.floor(arr.length / 400));
    let d = '';
    for (let k = 0; k < arr.length; k += step) d += (d ? ' L ' : 'M ') + X(k + 1) + ' ' + Y(arr[k]);
    d += ' L ' + X(arr.length) + ' ' + Y(arr[arr.length - 1]);
    el('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.8 }, svg);
  };
  path(mhRun.sw, cv_('--green'));
  path(mhRun.stay, cv_('--blue'));
  txt(f.x1, 14, 'switch = green · stay = blue', cv_('--muted'), svg, 'end', 10);
  txt(f.x0, 14, 'running win rate', cv_('--muted'), svg, 'start', 10);
  txt((f.x0 + f.x1) / 2, f.yb + 18, n ? `games played: ${n}` : 'press a simulate button', cv_('--dim'), svg, 'middle', 9.5);
  const r = document.getElementById('mhsimread');
  if (r && n) r.innerHTML = `<span>stay: <b>${fmt(mhRun.stay[n - 1], 3)}</b></span><span>switch: <b>${fmt(mhRun.sw[n - 1], 3)}</b></span><span class="muted">switching wins exactly when your first pick was wrong — which happens 2 times in 3</span>`;
  else if (r) r.innerHTML = '<span class="muted">no games yet</span>';
}
window.mhNew = mhNew; window.mhDecide = mhDecide; window.mhSim = mhSim; window.mhSimReset = mhSimReset;

// =====================================================================
// 13 · CDF explorer: P(a < X ≤ b) = F(b) − F(a)
// =====================================================================
const CD_KINDS = {
  lin: { lo: -2, hi: 2, type: 'c', F: (t) => (t < -1 ? 0 : t > 1 ? 1 : 0.5 + 0.5 * t), f: (t) => (t >= -1 && t <= 1 ? 0.5 : 0), fmax: 0.7, name: 'F(t) = 0.5 + 0.5t on [−1,1]' },
  coins: { lo: -1, hi: 3, type: 'd', pts: [[0, 0.25], [1, 0.5], [2, 0.25]], name: 'heads in 2 fair coins' },
  coins3: { lo: -1, hi: 4, type: 'd', pts: [[0, 1 / 8], [1, 3 / 8], [2, 3 / 8], [3, 1 / 8]], name: 'tails in 3 fair coins' },
  cst: { lo: -1, hi: 3, type: 'd', pts: [[1, 1]], name: 'constant: X = c = 1' },
  exp: { lo: -0.5, hi: 4, type: 'c', F: (t) => (t < 0 ? 0 : 1 - Math.exp(-t)), f: (t) => (t < 0 ? 0 : Math.exp(-t)), fmax: 1.1, name: '−ln U: 1 − e^(−t)' },
};
function cdKind() { const e = document.getElementById('cd_kind'); return (e && e.value) || 'lin'; }
function cdF(K, t) { if (K.type === 'c') return K.F(t); let s = 0; for (const [x, p] of K.pts) if (x <= t + 1e-9) s += p; return s; }
function cdJump(K, t) { if (K.type === 'c') return 0; for (const [x, p] of K.pts) if (Math.abs(x - t) < 1e-9) return p; return 0; }
// dragging a slider never lands exactly on an integer, so snap to a jump when close
function cdSnap(K, t) { if (K.type === 'd') for (const [x] of K.pts) if (Math.abs(x - t) < 0.06) return x; return t; }
function cdDraw() {
  const svg = document.getElementById('cdsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const K = CD_KINDS[cdKind()];
  let a = cdSnap(K, val('cd_a')), b = cdSnap(K, val('cd_b'));
  if (a > b) [a, b] = [b, a];
  const la = document.getElementById('cd_a_v'), lb = document.getElementById('cd_b_v');
  if (la) la.textContent = fmt(a, 2);
  if (lb) lb.textContent = fmt(b, 2);
  const x0 = 44, x1 = 344, X = (t) => x0 + ((t - K.lo) / (K.hi - K.lo)) * (x1 - x0);
  // --- top panel: the CDF
  const yb = 158, yt = 30, Y = (v) => yb - v * (yb - yt);
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt - 6, x2: x0, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: Y(1), x2: x1, y2: Y(1), stroke: cv_('--border'), 'stroke-dasharray': '3 3' }, svg);
  txt(x0 - 5, Y(1) + 3, '1', cv_('--dim'), svg, 'end', 9); txt(x0 - 5, Y(0.5) + 3, '0.5', cv_('--dim'), svg, 'end', 9); txt(x0 - 5, yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  txt(x0 + 4, 16, 'CDF  F(t) = P(X ≤ t)', cv_('--text'), svg, 'start', 10.5);
  txt(x1, 16, K.name, cv_('--muted'), svg, 'end', 9.5);
  const red = cv_('--red');
  if (K.type === 'c') {
    let d = '';
    for (let i = 0; i <= 300; i++) { const t = K.lo + ((K.hi - K.lo) * i) / 300; d += (i ? ' L ' : 'M ') + X(t) + ' ' + Y(K.F(t)); }
    el('path', { d, fill: 'none', stroke: red, 'stroke-width': 2.2 }, svg);
  } else {
    const xs = K.pts.map((p) => p[0]);
    let prevX = K.lo, level = 0;
    for (const x of xs) {
      el('line', { x1: X(prevX), y1: Y(level), x2: X(x), y2: Y(level), stroke: red, 'stroke-width': 2.2 }, svg);
      const nl = cdF(K, x);
      el('line', { x1: X(x), y1: Y(level), x2: X(x), y2: Y(nl), stroke: red, 'stroke-dasharray': '2 3', 'stroke-width': 1 }, svg);
      el('circle', { cx: X(x), cy: Y(level), r: 3.6, fill: cv_('--panel'), stroke: red, 'stroke-width': 1.5 }, svg);
      prevX = x; level = nl;
    }
    el('line', { x1: X(prevX), y1: Y(level), x2: X(K.hi), y2: Y(level), stroke: red, 'stroke-width': 2.2 }, svg);
    for (const x of xs) el('circle', { cx: X(x), cy: Y(cdF(K, x)), r: 3.6, fill: red }, svg);
  }
  const Fa = cdF(K, a), Fb = cdF(K, b);
  for (const [t, Ft, col] of [[a, Fa, cv_('--blue')], [b, Fb, cv_('--green')]]) {
    el('line', { x1: X(t), y1: yb, x2: X(t), y2: Y(Ft), stroke: col, 'stroke-dasharray': '4 3' }, svg);
    el('line', { x1: x0, y1: Y(Ft), x2: X(t), y2: Y(Ft), stroke: col, 'stroke-dasharray': '4 3' }, svg);
    el('circle', { cx: X(t), cy: Y(Ft), r: 3, fill: col }, svg);
  }
  txt(X(a), yb + 13, 'a', cv_('--blue'), svg, 'middle', 10.5);
  txt(X(b), yb + 13, 'b', cv_('--green'), svg, 'middle', 10.5);
  if (Fb - Fa > 0.001) {
    el('line', { x1: x0 + 7, y1: Y(Fa), x2: x0 + 7, y2: Y(Fb), stroke: cv_('--amber'), 'stroke-width': 5 }, svg);
    if (Fb - Fa > 0.08) txt(x0 + 14, (Y(Fa) + Y(Fb)) / 2 + 3, 'F(b) − F(a)', cv_('--amber'), svg, 'start', 9.5);
  }
  // --- bottom panel: pmf or pdf, with (a, b] highlighted
  const yb2 = 290, yt2 = 202, amb = cv_('--amber');
  el('line', { x1: x0, y1: yb2, x2: x1, y2: yb2, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt2, x2: x0, y2: yb2, stroke: cv_('--border2') }, svg);
  txt(x0 + 4, yt2 - 8, K.type === 'c' ? 'pdf: P(a < X ≤ b) = area from a to b' : 'pmf: P(a < X ≤ b) = bars in (a, b]', cv_('--text'), svg, 'start', 10);
  if (K.type === 'c') {
    const Y2 = (v) => yb2 - (v / K.fmax) * (yb2 - yt2);
    const ta = Math.max(a, K.lo), tb = Math.min(b, K.hi);
    if (tb > ta) {
      let d = `M ${X(ta)} ${yb2}`;
      for (let i = 0; i <= 120; i++) { const t = ta + ((tb - ta) * i) / 120; d += ` L ${X(t)} ${Y2(K.f(t))}`; }
      d += ` L ${X(tb)} ${yb2} Z`;
      el('path', { d, fill: rgba(amb, 0.45), stroke: 'none' }, svg);
    }
    let d = '';
    for (let i = 0; i <= 300; i++) { const t = K.lo + ((K.hi - K.lo) * i) / 300; d += (i ? ' L ' : 'M ') + X(t) + ' ' + Y2(K.f(t)); }
    el('path', { d, fill: 'none', stroke: cv_('--blue'), 'stroke-width': 1.8 }, svg);
  } else {
    const pm = Math.max(...K.pts.map((p) => p[1]));
    const Y2 = (v) => yb2 - (v / (pm * 1.15)) * (yb2 - yt2);
    for (const [x, p] of K.pts) {
      const inside = x > a + 1e-9 && x <= b + 1e-9;
      const col = inside ? amb : cv_('--blue');
      el('line', { x1: X(x), y1: yb2, x2: X(x), y2: Y2(p), stroke: col, 'stroke-width': inside ? 3 : 2 }, svg);
      el('circle', { cx: X(x), cy: Y2(p), r: 3.5, fill: col }, svg);
      txt(X(x), Y2(p) - 7, frac(p), col, svg, 'middle', 9);
    }
  }
  for (let t = Math.ceil(K.lo); t <= K.hi; t++) txt(X(t), yb2 + 13, String(t), cv_('--dim'), svg, 'middle', 9);
  el('line', { x1: X(a), y1: yt2, x2: X(a), y2: yb2, stroke: cv_('--blue'), 'stroke-dasharray': '3 3', opacity: 0.8 }, svg);
  el('line', { x1: X(b), y1: yt2, x2: X(b), y2: yb2, stroke: cv_('--green'), 'stroke-dasharray': '3 3', opacity: 0.8 }, svg);
  const jb = cdJump(K, b);
  const r = document.getElementById('cdread');
  if (r) {
    r.innerHTML = `<span>F(a) = <b>${both(Fa, 3)}</b></span><span>F(b) = <b>${both(Fb, 3)}</b></span>` +
      `<span>P(a &lt; X ≤ b) = F(b) − F(a) = <b>${both(Fb - Fa, 3)}</b></span>` +
      `<span>P(X &gt; a) = 1 − F(a) = <b>${both(1 - Fa, 3)}</b></span>` +
      `<span>P(X = b) = jump at b = <b>${frac(jb)}</b></span>` +
      `<span>P(a &lt; X &lt; b) = <b>${both(Fb - Fa - jb, 3)}</b></span>`;
  }
}
function cdSet(kind, a, b) {
  const e = document.getElementById('cd_kind');
  if (e) e.value = kind;
  const K = CD_KINDS[kind];
  setRange('cd_a', K.lo, K.hi); setRange('cd_b', K.lo, K.hi);
  setS([['cd_a', a, 2], ['cd_b', b, 2]]);
  cdDraw();
}
window.cdSet = cdSet;

// =====================================================================
// 14 · X = −ln U: uniform in, exponential out
// =====================================================================
let lnU = [];
function lnAdd(n) { for (let i = 0; i < n; i++) lnU.push(1 - Math.random()); if (lnU.length > 50000) lnU = lnU.slice(-50000); lnDraw(); }
function lnReset() { lnU = []; lnDraw(); }
function lnDraw() {
  const svg = document.getElementById('lnsvg');
  if (!svg) return;
  svg.innerHTML = '';
  // left: the map u -> -ln u, ten equal-probability slices of U
  const ax = 34, bx = 150, yb = 226, yt = 36, XM = 4;
  const Yu = (u) => yb - u * (yb - yt), Yx = (x) => yb - (Math.min(x, XM) / XM) * (yb - yt);
  txt(ax, 22, 'U', cv_('--blue'), svg, 'middle', 11); txt(bx, 22, 'X = −ln U', cv_('--green'), svg, 'middle', 11);
  for (let k = 0; k < 10; k++) {
    const u0 = k / 10, u1 = (k + 1) / 10;
    const x0 = -Math.log(u1), x1 = u0 === 0 ? XM : -Math.log(u0);
    const col = k % 2 ? cv_('--blue') : cv_('--green');
    el('path', { d: `M ${ax} ${Yu(u0)} L ${ax} ${Yu(u1)} L ${bx} ${Yx(x0)} L ${bx} ${Yx(x1)} Z`, fill: rgba(col, 0.2), stroke: rgba(col, 0.5), 'stroke-width': 0.8 }, svg);
  }
  el('line', { x1: ax, y1: yb, x2: ax, y2: yt, stroke: cv_('--border2'), 'stroke-width': 1.5 }, svg);
  el('line', { x1: bx, y1: yb, x2: bx, y2: yt, stroke: cv_('--border2'), 'stroke-width': 1.5 }, svg);
  for (const u of [0, 0.5, 1]) txt(ax - 5, Yu(u) + 3, String(u), cv_('--dim'), svg, 'end', 9);
  for (const x of [0, 1, 2, 3, 4]) txt(bx + 5, Yx(x) + 3, String(x) + (x === 4 ? '+' : ''), cv_('--dim'), svg, 'start', 9);
  // right: histogram of the simulated X with the density e^{-x}
  const hx0 = 190, hx1 = 346, hb = 226, ht = 36, BW = 0.25, NB = 16;
  const HX = (x) => hx0 + (x / XM) * (hx1 - hx0), HY = (v) => hb - (v / 1.15) * (hb - ht);
  el('line', { x1: hx0, y1: hb, x2: hx1, y2: hb, stroke: cv_('--border2') }, svg);
  el('line', { x1: hx0, y1: ht, x2: hx0, y2: hb, stroke: cv_('--border2') }, svg);
  txt(hx0 - 4, HY(1) + 3, '1', cv_('--dim'), svg, 'end', 9);
  const n = lnU.length, cnt = new Array(NB).fill(0);
  let le1 = 0, sum = 0;
  for (const u of lnU) { const x = -Math.log(u); sum += x; if (x <= 1) le1++; const b = Math.floor(x / BW); if (b < NB) cnt[b]++; }
  if (n) cnt.forEach((c, i) => { const h = c / (n * BW); el('rect', { x: HX(i * BW) + 0.5, y: HY(h), width: HX(BW) - hx0 - 1, height: hb - HY(h), fill: rgba(cv_('--green'), 0.45), stroke: cv_('--green'), 'stroke-width': 0.6 }, svg); });
  let d = '';
  for (let i = 0; i <= 120; i++) { const x = (XM * i) / 120; d += (i ? ' L ' : 'M ') + HX(x) + ' ' + HY(Math.exp(-x)); }
  el('path', { d, fill: 'none', stroke: cv_('--red'), 'stroke-width': 2 }, svg);
  for (const x of [0, 1, 2, 3, 4]) txt(HX(x), hb + 13, String(x), cv_('--dim'), svg, 'middle', 9);
  txt(hx0, 22, `histogram of X, n = ${n}`, cv_('--muted'), svg, 'start', 9.5);
  txt(HX(0.7), HY(Math.exp(-0.7)) - 6, 'e^(−x)', cv_('--red'), svg, 'start', 9.5);
  const r = document.getElementById('lnread');
  if (r) r.innerHTML = n
    ? `<span>share with X ≤ 1: <b>${fmt(le1 / n, 3)}</b> (theory 1 − e^(−1) = 0.632)</span><span>average of X: <b>${fmt(sum / n, 3)}</b> (theory 1)</span><span class="muted">each coloured band holds probability 0.1 — near 0 the bands are thin, so the density is tall</span>`
    : '<span class="muted">press a draw button</span>';
}
window.lnAdd = lnAdd; window.lnReset = lnReset;

// =====================================================================
// 15 · the geometric pmf f(k) = p(1 − p)^(k−1) really sums to 1
// =====================================================================
function geDraw() {
  const svg = document.getElementById('gesvg');
  if (!svg) return;
  svg.innerHTML = '';
  const p = val('ge_p'), K = Math.round(val('ge_K')), KM = 25;
  const f = frame(svg, 360, 230, { l: 36, r: 34, t: 26, b: 34 });
  const W = (f.x1 - f.x0) / KM;
  const fm = p * 1.1;
  const Y = (v) => f.yb - (v / fm) * (f.yb - f.yt), YS = (v) => f.yb - v * (f.yb - f.yt);
  el('line', { x1: f.x1, y1: f.yt, x2: f.x1, y2: f.yb, stroke: cv_('--border2') }, svg);
  txt(f.x0 - 4, Y(p) + 3, fmt(p, 2), cv_('--dim'), svg, 'end', 9);
  txt(f.x0 - 4, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  txt(f.x1 + 4, YS(1) + 3, '1', cv_('--amber'), svg, 'start', 9);
  el('line', { x1: f.x0, y1: YS(1), x2: f.x1, y2: YS(1), stroke: cv_('--amber'), 'stroke-dasharray': '3 3', opacity: 0.6 }, svg);
  let S = 0, d = '';
  for (let k = 1; k <= KM; k++) {
    const v = p * Math.pow(1 - p, k - 1);
    S += v;
    const x = f.x0 + (k - 1) * W, on = k <= K;
    el('rect', { x: x + W * 0.15, y: Y(v), width: W * 0.7, height: f.yb - Y(v), fill: on ? rgba(cv_('--green'), 0.5) : rgba(cv_('--blue'), 0.25), stroke: on ? cv_('--green') : cv_('--blue'), 'stroke-width': 0.8 }, svg);
    if (k <= K) d += (d ? ' L ' : 'M ') + (x + W / 2) + ' ' + YS(S);
    if (k === 1 || k % 5 === 0) txt(x + W / 2, f.yb + 13, String(k), cv_('--dim'), svg, 'middle', 9);
  }
  if (d) el('path', { d, fill: 'none', stroke: cv_('--amber'), 'stroke-width': 1.8 }, svg);
  const SK = 1 - Math.pow(1 - p, K);
  txt(f.x0, 14, 'bars: f(k) · amber: running sum (right axis)', cv_('--muted'), svg, 'start', 9.5);
  const r = document.getElementById('geread');
  if (r) r.innerHTML = `<span>f(1) = p = <b>${fmt(p, 3)}</b></span><span>sum of first ${K} = 1 − (1−p)^${K} = <b>${fmt(SK, 4)}</b></span><span>still missing = (1−p)^${K} = <b>${fmt(1 - SK, 4)}</b></span><span class="muted">all terms: b/(1−a) with b = p, a = 1−p → p/p = 1</span>`;
}
function geSet(p, K) { setS([['ge_p', p, 2], ['ge_K', K, 0]]); geDraw(); }
window.geSet = geSet;

// =====================================================================
// special functions for modules 16–25
// =====================================================================
function normPdf(x, mu = 0, sd = 1) { const z = (x - mu) / sd; return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI)); }
// Zelen & Severo rational approximation, |error| < 7.5e-8
function normCdf(z) {
  if (z === Infinity) return 1;
  if (z === -Infinity) return 0;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
// Lanczos log-gamma
const LG_C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = LG_C[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG_C[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
// regularised lower incomplete gamma P(a, x): series below a+1, continued fraction above
function gammaP(a, x) {
  if (x <= 0) return 0;
  const pre = Math.exp(-x + a * Math.log(x) - lgamma(a));
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * pre;
  }
  const tiny = 1e-300;
  let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - pre * h;
}
// regularised incomplete beta I_x(a, b) (continued fraction, Numerical Recipes)
function betacf(a, b, x) {
  const tiny = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}
function betaI(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function chi2Pdf(x, k) { if (x <= 0) return k < 2 ? Infinity : k === 2 ? 0.5 : 0; return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)); }
function chi2Cdf(x, k) { return x <= 0 ? 0 : gammaP(k / 2, x / 2); }
function tPdf(x, v) { return Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2) - 0.5 * Math.log(v * Math.PI) - ((v + 1) / 2) * Math.log(1 + (x * x) / v)); }
function tCdf(x, v) { const tail = 0.5 * betaI(v / 2, 0.5, v / (v + x * x)); return x > 0 ? 1 - tail : tail; }
// quantile of any increasing cdf by bisection
function invCdf(F, p, lo, hi) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (F(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
function lchoose(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
function binomPmf(k, n, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function poisPmf(k, l) { return k < 0 ? 0 : Math.exp(-l + k * Math.log(l) - lgamma(k + 1)); }
// probabilities that can be tiny (8.4e-7) get scientific notation instead of 0.0000
function fmtP(x, d = 4) { if (x > 0 && x < 1e-4) return x.toExponential(3).replace('e', '·10^'); return fmt(x, d); }
// a smooth curve through a function, clipped to the plotting frame
function curvePath(fn, a, b, X, Y, n = 240, yClip) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    let y = fn(x);
    if (!isFinite(y)) y = 1e9;
    let py = Y(y);
    if (yClip !== undefined) py = Math.max(yClip, py);
    d += (i ? ' L ' : 'M ') + X(x).toFixed(2) + ' ' + py.toFixed(2);
  }
  return d;
}
function areaPath(fn, a, b, X, Y, yb, n = 160, yClip) {
  if (!(b > a)) return '';
  let d = `M ${X(a).toFixed(2)} ${yb}`;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    let y = fn(x);
    if (!isFinite(y)) y = 1e9;
    let py = Y(y);
    if (yClip !== undefined) py = Math.max(yClip, py);
    d += ` L ${X(x).toFixed(2)} ${py.toFixed(2)}`;
  }
  return d + ` L ${X(b).toFixed(2)} ${yb} Z`;
}
function niceTicks(lo, hi, maxN = 9) {
  const span = hi - lo, raw = span / maxN, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= maxN) || 10 * mag;
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(+t.toFixed(10));
  return out;
}
function tickLabel(t) { return Math.abs(t) >= 1000 ? String(Math.round(t)) : String(+t.toFixed(3)); }

// =====================================================================
// 16 · the biased-coin game: E(X) as a balance point, and as a long-run average
// =====================================================================
let evRun = [], evTot = 0;
function evPmf(p) { return [[-2, (1 - p) * (1 - p)], [1, p * p], [10, 2 * p * (1 - p)]]; }
function evDraw() {
  const svg = document.getElementById('evsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const p = val('ev_p'), P = evPmf(p);
  const E = P.reduce((s, [x, q]) => s + x * q, 0);
  const x0 = 30, x1 = 344, lo = -3, hi = 11, X = (x) => x0 + ((x - lo) / (hi - lo)) * (x1 - x0);
  const yb = 128, yt = 34, Y = (v) => yb - v * (yb - yt);
  txt(x0, 14, 'pmf of the winnings X, balanced on a fulcrum at E(X)', cv_('--muted'), svg, 'start', 10);
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--text'), 'stroke-width': 2 }, svg);
  for (const t of [-2, 0, 1, 2, 4, 6, 8, 10]) { el('line', { x1: X(t), y1: yb, x2: X(t), y2: yb + 4, stroke: cv_('--border2') }, svg); txt(X(t), yb + 15, (t > 0 ? '+' : '') + t, cv_('--dim'), svg, 'middle', 9); }
  for (const [x, q] of P) {
    const col = x < 0 ? cv_('--red') : cv_('--green');
    el('rect', { x: X(x) - 8, y: Y(q), width: 16, height: yb - Y(q), fill: rgba(col, 0.5), stroke: col }, svg);
    txt(X(x), Y(q) - 5, fmt(q, 3), col, svg, 'middle', 9.5);
  }
  el('path', { d: `M ${X(E)} ${yb + 1} l -9 17 l 18 0 Z`, fill: cv_('--amber') }, svg);
  txt(X(E), yb + 30, `E(X) = ${fmt(E, 3)}`, cv_('--amber'), svg, 'middle', 10.5);
  // running average of simulated games
  const by = 290, bt = 188, ylo = -2.5, yhi = 10.5, YY = (v) => by - ((v - ylo) / (yhi - ylo)) * (by - bt);
  el('line', { x1: x0, y1: by, x2: x1, y2: by, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: bt, x2: x0, y2: by, stroke: cv_('--border2') }, svg);
  for (const v of [-2, 0, 5, 10]) { txt(x0 - 4, YY(v) + 3, String(v), cv_('--dim'), svg, 'end', 9); el('line', { x1: x0, y1: YY(v), x2: x1, y2: YY(v), stroke: cv_('--border'), opacity: 0.5 }, svg); }
  el('line', { x1: x0, y1: YY(E), x2: x1, y2: YY(E), stroke: cv_('--amber'), 'stroke-dasharray': '5 3' }, svg);
  const n = evRun.length;
  txt(x0, bt - 8, n ? `average winnings after n games (n = ${n})` : 'average winnings per game — press "play"', cv_('--muted'), svg, 'start', 10);
  if (n) {
    const step = Math.max(1, Math.floor(n / 400));
    let d = '';
    for (let k = 0; k < n; k += step) d += (d ? ' L ' : 'M ') + (x0 + ((k + 1) / n) * (x1 - x0)).toFixed(1) + ' ' + YY(Math.max(ylo, Math.min(yhi, evRun[k]))).toFixed(1);
    d += ' L ' + x1 + ' ' + YY(Math.max(ylo, Math.min(yhi, evRun[n - 1]))).toFixed(1);
    el('path', { d, fill: 'none', stroke: cv_('--blue'), 'stroke-width': 1.6 }, svg);
  }
  const r = document.getElementById('evread');
  if (r) r.innerHTML = `<span>P(X=−2) <b>${fmt(P[0][1], 4)}</b></span><span>P(X=1) <b>${fmt(P[1][1], 4)}</b></span><span>P(X=10) <b>${fmt(P[2][1], 4)}</b></span>` +
    `<span>E(X) = Σ x·f(x) = <b>${fmt(E, 4)}</b></span><span>1000 games ≈ <b>$${fmt(1000 * E, 0)}</b></span>` +
    (n ? `<span class="muted">simulated average after ${n} games: ${fmt(evRun[n - 1], 3)}</span>` : '');
}
function evSim(n) {
  const p = val('ev_p');
  for (let i = 0; i < n && evRun.length < 5000; i++) {
    const h = (Math.random() < p) + (Math.random() < p);
    evTot += h === 2 ? 1 : h === 1 ? 10 : -2;
    evRun.push(evTot / (evRun.length + 1));
  }
  evDraw();
}
function evReset() { evRun = []; evTot = 0; evDraw(); }
function evSet(p) { setS([['ev_p', p, 3]]); evReset(); }
window.evSim = evSim; window.evReset = evReset; window.evSet = evSet;

// =====================================================================
// 17 · Y = a + bX: a shift moves the pmf, a scale stretches it
// =====================================================================
function vrDraw() {
  const svg = document.getElementById('vrsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const a = val('vr_a'), b = val('vr_b');
  const base = [[0, 0.25], [1, 0.5], [2, 0.25]];
  const x0 = 20, x1 = 340, lo = -10, hi = 10, X = (x) => x0 + ((x - lo) / (hi - lo)) * (x1 - x0);
  const yb = 150, yt = 40, Y = (v) => yb - (v / 1.05) * (yb - yt);
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  for (let t = -10; t <= 10; t += 2) { el('line', { x1: X(t), y1: yb, x2: X(t), y2: yb + 4, stroke: cv_('--border2') }, svg); txt(X(t), yb + 15, String(t), cv_('--dim'), svg, 'middle', 9); }
  for (const [x, q] of base) el('rect', { x: X(x) - 5, y: Y(q), width: 10, height: yb - Y(q), fill: 'none', stroke: cv_('--dim'), 'stroke-dasharray': '3 2' }, svg);
  const agg = new Map();
  for (const [x, q] of base) { const y = +(a + b * x).toFixed(9); agg.set(y, (agg.get(y) || 0) + q); }
  for (const [y, q] of agg) {
    el('rect', { x: X(y) - 5, y: Y(q), width: 10, height: yb - Y(q), fill: rgba(cv_('--green'), 0.5), stroke: cv_('--green') }, svg);
    txt(X(y), Y(q) - 5, frac(q), cv_('--green'), svg, 'middle', 9);
  }
  const sdX = Math.sqrt(0.5), mY = a + b, sdY = Math.abs(b) * sdX;
  const bracket = (m, s, y, col, lab) => {
    el('path', { d: `M ${X(m)} ${y - 6} l -5 -9 l 10 0 Z`, fill: col }, svg);
    if (s > 0) {
      el('line', { x1: X(m - s), y1: y + 6, x2: X(m + s), y2: y + 6, stroke: col, 'stroke-width': 2 }, svg);
      el('line', { x1: X(m - s), y1: y + 2, x2: X(m - s), y2: y + 10, stroke: col, 'stroke-width': 2 }, svg);
      el('line', { x1: X(m + s), y1: y + 2, x2: X(m + s), y2: y + 10, stroke: col, 'stroke-width': 2 }, svg);
    }
    txt(x1, y + 10, lab, col, svg, 'end', 9.5);
  };
  bracket(1, sdX, 190, cv_('--dim'), 'X: mean 1, σ = 0.707');
  bracket(mY, sdY, 222, cv_('--green'), `Y: mean ${fmt(mY, 2)}, σ = ${fmt(sdY, 3)}`);
  txt(x0, 16, `grey: X (2 flips) · green: Y = ${fmt(a, 2)} + ${fmt(b, 2)}·X`, cv_('--muted'), svg, 'start', 10);
  const r = document.getElementById('vrread');
  if (r) r.innerHTML = `<span>E(Y) = a + b·E(X) = <b>${fmt(mY, 3)}</b></span><span>V(Y) = b²·V(X) = <b>${fmt((b * b) / 2, 3)}</b></span><span>σ_Y = |b|·σ_X = <b>${fmt(sdY, 3)}</b></span><span class="muted">a only moves the picture; b stretches it (and flips it when negative)</span>`;
}
function vrSet(a, b) { setS([['vr_a', a, 2], ['vr_b', b, 2]]); vrDraw(); }
window.vrSet = vrSet;

// =====================================================================
// 18 · explorer for the named discrete distributions (modules 18–20)
// =====================================================================
const DD = {
  bern: { labs: ['p', null], r: [[0, 1, 'any']], def: [0.6], pmf: (k, [p]) => (k === 0 ? 1 - p : k === 1 ? p : 0), sup: () => [0, 1], E: ([p]) => p, V: ([p]) => p * (1 - p), name: ([p]) => `Bernoulli(${fmt(p, 3)})` },
  binom: { labs: ['n', 'p'], r: [[1, 50, 1], [0, 1, 'any']], def: [10, 1 / 6], pmf: (k, [n, p]) => binomPmf(k, n, p), sup: ([n]) => [0, n], E: ([n, p]) => n * p, V: ([n, p]) => n * p * (1 - p), name: ([n, p]) => `Binomial(${n}, ${fmt(p, 3)})` },
  pois: { labs: ['λ', null], r: [[0.1, 20, 'any']], def: [2], pmf: (k, [l]) => poisPmf(k, l), sup: ([l]) => [0, Math.ceil(l + 5 * Math.sqrt(l) + 4)], E: ([l]) => l, V: ([l]) => l, name: ([l]) => `Poisson(${fmt(l, 3)})` },
  geo1: { labs: ['p', null], r: [[0.03, 1, 'any']], def: [0.2], pmf: (k, [p]) => (k >= 1 ? p * Math.pow(1 - p, k - 1) : 0), sup: ([p]) => [1, p >= 1 ? 3 : Math.max(6, Math.ceil(Math.log(0.002) / Math.log(1 - p)))], E: ([p]) => 1 / p, V: ([p]) => (1 - p) / (p * p), name: ([p]) => `Geometric I(${fmt(p, 3)})` },
  geo2: { labs: ['p', null], r: [[0.03, 1, 'any']], def: [0.2], pmf: (k, [p]) => (k >= 0 ? p * Math.pow(1 - p, k) : 0), sup: ([p]) => [0, p >= 1 ? 3 : Math.max(6, Math.ceil(Math.log(0.002) / Math.log(1 - p)))], E: ([p]) => (1 - p) / p, V: ([p]) => (1 - p) / (p * p), name: ([p]) => `Geometric II(${fmt(p, 3)})` },
  dunif: { labs: ['a', 'b'], r: [[-5, 10, 1], [-5, 15, 1]], def: [1, 6], pmf: (k, [a, b]) => (k >= a && k <= b ? 1 / (b - a + 1) : 0), sup: ([a, b]) => [a, b], E: ([a, b]) => (a + b) / 2, V: ([a, b]) => ((b - a + 1) ** 2 - 1) / 12, name: ([a, b]) => `DUniform(${a}, ${b})` },
};
function ddFam() { const e = document.getElementById('dd_fam'); return (e && e.value) || 'binom'; }
function ddParams() {
  const F = DD[ddFam()];
  const ps = [val('dd_1')];
  if (F.labs[1]) ps.push(val('dd_2'));
  F.r.forEach((rg, i) => { if (rg[2] === 1) ps[i] = Math.round(ps[i]); });
  if (ddFam() === 'dunif' && ps[1] < ps[0]) { ps[1] = ps[0]; setS([['dd_2', ps[1], 0]]); }
  return ps;
}
function ddConfigure(fam) {
  const F = DD[fam];
  F.labs.forEach((lab, i) => {
    const id = 'dd_' + (i + 1), s = document.getElementById(id);
    if (!s) return;
    const wrap = s.parentElement;
    if (!lab) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    const l = document.getElementById(id + '_lab');
    if (l) l.textContent = lab;
    const [mn, mx, st] = F.r[i];
    s.min = mn; s.max = mx; s.step = st;
  });
}
function ddLabels() {
  const F = DD[ddFam()];
  F.labs.forEach((lab, i) => {
    if (!lab) return;
    const id = 'dd_' + (i + 1), l = document.getElementById(id + '_v');
    if (l) l.textContent = F.r[i][2] === 1 ? String(Math.round(val(id))) : fmt(val(id), 3);
  });
  const lk = document.getElementById('dd_k_v');
  if (lk) lk.textContent = String(Math.round(val('dd_k')));
}
function ddDraw() {
  const svg = document.getElementById('ddsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const fam = ddFam(), F = DD[fam], ps = ddParams();
  let [lo, hi] = F.sup(ps);
  hi = Math.min(hi, lo + 59);
  const ks = document.getElementById('dd_k');
  if (ks) { ks.min = lo; ks.max = hi; ks.step = 1; }
  let k = Math.round(val('dd_k'));
  if (k < lo || k > hi) { k = Math.min(hi, Math.max(lo, k)); setS([['dd_k', k, 0]]); }
  ddLabels();
  const P = [];
  for (let x = lo; x <= hi; x++) P.push(F.pmf(x, ps));
  const pm = Math.max(...P, 1e-9);
  const f = frame(svg, 360, 250, { l: 38, r: 12, t: 30, b: 42 });
  const W = (f.x1 - f.x0) / (hi - lo + 1);
  const Y = (v) => f.yb - (v / (pm * 1.12)) * (f.yb - f.yt);
  txt(f.x0 - 5, Y(pm) + 3, fmt(pm, 3), cv_('--dim'), svg, 'end', 9);
  txt(f.x0 - 5, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  const every = Math.max(1, Math.ceil((hi - lo + 1) / 13));
  for (let x = lo; x <= hi; x++) {
    const i = x - lo, bx = f.x0 + i * W, v = P[i], on = x <= k;
    el('rect', { x: bx + W * 0.16, y: Y(v), width: Math.max(1, W * 0.68), height: Math.max(0.3, f.yb - Y(v)), fill: on ? rgba(cv_('--green'), 0.5) : rgba(cv_('--blue'), 0.28), stroke: x === k ? cv_('--amber') : on ? cv_('--green') : cv_('--blue'), 'stroke-width': x === k ? 2 : 0.8 }, svg);
    if ((x - lo) % every === 0) txt(bx + W / 2, f.yb + 13, String(x), cv_('--dim'), svg, 'middle', 9);
  }
  const E = F.E(ps), mx = f.x0 + (E - lo + 0.5) * W;
  if (mx >= f.x0 && mx <= f.x1) { el('path', { d: `M ${mx - 6} ${f.yb + 18} L ${mx + 6} ${f.yb + 18} L ${mx} ${f.yb + 8} Z`, fill: cv_('--amber') }, svg); txt(mx, f.yb + 30, 'E(X)', cv_('--amber'), svg, 'middle', 9); }
  txt(f.x0, 16, `${F.name(ps)} · green: X ≤ ${k} · amber: X = ${k}`, cv_('--muted'), svg, 'start', 10);
  let Fk = 0;
  for (let x = lo; x <= k; x++) Fk += F.pmf(x, ps);
  let tail;
  if (fam === 'binom') { tail = 0; for (let x = k + 1; x <= ps[0]; x++) tail += F.pmf(x, ps); }
  else if (fam === 'bern' || fam === 'dunif') { tail = 0; for (let x = k + 1; x <= F.sup(ps)[1]; x++) tail += F.pmf(x, ps); }
  else if (fam === 'geo1') tail = Math.pow(1 - ps[0], k);
  else if (fam === 'geo2') tail = Math.pow(1 - ps[0], k + 1);
  else tail = Math.max(0, 1 - Fk);
  const V = F.V(ps);
  const r = document.getElementById('ddread');
  if (r) r.innerHTML = `<span>P(X = ${k}) = <b>${fmtP(F.pmf(k, ps))}</b></span><span>P(X ≤ ${k}) = <b>${fmtP(Fk)}</b></span><span>P(X &gt; ${k}) = <b>${fmtP(tail)}</b></span>` +
    `<span>E(X) = <b>${fmt(E, 4)}</b></span><span>V(X) = <b>${fmt(V, 4)}</b></span><span>σ = <b>${fmt(Math.sqrt(V), 4)}</b></span>`;
}
function ddSet(fam, params, k) {
  const e = document.getElementById('dd_fam');
  if (e) e.value = fam;
  ddConfigure(fam);
  const F = DD[fam];
  params.forEach((v, i) => { const s = document.getElementById('dd_' + (i + 1)); if (s) s.value = v; });
  const s = document.getElementById('dd_k');
  if (s) { const [lo, hi] = F.sup(params); s.min = lo; s.max = Math.min(hi, lo + 59); s.value = k; }
  ddDraw();
}
window.ddSet = ddSet;

// =====================================================================
// 19 · Binomial(n, p) against its Poisson(np) approximation
// =====================================================================
function paDraw() {
  const svg = document.getElementById('pasvg');
  if (!svg) return;
  svg.innerHTML = '';
  const n = Math.round(val('pa_n')), p = val('pa_p'), lam = n * p;
  const K = Math.min(n, Math.max(8, Math.ceil(lam + 4 * Math.sqrt(lam) + 3)), 40);
  const B = [], Po = [];
  for (let k = 0; k <= K; k++) { B.push(binomPmf(k, n, p)); Po.push(poisPmf(k, lam)); }
  const pm = Math.max(...B, ...Po);
  const f = frame(svg, 360, 250, { l: 38, r: 12, t: 30, b: 34 });
  const W = (f.x1 - f.x0) / (K + 1), Y = (v) => f.yb - (v / (pm * 1.1)) * (f.yb - f.yt);
  txt(f.x0 - 5, Y(pm) + 3, fmt(pm, 3), cv_('--dim'), svg, 'end', 9);
  txt(f.x0 - 5, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  const every = Math.max(1, Math.ceil((K + 1) / 14));
  let maxErr = 0;
  for (let k = 0; k <= K; k++) {
    const bx = f.x0 + k * W;
    maxErr = Math.max(maxErr, Math.abs(B[k] - Po[k]));
    el('rect', { x: bx + W * 0.1, y: Y(B[k]), width: W * 0.4, height: f.yb - Y(B[k]), fill: rgba(cv_('--blue'), 0.5), stroke: cv_('--blue'), 'stroke-width': 0.8 }, svg);
    el('rect', { x: bx + W * 0.5, y: Y(Po[k]), width: W * 0.4, height: f.yb - Y(Po[k]), fill: rgba(cv_('--red'), 0.35), stroke: cv_('--red'), 'stroke-width': 0.8 }, svg);
    if (k % every === 0) txt(bx + W / 2, f.yb + 13, String(k), cv_('--dim'), svg, 'middle', 9);
  }
  txt(f.x0, 16, `blue: Bin(${n}, ${fmt(p, 4)}) · red: Poisson(${fmt(lam, 3)})`, cv_('--muted'), svg, 'start', 10);
  const r = document.getElementById('paread');
  if (r) {
    let s = `<span>λ = np = <b>${fmt(lam, 4)}</b></span>`;
    for (let k = 0; k <= Math.min(3, n); k++) s += `<span>P(X=${k}): exact <b>${fmt(B[k], 7)}</b> · approx <b>${fmt(Po[k], 7)}</b></span>`;
    s += `<span class="muted">largest gap between the two pmfs: ${fmt(maxErr, 5)}${maxErr < 0.005 ? ' — excellent' : maxErr < 0.02 ? ' — decent' : ' — poor: n too small or p too big'}</span>`;
    r.innerHTML = s;
  }
}
function paSet(n, p) { setS([['pa_n', n, 0], ['pa_p', p, 4]]); paDraw(); }
window.paSet = paSet;

// =====================================================================
// 21 · pdf and cdf side by side: F(t) is the area, f(t) is the slope
// =====================================================================
const PC = {
  u15: { lo: 0, hi: 6, fmax: 0.32, pdf: (x) => (x > 1 && x < 5 ? 0.25 : 0), cdf: (x) => (x <= 1 ? 0 : x >= 5 ? 1 : (x - 1) / 4), name: 'Uniform(1, 5)' },
  exp5: { lo: -0.2, hi: 1.2, fmax: 5.4, pdf: (x) => (x >= 0 ? 5 * Math.exp(-5 * x) : 0), cdf: (x) => (x <= 0 ? 0 : 1 - Math.exp(-5 * x)), name: 'f(x) = 5e^(−5x)' },
  cube: { lo: -0.2, hi: 1.2, fmax: 3.3, pdf: (x) => (x > 0 && x < 1 ? 3 * x * x : 0), cdf: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x), name: 'f(x) = 3x² on (0, 1)' },
  norm: { lo: -4, hi: 4, fmax: 0.45, pdf: (x) => normPdf(x), cdf: (x) => normCdf(x), name: 'standard normal' },
  bern: { lo: -0.5, hi: 1.5, fmax: 0.7, disc: [[0, 0.4], [1, 0.6]], cdf: (x) => (x < 0 ? 0 : x < 1 ? 0.4 : 1), name: 'Bernoulli(0.6)' },
};
function pcFam() { const e = document.getElementById('pc_fam'); return (e && e.value) || 'u15'; }
function pcDraw() {
  const svg = document.getElementById('pcsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const K = PC[pcFam()];
  let t = val('pc_t');
  if (K.disc) for (const [x] of K.disc) if (Math.abs(t - x) < 0.04) t = x;
  const lt = document.getElementById('pc_t_v');
  if (lt) lt.textContent = fmt(t, 2);
  const x0 = 40, x1 = 344, X = (x) => x0 + ((x - K.lo) / (K.hi - K.lo)) * (x1 - x0);
  const Ft = K.cdf(t);
  // top: the density (or pmf)
  const yb = 140, yt = 28, Y = (v) => yb - (v / K.fmax) * (yb - yt);
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt, x2: x0, y2: yb, stroke: cv_('--border2') }, svg);
  txt(x0 + 4, 16, K.disc ? `pmf of ${K.name}: probability sits on points` : `density of ${K.name}: shaded area = F(t)`, cv_('--text'), svg, 'start', 10.5);
  if (K.disc) {
    for (const [x, q] of K.disc) {
      const on = x <= t + 1e-9;
      el('line', { x1: X(x), y1: yb, x2: X(x), y2: Y(q), stroke: on ? cv_('--amber') : cv_('--blue'), 'stroke-width': 3 }, svg);
      el('circle', { cx: X(x), cy: Y(q), r: 4, fill: on ? cv_('--amber') : cv_('--blue') }, svg);
      txt(X(x) + 7, Y(q) + 3, String(q), cv_('--muted'), svg, 'start', 9.5);
    }
  } else {
    const a = Math.max(K.lo, Math.min(t, K.hi));
    el('path', { d: areaPath(K.pdf, K.lo, a, X, Y, yb, 200, yt - 6), fill: rgba(cv_('--amber'), 0.45) }, svg);
    el('path', { d: curvePath(K.pdf, K.lo, K.hi, X, Y, 400, yt - 6), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2 }, svg);
    txt(x0 - 5, Y(K.fmax * 0.95) + 3, fmt(K.fmax * 0.95, 2), cv_('--dim'), svg, 'end', 9);
  }
  txt(x0 - 5, yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  el('line', { x1: X(t), y1: yt - 4, x2: X(t), y2: yb, stroke: cv_('--green'), 'stroke-dasharray': '4 3' }, svg);
  txt(X(t), yb + 13, 't', cv_('--green'), svg, 'middle', 10.5);
  // bottom: the cdf with the tangent at t
  const yb2 = 300, yt2 = 186, Y2 = (v) => yb2 - v * (yb2 - yt2);
  el('line', { x1: x0, y1: yb2, x2: x1, y2: yb2, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: yt2 - 6, x2: x0, y2: yb2, stroke: cv_('--border2') }, svg);
  el('line', { x1: x0, y1: Y2(1), x2: x1, y2: Y2(1), stroke: cv_('--border'), 'stroke-dasharray': '3 3' }, svg);
  txt(x0 - 5, Y2(1) + 3, '1', cv_('--dim'), svg, 'end', 9);
  txt(x0 - 5, yb2 + 3, '0', cv_('--dim'), svg, 'end', 9);
  txt(x0 + 4, yt2 - 12, K.disc ? 'cdf: a staircase — no slope at the jumps' : 'cdf F(t): the tangent at t has slope f(t)', cv_('--text'), svg, 'start', 10.5);
  if (K.disc) {
    const segs = [[K.lo, 0, 0], [0, 1, 0.4], [1, K.hi, 1]];
    for (const [a, b, v] of segs) el('line', { x1: X(a), y1: Y2(v), x2: X(b), y2: Y2(v), stroke: cv_('--red'), 'stroke-width': 2.2 }, svg);
    for (const [x, lv, hv] of [[0, 0, 0.4], [1, 0.4, 1]]) {
      el('line', { x1: X(x), y1: Y2(lv), x2: X(x), y2: Y2(hv), stroke: cv_('--red'), 'stroke-dasharray': '2 3' }, svg);
      el('circle', { cx: X(x), cy: Y2(lv), r: 3.5, fill: cv_('--panel'), stroke: cv_('--red'), 'stroke-width': 1.5 }, svg);
      el('circle', { cx: X(x), cy: Y2(hv), r: 3.5, fill: cv_('--red') }, svg);
    }
  } else {
    el('path', { d: curvePath(K.cdf, K.lo, K.hi, X, Y2, 400), fill: 'none', stroke: cv_('--red'), 'stroke-width': 2.2 }, svg);
    // tangent line: slope f(t) in data units, converted to pixels
    const ft = K.pdf(t), h = (K.hi - K.lo) * 0.12;
    const px = (x) => X(x), py = (x) => Y2(Ft + ft * (x - t));
    el('line', { x1: px(t - h), y1: py(t - h), x2: px(t + h), y2: py(t + h), stroke: cv_('--green'), 'stroke-width': 1.8 }, svg);
  }
  el('line', { x1: X(t), y1: yb2, x2: X(t), y2: Y2(Ft), stroke: cv_('--green'), 'stroke-dasharray': '4 3' }, svg);
  el('line', { x1: x0, y1: Y2(Ft), x2: X(t), y2: Y2(Ft), stroke: cv_('--amber'), 'stroke-dasharray': '4 3' }, svg);
  el('circle', { cx: X(t), cy: Y2(Ft), r: 4, fill: cv_('--amber') }, svg);
  for (const tk of niceTicks(K.lo, K.hi, 8)) txt(X(tk), yb2 + 13, tickLabel(tk), cv_('--dim'), svg, 'middle', 9);
  const r = document.getElementById('pcread');
  if (!r) return;
  if (K.disc) {
    const jump = K.disc.find(([x]) => x === t);
    r.innerHTML = `<span>F(t) = P(X ≤ t) = <b>${fmt(Ft, 3)}</b></span>` + (jump ? `<span>jump at t = ${t}: <b>P(X = ${t}) = ${jump[1]}</b></span>` : '<span>between jumps F is flat: slope 0</span>') + '<span class="muted">a discrete cdf has no density — it moves only by jumps</span>';
  } else {
    const ft = K.pdf(t);
    r.innerHTML = `<span>F(t) = area up to t = <b>${fmt(Ft, 4)}</b></span><span>f(t) = height = slope of F at t = <b>${fmt(ft, 4)}</b></span>` + (ft > 1 ? '<span style="color:var(--red)">f(t) &gt; 1: a density is not a probability</span>' : '') + '<span class="muted">P(X = t) = 0 for every single t</span>';
  }
}
function pcSet(fam, t) {
  const e = document.getElementById('pc_fam');
  if (e) e.value = fam;
  const K = PC[fam];
  setRange('pc_t', K.lo, K.hi);
  setS([['pc_t', t, 2]]);
  pcDraw();
}
window.pcSet = pcSet;

// =====================================================================
// 23 · explorer for the named continuous distributions (modules 23–25)
// =====================================================================
const CC = {
  unif: { labs: ['a', 'b'], r: [[-5, 30, 'any'], [-4, 40, 'any']], pdf: (x, [a, b]) => (x > a && x < b ? 1 / (b - a) : 0), cdf: (x, [a, b]) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)), range: ([a, b]) => [a - 0.2 * (b - a), b + 0.2 * (b - a)], E: ([a, b]) => (a + b) / 2, V: ([a, b]) => ((b - a) ** 2) / 12, name: ([a, b]) => `Uniform(${tickLabel(+a.toFixed(2))}, ${tickLabel(+b.toFixed(2))})` },
  exp: { labs: ['λ', null], r: [[0.1, 5, 'any']], pdf: (x, [l]) => (x >= 0 ? l * Math.exp(-l * x) : 0), cdf: (x, [l]) => (x <= 0 ? 0 : 1 - Math.exp(-l * x)), range: ([l]) => [-0.3 / l, 5 / l], E: ([l]) => 1 / l, V: ([l]) => 1 / (l * l), name: ([l]) => `Exponential(λ = ${fmt(l, 2)})` },
  norm: { labs: ['μ', 'σ'], r: [[-5, 5, 'any'], [0.2, 4, 'any']], pdf: (x, [m, s]) => normPdf(x, m, s), cdf: (x, [m, s]) => normCdf((x - m) / s), range: ([m, s]) => [m - 4 * s, m + 4 * s], E: ([m]) => m, V: ([, s]) => s * s, name: ([m, s]) => `N(${fmt(m, 2)}, ${fmt(s * s, 2)})` },
  chi2: { labs: ['k', null], r: [[1, 30, 1]], pdf: (x, [k]) => chi2Pdf(x, k), cdf: (x, [k]) => chi2Cdf(x, k), range: ([k]) => [0, k + 5 * Math.sqrt(2 * k) + 1], E: ([k]) => k, V: ([k]) => 2 * k, name: ([k]) => `χ²(${k})` },
  t: { labs: ['ν', null], r: [[1, 60, 1]], pdf: (x, [v]) => tPdf(x, v), cdf: (x, [v]) => tCdf(x, v), range: () => [-5, 5], E: ([v]) => (v > 1 ? 0 : NaN), V: ([v]) => (v > 2 ? v / (v - 2) : v > 1 ? Infinity : NaN), name: ([v]) => `Student-t(${v})` },
};
function ccFam() { const e = document.getElementById('cc_fam'); return (e && e.value) || 'unif'; }
function ccParams() {
  const fam = ccFam(), F = CC[fam];
  const ps = [val('cc_1')];
  if (F.labs[1]) ps.push(val('cc_2'));
  F.r.forEach((rg, i) => { if (rg[2] === 1) ps[i] = Math.round(ps[i]); });
  if (fam === 'unif' && ps[1] <= ps[0] + 0.1) { ps[1] = ps[0] + 0.1; setS([['cc_2', ps[1], 2]]); }
  return ps;
}
function ccConfigure(fam) {
  const F = CC[fam];
  F.labs.forEach((lab, i) => {
    const id = 'cc_' + (i + 1), s = document.getElementById(id);
    if (!s) return;
    const wrap = s.parentElement;
    if (!lab) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    const l = document.getElementById(id + '_lab');
    if (l) l.textContent = lab;
    s.min = F.r[i][0]; s.max = F.r[i][1]; s.step = F.r[i][2];
  });
}
function ccRerange(keep) {
  const F = CC[ccFam()], [lo, hi] = F.range(ccParams());
  for (const id of ['cc_lo', 'cc_hi']) {
    const s = document.getElementById(id);
    if (!s) continue;
    const v = parseFloat(s.value);
    s.min = lo; s.max = hi; s.step = 'any';
    if (keep && isFinite(v)) s.value = Math.min(hi, Math.max(lo, v));
  }
}
function ccDraw() {
  const svg = document.getElementById('ccsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const fam = ccFam(), F = CC[fam], ps = ccParams();
  F.labs.forEach((lab, i) => { if (!lab) return; const l = document.getElementById('cc_' + (i + 1) + '_v'); if (l) l.textContent = F.r[i][2] === 1 ? String(ps[i]) : fmt(ps[i], 2); });
  const [lo, hi] = F.range(ps);
  let a = val('cc_lo'), b = val('cc_hi');
  if (a > b) [a, b] = [b, a];
  const la = document.getElementById('cc_lo_v'), lb = document.getElementById('cc_hi_v');
  if (la) la.textContent = fmt(a, 2);
  if (lb) lb.textContent = fmt(b, 2);
  const pdf = (x) => F.pdf(x, ps), cdf = (x) => F.cdf(x, ps);
  let ym = 0;
  for (let i = 0; i <= 300; i++) { const x = lo + ((hi - lo) * i) / 300; const v = pdf(x); if (isFinite(v) && x > lo + (hi - lo) * 0.015) ym = Math.max(ym, v); }
  ym = ym * 1.12 || 1;
  const f = frame(svg, 360, 260, { l: 40, r: 12, t: 30, b: 34 });
  const X = (x) => f.x0 + ((x - lo) / (hi - lo)) * (f.x1 - f.x0), Y = (v) => f.yb - (v / ym) * (f.yb - f.yt);
  const ca = Math.max(a, lo), cb = Math.min(b, hi);
  if (cb > ca) el('path', { d: areaPath(pdf, ca, cb, X, Y, f.yb, 200, f.yt - 4), fill: rgba(cv_('--amber'), 0.45) }, svg);
  el('path', { d: curvePath(pdf, lo, hi, X, Y, 400, f.yt - 4), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2 }, svg);
  for (const x of [a, b]) el('line', { x1: X(x), y1: f.yt - 4, x2: X(x), y2: f.yb, stroke: cv_('--green'), 'stroke-dasharray': '4 3' }, svg);
  txt(f.x0 - 5, Y(ym / 1.12) + 3, fmt(ym / 1.12, ym < 0.1 ? 3 : 2), cv_('--dim'), svg, 'end', 9);
  txt(f.x0 - 5, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  for (const tk of niceTicks(lo, hi, 9)) txt(X(tk), f.yb + 13, tickLabel(tk), cv_('--dim'), svg, 'middle', 9);
  const E = F.E(ps);
  if (isFinite(E) && X(E) >= f.x0 && X(E) <= f.x1) { el('path', { d: `M ${X(E) - 6} ${f.yb + 26} L ${X(E) + 6} ${f.yb + 26} L ${X(E)} ${f.yb + 17} Z`, fill: cv_('--amber') }, svg); }
  const P = cdf(b) - cdf(a);
  txt(f.x0, 16, `${F.name(ps)} · amber = P(x₁ < X < x₂)`, cv_('--muted'), svg, 'start', 10);
  const V = F.V(ps);
  const show = (v) => (isNaN(v) ? 'undefined' : v === Infinity ? '∞' : fmt(v, 4));
  const r = document.getElementById('ccread');
  if (r) r.innerHTML = `<span>P(x₁ &lt; X &lt; x₂) = F(x₂) − F(x₁) = <b>${fmt(P, 4)}</b></span><span>F(x₁) = <b>${fmt(cdf(a), 4)}</b></span><span>F(x₂) = <b>${fmt(cdf(b), 4)}</b></span>` +
    `<span>E(X) = <b>${show(E)}</b></span><span>V(X) = <b>${show(V)}</b></span><span>σ = <b>${show(Math.sqrt(V))}</b></span>`;
}
function ccSet(fam, params, a, b) {
  const e = document.getElementById('cc_fam');
  if (e) e.value = fam;
  ccConfigure(fam);
  params.forEach((v, i) => { const s = document.getElementById('cc_' + (i + 1)); if (s) s.value = v; });
  ccRerange(false);
  setS([['cc_lo', a, 2], ['cc_hi', b, 2]]);
  ccDraw();
}
window.ccSet = ccSet;

// =====================================================================
// 23 · memorylessness: the tail of e^(−λt), rescaled, is the whole curve again
// =====================================================================
function mlDraw() {
  const svg = document.getElementById('mlsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const l = val('ml_l'), a = val('ml_a'), x = val('ml_x');
  const S = (t) => Math.exp(-l * t);
  const f = frame(svg, 360, 250, { l: 36, r: 12, t: 30, b: 34 });
  const TM = 6.2, X = (t) => f.x0 + (t / TM) * (f.x1 - f.x0), Y = (v) => f.yb - (v / 1.08) * (f.yb - f.yt);
  el('line', { x1: f.x0, y1: Y(1), x2: f.x1, y2: Y(1), stroke: cv_('--border'), 'stroke-dasharray': '3 3' }, svg);
  txt(f.x0 - 5, Y(1) + 3, '1', cv_('--dim'), svg, 'end', 9);
  txt(f.x0 - 5, f.yb + 3, '0', cv_('--dim'), svg, 'end', 9);
  for (let t = 0; t <= 6; t++) txt(X(t), f.yb + 13, String(t), cv_('--dim'), svg, 'middle', 9);
  el('path', { d: curvePath(S, 0, TM, X, Y, 300), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2 }, svg);
  // tail beyond a, divided by S(a): identical to the original curve shifted right by a
  el('path', { d: curvePath((t) => S(t) / S(a), a, TM, X, Y, 300), fill: 'none', stroke: cv_('--amber'), 'stroke-width': 1.8, 'stroke-dasharray': '6 3' }, svg);
  el('line', { x1: X(a), y1: f.yb, x2: X(a), y2: Y(1), stroke: cv_('--amber'), 'stroke-dasharray': '2 3' }, svg);
  el('circle', { cx: X(a), cy: Y(S(a)), r: 3.5, fill: cv_('--amber') }, svg);
  el('circle', { cx: X(a + x), cy: Y(S(a + x)), r: 3.5, fill: cv_('--red') }, svg);
  el('circle', { cx: X(x), cy: Y(S(x)), r: 4, fill: cv_('--green') }, svg);
  el('circle', { cx: X(a + x), cy: Y(S(x)), r: 4, fill: 'none', stroke: cv_('--green'), 'stroke-width': 2 }, svg);
  el('line', { x1: X(x), y1: Y(S(x)), x2: X(a + x), y2: Y(S(x)), stroke: cv_('--green'), 'stroke-dasharray': '2 2' }, svg);
  txt(X(a) + 3, Y(1) + 12, 'a', cv_('--amber'), svg, 'start', 10);
  txt(f.x0, 16, 'blue: P(X > t) · amber: P(X > t | X > a)', cv_('--muted'), svg, 'start', 9.5);
  const r = document.getElementById('mlread');
  if (r) r.innerHTML = `<span>P(X &gt; a) = <b>${fmt(S(a), 4)}</b></span><span>P(X &gt; a + x) = <b>${fmt(S(a + x), 4)}</b></span>` +
    `<span>ratio = P(X &gt; a+x | X &gt; a) = <b>${fmt(S(a + x) / S(a), 4)}</b></span><span>P(X &gt; x) = <b>${fmt(S(x), 4)}</b></span><span class="muted">green dot and green ring sit at the same height: the past does not matter</span>`;
}
function mlSet(l, a, x) { setS([['ml_l', l, 2], ['ml_a', a, 2], ['ml_x', x, 2]]); mlDraw(); }
window.mlSet = mlSet;

// =====================================================================
// 24 · any normal is a standard normal on a different ruler
// =====================================================================
function parseLim(s) {
  const t = String(s).trim().toLowerCase().replace('−', '-').replace('∞', 'inf');
  if (t === '-inf') return -Infinity;
  if (t === 'inf' || t === '+inf') return Infinity;
  return parseFloat(t);
}
function nzDraw() {
  const svg = document.getElementById('nzsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const get = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  const m = parseLim(get('nz_m')), s = parseLim(get('nz_s'));
  let a = parseLim(get('nz_a')), b = parseLim(get('nz_b'));
  const r = document.getElementById('nzread');
  if (!isFinite(m) || !(s > 0) || isNaN(a) || isNaN(b)) { if (r) r.innerHTML = '<span style="color:var(--red)">need a number for μ, σ &gt; 0, and numbers (or -inf / inf) for a and b</span>'; return; }
  if (a > b) [a, b] = [b, a];
  const lo = m - 4 * s, hi = m + 4 * s;
  const x0 = 30, x1 = 344, X = (x) => x0 + ((x - lo) / (hi - lo)) * (x1 - x0);
  const yb = 168, yt = 34, pk = normPdf(m, m, s), Y = (v) => yb - (v / (pk * 1.1)) * (yb - yt);
  const pdf = (x) => normPdf(x, m, s);
  const ca = Math.max(a, lo), cb = Math.min(b, hi);
  if (cb > ca) el('path', { d: areaPath(pdf, ca, cb, X, Y, yb, 200), fill: rgba(cv_('--amber'), 0.45) }, svg);
  el('path', { d: curvePath(pdf, lo, hi, X, Y, 300), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2 }, svg);
  el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: cv_('--border2') }, svg);
  const zy = 212;
  el('line', { x1: x0, y1: zy, x2: x1, y2: zy, stroke: cv_('--green') }, svg);
  for (let z = -3; z <= 3; z++) {
    const xx = X(m + z * s);
    el('line', { x1: xx, y1: yb, x2: xx, y2: yb + 4, stroke: cv_('--border2') }, svg);
    el('line', { x1: xx, y1: yb + 4, x2: xx, y2: zy, stroke: cv_('--border'), 'stroke-dasharray': '1 3' }, svg);
    el('line', { x1: xx, y1: zy, x2: xx, y2: zy + 4, stroke: cv_('--green') }, svg);
    txt(xx, yb + 15, tickLabel(+(m + z * s).toFixed(3)), cv_('--dim'), svg, 'middle', 9);
    txt(xx, zy + 15, String(z), cv_('--green'), svg, 'middle', 9);
  }
  txt(x1, yb - 4, 'x', cv_('--dim'), svg, 'end', 10);
  txt(x1, zy - 5, 'z = (x − μ)/σ', cv_('--green'), svg, 'end', 9.5);
  for (const v of [a, b]) if (isFinite(v) && v >= lo && v <= hi) el('line', { x1: X(v), y1: yt - 4, x2: X(v), y2: yb, stroke: cv_('--amber'), 'stroke-dasharray': '4 3' }, svg);
  txt(x0, 16, `Y ~ N(${tickLabel(m)}, ${tickLabel(+(s * s).toFixed(4))}): mean ${tickLabel(m)}, sd ${tickLabel(s)}`, cv_('--muted'), svg, 'start', 10);
  const za = (a - m) / s, zb = (b - m) / s, Pa = normCdf(za), Pb = normCdf(zb), P = Pb - Pa;
  const zs = (z) => (z === -Infinity ? '−∞' : z === Infinity ? '+∞' : fmt(z, 3));
  if (r) r.innerHTML = `<span>z_a = <b>${zs(za)}</b></span><span>z_b = <b>${zs(zb)}</b></span><span>Φ(z_a) = <b>${fmt(Pa, 4)}</b></span><span>Φ(z_b) = <b>${fmt(Pb, 4)}</b></span>` +
    `<span>P(a &lt; Y &lt; b) = Φ(z_b) − Φ(z_a) = <b>${fmt(P, 4)}</b></span><span>outside = <b>${fmt(1 - P, 4)}</b></span>`;
}
function nzSet(m, s, a, b) {
  for (const [id, v] of [['nz_m', m], ['nz_s', s], ['nz_a', a], ['nz_b', b]]) { const e = document.getElementById(id); if (e) e.value = String(v); }
  nzDraw();
}
window.nzSet = nzSet;

// =====================================================================
// 25 · Student-t against the normal, χ²(k), and percentiles
// =====================================================================
function tqMode() { const e = document.getElementById('tq_mode'); return (e && e.value) || 't'; }
function tqConfigure(mode) {
  const s = document.getElementById('tq_1'), l = document.getElementById('tq_1_lab');
  if (s) { s.min = 1; s.max = mode === 't' ? 60 : 30; s.step = 1; }
  if (l) l.textContent = mode === 't' ? 'ν' : 'k';
}
function tqDraw() {
  const svg = document.getElementById('tqsvg');
  if (!svg) return;
  svg.innerHTML = '';
  const mode = tqMode(), v = Math.round(val('tq_1')), p = val('tq_p');
  const lv = document.getElementById('tq_1_v');
  if (lv) lv.textContent = String(v);
  const f = frame(svg, 360, 250, { l: 38, r: 12, t: 30, b: 34 });
  const r = document.getElementById('tqread');
  if (mode === 't') {
    const lo = -5, hi = 5, X = (x) => f.x0 + ((x - lo) / (hi - lo)) * (f.x1 - f.x0), Y = (y) => f.yb - (y / 0.44) * (f.yb - f.yt);
    const q = invCdf((x) => tCdf(x, v), p, -500, 500), z = invCdf(normCdf, p, -10, 10);
    el('path', { d: areaPath((x) => tPdf(x, v), lo, Math.min(hi, q), X, Y, f.yb, 200), fill: rgba(cv_('--amber'), 0.4) }, svg);
    el('path', { d: curvePath((x) => normPdf(x), lo, hi, X, Y, 300), fill: 'none', stroke: cv_('--dim'), 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }, svg);
    el('path', { d: curvePath((x) => tPdf(x, v), lo, hi, X, Y, 300), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2.2 }, svg);
    if (q <= hi) el('line', { x1: X(q), y1: f.yt, x2: X(q), y2: f.yb, stroke: cv_('--amber'), 'stroke-width': 1.5 }, svg);
    el('line', { x1: X(z), y1: f.yb - 8, x2: X(z), y2: f.yb + 6, stroke: cv_('--dim'), 'stroke-width': 2 }, svg);
    for (let t = -4; t <= 4; t += 2) txt(X(t), f.yb + 14, String(t), cv_('--dim'), svg, 'middle', 9);
    txt(f.x0, 16, `blue: t(ν=${v}) · dashed: N(0,1) · amber: area p`, cv_('--muted'), svg, 'start', 9.5);
    const tt = 2 * (1 - tCdf(2, v)), tz = 2 * (1 - normCdf(2));
    const V = v > 2 ? fmt(v / (v - 2), 4) : v > 1 ? '∞' : 'undefined';
    if (r) r.innerHTML = `<span>t percentile t(${v}; ${fmt(p, 3)}) = <b>${q > 500 - 1e-6 ? '&gt; 500' : fmt(q, 3)}</b></span><span>normal percentile z(${fmt(p, 3)}) = <b>${fmt(z, 3)}</b></span>` +
      `<span>P(|T| &gt; 2) = <b>${fmt(tt, 4)}</b> vs P(|Z| &gt; 2) = <b>${fmt(tz, 4)}</b></span><span>V(T) = <b>${V}</b></span><span>E(T) = <b>${v > 1 ? '0' : 'undefined'}</b></span>`;
  } else {
    const k = v, hi = k + 5 * Math.sqrt(2 * k) + 1, lo = 0;
    const X = (x) => f.x0 + ((x - lo) / (hi - lo)) * (f.x1 - f.x0);
    let ym = 0;
    for (let i = 1; i <= 300; i++) { const x = lo + ((hi - lo) * i) / 300; if (x > hi * 0.02) ym = Math.max(ym, chi2Pdf(x, k)); }
    ym *= 1.12;
    const Y = (y) => f.yb - (y / ym) * (f.yb - f.yt);
    const q = invCdf((x) => chi2Cdf(x, k), p, 0, 1000);
    el('path', { d: areaPath((x) => chi2Pdf(x, k), 1e-6, Math.min(q, hi), X, Y, f.yb, 200, f.yt - 4), fill: rgba(cv_('--amber'), 0.4) }, svg);
    el('path', { d: curvePath((x) => chi2Pdf(x, k), 1e-6, hi, X, Y, 400, f.yt - 4), fill: 'none', stroke: cv_('--blue'), 'stroke-width': 2.2 }, svg);
    if (q <= hi) el('line', { x1: X(q), y1: f.yt, x2: X(q), y2: f.yb, stroke: cv_('--amber'), 'stroke-width': 1.5 }, svg);
    el('path', { d: `M ${X(k) - 6} ${f.yb + 26} L ${X(k) + 6} ${f.yb + 26} L ${X(k)} ${f.yb + 17} Z`, fill: cv_('--green') }, svg);
    for (const tk of niceTicks(lo, hi, 8)) txt(X(tk), f.yb + 13, tickLabel(tk), cv_('--dim'), svg, 'middle', 9);
    txt(f.x0, 16, `χ²(${k}) · amber: area p · green ▲: mean k`, cv_('--muted'), svg, 'start', 9.5);
    if (r) r.innerHTML = `<span>percentile χ²(${k}; ${fmt(p, 3)}) = <b>${fmt(q, 3)}</b></span><span>E(W) = k = <b>${k}</b></span><span>V(W) = 2k = <b>${2 * k}</b></span><span>P(W ≤ ${k}) = <b>${fmt(chi2Cdf(k, k), 4)}</b></span><span class="muted">skewed right: the mean sits right of the peak</span>`;
  }
}
function tqSet(mode, v, p) {
  const e = document.getElementById('tq_mode');
  if (e) e.value = mode;
  tqConfigure(mode);
  setS([['tq_1', v, 0], ['tq_p', p, 3]]);
  tqDraw();
}
window.tqSet = tqSet;

// =====================================================================
// 26 · multiple-choice practice: click an option, see why
// =====================================================================
function mcqInit() {
  const qs = [...document.querySelectorAll('.mcq')];
  if (!qs.length) return;
  const score = () => {
    const done = qs.filter((q) => q.classList.contains('done'));
    const ok = done.filter((q) => q.dataset.ok === '1').length;
    const s = document.getElementById('mcqscore');
    if (s) s.innerHTML = `<span>answered <b>${done.length}/${qs.length}</b></span><span>right at first try <b>${ok}</b></span>`;
  };
  qs.forEach((q) => {
    const ans = parseInt(q.dataset.ans, 10);
    const btns = [...q.querySelectorAll('.opts button')];
    btns.forEach((b, i) => {
      b.addEventListener('click', () => {
        // the first click is the one that counts; the right answer is then always revealed
        if (!q.classList.contains('done')) q.dataset.ok = i === ans ? '1' : '0';
        if (i !== ans) b.classList.add('no');
        btns[ans]?.classList.add('ok');
        q.classList.add('done');
        score();
      });
    });
  });
  document.getElementById('mcqreset')?.addEventListener('click', () => {
    qs.forEach((q) => { q.classList.remove('done'); delete q.dataset.ok; q.querySelectorAll('.opts button').forEach((b) => b.classList.remove('ok', 'no')); });
    score();
  });
  score();
}

// =====================================================================
// wiring
// =====================================================================
bindS('un_u', 2, unDraw); bindS('un_v', 2, unDraw);
bindS('tr_p', 3, trDraw);
document.getElementById('tr_c')?.addEventListener('change', trDraw);
['co_A', 'co_B', 'co_C'].forEach((id) => document.getElementById(id)?.addEventListener('change', coDraw));
bindS('ma_1', 2, maDraw); bindS('ma_2', 2, maDraw); bindS('ma_3', 2, maDraw);
document.getElementById('dz_p')?.addEventListener('input', () => { dzLabel(); dzDraw(); });
bindS('dz_s', 3, dzDraw); bindS('dz_f', 3, dzDraw);
['by_p1', 'by_p2', 'by_l1', 'by_l2', 'by_l3'].forEach((id) => bindS(id, 3, byDraw));
document.getElementById('cd_kind')?.addEventListener('change', () => {
  const k = cdKind(), K = CD_KINDS[k];
  cdSet(k, K.type === 'd' ? K.pts[0][0] - 0.5 : K.lo + 0.25 * (K.hi - K.lo), K.type === 'd' ? K.pts[K.pts.length - 1][0] : K.lo + 0.7 * (K.hi - K.lo));
});
bindS('cd_a', 2, cdDraw); bindS('cd_b', 2, cdDraw);
bindS('ge_p', 2, geDraw); bindS('ge_K', 0, geDraw);
bindS('ev_p', 3, () => { evRun = []; evTot = 0; evDraw(); });
bindS('vr_a', 2, vrDraw); bindS('vr_b', 2, vrDraw);
document.getElementById('dd_fam')?.addEventListener('change', () => { const f = ddFam(); ddSet(f, DD[f].def, DD[f].sup(DD[f].def)[0] + 1); });
['dd_1', 'dd_2', 'dd_k'].forEach((id) => document.getElementById(id)?.addEventListener('input', ddDraw));
bindS('pa_n', 0, paDraw); bindS('pa_p', 4, paDraw);
document.getElementById('pc_fam')?.addEventListener('change', () => { const K = PC[pcFam()]; pcSet(pcFam(), K.lo + 0.6 * (K.hi - K.lo)); });
document.getElementById('pc_t')?.addEventListener('input', pcDraw);
document.getElementById('cc_fam')?.addEventListener('change', () => {
  const f = ccFam(), d = { unif: [[0, 1], 0.2, 0.7], exp: [[1], 0, 1], norm: [[0, 1], -1, 1], chi2: [[3], 0, 3], t: [[5], -2, 2] }[f];
  ccSet(f, d[0], d[1], d[2]);
});
['cc_1', 'cc_2'].forEach((id) => document.getElementById(id)?.addEventListener('input', () => { ccRerange(true); ccDraw(); }));
['cc_lo', 'cc_hi'].forEach((id) => document.getElementById(id)?.addEventListener('input', ccDraw));
bindS('ml_l', 2, mlDraw); bindS('ml_a', 2, mlDraw); bindS('ml_x', 2, mlDraw);
['nz_m', 'nz_s', 'nz_a', 'nz_b'].forEach((id) => document.getElementById(id)?.addEventListener('input', nzDraw));
document.getElementById('tq_mode')?.addEventListener('change', () => { const m = tqMode(); tqSet(m, m === 't' ? 5 : 4, m === 't' ? 0.975 : 0.95); });
document.getElementById('tq_1')?.addEventListener('input', tqDraw);
bindS('tq_p', 3, tqDraw);

// A full-width panel would blow a 360-unit figure up to ~2.5x, text included.
// Cap every figure at ~1.45x its viewBox width (figures in half-width columns
// are narrower than that anyway) and centre it.
document.querySelectorAll('figure svg[viewBox]').forEach((s) => {
  const w = s.viewBox.baseVal && s.viewBox.baseVal.width;
  if (w) { s.style.maxWidth = Math.round(w * 1.45) + 'px'; s.style.marginLeft = 'auto'; s.style.marginRight = 'auto'; }
});
// .svgtxt fixes font-size:11px in CSS, and CSS beats an SVG font-size attribute —
// so an explicit font-size="9" on a label would be silently ignored. Honour it.
document.querySelectorAll('figure svg text.svgtxt[font-size]').forEach((t) => { t.style.fontSize = t.getAttribute('font-size') + 'px'; });

function drawAll() {
  soDraw(); ieDraw(); unDraw(); clDraw(); trDraw(); coDraw(); maDraw(); dzDraw(); byDraw(); mhDraw(); mhSimDraw(); cdDraw(); lnDraw(); geDraw();
  evDraw(); vrDraw(); ddDraw(); paDraw(); pcDraw(); ccDraw(); mlDraw(); nzDraw(); tqDraw();
}
if (document.getElementById('dz_p')) dzSet(0.001, 0.99, 0.05);
if (document.getElementById('bysvg')) window.bySetFactories();
if (document.getElementById('cd_kind')) cdSet('lin', -2, 0.5);
if (document.getElementById('mhsvg')) mhNew();
if (document.getElementById('lnsvg')) lnAdd(300);
if (document.getElementById('dd_fam')) ddSet('binom', [10, 1 / 6], 1);
if (document.getElementById('pc_fam')) pcSet('u15', 3);
if (document.getElementById('cc_fam')) ccSet('unif', [0, 30], 10, 15);
if (document.getElementById('tq_mode')) tqSet('t', 5, 0.975);
mcqInit();
drawAll();
window.addEventListener('themechange', drawAll);
