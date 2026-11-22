// Builds the static site from src/ into dist/. No dependencies. Run: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOTS, esc as escHtml, thirdsMarks } from '../src/js/theory.js';
import { board } from '../src/js/fretboard.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const e = (s) => escHtml(String(s ?? ''));
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function loadLessons(site, { drafts = false } = {}) {
  const dir = path.join(SRC, 'lessons');
  const topicSlugs = new Set(site.topics.map((t) => t.slug));
  const lessons = [];
  for (const slug of fs.readdirSync(dir)) {
    const jp = path.join(dir, slug, 'lesson.json');
    if (!fs.existsSync(jp)) continue;
    const j = readJson(jp);
    for (const k of ['title', 'order', 'kicker', 'summary', 'description', 'intro', 'topics', 'published', 'updated']) {
      if (j[k] === undefined) throw new Error(`${slug}/lesson.json is missing "${k}"`);
    }
    if (j.draft && !drafts) continue;
    for (const t of j.topics) if (!topicSlugs.has(t)) throw new Error(`${slug}/lesson.json uses unknown topic "${t}". Add it to src/site.json.`);
    if (!fs.existsSync(path.join(dir, slug, 'body.html'))) throw new Error(`${slug}/body.html is missing`);
    lessons.push({ ...j, slug, dir: path.join(dir, slug) });
  }
  return lessons.sort((a, b) => a.order - b.order);
}

/* ---------- shared pieces ---------- */
const LOGO_DARK = '/assets/brand/gametapelicks-dark.png';
const LOGO_LIGHT = '/assets/brand/gametapelicks-light.webp';

function shell(site, { title, description, url, nav, body, scripts = '', bodyClass = '', noindex = false, ogType = 'website', jsonld = [] }) {
  const full = site.domain + url;
  const navHtml = site.nav.map((n) => `<a href="${n.href}"${nav === n.href ? ' aria-current="page"' : ''}>${e(n.label)}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : '<meta name="robots" content="index, follow, max-image-preview:large">\n'}<meta name="theme-color" content="#151A20">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="canonical" href="${full}">
<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="${e(site.name)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${full}">
<meta property="og:image" content="${site.domain}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(description)}">
<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
<link rel="preload" href="/assets/fonts/montserrat-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="/" aria-label="${e(site.name)} home"><img src="${LOGO_DARK}" width="220" height="71" alt="${e(site.name)}"></a>
<button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg></button>
<nav class="site-nav" id="site-nav" aria-label="Site">${navHtml}</nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="wrap">
<img src="${LOGO_DARK}" width="180" height="58" alt="${e(site.name)}">
<nav aria-label="Footer">${site.nav.map((n) => `<a href="${n.href}">${e(n.label)}</a>`).join('')}</nav>
<p>gametapelicks.com · ${e(site.tagline)}</p>
</div></footer>
<script>
(function(){var b=document.querySelector('.menu-btn'),n=document.getElementById('site-nav');if(!b)return;
b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu');});})();
</script>
${scripts}
</body>
</html>
`;
}

function legend() {
  return '<div class="legend"><span><i class="l-R"></i>Root</span><span><i class="l-3"></i>Major 3rd, filled</span><span><i class="l-3m"></i>Minor 3rd, ring</span></div>';
}

function previewBoard(lesson, W) {
  const p = lesson.preview;
  if (!p || p.type !== 'thirds') return '';
  const R = ROOTS.find((r) => r.n === p.root) || ROOTS[0];
  const { marks, majName, minName } = thirdsMarks(R, 8, 18, false);
  const svg = board(marks, { lo: 8, hi: 18, aria: `Roots and 3rds of ${R.n} on frets 8 to 18` });
  return `<figure class="panel">${svg}<figcaption>${R.n} with ${majName} is ${R.n} major. ${R.n} with ${minName} is ${R.n} minor. Frets 8 to 18.</figcaption></figure>`;
}

function breadcrumb(site, trail) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.domain + url })) };
}
const orgNode = (site) => ({ '@type': 'Organization', '@id': `${site.domain}/#org`, name: site.name, url: site.domain + '/',
  logo: site.domain + (site.org?.logo || '/favicon-192.png'), ...(site.org?.sameAs?.length ? { sameAs: site.org.sameAs } : {}) });
const authorNode = (site) => (site.author ? { '@type': 'Person', name: site.author.name, ...(site.author.url ? { url: site.author.url } : {}) } : orgNode(site));
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const lessonUrl = (l) => `/lessons/${l.slug}/`;
const topicName = (site, slug) => (site.topics.find((t) => t.slug === slug) || { name: slug }).name;

/* ---------- pages ---------- */
function homePage(site, lessons) {
  const first = lessons[0];
  const rest = lessons.slice(1, 3);
  const steps = site.method.steps.map((s, i) => `<div class="card"><span class="kicker">0${i + 1}</span><h3>${e(s.title)}</h3><p>${e(s.body)}</p></div>`).join('');
  const heroBoard = first ? `<div class="figure">${previewBoard(first)}${legend().replace('class="legend"', 'class="legend" style="color:#C5CAD0;margin-top:14px"')}</div>` : '';
  const feature = first ? `<section aria-labelledby="start" class="feature">
<div class="copy"><p class="kicker" style="color:#49ADE1">${e(first.kicker)}</p>
<h2 id="start">${e(first.title)}</h2><p>${e(first.intro[0])}</p>
<p class="meta">${(first.tags || []).map(e).join(' · ')}</p>
<div class="actions"><a class="btn btn-primary" href="${lessonUrl(first)}">Open the lesson</a></div></div>
<div class="figure">${previewBoard(first)}</div></section>` : '';
  const more = rest.map((l) => `<article class="card"><p class="kicker">${e(l.kicker)}</p><h3><a href="${lessonUrl(l)}" style="color:inherit;text-decoration:none">${e(l.title)}</a></h3><p>${e(l.summary)}</p></article>`).join('')
    + `<article class="card soft"><p class="kicker" style="color:var(--muted)">More on the way</p><h3>New lessons are added as they are finished</h3><p>Each one takes a single idea and trains the pattern behind it.</p></article>`;
  const topics = site.topics.map((t) => `<a class="pill" href="/topics/${t.slug}/">${e(t.name)}</a>`).join('');
  const body = `<section class="band hero"><div class="wrap">
<div class="copy"><p class="kicker">${e(site.home.kicker)}</p><h1>${e(site.home.title)}</h1><p class="lede">${e(site.home.lede)}</p>
<div class="actions">${first ? `<a class="btn btn-primary" href="${lessonUrl(first)}">Start with Lesson 1</a>` : ''}<a class="btn btn-ghost" href="#method">How a lesson works</a></div></div>
${heroBoard}</div></section>
<section class="section" id="method"><div class="wrap"><div class="section-head"><p class="kicker">${e(site.method.kicker)}</p><h2>${e(site.method.title)}</h2><p class="lede">${e(site.method.body)}</p></div>
<div class="grid">${steps}</div></div></section>
<section class="section"><div class="wrap"><div class="row-head"><h2>Start here</h2><a href="/lessons/" style="font-weight:600">All lessons</a></div>${feature}<div class="grid">${more}</div></div></section>
<section class="section"><div class="wrap"><h2 style="font-size:1.75rem">Browse by topic</h2><div style="display:flex;flex-wrap:wrap;gap:12px">${topics}</div></div></section>`;
  return shell(site, { title: site.home.seoTitle || `${site.name} | ${site.home.title}`, description: site.description, url: '/', nav: '/', body,
    jsonld: [{ '@context': 'https://schema.org', '@graph': [orgNode(site), { '@type': 'WebSite', '@id': `${site.domain}/#site`, url: site.domain + '/', name: site.name, description: site.description, publisher: { '@id': `${site.domain}/#org` }, inLanguage: 'en' }] }] });
}

function lessonRow(site, l) {
  return `<article class="card row lesson-row" data-search="${e((l.title + ' ' + l.summary + ' ' + (l.tags || []).join(' ')).toLowerCase())}">
<div class="copy"><p class="kicker">${e(l.kicker.split(' · ')[0])}${l.interactive === false ? '' : ' · Interactive'}</p>
<h2><a href="${lessonUrl(l)}">${e(l.title)}</a></h2><p>${e(l.summary)}</p><p class="tags">${(l.tags || []).map(e).join(' · ')}</p>
<div class="links"><a class="btn btn-dark" href="${lessonUrl(l)}">Open the lesson</a>${l.pdf ? `<a class="text" href="${lessonUrl(l)}${l.pdf}">Download the PDF</a>` : ''}</div></div>
<div class="figure">${previewBoard(l)}</div></article>`;
}

function listPage(site, lessons, { url, title, lede, active, heading, description }) {
  const side = [`<a href="/lessons/"${active === 'all' ? ' aria-current="true"' : ''}>All lessons</a>`]
    .concat(site.topics.map((t) => `<a href="/topics/${t.slug}/"${active === t.slug ? ' aria-current="true"' : ''}>${e(t.name)}</a>`)).join('');
  const rows = lessons.length ? lessons.map((l) => lessonRow(site, l)).join('')
    : '<div class="card soft"><h3>Lessons for this topic are on the way</h3><p>New lessons are added as they are finished.</p></div>';
  const body = `<section class="band page-band"><div class="wrap"><p class="kicker">${e(heading)}</p><h1>${e(title)}</h1><p class="lede">${e(lede)}</p></div></section>
<div class="wrap section"><div class="layout">
<aside class="sidebar" aria-label="Topics"><p class="kicker">Topics</p>${side}</aside>
<div class="stack"><div class="search noprint"><label for="q">Search</label><input id="q" type="text" placeholder="Search lessons" autocomplete="off"></div>
<p class="note" id="none" hidden>No lessons match that search.</p>${rows}</div></div></div>
<script>
(function(){var q=document.getElementById('q'),rows=[].slice.call(document.querySelectorAll('.lesson-row')),none=document.getElementById('none');
q.addEventListener('input',function(){var v=q.value.trim().toLowerCase(),n=0;rows.forEach(function(r){var m=!v||r.getAttribute('data-search').indexOf(v)>-1;r.hidden=!m;if(m)n++;});none.hidden=n>0||!rows.length;});})();
</script>`;
  const trail = [['Home', '/'], ['Lessons', '/lessons/']].concat(url === '/lessons/' ? [] : [[title, url]]);
  return shell(site, { title: `${title} | ${site.name}`, description: description || lede, url, nav: '/lessons/', body, jsonld: [breadcrumb(site, trail)] });
}

function topicsIndex(site, lessons) {
  const cards = site.topics.map((t) => {
    const n = lessons.filter((l) => l.topics.includes(t.slug)).length;
    return `<a class="card" href="/topics/${t.slug}/" style="text-decoration:none"><h3 style="color:var(--ink)">${e(t.name)}</h3><p>${n ? n + (n === 1 ? ' lesson' : ' lessons') : 'Lessons on the way'}</p></a>`;
  }).join('');
  const body = `<section class="band page-band"><div class="wrap"><p class="kicker">Topics</p><h1>Pick the skill you want to build.</h1><p class="lede">Every lesson belongs to a topic, so you can stay with one skill until it feels natural.</p></div></section>
<div class="wrap section"><div class="grid">${cards}</div></div>`;
  return shell(site, { title: `Topics | ${site.name}`, description: 'Browse Gametape Licks guitar lessons by topic.', url: '/topics/', nav: '/topics/', body, jsonld: [breadcrumb(site, [['Home', '/'], ['Topics', '/topics/']])] });
}

function aboutPage(site) {
  const a = site.author;
  const author = a ? `<div class="card soft" id="author"><p class="kicker">The author</p><h2 style="font-size:1.5rem">${e(a.name)}</h2>${a.bio.map((p) => `<p>${e(p)}</p>`).join('')}<p><a href="${e(a.url)}" rel="author">${e(a.url.replace('https://', ''))}</a>${(a.links || []).map((l) => ` · <a href="${e(l.url)}" rel="me noopener">${e(l.label)}</a>`).join('')}${(site.org.sameAs || []).filter((u) => u !== a.url && !(a.links || []).some((l) => l.url === u)).map((u) => ` · <a href="${e(u)}" rel="me noopener">${e(u.includes('linkedin') ? 'LinkedIn' : u.includes('x.com') ? 'X' : u.replace(/^https?:\/\/(www\.)?/, ''))}</a>`).join('')}</p></div>` : '';
  const body = `<section class="band page-band"><div class="wrap"><p class="kicker">About</p><h1>${e(site.about.title)}</h1></div></section>
<div class="wrap section"><div style="display:grid;gap:20px;max-width:680px">${site.about.paragraphs.map((p) => `<p class="lede" style="color:var(--ink)">${e(p)}</p>`).join('')}${author}</div></div>`;
  return shell(site, { title: `About | ${site.name}`, description: site.description, url: '/about/', nav: '/about/', body, jsonld: [breadcrumb(site, [['Home', '/'], ['About', '/about/']])] });
}

function notFound(site) {
  const body = `<section class="band page-band"><div class="wrap"><p class="kicker">404</p><h1>That page is not here.</h1><p class="lede">Head back to the lessons and pick up from there.</p><div class="actions"><a class="btn btn-primary" href="/lessons/">All lessons</a></div></div></section>`;
  return shell(site, { title: `Page not found | ${site.name}`, description: 'Page not found.', url: '/404.html', nav: '', body, noindex: true });
}

function lessonPage(site, lessons, i) {
  const l = lessons[i], prev = lessons[i - 1], next = lessons[i + 1];
  let html = fs.readFileSync(path.join(l.dir, 'body.html'), 'utf8');
  const toc = [...html.matchAll(/<section id="([^"]+)" data-toc="([^"]+)"/g)].map((m) => ({ id: m[1], label: m[2] }));
  const links = toc.map((t) => `<a href="#${t.id}">${e(t.label)}</a>`).join('');
  const opts = toc.map((t) => `<option value="${t.id}">${e(t.label)}</option>`).join('');
  const pager = `<nav class="pager" aria-label="More lessons">
${prev ? `<a href="${lessonUrl(prev)}"><span class="kicker">Previous</span><span>${e(prev.title)}</span></a>` : `<a href="/lessons/"><span class="kicker">Previous</span><span>Back to all lessons</span></a>`}
${next ? `<a class="next" href="${lessonUrl(next)}"><span class="kicker">Next</span><span>${e(next.title)}</span></a>` : `<a class="next" href="/lessons/"><span class="kicker">Next</span><span>More lessons are on the way</span></a>`}</nav>`;
  const body = `<div class="printbrand wrap"><img src="${LOGO_LIGHT}" alt="${e(site.name)}"></div>
<section class="band lesson-hero"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/lessons/">Lessons</a><span aria-hidden="true">/</span><span aria-current="page">${e(l.title)}</span></nav>
<p class="kicker">${e(l.kicker)}</p><h1>${e(l.title)}</h1>
<p class="lede">${e(l.intro[0])}</p>${l.intro.slice(1).map((p) => `<p class="more">${e(p)}</p>`).join('')}
<div class="chips-meta">${(l.chips || []).map((c) => `<span class="pill on-deep">${e(c)}</span>`).join('')}</div>
<p class="updated">${site.author ? `By ${e(site.author.name)} · ` : ''}Updated <time datetime="${l.updated}">${fmtDate(l.updated)}</time></p></div></section>
<div class="wrap lesson-wrap">
<aside class="toc" aria-label="On this page"><p class="kicker">On this page</p><nav class="toc-links">${links}</nav>
<div class="jump noprint"><label for="jump">Jump to section</label><select id="jump">${opts}</select></div>
${l.pdf ? `<button class="btn btn-line noprint" id="printBtn" type="button">Print or save as PDF</button>` : ''}</aside>
<article class="lesson-body">${html}
${l.pdf ? `<p class="note pdflink noprint">Prefer a fixed copy? <a href="${l.pdf}">Download the PDF of the 12-bar blues example</a>.</p>` : ''}
${pager}</article></div>
<script>
(function(){var j=document.getElementById('jump');if(j)j.addEventListener('change',function(){location.hash=j.value;});
var links=[].slice.call(document.querySelectorAll('.toc-links a'));if(!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+x.target.id);});}});},{rootMargin:'-20% 0px -70% 0px'});
document.querySelectorAll('.lesson-body > section').forEach(function(s){io.observe(s);});})();
</script>`;
  const scripts = l.script ? `<script type="module" src="${lessonUrl(l)}${l.script}"></script>` : '';
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: l.title, description: l.description, url: site.domain + lessonUrl(l),
    mainEntityOfPage: site.domain + lessonUrl(l), image: site.domain + '/og.png', datePublished: l.published, dateModified: l.updated, inLanguage: 'en',
    author: authorNode(site), publisher: orgNode(site), keywords: (l.tags || []).join(', '), articleSection: l.topics.map((t) => topicName(site, t)).join(', ') };
  return shell(site, { title: l.seoTitle || `${l.title} | ${site.name}`, description: l.description, url: lessonUrl(l), nav: '/lessons/', body, scripts, ogType: 'article',
    jsonld: [article, breadcrumb(site, [['Home', '/'], ['Lessons', '/lessons/'], [l.title, lessonUrl(l)]])] });
}

/* ---------- build ---------- */
export function build({ out = path.join(ROOT, 'dist'), drafts = false } = {}) {
  const site = readJson(path.join(SRC, 'site.json'));
  const lessons = loadLessons(site, { drafts });
  // Topics without a published lesson stay out of the site until they have one (no thin pages).
  site.topics = site.topics.filter((t) => lessons.some((l) => l.topics.includes(t.slug)));
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const write = (rel, content) => {
    const p = path.join(out, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  };
  // static assets
  fs.cpSync(path.join(SRC, 'assets'), path.join(out, 'assets'), { recursive: true });
  for (const f of ['favicon-32.png', 'favicon-180.png', 'favicon-192.png', 'og.png']) {
    fs.renameSync(path.join(out, 'assets', f), path.join(out, f));
  }
  fs.cpSync(path.join(SRC, 'css'), path.join(out, 'assets', 'css'), { recursive: true });
  fs.cpSync(path.join(SRC, 'js'), path.join(out, 'assets', 'js'), { recursive: true });
  // pages
  write('index.html', homePage(site, lessons));
  write('lessons/index.html', listPage(site, lessons, { url: '/lessons/', title: site.library.title, lede: site.library.lede, active: 'all', heading: 'Lessons' }));
  write('topics/index.html', topicsIndex(site, lessons));
  for (const t of site.topics) {
    const ls = lessons.filter((l) => l.topics.includes(t.slug));
    write(`topics/${t.slug}/index.html`, listPage(site, ls, { url: `/topics/${t.slug}/`, title: t.name, lede: t.blurb, description: `${t.blurb} Guitar lessons from Gametape Licks.`, active: t.slug, heading: 'Topic' }));
  }
  write('about/index.html', aboutPage(site));
  write('404.html', notFound(site));
  lessons.forEach((l, i) => {
    write(`lessons/${l.slug}/index.html`, lessonPage(site, lessons, i));
    if (l.script) fs.copyFileSync(path.join(l.dir, l.script), path.join(out, 'lessons', l.slug, l.script));
    if (l.pdf && fs.existsSync(path.join(l.dir, l.pdf))) fs.copyFileSync(path.join(l.dir, l.pdf), path.join(out, 'lessons', l.slug, l.pdf));
  });
  // sitemap, robots and llms.txt
  const urls = ['/', '/lessons/', '/topics/', '/about/'].concat(site.topics.map((t) => `/topics/${t.slug}/`), lessons.map(lessonUrl));
  const mod = Object.fromEntries(lessons.map((l) => [lessonUrl(l), l.updated]));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${site.domain}${u}</loc>${mod[u] ? `<lastmod>${mod[u]}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
  write('robots.txt', `# Everyone is welcome, including search engines and AI answer engines, so the lessons can be found and cited.\n# To keep lessons out of AI model training, see docs/seo-geo.md.\nUser-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`);
  write('llms.txt', `# ${site.name}\n\n> ${site.description}\n\n## Lessons\n\n${lessons.map((l) => `- [${l.title}](${site.domain}${lessonUrl(l)}): ${l.description}`).join('\n')}\n\n## Topics\n\n${site.topics.map((t) => `- [${t.name}](${site.domain}/topics/${t.slug}/)`).join('\n')}\n\n## About\n\n- [About ${site.name}](${site.domain}/about/)\n`);
  return { out, lessons, urls };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const drafts = process.argv.includes('--drafts');
  const r = build({ drafts });
  console.log(`Built ${r.urls.length} pages and ${r.lessons.length} lesson${r.lessons.length === 1 ? '' : 's'} into dist/`);
}
