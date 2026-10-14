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
