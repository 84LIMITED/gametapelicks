import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-seo-'));
const { urls, lessons } = build({ out });
const read = (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
const pageFile = (u) => path.join(u === '/' ? '' : u.replace(/^\//, ''), 'index.html');

test('every indexable page has a sized title and description, a matching canonical and valid JSON-LD', () => {
  for (const u of urls) {
    const html = read(pageFile(u));
    const title = /<title>([^<]+)<\/title>/.exec(html)[1];
    const desc = /<meta name="description" content="([^"]+)">/.exec(html)[1];
    assert.ok(title.length <= 70, `${u} title is ${title.length} characters`);
    assert.ok(desc.length >= 40 && desc.length <= 175, `${u} description is ${desc.length} characters`);
    assert.ok(html.includes(`<link rel="canonical" href="https://gametapelicks.com${u}">`), `${u} canonical`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

test('titles are unique across the site', () => {
  const seen = new Map();
  for (const u of urls) {
    const t = /<title>([^<]+)<\/title>/.exec(read(pageFile(u)))[1];
    assert.ok(!seen.has(t), `${u} repeats the title of ${seen.get(t)}`);
    seen.set(t, u);
  }
});

test('lesson pages carry Article and BreadcrumbList data, a visible updated date and quick answers', () => {
  for (const l of lessons) {
    const html = read(`lessons/${l.slug}/index.html`);
    const types = [...html.matchAll(/"@type":"(Article|BreadcrumbList)"/g)].map((m) => m[1]);
    assert.ok(types.includes('Article') && types.includes('BreadcrumbList'), l.slug);
    assert.ok(html.includes(`<time datetime="${l.updated}">`), `${l.slug} needs a visible updated date`);
    assert.ok(html.includes('id="faq"'), `${l.slug} needs a quick answers section (id="faq")`);
  }
});

test('robots.txt, llms.txt and the sitemap agree', () => {
  assert.match(read('robots.txt'), /Sitemap: https:\/\/gametapelicks\.com\/sitemap\.xml/);
  const llms = read('llms.txt'), sm = read('sitemap.xml');
  for (const l of lessons) {
    assert.ok(llms.includes(`/lessons/${l.slug}/`), `${l.slug} missing from llms.txt`);
    assert.ok(sm.includes(`<loc>https://gametapelicks.com/lessons/${l.slug}/</loc><lastmod>${l.updated}</lastmod>`), `${l.slug} lastmod`);
  }
});

test('topics without lessons are not built or listed', () => {
  const sm = read('sitemap.xml');
  assert.ok(!fs.existsSync(path.join(out, 'topics/rhythm')) || lessons.some((l) => l.topics.includes('rhythm')));
  assert.ok(!sm.includes('/topics/rhythm/') || lessons.some((l) => l.topics.includes('rhythm')));
});

test('the 404 page is not indexable', () => {
  assert.match(read('404.html'), /<meta name="robots" content="noindex">/);
});
