// Shared behavior for every course page: KaTeX rendering, sidebar toggle,
// theme cycling (persisted in localStorage), and sidebar nav highlighting.
import renderMathInElement from 'katex/contrib/auto-render';

renderMathInElement(document.body, {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
});

// ---------- worked-example expand/collapse (module 12 buttons use window.toggleAll) ----------
function toggleAll(o) {
  document.querySelectorAll('.wx details').forEach((d) => (d.open = o));
}
window.toggleAll = toggleAll;
window.addEventListener('beforeprint', () => toggleAll(true));

// ---------- sidebar ----------
const layout = document.querySelector('.layout');
if (layout && localStorage.getItem('prepusi-sidebar') === 'collapsed') {
  layout.classList.add('collapsed');
}
document.getElementById('sidebtn')?.addEventListener('click', () => {
  layout.classList.toggle('collapsed');
  localStorage.setItem('prepusi-sidebar', layout.classList.contains('collapsed') ? 'collapsed' : 'open');
});

// ---------- themes ----------
const themes = ['dark', 'light', 'solar'];
const names = { dark: 'dark', light: 'light', solar: 'solarized' };
let ti = Math.max(0, themes.indexOf(localStorage.getItem('prepusi-theme') || 'dark'));
const themebtn = document.getElementById('themebtn');

function applyTheme() {
  document.body.classList.remove('light', 'solar');
  if (themes[ti] !== 'dark') document.body.classList.add(themes[ti]);
  if (themebtn) themebtn.textContent = '◐ theme: ' + names[themes[ti]];
  // interactive figures listen for this and redraw with the new palette
  window.dispatchEvent(new Event('themechange'));
}
applyTheme();

themebtn?.addEventListener('click', () => {
  ti = (ti + 1) % themes.length;
  localStorage.setItem('prepusi-theme', themes[ti]);
  applyTheme();
});

document.getElementById('printbtn')?.addEventListener('click', () => window.print());

// ---------- nav highlight ----------
const secs = [...document.querySelectorAll('section')];
const links = [...document.querySelectorAll('.side a')];
if (secs.length && links.length) {
  const io = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  secs.forEach((s) => io.observe(s));
}
