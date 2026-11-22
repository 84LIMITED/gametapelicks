import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-'));
const { urls, lessons } = build({ out });
const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) pages.push(p);
  }
})(out);

function resolves(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return true;
  const p = path.join(out, clean);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return fs.existsSync(path.join(p, 'index.html'));
  return fs.existsSync(p);
}

test('every internal link and asset resolves', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      assert.ok(resolves(m[1]), `${path.relative(out, file)} links to missing ${m[1]}`);
    }
  }
});

test('every page has a title, a description and exactly one h1', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(out, file);
    assert.match(html, /<title>[^<]+<\/title>/, rel);
    assert.match(html, /<meta name="description" content="[^"]+">/, rel);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${rel} should have one h1`);
    assert.ok(!/undefined|\[object/.test(html), `${rel} contains a template leak`);
  }
});

test('sitemap lists every page', () => {
  const sm = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  for (const u of urls) assert.ok(sm.includes(`https://gametapelicks.com${u}`), u);
});

test('each lesson has its page, ordered numbers and a table of contents', () => {
  assert.ok(lessons.length >= 1);
  const orders = lessons.map((l) => l.order);
  assert.equal(new Set(orders).size, orders.length, 'lesson order numbers must be unique');
  for (const l of lessons) {
    const html = fs.readFileSync(path.join(out, 'lessons', l.slug, 'index.html'), 'utf8');
    assert.ok(html.includes('class="toc-links"'), l.slug);
    for (const m of html.matchAll(/<a href="#([^"]+)">/g)) assert.ok(html.includes(`id="${m[1]}"`), `${l.slug}: missing section ${m[1]}`);
  }
});
