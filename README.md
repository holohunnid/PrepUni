# PrepUSI · Study Hub

Study site for the MSc Finance assessment. Astro static site, one course per folder, deployable to Vercel.

**Courses:** Prep Exam Review · MSc Statistics · Refresher (Linear Algebra, Probability) · Linear Algebra · Probability · Calculus · Optimization

## Commands

```
npm install        # once, after cloning
npm run dev        # dev server at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Structure

```
src/
  lib/
    courses.js                 course registry (id → URL) and loader: meta, hero, modules
    math.js                    build-time KaTeX: renders $...$ / $$...$$ in the fragments
  pages/
    index.astro                landing page (course list)
    refresher/index.astro      refresher hub
    statistics/index.astro     statistics hub
    [...path].astro            every course page, generated from src/lib/courses.js
  layouts/
    Base.astro                 <html> shell, fonts, KaTeX CSS, theme boot
    CourseLayout.astro         topbar, sidebar, footer shared by all course pages
  scripts/
    theme.js                   theme cycle (dark / light / solarized), every page
    course.js                  sidebar toggle, print, ← → keys, lazy-loads interactive.js
  styles/
    global.css                 terminal theme (dark / light / solar + print)
  courses/<id>/
    meta.json                  course title, tags, module list for the sidebar
    hero.html                  intro panel
    modules/01-name.html …     one HTML fragment per module: <section id="s1">…</section>
    interactive.js             the course's slider figures
legacy/
  linear-algebra-cheat-sheet_3.html   original single-file version (reference only)
```

Each course is published as three kinds of pages:

| URL | what |
|---|---|
| `/statistics/msc/` | overview: intro + topic index |
| `/statistics/msc/lecture-3-expectation-named-distributions/` | one **topic** per page (the sidebar groups), previous / next topic at the bottom, ← → keys |
| `/statistics/msc/all/` | every module on one page — for Ctrl+F and print / PDF |

Topics come from the `"part"` field in `meta.json`: a module with `"part"` starts a new topic (and a sidebar group); the modules after it belong to it. The topic's URL is its name, slugified. Old links like `/statistics/msc#s20` redirect to the right topic page and module.

### Why it is fast

- **Math is rendered at build time** (`src/lib/math.js`, same rules as KaTeX auto-render). The browser gets finished HTML and never downloads or runs KaTeX's ~265 KB of JavaScript.
- **One topic per page** instead of the whole course, with formulas already typeset.
- **Figures load per course, on demand**: `course.js` imports only that course's `interactive.js`, and skips it on the overview.
- **Prefetch on hover** (Astro `prefetch`) makes moving between modules near-instant; hashed assets in `/_astro/` are cached for a year (`vercel.json`).
- Topic pages and the one-page view use `content-visibility: auto`, so off-screen modules are not laid out until you scroll to them.

## Editing content

- **Fix or extend a module:** edit its file in `src/courses/<id>/modules/`. Math is written as `$inline$` / `$$display$$` and rendered when the site is built (no client-side KaTeX). Inside `<code>` / `<pre>` a `$` is left alone.
- **Add a module:** create `NN-something.html` (a `<section id="sNN">…</section>` following the existing pattern) and add its entry to `meta.json` → it lands on its topic's page and in the sidebar automatically. Give it a `"part"` to start a new topic. The build fails loudly if the section id is missing from `meta.json`.
- **Interactive figures:** `interactive.js` runs on every topic page of its course, so each figure must do nothing when its markup is absent (`const svg = document.getElementById('xxsvg'); if (!svg) return;`).
- **Add a course:** create `src/courses/<id>/` with the files above, add `{ id, base }` to `COURSES` in `src/lib/courses.js`, and add a card to the right hub page.

## Deploying (GitHub + Vercel)

1. Create an empty repo on GitHub, then:
   ```
   git remote add origin https://github.com/<you>/prepusi.git
   git push -u origin main
   ```
2. On vercel.com: **Add New → Project**, import the repo. Vercel auto-detects Astro; accept the defaults and deploy.
3. Every `git push` redeploys automatically; branches get preview URLs.
