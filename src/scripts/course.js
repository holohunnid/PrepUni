// Behaviour shared by every course page: sidebar toggle, print, worked-example
// expand/collapse, prev/next topic keys, sidebar highlight of the module in view, and
// loading the course's interactive figures. Math is already rendered at build
// time (src/lib/math.js), so nothing here touches KaTeX.
const main = document.querySelector('.main');

// ---------- interactive figures: one lazily loaded chunk per course ----------
const figureScripts = import.meta.glob('../courses/*/interactive.js');
const load = figureScripts[`../courses/${main?.dataset.course}/interactive.js`];
// overview pages have no figures (beyond static ones in the intro) — skip the download there
if (load && main.dataset.view !== 'overview') load();

// ---------- worked-example expand/collapse (buttons call window.toggleAll) ----------
function toggleAll(open) {
  document.querySelectorAll('.wx details').forEach((d) => (d.open = open));
}
window.toggleAll = toggleAll;
window.addEventListener('beforeprint', () => toggleAll(true));
document.getElementById('printbtn')?.addEventListener('click', () => window.print());

// ---------- sidebar ----------
const layout = document.querySelector('.layout');
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
if (layout && store.get('prepusi-sidebar') === 'collapsed') layout.classList.add('collapsed');
document.getElementById('sidebtn')?.addEventListener('click', () => {
  layout.classList.toggle('collapsed');
  store.set('prepusi-sidebar', layout.classList.contains('collapsed') ? 'collapsed' : 'open');
});
// keep the current topic visible in a long sidebar
const cur = document.querySelector('.side a.current');
if (cur) cur.parentElement.scrollTop = cur.offsetTop - 40;

// ---------- arriving at page#module ----------
// Topic pages are long and stream in, so the browser's own jump to the #anchor
// can happen before the target exists or before layout settles. Redo it once
// everything has loaded (instant, not smooth, so it cannot be interrupted).
if (location.hash.length > 1) {
  const jump = () => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant', block: 'start' });
  if (document.readyState === 'complete') jump();
  else window.addEventListener('load', jump, { once: true });
}

// ---------- ← / → move between topics ----------
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.target.closest?.('input, select, textarea, [contenteditable]')) return;
  const rel = e.key === 'ArrowLeft' ? 'prev' : e.key === 'ArrowRight' ? 'next' : null;
  const link = rel && document.querySelector(`.pager a[rel="${rel}"]`);
  if (link) location.href = link.href;
});

// ---------- highlight the module in view (modules on this page link to #anchors) ----------
const hashLinks = [...document.querySelectorAll('.side a[href^="#"]:not(.lbl)')];
if (hashLinks.length) {
  const byId = new Map(hashLinks.map((l) => [l.getAttribute('href').slice(1), l]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        hashLinks.forEach((l) => l.classList.remove('active'));
        byId.get(e.target.id)?.classList.add('active');
      }
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
}
