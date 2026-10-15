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

test('first visit: Start here → a boat brings the otter → name it → Build Our First Home → the home appears', { skip: skip() }, async () => {
  const t = await open('?nosplash=1'); const shot = (n) => process.env.SHOTS ? t.page.screenshot({ path: `${process.env.SHOTS}/first-${n}.png` }) : null;
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here: meet your otter/);
  await t.page.evaluate(() => document.getElementById('hmCont').click()); await t.page.waitForTimeout(2200); await shot(1);
  assert.equal(await t.view(), 'view-island');
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 15000 }); await t.page.waitForTimeout(500); await shot(2);
  assert.match(await t.text('#pupTitle'), /Meet your otter/); assert.equal(await t.page.evaluate(() => document.getElementById('pupSuggest').hidden), false);
  // the otter's brick: one stud, never red; the colour follows the pick
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#pupPic .pupfig path[opacity]').length), 1);
  await t.page.evaluate(() => document.querySelector('#pupCols [data-col="2"]').click()); await t.page.waitForTimeout(200);
  assert.match(await t.page.evaluate(() => document.querySelector('#pupPic .pupfig path:nth-of-type(2)').getAttribute('fill')), /^rgb\(31,/);
  await t.page.evaluate(() => document.querySelector('#pupOutfit [data-out="scarf"]').click());
  // naming it yourself is the main way: an empty name is refused, digits and symbols are dropped
  await t.page.evaluate(() => document.querySelector('#pupOwn button[type=submit]').click()); await t.page.waitForTimeout(200);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupErr').hidden), false);
  await t.page.fill('#pupIn', 'Captain Fizz!7'); await t.page.press('#pupIn', 'Enter'); await t.page.waitForTimeout(2000); await shot(3);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), false);
  // Bloppit shows the unfinished home, and there is one button
  assert.match(await t.text('#isWorld .is3-play'), /Build Our First Home/);
  assert.ok(await t.page.evaluate(() => window.bloppitIslandPoint('pup')));
  let w = JSON.parse(await t.page.evaluate(() => localStorage.getItem('bloppit-world-v1')));
  assert.equal(w.pupText, 'Captain Fizz'); assert.equal(w.pupName, -1); assert.equal(w.pupColor, 2); assert.equal(w.arrived, 1); assert.equal(w.wear.neck[0], 'scarf');
  await t.page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.view(), 'view-build'); const m = (await t.text('#progress')).match(/0 of (\d+)/); assert.ok(m && +m[1] >= 4 && +m[1] <= 14, 'a short first build');
  await shot(4); await autoPlace(t.page, +m[1]);
  // straight back home: the cottage appears
  await t.page.waitForFunction(() => /You built your home/.test(document.querySelector('#isWorld .is3-banner')?.textContent || ''), null, { timeout: 15000 }); await shot(5);
  assert.equal(await t.view(), 'view-island');
  assert.equal(await t.page.evaluate(() => document.getElementById('isIntro').hidden), true);
  await t.page.waitForTimeout(6000); await shot(6);
  w = JSON.parse(await t.page.evaluate(() => localStorage.getItem('bloppit-world-v1')));
  assert.equal(w.log.length, 1); assert.equal(w.builds[`m:Little house:${m[1]}`].s, 3);
  assert.match(await t.text('#isStage'), /Captain Fizz · Level 1 Pup/); assert.match(await t.text('#isNext'), /Home Island|mist/);
  await t.page.goto(BASE + '?nosplash=1'); await t.page.waitForTimeout(2500);
  assert.equal(await t.view(), 'view-home'); assert.equal(await t.page.evaluate(() => document.getElementById('hmCont').hidden), true);
  // from now on the island leads: first on the menu, and the hero of bloppit.com on this device
  assert.equal(await t.page.evaluate(() => { const w = document.getElementById('hmWorld'); return !w.hidden && !!w.querySelector('.hw-isle img, .hw-isle svg') && w.compareDocumentPosition(document.getElementById('hmCont')) === Node.DOCUMENT_POSITION_FOLLOWING; }), true);
  assert.match(await t.text('#hmWorld'), /Captain Fizz/);
  await t.page.goto(new URL('/', BASE).href); await t.page.waitForTimeout(1500);
  assert.match(await t.text('.hero h1'), /Captain Fizz’s.*island is waiting/s);
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

test('a Longtail race starts and shows the Longtail in the banner on his turn', { skip: skip() }, async () => {
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

test('Bloppitopia renders every stage in 3D (models, buildings, the islands nearby), and as a drawing without WebGL', { skip: skip() }, async () => {
  const seed = (n) => { const builds = {}, log = []; for (let i = 0; i < n; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: n * 10, bonus: 0, builds, log, decor: n >= 3 ? ['flag'] : [], pupName: 3, pupAsked: true, isle: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: n, finished: n, welcome: 1 })); };
  const isles = ['otterwood', 'brainpeak', 'sunrise', 'blitzbay', 'brickworks'];
  for (const [n, models] of [[0, 0], [1, 1], [3, 3], [10, 10]]) {
    const t = await open('?nosplash=1#island', { init: { fn: seed, arg: n } });
    assert.match(await t.text('#isStage'), /^Bubbles · Level \d+ (Pup|Splash)/);
    const w = await t.page.evaluate((ids) => { const I = window.bloppitIsland3(), P = window.bloppitIslandPoint; return { ok: I.ok, models: I.shown.list.length, home: !!(P('home:home0') || P('home:home1') || P('home:home3') || P('home:home10') || P('home:home')), garden: !!P('home:garden'), isles: ids.every((d) => P('isle:' + d)) }; }, isles);
    assert.deepEqual(w, { ok: true, models, home: true, garden: n >= 2, isles: true });
    assert.deepEqual(t.errors, []); await t.ctx.close();
  }
  // no WebGL: the drawn island, still tappable
  const t = await open('?nosplash=1&island3d=0#island', { init: { fn: (n) => { const builds = { 'm:Heart:9': { n: 9, s: 3, t: 1e12, c: 1 } }; localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds, log: ['m:Heart:9'], decor: [], pupName: 3, pupAsked: true, isle: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); }, arg: 1 } });
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#isWorld svg [data-info="place:hut"]').length), 1);
  await t.ctx.close();
});

test('a relay: one friend builds half, the other finishes, both islands get the model', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  const a = await open('?nosplash=1&welcome=0#blitz', { init: seeded });
  await a.page.evaluate(() => { document.getElementById('bzName').value = 'A'; const sel = document.getElementById('bzModel'); sel.value = [...sel.options].find((o) => o.value !== 'cur').value; sel.dispatchEvent(new Event('change')); });
  await a.page.waitForTimeout(600);
  await a.page.evaluate(() => document.getElementById('bzRelayGo').click()); await a.page.waitForTimeout(1200);
  assert.equal(await a.view(), 'view-build');
  for (let i = 0; i < 60; i++) { await autoPlace(a.page, 1); if (await a.page.evaluate(() => document.getElementById('trialDlg').open)) break; }
  await a.page.waitForTimeout(1500);
  const code = await a.text('#trCode'); assert.match(code, /^[A-Z0-9]{6}$/); assert.match(await a.text('#trTitle'), /Your half is done/);
  await a.page.evaluate(() => document.getElementById('trDone').click()); await a.page.waitForTimeout(800);
  assert.match(await a.text('#chMineList'), /Waiting for your friend/);
  const b = await open('?nosplash=1&welcome=0#blitz', { init: seeded });
  await b.page.evaluate((c) => { document.getElementById('bzCodeIn').value = c; document.getElementById('bzJoin').click(); }, code); await b.page.waitForTimeout(2500);
  assert.match(await b.text('#chPreview'), /started a relay/);
  await b.page.evaluate(() => document.getElementById('relGo').click()); await b.page.waitForTimeout(1200);
  assert.equal(await b.view(), 'view-build'); assert.doesNotMatch(await b.text('#progress'), /^0 of/);
  for (let i = 0; i < 60; i++) { await autoPlace(b.page, 1); if (await b.page.evaluate(() => /Every step complete/.test(document.getElementById('status').textContent))) break; }
  await b.page.waitForTimeout(4500);
  assert.match(await b.text('#trTitle'), /Finished together/);
  const wb = JSON.parse(await b.page.evaluate(() => localStorage.getItem('bloppit-world-v1'))); assert.equal(wb.log.length, 1); assert.match(wb.log[0], /^r:/);
  assert.deepEqual(b.errors, []); await b.ctx.close();
  // the first player hears about it on the Blitz page
  await a.page.evaluate(() => window.bloppitHome()); await a.page.waitForTimeout(300);
  await a.page.evaluate(() => document.querySelector('[data-go="friend"]').click()); await a.page.waitForTimeout(2500);
  assert.match(await a.text('#trTitle'), /Your relay is finished/);
  const wa = JSON.parse(await a.page.evaluate(() => localStorage.getItem('bloppit-world-v1'))); assert.equal(wa.log.length, 1);
  assert.deepEqual(a.errors, []); await a.ctx.close();
});

test('a crew: make, ask to join, let in, a build adds bricks, a phrase on the board, a report hides it', { skip: skip() }, async () => {
  // Each player needs a pup: a finished build mints one
  const mkPlayer = async () => { const t = await open('?nosplash=1#island', { init: { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, builds: {}, log: [] })); } } });
    await t.page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await t.page.waitForTimeout(1500);
    await autoPlace(t.page, +(await t.text('#progress')).match(/0 of (\d+)/)[1]); await t.page.waitForTimeout(6000); return t; };
  const a = await mkPlayer(), b = await mkPlayer();
  const hub = async (t) => { await t.page.evaluate(() => window.bloppitHome()); await t.page.evaluate(() => { location.hash = '#together'; document.getElementById('tab-mp').click(); }); await t.page.waitForTimeout(1500); };
  await hub(a);
  await a.page.evaluate(() => { document.getElementById('crewName').value = '2'; document.getElementById('crewMake').click(); }); await a.page.waitForTimeout(1500);
  const code = await a.page.evaluate(() => document.querySelector('#crewOpen .cc')?.textContent); assert.match(code || '', /^[A-Z0-9]{6}$/);
  assert.match(await a.text('#crewOpen h2'), /Lighthouse Builders/);
  await hub(b);
  await b.page.evaluate((c) => { document.getElementById('crewCodeIn').value = c; document.getElementById('crewJoin').click(); }, code); await b.page.waitForTimeout(1200);
  await b.page.evaluate(() => document.querySelector('[data-crew-join]').click()); await b.page.waitForTimeout(1200);
  assert.match(await b.text('#crewOpen'), /Waiting for the crew’s maker/);
  await hub(a); await a.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await a.page.waitForTimeout(800);
  await a.page.evaluate(() => document.querySelector('[data-crew-ok]').click()); await a.page.waitForTimeout(1500);
  assert.equal(await a.page.evaluate(() => document.querySelectorAll('#crewOpen .crew-members span').length), 2);
  // B finishes a Trail level: bricks go to the lighthouse
  await b.page.evaluate(() => window.bloppitHome()); await b.page.evaluate(() => document.querySelector('[data-go="otter"]').click()); await b.page.waitForTimeout(500);
  await b.page.evaluate(() => [...document.querySelectorAll('#view-game button')].find((x) => /Heart/.test(x.textContent) && x.offsetParent).click()); await b.page.waitForTimeout(800);
  await b.page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^(Play|Start|Build)/.test(x.textContent.trim()) && x.offsetParent)?.click()); await b.page.waitForTimeout(800);
  for (let i = 0; i < 40; i++) { await autoPlace(b.page, 1); if (await b.page.evaluate(() => /Every step complete/.test(document.getElementById('status').textContent))) break; }
  await b.page.waitForTimeout(3500); await b.page.evaluate(() => document.getElementById('winDlg').close());
  await hub(b); await b.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await b.page.waitForTimeout(800);
  assert.match(await b.text('#crewOpen'), /10 of 2,000 bricks/);
  await b.page.evaluate(() => document.querySelector('[data-crew-say="0"]').click()); await b.page.waitForTimeout(1200);
  assert.match(await b.text('#crewFeed'), /Nice clean build!/);
  await hub(a); await a.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await a.page.waitForTimeout(800);
  assert.match(await a.text('#crewFeed'), /Nice clean build!/);
  await a.page.evaluate(() => document.querySelector('[data-crew-report]').click()); await a.page.evaluate(() => document.querySelector('[data-crew-report]').click()); await a.page.waitForTimeout(1200);
  assert.doesNotMatch(await a.text('#crewFeed'), /Nice clean build!/);
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close();
});

test('island: tap anything for its card; drag a model anywhere on the grass; put away and back; the weekly board shows when a grown-up switches it on', { skip: skip() }, async () => {
  const t = await open('?nosplash=1#island', { init: { fn: () => { const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1, d: 95000 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: ['flag'], pupName: 3, pupAsked: true, isle: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); localStorage.setItem('bloppit-board-v1', '1'); } } });
  const models = () => t.page.evaluate(() => window.bloppitIsland3().shown.list.map((m) => m.key));
  assert.equal((await models()).length, 3);
  const pt = (id) => t.page.evaluate((i) => window.bloppitIslandPoint(i), id);
  const tap = async (id) => { const c = await pt(id); await t.page.mouse.click(c.x, c.y); await t.page.waitForTimeout(400); const txt = await t.text('#isTip'); await t.page.evaluate(() => document.querySelector('#isTip .tt-x')?.click()); return txt; };
  // places, Bloppit, the pup, a decoration, the islands nearby: each says what it is, its level and what's next
  assert.match(await tap('land:beach'), /Home Island.*Builds finished3.*Islands discovered/);
  assert.match(await tap('bloppit'), /Bloppit.*build buddy/);
  assert.match(await tap('pup'), /Bubbles.*Level \d+ Pup.*1 stud.*Otter level.*Wardrobe.*Name or colour/);
  assert.match(await tap('decor:flag'), /Flag/);
  assert.match(await tap('isle:sunrise'), /A misty island.*Play Weekly Bloppit to discover it.*This week’s Bloppit/);
  assert.match(await tap('isle:blitzbay'), /A misty island.*Race a Longtail/);
  // a model: where it came from, when, stars, best time; then put it away (the card's button)
  const key = (await models())[0];
  const c = await pt('model:' + key); await t.page.mouse.click(c.x, c.y); await t.page.waitForTimeout(400);
  assert.match(await t.text('#isTip'), /From.*Quick Build.*First built.*Best time1:35.*Bricks/);
  await t.page.evaluate(() => [...document.querySelectorAll('#isTip [data-a]')].find((b) => /Put away/.test(b.textContent)).click()); await t.page.waitForTimeout(500);
  assert.equal((await models()).includes(key), false);
  await t.page.evaluate((k) => document.querySelector(`#buildsGrid [data-mkey="${k}"]`).click(), key); await t.page.waitForTimeout(300);
  await t.page.evaluate(() => [...document.querySelectorAll('#isTip [data-a]')].find((b) => /Put on Bloppitopia/.test(b.textContent)).click()); await t.page.waitForTimeout(500);
  assert.equal((await models()).includes(key), true);
  // drag it to a new spot: it stays where it's dropped, on the grass
  const a = await pt('model:' + key);
  await t.page.mouse.move(a.x, a.y); await t.page.mouse.down(); await t.page.mouse.move(a.x - 20, a.y + 10, { steps: 4 }); await t.page.mouse.move(a.x - 60, a.y + 30, { steps: 8 }); await t.page.mouse.up(); await t.page.waitForTimeout(600);
  const w = JSON.parse(await t.page.evaluate(() => localStorage.getItem('bloppit-world-v1')));
  assert.ok(Array.isArray(w.pos[key]), JSON.stringify(w.pos));
  const m = await t.page.evaluate((k) => window.bloppitIsland3().shown.list.find((x) => x.key === k), key);
  assert.ok(m && m.placed, JSON.stringify(m));
  assert.equal(await t.page.evaluate(() => document.getElementById('isTip').hidden), true);   // a drag is not a tap
  // the keyboard list has everything too
  assert.ok(await t.page.evaluate(() => document.querySelectorAll('#isA11y [data-info]').length > 15));
  // the board on the Weekly page
  await t.page.evaluate(() => document.getElementById('tab-daily').click()); await t.page.waitForTimeout(1200);
  assert.equal(await t.page.evaluate(() => document.getElementById('dyBoard').hidden), false);
  assert.match(await t.text('#dyBoardList'), /Nobody on the board yet/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('family key: make, attach a player, bring the player to another device', { skip: skip() }, async () => {
  const a = await open('?nosplash=1#island', { init: { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 5, builds: {}, log: [] })); } } });
  await a.page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await a.page.waitForTimeout(1500);
  await autoPlace(a.page, +(await a.text('#progress')).match(/0 of (\d+)/)[1]); await a.page.waitForTimeout(6000);
  await a.page.evaluate(() => window.bloppitHome()); await a.page.waitForTimeout(500);
  const grown = async (t) => { await t.page.evaluate(() => document.getElementById('whoBtn').click()); await t.page.waitForTimeout(300); await t.page.evaluate(() => document.getElementById('whoGrown').click()); await t.page.waitForTimeout(1200); };
  await grown(a);
  await a.page.evaluate(() => document.getElementById('famMake').click()); await a.page.waitForFunction(() => /^[A-Z0-9]{12}$/.test(document.getElementById('famKeyOut').textContent.trim()), null, { timeout: 15000 }).catch(() => {});
  const key = await a.text('#famKeyOut'); assert.match(key, /^[A-Z0-9]{12}$/);
  await a.page.evaluate(() => document.getElementById('famAttach').click()); await a.page.waitForTimeout(1500);
  for (let i = 0; i < 20 && /Loading/.test(await a.text('#famList')); i++) await a.page.waitForTimeout(500);
  assert.match(await a.text('#famList'), /Finn .* 1 build .* on this device/);
  await a.ctx.close();
  const b = await open('?nosplash=1&welcome=0'); await grown(b);
  await b.page.evaluate((k) => { document.getElementById('famKeyIn').value = k; document.getElementById('famGo').click(); }, key); await b.page.waitForTimeout(1500);
  await b.page.evaluate(() => document.querySelector('[data-fam-bring]').click()); await b.page.waitForTimeout(1500);
  for (let i = 0; i < 20 && !/on this device/.test(await b.text('#famList')); i++) await b.page.waitForTimeout(500);
  assert.match(await b.text('#famList'), /on this device/);
  assert.equal(await b.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-players-v1')).list.filter((p) => p.pup).length), 1);
  assert.deepEqual(b.errors, []); await b.ctx.close();
});

test('draw your own: paint, build as a picture, save with the pup, send as a link', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0#photos');
  const cv = await t.page.$('#drawCv'); await cv.scrollIntoViewIfNeeded(); await t.page.waitForTimeout(300); const r = await cv.boundingBox();
  const cell = (cx, cy) => ({ x: r.x + (cx + .5) * r.width / 24, y: r.y + (cy + .5) * r.height / 24 });
  // a red square outline with a yellow middle: paint strokes, then fill
  await t.page.evaluate(() => document.querySelector('#drawPal [data-c="1"]').click());
  for (const [x1, y1, x2, y2] of [[6, 6, 17, 6], [17, 6, 17, 17], [17, 17, 6, 17], [6, 17, 6, 6]]) { const a = cell(x1, y1), b = cell(x2, y2); await t.page.mouse.move(a.x, a.y); await t.page.mouse.down(); await t.page.mouse.move(b.x, b.y, { steps: 14 }); await t.page.mouse.up(); }
  await t.page.evaluate(() => { document.querySelector('#drawPal [data-c="3"]').click(); document.getElementById('drawFill').click(); });
  const m = cell(11, 11); await t.page.mouse.click(m.x, m.y);
  const painted = await t.page.evaluate(() => window.bloppitDrawCode()); assert.match(painted, /^24x24-/);
  await t.page.evaluate(() => document.getElementById('drawSave').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#drawSaved button').length), 1);
  await t.page.evaluate(() => document.getElementById('drawBuild').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.view(), 'view-build'); const prog = await t.text('#progress'); assert.match(prog, /0 of (\d+) placed/); assert.ok(+prog.match(/of (\d+)/)[1] >= 100);
  await t.ctx.close();
  const u = await open('?nosplash=1&welcome=0&p=d-' + painted);
  assert.match(await u.text('#shTitle'), /A drawing for you/);
  await u.page.evaluate(() => document.getElementById('shGo').click()); await u.page.waitForTimeout(1500);
  assert.equal(await u.view(), 'view-build'); assert.match(await u.text('#progress'), /0 of \d+ placed/);
  assert.deepEqual(u.errors, []); assert.deepEqual(t.errors, []); await u.ctx.close();
});
