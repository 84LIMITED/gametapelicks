# Gametape Licks

Guitar lessons at gametapelicks.com. A static site built from `src/` into `dist/` with plain Node (no dependencies), hosted on AWS Amplify and deployed from this repository.

Lessons teach the chord tone, what it does against the chord, and where it shows up again. Game Tape is the same idea on a real solo: a video, cued to the moment, linked back to the lesson.

## Layout

```
src/
  site.json                 site name, home and about copy, method steps, topics, navigation
  css/site.css              main stylesheet (brand tokens, light, dark and print)
  css/tape.css              Game Tape pages, the home promo, and the lesson tape link
  js/theory.js              chord parsing, spelling, routes, drills (pure functions, shared)
  js/fretboard.js           fretboard and tab renderers (shared)
  js/pentatonic.js          minor and major pentatonic boxes, shared by lesson 3
  assets/                   fonts, logos, favicons, og.png
  assets/tape/              self-hosted clip files, when a clip is not a YouTube embed
  lessons/<slug>/
    lesson.json             title, order, summary, intro, chips, topics, preview, pdf
    body.html               the lesson's sections
    lesson.js               optional page script for interactive lessons
    <name>.pdf              optional, made with npm run pdf
  tape/<name>.json          one Game Tape clip. The file name is the URL: /tape/<name>/
scripts/                    build, dev, new-lesson, make-pdf
tests/                      theory, site, pentatonic and tape tests (node --test)
docs/brand/                 brand guide and logos (not deployed)
docs/seo-geo.md             SEO and GEO checklist, robots policy, measurement
docs/game-tape.md           how to add a clip, rights, and open checks
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

## Add a Game Tape clip

Full notes are in `docs/game-tape.md`.

1. Copy a file in `src/tape/` and rename it. The file name is the page: `/tape/<file-name>/`.
2. Set the video. YouTube: `"video": { "type": "youtube", "id": "VIDEO_ID", "start": "2:02" }`. Your own file: put it in `src/assets/tape/` and use `"video": { "type": "file", "src": "/assets/tape/name.mp4", "poster": "/assets/tape/name.jpg", "uploadDate": "2026-11-23" }`.
3. Set `"lesson"` to the lesson folder name. The clip links to that lesson. The lesson links back, including a "Watch the Game Tape" button in the header.
4. Put checked timestamps in `watchFor`. Delete `"draft": true` to publish.
5. Published clips appear in the menu, on the home page, on the lesson, and in the sitemap. Drafts stay off the live site. `npm run dev` and `node scripts/build.mjs --drafts` show them.

Embed official uploads from the artist or label. Host a file yourself only when you shot it.

## Deploy (AWS Amplify)

Push to `main`. Amplify runs `node scripts/build.mjs` and publishes `dist/`.

If the app was created from the earlier version of this repo, open Amplify, then Hosting, then Build settings, and confirm it reads `amplify.yml` from the repository (the build artifacts base directory is `dist`). `customHttp.yml` stays in the repo root.

Pull requests run `npm test` through GitHub Actions (`.github/workflows/test.yml`).

## Brand

Brand guide v1.0 is in `docs/brand/`. Montserrat 600 and 700 for headlines, Inter for text, IBM Plex Mono for labels, tabs and chord entry. Sky Blue #49ADE1 is an accent. Use #1A6A9C for small blue text on light backgrounds.
