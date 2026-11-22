# Gametape Licks

Guitar lessons at gametapelicks.com. A static site built from `src/` into `dist/` with plain Node (no dependencies), hosted on AWS Amplify and deployed from this repository.

Lessons teach the why behind the notes and the pattern recognition to adapt to the band, the pace and the moment.

## Layout

```
src/
  site.json                 site name, home and about copy, method steps, topics, navigation
  css/site.css              the only stylesheet (brand tokens, light, dark and print)
  js/theory.js              chord parsing, spelling, routes, drills (pure functions, shared)
  js/fretboard.js           fretboard and tab renderers (shared)
  assets/                   fonts, logos, favicons, og.png
  lessons/<slug>/
    lesson.json             title, order, summary, intro, chips, topics, preview, pdf
    body.html               the lesson's sections
    lesson.js               optional page script for interactive lessons
    <name>.pdf              optional, made with npm run pdf
scripts/                    build, dev, new-lesson, make-pdf
tests/                      theory and site tests (node --test)
docs/brand/                 brand guide and logos (not deployed)
docs/seo-geo.md             SEO and GEO checklist, robots policy, measurement
amplify.yml                 Amplify build: node scripts/build.mjs, publishes dist/
customHttp.yml              response headers and caching
.cursor/rules/              project rules for Cursor
```

`dist/` is generated and ignored by git.

## Commands

Needs Node 18 or newer.

```
npm run dev                      preview at http://localhost:8000, rebuilds on save, shows drafts
npm test                         theory and site tests
npm run build                    build into dist/
npm run new-lesson -- <slug> "Title"
npm run pdf -- <slug>            render a lesson to PDF (first run: npm install && npx playwright install chromium)
```

## Add a lesson

1. `npm run new-lesson -- my-slug "My lesson title"`. This creates `src/lessons/my-slug/` as a draft with the next order number.
2. Edit `lesson.json` (copy for the cards and the lesson header) and `body.html` (the sections).
3. Each `<section id="..." data-toc="Label">` becomes an entry in the lesson's "On this page" list.
4. Topics come from `src/site.json`. Add new topics there.
5. For an interactive lesson, add `lesson.js` and set `"script": "lesson.js"` in `lesson.json`. Import shared helpers from `/assets/js/theory.js` and `/assets/js/fretboard.js`.
6. Remove `"draft": true` to publish. The home page, library, topic pages, previous and next links and the sitemap update by themselves.
7. `npm run pdf -- my-slug` writes the PDF next to the lesson. Commit it.

## Deploy (AWS Amplify)

Push to `main`. Amplify runs `node scripts/build.mjs` and publishes `dist/`.

If the app was created from the earlier version of this repo, open Amplify, then Hosting, then Build settings, and confirm it reads `amplify.yml` from the repository (the build artifacts base directory is `dist`). `customHttp.yml` stays in the repo root.

Pull requests run `npm test` through GitHub Actions (`.github/workflows/test.yml`).

## Brand

Brand guide v1.0 is in `docs/brand/`. Montserrat 600 and 700 for headlines, Inter for text, IBM Plex Mono for labels, tabs and chord entry. Sky Blue #49ADE1 is an accent. Use #1A6A9C for small blue text on light backgrounds.
