// End-to-end in headless Chromium against the dev server: node --test tests/browser.test.mjs
// Needs the playwright dev dependency and a Chromium (PLAYWRIGHT_CHROMIUM=/path/to/chrome, or playwright's own).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './devserver.mjs';
let chromium; try { ({ chromium } = await import('playwright')); } catch { chromium = null; }

const PORT = 8799, BASE = `http://localhost:${PORT}/game/`;
let server, browser;
before(async () => { server = await start(PORT); if (chromium) browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: process.env.PLAYWRIGHT_ARGS ? process.env.PLAYWRIGHT_ARGS.split(' ') : ['--use-gl=swiftshader'] }); });
const skip = () => !chromium;  // decided when the file loads; the browser itself starts in before()
after(async () => { if (browser) await browser.close(); server?.close(); });

// Keep placing until the first build is really finished (slow machines), then let the home appear
async function finishFirst(page) {
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => (JSON.parse(localStorage.getItem('bloppit-world-v1') || '{}').log || []).length > 0)) break; await autoPlace(page, 1); }
  await page.waitForTimeout(5000);
}
async function open(url, { viewport = { width: 1000, height: 800 }, init, at, touch, slow } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
  await ctx.route('**/*', async (r) => { const u = r.request().url();
    if (slow && slow.files.some((f) => u.includes(f))) await new Promise((ok) => setTimeout(ok, slow.ms));   // a file that arrives late (a big model on a slow line)
    const f = ['three.min.js', 'OrbitControls.js', 'BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return r.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (/fonts\.g/.test(u)) return r.fulfill({ status: 200, body: '', contentType: 'text/css' });
    r.continue(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => { errors.push(e.message); if (process.env.STACKS) console.log('STACK', e.stack); });
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
  assert.equal(await t.page.evaluate(() => { const v = document.querySelector('#isWorld .is3-cine video.cn-film'); return !!v && /\/video\/arrival\.mp4(\?v=\w+)?$/.test(v.src) && !!window.bloppitIsland3().cine.film; }), true);
  const t0 = Date.now(); await t.page.evaluate(() => document.querySelector('#isWorld .is3-cine .cn-skip').click());
  await t.page.waitForFunction((nm) => (document.querySelector('#isWorld .is3-banner')?.textContent || '').includes(`${nm} has arrived`), nm, { timeout: 6000 });
  // then straight to the home: no card after the trip
  await t.page.waitForFunction(() => /Build Our First Home/.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, { timeout: 8000 });
  assert.ok(Date.now() - t0 < 8000); assert.equal(await t.page.evaluate(() => document.getElementById('pupDlg').open), false);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-island').classList.contains('cine')), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('films on a phone cover the whole page (above the menu bar) and offer ⛶ Full screen; upright or sideways', { skip: skip() }, async () => {
  for (const viewport of [{ width: 393, height: 852 }, { width: 852, height: 393 }]) {
    const t = await open('?nosplash=1&films=1', { viewport, touch: true });
    await t.page.evaluate(() => document.getElementById('hmCont').click());
    await t.page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 10000 });
    await t.page.evaluate(() => document.getElementById('pupSuggest').click()); await t.page.waitForTimeout(200);
    await t.page.evaluate(() => document.getElementById('pupLater').click());
    await t.page.waitForFunction(() => !!document.querySelector('.is3-cine video.cn-film'), null, { timeout: 10000 }); await t.page.waitForTimeout(1500);
    assert.deepEqual(await t.page.evaluate(() => window.bloppitFilmBig()), { page: true, parent: true, full: true }, JSON.stringify(viewport));
    const r = await t.page.evaluate(() => { const b = document.querySelector('.is3-cine').getBoundingClientRect(), top = document.elementFromPoint(innerWidth / 2, 20); return { w: b.width, h: b.height, top: !!top?.closest('.is3-cine') }; });
    assert.ok(r.w >= viewport.width - 1 && r.h >= viewport.height - 1 && r.top, 'the film is over the whole page, menu bar too');
    await t.page.evaluate(() => document.querySelector('.is3-cine .cn-skip').click()); await t.page.waitForTimeout(1600);
    assert.equal(await t.page.evaluate(() => document.body.classList.contains('film-on') || !!document.querySelector('.is3-cine.page')), false);
    assert.deepEqual(t.errors, []); await t.ctx.close();
  }
});

test('My films: the locked film shown is the one closest to unlocking (15 Blitz races won: the Grand Prix film, not Frog Forest\'s)', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (let i = 0; i < 15; i++) { const k = `m:Race${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1, k: 'blitz', lv: 2 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: ['frog-arrival', 'brainpeak-arrival', 'sunrise-arrival', 'blitzbay-arrival', 'brickworks-arrival'] }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&welcome=0', { init: seed });
  await t.page.evaluate(() => document.getElementById('hmFilms').click()); await t.page.waitForTimeout(400);
  // 15 races open a mid-island slot, and Blitz Bay is the only island built on: its Midway film is the next to come
  assert.match(await t.text('#filmList button[disabled]'), /8½ · \?\?\?.*Keep building on Blitz Bay/);
  await t.page.evaluate(() => { document.getElementById('filmsDlg').close(); localStorage.setItem('bloppit-seen3-v1', JSON.stringify([...(JSON.parse(localStorage.getItem('bloppit-seen3-v1') || '[]')), 'mid:blitzbay'])); });
  // once it has played: the Grand Prix film, not Frog Forest's (never built on)
  await t.page.evaluate(() => document.getElementById('hmFilms').click()); await t.page.waitForTimeout(400);
  const lock = await t.text('#filmList button[disabled]');
  assert.match(lock, /09 · \?\?\?.*Win the Grand Prix/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('My films: hidden until the arrival film is unlocked, then plays it again from the menu', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  assert.equal(await t.page.evaluate(() => document.getElementById('hmFilms')?.hidden ?? true), true);
  // the menu's first choices: Quick play (where My films was) brings the Solo tiles into view
  assert.equal(await t.page.evaluate(() => document.getElementById('hmQuick').hidden), false);
  await t.ctx.close();
  const u = await open('?nosplash=1', { init: { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: {}, log: [], decor: [] })); } } });
  const shot = (n) => process.env.SHOTS ? u.page.screenshot({ path: `${process.env.SHOTS}/films-${n}.png` }) : null;
  assert.equal(await u.page.evaluate(() => document.getElementById('hmFilms').hidden), false);
  assert.match(await u.text('#hmFilmsS'), /1 film to watch again/); await shot(1);
  assert.equal(await u.page.evaluate(() => !!document.querySelector('#hmWorld #hmFilms')), true, 'My films sits in the Bloppitopia tile');
  // arrived but nothing built yet: the menu still leads back to the island
  assert.equal(await u.page.evaluate(() => document.getElementById('hmWorld').hidden), false);
  await u.page.evaluate(() => document.getElementById('hmFilms').click()); await u.page.waitForTimeout(400);
  assert.equal(await u.page.evaluate(() => document.getElementById('filmsDlg').open), true);
  assert.match(await u.text('#filmNow'), /01 · Arrival/);
  await u.page.evaluate(() => document.querySelector('#filmList [data-film="arrival"]').click());
  await u.page.waitForFunction(() => { const v = document.getElementById('filmVid'); return /\/video\/arrival\.mp4(\?v=\w+)?$/.test(v.src) && v.currentTime > 0.3; }, null, { timeout: 10000 }); await shot(2);
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

test('phone build page: no arrows or Place (tap the brick, Rotate turns it), the build gets the room; yellow and blue table edges mark the same sides in the booklet and the build', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0', { viewport: { width: 390, height: 664 }, touch: true });
  await t.page.evaluate(() => { document.querySelector('[data-go="otter"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => [...document.querySelectorAll('#view-game button')].find((x) => /Heart/.test(x.textContent) && x.offsetParent).click()); await t.page.waitForTimeout(800);
  await t.page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^(Play|Start|Build)/.test(x.textContent.trim()) && x.offsetParent)?.click()); await t.page.waitForTimeout(800);
  await autoPlace(t.page, 3);
  await t.page.evaluate(() => document.getElementById('openBox').click()); await t.page.waitForTimeout(600);
  const fill = await t.page.evaluate(() => [document.getElementById('board').offsetHeight, document.getElementById('boardWrap').clientHeight, getComputedStyle(document.getElementById('board')).maxHeight]);
  assert.ok(fill[0] >= fill[1] - 4 && fill[2] === 'none', 'the parts board fills its panel (no black strip under it): ' + fill);   // the weekly top-100 list's style once capped it at 420px
  await t.page.evaluate(() => { document.querySelector('#view-box [data-p]').click(); }); await t.page.waitForTimeout(300);
  await t.page.evaluate(() => document.getElementById('takeBtn').click()); await t.page.waitForTimeout(1000);
  assert.ok(await t.page.evaluate(() => window.bloppitGhost()), 'a brick in hand');
  const m = await t.page.evaluate(() => ({ pad: document.getElementById('placePad').offsetParent !== null, stage: document.getElementById('buildStage').getBoundingClientRect().height, hand: document.querySelector('#view-build .playcol>.card').getBoundingClientRect().height, scroll: document.documentElement.scrollHeight - innerHeight, status: document.getElementById('status').textContent }));
  assert.equal(m.pad, false, 'no arrows, Turn or Place on a phone'); assert.match(m.status, /tap it to put it down/); assert.doesNotMatch(m.status, /Place\./);
  assert.ok(m.stage > m.hand * 2.5 && m.stage >= 220, `the build is the big part (${m.stage} vs ${m.hand})`); assert.ok(m.scroll <= 2, 'no scrolling');
  const sd = await t.page.evaluate(() => window.bloppitSides());
  assert.deepEqual(sd.book.map((x) => x[0]), ['left', 'right']); assert.ok(sd.book[0][1] < sd.book[1][1] && sd.play[0][1] < sd.play[1][1], 'yellow on the left, blue on the right, in both');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the 3D island has no welcome card on top (a world with builds that never saw the arrival); the drawn island\'s card has ✕', { skip: skip() }, async () => {
  const seed = { fn: () => { localStorage.setItem('bloppit-world-v1', JSON.stringify({ pupAsked: true, pupName: 2, builds: { 'm:Little house:12': { n: 12, s: 2, k: 'quick', t: Date.now() - 864e5, c: 1 } }, log: ['m:Little house:12'], decor: [] })); } };
  let t = await open('?nosplash=1&welcome=0#island', { viewport: { width: 393, height: 760 }, touch: true, init: seed });
  await t.page.waitForTimeout(1000);
  assert.equal(await t.page.evaluate(() => document.getElementById('isIntro').hidden), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
  t = await open('?nosplash=1&welcome=0&island3d=0#island', { viewport: { width: 393, height: 760 }, touch: true, init: seed });
  await t.page.waitForTimeout(1000);
  if (!(await t.page.evaluate(() => document.getElementById('isIntro').hidden))) {
    await t.page.evaluate(() => document.getElementById('iiX').click()); await t.page.waitForTimeout(200);
    assert.equal(await t.page.evaluate(() => document.getElementById('isIntro').hidden), true);
  }
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a world with builds that never saw the arrival gets the boat and the arrival film once, then the island as it stands', { skip: skip() }, async () => {
  const seed = { fn: () => { if (!localStorage.getItem('bloppit-world-v1')) localStorage.setItem('bloppit-world-v1', JSON.stringify({ pupAsked: true, pupName: 2, builds: { 'm:Little house:12': { n: 12, s: 2, k: 'quick', t: Date.now() - 864e5, c: 1 } }, log: ['m:Little house:12'], decor: [] })); } };
  const t = await open('?nosplash=1&welcome=0&films=1#island', { init: seed });
  await t.page.waitForFunction(() => !!document.querySelector('.is3-cine video.cn-film'), null, { timeout: 12000 }); await t.page.waitForTimeout(1500);
  await t.page.evaluate(() => document.querySelector('.is3-cine .cn-skip').click());
  await t.page.waitForFunction(() => !!JSON.parse(localStorage.getItem('bloppit-world-v1')).arrived, null, { timeout: 10000 }); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-cine') && !document.getElementById('view-island').classList.contains('cine')), true);
  assert.equal(await t.page.evaluate(() => /Build Our First Home/.test(document.querySelector('#isWorld .is3-play')?.textContent || '')), false, 'the island as it stands, not the first home again');
  // and only once
  await t.page.reload(); await t.page.waitForTimeout(3500);
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-cine')), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('phone build page keeps the whole booklet: its picture, step and layer, with the page arrows inside it and 🏁 for the final build; the hand is one row with the progress under it and a small ↺', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0&films=0', { viewport: { width: 402, height: 719 }, touch: true });
  await t.page.evaluate(() => window.bloppitLevel('otter', 8)); await t.page.waitForTimeout(2000);
  await autoPlace(t.page, 3); await t.page.waitForTimeout(800);
  const m = await t.page.evaluate(() => { const R = (q) => document.querySelector(q).getBoundingClientRect(), vis = (q) => { const e = document.querySelector(q); return !!e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'; };
    const card = R('#bpCard'), nav = R('.bookpane .bp-nav');
    return { view: vis('#bpView'), step: vis('#bpStep'), foot: document.getElementById('bpFoot').textContent, navIn: nav.top >= card.top && nav.bottom <= card.bottom + 1, fin: vis('#bpFinalMini'), finWide: vis('#bpFinal'),
      prog: document.getElementById('handProg').textContent, progVis: vis('#handProg'), mini: vis('#restartMini'), foot2: vis('.tray-foot'), stage: Math.round(R('#buildStage').height), scroll: document.documentElement.scrollHeight - innerHeight }; });
  assert.ok(m.view && m.step && /Layer \d+ of \d+/.test(m.foot), 'the booklet keeps its picture, step and layer: ' + JSON.stringify(m));
  assert.ok(m.navIn, 'the page arrows sit inside the booklet'); assert.ok(m.fin && !m.finWide, '🏁 stands in for See final build');
  assert.ok(m.progVis && /of 97 placed/.test(m.prog) && m.mini && !m.foot2, 'one hand row with the progress and ↺: ' + JSON.stringify(m));
  assert.ok(m.stage >= 370, 'the build gets the room: ' + m.stage); assert.ok(m.scroll <= 2, 'no page scroll');
  const fp = await t.page.evaluate(() => { document.getElementById('bpFinalMini').click(); return !document.getElementById('bpNow').hidden; }); assert.ok(fp, '🏁 shows the final build (Back to my step appears)');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('phone parts box: one screen, the booklet page on top, the parts board filling the rest, the tools a ribbon', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0', { viewport: { width: 390, height: 664 }, touch: true });
  await t.page.evaluate(() => { document.querySelector('[data-go="otter"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => [...document.querySelectorAll('#view-game button')].find((x) => /Heart/.test(x.textContent) && x.offsetParent).click()); await t.page.waitForTimeout(800);
  await t.page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^(Play|Start|Build)/.test(x.textContent.trim()) && x.offsetParent)?.click()); await t.page.waitForTimeout(800);
  await t.page.evaluate(() => document.getElementById('openBox').click()); await t.page.waitForTimeout(1000);
  await t.page.evaluate(() => document.querySelector('#view-box [data-p]').click()); await t.page.waitForTimeout(300);
  const m = await t.page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(), b = r('#boardWrap'), k = r('#boxBook'), tk = r('#takeBtn');
    return { scroll: document.documentElement.scrollHeight - innerHeight, board: b.height, bookAbove: k.bottom <= b.top + 1, boardBottom: b.bottom <= innerHeight, take: tk.right <= innerWidth && tk.width > 0, ribbon: getComputedStyle(document.querySelector('.box-actions')).flexWrap }; });
  assert.equal(m.scroll <= 2, true, 'no scrolling'); assert.ok(m.board >= 664 * 0.38, `the board is the big part (${m.board})`);
  assert.ok(m.bookAbove && m.boardBottom, 'booklet on top, board below, all on screen'); assert.ok(m.take, 'Take to build fits'); assert.equal(m.ribbon, 'nowrap');
  // the ribbon scrolls sideways, so a little › says there's more; scrolled to the end, a ‹ says there's more back
  let ar = await t.page.evaluate(() => window.bloppitBoxArrows()); assert.ok(ar && ar.r && !ar.l, JSON.stringify(ar));
  await t.page.evaluate(() => { const e = document.querySelector('#view-box .box-actions'); e.scrollLeft = e.scrollWidth; }); await t.page.waitForTimeout(200);
  ar = await t.page.evaluate(() => window.bloppitBoxArrows()); assert.ok(ar.l && !ar.r, JSON.stringify(ar));
  await t.page.evaluate(() => document.getElementById('takeBtn').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-build');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a Pippa puzzle still out at sea can be tapped: it says how many builds bring it in and offers Play next', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0&films=0', { init: { fn: () => { const sb = {}; for (let i = 0; i < 9; i++) sb[i] = 2; localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: {}, sbest: sb, seaV: 2 })); } } });
  await t.page.evaluate(() => [...document.querySelectorAll('.tab')].find((x) => /Flipper Beach/.test(x.textContent)).click()); await t.page.waitForTimeout(800);
  assert.match(await t.text('#gmLevels .lvl[data-i="9"] .tagnew'), /🌊 \d+ more builds?/);
  assert.equal(await t.page.evaluate(() => document.querySelector('#gmLevels .lvl[data-i="9"]').disabled), false);
  await t.page.evaluate(() => document.querySelector('#gmLevels .lvl[data-i="9"]').click()); await t.page.waitForTimeout(400);
  assert.equal(await t.page.evaluate(() => document.getElementById('tideDlg').open), true);
  assert.match(await t.text('#tdTxt'), /67%.*more builds? on the other islands/);   // puzzle 10 of 15
  assert.equal(await t.page.evaluate(() => document.getElementById('tdGo').hidden), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Pippa’s 15 puzzles: an older save’s puzzles move to their new places, and a finished Flipper Beach stays finished', { skip: skip() }, async () => {
  for (const [n, want] of [[9, [0, 1, 2, 4, 5, 7, 8, 9, 10]], [12, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]]]) {
    const t = await open('?nosplash=1&welcome=0&films=0', { init: { fn: (n) => { if (localStorage.getItem('building-blox-game-v1')) return; const sb = {}; for (let i = 0; i < n; i++) sb[i] = 3; localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: {}, sbest: sb })); }, arg: n } });
    const got = await t.page.evaluate(() => { const g = JSON.parse(localStorage.getItem('building-blox-game-v1')); return Object.keys(g.sbest).filter((k) => g.sbest[k] > 0).map(Number).sort((a, b) => a - b); });
    assert.deepEqual(got, want, n + ' old puzzles'); assert.deepEqual(t.errors, []); await t.ctx.close();
  }
});

test('a Trail level finish shows the stars strip and counts a build', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => { document.querySelector('[data-go="otter"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
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

test('Bloppit is a real 3D model (approved v2): twenty clips, his props by activity, a tap looks at you then reacts', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('bloppit', 'full', 200, { model: true, clip: 'fish', t: 1 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().bloppit }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['blink', 'campfire', 'cheer', 'doze', 'fish', 'focused', 'garden', 'giggle_wiggle', 'happy_hop', 'hug', 'idle', 'logo_idle', 'look_at_you', 'reach', 'read', 'release', 'show_brick', 'surprised_jump', 'wake', 'wave'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Bloppit: his eyes never stick shut after blinking (any frame rate), and his brick stays in his free paw while he gardens and fishes', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  for (const [dt, clip] of [[1 / 60, 'fish'], [1 / 15, 'fish'], [1 / 15, 'logo_idle'], [1 / 15, 'garden']]) {
    const lids = await t.page.evaluate(([dt, clip]) => window.bloppitLids(dt, 30, clip, 0), [dt, clip]);
    assert.ok(lids.every(([, h, c]) => h === 0 && c === 0), `${clip} at ${Math.round(1 / dt)} fps: ${JSON.stringify(lids)}`);
  }
  assert.ok((await t.page.evaluate(() => window.bloppitLids(1 / 30, 2, 'doze', 1))).every(([, , c]) => c === 1));   // asleep: shut
  assert.deepEqual(await t.page.evaluate(() => window.bloppitGrip().then((g) => g.clips.sort())), ['fish', 'garden']);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Nora is a real 3D model (v1) with her nine clips', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(async () => { const pic = await window.bloppitCharShot('nora', 'full', 200, { model: true, clip: 'aha', t: .8 }); return { pic: pic.length > 2000, ...window.bloppitChars3d().nora }; });
  assert.deepEqual(r, { pic: true, model: true, clips: ['aha', 'cheer', 'focused', 'hint', 'hop', 'idle', 'offer', 'release', 'thinking'] });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a finished race against Swoop lets go: the banner offers Back to Bloppitopia, and a Trail (Pippa) opens straight away; the parts box says when it is your last brick', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => { document.querySelector('[data-go="cpu"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzEasy').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  await t.page.waitForSelector('#buildStage .go-gate .go-btn', { timeout: 20000 }); await t.page.evaluate(() => document.querySelector('#buildStage .go-btn').click()); await t.page.waitForTimeout(4200);
  let sawLast = false, sawGate = '', sawBoard = '', rushed = false;
  for (let i = 0; i < 600; i++) {
    if (await t.page.evaluate(() => /Finished/.test(document.getElementById('mpTurn').textContent))) break;
    // between turns: the big scoreboard, and the clock waits for Your turn!
    if (await t.page.evaluate(() => !!document.querySelector('#buildStage .turn-gate .go-btn'))) {
      if (!sawGate) { sawGate = await t.text('#buildStage .turn-gate'); const c0 = await t.text('.clk[data-clk="0"]'); await t.page.waitForTimeout(700); assert.equal(await t.text('.clk[data-clk="0"]'), c0, 'your clock waits while the scoreboard is up'); }
      await t.page.evaluate(() => document.querySelector('#buildStage .turn-gate .go-btn').click()); await t.page.waitForTimeout(200); continue;
    }
    if (!sawBoard) { const b = await t.page.evaluate(() => document.querySelector('#mpPlayers .rm-top')?.textContent || ''); if (/\+\d+\.\ds|Neck and neck/.test(b)) sawBoard = b; }
    if (!rushed && await t.page.evaluate(() => !!document.querySelector('#mpPlayers [data-rush]'))) { rushed = true; await t.page.evaluate(() => document.querySelector('#mpPlayers [data-rush]').click()); }
    if (await t.page.evaluate(() => !document.getElementById('turnBanner').hidden && /Your turn/.test(document.getElementById('turnBanner').textContent) && !document.querySelector('#buildStage .go-gate'))) {
      if (!sawLast) { const w = await t.page.evaluate(() => window.bloppitPickWhy()); if (w.why === 'last') sawLast = true; }
      await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(200);
      if (await t.page.evaluate(() => { const b = document.getElementById('mpEndTurn'); return !b.hidden && !b.disabled; })) await t.page.evaluate(() => document.getElementById('mpEndTurn').click());
    }
    await t.page.waitForTimeout(300);
  }
  assert.ok(sawLast, 'the parts box knew it was the last brick');
  assert.match(sawGate, /Your turn!/); assert.match(sawGate, /placed brick|finished in/);
  assert.ok(sawBoard, 'the scoreboard says who leads, by how much');
  await t.page.waitForTimeout(1500); await t.page.evaluate(() => document.querySelector('dialog[open]')?.close());
  assert.match(await t.text('#mpRoomBtn'), /Back to Bloppitopia/);
  assert.match(await t.text('.race-meter'), /wins!/);
  await t.page.evaluate(() => [...document.querySelectorAll('.tab')].find((x) => /Flipper Beach/.test(x.textContent)).click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-game'); assert.equal(await t.page.evaluate(() => document.getElementById('mpBar').hidden), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a decided race against Swoop fast-forwards: once you are done and he cannot catch up, his last bricks play at ×4 and his clock runs 4 seconds a second', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => { document.querySelector('[data-go="cpu"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzEasy').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  await t.page.waitForSelector('#buildStage .go-gate .go-btn', { timeout: 20000 }); await t.page.evaluate(() => document.querySelector('#buildStage .go-btn').click()); await t.page.waitForTimeout(4200);
  let ff = '';
  for (let i = 0; i < 600 && !ff; i++) {
    if (await t.page.evaluate(() => /Finished/.test(document.getElementById('mpTurn').textContent))) break;
    if (await t.page.evaluate(() => !!document.querySelector('#buildStage .turn-gate .go-btn'))) { await t.page.evaluate(() => document.querySelector('#buildStage .turn-gate .go-btn').click()); await t.page.waitForTimeout(200); continue; }
    const tb = await t.page.evaluate(() => document.getElementById('turnBanner').hidden ? '' : document.getElementById('turnBanner').textContent);
    if (/Fast-forward ×4/.test(tb)) { ff = tb; break; }
    if (/Your turn/.test(tb) && !await t.page.evaluate(() => !!document.querySelector('#buildStage .go-gate'))) {
      for (let k = 0; k < 3; k++) { if (!await t.page.evaluate(() => /Your turn/.test(document.getElementById('turnBanner').textContent))) break; await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(150); }   // three a turn: you finish first
      if (await t.page.evaluate(() => { const b = document.getElementById('mpEndTurn'); return !b.hidden && !b.disabled; })) await t.page.evaluate(() => document.getElementById('mpEndTurn').click());
    }
    await t.page.waitForTimeout(250);
  }
  assert.match(ff, /You win! ⏩ Fast-forward ×4/, 'the turn bar says it is fast-forwarding: ' + JSON.stringify(await t.page.evaluate(() => window.bloppitRaceFF())));
  const clk = () => t.page.evaluate(() => { const [m, r] = document.querySelector('#turnBanner .clk[data-clk="1"]').textContent.split(':'); return +m * 60 + parseFloat(r); });
  const a = await clk(); await t.page.waitForTimeout(1000); const b = await clk();
  assert.ok(b - a > 2.5 && b - a < 5.5, `his clock runs about 4 s a second (${(b - a).toFixed(1)} s)`);
  const t0 = Date.now(); let fin = false;
  for (let i = 0; i < 120 && !fin; i++) { fin = await t.page.evaluate(() => /Finished/.test(document.getElementById('mpTurn').textContent) || !!document.querySelector('#mpEndDlg[open]'));
    if (!fin && await t.page.evaluate(() => !!document.querySelector('#buildStage .turn-gate .go-btn'))) await t.page.evaluate(() => document.querySelector('#buildStage .turn-gate .go-btn').click());
    await t.page.waitForTimeout(500); }
  assert.ok(fin, 'the race finishes: ' + JSON.stringify(await t.page.evaluate(() => window.bloppitRaceFF())) + ' ' + await t.page.evaluate(() => document.getElementById('turnBanner').textContent));
  console.log('finished', ((Date.now() - t0) / 1000).toFixed(1), 's after fast-forward began');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a race against Swoop starts and shows him in the banner on his turn', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => { document.querySelector('[data-go="cpu"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  // the clock waits for Let's go! (it used to count down straight away)
  await t.page.waitForSelector('#buildStage .go-gate .go-btn', { timeout: 20000 }); await t.page.waitForTimeout(2500);
  assert.equal(await t.text('.clk[data-clk="0"]'), '0:00.0'); assert.match(await t.text('#status'), /Let’s go/);
  await t.page.evaluate(() => document.querySelector('#buildStage .go-btn').click());
  await t.page.waitForTimeout(4500);
  assert.equal(await t.page.evaluate(() => !document.querySelector('#buildStage .go-gate')), true);
  assert.equal(await t.page.evaluate(() => document.getElementById('turnBanner').hidden), false);
  assert.match(await t.text('#turnBanner'), /Your turn/);
  // mid-race the button is Leave race, and it takes a second tap
  assert.equal(await t.text('#mpRoomBtn'), 'Leave race');
  await t.page.evaluate(() => document.getElementById('mpRoomBtn').click()); assert.equal(await t.text('#mpRoomBtn'), 'Tap again to leave');
  assert.equal(await t.page.evaluate(() => document.getElementById('mpBar').hidden), false);
  await t.page.evaluate(() => document.getElementById('mpRoomBtn').click()); await t.page.waitForTimeout(600);
  assert.equal(await t.page.evaluate(() => document.getElementById('mpBar').hidden), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('share links: a Weekly, a library model, and /p/start', { skip: skip() }, async () => {
  const seeded = { fn: () => localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 2, finished: 2, welcome: 1 })) };
  let t = await open('?nosplash=1&p=w-2026-10-12', { init: seeded, at: '2026-10-14T18:00:00Z' });
  assert.equal(await t.page.evaluate(() => document.getElementById('shareDlg').open), true); assert.match(await t.text('#shTitle'), /Bibi’s Weekly Bloppit/);
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
    tab: document.querySelector('.tab[aria-selected="true"]')?.id }));
  assert.deepEqual(ui, { tag: false, race: true, banner: true, tab: 'tab-cove' });   // the Weekly is Bibi's: the Brickyard Cove tab
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
  await t.page.goto(new URL('/game/?nosplash=1&lite3d=1#island', 'http://localhost:8799').href); await t.page.waitForTimeout(3000);
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

test('Pippa\'s puzzles are mirror builds: every model is symmetrical, Pippa builds her half, you build its reflection; in the finale your half is in your colours', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0&films=0');
  const sym = await t.page.evaluate(() => window.bloppitLevels.sea.map((L, i) => { window.bloppitLevel('sea', i); const M = window.bloppitMirror(); if (!M) return `${L.name}: not a mirror build`;
    const set = new Set(M.bricks.map((b) => b.join(','))); const bad = M.bricks.filter(([x, y, z, sx, sz, c]) => !set.has([M.W - x - sx, y, z, sx, sz, c].join(','))).length; return bad ? `${L.name}: ${bad} bricks without a twin` : (/PK|KP/.test(M.steps) ? '' : `${L.name}: no turns`); }));
  assert.deepEqual(sym.filter(Boolean), []);
  await t.page.evaluate(() => window.bloppitLevel('sea', 0)); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => window.bloppitMirror().steps[0]), 'P');
  assert.equal(await t.page.evaluate(() => window.bloppitPlaceRight()), false, 'you can’t place Pippa’s bricks for her');
  await t.page.waitForFunction(() => { const M = window.bloppitMirror(); return M.steps[M.cur] === 'K'; }, null, { timeout: 20000 });
  assert.match(await t.text('#status'), /mirror line|reflection/);
  for (let i = 0; i < 400; i++) { const M = await t.page.evaluate(() => window.bloppitMirror()); if (M.cur >= M.steps.length) break; if (M.steps[M.cur] === 'K') await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(150); }
  await t.page.waitForFunction(() => document.getElementById('winDlg').open, null, { timeout: 30000 });
  // the finale: Pippa builds first in her colours, as always; your mirrored half is in any colour you like
  await t.page.evaluate(() => document.getElementById('winDlg').close());
  await t.page.evaluate(() => window.bloppitLevel('sea', window.bloppitLevels.sea.length - 1)); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => window.bloppitMirror().steps[0]), 'P');
  for (let k = 0; k < 4; k++) { await t.page.waitForFunction(() => { const M = window.bloppitMirror(); return M.steps[M.cur] === 'K'; }, null, { timeout: 20000 }); await t.page.evaluate(() => window.bloppitPlaceRight(4)); await t.page.waitForTimeout(150); }
  const fin = await t.page.evaluate(() => { const M = window.bloppitMirror(), m = new Map(M.paint), byKey = new Map(M.bricks.map((b) => [b.slice(0, 5).join(','), b[5]])); let pairs = 0, ok = 0, mine = 0;
    for (const [k, c] of m) { if (c === 4) mine++; const [x, y, z, sx, sz] = k.split(',').map(Number), tw = (M.W - x - sx) + ',' + y + ',' + z + ',' + sx + ',' + sz;
      if (tw > k && m.has(tw)) { pairs++; if ((c === byKey.get(k) && m.get(tw) === 4) || (m.get(tw) === byKey.get(tw) && c === 4)) ok++; } } return { pairs, ok, mine }; });
  assert.ok(fin.pairs > 0 && fin.ok === fin.pairs && fin.mine > 0, 'Pippa keeps her colours, your twin is in yours: ' + JSON.stringify(fin));
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

test('Footer links in the app: About us, How it works, FAQ and Privacy open in the in-app reader with no grown-ups gate', { skip: skip() }, async () => {
  const app = { fn: () => { window.BLOPPIT_APP = true; } };
  const t = await open('?nosplash=1&welcome=0', { init: app, viewport: { width: 393, height: 852 }, touch: true });
  const tap = (sel) => t.page.evaluate((sel) => { document.querySelector(sel).click(); return [document.getElementById('pageDlg').open, document.getElementById('gateDlg').open, document.getElementById('pageFrame').getAttribute('src')]; }, sel);
  assert.deepEqual(await tap('.appfoot a[href*="/faq/"]'), [true, false, 'pages/faq.html']);
  assert.deepEqual(await tap('.appfoot a[href*="/privacy/"]'), [true, false, 'pages/privacy.html']);
  await t.page.click('#pageClose');
  assert.equal(await t.page.evaluate(() => document.getElementById('pageDlg').open), false);
  // A link that really leaves the app still asks a grown-up
  await t.page.evaluate(() => { const a = document.createElement('a'); a.href = 'https://x.com/playbloppit'; a.id = 'outLink'; document.body.append(a); a.click(); });
  assert.equal(await t.page.evaluate(() => document.getElementById('gateDlg').open), true);
  assert.deepEqual(t.errors, []); await t.ctx.close();
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

test('Blitz is fair at any age: Swoop paces himself on the child (a first guess from age, then their own pace)', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  const r = await t.page.evaluate(() => { const F = window.bloppitBlitzFair, a = [F.agePace(5), F.agePace(9), F.agePace(14), F.pace()]; F.save(60, 10); const b = F.pace(); F.save(30, 10); return [...a, b, F.pace(), F.fair]; });
  assert.deepEqual(r, [8.5, 5, 3.3, 6, 6, 4.8, { easy: 1.26, medium: 1.084, hard: 1, boss: .97 }]);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Bloppitopia: Bloppit and the otter turn 3D even when their models arrive after the friends’ (they used to stay drawings)', { skip: skip() }, async () => {
  const seed = { fn: () => { const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:M${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } };
  const t = await open('?nosplash=1&hour=11#island', { init: seed, slow: { files: ['/3d/bloppit.glb', '/3d/pup.glb', '/3d/pup-growing.glb', '/3d/pup-older.glb'], ms: 12000 } });
  await t.page.waitForFunction(() => { const I = window.bloppitIsland3(), C = I.cast || {}; return C.tiny && C.tiny.i3 && C.tiny.i3.P.kind === 'model'; }, null, { timeout: 90000, polling: 300 });
  assert.notEqual(await t.page.evaluate(() => window.bloppitIsland3().b3?.P.kind), 'model');   // the friends first: Bloppit is still his drawing
  await t.page.waitForFunction(() => { const I = window.bloppitIsland3(); return I.b3 && I.b3.P.kind === 'model' && I.p3 && I.p3.P.kind === 'model'; }, null, { timeout: 90000, polling: 300 });
  assert.deepEqual(t.errors, []); await t.ctx.close();
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
  // Each player needs builds behind them: the crew card gets their save onto the server (a pup) before a crew can be made
  const mkPlayer = async () => { const t = await open('?nosplash=1&chars3d=0', { init: { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [];
      for (let i = 0; i < 3; i++) { const k = `m:Model${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1, k: 'quick' }; log.push(k); }
      localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'tree' }));
      localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } } });
    return t; };
  const a = await mkPlayer(), b = await mkPlayer();
  const hub = async (t) => { await t.page.evaluate(() => window.bloppitHome()); await t.page.evaluate(() => { location.hash = '#together'; document.getElementById('tab-mp').click(); }); await t.page.waitForTimeout(1500); };
  await hub(a);
  await a.page.evaluate(() => { document.getElementById('crewName').value = '2'; document.querySelector('#crewPick input[value="2"]').checked = true; document.getElementById('crewMake').click(); }); await a.page.waitForTimeout(1500);
  const code = await a.page.evaluate(() => document.querySelector('#crewOpen .cc')?.textContent); assert.match(code || '', /^[A-Z0-9]{6}$/);
  assert.match(await a.text('#crewOpen h2'), /Lighthouse Builders/);
  assert.match(await a.text('#crewOpen'), /Space Station: not started yet/);   // the puzzle picked when making the crew
  assert.equal(await a.page.evaluate(() => document.querySelectorAll('#crewPick .crew-pzopt').length), 4);
  await hub(b);
  await b.page.evaluate((c) => { document.getElementById('crewCodeIn').value = c; document.getElementById('crewJoin').click(); }, code); await b.page.waitForSelector('[data-crew-join]', { timeout: 15000 });
  await b.page.evaluate(() => document.querySelector('[data-crew-join]').click()); await b.page.waitForTimeout(1200);
  assert.match(await b.text('#crewOpen'), /Waiting for the crew’s maker/);
  await hub(a); await a.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await a.page.waitForTimeout(800);
  await a.page.evaluate(() => document.querySelector('[data-crew-ok]').click()); await a.page.waitForTimeout(1500);
  assert.equal(await a.page.evaluate(() => document.querySelectorAll('#crewOpen .crew-members span').length), 2);
  await a.page.evaluate(() => document.getElementById('crewClose').click());
  // B finishes a Trail level: bricks go to the crew's puzzle
  await b.page.evaluate(() => window.bloppitHome()); await b.page.evaluate(() => { document.querySelector('[data-go="otter"]').click(); document.getElementById('qpIsle').click(); }); await b.page.waitForTimeout(500);
  await b.page.evaluate(() => [...document.querySelectorAll('#view-game button')].find((x) => /Heart/.test(x.textContent) && x.offsetParent).click()); await b.page.waitForTimeout(800);
  await b.page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^(Play|Start|Build)/.test(x.textContent.trim()) && x.offsetParent)?.click()); await b.page.waitForTimeout(800);
  for (let i = 0; i < 40; i++) { await autoPlace(b.page, 1); if (await b.page.evaluate(() => /Every step complete/.test(document.getElementById('status').textContent))) break; }
  await b.page.waitForTimeout(3500); await b.page.evaluate(() => document.getElementById('winDlg').close());
  await hub(b); await b.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await b.page.waitForTimeout(800);
  assert.match(await b.text('#crewOpen'), /10 of 2,000 bricks/);
  assert.match(await b.text('#crewOpen'), /Space Station: just started/);
  await b.page.evaluate(() => document.querySelector('[data-crew-say="0"]').click()); await b.page.waitForTimeout(1200);
  assert.match(await b.text('#crewFeed'), /Nice clean build!/);
  // Crew news: A sees a dot on the Together tab and a New chip, then what happened since; opening the crew clears it
  await hub(a);
  assert.equal(await a.page.evaluate(() => { const d = document.querySelector('#tab-mp .news-dot'); return !!d && !d.hidden; }), true);
  assert.match(await a.text('#crewList'), /New/);
  await a.page.evaluate((c) => document.querySelector(`[data-crew="${c}"]`).click(), code); await a.page.waitForTimeout(800);
  const since = await a.text('#crewOpen .crew-since'); assert.match(since, /Since you were last here/); assert.match(since, /added 10 bricks/); assert.match(since, /1 new on the crew board/);
  assert.equal(await a.page.evaluate(() => document.querySelector('#tab-mp .news-dot').hidden), true);
  assert.match(await a.text('#crewFeed'), /Nice clean build!/);
  await a.page.evaluate(() => document.querySelector('[data-crew-report]').click()); await a.page.evaluate(() => document.querySelector('[data-crew-report]').click()); await a.page.waitForTimeout(1200);
  assert.doesNotMatch(await a.text('#crewFeed'), /Nice clean build!/);
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close();
});

test('island: tap anything for its card; drag a model anywhere on the grass; put away and back; the weekly board shows by default and a grown-up can switch it off', { skip: skip() }, async () => {
  const t = await open('?nosplash=1#island', { init: { fn: () => { const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1, d: 95000 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: ['flag'], pupName: 3, pupAsked: true, isle: 1, arrived: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } } });
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
  assert.match(await tapChar('longtail:easy'), /Swoop the Longtail.*(Blitz Bay’s racer|Asleep on Blitz Bay).*goggles.*Secret.*Speeds beaten.*Did you know\?.*tropicbirds.*Race 1 of 20.*Choose your own race/);
  assert.match(await tapChar('char:pippa'), /Pippa the Penguin.*Flipper Beach.*Secret.*A yellow two-stud brick.*still in the mist.*Play Pippa’s puzzle/);
  assert.match(await tapChar('pup'), /Bubbles.*Level \d+ Pup.*1 stud.*Otter level.*Wardrobe.*Name or colour/);
  assert.match(await tap('decor:flag'), /Flag/);
  assert.match(await tap('isle:sunrise'), /A misty island.*Pippa’s first puzzle washes ashore at 7%.*Back to Bloppitopia/);
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
  assert.match(await t.text('#isTip'), /From.*Build anything.*First built.*Best time1:35.*Bricks/);
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
  // the board on the Weekly page (Bibi's, through Quick Bricks)
  await t.page.evaluate(() => { document.getElementById('tab-cove').click(); document.getElementById('qbWeekly').click(); }); await t.page.waitForTimeout(1200);
  assert.equal(await t.page.evaluate(() => document.getElementById('dyBoard').hidden), false);
  assert.match(await t.text('#dyBoardList'), /Nobody on the board yet/);
  // the grown-up switch turns it off (and it stays off)
  assert.equal(await t.page.evaluate(() => { const c = document.getElementById('grownBoard'); c.checked = false; c.dispatchEvent(new Event('change')); return document.getElementById('dyBoard').hidden; }), true, 'off hides the board');
  assert.equal(await t.page.evaluate(() => Object.keys(localStorage).some(k => k.includes('bloppit-board-v1') && localStorage.getItem(k) === '0')), true, 'off is remembered');
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
  await t.page.evaluate(() => document.querySelector('[data-qb-go="draw"]').click()); await t.page.waitForTimeout(300);   // Quick Bricks: the Draw your own tile opens its screen
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

test('The New Horizon plays the first time the Galaxy ship sails to lufu\'s world, then the welcome', { skip: skip() }, async () => {
  const done = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (const n of ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Moonstone Lighthouse', 'Well', 'Moon crystal', 'Galaxy ship']) { const k = `m:${n}:12`; builds[k] = { n: 12, s: 2, t: 1e12, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, pick: 'treehouse', isle: 1, arrived: 1, films: ['moon-12', 'moon-13', 'moon-14', 'moon-15', 'moon-16', 'moon-17', 'moon-18', 'moon-19', 'moon-21'] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1#island', { init: done });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl && !document.querySelector('.is3-film'), null, { timeout: 90000 });
  await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
  await t.page.evaluate(() => document.querySelector('.is3-realm').click());
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'moon-22', null, { timeout: 20000, polling: 200 });
  assert.equal(await t.page.evaluate(() => document.getElementById('lufuHiDlg').open), false, 'the welcome waits for the film');
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  await t.page.waitForFunction(() => document.getElementById('lufuHiDlg').open && window.bloppitIsland3().lufu === 1, null, { timeout: 20000 });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the ring ceremony: once the Moon crystal is built (Chapter 9), the child sets their brick in the empty slot (drag or tap), the ring lights, then film 20 straight away (no cut to the island)', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (const n of ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Moonstone Lighthouse', 'Well', 'Moon crystal']) { const k = `m:${n}:12`; builds[k] = { n: 12, s: 2, t: 1e12, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupColor: 3, pupAsked: true, isle: 1, arrived: 1, films: ['moon-12', 'moon-13', 'moon-14', 'moon-15', 'moon-16', 'moon-17', 'moon-18', 'moon-19'] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl && !document.querySelector('.is3-film'), null, { timeout: 90000 });
  await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
  await t.page.evaluate(() => window.bloppitNext.reveal(['moonstone:8']));
  await t.page.waitForFunction(() => window.bloppitRing(), null, { timeout: 10000, polling: 100 });
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null, 'film 20 waits for the brick');
  assert.match((await t.page.evaluate(() => window.bloppitRing())).say, /Your brick, .+\. Right in the middle\./);
  await t.page.waitForTimeout(800);
  const br = await t.page.locator('.rg-brick').boundingBox(), sl = await t.page.locator('.rg-slot').boundingBox();
  await t.page.mouse.move(br.x + br.width / 2, br.y + br.height / 2); await t.page.mouse.down();
  for (let k = 1; k <= 10; k++) await t.page.mouse.move(br.x + br.width / 2 + (sl.x + sl.width / 2 - br.x - br.width / 2) * k / 10, br.y + br.height / 2 + (sl.y + sl.height / 2 - br.y - br.height / 2) * k / 10);
  await t.page.mouse.up();
  await t.page.waitForFunction(() => window.bloppitRing()?.lit, null, { timeout: 5000, polling: 100 });
  // from the brick in the ring to film 20 the window is always covered (ring or film): no glimpse of the island in between
  const gap = t.page.evaluate(() => new Promise((res) => { let bare = 0; const t0 = performance.now();
    const tick = () => { if (!document.querySelector('.is3-ring.page, .is3-cine.page')) bare++; if (window.bloppitFilmOn() === 'moon-20' && document.querySelector('.is3-cine.page.on') || performance.now() - t0 > 12000) res(bare); else requestAnimationFrame(tick); }; tick(); }));
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'moon-20', null, { timeout: 15000, polling: 200 });
  assert.equal(await gap, 0, 'no frame without the ring or the film over the window');
  assert.ok(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).films.includes('ring')), 'once per world');
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/moonstone-the-moon-crystal\.mp4/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Moonstone films: building a chapter plays its film as its piece rises (Into the Mist for the rowboat), and it joins My films', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Rowboat:10';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds: { [k]: { n: 10, s: 2, t: 1e12, c: 1 } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: [] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 }));
    localStorage.setItem('bloppit-seen3-v1', JSON.stringify(['home:home1'])); } };
  const t = await open('?nosplash=1&hour=11&films=1#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'moon-12', null, { timeout: 40000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/moonstone-into-the-mist\.mp4(\?v=\w+)?$/);
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click()); await t.page.waitForTimeout(1500);
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(800);
  await t.page.evaluate(() => document.getElementById('hmFilms').click()); await t.page.waitForTimeout(600);
  assert.match(await t.text('#filmList'), /12 · Into the Mist/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a film started with sound off: the sound button unmutes the film, and the island music stays quiet until it ends', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Rowboat:10';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds: { [k]: { n: 10, s: 2, t: 1e12, c: 1 } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: [] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 }));
    localStorage.setItem('bloppit-seen3-v1', JSON.stringify(['home:home1'])); localStorage.setItem('bloppit-sound', 'off'); } };
  const t = await open('?nosplash=1&hour=11&films=1#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'moon-12', null, { timeout: 40000, polling: 200 });
  await t.page.waitForFunction(() => { const v = document.querySelector('.is3-film video'); return v && !v.paused; }, null, { timeout: 15000 });
  assert.equal(await t.page.evaluate(() => document.querySelector('.is3-film video').muted), true, 'starts on mute');
  await t.page.evaluate(() => document.getElementById('sndTop').click()); await t.page.waitForTimeout(1600);
  assert.equal(await t.page.evaluate(() => document.querySelector('.is3-film video').muted), false, 'the film has its sound now');
  assert.equal(await t.page.evaluate(() => window.bloppitMusic ? window.bloppitMusic() : null) || 0, 0, 'no island music over the film');
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
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-arrival\.mp4(\?v=\w+)?$/);
  await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
  // Tiny welcomes the otter by name when he's on screen (and says nothing before)
  assert.equal(await t.page.evaluate(() => window.bloppitFilmSay()), null);
  await t.page.evaluate(() => { document.querySelector('.is3-film video').playbackRate = 4; });   // (the test server can't seek)
  await t.page.waitForFunction(() => /^TinyWelcome to Frog Forest, \S+!$/.test(window.bloppitFilmSay() || ''), null, { timeout: 20000 });
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  // then the island rises as before, and later the completion film plays before the fireworks
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'frog-complete', null, { timeout: 90000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-complete\.mp4(\?v=\w+)?$/);
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  await t.page.waitForFunction(() => /Frog Forest is complete/.test(document.querySelector('#isWorld .is3-banner')?.textContent || ''), null, { timeout: 20000 });
  assert.equal(await t.page.evaluate(() => !document.querySelector('.is3-film') && window.bloppitFilmOn() === null), true);
  await t.ctx.close();
  // My films lists all three, in order
  const u = await open('?nosplash=1', { init: seed });
  await u.page.evaluate(() => document.getElementById('hmFilms').click()); await u.page.waitForTimeout(400);
  assert.deepEqual(await u.page.evaluate(() => [...document.querySelectorAll('#filmList [data-film]')].map((b) => b.dataset.film)), ['arrival', 'frog-arrival', 'frog-complete', 'brickworks-arrival']);   // (its three quick builds found Brickyard Cove too)
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
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-arrival\.mp4(\?v=\w+)?$/);
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

test('island arrival films from the menu: vs Swoop plays Blitz Bay’s first, Quick Bricks plays Brickyard Cove’s, each once', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Cottage:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1', { init: seed });
  const film = async (id, file) => {
    await t.page.waitForFunction((id) => window.bloppitFilmOn() === id, id, { timeout: 15000, polling: 200 });
    assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), new RegExp(`/video/${file}\\.mp4(\\?v=\\w+)?$`));
    await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
    await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click()); await t.page.waitForTimeout(1200); };
  await t.page.evaluate(() => { document.querySelector('#view-home [data-go="cpu"]').click(); document.getElementById('qpIsle').click(); });
  await film('blitzbay-arrival', 'blitz-bay-arrival');
  assert.equal(await t.view(), 'view-blitz');
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(500);
  await t.page.evaluate(() => { document.querySelector('#view-home [data-go="quick"]').click(); document.getElementById('qpIsle').click(); });
  await film('brickworks-arrival', 'brickworks-arrival');
  // seen: not again
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(500);
  await t.page.evaluate(() => { document.querySelector('#view-home [data-go="cpu"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null); assert.equal(await t.view(), 'view-blitz');
  assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).films), ['blitzbay-arrival', 'brickworks-arrival']);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Build page: a tile asks Play on the island or Quick play; Quick play has no film and adds nothing to Bloppitopia', { skip: skip() }, async () => {
  const seed = { fn: () => { const k = 'm:Toadstool:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1', { init: seed });
  // Quick Bricks: the choice, then Quick play goes straight to the puzzles, no Brickyard Cove film
  await t.page.evaluate(() => document.querySelector('#view-home [data-go="quick"]').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => document.getElementById('qpDlg').open), true);
  assert.match(await t.text('#qpIsleT'), /Play on Brickyard Cove/);
  await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null, 'no film'); assert.equal(await t.page.evaluate(() => window.bloppitQuickPlay()), true);
  // Frog Trail, Quick play: every level open, the bar says Quick play, a finished level keeps nothing
  await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.querySelector('#view-home [data-go="otter"]').click(); document.getElementById('qpPick').click(); }); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-game').dataset.sub), 'otter');
  assert.equal(await t.page.evaluate(() => [...document.querySelectorAll('#gmLevels .lvl')].filter((b) => b.disabled).length), 0, 'any level');
  assert.match(await t.text('#gmIntro'), /Quick play/);
  await t.page.evaluate(() => document.querySelector('#gmLevels .lvl[data-i="0"]').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null, 'no Frog Forest film'); assert.match(await t.text('#gbWhere'), /Quick play/);
  for (let i = 0; i < 200; i++) { if (await t.page.evaluate(() => document.getElementById('winDlg').open)) break; await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(150); }
  await t.page.waitForFunction(() => document.getElementById('winDlg').open, null, { timeout: 30000 });
  const w = await t.page.evaluate(() => ({ log: JSON.parse(localStorage.getItem('bloppit-world-v1')).log.length, g: JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('building-blox-game-v1'))?.[1] || '{}') }));
  assert.equal(w.log, 1, 'nothing added to the island'); assert.equal(Object.keys(w.g.best || {}).length, 0, 'the trail keeps nothing');
  // back to Bloppitopia ends Quick play; the other choice plays the island as before (its film first)
  await t.page.evaluate(() => { document.getElementById('winDlg').close(); document.getElementById('winIsland').click(); }); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => window.bloppitQuickPlay()), false);
  await t.page.evaluate(() => { window.bloppitHome(); document.querySelector('#view-home [data-go="quick"]').click(); document.getElementById('qpIsle').click(); });
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'brickworks-arrival', null, { timeout: 15000, polling: 200 });
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the menu order: Quick play, Bloppitopia, the Weekly, Continue, How to play; Solo opens with Quick Bricks, Race a friend is in Together (phone)', { skip: skip() }, async () => {
  const t = await open('?nosplash=1', { viewport: { width: 402, height: 874 }, touch: true, init: { fn: () => { localStorage.setItem('bloppit-world-v1', JSON.stringify({ arrived: 1, pupAsked: true, pupName: 2, builds: {}, log: [], decor: [] })); } } });
  await t.page.waitForTimeout(2500); assert.equal(await t.view(), 'view-home');
  const r = await t.page.evaluate(() => { const y = (s) => { const e = document.querySelector(s); return e && !e.hidden ? Math.round(e.getBoundingClientRect().top) : null; }, h = (s) => Math.round(document.querySelector(s).getBoundingClientRect().height);
    return { quick: y('#hmQuick'), world: y('#hmWorld'), daily: y('.hm-daily'), how: y('#hmHow'), qh: h('#hmQuick'), wh: h('#hmWorld'), dh: h('.hm-daily'),
      films: !!document.querySelector('#hmWorld #hmFilms'), streak: !!document.querySelector('.hm-daily #hdStreak'),
      secs: [...document.querySelectorAll('.hm-sec')].map((e) => e.textContent.trim()),
      solo: [...document.querySelectorAll('#hmSolo + .hm-grid .hm-tile')].map((b) => b.dataset.go), wide: document.querySelector('#hmSolo + .hm-grid .hm-tile').classList.contains('wide'),
      together: [...document.querySelectorAll('.hm-sec')].pop().nextElementSibling.textContent }; });
  assert.ok(r.quick < r.world && r.world < r.daily && r.daily < r.how, JSON.stringify(r));
  assert.ok(Math.abs(r.wh - 263) <= 2 && Math.abs(r.dh - 158) <= 2 && r.qh >= 68 && r.qh <= 74, JSON.stringify(r));
  assert.ok(r.films && r.streak);
  assert.deepEqual(r.secs, ['Solo', 'Together']);
  assert.deepEqual(r.solo, ['quick', 'otter', 'brain', 'flip', 'cpu']); assert.ok(r.wide);
  assert.match(r.together, /Build together.*Race a friend.*Join a game/s);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('menu Quick play: opens one of the five Solo games at random with its choice; Play a different game draws another; bloppit.com’s /game/#solo does the same (phone)', { skip: skip() }, async () => {
  const t = await open('?nosplash=1', { viewport: { width: 390, height: 844 } });
  const dlg = () => t.page.evaluate(() => ({ open: document.getElementById('qpDlg').open, where: window.bloppitQP()?.where, other: !document.getElementById('qpOther').hidden, just: document.getElementById('qpQuickT').textContent }));
  await t.page.evaluate(() => document.getElementById('hmQuick').click()); await t.page.waitForTimeout(500);
  let d = await dlg(); assert.ok(d.open && ['quick', 'otter', 'brain', 'flip', 'cpu'].includes(d.where) && d.other, JSON.stringify(d));
  assert.match(d.just, /Just Play|Pick how tricky/);
  const seen = new Set([d.where]);
  for (let i = 0; i < 12; i++) { const was = d.where; await t.page.evaluate(() => document.getElementById('qpOther').click()); await t.page.waitForTimeout(150); d = await dlg();
    assert.ok(d.open && d.where !== was, `a different game: ${was} → ${d.where}`); seen.add(d.where); }
  assert.ok(seen.size >= 3, [...seen].join());
  // a tile tapped directly asks the same question but has no "different game"
  await t.page.evaluate(() => { document.getElementById('qpDlg').close(); document.querySelector('#view-home [data-go="otter"]').click(); }); await t.page.waitForTimeout(300);
  d = await dlg(); assert.ok(d.open && d.where === 'otter' && !d.other, JSON.stringify(d));
  assert.equal(await t.view(), 'view-home'); await t.ctx.close();
  const u = await open('?nosplash=1#solo', { viewport: { width: 390, height: 844 } }); await u.page.waitForTimeout(1200);
  assert.equal(await u.view(), 'view-home');
  assert.ok(await u.page.evaluate(() => document.getElementById('qpDlg').open && !document.getElementById('qpOther').hidden));
  assert.deepEqual([...t.errors, ...u.errors], []); await u.ctx.close();
});

test('Build page: the difficulty slider picks a puzzle to match, and Build it starts it (Quick Bricks, the Trails, vs Swoop, Pippa)', { skip: skip() }, async () => {
  const seed = { fn: () => { const k = 'm:Toadstool:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 10, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1', { init: seed });
  const tile = async (go) => { await t.page.evaluate(() => window.bloppitHome()); await t.page.waitForTimeout(300); await t.page.evaluate((go) => document.querySelector(`#view-home [data-go="${go}"]`).click(), go); await t.page.waitForTimeout(300); };
  const slide = (d) => t.page.evaluate((d) => { const r = document.getElementById('qpDiff'); r.value = d; r.dispatchEvent(new Event('input', { bubbles: true })); return window.bloppitQP(); }, d);
  // Frog Trail: Tiny is one of its first levels, Super tricky one of its last; Build this one starts that level, no film
  await tile('otter');
  let q = await slide(1); assert.ok(q.i <= 2, `tiny: ${q.name}`); assert.match(await t.text('#qpDiffT'), /Tiny/); assert.match(await t.text('#qpPzInfo'), /Level \d+ · \d+ bricks/);
  q = await slide(5); assert.ok(q.i >= 12, `super tricky: ${q.name}`);
  const before = q.i; await t.page.evaluate(() => document.getElementById('qpShuffle').click()); assert.notEqual((await t.page.evaluate(() => window.bloppitQP())).i, before, '🔀 another one');
  q = await slide(3); await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitFilmOn()), null, 'no Frog Forest film'); assert.equal(await t.view(), 'view-build');
  assert.equal(await t.text('#gbName'), q.name); assert.match(await t.text('#gbWhere'), /Quick play/);
  // the slider is kept for that tile
  await tile('otter'); assert.equal((await t.page.evaluate(() => window.bloppitQP())).d, 3); await t.page.evaluate(() => document.getElementById('qpX').click());
  // Quick Bricks: a library puzzle, small and simple at Tiny, big at Super tricky
  await tile('quick'); const tiny = await slide(1); const big = await slide(5);
  const nTiny = await t.page.evaluate((name) => window.bloppitLevels.count({ name, sample: name, size: 6, shape: 'flat', thick: .5, colors: 2 }), big.name);
  const nBig = await t.page.evaluate((name) => window.bloppitLevels.count({ name, sample: name, size: 16, shape: 'puffed', thick: 1, colors: 8 }), big.name);
  assert.ok(nBig > nTiny * 2, `${big.name}: ${nTiny} → ${nBig}`); assert.ok(tiny.pool.length > 10, 'the whole library');
  await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.view(), 'view-build'); assert.equal(await t.page.evaluate(() => window.bloppitQuickPlay()), true);
  // vs Swoop: the race and Swoop's speed come with the slider
  await tile('cpu'); q = await slide(1); await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-blitz'); assert.equal(await t.page.evaluate(() => document.getElementById('bzModel').value), 'p' + q.i);
  assert.equal(await t.page.evaluate(() => document.querySelector('input[name=bzLevel]:checked').value), 'easy');
  // Pippa's Puzzles: no island choice, the puzzle starts as a mirror build (not Quick play: it still earns)
  await tile('flip'); q = await slide(2); await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.view(), 'view-build'); assert.equal(await t.text('#gbName'), q.name); assert.equal(await t.page.evaluate(() => window.bloppitQuickPlay()), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('living characters: on the island (dressed pup, the friends, tap for a reaction), the wardrobe, the build buddy as Swoop on his turn, and still drawings with ?chars3d=0', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; for (let i = 0; i < 3; i++) { const k = `m:Model${i}:${10 + i}`; builds[k] = { n: 10 + i, s: 2, t: 1e12 + i, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, wear: { head: ['beanie', 2] } })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 3, finished: 3, welcome: 1 })); } };
  let t = await open('?nosplash=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => { const c = window.bloppitChars3d().island; return c.bloppit && c.pup && c.longtail; }, null, { timeout: 90000, polling: 500 });
  const d = await t.page.evaluate(() => { const I = window.bloppitIsland3(), P = I.p3.P; return { wear: P.wear, ci: P.ci, studs: P.R.stage + 1, mode: I.b3.ctl.mode, clips: window.bloppitChars3d().island.clips, sprite: !!I.bloppitSprite }; });
  assert.deepEqual(d.wear, { head: ['beanie', 2] }); assert.equal(d.studs, 1); assert.match(d.clips[0], /^(idle|fish)$/); assert.equal(d.mode, 2);   // fishing at 11: the drawing stands idle, his 3D model plays his fish clip (rod and all) assert.equal(d.sprite, false);   // the living drawing, at rest
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
  await t.page.evaluate(() => { document.querySelector('[data-go="cpu"]').click(); document.getElementById('qpIsle').click(); }); await t.page.waitForTimeout(400);
  await t.page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value = 'Tester'; document.getElementById('bzCpuGo').click(); });
  await t.page.waitForSelector('#buildStage .go-gate .go-btn', { timeout: 20000 }); await t.page.evaluate(() => document.querySelector('#buildStage .go-btn').click());
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

test('Chapter 2: the ten mystery chapters end with the Galaxy ship; then lufu’s world opens (everyone there, the ship beached, builds on its stands) and the ship sails back and forth', { skip: skip() }, async () => {
  const done = { fn: () => { const builds = {}, log = []; for (const n of ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Moonstone Lighthouse', 'Well', 'Moon crystal', 'Galaxy ship']) { const k = `m:${n}:12`; builds[k] = { n: 12, s: 3, t: 1e12, c: 1 }; log.push(k); }
    builds['m:Here:9'] = { n: 9, s: 2, t: 1e12 + 1, c: 1, realm: 'lufu' }; log.push('m:Here:9'); builds['m:Home:9'] = { n: 9, s: 2, t: 1e12 + 2, c: 1 }; log.push('m:Home:9');
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, pick: 'treehouse', isle: 1, arrived: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1#island', { init: done });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 });
  const chapters = await t.page.evaluate(() => window.bloppitLevels.mystery().map((m) => m.name));
  assert.deepEqual(chapters, ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Moonstone Lighthouse', 'Well', 'Moon crystal', 'Galaxy ship']);
  // Bloppitopia first: lufu is not on Home Island any more (it lives in its own world), the realm button offers the voyage, the lufu build is not on the island
  let r = await t.page.evaluate(() => { const I = window.bloppitIsland3(); return { lufu: I.lufu, cast: Object.keys(I.cast), btn: document.querySelector('.is3-realm').textContent, hidden: document.querySelector('.is3-realm').hidden, models: I.shown.list.map((m) => m.key) }; });
  assert.equal(r.lufu, 0); assert.ok(!r.cast.includes('lufu')); assert.equal(r.hidden, false); assert.match(r.btn, /Sail to lufu’s world/); assert.ok(r.models.includes('m:Home:9') && !r.models.includes('m:Here:9'));
  await t.page.evaluate(() => document.querySelector('.is3-realm').click()); await t.page.waitForTimeout(1500);
  r = await t.page.evaluate(() => { const I = window.bloppitIsland3(); return { lufu: I.lufu, cast: Object.keys(I.cast).sort(), ship: !!I.world.children.find((x) => x.userData.ship), btn: document.querySelector('.is3-realm').textContent, play: document.querySelector('.is3-play').textContent, models: I.shown.list.map((m) => m.key), views: document.querySelector('.v-name').textContent, b: !!I.bloppit, p: !!I.pupG, l: !!I.longtail }; });
  assert.equal(r.lufu, 1); assert.deepEqual(r.cast, ['bibi', 'lufu', 'nora', 'pippa', 'tiny']); assert.ok(r.ship && r.b && r.p && r.l); assert.match(r.btn, /Sail to Bloppitopia/); assert.match(r.play, /Build here/); assert.deepEqual(r.models, ['m:Here:9']); assert.equal(r.views, 'lufu’s world');
  // the first time there: the welcome (Chapter 1 done, Chapter 2 being made, what to do meanwhile)
  await t.page.waitForFunction(() => document.getElementById('lufuHiDlg').open, null, { timeout: 5000 });
  assert.match(await t.text('#lhTxt'), /Chapter 1 is complete/); assert.equal(await t.page.evaluate(() => document.querySelectorAll('#lufuHiDlg [data-lh]').length), 6);
  // the whole Moonstone story, from the welcome
  await t.page.evaluate(() => document.querySelector('#lufuHiDlg [data-lh="film"]').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => document.getElementById('filmsDlg').open), true);
  assert.match(await t.page.evaluate(() => document.getElementById('filmVid').src), /moonstone-feature\.mp4/);
  await t.page.evaluate(() => document.getElementById('filmsDlg').close());
  await t.page.evaluate(() => document.querySelector('#lufuHiDlg [data-lh="stay"]').click());
  await t.page.evaluate(() => document.querySelector('.is3-realm').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().lufu), 0);
  await t.page.evaluate(() => document.querySelector('.is3-realm').click()); await t.page.waitForTimeout(2200);
  assert.equal(await t.page.evaluate(() => document.getElementById('lufuHiDlg').open), false, 'only the first time');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Moonstone Isle once reached: always night, one rowboat (plus the Galaxy ship), no red roof, the moon crystal inside the lighthouse lamp', { skip: skip() }, async () => {
  const M = [['Rowboat', 10], ['Old map', 15], ['Lookout tower', 17], ['Little bridge', 12], ['Moon gate', 14], ['Constellation cube', 9], ['Moonstone Lighthouse', 23], ['Well', 12], ['Moon crystal', 14], ['Galaxy ship', 28]];
  const seed = { arg: M, fn: (M) => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; M.forEach(([n, z], i) => { const k = `m:${n}:${z}`; builds[k] = { n: z, s: 2, t: 1e12 + i, c: 1 }; log.push(k); });
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: [], pick: 'tree' })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&hour=11&mystery=1#island', { init: seed });
  const r = await t.page.evaluate(() => { const I = window.bloppitIsland3(), T = window.THREE, g = I.isles.moonstone.g; let boats = 0, sails = 0, red = 0;
    g.traverse((x) => { if (x.isMesh && x.visible && x.geometry.type === 'CylinderGeometry' && x.geometry.parameters.radialSegments === 6 && x.geometry.parameters.height < .4) boats++;
      }); const red3 = new T.Color('#C91A09').convertSRGBToLinear().getHexString();
    I.pieces['moonstone:0'].traverse((x) => { if (x.isMesh && x.visible && x.geometry.type === 'ShapeGeometry') sails++; });
    for (const k of ['moonstone:1', 'moonstone:2']) I.pieces[k].traverse((x) => { if (x.isMesh && x.material?.color?.getHexString() === red3) red++; });
    const lamp = I.pieces['moonstone:6'].children[0].children[5], lb = new T.Box3().setFromObject(lamp), cb = new T.Box3().setFromObject(I.pieces['moonstone:8']);
    return { night: !!g.userData.night, boats, sails, red, inLamp: cb.getCenter(new T.Vector3()).y > lb.min.y && cb.getCenter(new T.Vector3()).y < lb.max.y, glass: !!lamp.material.transparent }; });
  assert.ok(r.night, 'always night there'); assert.equal(r.boats, 1, 'one rowboat'); assert.equal(r.sails, 0, 'a rowboat has no sail');
  assert.equal(r.red, 0, 'red is Bloppit\'s alone: not the map mark or the tower roof'); assert.ok(r.inLamp && r.glass, 'the moon crystal sits in the glass lamp room');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('a Moonstone chapter has the game bar like the trails: Moonstone Isle, chapter N of 10, its name and ★; the Bloppitopia tab is lit; the button goes back to the island and back again keeps the bricks placed, even after another build in between', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; [['Rowboat', 10], ['Old map', 15]].forEach(([n, z], i) => { const k = `m:${n}:${z}`; builds[k] = { n: z, s: 2, t: 1e12 + i, c: 1 }; log.push(k); });
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: [] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0&mystery=1#island', { init: seed });
  await t.page.evaluate(() => window.bloppitNext.chapter(2)); await t.page.waitForTimeout(1500);
  const r = await t.page.evaluate(() => ({ bar: !document.getElementById('gameBar').hidden, txt: document.getElementById('gameBar').innerText.replace(/\s+/g, ' '), tab: document.querySelector('.tab[aria-selected="true"]')?.dataset.tab }));
  assert.ok(r.bar, 'the game bar shows'); assert.match(r.txt, /Moonstone Isle/); assert.match(r.txt, /Chapter 3 of 10/i); assert.match(r.txt, /The Lookout Tower/); assert.match(r.txt, /With Swoop/); assert.equal(r.tab, 'island');
  for (let i = 0; i < 3; i++) { await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(700); }
  const before = await t.page.evaluate(() => window.bloppitPlacedBoxes().length); assert.ok(before >= 3, `placed ${before}`);
  await t.page.evaluate(() => document.getElementById('gbMap').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-island').hidden), false, 'back on the island');
  // and back to the chapter: the bricks already placed are still there (it doesn't start over)
  await t.page.evaluate(() => window.bloppitNext.chapter(2)); await t.page.waitForTimeout(1200);
  assert.equal(await t.view(), 'view-build'); assert.equal(await t.page.evaluate(() => window.bloppitPlacedBoxes().length), before);
  // and after building something else in between (a Frog Trail level, Just Play): the chapter's own save brings its bricks back
  await t.page.evaluate(() => { window.bloppitHome(); document.querySelector('#view-home [data-go="otter"]').click(); }); await t.page.waitForTimeout(600);
  await t.page.evaluate(() => document.getElementById('qpQuick').click()); await t.page.waitForTimeout(1500);
  await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(800);
  assert.notEqual(await t.page.evaluate(() => document.querySelector('#gameBar strong')?.textContent), 'Moonstone Isle', 'another build is on the table');
  await t.page.evaluate(() => window.bloppitNext.chapter(2)); await t.page.waitForTimeout(2500);
  assert.equal(await t.view(), 'view-build'); assert.equal(await t.page.evaluate(() => window.bloppitPlacedBoxes().length), before, 'the chapter carries on');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the next Moonstone chapter goes by the island first: the last chapter’s piece (and film) rises, then the chapter starts; the finish line says "Next chapter: the moon gate"', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = []; [['Rowboat', 10], ['Old map', 15], ['Lookout tower', 17], ['Little bridge', 12]].forEach(([n, z], i) => { const k = `m:${n}:${z}`; builds[k] = { n: z, s: 2, t: 1e12 + i, c: 1 }; log.push(k); });
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: [] })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0&mystery=1#build', { init: seed });
  await t.page.evaluate(() => { const s = window.bloppitNext.unlocked().filter((i) => i !== 'moonstone:3'); localStorage.setItem('bloppit-seen3-v1', JSON.stringify(s)); });
  assert.ok((await t.page.evaluate(() => window.bloppitNext.goals())).includes('Next chapter: The Moon Gate'));
  assert.ok((await t.page.evaluate(() => window.bloppitNext.titles())).includes('🌙 Moonstone Isle, Chapter 5: The Moon Gate'));
  await t.page.evaluate(() => window.bloppitNext.via(4)); await t.page.waitForTimeout(600);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-island').hidden), false, 'the island first');
  await t.page.waitForFunction(() => /Chapter 5 of 10/i.test(document.getElementById('gameBar').innerText) && !document.getElementById('gameBar').hidden, null, { timeout: 30000 });
  assert.ok(await t.page.evaluate(() => window.bloppitNext.seen().includes('moonstone:3')), 'the little bridge was revealed');
  // Nothing left to reveal: straight to the chapter
  await t.page.evaluate(() => window.bloppitNext.via(5)); await t.page.waitForTimeout(800);
  assert.match(await t.page.evaluate(() => document.getElementById('gameBar').innerText), /Chapter 6 of 10/i);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Mystery Island label: "N islands to go!" and a bar that counts every piece built on the five islands', { skip: skip() }, async () => {
  // Frog Forest complete (15 of 15) and 6 Brain Trail levels: 1 island done, 21 of 81 steps (15 + 15 + 15 Pippa + 20 races + 16)
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const k = 'm:Cottage:12';
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 200, bonus: 0, builds: { [k]: { n: 12, s: 2, t: 1e12, c: 1, k: 'welcome' } }, log: [k], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: ['frog-arrival', 'frog-complete', 'brainpeak-arrival', 'brainpeak-complete'] }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 1, finished: 1, welcome: 1 }));
    const best = {}, bbest = {}; for (let i = 0; i < 15; i++) best[i] = 3; for (let i = 0; i < 6; i++) bbest[i] = 2; best[40] = 3;   // (an old level that no longer exists doesn't count)
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best, bbest }));
    localStorage.setItem('bloppit-seen3-v1', JSON.stringify(['home:home1', 'isle:otterwood', 'isle:brainpeak', 'done:otterwood', ...Array.from({ length: 15 }, (_, i) => 'otterwood:' + i), ...Array.from({ length: 6 }, (_, i) => 'brainpeak:' + i)])); } };
  const t = await open('?nosplash=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => !!document.querySelector('.is3-myst'), null, { timeout: 30000 });
  const m = await t.page.evaluate(() => { const l = document.querySelector('.is3-myst'); return { sub: l.querySelector('small').textContent, now: +l.querySelector('[role=progressbar]').getAttribute('aria-valuenow') }; });
  assert.equal(m.sub, '4 islands to go!'); assert.equal(m.now, Math.round(100 * 21 / 81));
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Solo: Pippa’s Puzzles on the menu are her own mirror set, all open in any order; Flipper Beach keeps its tide', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0&films=0');
  const L = await t.page.evaluate(() => ({ flip: window.bloppitLevels.flip.map((l) => l.sample), sea: window.bloppitLevels.sea.map((l) => l.sample) }));
  assert.equal(L.flip.length, 12); assert.deepEqual(L.flip.filter((n) => L.sea.includes(n)), [], 'none of Flipper Beach’s puzzles');
  assert.match(await t.text('#hmSeaSub'), /12 mirror puzzles/); assert.doesNotMatch(await t.text('#hmSeaSub'), /%/);
  await t.page.evaluate(() => document.querySelector('#view-home [data-go="flip"]').click()); await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => document.getElementById('qpDlg').open), true, 'the difficulty choice first');
  assert.equal(await t.page.evaluate(() => getComputedStyle(document.getElementById('qpIsle')).display), 'none', 'no island behind it');
  await t.page.evaluate(() => document.getElementById('qpPick').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.page.evaluate(() => document.getElementById('view-game').dataset.sub), 'flip');
  assert.match(await t.text('#gmTitle'), /Mirror Puzzles/); assert.doesNotMatch(await t.text('#gmLevels'), /ashore/);
  assert.equal(await t.page.evaluate(() => document.querySelector('#gmLevels .lvl[data-i="0"]').disabled), false, 'the first is open with nothing built');
  assert.equal(await t.page.evaluate(() => [...document.querySelectorAll('#gmLevels .lvl')].filter((b) => b.disabled).length), 0, 'any of them, in any order');
  assert.equal(await t.page.evaluate(() => getComputedStyle(document.getElementById('bottleCard')).display), 'none');
  // every one is a true mirror build
  const sym = await t.page.evaluate(() => window.bloppitLevels.flip.map((L, i) => { window.bloppitLevel('flip', i); const M = window.bloppitMirror(); if (!M) return `${L.name}: not a mirror build`;
    const set = new Set(M.bricks.map((b) => b.join(','))); return M.bricks.some(([x, y, z, sx, sz, c]) => !set.has([M.W - x - sx, y, z, sx, sz, c].join(','))) ? `${L.name}: bricks without a twin` : ''; }));
  assert.deepEqual(sym.filter(Boolean), []);
  // build the first: it counts on the menu, opens the second, and Flipper Beach doesn't grow
  await t.page.evaluate(() => window.bloppitLevel('flip', 0)); await t.page.waitForTimeout(300);
  for (let i = 0; i < 300; i++) { const M = await t.page.evaluate(() => window.bloppitMirror()); if (!M || M.cur >= M.steps.length) break; if (M.steps[M.cur] === 'K') await t.page.evaluate(() => window.bloppitPlaceRight()); await t.page.waitForTimeout(150); }
  await t.page.waitForFunction(() => document.getElementById('winDlg').open, null, { timeout: 30000 });
  assert.match(await t.text('#winBest'), /Mirror Puzzles/); assert.match(await t.text('#winNext'), /Level 2: Headphones/);
  const g = await t.page.evaluate(() => JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('building-blox-game-v1'))[1]));
  assert.equal(Object.keys(g.fbest || {}).length, 1); assert.equal(Object.keys(g.sbest || {}).length, 0, 'Flipper Beach is untouched');
  await t.page.evaluate(() => { document.getElementById('winDlg').close(); document.getElementById('brandLink').click(); }); await t.page.waitForTimeout(800);
  assert.match(await t.text('#hmSeaSub'), /1 of 12 puzzles built/);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Pippa’s tab: her puzzles and a message in a bottle once a day (+5 XP); the Weekly is Bibi’s, under Quick Bricks', { skip: skip() }, async () => {
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
  // Bibi's Weekly is on Quick Bricks too, and the Weekly page lights up the Brickyard Cove tab
  await t.page.evaluate(() => document.getElementById('tab-cove').click()); await t.page.waitForTimeout(500);
  assert.match(await t.text('#qbWeekly'), /Bibi’s Weekly Bloppit/);
  await t.page.evaluate(() => document.getElementById('qbWeekly').click()); await t.page.waitForTimeout(800);
  assert.equal(await t.view(), 'view-daily'); assert.equal(await t.page.evaluate(() => document.querySelector('.tab[aria-selected="true"]').id), 'tab-cove');
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

test('the Galaxy shop: sections from little touches to showpieces; an island\'s set opens once it is found; a bigger piece finds open ground', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&films=0&lite3d=1&hour=11#island', { init: { fn: () => { const builds = {}, log = []; for (let i = 0; i < 30; i++) { const k = `m:M${i}:10`; builds[k] = { n: 30, s: 3, t: 1e12 + i, c: 1 }; log.push(k); } const ob = {}; for (let i = 0; i < 3; i++) ob[i] = 3;
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: ob, sbest: {} }));
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 500, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, pick: 'lighthouse', isle: 1, arrived: 1 })); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } } });
  await t.page.waitForFunction(() => window.bloppitIsland3 && window.bloppitIsland3().ctl, null, { timeout: 90000 }); await t.page.waitForTimeout(1500);
  await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
  await t.page.evaluate(() => document.getElementById('isCustom').click()); await t.page.waitForTimeout(500);
  const heads = await t.page.evaluate(() => [...document.querySelectorAll('#decorGrid .dg-h')].map((h) => h.firstChild.textContent));
  assert.ok(heads.includes('Little touches') && heads.includes('Bigger builds') && heads.includes('Showpieces') && heads.some((h) => /From Frog Forest/.test(h)), heads.join(','));
  // Frog Forest is found (Frog Trail levels done), Blitz Bay isn't
  assert.equal(await t.page.evaluate(() => document.querySelector('[data-decor="frogstatue"]').disabled), false);
  assert.equal(await t.page.evaluate(() => document.querySelector('[data-decor="finish"]').dataset.locked), '1');
  assert.match(await t.text('[data-decor="finish"] .cost'), /Find Blitz Bay/);
  await t.page.evaluate(() => { const b = document.querySelector('[data-decor="windmill"]'); b.click(); b.click(); }); await t.page.waitForTimeout(1500);
  const w = await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')));
  assert.ok(w.decor.includes('windmill')); assert.ok(Array.isArray((w.pos || {})['decor:windmill']), 'it got a spot of its own');
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


test('launch screen: the boys say "Bloppit" as Bloppit winks, and not when the sound is off', { skip: skip() }, async () => {
  for (const off of [false, true]) {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    if (off) await page.addInitScript(() => localStorage.setItem('bloppit-sound', 'off'));
    await page.goto(BASE + '?lite3d=1&films=0', { waitUntil: 'load' }); await page.waitForTimeout(150);
    const r = await page.evaluate(() => window.bloppitWinkSound && window.bloppitWinkSound());
    assert.ok(r, 'the launch screen showed');
    if (off) assert.equal(r.src, null); else assert.match(r.src, /\/sound\/bloppit\.m4a\?v=2$/);
    const res = off ? null : await page.request.get(`http://localhost:${PORT}/sound/bloppit.m4a`);
    if (res) assert.equal(res.status(), 200);
    await ctx.close();
  }
});

test('?rewind=moonstone takes a finished world back to Chapter 7 (the Lighthouse): chapters 1–6 and other builds stay; the later chapters, their films, the ring and lufu’s world go; the link runs once', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [];
    for (const n of ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Lantern', 'Moonstone Lighthouse', 'Moon crystal', 'Galaxy ship', 'Home']) { const k = `m:${n}:12`; builds[k] = { n: 12, s: 2, t: 1e12, c: 1 }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, films: ['moon-12', 'moon-17', 'moon-18', 'moon-19', 'ring', 'moon-20', 'moon-21', 'moon-22'] }));
    localStorage.setItem('bloppit-realm', 'lufu'); localStorage.setItem('bloppit-lufu-hi', '1'); localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0&rewind=moonstone#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 });
  const r = await t.page.evaluate(() => { const o = JSON.parse(localStorage.getItem('bloppit-world-v1'));
    return { builds: Object.keys(o.builds).map((k) => k.split(':')[1]), films: o.films, realm: localStorage.getItem('bloppit-realm'), hi: localStorage.getItem('bloppit-lufu-hi'), url: location.search, note: window.bloppitRewindNote, seen: window.bloppitNext.seen() }; });
  assert.deepEqual(r.builds, ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Home']);
  assert.deepEqual(r.films, ['moon-12', 'moon-17']); assert.equal(r.realm, null); assert.equal(r.hi, null);
  assert.ok(!/rewind/.test(r.url), 'the link takes itself out of the address bar'); assert.match(r.note, /back to Chapter 7, The Moonstone Lighthouse \(4 builds/);
  assert.ok(!(r.seen || []).some((id) => /^moonstone:[6-9]$/.test(id)), 'the later pieces will rise again');
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().lufu), 0, 'back in Bloppitopia');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('the last build: Moonstone complete, the Moonstone crown, then The End; sailing from The End to lufu’s world brings nothing up over the voyage', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [], add = (k, b) => { builds[k] = { n: 12, s: 2, t: 1e12 + log.length, c: 1, ...b }; log.push(k); };
    for (const n of ['Rowboat', 'Old map', 'Lookout tower', 'Little bridge', 'Moon gate', 'Constellation cube', 'Moonstone Lighthouse', 'Well', 'Moon crystal']) add(`m:${n}:12`, {});
    for (let i = 0; i < 16; i++) add(`b:${i}`, { k: 'blitz', boss: i === 15 });
    for (let i = 0; i < 15; i++) add(`p:${i}`, {});
    const lv = (n) => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]));
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: lv(40), bbest: lv(40), sbest: lv(40) }));
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 30, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'tree', films: [] }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 }); await t.page.waitForTimeout(3000);
  // the last chapter is built
  await t.page.evaluate(() => { const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); o.builds['m:Galaxy ship:28'] = { n: 28, s: 3, t: 2e12, c: 1 }; o.log.push('m:Galaxy ship:28'); localStorage.setItem('bloppit-world-v1', JSON.stringify(o)); document.querySelectorAll('dialog[open]').forEach((d) => d.close()); });
  await t.page.reload({ waitUntil: 'load' });
  await t.page.waitForFunction(() => window.bloppitIsland3 && window.bloppitIsland3().ctl, null, { timeout: 90000 });
  // Moonstone's card, then the crown before The End
  await t.page.waitForFunction(() => document.getElementById('trialDlg').open || document.getElementById('accDlg').open, null, { timeout: 60000, polling: 200 });
  if (await t.page.evaluate(() => document.getElementById('trialDlg').open)) await t.page.evaluate(() => document.getElementById('trialDlg').close());
  await t.page.waitForFunction(() => document.getElementById('accDlg').open, null, { timeout: 20000, polling: 200 });
  assert.match(await t.text('#accTitle'), /moonstone crown/i); assert.equal(await t.page.evaluate(() => !!document.querySelector('.the-end')), false, 'The End waits for the crown');
  await t.page.evaluate(() => document.getElementById('accOn').click());
  await t.page.waitForFunction(() => document.querySelector('.the-end'), null, { timeout: 10000, polling: 200 });
  await t.page.waitForFunction(() => document.querySelector('.the-end .te-skip'), null, { timeout: 10000, polling: 200 });
  { const r = await t.page.evaluate(() => { const b = document.getElementById('isWorld').getBoundingClientRect(), top = document.querySelector('header.top'), e = document.elementFromPoint(innerWidth / 2, 8); return { top: b.top, h: b.height, vh: innerHeight, header: !!top && top.contains(e) }; });
    assert.ok(r.top <= 0 && r.h >= r.vh - 1 && !r.header, 'The End fills the screen, with no top bar over it: ' + JSON.stringify(r)); }
  await t.page.evaluate(() => document.querySelector('.the-end .te-skip').click());
  await t.page.waitForFunction(() => document.querySelector('.the-end [data-te="lufu"]'), null, { timeout: 15000, polling: 200 });
  await t.page.evaluate(() => document.querySelector('.the-end [data-te="lufu"]').click()); await t.page.waitForTimeout(2500);
  assert.equal(await t.page.evaluate(() => document.getElementById('accDlg').open || document.getElementById('trialDlg').open), false, 'nothing pops up over the voyage');
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().lufu), 1, 'in lufu’s world');
  // the Galaxy Ship's label there is a button that sails back
  await t.page.waitForFunction(() => !window.bloppitIsland3().revealing && document.querySelector('.is3-label.is3-act'), null, { timeout: 15000, polling: 200 });
  assert.match(await t.text('.is3-label.is3-act'), /Sail to Bloppitopia/);
  await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
  await t.page.evaluate(() => document.querySelector('.is3-label.is3-act').click()); await t.page.waitForTimeout(1500);
  assert.equal(await t.page.evaluate(() => window.bloppitIsland3().lufu), 0, 'back in Bloppitopia');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('lufu in 3D (approved v2): eight clips, its own controller; a feeling plays once, tints its light towards the mood colour and drifts back to idle', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&films=0');
  await t.page.waitForFunction(() => typeof window.bloppitLufu3 === 'function', null, { timeout: 30000 });
  const r = await t.page.evaluate(() => window.bloppitLufu3());
  assert.equal(r.kind, 'model'); assert.equal(r.ctl, 'Lufu3Ctl'); assert.deepEqual(r.clips, ['awe', 'blink', 'cheer', 'curiosity', 'idle', 'offer', 'reverence', 'sorrow']);
  assert.ok(r.lights >= 3, 'eyes, pendant and wisp'); assert.equal(r.mapped, 'awe', 'a drawing’s surprise is lufu’s awe');
  assert.ok(r.mid > .5, 'mid-feeling, the light has turned'); assert.equal(r.tint, r.want, 'curiosity is amber');
  assert.ok(r.after === null || r.after === 'blink'); assert.ok(r.rest); assert.ok(r.calm < .05, 'back to its own gold');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('mid-island films: every 15 builds a slot opens, and the next build on an island that has not had its mid film plays it (here the in-game moment, as films are off), then its friend speaks and the camera stays on that island; a visit it bumped comes next build', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [];
    for (let i = 0; i < 13; i++) { const k = `m:Model${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1, k: 'quick' }; log.push(k); }
    builds['t:otter:0:Heart'] = { n: 10, s: 3, t: 1e12 + 20, c: 1, k: 'trail' }; log.push('t:otter:0:Heart');
    const seen = ['half:brickworks', 'light:1', 'visit:1', 'visit:2'];
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 80, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'tree', films: ['frog-arrival', 'brainpeak-arrival', 'sunrise-arrival', 'blitzbay-arrival', 'brickworks-arrival'] }));
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: { 0: 3 }, sbest: {} }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 }); await t.page.waitForTimeout(3000);
  await t.page.evaluate(() => { const k = Object.keys(localStorage).find((x) => /seen3/.test(x)); if (k) { const s = JSON.parse(localStorage.getItem(k)); s.push('half:brickworks', 'light:1', 'visit:1', 'visit:2'); localStorage.setItem(k, JSON.stringify(s)); } });
  const add = (k) => t.page.evaluate((k) => { const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); o.builds[k] = { n: 10, s: 2, t: Date.now(), c: 1, k: k.startsWith('m:') ? 'quick' : 'trail' }; o.log.push(k); localStorage.setItem('bloppit-world-v1', JSON.stringify(o));
    const m = k.match(/^t:otter:(\d+):/); if (m) { const g = JSON.parse(localStorage.getItem('building-blox-game-v1')); g.best[m[1]] = 3; localStorage.setItem('building-blox-game-v1', JSON.stringify(g)); } }, k);
  const away = async () => { await t.page.evaluate(() => document.getElementById('tab-game').click()); await t.page.waitForTimeout(500); await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close())); await t.page.evaluate(() => document.getElementById('tab-island').click()); };
  const beat = async (re) => { let got = ''; for (let i = 0; i < 100 && !got; i++) { await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close())); const b = await t.page.evaluate(() => window.bloppitBeat()); if (b.hold && re.test(b.say + ' ' + b.banner)) got = b.say + b.banner; await t.page.waitForTimeout(300); } return got; };
  // build 15, on Frog Forest: its mid moment (Tiny), not the visit that 15 would bring
  await add('t:otter:1:Duck'); await away();
  assert.ok(await beat(/Did you see the lanterns\?/), 'Tiny’s mid-island line at build 15');
  await t.page.waitForFunction(() => !window.bloppitBeat().hold, null, { timeout: 20000 }); await t.page.waitForTimeout(1500);
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-view-name, #isWorld .is3-play')?.textContent || ''), /Frog|Trail/, 'the camera stays on Frog Forest, its next level offered');
  // build 16: the friend visit bumped from 15
  await add('m:Robot:10'); await away();
  assert.ok(await beat(/robot/i), 'the bumped visit comes the next build');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('app back button (Android): a card closes first, then a page goes to the menu, then the app goes to the background', { skip: skip() }, async () => {
  const t = await open('?nosplash=1');
  await t.page.evaluate(() => document.getElementById('tab-game').click()); await t.page.waitForTimeout(400);
  assert.equal(await t.page.evaluate(() => window.bloppitAppBack()), 'menu');
  await t.page.waitForTimeout(300);
  assert.equal(await t.page.evaluate(() => window.bloppitAppBack()), 'background');
  await t.page.evaluate(() => { const d = document.querySelector('dialog'); d.showModal(); });
  assert.equal(await t.page.evaluate(() => window.bloppitAppBack()), 'card');
  assert.equal(await t.page.evaluate(() => !!document.querySelector('dialog[open]')), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('mid-island films with films on: build 15 on Frog Forest plays its Midway film (frog-forest-mid.mp4), then Tiny speaks, and it joins My films', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [];
    for (let i = 0; i < 13; i++) { const k = `m:Model${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1, k: 'quick' }; log.push(k); }
    builds['t:otter:0:Heart'] = { n: 10, s: 3, t: 1e12 + 20, c: 1, k: 'trail' }; log.push('t:otter:0:Heart');
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 80, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'tree', films: ['frog-arrival', 'brainpeak-arrival', 'sunrise-arrival', 'blitzbay-arrival', 'brickworks-arrival'] }));
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: { 0: 3 }, sbest: {} }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=1&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 }); await t.page.waitForTimeout(3000);
  await t.page.evaluate(() => { const k = Object.keys(localStorage).find((x) => /seen3/.test(x)); if (k) { const s = JSON.parse(localStorage.getItem(k)); s.push('half:brickworks', 'light:1', 'visit:1', 'visit:2'); localStorage.setItem(k, JSON.stringify(s)); } });
  await t.page.evaluate(() => { const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); const k = 't:otter:1:Duck'; o.builds[k] = { n: 10, s: 2, t: Date.now(), c: 1, k: 'trail' }; o.log.push(k); localStorage.setItem('bloppit-world-v1', JSON.stringify(o));
    const g = JSON.parse(localStorage.getItem('building-blox-game-v1')); g.best[1] = 3; localStorage.setItem('building-blox-game-v1', JSON.stringify(g)); });
  await t.page.evaluate(() => document.getElementById('tab-game').click()); await t.page.waitForTimeout(500);
  await t.page.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); document.getElementById('tab-island').click(); });
  await t.page.waitForFunction(() => window.bloppitFilmOn() === 'frog-mid', null, { timeout: 30000, polling: 200 });
  assert.match(await t.page.evaluate(() => document.querySelector('.is3-film video').src), /\/video\/frog-forest-mid\.mp4(\?v=\w+)?$/);
  await t.page.waitForFunction(() => document.querySelector('.is3-film video').currentTime > .3, null, { timeout: 15000 });
  await t.page.evaluate(() => document.querySelector('.is3-film .cn-skip').click());
  let said = ''; for (let i = 0; i < 60 && !said; i++) { const b = await t.page.evaluate(() => window.bloppitBeat()); if (/Did you see the lanterns\?/.test(b.say)) said = b.say; await t.page.waitForTimeout(300); }
  assert.ok(said, 'Tiny’s line follows the film');
  assert.ok((await t.page.evaluate(() => JSON.parse(localStorage.getItem('bloppit-world-v1')).films)).includes('frog-mid'), 'the Midway film is in My films');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('story beats in the middle of Chapter 1: the lavender light at 10 builds, a friend visiting Home Island at 15, halfway on Frog Forest; each once, Play next held while it plays', { skip: skip() }, async () => {
  const seed = { fn: () => { if (localStorage.getItem('bloppit-world-v1')) return; const builds = {}, log = [];
    for (let i = 0; i < 9; i++) { const k = `m:Model${i}:10`; builds[k] = { n: 10, s: 2, t: 1e12 + i, c: 1, k: 'quick' }; log.push(k); }
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 50, bonus: 0, builds, log, decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'tree', films: ['frog-arrival', 'brainpeak-arrival', 'sunrise-arrival', 'blitzbay-arrival', 'brickworks-arrival'] }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 5, finished: 5, welcome: 1 })); } };
  const t = await open('?nosplash=1&films=0&hour=11#island', { init: seed });
  await t.page.waitForFunction(() => window.bloppitIsland3().ctl, null, { timeout: 90000 }); await t.page.waitForTimeout(3000);
  // Brickyard Cove is past its middle already (9 builds of 15): its halfway moment has been, so it doesn't come first here
  await t.page.evaluate(() => { const k = Object.keys(localStorage).find((x) => /seen3/.test(x)); if (k) { const s = JSON.parse(localStorage.getItem(k)); s.push('half:brickworks'); localStorage.setItem(k, JSON.stringify(s)); } });
  const add = (name, extra) => t.page.evaluate(([name, extra]) => { const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); const k = `m:${name}:10`; o.builds[k] = { n: 10, s: 2, t: Date.now(), c: 1, k: 'quick', ...extra }; o.log.push(k); localStorage.setItem('bloppit-world-v1', JSON.stringify(o)); }, [name, extra || {}]);
  const away = async () => { await t.page.evaluate(() => document.getElementById('tab-game').click()); await t.page.waitForTimeout(500); await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close())); await t.page.evaluate(() => document.getElementById('tab-island').click()); };
  const beat = async (re) => { let got = ''; for (let i = 0; i < 100 && !got; i++) { await t.page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close())); const b = await t.page.evaluate(() => window.bloppitBeat()); if (b.hold && re.test(b.say + ' ' + b.banner)) got = b.say + b.banner; await t.page.waitForTimeout(300); } return got; };
  // build 10: the light
  await add('Robot'); await away();
  const light = await beat(/Bloppit: .*lavender light/); assert.ok(light, 'the light at 10 builds');
  assert.equal(await t.page.evaluate(() => { const b = document.querySelector('.is3-play'); return !b || b.hidden; }), true, 'Play next waits');
  await t.page.waitForFunction(() => !window.bloppitBeat().hold, null, { timeout: 20000 });
  // the same visit again: nothing new
  await away(); await t.page.waitForTimeout(4000); assert.equal((await t.page.evaluate(() => window.bloppitBeat())).hold, false);
  // build 15: a friend you've met (Bibi: Brickyard Cove has builds) visits and talks about your Dinosaur
  for (let i = 11; i < 15; i++) await add('Filler' + i); await away(); await t.page.waitForTimeout(3000); await t.page.waitForFunction(() => !window.bloppitBeat().hold, null, { timeout: 20000 });
  // build 15 opens a mid-island slot, but Brickyard Cove is now complete (15 of 15), so no mid film: the visit comes instead
  await add('Dinosaur'); await away();
  const visit = await beat(/dinosaur/); assert.ok(visit, 'a friend talks about the dinosaur');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

test('Brain Trail asks the child’s age before its first level when none is set, and the maths follows it', { skip: skip() }, async () => {
  const t = await open('?nosplash=1&welcome=0');
  await t.page.evaluate(() => window.bloppitLevel('brain', 0, true)); await t.page.waitForTimeout(500);
  assert.equal(await t.page.evaluate(() => document.getElementById('ageDlg')?.open), true, 'the age question first');
  await t.page.evaluate(() => document.querySelector('#ageDlg [data-age="10"]').click()); await t.page.waitForTimeout(800);
  const r = await t.page.evaluate(() => ({ open: document.getElementById('ageDlg').open, age: JSON.parse(localStorage.getItem('bloppit-players-v1')).list[0].age, math: !!window.bloppitMath.state() }));
  assert.equal(r.open, false); assert.equal(r.age, 10); assert.ok(r.math, 'then the level starts, with its maths');
  // asked once: the next level goes straight in
  await t.page.evaluate(() => window.bloppitLevel('brain', 1, true)); await t.page.waitForTimeout(500);
  assert.equal(await t.page.evaluate(() => document.getElementById('ageDlg').open), false);
  assert.deepEqual(t.errors, []); await t.ctx.close();
});

// ---------- Together (fixes from the full Together test, 6 Nov 2026) ----------
const T_OPEN = '?nosplash=1&welcome=0&chars3d=0&island3d=0';
const tCode = (t) => t.page.evaluate(() => document.getElementById('mpBigCode')?.textContent.trim() || '');
async function tMakeRoom(t, perTurn = 5) {
  await t.page.evaluate(() => document.querySelector('.hm-tile[data-go="mp"]').click()); await t.page.waitForTimeout(600);
  await t.page.evaluate((pt) => { document.getElementById('mpName1').value = 'Host'; document.getElementById('pt' + pt)?.click(); document.getElementById('mpCreate').click(); }, perTurn);
  await t.page.waitForFunction(() => /^[A-Z0-9]{5}$/.test(document.getElementById('mpBigCode')?.textContent.trim() || ''), null, { timeout: 15000 });
  return tCode(t);
}
async function tJoin(t, code) {
  await t.page.evaluate(() => document.querySelector('.hm-tile[data-go="code"]').click()); await t.page.waitForTimeout(500);
  await t.page.fill('#mpCodeIn', code); await t.page.fill('#mpName2', 'Guest'); await t.page.evaluate(() => document.getElementById('mpJoin').click()); await t.page.waitForTimeout(1500);
}
async function tAdmitStart(host) {
  await host.page.waitForSelector('[data-admit]', { state: 'attached', timeout: 15000 });
  await host.page.waitForTimeout(500);
  assert.ok(await host.page.evaluate(() => [...document.querySelectorAll('[data-admit]')].some((x) => x.getClientRects().length > 0)), 'the host can see the knock');
  while (await host.page.evaluate(() => { const b = document.querySelector('[data-admit]:not([disabled])'); if (b) { b.click(); return true; } return false; })) await host.page.waitForTimeout(900);
  await host.page.waitForTimeout(1200); await host.page.evaluate(() => document.getElementById('mpStart').click()); await host.page.waitForTimeout(2000);
}
const tRoom = (t, code) => t.page.evaluate(async (c) => (await (await fetch('/api/room?code=' + c)).json()).state, code);
async function tPlay(players, code, blitzPer = 0) {
  for (let r = 0; r < 200; r++) { const s = await tRoom(players[0], code); if (s.finished) return s;
    const who = players[s.turn]; if (!who || s.players[s.turn].left) { await players[0].page.waitForTimeout(500); continue; }
    for (let k = 0; k < (blitzPer || s.perTurn); k++) { await who.page.evaluate(() => window.bloppitPlaceRight()); await who.page.waitForTimeout(350); }
    if (blitzPer) await who.page.evaluate(() => { const b = document.getElementById('mpEndTurn'); if (b && !b.hidden) b.click(); });
    await who.page.waitForTimeout(800); }
  return tRoom(players[0], code);
}

test('Together: a room invite link opens the join form with the code in (not the Together hub)', { skip: skip() }, async () => {
  const a = await open(T_OPEN); const code = await tMakeRoom(a);
  const b = await open(T_OPEN + '&room=' + code, { viewport: { width: 390, height: 844 }, touch: true });
  assert.equal(await b.page.inputValue('#mpCodeIn'), code);
  assert.ok(await b.page.locator('#mpName2').isVisible(), 'the name box shows'); assert.ok(await b.page.locator('#mpJoin').isVisible(), 'Join shows');
  await b.page.fill('#mpName2', 'Phone'); await b.page.evaluate(() => document.getElementById('mpJoin').click()); await b.page.waitForTimeout(1500);
  assert.ok(await b.page.locator('#mpWaitBox').isVisible(), 'knocking');
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close();
});

test('Together: Join a game takes every code: a challenge code opens the challenge; an unknown 6-letter code is tried as a crew', { skip: skip() }, async () => {
  const a = await open(T_OPEN);
  await a.page.evaluate(() => document.querySelector('.hm-tile[data-go="friend"]').click()); await a.page.waitForTimeout(600);
  await a.page.evaluate(() => { document.getElementById('bzName').value = 'Maker'; document.getElementById('bzChMake').click(); }); await a.page.waitForTimeout(1500);
  await a.page.waitForSelector('.go-btn', { timeout: 10000 }); await a.page.evaluate(() => document.querySelector('.go-btn').click()); await a.page.waitForTimeout(1000);
  for (let i = 0; i < 60 && !(await a.page.evaluate(() => { const c = document.getElementById('trCode'); return c && !c.hidden && c.textContent.trim().length === 6; })); i++) {
    await a.page.evaluate(() => { window.bloppitPlaceRight(); const b = document.getElementById('mpEndTurn'); if (b && !b.hidden) b.click(); }); await a.page.waitForTimeout(450); }
  const code = await a.page.evaluate(() => document.getElementById('trCode').textContent.trim()); assert.match(code, /^[A-Z0-9]{6}$/);
  const b = await open(T_OPEN);
  await b.page.evaluate(() => document.querySelector('.hm-tile[data-go="code"]').click()); await b.page.waitForTimeout(500);
  await b.page.fill('#mpCodeIn', code); assert.equal(await b.page.inputValue('#mpCodeIn'), code, 'all 6 letters fit');
  await b.page.evaluate(() => document.getElementById('mpJoin').click()); await b.page.waitForTimeout(3000);
  assert.match(await b.text('#chPreview'), /challenged you!/);
  await b.page.evaluate(() => window.bloppitHome()); await b.page.evaluate(() => document.querySelector('.hm-tile[data-go="code"]').click()); await b.page.waitForTimeout(500);
  await b.page.fill('#mpCodeIn', 'QQQQQ9'); await b.page.evaluate(() => document.getElementById('mpJoin').click()); await b.page.waitForTimeout(2500);
  assert.equal(await b.view(), 'view-mp'); assert.ok(await b.page.locator('#crewCard').isVisible(), 'tried as a crew code on the Crews card');
  assert.equal(await b.page.inputValue('#crewCodeIn'), 'QQQQQ9');
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close();
});

test('Together: tied scores share a medal; a host who taps Leave room is skipped and the guest plays on', { skip: skip() }, async () => {
  const a = await open(T_OPEN), b = await open(T_OPEN);
  let code = await tMakeRoom(a, 5); await tJoin(b, code); await tAdmitStart(a);
  const end = await tPlay([a, b], code); assert.equal(end.finished, true);
  await a.page.waitForTimeout(2500);
  const rows = await a.page.evaluate(() => [...document.querySelectorAll('#mpEndRows > div')].map((d) => d.textContent));
  if (end.nBricks % 10 === 0) assert.equal(rows.filter((r) => r.includes('🥇')).length, 2, 'equal points, both gold: ' + rows.join(' | '));
  await a.page.evaluate(() => document.getElementById('mpEndNew').click()); await b.page.evaluate(() => document.getElementById('mpEndNew').click()); await a.page.waitForTimeout(800);
  // a new room: the host leaves on their own turn
  code = await tMakeRoom(a, 10); await tJoin(b, code); await tAdmitStart(a);
  await a.page.evaluate(() => window.bloppitPlaceRight()); await a.page.waitForTimeout(800);
  await a.page.evaluate(() => { document.getElementById('tab-mp')?.click(); }); await a.page.waitForTimeout(600); await a.page.evaluate(() => document.getElementById('mpLeave').click()); await a.page.waitForTimeout(2000);
  const s = await tRoom(b, code); assert.equal(s.players[0].left, true); assert.equal(s.turn, 1, 'the guest’s turn straight away'); assert.equal(s.host, 1);
  await b.page.waitForFunction(() => /Your turn/.test(document.getElementById('mpTurn')?.textContent || ''), null, { timeout: 8000 });
  assert.match(await b.text('#mpPlayers'), /left/);
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close();
});

test('Together: a live race between friends: only the winner sees Race won; a late joiner is told the race has started', { skip: skip() }, async () => {
  const a = await open(T_OPEN), b = await open(T_OPEN);
  for (const t of [a, b]) { await t.page.evaluate(() => document.querySelector('.hm-tile[data-go="friend"]').click()); await t.page.waitForTimeout(600); await t.page.evaluate(() => { document.getElementById('bzName').value = 'Racer'; }); }
  await a.page.evaluate(() => document.getElementById('bzMake').click()); await a.page.waitForFunction(() => /^[A-Z0-9]{5}$/.test(document.getElementById('mpBigCode')?.textContent.trim() || ''), null, { timeout: 15000 });
  const code = await tCode(a);
  await b.page.fill('#bzCodeIn', code); await b.page.evaluate(() => document.getElementById('bzJoin').click()); await b.page.waitForTimeout(1500);
  await tAdmitStart(a);
  const late = await open(T_OPEN); await late.page.evaluate(() => document.querySelector('.hm-tile[data-go="friend"]').click()); await late.page.waitForTimeout(600);
  await late.page.evaluate((c) => { document.getElementById('bzName').value = 'Late'; document.getElementById('bzCodeIn').value = c; document.getElementById('bzJoin').click(); }, code); await late.page.waitForTimeout(2000);
  assert.match(await late.text('#mpMsg'), /already started/); assert.equal(await late.page.locator('#mpWaitBox').isVisible(), false);
  const end = await tPlay([a, b], code, 3); assert.equal(end.finished, true);
  await a.page.waitForTimeout(3000);
  const ta = await a.text('#mpEndDlg'), tb = await b.text('#mpEndDlg');
  const winnerSaw = /You win/.test(ta) ? ta : tb, loserSaw = /You win/.test(ta) ? tb : ta;
  assert.match(winnerSaw, /Race won/); assert.doesNotMatch(loserSaw, /Race won/); assert.match(loserSaw, /2nd place/);
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []); await a.ctx.close(); await b.ctx.close(); await late.ctx.close();
});

test('Together: the menu has a Crews tile that opens the Crews card; Race a friend is called that everywhere', { skip: skip() }, async () => {
  const t = await open(T_OPEN, { viewport: { width: 402, height: 874 } });
  assert.match(await t.text('.hm-tile[data-go="crew"]'), /Crews/);
  await t.page.evaluate(() => document.querySelector('.hm-tile[data-go="crew"]').click()); await t.page.waitForTimeout(1200);
  assert.equal(await t.view(), 'view-mp'); assert.ok(await t.page.locator('#crewCard').isVisible());
  await t.page.evaluate(() => window.bloppitHome()); await t.page.evaluate(() => document.querySelector('.hm-tile[data-go="friend"]').click()); await t.page.waitForTimeout(600);
  assert.match(await t.text('#bzHeadT'), /Race a friend/); assert.doesNotMatch(await t.page.evaluate(() => document.body.innerText), /vs Friend/);
  assert.equal(await t.page.getAttribute('#bzName', 'placeholder'), 'e.g. Sam');
  assert.deepEqual(t.errors, []); await t.ctx.close();
});
