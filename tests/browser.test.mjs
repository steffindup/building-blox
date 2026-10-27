// End-to-end in headless Chromium against the dev server: node --test tests/browser.test.mjs
// Needs the playwright dev dependency and a Chromium (PLAYWRIGHT_CHROMIUM=/path/to/chrome, or playwright's own).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './devserver.mjs';
let chromium; try { ({ chromium } = await import('playwright')); } catch { chromium = null; }

const PORT = 8799, BASE = `http://localhost:${PORT}/build/`;
let server, browser;
before(async () => { server = await start(PORT); if (chromium) browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: process.env.PLAYWRIGHT_ARGS ? process.env.PLAYWRIGHT_ARGS.split(' ') : ['--use-gl=swiftshader'] }); });
const skip = () => !chromium;  // decided when the file loads; the browser itself starts in before()
after(async () => { if (browser) await browser.close(); server?.close(); });

// Keep placing until the first build is really finished (slow machines), then let the home appear
async function finishFirst(page) {
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => (JSON.parse(localStorage.getItem('bloppit-world-v1') || '{}').log || []).length > 0)) break; await autoPlace(page, 1); }
  await page.waitForTimeout(5000);
}
async function open(url, { viewport = { width: 1000, height: 800 }, init, at, touch } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
  await ctx.route('**/*', (r) => { const u = r.request().url();
    const f = ['three.min.js', 'OrbitControls.js', 'BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return r.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (/fonts\.g/.test(u)) return r.fulfill({ status: 200, body: '', contentType: 'text/css' });
    r.continue(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  if (init) await page.addInitScript(init.fn, init.arg);
  if (at) await page.clock.setFixedTime(new Date(at));
  const u = url.replace(/^([^#]*)/, (m) => m + (m.includes('?') ? '&' : '?') + 'lite3d=1');   // a light 3D world: the test machine has no GPU
  await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  return { page, ctx, errors, view: () => page.evaluate(() => [...document.querySelectorAll('section.view')].find((v) => !v.hidden)?.id), text: (sel) => page.evaluate((s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim(), sel) };
}
const autoPlace = async (page, n) => { for (let i = 0; i < n; i++) { await page.evaluate(() => document.getElementById('autoBtn')?.click()); await page.waitForTimeout(1100); } };

test('first visit: the arrival film can be skipped straight to meeting the otter', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  await t.page.evaluate(() => document.getElementById('hmCont').click());
  await t.page.waitForFunction(() => !!document.querySelector('#isWorld .is3-cine .cn-skip'), null, { timeout: 10000 }); await t.page.waitForTimeout(800);
  // the arrival is the film (public/video/arrival.mp4), playing
  assert.equal(await t.page.evaluate(() => { const v = document.querySelector('#isWorld .is3-cine video.cn-film'); return !!v && /\/video\/arrival\.mp4$/.test(v.src) && !!window.bloppitIsland3().cine.film; }), true);
  const t0 = Date.now(); await t.page.evaluate(() => document.querySelector('#isWorld .is3-cine .cn-skip').click());
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 8000 });
  assert.ok(Date.now() - t0 < 6000); assert.match(await t.text('#pupTitle'), /Meet your otter/);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-island').classList.contains('cine')), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('My films: hidden until the arrival film is unlocked, then plays it again from the menu', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  assert.equal(await t.page.evaluate(() => document.getElementById('hmFilms').hidden), true);
  await t.ctx.close();
  const u = await open('?nosplash=1', { init: { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: {}, log: [], decor: [] })); } } });
  const shot = (n) => process.env.SHOTS ? u.page.screenshot({ path: `${process.env.SHOTS}/films-${n}.png` }) : null;
  assert.equal(await u.page.evaluate(() => document.getElementById('hmFilms').hidden), false);
  assert.match(await u.text('#hmFilmsS'), /1 film to watch again/); await shot(1);
  await u.page.evaluate(() => document.getElementById('hmFilms').click()); await u.page.waitForTimeout(400);
  assert.equal(await u.page.evaluate(() => document.getElementById('filmsDlg').open), true);
  assert.match(await u.text('#filmNow'), /01 · Arrival/);
  await u.page.evaluate(() => document.querySelector('#filmList [data-film="arrival"]').click());
  await u.page.waitForFunction(() => { const v = document.getElementById('filmVid'); return /\/video\/arrival\.mp4$/.test(v.src) && v.currentTime > 0.3; }, null, { timeout: 10000 }); await shot(2);
  await u.page.evaluate(() => document.getElementById('filmsClose').click()); await u.page.waitForTimeout(300);
  assert.equal(await u.page.evaluate(() => !document.getElementById('filmsDlg').open && document.getElementById('filmVid').paused), true);
  assert.deepEqual(u.errors, []); await u.ctx.close();
});

test('first visit: with ?film=0 the arrival made in the game plays instead of the film', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&film=0');
  await t.page.evaluate(() => document.getElementById('hmCont').click());
  await t.page.waitForFunction(() => window.bloppitIsland3 && window.bloppitIsland3().cine, null, { timeout: 10000 }); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-cine video') && window.bloppitIsland3().cine.t > 0.5), true);
  await t.page.evaluate(() => document.querySelector('#isWorld .is3-cine .cn-skip').click());
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 8000 });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('first visit: Start here → a boat brings the otter → name it → Build Our First Home → the home appears', { skip: skip() }, async () => {
  const t = await open('?nosplash=1'); const shot = (n) => process.env.SHOTS ? t.page.screenshot({ path: `${process.env.SHOTS}/first-${n}.png` }) : null;
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here: meet your otter/);
  await t.page.evaluate(() => document.getElementById('hmCont').click()); await t.page.waitForTimeout(2200); await shot(1);
  assert.equal(await t.view(), 'view-island');
  // the arrival plays like a film: letterbox, title, a Skip button, and the boat at sea
  assert.equal(await t.page.evaluate(() => !!document.querySelector('#isWorld .is3-cine .cn-skip') && document.getElementById('view-island').classList.contains('cine')), true);
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 45000 }); await t.page.waitForTimeout(500); await shot(2);
  assert.equal(await t.page.evaluate(() => !!document.querySelector('.is3-cine') || document.getElementById('view-island').classList.contains('cine')), false);
  assert.match(await t.text('#pupTitle'), /Meet your otter/); assert.equal(await t.page.evaluate(() => document.getElementById('pupSuggest').hidden), false);
  // the otter's brick: one stud, never red; the colour follows the pick
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#pupPic .pupfig path[opacity]').length), 1);
  await t.page.evaluate(() => document.querySelector('#pupCols [data-col="2"]').click()); await t.page.waitForTimeout(200);
  assert.match(await t.page.evaluate(() => document.querySelector('#pupPic .pupfig path:nth-of-type(2)').getAttribute('fill')), /^rgb\(31,/);
  await t.page.evaluate(() => document.querySelector('#pupOutfit [data-out="scarf"]').click());
  // naming it yourself is the main way: an empty name is refused, digits and symbols are dropped
  await t.page.evaluate(() => document.querySelector('#pupOwn button[type=submit]').click()); await t.page.waitForTimeout(200);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupErr').hidden), false);
  await t.page.fill('#pupIn', 'Captain Fizz!7'); await t.page.press('#pupIn', 'Enter'); await t.page.waitForTimeout(300);
  // a name doesn't close the card: the look can still change, and "All done!" finishes
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), true);
  assert.match(await t.text('#pupTitle'), /Meet Captain Fizz!/); assert.match(await t.text('#pupLater'), /All done/);
  await t.page.evaluate(() => document.getElementById('pupLater').click()); await t.page.waitForTimeout(2000); await shot(3);
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
  // the first home build became the cottage: it doesn't also stand on the island as a model
  assert.equal(await t.page.evaluate(() => { let n = 0; window.bloppitIsland3().world.traverse((x) => { if (/^model:m:Little house/.test(x.userData.info || '')) n++; }); return n; }), 0);
  assert.match(await t.text('#buildsGrid'), /Your home/);
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

test('a finger on the brick in hand slides the brick, and the view stays still', { skip: skip() }, async () => {
  const t = await open('?nosplash=1#island', { viewport: { width: 402, height: 874 }, touch: true, init: { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: {}, log: [], decor: [] })); } } });
  await t.page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await t.page.waitForTimeout(1500);
  await autoPlace(t.page, 4);
  const g = await t.page.evaluate(() => window.bloppitGhost()); assert.ok(g, 'a brick in hand');
  const cdp = await t.ctx.newCDPSession(t.page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 12, radiusY: 12 }] });
  const slide = async (x0, y0, dx, dy) => { await touch('touchStart', x0, y0); for (let i = 1; i <= 10; i++) { await touch('touchMove', x0 + dx * i, y0 + dy * i); await t.page.waitForTimeout(50); } await touch('touchEnd'); await t.page.waitForTimeout(700); };
  // press a little off the brick's middle (a fingertip) and slide
  await slide(g.x + 18, g.y + 12, 9, 4);
  const g2 = await t.page.evaluate(() => window.bloppitGhost());
  assert.ok(g2.ax !== g.ax || g2.az !== g.az, 'the brick moved'); assert.deepEqual(g2.cam, g.cam, 'the view did not turn');
  // sliding away from the brick still turns the view
  await slide(60, 200, 10, 0);
  const g3 = await t.page.evaluate(() => window.bloppitGhost());
  assert.notDeepEqual(g3.cam, g2.cam); assert.deepEqual([g3.ax, g3.az], [g2.ax, g2.az]);
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

test('a race against Swoop starts and shows him in the banner on his turn', { skip: skip() }, async () => {
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

test('a New player on a device that has been played on still gets Start here; the original player does not', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  const t = await open('?nosplash=1', { init: seeded });
  assert.equal(await t.view(), 'view-home'); assert.equal(await t.page.evaluate(() => document.getElementById('hmCont').hidden), true);
  await t.page.evaluate(() => { document.getElementById('whoBtn').click(); document.getElementById('whoAdd').click(); });
  await t.page.evaluate(() => { document.getElementById('whoNm').value = 'Sam'; document.getElementById('whoForm').requestSubmit(); });
  await t.page.waitForLoadState('load'); await t.page.waitForTimeout(2500);
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here: meet your otter/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the Weekly is calm: no Blitz tag, no stopwatch, no seconds for a miss; the menu shows Weekly', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  const t = await open('?nosplash=1#daily', { init: seeded, at: '2026-10-14T18:00:00Z' });
  // a first visit to the page: no "Streak 0" and no empty chip
  assert.equal(await t.page.evaluate(() => [...document.querySelectorAll('#dyStats span')].filter((e) => !e.hidden).length), 0);
  await t.page.evaluate(() => document.getElementById('dyGo').click()); await t.page.waitForTimeout(5000);
  assert.equal(await t.view(), 'view-build');
  const ui = await t.page.evaluate(() => ({ tag: !!document.querySelector('#mpTitle .blitz-tag'), race: document.getElementById('mpRoomBtn').hidden, banner: document.getElementById('turnBanner').hidden,
    tab: document.querySelector('.tab[aria-selected="true"]')?.dataset.tab }));
  assert.deepEqual(ui, { tag: false, race: true, banner: true, tab: 'daily' });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the Weekly: a brick of the wrong colour says which colour the step needs, and the right one fits', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  const t = await open('?nosplash=1#daily', { init: seeded, viewport: { width: 402, height: 874 }, touch: true });
  await t.page.evaluate(() => document.getElementById('dyGo').click());
  await t.page.waitForFunction(() => (s => /Go!/.test(s) && !/Wait for Go/.test(s))(document.getElementById('status').textContent), null, { timeout: 20000 });
  // the first brick of this step, held in a colour it isn't (White, or Light Grey if the brick is White)
  const c = await t.page.evaluate(() => window.bloppitPeek().c);
  const wrong = await t.page.evaluate((c) => window.bloppitTryBrick(c === 0 ? 1 : 0), c);
  assert.equal(wrong.ok, false); assert.match(wrong.status, /^Step \d+ needs [A-Za-z ]+ here, not (White|Light Grey)\./);
  assert.doesNotMatch(wrong.status, /second/, 'the Weekly is calm');
  const right = await t.page.evaluate((c) => window.bloppitTryBrick(c), c);
  assert.equal(right.ok, true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a finished Weekly stands on the 3D island, and can be put away and back', { skip: skip() }, async () => {
  const world = { fn: () => { localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 }));
    if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: { 'm:Little house:12': { n: 12, s: 2, k: 'quick', t: Date.now() - 864e5, c: 1 } }, log: ['m:Little house:12'], decor: [] })); } };
  const t = await open('?nosplash=1#daily', { init: world });
  await t.page.evaluate(() => document.getElementById('dyGo').click());
  await t.page.waitForFunction(() => (s => /Go!/.test(s) && !/Wait for Go/.test(s))(document.getElementById('status').textContent), null, { timeout: 20000 });
  for (let i = 0; i < 200; i++) { const more = await t.page.evaluate(() => window.bloppitPlaceRight()); if (!more && await t.page.evaluate(() => /Every step complete/.test(document.getElementById('status').textContent))) break; await t.page.waitForTimeout(150); }
  await t.page.waitForTimeout(3000);
  const key = await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).log.find((k) => k.startsWith('w:')));
  assert.ok(key, 'the Weekly was recorded');
  await t.page.goto(new URL('/build/?nosplash=1&lite3d=1#island', 'http://localhost:8799').href); await t.page.waitForTimeout(3000);
  const on = () => t.page.evaluate((k) => { const I = window.bloppitIsland3(); return !!(I && I.shown && I.shown.list.some((m) => m.key === k)); }, key);
  assert.equal(await t.page.evaluate(() => !!window.bloppitIsland3().ok), true, 'the 3D island');
  assert.equal(await on(), true, 'the Weekly stands on the island');
  // its card in Your builds offers Put away, and it comes back with Put on Bloppitopia
  const act = (label) => t.page.evaluate(([k, label]) => { document.querySelector(`#buildsGrid [data-mkey="${k}"]`).click(); const b = [...document.querySelectorAll('#isTip button')].find((x) => x.textContent.trim() === label); if (b) b.click(); return !!b; }, [key, label]);
  assert.equal(await act('Put away'), true); await t.page.waitForTimeout(800); assert.equal(await on(), false);
  assert.equal(await act('Put on Bloppitopia'), true); await t.page.waitForTimeout(800); assert.equal(await on(), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the Brain Trail Ghost keeps its face', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const m = await t.page.evaluate(() => window.bloppitLevel('brain', 4)); await t.page.waitForTimeout(500);
  assert.ok(m.n >= 20 && m.n <= 60, `about 40 bricks, got ${m.n}`);
  assert.ok(m.colors.includes('White') && m.colors.includes('Black'), `a white ghost with a dark face, got ${m.colors}`);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('every island has its own puzzles: no build repeats across the trails, Pippa, Blitz and the mystery', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(() => { const L = window.bloppitLevels, seen = new Map(), dup = [];
    for (const [isle, list] of [['Frog Trail', L.otter], ['Brain Trail', L.brain], ['Pippa', L.sea], ['Blitz', L.blitz], ['mystery', L.mystery()]])
      for (const x of list) { const k = x.sample || x.art || x.name; if (seen.has(k)) dup.push(`${k} (${seen.get(k)} and ${isle})`); else seen.set(k, isle); }
    return { dup, blitz: L.blitz.filter((x) => !x.boss).map((x) => L.count({ ...x })) }; });
  assert.deepEqual(r.dup, []);
  assert.ok(r.blitz.every((n) => n > 0 && n <= 30), `Blitz races stay at 30 bricks or fewer, got ${r.blitz}`);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('How to play: the menu opens the video, and the build page offers it for the first builds only', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  assert.equal(await t.page.evaluate(() => !!document.querySelector('#howVid source[src="/video/how-to-play.mp4"]')), true);
  await t.page.evaluate(() => document.getElementById('hmHow').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => document.getElementById('howDlg').open), true);
  await t.page.evaluate(() => document.getElementById('howClose').click()); await t.page.waitForTimeout(200);
  assert.equal(await t.page.evaluate(() => document.getElementById('howDlg').open), false);
  // a new player's first build shows the button on the build page
  await t.page.evaluate(() => window.bloppitLevel('otter', 0)); await t.page.waitForTimeout(500);
  assert.equal(await t.page.evaluate(() => document.getElementById('howBtn').hidden), false);
  await t.ctx.close();
  // after 3 finished builds it steps aside
  const seeded = { fn: () => localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: { a: { n: 9, s: 3 }, b: { n: 9, s: 3 }, c: { n: 9, s: 3 } }, log: ['a', 'b', 'c'], decor: [] })) };
  const t2 = await open('?nosplash=1&welcome=0', { init: seeded });
  await t2.page.evaluate(() => window.bloppitLevel('otter', 0)); await t2.page.waitForTimeout(500);
  assert.equal(await t2.page.evaluate(() => document.getElementById('howBtn').hidden), true);
  assert.deepEqual([...t.errors, ...t2.errors], []); await t2.ctx.close();
});

test('How to play in the app: the tall cut on an iPhone held upright, the wide app cut on an iPad, the website keeps its own', { skip: skip() }, async () => {
  const app = { fn: () => { window.BLOPPIT_APP = true; } };
  const src = (t) => t.page.evaluate(() => { document.getElementById('hmHow').click(); const s = document.querySelector('#howVid source').getAttribute('src'), tall = document.getElementById('howDlg').classList.contains('tall'); document.getElementById('howClose').click(); return [s, tall]; });
  let t = await open('?nosplash=1&welcome=0', { init: app, viewport: { width: 393, height: 852 }, touch: true });
  assert.deepEqual(await src(t), ['/video/how-to-play-app-tall.mp4', true]); assert.deepEqual(t.errors, []); await t.ctx.close();
  t = await open('?nosplash=1&welcome=0', { init: app, viewport: { width: 1180, height: 820 }, touch: true });
  assert.deepEqual(await src(t), ['/video/how-to-play-app.mp4', false]); assert.deepEqual(t.errors, []); await t.ctx.close();
  t = await open('?nosplash=1&welcome=0', { viewport: { width: 393, height: 852 }, touch: true });
  assert.deepEqual(await src(t), ['/video/how-to-play.mp4', false]); assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Brain Trail math: age 9 in October is 4th grade, later levels stay in 4th grade, and puzzles step up a grade only after a long run', { skip: skip() }, async () => {
  const kid = { fn: () => { localStorage.setItem('bloppit-players-v1', JSON.stringify({ cur: 'p1', n: 1, list: [{ id: 'p1', name: 'Alex', age: 9, color: '#D2352B' }] })); localStorage.setItem('bloppit-trail', 'brain'); } };
  const t = await open('?nosplash=1&welcome=0', { init: kid, at: '2026-10-14T15:00:00Z' });
  const st = () => t.page.evaluate(() => window.bloppitMath.state());
  await t.page.evaluate(() => window.bloppitLevel('brain', 13)); await t.page.waitForTimeout(500);
  let m = await st(); assert.equal(m.grade, 4); assert.equal(m.tier, 17, '4th grade, hard step on level 14');
  assert.ok(m.locks.length >= 11, 'enough locked pages to adapt');
  // answer one page: right first time, or wrong first time
  const page = async (k, right) => t.page.evaluate(([k, right]) => { window.bloppitMath.open(k); const M = window.bloppitMath.state(), a = M.q[k].a;
    window.bloppitMath.answer(right ? a : a + 1); if (!right) window.bloppitMath.answer(a); document.getElementById('mathDlg').close(); }, [k, right]);
  for (const k of m.locks.slice(0, 3)) await page(k, true);
  m = await st(); assert.equal(m.tier, 17, 'three right in a row at the top of their own grade: still 4th grade');
  for (const k of m.locks.slice(3, 8)) await page(k, true);
  m = await st(); assert.equal(m.tier, 18, 'eight right in a row on a late level: one step up (5th grade, easy)');
  await t.page.evaluate(() => window.bloppitMath.open(window.bloppitMath.state().locks[8]));
  assert.match(await t.text('#mqTag'), /Stepping up: 5th grade/); await t.page.evaluate(() => document.getElementById('mathDlg').close());
  for (const k of m.locks.slice(8, 11)) await page(k, true);
  m = await st(); assert.equal(m.tier, 18, 'never more than one grade up');
  await t.page.evaluate(() => window.bloppitLevel('brain', 12)); await t.page.waitForTimeout(500);
  m = await st(); assert.equal(m.tier, 18, 'remembered for the next level');
  for (const k of m.locks.slice(0, 2)) await page(k, false);
  m = await st(); assert.equal(m.tier, 17, 'two misses in a row: one step down');
  // the grown-ups' setting says the grade it starts at
  assert.match(await t.page.evaluate(() => document.getElementById('mathTier').textContent), /4th grade math/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
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
    await autoPlace(t.page, +(await t.text('#progress')).match(/0 of (\d+)/)[1]); await finishFirst(t.page); return t; };
  const a = await mkPlayer(), b = await mkPlayer();
  const hub = async (t) => { await t.page.evaluate(() => window.bloppitHome()); await t.page.evaluate(() => { location.hash = '#together'; document.getElementById('tab-mp').click(); }); await t.page.waitForTimeout(1500); };
  await hub(a);
  await a.page.evaluate(() => { document.getElementById('crewName').value = '2'; document.getElementById('crewMake').click(); }); await a.page.waitForTimeout(1500);
  const code = await a.page.evaluate(() => document.querySelector('#crewOpen .cc')?.textContent); assert.match(code || '', /^[A-Z0-9]{6}$/);
  assert.match(await a.text('#crewOpen h2'), /Lighthouse Builders/);
  await hub(b);
  await b.page.evaluate((c) => { document.getElementById('crewCodeIn').value = c; document.getElementById('crewJoin').click(); }, code); await b.page.waitForSelector('[data-crew-join]', { timeout: 15000 });
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
  const still = () => t.page.waitForFunction(() => !window.bloppitIsland3().fly, null, { timeout: 20000, polling: 100 }).then(() => t.page.waitForTimeout(300),
    async (e) => { console.log('STILLDBG', await t.page.evaluate(() => { const I = window.bloppitIsland3(); return JSON.stringify({ fly: I.fly && { dur: I.fly.dur, el: Math.round(performance.now() - I.fly.t0) }, raf: I.raf, hidden: I.hidden, on: I.on, down: I.down, lastAgo: Math.round(performance.now() - (I.last || 0)), view: I.viewI, rev: I.revealing, arr: I.arrive && Object.keys(I.arrive) }); })); throw e; });
  const tap = async (id) => { await still(); const c = await pt(id); await t.page.mouse.click(c.x, c.y); await t.page.waitForTimeout(1200);
    await t.page.waitForFunction(() => !document.getElementById('isTip').hidden, null, { timeout: 4000, polling: 100 }).catch(() => {}); const txt = await t.text('#isTip');
    await t.page.evaluate(() => document.querySelector('#isTip .tt-x')?.click());
    if (await t.page.evaluate(() => { if (window.bloppitIsland3().viewI) { window.bloppitView(0); return true; } return false; })) await still();   // tapping flies there; back to the whole world
    return txt; };
  // characters: the first tap is a reaction (a word in a bubble), the second shows who they are
  const tapChar = async (id) => { await still(); let c = await pt(id);
    // record what's said the moment it appears: a bubble lasts 2s, and on a test machine with no GPU the camera's flight can hold the page longer than that
    await t.page.evaluate(() => { window.__said = ''; const grab = () => document.querySelectorAll('#isWorld .is3-say, #isWorld .is3-banner').forEach((b) => { if (!b.hidden && b.textContent) window.__said = b.textContent; });
      (window.__saidObs ||= new MutationObserver(grab)).disconnect(); document.querySelectorAll('#isWorld .is3-say, #isWorld .is3-banner').forEach((b) => window.__saidObs.observe(b, { attributes: true, childList: true, characterData: true, subtree: true })); });
    await t.page.mouse.click(c.x, c.y);
    // a word in a bubble, or (a Longtail woken at night) a grumble in the banner
    await t.page.waitForFunction(() => window.__said, null, { timeout: 4000, polling: 100 }).catch(() => {});
    const said = await t.page.evaluate(() => window.__said);
    assert.ok(said, 'a reaction for ' + id); assert.equal(await t.page.evaluate(() => document.getElementById('isTip').hidden), true);
    await still(); c = await pt(id);
    await t.page.evaluate(() => { const I = window.bloppitIsland3(); if (I.lastPoke) I.lastPoke.t = performance.now(); });   // 'soon after': the camera's flight takes seconds on a test machine with no GPU
    await t.page.mouse.click(c.x, c.y); await t.page.waitForTimeout(400); const txt = await t.text('#isTip');
    await t.page.evaluate(() => document.querySelector('#isTip .tt-x')?.click()); if (await t.page.evaluate(() => { if (window.bloppitIsland3().viewI) { window.bloppitView(0); return true; } return false; })) await still();
    return txt; };
  // places, Bloppit, the pup, a decoration, the islands nearby: each says what it is, its level and what's next
  assert.match(await tap('land:beach'), /Home Island.*Builds finished3.*Islands discovered/);
  assert.match(await tapChar('bloppit'), /Bloppit.*storm.*build buddy.*Secret.*red brick/);
  assert.match(await tapChar('longtail:easy'), /Swoop the Longtail.*(Blitz Bay’s racer|Asleep on Blitz Bay).*goggles.*Secret.*Speeds beaten.*Did you know\?.*tropicbirds.*Race Swoop · Warm-up/);
  assert.match(await tapChar('char:pippa'), /Pippa the Penguin.*Sunrise Shores.*Secret.*A yellow two-stud brick.*still in the mist.*Play Pippa’s puzzle/);
  assert.match(await tapChar('pup'), /Bubbles.*Level \d+ Pup.*1 stud.*Otter level.*Wardrobe.*Name or colour/);
  assert.match(await tap('decor:flag'), /Flag/);
  assert.match(await tap('isle:sunrise'), /A misty island.*Pippa’s first puzzle washes ashore at 8%.*Play next/);
  assert.match(await tap('isle:blitzbay'), /A misty island.*Race Swoop/);
  { await still(); const c = await pt('isle:sunrise'); await t.page.mouse.click(c.x, c.y); await t.page.waitForTimeout(600); await still();
    assert.equal(await t.page.evaluate(() => { const I = window.bloppitIsland3(), s = I.isles.sunrise; return Math.hypot(I.ctl.target.x - s.x, I.ctl.target.z - s.z) < 1; }), true);   // flew there
    assert.match(await t.text('#isWorld .is3-views .v-name'), /misty island/);
    assert.equal(await t.page.evaluate(() => document.querySelector('#isWorld .is3-views .v-world').hidden), false);   // one tap back to the whole world, from any view
    await t.page.evaluate(() => { document.querySelector('#isTip .tt-x')?.click(); document.querySelector('#isWorld .is3-views .v-world').click(); }); await still();
    assert.equal(await t.text('#isWorld .is3-views .v-name'), 'Bloppitopia'); assert.equal(await t.page.evaluate(() => document.querySelector('#isWorld .is3-views .v-world').hidden), true);
    // the whole map turns too: a one-finger drag looks around it (the arrows move between views)
    const dir = () => t.page.evaluate(() => { const I = window.bloppitIsland3(); return I.cam.position.clone().sub(I.ctl.target).normalize().toArray().map((v) => +v.toFixed(2)); });
    const d0 = await dir(), w = await t.page.evaluate(() => { const r = document.querySelector('#isWorld canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .8 }; });
    await t.page.mouse.move(w.x + 120, w.y); await t.page.mouse.down(); await t.page.mouse.move(w.x, w.y, { steps: 5 }); await t.page.mouse.move(w.x - 120, w.y, { steps: 5 }); await t.page.mouse.up(); await t.page.waitForTimeout(400); await still();
    assert.notDeepEqual(await dir(), d0); assert.equal(await t.text('#isWorld .is3-views .v-name'), 'Bloppitopia');
    await t.page.evaluate(() => window.bloppitView(1)); await still(); assert.equal(await t.text('#isWorld .is3-views .v-name'), 'Home Island');
    // in a chosen view the camera is free: the same drag looks around instead of moving on
    { const d1 = await dir(), m = await t.page.evaluate(() => { const r = document.querySelector('#isWorld canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .4 }; });
      await t.page.mouse.move(m.x + 120, m.y); await t.page.mouse.down(); await t.page.mouse.move(m.x, m.y, { steps: 5 }); await t.page.mouse.move(m.x - 120, m.y, { steps: 5 }); await t.page.mouse.up(); await t.page.waitForTimeout(600); await still();
      assert.notDeepEqual(await dir(), d1); assert.equal(await t.text('#isWorld .is3-views .v-name'), 'Home Island'); }
    await t.page.evaluate(() => window.bloppitView(0)); await still(); }
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
  // buy a bench: the island shows it and says how to move it; drag it and it stays there
  await still(); await t.page.evaluate(() => document.getElementById('isDecor').click());
  await t.page.evaluate(() => { const b = document.querySelector('#decorGrid [data-decor="bench"]'); b.click(); });
  assert.match(await t.text('#decorGrid [data-decor="bench"]'), /Tap again to buy/);
  await t.page.evaluate(() => document.querySelector('#decorGrid [data-decor="bench"]').click());
  await t.page.waitForFunction(() => /bench is here.*drag it/i.test(document.querySelector('#isWorld .is3-banner')?.textContent || ''), null, { timeout: 30000, polling: 100 })
    .catch(async (e) => { console.log('NOBANNER', await t.page.evaluate(() => JSON.stringify([document.querySelector('#isWorld .is3-banner')?.textContent, window.bloppitIsland3().on, JSON.parse(localStorage.getItem('bloppit-world-v1')).decor, document.getElementById('isShop').hidden]))); throw e; });
  const benchMoved = () => t.page.waitForFunction(() => Array.isArray((JSON.parse(localStorage.getItem('bloppit-world-v1')).pos || {})['decor:bench']), null, { timeout: 6000, polling: 100 }).then(() => true, () => false);
  let moved = false;
  for (let i = 0; i < 2 && !moved; i++) { await still(); const bc = await pt('decor:bench');
    await t.page.mouse.move(bc.x, bc.y); await t.page.mouse.down(); await t.page.mouse.move(bc.x + 20, bc.y + 10, { steps: 4 }); await t.page.mouse.move(bc.x + 70, bc.y + 30, { steps: 8 }); await t.page.mouse.up();
    moved = await benchMoved(); if (!moved) console.log('BENCHMISS', JSON.stringify(bc), await t.page.evaluate((c) => window.bloppitPick(c.x, c.y) + ' ' + JSON.stringify(window.bloppitIsland3().ctl.target) + ' fly:' + !!window.bloppitIsland3().fly + ' tip:' + document.getElementById('isTip').hidden + ' el:' + document.elementFromPoint(c.x, c.y)?.className + ' scrollY:' + scrollY + ' canvas:' + JSON.stringify(document.querySelector('#isWorld canvas').getBoundingClientRect()) + ' head:' + document.querySelector('header.top').getBoundingClientRect().bottom, bc)); }
  assert.ok(moved, 'the bench stays where it was dragged');
  // put the bench away from its card, then back from the Decorate list
  await still(); { const bc = await pt('decor:bench'); await t.page.mouse.click(bc.x, bc.y); }
  await t.page.waitForFunction(() => !document.getElementById('isTip').hidden && /Bench/.test(document.getElementById('isTip').textContent), null, { timeout: 6000, polling: 100 });
  await t.page.evaluate(() => [...document.querySelectorAll('#isTip [data-a]')].find((b) => /Put it away/.test(b.textContent)).click()); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).away['decor:bench'] > 0), true);
  assert.equal(await pt('decor:bench'), null);   // gone from the island
  await t.page.evaluate(() => document.getElementById('isDecor').click());
  assert.match(await t.text('#decorGrid [data-decor="bench"]'), /tap to put it back/);
  await t.page.evaluate(() => document.querySelector('#decorGrid [data-decor="bench"]').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).away['decor:bench'] > 0), false);
  assert.ok(await pt('decor:bench'), 'the bench is back');
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
  await autoPlace(a.page, +(await a.text('#progress')).match(/0 of (\d+)/)[1]); await finishFirst(a.page);
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

test('island: a new build always shows, even when older models were dragged into every space', { skip: skip() }, async () => {
  const t = await open('?nosplash=1#island', { init: { fn: () => { const builds = {}, log = [], pos = {}; const spots = [[485, 530], [535, 540], [565, 495]];
    for (let i = 0; i < 4; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); if (i < 3) pos[k] = spots[i]; }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 40, bonus: 0, builds, log, pos, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 4, finished: 4, welcome: 1 })); } } });
  const keys = await t.page.evaluate(() => window.bloppitIsland3().shown.list.map((m) => m.key));
  assert.equal(keys.length, 3); assert.ok(keys.includes('m:Model3:13'), keys.join());   // the newest build is on the island
  assert.ok(!keys.includes('m:Model0:10'));                                           // the oldest steps aside
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('living characters: on the island (dressed pup, the friends, tap for a reaction), the wardrobe, the build buddy as Swoop on his turn, and still drawings with ?chars3d=0', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, wear: { head: ['beanie', 2] } })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } };
  let t = await open('?nosplash=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => { const c = window.bloppitChars3d().island; return c.bloppit && c.pup && c.longtail; }, null, { timeout: 90000, polling: 500 });
  const d = await t.page.evaluate(() => { const I = window.bloppitIsland3(), P = I.p3.P; return { wear: P.wear, ci: P.ci, studs: P.R.stage + 1, mode: I.b3.ctl.mode, clips: window.bloppitChars3d().island.clips, sprite: !!I.bloppitSprite }; });
  assert.deepEqual(d.wear, { head: ['beanie', 2] }); assert.equal(d.studs, 1); assert.equal(d.clips[0], 'idle'); assert.equal(d.mode, 2); assert.equal(d.sprite, false);   // the living drawing, at rest
  // the friends on their islands are living drawings too
  assert.equal(await t.page.evaluate(() => Object.values(window.bloppitIsland3().cast).filter((K) => K.i3).length), 4);
  // tap Bloppit: a reaction and a word
  { const p = await t.page.evaluate(() => window.bloppitIslandPoint('bloppit')); await t.page.mouse.click(p.x, p.y); await t.page.waitForTimeout(500); }
  assert.notEqual(await t.page.evaluate(() => window.bloppitChars3d().island.clips[0]), 'idle');
  assert.equal(await t.page.evaluate(() => document.querySelector('#isWorld .is3-say').hidden), false);
  // the pup's card → the wardrobe: a 3D preview, outfits named for its age, shoes and its toy
  await t.page.waitForTimeout(2500);
  for (let i = 0; i < 3 && !(await t.page.evaluate(() => /Wardrobe/.test(document.getElementById('isTip').textContent) && !document.getElementById('isTip').hidden)); i++) {
    const p = await t.page.evaluate(() => window.bloppitIslandPoint('pup')); await t.page.mouse.click(p.x, p.y); await t.page.waitForTimeout(1500); }
  await t.page.evaluate(() => [...document.querySelectorAll('#isTip [data-a]')].find((b) => /Wardrobe/.test(b.textContent)).click());
  await t.page.waitForFunction(() => document.getElementById('accDlg').open && document.getElementById('accPic').classList.contains('c3on'), null, { timeout: 20000, polling: 250 });
  const list = await t.text('#accList'); assert.match(list, /Beanie/); assert.match(list, /Shoes/); assert.match(list, /Toy boat/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
  // a race against Swoop (full throttle): the buddy is Bloppit, and Swoop himself when it's his turn
  t = await open('?nosplash=1&welcome=0', { init: seed });
  await t.page.evaluate(() => document.querySelector('[data-go="cpu"]').click()); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  await t.page.waitForFunction(() => window.bloppitChars3d().views.includes('bud-art'), null, { timeout: 60000, polling: 500 });
  assert.equal(await t.page.evaluate(() => document.querySelector('#buddy .bud-art').__who), 'bloppit');
  await t.page.evaluate(() => document.getElementById('buddy').classList.add('big'));
  await t.page.waitForFunction(() => document.querySelector('#buddy .bud-art').__who === 'swoop', null, { timeout: 30000, polling: 250 });
  assert.deepEqual(t.errors, []); await t.ctx.close();
  // drawings only
  t = await open('?nosplash=1&chars3d=0&hour=11#island', { init: seed }); await t.page.waitForTimeout(4000);
  assert.deepEqual(await t.page.evaluate(() => { const c = window.bloppitChars3d(); return [c.on, c.island.bloppit, !!window.bloppitIsland3().bloppitSprite]; }), [false, false, true]);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});
