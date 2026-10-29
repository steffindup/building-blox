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
  const u = url.replace(/^([^#]*)/, (m) => m + (m.includes('?') ? '&' : '?') + 'lite3d=1' + (/films=/.test(m) ? '' : '&films=0'));   // a light 3D world: the test machine has no GPU; the island films only in the tests about them
  await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  return { page, ctx, errors, view: () => page.evaluate(() => [...document.querySelectorAll('section.view')].find((v) => !v.hidden)?.id), text: (sel) => page.evaluate((s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim(), sel) };
}
const autoPlace = async (page, n) => { for (let i = 0; i < n; i++) { await page.evaluate(() => document.getElementById('autoBtn')?.click()); await page.waitForTimeout(1100); } };

test('first visit: name the otter first, then the arrival film, which can be skipped straight to the home', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  await t.page.evaluate(() => document.getElementById('hmCont').click());
  // the otter gets its colour and name before it sails: no film yet
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 10000 });
  assert.match(await t.text('#pupTitle'), /Meet your otter/); assert.match(await t.text('#pupLead'), /about to sail to Bloppitopia and meet Bloppit/);
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-cine')), true);
  await t.page.evaluate(() => document.getElementById('pupSuggest').click()); await t.page.waitForTimeout(200);
  assert.match(await t.text('#pupLater'), /Set sail/);
  const nm = await t.page.evaluate(() => document.getElementById('pupSuggest').textContent.replace('Call it ', ''));
  await t.page.evaluate(() => document.getElementById('pupLater').click());
  await t.page.waitForFunction(() => !!document.querySelector('#isWorld .is3-cine .cn-skip'), null, { timeout: 10000 }); await t.page.waitForTimeout(800);
  // the arrival is the film (public/video/arrival.mp4), playing
  assert.equal(await t.page.evaluate(() => { const v = document.querySelector('#isWorld .is3-cine video.cn-film'); return !!v && /\/video\/arrival\.mp4$/.test(v.src) && !!window.bloppitIsland3().cine.film; }), true);
  const t0 = Date.now(); await t.page.evaluate(() => document.querySelector('#isWorld .is3-cine .cn-skip').click());
  await t.page.waitForFunction((nm) => (document.querySelector('#isWorld .is3-banner')?.textContent || '').includes(`${nm} has arrived`), nm, { timeout: 6000 });
  // then straight to the home: no card after the trip
  await t.page.waitForFunction(() => /Build Our First Home/.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, { timeout: 8000 });
  assert.ok(Date.now() - t0 < 8000); assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), false);
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
  // arrived but nothing built yet: the menu still leads back to the island
  assert.equal(await u.page.evaluate(() => document.getElementById('hmWorld').hidden), false);
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
  // "Pick later" sets sail too, and the card doesn't come back after the trip
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 10000 });
  await t.page.evaluate(() => document.getElementById('pupLater').click());
  await t.page.waitForFunction(() => window.bloppitIsland3 && window.bloppitIsland3().cine, null, { timeout: 10000 }); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-cine video') && window.bloppitIsland3().cine.t > 0.5), true);
  await t.page.evaluate(() => document.querySelector('#isWorld .is3-cine .cn-skip').click());
  await t.page.waitForFunction(() => /Build Our First Home/.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, { timeout: 8000 });
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), false);
  // with no name yet the films call it "pup"
  assert.equal(await t.page.evaluate(() => window.bloppitFilmLine('We did it, {name}!')), 'We did it, pup!');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('first visit: Start here → name the otter → a boat brings it → Build Our First Home → the home appears', { skip: skip() }, async () => {
  const t = await open('?nosplash=1'); const shot = (n) => process.env.SHOTS ? t.page.screenshot({ path: `${process.env.SHOTS}/first-${n}.png` }) : null;
  assert.equal(await t.view(), 'view-home'); assert.match(await t.text('#hmContT'), /Start here: meet your otter/);
  await t.page.evaluate(() => document.getElementById('hmCont').click());
  // first the otter's look and name, on the island, before it sails
  await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 10000 }); await t.page.waitForTimeout(500); await shot(1);
  assert.equal(await t.view(), 'view-island');
  assert.equal(await t.page.evaluate(() => !!document.querySelector('.is3-cine') || document.getElementById('view-island').classList.contains('cine')), false);
  assert.match(await t.text('#pupTitle'), /Meet your otter/); assert.equal(await t.page.evaluate(() => document.getElementById('pupSuggest').hidden), false);
  // the otter's brick: one stud, never red; the colour follows the pick
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#pupPic .pupfig path[opacity]').length), 1);
  await t.page.evaluate(() => document.querySelector('#pupCols [data-col="2"]').click()); await t.page.waitForTimeout(200);
  assert.match(await t.page.evaluate(() => document.querySelector('#pupPic .pupfig path:nth-of-type(2)').getAttribute('fill')), /^rgb\(31,/);
  await t.page.evaluate(() => document.querySelector('#pupOutfit [data-out="scarf"]').click());
  // naming it yourself is the main way, taken as you type: no letters is refused, digits and symbols are dropped
  await t.page.fill('#pupIn', '7!'); await t.page.waitForTimeout(200);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupErr').hidden), false); assert.match(await t.text('#pupLater'), /Pick later/);
  await t.page.fill('#pupIn', 'Captain Fizz!7'); await t.page.waitForTimeout(300);
  // the card stays open while typing: the look can still change, and "Set sail!" finishes
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open && document.getElementById('pupErr').hidden && !document.querySelector('#pupOwn button')), true);
  assert.match(await t.text('#pupTitle'), /Meet Captain Fizz!/); assert.match(await t.text('#pupLater'), /Set sail/);
  await t.page.evaluate(() => document.getElementById('pupLater').click()); await t.page.waitForTimeout(2200); await shot(2);
  assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), false);
  // then the arrival plays like a film: a Skip button, over the island
  assert.equal(await t.page.evaluate(() => !!document.querySelector('#isWorld .is3-cine .cn-skip') && document.getElementById('view-island').classList.contains('cine')), true);
  await t.page.waitForFunction(() => /Build Our First Home/.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, { timeout: 45000 }); await t.page.waitForTimeout(500); await shot(3);
  assert.equal(await t.page.evaluate(() => !!document.querySelector('.is3-cine') || document.getElementById('view-island').classList.contains('cine') || document.getElementById('pupDlg').open), false);
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
  // the brick in hand starts beside the build, not on top of it
  const pl = await t.page.evaluate(() => window.bloppitPlacedBoxes());
  assert.ok(pl.length && !pl.some((b) => g.ax < b.x + b.sx && g.ax + g.sx > b.x && g.az < b.z + b.sz && g.az + g.sz > b.z), 'the brick in hand is clear of the build');
  // press a little off the brick's middle (a fingertip) and slide it in towards the middle of the stage
  const mid = await t.page.evaluate(() => { const r = document.querySelector('#view-build canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await slide(g.x + 18, g.y + 12, Math.sign(mid.x - g.x) * 9, Math.sign(mid.y - g.y) * 4);
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
  assert.ok(await t.page.evaluate(() => { const e = document.getElementById('winChars'); return e.hidden || (e.__cv3?.insts || []).some((i) => i.id === 'tiny'); }), 'Tiny joins a Frog Trail finish (unless the real picture is shown)');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Tiny is a real 3D model (approved v16) with his eight clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('tiny', 'full', 200, { model: true, clip: 'cheer', t: 1 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().tiny }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['cheer', 'focused', 'hop', 'idle', 'offer', 'oops', 'release', 'whistle'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Pippa is a real 3D model (approved v2) with her nine clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('pippa', 'full', 200, { model: true, clip: 'greeting', t: .8 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().pippa }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['cheer', 'excited', 'greeting', 'hop', 'idle', 'offer', 'release', 'wink', 'wobble'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Bibi is a real 3D model (approved v4) with his nine clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('bibi', 'full', 200, { model: true, clip: 'roar', t: 1 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().bibi }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['cheer', 'greeting', 'hop', 'idea', 'idle', 'offer', 'proud', 'release', 'roar'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Swoop is a real 3D model (approved v1) with his ten clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('swoop', 'full', 200, { model: true, clip: 'challenge', t: 1 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().swoop }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['challenge', 'cheer', 'focused', 'greeting', 'hop', 'idle', 'offer', 'release', 'surprised', 'wink'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Nora is a real 3D model (v1) with her nine clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('nora', 'full', 200, { model: true, clip: 'aha', t: .8 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().nora }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['aha', 'cheer', 'focused', 'hint', 'hop', 'idle', 'offer', 'release', 'thinking'] });
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
  assert.deepEqual(ui, { tag: false, race: true, banner: true, tab: 'create' });   // the Weekly is Bibi's: it lives with Quick Build
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

test('island Play: Bloppitopia keeps the recommended next play; an island plays its own next step; a complete one offers Back to Bloppitopia or Play anyway', { skip: skip() }, async () => {
  const seed = (n) => { const builds = {}, log = [], best = {}; for (let i = 0; i < n; i++) { const k = `t:otter:${i}`; builds[k] = { n: 40, s: 3, t: 1e12 + i, c: 1 }; log.push(k); best[i] = 3; }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, pick: 'treehouse', isle: 1, arrived: 1 }));
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: n, finished: n, welcome: 1 })); };
  for (const n of [5, 15]) {
    const t = await open('?nosplash=1&films=0#island', { init: { fn: seed, arg: n } });
    await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 });
    const at = async (i) => { await t.page.evaluate((i) => window.bloppitView(i), i); await t.page.waitForTimeout(100);
      return t.page.evaluate(() => { const b = document.querySelector('.is3-play'), a = document.querySelector('.is3-alt'); return [document.querySelector('.v-name').textContent, b.textContent, a.hidden ? '' : a.textContent]; }); };
    const [, world] = await at(0); assert.match(world, /^▶ Play next/);
    const [frog, play, alt] = await at(3); assert.equal(frog, 'Frog Forest');
    if (n === 5) { assert.match(play, /^▶ PlayFrog Trail level 6/); assert.equal(alt, ''); }
    else { assert.match(play, /Back to Bloppitopia✓ Frog Forest is complete!/); assert.equal(alt, '▶ Play anyway'); }
    const [, brain] = await at(4); assert.match(brain, /^▶ PlayBrain Trail level 1/);
    assert.deepEqual(t.errors, []); await t.ctx.close();
  }
});

test('Nora can be tapped on Brainpeak at every stage (the mountain never breaks a tap; a friend wins over the land behind)', { skip: skip() }, async () => {
  const seed = (n) => { const builds = {}, log = [], g = { best: {}, bbest: {}, sbest: {} }; for (let i = 0; i < n; i++) { const k = `t:brain:${i}`; builds[k] = { n: 40, s: 3, t: 1e12 + i, c: 1 }; log.push(k); g.bbest[i] = 3; }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, pick: 'treehouse', isle: 1, arrived: 1 }));
    localStorage.setItem('building-blox-game-v1', JSON.stringify(g)); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); };
  for (const n of [0, 3, 15]) {
    const t = await open('?nosplash=1&films=0#island', { init: { fn: seed, arg: n } });
    await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 });
    await t.page.evaluate(() => window.bloppitView(4)); await t.page.waitForTimeout(1500);
    const r = await t.page.evaluate(() => { const I = window.bloppitIsland3(), g = I.cast.nora.g, cv = I.r.domElement.getBoundingClientRect(), out = [];
      for (const [dx, fy] of [[0, .3], [0, .6], [-.35, .5], [.35, .5], [0, .9]]) { const v = g.localToWorld(new THREE.Vector3(dx, .2 + 2.3 * fy, 0)).project(I.cam);
        out.push(window.bloppitPick(cv.left + (v.x + 1) / 2 * cv.width, cv.top + (1 - v.y) / 2 * cv.height)); } return out; });
    assert.deepEqual(r, Array(5).fill('char:nora'), `${n} levels: ${r}`);
    assert.deepEqual(t.errors, []); await t.ctx.close();
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
  assert.match(await tapChar('longtail:easy'), /Swoop the Longtail.*(Blitz Bay’s racer|Asleep on Blitz Bay).*goggles.*Secret.*Speeds beaten.*Did you know\?.*tropicbirds.*Race 1 of 15.*Choose your own race/);
  assert.match(await tapChar('char:pippa'), /Pippa the Penguin.*Sunrise Shores.*Secret.*A yellow two-stud brick.*still in the mist.*Play Pippa’s puzzle/);
  assert.match(await tapChar('pup'), /Bubbles.*Level \d+ Pup.*1 stud.*Otter level.*Wardrobe.*Name or colour/);
  assert.match(await tap('decor:flag'), /Flag/);
  assert.match(await tap('isle:sunrise'), /A misty island.*Pippa’s first puzzle washes ashore at 9%.*Back to Bloppitopia/);
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
  // the board on the Weekly page (Bibi's, through Quick Build)
  await t.page.evaluate(() => { document.getElementById('tab-create').click(); document.getElementById('qbWeekly').click(); }); await t.page.waitForTimeout(1200);
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
  await t.page.evaluate(() => document.querySelector('[data-qb-go="draw"]').click()); await t.page.waitForTimeout(300);   // Quick Build: the Draw your own tile opens its screen
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

test('Frog Forest films: its arrival film plays when it rises from the mist, its completion film when it is complete, then both are in My films', { skip: skip() }, async () => {
  // every Frog Trail level done, and the island not yet revealed: both moments are new
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: ['brickworks-arrival'] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 }));
    const best = {}; for (let i = 0; i < 15; i++) best[i] = 3; localStorage.setItem('building-blox-game-v1', JSON.stringify({ best }));
    localStorage.setItem('bloppit-seen3-v1', JSON.stringify(['home:home1'])); } };
  const t = await open('?nosplash=1&hour=11&films=1#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'frog-arrival', null, { timeout: 30000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-arrival\.mp4$/);
  await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
  // Tiny welcomes the otter by name when he's on screen (and says nothing before)
  assert.equal(await t.page.evaluate(() => window.bloppitFilmSay()), null);
  await t.page.evaluate(() => { document.querySelector('.is3-film video').playbackRate = 4; });   // (the test server can't seek)
  await t.page.waitForFunction(() => /^TinyWelcome to Frog Forest, \S+!$/.test(window.bloppitFilmSay() || ''), null, { timeout: 20000 });
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  // then the island rises as before, and later the completion film plays before the fireworks
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'frog-complete', null, { timeout: 90000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-complete\.mp4$/);
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  await t.page.waitForFunction(() => /Frog Forest is complete/.test(document.querySelector('#isWorld .is3-banner')?.textContent || ''), null, { timeout: 20000 });
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-film') && window.bloppitFilmOn() === null), true);
  await t.ctx.close();
  // My films lists all three, in order
  const u = await open('?nosplash=1', { init: seed });
  await u.page.evaluate(() => document.getElementById('hmFilms').click()); await u.page.waitForTimeout(400);
  assert.deepEqual(await u.page.evaluate(() => [...document.querySelectorAll('#filmList [data-film]')].map((b) => b.dataset.film)), ['arrival', 'frog-arrival', 'frog-complete', 'brickworks-arrival']);   // (its three quick builds found Brickworks Island too)
  // and the lines play in My films too: Tiny's "We did it" in the completion film
  await u.page.evaluate(() => document.querySelector('#filmList [data-film="frog-complete"]').click());
  await u.page.waitForFunction(() => document.getElementById('filmVid').readyState >= 1, null, { timeout: 15000 });
  await u.page.evaluate(() => { const v = document.getElementById('filmVid'); v.muted = true; v.playbackRate = 4; v.play(); });
  await u.page.waitForFunction(() => /^TinyWe did it, \S+!$/.test(window.bloppitFilmSay() || ''), null, { timeout: 20000 });
  assert.deepEqual(u.errors, []); await u.ctx.close();
});

test('Frog Forest arrival film: Play next to Frog Trail level 1 plays it first, then the puzzle; it never plays twice', { skip: skip() }, async () => {
  // the first home is built, Frog Forest not found yet
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Cottage:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1 } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&hour=11&films=1#island', { init: seed });
  await t.page.waitForFunction(() => /Frog Trail level 1/.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, { timeout: 30000 });
  await t.page.evaluate(() => document.querySelector('#isWorld .is3-play').click());
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'frog-arrival', null, { timeout: 15000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-arrival\.mp4$/);
  await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  // then the puzzle: Frog Trail level 1
  await t.page.waitForFunction(() => [...document.querySelectorAll('section.view')].find((v) => !v.hidden)?.id === 'view-build' && /Level 1/.test(document.getElementById('status').textContent), null, { timeout: 15000 });
  assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).films), ['frog-arrival']);
  // finishing level 1 raises Frog Forest from the mist, without the film again
  await t.page.evaluate(() => { const g = { best: { 0: 3 } }; localStorage.setItem('building-blox-game-v1', JSON.stringify(g)); location.hash = ''; });
  await t.page.goto(t.page.url().replace(/#.*$/, '') + '#island', { waitUntil: 'load' });
  await t.page.waitForFunction(() => /Frog Forest/.test(document.querySelector('#isWorld .is3-banner')?.textContent || ''), null, { timeout: 30000 });
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('island arrival films from the menu: vs Swoop plays Blitz Bay’s first, Quick Build plays Brickworks Island’s, each once', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Cottage:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1', { init: seed });
  const film = async (id, file) => {
    await t.page.waitForFunction((id) => window.bloppitFilmOn() === id, id, { timeout: 15000, polling: 200 });
    assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), new RegExp(`/video/${file}\\.mp4$`));
    await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
    await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click()); await t.page.waitForTimeout(1200); };
  await t.page.evaluate(() => document.querySelector('#view-home [data-go="cpu"]').click());
  await film('blitzbay-arrival', 'blitz-bay-arrival');
  assert.equal(await t.view(), 'view-blitz');
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(500);
  await t.page.evaluate(() => document.querySelector('#view-home [data-go="quick"]').click());
  await film('brickworks-arrival', 'brickworks-arrival');
  // seen: not again
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(500);
  await t.page.evaluate(() => document.querySelector('#view-home [data-go="cpu"]').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null); assert.equal(await t.view(), 'view-blitz');
  assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).films), ['blitzbay-arrival', 'brickworks-arrival']);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('living characters: on the island (dressed pup, the friends, tap for a reaction), the wardrobe, the build buddy as Swoop on his turn, and still drawings with ?chars3d=0', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, wear: { head: ['beanie', 2] } })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } };
  let t = await open('?nosplash=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => { const c = window.bloppitChars3d().island; return c.bloppit && c.pup && c.longtail; }, null, { timeout: 90000, polling: 500 });
  const d = await t.page.evaluate(() => { const I = window.bloppitIsland3(), P = I.p3.P; return { wear: P.wear, ci: P.ci, studs: P.R.stage + 1, mode: I.b3.ctl.mode, clips: window.bloppitChars3d().island.clips, sprite: !!I.bloppitSprite }; });
  assert.deepEqual(d.wear, { head: ['beanie', 2] }); assert.equal(d.studs, 1); assert.equal(d.clips[0], 'idle'); assert.equal(d.mode, 2); assert.equal(d.sprite, false);   // the living drawing, at rest
  // a new brick colour shows on the otter standing on the island straight away, and stays after the card closes
  await t.page.evaluate(() => window.bloppitPup()); await t.page.waitForTimeout(300);
  await t.page.evaluate(() => document.querySelector('#pupCols [data-col="10"]').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().p3.P.ci), 10);
  await t.page.evaluate(() => document.getElementById('pupLater').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().p3.P.ci), 10);
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

test('Mystery Island label: "N islands to go!" and a bar that counts every piece built on the five islands', { skip: skip() }, async () => {
  // Frog Forest complete (15 of 15) and 6 Brain Trail levels: 1 island done, 21 of 73 pieces
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Cottage:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 200, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: ['frog-arrival', 'frog-complete', 'brainpeak-arrival', 'brainpeak-complete'] }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 }));
    const best = {}, bbest = {}; for (let i = 0; i < 15; i++) best[i] = 3; for (let i = 0; i < 6; i++) bbest[i] = 2; best[40] = 3;   // (an old level that no longer exists doesn't count)
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best, bbest }));
    localStorage.setItem('bloppit-seen3-v1', JSON.stringify(['home:home1', 'isle:otterwood', 'isle:brainpeak', 'done:otterwood', ...Array.from({ length: 15 }, (_, i) => 'otterwood:' + i), ...Array.from({ length: 6 }, (_, i) => 'brainpeak:' + i)])); } };
  const t = await open('?nosplash=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => !!document.querySelector('.is3-myst'), null, { timeout: 30000 });
  const m = await t.page.evaluate(() => { const l = document.querySelector('.is3-myst'); return { sub: l.querySelector('small').textContent, now: +l.querySelector('[role=progressbar]').getAttribute('aria-valuenow') }; });
  assert.equal(m.sub, '4 islands to go!'); assert.equal(m.now, Math.round(100 * 21 / 73));
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Pippa’s tab: her puzzles and a message in a bottle once a day (+5 XP); the Weekly is Bibi’s, under Quick Build', { skip: skip() }, async () => {
  const seed = { fn: () => { localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 }));
    if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: {}, log: [], decor: [], free: [] })); } };
  const t = await open('?nosplash=1#island', { init: seed });
  // a bottle is waiting: a dot on Pippa's tab
  let b = await t.page.evaluate(() => window.bloppitBottle()); assert.equal(b.dot, true); assert.deepEqual(b.days, []);
  await t.page.evaluate(() => document.getElementById('tab-sea').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-game'); assert.equal(await t.page.evaluate(() => document.getElementById('view-game').dataset.sub), 'sea');
  assert.equal(await t.page.evaluate(() => document.querySelector('.tab[aria-selected="true"]').id), 'tab-sea');
  assert.equal(await t.page.evaluate(() => getComputedStyle(document.getElementById('bottleCard')).display !== 'none'), true);
  const xp0 = b.xp; await t.page.evaluate(() => document.getElementById('btOpen').click()); await t.page.waitForTimeout(300);
  b = await t.page.evaluate(() => window.bloppitBottle()); assert.equal(b.xp, xp0 + 5); assert.deepEqual(b.days, [b.day]); assert.equal(b.dot, false);
  assert.match(await t.text('#btMsg'), /\w/); assert.equal(await t.page.evaluate(() => document.getElementById('btOpen').hidden), true);
  // only one a day
  await t.page.evaluate(() => document.getElementById('btOpen').click()); b = await t.page.evaluate(() => window.bloppitBottle()); assert.equal(b.xp, xp0 + 5);
  // the bottle is only on Pippa's page, not the Frog Trail
  await t.page.evaluate(() => document.getElementById('tab-game').click()); await t.page.waitForTimeout(500);
  assert.equal(await t.page.evaluate(() => getComputedStyle(document.getElementById('bottleCard')).display), 'none');
  // Bibi's Weekly is on Quick Build, and the Weekly page lights up the Quick Build tab
  await t.page.evaluate(() => document.getElementById('tab-create').click()); await t.page.waitForTimeout(500);
  assert.match(await t.text('#qbWeekly'), /Bibi’s Weekly Bloppit/);
  await t.page.evaluate(() => document.getElementById('qbWeekly').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-daily'); assert.equal(await t.page.evaluate(() => document.querySelector('.tab[aria-selected="true"]').id), 'tab-create');
  assert.match(await t.text('#view-daily .char-hero'), /Bibi/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Play next never sends you to a finished island while another has something ready', { skip: skip() }, async () => {
  // Brickworks complete (15 photo builds), one Blitz win, and Pippa's first puzzles washed ashore; Play next last went to Blitz
  const seed = { fn: () => { const builds = {}, log = []; for (let i = 0; i < 15; i++) { builds['p:x' + i] = { n: 20, s: 3, k: 'quick', t: 1 }; log.push('p:x' + i); }
    builds['m:Swoop race:12'] = { n: 12, s: 1, k: 'blitz', t: 1 }; log.push('m:Swoop race:12');
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 }));
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds, log, decor: [], free: [] }));
    localStorage.setItem('bloppit-next-v1', 'blitz'); } };
  const t = await open('?nosplash=1#island', { init: seed });
  const n = await t.page.evaluate(() => ({ next: window.bloppitNext.next(), cands: window.bloppitNext.cands(), done: window.bloppitNext.complete() }));
  assert.ok(n.done.includes('brickworks')); assert.ok(n.cands.includes('library'), 'the library is still a candidate');
  assert.notEqual(n.next.kind, 'library', 'but a finished island is not offered');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the 3D pups: Pup, Splash and Legend hold a 1-, 2- and 3-stud brick in the child’s colour and wear the game’s outfits', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  const a = await t.page.evaluate(() => window.bloppitPup3('pup0', 0, {}));
  assert.equal(a.kind, 'model'); assert.deepEqual(a.bricks, [1]); assert.deepEqual(a.outfits, []); assert.deepEqual(a.extras, []); assert.ok(a.lids >= 2, 'eyelids to blink'); assert.ok(a.clips >= 14);
  assert.equal(a.hex, '0055bf', 'the child’s blue');
  const b = await t.page.evaluate(() => window.bloppitPup3('pup1', 3, { head: ['beanie', 0], neck: ['scarf', 2], feet: ['shoes', 0] }));
  assert.deepEqual(b.bricks, [2]); assert.deepEqual(b.outfits, ['beanie', 'scarf']); assert.deepEqual(b.extras, ['shoes']);
  const c = await t.page.evaluate(() => window.bloppitPup3('pup2', 6, { head: ['moon', 0], face: ['glasses', 1], prop: ['prop', 0] }));
  assert.deepEqual(c.bricks, [3]); assert.deepEqual(c.outfits, ['crown', 'sunglasses']); assert.deepEqual(c.extras, ['accessory']);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('stars, Galaxy Blocks and the Otter Level: one job each; the otter grows by level and never shrinks', { skip: skip() }, async () => {
  // 13 big builds since the change: about 1,400 XP (Level 8) → a Legend, by level not builds
  const big = { fn: () => { const builds = {}, log = []; for (let i = 0; i < 13; i++) { builds['p:big' + i] = { n: 200, s: 2, k: 'quick', t: Date.now() }; log.push('p:big' + i); }
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 }));
    if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds, log, decor: ['flag'], free: [], pick: 'treehouse' })); } };
  let t = await open('?nosplash=1', { init: big });
  let w = await t.page.evaluate(() => window.bloppitWorld());
  assert.ok(w.level >= 8); assert.equal(w.stage, 'Legend');
  assert.equal(w.stars, 26, '★ are never spent'); assert.equal(w.galaxy, 26 - 3, 'the flag cost 3 Galaxy Blocks');
  await t.ctx.close();
  // 30 small builds from before the change: a Splash by builds keeps it, even at a low level
  const old = { fn: () => { const builds = {}, log = []; for (let i = 0; i < 30; i++) { builds['p:old' + i] = { n: 10, s: 1, k: 'quick', t: 1.7e12 }; log.push('p:old' + i); }
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 }));
    if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds, log, decor: [], free: [], pick: 'treehouse' })); } };
  t = await open('?nosplash=1', { init: old });
  w = await t.page.evaluate(() => window.bloppitWorld()); assert.equal(w.stage, 'Splash');
  // a Frog Trail level with a hint: one ★ (finished), a Galaxy Block for it, no points anywhere
  await t.page.evaluate(() => window.bloppitLevel('otter', 0)); await t.page.waitForTimeout(1200);
  assert.equal(await t.text('#hintBtn'), 'Hint'); assert.equal(await t.text('#autoBtn'), 'Place one for me');
  await t.page.evaluate(() => document.getElementById('hintBtn').click()); await t.page.waitForTimeout(200);
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('#gbPts i').length ? document.getElementById('gbPts').textContent.length - document.querySelector('#gbPts i').textContent.length : 3), 1);
  for (let k = 0; k < 120; k++) { const d = await t.page.evaluate(() => { const m = /(\d+) of (\d+)/.exec(document.getElementById('progress').textContent); if (m && m[1] === m[2]) return true; window.bloppitPlaceRight(); return false; }); if (d) break; await t.page.waitForTimeout(150); }
  await t.page.waitForFunction(() => document.getElementById('winDlg').open, null, { timeout: 20000 });
  const rows = await t.text('#winRows'); assert.match(rows, /Built the Heart/); assert.match(rows, /Help used \(1\)/); assert.match(rows, /Galaxy Blocks ?\+1/); assert.doesNotMatch(rows, /point/i);
  assert.match(await t.text('#winBest'), /Frog Trail: 1 of 45 ★/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

