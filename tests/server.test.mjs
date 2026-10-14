// Server logic, no network: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge, cleanData, handle as pup } from '../netlify/functions/pup/logic.mjs';
import { weekOf } from '../netlify/functions/challenge/logic.mjs';
import { store, mem } from './devserver.mjs';

test('pup: only allowed fields are kept', () => {
  assert.deepEqual(cleanData({ world: { xp: 1 }, evil: 1, game: {} }), { world: { xp: 1 }, game: {} });
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
test('pup: a set name is never overwritten by an unset one', () => {
  assert.equal(merge({ world: { pupName: 2 } }, { world: { pupName: -1 } }).world.pupName, 2);
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
test('weekly: the week key is the Monday, boundary at 08:00 New York', () => {
  assert.equal(weekOf(new Date('2026-10-14T18:00:00Z')), '2026-10-12');
  assert.equal(weekOf(new Date('2026-10-19T11:59:00Z')), '2026-10-12');   // Monday 07:59 EDT
  assert.equal(weekOf(new Date('2026-10-19T12:01:00Z')), '2026-10-19');   // Monday 08:01 EDT
  assert.equal(weekOf(new Date('2026-11-09T12:30:00Z')), '2026-11-02');   // after the DST change, 07:30 EST
  assert.equal(weekOf(new Date('2026-11-09T13:01:00Z')), '2026-11-09');
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
