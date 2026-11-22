// Scaffolds a new lesson. Usage: npm run new-lesson -- <slug> "Lesson title"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [slug, ...rest] = process.argv.slice(2);
const title = rest.join(' ').trim();
if (!slug || !title || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new-lesson -- <slug-in-lowercase-with-dashes> "Lesson title"');
  process.exit(1);
}
const dir = path.join(ROOT, 'src', 'lessons', slug);
if (fs.existsSync(dir)) { console.error(`src/lessons/${slug} already exists.`); process.exit(1); }

const lessonsDir = path.join(ROOT, 'src', 'lessons');
let order = 0;
for (const d of fs.readdirSync(lessonsDir)) {
  const jp = path.join(lessonsDir, d, 'lesson.json');
  if (fs.existsSync(jp)) order = Math.max(order, JSON.parse(fs.readFileSync(jp, 'utf8')).order || 0);
}
order += 1;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'lesson.json'), JSON.stringify({
  title,
  order,
  draft: true,
  kicker: `Lesson ${order} · [Skill]`,
  summary: '[Two sentences for the lesson cards: the idea, then what the reader will be able to do.]',
  description: '[One sentence for search results and link previews.]',
  intro: ['[Opening paragraph: the idea and why it matters in the moment.]'],
  chips: ['[Fact one]', '[Fact two]'],
  tags: ['[Topic]'],
  topics: ['chord-tones'],
  preview: { type: 'thirds', root: 'C' },
  pdf: `${title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'body.html'), `<section id="idea" data-toc="The idea">
  <p class="kicker">01 · The idea</p>
  <h2>[Heading that states the idea]</h2>
  <p>[Explain why it works, in plain language.]</p>
</section>

<section id="pattern" data-toc="The pattern">
  <p class="kicker">02 · The pattern</p>
  <h2>[Heading that states the pattern]</h2>
  <p>[Show where it repeats across keys, progressions and major or minor.]</p>
</section>

<section id="practice" data-toc="Practice path">
  <p class="kicker">03 · Put it to work</p>
  <h2>Practice path</h2>
  <ol class="steps">
    <li>[Step one]</li>
    <li>[Step two]</li>
  </ol>
</section>
`);
console.log(`Created src/lessons/${slug}/ (order ${order}, marked as a draft).`);
console.log('Next: run "npm run dev" to preview it, edit lesson.json and body.html, then remove "draft": true to publish.');
console.log('Topics come from src/site.json. Add a "lesson.js" file and a "script": "lesson.js" entry in lesson.json for interactive lessons.');
