// Server logic, no network: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge, cleanData, handle as pup } from '../netlify/functions/pup/logic.mjs';
import { weekOf } from '../netlify/functions/challenge/logic.mjs';
import { handle as room } from '../netlify/functions/room/logic.mjs';
import { store, mem } from './devserver.mjs';

test('pup: only allowed fields are kept', () => {
  assert.deepEqual(cleanData({ world: { xp: 1 }, evil: 1, game: {} }), { world: { xp: 1 }, game: {} });
});
test('pup: a decoration put away stays put away; a made-up one is dropped', () => {
  const w = merge({ world: { decor: ['bench', 'kite'], away: { 'decor:bench': 1 } } }, cleanData({ world: { decor: ['bench', 'kite'], away: { 'decor:kite': 1, 'decor:castle': 1, 'm:Nope:3': 1 } } })).world;
  assert.deepEqual(w.away, { 'decor:bench': 1, 'decor:kite': 1 });
});
test('pup: putting a decoration back wins over an older copy that still has it put away', () => {
  const older = { world: { decor: ['bench', 'kite'], away: { 'decor:bench': 1700000000000, 'decor:kite': 1 } } }, newer = { world: { decor: ['bench', 'kite'], away: { 'decor:bench': -1700000005000 } } };
  for (const [a, b] of [[older, newer], [newer, older]]) { const w = merge(a, cleanData(b)).world; assert.equal(w.away['decor:bench'] > 0, false, 'back on the island'); assert.equal(w.away['decor:kite'] > 0, true, 'still away'); }
});
test('pup: world merge keeps the films watched on either device', () => {
  const w = merge({ world: { films: ['frog-arrival'] } }, cleanData({ world: { films: ['frog-arrival', 'blitzbay-arrival', 7] } })).world;
  assert.deepEqual(w.films, ['frog-arrival', 'blitzbay-arrival']);
});
test('pup: world merge keeps the days a message in a bottle was opened on either device', () => {
  const w = merge({ world: { bottles: ['2026-10-28'] } }, cleanData({ world: { bottles: ['2026-10-29', '2026-10-28', 'nope', 5] } })).world;
  assert.deepEqual(w.bottles, ['2026-10-28', '2026-10-29']);
});
test('pup: world merge keeps best stars, earliest time, union of log/decor, the name, From Memory', () => {
  const a = { world: { xp: 20, builds: { 'm:Tree:6': { n: 6, s: 2, t: 100, c: 1 }, 'm:Duck:18': { n: 18, s: 3, t: 200, c: 1, m: 1 } }, log: ['m:Tree:6', 'm:Duck:18'], decor: ['flag'], pupName: -1 } };
  const b = { world: { xp: 30, bonus: 1, builds: { 'm:Tree:6': { n: 6, s: 3, t: 90, c: 2 }, 'w:2026-10-26': { n: 48, s: 2, t: 300, c: 1 } }, log: ['m:Tree:6', 'w:2026-10-26'], decor: ['crab'], pupName: 4 } };
  const w = merge(a, cleanData(b)).world;
  assert.equal(w.xp, 30); assert.equal(w.bonus, 1);
  assert.deepEqual(w.builds['m:Tree:6'], { n: 6, s: 3, t: 90, c: 2 });
  assert.equal(w.builds['m:Duck:18'].m, 1);
  assert.deepEqual(w.log, ['m:Tree:6', 'm:Duck:18', 'w:2026-10-26']);
  assert.deepEqual(w.decor, ['flag', 'crab']); assert.equal(w.pupName, 4);
});
test('pup: ★ out of 10 (r) merge with old 3-scale builds (3→10, 2→8, 1→6), keeping the best', () => {
  const a = { world: { builds: { 'm:Tree:6': { n: 6, s: 2, t: 100, c: 1 }, 'm:Duck:18': { n: 18, s: 3, t: 200, c: 1 } }, log: ['m:Tree:6', 'm:Duck:18'] } };
  const b = { world: { builds: { 'm:Tree:6': { n: 6, s: 3, r: 10, t: 90, c: 1 }, 'm:Duck:18': { n: 18, s: 2, r: 9, t: 300, c: 1 } }, log: ['m:Tree:6', 'm:Duck:18'] } };
  const w = merge(a, cleanData(b)).world;
  assert.equal(w.builds['m:Tree:6'].r, 10);
  assert.equal(w.builds['m:Duck:18'].r, 10, 'an old perfect build (3 of 3) beats a 9 of 10');
  assert.equal(merge({ world: { builds: { k: { n: 6, s: 2 } }, log: ['k'] } }, { world: { builds: { k: { n: 6, s: 1 } }, log: ['k'] } }).world.builds.k.r, undefined, 'old builds stay old until rebuilt');
});
test('pup: a set name is never overwritten by an unset one', () => {
  assert.equal(merge({ world: { pupName: 2 } }, { world: { pupName: -1 } }).world.pupName, 2);
});
test('pup: a typed name never reaches the server; latest list name, colour and island flag kept', () => {
  const w = (x) => ({ world: { builds: {}, log: [], ...x } });
  let m = merge(w({ pupName: 2, pupAt: 100 }), w({ pupName: -1, pupText: 'Captain Fizz', pupAt: 200, pupColor: 3, isle: 1 })).world;
  assert.equal(m.pupText, undefined); assert.equal(m.pupName, 2); assert.equal(m.pupColor, 3); assert.equal(m.isle, 1); assert.equal(m.pupAt, 200);
  m = merge(w({ pupName: 2, pupAt: 100 }), w({ pupName: 4, pupAt: 200 })).world; assert.equal(m.pupName, 4);
  m = merge(w({ pupName: 4, pupAt: 300 }), w({ pupName: -1, pupAt: 400 })).world; assert.equal(m.pupName, 4);   // a later 'no name' never wipes one
  m = merge(w({ pupColor: 99 }), w({})).world; assert.equal(m.pupColor, undefined);
  m = merge(w({ pupColor: 15, pupHex: '#7a5cff', pupAt: 5 }), w({ pupColor: 2, pupAt: 1 })).world; assert.equal(m.pupColor, 15); assert.equal(m.pupHex, '#7A5CFF');
  m = merge(w({ pupColor: 15, pupHex: 'red', pupAt: 5 }), w({})).world; assert.equal(m.pupHex, undefined);
  assert.equal(JSON.stringify(merge({}, w({ pupText: 'Zoë' }))).includes('Zo'), false);
});
test('pup: Pippa’s Puzzles scores (sbest) merge like the trails, keeping the higher score', () => {
  const g = merge({ game: { best: { 0: 90 }, sbest: { 0: 100, 1: 50 } } }, cleanData({ game: { sbest: { 1: 120, 2: 80 } } })).game;
  assert.deepEqual(g.sbest, { 0: 100, 1: 120, 2: 80 }); assert.deepEqual(g.best, { 0: 90 });
});
test('pup: odd input does not throw', () => { assert.equal(merge({ world: 1 }, { world: [1] }).world.xp, 0); });
test('pup: create → save (merge) → transfer → claim', async () => {
  mem.clear();
  const c = await pup('POST', {}, { action: 'create', data: { world: { xp: 10, builds: { 'm:Tree:6': { n: 6, s: 3, t: 1, c: 1 } }, log: ['m:Tree:6'], decor: [], pupName: -1 } } }, store);
  assert.equal(c.status, 200); const id = c.body.pup; assert.match(id, /^[a-z0-9]{24}$/);
  const s = await pup('POST', { pid: id }, { action: 'save', data: { world: { xp: 20, builds: { 'm:Duck:18': { n: 18, s: 1, t: 2, c: 1 } }, log: ['m:Duck:18'], decor: [], pupName: 3 } } }, store);
  assert.equal(s.body.data.world.xp, 20); assert.equal(Object.keys(s.body.data.world.builds).length, 2);
  const t = await pup('POST', { pid: id }, { action: 'transfer' }, store); assert.match(t.body.code, /^[A-Z0-9]{8}$/);
  const k = await pup('POST', {}, { action: 'claim', code: t.body.code }, store); assert.equal(k.body.pup, id); assert.equal(k.body.data.world.pupName, 3);
  const again = await pup('POST', {}, { action: 'claim', code: t.body.code }, store); assert.notEqual(again.status, 200);
});
test('weekly: the week key is the Monday, boundary at midnight New York (Sunday night)', () => {
  assert.equal(weekOf(new Date('2026-10-14T18:00:00Z')), '2026-10-12');
  assert.equal(weekOf(new Date('2026-10-19T03:59:00Z')), '2026-10-12');   // Sunday 23:59 EDT
  assert.equal(weekOf(new Date('2026-10-19T04:01:00Z')), '2026-10-19');   // Monday 00:01 EDT
  assert.equal(weekOf(new Date('2026-11-16T04:59:00Z')), '2026-11-09');   // after the DST change, Sunday 23:59 EST
  assert.equal(weekOf(new Date('2026-11-16T05:01:00Z')), '2026-11-16');   // Monday 00:01 EST
});

import { handle as group, PHRASES } from '../netlify/functions/group/logic.mjs';
test('crew: create → join (pending) → approve → contribute → post → report ×3 mutes → parent leaves', async () => {
  mem.clear();
  const A = 'a'.repeat(24), B = 'b'.repeat(24), C = 'c'.repeat(24);
  const c = await group('POST', { pid: A }, { action: 'create', name: 2 }, store); assert.equal(c.status, 200);
  const code = c.body.group.code; assert.equal(c.body.group.name, 'Lighthouse Builders'); assert.equal(c.body.group.me.creator, true);
  const j = await group('POST', { pid: B }, { action: 'join', code }, store); assert.equal(j.body.group.pendingMe, true); assert.equal(j.body.group.me, null);
  const g1 = await group('GET', { pid: A, code }, null, store); assert.equal(g1.body.group.pending.length, 1);
  const ap = await group('POST', { pid: A }, { action: 'approve', code, k: g1.body.group.pending[0].k }, store); assert.equal(ap.body.group.members.length, 2);
  const mine = await group('GET', { pid: B, mine: 1 }, null, store); assert.equal(mine.body.groups.length, 1);
  const ct = await group('POST', { pid: B }, { action: 'contribute', code, bricks: 48 }, store); assert.equal(ct.body.group.total, 48); assert.equal(ct.body.group.pct, 2);
  const p = await group('POST', { pid: B }, { action: 'post', code, phrase: 0 }, store); assert.equal(p.body.group.posts[0].phrase, 0); assert.match(p.body.group.posts[0].label, /^[A-Z][a-z]+ [A-Z][a-z]+ \d{3}$/);
  const postId = p.body.group.posts[0].id;
  const r1 = await group('POST', { pid: A }, { action: 'report', code, post: postId }, store); assert.equal(r1.body.group.posts.length, 0);   // hidden for the reporter
  await group('POST', { pid: A }, { action: 'approve', code, k: (await (async () => { await group('POST', { pid: C }, { action: 'join', code }, store); return (await group('GET', { pid: A, code }, null, store)).body.group.pending[0].k; })()) }, store);
  await group('POST', { pid: C }, { action: 'report', code, post: postId }, store);
  const p2 = await group('POST', { pid: B }, { action: 'post', code, sticker: 1 }, store);
  await group('POST', { pid: A }, { action: 'report', code, post: p2.body.group.posts.find((x) => x.sticker === 1).id }, store);
  const muted = await group('POST', { pid: B }, { action: 'post', code, phrase: 1 }, store); assert.equal(muted.status, 403);
  const un = await group('POST', { pid: A }, { action: 'unmute', code, label: (await group('GET', { pid: A, code }, null, store)).body.group.members.find((m) => m.muted).label }, store); assert.equal(un.status, 200);
  const ok = await group('POST', { pid: B }, { action: 'post', code, phrase: 1 }, store); assert.equal(ok.status, 200);
  const lv = await group('POST', { pid: B }, { action: 'leave', code }, store); assert.equal(lv.body.group.members.length, 2);
  assert.equal((await group('GET', { pid: B, mine: 1 }, null, store)).body.groups.length, 0);
  assert.equal(PHRASES.length, 8);
});

test('crew names: three words from the lists make a crew its own name; anything else (typed text, out of range) is refused', async () => {
  mem.clear(); const A = 'd'.repeat(24);
  const c = await group('POST', { pid: A }, { action: 'create', name: [0, 1, 5] }, store); assert.equal(c.status, 200);
  assert.equal(c.body.group.name, 'Brave Puffin Patrol');
  for (const bad of ['Bad words', [0, 1], [0, 1, 99], [-1, 0, 0], ['Brave', 'Puffin', 'Patrol'], [0.5, 1, 1]]) {
    assert.equal((await group('POST', { pid: A }, { action: 'create', name: bad }, store)).status, 400, JSON.stringify(bad)); }
  assert.equal((await group('POST', { pid: A }, { action: 'create', name: 2 }, store)).body.group.name, 'Lighthouse Builders');   // an older app's pick still works
});

test('crew puzzle: suggested by default, chosen at making, fixed once started, next one after it is finished', async () => {
  mem.clear();
  const A = 'a'.repeat(24), B = 'b'.repeat(24);
  const d = await group('POST', { pid: A }, { action: 'create', name: 0 }, store); assert.equal(d.body.group.puzzle, 0);
  assert.equal((await group('POST', { pid: A }, { action: 'create', name: 0, puzzle: 9 }, store)).status, 400);
  const c = await group('POST', { pid: A }, { action: 'create', name: 1, puzzle: 2 }, store); const code = c.body.group.code; assert.equal(c.body.group.puzzle, 2);
  assert.equal((await group('POST', { pid: A }, { action: 'puzzle', code, puzzle: 3 }, store)).body.group.puzzle, 3);   // before anyone builds: free to change
  await group('POST', { pid: B }, { action: 'join', code }, store);
  const k = (await group('GET', { pid: A, code }, null, store)).body.group.pending[0].k; await group('POST', { pid: A }, { action: 'approve', code, k }, store);
  assert.equal((await group('POST', { pid: B }, { action: 'puzzle', code, puzzle: 1 }, store)).status, 403);   // only the maker
  await group('POST', { pid: B }, { action: 'contribute', code, bricks: 900 }, store);
  assert.equal((await group('POST', { pid: A }, { action: 'puzzle', code, puzzle: 1 }, store)).status, 409);   // started: finish it first
  await group('POST', { pid: A }, { action: 'contribute', code, bricks: 1300 }, store);
  const f = (await group('GET', { pid: A, code }, null, store)).body.group; assert.equal(f.pct, 100); assert.equal(f.total, 2000);
  const n = (await group('POST', { pid: A }, { action: 'puzzle', code, puzzle: 1 }, store)).body.group;
  assert.equal(n.puzzle, 1); assert.deepEqual(n.done, [3]); assert.equal(n.total, 200);   // the extra 200 bricks carry over
});

test('crew games: a Crew Quick Game shows for the crew; Pass the Puzzle goes round in turns and finishes', async () => {
  mem.clear();
  const A = 'a'.repeat(24), B = 'b'.repeat(24), C = 'c'.repeat(24);
  const code = (await group('POST', { pid: A }, { action: 'create', name: 0 }, store)).body.group.code;
  for (const P of [B, C]) { await group('POST', { pid: P }, { action: 'join', code }, store); const k = (await group('GET', { pid: A, code }, null, store)).body.group.pending[0].k; await group('POST', { pid: A }, { action: 'approve', code, k }, store); }
  // Crew Quick Game
  assert.equal((await group('POST', { pid: B }, { action: 'live', code, room: 'ab12c' }, store)).status, 200);
  const seen = (await group('GET', { pid: C, code }, null, store)).body.group.live; assert.equal(seen.room, 'AB12C'); assert.equal(seen.me, false);
  await group('POST', { pid: B }, { action: 'live-end', code }, store); assert.equal((await group('GET', { pid: C, code }, null, store)).body.group.live, null);
  // Pass the Puzzle: 9 pages, 3 in the crew → 3 pages each
  const model = { name: 'Boat', S: {}, photos: [{ name: 'Boat', view: 'front', png: 'data:image/png;base64,AAAA' }] };
  const mv = (n) => Array.from({ length: n }, (_, i) => ({ b: i, x: i, z: 0 }));
  const s = await group('POST', { pid: A }, { action: 'pass-start', code, title: 'Boat', nBricks: 30, steps: 9, to: 3, moves: mv(3), model }, store);
  assert.equal(s.status, 200); const p0 = s.body.group.pass; assert.equal(p0.chunk, 3); assert.equal(p0.page, 3); assert.equal(p0.byMe, true); assert.equal(p0.myTurn, false);
  assert.equal((await group('POST', { pid: A }, { action: 'pass-start', code, title: 'X', nBricks: 30, steps: 9, to: 3, moves: mv(3), model }, store)).status, 409);   // one at a time
  const pb = (await group('GET', { pid: B, code }, null, store)).body.group.pass; assert.equal(pb.myTurn, true);
  assert.equal((await group('POST', { pid: C }, { action: 'pass-turn', code, id: pb.id, to: 6, moves: mv(3) }, store)).status, 409);   // not C's turn
  const g = await group('GET', { pid: B, code, pass: 1 }, null, store); assert.equal(g.body.moves.length, 3); assert.equal(g.body.model.name, 'Boat');
  assert.equal((await group('POST', { pid: B }, { action: 'pass-turn', code, id: pb.id, to: 6, moves: mv(3) }, store)).body.group.pass.page, 6);
  const end = (await group('POST', { pid: C }, { action: 'pass-turn', code, id: pb.id, to: 9, moves: mv(3) }, store)).body.group.pass;
  assert.equal(end.done, true); assert.equal(end.history.length, 3); assert.equal(end.history[2].me, true);
});

import { handle as challenge } from '../netlify/functions/challenge/logic.mjs';
test('weekly board: entries only with the switch, generated names, clean first then stars, me flagged', async () => {
  mem.clear();
  const week = weekOf(Date.now()), A = 'a'.repeat(24), B = 'b'.repeat(24);
  await challenge('POST', {}, { action: 'weekly', week, ms: 60000, miss: 2, hint: 0, nBricks: 20 }, store);                       // no switch: counted, not listed
  await challenge('POST', { pid: A }, { action: 'weekly', week, ms: 60000, miss: 1, hint: 0, nBricks: 20, board: true, stars: 2 }, store);
  const r = await challenge('POST', { pid: B }, { action: 'weekly', week, ms: 90000, miss: 0, hint: 0, nBricks: 20, board: true, stars: 3 }, store);
  assert.equal(r.body.n, 3); assert.equal(r.body.board.length, 2); assert.equal(r.body.board[0].me, true); assert.equal(r.body.board[0].clean, true); assert.equal(r.body.board[1].stars, 2);
  const g = await challenge('GET', { weekly: week, board: '1', pid: A }, null, store); assert.equal(g.body.board[1].me, true); assert.match(g.body.board[0].name, /^[A-Z][a-z]+ [A-Z][a-z]+ \d{3}$/);
  const plain = await challenge('GET', { weekly: week }, null, store); assert.equal(plain.body.board, undefined);
});
test('weekly board: ratings out of 10 (scale:10) rank with old out-of-3 entries, and both scales come back', async () => {
  mem.clear();
  const week = weekOf(Date.now()), A = 'a'.repeat(24), B = 'b'.repeat(24), C = 'c'.repeat(24);
  await challenge('POST', { pid: A }, { action: 'weekly', week, ms: 60000, miss: 1, hint: 0, nBricks: 20, board: true, stars: 2 }, store);              // app 1.1: 2 of 3 = 8 of 10
  await challenge('POST', { pid: B }, { action: 'weekly', week, ms: 60000, miss: 1, hint: 0, nBricks: 20, board: true, stars: 9, scale: 10 }, store);
  const r = await challenge('POST', { pid: C }, { action: 'weekly', week, ms: 60000, miss: 3, hint: 0, nBricks: 20, board: true, stars: 7, scale: 10 }, store);
  assert.deepEqual(r.body.board.map((e) => e.rating), [9, 8, 7]);
  assert.deepEqual(r.body.board.map((e) => e.stars), [2, 2, 2], 'app 1.1 still gets stars out of 3');
});

test('family key: create → attach two pups → list → restore → delete one', async () => {
  mem.clear();
  const p1 = (await pup('POST', {}, { action: 'create', data: { world: { xp: 10, builds: { 'm:A:6': { n: 6, s: 3, t: 1, c: 1 } }, log: ['m:A:6'], decor: [], pupName: 2 } } }, store)).body.pup;
  const p2 = (await pup('POST', {}, { action: 'create', data: {} }, store)).body.pup;
  const k = (await pup('POST', {}, { action: 'family-create' }, store)).body.key; assert.match(k, /^[A-Z0-9]{12}$/);
  assert.equal((await pup('POST', { pid: p1 }, { action: 'family-attach', key: k }, store)).body.n, 1);
  assert.equal((await pup('POST', { pid: p2 }, { action: 'family-attach', key: k }, store)).body.n, 2);
  const l = await pup('POST', {}, { action: 'family-list', key: k }, store); assert.equal(l.body.pups.length, 2); assert.equal(l.body.pups[0].builds, 1); assert.equal(l.body.pups[0].pupName, 2);
  const r = await pup('POST', {}, { action: 'family-restore', key: k, pup: p1 }, store); assert.equal(r.body.data.world.xp, 10);
  assert.equal((await pup('POST', {}, { action: 'family-delete', key: k, pup: p2 }, store)).body.ok, true);
  assert.equal((await pup('POST', {}, { action: 'family-list', key: k }, store)).body.pups.length, 1);
  assert.equal((await pup('POST', {}, { action: 'family-list', key: 'NOPE' }, store)).status, 404);
});

import { handle as event } from '../netlify/functions/event/logic.mjs';
test('events: counts only, split by country and by app or website; reading needs the key', async () => {
  const st = (() => { const m = new Map(); return { async get(k) { return m.has(k) ? { data: JSON.parse(m.get(k)), etag: 'x' } : null; }, async set(k, d) { m.set(k, JSON.stringify(d)); return { modified: true }; } }; })();
  await event('POST', {}, { events: ['open_day', 'first_open'], p: 'app' }, st, { country: 'BM' });
  await event('POST', {}, { events: ['open_day', 'Bad Name!'] }, st, { country: 'US' });
  await event('POST', {}, { events: ['open_day'], p: 'spaceship' }, st, { country: 'BM' });
  assert.equal((await event('GET', {}, null, st, { key: 'nope', adminKey: 'k' })).status, 403);
  const r = await event('GET', {}, null, st, { key: 'k', adminKey: 'k' });
  assert.equal(r.body.totals.open_day, 3); assert.equal(r.body.totals.first_open, 1); assert.equal(r.body.totals['Bad Name!'], undefined);
  assert.deepEqual(r.body.byPlatform.open_day, { app: 1, web: 2 });
  const today = r.body.days[r.body.days.length - 1]; assert.deepEqual(today.c.open_day, { BM: 2, US: 1 });
});

test('pup: outfit (latest wins, only clean ids and colour numbers), the ten-build choice and the arrival are kept', () => {
  const w = (x) => ({ world: { builds: {}, log: [], ...x } });
  let m = merge(w({ wear: { neck: ['scarf', 2] }, wearAt: 100, pick: 'lighthouse' }), w({ wear: { head: ['beanie', 5], neck: ['<b>', 1], face: ['glasses', 99] }, wearAt: 200, arrived: 1, pick: 'castle' })).world;
  assert.deepEqual(m.wear, { head: ['beanie', 5] }); assert.equal(m.pick, 'lighthouse'); assert.equal(m.arrived, 1);
  m = merge(w({ wear: { neck: ['scarf', 2] }, wearAt: 300 }), w({ wear: {}, wearAt: 200 })).world; assert.deepEqual(m.wear, { neck: ['scarf', 2] });
});
test('pup: a decoration keeps where it was dragged, only if the player owns it', () => {
  const w = (x) => ({ world: { builds: {}, log: [], ...x } });
  const m = merge(w({ decor: ['bench'], pos: { 'decor:bench': [400, 520], 'decor:kite': [10, 10], 'decor:<x>': [1, 1] } }), w({ decor: ['flag'], pos: { 'decor:flag': [600, 300], 'decor:bench': [2000, 1] } })).world;
  assert.deepEqual(m.pos, { 'decor:bench': [400, 520], 'decor:flag': [600, 300] });
});
test('pup: the hardest longtail beaten on a Blitz build is kept', () => {
  const w = (lv) => ({ world: { builds: { 'm:Car:20': { n: 20, s: 1, k: 'blitz', t: 5, c: 1, lv } }, log: ['m:Car:20'] } });
  assert.equal(merge(w(2), w(0)).world.builds['m:Car:20'].lv, 2);
  assert.equal(merge(w(0), w(1)).world.builds['m:Car:20'].lv, 1);
});

// Rooms: a room with a host and players let in (Build together or a live Blitz race)
async function roomWith(mode, n, perTurn = 2) {
  const model = { name: 'Test', S: {}, photos: [{ name: 'p', view: 'front', png: 'data:,' }] };
  const c = await room('POST', {}, { action: 'create', name: 'H', mode, perTurn, nBricks: 12, title: 'Test', model }, store);
  const code = c.body.code, ids = [c.body.playerId];
  for (let k = 1; k < n; k++) {
    const j = await room('POST', {}, { action: 'join', code, name: 'P' + k }, store);
    const st = await room('GET', { code, pid: ids[0] }, null, store);
    await room('POST', {}, { action: 'admit', code, playerId: ids[0], k: st.body.state.waiting[0].k }, store);
    ids.push(j.body.playerId);
  }
  return { code, ids, start: () => room('POST', {}, { action: 'start', code, playerId: ids[0] }, store),
    move: (i, b) => room('POST', {}, { action: 'move', code, playerId: ids[i], b }, store),
    leave: (i) => room('POST', {}, { action: 'leave', code, playerId: ids[i] }, store),
    state: async () => (await room('GET', { code }, null, store)).body.state };
}
test('room: Leave room tells the server; their turns are skipped and the host passes on (Build together)', async () => {
  mem.clear();
  const r = await roomWith('classic', 3, 2); await r.start();
  await r.move(0, 0); await r.move(0, 1);                       // host's turn done → player 1
  assert.equal((await r.state()).turn, 1);
  await r.leave(0);                                             // the host leaves (not on their turn)
  let s = await r.state(); assert.equal(s.players[0].left, true); assert.equal(s.host, 1, 'host passes to the next player still in');
  await r.move(1, 2); await r.move(1, 3);                       // → player 2
  await r.move(2, 4); await r.move(2, 5);                       // → skips the host, back to player 1
  assert.equal((await r.state()).turn, 1);
  await r.leave(1);                                             // leaving on your own turn passes it on
  s = await r.state(); assert.equal(s.turn, 2); assert.equal(s.host, 2);
  const rejoin = await room('POST', {}, { action: 'join', code: r.code, name: 'H', playerId: r.ids[0] }, store);
  assert.match(rejoin.body.error || '', /left this game/);
});
test('room: before the start, a leaver is simply taken out', async () => {
  mem.clear();
  const r = await roomWith('classic', 3); await r.leave(0);
  const s = await r.state(); assert.equal(s.players.length, 2); assert.equal(s.host, 0);
});
test('room: a started race takes nobody new; a race finishes when everyone still in has placed their share', async () => {
  mem.clear();
  const r = await roomWith('blitz', 3); await r.start();
  const late = await room('POST', {}, { action: 'join', code: r.code, name: 'Late' }, store);
  assert.match(late.body.error || '', /already started/); assert.equal((await r.state()).players.length, 3);
  let s = await r.state(); assert.equal(s.quota, 4);
  for (let b = 0; b < 3; b++) await r.move(0, b);                // a Blitz turn is 3 bricks → player 1
  assert.equal((await r.state()).turn, 1);
  await r.leave(1);                                             // player 1 leaves on their turn → player 2
  s = await r.state(); assert.equal(s.turn, 2); assert.equal(s.finished, false);
  for (let b = 3; b < 6; b++) await r.move(2, b);                // → back to player 0 (player 1 skipped)
  assert.equal((await r.state()).turn, 0);
  await r.move(0, 6);                                           // player 0's share (4) done → player 2
  assert.equal((await r.state()).turn, 2);
  await r.move(2, 7);                                           // player 2's share done: everyone still in is done
  s = await r.state(); assert.equal(s.finished, true, 'done without the player who left'); assert.equal(s.moves.length, 12, 'Bloppit puts in the rest');
});
test('room: a full room counts only the players still in', async () => {
  mem.clear();
  const r = await roomWith('classic', 4); await r.start(); await r.leave(3);
  const j = await room('POST', {}, { action: 'join', code: r.code, name: 'New' }, store);
  assert.equal(j.body.waiting, true);
});
