// Renders a lesson to PDF. Usage: npm run pdf -- <slug>
// Needs Playwright: npm install, then npx playwright install chromium (one time).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('Usage: npm run pdf -- <slug>'); process.exit(1); }
const lessonDir = path.join(ROOT, 'src', 'lessons', slug);
const meta = JSON.parse(fs.readFileSync(path.join(lessonDir, 'lesson.json'), 'utf8'));
const pdfName = meta.pdf || `${slug}.pdf`;

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Playwright is not installed. Run: npm install && npx playwright install chromium'); process.exit(1); }

const out = path.join(ROOT, 'dist');
build({ out, drafts: true });
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let f = path.join(out, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/lessons/${slug}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const target = path.join(lessonDir, pdfName);
  await page.pdf({
    path: target, format: 'Letter', printBackground: true,
    margin: { top: '0.6in', bottom: '0.7in', left: '0.7in', right: '0.7in' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#4A4F55;font-family:Arial,sans-serif">gametapelicks.com · ${meta.title} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`
  });
  console.log(`Wrote ${path.relative(ROOT, target)}`);
  if (!meta.pdf) console.log(`Add "pdf": "${pdfName}" to lesson.json so the lesson page links to it.`);
} finally { await browser.close(); server.close(); }
