// Single source of truth for every course on the site.
//
// A course is a folder under src/courses/<id>/ with meta.json, hero.html and
// modules/NN-name.html (one <section id="sN"> per file). Modules are grouped
// into topics by the "part" field in meta.json: a module with "part" starts a
// new topic, the ones after it belong to it (these are also the sidebar groups).
// Registering a course here is all it takes to publish it —
// src/pages/[...path].astro builds
//   <base>/            overview: intro + topic index
//   <base>/<topic>/    one page per topic (the default way to read)
//   <base>/all/        every module on one page (for Ctrl+F and print / PDF)
import { renderMath } from './math.js';

export const COURSES = [
  { id: 'exam-review', base: '/exam-review' },
  { id: 'stats-msc', base: '/statistics/msc' },
  { id: 'fin-econometrics', base: '/financial-econometrics' },
  { id: 'refresher-linear-algebra', base: '/refresher/linear-algebra' },
  { id: 'refresher-probability', base: '/refresher/probability' },
  { id: 'linear-algebra', base: '/linear-algebra' },
  { id: 'probability', base: '/probability' },
  { id: 'calculus', base: '/calculus' },
  { id: 'optimization', base: '/optimization' },
];

const metas = import.meta.glob('../courses/*/meta.json', { import: 'default', eager: true });
const heroes = import.meta.glob('../courses/*/hero.html', { query: '?raw', import: 'default', eager: true });
const fragments = import.meta.glob('../courses/*/modules/*.html', { query: '?raw', import: 'default', eager: true });

const courseOf = (path) => path.split('/')[2];
const slugify = (s) => s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let built;
/** All courses with their math already rendered. Computed once per build. */
export function getCourses() {
  if (built) return built;
  built = COURSES.map(({ id, base }) => {
    const meta = metas[`../courses/${id}/meta.json`];
    if (!meta) throw new Error(`course "${id}" has no meta.json`);

    const files = Object.keys(fragments).filter((p) => courseOf(p) === id).sort();
    const modules = files.map((path) => {
      const raw = fragments[path];
      const anchor = /<section id="([^"]+)"/.exec(raw)?.[1];
      const entry = meta.modules.find((m) => m.anchor === anchor);
      if (!entry) throw new Error(`${path}: section id "${anchor}" is not listed in ${id}/meta.json`);
      return { ...entry, html: renderMath(raw, path) };
    });

    // group modules into topics, one page each
    const topics = [];
    for (const m of modules) {
      if (m.part || !topics.length) {
        const name = m.part ?? 'Modules';
        const slug = slugify(name);
        if (topics.some((t) => t.slug === slug)) throw new Error(`${id}: two topics named "${name}"`);
        topics.push({ name, slug, href: `${base}/${slug}/`, index: topics.length, modules: [] });
      }
      const t = topics.at(-1);
      m.topic = t;
      m.href = `${t.href}#${m.anchor}`;
      t.modules.push(m);
    }
    topics.forEach((t, i) => { t.prev = topics[i - 1]; t.next = topics[i + 1]; });

    const hero = heroes[`../courses/${id}/hero.html`] ?? '';
    return {
      ...meta,
      id,
      base,
      allHref: `${base}/all/`,
      heroHtml: renderMath(hero, `${id}/hero.html`),
      modules,
      topics,
    };
  });
  return built;
}

export function getCourse(id) {
  const c = getCourses().find((x) => x.id === id);
  if (!c) throw new Error(`unknown course "${id}"`);
  return c;
}
