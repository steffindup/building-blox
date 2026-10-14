// The pup server: each player's progress (trail scores, Weekly Bloppit record, settings) is kept on the server
// under an anonymous pup id, so an island survives a lost iPad, a week away, or Safari clearing site storage.
//
// What a pup record holds: numbers and dates only. No name, no age, no photo, no device identifier.
// The pup id is minted here and is the only credential: it travels in the x-pup header, never in a URL.
// A transfer code moves a pup to another device once, within 72 hours, and then stops working.
//
// Kept free of Netlify imports so it can be tested locally. A store adapter must provide:
//   get(key)                      -> { data, etag } | null
//   set(key, data, { onlyIfMatch?, onlyIfNew? }) -> { modified }
//   del(key)

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I/L
export const PUP_TTL_MS = 365 * 86400_000;              // a pup not played for a year is deleted (privacy policy)
export const XFER_TTL_MS = 72 * 3600_000;               // a transfer code lasts 72 hours
const MAX_CHARS = 64_000;                               // a pup record is small: scores and dates
const ALLOWED = new Set(['game', 'daily', 'weekly', 'trail', 'bz', 'pupStage', 'stars', 'xp', 'island', 'world']);
const WORLD_BUILDS_MAX = 400;                           // distinct finished models kept per pup

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const newId = () => rand(24, ID_CHARS);
const newCode = () => rand(8, CODE_CHARS);
const cleanId = (s) => /^[a-z0-9]{24}$/.test(String(s || '')) ? String(s) : '';
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const pupKey = (id) => `pup/${id}`;
const xferKey = (c) => `xfer/${c}`;
const familyKey = (k) => `family/${k}`;
const cleanFamily = (s) => { const k = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return k.length === 12 ? k : ''; };
import { labelFor } from '../room/logic.mjs';

// Only the fields the game writes, and nothing that could carry text typed by a child.
export function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {};
  const out = {};
  for (const k of Object.keys(d)) if (ALLOWED.has(k)) out[k] = d[k];
  return out;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
// Merge a record coming from a device with the one on the server, keeping the best of each:
// trail scores keep the higher score; Daily/Weekly days are joined, keeping the earlier first time and the faster best.
export function merge(server, incoming) {
  const a = server || {}, b = incoming || {}, out = { ...a, ...b };
  for (const key of ['game']) {
    const ga = a[key] || {}, gb = b[key] || {}, g = { ...ga, ...gb };
    for (const bk of ['best', 'bbest']) {
      const x = ga[bk] || {}, y = gb[bk] || {}, m = { ...x };
      for (const lvl of Object.keys(y)) m[lvl] = Math.max(num(x[lvl]) ?? -Infinity, num(y[lvl]) ?? -Infinity);
      if (Object.keys(m).length) g[bk] = m;
    }
    if (Object.keys(g).length) out[key] = g;
  }
  for (const key of ['daily', 'weekly']) {
    const da = a[key] || {}, db = b[key] || {}, d = { ...da, ...db };
    const days = { ...(da.days || {}) };
    for (const day of Object.keys(db.days || {})) {
      const x = days[day], y = db.days[day];
      if (!x) { days[day] = y; continue; }
      const best = Math.min(num(x.best) ?? Infinity, num(y.best) ?? Infinity);
      days[day] = { ...x, ...y, best: Number.isFinite(best) ? best : (y.best ?? x.best), first: x.first ?? y.first, clean: !!(x.clean || y.clean) };
    }
    if (Object.keys(days).length) d.days = days;
    const total = Math.max(num(da.total) ?? 0, num(db.total) ?? 0, Object.values(days).filter((v) => v && v.first != null).length);
    if (total) d.total = total;
    if (Object.keys(d).length) out[key] = d;
  }
  // The world (Bloppitopia Lite): builds are joined keeping the best stars and the earliest finish; XP and bonus
  // stars take the higher count; decorations bought are joined; the pup's name (an index) is the latest set.
  if (a.world || b.world) {
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    const wa = obj(a.world), wb = obj(b.world), builds = { ...obj(wa.builds) };
    for (const k of Object.keys(obj(wb.builds))) {
      const x = builds[k], y = wb.builds[k];
      if (!y || typeof y !== 'object') continue;
      builds[k] = x ? { ...x, ...y, s: Math.max(num(x.s) ?? 0, num(y.s) ?? 0), t: Math.min(num(x.t) ?? Infinity, num(y.t) ?? Infinity), c: Math.max(num(x.c) ?? 1, num(y.c) ?? 1), ...((x.m || y.m) ? { m: 1 } : {}), ...((num(x.d) || num(y.d)) ? { d: Math.min(num(x.d) ?? Infinity, num(y.d) ?? Infinity) } : {}) } : y;
    }
    const seen = new Set(), log = [];
    for (const k of [...(wa.log || []), ...(wb.log || [])]) if (builds[k] && !seen.has(k)) { seen.add(k); log.push(k); }
    for (const k of Object.keys(builds)) if (!seen.has(k)) { seen.add(k); log.push(k); }
    const keep = log.slice(-WORLD_BUILDS_MAX), kept = {};
    for (const k of keep) kept[k] = builds[k];
    // The pup's name from the fixed list (a number) and its brick colour (a number), whichever was set last (pupAt).
    // A name the child types for the pup stays on the device: it is never stored here (numbers and dates only).
    const later = (num(wb.pupAt) ?? 0) >= (num(wa.pupAt) ?? 0) ? wb : wa, other = later === wb ? wa : wb;
    const named = (w) => ((num(w.pupName) ?? -1) >= 0) ? w : null;
    const nw = named(later) || named(other) || {};
    const pupName = num(nw.pupName) != null && num(nw.pupName) >= 0 ? num(nw.pupName) : -1;
    const pupAt = Math.max(num(wa.pupAt) ?? 0, num(wb.pupAt) ?? 0);
    const pupColor = [later.pupColor, other.pupColor].map(num).find((v) => Number.isInteger(v) && v >= 0 && v < 16) ?? -1;
    out.world = { xp: Math.max(num(wa.xp) ?? 0, num(wb.xp) ?? 0), bonus: Math.max(num(wa.bonus) ?? 0, num(wb.bonus) ?? 0), builds: kept, log: keep,
      decor: [...new Set([...(wa.decor || []), ...(wb.decor || [])].filter((d) => typeof d === 'string' && d.length <= 20))],
      free: [...new Set([...(wa.free || []), ...(wb.free || [])].filter((d) => typeof d === 'string' && d.length <= 20))],
      draw: [...new Map([...(Array.isArray(wb.draw) ? wb.draw : []), ...(Array.isArray(wa.draw) ? wa.draw : [])].filter((d) => d && typeof d.id === 'string' && typeof d.c === 'string' && d.c.length <= 2600).map((d) => [d.id, { id: d.id, c: d.c, t: num(d.t) ?? 0 }])).values()].sort((x, y) => y.t - x.t).slice(0, 12),
      // Where the child put each model on the island (x, y in the drawing), and the ones put away
      pos: Object.fromEntries(Object.entries({ ...obj(wa.pos), ...obj(wb.pos) }).filter(([k, v]) => kept[k] && Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 1000))),
      away: Object.fromEntries(Object.entries({ ...obj(wa.away), ...obj(wb.away) }).filter(([k, v]) => kept[k] && v === 1)),
      slot: Object.fromEntries(Object.entries({ ...obj(wa.slot), ...obj(wb.slot) }).filter(([k, v]) => kept[k] && Number.isInteger(v) && v >= 0 && v < 12)), pupName, pupAsked: !!(wa.pupAsked || wb.pupAsked),
      ...(pupAt ? { pupAt } : {}), ...(pupColor >= 0 ? { pupColor } : {}), ...((wa.isle || wb.isle) ? { isle: 1 } : {}) };
  }
  for (const key of ['stars', 'xp']) out[key] = Math.max(num(a[key]) ?? 0, num(b[key]) ?? 0) || undefined;
  if (out.stars === undefined) delete out.stars;
  if (out.xp === undefined) delete out.xp;
  return out;
}

async function readPup(store, id) {
  const r = await store.get(pupKey(id));
  if (!r || !r.data) return null;
  if (Date.now() - (r.data.updated || 0) > PUP_TTL_MS) return null;
  return r;
}

export async function handle(method, query, body, store) {
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    const id = cleanId(query.pid);
    if (!id) return { status: 401, body: { error: 'No pup.' } };
    const r = await readPup(store, id);
    if (!r) return { status: 404, body: { error: 'That pup was not found. It may have been deleted.' } };
    return { status: 200, body: { data: r.data.data || {}, updated: r.data.updated, ver: r.data.ver || 0 } };
  }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const a = body && body.action;
  const now = Date.now();

  // A new pup. Minted on the server so a device cannot pick its own id.
  if (a === 'create') {
    const data = cleanData(body.data);
    for (let i = 0; i < 10; i++) {
      const id = newId();
      const rec = { id, created: now, updated: now, ver: 1, data };
      const { modified } = await store.set(pupKey(id), rec, { onlyIfNew: true });
      if (modified) return { status: 200, body: { pup: id, ver: 1 } };
    }
    return { status: 500, body: { error: 'Could not make a pup. Please try again.' } };
  }

  // Bring a pup to this device with a transfer code. Works once; the code is then gone.
  if (a === 'claim') {
    const code = cleanCode(body.code);
    if (code.length !== 8) return { status: 400, body: { error: 'A transfer code has 8 letters and numbers.' } };
    const x = await store.get(xferKey(code));
    if (!x || !x.data || now > x.data.exp) return { status: 404, body: { error: 'That code was not found or has expired. Make a new one on the other device.' } };
    await store.del(xferKey(code));
    const r = await readPup(store, x.data.pup);
    if (!r) return { status: 404, body: { error: 'That pup is no longer there.' } };
    return { status: 200, body: { pup: x.data.pup, data: r.data.data || {}, ver: r.data.ver || 0 } };
  }

  // A family key: a parent's own credential (12 characters, shown once) that pups attach to, so a parent can
  // see every pup in the family from any device, bring one to a device without a transfer code, or delete one.
  // It is not a login: nothing about the parent is stored, only the list of pup ids.
  if (a === 'family-create') {
    for (let i = 0; i < 10; i++) {
      const key = rand(12, CODE_CHARS);
      const { modified } = await store.set(familyKey(key), { created: now, updated: now, pups: [] }, { onlyIfNew: true });
      if (modified) return { status: 200, body: { key } };
    }
    return { status: 500, body: { error: 'Could not make a family key. Please try again.' } };
  }
  if (a === 'family-list' || a === 'family-restore' || a === 'family-delete') {
    const key = cleanFamily(body.key), f = key && (await store.get(familyKey(key)));
    if (!f || !f.data) return { status: 404, body: { error: 'That family key was not found.' } };
    const want = cleanId(body.pup);
    if (a !== 'family-list' && !f.data.pups.includes(want)) return { status: 404, body: { error: 'That pup is not in this family.' } };
    if (a === 'family-delete') { await store.del(pupKey(want)); f.data.pups = f.data.pups.filter((p) => p !== want); f.data.updated = now; await store.set(familyKey(key), f.data, {}); return { status: 200, body: { ok: true } }; }
    if (a === 'family-restore') { const r = await readPup(store, want); if (!r) return { status: 404, body: { error: 'That pup is no longer there.' } }; return { status: 200, body: { pup: want, data: r.data.data || {}, ver: r.data.ver || 0 } }; }
    const pups = [];
    for (const pid of f.data.pups) { const r = await readPup(store, pid); if (!r) continue; const w = (r.data.data || {}).world || {}; pups.push({ pup: pid, label: labelFor(pid), builds: (w.log || []).length, pupName: Number.isInteger(w.pupName) ? w.pupName : -1, updated: r.data.updated }); }
    return { status: 200, body: { pups } };
  }

  const id = cleanId(query.pid);
  if (!id) return { status: 401, body: { error: 'No pup.' } };

  if (a === 'family-attach' || a === 'family-detach') {
    const key = cleanFamily(body.key);
    for (let i = 0; i < 6; i++) {
      const f = key && (await store.get(familyKey(key)));
      if (!f || !f.data) return { status: 404, body: { error: 'That family key was not found. Check it, or make a new one.' } };
      const r = await readPup(store, id); if (!r) return { status: 404, body: { error: 'That pup was not found.' } };
      const pups = a === 'family-attach' ? [...new Set([...f.data.pups, id])].slice(0, 12) : f.data.pups.filter((p) => p !== id);
      const { modified } = await store.set(familyKey(key), { ...f.data, pups, updated: now }, { onlyIfMatch: f.etag });
      if (modified) return { status: 200, body: { ok: true, n: pups.length } };
    }
    return { status: 409, body: { error: 'Busy. Please try again.' } };
  }

  if (a === 'save') {
    const incoming = cleanData(body.data);
    if (JSON.stringify(incoming).length > MAX_CHARS) return { status: 413, body: { error: 'That save is too big.' } };
    for (let i = 0; i < 5; i++) {
      const r = await readPup(store, id);
      if (!r) return { status: 404, body: { error: 'That pup was not found. It may have been deleted.' } };
      const data = merge(r.data.data, incoming);
      const rec = { ...r.data, updated: now, ver: (r.data.ver || 0) + 1, data };
      const { modified } = await store.set(pupKey(id), rec, { onlyIfMatch: r.etag });
      if (modified) return { status: 200, body: { data, ver: rec.ver } };
    }
    return { status: 409, body: { error: 'Busy. Please try again.' } };
  }

  // A single-use code to move this pup to another device.
  if (a === 'transfer') {
    const r = await readPup(store, id);
    if (!r) return { status: 404, body: { error: 'That pup was not found.' } };
    for (let i = 0; i < 10; i++) {
      const code = newCode();
      const { modified } = await store.set(xferKey(code), { pup: id, exp: now + XFER_TTL_MS }, { onlyIfNew: true });
      if (modified) return { status: 200, body: { code, exp: now + XFER_TTL_MS } };
    }
    return { status: 500, body: { error: 'Could not make a code. Please try again.' } };
  }

  // Delete everything the server holds about this pup.
  if (a === 'delete') {
    await store.del(pupKey(id));
    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
