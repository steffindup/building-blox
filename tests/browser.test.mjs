// End-to-end in headless Chromium against the dev server: node --test tests/browser.test.mjs
// Needs the playwright dev dependency and a Chromium (PLAYWRIGHT_CHROMIUM=/path/to/chrome, or playwright's own).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './devserver.mjs';
let chromium; try { ({ chromium } = await import('playwright')); } catch { chromium = null; }

const PORT = 8799, BASE = `http://localhost:${PORT}/build/`;
let server, browser;
before(async () => { server = await start(PORT); if (chromium) browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--use-gl=swiftshader'] }); });
const skip = () => !chromium;  // decided when the file loads; the browser itself starts in before()
after(async () => { if (browser) await browser.close(); server?.close(); });

async function open(url, { viewport = { width: 1000, height: 800 }, init, at } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  await ctx.route('**/*', (r) => { const u = r.request().url();
    const f = ['three.min.js', 'OrbitControls.js', 'BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return r.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (/fonts\.g/.test(u)) return r.fulfill({ status: 200, body: '', contentType: 'text/css' });
    r.continue(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  if (init) await page.addInitScript(init.fn, init.arg);
  if (at) await page.clock.setFixedTime(new Date(at));
  await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  return { page, ctx, errors, view: () => page.evaluate(() => [...document.querySelectorAll('section.view')].find((v) => !v.hidden)?.id), text: (sel) => page.evaluate((s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim(), sel) };
}
const autoPlace = async (page, n) => { for (let i = 0; i < n; i++) { await page.evaluate(() => document.getElementById('autoBtn')?.click()); await page.waitForTimeout(1100); } };

test('first visit: the menu shows Start here; one tap opens the six-brick build; finish → pup → fork → island', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here/);
  await t.page.evaluate(() => document.getElementById('hmCont').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.view(), 'view-build'); assert.match(await t.text('#progress'), /0 of 6/); assert.match(await t.text('#budSay'), /I’m Bloppit/);
  assert.equal(await t.page.evaluate(() => document.getElementById('buddy').className), 'buddy offer');
  await autoPlace(t.page, 6); await t.page.waitForTimeout(4000);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), true);
  await t.page.evaluate(() => document.querySelector('[data-pup="0"]').click()); await t.page.waitForTimeout(400);
  assert.equal(await t.page.evaluate(() => document.getElementById('welcomeDlg').open), true);
  assert.match(await t.text('#welcomeDlg [data-ws]'), /\+10 XP.*Hut built/);
  await t.page.evaluate(() => document.getElementById('wcTrail').click()); await t.page.waitForTimeout(500);
  assert.equal(await t.view(), 'view-game');
  await t.page.evaluate(() => document.getElementById('tab-island').click()); await t.page.waitForTimeout(800);
  assert.match(await t.text('#isStage'), /^Hut/); assert.match(await t.text('#isNote'), /Pebble and Bloppit/);
  const w = JSON.parse(await t.page.evaluate(() => localStorage.getItem('bloppit-world-v1')));
  assert.equal(w.pupName, 0); assert.equal(w.log.length, 1); assert.equal(w.builds['m:Little tree:6'].s, 3);
  await t.page.goto(BASE + '?nosplash=1'); await t.page.waitForTimeout(2500);
  assert.equal(await t.view(), 'view-home'); assert.equal(await t.page.evaluate(() => document.getElementById('hmCont').hidden), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a Trail level finish shows the stars strip and counts a build', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => document.querySelector('[data-go="otter"]').click()); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => [...document.querySelectorAll('#view-game button')].find((x) => /Heart/.test(x.textContent) && x.offsetParent).click()); await t.page.waitForTimeout(800);
  await t.page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^(Play|Start|Build)/.test(x.textContent.trim()) && x.offsetParent)?.click()); await t.page.waitForTimeout(800);
  for (let i = 0; i < 40; i++) { await autoPlace(t.page, 1); if (await t.page.evaluate(() => /Every step complete/.test(document.getElementById('status').textContent))) break; }
  await t.page.waitForTimeout(4000);
  assert.equal(await t.page.evaluate(() => document.getElementById('winDlg').open), true);
  assert.match(await t.text('#winDlg [data-ws]'), /\+10 XP/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a Gull race starts and shows the Gull in the banner on his turn', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => document.querySelector('[data-go="cpu"]').click()); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  await t.page.waitForTimeout(4500);
  assert.equal(await t.page.evaluate(() => document.getElementById('turnBanner').hidden), false);
  assert.match(await t.text('#turnBanner'), /Your turn/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('share links: a Weekly, a library model, and /p/start', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  let t = await open('?nosplash=1&p=w-2026-10-12', { init: seeded, at: '2026-10-14T18:00:00Z' });
  assert.equal(await t.page.evaluate(() => document.getElementById('shareDlg').open), true); assert.match(await t.text('#shTitle'), /This week/);
  await t.page.evaluate(() => document.getElementById('shGo').click()); await t.page.waitForTimeout(4500);
  assert.equal(await t.view(), 'view-build'); assert.deepEqual(t.errors, []); await t.ctx.close();
  t = await open('?nosplash=1&p=m-toadstool', { init: seeded });
  assert.match(await t.text('#shTitle'), /Toadstool/); await t.page.evaluate(() => document.getElementById('shGo').click()); await t.page.waitForTimeout(1200);
  assert.equal(await t.view(), 'view-build'); assert.deepEqual(t.errors, []); await t.ctx.close();
  t = await open('?nosplash=1&p=start');
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here/); assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the Weekly bank: each planned Monday shows its model', { skip: skip() }, async () => {
  for (const [when, name] of [['2026-10-26T13:00:00Z', 'Jack-o’-lantern'], ['2026-11-02T14:00:00Z', 'Red boat'], ['2026-11-23T14:00:00Z', 'Hot-air balloon'], ['2026-12-14T14:00:00Z', 'Gingerbread house']]) {
    const t = await open('?nosplash=1&welcome=0', { at: when });
    assert.match(await t.text('#hmDailyT'), new RegExp(name)); assert.deepEqual(t.errors, []); await t.ctx.close();
  }
});

test('the island renders every stage from a seeded world', { skip: skip() }, async () => {
  for (const [n, stage] of [[0, 'Beach'], [1, 'Hut'], [3, 'Workshop'], [10, 'Village']]) {
    const t = await open('?nosplash=1#island', { init: { fn: (n) => { const builds = {}, log = []; for (let i = 0; i < n; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
      localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: n * 10, bonus: 0, builds, log, decor: n >= 3 ? ['flag'] : [], pupName: 3, pupAsked: true })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: n, finished: n, welcome: 1 })); }, arg: n } });
    assert.match(await t.text('#isStage'), new RegExp('^' + stage)); assert.equal(await t.page.evaluate(() => document.querySelectorAll('#island svg image').length > 0), true);
    assert.deepEqual(t.errors, []); await t.ctx.close();
  }
});
