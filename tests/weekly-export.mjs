// Publishes the Weekly plan as data for the App Store app (public/weekly/): index.json lists week -> model name, and
// <week>.json holds that model's picture(s) as PNG and its settings (size, shape, special piece, story line). The app
// fetches these, so a new Weekly reaches it without an app update. Data only, never code.
// Run after changing WEEKLY_PLAN or a Weekly's model, and commit public/weekly with it:
//   PLAYWRIGHT_CHROMIUM=/path/to/chrome node tests/weekly-export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start } from './devserver.mjs';
const { chromium } = await import('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'public', 'weekly');
const PORT = 8796, server = await start(PORT);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const ctx = await browser.newContext();
  await ctx.route('**/*', (r) => { const u = r.request().url(), f = ['three.min.js', 'OrbitControls.js', 'BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return r.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (!u.startsWith(`http://localhost:${PORT}/`)) return r.fulfill({ status: 200, body: '', contentType: /fonts/.test(u) ? 'text/css' : 'text/plain' });
    return r.continue(); });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/game/?nosplash=1&welcome=0&films=0&lite3d=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => typeof window.bloppitWeeklyExport === 'function', null, { timeout: 60000 });
  const plan = await page.evaluate(() => window.bloppitWeeklyPlan());
  fs.mkdirSync(OUT, { recursive: true });
  const weeks = {};
  for (const week of Object.keys(plan).sort()) {
    const d = await page.evaluate((w) => window.bloppitWeeklyExport(w), week);
    if (!d) { console.warn('no model for', week, plan[week]); continue; }
    fs.writeFileSync(path.join(OUT, `${week}.json`), JSON.stringify(d) + '\n'); weeks[week] = d.name;
    console.log(week, d.name, d.views.map((v) => v.view).join('+'), Math.round(JSON.stringify(d).length / 1024) + ' KB');
  }
  for (const f of fs.readdirSync(OUT)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f) && !weeks[f.slice(0, 10)]) fs.rmSync(path.join(OUT, f));   // weeks no longer planned
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ v: 1, weeks }, null, 1) + '\n');
} finally { await browser.close(); server.close(); }
