// Play Blitz against a Longtail the way a player would (one brick at a time on the right spot, then Done) and
// report whether the Longtail ever gets stuck on his turn.
//   PLAYWRIGHT_CHROMIUM=/path/to/chrome node tests/blitz-repro.mjs [model=Heart] [races=3] [level=bzEasy]
import { chromium } from 'playwright';
import { start } from './devserver.mjs';

const [modelName = 'Heart', races = '3', level = 'bzEasy'] = process.argv.slice(2);
const PORT = 8797, server = await start(PORT);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
for (let r = 0; r < +races; r++) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.route('**/*', (q) => { const u = q.request().url();
    const f = ['three.min.js', 'OrbitControls.js', 'BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return q.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (/fonts\.g/.test(u)) return q.fulfill({ status: 200, body: '', contentType: 'text/css' });
    q.continue(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${PORT}/build/?nosplash=1&welcome=0&lite3d=1`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('[data-go="cpu"]').click());
  await page.waitForFunction((m) => [...document.getElementById('bzModel').options].some((o) => o.text.startsWith(m)), modelName, { timeout: 15000 });
  await page.evaluate(([m, lv]) => { const s = document.getElementById('bzModel'); const o = [...s.options].find((o) => o.text.startsWith(m)); s.value = o.value; s.dispatchEvent(new Event('change'));
    document.getElementById(lv).click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); }, [modelName, level]);
  await page.waitForTimeout(4500);
  let botSince = 0, stuck = null, last = '', lastChange = Date.now(), lastSig = '', maxGap = 0, botTurns = [];
  for (let tick = 0; tick < 600; tick++) {
    const st = await page.evaluate(() => ({ banner: document.getElementById('turnBanner').hidden ? '' : document.getElementById('turnBanner').className,
      text: document.getElementById('turnBanner').textContent.replace(/\s+/g, ' ').trim(), win: document.getElementById('winDlg').open,
      placed: document.getElementById('progTxt')?.textContent || '' }));
    if (st.win || (!st.banner && tick > 3)) break;
    const sig = st.banner + '|' + st.text.replace(/\d+:\d+\.\d/, '');
    if (sig !== lastSig) { if (/cpu/.test(lastSig)) maxGap = Math.max(maxGap, Date.now() - lastChange); lastSig = sig; lastChange = Date.now(); }
    if (!/cpu/.test(st.banner) && botSince) { botTurns.push(Date.now() - botSince); botSince = 0; }
    if (/cpu/.test(st.banner)) { botSince ||= Date.now(); if (Date.now() - botSince > 120000) { stuck = st.text; break; } await page.waitForTimeout(500); continue; }
    botSince = 0;
    if (/you/.test(st.banner)) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) { const ok = await page.evaluate(() => window.bloppitPlaceRight()); await page.waitForTimeout(900 + Math.random() * 700); if (!ok) break;
        if (!(await page.evaluate(() => /you/.test(document.getElementById('turnBanner').className)))) break; }
      await page.evaluate(() => { const b = document.getElementById('mpEndTurn'); if (!b.hidden) b.click(); });
      await page.waitForTimeout(800);
    }
    last = st.text;
  }
  const won = await page.evaluate(() => document.getElementById('winDlg').open || /Finished|won|wins/i.test(document.getElementById('status').textContent));
  const out = { race: r + 1, finished: won, stuck, maxGapS: Math.round(maxGap / 1000), longestTurnS: Math.round(Math.max(0, ...botTurns) / 1000), errors };
  results.push(out); console.log(JSON.stringify(out));
  await ctx.close();
}
await browser.close(); server.close();
process.exit(results.some((x) => x.stuck || x.errors.length) ? 1 : 0);
