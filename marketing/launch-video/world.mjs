import { recorder } from './reclib.mjs';
// A finished world: every trail level, every race, Bibi's builds, all ten chapters
const init = () => {
  { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) {   // keep every model's shape (the game keeps the newest 40)
      if (k === 'bloppit-shapes-v1') { try { const all = JSON.parse(this.getItem('__shapes_all') || '{}'); Object.assign(all, JSON.parse(v)); v = JSON.stringify(all); set.call(this, '__shapes_all', v); } catch (e) {} }
      return set.call(this, k, v); }; }
  const lv = {}; for (let i = 0; i < 60; i++) lv[i] = 3;
  if (!localStorage.getItem('bloppit-world-v1')) {
    localStorage.setItem('building-blox-game-v1', JSON.stringify({ best: lv, bbest: lv, sbest: lv, seaV: 2 }));
    localStorage.setItem('bloppit-ev-v1', JSON.stringify({ started: 9, finished: 9, welcome: 1 }));
    localStorage.setItem('bloppit-world-v1', JSON.stringify({ xp: 900, bonus: 0, builds: {}, log: [], decor: [], pupName: 3, pupAsked: true, isle: 1, arrived: 1, pick: 'treehouse' }));
  }
  // second pass, once the game has loaded: real library models, races, chapters, and everything already "seen"
  window.__seed2 = () => { if (localStorage.getItem('__seeded')) return false; const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); const builds = {}, log = []; let t = 1e12;
    const add = (k, b) => { builds[k] = Object.assign({ n: 20, s: 3, l: 0, t: t++, c: 1 }, b); log.push(k); };
    for (const tr of ['otter', 'brain', 'sea']) window.bloppitLevels[tr].forEach((L, i) => add(`t:${tr}:${i}:${L.name}`, { k: 'trail' }));   // real models: the game knows how to rebuild these
    const mon = (k) => new Date(Date.UTC(2026, 10, 9) - k * 7 * 864e5).toISOString().slice(0, 10); let wk = 0;
    for (let i = 0; i < 34; i++) add(`w:${mon(wk++)}`, {});                       // Bibi's builds: Weeklies, which the game can rebuild as real models
    for (let i = 0; i < 20; i++) add(`w:${mon(wk++)}`, { k: 'blitz' }); add(`w:${mon(wk++)}`, { k: 'blitz', boss: true });
    for (let i = 0; i < 6; i++) add(`w:${mon(wk++)}`, { k: 'room' });
    o.builds = builds; o.log = log; o.decor = ['flag', 'bench'];
    localStorage.setItem('bloppit-world-v1', JSON.stringify(o));
    try { localStorage.setItem('bloppit-seen3-v1', JSON.stringify(window.bloppitNext.unlocked())); } catch (e) {}
    localStorage.setItem('__seeded', '1'); return true; };
};
const R = await recorder({ dsf: +(process.env.DSF || 1), every: +(process.env.EVERY || 5), out: process.env.OUT || 'x/world-draft', init, hash: '#island', settle: 9000 }); const { page } = R;
const st = () => page.evaluate(() => { const I = window.bloppitIsland3(); const o = JSON.parse(localStorage.getItem('bloppit-world-v1')); return { ok: I.ok, ctl: !!I.ctl, view: I.viewI, fly: !!I.fly, builds: Object.keys(o.builds).length, seen: (JSON.parse(localStorage.getItem('bloppit-seen3-v1') || '[]')).length, dlg: [...document.querySelectorAll('dialog[open]')].map(d => d.id), realm: localStorage.getItem('bloppit-realm'), banner: document.querySelector('#isWorld .is3-banner')?.innerText, viewId: [...document.querySelectorAll('section.view')].find(v => !v.hidden)?.id }; });
console.log(JSON.stringify(await st()));
// second pass for "seen" now that every piece exists
await page.evaluate(() => { try { localStorage.setItem('bloppit-seen3-v1', JSON.stringify(window.bloppitNext.unlocked())); } catch (e) {} });
for (let i = 0; i < 40; i++) { await R.skip(15000); const q = await page.evaluate(() => { const I = window.bloppitIsland3(); return [(I.shapeQ || []).length, Object.keys(JSON.parse(localStorage.getItem('bloppit-shapes-v1') || '{}')).length]; }); console.log('queue', q.join(' shapes ')); if (!q[0]) break; }
console.log('lufu on screen:', await page.evaluate(() => (document.querySelector('#view-island').innerText.match(/[^\n]*lufu[^\n]*/gi) || []).join(' | ')));
await R.skip(3000); console.log(JSON.stringify(await st()), JSON.stringify(await page.evaluate(()=>{ const I=window.bloppitIsland3(); return {q:(I.shapeQ||[]).length, shapes:Object.keys(JSON.parse(localStorage.getItem('bloppit-shapes-v1')||'{}')).length, play:document.querySelector('#isWorld .is3-play')?.innerText.replace(/\s+/g,' ')}; })));
for (let i = 0; i < 6; i++) { const open = await page.evaluate(() => { const d = [...document.querySelectorAll('dialog[open]')]; d.forEach((x) => { const b = x.querySelector('button.primary, button[autofocus], button'); if (b) b.click(); if (x.open) x.close(); }); return d.map((x) => x.id); }); if (!open.length) break; console.log('closed', open.join(',')); await R.skip(1500); }
// start close on Home Island, then pull back slowly to the whole world
await page.evaluate(() => window.bloppitView(1)); await R.skip(2500); console.log(JSON.stringify(await st()));
for (let i = 0; i < 3; i++) { const open = await page.evaluate(() => { const d = [...document.querySelectorAll('dialog[open]')]; d.forEach((x) => { const b = x.querySelector('button.primary, button[autofocus], button'); if (b) b.click(); if (x.open) x.close(); }); return d.length; }); if (!open) break; await R.skip(1200); }
await page.addStyleTag({ content: `#isWorld .is3-play{visibility:hidden!important}
.is3-label.is3-myst{background:none!important;box-shadow:none!important;overflow:visible!important}.is3-label.is3-myst>*{visibility:hidden!important}
.is3-label.is3-myst::before{content:'';position:absolute;left:50%;bottom:100%;width:150px;height:150px;margin:0 0 -34px -75px;border-radius:50%;
 background:radial-gradient(circle,rgba(226,200,255,.95) 0%,rgba(190,150,255,.6) 28%,rgba(160,120,255,.25) 52%,rgba(160,120,255,0) 70%);mix-blend-mode:screen;animation:mystGlow 1.5s ease-in-out infinite}
@keyframes mystGlow{0%,100%{transform:scale(.72);opacity:.5}50%{transform:scale(1.12);opacity:1}}` });
console.log('line', await page.evaluate(() => { const out = []; for (const e of document.querySelectorAll('#view-island *')) if (!e.children.length && /Mystery Island is ready/.test(e.textContent)) { out.push(e.tagName + '.' + e.className + ' in ' + e.parentElement.className); e.style.display = 'none'; } return out.join(' | '); }));
R.frame = 0; await R.run(18);
await page.evaluate(() => { window.bloppitView(0); const I = window.bloppitIsland3(); if (I.fly) I.fly.dur = 4300; });
await R.run(150); console.log(JSON.stringify(await st())); console.log('errors', R.b.errors);
await R.b.close(); process.exit(0);
