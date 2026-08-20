# PrepUSI · Study Hub

Study site for the MSc Finance assessment. Astro static site, one course per folder, deployable to Vercel.

**Courses:** Linear Algebra (live) · Statistics (planned) · Probability (planned)

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
  pages/
    index.astro                landing page (course list)
    linear-algebra.astro       course page (assembles hero + modules)
  layouts/
    Base.astro                 <html> shell, fonts, KaTeX CSS, theme boot
    CourseLayout.astro         topbar, sidebar, footer shared by all courses
  scripts/
    course.js                  KaTeX rendering, theme cycle, sidebar toggle,
                               nav highlight (theme + sidebar persisted in localStorage)
  styles/
    global.css                 terminal theme (dark / light / solarized + print)
  courses/linear-algebra/
    meta.json                  course title, tags, module list for the sidebar
    hero.html                  intro panel
    modules/01-vectors.html …  one HTML fragment per module (verbatim content)
    interactive.js             the three slider figures (determinant, eigen, quadratic form)
legacy/
  linear-algebra-cheat-sheet_3.html   original single-file version (reference only)
```

## Editing content

- **Fix or extend a module:** edit the corresponding file in `src/courses/linear-algebra/modules/`. Math is written as `$inline$` / `$$display$$` and rendered by KaTeX in the browser (bundled locally, no CDN).
- **Add a module:** create `13-something.html` (a `<section id="s13">…</section>` following the existing pattern) and add its entry to `meta.json` → it appears in the sidebar automatically.
- **Add a course:** copy the `linear-algebra` folder pattern under `src/courses/`, add a page in `src/pages/`, and add a card to `src/pages/index.astro`. New courses can also be written in MDX (`@astrojs/mdx` + remark-math + rehype-katex are configured, math rendered at build time).

## Deploying (GitHub + Vercel)

1. Create an empty repo on GitHub, then:
   ```
   git remote add origin https://github.com/<you>/prepusi.git
   git push -u origin main
   ```
2. On vercel.com: **Add New → Project**, import the repo. Vercel auto-detects Astro; accept the defaults and deploy.
3. Every `git push` redeploys automatically; branches get preview URLs.
