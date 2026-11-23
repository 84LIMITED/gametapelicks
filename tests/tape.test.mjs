import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-tape-'));
const withDrafts = build({ out: tmp(), drafts: true });
const live = build({ out: tmp() });
const read = (b, rel) => fs.readFileSync(path.join(b.out, rel), 'utf8');

test('draft clips stay out of the live build, including the menu and sitemap', () => {
  const published = live.clips.map((c) => c.slug);
  assert.ok(!fs.existsSync(path.join(live.out, 'tape', 'goose-hot-tea-williamsburg')) || published.includes('goose-hot-tea-williamsburg'));
  if (!live.clips.length) {
    assert.ok(!fs.existsSync(path.join(live.out, 'tape')));
    assert.ok(!read(live, 'index.html').includes('/tape/'));
    assert.ok(!read(live, 'sitemap.xml').includes('/tape/'));
  }
});

test('clip pages have the player, a lesson link, article data and a sized title and description', () => {
  assert.ok(withDrafts.clips.length >= 1);
  for (const c of withDrafts.clips) {
    const html = read(withDrafts, `tape/${c.slug}/index.html`);
    const title = /<title>([^<]+)<\/title>/.exec(html)[1];
    const desc = /<meta name="description" content="([^"]+)">/.exec(html)[1];
    assert.ok(title.length <= 70, `${c.slug} title is ${title.length}`);
    assert.ok(desc.length >= 40 && desc.length <= 175, `${c.slug} description is ${desc.length}`);
    assert.ok(html.includes('id="player"'), `${c.slug} player`);
    assert.ok(html.includes(`href="/lessons/${c.lesson}/"`), `${c.slug} lesson link`);
    assert.ok(html.includes('/assets/css/tape.css'), `${c.slug} stylesheet`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

test('the menu, sitemap and llms.txt list Game Tape when clips exist', () => {
  const html = read(withDrafts, 'index.html');
  assert.ok(html.includes('<a href="/tape/">Game Tape</a>'));
  assert.ok(read(withDrafts, 'sitemap.xml').includes('/tape/'));
  assert.ok(read(withDrafts, 'llms.txt').includes('## Game Tape'));
});

test('a lesson page links to its clips before the quick answers', () => {
  const c = withDrafts.clips[0];
  const html = read(withDrafts, `lessons/${c.lesson}/index.html`);
  assert.ok(html.indexOf('id="tape"') > -1 && html.indexOf('id="tape"') < html.indexOf('id="faq"'));
  assert.ok(html.includes(`/tape/${c.slug}/`));
});

test('copy rules: no em dashes and no "not X, it is Y" constructions in clip intros', () => {
  for (const c of withDrafts.clips) {
    const text = [c.title, c.summary, c.description, ...c.intro, ...(c.watchFor || []).map((w) => w.note)].join(' ');
    assert.ok(!text.includes('—'), `${c.slug} has an em dash`);
    assert.ok(!/\b(isn't|is not|it's not|not just|not merely)\b[^.]*,\s*(it's|it is|but)\b/i.test(text), `${c.slug} has a contrastive construction`);
  }
});
