// Theme cycling, shared by every page. The saved theme is already applied
// before first paint by the inline snippet in Base.astro; this only wires the
// button and tells interactive figures to repaint.
const THEMES = ['dark', 'light', 'solar'];
const NAMES = { dark: 'dark', light: 'light', solar: 'solarized' };

function saved() {
  try { return localStorage.getItem('prepusi-theme'); } catch { return null; }
}
let ti = Math.max(0, THEMES.indexOf(saved() || 'dark'));
const btn = document.getElementById('themebtn');

function apply() {
  const t = THEMES[ti];
  document.body.classList.remove('light', 'solar');
  if (t !== 'dark') document.body.classList.add(t);
  if (btn) btn.textContent = '◐ theme: ' + NAMES[t];
  // interactive figures listen for this and redraw with the new palette
  window.dispatchEvent(new Event('themechange'));
}
apply();

btn?.addEventListener('click', () => {
  ti = (ti + 1) % THEMES.length;
  try { localStorage.setItem('prepusi-theme', THEMES[ti]); } catch {}
  apply();
});
